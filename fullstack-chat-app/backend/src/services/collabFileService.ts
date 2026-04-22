import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { promisify } from 'util';
import { createClient } from 'redis';
import path from 'path';

type FileMetadata = {
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
};

type FileTree = Record<string, FileMetadata>;

// Configuration
const PRESIGN_EXPIRY = parseInt(process.env.FILE_UPLOAD_EXPIRY || '3600', 10);
const MAX_UPLOAD_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || '104857600', 10); // 100MB default
const USE_REDIS = !!process.env.REDIS_URL;
const USE_S3 = !!(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);

// Initialize S3 client if credentials are available
const s3Client = USE_S3 ? new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
}) : null;

// Initialize Redis client if available
let redisClient: any = null;
if (USE_REDIS) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
  });
  redisClient.on('error', (err: Error) => console.error('Redis Client Error', err));
  redisClient.connect().catch(console.error);
}

// In-memory store for when Redis is not available
const inMemoryStore: Record<string, FileTree> = {};

/**
 * Generate a unique object key for S3 storage
 */
function generateObjectKey(roomId: string, filePath: string, fileName: string): string {
  const timestamp = Date.now();
  const hash = crypto.createHash('md5').update(`${roomId}:${filePath}:${fileName}:${timestamp}`).digest('hex');
  return `collab/${roomId}/${hash}/${encodeURIComponent(path.basename(fileName))}`;
}

/**
 * Initialize a file upload and return a presigned URL
 */
export async function initUpload(
  roomId: string,
  userId: string,
  filePath: string,
  fileName: string,
  fileSize: number,
  mimeType: string
): Promise<{ uploadUrl: string; uploadId: string; expiresAt: number }> {
  if (fileSize > MAX_UPLOAD_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_UPLOAD_SIZE} bytes`);
  }

  const uploadId = crypto.randomUUID();
  const objectKey = generateObjectKey(roomId, filePath, fileName);
  const expiresAt = Math.floor(Date.now() / 1000) + PRESIGN_EXPIRY;

  if (USE_S3) {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: objectKey,
      ContentType: mimeType,
      Metadata: {
        'x-uploader-id': userId,
        'x-room-id': roomId,
        'x-file-path': filePath,
        'x-file-name': fileName,
      },
    });

    const uploadUrl = await getSignedUrl(s3Client!, command, { expiresIn: PRESIGN_EXPIRY });
    return { uploadUrl, uploadId, expiresAt };
  }

  // Fallback to server upload
  const uploadUrl = `/api/collab/${roomId}/upload?uploadId=${uploadId}&path=${encodeURIComponent(filePath)}&name=${encodeURIComponent(fileName)}`;
  return { uploadUrl, uploadId, expiresAt };
}

/**
 * Complete a file upload and update metadata
 */
export async function completeUpload(
  roomId: string,
  userId: string,
  uploadId: string,
  filePath: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  baseVersion?: number
): Promise<FileMetadata> {
  const timestamp = new Date().toISOString();
  const objectKey = generateObjectKey(roomId, filePath, fileName);
  
  const fileMetadata: FileMetadata = {
    path: filePath,
    name: fileName,
    size: fileSize,
    mime: mimeType,
    version: (baseVersion || 0) + 1,
    timestamp,
    uploaderId: userId,
    objectKey,
  };

  await updateFileMetadata(roomId, filePath, fileMetadata);
  return fileMetadata;
}

/**
 * Get download URL for a file
 */
export async function getDownloadUrl(roomId: string, filePath: string): Promise<string> {
  const fileTree = await getFileTree(roomId);
  const file = fileTree[filePath];
  
  if (!file) {
    throw new Error('File not found');
  }

  if (USE_S3) {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: file.objectKey,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(file.name)}"`,
    });
    return getSignedUrl(s3Client!, command, { expiresIn: 3600 });
  }

  // Fallback to server download
  return `/api/collab/${roomId}/download?path=${encodeURIComponent(filePath)}`;
}

/**
 * Get the complete file tree for a room
 */
export async function getFileTree(roomId: string): Promise<FileTree> {
  if (USE_REDIS) {
    try {
      const data = await redisClient.get(`collab:files:${roomId}`);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error reading from Redis, falling back to in-memory store', error);
      return inMemoryStore[roomId] || {};
    }
  }
  return inMemoryStore[roomId] || {};
}

/**
 * Update file metadata in the store
 */
async function updateFileMetadata(roomId: string, filePath: string, metadata: FileMetadata): Promise<void> {
  const fileTree = await getFileTree(roomId);
  fileTree[filePath] = metadata;
  
  // Update parent directory metadata
  const parentPath = path.dirname(filePath);
  if (parentPath !== '.') {
    if (!fileTree[parentPath]) {
      fileTree[parentPath] = {
        path: parentPath,
        name: path.basename(parentPath),
        size: 0,
        mime: 'inode/directory',
        version: 1,
        timestamp: new Date().toISOString(),
        uploaderId: metadata.uploaderId,
        objectKey: '',
        isDirectory: true,
        children: [filePath],
      };
    } else if (!fileTree[parentPath].children) {
      fileTree[parentPath].children = [filePath];
    } else if (!fileTree[parentPath].children!.includes(filePath)) {
      fileTree[parentPath].children!.push(filePath);
    }
  }

  // Save to store
  if (USE_REDIS) {
    try {
      await redisClient.set(`collab:files:${roomId}`, JSON.stringify(fileTree));
    } catch (error) {
      console.error('Error writing to Redis, falling back to in-memory store', error);
      inMemoryStore[roomId] = fileTree;
    }
  } else {
    inMemoryStore[roomId] = fileTree;
  }
}

/**
 * Create a new directory
 */
export async function createDirectory(
  roomId: string,
  dirPath: string,
  userId: string
): Promise<FileMetadata> {
  const timestamp = new Date().toISOString();
  const dirMetadata: FileMetadata = {
    path: dirPath,
    name: path.basename(dirPath),
    size: 0,
    mime: 'inode/directory',
    version: 1,
    timestamp,
    uploaderId: userId,
    objectKey: '',
    isDirectory: true,
    children: [],
  };

  await updateFileMetadata(roomId, dirPath, dirMetadata);
  return dirMetadata;
}

/**
 * Delete a file or directory
 */
export async function deleteFile(roomId: string, filePath: string): Promise<void> {
  const fileTree = await getFileTree(roomId);
  const file = fileTree[filePath];
  
  if (!file) {
    throw new Error('File not found');
  }

  // If it's a directory, recursively delete children
  if (file.isDirectory && file.children) {
    for (const childPath of file.children) {
      await deleteFile(roomId, childPath);
    }
  }

  // Delete from storage if it's a file
  if (!file.isDirectory && USE_S3) {
    try {
      await s3Client!.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: file.objectKey,
      }));
    } catch (error) {
      console.error('Error deleting file from S3:', error);
    }
  }

  // Remove from parent's children
  const parentPath = path.dirname(filePath);
  if (parentPath !== '.' && fileTree[parentPath]?.children) {
    const index = fileTree[parentPath].children!.indexOf(filePath);
    if (index > -1) {
      fileTree[parentPath].children!.splice(index, 1);
    }
  }

  // Remove from file tree
  delete fileTree[filePath];

  // Save updated tree
  if (USE_REDIS) {
    try {
      await redisClient.set(`collab:files:${roomId}`, JSON.stringify(fileTree));
    } catch (error) {
      console.error('Error writing to Redis, falling back to in-memory store', error);
      inMemoryStore[roomId] = fileTree;
    }
  } else {
    inMemoryStore[roomId] = fileTree;
  }
}
