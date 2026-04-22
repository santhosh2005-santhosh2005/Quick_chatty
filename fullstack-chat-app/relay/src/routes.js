
import express from 'express';
import { getSnapshot } from './persistence.js';
import { revokeToken } from './websocket.js';
import { issueToken, verifyToken } from './auth.js';

export function setupRoutes(app) {
  const router = express.Router();

  // Endpoint to get a session snapshot
  router.get('/session/:sessionId/snapshot', async (req, res) => {
    const { sessionId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Missing token' });
    }

    try {
      const decoded = await verifyToken(token);
      if (decoded.sessionId !== sessionId) {
        return res.status(403).json({ error: 'Invalid token for this session' });
      }

      const snapshot = await getSnapshot(sessionId);
      if (snapshot) {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.send(snapshot);
      } else {
        res.status(404).json({ error: 'Snapshot not found' });
      }
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  });

  // Endpoint to issue a token (for testing purposes)
  router.post('/token/issue', (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }
    const token = issueToken({ sessionId });
    res.json({ token });
  });

  // Endpoint to revoke a token
  router.post('/token/revoke', async (req, res) => {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Missing token' });
    }

    try {
      // Verify token before revoking to prevent DoS attacks
      await verifyToken(token);
      revokeToken(token);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Invalid token' });
    }
  });

  app.use('/api', router);
}
