import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    console.log("Protect route middleware called");
    const token = req.cookies.jwt;
    
    console.log("Token from cookies:", token ? "Present" : "Missing");

    if (!token) {
      console.log("Authorization failed: No token provided");
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decoded successfully:", decoded ? "Yes" : "No");

    if (!decoded) {
      console.log("Authorization failed: Invalid token");
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    const user = await User.findById(decoded.userId).select("-password");
    console.log("User found in database:", user ? "Yes" : "No");

    if (!user) {
      console.log("Authorization failed: User not found");
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    console.log("Authorization successful for user:", user._id);

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};