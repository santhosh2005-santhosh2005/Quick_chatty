import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, getIO } from "../lib/socket.js";

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: "Search query is required" });
    }
    
    // Search for users by email or full name
    const users = await User.find({
      $or: [
        { email: { $regex: q, $options: "i" } },
        { fullName: { $regex: q, $options: "i" }
        }
      ]
    }).select("_id fullName email");
    
    res.json({ users });
  } catch (err) {
    console.error("Search users error:", err);
    res.status(500).json({ error: "Failed to search users" });
  }
};

export const sendInvitation = async (req, res) => {
  try {
    const { userId, sessionId, shareLink } = req.body;
    const senderId = req.user._id;
    
    if (!userId || !sessionId || !shareLink) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Get sender's information
    const sender = await User.findById(senderId).select("fullName");
    
    // Create invitation message
    const invitationMessage = {
      text: `${sender.fullName} has invited you to collaborate. Click here to join: ${shareLink}`,
      senderId: senderId,
      receiverId: userId,
      isInvitation: true,
      sessionId: sessionId,
      shareLink: shareLink
    };
    
    // Save the invitation as a message
    const newMessage = new Message(invitationMessage);
    await newMessage.save();
    
    // Send the invitation through socket to appear in user's chat
    const receiverSocketId = getReceiverSocketId(userId);
    const io = getIO();
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
      io.to(receiverSocketId).emit("invitationReceived", {
        message: newMessage,
        sessionId: sessionId,
        shareLink: shareLink
      });
    }
    
    res.json({ message: "Invitation sent successfully", messageId: newMessage._id });
  } catch (err) {
    console.error("Send invitation error:", err);
    res.status(500).json({ error: "Failed to send invitation" });
  }
};

// New function to delete a user account
export const deleteUser = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Delete all messages sent by the user
    await Message.deleteMany({ senderId: userId });
    
    // Delete all messages received by the user
    await Message.deleteMany({ receiverId: userId });
    
    // Delete the user account
    await User.findByIdAndDelete(userId);
    
    // Clear the JWT cookie
    res.cookie("jwt", "", { maxAge: 0 });
    
    res.status(200).json({ message: "User account deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user account" });
  }
};

// New function to add a contact
export const addContact = async (req, res) => {
  try {
    const { contactId } = req.body;
    const userId = req.user._id;
    
    // Check if contactId is provided
    if (!contactId) {
      return res.status(400).json({ error: "Contact ID is required" });
    }
    
    // Check if user is trying to add themselves
    if (contactId === userId.toString()) {
      return res.status(400).json({ error: "You cannot add yourself as a contact" });
    }
    
    // Find the user and update their contacts
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check if contact already exists
    if (user.contacts.includes(contactId)) {
      return res.status(400).json({ error: "Contact already exists" });
    }
    
    // Add contact to user's contacts
    user.contacts.push(contactId);
    await user.save();
    
    // Also add the user to the contact's contacts (mutual connection)
    const contactUser = await User.findById(contactId);
    if (contactUser && !contactUser.contacts.includes(userId)) {
      contactUser.contacts.push(userId);
      await contactUser.save();
    }
    
    res.status(200).json({ message: "Contact added successfully" });
  } catch (err) {
    console.error("Add contact error:", err);
    res.status(500).json({ error: "Failed to add contact" });
  }
};

// New function to remove a contact
export const removeContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.user._id;
    
    // Check if contactId is provided
    if (!contactId) {
      return res.status(400).json({ error: "Contact ID is required" });
    }
    
    // Find the user and update their contacts
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Remove contact from user's contacts
    user.contacts = user.contacts.filter(id => id.toString() !== contactId);
    await user.save();
    
    // Also remove the user from the contact's contacts
    const contactUser = await User.findById(contactId);
    if (contactUser) {
      contactUser.contacts = contactUser.contacts.filter(id => id.toString() !== userId.toString());
      await contactUser.save();
    }
    
    res.status(200).json({ message: "Contact removed successfully" });
  } catch (err) {
    console.error("Remove contact error:", err);
    res.status(500).json({ error: "Failed to remove contact" });
  }
};

// New function to get user's contacts
export const getContacts = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find the user and populate their contacts
    const user = await User.findById(userId).populate("contacts", "fullName email profilePic");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json(user.contacts);
  } catch (err) {
    console.error("Get contacts error:", err);
    res.status(500).json({ error: "Failed to get contacts" });
  }
};