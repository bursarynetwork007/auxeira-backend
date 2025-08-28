import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

class DatabaseConnection {
  private pool: Pool;
  private config: DatabaseConfig;

  constructor() {
    this.config = this.loadConfig();
    this.pool = this.createPool();
    this.setupEventHandlers();
  }

  private loadConfig(): DatabaseConfig {
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl) {
      // Parse Railway/Heroku style DATABASE_URL
      const url = new URL(databaseUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1),
        username: url.username,
        password: url.password,
        ssl: process.env.NODE_ENV === 'production',
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
      };
    }

    // Fallback to individual environment variables
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'auxeira_db',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: process.env.NODE_ENV === 'production',
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
    };
  }

  private createPool(): Pool {
    const poolConfig: PoolConfig = {
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      max: this.config.maxConnections,
      idleTimeoutMillis: this.config.idleTimeoutMillis,
      connectionTimeoutMillis: this.config.connectionTimeoutMillis,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
    };

    return new Pool(poolConfig);
  }

  private setupEventHandlers(): void {
    this.pool.on('connect', (client) => {
      logger.info('New database client connected', {
        processId: client.processID,
        database: this.config.database,
      });
    });

    this.pool.on('error', (err, client) => {
      logger.error('Database pool error', {
        error: err.message,
        stack: err.stack,
        processId: client?.processID,
      });
    });
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      logger.debug('Database query executed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: result.rowCount,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Database query failed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
        params: params ? JSON.stringify(params).substring(0, 200) : undefined,
      });
      throw error;
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW() as current_time, version() as version');
      logger.info('Database connection test successful', {
        currentTime: result.rows[0].current_time,
        version: result.rows[0].version.split(' ')[0],
        host: this.config.host,
        database: this.config.database,
      });
      return true;
    } catch (error) {
      logger.error('Database connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        host: this.config.host,
        database: this.config.database,
      });
      return false;
    }
  }

  public async close(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('Database pool closed successfully');
    } catch (error) {
      logger.error('Error closing database pool', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// Singleton instance
export const database = new DatabaseConnection();
export default database;
