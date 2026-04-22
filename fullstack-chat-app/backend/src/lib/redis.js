import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = null;
    this.connected = false;
    this.useRedis = !!process.env.REDIS_URL;
    this.prefix = process.env.REDIS_KEY_PREFIX || 'collab:files';
    this.inMemoryStore = new Map();
    this.subscribers = new Map();
    
    if (this.useRedis) {
      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 5) {
              console.warn('Max Redis reconnection attempts reached, falling back to in-memory');
              this.useRedis = false;
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 5000);
          },
        },
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis');
        this.connected = true;
      });

      this.client.on('end', () => {
        console.log('Redis connection closed');
        this.connected = false;
      });

      // Promisify methods
      this.getAsync = promisify(this.client.get).bind(this.client);
      this.setAsync = promisify(this.client.set).bind(this.client);
      this.delAsync = promisify(this.client.del).bind(this.client);
      this.hgetAsync = promisify(this.client.hget).bind(this.client);
      this.hsetAsync = promisify(this.client.hset).bind(this.client);
      this.hdelAsync = promisify(this.client.hdel).bind(this.client);
      this.hgetallAsync = promisify(this.client.hgetall).bind(this.client);
      this.publishAsync = promisify(this.client.publish).bind(this.client);
      this.incrAsync = promisify(this.client.incr).bind(this.client);
      this.decrAsync = promisify(this.client.decr).bind(this.client);
    } else {
      console.warn('Redis not configured, using in-memory store (not suitable for production with multiple instances)');
    }
  }

  async connect() {
    if (this.client && !this.connected) {
      try {
        await this.client.connect();
        this.connected = true;
      } catch (err) {
        console.error('Failed to connect to Redis:', err);
        this.connected = false;
      }
    }
    return this.connected;
  }

  async disconnect() {
    if (this.client && this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }

  // Key management
  _getKey(roomId, path = '') {
    return path 
      ? `${this.prefix}:${roomId}:${path}`
      : `${this.prefix}:${roomId}`;
  }

  // Hash operations
  async hset(roomId, field, value) {
    const key = this._getKey(roomId);
    if (this.useRedis && this.connected) {
      return this.hsetAsync(key, field, JSON.stringify(value));
    }
    
    // In-memory fallback
    if (!this.inMemoryStore.has(key)) {
      this.inMemoryStore.set(key, new Map());
    }
    this.inMemoryStore.get(key).set(field, value);
    return 1;
  }

  async hget(roomId, field) {
    const key = this._getKey(roomId);
    if (this.useRedis && this.connected) {
      const result = await this.hgetAsync(key, field);
      return result ? JSON.parse(result) : null;
    }
    
    // In-memory fallback
    return this.inMemoryStore.get(key)?.get(field) || null;
  }

  async hgetall(roomId) {
    const key = this._getKey(roomId);
    if (this.useRedis && this.connected) {
      const result = await this.hgetallAsync(key);
      if (!result) return {};
      
      const parsed = {};
      for (const [k, v] of Object.entries(result)) {
        try {
          parsed[k] = JSON.parse(v);
        } catch (e) {
          parsed[k] = v;
        }
      }
      return parsed;
    }
    
    // In-memory fallback
    const map = this.inMemoryStore.get(key);
    return map ? Object.fromEntries(map) : {};
  }

  async hdel(roomId, ...fields) {
    const key = this._getKey(roomId);
    if (this.useRedis && this.connected) {
      return this.hdelAsync(key, ...fields);
    }
    
    // In-memory fallback
    if (this.inMemoryStore.has(key)) {
      const map = this.inMemoryStore.get(key);
      let count = 0;
      for (const field of fields) {
        if (map.delete(field)) count++;
      }
      return count;
    }
    return 0;
  }

  // Pub/sub
  async subscribe(channel, callback) {
    if (this.useRedis && this.connected) {
      const subscriber = this.client.duplicate();
      await subscriber.connect();
      await subscriber.subscribe(channel, (message) => {
        try {
          callback(JSON.parse(message));
        } catch (e) {
          console.error('Error parsing pub/sub message:', e);
        }
      });
      
      // Store reference to subscriber for cleanup
      if (!this.subscribers.has(channel)) {
        this.subscribers.set(channel, new Set());
      }
      this.subscribers.get(channel).add(subscriber);
      
      return () => {
        subscriber.unsubscribe();
        subscriber.quit();
        this.subscribers.get(channel)?.delete(subscriber);
      };
    }
    
    // In-memory pub/sub simulation (single instance only)
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel).add(callback);
    
    return () => {
      this.subscribers.get(channel)?.delete(callback);
    };
  }

  async publish(channel, message) {
    if (this.useRedis && this.connected) {
      return this.publishAsync(channel, JSON.stringify(message));
    }
    
    // In-memory pub/sub simulation (single instance only)
    const subscribers = this.subscribers.get(channel) || [];
    for (const subscriber of subscribers) {
      if (typeof subscriber === 'function') {
        subscriber(JSON.parse(JSON.stringify(message)));
      }
    }
    return subscribers.size;
  }

  // Connection tracking
  async trackConnection(roomId, userId) {
    const key = `${this.prefix}:connections:${roomId}:${userId}`;
    if (this.useRedis && this.connected) {
      const count = await this.incrAsync(key);
      await this.client.expire(key, 86400); // Expire after 24h
      return count;
    }
    
    // In-memory fallback
    const count = (this.inMemoryStore.get(key) || 0) + 1;
    this.inMemoryStore.set(key, count);
    return count;
  }

  async releaseConnection(roomId, userId) {
    const key = `${this.prefix}:connections:${roomId}:${userId}`;
    if (this.useRedis && this.connected) {
      const count = await this.decrAsync(key);
      if (count <= 0) {
        await this.delAsync(key);
      }
      return Math.max(0, count);
    }
    
    // In-memory fallback
    const count = (this.inMemoryStore.get(key) || 1) - 1;
    if (count <= 0) {
      this.inMemoryStore.delete(key);
      return 0;
    }
    this.inMemoryStore.set(key, count);
    return count;
  }
}

// Singleton instance
export const redis = new RedisClient();

// Initialize connection
redis.connect().catch(console.error);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await redis.disconnect();
  process.exit(0);
});
