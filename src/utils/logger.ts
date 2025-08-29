import winston from 'winston';
import path from 'path';

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

// Define different log formats
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: level(),
    format: logFormat,
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: jsonFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: jsonFormat,
  transports,
  exitOnError: false,
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
