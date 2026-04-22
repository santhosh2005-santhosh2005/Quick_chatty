import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      bufferCommands: false, // Stop buffering if connection fails
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    if (error.message.includes("IP")) {
      console.error("HINT: This usually means your current IP is not whitelisted in MongoDB Atlas!");
    }
    throw error; // Re-throw to prevent server from starting
  }
};
