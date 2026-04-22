import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { getIO } from "../lib/socket.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    console.log("Signup request received:", { fullName, email });

    if (!fullName || !email || !password) {
      console.log("Signup failed: Missing required fields");
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      console.log("Signup failed: Password too short");
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) {
      console.log("Signup failed: Email already exists");
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log("Creating new user...");

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token here
      console.log("Generating token for new user...");
      generateToken(newUser._id, res);
      await newUser.save();

      console.log("User created successfully:", newUser._id);

      res.status(201).json({
        _id: newUser._id.toString(), // Ensure ID is string
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      console.log("Signup failed: Invalid user data");
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error: " + error.message, stack: error.stack });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log("Login request received:", { email });

    const user = await User.findOne({ email });

    if (!user) {
      console.log("Login failed: User not found");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("User found, checking password...");
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      console.log("Login failed: Invalid password");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("Password correct, generating token...");
    generateToken(user._id, res);

    console.log("Login successful for user:", user._id);
    res.status(200).json({
      _id: user._id.toString(), // Ensure ID is string
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error: " + error.message, stack: error.stack });
  }
};

export const logout = (req, res) => {
  try {
    console.log("Logout request received");
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullName, about } = req.body;
    const userId = req.user._id;

    console.log("Update profile request received for user:", userId);

    let updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (about) updateData.about = about;

    if (profilePic) {
      // Store the image string directly in MongoDB
      updateData.profilePic = profilePic;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    // Broadcast update to all online users
    const io = getIO();
    if (io) {
      io.emit("userUpdated", updatedUser);
    }

    console.log("Profile updated and broadcasted for user:", userId);
    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error: " + (error.message || "Unknown error") });
  }
};

export const checkAuth = (req, res) => {
  try {
    console.log("Check auth request received for user:", req.user._id);
    // Ensure user ID is a string
    const user = {
      ...req.user.toObject(),
      _id: req.user._id.toString()
    };
    console.log("Sending user with string ID:", user._id);
    res.status(200).json(user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error: " + error.message, stack: error.stack });
  }
};
