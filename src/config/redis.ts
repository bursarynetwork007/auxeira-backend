import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  maxRetriesPerRequest: number;
  retryDelayOnFailover: number;
  enableReadyCheck: boolean;
  lazyConnect: boolean;
}

class RedisConnection {
  private client: RedisClientType;
  private config: RedisConfig;
  private isConnected: boolean = false;

  constructor() {
    this.config = this.loadConfig();
    this.client = this.createClient();
    this.setupEventHandlers();
  }

  private loadConfig(): RedisConfig {
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      // Parse Redis URL (Railway/Heroku style)
      const url = new URL(redisUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: url.password || undefined,
        db: parseInt(process.env.REDIS_DB || '0'),
        maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
        retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
        enableReadyCheck: true,
        lazyConnect: true,
      };
    }

    // Fallback to individual environment variables
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
      enableReadyCheck: true,
      lazyConnect: true,
    };
  }

  private createClient(): RedisClientType {
    const clientConfig = {
      socket: {
        host: this.config.host,
        port: this.config.port,
        reconnectStrategy: (retries: number) => {
          if (retries > this.config.maxRetriesPerRequest) {
            logger.error('Redis max retries exceeded, giving up');
            return false;
          }
          const delay = Math.min(retries * this.config.retryDelayOnFailover, 3000);
          logger.warn(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        },
      },
      password: this.config.password,
      database: this.config.db,
    };

    return createClient(clientConfig);
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connecting', {
        host: this.config.host,
        port: this.config.port,
        db: this.config.db,
      });
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      logger.info('Redis client ready', {
        host: this.config.host,
        port: this.config.port,
        db: this.config.db,
      });
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.error('Redis client error', {
        error: error.message,
        stack: error.stack,
        host: this.config.host,
        port: this.config.port,
      });
    });

    this.client.on('end', () => {
      this.isConnected = false;
      logger.info('Redis client connection ended');
    });
  }

  public async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect();
        logger.info('Redis connection established successfully');
      }
    } catch (error) {
      logger.error('Failed to connect to Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
        host: this.config.host,
        port: this.config.port,
      });
      throw error;
    }
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  public isReady(): boolean {
    return this.isConnected;
  }

  // Cache operations
  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      logger.debug('Redis SET operation', { key, ttl: ttlSeconds });
    } catch (error) {
      logger.error('Redis SET operation failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async get(key: string): Promise<string | null> {
    try {
      const value = await this.client.get(key);
      logger.debug('Redis GET operation', { key, found: !!value });
      return value;
    } catch (error) {
      logger.error('Redis GET operation failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.client.ping();
      logger.info('Redis connection test successful', {
        host: this.config.host,
        port: this.config.port,
        db: this.config.db,
      });
      return true;
    } catch (error) {
      logger.error('Redis connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        host: this.config.host,
        port: this.config.port,
      });
      return false;
    }
  }
}

// Singleton instance
export const redis = new RedisConnection();
export default redis;