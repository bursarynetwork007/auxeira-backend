import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import { aiMentorshipController } from '../controllers/ai-mentorship.controller';
import {
  authenticateToken,
  requireEmailVerified,
  rateLimitByUser
} from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

// Rate limiting configurations
const mentorshipRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  message: {
    success: false,
    message: 'Too many mentorship requests, please try again later',
    error: 'RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const messageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 messages per minute
  message: {
    success: false,
    message: 'Too many messages, please slow down',
    error: 'MESSAGE_RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const sessionStartRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 new sessions per hour
  message: {
    success: false,
    message: 'Too many new sessions, please wait before starting another',
    error: 'SESSION_START_RATE_LIMIT_EXCEEDED',
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

// Start session validation
const startSessionValidation = [
  body('sessionType')
    .isIn(['goal_setting', 'score_improvement', 'career_guidance', 'sustainability_advice', 'general_chat'])
    .withMessage('Session type must be goal_setting, score_improvement, career_guidance, sustainability_advice, or general_chat'),
  body('topic')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Topic must be between 1 and 200 characters'),
  body('aiPersonality')
    .optional()
    .isIn(['supportive', 'challenging', 'analytical', 'creative', 'professional'])
    .withMessage('AI personality must be supportive, challenging, analytical, creative, or professional'),
  body('sessionGoals')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Session goals must be an array with maximum 5 items'),
  body('sessionGoals.*')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each session goal must be between 1 and 100 characters'),
  body('focusAreas')
    .optional()
    .isArray({ max: 3 })
    .withMessage('Focus areas must be an array with maximum 3 items'),
  body('focusAreas.*')
    .optional()
    .isIn(['social', 'sustainability', 'economic'])
    .withMessage('Each focus area must be social, sustainability, or economic'),
];

// Send message validation
const sendMessageValidation = [
  body('sessionId')
    .notEmpty()
    .isUUID()
    .withMessage('Session ID must be a valid UUID'),
  body('messageText')
    .notEmpty()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message text must be between 1 and 2000 characters'),
  body('attachments')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Attachments must be an array with maximum 5 items'),
  body('context.includeSSEScores')
    .optional()
    .isBoolean()
    .withMessage('includeSSEScores must be a boolean'),
  body('context.includeRecentBehaviors')
    .optional()
    .isBoolean()
    .withMessage('includeRecentBehaviors must be a boolean'),
  body('context.includeGoals')
    .optional()
    .isBoolean()
    .withMessage('includeGoals must be a boolean'),
];

// Create goal validation
const createGoalValidation = [
  body('title')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .notEmpty()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('category')
    .isIn(['social', 'sustainability', 'economic', 'career', 'personal'])
    .withMessage('Category must be social, sustainability, economic, career, or personal'),
  body('priority')
    .optional()
    .isIn(['high', 'medium', 'low'])
    .withMessage('Priority must be high, medium, or low'),
  body('targetValue')
    .optional()
    .isNumeric()
    .withMessage('Target value must be a number'),
  body('unit')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('Unit must be between 1 and 20 characters'),
  body('targetDate')
    .optional()
    .isISO8601()
    .withMessage('Target date must be a valid ISO 8601 date'),
  body('milestones')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Milestones must be an array with maximum 10 items'),
  body('milestones.*.title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Milestone title must be between 1 and 100 characters'),
  body('milestones.*.description')
    .optional()
    .isLength({ min: 1, max: 300 })
    .withMessage('Milestone description must be between 1 and 300 characters'),
  body('milestones.*.targetDate')
    .optional()
    .isISO8601()
    .withMessage('Milestone target date must be a valid ISO 8601 date'),
];

// Update goal progress validation
const updateGoalProgressValidation = [
  param('goalId')
    .isUUID()
    .withMessage('Goal ID must be a valid UUID'),
  body('currentValue')
    .optional()
    .isNumeric()
    .withMessage('Current value must be a number'),
  body('progressPercentage')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress percentage must be between 0 and 100'),
  body('status')
    .optional()
    .isIn(['not_started', 'in_progress', 'completed', 'paused', 'cancelled'])
    .withMessage('Status must be not_started, in_progress, completed, paused, or cancelled'),
  body('milestoneUpdates')
    .optional()
    .isArray()
    .withMessage('Milestone updates must be an array'),
  body('milestoneUpdates.*.milestoneId')
    .optional()
    .isUUID()
    .withMessage('Milestone ID must be a valid UUID'),
  body('milestoneUpdates.*.isCompleted')
    .optional()
    .isBoolean()
    .withMessage('isCompleted must be a boolean'),
  body('milestoneUpdates.*.progressPercentage')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Milestone progress percentage must be between 0 and 100'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be maximum 1000 characters'),
];

// End session validation
const endSessionValidation = [
  param('sessionId')
    .isUUID()
    .withMessage('Session ID must be a valid UUID'),
  body('userSatisfactionRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('User satisfaction rating must be between 1 and 5'),
  body('feedback')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Feedback must be maximum 1000 characters'),
];

// Acknowledge insight validation
const acknowledgeInsightValidation = [
  param('insightId')
    .isUUID()
    .withMessage('Insight ID must be a valid UUID'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be maximum 500 characters'),
];

// Query validation
const listQueryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
];

const goalsQueryValidation = [
  ...listQueryValidation,
  query('status')
    .optional()
    .isIn(['not_started', 'in_progress', 'completed', 'paused', 'cancelled'])
    .withMessage('Status must be not_started, in_progress, completed, paused, or cancelled'),
  query('category')
    .optional()
    .isIn(['social', 'sustainability', 'economic', 'career', 'personal'])
    .withMessage('Category must be social, sustainability, economic, career, or personal'),
];

const insightsQueryValidation = [
  ...listQueryValidation,
  query('category')
    .optional()
    .isIn(['social', 'sustainability', 'economic', 'behavioral', 'goal_progress'])
    .withMessage('Category must be social, sustainability, economic, behavioral, or goal_progress'),
  query('significance')
    .optional()
    .isIn(['high', 'medium', 'low'])
    .withMessage('Significance must be high, medium, or low'),
];

// =============================================================================
// MENTORSHIP SESSION ROUTES
// =============================================================================

/**
 * @route   POST /api/mentorship/sessions/start
 * @desc    Start a new mentorship session
 * @access  Private
 */
router.post('/sessions/start',
  sessionStartRateLimit,
  mentorshipRateLimit,
  authenticateToken,
  requireEmailVerified,
  startSessionValidation,
  handleValidationErrors,
  rateLimitByUser(5, 60 * 60 * 1000), // 5 sessions per hour per user
  aiMentorshipController.startSession.bind(aiMentorshipController)
);

/**
 * @route   POST /api/mentorship/sessions/message
 * @desc    Send message in mentorship session
 * @access  Private
 */
router.post('/sessions/message',
  messageRateLimit,
  mentorshipRateLimit,
  authenticateToken,
  requireEmailVerified,
  sendMessageValidation,
  handleValidationErrors,
  rateLimitByUser(60, 60 * 60 * 1000), // 60 messages per hour per user
  aiMentorshipController.sendMessage.bind(aiMentorshipController)
);

/**
 * @route   GET /api/mentorship/sessions/active
 * @desc    Get active mentorship sessions
 * @access  Private
 */
router.get('/sessions/active',
  mentorshipRateLimit,
  authenticateToken,
  listQueryValidation,
  handleValidationErrors,
  aiMentorshipController.getActiveSessions.bind(aiMentorshipController)
);

/**
 * @route   GET /api/mentorship/sessions/:sessionId/history
 * @desc    Get session message history
 * @access  Private
 */
router.get('/sessions/:sessionId/history',
  mentorshipRateLimit,
  authenticateToken,
  param('sessionId').isUUID().withMessage('Session ID must be a valid UUID'),
  listQueryValidation,
  handleValidationErrors,
  aiMentorshipController.getSessionHistory.bind(aiMentorshipController)
);

/**
 * @route   POST /api/mentorship/sessions/:sessionId/end
 * @desc    End mentorship session
 * @access  Private
 */
router.post('/sessions/:sessionId/end',
  mentorshipRateLimit,
  authenticateToken,
  endSessionValidation,
  handleValidationErrors,
  aiMentorshipController.endSession.bind(aiMentorshipController)
);

// =============================================================================
// GOAL MANAGEMENT ROUTES
// =============================================================================

/**
 * @route   POST /api/mentorship/goals
 * @desc    Create a new goal
 * @access  Private
 */
router.post('/goals',
  mentorshipRateLimit,
  authenticateToken,
  requireEmailVerified,
  createGoalValidation,
  handleValidationErrors,
  rateLimitByUser(20, 24 * 60 * 60 * 1000), // 20 goals per day per user
  aiMentorshipController.createGoal.bind(aiMentorshipController)
);

/**
 * @route   PUT /api/mentorship/goals/:goalId/progress
 * @desc    Update goal progress
 * @access  Private
 */
router.put('/goals/:goalId/progress',
  mentorshipRateLimit,
  authenticateToken,
  updateGoalProgressValidation,
  handleValidationErrors,
  rateLimitByUser(100, 24 * 60 * 60 * 1000), // 100 updates per day per user
  aiMentorshipController.updateGoalProgress.bind(aiMentorshipController)
);

/**
 * @route   GET /api/mentorship/goals
 * @desc    Get user goals
 * @access  Private
 */
router.get('/goals',
  mentorshipRateLimit,
  authenticateToken,
  goalsQueryValidation,
  handleValidationErrors,
  aiMentorshipController.getGoals.bind(aiMentorshipController)
);

// =============================================================================
// ANALYTICS AND INSIGHTS ROUTES
// =============================================================================

/**
 * @route   GET /api/mentorship/analytics
 * @desc    Get mentorship analytics
 * @access  Private
 */
router.get('/analytics',
  mentorshipRateLimit,
  authenticateToken,
  requireEmailVerified,
  aiMentorshipController.getAnalytics.bind(aiMentorshipController)
);

/**
 * @route   GET /api/mentorship/insights
 * @desc    Get mentorship insights
 * @access  Private
 */
router.get('/insights',
  mentorshipRateLimit,
  authenticateToken,
  insightsQueryValidation,
  handleValidationErrors,
  aiMentorshipController.getInsights.bind(aiMentorshipController)
);

/**
 * @route   POST /api/mentorship/insights/:insightId/acknowledge
 * @desc    Acknowledge insight
 * @access  Private
 */
router.post('/insights/:insightId/acknowledge',
  mentorshipRateLimit,
  authenticateToken,
  acknowledgeInsightValidation,
  handleValidationErrors,
  aiMentorshipController.acknowledgeInsight.bind(aiMentorshipController)
);

// =============================================================================
// CONFIGURATION AND OPTIONS ROUTES
// =============================================================================

/**
 * @route   GET /api/mentorship/personalities
 * @desc    Get AI personality options
 * @access  Public
 */
router.get('/personalities',
  mentorshipRateLimit,
  aiMentorshipController.getPersonalityOptions.bind(aiMentorshipController)
);

/**
 * @route   GET /api/mentorship/session-types
 * @desc    Get session type options
 * @access  Public
 */
router.get('/session-types',
  mentorshipRateLimit,
  aiMentorshipController.getSessionTypeOptions.bind(aiMentorshipController)
);

// =============================================================================
// HEALTH CHECK AND UTILITY ROUTES
// =============================================================================

/**
 * @route   GET /api/mentorship/health
 * @desc    Health check for AI mentorship service
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI mentorship service is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: {
      aiMentorship: true,
      goalManagement: true,
      sessionManagement: true,
      insights: true,
      analytics: true,
      multiplePersonalities: true,
      realTimeChat: true,
    },
    aiModels: {
      available: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      default: 'gpt-4',
    },
    personalities: {
      available: ['supportive', 'challenging', 'analytical', 'creative', 'professional'],
      default: 'supportive',
    },
    sessionTypes: {
      available: ['goal_setting', 'score_improvement', 'career_guidance', 'sustainability_advice', 'general_chat'],
    },
  });
});

/**
 * @route   GET /api/mentorship/test
 * @desc    Test endpoint for development
 * @access  Public (only in development)
 */
if (process.env.NODE_ENV === 'development') {
  router.get('/test', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'AI mentorship routes are working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      features: [
        'AI-powered mentorship sessions',
        'Multiple AI personalities',
        'Goal setting and tracking',
        'Progress insights and analytics',
        'Real-time conversation',
        'Personalized recommendations',
        'Session history and analytics',
      ],
      testEndpoints: [
        'GET /api/mentorship/personalities',
        'GET /api/mentorship/session-types',
        'GET /api/mentorship/health',
      ],
    });
  });
}

// Error handling middleware for mentorship routes
router.use((error: any, req: any, res: any, next: any) => {
  logger.error('AI mentorship route error', {
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
    message: 'Internal server error in AI mentorship service',
    error: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  });
});

export default router;
