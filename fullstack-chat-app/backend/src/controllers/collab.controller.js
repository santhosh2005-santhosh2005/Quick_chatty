import crypto from "crypto";
import { issueToken } from "../lib/jwt.js";

export const createCollabSession = (req, res) => {
  try {
    console.log('Creating new collaboration session for user:', req.user?._id);
    
    // Validate required environment variables
    if (!process.env.FRONTEND_URL) {
      console.error('FRONTEND_URL is not set in environment variables');
      return res.status(500).json({ 
        error: "Server configuration error",
        details: "FRONTEND_URL is not configured"
      });
    }

    const sessionId = crypto.randomUUID();
    console.log('Generated session ID:', sessionId);
    
    try {
      if (process.env.USE_CRDT === "true") {
        const token = issueToken({ sessionId, userId: req.user?._id });
        const shareLink = `${process.env.FRONTEND_URL}/collab/${sessionId}?token=${token}`;
        console.log('Created CRDT session with share link:', shareLink);
        return res.json({ 
          success: true,
          sessionId, 
          shareLink,
          token: process.env.USE_CRDT ? token : undefined
        });
      } else {
        const shareLink = `${process.env.FRONTEND_URL}/collab/${sessionId}`;
        console.log('Created standard session with share link:', shareLink);
        return res.json({ 
          success: true,
          sessionId, 
          shareLink 
        });
      }
    } catch (tokenError) {
      console.error('Error generating token:', tokenError);
      return res.status(500).json({ 
        error: "Failed to generate session token",
        details: tokenError.message 
      });
    }
  } catch (err) {
    console.error('Error in createCollabSession:', err);
    return res.status(500).json({ 
      error: "Failed to create session",
      details: err.message 
    });
  }
};

// Add a health check endpoint
export const healthCheck = (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    memoryUsage: process.memoryUsage()
  });
};
