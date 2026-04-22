import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { debounce } from 'lodash';

interface FileMetadata {
  path: string;
  name: string;
  size: number;
  mime: string;
  version: number;
  timestamp: string;
  uploaderId: string;
  uploaderName?: string;
  uploaderAvatar?: string;
  isDirectory?: boolean;
  content?: string;
}

interface FileEvent {
  action: 'create' | 'update' | 'delete';
  file: FileMetadata;
  timestamp: string;
}

export const useCollabFiles = (roomId: string, userId: string) => {
  const [files, setFiles] = useState<Record<string, FileMetadata>>({});
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pendingUpdates = useRef<Record<string, string>>({});

  // Debounced function to send file updates
  const debouncedUpdate = useRef(
    debounce((path: string, content: string) => {
      if (!socketRef.current) return;
      
      socketRef.current.emit('collab:file:update', {
        roomId,
        path,
        content,
        userId,
        timestamp: new Date().toISOString()
      });
      
      // Clear pending updates for this path
      delete pendingUpdates.current[path];
    }, 1000)
  ).current;

  // Initialize socket connection
  useEffect(() => {
    if (!roomId || !userId) return;

    const socket = io('/collab-files', {
      query: { roomId, userId },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to collab-files namespace');
      setIsConnected(true);
      // Request the current file tree when connected
      socket.emit('collab:files:request-tree', { roomId });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from collab-files namespace');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError('Failed to connect to collaboration server');
    });

    // File events
    socket.on('collab:files:event', (event: FileEvent) => {
      console.log('File event received:', event);
      
      setFiles(prevFiles => {
        const newFiles = { ...prevFiles };
        
        switch (event.action) {
          case 'create':
          case 'update':
            newFiles[event.file.path] = {
              ...event.file,
              // Preserve existing content if we have it
              content: newFiles[event.file.path]?.content
            };
            break;
            
          case 'delete':
            delete newFiles[event.file.path];
            // Clear selection if the selected file was deleted
            if (selectedFile?.path === event.file.path) {
              setSelectedFile(null);
            }
            break;
        }
        
        return newFiles;
      });
    });

    // Handle file tree updates
    socket.on('collab:files:tree', ({ tree }: { tree: Record<string, FileMetadata> }) => {
      console.log('Received file tree:', tree);
      setFiles(prevFiles => ({
        ...prevFiles,
        ...Object.entries(tree).reduce((acc, [path, file]) => ({
          ...acc,
          [path]: {
            ...file,
            // Preserve existing content if we have it
            content: prevFiles[path]?.content
          }
        }), {})
      }));
    });

    // Handle file content updates
    socket.on('collab:file:content', ({ path, content }: { path: string; content: string }) => {
      console.log('Received file content for:', path);
      
      setFiles(prevFiles => {
        const updatedFiles = { ...prevFiles };
        
        if (updatedFiles[path]) {
          updatedFiles[path] = {
            ...updatedFiles[path],
            content,
            timestamp: new Date().toISOString()
          };
        }
        
        return updatedFiles;
      });
    });

    // Cleanup on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('collab:files:event');
      socket.off('collab:files:tree');
      socket.off('collab:file:content');
      socket.disconnect();
    };
  }, [roomId, userId]);

  // Open a file to view/edit
  const openFile = useCallback((path: string) => {
    const file = files[path];
    if (!file) {
      console.error('File not found:', path);
      return;
    }

    // If we already have the content, just select the file
    if (file.content !== undefined) {
      setSelectedFile(file);
      return;
    }

    // Otherwise, request the content
    if (socketRef.current) {
      socketRef.current.emit('collab:files:request-content', { roomId, path });
      setSelectedFile(file);
    }
  }, [files, roomId]);

  // Update file content with debouncing
  const updateFileContent = useCallback((path: string, content: string) => {
    setFiles(prevFiles => {
      if (!prevFiles[path]) return prevFiles;
      
      const updatedFiles = { ...prevFiles };
      updatedFiles[path] = {
        ...updatedFiles[path],
        content,
        timestamp: new Date().toISOString()
      };
      
      // If we have a selected file, update its content too
      if (selectedFile?.path === path) {
        setSelectedFile(updatedFiles[path]);
      }
      
      return updatedFiles;
    });
    
    // Queue the update
    pendingUpdates.current[path] = content;
    debouncedUpdate(path, content);
  }, [debouncedUpdate, selectedFile]);

  // Upload files
  const uploadFiles = useCallback(async (fileList: FileList | File[]) => {
    if (!socketRef.current) {
      throw new Error('Not connected to server');
    }

    const files = Array.from(fileList);
    const uploadPromises = files.map(file => {
      return new Promise<void>(async (resolve, reject) => {
        try {
          // Read the file
          const content = await file.text();
          
          // Emit the file data
          socketRef.current?.emit('collab:files:upload', {
            roomId,
            name: file.name,
            size: file.size,
            mime: file.type || 'application/octet-stream',
            content,
            userId,
            timestamp: new Date().toISOString()
          }, (response: { success: boolean; error?: string }) => {
            if (response.success) {
              resolve();
            } else {
              reject(new Error(response.error || 'Upload failed'));
            }
          });
        } catch (err) {
          reject(err);
        }
      });
    });

    return Promise.all(uploadPromises);
  }, [roomId, userId]);

  // Create a new file
  const createFile = useCallback((path: string, isDirectory = false) => {
    if (!socketRef.current) {
      throw new Error('Not connected to server');
    }

    return new Promise<void>((resolve, reject) => {
      socketRef.current?.emit('collab:files:create', {
        roomId,
        path,
        isDirectory,
        userId,
        timestamp: new Date().toISOString()
      }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to create file'));
        }
      });
    });
  }, [roomId, userId]);

  // Delete a file or directory
  const deleteFile = useCallback((path: string) => {
    if (!socketRef.current) {
      throw new Error('Not connected to server');
    }

    return new Promise<void>((resolve, reject) => {
      socketRef.current?.emit('collab:files:delete', {
        roomId,
        path,
        userId,
        timestamp: new Date().toISOString()
      }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to delete file'));
        }
      });
    });
  }, [roomId, userId]);

  return {
    files: Object.values(files),
    selectedFile,
    isConnected,
    error,
    openFile,
    updateFileContent,
    uploadFiles,
    createFile,
    deleteFile,
    hasFiles: Object.keys(files).length > 0
  };
};

export default useCollabFiles;
