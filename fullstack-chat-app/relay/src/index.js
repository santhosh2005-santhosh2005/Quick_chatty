import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupWebSocketServer } from './websocket.js';
import { setupRoutes } from './routes.js';
import { initPersistence } from './persistence.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure middleware
app.use(cors());
app.use(express.json());

// Initialize persistence layer
initPersistence();

// Setup API routes
setupRoutes(app);

// Setup WebSocket server with y-websocket
setupWebSocketServer(server);

// Start server
const PORT = process.env.RELAY_PORT || 5002;
server.listen(PORT, () => {
  console.log(`Relay server running on port ${PORT}`);
  console.log(`CRDT feature enabled: ${process.env.USE_CRDT === 'true'}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down relay server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});