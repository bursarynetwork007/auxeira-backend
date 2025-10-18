/**
 * WebSocket Authentication Middleware
 * Handles authentication and authorization for WebSocket connections
 */

import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';
import { pool } from '../config/database';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  userRole: string;
  sessionId: string;
  isAuthenticated: boolean;
  authTimestamp: Date;
}

export interface AuthenticationResult {
  success: boolean;
  userId?: string;
  userRole?: string;
  sessionId?: string;
  error?: string;
  errorCode?: string;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export interface SecurityConfig {
  maxConnectionsPerUser: number;
  maxConnectionsPerIP: number;
  allowedOrigins: string[];
  requireSecureConnection: boolean;
  sessionTimeout: number;
  rateLimiting: {
    connection: RateLimitConfig;
    message: RateLimitConfig;
    authentication: RateLimitConfig;
  };
}

/**
 * WebSocket Authentication Middleware
 */
export const authMiddleware = async (socket: Socket, next: (err?: Error) => void): Promise<void> => {
  const timer = performanceTimer('websocket_auth_middleware');

  try {
    // Extract authentication token from handshake
    const token = extractAuthToken(socket);
    if (!token) {
      timer.end();
      return next(new Error('Authentication token required'));
    }

    // Validate authentication token
    const authResult = await validateAuthToken(token);
    if (!authResult.success) {
      timer.end();
      return next(new Error(authResult.error || 'Authentication failed'));
    }

    // Check rate limiting
    const rateLimitResult = await checkRateLimit(socket, authResult.userId!);
    if (!rateLimitResult.allowed) {
      timer.end();
      return next(new Error('Rate limit exceeded'));
    }

    // Check connection limits
    const connectionLimitResult = await checkConnectionLimits(socket, authResult.userId!);
    if (!connectionLimitResult.allowed) {
      timer.end();
      return next(new Error('Connection limit exceeded'));
    }

    // Check IP restrictions
    const ipCheckResult = await checkIPRestrictions(socket);
    if (!ipCheckResult.allowed) {
      timer.end();
      return next(new Error('IP address not allowed'));
    }

    // Enhance socket with authentication data
    const authenticatedSocket = socket as AuthenticatedSocket;
    authenticatedSocket.userId = authResult.userId!;
    authenticatedSocket.userRole = authResult.userRole!;
    authenticatedSocket.sessionId = authResult.sessionId!;
    authenticatedSocket.isAuthenticated = true;
    authenticatedSocket.authTimestamp = new Date();

    // Store connection info in Redis
    await storeConnectionInfo(authenticatedSocket);

    // Log successful authentication
    logger.info('WebSocket authentication successful', {
      socketId: socket.id,
      userId: authResult.userId,
      userRole: authResult.userRole,
      sessionId: authResult.sessionId,
      ipAddress: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent']
    });

    timer.end();
    next();

  } catch (error) {
    timer.end();
    logger.error('WebSocket authentication middleware error', {
      socketId: socket.id,
      ipAddress: socket.handshake.address,
      error: (error as Error).message
    });

    next(new Error('Authentication middleware error'));
  }
};

/**
 * Extract authentication token from socket handshake
 */
function extractAuthToken(socket: Socket): string | null {
  // Try to get token from query parameters
  const queryToken = socket.handshake.query.token as string;
  if (queryToken) {
    return queryToken;
  }

  // Try to get token from headers
  const authHeader = socket.handshake.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try to get token from auth object
  const authToken = socket.handshake.auth?.token;
  if (authToken) {
    return authToken;
  }

  return null;
}

/**
 * Validate authentication token
 */
async function validateAuthToken(token: string): Promise<AuthenticationResult> {
  const timer = performanceTimer('websocket_validate_auth_token');

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Check if token is blacklisted
    const isBlacklisted = await redisClient.get(`blacklist_access_${token}`);
    if (isBlacklisted) {
      timer.end();
      return {
        success: false,
        error: 'Token has been revoked',
        errorCode: 'TOKEN_REVOKED'
      };
    }

    // Check session validity
    const sessionData = await redisClient.get(`session_${decoded.userId}`);
    if (!sessionData) {
      timer.end();
      return {
        success: false,
        error: 'Session not found',
        errorCode: 'SESSION_NOT_FOUND'
      };
    }

    const session = JSON.parse(sessionData);
    if (!session.isActive) {
      timer.end();
      return {
        success: false,
        error: 'Session is inactive',
        errorCode: 'SESSION_INACTIVE'
      };
    }

    // Check token expiry
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      timer.end();
      return {
        success: false,
        error: 'Token has expired',
        errorCode: 'TOKEN_EXPIRED'
      };
    }

    // Validate required claims
    if (!decoded.userId || !decoded.userRole) {
      timer.end();
      return {
        success: false,
        error: 'Invalid token claims',
        errorCode: 'INVALID_CLAIMS'
      };
    }

    timer.end();

    return {
      success: true,
      userId: decoded.userId,
      userRole: decoded.userRole,
      sessionId: decoded.sessionId || session.sessionId
    };

  } catch (error) {
    timer.end();

    if (error instanceof jwt.TokenExpiredError) {
      return {
        success: false,
        error: 'Token has expired',
        errorCode: 'TOKEN_EXPIRED'
      };
    } else if (error instanceof jwt.JsonWebTokenError) {
      return {
        success: false,
        error: 'Invalid token',
        errorCode: 'INVALID_TOKEN'
      };
    } else {
      logger.error('Token validation error', {
        error: (error as Error).message
      });
      return {
        success: false,
        error: 'Token validation failed',
        errorCode: 'VALIDATION_FAILED'
      };
    }
  }
}

/**
 * Check rate limiting for connections and requests
 */
async function checkRateLimit(socket: Socket, userId: string): Promise<{ allowed: boolean; remaining?: number; resetTime?: Date }> {
  const timer = performanceTimer('websocket_check_rate_limit');

  try {
    const ipAddress = socket.handshake.address;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxConnections = 10; // Max 10 connections per minute per IP
    const maxUserConnections = 5; // Max 5 connections per minute per user

    // Check IP-based rate limit
    const ipKey = `rate_limit_ip_${ipAddress}`;
    const ipCount = await redisClient.incr(ipKey);
    if (ipCount === 1) {
      await redisClient.expire(ipKey, Math.ceil(windowMs / 1000));
    }

    if (ipCount > maxConnections) {
      timer.end();
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(now + windowMs)
      };
    }

    // Check user-based rate limit
    const userKey = `rate_limit_user_${userId}`;
    const userCount = await redisClient.incr(userKey);
    if (userCount === 1) {
      await redisClient.expire(userKey, Math.ceil(windowMs / 1000));
    }

    if (userCount > maxUserConnections) {
      timer.end();
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(now + windowMs)
      };
    }

    timer.end();

    return {
      allowed: true,
      remaining: Math.max(maxConnections - ipCount, maxUserConnections - userCount),
      resetTime: new Date(now + windowMs)
    };

  } catch (error) {
    timer.end();
    logger.error('Rate limit check failed', {
      socketId: socket.id,
      userId,
      error: (error as Error).message
    });

    // Allow connection on error (fail open)
    return { allowed: true };
  }
}

/**
 * Check connection limits per user and IP
 */
async function checkConnectionLimits(socket: Socket, userId: string): Promise<{ allowed: boolean; currentConnections?: number; maxConnections?: number }> {
  const timer = performanceTimer('websocket_check_connection_limits');

  try {
    const ipAddress = socket.handshake.address;
    const maxConnectionsPerUser = 5;
    const maxConnectionsPerIP = 20;

    // Check user connection limit
    const userConnectionsKey = `connections_user_${userId}`;
    const userConnections = await redisClient.scard(userConnectionsKey);

    if (userConnections >= maxConnectionsPerUser) {
      timer.end();
      return {
        allowed: false,
        currentConnections: userConnections,
        maxConnections: maxConnectionsPerUser
      };
    }

    // Check IP connection limit
    const ipConnectionsKey = `connections_ip_${ipAddress}`;
    const ipConnections = await redisClient.scard(ipConnectionsKey);

    if (ipConnections >= maxConnectionsPerIP) {
      timer.end();
      return {
        allowed: false,
        currentConnections: ipConnections,
        maxConnections: maxConnectionsPerIP
      };
    }

    timer.end();

    return {
      allowed: true,
      currentConnections: Math.max(userConnections, ipConnections),
      maxConnections: Math.min(maxConnectionsPerUser, maxConnectionsPerIP)
    };

  } catch (error) {
    timer.end();
    logger.error('Connection limit check failed', {
      socketId: socket.id,
      userId,
      error: (error as Error).message
    });

    // Allow connection on error (fail open)
    return { allowed: true };
  }
}

/**
 * Check IP restrictions and security
 */
async function checkIPRestrictions(socket: Socket): Promise<{ allowed: boolean; reason?: string }> {
  const timer = performanceTimer('websocket_check_ip_restrictions');

  try {
    const ipAddress = socket.handshake.address;

    // Check if IP is blacklisted
    const isBlacklisted = await redisClient.sismember('blacklisted_ips', ipAddress);
    if (isBlacklisted) {
      timer.end();
      return {
        allowed: false,
        reason: 'IP address is blacklisted'
      };
    }

    // Check if IP is in suspicious activity list
    const suspiciousActivity = await redisClient.get(`suspicious_ip_${ipAddress}`);
    if (suspiciousActivity) {
      const activityData = JSON.parse(suspiciousActivity);
      if (activityData.riskScore > 0.8) {
        timer.end();
        return {
          allowed: false,
          reason: 'IP address flagged for suspicious activity'
        };
      }
    }

    // Check geographic restrictions (if any)
    const geoRestrictions = process.env.GEO_RESTRICTIONS;
    if (geoRestrictions) {
      // Would implement geolocation check
      // const geoData = await getIPGeolocation(ipAddress);
      // if (restrictedCountries.includes(geoData.country)) {
      //   return { allowed: false, reason: 'Geographic restriction' };
      // }
    }

    timer.end();

    return { allowed: true };

  } catch (error) {
    timer.end();
    logger.error('IP restriction check failed', {
      socketId: socket.id,
      ipAddress: socket.handshake.address,
      error: (error as Error).message
    });

    // Allow connection on error (fail open)
    return { allowed: true };
  }
}

/**
 * Store connection information in Redis
 */
async function storeConnectionInfo(socket: AuthenticatedSocket): Promise<void> {
  const timer = performanceTimer('websocket_store_connection_info');

  try {
    const connectionInfo = {
      socketId: socket.id,
      userId: socket.userId,
      userRole: socket.userRole,
      sessionId: socket.sessionId,
      ipAddress: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'],
      connectedAt: socket.authTimestamp,
      lastActivity: socket.authTimestamp
    };

    // Store connection info
    await redisClient.setex(
      `connection_${socket.id}`,
      24 * 60 * 60, // 24 hours
      JSON.stringify(connectionInfo)
    );

    // Add to user connections set
    await redisClient.sadd(`connections_user_${socket.userId}`, socket.id);
    await redisClient.expire(`connections_user_${socket.userId}`, 24 * 60 * 60);

    // Add to IP connections set
    await redisClient.sadd(`connections_ip_${socket.handshake.address}`, socket.id);
    await redisClient.expire(`connections_ip_${socket.handshake.address}`, 24 * 60 * 60);

    // Store user session mapping
    await redisClient.setex(
      `socket_user_${socket.id}`,
      24 * 60 * 60,
      socket.userId
    );

    timer.end();

    logger.info('Connection info stored', {
      socketId: socket.id,
      userId: socket.userId,
      sessionId: socket.sessionId
    });

  } catch (error) {
    timer.end();
    logger.error('Failed to store connection info', {
      socketId: socket.id,
      userId: socket.userId,
      error: (error as Error).message
    });
  }
}

/**
 * Role-based authorization middleware
 */
export const roleAuthMiddleware = (allowedRoles: string[]) => {
  return (socket: AuthenticatedSocket, next: (err?: Error) => void): void => {
    const timer = performanceTimer('websocket_role_auth_middleware');

    try {
      if (!socket.isAuthenticated) {
        timer.end();
        return next(new Error('Socket not authenticated'));
      }

      if (!allowedRoles.includes(socket.userRole)) {
        timer.end();
        logger.warn('WebSocket role authorization failed', {
          socketId: socket.id,
          userId: socket.userId,
          userRole: socket.userRole,
          allowedRoles
        });
        return next(new Error('Insufficient permissions'));
      }

      timer.end();
      next();

    } catch (error) {
      timer.end();
      logger.error('Role authorization middleware error', {
        socketId: socket.id,
        userId: socket.userId,
        allowedRoles,
        error: (error as Error).message
      });

      next(new Error('Authorization error'));
    }
  };
};

/**
 * Room access authorization middleware
 */
export const roomAuthMiddleware = (roomId: string, requiredPermissions?: string[]) => {
  return async (socket: AuthenticatedSocket, next: (err?: Error) => void): Promise<void> => {
    const timer = performanceTimer('websocket_room_auth_middleware');

    try {
      if (!socket.isAuthenticated) {
        timer.end();
        return next(new Error('Socket not authenticated'));
      }

      // Check room access permissions
      const hasAccess = await checkRoomAccess(socket.userId, socket.userRole, roomId, requiredPermissions);
      if (!hasAccess) {
        timer.end();
        logger.warn('WebSocket room access denied', {
          socketId: socket.id,
          userId: socket.userId,
          userRole: socket.userRole,
          roomId,
          requiredPermissions
        });
        return next(new Error('Room access denied'));
      }

      timer.end();
      next();

    } catch (error) {
      timer.end();
      logger.error('Room authorization middleware error', {
        socketId: socket.id,
        userId: socket.userId,
        roomId,
        error: (error as Error).message
      });

      next(new Error('Room authorization error'));
    }
  };
};

/**
 * Message rate limiting middleware
 */
export const messageRateLimitMiddleware = (maxMessagesPerMinute: number = 60) => {
  return async (socket: AuthenticatedSocket, next: (err?: Error) => void): Promise<void> => {
    const timer = performanceTimer('websocket_message_rate_limit_middleware');

    try {
      if (!socket.isAuthenticated) {
        timer.end();
        return next(new Error('Socket not authenticated'));
      }

      const rateLimitKey = `message_rate_limit_${socket.userId}`;
      const messageCount = await redisClient.incr(rateLimitKey);

      if (messageCount === 1) {
        await redisClient.expire(rateLimitKey, 60); // 1 minute window
      }

      if (messageCount > maxMessagesPerMinute) {
        timer.end();
        logger.warn('WebSocket message rate limit exceeded', {
          socketId: socket.id,
          userId: socket.userId,
          messageCount,
          maxMessagesPerMinute
        });
        return next(new Error('Message rate limit exceeded'));
      }

      timer.end();
      next();

    } catch (error) {
      timer.end();
      logger.error('Message rate limit middleware error', {
        socketId: socket.id,
        userId: socket.userId,
        error: (error as Error).message
      });

      next(new Error('Rate limit error'));
    }
  };
};

/**
 * Security monitoring middleware
 */
export const securityMonitoringMiddleware = async (socket: Socket, next: (err?: Error) => void): Promise<void> => {
  const timer = performanceTimer('websocket_security_monitoring_middleware');

  try {
    const ipAddress = socket.handshake.address;
    const userAgent = socket.handshake.headers['user-agent'] || '';

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /automated/i
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    if (isSuspicious) {
      // Log suspicious activity
      await redisClient.setex(
        `suspicious_connection_${ipAddress}_${Date.now()}`,
        24 * 60 * 60, // 24 hours
        JSON.stringify({
          ipAddress,
          userAgent,
          timestamp: new Date(),
          reason: 'Suspicious user agent pattern'
        })
      );

      logger.warn('Suspicious WebSocket connection detected', {
        socketId: socket.id,
        ipAddress,
        userAgent,
        reason: 'Suspicious user agent pattern'
      });

      // Increase IP risk score
      await increaseIPRiskScore(ipAddress, 0.2);
    }

    // Check for rapid connection attempts
    const connectionAttemptKey = `connection_attempts_${ipAddress}`;
    const attemptCount = await redisClient.incr(connectionAttemptKey);
    if (attemptCount === 1) {
      await redisClient.expire(connectionAttemptKey, 60); // 1 minute window
    }

    if (attemptCount > 20) { // More than 20 attempts per minute
      logger.warn('Rapid connection attempts detected', {
        socketId: socket.id,
        ipAddress,
        attemptCount
      });

      await increaseIPRiskScore(ipAddress, 0.3);

      timer.end();
      return next(new Error('Too many connection attempts'));
    }

    timer.end();
    next();

  } catch (error) {
    timer.end();
    logger.error('Security monitoring middleware error', {
      socketId: socket.id,
      error: (error as Error).message
    });

    next(new Error('Security monitoring error'));
  }
};

/**
 * Connection cleanup middleware (for disconnect events)
 */
export const connectionCleanupMiddleware = async (socket: AuthenticatedSocket): Promise<void> => {
  const timer = performanceTimer('websocket_connection_cleanup');

  try {
    if (!socket.isAuthenticated) {
      timer.end();
      return;
    }

    // Remove connection info
    await redisClient.del(`connection_${socket.id}`);
    await redisClient.del(`socket_user_${socket.id}`);

    // Remove from user connections set
    await redisClient.srem(`connections_user_${socket.userId}`, socket.id);

    // Remove from IP connections set
    await redisClient.srem(`connections_ip_${socket.handshake.address}`, socket.id);

    // Update session last activity
    const sessionKey = `session_${socket.userId}`;
    const sessionData = await redisClient.get(sessionKey);
    if (sessionData) {
      const session = JSON.parse(sessionData);
      session.lastActivity = new Date();
      await redisClient.setex(sessionKey, 15 * 60, JSON.stringify(session)); // 15 minutes
    }

    timer.end();

    logger.info('Connection cleanup completed', {
      socketId: socket.id,
      userId: socket.userId,
      sessionId: socket.sessionId
    });

  } catch (error) {
    timer.end();
    logger.error('Connection cleanup failed', {
      socketId: socket.id,
      userId: socket.userId,
      error: (error as Error).message
    });
  }
};

// Helper functions

async function checkRoomAccess(
  userId: string,
  userRole: string,
  roomId: string,
  requiredPermissions?: string[]
): Promise<boolean> {
  try {
    // Check basic room access rules
    if (roomId.startsWith('user_')) {
      const roomUserId = roomId.replace('user_', '');
      return roomUserId === userId || userRole === 'admin';
    }

    if (roomId === 'admin_dashboard') {
      return userRole === 'admin';
    }

    if (roomId === 'investor_matching') {
      return ['investor', 'startup', 'admin'].includes(userRole);
    }

    // Check specific permissions if provided
    if (requiredPermissions && requiredPermissions.length > 0) {
      // Would implement permission checking logic
      // const userPermissions = await getUserPermissions(userId);
      // return requiredPermissions.every(permission => userPermissions.includes(permission));
    }

    // Default: allow access to public rooms
    return true;

  } catch (error) {
    logger.error('Room access check failed', {
      userId,
      userRole,
      roomId,
      requiredPermissions,
      error: (error as Error).message
    });
    return false;
  }
}

async function increaseIPRiskScore(ipAddress: string, increment: number): Promise<void> {
  try {
    const riskKey = `ip_risk_${ipAddress}`;
    const currentRiskData = await redisClient.get(riskKey);

    let riskScore = 0;
    let activityCount = 1;

    if (currentRiskData) {
      const riskData = JSON.parse(currentRiskData);
      riskScore = riskData.riskScore + increment;
      activityCount = riskData.activityCount + 1;
    } else {
      riskScore = increment;
    }

    // Cap risk score at 1.0
    riskScore = Math.min(riskScore, 1.0);

    const updatedRiskData = {
      ipAddress,
      riskScore,
      activityCount,
      lastActivity: new Date(),
      incidents: currentRiskData ? JSON.parse(currentRiskData).incidents + 1 : 1
    };

    // Store for 24 hours
    await redisClient.setex(riskKey, 24 * 60 * 60, JSON.stringify(updatedRiskData));

    // Auto-blacklist if risk score is too high
    if (riskScore >= 0.9) {
      await redisClient.sadd('blacklisted_ips', ipAddress);
      await redisClient.expire('blacklisted_ips', 7 * 24 * 60 * 60); // 7 days

      logger.warn('IP address auto-blacklisted', {
        ipAddress,
        riskScore,
        activityCount,
        incidents: updatedRiskData.incidents
      });
    }

    logger.info('IP risk score updated', {
      ipAddress,
      riskScore,
      increment,
      activityCount
    });

  } catch (error) {
    logger.error('Failed to increase IP risk score', {
      ipAddress,
      increment,
      error: (error as Error).message
    });
  }
}

/**
 * Get security configuration
 */
export function getSecurityConfig(): SecurityConfig {
  return {
    maxConnectionsPerUser: parseInt(process.env.WS_MAX_CONNECTIONS_PER_USER || '5'),
    maxConnectionsPerIP: parseInt(process.env.WS_MAX_CONNECTIONS_PER_IP || '20'),
    allowedOrigins: process.env.WS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    requireSecureConnection: process.env.NODE_ENV === 'production',
    sessionTimeout: parseInt(process.env.WS_SESSION_TIMEOUT || '900'), // 15 minutes
    rateLimiting: {
      connection: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10,
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      },
      message: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 60,
        skipSuccessfulRequests: true,
        skipFailedRequests: false
      },
      authentication: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
        skipSuccessfulRequests: true,
        skipFailedRequests: false
      }
    }
  };
}

/**
 * Validate WebSocket origin
 */
export function validateOrigin(origin: string): boolean {
  const config = getSecurityConfig();

  if (!config.allowedOrigins || config.allowedOrigins.length === 0) {
    return true; // Allow all origins if none specified
  }

  return config.allowedOrigins.some(allowedOrigin => {
    if (allowedOrigin === '*') {
      return true;
    }

    // Support wildcard subdomains
    if (allowedOrigin.startsWith('*.')) {
      const domain = allowedOrigin.substring(2);
      return origin.endsWith(domain);
    }

    return origin === allowedOrigin;
  });
}

/**
 * Security audit logging
 */
export async function logSecurityEvent(event: {
  eventType: string;
  socketId?: string;
  userId?: string;
  ipAddress?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const securityEvent = {
      ...event,
      timestamp: new Date(),
      eventId: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Store security event
    await redisClient.lpush('security_events', JSON.stringify(securityEvent));

    // Keep only recent events (last 10,000)
    await redisClient.ltrim('security_events', 0, 9999);

    // Log to application logs
    logger.warn('Security event logged', securityEvent);

    // Send alert for high/critical events
    if (['high', 'critical'].includes(event.severity)) {
      // Would send to security monitoring system
      // await securityAlertService.sendAlert(securityEvent);
    }

  } catch (error) {
    logger.error('Failed to log security event', {
      event,
      error: (error as Error).message
    });
  }
}

/**
 * Get connection statistics
 */
export async function getConnectionStats(): Promise<{
  totalConnections: number;
  connectionsByRole: Record<string, number>;
  connectionsByIP: Record<string, number>;
  averageSessionDuration: number;
  securityEvents: number;
  blacklistedIPs: number;
}> {
  try {
    // Get all connection keys
    const connectionKeys = await redisClient.keys('connection_*');
    const connections = [];

    for (const key of connectionKeys) {
      const connectionData = await redisClient.get(key);
      if (connectionData) {
        connections.push(JSON.parse(connectionData));
      }
    }

    // Calculate statistics
    const connectionsByRole: Record<string, number> = {};
    const connectionsByIP: Record<string, number> = {};
    let totalSessionDuration = 0;

    connections.forEach(conn => {
      connectionsByRole[conn.userRole] = (connectionsByRole[conn.userRole] || 0) + 1;
      connectionsByIP[conn.ipAddress] = (connectionsByIP[conn.ipAddress] || 0) + 1;
      totalSessionDuration += Date.now() - new Date(conn.connectedAt).getTime();
    });

    // Get security statistics
    const securityEventsCount = await redisClient.llen('security_events');
    const blacklistedIPsCount = await redisClient.scard('blacklisted_ips');

    return {
      totalConnections: connections.length,
      connectionsByRole,
      connectionsByIP,
      averageSessionDuration: connections.length > 0 ? totalSessionDuration / connections.length : 0,
      securityEvents: securityEventsCount,
      blacklistedIPs: blacklistedIPsCount
    };

  } catch (error) {
    logger.error('Failed to get connection stats', {
      error: (error as Error).message
    });

    return {
      totalConnections: 0,
      connectionsByRole: {},
      connectionsByIP: {},
      averageSessionDuration: 0,
      securityEvents: 0,
      blacklistedIPs: 0
    };
  }
}

/**
 * Clean up stale connections
 */
export async function cleanupStaleConnections(): Promise<void> {
  const timer = performanceTimer('websocket_cleanup_stale_connections');

  try {
    const now = Date.now();
    const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours
    let cleanedCount = 0;

    // Get all connection keys
    const connectionKeys = await redisClient.keys('connection_*');

    for (const key of connectionKeys) {
      const connectionData = await redisClient.get(key);
      if (connectionData) {
        const connection = JSON.parse(connectionData);
        const connectionAge = now - new Date(connection.lastActivity).getTime();

        if (connectionAge > staleThreshold) {
          // Remove stale connection
          await redisClient.del(key);
          await redisClient.srem(`connections_user_${connection.userId}`, connection.socketId);
          await redisClient.srem(`connections_ip_${connection.ipAddress}`, connection.socketId);
          await redisClient.del(`socket_user_${connection.socketId}`);
          cleanedCount++;
        }
      }
    }

    timer.end();

    logger.info('Stale connections cleaned up', {
      cleanedCount,
      totalChecked: connectionKeys.length
    });

  } catch (error) {
    timer.end();
    logger.error('Failed to cleanup stale connections', {
      error: (error as Error).message
    });
  }
}

export default authMiddleware;