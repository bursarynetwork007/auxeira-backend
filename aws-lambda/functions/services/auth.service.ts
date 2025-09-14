import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool, cacheHelpers } from '../config/database';
import { logger, loggers, performanceTimer } from '../utils/logger';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'founder' | 'investor' | 'admin';
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'student' | 'founder' | 'investor' | 'admin';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: Omit<User, 'password'>;
  token?: string;
  refreshToken?: string;
  message: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
  private readonly JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  private readonly BCRYPT_ROUNDS = 12;

  /**
   * Register a new user
   */
  async register(userData: RegisterData): Promise<AuthResult> {
    const timer = performanceTimer('auth_register');

    try {
      const { email, password, firstName, lastName, role = 'student' } = userData;

      // Validate input
      if (!email || !password || !firstName || !lastName) {
        return {
          success: false,
          message: 'Missing required fields: email, password, firstName, lastName',
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          message: 'Invalid email format',
        };
      }

      // Validate password strength
      if (password.length < 8) {
        return {
          success: false,
          message: 'Password must be at least 8 characters long',
        };
      }

      // Check if user already exists
      const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
      const existingUser = await pool.query(existingUserQuery, [email.toLowerCase()]);

      if (existingUser.rows.length > 0) {
        loggers.security('Registration attempt with existing email', { email });
        return {
          success: false,
          message: 'User with this email already exists',
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, this.BCRYPT_ROUNDS);

      // Create user
      const insertUserQuery = `
        INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, email, first_name, last_name, role, email_verified, created_at, updated_at
      `;

      const result = await pool.query(insertUserQuery, [
        email.toLowerCase(),
        passwordHash,
        firstName.trim(),
        lastName.trim(),
        role,
        false, // email_verified
      ]);

      const user = result.rows[0];

      // Generate tokens
      const token = this.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const refreshToken = this.generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Store refresh token in cache
      await cacheHelpers.set(
        `refresh_token:${user.id}`,
        refreshToken,
        7 * 24 * 60 * 60 // 7 days in seconds
      );

      loggers.auth('User registered successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      timer.end?.();

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          emailVerified: user.email_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
        token,
        refreshToken,
        message: 'User registered successfully',
      };
    } catch (error) {
      timer.end?.();
      loggers.errorWithContext(error as Error, 'AUTH_REGISTER', { email: userData.email });
      return {
        success: false,
        message: 'Registration failed due to server error',
      };
    }
  }

  /**
   * Login user
   */
  async login(loginData: LoginData): Promise<AuthResult> {
    const timer = performanceTimer('auth_login');

    try {
      const { email, password } = loginData;

      // Validate input
      if (!email || !password) {
        return {
          success: false,
          message: 'Email and password are required',
        };
      }

      // Get user from database
      const getUserQuery = `
        SELECT id, email, password_hash, first_name, last_name, role, email_verified, created_at, updated_at
        FROM users
        WHERE email = $1
      `;

      const result = await pool.query(getUserQuery, [email.toLowerCase()]);

      if (result.rows.length === 0) {
        loggers.security('Login attempt with non-existent email', { email });
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        loggers.security('Login attempt with invalid password', {
          userId: user.id,
          email: user.email,
        });
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Generate tokens
      const token = this.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const refreshToken = this.generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Store refresh token in cache
      await cacheHelpers.set(
        `refresh_token:${user.id}`,
        refreshToken,
        7 * 24 * 60 * 60 // 7 days in seconds
      );

      // Update last login
      await pool.query(
        'UPDATE users SET updated_at = NOW() WHERE id = $1',
        [user.id]
      );

      loggers.auth('User logged in successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      timer.end?.();

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          emailVerified: user.email_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
        token,
        refreshToken,
        message: 'Login successful',
      };
    } catch (error) {
      timer.end?.();
      loggers.errorWithContext(error as Error, 'AUTH_LOGIN', { email: loginData.email });
      return {
        success: false,
        message: 'Login failed due to server error',
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as TokenPayload;

      // Check if refresh token exists in cache
      const cachedToken = await cacheHelpers.get(`refresh_token:${decoded.userId}`);
      if (!cachedToken || cachedToken !== refreshToken) {
        loggers.security('Invalid refresh token used', { userId: decoded.userId });
        return {
          success: false,
          message: 'Invalid refresh token',
        };
      }

      // Get user from database
      const getUserQuery = `
        SELECT id, email, first_name, last_name, role, email_verified, created_at, updated_at
        FROM users
        WHERE id = $1
      `;

      const result = await pool.query(getUserQuery, [decoded.userId]);

      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const user = result.rows[0];

      // Generate new access token
      const newToken = this.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      loggers.auth('Token refreshed successfully', { userId: user.id });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          emailVerified: user.email_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
        token: newToken,
        message: 'Token refreshed successfully',
      };
    } catch (error) {
      loggers.errorWithContext(error as Error, 'AUTH_REFRESH_TOKEN');
      return {
        success: false,
        message: 'Invalid or expired refresh token',
      };
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Remove refresh token from cache
      await cacheHelpers.del(`refresh_token:${userId}`);

      loggers.auth('User logged out successfully', { userId });

      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error) {
      loggers.errorWithContext(error as Error, 'AUTH_LOGOUT', { userId });
      return {
        success: false,
        message: 'Logout failed',
      };
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<AuthResult> {
    try {
      const getUserQuery = `
        SELECT id, email, first_name, last_name, role, email_verified, created_at, updated_at
        FROM users
        WHERE id = $1
      `;

      const result = await pool.query(getUserQuery, [userId]);

      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const user = result.rows[0];

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          emailVerified: user.email_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
        message: 'Profile retrieved successfully',
      };
    } catch (error) {
      loggers.errorWithContext(error as Error, 'AUTH_GET_PROFILE', { userId });
      return {
        success: false,
        message: 'Failed to retrieve profile',
      };
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      loggers.security('Invalid token verification attempt', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * Generate access token
   */
  private generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.JWT_SECRET as string, {
      expiresIn: '24h'
    });
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.JWT_REFRESH_SECRET as string, {
      expiresIn: '7d',
    });
  }

  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(email: string): Promise<{ success: boolean; message: string; token?: string }> {
    try {
      // Check if user exists
      const getUserQuery = 'SELECT id FROM users WHERE email = $1';
      const result = await pool.query(getUserQuery, [email.toLowerCase()]);

      if (result.rows.length === 0) {
        // Don't reveal if email exists or not for security
        return {
          success: true,
          message: 'If the email exists, a reset link has been sent',
        };
      }

      const userId = result.rows[0].id;

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Store reset token in cache (expires in 1 hour)
      await cacheHelpers.set(
        `password_reset:${resetToken}`,
        userId,
        60 * 60 // 1 hour in seconds
      );

      loggers.auth('Password reset token generated', { userId, email });

      return {
        success: true,
        message: 'Password reset token generated',
        token: resetToken,
      };
    } catch (error) {
      loggers.errorWithContext(error as Error, 'AUTH_GENERATE_RESET_TOKEN', { email });
      return {
        success: false,
        message: 'Failed to generate reset token',
      };
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate new password
      if (newPassword.length < 8) {
        return {
          success: false,
          message: 'Password must be at least 8 characters long',
        };
      }

      // Get user ID from reset token
      const userId = await cacheHelpers.get(`password_reset:${token}`);
      if (!userId) {
        return {
          success: false,
          message: 'Invalid or expired reset token',
        };
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);

      // Update password
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [passwordHash, userId]
      );

      // Remove reset token
      await cacheHelpers.del(`password_reset:${token}`);

      // Remove all refresh tokens for this user
      await cacheHelpers.del(`refresh_token:${userId}`);

      loggers.auth('Password reset successfully', { userId });

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      loggers.errorWithContext(error as Error, 'AUTH_RESET_PASSWORD');
      return {
        success: false,
        message: 'Failed to reset password',
      };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();