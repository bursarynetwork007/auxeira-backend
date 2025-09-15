/**
 * WebSocket Authentication Handler
 * Handles authentication-related WebSocket events and security
 */

import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';
import { WebSocketUser, WebSocketServer } from './index';
import { pool } from '../config/database';

export interface AuthenticationEvent {
  eventType: 'login' | 'logout' | 'token_refresh' | 'session_expired' | 'unauthorized';
  userId: string;
  sessionId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SessionData {
  userId: string;
  userRole: string;
  sessionId: string;
  loginTime: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export class AuthHandler {
  private activeSessions: Map<string, SessionData> = new Map();
  private sessionTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Set up authentication event handlers for a socket
   */
  setupHandlers(socket: Socket, user: WebSocketUser, wsServer: WebSocketServer): void {
    // Handle authentication token refresh
    socket.on('auth_refresh_token', async (data: { refreshToken: string }) => {
      await this.handleTokenRefresh(socket, user, data.refreshToken);
    });

    // Handle logout
    socket.on('auth_logout', async () => {
      await this.handleLogout(socket, user);
    });

    // Handle session validation
    socket.on('auth_validate_session', async () => {
      await this.handleSessionValidation(socket, user);
    });

    // Handle role change (admin only)
    socket.on('auth_change_role', async (data: { targetUserId: string; newRole: string }) => {
      await this.handleRoleChange(socket, user, data.targetUserId, data.newRole);
    });

    // Handle session extension
    socket.on('auth_extend_session', async () => {
      await this.handleSessionExtension(socket, user);
    });

    // Handle multi-device login detection
    socket.on('auth_check_multi_device', async () => {
      await this.handleMultiDeviceCheck(socket, user);
    });
  }

  /**
   * Handle token refresh
   */
  private async handleTokenRefresh(socket: Socket, user: WebSocketUser, refreshToken: string): Promise<void> {
    const timer = performanceTimer('websocket_auth_token_refresh');

    try {
      // Validate refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

      if (decoded.userId !== user.userId) {
        socket.emit('auth_error', {
          error: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
        return;
      }

      // Check if refresh token is blacklisted
      const isBlacklisted = await redisClient.get(`blacklist_refresh_${refreshToken}`);
      if (isBlacklisted) {
        socket.emit('auth_error', {
          error: 'Refresh token has been revoked',
          code: 'TOKEN_REVOKED'
        });
        return;
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        {
          userId: user.userId,
          userRole: user.userRole,
          sessionId: this.generateSessionId()
        },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      // Generate new refresh token
      const newRefreshToken = jwt.sign(
        {
          userId: user.userId,
          sessionId: this.generateSessionId()
        },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
      );

      // Blacklist old refresh token
      await redisClient.setex(`blacklist_refresh_${refreshToken}`, 7 * 24 * 60 * 60, 'revoked');

      // Store new session data
      const sessionData: SessionData = {
        userId: user.userId,
        userRole: user.userRole,
        sessionId: decoded.sessionId,
        loginTime: new Date(decoded.iat * 1000),
        lastActivity: new Date(),
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'] || '',
        isActive: true
      };

      this.activeSessions.set(user.userId, sessionData);
      await redisClient.setex(`session_${user.userId}`, 15 * 60, JSON.stringify(sessionData));

      // Send new tokens to client
      socket.emit('auth_token_refreshed', {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60, // 15 minutes
        sessionId: decoded.sessionId,
        timestamp: new Date()
      });

      timer.end();

      logger.info('Token refreshed successfully', {
        userId: user.userId,
        socketId: socket.id,
        sessionId: decoded.sessionId
      });

    } catch (error) {
      timer.end();
      logger.error('Token refresh failed', {
        userId: user.userId,
        socketId: socket.id,
        error: (error as Error).message
      });

      socket.emit('auth_error', {
        error: 'Token refresh failed',
        code: 'REFRESH_FAILED'
      });
    }
  }

  /**
   * Handle user logout
   */
  private async handleLogout(socket: Socket, user: WebSocketUser): Promise<void> {
    const timer = performanceTimer('websocket_auth_logout');

    try {
      // Remove session from active sessions
      this.activeSessions.delete(user.userId);

      // Remove session from Redis
      await redisClient.del(`session_${user.userId}`);

      // Clear any session timeouts
      const timeout = this.sessionTimeouts.get(user.userId);
      if (timeout) {
        clearTimeout(timeout);
        this.sessionTimeouts.delete(user.userId);
      }

      // Create logout event
      const authEvent: AuthenticationEvent = {
        eventType: 'logout',
        userId: user.userId,
        timestamp: new Date(),
        metadata: {
          socketId: socket.id,
          sessionDuration: Date.now() - user.connectedAt.getTime()
        }
      };

      // Send logout confirmation
      socket.emit('auth_logout_success', {
        message: 'Logged out successfully',
        timestamp: new Date()
      });

      // Log the event
      await this.logAuthenticationEvent(authEvent);

      timer.end();

      logger.info('User logged out', {
        userId: user.userId,
        socketId: socket.id,
        sessionDuration: Date.now() - user.connectedAt.getTime()
      });

      // Disconnect socket after logout
      setTimeout(() => {
        socket.disconnect(true);
      }, 1000);

    } catch (error) {
      timer.end();
      logger.error('Logout failed', {
        userId: user.userId,
        socketId: socket.id,
        error: (error as Error).message
      });

      socket.emit('auth_error', {
        error: 'Logout failed',
        code: 'LOGOUT_FAILED'
      });
    }
  }

  /**
   * Handle session validation
   */
  private async handleSessionValidation(socket: Socket, user: WebSocketUser): Promise<void> {
    const timer = performanceTimer('websocket_auth_session_validation');

    try {
      // Check if session exists in Redis
      const sessionData = await redisClient.get(`session_${user.userId}`);

      if (!sessionData) {
        socket.emit('auth_session_invalid', {
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND',
          timestamp: new Date()
        });
        return;
      }

      const session: SessionData = JSON.parse(sessionData);

      // Validate session is still active
      if (!session.isActive) {
        socket.emit('auth_session_invalid', {
          error: 'Session is inactive',
          code: 'SESSION_INACTIVE',
          timestamp: new Date()
        });
        return;
      }

      // Check session expiry (15 minutes for access token)
      const sessionAge = Date.now() - new Date(session.lastActivity).getTime();
      if (sessionAge > 15 * 60 * 1000) {
        socket.emit('auth_session_expired', {
          error: 'Session has expired',
          code: 'SESSION_EXPIRED',
          timestamp: new Date(),
          sessionAge
        });
        return;
      }

      // Update last activity
      session.lastActivity = new Date();
      this.activeSessions.set(user.userId, session);
      await redisClient.setex(`session_${user.userId}`, 15 * 60, JSON.stringify(session));

      // Send validation success
      socket.emit('auth_session_valid', {
        sessionId: session.sessionId,
        userId: user.userId,
        userRole: user.userRole,
        loginTime: session.loginTime,
        lastActivity: session.lastActivity,
        timestamp: new Date()
      });

      timer.end();

      logger.info('Session validated', {
        userId: user.userId,
        socketId: socket.id,
        sessionId: session.sessionId
      });

    } catch (error) {
      timer.end();
      logger.error('Session validation failed', {
        userId: user.userId,
        socketId: socket.id,
        error: (error as Error).message
      });

      socket.emit('auth_error', {
        error: 'Session validation failed',
        code: 'VALIDATION_FAILED'
      });
    }
  }

  /**
   * Handle role change (admin only)
   */
  private async handleRoleChange(
    socket: Socket,
    user: WebSocketUser,
    targetUserId: string,
    newRole: string
  ): Promise<void> {
    const timer = performanceTimer('websocket_auth_role_change');

    try {
      // Check if user is admin
      if (user.userRole !== 'admin') {
        socket.emit('auth_error', {
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
        return;
      }

      // Validate new role
      const validRoles = ['user', 'startup', 'investor', 'admin', 'partner'];
      if (!validRoles.includes(newRole)) {
        socket.emit('auth_error', {
          error: 'Invalid role specified',
          code: 'INVALID_ROLE'
        });
        return;
      }

      // Update user role in database (would need to implement)
      // await userService.updateUserRole(targetUserId, newRole);

      // Update session data if user is connected
      const targetSession = this.activeSessions.get(targetUserId);
      if (targetSession) {
        targetSession.userRole = newRole;
        targetSession.lastActivity = new Date();
        this.activeSessions.set(targetUserId, targetSession);
        await redisClient.setex(`session_${targetUserId}`, 15 * 60, JSON.stringify(targetSession));

        // Notify target user of role change
        socket.to(`user_${targetUserId}`).emit('auth_role_changed', {
          newRole,
          changedBy: user.userId,
          timestamp: new Date(),
          message: `Your role has been changed to ${newRole}`
        });
      }

      // Send confirmation to admin
      socket.emit('auth_role_change_success', {
        targetUserId,
        newRole,
        timestamp: new Date()
      });

      timer.end();

      logger.info('User role changed', {
        adminUserId: user.userId,
        targetUserId,
        newRole,
        socketId: socket.id
      });

    } catch (error) {
      timer.end();
      logger.error('Role change failed', {
        adminUserId: user.userId,
        targetUserId,
        newRole,
        error: (error as Error).message
      });

      socket.emit('auth_error', {
        error: 'Role change failed',
        code: 'ROLE_CHANGE_FAILED'
      });
    }
  }

  /**
   * Handle session extension
   */
  private async handleSessionExtension(socket: Socket, user: WebSocketUser): Promise<void> {
    const timer = performanceTimer('websocket_auth_session_extension');

    try {
      const sessionData = this.activeSessions.get(user.userId);
      if (!sessionData) {
        socket.emit('auth_error', {
          error: 'No active session found',
          code: 'NO_ACTIVE_SESSION'
        });
        return;
      }

      // Extend session by 15 minutes
      sessionData.lastActivity = new Date();
      this.activeSessions.set(user.userId, sessionData);
      await redisClient.setex(`session_${user.userId}`, 15 * 60, JSON.stringify(sessionData));

      // Clear existing timeout
      const existingTimeout = this.sessionTimeouts.get(user.userId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const newTimeout = setTimeout(() => {
        this.handleSessionTimeout(user.userId);
      }, 15 * 60 * 1000); // 15 minutes

      this.sessionTimeouts.set(user.userId, newTimeout);

      socket.emit('auth_session_extended', {
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        timestamp: new Date()
      });

      timer.end();

      logger.info('Session extended', {
        userId: user.userId,
        socketId: socket.id,
        newExpiry: new Date(Date.now() + 15 * 60 * 1000)
      });

    } catch (error) {
      timer.end();
      logger.error('Session extension failed', {
        userId: user.userId,
        socketId: socket.id,
        error: (error as Error).message
      });

      socket.emit('auth_error', {
        error: 'Session extension failed',
        code: 'EXTENSION_FAILED'
      });
    }
  }

  /**
   * Handle multi-device login detection
   */
  private async handleMultiDeviceCheck(socket: Socket, user: WebSocketUser): Promise<void> {
    const timer = performanceTimer('websocket_auth_multi_device_check');

    try {
      // Get all active sessions for this user from Redis
      const pattern = `session_${user.userId}_*`;
      const sessionKeys = await redisClient.keys(pattern);

      const activeSessions: SessionData[] = [];
      for (const key of sessionKeys) {
        const sessionData = await redisClient.get(key);
        if (sessionData) {
          const session: SessionData = JSON.parse(sessionData);
          if (session.isActive) {
            activeSessions.push(session);
          }
        }
      }

      // Check for multiple active sessions
      const multipleDevices = activeSessions.length > 1;
      const currentSession = activeSessions.find(s => s.sessionId === socket.id);

      socket.emit('auth_multi_device_status', {
        multipleDevices,
        activeSessionsCount: activeSessions.length,
        currentSession: currentSession ? {
          sessionId: currentSession.sessionId,
          loginTime: currentSession.loginTime,
          ipAddress: currentSession.ipAddress,
          userAgent: currentSession.userAgent
        } : null,
        otherSessions: activeSessions
          .filter(s => s.sessionId !== socket.id)
          .map(s => ({
            sessionId: s.sessionId,
            loginTime: s.loginTime,
            lastActivity: s.lastActivity,
            ipAddress: s.ipAddress,
            userAgent: s.userAgent
          })),
        timestamp: new Date()
      });

      timer.end();

      logger.info('Multi-device check completed', {
        userId: user.userId,
        socketId: socket.id,
        activeSessionsCount: activeSessions.length,
        multipleDevices
      });

    } catch (error) {
      timer.end();
      logger.error('Multi-device check failed', {
        userId: user.userId,
        socketId: socket.id,
        error: (error as Error).message
      });

      socket.emit('auth_error', {
        error: 'Multi-device check failed',
        code: 'MULTI_DEVICE_CHECK_FAILED'
      });
    }
  }

  /**
   * Handle session timeout
   */
  private async handleSessionTimeout(userId: string): Promise<void> {
    const timer = performanceTimer('websocket_auth_session_timeout');

    try {
      const sessionData = this.activeSessions.get(userId);
      if (!sessionData) {
        return;
      }

      // Mark session as expired
      sessionData.isActive = false;
      this.activeSessions.delete(userId);

      // Remove from Redis
      await redisClient.del(`session_${userId}`);

      // Clear timeout
      this.sessionTimeouts.delete(userId);

      // Create timeout event
      const authEvent: AuthenticationEvent = {
        eventType: 'session_expired',
        userId,
        sessionId: sessionData.sessionId,
        timestamp: new Date(),
        metadata: {
          sessionDuration: Date.now() - sessionData.loginTime.getTime(),
          reason: 'timeout'
        }
      };

      // Notify user of session expiry
      const userSocket = this.findUserSocket(userId);
      if (userSocket) {
        userSocket.emit('auth_session_expired', {
          message: 'Your session has expired',
          sessionId: sessionData.sessionId,
          timestamp: new Date(),
          redirectUrl: '/login'
        });

        // Disconnect after notification
        setTimeout(() => {
          userSocket.disconnect(true);
        }, 2000);
      }

      // Log the event
      await this.logAuthenticationEvent(authEvent);

      timer.end();

      logger.info('Session timeout handled', {
        userId,
        sessionId: sessionData.sessionId,
        sessionDuration: Date.now() - sessionData.loginTime.getTime()
      });

    } catch (error) {
      timer.end();
      logger.error('Session timeout handling failed', {
        userId,
        error: (error as Error).message
      });
    }
  }

  /**
   * Validate authentication token
   */
  async validateAuthToken(token: string): Promise<{
    isValid: boolean;
    userId?: string;
    userRole?: string;
    sessionId?: string;
    error?: string;
  }> {
    const timer = performanceTimer('websocket_auth_validate_token');

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      // Check if token is blacklisted
      const isBlacklisted = await redisClient.get(`blacklist_access_${token}`);
      if (isBlacklisted) {
        timer.end();
        return {
          isValid: false,
          error: 'Token has been revoked'
        };
      }

      // Check session in Redis
      const sessionData = await redisClient.get(`session_${decoded.userId}`);
      if (!sessionData) {
        timer.end();
        return {
          isValid: false,
          error: 'Session not found'
        };
      }

      const session: SessionData = JSON.parse(sessionData);
      if (!session.isActive) {
        timer.end();
        return {
          isValid: false,
          error: 'Session is inactive'
        };
      }

      timer.end();

      return {
        isValid: true,
        userId: decoded.userId,
        userRole: decoded.userRole,
        sessionId: decoded.sessionId
      };

    } catch (error) {
      timer.end();

      if (error instanceof jwt.TokenExpiredError) {
        return {
          isValid: false,
          error: 'Token has expired'
        };
      } else if (error instanceof jwt.JsonWebTokenError) {
        return {
          isValid: false,
          error: 'Invalid token'
        };
      } else {
        logger.error('Token validation error', {
          error: (error as Error).message
        });
        return {
          isValid: false,
          error: 'Token validation failed'
        };
      }
    }
  }

  /**
   * Create new session
   */
  async createSession(userId: string, userRole: string, socketId: string, metadata: any): Promise<SessionData> {
    const timer = performanceTimer('websocket_auth_create_session');

    try {
      const sessionData: SessionData = {
        userId,
        userRole,
        sessionId: this.generateSessionId(),
        loginTime: new Date(),
        lastActivity: new Date(),
        ipAddress: metadata.ipAddress || '',
        userAgent: metadata.userAgent || '',
        isActive: true
      };

      // Store in memory and Redis
      this.activeSessions.set(userId, sessionData);
      await redisClient.setex(`session_${userId}`, 15 * 60, JSON.stringify(sessionData));

      // Set session timeout
      const timeout = setTimeout(() => {
        this.handleSessionTimeout(userId);
      }, 15 * 60 * 1000); // 15 minutes

      this.sessionTimeouts.set(userId, timeout);

      // Create login event
      const authEvent: AuthenticationEvent = {
        eventType: 'login',
        userId,
        sessionId: sessionData.sessionId,
        timestamp: new Date(),
        metadata: {
          socketId,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent
        }
      };

      await this.logAuthenticationEvent(authEvent);

      timer.end();

      logger.info('Session created', {
        userId,
        sessionId: sessionData.sessionId,
        socketId,
        userRole
      });

      return sessionData;

    } catch (error) {
      timer.end();
      logger.error('Session creation failed', {
        userId,
        socketId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Revoke user session
   */
  async revokeSession(userId: string, reason: string = 'admin_revoke'): Promise<void> {
    const timer = performanceTimer('websocket_auth_revoke_session');

    try {
      const sessionData = this.activeSessions.get(userId);
      if (sessionData) {
        // Mark as inactive
        sessionData.isActive = false;

        // Remove from active sessions
        this.activeSessions.delete(userId);

        // Remove from Redis
        await redisClient.del(`session_${userId}`);

        // Clear timeout
        const timeout = this.sessionTimeouts.get(userId);
        if (timeout) {
          clearTimeout(timeout);
          this.sessionTimeouts.delete(userId);
        }

        // Notify user
        const userSocket = this.findUserSocket(userId);
        if (userSocket) {
          userSocket.emit('auth_session_revoked', {
            reason,
            message: 'Your session has been revoked',
            timestamp: new Date()
          });

          setTimeout(() => {
            userSocket.disconnect(true);
          }, 2000);
        }

        // Create revocation event
        const authEvent: AuthenticationEvent = {
          eventType: 'logout',
          userId,
          sessionId: sessionData.sessionId,
          timestamp: new Date(),
          metadata: {
            reason,
            revokedBy: 'system'
          }
        };

        await this.logAuthenticationEvent(authEvent);
      }

      timer.end();

      logger.info('Session revoked', {
        userId,
        reason
      });

    } catch (error) {
      timer.end();
      logger.error('Session revocation failed', {
        userId,
        reason,
        error: (error as Error).message
      });
    }
  }

  /**
   * Get active sessions for user
   */
  async getActiveSessions(userId: string): Promise<SessionData[]> {
    const timer = performanceTimer('websocket_auth_get_active_sessions');

    try {
      const pattern = `session_${userId}_*`;
      const sessionKeys = await redisClient.keys(pattern);

      const sessions: SessionData[] = [];
      for (const key of sessionKeys) {
        const sessionData = await redisClient.get(key);
        if (sessionData) {
          const session: SessionData = JSON.parse(sessionData);
          if (session.isActive) {
            sessions.push(session);
          }
        }
      }

      timer.end();

      return sessions;

    } catch (error) {
      timer.end();
      logger.error('Failed to get active sessions', {
        userId,
        error: (error as Error).message
      });
      return [];
    }
  }

  /**
   * Get authentication statistics
   */
  getAuthenticationStats(): {
    activeSessions: number;
    sessionsByRole: Record<string, number>;
    averageSessionDuration: number;
    loginRate: number;
    logoutRate: number;
  } {
    const sessionsByRole: Record<string, number> = {};
    let totalSessionDuration = 0;

    this.activeSessions.forEach(session => {
      sessionsByRole[session.userRole] = (sessionsByRole[session.userRole] || 0) + 1;
      totalSessionDuration += Date.now() - session.loginTime.getTime();
    });

    return {
      activeSessions: this.activeSessions.size,
      sessionsByRole,
      averageSessionDuration: this.activeSessions.size > 0 ?
        totalSessionDuration / this.activeSessions.size : 0,
      loginRate: 0, // Would calculate from metrics
      logoutRate: 0  // Would calculate from metrics
    };
  }

  // Private helper methods

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  }

  private findUserSocket(userId: string): Socket | null {
    for (const [socketId, user] of this.connectedUsers.entries()) {
      if (user.userId === userId) {
        return this.io.sockets.sockets.get(socketId) || null;
      }
    }
    return null;
  }

  private async logAuthenticationEvent(event: AuthenticationEvent): Promise<void> {
    try {
      // Store authentication event in Redis for audit trail
      const eventKey = `auth_event_${event.userId}_${Date.now()}`;
      await redisClient.setex(eventKey, 30 * 24 * 60 * 60, JSON.stringify(event)); // 30 days

      // Also log to application logs
      logger.info('Authentication event logged', {
        eventType: event.eventType,
        userId: event.userId,
        sessionId: event.sessionId,
        timestamp: event.timestamp
      });

    } catch (error) {
      logger.error('Failed to log authentication event', {
        event,
        error: (error as Error).message
      });
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    const timer = performanceTimer('websocket_auth_cleanup_sessions');

    try {
      const now = Date.now();
      const expiredSessions: string[] = [];

      // Check all active sessions
      this.activeSessions.forEach((session, userId) => {
        const sessionAge = now - session.lastActivity.getTime();
        if (sessionAge > 15 * 60 * 1000) { // 15 minutes
          expiredSessions.push(userId);
        }
      });

      // Clean up expired sessions
      for (const userId of expiredSessions) {
        await this.handleSessionTimeout(userId);
      }

      timer.end();

      logger.info('Session cleanup completed', {
        expiredSessions: expiredSessions.length,
        remainingSessions: this.activeSessions.size
      });

    } catch (error) {
      timer.end();
      logger.error('Session cleanup failed', {
        error: (error as Error).message
      });
    }
  }

  /**
   * Force logout all sessions for a user
   */
  async forceLogoutUser(userId: string, reason: string = 'admin_force_logout'): Promise<void> {
    const timer = performanceTimer('websocket_auth_force_logout');

    try {
      // Get all sessions for user
      const sessions = await this.getActiveSessions(userId);

      // Revoke all sessions
      for (const session of sessions) {
        await this.revokeSession(userId, reason);
      }

      // Remove from active sessions
      this.activeSessions.delete(userId);

      // Clear timeouts
      const timeout = this.sessionTimeouts.get(userId);
      if (timeout) {
        clearTimeout(timeout);
        this.sessionTimeouts.delete(userId);
      }

      timer.end();

      logger.info('User force logged out', {
        userId,
        reason,
        sessionsRevoked: sessions.length
      });

    } catch (error) {
      timer.end();
      logger.error('Force logout failed', {
        userId,
        reason,
        error: (error as Error).message
      });
    }
  }
}

export const authHandler = new AuthHandler();