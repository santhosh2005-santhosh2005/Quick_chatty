import * as Y from 'yjs';
import { WebSocketServer } from 'ws';
import { verifyToken } from './auth.js';
import { getSnapshot, saveSnapshot } from './persistence.js';

// Store active sessions
const sessions = new Map();
// Store revoked tokens
const revokedTokens = new Set();

export function setupWebSocketServer(server) {
  const wss = new WebSocketServer({ server });
  
  wss.on('connection', async (ws, req) => {
    let sessionId = null;
    let ydoc = null;
    let token = null;
    let isAuthenticated = false;
    let isReadOnly = false;
    
    // Extract token from query parameters
    const url = new URL(req.url, 'http://localhost');
    token = url.searchParams.get('token');
    sessionId = url.searchParams.get('room');
    isReadOnly = url.searchParams.get('mode') === 'readonly';
    
    // Verify token
    try {
      if (!token || !sessionId) {
        ws.close(4000, 'Missing token or session ID');
        return;
      }
      
      // Check if token is revoked
      if (revokedTokens.has(token)) {
        ws.close(4001, 'Token revoked');
        return;
      }
      
      // Verify JWT token
      const decoded = await verifyToken(token);
      
      // Check if token is for this session
      if (decoded.sessionId !== sessionId) {
        ws.close(4002, 'Invalid session ID');
        return;
      }
      
      isAuthenticated = true;
      
      // Get or create session
      if (!sessions.has(sessionId)) {
        ydoc = new Y.Doc();
        sessions.set(sessionId, { 
          doc: ydoc, 
          clients: new Map(),
          lastUpdate: Date.now()
        });
        
        // Load snapshot if exists
        const snapshot = await getSnapshot(sessionId);
        if (snapshot) {
          Y.applyUpdate(ydoc, snapshot);
        }
      } else {
        ydoc = sessions.get(sessionId).doc;
      }
      
      // Add client to session
      const clientId = Math.random().toString(36).substring(2, 15);
      sessions.get(sessionId).clients.set(clientId, ws);
      
      // Setup awareness (cursor positions, user info)
      const awareness = new Map();
      
      // Send initial state to client
      const initialState = Y.encodeStateAsUpdate(ydoc);
      ws.send(JSON.stringify({
        type: 'sync',
        data: Array.from(initialState)
      }));
      
      // Handle messages
      ws.on('message', (message) => {
        if (!isAuthenticated) return;
        
        try {
          const parsedMessage = JSON.parse(message);
          
          switch (parsedMessage.type) {
            case 'update':
              // Apply update to the document
              if (!isReadOnly) {
                const update = new Uint8Array(parsedMessage.data);
                Y.applyUpdate(ydoc, update);
                
                // Broadcast update to all clients except sender
                broadcastUpdate(sessionId, update, clientId);
                
                // Update last update timestamp
                sessions.get(sessionId).lastUpdate = Date.now();
              }
              break;
              
            case 'awareness':
              // Update awareness state
              awareness.set(clientId, parsedMessage.data);
              
              // Broadcast awareness update to all clients except sender
              broadcastAwareness(sessionId, clientId, parsedMessage.data);
              break;
              
            case 'ping':
              // Respond with pong to keep connection alive
              ws.send(JSON.stringify({ type: 'pong' }));
              break;
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });
      
      // Handle client disconnect
      ws.on('close', () => {
        if (sessionId && sessions.has(sessionId)) {
          const session = sessions.get(sessionId);
          
          // Remove client from session
          session.clients.delete(clientId);
          
          // Broadcast awareness update (user left)
          broadcastAwareness(sessionId, clientId, null);
          
          // Save snapshot when client disconnects
          const update = Y.encodeStateAsUpdate(ydoc);
          saveSnapshot(sessionId, update);
          
          // Clean up empty sessions
          if (session.clients.size === 0) {
            sessions.delete(sessionId);
          }
        }
      });
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(4003, 'Authentication failed');
    }
  });
  
  // Periodically save snapshots
  const persistInterval = parseInt(process.env.RELAY_PERSIST_INTERVAL_MS) || 30000;
  setInterval(() => {
    for (const [sessionId, session] of sessions.entries()) {
      // Only save if there have been updates since last save
      if (session.lastUpdate > session.lastSave) {
        const update = Y.encodeStateAsUpdate(session.doc);
        saveSnapshot(sessionId, update);
        session.lastSave = Date.now();
      }
    }
  }, persistInterval);
  
  return wss;
}

// Broadcast update to all clients in a session except the sender
function broadcastUpdate(sessionId, update, excludeClientId) {
  if (!sessions.has(sessionId)) return;
  
  const session = sessions.get(sessionId);
  const message = JSON.stringify({
    type: 'update',
    data: Array.from(update)
  });
  
  for (const [clientId, ws] of session.clients.entries()) {
    if (clientId !== excludeClientId && ws.readyState === WebSocketServer.OPEN) {
      ws.send(message);
    }
  }
}

// Broadcast awareness update to all clients in a session
function broadcastAwareness(sessionId, clientId, data) {
  if (!sessions.has(sessionId)) return;
  
  const session = sessions.get(sessionId);
  const message = JSON.stringify({
    type: 'awareness',
    clientId,
    data
  });
  
  for (const [cid, ws] of session.clients.entries()) {
    if (cid !== clientId && ws.readyState === WebSocketServer.OPEN) {
      ws.send(message);
    }
  }
}

// Add token to revoked list
export function revokeToken(token) {
  revokedTokens.add(token);
  return true;
}

// Get active sessions count
export function getActiveSessionsCount() {
  return sessions.size;
}

// Get clients count for a session
export function getSessionClientsCount(sessionId) {
  if (!sessions.has(sessionId)) return 0;
  return sessions.get(sessionId).clients.size;
}