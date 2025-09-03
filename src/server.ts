import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { config } from 'dotenv';
import { migrations } from './database/migrations';
import { pool, redisClient } from './config/database';
import { logger, loggers, logStartup, logShutdown, createRequestLogger } from './utils/logger';

// Import routes
import authRoutes from './routes/auth';
import sseRoutes from './routes/sse';
import kpiRoutes from './routes/kpi';

// Load environment variables
config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://auxeira.com',
      'https://www.auxeira.com',
      // Add your frontend domains here
    ];

    // In development, allow all origins
    if (NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(createRequestLogger());

// Global rate limiting
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 1000 : 10000, // Limit each IP to 1000 requests per windowMs in production
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    error: 'RATE_LIMIT_EXCEEDED',
    code: 'GLOBAL_RATE_LIMIT',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health' || req.path === '/',
});

app.use(globalRateLimit);

// Health check endpoint (before authentication)
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbCheck = await pool.query('SELECT 1');
    const dbHealthy = dbCheck.rows.length > 0;

    // Check Redis connection
    let redisHealthy = false;
    try {
      await redisClient.ping();
      redisHealthy = true;
    } catch (error) {
      loggers.errorWithContext(error as Error, 'REDIS_HEALTH_CHECK');
    }

    const healthStatus = {
      success: true,
      message: 'Auxeira SSE Backend is healthy',
      service: 'auxeira-backend',
      version: '1.0.0',
      environment: NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        connected: dbHealthy,
      },
      redis: {
        status: redisHealthy ? 'healthy' : 'unhealthy',
        connected: redisHealthy,
      },
      features: {
        authentication: true,
        sseScoring: true,
        dailyQuestions: true,
        behaviorTracking: true,
        analytics: true,
        aiMentorship: false, // Will be true when AI features are added
      },
    };

    const statusCode = dbHealthy && redisHealthy ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    loggers.errorWithContext(error as Error, 'HEALTH_CHECK');
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      error: 'HEALTH_CHECK_FAILED',
      timestamp: new Date().toISOString(),
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Auxeira SSE Backend Running v1.0.0',
    service: 'auxeira-backend',
    version: '1.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    documentation: {
      authentication: '/api/auth',
      sseScoring: '/api/sse',
      kpiDashboard: '/api/kpi',
      health: '/health',
    },
    features: [
      'User Authentication & Authorization',
      'SSE Scoring Engine (25+ metrics)',
      'Daily Questions & Behavioral Tracking',
      'Real-time Analytics & Insights',
      'Gamification & Achievements',
      'Goal Setting & Progress Tracking',
      'Benchmarking & Leaderboards',
    ],
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sse', sseRoutes);
app.use('/api/kpi', kpiRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  loggers.http(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'NOT_FOUND',
    code: 'ROUTE_NOT_FOUND',
    availableRoutes: {
      authentication: '/api/auth',
      sseScoring: '/api/sse',
      kpiDashboard: '/api/kpi',
      health: '/health',
    },
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  loggers.errorWithContext(error, 'GLOBAL_ERROR_HANDLER', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: 'VALIDATION_ERROR',
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access',
      error: 'UNAUTHORIZED',
      timestamp: new Date().toISOString(),
    });
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large',
      error: 'FILE_TOO_LARGE',
      timestamp: new Date().toISOString(),
    });
  }

  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const message = NODE_ENV === 'production'
    ? 'Internal server error'
    : error.message || 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    message,
    error: 'INTERNAL_ERROR',
    ...(NODE_ENV === 'development' && { stack: error.stack }),
    timestamp: new Date().toISOString(),
  });

  return; // Fix: Add return statement
});

// Graceful shutdown handler
let gracefulShutdown = (signal: string) => {
  logShutdown(signal);

  const server = app.listen(PORT, () => {
    // This will be replaced by the actual server instance
  });

  server.close(async () => {
    loggers.database('Closing database connections...');

    try {
      // Close database pool
      await pool.end();
      loggers.database('Database pool closed');
    } catch (error) {
      loggers.errorWithContext(error as Error, 'DATABASE_SHUTDOWN');
    }

    try {
      // Close Redis connection
      await redisClient.quit();
      loggers.database('Redis connection closed');
    } catch (error) {
      loggers.errorWithContext(error as Error, 'REDIS_SHUTDOWN');
    }

    loggers.database('Graceful shutdown completed');
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    loggers.errorWithContext(new Error('Forced shutdown'), 'SHUTDOWN_TIMEOUT');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  loggers.errorWithContext(error, 'UNCAUGHT_EXCEPTION');
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  loggers.errorWithContext(
    new Error(`Unhandled Rejection: ${reason}`),
    'UNHANDLED_REJECTION',
    { promise }
  );
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Initialize database and start server
async function startServer() {
  try {
    loggers.database('Initializing Auxeira SSE Backend...');

    // Run database migrations
    loggers.database('Running database migrations...');
    await migrations.runMigrations();
    loggers.database('Database migrations completed successfully');

    // Test database connection
    const dbTest = await pool.query('SELECT NOW() as current_time');
    loggers.database('Database connection verified', {
      currentTime: dbTest.rows[0].current_time,
    });

    // Test Redis connection
    try {
      await redisClient.ping();
      loggers.database('Redis connection verified');
    } catch (error) {
      loggers.errorWithContext(error as Error, 'REDIS_CONNECTION_TEST');
      // Continue without Redis if it's not available
    }

    // Start the server
    const server = app.listen(PORT, '0.0.0.0', () => {
      logStartup(PORT as number, NODE_ENV);

      loggers.database('🚀 Auxeira SSE Backend started successfully!', {
        port: PORT,
        environment: NODE_ENV,
        features: {
          authentication: '✅ Ready',
          sseScoring: '✅ Ready',
          dailyQuestions: '✅ Ready',
          behaviorTracking: '✅ Ready',
          analytics: '✅ Ready',
          database: '✅ Connected',
          redis: '✅ Connected',
        },
        endpoints: {
          health: `http://localhost:${PORT}/health`,
          auth: `http://localhost:${PORT}/api/auth`,
          sse: `http://localhost:${PORT}/api/sse`,
          kpi: `http://localhost:${PORT}/api/kpi`,
        },
      });
    });

    // Update graceful shutdown to use the actual server instance
    const originalGracefulShutdown = gracefulShutdown;
    gracefulShutdown = (signal: string) => {
      logShutdown(signal);

      server.close(async () => {
        loggers.database('Closing database connections...');

        try {
          await pool.end();
          loggers.database('Database pool closed');
        } catch (error) {
          loggers.errorWithContext(error as Error, 'DATABASE_SHUTDOWN');
        }

        try {
          await redisClient.quit();
          loggers.database('Redis connection closed');
        } catch (error) {
          loggers.errorWithContext(error as Error, 'REDIS_SHUTDOWN');
        }

        loggers.database('Graceful shutdown completed');
        process.exit(0);
      });

      setTimeout(() => {
        loggers.errorWithContext(new Error('Forced shutdown'), 'SHUTDOWN_TIMEOUT');
        process.exit(1);
      }, 30000);
    };

    return server;
  } catch (error) {
    loggers.errorWithContext(error as Error, 'SERVER_STARTUP');

    // Log startup failure details
    loggers.database('❌ Failed to start Auxeira SSE Backend', {
      error: (error as Error).message,
      stack: (error as Error).stack,
      environment: NODE_ENV,
      port: PORT,
    });

    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer().catch((error) => {
    loggers.errorWithContext(error, 'SERVER_STARTUP_CATCH');
    process.exit(1);
  });
}

export default app;
export { startServer };