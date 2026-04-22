import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { createClient, RedisClientType } from 'redis';
import path from 'path';
import { Server as SocketIO } from 'socket.io';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// Structured logging interface
interface Logger {
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}

// Default console logger
class ConsoleLogger implements Logger {
  private log(level: LogLevel, message: string, meta: Record<string, any> = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };
    console[level](JSON.stringify(logEntry));
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, any>): void {
    this.log('error', message, meta);
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, meta);
    }
  }
}

// File metadata type
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

type FileTree = Record<string, FileMetadata>;

// Metrics collection
interface Metrics {
  uploads: { total: number; failed: number };
  deletes: { total: number; failed: number };
  errors: { redis: number; s3: number; validation: number };
}

export class CollabFileService {
  public logger: Logger;
  
  private s3Client: S3Client | null = null;
  private redisClient: RedisClientType | null = null;
  private redisPublisher: RedisClientType | null = null;
  private inMemoryStore: Record<string, FileTree> = {};
  private localPubSub: Record<string, Array<(message: string) => void>> = {};
  private metrics: Metrics = {
    uploads: { total: 0, failed: 0 },
    deletes: { total: 0, failed: 0 },
    errors: { redis: 0, s3: 0, validation: 0 },
  };
  private socketIO?: SocketIO;

  constructor(private config: {
    s3Config?: {
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
      bucket: string;
    };
    redisUrl?: string;
    logger?: Logger;
    socketIO?: SocketIO;
  }) {
    this.logger = config.logger || new ConsoleLogger();
    this.socketIO = config.socketIO;
    this.initializeS3();
    this.initializeRedis();
  }

  private initializeS3() {
    if (!this.config.s3Config) {
      this.logger.warn('S3 configuration not provided, file storage will be in-memory only');
      return;
    }

    try {
      this.s3Client = new S3Client({
        region: this.config.s3Config.region,
        credentials: {
          accessKeyId: this.config.s3Config.accessKeyId,
          secretAccessKey: this.config.s3Config.secretAccessKey,
        },
        maxAttempts: 3,
      });
      this.logger.info('S3 client initialized', { region: this.config.s3Config.region });
    } catch (error) {
      this.logger.error('Failed to initialize S3 client', { error: (error as Error).message });
    }
  }

  private async initializeRedis() {
    if (!this.config.redisUrl) {
      this.logger.warn('Redis URL not provided, using in-memory store and pub/sub');
      return;
    }

    try {
      this.redisClient = createClient({
        url: this.config.redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 5) {
              this.logger.error('Max Redis reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 5000);
          },
        },
      }) as RedisClientType;

      this.redisPublisher = this.redisClient.duplicate() as RedisClientType;

      this.redisClient.on('error', (err) => {
        this.metrics.errors.redis++;
        this.logger.error('Redis client error', { error: err.message });
      });

      await Promise.all([
        this.redisClient.connect(),
        this.redisPublisher.connect(),
      ]);

      this.logger.info('Redis client connected');
    } catch (error) {
      this.logger.error('Failed to connect to Redis', { error: (error as Error).message });
    }
  }

  private async publish(channel: string, message: string): Promise<void> {
    if (this.redisPublisher) {
      await this.redisPublisher.publish(channel, message);
    } else if (this.localPubSub[channel]) {
      this.localPubSub[channel].forEach(cb => cb(message));
    }
  }

  private subscribe(channel: string, callback: (message: string) => void): () => void {
    if (this.redisClient) {
      this.redisClient.subscribe(channel, callback).catch(err => {
        this.logger.error('Redis subscribe error', { channel, error: err.message });
      });
      
      return () => {
        this.redisClient?.unsubscribe(channel, callback).catch(console.error);
      };
    } else {
      if (!this.localPubSub[channel]) this.localPubSub[channel] = [];
      this.localPubSub[channel].push(callback);
      
      return () => {
        const index = this.localPubSub[channel]?.indexOf(callback);
        if (index !== -1) this.localPubSub[channel].splice(index, 1);
      };
    }
  }

  // ... rest of the implementation will continue in the next part ...
}

// Export a singleton instance
export const collabFileService = new CollabFileService({
  s3Config: process.env.S3_ACCESS_KEY_ID ? {
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    bucket: process.env.S3_BUCKET || 'collab-uploads',
  } : undefined,
  redisUrl: process.env.REDIS_URL,
});
