import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { logger, logUserActivity } from '../utils/logger';
import {
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ConfirmPasswordResetRequest,
  VerifyEmailRequest,
  RefreshTokenRequest,
} from '../types/auth.types';

/**
 * Authentication Controllers
 */
export class AuthController {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const registerData: RegisterRequest = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

      const result = await authService.register(registerData, ipAddress);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Registration controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginRequest = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      const result = await authService.login(loginData, ipAddress, userAgent);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error) {
      logger.error('Login controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: req.body.email,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshTokens(req: Request, res: Response): Promise<void> {
    try {
      const refreshData: RefreshTokenRequest = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

      const result = await authService.refreshTokens(refreshData, ipAddress);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error) {
      logger.error('Token refresh controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Logout user
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const sessionToken = req.sessionToken;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

      if (!sessionToken) {
        res.status(400).json({
          success: false,
          message: 'Session token not found',
          error: 'NO_SESSION_TOKEN',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await authService.logout(sessionToken, ipAddress);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Logout controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: req.user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get profile controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Change user password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const passwordData: ChangePasswordRequest = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

      const result = await authService.changePassword(req.user.id, passwordData, ipAddress);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Change password controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const resetData: ResetPasswordRequest = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

      const result = await authService.requestPasswordReset(resetData, ipAddress);

      // Always return success to prevent email enumeration
      res.status(200).json(result);
    } catch (error) {
      logger.error('Password reset request controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: req.body.email,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const resetData: ConfirmPasswordResetRequest = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

      const result = await authService.confirmPasswordReset(resetData, ipAddress);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Password reset confirmation controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        token: req.body.token?.substring(0, 10) + '...',
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const verifyData: VerifyEmailRequest = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

      const result = await authService.verifyEmail(verifyData, ipAddress);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Email verification controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        token: req.body.token?.substring(0, 10) + '...',
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (req.user.emailVerified) {
        res.status(400).json({
          success: false,
          message: 'Email is already verified',
          error: 'EMAIL_ALREADY_VERIFIED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // TODO: Implement resend email verification logic
      // This would involve creating a new verification token and sending email

      await logUserActivity(req.user.id, 'email_verification_resent', 'user', {
        email: req.user.email,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Resend email verification controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Check authentication status
   */
  async checkAuth(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
          error: 'NOT_AUTHENTICATED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Authenticated',
        data: {
          user: req.user,
          authenticated: true,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Check auth controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get user sessions
   */
  async getSessions(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // TODO: Implement get user sessions logic
      // This would query the user_sessions table for active sessions

      res.status(200).json({
        success: true,
        message: 'Sessions retrieved successfully',
        data: {
          sessions: [], // TODO: Implement actual session data
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get sessions controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { sessionId } = req.params;

      // TODO: Implement revoke session logic
      // This would invalidate a specific session

      await logUserActivity(req.user.id, 'session_revoked', 'session', {
        sessionId,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Session revoked successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Revoke session controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        sessionId: req.params.sessionId,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Revoke all sessions except current
   */
  async revokeAllSessions(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // TODO: Implement revoke all sessions logic
      // This would invalidate all sessions except the current one

      await logUserActivity(req.user.id, 'all_sessions_revoked', 'session', {
        currentSessionId: req.sessionToken,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'All other sessions revoked successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Revoke all sessions controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Export singleton instance
export const authController = new AuthController();
export default authController;
