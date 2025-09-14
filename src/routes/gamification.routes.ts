/**
 * Gamification Routes
 * Defines all gamification and rewards API endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { gamificationController } from '../controllers/gamification.controller';
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
const updatePreferencesValidation = [
  body('enableNotifications').optional().isBoolean().withMessage('enableNotifications must be a boolean'),
  body('enableLeaderboards').optional().isBoolean().withMessage('enableLeaderboards must be a boolean'),
  body('enableAchievementAlerts').optional().isBoolean().withMessage('enableAchievementAlerts must be a boolean'),
  body('enableStreakReminders').optional().isBoolean().withMessage('enableStreakReminders must be a boolean'),
  body('enableTokenEarningAlerts').optional().isBoolean().withMessage('enableTokenEarningAlerts must be a boolean'),
  body('preferredChallenges').optional().isArray().withMessage('preferredChallenges must be an array'),
  body('privacyLevel').optional().isIn(['public', 'friends', 'private']).withMessage('Invalid privacy level'),
  body('displayBadges').optional().isBoolean().withMessage('displayBadges must be a boolean'),
  body('displayRank').optional().isBoolean().withMessage('displayRank must be a boolean')
];

const awardExperienceValidation = [
  body('userId').isUUID().withMessage('Valid user ID is required'),
  body('amount').isInt({ min: 1, max: 10000 }).withMessage('Amount must be between 1 and 10000'),
  body('source').isLength({ min: 1, max: 100 }).withMessage('Source is required'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object')
];

const awardTokensValidation = [
  body('userId').isUUID().withMessage('Valid user ID is required'),
  body('action').isIn(['login', 'sse_score_update', 'partnership_application', 'partnership_approval', 'benefit_redemption', 'mentorship_session', 'document_generation', 'report_creation', 'referral_success', 'community_post', 'achievement_unlock', 'challenge_completion']).withMessage('Valid action is required'),
  body('sourceId').optional().isString().withMessage('Source ID must be a string'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object')
];

const createChallengeValidation = [
  body('name').isLength({ min: 3, max: 200 }).withMessage('Name must be between 3 and 200 characters'),
  body('description').isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('type').isIn(['individual', 'team', 'community', 'seasonal']).withMessage('Valid type is required'),
  body('category').isIn(['sse_improvement', 'partnership_engagement', 'mentorship_activity', 'community_building', 'learning_goals', 'networking']).withMessage('Valid category is required'),
  body('difficulty').isIn(['easy', 'medium', 'hard', 'expert']).withMessage('Valid difficulty is required'),
  body('duration').isIn(['daily', 'weekly', 'monthly', 'quarterly', 'custom']).withMessage('Valid duration is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('criteria').isObject().withMessage('Criteria object is required'),
  body('rewards').isObject().withMessage('Rewards object is required'),
  body('maxParticipants').optional().isInt({ min: 1 }).withMessage('Max participants must be positive'),
  body('isPublic').isBoolean().withMessage('isPublic must be a boolean')
];

const joinChallengeValidation = [
  body('challengeId').isUUID().withMessage('Valid challenge ID is required')
];

const redeemTokensValidation = [
  body('rewardId').isUUID().withMessage('Valid reward ID is required'),
  body('quantity').optional().isInt({ min: 1, max: 100 }).withMessage('Quantity must be between 1 and 100')
];

const updateStreakValidation = [
  body('streakType').isIn(['login', 'sse_improvement', 'partnership_activity', 'mentorship_engagement', 'community_participation']).withMessage('Valid streak type is required')
];

const profileQueryValidation = [
  query('includeAchievements').optional().isBoolean().withMessage('includeAchievements must be a boolean'),
  query('includeBadges').optional().isBoolean().withMessage('includeBadges must be a boolean'),
  query('includeStats').optional().isBoolean().withMessage('includeStats must be a boolean'),
  query('includeLeaderboardRank').optional().isBoolean().withMessage('includeLeaderboardRank must be a boolean')
];

const challengesQueryValidation = [
  query('type').optional().isIn(['individual', 'team', 'community', 'seasonal']).withMessage('Invalid challenge type'),
  query('category').optional().isIn(['sse_improvement', 'partnership_engagement', 'mentorship_activity', 'community_building', 'learning_goals', 'networking']).withMessage('Invalid category'),
  query('difficulty').optional().isIn(['easy', 'medium', 'hard', 'expert']).withMessage('Invalid difficulty'),
  query('status').optional().isIn(['active', 'upcoming', 'completed']).withMessage('Invalid status'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
];

const leaderboardQueryValidation = [
  query('type').optional().isIn(['global', 'regional', 'industry', 'tier', 'challenge_specific']).withMessage('Invalid leaderboard type'),
  query('category').optional().isIn(['overall_score', 'sse_performance', 'partnership_success', 'mentorship_engagement', 'community_contribution', 'token_earnings']).withMessage('Invalid category'),
  query('timeframe').optional().isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all_time']).withMessage('Invalid timeframe'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
];

const tokenHistoryQueryValidation = [
  query('transactionType').optional().isIn(['earned', 'spent', 'bonus', 'refund', 'expired', 'transferred']).withMessage('Invalid transaction type'),
  query('source').optional().isIn(['achievement', 'challenge', 'daily_login', 'sse_improvement', 'partnership_activity', 'mentorship_session', 'referral', 'community_contribution', 'special_event', 'admin_grant']).withMessage('Invalid source'),
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
];

const rewardsQueryValidation = [
  query('category').optional().isIn(['platform_benefits', 'partner_discounts', 'exclusive_access', 'physical_goods', 'digital_content', 'experiences', 'consultations']).withMessage('Invalid category'),
  query('minCost').optional().isInt({ min: 0 }).withMessage('Min cost must be non-negative'),
  query('maxCost').optional().isInt({ min: 0 }).withMessage('Max cost must be non-negative'),
  query('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
];

// Protected routes (authentication required)

/**
 * @route GET /api/gamification/profile
 * @desc Get user's gamification profile
 * @access Private
 */
router.get(
  '/profile',
  authenticateToken,
  profileQueryValidation,
  validateRequest,
  gamificationController.getUserProfile
);

/**
 * @route PUT /api/gamification/preferences
 * @desc Update user gamification preferences
 * @access Private
 */
router.put(
  '/preferences',
  authenticateToken,
  updatePreferencesValidation,
  validateRequest,
  gamificationController.updatePreferences
);

/**
 * @route POST /api/gamification/achievements/check
 * @desc Check and unlock achievements for user
 * @access Private
 */
router.post(
  '/achievements/check',
  authenticateToken,
  gamificationController.checkAchievements
);

/**
 * @route GET /api/gamification/challenges
 * @desc Get available challenges
 * @access Private
 */
router.get(
  '/challenges',
  authenticateToken,
  challengesQueryValidation,
  validateRequest,
  gamificationController.getChallenges
);

/**
 * @route POST /api/gamification/challenges/join
 * @desc Join a challenge
 * @access Private
 */
router.post(
  '/challenges/join',
  authenticateToken,
  joinChallengeValidation,
  validateRequest,
  gamificationController.joinChallenge
);

/**
 * @route GET /api/gamification/challenges/my
 * @desc Get user's active challenges
 * @access Private
 */
router.get(
  '/challenges/my',
  authenticateToken,
  gamificationController.getUserChallenges
);

/**
 * @route GET /api/gamification/rewards
 * @desc Get available token rewards
 * @access Private
 */
router.get(
  '/rewards',
  authenticateToken,
  rewardsQueryValidation,
  validateRequest,
  gamificationController.getTokenRewards
);

/**
 * @route POST /api/gamification/rewards/redeem
 * @desc Redeem tokens for rewards
 * @access Private
 */
router.post(
  '/rewards/redeem',
  authenticateToken,
  redeemTokensValidation,
  validateRequest,
  gamificationController.redeemTokens
);

/**
 * @route GET /api/gamification/tokens/history
 * @desc Get token transaction history
 * @access Private
 */
router.get(
  '/tokens/history',
  authenticateToken,
  tokenHistoryQueryValidation,
  validateRequest,
  gamificationController.getTokenHistory
);

/**
 * @route GET /api/gamification/leaderboards
 * @desc Get leaderboards
 * @access Private
 */
router.get(
  '/leaderboards',
  authenticateToken,
  leaderboardQueryValidation,
  validateRequest,
  gamificationController.getLeaderboards
);

/**
 * @route POST /api/gamification/streak
 * @desc Update user streak
 * @access Private
 */
router.post(
  '/streak',
  authenticateToken,
  updateStreakValidation,
  validateRequest,
  gamificationController.updateStreak
);

/**
 * @route GET /api/gamification/dashboard
 * @desc Get gamification dashboard data
 * @access Private
 */
router.get(
  '/dashboard',
  authenticateToken,
  gamificationController.getDashboard
);

// Admin routes (additional authorization would be needed)

/**
 * @route POST /api/gamification/experience
 * @desc Award experience points (admin only)
 * @access Admin
 */
router.post(
  '/experience',
  authenticateToken,
  // TODO: Add admin authorization middleware
  awardExperienceValidation,
  validateRequest,
  gamificationController.awardExperience
);

/**
 * @route POST /api/gamification/tokens/award
 * @desc Award AUX tokens (admin only)
 * @access Admin
 */
router.post(
  '/tokens/award',
  authenticateToken,
  // TODO: Add admin authorization middleware
  awardTokensValidation,
  validateRequest,
  gamificationController.awardTokens
);

/**
 * @route POST /api/gamification/challenges
 * @desc Create new challenge (admin only)
 * @access Admin
 */
router.post(
  '/challenges',
  authenticateToken,
  // TODO: Add admin authorization middleware
  createChallengeValidation,
  validateRequest,
  gamificationController.createChallenge
);

/**
 * @route GET /api/gamification/admin/engagement/:userId
 * @desc Get user engagement metrics (admin only)
 * @access Admin
 */
router.get(
  '/admin/engagement/:userId',
  authenticateToken,
  // TODO: Add admin authorization middleware
  [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    query('period').optional().matches(/^\d{4}-\d{2}$/).withMessage('Period must be in YYYY-MM format')
  ],
  validateRequest,
  gamificationController.getUserEngagementMetrics
);

/**
 * @route GET /api/gamification/admin/stats
 * @desc Get gamification statistics (admin only)
 * @access Admin
 */
router.get(
  '/admin/stats',
  authenticateToken,
  // TODO: Add admin authorization middleware
  [
    query('period').optional().matches(/^\d{4}-\d{2}$/).withMessage('Period must be in YYYY-MM format'),
    query('metric').optional().isIn(['engagement', 'tokens', 'achievements', 'challenges', 'retention']).withMessage('Invalid metric')
  ],
  validateRequest,
  gamificationController.getGamificationStats
);

// Additional admin endpoints for gamification management

/**
 * @route POST /api/gamification/admin/achievements
 * @desc Create new achievement (admin only)
 * @access Admin
 */
router.post(
  '/admin/achievements',
  authenticateToken,
  // TODO: Add admin authorization middleware
  [
    body('name').isLength({ min: 3, max: 200 }).withMessage('Name must be between 3 and 200 characters'),
    body('description').isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
    body('category').isIn(['onboarding', 'sse_performance', 'partnerships', 'mentorship', 'community', 'learning', 'networking', 'milestones', 'special_events']).withMessage('Valid category is required'),
    body('type').isIn(['progress', 'milestone', 'streak', 'social', 'rare', 'seasonal']).withMessage('Valid type is required'),
    body('criteria').isObject().withMessage('Criteria object is required'),
    body('rewards').isObject().withMessage('Rewards object is required'),
    body('rarity').isIn(['common', 'uncommon', 'rare', 'epic', 'legendary']).withMessage('Valid rarity is required')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    // TODO: Implement achievement creation endpoint
    res.json({
      success: true,
      data: {
        message: 'Achievement creation endpoint not implemented yet'
      }
    });
  }
);

/**
 * @route POST /api/gamification/admin/rewards
 * @desc Create new token reward (admin only)
 * @access Admin
 */
router.post(
  '/admin/rewards',
  authenticateToken,
  // TODO: Add admin authorization middleware
  [
    body('name').isLength({ min: 3, max: 200 }).withMessage('Name must be between 3 and 200 characters'),
    body('description').isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
    body('category').isIn(['platform_benefits', 'partner_discounts', 'exclusive_access', 'physical_goods', 'digital_content', 'experiences', 'consultations']).withMessage('Valid category is required'),
    body('cost').isInt({ min: 1 }).withMessage('Cost must be positive'),
    body('type').isIn(['instant', 'scheduled', 'manual_fulfillment', 'partner_integration']).withMessage('Valid type is required'),
    body('value').isObject().withMessage('Value object is required'),
    body('availability').isObject().withMessage('Availability object is required')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    // TODO: Implement reward creation endpoint
    res.json({
      success: true,
      data: {
        message: 'Reward creation endpoint not implemented yet'
      }
    });
  }
);

/**
 * @route POST /api/gamification/admin/leaderboards/update
 * @desc Update leaderboards (admin only)
 * @access Admin
 */
router.post(
  '/admin/leaderboards/update',
  authenticateToken,
  // TODO: Add admin authorization middleware
  [
    body('leaderboardIds').optional().isArray().withMessage('Leaderboard IDs must be an array'),
    body('forceUpdate').optional().isBoolean().withMessage('Force update must be a boolean')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    // TODO: Implement leaderboard update endpoint
    res.json({
      success: true,
      data: {
        message: 'Leaderboard update endpoint not implemented yet',
        updated: 0
      }
    });
  }
);

/**
 * @route GET /api/gamification/admin/export
 * @desc Export gamification data (admin only)
 * @access Admin
 */
router.get(
  '/admin/export',
  authenticateToken,
  // TODO: Add admin authorization middleware
  [
    query('type').isIn(['users', 'achievements', 'challenges', 'tokens', 'leaderboards']).withMessage('Valid export type is required'),
    query('format').isIn(['csv', 'xlsx', 'json']).withMessage('Format must be csv, xlsx, or json'),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
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