import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';
import { redis } from '../lib/redis';
import s3 from '../lib/s3';

// Types
type FileMetadata = {
  path: string;
  name: string;
  size: number;
  mime: string;
  version: number;
  timestamp: string;
  updatedAt?: string;
  uploaderId: string;
  objectKey: string;
  isDirectory?: boolean;
  children?: string[];
};

type FileTree = Record<string, FileMetadata>;

// Constants
const PRESIGN_EXPIRY = parseInt(process.env.PRESIGN_EXPIRY_SECONDS || '900', 10); // 15 minutes default
const MAX_UPLOAD_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || '52428800', 10); // 50MB default
const REDIS_PREFIX = process.env.REDIS_KEY_PREFIX || 'collab:files';

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
): Promise<{ uploadUrl: string; uploadId: string; expiresAt: number; objectKey: string }> {
  if (!roomId || !userId || !filePath || !fileName) {
    throw new Error('Missing required parameters');
  }

  if (fileSize > MAX_UPLOAD_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_UPLOAD_SIZE} bytes`);
  }

  // Track upload in progress
  const uploadId = crypto.randomBytes(16).toString('hex');
  const uploadKey = `upload:${roomId}:${uploadId}`;
  
  try {
    // Get presigned URL for upload
    const { uploadUrl, objectKey, expiresAt } = await s3.getUploadUrl(
      roomId,
      path.dirname(filePath),
      path.basename(fileName),
      mimeType
    );

    // Store upload metadata in Redis with a TTL
    await redis.hset(uploadKey, {
      roomId,
      userId,
      filePath,
      fileName,
      fileSize,
      mimeType,
      objectKey,
      status: 'initiated',
      createdAt: new Date().toISOString(),
    });
    await redis.expire(uploadKey, PRESIGN_EXPIRY);

    console.log(`[${roomId}] Upload initiated: ${filePath}/${fileName} (${fileSize} bytes)`);
    
    return { uploadUrl, uploadId, expiresAt, objectKey };
  } catch (error) {
    console.error(`[${roomId}] Error initializing upload:`, error);
    throw new Error('Failed to initialize upload');
  }
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
  const uploadKey = `upload:${roomId}:${uploadId}`;
  const uploadInfo = await redis.hgetall(uploadKey);

  if (!uploadInfo || uploadInfo.status !== 'initiated') {
    throw new Error('Invalid or expired upload ID');
  }

  if (uploadInfo.userId !== userId) {
    throw new Error('Unauthorized to complete this upload');
  }

  try {
    // Verify the file exists in storage if using S3
    if (s3.useS3 && uploadInfo.objectKey) {
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: uploadInfo.objectKey,
        });
        await s3.s3Client.send(headCommand);
      } catch (error) {
        if (error.name === 'NotFound') {
          throw new Error('File not found in storage');
        }
        throw error;
      }
    }

    // Update file metadata
    const now = new Date().toISOString();
    const existingMeta = await redis.hget(`${REDIS_PREFIX}:${roomId}`, filePath);
    
    if (existingMeta && baseVersion !== undefined && existingMeta.version !== baseVersion) {
      throw new Error('File has been modified since last read');
    }

    const fileMeta: FileMetadata = {
      path: filePath,
      name: fileName,
      size: fileSize,
      mime: mimeType,
      version: existingMeta ? existingMeta.version + 1 : 1,
      timestamp: existingMeta?.timestamp || now,
      updatedAt: now,
      uploaderId: userId,
      objectKey: uploadInfo.objectKey,
    };

    // Store metadata in Redis
    await redis.hset(`${REDIS_PREFIX}:${roomId}`, filePath, fileMeta);
    
    // Update parent directory metadata
    await updateParentDirectory(roomId, filePath, userId);

    // Clean up upload tracking
    await redis.del(uploadKey);

    console.log(`[${roomId}] Upload completed: ${filePath} (v${fileMeta.version})`);
    
    return fileMeta;
  } catch (error) {
    console.error(`[${roomId}] Error completing upload:`, error);
    // Update upload status to failed
    await redis.hset(uploadKey, 'status', 'failed');
    throw new Error('Failed to complete upload: ' + error.message);
  }
}

/**
 * Update parent directory metadata when a file is added
 */
async function updateParentDirectory(roomId: string, filePath: string, userId: string) {
  const dirPath = path.dirname(filePath);
  if (dirPath === '.') return;

  const now = new Date().toISOString();
  const dirKey = `${REDIS_PREFIX}:${roomId}:${dirPath}`;
  
  // Get or create directory metadata
  let dirMeta: FileMetadata = await redis.hget(`${REDIS_PREFIX}:${roomId}`, dirPath);
  
  if (!dirMeta) {
    dirMeta = {
      path: dirPath,
      name: path.basename(dirPath),
      size: 0,
      mime: 'inode/directory',
      version: 1,
      timestamp: now,
      updatedAt: now,
      uploaderId: userId,
      objectKey: '',
      isDirectory: true,
      children: [],
    };
  } else if (!dirMeta.isDirectory) {
    throw new Error(`Cannot create directory: ${dirPath} is a file`);
  } else {
    dirMeta.version = (dirMeta.version || 0) + 1;
    dirMeta.updatedAt = now;
  }

  // Ensure children array exists
  if (!dirMeta.children) {
    dirMeta.children = [];
  }

  // Add file to parent directory if not already present
  if (!dirMeta.children.includes(filePath)) {
    dirMeta.children.push(filePath);
  }

  // Save directory metadata
  await redis.hset(`${REDIS_PREFIX}:${roomId}`, dirPath, dirMeta);
  
  // Recursively update parent directories
  if (dirPath !== '.') {
    await updateParentDirectory(roomId, dirPath, userId);
  }
}

/**
 * Get the complete file tree for a room
 */
export async function getFileTree(roomId: string): Promise<FileMetadata[]> {
  try {
    const files = await redis.hgetall(`${REDIS_PREFIX}:${roomId}`);
    return Object.values(files).sort((a, b) => 
      (a.updatedAt || a.timestamp).localeCompare(b.updatedAt || b.timestamp)
    );
  } catch (error) {
    console.error(`[${roomId}] Error getting file tree:`, error);
    return [];
  }
}

/**
 * Get download URL for a file
 */
export async function getDownloadUrl(roomId: string, filePath: string): Promise<{ downloadUrl: string; expiresAt: number }> {
  try {
    const fileMeta = await redis.hget(`${REDIS_PREFIX}:${roomId}`, filePath);
    if (!fileMeta) {
      throw new Error('File not found');
    }

    if (fileMeta.isDirectory) {
      throw new Error('Cannot download a directory');
    }

    const { downloadUrl, expiresAt } = await s3.getDownloadUrl(fileMeta.objectKey, fileMeta.name);
    return { downloadUrl, expiresAt };
  } catch (error) {
    console.error(`[${roomId}] Error getting download URL for ${filePath}:`, error);
    throw new Error('Failed to generate download URL');
  }
}

/**
 * Create a new directory
 */
export async function createDirectory(roomId: string, dirPath: string, userId: string): Promise<FileMetadata> {
  if (!dirPath) {
    throw new Error('Directory path is required');
  }

  // Check if directory already exists
  const existingMeta = await redis.hget(`${REDIS_PREFIX}:${roomId}`, dirPath);
  if (existingMeta) {
    if (existingMeta.isDirectory) {
      return existingMeta; // Directory already exists, return it
    }
    throw new Error(`A file already exists at path: ${dirPath}`);
  }

  const now = new Date().toISOString();
  const dirMeta: FileMetadata = {
    path: dirPath,
    name: path.basename(dirPath),
    size: 0,
    mime: 'inode/directory',
    version: 1,
    timestamp: now,
    updatedAt: now,
    uploaderId: userId,
    objectKey: '',
    isDirectory: true,
    children: [],
  };

  // Save directory metadata
  await redis.hset(`${REDIS_PREFIX}:${roomId}`, dirPath, dirMeta);
  
  // Update parent directory
  await updateParentDirectory(roomId, dirPath, userId);

  console.log(`[${roomId}] Directory created: ${dirPath}`);
  
  return dirMeta;
}

/**
 * Delete a file or directory
 */
export async function deletePath(roomId: string, path: string, userId: string): Promise<void> {
  const fileMeta = await redis.hget(`${REDIS_PREFIX}:${roomId}`, path);
  if (!fileMeta) {
    throw new Error('File or directory not found');
  }

  // Check permissions
  if (fileMeta.uploaderId !== userId) {
    throw new Error('You do not have permission to delete this file');
  }

  if (fileMeta.isDirectory) {
    // Recursively delete directory contents
    const children = fileMeta.children || [];
    for (const childPath of children) {
      await deletePath(roomId, childPath, userId);
    }
  } else if (fileMeta.objectKey) {
    // Delete file from storage
    try {
      await s3.deleteFile(fileMeta.objectKey);
    } catch (error) {
      console.error(`[${roomId}] Error deleting file from storage:`, error);
      // Continue with metadata deletion even if storage deletion fails
    }
  }

  // Remove from parent directory
  const parentPath = path.dirname(path);
  if (parentPath !== '.') {
    const parentMeta = await redis.hget(`${REDIS_PREFIX}:${roomId}`, parentPath);
    if (parentMeta?.isDirectory && parentMeta.children) {
      const childIndex = parentMeta.children.indexOf(path);
      if (childIndex !== -1) {
        parentMeta.children.splice(childIndex, 1);
        parentMeta.version = (parentMeta.version || 0) + 1;
        parentMeta.updatedAt = new Date().toISOString();
        await redis.hset(`${REDIS_PREFIX}:${roomId}`, parentPath, parentMeta);
      }
    }
  }

  // Delete metadata
  await redis.hdel(`${REDIS_PREFIX}:${roomId}`, path);

  console.log(`[${roomId}] Deleted: ${path}`);
}

/**
 * Get file metadata
 */
export async function getFileMetadata(roomId: string, filePath: string): Promise<FileMetadata | null> {
  return redis.hget(`${REDIS_PREFIX}:${roomId}`, filePath);
}

// Export constants
export { MAX_UPLOAD_SIZE };
