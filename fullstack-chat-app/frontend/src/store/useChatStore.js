import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  contacts: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isContactsLoading: false,
  invitations: [],
  unreadUsers: [], // Array of user IDs who sent messages while not selected

  // State for encryption demonstration
  isEncryptionDemoEnabled: false,
  toggleEncryptionDemo: () => set(state => ({ isEncryptionDemoEnabled: !state.isEncryptionDemoEnabled })),

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      // Use functional set to append the message to the current state
      set((state) => ({
        messages: [...state.messages, res.data]
      }));
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  // Delete message for you (only for the current user)
  deleteMessageForYou: async (messageId) => {
    const { messages } = get();
    try {
      await axiosInstance.delete(`/messages/delete-for-you/${messageId}`);
      // Remove the deleted message from the state
      set({ messages: messages.filter(message => message._id !== messageId) });
      toast.success("Message deleted for you");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete message");
    }
  },

  // Delete message for everyone (for both sender and receiver)
  deleteMessageForEveryone: async (messageId) => {
    const { messages } = get();
    try {
      await axiosInstance.delete(`/messages/delete-for-everyone/${messageId}`);
      // Remove the deleted message from the state
      set({ messages: messages.filter(message => message._id !== messageId) });
      toast.success("Message deleted for everyone");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete message");
    }
  },

  // Add delete all messages function
  deleteAllMessages: async (userId) => {
    try {
      const res = await axiosInstance.delete(`/messages/delete-all/${userId}`);
      // Clear all messages from the state
      set({ messages: [] });
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete messages");
    }
  },

  // Add contact management functions
  getContacts: async () => {
    set({ isContactsLoading: true });
    try {
      const res = await axiosInstance.get("/user/contacts");
      set({ contacts: res.data });
    } catch (error) {
      // Not showing error toast here as this might fail silently
      console.error("Failed to get contacts:", error);
    } finally {
      set({ isContactsLoading: false });
    }
  },

  addContact: async (contactId) => {
    try {
      await axiosInstance.post("/user/contacts", { contactId });
      // Refresh contacts list
      await get().getContacts();
      toast.success("Contact added successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add contact");
    }
  },

  removeContact: async (contactId) => {
    try {
      await axiosInstance.delete(`/user/contacts/${contactId}`);
      // Refresh contacts list
      await get().getContacts();
      // Also remove from users list if it's the selected user
      const { selectedUser } = get();
      if (selectedUser && selectedUser._id === contactId) {
        set({ selectedUser: null });
      }
      toast.success("Contact removed successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to remove contact");
    }
  },

  // Calling state
  calling: false,
  incomingCall: null,
  activeCall: null,

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Remove existing listener to avoid duplicates
    socket.off("newMessage");
    socket.on("newMessage", (newMessage) => {
      console.log("[useChatStore] Received 'newMessage' event:", newMessage);
      
      const { selectedUser } = get();
      if (!selectedUser) return;

      const isMessageSentFromSelectedUser = String(newMessage.senderId) === String(selectedUser._id);

      if (isMessageSentFromSelectedUser) {
        // Use functional set to ensure we never miss a message due to state timing
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      } else {
        // If we're NOT chatting with them, track them as unread
        set((state) => {
          if (!state.unreadUsers.includes(newMessage.senderId)) {
            return { unreadUsers: [...state.unreadUsers, newMessage.senderId] };
          }
          return state;
        });
        get().getUsers(); 
      }
    });

    // Add listener for message deletion for you
    socket.off("messageDeletedForYou");
    socket.on("messageDeletedForYou", ({ messageId }) => {
      set({
        messages: get().messages.filter(message => message._id !== messageId),
      });
    });

    // Add listener for message deletion for everyone
    socket.off("messageDeletedForEveryone");
    socket.on("messageDeletedForEveryone", ({ messageId }) => {
      set({
        messages: get().messages.filter(message => message._id !== messageId),
      });
    });

    // Add listener for all messages deletion
    socket.off("allMessagesDeleted");
    socket.on("allMessagesDeleted", ({ user1, user2 }) => {
      const { selectedUser, authUser } = get();
      if (
        (user1 === selectedUser._id && user2 === authUser._id) ||
        (user2 === selectedUser._id && user1 === authUser._id)
      ) {
        set({ messages: [] });
      }
    });

    // Add listener for invitations
    socket.off("invitationReceived");
    socket.on("invitationReceived", (invitationData) => {
      // Add the invitation to the invitations array
      set({
        invitations: [...get().invitations, invitationData],
      });

      // Show a toast notification
      toast.success(`You've been invited to a collaboration session!`);
    });

    // Call signaling events
    socket.off("call:incoming");
    socket.on("call:incoming", ({ from, callerInfo, type }) => {
      console.log("Incoming general call from:", from);
      set({ incomingCall: { from, callerInfo, type } });
    });

    socket.off("call:accepted");
    socket.on("call:accepted", ({ from }) => {
      console.log("General call accepted by:", from);
      set({ calling: false, activeCall: { from } });
    });

    socket.off("call:rejected");
    socket.on("call:rejected", ({ from }) => {
      console.log("General call rejected by:", from);
      set({ calling: false, incomingCall: null });
      toast.error("Call rejected");
    });

    socket.off("call:ended");
    socket.on("call:ended", ({ from }) => {
      console.log("General call ended by:", from);
      set({ activeCall: null, calling: false, incomingCall: null });
    });

    socket.off("webrtc:signal");
    socket.on("webrtc:signal", ({ from, signal }) => {
      // Handled in component
    });

    // --- Profile Update Event ---
    socket.off("userUpdated");
    socket.on("userUpdated", (updatedUser) => {
      console.log("Real-time profile update received for:", updatedUser.fullName);
      const { users, selectedUser } = get();
      
      // Update sidebar list
      const updatedUsers = users.map(u => u._id === updatedUser._id ? updatedUser : u);
      
      // Update selected user if applicable
      const isCurrentlySelected = selectedUser && selectedUser._id === updatedUser._id;
      
      set({ 
        users: updatedUsers,
        selectedUser: isCurrentlySelected ? updatedUser : selectedUser 
      });
    });
  },

  initiateCall: (to, callerInfo, type = "video") => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit("call:request", { to, callerInfo, type });
      set({ calling: true });
    }
  },

  acceptCall: (to) => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit("call:accepted", { to });
      set({ incomingCall: null, activeCall: { from: to } });
    }
  },

  rejectCall: (to) => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit("call:rejected", { to });
      set({ incomingCall: null });
    }
  },

  endCall: (to) => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit("call:ended", { to });
      set({ activeCall: null, calling: false, incomingCall: null });
    }
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("messageDeletedForYou");
    socket.off("messageDeletedForEveryone");
    socket.off("allMessagesDeleted");
    socket.off("invitationReceived");
    socket.off("call:incoming");
    socket.off("call:accepted");
    socket.off("call:rejected");
    socket.off("call:ended");
    socket.off("webrtc:signal");
    socket.off("userUpdated");
  },

  setSelectedUser: (selectedUser) => {
    // Clear unread status when a user is selected
    if (selectedUser) {
      const { unreadUsers } = get();
      set({ 
        selectedUser, 
        unreadUsers: unreadUsers.filter(id => String(id) !== String(selectedUser._id)) 
      });
    } else {
      set({ selectedUser });
    }
  },

  // Function to accept an invitation
  acceptInvitation: (invitationData) => {
    // This would typically redirect the user to the collaboration session
    // For now, we'll just remove the invitation from the list
    set({
      invitations: get().invitations.filter(inv => inv.sessionId !== invitationData.sessionId),
    });

    // In a real implementation, you would redirect to the collaboration page
    window.location.href = invitationData.shareLink;
  },

  // Function to reject an invitation
  rejectInvitation: (invitationData) => {
    set({
      invitations: get().invitations.filter(inv => inv.sessionId !== invitationData.sessionId),
    });
  },
}));