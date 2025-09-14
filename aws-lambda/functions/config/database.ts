import { Pool } from 'pg';
import { createClient } from 'redis';
import { logger } from '../utils/logger';

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Redis event handlers
redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis successfully');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('end', () => {
  logger.warn('Redis connection ended');
});

// PostgreSQL event handlers
pool.on('connect', () => {
  logger.info('New PostgreSQL client connected');
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error:', err);
});

// Database initialization function
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Test PostgreSQL connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    logger.info('PostgreSQL connection successful', {
      currentTime: result.rows[0].current_time,
      version: result.rows[0].pg_version.split(' ')[0]
    });
    client.release();

    // Connect to Redis
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    // Test Redis connection
    await redisClient.ping();
    logger.info('Redis connection successful');

    logger.info('All database connections initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw new Error(`Database initialization failed: ${error}`);
  }
};

// Graceful shutdown function
export const closeDatabaseConnections = async (): Promise<void> => {
  try {
    await pool.end();
    logger.info('PostgreSQL pool closed');

    if (redisClient.isOpen) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }

    logger.info('All database connections closed gracefully');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
};

// Database health check function
export const checkDatabaseHealth = async (): Promise<{
  postgresql: boolean;
  redis: boolean;
  details: any;
}> => {
  const health = {
    postgresql: false,
    redis: false,
    details: {
      postgresql: null,
      redis: null,
    }
  };

  try {
    // Check PostgreSQL
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    health.postgresql = true;
    health.details.postgresql = {
      status: 'connected',
      timestamp: result.rows[0].now,
      poolSize: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };
  } catch (error) {
    health.details.postgresql = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  try {
    // Check Redis
    if (redisClient.isOpen) {
      await redisClient.ping();
      health.redis = true;
      health.details.redis = {
        status: 'connected',
        isOpen: redisClient.isOpen,
        isReady: redisClient.isReady
      };
    } else {
      health.details.redis = {
        status: 'disconnected',
        isOpen: false,
        isReady: false
      };
    }
  } catch (error) {
    health.details.redis = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  return health;
};

// Cache helper functions
export const cacheHelpers = {
  async get(key: string): Promise<string | null> {
    try {
      return await redisClient.get(key);
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (ttlSeconds) {
        await redisClient.setEx(key, ttlSeconds, value);
      } else {
        await redisClient.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }
};

export { pool, redisClient };