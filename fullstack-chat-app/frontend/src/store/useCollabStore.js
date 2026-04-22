import { create } from "zustand";
import { io } from "socket.io-client";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

// Use the VITE_API_URL from environment variables, default to http://localhost:5001
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
const RELAY_URL = import.meta.env.VITE_RELAY_URL || "ws://localhost:5002";
const USE_CRDT = import.meta.env.VITE_USE_CRDT === "true";

export const useCollabStore = create((set, get) => ({
  socket: null,
  files: {},
  activeFile: null,
  code: "",
  cursors: {},
  participants: {},
  chatMessages: [],
  installedExtensions: new Set(['prettier', 'eslint']), // Default installed

  toggleExtension: (extId) => set(state => {
    const newSet = new Set(state.installedExtensions);
    if (newSet.has(extId)) {
      newSet.delete(extId);
    } else {
      newSet.add(extId);
    }
    return { installedExtensions: newSet };
  }),

  // Call state
  calling: false,
  incomingCall: null,
  activeCall: null,

  connectionAttempts: 0,
  maxConnectionAttempts: 3,
  isConnected: false,

  // Yjs state
  ydoc: null,
  provider: null,
  awareness: null,

  connect: async (sessionId, token) => {
    if (USE_CRDT) {
      const ydoc = new Y.Doc();
      const provider = new WebsocketProvider(RELAY_URL, sessionId, ydoc, {
        params: { token },
      });
      const awareness = provider.awareness;
      set({ ydoc, provider, awareness });
      return;
    }

    // Socket.io connection logic
    // Connect to the /collab namespace
    const socket = io(`${API_URL}/collab`, {
      path: '/socket.io',
      transports: ["websocket"],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      query: { token, sessionId }
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to collab server');
      set({ socket, isConnected: true });
      // Explicitly join the session room
      socket.emit("join-session", sessionId);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      const { connectionAttempts, maxConnectionAttempts } = get();
      if (connectionAttempts < maxConnectionAttempts) {
        set({ connectionAttempts: connectionAttempts + 1 });
        console.log(`Retrying connection (${connectionAttempts + 1}/${maxConnectionAttempts})...`);
      } else {
        console.error('Max connection attempts reached');
        set({ isConnected: false });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      set({ isConnected: false });
      if (reason === 'io server disconnect') {
        // Reconnect if the server was restarted
        socket.connect();
      }
    });

    // Listen for file updates from other users
    socket.on('file-update', (fileTree) => {
      console.log("Received file update:", fileTree);
      set((state) => {
        // Deep merge the incoming tree with existing tree to support concurrent uploads
        // This is a simple merge: preserving local files if not present in incoming
        // But favoring incoming if conflict. 
        // For a true standard collab, we might want to just accept server state,
        // but user requested "both can upload".

        const deepMerge = (target, source) => {
          const output = { ...target };
          if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
              if (isObject(source[key])) {
                if (!(key in target)) {
                  Object.assign(output, { [key]: source[key] });
                } else {
                  output[key] = deepMerge(target[key], source[key]);
                }
              } else {
                Object.assign(output, { [key]: source[key] });
              }
            });
          }
          return output;
        };

        const isObject = (item) => {
          return (item && typeof item === 'object' && !Array.isArray(item));
        };

        const mergedFiles = deepMerge(state.files, fileTree);

        // Prepare new state logic for active file
        let newActiveFile = state.activeFile;
        // If active file was updated in the tree, update our ref
        // We need to find the active file in the new tree
        if (state.activeFile) {
          const findFile = (tree, id) => {
            for (const key in tree) {
              if (tree[key].id === id) return tree[key];
              if (tree[key].children) {
                const found = findFile(tree[key].children, id);
                if (found) return found;
              }
            }
            return null;
          };
          const found = findFile(mergedFiles, state.activeFile.id);
          if (found) newActiveFile = found;
        }

        return { files: mergedFiles, activeFile: newActiveFile };
      });
    });

    // Listen for code updates (for the active file)
    socket.on('code-update', (newCode) => {
      set((state) => {
        if (state.activeFile) {
          // Recursive update function
          const updateNestedFile = (tree, fileId, content) => {
            const newTree = { ...tree };
            let found = false;

            for (const key in newTree) {
              if (newTree[key].id === fileId) {
                newTree[key] = { ...newTree[key], content };
                return { tree: newTree, found: true, updatedFile: newTree[key] };
              }
              if (newTree[key].type === 'folder' && newTree[key].children) {
                const result = updateNestedFile(newTree[key].children, fileId, content);
                if (result.found) {
                  newTree[key] = { ...newTree[key], children: result.tree };
                  return { tree: newTree, found: true, updatedFile: result.updatedFile };
                }
              }
            }
            return { tree: newTree, found: false, updatedFile: null };
          };

          const result = updateNestedFile(state.files, state.activeFile.id, newCode);

          if (result.found) {
            return {
              activeFile: result.updatedFile,
              files: result.tree
            };
          }
        }
        return {};
      });
    });

    // Listen for participants joining/leaving
    socket.on('user-joined', ({ userId, userInfo }) => {
      console.log("User joined:", userId, userInfo);
      set(state => {
        // Create a new participants object and add/update the user
        const newParticipants = { ...state.participants };
        newParticipants[userId] = userInfo;
        return { participants: newParticipants };
      });
    });

    socket.on('user-left', ({ userId }) => {
      console.log("User left:", userId);
      set(state => {
        const newParticipants = { ...state.participants };
        delete newParticipants[userId];
        return { participants: newParticipants };
      });
    });

    // Listen for chat messages
    socket.on('chat-message', (msg) => {
      set(state => ({ chatMessages: [...state.chatMessages, msg] }));
    });

    // Listen for call events
    socket.on('incoming-call', ({ sessionId, callerId, callerInfo, type }) => {
      console.log("Incoming call from:", callerId, "type:", type);
      set({ incomingCall: { sessionId, callerId, callerInfo, type } });
    });

    socket.on('call-accepted', ({ sessionId, accepterId }) => {
      console.log("Call accepted by:", accepterId);
      // The store shouldn't manage WebRTC itself usually, but we need to signal it
      set({ calling: false, activeCall: { sessionId, otherUserId: accepterId } });
    });

    socket.on('call-rejected', ({ sessionId, rejecterId }) => {
      console.log("Call rejected by:", rejecterId);
      set({ calling: false, incomingCall: null });
      toast.error("Call rejected");
    });

    socket.on('call-ended', ({ sessionId, enderId }) => {
      console.log("Call ended by:", enderId);
      set({ activeCall: null, calling: false, incomingCall: null });
    });

    socket.on('webrtc-signal', ({ sessionId, from, signal }) => {
      // This is handled by the component using useWebRTC hook
      // But we can store it or emit a local event if needed
      // For now, we'll rely on the component listening to this socket directly if possible,
      // or we can add a listener in the store that triggers a callback.
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({
        socket: null,
        isConnected: false,
        connectionAttempts: 0,
        participants: {},
        files: {},
        activeFile: null,
        chatMessages: [],
        incomingCall: null,
        activeCall: null,
        calling: false
      });
    }
  },

  // Actions
  setActiveFile: (file) => set({ activeFile: file }),

  sendFileTree: (sessionId, fileTree) => {
    const { socket } = get();
    if (socket) {
      socket.emit("file-change", { sessionId, fileTree });
      set({ files: fileTree });
    }
  },

  updateFiles: (newFiles) => {
    set(state => ({ files: newFiles }));
  },

  // Merge a flat list of files (from Generator) into the nested structure
  addFilesFromGenerator: (generatedFiles) => {
    // generatedFiles: [{ path: 'src/App.jsx', content: '...' }]
    set((state) => {
      const newFiles = JSON.parse(JSON.stringify(state.files)); // Deep clone

      generatedFiles.forEach(file => {
        const parts = file.path.split('/');
        let currentLevel = newFiles;

        parts.forEach((part, index) => {
          const isFile = index === parts.length - 1;

          // Check if exists
          let existingKey = Object.keys(currentLevel).find(key => {
            // Simple check, in reality our structure is keyed by ID usually, but names are stored in values
            return currentLevel[key].name === part;
          });

          if (existingKey) {
            if (isFile) {
              // Update content
              currentLevel[existingKey].content = file.content;
            } else {
              // Go deeper
              currentLevel = currentLevel[existingKey].children;
            }
          } else {
            // Create new
            const newId = `gen-${Date.now()}-${Math.random()}`;
            if (isFile) {
              currentLevel[newId] = {
                id: newId,
                name: part,
                type: 'file',
                content: file.content
              };
            } else {
              currentLevel[newId] = {
                id: newId,
                name: part,
                type: 'folder',
                children: {}
              };
              currentLevel = currentLevel[newId].children;
            }
          }
        });
      });

      // Also trigger socket update if connected
      const { socket } = get();
      // We assume sessionId is available or handled by the socket context mostly
      // Ideally pass sessionId to this function or grab from somewhere, but for local update this is enough

      return { files: newFiles };
    });
  },

  sendCode: (sessionId, code) => {
    const { socket, activeFile, files } = get();
    if (socket && activeFile) {
      const updatedFile = { ...activeFile, content: code };
      const updatedFiles = { ...files, [activeFile.id]: updatedFile };
      set({ activeFile: updatedFile, files: updatedFiles });
      socket.emit("code-change", { sessionId, changes: code });
    }
  },

  sendUserInfo: (sessionId, userInfo) => {
    const { socket } = get();
    if (socket) socket.emit("user-info", { sessionId, userInfo });
  },

  sendChatMessage: (sessionId, message) => {
    const { socket, chatMessages } = get();
    if (socket) {
      // server expects { sessionId, message }
      socket.emit("send-chat-message", { sessionId, message });
      set({ chatMessages: [...chatMessages, message] });
    }
  },

  initiateCall: (sessionId, targetUserId, callerInfo, type = "video") => {
    const { socket } = get();
    if (socket) {
      socket.emit("initiate-call", { sessionId, targetUserId, callerInfo, type });
      set({ calling: true });
    }
  },

  acceptCall: (sessionId, callerId) => {
    const { socket } = get();
    if (socket) {
      socket.emit("accept-call", { sessionId, callerId });
      set({ incomingCall: null, activeCall: { otherUserId: callerId } });
    }
  },

  rejectCall: (sessionId, callerId) => {
    const { socket } = get();
    if (socket) {
      socket.emit("reject-call", { sessionId, callerId });
      set({ incomingCall: null });
    }
  },

  endCall: (sessionId, otherUserId) => {
    const { socket } = get();
    if (socket) {
      socket.emit("end-call", { sessionId, otherUserId });
      set({ activeCall: null, calling: false, incomingCall: null });
    }
  }
}));
