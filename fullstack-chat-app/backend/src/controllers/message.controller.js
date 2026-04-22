import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
// Import socket functions
import { getReceiverSocketId, getIO } from "../lib/socket.js";

import fs from "fs";
import path from "path";
import { encrypt, decrypt } from "../lib/encryption.js";

// Helper to save file locally
const saveFileLocally = (base64Data, filename) => {
  try {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Remove header if present (e.g., "data:image/jpeg;base64,")
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64Data, 'base64');

    // Create unique filename to avoid collisions
    const uniqueFilename = `${Date.now()}-${filename || 'file'}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    fs.writeFileSync(filePath, buffer);
    console.log(`[saveFileLocally] Saved to ${filePath}`);

    return uniqueFilename;
  } catch (error) {
    console.error("[saveFileLocally] Error:", error);
    return null;
  }
};

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id.toString(); // Convert to string for consistency

    // First, try to get contacts
    const userWithContacts = await User.findById(loggedInUserId).populate("contacts", "-password");

    let filteredUsers;

    if (userWithContacts.contacts && userWithContacts.contacts.length > 0) {
      // If user has contacts, return only contacts
      // Convert ObjectId to string for consistency
      filteredUsers = userWithContacts.contacts.map(user => {
        const userObj = user.toObject ? user.toObject() : user;
        return {
          ...userObj,
          _id: user._id.toString()
        };
      });
    } else {
      // If no contacts, return all users (original behavior)
      // Convert ObjectId to string for consistency
      const allUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
      filteredUsers = allUsers.map(user => {
        const userObj = user.toObject ? user.toObject() : user;
        return {
          ...userObj,
          _id: user._id.toString()
        };
      });
    }

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    // Decrypt messages before sending to client, but also keeping the encrypted version for demo
    const decryptedMessages = messages.map(msg => {
      const msgObj = msg.toObject();
      return {
        ...msgObj,
        text: decrypt(msgObj.text), // Decrypted text for display
        _encryptedText: msgObj.text // Original encrypted text for demo
      };
    });

    res.status(200).json(decryptedMessages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, pdf, pdfName } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Encrypt the text message before saving
    const encryptedText = encrypt(text);

    const newMessage = new Message({
      senderId,
      receiverId,
      text: encryptedText, // Store encrypted text in DB
      image: image, // Store Base64 string directly
      pdfUrl: pdf,   // Store Base64 string directly
      pdfName,
    });

    await newMessage.save();

    // Prepare message for socket and response (with decrypted text for immediate use)
    const socketMessage = {
      ...newMessage.toObject(),
      text: text, // Send plain text for immediate display
      _encryptedText: encryptedText // Send encrypted text for demo
    };

    // Use socket functions
    const receiverSocketId = getReceiverSocketId(receiverId);
    const io = getIO();

    console.log(`[sendMessage] Processing message from ${senderId} to ${receiverId}`);
    console.log(`[sendMessage] PDF present: ${!!pdf}, URL: ${pdfUrl?.substring(0, 30)}...`);
    console.log(`[sendMessage] Receiver Socket ID: ${receiverSocketId}`);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", socketMessage);
      console.log(`[sendMessage] Emitted 'newMessage' to ${receiverSocketId}`);
    } else {
      console.log(`[sendMessage] Receiver ${receiverId} is offline or not found in socket map`);
    }

    res.status(201).json(socketMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete message for you (only for the current user)
export const deleteMessageForYou = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Emit delete event only to the current user
    // Use socket functions
    const senderSocketId = getReceiverSocketId(userId);
    const io = getIO();

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeletedForYou", { messageId });
    }

    res.status(200).json({ message: "Message deleted for you" });
  } catch (error) {
    console.log("Error in deleteMessageForYou controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete message for everyone (for both sender and receiver)
export const deleteMessageForEveryone = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if the user is the sender of the message
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own messages for everyone" });
    }

    // Delete the message from database
    await Message.findByIdAndDelete(messageId);

    // Emit delete event to both sender and receiver
    // Use socket functions
    const io = getIO();
    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    const senderSocketId = getReceiverSocketId(message.senderId.toString());

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeletedForEveryone", { messageId });
    }

    if (senderSocketId && senderSocketId !== receiverSocketId) {
      io.to(senderSocketId).emit("messageDeletedForEveryone", { messageId });
    }

    res.status(200).json({ message: "Message deleted for everyone" });
  } catch (error) {
    console.log("Error in deleteMessageForEveryone controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add delete all messages between two users controller
export const deleteAllMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Delete all messages between the two users
    const result = await Message.deleteMany({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    // Emit delete all event to both users
    // Use socket functions
    const io = getIO();
    const receiverSocketId = getReceiverSocketId(userToChatId);
    const senderSocketId = getReceiverSocketId(myId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("allMessagesDeleted", {
        user1: myId,
        user2: userToChatId
      });
    }

    if (senderSocketId && senderSocketId !== receiverSocketId) {
      io.to(senderSocketId).emit("allMessagesDeleted", {
        user1: myId,
        user2: userToChatId
      });
    }

    res.status(200).json({
      message: "All messages deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.log("Error in deleteAllMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};