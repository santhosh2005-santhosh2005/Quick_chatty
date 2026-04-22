import { Server, Socket } from 'socket.io';
import {
  initUpload,
  completeUpload,
  getFileTree,
  createDirectory,
  deleteFile,
  getDownloadUrl,
} from '../services/collabFileService';

interface FileEvent {
  action: 'create' | 'update' | 'delete';
  file: {
    path: string;
    name: string;
    size: number;
    mime: string;
    version: number;
    timestamp: string;
    uploaderId: string;
    isDirectory?: boolean;
  };
}

export function setupCollabFileSocket(io: Server) {
  const collabFileNs = io.of('/collab-files');
  
  collabFileNs.on('connection', (socket: Socket) => {
    console.log('Client connected to collab-files namespace', socket.id);
    
    // Track which rooms the socket is in
    const userRooms = new Set<string>();
    let userId: string | null = null;

    // Handle joining a room
    socket.on('join-room', async (roomId: string, userInfo: { userId: string }) => {
      try {
        userId = userInfo.userId;
        await socket.join(roomId);
        userRooms.add(roomId);
        console.log(`User ${userId} (${socket.id}) joined room ${roomId}`);
        
        // Send current file tree to the user
        const fileTree = await getFileTree(roomId);
        socket.emit('file-tree', { roomId, tree: fileTree });
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room', error: error.message });
      }
    });

    // Handle file upload initialization
    socket.on('file-upload-init', async (
      { roomId, path, name, size, mime },
      ack
    ) => {
      try {
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        console.log(`[${roomId}] Init upload: ${path}/${name} (${size} bytes)`);
        const result = await initUpload(roomId, userId, path, name, size, mime);
        ack({ success: true, ...result });
      } catch (error) {
        console.error('Upload init error:', error);
        ack({ success: false, error: error.message });
      }
    });

    // Handle file upload completion
    socket.on('file-upload-complete', async (
      { roomId, uploadId, path, name, size, mime, version },
      ack
    ) => {
      try {
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        console.log(`[${roomId}] Upload complete: ${path}/${name}`);
        const fileMeta = await completeUpload(roomId, userId, uploadId, path, name, size, mime, version);
        
        // Broadcast file update to all clients in the room
        const event: FileEvent = {
          action: version ? 'update' : 'create',
          file: fileMeta,
        };
        
        collabFileNs.to(roomId).emit('file-event', { roomId, event });
        ack({ success: true, file: fileMeta });
      } catch (error) {
        console.error('Upload complete error:', error);
        ack({ success: false, error: error.message });
      }
    });

    // Handle directory creation
    socket.on('create-directory', async ({ roomId, path }, ack) => {
      try {
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        console.log(`[${roomId}] Create directory: ${path}`);
        const dirMeta = await createDirectory(roomId, path, userId);
        
        // Broadcast directory creation
        const event: FileEvent = {
          action: 'create',
          file: dirMeta,
        };
        
        collabFileNs.to(roomId).emit('file-event', { roomId, event });
        ack({ success: true, directory: dirMeta });
      } catch (error) {
        console.error('Create directory error:', error);
        ack({ success: false, error: error.message });
      }
    });

    // Handle file deletion
    socket.on('delete-file', async ({ roomId, path }, ack) => {
      try {
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        console.log(`[${roomId}] Delete file: ${path}`);
        const fileTree = await getFileTree(roomId);
        const file = fileTree[path];
        
        if (!file) {
          throw new Error('File not found');
        }
        
        await deleteFile(roomId, path);
        
        // Broadcast file deletion
        const event: FileEvent = {
          action: 'delete',
          file: {
            path,
            name: file.name,
            size: file.size,
            mime: file.mime,
            version: file.version,
            timestamp: new Date().toISOString(),
            uploaderId: userId,
            isDirectory: file.isDirectory,
          },
        };
        
        collabFileNs.to(roomId).emit('file-event', { roomId, event });
        ack({ success: true });
      } catch (error) {
        console.error('Delete file error:', error);
        ack({ success: false, error: error.message });
      }
    });

    // Handle file download URL request
    socket.on('get-download-url', async ({ roomId, path }, ack) => {
      try {
        console.log(`[${roomId}] Get download URL: ${path}`);
        const url = await getDownloadUrl(roomId, path);
        ack({ success: true, url });
      } catch (error) {
        console.error('Get download URL error:', error);
        ack({ success: false, error: error.message });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected from collab-files namespace', socket.id);
      userRooms.clear();
    });
  });
  
  return collabFileNs;
}
