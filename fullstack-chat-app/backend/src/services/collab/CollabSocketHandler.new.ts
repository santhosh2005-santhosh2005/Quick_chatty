import { Server as SocketIO, Socket } from 'socket.io';
import { CollabFileService } from './FileService';
import { FileMetadata } from './types';

export interface FileEvent {
  type: 'FILE_CREATED' | 'FILE_UPDATED' | 'FILE_DELETED' | 'FOLDER_CREATED';
  payload: FileMetadata;
  timestamp: string;
  userId: string;
}

export class CollabSocketHandler {
  private fileService: CollabFileService;
  private io: SocketIO;
  private activeRooms: Map<string, Set<string>> = new Map();

  constructor(io: SocketIO, fileService: CollabFileService) {
    this.io = io;
    this.fileService = fileService;
  }

  public initialize() {
    const collabNs = this.io.of('/collab');
    
    collabNs.on('connection', (socket: Socket) => {
      const userId = socket.handshake.auth.userId || `user-${socket.id.slice(0, 6)}`;
      const userRooms = new Set<string>();

      // Handle joining a room
      socket.on('join-room', async (roomId: string) => {
        try {
          await this.handleJoinRoom(socket, roomId, userId, userRooms);
        } catch (error) {
          this.handleError(socket, 'JOIN_ROOM_ERROR', error, { roomId, userId });
        }
      });

      // Handle file upload initialization
      socket.on('collab:files:upload:init', async (data, ack) => {
        try {
          const { roomId, path, name, size, mime } = data;
          const result = await this.fileService.initUpload(roomId, userId, path, name, size, mime);
          ack({ ok: true, ...result });
        } catch (error) {
          this.handleError(socket, 'UPLOAD_INIT_ERROR', error, data);
          ack({ ok: false, error: error.message });
        }
      });

      // Handle file upload completion
      socket.on('collab:files:upload:complete', async (data, ack) => {
        try {
          const { roomId, uploadId, path, name, size, mime } = data;
          const fileMeta = await this.fileService.completeUpload(roomId, userId, uploadId, path, name, size, mime);
          
          // Broadcast file creation event to all clients in the room
          this.broadcastFileEvent(roomId, {
            type: 'FILE_CREATED',
            payload: fileMeta,
            timestamp: new Date().toISOString(),
            userId
          });

          ack({ ok: true, file: fileMeta });
        } catch (error) {
          this.handleError(socket, 'UPLOAD_COMPLETE_ERROR', error, data);
          ack({ ok: false, error: error.message });
        }
      });

      // Handle file content updates
      socket.on('collab:file:update', async (data, ack) => {
        try {
          const { roomId, path, content, version } = data;
          const updatedFile = await this.fileService.updateFile(roomId, path, content, version, userId);
          
          // Broadcast file update event
          this.broadcastFileEvent(roomId, {
            type: 'FILE_UPDATED',
            payload: updatedFile,
            timestamp: new Date().toISOString(),
            userId
          });

          ack({ ok: true, version: updatedFile.version });
        } catch (error) {
          this.handleError(socket, 'FILE_UPDATE_ERROR', error, data);
          ack({ 
            ok: false, 
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR'
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket, userId, userRooms);
      });
    });
  }

  private async handleJoinRoom(socket: Socket, roomId: string, userId: string, userRooms: Set<string>) {
    await socket.join(roomId);
    userRooms.add(roomId);
    
    // Track active users in room
    if (!this.activeRooms.has(roomId)) {
      this.activeRooms.set(roomId, new Set());
    }
    this.activeRooms.get(roomId)?.add(userId);
    
    // Send current file tree to the user
    const fileTree = await this.fileService.getFileTree(roomId);
    socket.emit('collab:files:tree', { 
      roomId, 
      files: Object.values(fileTree),
      activeUsers: Array.from(this.activeRooms.get(roomId) || [])
    });

    // Notify others in the room about the new user
    socket.to(roomId).emit('collab:user:joined', { userId });
    
    this.fileService.logger.info('User joined room', { 
      userId, 
      socketId: socket.id, 
      roomId,
      activeUsers: Array.from(this.activeRooms.get(roomId) || [])
    });
  }

  private handleDisconnect(socket: Socket, userId: string, userRooms: Set<string>) {
    userRooms.forEach(roomId => {
      // Remove user from active users in room
      if (this.activeRooms.has(roomId)) {
        this.activeRooms.get(roomId)?.delete(userId);
        
        // Notify others in the room about the user leaving
        socket.to(roomId).emit('collab:user:left', { userId });
        
        this.fileService.logger.info('User left room', { 
          userId, 
          roomId,
          remainingUsers: Array.from(this.activeRooms.get(roomId) || [])
        });
      }
    });
    
    userRooms.clear();
  }

  private broadcastFileEvent(roomId: string, event: FileEvent) {
    this.io.of('/collab').to(roomId).emit('collab:files:event', event);
    
    this.fileService.logger.debug('Broadcasted file event', {
      roomId,
      eventType: event.type,
      filePath: event.payload.path,
      userId: event.userId
    });
  }

  private handleError(socket: Socket, code: string, error: Error, context: any = {}) {
    const errorMessage = error.message || 'An unknown error occurred';
    const errorData = {
      code,
      message: errorMessage,
      ...context,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };

    this.fileService.logger.error(`Collab error [${code}]`, errorData);
    socket.emit('collab:error', errorData);
  }
}

// Create and export a singleton instance
let instance: CollabSocketHandler;

export const initCollabSocketHandler = (io: SocketIO, fileService: CollabFileService) => {
  if (!instance) {
    instance = new CollabSocketHandler(io, fileService);
    instance.initialize();
  }
  return instance;
};
