/**
 * Payment Routes
 * Defines all payment-related API endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { body, query, param, validationResult } from 'express-validator';

const router = Router();

// Simple validation middleware
const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }
  next();
};

// Validation schemas
const createCustomerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('organizationName').optional().isLength({ max: 200 }).withMessage('Organization name must be less than 200 characters'),
  body('countryCode').optional().isLength({ min: 2, max: 2 }).withMessage('Country code must be 2 characters')
];

const createSubscriptionValidation = [
  body('tier').isIn(['founder', 'startup', 'growth', 'scale', 'enterprise']).withMessage('Valid tier is required'),
  body('isAnnual').optional().isBoolean().withMessage('isAnnual must be a boolean'),
  body('paymentMethodId').optional().isString().withMessage('Payment method ID must be a string'),
  body('promoCode').optional().isString().withMessage('Promo code must be a string')
];

const updateSubscriptionValidation = [
  body('tier').isIn(['founder', 'startup', 'growth', 'scale', 'enterprise']).withMessage('Valid tier is required'),
  body('isAnnual').optional().isBoolean().withMessage('isAnnual must be a boolean')
];

const cancelSubscriptionValidation = [
  body('cancelAtPeriodEnd').optional().isBoolean().withMessage('cancelAtPeriodEnd must be a boolean'),
  body('reason').optional().isString().withMessage('Reason must be a string')
];

const processUsageValidation = [
  body('apiCallOverages').optional().isInt({ min: 0 }).withMessage('API call overages must be a non-negative integer'),
  body('premiumIntroductions').optional().isInt({ min: 0 }).withMessage('Premium introductions must be a non-negative integer'),
  body('customReports').optional().isInt({ min: 0 }).withMessage('Custom reports must be a non-negative integer')
];

const pricingQueryValidation = [
  query('tier').isIn(['founder', 'startup', 'growth', 'scale', 'enterprise']).withMessage('Valid tier is required'),
  query('isAnnual').optional().isBoolean().withMessage('isAnnual must be a boolean'),
  query('countryCode').optional().isLength({ min: 2, max: 2 }).withMessage('Country code must be 2 characters'),
  query('promoCode').optional().isString().withMessage('Promo code must be a string')
];

const validatePromoValidation = [
  body('code').isString().isLength({ min: 1 }).withMessage('Promo code is required'),
  body('tier').isIn(['founder', 'startup', 'growth', 'scale', 'enterprise']).withMessage('Valid tier is required')
];

// Public routes (no authentication required)

/**
 * @route GET /api/payments/pricing-page
 * @desc Get pricing page data for all tiers
 * @access Public
 */
router.get(
  '/pricing-page',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 requests per 15 minutes
  paymentController.getPricingPageData
);

/**
 * @route POST /api/payments/webhook
 * @desc Handle Stripe webhooks
 * @access Public (Stripe only)
 */
router.post(
  '/webhook',
  rateLimitMiddleware({ windowMs: 60 * 1000, max: 1000 }), // 1000 requests per minute for webhooks
  paymentController.handleWebhook
);

// Protected routes (authentication required)

/**
 * @route GET /api/payments/pricing
 * @desc Calculate pricing for a specific tier
 * @access Private
 */
router.get(
  '/pricing',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 50 }), // 50 requests per 15 minutes
  pricingQueryValidation,
  validateRequest,
  paymentController.calculatePricing
);

/**
 * @route GET /api/payments/recommendation
 * @desc Get tier recommendation for user
 * @access Private
 */
router.get(
  '/recommendation',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 20 }), // 20 requests per 15 minutes
  paymentController.getTierRecommendation
);

/**
 * @route POST /api/payments/customer
 * @desc Create a new Stripe customer
 * @access Private
 */
router.post(
  '/customer',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 requests per 15 minutes
  createCustomerValidation,
  validateRequest,
  paymentController.createCustomer
);

/**
 * @route POST /api/payments/subscription
 * @desc Create a new subscription
 * @access Private
 */
router.post(
  '/subscription',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 requests per 15 minutes
  createSubscriptionValidation,
  validateRequest,
  paymentController.createSubscription
);

/**
 * @route GET /api/payments/subscription
 * @desc Get current subscription details
 * @access Private
 */
router.get(
  '/subscription',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 30 }), // 30 requests per 15 minutes
  paymentController.getSubscription
);

/**
 * @route PUT /api/payments/subscription
 * @desc Update existing subscription
 * @access Private
 */
router.put(
  '/subscription',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 requests per 15 minutes
  updateSubscriptionValidation,
  validateRequest,
  paymentController.updateSubscription
);

/**
 * @route DELETE /api/payments/subscription
 * @desc Cancel subscription
 * @access Private
 */
router.delete(
  '/subscription',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 requests per 15 minutes
  cancelSubscriptionValidation,
  validateRequest,
  paymentController.cancelSubscription
);

/**
 * @route POST /api/payments/usage
 * @desc Process usage-based charges
 * @access Private
 */
router.post(
  '/usage',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 20 }), // 20 requests per 15 minutes
  processUsageValidation,
  validateRequest,
  paymentController.processUsageCharges
);

/**
 * @route GET /api/payments/usage
 * @desc Get current usage and limits
 * @access Private
 */
router.get(
  '/usage',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 50 }), // 50 requests per 15 minutes
  paymentController.getCurrentUsage
);

/**
 * @route GET /api/payments/billing-history
 * @desc Get billing history
 * @access Private
 */
router.get(
  '/billing-history',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 20 }), // 20 requests per 15 minutes
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
  ],
  validateRequest,
  paymentController.getBillingHistory
);

/**
 * @route POST /api/payments/validate-promo
 * @desc Validate promo code
 * @access Private
 */
router.post(
  '/validate-promo',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 20 }), // 20 requests per 15 minutes
  validatePromoValidation,
  validateRequest,
  paymentController.validatePromoCode
);

/**
 * @route GET /api/payments/analytics
 * @desc Get subscription analytics
 * @access Private
 */
router.get(
  '/analytics',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 30 }), // 30 requests per 15 minutes
  paymentController.getSubscriptionAnalytics
);

// Admin routes (additional authentication/authorization would be needed)

/**
 * @route GET /api/payments/admin/revenue-metrics
 * @desc Get revenue metrics (admin only)
 * @access Admin
 */
router.get(
  '/admin/revenue-metrics',
  authMiddleware,
  // TODO: Add admin authorization middleware
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 requests per 15 minutes
  [
    query('period').optional().matches(/^\d{4}-\d{2}$/).withMessage('Period must be in YYYY-MM format'),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date')
  ],
  validateRequest,
  async (req, res) => {
    // TODO: Implement admin revenue metrics endpoint
    res.json({
      success: true,
      data: {
        message: 'Admin revenue metrics endpoint not implemented yet'
      }
    });
  }
);

/**
 * @route GET /api/payments/admin/subscription-stats
 * @desc Get subscription statistics (admin only)
 * @access Admin
 */
router.get(
  '/admin/subscription-stats',
  authMiddleware,
  // TODO: Add admin authorization middleware
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 requests per 15 minutes
  async (req, res) => {
    // TODO: Implement admin subscription stats endpoint
    res.json({
      success: true,
      data: {
        message: 'Admin subscription stats endpoint not implemented yet'
      }
    });
  }
);

/**
 * @route POST /api/payments/admin/promo-codes
 * @desc Create promo code (admin only)
 * @access Admin
 */
router.post(
  '/admin/promo-codes',
  authMiddleware,
  // TODO: Add admin authorization middleware
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 20 }), // 20 requests per 15 minutes
  [
    body('code').isString().isLength({ min: 3, max: 20 }).withMessage('Code must be between 3 and 20 characters'),
    body('description').isString().isLength({ min: 1, max: 200 }).withMessage('Description is required'),
    body('discountType').isIn(['percentage', 'fixed_amount']).withMessage('Valid discount type is required'),
    body('discountValue').isFloat({ min: 0 }).withMessage('Discount value must be positive'),
    body('validFrom').isISO8601().withMessage('Valid from date is required'),
    body('validUntil').isISO8601().withMessage('Valid until date is required'),
    body('maxUses').optional().isInt({ min: 1 }).withMessage('Max uses must be positive'),
    body('applicableTiers').isArray().withMessage('Applicable tiers must be an array')
  ],
  validateRequest,
  async (req, res) => {
    // TODO: Implement admin promo code creation endpoint
    res.json({
      success: true,
      data: {
        message: 'Admin promo code creation endpoint not implemented yet'
      }
    });
  }
);

export default router;