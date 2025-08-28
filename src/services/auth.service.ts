import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../config/database';
import { redis } from '../config/redis';
import { config } from '../config';
import { logger, logUserActivity, logSecurityEvent } from '../utils/logger';
import {
  LoginRequest,
  RegisterRequest,
  AuthTokens,
  JWTPayload,
  AuthenticatedUser,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ConfirmPasswordResetRequest,
  VerifyEmailRequest,
  RefreshTokenRequest,
  AuthResponse,
} from '../types/auth.types';

export class AuthService {
  private readonly JWT_SECRET = config.jwt.secret;
  private readonly JWT_EXPIRES_IN = config.jwt.expiresIn;
  private readonly JWT_REFRESH_EXPIRES_IN = config.jwt.refreshExpiresIn;
  private readonly BCRYPT_ROUNDS = config.security.bcryptRounds;
  private readonly MAX_LOGIN_ATTEMPTS = config.security.maxLoginAttempts;
  private readonly LOCKOUT_DURATION = config.security.lockoutDuration;

  /**
   * Register a new user
   */
  async register(registerData: RegisterRequest, ipAddress: string): Promise<AuthResponse<{ user: AuthenticatedUser; tokens: AuthTokens }>> {
    try {
      // Validate input
      const validation = await this.validateRegistration(registerData);
      if (!validation.isValid) {
        return this.createErrorResponse(validation.message || 'Invalid registration data');
      }

      // Check if user already exists
      const existingUser = await this.getUserByEmail(registerData.email);
      if (existingUser) {
        logSecurityEvent('registration_attempt_existing_email', {
          email: registerData.email,
          ipAddress,
        });
        return this.createErrorResponse('User with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(registerData.password, this.BCRYPT_ROUNDS);

      // Create user
      const userId = uuidv4();
      const emailVerificationToken = this.generateSecureToken();

      const query = `
        INSERT INTO users (
          id, email, password_hash, first_name, last_name, role,
          phone_number, timezone, language, organization_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, email, first_name, last_name, role, status, subscription_tier,
                  email_verified, organization_id, preferences, created_at
      `;

      const values = [
        userId,
        registerData.email.toLowerCase(),
        passwordHash,
        registerData.firstName,
        registerData.lastName,
        registerData.role,
        registerData.phoneNumber || null,
        registerData.timezone || 'UTC',
        registerData.language || 'en',
        registerData.organizationId || null,
      ];

      const result = await database.query(query, values);
      const user = result.rows[0];

      // Create email verification token
      await this.createEmailVerificationToken(userId, emailVerificationToken);

      // Generate authentication tokens
      const tokens = await this.generateTokens(user, ipAddress);

      // Log user activity
      await logUserActivity(userId, 'user_registered', 'user', {
        email: registerData.email,
        role: registerData.role,
        ipAddress,
      });

      // TODO: Send welcome email with verification link
      // await this.sendWelcomeEmail(user, emailVerificationToken);

      const authenticatedUser = this.formatAuthenticatedUser(user);

      return this.createSuccessResponse('User registered successfully', {
        user: authenticatedUser,
        tokens,
      });
    } catch (error) {
      logger.error('Registration failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: registerData.email,
        ipAddress,
      });
      return this.createErrorResponse('Registration failed. Please try again.');
    }
  }

  /**
   * Login user
   */
  async login(loginData: LoginRequest, ipAddress: string, userAgent: string): Promise<AuthResponse<{ user: AuthenticatedUser; tokens: AuthTokens }>> {
    try {
      // Get user by email
      const user = await this.getUserByEmail(loginData.email);
      if (!user) {
        logSecurityEvent('login_attempt_invalid_email', {
          email: loginData.email,
          ipAddress,
          userAgent,
        });
        return this.createErrorResponse('Invalid credentials');
      }

      // Check if account is locked
      if (user.locked_until && new Date() < new Date(user.locked_until)) {
        logSecurityEvent('login_attempt_locked_account', {
          userId: user.id,
          email: loginData.email,
          ipAddress,
          lockedUntil: user.locked_until,
        });
        return this.createErrorResponse('Account is temporarily locked. Please try again later.');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginData.password, user.password_hash);
      if (!isPasswordValid) {
        await this.handleFailedLogin(user.id, ipAddress, userAgent);
        return this.createErrorResponse('Invalid credentials');
      }

      // Check if account is active
      if (user.status !== 'active' && user.status !== 'pending_verification') {
        logSecurityEvent('login_attempt_inactive_account', {
          userId: user.id,
          email: loginData.email,
          status: user.status,
          ipAddress,
        });
        return this.createErrorResponse('Account is not active. Please contact support.');
      }

      // Reset login attempts on successful login
      await this.resetLoginAttempts(user.id);

      // Generate authentication tokens
      const tokens = await this.generateTokens(user, ipAddress, userAgent, loginData.rememberMe);

      // Update last login
      await this.updateLastLogin(user.id, ipAddress);

      // Log successful login
      await logUserActivity(user.id, 'user_login', 'user', {
        email: loginData.email,
        ipAddress,
        userAgent,
        rememberMe: loginData.rememberMe,
      });

      const authenticatedUser = this.formatAuthenticatedUser(user);

      return this.createSuccessResponse('Login successful', {
        user: authenticatedUser,
        tokens,
      });
    } catch (error) {
      logger.error('Login failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: loginData.email,
        ipAddress,
      });
      return this.createErrorResponse('Login failed. Please try again.');
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshTokens(refreshData: RefreshTokenRequest, ipAddress: string): Promise<AuthResponse<AuthTokens>> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshData.refreshToken, this.JWT_SECRET) as JWTPayload;

      // Get session from database
      const sessionQuery = `
        SELECT s.*, u.id, u.email, u.first_name, u.last_name, u.role, u.status,
               u.subscription_tier, u.email_verified, u.organization_id, u.preferences
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.refresh_token = $1 AND s.is_active = true AND s.expires_at > NOW()
      `;

      const sessionResult = await database.query(sessionQuery, [refreshData.refreshToken]);
      if (sessionResult.rows.length === 0) {
        logSecurityEvent('refresh_token_invalid', {
          refreshToken: refreshData.refreshToken.substring(0, 10) + '...',
          ipAddress,
        });
        return this.createErrorResponse('Invalid refresh token');
      }

      const session = sessionResult.rows[0];
      const user = {
        id: session.id,
        email: session.email,
        first_name: session.first_name,
        last_name: session.last_name,
        role: session.role,
        status: session.status,
        subscription_tier: session.subscription_tier,
        email_verified: session.email_verified,
        organization_id: session.organization_id,
        preferences: session.preferences,
      };

      // Generate new tokens
      const tokens = await this.generateTokens(user, ipAddress);

      // Invalidate old refresh token
      await this.invalidateSession(session.id);

      // Log token refresh
      await logUserActivity(user.id, 'tokens_refreshed', 'session', {
        sessionId: session.id,
        ipAddress,
      });

      return this.createSuccessResponse('Tokens refreshed successfully', tokens);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        logSecurityEvent('refresh_token_invalid_jwt', {
          error: error.message,
          ipAddress,
        });
        return this.createErrorResponse('Invalid refresh token');
      }

      logger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ipAddress,
      });
      return this.createErrorResponse('Token refresh failed. Please login again.');
    }
  }

  /**
   * Logout user
   */
  async logout(sessionToken: string, ipAddress: string): Promise<AuthResponse<null>> {
    try {
      // Find and invalidate session
      const sessionQuery = `
        UPDATE user_sessions
        SET is_active = false, last_active_at = NOW()
        WHERE session_token = $1 AND is_active = true
        RETURNING user_id, id
      `;

      const result = await database.query(sessionQuery, [sessionToken]);
      if (result.rows.length === 0) {
        return this.createErrorResponse('Session not found');
      }

      const { user_id: userId, id: sessionId } = result.rows[0];

      // Remove from Redis cache
      await this.removeSessionFromCache(sessionToken);

      // Log logout
      await logUserActivity(userId, 'user_logout', 'session', {
        sessionId,
        ipAddress,
      });

      return this.createSuccessResponse('Logged out successfully', null);
    } catch (error) {
      logger.error('Logout failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionToken: sessionToken.substring(0, 10) + '...',
        ipAddress,
      });
      return this.createErrorResponse('Logout failed. Please try again.');
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, passwordData: ChangePasswordRequest, ipAddress: string): Promise<AuthResponse<null>> {
    try {
      // Get current user
      const user = await this.getUserById(userId);
      if (!user) {
        return this.createErrorResponse('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(passwordData.currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        logSecurityEvent('password_change_invalid_current', {
          userId,
          ipAddress,
        });
        return this.createErrorResponse('Current password is incorrect');
      }

      // Validate new password
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        return this.createErrorResponse('New passwords do not match');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(passwordData.newPassword, this.BCRYPT_ROUNDS);

      // Update password
      const updateQuery = `
        UPDATE users
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2
      `;

      await database.query(updateQuery, [newPasswordHash, userId]);

      // Invalidate all user sessions except current one
      await this.invalidateAllUserSessions(userId);

      // Log password change
      await logUserActivity(userId, 'password_changed', 'user', {
        ipAddress,
      });

      logSecurityEvent('password_changed', {
        userId,
        ipAddress,
      });

      return this.createSuccessResponse('Password changed successfully', null);
    } catch (error) {
      logger.error('Password change failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        ipAddress,
      });
      return this.createErrorResponse('Password change failed. Please try again.');
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(resetData: ResetPasswordRequest, ipAddress: string): Promise<AuthResponse<null>> {
    try {
      // Get user by email
      const user = await this.getUserByEmail(resetData.email);
      if (!user) {
        // Don't reveal if email exists or not
        return this.createSuccessResponse('If the email exists, a password reset link has been sent', null);
      }

      // Generate reset token
      const resetToken = this.generateSecureToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      const tokenQuery = `
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES ($1, $2, $3)
      `;

      await database.query(tokenQuery, [user.id, resetToken, expiresAt]);

      // Log password reset request
      await logUserActivity(user.id, 'password_reset_requested', 'user', {
        email: resetData.email,
        ipAddress,
      });

      logSecurityEvent('password_reset_requested', {
        userId: user.id,
        email: resetData.email,
        ipAddress,
      });

      // TODO: Send password reset email
      // await this.sendPasswordResetEmail(user, resetToken);

      return this.createSuccessResponse('If the email exists, a password reset link has been sent', null);
    } catch (error) {
      logger.error('Password reset request failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: resetData.email,
        ipAddress,
      });
      return this.createErrorResponse('Password reset request failed. Please try again.');
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(resetData: ConfirmPasswordResetRequest, ipAddress: string): Promise<AuthResponse<null>> {
    try {
      // Validate passwords match
      if (resetData.newPassword !== resetData.confirmPassword) {
        return this.createErrorResponse('Passwords do not match');
      }

      // Find valid reset token
      const tokenQuery = `
        SELECT prt.*, u.id as user_id, u.email
        FROM password_reset_tokens prt
        JOIN users u ON prt.user_id = u.id
        WHERE prt.token = $1 AND prt.expires_at > NOW() AND prt.used_at IS NULL
      `;

      const tokenResult = await database.query(tokenQuery, [resetData.token]);
      if (tokenResult.rows.length === 0) {
        logSecurityEvent('password_reset_invalid_token', {
          token: resetData.token.substring(0, 10) + '...',
          ipAddress,
        });
        return this.createErrorResponse('Invalid or expired reset token');
      }

      const tokenData = tokenResult.rows[0];

      // Hash new password
      const newPasswordHash = await bcrypt.hash(resetData.newPassword, this.BCRYPT_ROUNDS);

      // Update password and mark token as used
      await database.query('BEGIN');

      try {
        // Update password
        await database.query(
          'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
          [newPasswordHash, tokenData.user_id]
        );

        // Mark token as used
        await database.query(
          'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
          [tokenData.id]
        );

        // Invalidate all user sessions
        await this.invalidateAllUserSessions(tokenData.user_id);

        await database.query('COMMIT');

        // Log password reset
        await logUserActivity(tokenData.user_id, 'password_reset_completed', 'user', {
          email: tokenData.email,
          ipAddress,
        });

        logSecurityEvent('password_reset_completed', {
          userId: tokenData.user_id,
          email: tokenData.email,
          ipAddress,
        });

        return this.createSuccessResponse('Password reset successfully', null);
      } catch (error) {
        await database.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      logger.error('Password reset confirmation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        token: resetData.token.substring(0, 10) + '...',
        ipAddress,
      });
      return this.createErrorResponse('Password reset failed. Please try again.');
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(verifyData: VerifyEmailRequest, ipAddress: string): Promise<AuthResponse<null>> {
    try {
      // Find valid verification token
      const tokenQuery = `
        SELECT evt.*, u.id as user_id, u.email
        FROM email_verification_tokens evt
        JOIN users u ON evt.user_id = u.id
        WHERE evt.token = $1 AND evt.expires_at > NOW() AND evt.verified_at IS NULL
      `;

      const tokenResult = await database.query(tokenQuery, [verifyData.token]);
      if (tokenResult.rows.length === 0) {
        logSecurityEvent('email_verification_invalid_token', {
          token: verifyData.token.substring(0, 10) + '...',
          ipAddress,
        });
        return this.createErrorResponse('Invalid or expired verification token');
      }

      const tokenData = tokenResult.rows[0];

      // Update user email verification status and mark token as used
      await database.query('BEGIN');

      try {
        // Mark email as verified
        await database.query(
          'UPDATE users SET email_verified = true, status = $1, updated_at = NOW() WHERE id = $2',
          ['active', tokenData.user_id]
        );

        // Mark token as verified
        await database.query(
          'UPDATE email_verification_tokens SET verified_at = NOW() WHERE id = $1',
          [tokenData.id]
        );

        await database.query('COMMIT');

        // Log email verification
        await logUserActivity(tokenData.user_id, 'email_verified', 'user', {
          email: tokenData.email,
          ipAddress,
        });

        return this.createSuccessResponse('Email verified successfully', null);
      } catch (error) {
        await database.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      logger.error('Email verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        token: verifyData.token.substring(0, 10) + '...',
        ipAddress,
      });
      return this.createErrorResponse('Email verification failed. Please try again.');
    }
  }

  /**
   * Validate user session
   */
  async validateSession(sessionToken: string): Promise<AuthenticatedUser | null> {
    try {
      // Check Redis cache first
      const cachedUser = await this.getSessionFromCache(sessionToken);
      if (cachedUser) {
        return cachedUser;
      }

      // Check database
      const sessionQuery = `
        SELECT s.*, u.id, u.email, u.first_name, u.last_name, u.role, u.status,
               u.subscription_tier, u.email_verified, u.organization_id, u.preferences
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = $1 AND s.is_active = true AND s.expires_at > NOW()
      `;

      const result = await database.query(sessionQuery, [sessionToken]);
      if (result.rows.length === 0) {
        return null;
      }

      const session = result.rows[0];
      const user = this.formatAuthenticatedUser({
        id: session.id,
        email: session.email,
        first_name: session.first_name,
        last_name: session.last_name,
        role: session.role,
        status: session.status,
        subscription_tier: session.subscription_tier,
        email_verified: session.email_verified,
        organization_id: session.organization_id,
        preferences: session.preferences,
      });

      // Cache in Redis
      await this.cacheSession(sessionToken, user);

      // Update last active
      await this.updateSessionActivity(session.id);

      return user;
    } catch (error) {
      logger.error('Session validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionToken: sessionToken.substring(0, 10) + '...',
      });
      return null;
    }
  }

  // Private helper methods

  private async validateRegistration(data: RegisterRequest): Promise<{ isValid: boolean; message?: string }> {
    // Basic validation
    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      return { isValid: false, message: 'Missing required fields' };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { isValid: false, message: 'Invalid email format' };
    }

    // Password validation
    if (data.password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    if (data.password !== data.confirmPassword) {
      return { isValid: false, message: 'Passwords do not match' };
    }

    // Terms acceptance
    if (!data.acceptedTerms || !data.acceptedPrivacy) {
      return { isValid: false, message: 'You must accept the terms and privacy policy' };
    }

    return { isValid: true };
  }

  private async getUserByEmail(email: string): Promise<any> {
    const query = `
      SELECT id, email, password_hash, first_name, last_name, role, status,
             subscription_tier, email_verified, organization_id, preferences,
             login_attempts, locked_until
      FROM users
      WHERE email = $1 AND deleted_at IS NULL
    `;

    const result = await database.query(query, [email.toLowerCase()]);
    return result.rows[0] || null;
  }

  private async getUserById(userId: string): Promise<any> {
    const query = `
      SELECT id, email, password_hash, first_name, last_name, role, status,
             subscription_tier, email_verified, organization_id, preferences,
             login_attempts, locked_until
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await database.query(query, [userId]);
    return result.rows[0] || null;
  }

  private async generateTokens(user: any, ipAddress: string, userAgent?: string, rememberMe = false): Promise<AuthTokens> {
    const sessionId = uuidv4();
    const sessionToken = this.generateSecureToken();
    const refreshToken = this.generateSecureToken();

    // JWT payload
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60), // 30 days or 24 hours
    };

    // Generate JWT
    const accessToken = jwt.sign(payload, this.JWT_SECRET);
    const expiresIn = payload.exp - payload.iat;

    // Store session in database
    const expiresAt = new Date(payload.exp * 1000);
    const sessionQuery = `
      INSERT INTO user_sessions (
        id, user_id, session_token, refresh_token, user_agent, ip_address,
        expires_at, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
    `;

    await database.query(sessionQuery, [
      sessionId,
      user.id,
      sessionToken,
      refreshToken,
      userAgent || null,
      ipAddress,
      expiresAt,
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
    };
  }

  private formatAuthenticatedUser(user: any): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      status: user.status,
      subscriptionTier: user.subscription_tier,
      emailVerified: user.email_verified,
      organizationId: user.organization_id,
      profilePicture: user.profile_picture,
      preferences: user.preferences || {},
      permissions: [], // TODO: Implement role-based permissions
    };
  }

  private async handleFailedLogin(userId: string, ipAddress: string, userAgent?: string): Promise<void> {
    const updateQuery = `
      UPDATE users
      SET login_attempts = login_attempts + 1,
          locked_until = CASE
            WHEN login_attempts + 1 >= $2 THEN NOW() + INTERVAL '${this.LOCKOUT_DURATION} seconds'
            ELSE locked_until
          END,
          updated_at = NOW()
      WHERE id = $1
      RETURNING login_attempts, locked_until
    `;

    const result = await database.query(updateQuery, [userId, this.MAX_LOGIN_ATTEMPTS]);
    const { login_attempts, locked_until } = result.rows[0];

    logSecurityEvent('login_attempt_failed', {
      userId,
      ipAddress,
      userAgent,
      loginAttempts: login_attempts,
      lockedUntil: locked_until,
    });
  }

  private async resetLoginAttempts(userId: string): Promise<void> {
    await database.query(
      'UPDATE users SET login_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE id = $1',
      [userId]
    );
  }

  private async updateLastLogin(userId: string, ipAddress: string): Promise<void> {
    await database.query(
      'UPDATE users SET last_login_at = NOW(), last_active_at = NOW(), updated_at = NOW() WHERE id = $1',
      [userId]
    );
  }

  private async createEmailVerificationToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await database.query(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    );
  }

  private async invalidateSession(sessionId: string): Promise<void> {
    await database.query(
      'UPDATE user_sessions SET is_active = false WHERE id = $1',
      [sessionId]
    );
  }

  private async invalidateAllUserSessions(userId: string): Promise<void> {
    await database.query(
      'UPDATE user_sessions SET is_active = false WHERE user_id = $1',
      [userId]
    );
  }

  private async updateSessionActivity(sessionId: string): Promise<void> {
    await database.query(
      'UPDATE user_sessions SET last_active_at = NOW() WHERE id = $1',
      [sessionId]
    );
  }

  private async cacheSession(sessionToken: string, user: AuthenticatedUser): Promise<void> {
    try {
      if (redis.isReady()) {
        await redis.set(`session:${sessionToken}`, JSON.stringify(user), 3600); // 1 hour cache
      }
    } catch (error) {
      logger.warn('Failed to cache session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionToken: sessionToken.substring(0, 10) + '...',
      });
    }
  }

  private async getSessionFromCache(sessionToken: string): Promise<AuthenticatedUser | null> {
    try {
      if (redis.isReady()) {
        const cached = await redis.get(`session:${sessionToken}`);
        if (cached) {
          return JSON.parse(cached);
        }
      }
    } catch (error) {
      logger.warn('Failed to get session from cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionToken: sessionToken.substring(0, 10) + '...',
      });
    }
    return null;
  }

  private async removeSessionFromCache(sessionToken: string): Promise<void> {
    try {
      if (redis.isReady()) {
        await redis.getClient().del(`session:${sessionToken}`);
      }
    } catch (error) {
      logger.warn('Failed to remove session from cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionToken: sessionToken.substring(0, 10) + '...',
      });
    }
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private createSuccessResponse<T>(message: string, data: T): AuthResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
    };
  }

  private createErrorResponse(message: string): AuthResponse<null> {
    return {
      success: false,
      message,
      error: message,
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
