import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { redis } from './redis.js';

// Configuration
const BUCKET_NAME = process.env.S3_BUCKET || 'collab-files';
const PRESIGN_EXPIRY = parseInt(process.env.PRESIGN_EXPIRY_SECONDS || '900', 10); // 15 minutes default
const MAX_UPLOAD_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || '52428800', 10); // 50MB default

// Initialize S3 client if credentials are available
let s3Client = null;
let useS3 = false;

if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
  const s3Config = {
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  };

  // Configure custom endpoint for MinIO or other S3-compatible services
  if (process.env.S3_ENDPOINT) {
    s3Config.endpoint = process.env.S3_ENDPOINT;
    s3Config.forcePathStyle = true; // Required for MinIO and some other S3-compatible services
    s3Config.sslEnabled = process.env.S3_SSL !== 'false';
  }

  s3Client = new S3Client(s3Config);
  useS3 = true;
  console.log('S3 client initialized with bucket:', BUCKET_NAME);
} else {
  console.warn('S3 credentials not found. File uploads will be stored in memory only (not suitable for production).');
}

// In-memory file store for when S3 is not available
const inMemoryStore = new Map();

/**
 * Generate a unique object key for storage
 */
function generateObjectKey(roomId, filePath, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const baseName = path.basename(fileName, ext);
  const uniqueId = uuidv4().substring(0, 8);
  const safeFileName = `${baseName.replace(/[^a-z0-9-]/gi, '_').toLowerCase()}-${uniqueId}${ext}`;
  
  // Sanitize path to prevent directory traversal
  const safePath = path.normalize(filePath)
    .replace(/^(\/|\\)+/, '') // Remove leading slashes
    .replace(/\.\.(\/|\\)/g, '') // Remove ../
    .replace(/\/\//g, '/') // Normalize slashes
    .replace(/\/+/g, '/');
    
  return `collab/${roomId}/${safePath ? safePath + '/' : ''}${safeFileName}`.replace(/\/\//g, '/');
}

/**
 * Generate a presigned URL for uploading a file
 */
export async function getUploadUrl(roomId, filePath, fileName, mimeType) {
  const objectKey = generateObjectKey(roomId, filePath, fileName);
  const uploadId = uuidv4();
  
  if (useS3 && s3Client) {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
      ContentType: mimeType,
      Metadata: {
        'x-uploader-id': 'system', // Will be updated when upload is completed
        'x-room-id': roomId,
        'x-file-path': filePath,
        'x-original-name': fileName,
        'x-upload-id': uploadId,
      },
    });

    try {
      const url = await getSignedUrl(s3Client, command, { expiresIn: PRESIGN_EXPIRY });
      return {
        uploadUrl: url,
        uploadId,
        objectKey,
        expiresAt: Math.floor(Date.now() / 1000) + PRESIGN_EXPIRY,
      };
    } catch (error) {
      console.error('Error generating S3 presigned URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }
  
  // Fallback to in-memory upload
  const uploadUrl = `/api/collab/${roomId}/upload?uploadId=${uploadId}&path=${encodeURIComponent(filePath)}&name=${encodeURIComponent(fileName)}`;
  return {
    uploadUrl,
    uploadId,
    objectKey,
    expiresAt: Math.floor(Date.now() / 1000) + PRESIGN_EXPIRY,
  };
}

/**
 * Generate a presigned URL for downloading a file
 */
export async function getDownloadUrl(objectKey, fileName) {
  if (!objectKey) {
    throw new Error('Object key is required');
  }

  if (useS3 && s3Client) {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
    });

    try {
      const url = await getSignedUrl(s3Client, command, { expiresIn: PRESIGN_EXPIRY });
      return {
        downloadUrl: url,
        expiresAt: Math.floor(Date.now() / 1000) + PRESIGN_EXPIRY,
      };
    } catch (error) {
      console.error('Error generating download URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }
  
  // Fallback to in-memory download
  const fileId = objectKey.split('/').pop();
  return {
    downloadUrl: `/api/collab/download/${fileId}`,
    expiresAt: Math.floor(Date.now() / 1000) + PRESIGN_EXPIRY,
  };
}

/**
 * Store file metadata in Redis
 */
async function storeFileMetadata(roomId, filePath, metadata) {
  const now = new Date().toISOString();
  const fileMeta = {
    ...metadata,
    path: filePath,
    name: path.basename(filePath),
    timestamp: now,
    updatedAt: now,
  };
  
  await redis.hset(`collab:files:${roomId}`, filePath, fileMeta);
  return fileMeta;
}

/**
 * Handle file upload completion
 */
export async function completeUpload(roomId, userId, uploadId, filePath, file, objectKey) {
  const now = new Date().toISOString();
  const fileMeta = {
    path: filePath,
    name: file.originalname,
    size: file.size,
    mime: file.mimetype,
    version: 1, // Will be incremented if file exists
    timestamp: now,
    updatedAt: now,
    uploaderId: userId,
    objectKey,
  };

  // Check if file already exists to handle versioning
  const existingMeta = await redis.hget(`collab:files:${roomId}`, filePath);
  if (existingMeta) {
    fileMeta.version = (existingMeta.version || 0) + 1;
    // Keep the original creation timestamp
    fileMeta.timestamp = existingMeta.timestamp;
  }

  // Store metadata in Redis
  await storeFileMetadata(roomId, filePath, fileMeta);
  
  // Publish update event
  await redis.publish(`collab:files:room:${roomId}`, {
    type: existingMeta ? 'file:updated' : 'file:created',
    roomId,
    file: fileMeta,
    timestamp: now,
  });

  return fileMeta;
}

/**
 * Get file metadata
 */
export async function getFileMetadata(roomId, filePath) {
  return redis.hget(`collab:files:${roomId}`, filePath);
}

/**
 * List all files in a room
 */
export async function listFiles(roomId) {
  const files = await redis.hgetall(`collab:files:${roomId}`);
  return Object.values(files).sort((a, b) => 
    new Date(b.updatedAt || b.timestamp) - new Date(a.updatedAt || a.timestamp)
  );
}

/**
 * Delete a file
 */
export async function deleteFile(roomId, filePath) {
  const fileMeta = await getFileMetadata(roomId, filePath);
  if (!fileMeta) {
    throw new Error('File not found');
  }

  // Delete from storage
  if (useS3 && s3Client && fileMeta.objectKey) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileMeta.objectKey,
      });
      await s3Client.send(command);
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      // Continue with metadata deletion even if S3 deletion fails
    }
  }

  // Delete metadata
  await redis.hdel(`collab:files:${roomId}`, filePath);
  
  // Publish delete event
  await redis.publish(`collab:files:room:${roomId}`, {
    type: 'file:deleted',
    roomId,
    filePath,
    timestamp: new Date().toISOString(),
  });

  return true;
}

/**
 * Handle direct file upload (for small files or when S3 is not available)
 */
export async function handleDirectUpload(roomId, userId, file, uploadId) {
  const objectKey = `inmemory/${roomId}/${uploadId}/${file.originalname}`;
  
  // Store file in memory
  inMemoryStore.set(objectKey, {
    buffer: file.buffer,
    mimetype: file.mimetype,
    originalname: file.originalname,
    size: file.size,
  });
  
  return objectKey;
}

/**
 * Get file from in-memory store
 */
export function getInMemoryFile(objectKey) {
  return inMemoryStore.get(objectKey);
}

export default {
  getUploadUrl,
  getDownloadUrl,
  completeUpload,
  getFileMetadata,
  listFiles,
  deleteFile,
  handleDirectUpload,
  getInMemoryFile,
  MAX_UPLOAD_SIZE,
  useS3,
};
