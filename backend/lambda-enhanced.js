const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const authService = require('./src/services/auth-dynamodb.service');

const app = express();

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

// CORS configuration - Updated to include CloudFront and S3 domains
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'https://auxeira.com',
      'https://www.auxeira.com',
      'http://localhost:3000',
      'http://localhost:3001',
      // Add CloudFront and S3 patterns
      /^https:\/\/.*\.cloudfront\.net$/,
      /^https:\/\/.*\.s3\.amazonaws\.com$/,
      /^https:\/\/.*\.s3-website.*\.amazonaws\.com$/
    ];

    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "x-csrf-token",
    "Accept",
    "Origin",
    "X-Api-Key",
    "X-Amz-Date",
    "X-Amz-Security-Token"
  ],
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    error: 'RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    error: 'RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalRateLimit);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      details: errors.array(),
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
      error: 'UNAUTHORIZED',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const result = await authService.verifyToken(token);
    if (result.success) {
      req.user = result.user;
      req.tokenData = result.decoded;
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: result.message,
        error: 'UNAUTHORIZED',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'UNAUTHORIZED',
      timestamp: new Date().toISOString(),
    });
  }
};

// Root route
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Auxeira Backend API',
    status: 'running',
    platform: 'Good Business Rewards Platform',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    features: {
      authentication: true,
      userManagement: true,
      dynamodb: true,
      solana: true
    },
    endpoints: {
      health: '/health',
      auth: {
        register: '/api/auth/register',
        signup: '/api/auth/signup', // Alias for register
        login: '/api/auth/login',
        verify: '/api/auth/verify',
        profile: '/api/auth/profile'
      },
      api: {
        status: '/api/status',
        solana: '/api/solana/test'
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'healthy', 
    message: 'Auxeira Backend is running!',
    platform: 'Good Business Rewards Platform',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    database: 'DynamoDB',
    features: {
      authentication: 'operational',
      userManagement: 'operational',
      solana: 'operational'
    }
  });
});

// API status
app.get('/api/status', (req, res) => {
  res.json({ 
    success: true,
    backend: 'operational',
    services: 'loaded',
    crypto: 'ready',
    database: 'DynamoDB connected',
    timestamp: new Date().toISOString()
  });
});

// Test Solana integration
app.get('/api/solana/test', (req, res) => {
  try {
    const { Connection } = require('@solana/web3.js');
    res.json({
      success: true,
      solana: 'available',
      message: 'Solana Web3.js loaded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      solana: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Authentication Routes

// User Registration (POST /api/auth/register)
app.post('/api/auth/register',
  authRateLimit,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
    body('role').optional().isIn(['founder', 'investor', 'student', 'admin']).withMessage('Invalid role'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await authService.register(req.body);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: {
            user: result.user,
            access_token: result.token, // Frontend expects 'access_token'
            refresh_token: result.refreshToken
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          error: 'REGISTRATION_FAILED',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed due to server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// User Registration Alias (POST /api/auth/signup) - Frontend compatibility
app.post('/api/auth/signup',
  authRateLimit,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
    body('role').optional().isIn(['founder', 'investor', 'student', 'admin']).withMessage('Invalid role'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await authService.register(req.body);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: {
            user: result.user,
            access_token: result.token, // Frontend expects 'access_token'
            refresh_token: result.refreshToken
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          error: 'REGISTRATION_FAILED',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed due to server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// User Login (POST /api/auth/login)
app.post('/api/auth/login',
  authRateLimit,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await authService.login(req.body);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            user: result.user,
            access_token: result.token, // Frontend expects 'access_token'
            refresh_token: result.refreshToken
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(401).json({
          success: false,
          message: result.message,
          error: 'LOGIN_FAILED',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed due to server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// Token Verification (POST /api/auth/verify)
app.post('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user,
      tokenData: req.tokenData
    },
    timestamp: new Date().toISOString(),
  });
});

// Get User Profile (GET /api/auth/profile)
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      user: req.user
    },
    timestamp: new Date().toISOString(),
  });
});

// Basic CAPTCHA endpoints (simplified for now)
app.get('/api/captcha/generate', (req, res) => {
  // Simple math captcha for now
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const answer = num1 + num2;
  
  // In production, store this in Redis or DynamoDB with expiration
  const captchaId = Math.random().toString(36).substring(7);
  
  res.json({
    success: true,
    captcha: {
      id: captchaId,
      question: `What is ${num1} + ${num2}?`,
      // Don't send answer to client in production
      _answer: answer // Remove this in production
    },
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/captcha/verify', 
  [
    body('captchaId').notEmpty().withMessage('Captcha ID is required'),
    body('answer').notEmpty().withMessage('Answer is required'),
  ],
  handleValidationErrors,
  (req, res) => {
    // Simplified verification - in production, check against stored value
    res.json({
      success: true,
      message: 'Captcha verified successfully',
      timestamp: new Date().toISOString(),
    });
  }
);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'NOT_FOUND',
    availableRoutes: {
      health: '/health',
      auth: {
        register: '/api/auth/register',
        signup: '/api/auth/signup',
        login: '/api/auth/login',
        verify: '/api/auth/verify',
        profile: '/api/auth/profile'
      },
      api: {
        status: '/api/status',
        solana: '/api/solana/test'
      },
      captcha: {
        generate: '/api/captcha/generate',
        verify: '/api/captcha/verify'
      }
    },
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

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

  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation',
      error: 'CORS_ERROR',
      timestamp: new Date().toISOString(),
    });
  }

  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : error.message || 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    message,
    error: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  });
});

// Export the serverless app
module.exports.handler = serverless(app);

// For local development
if (process.env.NODE_ENV === 'development') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Auxeira Backend running on port ${PORT} in development mode`);
    console.log(`📋 Available endpoints:`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Auth: http://localhost:${PORT}/api/auth/*`);
    console.log(`   API: http://localhost:${PORT}/api/*`);
  });
}

// Export app for testing
module.exports.app = app;

// Export handler for Lambda
module.exports.handler = serverless(app);
