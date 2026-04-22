import { Server as SocketIO, Socket } from 'socket.io';
import { CollabFileService, FileMetadata } from './FileService';

export interface FileEvent {
  action: 'create' | 'update' | 'delete';
  file: FileMetadata;
  timestamp: string;
  userId: string;
}

export class CollabSocketHandler {
  private fileService: CollabFileService;
  private io: SocketIO;

  constructor(io: SocketIO, fileService: CollabFileService) {
    this.io = io;
    this.fileService = fileService;
  }

  public initialize() {
    const collabNs = this.io.of('/collab');
    
    collabNs.on('connection', (socket: Socket) => {
      const userId = socket.handshake.auth.userId || 'anonymous';
      const userRooms = new Set<string>();

      // Handle joining a room
      socket.on('join-room', async (roomId: string) => {
        try {
          await socket.join(roomId);
          userRooms.add(roomId);
          
          // Send current file tree to the user
          const fileTree = await this.fileService.getFileTree(roomId);
          socket.emit('collab:files:tree', { roomId, files: Object.values(fileTree) });
          
          this.fileService.logger.info('User joined room', { 
            userId, 
            socketId: socket.id, 
            roomId,
            activeRooms: Array.from(userRooms)
          });
        } catch (error) {
          this.fileService.logger.error('Error joining room', { 
            error: error.message, 
            userId, 
            roomId 
          });
          socket.emit('error', { 
            code: 'JOIN_ERROR', 
            message: 'Failed to join room' 
          });
        }
      });

      // Handle file upload initialization
      socket.on('collab:files:upload:init', async (
        { roomId, path, name, size, mime },
        ack: (response: any) => void
      ) => {
        try {
          this.fileService.logger.debug('Upload init', { roomId, path, name, size, mime, userId });
          
          const result = await this.fileService.initUpload(roomId, userId, path, name, size, mime);
          
          ack({ 
            ok: true, 
            uploadUrl: result.uploadUrl, 
            uploadId: result.uploadId, 
            expiresAt: result.expiresAt 
          });
          
          this.fileService.logger.info('Upload URL generated', { 
            roomId, 
            path, 
            name, 
            uploadId: result.uploadId 
          });
        } catch (error) {
          this.fileService.logger.error('Upload init failed', { 
            error: error.message, 
            roomId, 
            path, 
            name, 
            userId 
          });
          
          ack({ 
            ok: false, 
            code: 'UPLOAD_INIT_ERROR', 
            message: error.message 
          });
        }
      });

      // Handle file upload completion
      socket.on('collab:files:upload:complete', async (
        { roomId, uploadId, path, name, size, mime },
        ack: (response: any) => void
      ) => {
        try {
          this.fileService.logger.debug('Upload complete', { 
            roomId, 
            uploadId, 
            path, 
            name, 
            size, 
            userId 
          });
          
          const fileMeta = await this.fileService.completeUpload(
            roomId, 
            userId, 
            uploadId, 
            path, 
            name, 
            size, 
            mime
          );
          
          // Broadcast file update to all clients in the room
          const event: FileEvent = {
            action: 'create',
            file: fileMeta,
            timestamp: new Date().toISOString(),
            userId
          };
          
          collabNs.to(roomId).emit('collab:files:event', event);
          
          ack({ 
            ok: true, 
            file: fileMeta 
          });
          
          this.fileService.logger.info('File upload completed', { 
            roomId, 
            path, 
            name, 
            size, 
            userId 
          });
        } catch (error) {
          this.fileService.logger.error('Upload completion failed', { 
            error: error.message, 
            roomId, 
            uploadId, 
            path, 
            userId 
          });
          
          ack({ 
            ok: false, 
            code: 'UPLOAD_COMPLETE_ERROR', 
            message: error.message 
          });
        }
      });

      // Handle file content requests
      socket.on('collab:files:request-content', async (
        { roomId, path },
        ack: (response: any) => void
      ) => {
        try {
          this.fileService.logger.debug('File content requested', { roomId, path, userId });
          
          const content = await this.fileService.getFileContent(roomId, path);
          
          ack({ 
            ok: true, 
            path, 
            content: content.toString('utf-8') 
          });
          
          this.fileService.logger.debug('File content served', { 
            roomId, 
            path, 
            size: content.length,
            userId 
          });
        } catch (error) {
          this.fileService.logger.error('File content request failed', { 
            error: error.message, 
            roomId, 
            path, 
            userId 
          });
          
          ack({ 
            ok: false, 
            code: 'CONTENT_REQUEST_ERROR', 
            message: error.message 
          });
        }
      });

      // Handle file updates from the editor
      socket.on('collab:file:update', async (
        { roomId, path, content, version },
        ack: (response: any) => void
      ) => {
        try {
          this.fileService.logger.debug('File update received', { 
            roomId, 
            path, 
            contentLength: content?.length,
            version,
            userId 
          });
          
          const updatedFile = await this.fileService.updateFile(
            roomId,
            path,
            content,
            version,
            userId
          );
          
          // Broadcast the update to all clients in the room
          const event: FileEvent = {
            action: 'update',
            file: updatedFile,
            timestamp: new Date().toISOString(),
            userId
          };
          
          socket.to(roomId).emit('collab:files:event', event);
          
          ack({ 
            ok: true, 
            version: updatedFile.version 
          });
          
          this.fileService.logger.info('File updated', { 
            roomId, 
            path, 
            version: updatedFile.version,
            userId 
          });
        } catch (error) {
          this.fileService.logger.error('File update failed', { 
            error: error.message, 
            roomId, 
            path, 
            version,
            userId 
          });
          
          ack({ 
            ok: false, 
            code: 'FILE_UPDATE_ERROR', 
            message: error.message,
            expectedVersion: version
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        userRooms.forEach(roomId => {
          socket.leave(roomId);
          this.fileService.logger.info('User left room', { 
            userId, 
            socketId: socket.id, 
            roomId 
          });
        });
        userRooms.clear();
      });
    });
    
    return collabNs;
  }
}

// Export a singleton instance
export const collabSocketHandler = (io: SocketIO) => {
  return new CollabSocketHandler(io, collabFileService);
};
