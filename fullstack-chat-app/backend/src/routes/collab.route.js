import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  createCollabSession,
  healthCheck 
} from "../controllers/collab.controller.js";

const router = express.Router();

// Public health check endpoint
router.get("/health", healthCheck);

// Protected routes
router.post("/create", protectRoute, createCollabSession);

export default router;
