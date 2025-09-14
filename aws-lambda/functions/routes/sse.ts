import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, query, validationResult } from 'express-validator';
import { sseController } from '../controllers/sse.controller';
import {
  authenticateToken,
  optionalAuth,
  requireEmailVerified,
  rateLimitByUser
} from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

// Rate limiting configurations
const sseRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    success: false,
    message: 'Too many SSE requests, please try again later',
    error: 'RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const dailyQuestionRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // limit each IP to 10 daily question submissions per day
  message: {
    success: false,
    message: 'Daily question submission limit reached',
    error: 'DAILY_LIMIT_EXCEEDED',
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

// Calculate score validation
const calculateScoreValidation = [
  body('includeProjections')
    .optional()
    .isBoolean()
    .withMessage('includeProjections must be a boolean'),
  body('includeBenchmarks')
    .optional()
    .isBoolean()
    .withMessage('includeBenchmarks must be a boolean'),
  body('timeRange.startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO 8601 date'),
  body('timeRange.endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO 8601 date'),
];

// Daily question submission validation
const dailyQuestionValidation = [
  body('questionId')
    .notEmpty()
    .withMessage('Question ID is required'),
  body('responseValue')
    .notEmpty()
    .withMessage('Response value is required'),
  body('responseData')
    .optional()
    .isObject()
    .withMessage('Response data must be an object'),
];

// Behavior recording validation
const behaviorValidation = [
  body('behaviorType')
    .notEmpty()
    .withMessage('Behavior type is required'),
  body('behaviorCategory')
    .isIn(['social', 'sustainability', 'economic'])
    .withMessage('Behavior category must be social, sustainability, or economic'),
  body('behaviorData')
    .optional()
    .isObject()
    .withMessage('Behavior data must be an object'),
  body('socialImpact')
    .optional()
    .isNumeric()
    .withMessage('Social impact must be a number'),
  body('sustainabilityImpact')
    .optional()
    .isNumeric()
    .withMessage('Sustainability impact must be a number'),
  body('economicImpact')
    .optional()
    .isNumeric()
    .withMessage('Economic impact must be a number'),
];

// Score history validation
const scoreHistoryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
    .withMessage('Period must be daily, weekly, monthly, quarterly, or yearly'),
];

// Benchmark validation
const benchmarkValidation = [
  query('industry')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Industry must be between 1 and 100 characters'),
  query('organizationSize')
    .optional()
    .isIn(['startup', 'small', 'medium', 'large', 'enterprise'])
    .withMessage('Organization size must be startup, small, medium, large, or enterprise'),
  query('region')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Region must be between 1 and 100 characters'),
];

// Leaderboard validation
const leaderboardValidation = [
  query('category')
    .optional()
    .isIn(['social', 'sustainability', 'economic', 'overall'])
    .withMessage('Category must be social, sustainability, economic, or overall'),
  query('scope')
    .optional()
    .isIn(['global', 'industry', 'organization', 'region'])
    .withMessage('Scope must be global, industry, organization, or region'),
  query('timeframe')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'quarterly', 'all_time'])
    .withMessage('Timeframe must be daily, weekly, monthly, quarterly, or all_time'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// =============================================================================
// SSE SCORING ROUTES
// =============================================================================

/**
 * @route   POST /api/sse/calculate
 * @desc    Calculate comprehensive SSE score
 * @access  Private
 */
router.post('/calculate',
  sseRateLimit,
  authenticateToken,
  requireEmailVerified,
  calculateScoreValidation,
  handleValidationErrors,
  rateLimitByUser(10, 60 * 60 * 1000), // 10 calculations per hour per user
  sseController.calculateScore.bind(sseController)
);

/**
 * @route   GET /api/sse/score
 * @desc    Get current SSE score (cached)
 * @access  Private
 */
router.get('/score',
  sseRateLimit,
  authenticateToken,
  sseController.getCurrentScore.bind(sseController)
);

/**
 * @route   GET /api/sse/history
 * @desc    Get SSE score history/trends
 * @access  Private
 */
router.get('/history',
  sseRateLimit,
  authenticateToken,
  scoreHistoryValidation,
  handleValidationErrors,
  sseController.getScoreHistory.bind(sseController)
);

/**
 * @route   GET /api/sse/analytics
 * @desc    Get comprehensive SSE analytics
 * @access  Private
 */
router.get('/analytics',
  sseRateLimit,
  authenticateToken,
  requireEmailVerified,
  sseController.getAnalytics.bind(sseController)
);

/**
 * @route   GET /api/sse/recommendations
 * @desc    Get personalized SSE improvement recommendations
 * @access  Private
 */
router.get('/recommendations',
  sseRateLimit,
  authenticateToken,
  requireEmailVerified,
  sseController.getRecommendations.bind(sseController)
);

// =============================================================================
// DAILY QUESTIONS AND BEHAVIORAL TRACKING
// =============================================================================

/**
 * @route   GET /api/sse/questions/daily
 * @desc    Get today's daily questions
 * @access  Private
 */
router.get('/questions/daily',
  sseRateLimit,
  authenticateToken,
  sseController.getDailyQuestions.bind(sseController)
);

/**
 * @route   POST /api/sse/questions/submit
 * @desc    Submit daily question response
 * @access  Private
 */
router.post('/questions/submit',
  dailyQuestionRateLimit,
  authenticateToken,
  dailyQuestionValidation,
  handleValidationErrors,
  rateLimitByUser(20, 24 * 60 * 60 * 1000), // 20 submissions per day per user
  sseController.submitDailyQuestion.bind(sseController)
);

/**
 * @route   POST /api/sse/behavior
 * @desc    Record user behavior and its SSE impact
 * @access  Private
 */
router.post('/behavior',
  sseRateLimit,
  authenticateToken,
  behaviorValidation,
  handleValidationErrors,
  rateLimitByUser(50, 60 * 60 * 1000), // 50 behaviors per hour per user
  sseController.recordBehavior.bind(sseController)
);

// =============================================================================
// BENCHMARKING AND COMPARISON
// =============================================================================

/**
 * @route   GET /api/sse/benchmarks
 * @desc    Get SSE benchmarks for comparison
 * @access  Private
 */
router.get('/benchmarks',
  sseRateLimit,
  authenticateToken,
  benchmarkValidation,
  handleValidationErrors,
  sseController.getBenchmarks.bind(sseController)
);

/**
 * @route   GET /api/sse/leaderboard
 * @desc    Get SSE leaderboard
 * @access  Public (optional auth for user position)
 */
router.get('/leaderboard',
  sseRateLimit,
  optionalAuth,
  leaderboardValidation,
  handleValidationErrors,
  sseController.getLeaderboard.bind(sseController)
);

// =============================================================================
// HEALTH CHECK AND UTILITY ROUTES
// =============================================================================

/**
 * @route   GET /api/sse/health
 * @desc    Health check for SSE service
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SSE scoring service is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: {
      scoring: true,
      benchmarking: true,
      dailyQuestions: true,
      behaviorTracking: true,
      analytics: true,
      recommendations: true,
      leaderboard: true,
    },
  });
});

/**
 * @route   GET /api/sse/metrics/definitions
 * @desc    Get SSE metric definitions and weights
 * @access  Public
 */
router.get('/metrics/definitions', (req, res) => {
  const metricDefinitions = {
    weights: {
      social: 0.40,
      sustainability: 0.35,
      economic: 0.25,
    },
    categories: {
      social: {
        communityImpact: { weight: 0.30, description: 'Community engagement and volunteer activities' },
        diversityInclusion: { weight: 0.25, description: 'Diversity, inclusion, and equal opportunities' },
        employeeWellbeing: { weight: 0.20, description: 'Employee satisfaction and wellbeing programs' },
        stakeholderEngagement: { weight: 0.15, description: 'Stakeholder communication and transparency' },
        socialInnovation: { weight: 0.10, description: 'Social technology solutions and accessibility' },
      },
      sustainability: {
        environmentalImpact: { weight: 0.35, description: 'Carbon footprint and environmental metrics' },
        resourceManagement: { weight: 0.25, description: 'Resource efficiency and renewable energy' },
        greenInnovation: { weight: 0.20, description: 'Clean technology and sustainable products' },
        complianceCertifications: { weight: 0.15, description: 'Environmental certifications and compliance' },
        futureSustainability: { weight: 0.05, description: 'Long-term sustainability commitments' },
      },
      economic: {
        financialPerformance: { weight: 0.40, description: 'Profitability, revenue, and financial stability' },
        economicImpact: { weight: 0.25, description: 'Job creation and local economic contribution' },
        innovationRD: { weight: 0.20, description: 'R&D investment and innovation metrics' },
        marketPosition: { weight: 0.10, description: 'Market share and competitive advantage' },
        riskManagement: { weight: 0.05, description: 'Financial and operational risk management' },
      },
    },
    scoringRange: {
      min: 0,
      max: 100,
      excellent: 90,
      good: 75,
      average: 60,
      needsImprovement: 45,
    },
  };

  res.status(200).json({
    success: true,
    message: 'SSE metric definitions retrieved successfully',
    data: metricDefinitions,
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /api/sse/test
 * @desc    Test endpoint for development
 * @access  Public (only in development)
 */
if (process.env.NODE_ENV === 'development') {
  router.get('/test', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'SSE routes are working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      features: [
        'SSE Score Calculation',
        'Daily Questions',
        'Behavior Tracking',
        'Benchmarking',
        'Analytics',
        'Recommendations',
        'Leaderboard',
      ],
    });
  });
}

// Error handling middleware for SSE routes
router.use((error: any, req: any, res: any, next: any) => {
  logger.error('SSE route error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    ip: req.ip,
    userId: req.user?.id,
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error in SSE service',
    error: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  });
});

export default router;
