import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import collabRoutes from "./routes/collab.route.js";
import userRoutes from "./routes/user.route.js";
import { initializeSocket, app, server } from "./lib/socket.js";
import collabSocket from "./lib/collabSocket.js";
// import { collabSocketHandler } from "./services/collab/CollabSocketHandler.js";

dotenv.config();

console.log("Environment variables loaded:");
console.log("PORT:", process.env.PORT);
console.log("MONGODB_URI:", process.env.MONGODB_URI);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("REDIS_URL:", process.env.REDIS_URL ? "Configured" : "Not configured");
console.log("S3_BUCKET:", process.env.S3_BUCKET || "Not configured");

const PORT = process.env.PORT || 8008;

const __dirname = path.resolve();

// Initialize socket.io with the server
const io = initializeSocket(server);

// Initialize collaboration socket handler
collabSocket(io);

// Initialize collaboration socket handler
// collabSocketHandler(io);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5195", "http://localhost:5196", "http://localhost:5731", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5731"],
  credentials: true,
  methods: process.env.ALLOWED_METHODS ? process.env.ALLOWED_METHODS.split(',') : ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: process.env.ALLOWED_HEADERS ? process.env.ALLOWED_HEADERS.split(',') : ["Content-Type", "Authorization", "x-access-token"],
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Add logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/collab", collabRoutes);
app.use("/api/user", userRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// Start server
const startServer = async () => {
  console.log("Starting server initialization...");
  try {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined in environment variables");
    }
    await connectDB();
    console.log("✅ Database connected successfully");
    
    server.listen(PORT, () => {
      console.log("🚀 Server is running on PORT:" + PORT);
      console.log("NODE_ENV:", process.env.NODE_ENV);
    });
  } catch (error) {
    console.error("❌ CRITICAL: Failed to start server!");
    console.error("Error Message:", error.message);
    console.error("Stack Trace:", error.stack);
    process.exit(1); // Force exit to notify Render of the failure
  }
};

startServer();

server.on('error', (err) => {
  console.error("Server error:", err);
});

// Initialize collaboration socket after server starts
// collabSocket(io); // Removed undefined function call

// Make io available globally for other modules
global.io = io;

// Export app, server, and io for use in other modules
export { app, server, io };