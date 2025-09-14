import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

interface AppConfig {
  // Server configuration
  port: number;
  nodeEnv: 'development' | 'production' | 'test';

  // Database configuration
  database: {
    url: string;
    maxConnections: number;
    idleTimeout: number;
    connectionTimeout: number;
  };

  // Redis configuration
  redis: {
    url?: string;
    host: string;
    port: number;
    password?: string;
    db: number;
  };

  // JWT configuration
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };

  // Security configuration
  security: {
    bcryptRounds: number;
    rateLimitWindow: number;
    rateLimitMax: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };

  // External services
  services: {
    openai: {
      apiKey: string;
      model: string;
      maxTokens: number;
    };
    stripe: {
      secretKey: string;
      webhookSecret: string;
    };
    email: {
      service: string;
      user: string;
      password: string;
      from: string;
    };
    recaptcha: {
      secretKey: string;
    };
  };

  // Application settings
  app: {
    frontendUrl: string;
    backendUrl: string;
    supportEmail: string;
    companyName: string;
  };
}

class ConfigManager {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  private loadConfiguration(): AppConfig {
    return {
      // Server configuration
      port: parseInt(process.env.PORT || '3000'),
      nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',

      // Database configuration
      database: {
        url: process.env.DATABASE_URL || 'postgresql://localhost:5432/auxeira_db',
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
      },

      // Redis configuration
      redis: {
        url: process.env.REDIS_URL,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
      },

      // JWT configuration
      jwt: {
        secret: process.env.JWT_SECRET || 'auxeira_super_secret_jwt_key_2025',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      },

      // Security configuration
      security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900'), // 15 minutes
      },

      // External services
      services: {
        openai: {
          apiKey: process.env.OPENAI_API_KEY || '',
          model: process.env.OPENAI_MODEL || 'gpt-4',
          maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
        },
        stripe: {
          secretKey: process.env.STRIPE_SECRET_KEY || '',
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
        },
        email: {
          service: process.env.EMAIL_SERVICE || 'gmail',
          user: process.env.EMAIL_USER || '',
          password: process.env.EMAIL_PASSWORD || '',
          from: process.env.EMAIL_FROM || 'noreply@auxeira.com',
        },
        recaptcha: {
          secretKey: process.env.RECAPTCHA_SECRET_KEY || '',
        },
      },

      // Application settings
      app: {
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
        backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@auxeira.com',
        companyName: process.env.COMPANY_NAME || 'Auxeira',
      },
    };
  }

  private validateConfiguration(): void {
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      logger.error('Missing required environment variables', {
        missingVars,
        nodeEnv: this.config.nodeEnv,
      });

      if (this.config.nodeEnv === 'production') {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      } else {
        logger.warn('Using default values for missing environment variables in development mode');
      }
    }

    // Validate configuration values
    if (this.config.port < 1 || this.config.port > 65535) {
      throw new Error('Invalid port number. Must be between 1 and 65535.');
    }

    if (this.config.security.bcryptRounds < 10 || this.config.security.bcryptRounds > 15) {
      logger.warn('bcrypt rounds should be between 10 and 15 for optimal security/performance balance');
    }

    logger.info('Configuration loaded successfully', {
      nodeEnv: this.config.nodeEnv,
      port: this.config.port,
      databaseConfigured: !!this.config.database.url,
      redisConfigured: !!(this.config.redis.url || this.config.redis.host),
      openaiConfigured: !!this.config.services.openai.apiKey,
      stripeConfigured: !!this.config.services.stripe.secretKey,
    });
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  public isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }

  public getPort(): number {
    return this.config.port;
  }

  public getDatabaseUrl(): string {
    return this.config.database.url;
  }

  public getJwtSecret(): string {
    return this.config.jwt.secret;
  }

  public getOpenAIApiKey(): string {
    return this.config.services.openai.apiKey;
  }

  public getFrontendUrl(): string {
    return this.config.app.frontendUrl;
  }

  public getBackendUrl(): string {
    return this.config.app.backendUrl;
  }
}

// Singleton instance
export const configManager = new ConfigManager();
export const config = configManager.getConfig();
export default configManager;