import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
// NEW
import { loggers } from '../utils/logger';
import { performanceTimer } from '../utils/performance';
import { AuthenticatedRequest, blacklistToken } from '../middleware/auth.middleware';

export class AuthController {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('auth_register_controller');

    try {
      const { email, password, firstName, lastName, role } = req.body;

      loggers.auth('Registration attempt started', { email, role });

      const result = await authService.register({
        email,
        password,
        firstName,
        lastName,
        role,
      });

      if (result.success) {
        loggers.auth('Registration successful', {
          userId: result.user?.id,
          email: result.user?.email,
          role: result.user?.role,
        });

        res.status(201).json({
          success: true,
          message: result.message,
          data: {
            user: result.user,
            token: result.token,
            refreshToken: result.refreshToken,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        loggers.auth('Registration failed', { email, reason: result.message });

        res.status(400).json({
          success: false,
          message: result.message,
          error: 'REGISTRATION_FAILED',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      loggers.errorWithContext(error as Error, 'AUTH_REGISTER_CONTROLLER', {
        email: req.body.email,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        message: 'Registration failed due to server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    } finally {
      timer.end();
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('auth_login_controller');

    try {
      const { email, password } = req.body;

      loggers.auth('Login attempt started', { email, ip: req.ip });

      const result = await authService.login({ email, password });

      if (result.success) {
        loggers.auth('Login successful', {
          userId: result.user?.id,
          email: result.user?.email,
          role: result.user?.role,
          ip: req.ip,
        });

        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            user: result.user,
            token: result.token,
            refreshToken: result.refreshToken,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        loggers.security('Login failed', {
          email,
          reason: result.message,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        res.status(401).json({
          success: false,
          message: result.message,
          error: 'LOGIN_FAILED',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      loggers.errorWithContext(error as Error, 'AUTH_LOGIN_CONTROLLER', {
        email: req.body.email,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        message: 'Login failed due to server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    } finally {
      timer.end();
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('auth_refresh_token_controller');

    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required',
          error: 'MISSING_REFRESH_TOKEN',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      loggers.auth('Token refresh attempt started', { ip: req.ip });

      const result = await authService.refreshToken(refreshToken);

      if (result.success) {
        loggers.auth('Token refresh successful', {
          userId: result.user?.id,
          email: result.user?.email,
        });

        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            user: result.user,
            token: result.token,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        loggers.security('Token refresh failed', {
          reason: result.message,
          ip: req.ip,
        });

        res.status(401).json({
          success: false,
          message: result.message,
          error: 'REFRESH_FAILED',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      loggers.errorWithContext(error as Error, 'AUTH_REFRESH_TOKEN_CONTROLLER', {
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        message: 'Token refresh failed due to server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    } finally {
      timer.end();
    }
  }

  /**
   * Logout user
   */
  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    const timer = performanceTimer('auth_logout_controller');

    try {
      const userId = req.user?.userId;
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'UNAUTHORIZED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      loggers.auth('Logout attempt started', { userId });

      // Logout from service (removes refresh token)
      const result = await authService.logout(userId);

      // Blacklist the current access token
      if (token) {
        await blacklistToken(token, 24 * 60 * 60); // 24 hours
      }

      if (result.success) {
        loggers.auth('Logout successful', { userId });

        res.status(200).json({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: 'LOGOUT_FAILED',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      loggers.errorWithContext(error as Error, 'AUTH_LOGOUT_CONTROLLER', {
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        message: 'Logout failed due to server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    } finally {
      timer.end();
    }
  }

  /**
   * Get user profile
   */
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const timer = performanceTimer('auth_get_profile_controller');

    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'UNAUTHORIZED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      loggers.auth('Profile retrieval started', { userId });

      const result = await authService.getProfile(userId);

      if (result.success) {
        loggers.auth('Profile retrieved successfully', { userId });

        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            user: result.user,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.message,
          error: 'PROFILE_NOT_FOUND',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      loggers.errorWithContext(error as Error, 'AUTH_GET_PROFILE_CONTROLLER', {
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile due to server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    } finally {
      timer.end();
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('auth_request_password_reset_controller');

    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
          error: 'MISSING_EMAIL',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      loggers.auth('Password reset request started', { email, ip: req.ip });

      const result = await authService.generatePasswordResetToken(email);

      // Always return success for security (don't reveal if email exists)
      loggers.auth('Password reset request processed', { email });

      res.status(200).json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString(),
      });

      // In a real application, you would send the reset token via email
      // For development, you might want to log it
      if (process.env.NODE_ENV === 'development' && result.token) {
        loggers.auth('Password reset token (DEV ONLY)', {
          email,
          token: result.token,
        });
      }
    } catch (error) {
      loggers.errorWithContext(error as Error, 'AUTH_REQUEST_PASSWORD_RESET_CONTROLLER', {
        email: req.body.email,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        message: 'Password reset request failed due to server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    } finally {
      timer.end();
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('auth_reset_password_controller');

    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Token and new password are required',
          error: 'MISSING_FIELDS',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      loggers.auth('Password reset attempt started', { ip: req.ip });

      const result = await authService.resetPassword(token, newPassword);

      if (result.success) {
        loggers.auth('Password reset successful', { ip: req.ip });

        res.status(200).json({
          success: true,
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      } else {
        loggers.security('Password reset failed', {
          reason: result.message,
          ip: req.ip,
        });

        res.status(400).json({
          success: false,
          message: result.message,
          error: 'RESET_FAILED',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      loggers.errorWithContext(error as Error, 'AUTH_RESET_PASSWORD_CONTROLLER', {
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        message: 'Password reset failed due to server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    } finally {
      timer.end();
    }
  }

  /**
   * Verify email (placeholder for future implementation)
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      // TODO: Implement email verification logic
      loggers.auth('Email verification attempted', { token, ip: req.ip });

      res.status(200).json({
        success: true,
        message: 'Email verification feature coming soon',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      loggers.errorWithContext(error as Error, 'AUTH_VERIFY_EMAIL_CONTROLLER', {
        token: req.params.token,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        message: 'Email verification failed due to server error',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Health check for authentication service
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        message: 'Authentication service is healthy',
        service: 'auth',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      });
    } catch (error) {
      loggers.errorWithContext(error as Error, 'AUTH_HEALTH_CHECK');

      res.status(500).json({
        success: false,
        message: 'Authentication service health check failed',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Export singleton instance
export const authController = new AuthController();

