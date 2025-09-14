import { Request, Response } from 'express';
import { PartnerAuthService } from '../services/partner-auth.service';
import { logger } from '../utils/logger';
import { validateEmail, validatePassword, validateRequired } from '../utils/validation';

export class PartnerAuthController {
    private partnerAuthService: PartnerAuthService;

    constructor() {
        this.partnerAuthService = new PartnerAuthService();
    }

    /**
     * Partner signup
     * POST /api/partners/auth/signup
     */
    async signup(req: Request, res: Response): Promise<void> {
        try {
            const { email, password, firstName, lastName, companyName, role } = req.body;

            // Validate required fields
            const validationErrors: string[] = [];

            if (!validateRequired(email)) validationErrors.push('Email is required');
            if (!validateEmail(email)) validationErrors.push('Invalid email format');
            if (!validateRequired(password)) validationErrors.push('Password is required');
            if (!validatePassword(password)) validationErrors.push('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
            if (!validateRequired(firstName)) validationErrors.push('First name is required');
            if (!validateRequired(lastName)) validationErrors.push('Last name is required');
            if (!validateRequired(companyName)) validationErrors.push('Company name is required');

            if (validationErrors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validationErrors
                });
                return;
            }

            // Register partner
            const result = await this.partnerAuthService.registerPartner({
                email: email.toLowerCase().trim(),
                password,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                companyName: companyName.trim(),
                role: role || 'admin'
            });

            // Set refresh token as httpOnly cookie
            res.cookie('partner_refresh_token', result.tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            res.status(201).json({
                success: true,
                message: 'Partner account created successfully. Please check your email to verify your account.',
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                    role: result.user.role,
                    isEmailVerified: result.user.isEmailVerified,
                    partnerId: result.user.partnerId
                },
                accessToken: result.tokens.accessToken,
                expiresIn: result.tokens.expiresIn
            });

        } catch (error: any) {
            logger.error('Partner signup error:', error);

            if (error.message === 'Email already registered') {
                res.status(409).json({
                    success: false,
                    message: 'An account with this email already exists'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    }

    /**
     * Partner login
     * POST /api/partners/auth/login
     */
    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            // Validate required fields
            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
                return;
            }

            // Authenticate partner
            const result = await this.partnerAuthService.loginPartner({
                email: email.toLowerCase().trim(),
                password
            });

            // Set refresh token as httpOnly cookie
            res.cookie('partner_refresh_token', result.tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            res.json({
                success: true,
                message: 'Login successful',
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                    role: result.user.role,
                    isEmailVerified: result.user.isEmailVerified,
                    partnerId: result.user.partnerId,
                    lastLoginAt: result.user.lastLoginAt
                },
                accessToken: result.tokens.accessToken,
                expiresIn: result.tokens.expiresIn
            });

        } catch (error: any) {
            logger.error('Partner login error:', error);

            if (error.message === 'Invalid credentials') {
                res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            } else if (error.message.includes('Email not verified')) {
                res.status(403).json({
                    success: false,
                    message: 'Please verify your email address before logging in'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    }

    /**
     * Verify email
     * POST /api/partners/auth/verify-email
     */
    async verifyEmail(req: Request, res: Response): Promise<void> {
        try {
            const { token } = req.body;

            if (!token) {
                res.status(400).json({
                    success: false,
                    message: 'Verification token is required'
                });
                return;
            }

            const isVerified = await this.partnerAuthService.verifyEmail(token);

            if (isVerified) {
                res.json({
                    success: true,
                    message: 'Email verified successfully'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Invalid or expired verification token'
                });
            }

        } catch (error) {
            logger.error('Email verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Refresh access token
     * POST /api/partners/auth/refresh
     */
    async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const refreshToken = req.cookies.partner_refresh_token;

            if (!refreshToken) {
                res.status(401).json({
                    success: false,
                    message: 'Refresh token not provided'
                });
                return;
            }

            const tokens = await this.partnerAuthService.refreshToken(refreshToken);

            // Set new refresh token as httpOnly cookie
            res.cookie('partner_refresh_token', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            res.json({
                success: true,
                accessToken: tokens.accessToken,
                expiresIn: tokens.expiresIn
            });

        } catch (error: any) {
            logger.error('Token refresh error:', error);

            // Clear invalid refresh token
            res.clearCookie('partner_refresh_token');

            res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
    }

    /**
     * Partner logout
     * POST /api/partners/auth/logout
     */
    async logout(req: Request, res: Response): Promise<void> {
        try {
            const refreshToken = req.cookies.partner_refresh_token;

            if (refreshToken) {
                await this.partnerAuthService.logoutPartner(refreshToken);
            }

            // Clear refresh token cookie
            res.clearCookie('partner_refresh_token');

            res.json({
                success: true,
                message: 'Logged out successfully'
            });

        } catch (error) {
            logger.error('Partner logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Request password reset
     * POST /api/partners/auth/forgot-password
     */
    async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;

            if (!email || !validateEmail(email)) {
                res.status(400).json({
                    success: false,
                    message: 'Valid email is required'
                });
                return;
            }

            await this.partnerAuthService.requestPasswordReset(email.toLowerCase().trim());

            // Always return success to prevent email enumeration
            res.json({
                success: true,
                message: 'If an account with this email exists, you will receive a password reset link'
            });

        } catch (error) {
            logger.error('Password reset request error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Reset password
     * POST /api/partners/auth/reset-password
     */
    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const { token, password } = req.body;

            if (!token || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Token and new password are required'
                });
                return;
            }

            if (!validatePassword(password)) {
                res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
                });
                return;
            }

            await this.partnerAuthService.resetPassword(token, password);

            res.json({
                success: true,
                message: 'Password reset successfully'
            });

        } catch (error: any) {
            logger.error('Password reset error:', error);

            if (error.message.includes('Invalid or expired')) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        }
    }

    /**
     * Get partner profile
     * GET /api/partners/auth/profile
     */
    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }

            const user = await this.partnerAuthService.getPartnerProfile(userId);

            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            res.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    partnerId: user.partnerId,
                    lastLoginAt: user.lastLoginAt,
                    createdAt: user.createdAt
                }
            });

        } catch (error) {
            logger.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Update partner profile
     * PUT /api/partners/auth/profile
     */
    async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const { firstName, lastName } = req.body;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }

            const updateData: any = {};
            if (firstName) updateData.firstName = firstName.trim();
            if (lastName) updateData.lastName = lastName.trim();

            if (Object.keys(updateData).length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'No valid fields to update'
                });
                return;
            }

            const updatedUser = await this.partnerAuthService.updatePartnerProfile(userId, updateData);

            res.json({
                success: true,
                message: 'Profile updated successfully',
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    firstName: updatedUser.firstName,
                    lastName: updatedUser.lastName,
                    role: updatedUser.role,
                    isEmailVerified: updatedUser.isEmailVerified,
                    partnerId: updatedUser.partnerId
                }
            });

        } catch (error) {
            logger.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Change password
     * POST /api/partners/auth/change-password
     */
    async changePassword(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const { currentPassword, newPassword } = req.body;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }

            if (!currentPassword || !newPassword) {
                res.status(400).json({
                    success: false,
                    message: 'Current password and new password are required'
                });
                return;
            }

            if (!validatePassword(newPassword)) {
                res.status(400).json({
                    success: false,
                    message: 'New password must be at least 8 characters with uppercase, lowercase, number, and special character'
                });
                return;
            }

            // Get user email for login verification
            const user = await this.partnerAuthService.getPartnerProfile(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            // Verify current password by attempting login
            try {
                await this.partnerAuthService.loginPartner({
                    email: user.email,
                    password: currentPassword
                });
            } catch (error) {
                res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
                return;
            }

            // Generate reset token and use it to change password
            await this.partnerAuthService.requestPasswordReset(user.email);

            // Note: In a real implementation, you'd want a more direct way to change password
            // This is a simplified approach for demonstration

            res.json({
                success: true,
                message: 'Password change request initiated. Please check your email for further instructions.'
            });

        } catch (error) {
            logger.error('Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
