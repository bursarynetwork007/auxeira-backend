import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { authController } from '../controllers/auth.controller';
import {
  authenticateToken,
  optionalAuth
} from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

// Rate limiting configurations
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    error: 'RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    error: 'RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      details: errors.array(),
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

// Registration validation
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name is required and must be less than 100 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name is required and must be less than 100 characters'),
  body('role')
    .isIn(['student', 'founder', 'investor'])
    .withMessage('Role must be student, founder, or investor'),
  body('acceptedTerms')
    .equals('true')
    .withMessage('You must accept the terms and conditions'),
  body('acceptedPrivacy')
    .equals('true')
    .withMessage('You must accept the privacy policy'),
  body('recaptchaToken')
    .notEmpty()
    .withMessage('reCAPTCHA verification is required'),
];

// Login validation
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Change password validation
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

// Password reset validation
const passwordResetValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('recaptchaToken')
    .notEmpty()
    .withMessage('reCAPTCHA verification is required'),
];

// Confirm password reset validation
const confirmPasswordResetValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

// Email verification validation
const emailVerificationValidation = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required'),
];

// Refresh token validation
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
];

// =============================================================================
// PUBLIC ROUTES (No authentication required)
// =============================================================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register',
  authRateLimit,
  registerValidation,
  handleValidationErrors,
  authController.register.bind(authController)
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  authRateLimit,
  loginValidation,
  handleValidationErrors,
  authController.login.bind(authController)
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh authentication tokens
 * @access  Public
 */
router.post('/refresh',
  generalRateLimit,
  refreshTokenValidation,
  handleValidationErrors,
  authController.refreshToken.bind(authController)
);

/**
 * @route   POST /api/auth/password/reset
 * @desc    Request password reset
 * @access  Public
 */
router.post('/password/reset',
  authRateLimit,
  passwordResetValidation,
  handleValidationErrors,
  authController.requestPasswordReset.bind(authController)
);

/**
 * @route   POST /api/auth/password/confirm
 * @desc    Confirm password reset
 * @access  Public
 */
router.post('/password/confirm',
  authRateLimit,
  confirmPasswordResetValidation,
  handleValidationErrors,
  authController.resetPassword.bind(authController)
);

/**
 * @route   POST /api/auth/email/verify
 * @desc    Verify email address
 * @access  Public
 */
router.post('/email/verify',
  generalRateLimit,
  emailVerificationValidation,
  handleValidationErrors,
  authController.verifyEmail.bind(authController)
);

/**
 * @route   GET /api/auth/check
 * @desc    Check authentication status
 * @access  Public (optional auth)
 */
router.get('/check',
  generalRateLimit,
  optionalAuth,
  authController.getProfile.bind(authController)
);

// =============================================================================
// PROTECTED ROUTES (Authentication required)
// =============================================================================

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout',
  generalRateLimit,
  authenticateToken,
  authController.logout.bind(authController)
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile',
  generalRateLimit,
  authenticateToken,
  authController.getProfile.bind(authController)
);

/**
 * @route   POST /api/auth/password/change
 * @desc    Change user password
 * @access  Private
 */
router.post('/password/change',
  generalRateLimit,
  authenticateToken,
  changePasswordValidation,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    res.status(501).json({
      success: false,
      message: 'Change password feature not yet implemented'
    });
  }
);

/**
 * @route   POST /api/auth/email/resend
 * @desc    Resend email verification
 * @access  Private
 */
router.post('/email/resend',
  generalRateLimit,
  authenticateToken,
  authRateLimit, // Use general rate limit instead
  async (req: Request, res: Response) => {
    res.status(501).json({
      success: false,
      message: 'Resend email verification feature not yet implemented'
    });
  }
);

/**
 * @route   GET /api/auth/sessions
 * @desc    Get user sessions
 * @access  Private
 */
router.get('/sessions',
  generalRateLimit,
  authenticateToken,
  async (req: Request, res: Response) => {
    res.status(501).json({
      success: false,
      message: 'Get sessions feature not yet implemented'
    });
  }
);

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Revoke a specific session
 * @access  Private
 */
router.delete('/sessions/:sessionId',
  generalRateLimit,
  authenticateToken,
  async (req: Request, res: Response) => {
    res.status(501).json({
      success: false,
      message: 'Revoke session feature not yet implemented'
    });
  }
);

/**
 * @route   DELETE /api/auth/sessions
 * @desc    Revoke all sessions except current
 * @access  Private
 */
router.delete('/sessions',
  generalRateLimit,
  authenticateToken,
  async (req: Request, res: Response) => {
    res.status(501).json({
      success: false,
      message: 'Revoke all sessions feature not yet implemented'
    });
  }
);

// =============================================================================
// HEALTH CHECK AND TEST ROUTES
// =============================================================================

/**
 * @route   GET /api/auth/health
 * @desc    Health check for auth service
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

/**
 * @route   GET /api/auth/test
 * @desc    Test endpoint for development
 * @access  Public (only in development)
 */
if (process.env.NODE_ENV === 'development') {
  router.get('/test', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Auth routes are working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  });
}

// Error handling middleware for auth routes
router.use((error: any, req: any, res: any, next: any) => {
  logger.error('Auth route error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    ip: req.ip,
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error in auth service',
    error: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  });
});

export default router;