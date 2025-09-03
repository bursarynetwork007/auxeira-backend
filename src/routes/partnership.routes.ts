/**
 * Partnership Routes
 * Defines all partnership-related API endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { partnershipController } from '../controllers/partnership.controller';
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
const createPartnershipValidation = [
  body('name').isLength({ min: 2, max: 200 }).withMessage('Name must be between 2 and 200 characters'),
  body('type').isIn(['technology', 'service', 'funding', 'mentorship', 'market_access', 'infrastructure', 'legal', 'marketing', 'talent', 'education']).withMessage('Valid type is required'),
  body('category').isIn(['software_tools', 'cloud_services', 'financial_services', 'legal_services', 'marketing_tools', 'hr_tools', 'development_tools', 'analytics', 'communication', 'productivity', 'security', 'compliance', 'consulting', 'education', 'networking']).withMessage('Valid category is required'),
  body('description').isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('benefits').isArray({ min: 1 }).withMessage('At least one benefit is required'),
  body('benefits.*.title').isLength({ min: 2, max: 200 }).withMessage('Benefit title is required'),
  body('benefits.*.description').isLength({ min: 10, max: 1000 }).withMessage('Benefit description is required'),
  body('benefits.*.type').isIn(['discount', 'free_trial', 'credits', 'consultation', 'priority_support', 'exclusive_access', 'waived_fees', 'custom_pricing', 'extended_trial', 'bonus_features']).withMessage('Valid benefit type is required'),
  body('requirements').isObject().withMessage('Requirements object is required'),
  body('sseThreshold').isInt({ min: 0, max: 100 }).withMessage('SSE threshold must be between 0 and 100'),
  body('region').isArray().withMessage('Region must be an array'),
  body('industries').isArray().withMessage('Industries must be an array'),
  body('stages').isArray().withMessage('Stages must be an array')
];

const updatePartnershipValidation = [
  body('name').optional().isLength({ min: 2, max: 200 }).withMessage('Name must be between 2 and 200 characters'),
  body('description').optional().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('benefits').optional().isArray().withMessage('Benefits must be an array'),
  body('requirements').optional().isObject().withMessage('Requirements must be an object'),
  body('sseThreshold').optional().isInt({ min: 0, max: 100 }).withMessage('SSE threshold must be between 0 and 100'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('featured').optional().isBoolean().withMessage('featured must be a boolean'),
  body('logoUrl').optional().isURL().withMessage('Logo URL must be valid'),
  body('websiteUrl').optional().isURL().withMessage('Website URL must be valid'),
  body('contactEmail').optional().isEmail().withMessage('Contact email must be valid'),
  body('region').optional().isArray().withMessage('Region must be an array'),
  body('industries').optional().isArray().withMessage('Industries must be an array'),
  body('stages').optional().isArray().withMessage('Stages must be an array')
];

const applyPartnershipValidation = [
  body('partnershipId').isUUID().withMessage('Valid partnership ID is required'),
  body('applicationData').isObject().withMessage('Application data is required'),
  body('applicationData.companyName').isLength({ min: 2, max: 200 }).withMessage('Company name is required'),
  body('applicationData.contactPerson').isLength({ min: 2, max: 100 }).withMessage('Contact person is required'),
  body('applicationData.email').isEmail().withMessage('Valid email is required'),
  body('applicationData.fundingStage').isIn(['idea', 'pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'growth', 'mature']).withMessage('Valid funding stage is required'),
  body('applicationData.industry').isLength({ min: 2, max: 100 }).withMessage('Industry is required'),
  body('applicationData.employeeCount').isInt({ min: 0 }).withMessage('Employee count must be a non-negative integer'),
  body('applicationData.useCase').isLength({ min: 10, max: 1000 }).withMessage('Use case must be between 10 and 1000 characters')
];

const reviewApplicationValidation = [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('reviewNotes').optional().isLength({ max: 1000 }).withMessage('Review notes must be less than 1000 characters')
];

const redeemBenefitValidation = [
  body('applicationId').isUUID().withMessage('Valid application ID is required'),
  body('benefitId').isString().isLength({ min: 1 }).withMessage('Benefit ID is required'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
];

const partnershipQueryValidation = [
  query('type').optional().isIn(['technology', 'service', 'funding', 'mentorship', 'market_access', 'infrastructure', 'legal', 'marketing', 'talent', 'education']).withMessage('Invalid partnership type'),
  query('category').optional().isIn(['software_tools', 'cloud_services', 'financial_services', 'legal_services', 'marketing_tools', 'hr_tools', 'development_tools', 'analytics', 'communication', 'productivity', 'security', 'compliance', 'consulting', 'education', 'networking']).withMessage('Invalid category'),
  query('stage').optional().isIn(['idea', 'pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'growth', 'mature']).withMessage('Invalid stage'),
  query('minSSEScore').optional().isInt({ min: 0, max: 100 }).withMessage('Min SSE score must be between 0 and 100'),
  query('maxSSEScore').optional().isInt({ min: 0, max: 100 }).withMessage('Max SSE score must be between 0 and 100'),
  query('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  query('sortBy').optional().isIn(['name', 'created_at', 'sse_threshold', 'applications']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
];

const applicationQueryValidation = [
  query('status').optional().isIn(['pending', 'under_review', 'approved', 'rejected', 'expired', 'cancelled']).withMessage('Invalid status'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  query('sortBy').optional().isIn(['applied_at', 'reviewed_at', 'status']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
];

// Public routes (no authentication required)

/**
 * @route GET /api/partnerships/directory
 * @desc Get partnership directory with filters
 * @access Public
 */
router.get(
  '/directory',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 requests per 15 minutes
  partnershipQueryValidation,
  validateRequest,
  partnershipController.getPartnershipDirectory
);

/**
 * @route GET /api/partnerships/search
 * @desc Search partnerships
 * @access Public
 */
router.get(
  '/search',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 50 }), // 50 requests per 15 minutes
  [
    query('q').isLength({ min: 1, max: 100 }).withMessage('Search query is required and must be less than 100 characters'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
  ],
  validateRequest,
  partnershipController.searchPartnerships
);

/**
 * @route GET /api/partnerships/stats
 * @desc Get partnership statistics
 * @access Public
 */
router.get(
  '/stats',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 20 }), // 20 requests per 15 minutes
  partnershipController.getPartnershipStats
);

/**
 * @route GET /api/partnerships/:id
 * @desc Get partnership by ID
 * @access Public
 */
router.get(
  '/:id',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 requests per 15 minutes
  [
    param('id').isUUID().withMessage('Valid partnership ID is required')
  ],
  validateRequest,
  partnershipController.getPartnershipById
);

// Protected routes (authentication required)

/**
 * @route GET /api/partnerships
 * @desc Get all partnerships with filtering (authenticated users get more details)
 * @access Private
 */
router.get(
  '/',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 requests per 15 minutes
  partnershipQueryValidation,
  validateRequest,
  partnershipController.getPartnerships
);

/**
 * @route GET /api/partnerships/recommendations
 * @desc Get partnership recommendations for user
 * @access Private
 */
router.get(
  '/recommendations',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 20 }), // 20 requests per 15 minutes
  partnershipController.getRecommendations
);

/**
 * @route POST /api/partnerships/apply
 * @desc Apply for a partnership
 * @access Private
 */
router.post(
  '/apply',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 requests per 15 minutes
  applyPartnershipValidation,
  validateRequest,
  partnershipController.applyForPartnership
);

/**
 * @route GET /api/partnerships/applications
 * @desc Get user's partnership applications
 * @access Private
 */
router.get(
  '/applications',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 50 }), // 50 requests per 15 minutes
  applicationQueryValidation,
  validateRequest,
  partnershipController.getUserApplications
);

/**
 * @route POST /api/partnerships/benefits/redeem
 * @desc Redeem partnership benefit
 * @access Private
 */
router.post(
  '/benefits/redeem',
  authMiddleware,
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 20 }), // 20 requests per 15 minutes
  redeemBenefitValidation,
  validateRequest,
  partnershipController.redeemBenefit
);

// Admin routes (additional authorization would be needed)

/**
 * @route POST /api/partnerships
 * @desc Create new partnership (admin only)
 * @access Admin
 */
router.post(
  '/',
  authMiddleware,
  // TODO: Add admin authorization middleware
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 requests per 15 minutes
  createPartnershipValidation,
  validateRequest,
  partnershipController.createPartnership
);

/**
 * @route PUT /api/partnerships/:id
 * @desc Update partnership (admin only)
 * @access Admin
 */
router.put(
  '/:id',
  authMiddleware,
  // TODO: Add admin authorization middleware
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 20 }), // 20 requests per 15 minutes
  [
    param('id').isUUID().withMessage('Valid partnership ID is required'),
    ...updatePartnershipValidation
  ],
  validateRequest,
  partnershipController.updatePartnership
);

/**
 * @route POST /api/partnerships/applications/:id/review
 * @desc Review partnership application (admin only)
 * @access Admin
 */
router.post(
  '/applications/:id/review',
  authMiddleware,
  // TODO: Add admin authorization middleware
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 50 }), // 50 requests per 15 minutes
  [
    param('id').isUUID().withMessage('Valid application ID is required'),
    ...reviewApplicationValidation
  ],
  validateRequest,
  partnershipController.reviewApplication
);

/**
 * @route GET /api/partnerships/admin/applications
 * @desc Get all applications (admin only)
 * @access Admin
 */
router.get(
  '/admin/applications',
  authMiddleware,
  // TODO: Add admin authorization middleware
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 requests per 15 minutes
  [
    ...applicationQueryValidation,
    query('userId').optional().isUUID().withMessage('User ID must be valid UUID'),
    query('partnershipId').optional().isUUID().withMessage('Partnership ID must be valid UUID')
  ],
  validateRequest,
  partnershipController.getAllApplications
);

/**
 * @route GET /api/partnerships/:id/analytics
 * @desc Get partnership analytics (admin only)
 * @access Admin
 */
router.get(
  '/:id/analytics',
  authMiddleware,
  // TODO: Add admin authorization middleware
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 50 }), // 50 requests per 15 minutes
  [
    param('id').isUUID().withMessage('Valid partnership ID is required'),
    query('period').optional().matches(/^\d{4}-\d{2}$/).withMessage('Period must be in YYYY-MM format')
  ],
  validateRequest,
  partnershipController.getPartnershipAnalytics
);

// Additional admin endpoints for partnership management

/**
 * @route GET /api/partnerships/admin/dashboard
 * @desc Get partnership management dashboard data (admin only)
 * @access Admin
 */
router.get(
  '/admin/dashboard',
  authMiddleware,
  // TODO: Add admin authorization middleware
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 20 }), // 20 requests per 15 minutes
  async (req, res) => {
    // TODO: Implement admin dashboard endpoint
    res.json({
      success: true,
      data: {
        message: 'Admin dashboard endpoint not implemented yet',
        totalPartnerships: 0,
        pendingApplications: 0,
        recentActivity: []
      }
    });
  }
);

/**
 * @route POST /api/partnerships/admin/bulk-update
 * @desc Bulk update partnerships (admin only)
 * @access Admin
 */
router.post(
  '/admin/bulk-update',
  authMiddleware,
  // TODO: Add admin authorization middleware
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 requests per 15 minutes
  [
    body('partnershipIds').isArray({ min: 1 }).withMessage('Partnership IDs array is required'),
    body('partnershipIds.*').isUUID().withMessage('All partnership IDs must be valid UUIDs'),
    body('updates').isObject().withMessage('Updates object is required')
  ],
  validateRequest,
  async (req, res) => {
    // TODO: Implement bulk update endpoint
    res.json({
      success: true,
      data: {
        message: 'Bulk update endpoint not implemented yet',
        updated: 0
      }
    });
  }
);

/**
 * @route POST /api/partnerships/admin/export
 * @desc Export partnership data (admin only)
 * @access Admin
 */
router.post(
  '/admin/export',
  authMiddleware,
  // TODO: Add admin authorization middleware
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 requests per 15 minutes
  [
    body('format').isIn(['csv', 'xlsx', 'json']).withMessage('Format must be csv, xlsx, or json'),
    body('filters').optional().isObject().withMessage('Filters must be an object'),
    body('includeApplications').optional().isBoolean().withMessage('includeApplications must be a boolean')
  ],
  validateRequest,
  async (req, res) => {
    // TODO: Implement export endpoint
    res.json({
      success: true,
      data: {
        message: 'Export endpoint not implemented yet',
        downloadUrl: null
      }
    });
  }
);

export default router;