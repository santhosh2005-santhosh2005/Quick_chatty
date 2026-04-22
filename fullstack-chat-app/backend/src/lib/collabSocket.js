// Store active sessions with participant info and file trees
const sessions = new Map();
// Map user IDs to socket IDs for proper targeting
const userSocketMap = new Map();

export default function collabSocket(io) {
  // Create a namespace for collaboration
  const collabNamespace = io.of('/collab');

  // Configure CORS and connections via the global io instance logic
  // Handle connection to the collaboration namespace
  collabNamespace.on("connection", (socket) => {
    console.log("User connected to collaboration socket:", socket.id);

    // Handle authentication if needed
    socket.on("authenticate", (token) => {
      // Verify token and authenticate user
      // For now, just acknowledge
      socket.emit("authenticated");
    });

    // Store user info for each socket
    let userInfo = { id: socket.id, name: "Anonymous" };

    socket.on("join-session", (sessionId) => {
      socket.join(sessionId);
      console.log(`User ${socket.id} joined session ${sessionId}`);

      // Track session participants
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
          participants: new Map(),
          fileTree: {} // Initialize empty file tree for new sessions
        });
      }

      const session = sessions.get(sessionId);
      session.participants.set(socket.id, userInfo);

      // Send current file tree to the new user
      socket.emit("file-update", session.fileTree);

      // Send current participants to the new user
      const participantsArray = Array.from(session.participants.entries()).map(([socketId, info]) => ({
        userId: socketId,
        userInfo: info
      }));

      // Send the list of ALL components to the new user so they know who is there
      participantsArray.forEach(participant => {
        // We send 'user-joined' events to the new user for each existing participant
        // This is one way to sync the list
        socket.emit("user-joined", { userId: participant.userId, userInfo: participant.userInfo });
      });

      // Notify others in the session about the new participant with user info
      // We do NOT send this back to the sender (socket.broadcast.to w/ socket.to)
      socket.to(sessionId).emit("user-joined", { userId: socket.id, userInfo });
    });

    socket.on("user-info", ({ sessionId, userInfo: newUserInfo }) => {
      userInfo = { ...userInfo, ...newUserInfo };

      // Update user info in session
      if (sessions.has(sessionId)) {
        const session = sessions.get(sessionId);
        session.participants.set(socket.id, userInfo);
        // Map user ID to socket ID for calling
        if (newUserInfo.id) {
          userSocketMap.set(newUserInfo.id, socket.id);
        }

        // Broadcast updated user info to others in session
        socket.to(sessionId).emit("user-joined", { userId: socket.id, userInfo });
      }
    });

    socket.on("code-change", ({ sessionId, changes }) => {
      console.log(`Broadcasting code changes to session ${sessionId}:`, changes.substring(0, 50) + "...");
      socket.to(sessionId).emit("code-update", changes);
    });

    socket.on("file-change", ({ sessionId, fileTree }) => {
      console.log(`Broadcasting file changes to session ${sessionId}:`, Object.keys(fileTree).length, "files");

      // Validate fileTree structure
      if (!fileTree || typeof fileTree !== 'object') {
        console.error("Invalid fileTree received:", fileTree);
        return;
      }

      // Store the file tree in the session
      if (sessions.has(sessionId)) {
        sessions.get(sessionId).fileTree = fileTree;
      }

      // Broadcast to all participants in the session except sender
      socket.to(sessionId).emit("file-update", fileTree);

      // Also send confirmation back to sender
      socket.emit("file-update-confirmation", { success: true });
    });

    socket.on("cursor-move", ({ sessionId, cursorData }) => {
      console.log(`Broadcasting cursor move to session ${sessionId}:`, cursorData.userId);
      socket.to(sessionId).emit("cursor-update", cursorData);
    });

    socket.on("send-chat-message", ({ sessionId, message }) => {
      console.log(`Broadcasting chat message to session ${sessionId}:`, message);
      // Add session ID to message for debugging
      const messageWithSession = { ...message, sessionId };
      socket.to(sessionId).emit("chat-message", messageWithSession);
    });

    // Handle calling functionality
    socket.on("initiate-call", ({ sessionId, targetUserId, callerInfo, type }) => {
      console.log(`Call initiated from ${socket.id} to ${targetUserId} in session ${sessionId}`);
      const targetSocketId = userSocketMap.get(targetUserId);
      if (targetSocketId) {
        collabNamespace.to(targetSocketId).emit("incoming-call", {
          sessionId,
          callerId: socket.id, // we'll use socket ID as the primary ID in collab namespace
          callerInfo,
          type
        });
      }
    });

    socket.on("accept-call", ({ sessionId, callerId }) => {
      console.log(`Call accepted by ${socket.id} from ${callerId} in session ${sessionId}`);
      collabNamespace.to(callerId).emit("call-accepted", {
        sessionId,
        accepterId: socket.id
      });
      // Also notify the accepter to start WebRTC
      socket.emit("call-accepted", {
        sessionId,
        accepterId: callerId
      });
    });

    socket.on("reject-call", ({ sessionId, callerId }) => {
      console.log(`Call rejected by ${socket.id} from ${callerId} in session ${sessionId}`);
      collabNamespace.to(callerId).emit("call-rejected", {
        sessionId,
        rejecterId: socket.id
      });
    });

    socket.on("end-call", ({ sessionId, otherUserId }) => {
      console.log(`Call ended by ${socket.id} with ${otherUserId} in session ${sessionId}`);
      // Find socket ID from user ID if otherUserId is a user ID
      let targetSocketId = userSocketMap.get(otherUserId) || otherUserId;

      collabNamespace.to(targetSocketId).emit("call-ended", {
        sessionId,
        enderId: socket.id
      });
    });

    socket.on("webrtc-signal", ({ sessionId, to, signal }) => {
      // 'to' can be a socket ID or user ID
      let targetSocketId = userSocketMap.get(to) || to;

      collabNamespace.to(targetSocketId).emit("webrtc-signal", {
        sessionId,
        from: socket.id,
        signal
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected from collaboration socket:", socket.id);

      // Remove user from userSocketMap
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          break;
        }
      }

      // Remove user from all sessions they were part of
      sessions.forEach((session, sessionId) => {
        if (session.participants.has(socket.id)) {
          session.participants.delete(socket.id);
          // Notify others in the session about the disconnected participant
          collabNamespace.to(sessionId).emit("user-left", { userId: socket.id });
          console.log(`Notified others about user ${socket.id} leaving session ${sessionId}`);
        }
      });
    });

    // Handle any errors
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });
}