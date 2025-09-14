import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define log format for files
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: level(),
    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    } as winston.transports.FileTransportOptions),
    // Combined log file
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    } as winston.transports.FileTransportOptions),
    // Daily rotate file for production
    new DailyRotateFile({
      filename: path.join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports,
  exitOnError: false,
  defaultMeta: { service: 'auxeira-backend' },
});

// Create specialized logging functions
export const loggers = {
  // HTTP request logging
  http: (message: string, meta?: any) => {
    logger.http(message, meta);
  },

  // Authentication logging
  auth: (message: string, meta?: any) => {
    logger.info(`[AUTH] ${message}`, meta);
  },

  // Database logging
  database: (message: string, meta?: any) => {
    logger.info(`[DATABASE] ${message}`, meta);
  },

  // SSE scoring logging
  sse: (message: string, meta?: any) => {
    logger.info(`[SSE] ${message}`, meta);
  },

  // AI mentorship logging
  ai: (message: string, meta?: any) => {
    logger.info(`[AI] ${message}`, meta);
  },

  // Security logging
  security: (message: string, meta?: any) => {
    logger.warn(`[SECURITY] ${message}`, meta);
  },

  // Performance logging
  performance: (message: string, meta?: any) => {
    logger.info(`[PERFORMANCE] ${message}`, meta);
  },

  // Error logging with context
  errorWithContext: (error: Error, context: string, meta?: any) => {
    logger.error(`[${context}] ${error.message}`, {
      error: error.message,
      stack: error.stack,
      context,
      ...meta,
    });
  },
};

// Performance timing helper
export const performanceTimer = (label: string) => {
  const start = Date.now();
  return {
    end: (meta?: any) => {
      const duration = Date.now() - start;
      loggers.performance(`${label} completed in ${duration}ms`, {
        duration,
        label,
        ...meta,
      });
      return duration;
    },
  };
};

// Request logging middleware helper
export const createRequestLogger = () => {
  return (req: any, res: any, next: any) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { method, url, ip } = req;
      const { statusCode } = res;

      loggers.http(`${method} ${url}`, {
        method,
        url,
        statusCode,
        duration,
        ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.userId,
      });
    });

    next();
  };
};

// Error logging helper
export const logError = (error: Error, context?: string, meta?: any) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context: context || 'Unknown',
    timestamp: new Date().toISOString(),
    ...meta,
  };

  logger.error('Application error occurred', errorInfo);
};

// Success logging helper
export const logSuccess = (message: string, meta?: any) => {
  logger.info(`✅ ${message}`, meta);
};

// Warning logging helper
export const logWarning = (message: string, meta?: any) => {
  logger.warn(`⚠️ ${message}`, meta);
};

// Debug logging helper (only in development)
export const logDebug = (message: string, meta?: any) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`🐛 ${message}`, meta);
  }
};

// Startup logging
export const logStartup = (port: number, environment: string) => {
  logger.info('🚀 Server startup information', {
    port,
    environment,
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

// Shutdown logging
export const logShutdown = (signal: string) => {
  logger.info('🛑 Server shutdown initiated', {
    signal,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

export { logger };
export default logger;

