import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { searchUsers, sendInvitation, deleteUser, addContact, removeContact, getContacts } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/search", protectRoute, searchUsers);
router.post("/invite", protectRoute, sendInvitation);
router.delete("/delete", protectRoute, deleteUser);

// New routes for contact management
router.post("/contacts", protectRoute, addContact);
router.delete("/contacts/:contactId", protectRoute, removeContact);
router.get("/contacts", protectRoute, getContacts);

export default router;