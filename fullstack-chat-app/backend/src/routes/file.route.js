import express from 'express';
import { uploadFile, deleteFile } from '../controllers/file.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Upload file to a collaboration session
router.post('/:sessionId/upload', 
  protectRoute, 
  upload.single('file'), 
  uploadFile
);

// Delete a file from a collaboration session
router.delete('/:sessionId/files/:fileId', 
  protectRoute, 
  deleteFile
);

export default router;
