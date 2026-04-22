import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  getMessages, 
  getUsersForSidebar, 
  sendMessage,
  deleteMessageForYou,
  deleteMessageForEveryone,
  deleteAllMessages
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);

// Add delete routes
router.delete("/delete-for-you/:id", protectRoute, deleteMessageForYou);
router.delete("/delete-for-everyone/:id", protectRoute, deleteMessageForEveryone);
router.delete("/delete-all/:id", protectRoute, deleteAllMessages);

export default router;