import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// Try multiple ports for socket connection - put 5001 first since that's what your backend is using
const SOCKET_PORTS = [5001, 8008, 5002, 5003, 8000, 8001, 8002];
const BASE_URL = import.meta.env.MODE === "development" 
  ? `http://localhost:${SOCKET_PORTS[0]}` 
  : (import.meta.env.VITE_SOCKET_URL || "/"); // Use explicit socket URL for production

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  isDeletingAccount: false,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    console.log("Checking authentication status...");
    try {
      const res = await axiosInstance.get("/auth/check");
      console.log("Auth check successful:", res.data);
      set({ authUser: res.data });
      
      // Connect socket asynchronously without blocking the UI
      setTimeout(() => {
        try {
          get().connectSocket();
        } catch (error) {
          console.error("Error connecting socket:", error);
        }
      }, 0);
    } catch (error) {
      console.log("Error in checkAuth:", error);
      console.log("Response data:", error.response?.data);
      console.log("Response status:", error.response?.status);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    console.log("Signup request initiated:", data);
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      console.log("Signup successful:", res.data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      
      // Connect socket asynchronously without blocking the UI
      setTimeout(() => {
        try {
          get().connectSocket();
        } catch (error) {
          console.error("Error connecting socket:", error);
        }
      }, 0);
    } catch (error) {
      console.error("Signup error:", error);
      console.log("Response data:", error.response?.data);
      console.log("Response status:", error.response?.status);
      const errorMessage = error.response?.data?.message || "An error occurred during signup";
      toast.error(errorMessage);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    console.log("Login request initiated:", data);
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      console.log("Login successful:", res.data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      // Connect socket asynchronously without blocking the UI
      setTimeout(() => {
        try {
          get().connectSocket();
        } catch (error) {
          console.error("Error connecting socket:", error);
        }
      }, 0);
    } catch (error) {
      console.error("Login error:", error);
      console.log("Response data:", error.response?.data);
      console.log("Response status:", error.response?.status);
      console.log("Error message:", error.message);
      
      // More detailed error handling
      let errorMessage = "An error occurred during login";
      
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 400) {
          errorMessage = error.response.data.message || "Invalid credentials";
        } else if (error.response.status === 500) {
          errorMessage = error.response.data.message || "Server error. Please try again later.";
        } else {
          errorMessage = error.response.data.message || "Login failed";
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "Network error. Please check your connection.";
      } else {
        // Something else happened
        errorMessage = error.message || "Login failed";
      }
      
      toast.error(errorMessage);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    console.log("Logout request initiated");
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  deleteUser: async () => {
    set({ isDeletingAccount: true });
    try {
      await axiosInstance.delete("/user/delete");
      set({ authUser: null });
      toast.success("Account deleted successfully");
      get().disconnectSocket();
    } catch (error) {
      console.error("Delete user error:", error);
      const errorMessage = error.response?.data?.message || "Failed to delete account";
      toast.error(errorMessage);
    } finally {
      set({ isDeletingAccount: false });
    }
  },

  connectSocket: async () => {
    const { authUser, socket } = get();
    if (!authUser) {
      console.log("No auth user, skipping socket connection");
      return;
    }

    // If socket already exists and is connected, request online users
    if (socket?.connected) {
      console.log("Socket already connected, requesting online users");
      socket.emit("requestOnlineUsers");
      return;
    }

    // If there's an existing socket, disconnect it first
    if (socket) {
      console.log("Disconnecting existing socket before creating new one");
      socket.disconnect();
    }

    console.log("Creating new socket connection for user:", authUser._id);

    // Point all development connections strictly to the main backend port
    const url = import.meta.env.MODE === "development" 
      ? "http://localhost:5001" 
      : (import.meta.env.VITE_SOCKET_URL || "/");

    console.log("Creating new socket connection for user:", authUser._id, "URL:", url);

    const newSocket = io(url, {
      query: {
        userId: authUser._id,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
    });
    
    // Explicitly connect
    newSocket.connect();
    
    newSocket.on("connect", () => {
      console.log("Socket connected successfully:", newSocket.id);
      newSocket.emit("requestOnlineUsers");
    });
    
    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    set({ socket: newSocket });

    console.log("Setting up socket event listener for getOnlineUsers");
    newSocket.on("getOnlineUsers", (userIds) => {
      console.log("Received online users update:", userIds);
      set({ onlineUsers: [...userIds] });
    });
    
    // Master Message Listener - Always active, never misses a beat
    newSocket.on("newMessage", (newMessage) => {
      console.log("[Socket Master] New message received globally:", newMessage);
      // We'll import and use the ChatStore action directly
      const chatStore = window.chatStore; // Or use a direct import if possible
      if (chatStore) chatStore.handleNewMessage(newMessage);
    });
    
    // Also listen for any disconnect events
    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });
  },
  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) {
      console.log("Disconnecting socket");
      socket.disconnect();
      // Clear online users when disconnected
      set({ onlineUsers: [], socket: null });
    }
  },
}));