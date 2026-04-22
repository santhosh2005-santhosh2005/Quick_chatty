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
import { initCollabSocketHandler } from "./services/collab/CollabSocketHandler.new.js";
import { collabFileService } from "./services/collab/FileService.js";

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

// Initialize collaboration socket handler with file service
initCollabSocketHandler(io, collabFileService);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5195", "http://localhost:5196", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
  credentials: true,
  methods: process.env.ALLOWED_METHODS ? process.env.ALLOWED_METHODS.split(',') : ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: process.env.ALLOWED_HEADERS ? process.env.ALLOWED_HEADERS.split(',') : ["Content-Type", "Authorization", "x-access-token"],
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/collab", collabRoutes);
app.use("/api/users", userRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);});

startServer();
