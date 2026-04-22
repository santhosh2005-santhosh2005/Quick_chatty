export interface FileMetadata {
  path: string;
  name: string;
  size: number;
  mime: string;
  version: number;
  timestamp: string;
  updatedAt?: string;
  uploaderId: string;
  uploaderName: string;
  uploaderAvatar?: string;
  objectKey: string;
  isDirectory?: boolean;
  children?: string[];
  lastModified?: string;
  lastModifiedBy?: string;
  isUploading?: boolean;
  uploadProgress?: number;
}

export interface FileTree {
  [path: string]: FileMetadata;
}

export interface UploadInitResponse {
  uploadUrl: string;
  uploadId: string;
  expiresAt: number;
}

export interface FileContentResponse {
  content: string;
  version: number;
  lastModified: string;
  lastModifiedBy: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
}

export interface RoomInfo {
  roomId: string;
  files: FileMetadata[];
  activeUsers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserInfo {
  id: string;
  name: string;
  avatar?: string;
  lastActive: string;
  isOnline: boolean;
}

export interface FileEvent {
  type: 'FILE_CREATED' | 'FILE_UPDATED' | 'FILE_DELETED' | 'FOLDER_CREATED';
  payload: FileMetadata;
  timestamp: string;
  userId: string;
}

export interface UserEvent {
  type: 'USER_JOINED' | 'USER_LEFT' | 'USER_ACTIVITY';
  userId: string;
  roomId: string;
  timestamp: string;
  data?: any;
}

export interface SocketAuth {
  userId: string;
  token?: string;
  roomId?: string;
}

export interface FileUploadProgress {
  uploadId: string;
  path: string;
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
}
