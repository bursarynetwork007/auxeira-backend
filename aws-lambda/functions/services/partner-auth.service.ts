import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../database/config';
import { logger } from '../utils/logger';
import { sendEmail } from '../utils/email';

export interface PartnerUser {
    id: string;
    partnerId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'viewer' | 'manager';
    isEmailVerified: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface PartnerLoginCredentials {
    email: string;
    password: string;
}

export interface PartnerSignupData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
    role?: 'admin' | 'manager';
}

export interface PartnerAuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export class PartnerAuthService {
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'auxeira-partner-secret';
    private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'auxeira-partner-refresh-secret';
    private readonly ACCESS_TOKEN_EXPIRY = '24h';
    private readonly REFRESH_TOKEN_EXPIRY = '30d';

    /**
     * Register a new partner user
     */
    async registerPartner(signupData: PartnerSignupData): Promise<{ user: PartnerUser; tokens: PartnerAuthTokens }> {
        try {
            // Check if email already exists
            const existingUser = await this.findPartnerByEmail(signupData.email);
            if (existingUser) {
                throw new Error('Email already registered');
            }

            // Check if partner organization exists
            let partnerId = await this.findPartnerIdByCompanyName(signupData.companyName);

            if (!partnerId) {
                // Create new partner organization if it doesn't exist
                partnerId = await this.createPartnerOrganization(signupData.companyName, signupData.email);
            }

            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(signupData.password, saltRounds);

            // Create partner user
            const userId = await this.createPartnerUser({
                partnerId,
                email: signupData.email,
                firstName: signupData.firstName,
                lastName: signupData.lastName,
                hashedPassword,
                role: signupData.role || 'admin'
            });

            // Generate verification token
            const verificationToken = this.generateVerificationToken(userId);
            await this.storeVerificationToken(userId, verificationToken);

            // Send verification email
            await this.sendVerificationEmail(signupData.email, signupData.firstName, verificationToken);

            // Get created user
            const user = await this.findPartnerById(userId);
            if (!user) {
                throw new Error('Failed to create user');
            }

            // Generate auth tokens
            const tokens = await this.generateTokens(user);

            logger.info(`Partner user registered: ${user.email}`, {
                userId: user.id,
                partnerId: user.partnerId,
                companyName: signupData.companyName
            });

            return { user, tokens };

        } catch (error) {
            logger.error('Error registering partner:', error);
            throw error;
        }
    }

    /**
     * Authenticate partner user login
     */
    async loginPartner(credentials: PartnerLoginCredentials): Promise<{ user: PartnerUser; tokens: PartnerAuthTokens }> {
        try {
            // Find user by email
            const user = await this.findPartnerByEmail(credentials.email);
            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Get password hash
            const passwordHash = await this.getPartnerPasswordHash(user.id);
            if (!passwordHash) {
                throw new Error('Invalid credentials');
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(credentials.password, passwordHash);
            if (!isPasswordValid) {
                throw new Error('Invalid credentials');
            }

            // Check if email is verified
            if (!user.isEmailVerified) {
                throw new Error('Email not verified. Please check your email for verification link.');
            }

            // Update last login
            await this.updateLastLogin(user.id);

            // Generate auth tokens
            const tokens = await this.generateTokens(user);

            logger.info(`Partner user logged in: ${user.email}`, {
                userId: user.id,
                partnerId: user.partnerId
            });

            return { user, tokens };

        } catch (error) {
            logger.error('Error logging in partner:', error);
            throw error;
        }
    }

    /**
     * Verify email with token
     */
    async verifyEmail(token: string): Promise<boolean> {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET) as any;
            const userId = decoded.userId;

            // Check if token exists and is valid
            const isValidToken = await this.validateVerificationToken(userId, token);
            if (!isValidToken) {
                throw new Error('Invalid or expired verification token');
            }

            // Update email verification status
            await pool.query(
                'UPDATE partner_users SET is_email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                [userId]
            );

            // Remove verification token
            await this.removeVerificationToken(userId);

            logger.info(`Partner email verified: ${userId}`);
            return true;

        } catch (error) {
            logger.error('Error verifying email:', error);
            return false;
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken: string): Promise<PartnerAuthTokens> {
        try {
            const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;
            const userId = decoded.userId;

            // Verify refresh token exists in database
            const isValidRefreshToken = await this.validateRefreshToken(userId, refreshToken);
            if (!isValidRefreshToken) {
                throw new Error('Invalid refresh token');
            }

            // Get user
            const user = await this.findPartnerById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Generate new tokens
            const tokens = await this.generateTokens(user);

            // Remove old refresh token
            await this.removeRefreshToken(refreshToken);

            return tokens;

        } catch (error) {
            logger.error('Error refreshing token:', error);
            throw error;
        }
    }

    /**
     * Logout partner user
     */
    async logoutPartner(refreshToken: string): Promise<void> {
        try {
            await this.removeRefreshToken(refreshToken);
            logger.info('Partner user logged out');
        } catch (error) {
            logger.error('Error logging out partner:', error);
            throw error;
        }
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(email: string): Promise<void> {
        try {
            const user = await this.findPartnerByEmail(email);
            if (!user) {
                // Don't reveal if email exists
                return;
            }

            // Generate reset token
            const resetToken = this.generatePasswordResetToken(user.id);
            await this.storePasswordResetToken(user.id, resetToken);

            // Send reset email
            await this.sendPasswordResetEmail(email, user.firstName, resetToken);

            logger.info(`Password reset requested for partner: ${email}`);

        } catch (error) {
            logger.error('Error requesting password reset:', error);
            throw error;
        }
    }

    /**
     * Reset password with token
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET) as any;
            const userId = decoded.userId;

            // Validate reset token
            const isValidToken = await this.validatePasswordResetToken(userId, token);
            if (!isValidToken) {
                throw new Error('Invalid or expired reset token');
            }

            // Hash new password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update password
            await pool.query(
                'UPDATE partner_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [hashedPassword, userId]
            );

            // Remove reset token
            await this.removePasswordResetToken(userId);

            // Invalidate all refresh tokens for security
            await this.removeAllRefreshTokens(userId);

            logger.info(`Password reset completed for partner user: ${userId}`);

        } catch (error) {
            logger.error('Error resetting password:', error);
            throw error;
        }
    }

    /**
     * Get partner user profile
     */
    async getPartnerProfile(userId: string): Promise<PartnerUser | null> {
        try {
            return await this.findPartnerById(userId);
        } catch (error) {
            logger.error('Error getting partner profile:', error);
            throw error;
        }
    }

    /**
     * Update partner user profile
     */
    async updatePartnerProfile(userId: string, updateData: Partial<PartnerUser>): Promise<PartnerUser> {
        try {
            const allowedFields = ['firstName', 'lastName'];
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            for (const [key, value] of Object.entries(updateData)) {
                if (allowedFields.includes(key) && value !== undefined) {
                    updates.push(`${this.camelToSnake(key)} = $${paramIndex}`);
                    values.push(value);
                    paramIndex++;
                }
            }

            if (updates.length === 0) {
                throw new Error('No valid fields to update');
            }

            values.push(userId);
            const query = `
                UPDATE partner_users
                SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = $${paramIndex}
                RETURNING *
            `;

            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                throw new Error('User not found');
            }

            return this.mapPartnerUserRow(result.rows[0]);

        } catch (error) {
            logger.error('Error updating partner profile:', error);
            throw error;
        }
    }

    // Private helper methods
    private async findPartnerByEmail(email: string): Promise<PartnerUser | null> {
        const result = await pool.query(
            'SELECT * FROM partner_users WHERE email = $1',
            [email]
        );

        return result.rows.length > 0 ? this.mapPartnerUserRow(result.rows[0]) : null;
    }

    private async findPartnerById(id: string): Promise<PartnerUser | null> {
        const result = await pool.query(
            'SELECT * FROM partner_users WHERE id = $1',
            [id]
        );

        return result.rows.length > 0 ? this.mapPartnerUserRow(result.rows[0]) : null;
    }

    private async findPartnerIdByCompanyName(companyName: string): Promise<string | null> {
        const result = await pool.query(
            'SELECT id FROM partner_organizations WHERE name ILIKE $1',
            [companyName]
        );

        return result.rows.length > 0 ? result.rows[0].id : null;
    }

    private async createPartnerOrganization(companyName: string, contactEmail: string): Promise<string> {
        const result = await pool.query(
            `INSERT INTO partner_organizations (name, contact_email, status)
             VALUES ($1, $2, 'pending_setup')
             RETURNING id`,
            [companyName, contactEmail]
        );

        return result.rows[0].id;
    }

    private async createPartnerUser(userData: {
        partnerId: string;
        email: string;
        firstName: string;
        lastName: string;
        hashedPassword: string;
        role: string;
    }): Promise<string> {
        const result = await pool.query(
            `INSERT INTO partner_users (partner_id, email, first_name, last_name, password_hash, role)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [userData.partnerId, userData.email, userData.firstName, userData.lastName, userData.hashedPassword, userData.role]
        );

        return result.rows[0].id;
    }

    private async getPartnerPasswordHash(userId: string): Promise<string | null> {
        const result = await pool.query(
            'SELECT password_hash FROM partner_users WHERE id = $1',
            [userId]
        );

        return result.rows.length > 0 ? result.rows[0].password_hash : null;
    }

    private async updateLastLogin(userId: string): Promise<void> {
        await pool.query(
            'UPDATE partner_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
            [userId]
        );
    }

    private async generateTokens(user: PartnerUser): Promise<PartnerAuthTokens> {
        const payload = {
            userId: user.id,
            partnerId: user.partnerId,
            email: user.email,
            role: user.role,
            type: 'partner'
        };

        const accessToken = jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.ACCESS_TOKEN_EXPIRY });
        const refreshToken = jwt.sign({ userId: user.id, type: 'partner' }, this.JWT_REFRESH_SECRET, { expiresIn: this.REFRESH_TOKEN_EXPIRY });

        // Store refresh token
        await this.storeRefreshToken(user.id, refreshToken);

        return {
            accessToken,
            refreshToken,
            expiresIn: 24 * 60 * 60 // 24 hours in seconds
        };
    }

    private generateVerificationToken(userId: string): string {
        return jwt.sign({ userId, type: 'email_verification' }, this.JWT_SECRET, { expiresIn: '24h' });
    }

    private generatePasswordResetToken(userId: string): string {
        return jwt.sign({ userId, type: 'password_reset' }, this.JWT_SECRET, { expiresIn: '1h' });
    }

    private async storeVerificationToken(userId: string, token: string): Promise<void> {
        await pool.query(
            `INSERT INTO partner_verification_tokens (user_id, token, type, expires_at)
             VALUES ($1, $2, 'email_verification', NOW() + INTERVAL '24 hours')`,
            [userId, token]
        );
    }

    private async storePasswordResetToken(userId: string, token: string): Promise<void> {
        await pool.query(
            `INSERT INTO partner_verification_tokens (user_id, token, type, expires_at)
             VALUES ($1, $2, 'password_reset', NOW() + INTERVAL '1 hour')`,
            [userId, token]
        );
    }

    private async storeRefreshToken(userId: string, token: string): Promise<void> {
        await pool.query(
            `INSERT INTO partner_refresh_tokens (user_id, token, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
            [userId, token]
        );
    }

    private async validateVerificationToken(userId: string, token: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT id FROM partner_verification_tokens
             WHERE user_id = $1 AND token = $2 AND type = 'email_verification' AND expires_at > NOW()`,
            [userId, token]
        );

        return result.rows.length > 0;
    }

    private async validatePasswordResetToken(userId: string, token: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT id FROM partner_verification_tokens
             WHERE user_id = $1 AND token = $2 AND type = 'password_reset' AND expires_at > NOW()`,
            [userId, token]
        );

        return result.rows.length > 0;
    }

    private async validateRefreshToken(userId: string, token: string): Promise<boolean> {
        const result = await pool.query(
            `SELECT id FROM partner_refresh_tokens
             WHERE user_id = $1 AND token = $2 AND expires_at > NOW()`,
            [userId, token]
        );

        return result.rows.length > 0;
    }

    private async removeVerificationToken(userId: string): Promise<void> {
        await pool.query(
            `DELETE FROM partner_verification_tokens
             WHERE user_id = $1 AND type = 'email_verification'`,
            [userId]
        );
    }

    private async removePasswordResetToken(userId: string): Promise<void> {
        await pool.query(
            `DELETE FROM partner_verification_tokens
             WHERE user_id = $1 AND type = 'password_reset'`,
            [userId]
        );
    }

    private async removeRefreshToken(token: string): Promise<void> {
        await pool.query(
            'DELETE FROM partner_refresh_tokens WHERE token = $1',
            [token]
        );
    }

    private async removeAllRefreshTokens(userId: string): Promise<void> {
        await pool.query(
            'DELETE FROM partner_refresh_tokens WHERE user_id = $1',
            [userId]
        );
    }

    private async sendVerificationEmail(email: string, firstName: string, token: string): Promise<void> {
        const verificationUrl = `${process.env.FRONTEND_URL}/partners/verify-email?token=${token}`;

        await sendEmail({
            to: email,
            subject: 'Verify your Auxeira Partner account',
            html: `
                <h2>Welcome to Auxeira Partners, ${firstName}!</h2>
                <p>Please verify your email address by clicking the link below:</p>
                <a href="${verificationUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
                    Verify Email Address
                </a>
                <p>This link will expire in 24 hours.</p>
            `
        });
    }

    private async sendPasswordResetEmail(email: string, firstName: string, token: string): Promise<void> {
        const resetUrl = `${process.env.FRONTEND_URL}/partners/reset-password?token=${token}`;

        await sendEmail({
            to: email,
            subject: 'Reset your Auxeira Partner password',
            html: `
                <h2>Password Reset Request</h2>
                <p>Hi ${firstName},</p>
                <p>You requested to reset your password. Click the link below to set a new password:</p>
                <a href="${resetUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
                    Reset Password
                </a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });
    }

    private mapPartnerUserRow(row: any): PartnerUser {
        return {
            id: row.id,
            partnerId: row.partner_id,
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            role: row.role,
            isEmailVerified: row.is_email_verified,
            lastLoginAt: row.last_login_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    private camelToSnake(str: string): string {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
}
