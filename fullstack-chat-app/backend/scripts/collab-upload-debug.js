const { io } = require('socket.io-client');
const fs = require('fs').promises;
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5001';
const ROOM_ID = process.env.ROOM_ID || 'test-room-123';
const USER_ID = process.env.USER_ID || 'user-' + Math.random().toString(36).substr(2, 8);
const USER_NAME = process.env.USER_NAME || 'Test User';
const USER_AVATAR = process.env.USER_AVATAR || 'https://ui-avatars.com/api/?name=Test+User';
const TEST_FILE = process.env.TEST_FILE || path.join(__dirname, 'test-upload.txt');

// Log with timestamp
function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

// Generate a random file if it doesn't exist
async function ensureTestFile() {
  try {
    await fs.access(TEST_FILE);
    log(`Using existing test file: ${TEST_FILE}`);
  } catch {
    const content = `Test file generated at ${new Date().toISOString()}\n`;
    await fs.writeFile(TEST_FILE, content.repeat(1000)); // ~16KB file
    log(`Created test file: ${TEST_FILE} (${(await fs.stat(TEST_FILE)).size} bytes)`);
  }
}

async function runUploadTest() {
  // Ensure test file exists
  await ensureTestFile();
  
  log(`Starting upload test for room ${ROOM_ID} as user ${USER_ID} (${USER_NAME})`);
  
  // Connect to socket.io
  const socket = io(`${SERVER_URL}/collab-files`, {
    auth: { userId: USER_ID, userName: USER_NAME, userAvatar: USER_AVATAR },
    transports: ['websocket'],
    reconnection: false,
    timeout: 10000,
  });

  // Setup event listeners
  socket.on('connect', () => {
    log('Connected to server, joining room...');
    socket.emit('join-room', ROOM_ID, { userId: USER_ID, userName: USER_NAME, userAvatar: USER_AVATAR });
  });

  socket.on('join-room-ack', () => {
    log(`Successfully joined room ${ROOM_ID}`);
    startUpload();
  });

  socket.on('file-tree', ({ roomId, tree }) => {
    log(`Received file tree for room ${roomId}:`, Object.keys(tree).length, 'files');
  });

  socket.on('file-event', ({ roomId, event }) => {
    log(`File event [${event.action}] ${event.file?.path || ''} v${event.file?.version || '?'} by ${event.file?.uploaderName || 'unknown'}`);
  });

  socket.on('error', (error) => {
    log('Socket error:', error);
    process.exit(1);
  });

  socket.on('disconnect', (reason) => {
    log('Disconnected:', reason);
    if (reason === 'io server disconnect') {
      process.exit(1);
    }
  });

  async function startUpload() {
    try {
      const filePath = 'test-upload.txt';
      const fileContent = await fs.readFile(TEST_FILE);
      const fileSize = fileContent.length;
      
      log(`Initiating upload of ${filePath} (${fileSize} bytes)`);
      
      // Step 1: Initialize upload
      const { uploadUrl, uploadId, objectKey } = await new Promise((resolve, reject) => {
        socket.emit('collab:files:upload:init', {
          roomId: ROOM_ID,
          path: '',
          name: path.basename(filePath),
          size: fileSize,
          mime: 'text/plain',
          userId: USER_ID,
          userName: USER_NAME,
          userAvatar: USER_AVATAR
        }, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
      
      log(`Got upload URL (expires in 15m), uploading file...`);
      
      // Step 2: Upload file to presigned URL
      const uploadStart = Date.now();
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: fileContent,
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': fileSize.toString(),
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }
      
      const uploadTime = Date.now() - uploadStart;
      log(`File uploaded in ${uploadTime}ms, completing...`);
      
      // Step 3: Complete upload
      const completeResponse = await new Promise((resolve, reject) => {
        socket.emit('collab:files:upload:complete', {
          roomId: ROOM_ID,
          uploadId,
          path: '',
          name: path.basename(filePath),
          size: fileSize,
          mime: 'text/plain',
          objectKey,
          userId: USER_ID,
          userName: USER_NAME,
          userAvatar: USER_AVATAR
        }, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
      
      log('Upload completed successfully:', completeResponse);
      log('Waiting for file events... (Ctrl+C to exit)');
      
    } catch (error) {
      log('Upload failed:', error);
      process.exit(1);
    }
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  log('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log('Uncaught Exception:', error);
  process.exit(1);
});

// Run the test
runUploadTest().catch(error => {
  log('Test failed:', error);
  process.exit(1);
});
