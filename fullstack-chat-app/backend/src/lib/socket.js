import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

// Create a global variable for io and userSocketMap
let io;
const userSocketMap = {}; // {userId: Set(socketId1, socketId2)}

// Function to get receiver socket IDs (returns array of socket IDs for a user)
export function getReceiverSocketIds(userId) {
  // If user is online (has at least one socket), return all their socket IDs
  return userSocketMap[userId] ? Array.from(userSocketMap[userId]) : [];
}

// Export io object
export function getIO() {
  return io;
}

// Function to initialize socket with the existing server
export function initializeSocket(server) {
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5731", "http://localhost:3000"];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    const userIdStr = userId ? userId.toString() : null;

    if (userIdStr) {
      // Add socket to the user's set of connections
      if (!userSocketMap[userIdStr]) {
        userSocketMap[userIdStr] = new Set();
      }
      userSocketMap[userIdStr].add(socket.id);
      
      // Join a room specifically for this user (using userId as room name)
      socket.join(userIdStr);
      console.log(`✅ User ${userIdStr} connected with socket ${socket.id}. Total connections: ${userSocketMap[userIdStr].size}`);
    } else {
      console.log("⚠️ User connected without userId", socket.id);
    }

    // Broadcast online users to all clients
    const onlineUsers = Object.keys(userSocketMap);
    console.log(`[Socket] Broadcasting online users: ${JSON.stringify(onlineUsers)}`);
    io.emit("getOnlineUsers", onlineUsers);

    // Listen for requestOnlineUsers event from frontend
    socket.on("requestOnlineUsers", () => {
      const currentOnline = Object.keys(userSocketMap);
      console.log(`[Socket] Manual request from ${userIdStr}. Sending: ${JSON.stringify(currentOnline)}`);
      socket.emit("getOnlineUsers", currentOnline);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected", socket.id);
      
      if (userIdStr && userSocketMap[userIdStr]) {
        userSocketMap[userIdStr].delete(socket.id);
        
        // Only if no more connections exist for this user, remove from map and emit offline
        if (userSocketMap[userIdStr].size === 0) {
          delete userSocketMap[userIdStr];
          console.log(`User ${userIdStr} is now completely offline`);
          io.emit("getOnlineUsers", Object.keys(userSocketMap));
          io.emit("userOffline", userIdStr);
        } else {
          console.log(`User ${userIdStr} disconnected one tab. Still has ${userSocketMap[userIdStr].size} active connections.`);
        }
      }
    });

    // --- WebRTC Signaling / Calling Events ---

    // 1. Request a call
    socket.on("call:request", ({ to, callerInfo, type }) => {
      const receiverSocketIds = getReceiverSocketIds(to);
      if (receiverSocketIds.length > 0) {
        console.log(`📞 Call request from ${userId} to ${to} (${receiverSocketIds.length} sockets)`);
        // Emit to the user's room (all their sockets)
        io.to(to).emit("call:incoming", {
          from: userId,
          callerInfo,
          type // 'voice' or 'video'
        });
      }
    });

    // 2. Accept a call
    socket.on("call:accepted", ({ to }) => {
      const callerSocketIds = getReceiverSocketIds(to);
      if (callerSocketIds.length > 0) {
        console.log(`✅ Call accepted by ${userId} for ${to}`);
        io.to(to).emit("call:accepted", {
          from: userId
        });
      }
    });

    // 3. Reject a call
    socket.on("call:rejected", ({ to }) => {
      const callerSocketIds = getReceiverSocketIds(to);
      if (callerSocketIds.length > 0) {
        console.log(`❌ Call rejected by ${userId} for ${to}`);
        io.to(to).emit("call:rejected", {
          from: userId
        });
      }
    });

    // 4. End a call
    socket.on("call:ended", ({ to }) => {
      const otherSocketIds = getReceiverSocketIds(to);
      if (otherSocketIds.length > 0) {
        console.log(`📴 Call ended by ${userId} with ${to}`);
        io.to(to).emit("call:ended", {
          from: userId
        });
      }
    });

    // 5. Generic WebRTC Signaling (Offer, Answer, ICE Candidates)
    socket.on("webrtc:signal", ({ to, signal }) => {
      const receiverSocketIds = getReceiverSocketIds(to);
      if (receiverSocketIds.length > 0) {
        io.to(to).emit("webrtc:signal", {
          from: userId,
          signal
        });
      }
    });
  });

  return io;
}

// Export app and server
export { app, server };