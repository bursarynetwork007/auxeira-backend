import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authService } from '../services/auth.service';
import { config } from '../config';
import { logger, logSecurityEvent } from '../utils/logger';
import { JWTPayload, AuthenticatedUser } from '../types/auth.types';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionToken?: string;
    }
  }
}

/**
 * Authentication middleware - validates JWT tokens and session
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logSecurityEvent('auth_missing_token', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(401).json({
        success: false,
        message: 'Access token is required',
        error: 'MISSING_TOKEN',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch (jwtError) {
      logSecurityEvent('auth_invalid_token', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        tokenError: jwtError instanceof Error ? jwtError.message : 'Unknown JWT error',
      });

      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'INVALID_TOKEN',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate session in database/cache
    const user = await authService.validateSession(decoded.sessionId);
    if (!user) {
      logSecurityEvent('auth_invalid_session', {
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        path: req.path,
        method: req.method,
        ip: req.ip,
      });

      res.status(401).json({
        success: false,
        message: 'Session is invalid or expired',
        error: 'INVALID_SESSION',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check if user account is still active
    if (user.status !== 'active' && user.status !== 'pending_verification') {
      logSecurityEvent('auth_inactive_account', {
        userId: user.id,
        status: user.status,
        path: req.path,
        method: req.method,
        ip: req.ip,
      });

      res.status(403).json({
        success: false,
        message: 'Account is not active',
        error: 'ACCOUNT_INACTIVE',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Attach user to request
    req.user = user;
    req.sessionToken = decoded.sessionId;

    next();
  } catch (error) {
    logger.error('Authentication middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without authentication
      next();
      return;
    }

    // Try to authenticate if token is provided
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      const user = await authService.validateSession(decoded.sessionId);

      if (user && (user.status === 'active' || user.status === 'pending_verification')) {
        req.user = user;
        req.sessionToken = decoded.sessionId;
      }
    } catch (error) {
      // Ignore authentication errors in optional auth
      logger.debug('Optional authentication failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        ip: req.ip,
      });
    }

    next();
  } catch (error) {
    logger.error('Optional authentication middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
      ip: req.ip,
    });

    // Don't fail the request for optional auth errors
    next();
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (allowedRoles: string | string[]) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'AUTHENTICATION_REQUIRED',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      logSecurityEvent('auth_insufficient_permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
        method: req.method,
        ip: req.ip,
      });

      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};

/**
 * Email verification requirement middleware
 */
export const requireEmailVerified = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'AUTHENTICATION_REQUIRED',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (!req.user.emailVerified) {
    logSecurityEvent('auth_email_not_verified', {
      userId: req.user.id,
      email: req.user.email,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    res.status(403).json({
      success: false,
      message: 'Email verification required',
      error: 'EMAIL_NOT_VERIFIED',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
};

/**
 * Subscription tier requirement middleware
 */
export const requireSubscription = (allowedTiers: string | string[]) => {
  const tiers = Array.isArray(allowedTiers) ? allowedTiers : [allowedTiers];

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'AUTHENTICATION_REQUIRED',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!tiers.includes(req.user.subscriptionTier)) {
      logSecurityEvent('auth_insufficient_subscription', {
        userId: req.user.id,
        userTier: req.user.subscriptionTier,
        requiredTiers: tiers,
        path: req.path,
        method: req.method,
        ip: req.ip,
      });

      res.status(403).json({
        success: false,
        message: 'Subscription upgrade required',
        error: 'INSUFFICIENT_SUBSCRIPTION',
        data: {
          currentTier: req.user.subscriptionTier,
          requiredTiers: tiers,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
};

/**
 * Organization membership requirement middleware
 */
export const requireOrganization = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'AUTHENTICATION_REQUIRED',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (!req.user.organizationId) {
    res.status(403).json({
      success: false,
      message: 'Organization membership required',
      error: 'NO_ORGANIZATION',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
};

/**
 * Rate limiting by user
 */
export const rateLimitByUser = (maxRequests: number, windowMs: number) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next();
      return;
    }

    const userId = req.user.id;
    const now = Date.now();
    const userLimit = userRequests.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize user limit
      userRequests.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }

    if (userLimit.count >= maxRequests) {
      logSecurityEvent('rate_limit_exceeded', {
        userId,
        path: req.path,
        method: req.method,
        ip: req.ip,
        requestCount: userLimit.count,
        maxRequests,
      });

      res.status(429).json({
        success: false,
        message: 'Too many requests',
        error: 'RATE_LIMIT_EXCEEDED',
        data: {
          maxRequests,
          windowMs,
          resetTime: new Date(userLimit.resetTime).toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Increment request count
    userLimit.count++;
    next();
  };
};

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole(['admin', 'super_admin']);

/**
 * Super admin-only middleware
 */
export const requireSuperAdmin = requireRole('super_admin');

/**
 * Premium subscription middleware
 */
export const requirePremium = requireSubscription(['premium', 'enterprise']);

/**
 * Enterprise subscription middleware
 */
export const requireEnterprise = requireSubscription('enterprise');
