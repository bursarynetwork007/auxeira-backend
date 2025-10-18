import { Request, Response } from 'express';
import { sseScoringService } from '../services/sse-scoring.service';
import { logger, logUserActivity } from '../utils/logger';
import { CalculateSSEScoreRequest } from '../types/sse.types';

/**
 * SSE Scoring Controllers
 */
export class SSEController {
  /**
   * Calculate SSE score for current user
   */
  async calculateScore(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const {
        includeProjections = false,
        includeBenchmarks = true,
        timeRange,
      } = req.body;

      const request: CalculateSSEScoreRequest = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        includeProjections,
        includeBenchmarks,
        timeRange: timeRange ? {
          startDate: new Date(timeRange.startDate),
          endDate: new Date(timeRange.endDate),
        } : undefined,
      };

      const result = await sseScoringService.calculateSSEScore(request);

      // Log score calculation
      await logUserActivity(req.user.id, 'sse_score_calculated', 'score', {
        includeProjections,
        includeBenchmarks,
        overallScore: result.data.currentScore.overallScore,
        ip: req.ip,
      });

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Calculate SSE score controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        body: req.body,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to calculate SSE score',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get current SSE score (cached version)
   */
  async getCurrentScore(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Get the most recent score from database
      const request: CalculateSSEScoreRequest = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        includeProjections: false,
        includeBenchmarks: true,
      };

      const result = await sseScoringService.calculateSSEScore(request);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Current SSE score retrieved successfully',
          data: result.data.currentScore,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Get current SSE score controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get current SSE score',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get SSE score history/trends
   */
  async getScoreHistory(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { limit = 30, period = 'monthly' } = req.query;

      // TODO: Implement getScoreHistory method in service
      // For now, return mock data
      const scoreHistory = [
        {
          date: new Date('2024-01-01'),
          overallScore: 75.5,
          socialScore: 78.2,
          sustainabilityScore: 72.1,
          economicScore: 76.8,
        },
        {
          date: new Date('2024-02-01'),
          overallScore: 77.2,
          socialScore: 79.5,
          sustainabilityScore: 74.3,
          economicScore: 77.9,
        },
        // Add more mock data...
      ];

      res.status(200).json({
        success: true,
        message: 'SSE score history retrieved successfully',
        data: {
          history: scoreHistory,
          period,
          totalRecords: scoreHistory.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get SSE score history controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get SSE score history',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get SSE analytics
   */
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const analytics = await sseScoringService.getSSEAnalytics(
        req.user.id,
        req.user.organizationId
      );

      res.status(200).json({
        success: true,
        message: 'SSE analytics retrieved successfully',
        data: analytics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get SSE analytics controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get SSE analytics',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Submit daily question response
   */
  async submitDailyQuestion(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { questionId, responseValue, responseData } = req.body;

      if (!questionId || responseValue === undefined) {
        res.status(400).json({
          success: false,
          message: 'Question ID and response value are required',
          error: 'MISSING_REQUIRED_FIELDS',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await sseScoringService.processDailyQuestionResponse(
        req.user.id,
        questionId,
        responseValue,
        responseData
      );

      // Log daily question response
      await logUserActivity(req.user.id, 'daily_question_answered', 'behavior', {
        questionId,
        responseValue,
        impact: result.impact,
        ip: req.ip,
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Daily question response submitted successfully',
          data: {
            impact: result.impact,
            message: 'Your response has been recorded and will impact your SSE score',
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to submit daily question response',
          error: 'SUBMISSION_FAILED',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Submit daily question controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        body: req.body,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to submit daily question response',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get today's daily questions
   */
  async getDailyQuestions(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // TODO: Implement getDailyQuestions method in service
      // For now, return mock data
      const dailyQuestions = [
        {
          id: 'q1',
          questionText: 'How many hours did you volunteer or help others today?',
          questionType: 'numeric',
          category: 'social',
          options: { min: 0, max: 24, unit: 'hours' },
        },
        {
          id: 'q2',
          questionText: 'Did you use public transportation, bike, or walk instead of driving today?',
          questionType: 'boolean',
          category: 'sustainability',
          options: { yes: 'Yes', no: 'No' },
        },
        {
          id: 'q3',
          questionText: 'How much money did you save or invest today?',
          questionType: 'numeric',
          category: 'economic',
          options: { min: 0, max: 10000, unit: 'dollars' },
        },
      ];

      res.status(200).json({
        success: true,
        message: 'Daily questions retrieved successfully',
        data: {
          questions: dailyQuestions,
          date: new Date().toISOString().split('T')[0],
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get daily questions controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get daily questions',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Record user behavior
   */
  async recordBehavior(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const {
        behaviorType,
        behaviorCategory,
        behaviorData,
        socialImpact = 0,
        sustainabilityImpact = 0,
        economicImpact = 0,
      } = req.body;

      if (!behaviorType || !behaviorCategory) {
        res.status(400).json({
          success: false,
          message: 'Behavior type and category are required',
          error: 'MISSING_REQUIRED_FIELDS',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      await sseScoringService.recordBehavior(
        req.user.id,
        behaviorType,
        behaviorCategory,
        behaviorData,
        socialImpact,
        sustainabilityImpact,
        economicImpact
      );

      // Log behavior recording
      await logUserActivity(req.user.id, 'behavior_recorded', 'behavior', {
        behaviorType,
        behaviorCategory,
        impact: { socialImpact, sustainabilityImpact, economicImpact },
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Behavior recorded successfully',
        data: {
          behaviorType,
          behaviorCategory,
          impact: {
            social: socialImpact,
            sustainability: sustainabilityImpact,
            economic: economicImpact,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Record behavior controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        body: req.body,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to record behavior',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get SSE benchmarks
   */
  async getBenchmarks(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { industry, organizationSize, region } = req.query;

      // TODO: Implement getBenchmarks method in service
      // For now, return mock data
      const benchmarks = {
        industry: industry || 'technology',
        organizationSize: organizationSize || 'startup',
        region: region || 'north_america',
        social: {
          p25: 65.0,
          p50: 75.0,
          p75: 85.0,
          p90: 92.0,
        },
        sustainability: {
          p25: 60.0,
          p50: 70.0,
          p75: 80.0,
          p90: 90.0,
        },
        economic: {
          p25: 70.0,
          p50: 80.0,
          p75: 88.0,
          p90: 95.0,
        },
        sampleSize: 1000,
        lastUpdated: new Date().toISOString(),
      };

      res.status(200).json({
        success: true,
        message: 'SSE benchmarks retrieved successfully',
        data: benchmarks,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get SSE benchmarks controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get SSE benchmarks',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get SSE recommendations
   */
  async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTHENTICATION_REQUIRED',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Calculate current score to get recommendations
      const request: CalculateSSEScoreRequest = {
        userId: req.user.id,
        organizationId: req.user.organizationId,
        includeProjections: false,
        includeBenchmarks: false,
      };

      const result = await sseScoringService.calculateSSEScore(request);

      if (result.success && result.data.recommendations) {
        res.status(200).json({
          success: true,
          message: 'SSE recommendations retrieved successfully',
          data: {
            recommendations: result.data.recommendations,
            currentScore: {
              overall: result.data.currentScore.overallScore,
              social: result.data.currentScore.socialScore,
              sustainability: result.data.currentScore.sustainabilityScore,
              economic: result.data.currentScore.economicScore,
            },
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to get recommendations',
          error: 'CALCULATION_FAILED',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Get SSE recommendations controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get SSE recommendations',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get SSE leaderboard
   */
  async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const {
        category = 'overall',
        scope = 'global',
        timeframe = 'monthly',
        limit = 50,
      } = req.query;

      // TODO: Implement getLeaderboard method in service
      // For now, return mock data
      const leaderboard = {
        category,
        scope,
        timeframe,
        entries: [
          {
            rank: 1,
            userId: 'user1',
            userName: 'John Doe',
            organizationName: 'EcoTech Solutions',
            score: 92.5,
            change: 2.3,
            avatar: null,
          },
          {
            rank: 2,
            userId: 'user2',
            userName: 'Jane Smith',
            organizationName: 'Green Innovations',
            score: 91.2,
            change: 1.8,
            avatar: null,
          },
          // Add more mock entries...
        ],
        userPosition: req.user ? {
          rank: 15,
          score: 78.5,
          change: 3.2,
        } : null,
        lastUpdated: new Date().toISOString(),
      };

      res.status(200).json({
        success: true,
        message: 'SSE leaderboard retrieved successfully',
        data: leaderboard,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Get SSE leaderboard controller error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get SSE leaderboard',
        error: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Export singleton instance
export const sseController = new SSEController();
export default sseController;
