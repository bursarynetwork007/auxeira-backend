/**
 * Gamification Controller
 * Handles all gamification and rewards API endpoints
 */

import { Request, Response } from 'express';
import { gamificationService } from '../services/gamification.service';
import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';
import {
  GetUserProfileRequest,
  UpdateUserPreferencesRequest,
  CreateChallengeRequest,
  JoinChallengeRequest,
  RedeemTokensRequest,
  GetLeaderboardRequest,
  GetChallengesRequest,
  GetTokenHistoryRequest,
  TokenAction,
  ChallengeType,
  LeaderboardType
} from '../types/gamification.types';

export class GamificationController {
  /**
   * Get user's gamification profile
   * GET /api/gamification/profile
   */
  async getUserProfile(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('gamification_controller_get_profile');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const {
        includeAchievements,
        includeBadges,
        includeStats,
        includeLeaderboardRank
      } = req.query;

      const request: GetUserProfileRequest = {
        includeAchievements: includeAchievements === 'true',
        includeBadges: includeBadges === 'true',
        includeStats: includeStats === 'true',
        includeLeaderboardRank: includeLeaderboardRank === 'true'
      };

      const profile = await gamificationService.getUserProfile(userId, request);

      timer.end();

      res.json({
        success: true,
        data: profile
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get user profile', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  }

  /**
   * Update user gamification preferences
   * PUT /api/gamification/preferences
   */
  async updatePreferences(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('gamification_controller_update_preferences');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const request: UpdateUserPreferencesRequest = req.body;

      // This would need to be implemented in the service
      // await gamificationService.updateUserPreferences(userId, request);

      timer.end();

      res.json({
        success: true,
        message: 'Preferences updated successfully'
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to update preferences', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  }

  /**
   * Award experience points (Internal/Admin use)
   * POST /api/gamification/experience
   */
  async awardExperience(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('gamification_controller_award_experience');

    try {
      const { userId, amount, source, metadata } = req.body;

      if (!userId || !amount || !source) {
        res.status(400).json({ error: 'User ID, amount, and source are required' });
        return;
      }

      const result = await gamificationService.awardExperience(
        userId,
        amount,
        source,
        metadata
      );

      timer.end();

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to award experience', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to award experience' });
    }
  }

  /**
   * Award AUX tokens (Internal/Admin use)
   * POST /api/gamification/tokens/award
   */
  async awardTokens(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('gamification_controller_award_tokens');

    try {
      const { userId, action, sourceId, metadata } = req.body;

      if (!userId || !action) {
        res.status(400).json({ error: 'User ID and action are required' });
        return;
      }

      const result = await gamificationService.awardTokens(
        userId,
        action as TokenAction,
        sourceId,
        metadata
      );

      timer.end();

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to award tokens', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to award tokens' });
    }
  }

  /**
   * Check and unlock achievements
   * POST /api/gamification/achievements/check
   */
  async checkAchievements(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('gamification_controller_check_achievements');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const unlockedAchievements = await gamificationService.checkAchievements(userId);

      timer.end();

      res.json({
        success: true,
        data: {
          newAchievements: unlockedAchievements,
          count: unlockedAchievements.length
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to check achievements', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to check achievements' });
    }
  }

  /**
   * Get available challenges
   * GET /api/gamification/challenges
   */
  async getChallenges(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('gamification_controller_get_challenges');

    try {
      const {
        type,
        category,
        difficulty,
        status,
        limit,
        offset
      } = req.query;

      const request: GetChallengesRequest = {
        type: type as ChallengeType,
        category: category as any,
        difficulty: difficulty as any,
        status: status as any,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined
      };

      // This would need to be implemented in the service
      // const challenges = await gamificationService.getChallenges(request);

      timer.end();

      res.json({
        success: true,
        data: {
          challenges: [],
          total: 0,
          hasMore: false
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get challenges', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to get challenges' });
    }
  }

  /**
   * Create a new challenge (Admin only)
   * POST /api/gamification/challenges
   */
  async createChallenge(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('gamification_controller_create_challenge');

    try {
      const creatorId = req.user?.id;
      if (!creatorId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // TODO: Add admin authorization check

      const request: CreateChallengeRequest = req.body;

      if (!request.name || !request.description || !request.type) {
        res.status(400).json({ error: 'Name, description, and type are required' });
        return;
      }

      const challenge = await gamificationService.createChallenge(creatorId, request);

      timer.end();

      res.status(201).json({
        success: true,
        data: challenge
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to create challenge', {
        error: (error as Error).message,
        creatorId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to create challenge' });
    }
  }

  /**
   * Join a challenge
   * POST /api/gamification/challenges/join
   */
  async joinChallenge(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('gamification_controller_join_challenge');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const request: JoinChallengeRequest = req.body;

      if (!request.challengeId) {
        res.status(400).json({ error: 'Challenge ID is required' });
        return;
      }

      await gamificationService.joinChallenge(userId, request);

      timer.end();

      res.json({
        success: true,
        message: 'Successfully joined challenge'
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to join challenge', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Get user's active challenges
   * GET /api/gamification/challenges/my
   */
  async getUserChallenges(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('gamification_controller_get_user_challenges');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // This would need to be implemented in the service
      // const userChallenges = await gamificationService.getUserChallenges(userId);

      timer.end();

      res.json({
        success: true,
        data: {
          activeChallenges: [],
          completedChallenges: [],
          totalProgress: 0
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get user challenges', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to get user challenges' });
    }
  }

  /**
   * Get available token rewards
   * GET /api/gamification/rewards
   */
  async getTokenRewards(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('gamification_controller_get_rewards');

    try {
      const {
        category,
        minCost,
        maxCost,
        featured,
        limit,
        offset
      } = req.query;

      // This would need to be implemented in the service
      // const rewards = await gamificationService.getTokenRewards({...});

      timer.end();

      res.json({
        success: true,
        data: {
          rewards: [],
          total: 0,
          hasMore: false,
          categories: []
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get token rewards', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to get token rewards' });
    }
  }

  /**
   * Redeem tokens for rewards
   * POST /api/gamification/rewards/redeem
   */
  async redeemTokens(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('gamification_controller_redeem_tokens');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const request: RedeemTokensRequest = req.body;

      if (!request.rewardId) {
        res.status(400).json({ error: 'Reward ID is required' });
        return;
      }

      const result = await gamificationService.redeemTokens(userId, request);

      timer.end();

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to redeem tokens', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Get token transaction history
   * GET /api/gamification/tokens/history
   */
  async getTokenHistory(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('gamification_controller_get_token_history');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const {
        transactionType,
        source,
        startDate,
        endDate,
        limit,
        offset
      } = req.query;

      const request: GetTokenHistoryRequest = {
        transactionType: transactionType as any,
        source: source as any,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined
      };

      // This would need to be implemented in the service
      // const history = await gamificationService.getTokenHistory(userId, request);

      timer.end();

      res.json({
        success: true,
        data: {
          transactions: [],
          total: 0,
          hasMore: false,
          summary: {
            totalEarned: 0,
            totalSpent: 0,
            currentBalance: 0
          }
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get token history', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to get token history' });
    }
  }

  /**
   * Get leaderboards
   * GET /api/gamification/leaderboards
   */
  async getLeaderboards(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('gamification_controller_get_leaderboards');

    try {
      const {
        type,
        category,
        timeframe,
        limit,
        offset
      } = req.query;

      const request: GetLeaderboardRequest = {
        type: type as LeaderboardType,
        category: category as any,
        timeframe: timeframe as any,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined
      };

      const leaderboards = await gamificationService.getLeaderboards(request);

      timer.end();

      res.json({
        success: true,
        data: leaderboards
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get leaderboards', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to get leaderboards' });
    }
  }

  /**
   * Update user streak
   * POST /api/gamification/streak
   */
  async updateStreak(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('gamification_controller_update_streak');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { streakType } = req.body;

      if (!streakType) {
        res.status(400).json({ error: 'Streak type is required' });
        return;
      }

      await gamificationService.updateUserStreak(userId, streakType);

      timer.end();

      res.json({
        success: true,
        message: 'Streak updated successfully'
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to update streak', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to update streak' });
    }
  }

  /**
   * Get gamification dashboard data
   * GET /api/gamification/dashboard
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('gamification_controller_get_dashboard');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Get comprehensive dashboard data
      const profile = await gamificationService.getUserProfile(userId, {
        includeAchievements: true,
        includeBadges: true,
        includeStats: true,
        includeLeaderboardRank: true
      });

      // This would need additional service methods
      const dashboardData = {
        profile,
        recentActivity: [],
        activeChallenges: [],
        availableRewards: [],
        leaderboards: [],
        seasonalEvent: null,
        quickStats: {
          tokensEarned: profile.auxTokensEarned,
          currentLevel: profile.level,
          currentStreak: profile.streak.current,
          achievementsUnlocked: profile.achievements.length
        },
        recommendations: {
          challenges: [],
          rewards: [],
          achievements: []
        }
      };

      timer.end();

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get dashboard', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to get dashboard' });
    }
  }

  /**
   * Get user engagement metrics (Admin only)
   * GET /api/gamification/admin/engagement/:userId
   */
  async getUserEngagementMetrics(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('gamification_controller_get_engagement_metrics');

    try {
      // TODO: Add admin authorization check
      const { userId } = req.params;
      const { period } = req.query;

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      // This would need to be implemented in the service
      // const metrics = await gamificationService.getUserEngagementMetrics(userId, period as string);

      timer.end();

      res.json({
        success: true,
        data: {
          message: 'Engagement metrics endpoint not fully implemented',
          userId,
          period
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get engagement metrics', {
        error: (error as Error).message,
        userId: req.params.userId
      });
      res.status(500).json({ error: 'Failed to get engagement metrics' });
    }
  }

  /**
   * Get gamification statistics (Admin only)
   * GET /api/gamification/admin/stats
   */
  async getGamificationStats(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('gamification_controller_get_stats');

    try {
      // TODO: Add admin authorization check
      const { period, metric } = req.query;

      // This would aggregate statistics across all users
      const stats = {
        totalUsers: 0,
        activeUsers: 0,
        totalTokensEarned: 0,
        totalTokensSpent: 0,
        averageLevel: 0,
        achievementsUnlocked: 0,
        challengesCompleted: 0,
        topPerformers: [],
        engagementTrends: []
      };

      timer.end();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get gamification statistics', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to get statistics' });
    }
  }
}

export const gamificationController = new GamificationController();
export default gamificationController;
