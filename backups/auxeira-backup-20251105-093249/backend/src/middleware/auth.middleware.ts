import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { loggers } from '../utils/logger';
import { cacheHelpers } from '../config/database';

// Extend Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
        error: 'UNAUTHORIZED',
        code: 'MISSING_TOKEN',
      });
      return;
    }

    // Verify token
    const decoded = authService.verifyToken(token);
    if (!decoded) {
      res.status(403).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'FORBIDDEN',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    // Check if token is blacklisted (optional - for logout functionality)
    const isBlacklisted = await cacheHelpers.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      res.status(403).json({
        success: false,
        message: 'Token has been revoked',
        error: 'FORBIDDEN',
        code: 'REVOKED_TOKEN',
      });
      return;
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    loggers.auth('Token authenticated successfully', {
      userId: decoded.userId,
      email: decoded.email,
      endpoint: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    loggers.errorWithContext(error as Error, 'AUTH_MIDDLEWARE', {
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
    });

    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: 'INTERNAL_ERROR',
      code: 'AUTH_ERROR',
    });
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (allowedRoles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'UNAUTHORIZED',
          code: 'NOT_AUTHENTICATED',
        });
        return;
      }

      const userRole = req.user.role;
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!roles.includes(userRole)) {
        loggers.security('Unauthorized role access attempt', {
          userId: req.user.userId,
          userRole,
          requiredRoles: roles,
          endpoint: req.path,
          method: req.method,
        });

        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          error: 'FORBIDDEN',
          code: 'INSUFFICIENT_PERMISSIONS',
        });
        return;
      }

      loggers.auth('Role authorization successful', {
        userId: req.user.userId,
        userRole,
        endpoint: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      loggers.errorWithContext(error as Error, 'ROLE_MIDDLEWARE', {
        endpoint: req.path,
        method: req.method,
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        message: 'Authorization error',
        error: 'INTERNAL_ERROR',
        code: 'ROLE_CHECK_ERROR',
      });
    }
  };
};

/**
 * Middleware for admin-only routes
 */
export const requireAdmin = requireRole('admin');

/**
 * Middleware for founder and admin routes
 */
export const requireFounderOrAdmin = requireRole(['founder', 'admin']);

/**
 * Middleware for investor, founder, and admin routes
 */
export const requireInvestorOrAbove = requireRole(['investor', 'founder', 'admin']);

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = authService.verifyToken(token);
      if (decoded) {
        // Check if token is blacklisted
        const isBlacklisted = await cacheHelpers.exists(`blacklist:${token}`);
        if (!isBlacklisted) {
          req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
          };
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors, just continue without user
    loggers.auth('Optional auth failed, continuing without user', {
      endpoint: req.path,
      method: req.method,
      error: (error as Error).message,
    });
    next();
  }
};

/**
 * Middleware to validate request body fields
 */
export const validateRequiredFields = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        error: 'VALIDATION_ERROR',
        code: 'MISSING_FIELDS',
        missingFields,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to validate email format
 */
export const validateEmail = (req: Request, res: Response, next: NextFunction): void => {
  const { email } = req.body;

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'VALIDATION_ERROR',
        code: 'INVALID_EMAIL',
      });
      return;
    }
  }

  next();
};

/**
 * Middleware to validate password strength
 */
export const validatePassword = (req: Request, res: Response, next: NextFunction): void => {
  const { password } = req.body;

  if (password) {
    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
        error: 'VALIDATION_ERROR',
        code: 'WEAK_PASSWORD',
      });
      return;
    }

    // Optional: Add more password strength requirements
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        error: 'VALIDATION_ERROR',
        code: 'WEAK_PASSWORD',
      });
      return;
    }
  }

  next();
};

/**
 * Middleware to sanitize input data
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Trim whitespace from string fields
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }

    // Convert email to lowercase
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase();
    }
  }

  next();
};

/**
 * Middleware to check if user owns the resource
 */
export const requireOwnership = (userIdParam: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'UNAUTHORIZED',
          code: 'NOT_AUTHENTICATED',
        });
        return;
      }

      const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
      const currentUserId = req.user.userId;

      // Admin can access any resource
      if (req.user.role === 'admin') {
        next();
        return;
      }

      // User can only access their own resources
      if (resourceUserId !== currentUserId) {
        loggers.security('Unauthorized resource access attempt', {
          userId: currentUserId,
          attemptedResourceUserId: resourceUserId,
          endpoint: req.path,
          method: req.method,
        });

        res.status(403).json({
          success: false,
          message: 'You can only access your own resources',
          error: 'FORBIDDEN',
          code: 'RESOURCE_ACCESS_DENIED',
        });
        return;
      }

      next();
    } catch (error) {
      loggers.errorWithContext(error as Error, 'OWNERSHIP_MIDDLEWARE', {
        endpoint: req.path,
        method: req.method,
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        message: 'Authorization error',
        error: 'INTERNAL_ERROR',
        code: 'OWNERSHIP_CHECK_ERROR',
      });
    }
  };
};

/**
 * Middleware to blacklist a token (for logout)
 */
export const blacklistToken = async (token: string, expiresIn: number = 24 * 60 * 60): Promise<void> => {
  try {
    await cacheHelpers.set(`blacklist:${token}`, 'true', expiresIn);
    loggers.auth('Token blacklisted successfully', { tokenPrefix: token.substring(0, 10) });
  } catch (error) {
    loggers.errorWithContext(error as Error, 'TOKEN_BLACKLIST');
  }
};

/**
 * Rate limiting for authentication endpoints
 */
export const authRateLimit = {
  // Stricter rate limiting for login attempts
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
      success: false,
      message: 'Too many login attempts, please try again later',
      error: 'RATE_LIMIT_EXCEEDED',
      code: 'LOGIN_RATE_LIMIT',
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Rate limiting for registration
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour per IP
    message: {
      success: false,
      message: 'Too many registration attempts, please try again later',
      error: 'RATE_LIMIT_EXCEEDED',
      code: 'REGISTER_RATE_LIMIT',
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Rate limiting for password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset attempts per hour
    message: {
      success: false,
      message: 'Too many password reset attempts, please try again later',
      error: 'RATE_LIMIT_EXCEEDED',
      code: 'PASSWORD_RESET_RATE_LIMIT',
    },
    standardHeaders: true,
    legacyHeaders: false,
  },
};
