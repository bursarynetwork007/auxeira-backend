/**
 * WebSocket SSE Handler
 * Handles real-time SSE score updates, analysis, and recommendations
 */

import { Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';
import { WebSocketUser, WebSocketServer } from './index';
import { pool } from '../config/database';

export interface SSEUpdateEvent {
  eventType: 'score_update' | 'component_change' | 'recommendation' | 'milestone_achieved' | 'risk_alert';
  userId: string;
  sseData: {
    currentScore: number;
    previousScore: number;
    scoreChange: number;
    percentageChange: number;
    components: {
      strategy: number;
      execution: number;
      market: number;
      team: number;
      financial: number;
      product: number;
      traction: number;
      risk: number;
    };
    trends: {
      daily: number[];
      weekly: number[];
      monthly: number[];
    };
    benchmarks: {
      industry: number;
      stage: number;
      region: number;
      percentile: number;
    };
    predictions: {
      nextWeek: number;
      nextMonth: number;
      confidence: number;
    };
  };
  analysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    keyInsights: string[];
    actionItems: string[];
  };
  recommendations: {
    immediate: Array<{
      category: string;
      action: string;
      impact: 'low' | 'medium' | 'high';
      effort: 'low' | 'medium' | 'high';
      timeline: string;
    }>;
    shortTerm: Array<{
      category: string;
      action: string;
      impact: 'low' | 'medium' | 'high';
      effort: 'low' | 'medium' | 'high';
      timeline: string;
    }>;
    longTerm: Array<{
      category: string;
      action: string;
      impact: 'low' | 'medium' | 'high';
      effort: 'low' | 'medium' | 'high';
      timeline: string;
    }>;
  };
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SSESubscription {
  userId: string;
  subscriptionType: 'real_time' | 'daily_summary' | 'weekly_report' | 'milestone_alerts';
  preferences: {
    scoreThreshold?: number;
    componentFocus?: string[];
    alertFrequency?: 'immediate' | 'batched' | 'scheduled';
    notificationChannels?: string[];
  };
  isActive: boolean;
  createdAt: Date;
  lastUpdate: Date;
}

export interface SSEAnalyticsEvent {
  eventType: string;
  userId: string;
  scoreData: any;
  timestamp: Date;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export class SSEHandler {
  private sseSubscriptions: Map<string, SSESubscription> = new Map();
  private realtimeUpdates: Map<string, NodeJS.Timeout> = new Map();
  private analyticsBuffer: SSEAnalyticsEvent[] = [];

  /**
   * Set up SSE event handlers for a socket
   */
  setupHandlers(socket: Socket, user: WebSocketUser, wsServer: WebSocketServer): void {
    // Subscribe to SSE updates
    socket.on('sse_subscribe', async (data: {
      subscriptionType: 'real_time' | 'daily_summary' | 'weekly_report' | 'milestone_alerts';
      preferences?: any;
    }) => {
      await this.handleSSESubscription(socket, user, data.subscriptionType, data.preferences);
    });

    // Unsubscribe from SSE updates
    socket.on('sse_unsubscribe', async (data: { subscriptionType: string }) => {
      await this.handleSSEUnsubscription(socket, user, data.subscriptionType);
    });

    // Request current SSE data
    socket.on('sse_get_current', async () => {
      await this.handleGetCurrentSSE(socket, user);
    });

    // Request SSE history
    socket.on('sse_get_history', async (data: {
      timeframe: 'week' | 'month' | 'quarter' | 'year';
      granularity: 'daily' | 'weekly' | 'monthly';
    }) => {
      await this.handleGetSSEHistory(socket, user, data.timeframe, data.granularity);
    });

    // Request SSE analysis
    socket.on('sse_request_analysis', async (data: { analysisType: string; parameters?: any }) => {
      await this.handleSSEAnalysisRequest(socket, user, data.analysisType, data.parameters);
    });

    // Update SSE component manually
    socket.on('sse_update_component', async (data: {
      component: string;
      value: number;
      evidence?: string;
      notes?: string;
    }) => {
      await this.handleSSEComponentUpdate(socket, user, data);
    });

    // Request SSE recommendations
    socket.on('sse_get_recommendations', async (data: { category?: string; priority?: string }) => {
      await this.handleGetSSERecommendations(socket, user, data.category, data.priority);
    });

    // Mark recommendation as implemented
    socket.on('sse_implement_recommendation', async (data: {
      recommendationId: string;
      implementationNotes?: string;
    }) => {
      await this.handleImplementRecommendation(socket, user, data.recommendationId, data.implementationNotes);
    });

    // Request SSE benchmarking
    socket.on('sse_get_benchmarks', async (data: {
      compareWith: 'industry' | 'stage' | 'region' | 'similar_startups';
      filters?: any;
    }) => {
      await this.handleGetSSEBenchmarks(socket, user, data.compareWith, data.filters);
    });
  }

  /**
   * Handle SSE subscription
   */
  private async handleSSESubscription(
    socket: Socket,
    user: WebSocketUser,
    subscriptionType: 'real_time' | 'daily_summary' | 'weekly_report' | 'milestone_alerts',
    preferences?: any
  ): Promise<void> {
    const timer = performanceTimer('websocket_sse_subscribe');

    try {
      const subscription: SSESubscription = {
        userId: user.userId,
        subscriptionType,
        preferences: preferences || {
          scoreThreshold: 5, // Notify on 5+ point changes
          componentFocus: ['strategy', 'execution', 'market'],
          alertFrequency: 'immediate',
          notificationChannels: ['websocket', 'email']
        },
        isActive: true,
        createdAt: new Date(),
        lastUpdate: new Date()
      };

      this.sseSubscriptions.set(`${user.userId}_${subscriptionType}`, subscription);

      // Store subscription in Redis for persistence
      await redisClient.setex(
        `sse_subscription_${user.userId}_${subscriptionType}`,
        24 * 60 * 60, // 24 hours
        JSON.stringify(subscription)
      );

      // Join SSE-specific room
      socket.join(`sse_${subscriptionType}`);

      // Set up real-time updates if subscribed
      if (subscriptionType === 'real_time') {
        await this.setupRealtimeUpdates(user.userId);
      }

      socket.emit('sse_subscription_success', {
        subscriptionType,
        preferences: subscription.preferences,
        timestamp: new Date()
      });

      timer.end();

      logger.info('SSE subscription created', {
        userId: user.userId,
        subscriptionType,
        socketId: socket.id
      });

    } catch (error) {
      timer.end();
      logger.error('SSE subscription failed', {
        userId: user.userId,
        subscriptionType,
        error: (error as Error).message
      });

      socket.emit('sse_subscription_error', {
        error: 'Failed to create SSE subscription',
        subscriptionType
      });
    }
  }

  /**
   * Handle SSE unsubscription
   */
  private async handleSSEUnsubscription(
    socket: Socket,
    user: WebSocketUser,
    subscriptionType: string
  ): Promise<void> {
    const timer = performanceTimer('websocket_sse_unsubscribe');

    try {
      const subscriptionKey = `${user.userId}_${subscriptionType}`;

      // Remove subscription
      this.sseSubscriptions.delete(subscriptionKey);

      // Remove from Redis
      await redisClient.del(`sse_subscription_${user.userId}_${subscriptionType}`);

      // Leave SSE room
      socket.leave(`sse_${subscriptionType}`);

      // Clear real-time updates if needed
      if (subscriptionType === 'real_time') {
        const updateTimer = this.realtimeUpdates.get(user.userId);
        if (updateTimer) {
          clearInterval(updateTimer);
          this.realtimeUpdates.delete(user.userId);
        }
      }

      socket.emit('sse_unsubscription_success', {
        subscriptionType,
        timestamp: new Date()
      });

      timer.end();

      logger.info('SSE unsubscription completed', {
        userId: user.userId,
        subscriptionType,
        socketId: socket.id
      });

    } catch (error) {
      timer.end();
      logger.error('SSE unsubscription failed', {
        userId: user.userId,
        subscriptionType,
        error: (error as Error).message
      });

      socket.emit('sse_unsubscription_error', {
        error: 'Failed to unsubscribe from SSE updates',
        subscriptionType
      });
    }
  }

  /**
   * Handle get current SSE data
   */
  private async handleGetCurrentSSE(socket: Socket, user: WebSocketUser): Promise<void> {
    const timer = performanceTimer('websocket_sse_get_current');

    try {
      // Get current SSE data from cache or database
      const currentSSEData = await this.getCurrentSSEData(user.userId);

      if (!currentSSEData) {
        socket.emit('sse_current_data_error', {
          error: 'No SSE data found',
          code: 'NO_SSE_DATA'
        });
        return;
      }

      // Get recent analysis and recommendations
      const analysis = await this.getLatestSSEAnalysis(user.userId);
      const recommendations = await this.getActiveRecommendations(user.userId);

      socket.emit('sse_current_data', {
        sseData: currentSSEData,
        analysis,
        recommendations,
        timestamp: new Date()
      });

      timer.end();

      logger.info('Current SSE data sent', {
        userId: user.userId,
        currentScore: currentSSEData.currentScore,
        socketId: socket.id
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get current SSE data', {
        userId: user.userId,
        socketId: socket.id,
        error: (error as Error).message
      });

      socket.emit('sse_current_data_error', {
        error: 'Failed to retrieve SSE data',
        code: 'SSE_DATA_ERROR'
      });
    }
  }

  /**
   * Handle get SSE history
   */
  private async handleGetSSEHistory(
    socket: Socket,
    user: WebSocketUser,
    timeframe: 'week' | 'month' | 'quarter' | 'year',
    granularity: 'daily' | 'weekly' | 'monthly'
  ): Promise<void> {
    const timer = performanceTimer('websocket_sse_get_history');

    try {
      const historyData = await this.getSSEHistory(user.userId, timeframe, granularity);

      if (!historyData || historyData.length === 0) {
        socket.emit('sse_history_data_error', {
          error: 'No historical SSE data found',
          code: 'NO_HISTORY_DATA'
        });
        return;
      }

      // Calculate trends and insights
      const trends = this.calculateSSETrends(historyData);
      const insights = this.generateHistoryInsights(historyData, trends);

      socket.emit('sse_history_data', {
        timeframe,
        granularity,
        data: historyData,
        trends,
        insights,
        summary: {
          totalDataPoints: historyData.length,
          averageScore: trends.averageScore,
          bestScore: trends.maxScore,
          worstScore: trends.minScore,
          overallTrend: trends.overallTrend,
          volatility: trends.volatility
        },
        timestamp: new Date()
      });

      timer.end();

      logger.info('SSE history data sent', {
        userId: user.userId,
        timeframe,
        granularity,
        dataPoints: historyData.length,
        socketId: socket.id
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get SSE history', {
        userId: user.userId,
        timeframe,
        granularity,
        error: (error as Error).message
      });

      socket.emit('sse_history_data_error', {
        error: 'Failed to retrieve SSE history',
        code: 'HISTORY_ERROR'
      });
    }
  }

  /**
   * Handle SSE analysis request
   */
  private async handleSSEAnalysisRequest(
    socket: Socket,
    user: WebSocketUser,
    analysisType: string,
    parameters?: any
  ): Promise<void> {
    const timer = performanceTimer('websocket_sse_analysis_request');

    try {
      let analysisResult: any;

      switch (analysisType) {
        case 'component_breakdown':
          analysisResult = await this.performComponentBreakdownAnalysisPlaceholder(user.userId, parameters);
          break;
        case 'trend_analysis':
          analysisResult = await this.performTrendAnalysisPlaceholder(user.userId, parameters);
          break;
        case 'peer_comparison':
          analysisResult = await this.performPeerComparisonPlaceholder(user.userId, parameters);
          break;
        case 'improvement_simulation':
          analysisResult = await this.performImprovementSimulationPlaceholder(user.userId, parameters);
          break;
        case 'risk_assessment':
          analysisResult = await this.performRiskAssessmentPlaceholder(user.userId, parameters);
          break;
        default:
          socket.emit('sse_analysis_error', {
            error: 'Unknown analysis type',
            code: 'UNKNOWN_ANALYSIS_TYPE'
          });
          return;
      }

      socket.emit('sse_analysis_result', {
        analysisType,
        parameters,
        result: analysisResult,
        timestamp: new Date()
      });

      timer.end();

      logger.info('SSE analysis completed', {
        userId: user.userId,
        analysisType,
        socketId: socket.id
      });

    } catch (error) {
      timer.end();
      logger.error('SSE analysis failed', {
        userId: user.userId,
        analysisType,
        error: (error as Error).message
      });

      socket.emit('sse_analysis_error', {
        error: 'Analysis failed',
        code: 'ANALYSIS_FAILED',
        analysisType
      });
    }
  }

  /**
   * Handle SSE component update
   */
  private async handleSSEComponentUpdate(
    socket: Socket,
    user: WebSocketUser,
    data: {
      component: string;
      value: number;
      evidence?: string;
      notes?: string;
    }
  ): Promise<void> {
    const timer = performanceTimer('websocket_sse_component_update');

    try {
      // Validate component and value
      const validComponents = ['strategy', 'execution', 'market', 'team', 'financial', 'product', 'traction', 'risk'];
      if (!validComponents.includes(data.component)) {
        socket.emit('sse_component_update_error', {
          error: 'Invalid component',
          code: 'INVALID_COMPONENT'
        });
        return;
      }

      if (data.value < 0 || data.value > 100) {
        socket.emit('sse_component_update_error', {
          error: 'Component value must be between 0 and 100',
          code: 'INVALID_VALUE'
        });
        return;
      }

      // Get current SSE data
      const currentSSE = await this.getCurrentSSEData(user.userId);
      if (!currentSSE) {
        socket.emit('sse_component_update_error', {
          error: 'No existing SSE data found',
          code: 'NO_SSE_DATA'
        });
        return;
      }

      // Update component
      const previousValue = currentSSE.components[data.component as keyof typeof currentSSE.components];
      const updatedComponents = {
        ...currentSSE.components,
        [data.component]: data.value
      };

      // Recalculate overall score
      const newOverallScore = this.calculateOverallScore(updatedComponents);
      const scoreChange = newOverallScore - currentSSE.currentScore;

      // Create update event
      const updateEvent: SSEUpdateEvent = {
        eventType: 'component_change',
        userId: user.userId,
        sseData: {
          currentScore: newOverallScore,
          previousScore: currentSSE.currentScore,
          scoreChange,
          percentageChange: (scoreChange / currentSSE.currentScore) * 100,
          components: updatedComponents,
          trends: currentSSE.trends,
          benchmarks: currentSSE.benchmarks,
          predictions: await this.generatePredictions(user.userId, updatedComponents)
        },
        analysis: await this.generateAnalysis(user.userId, updatedComponents),
        recommendations: await this.generateRecommendations(user.userId, updatedComponents),
        timestamp: new Date(),
        metadata: {
          updatedComponent: data.component,
          previousValue,
          newValue: data.value,
          evidence: data.evidence,
          notes: data.notes,
          manualUpdate: true
        }
      };

      // Save updated SSE data
      await this.saveSSEUpdate(user.userId, updateEvent);

      // Send update to user
      socket.emit('sse_component_updated', {
        component: data.component,
        previousValue,
        newValue: data.value,
        scoreChange,
        newOverallScore,
        timestamp: new Date()
      });

      // Broadcast SSE update if significant change
      if (Math.abs(scoreChange) >= 5) {
        await this.broadcastSSEUpdate(user.userId, updateEvent);
      }

      timer.end();

      logger.info('SSE component updated', {
        userId: user.userId,
        component: data.component,
        previousValue,
        newValue: data.value,
        scoreChange,
        socketId: socket.id
      });

    } catch (error) {
      timer.end();
      logger.error('SSE component update failed', {
        userId: user.userId,
        component: data.component,
        error: (error as Error).message
      });

      socket.emit('sse_component_update_error', {
        error: 'Component update failed',
        code: 'UPDATE_FAILED'
      });
    }
  }

  /**
   * Handle get SSE recommendations
   */
  private async handleGetSSERecommendations(
    socket: Socket,
    user: WebSocketUser,
    category?: string,
    priority?: string
  ): Promise<void> {
    const timer = performanceTimer('websocket_sse_get_recommendations');

    try {
      const currentSSE = await this.getCurrentSSEData(user.userId);
      if (!currentSSE) {
        socket.emit('sse_recommendations_error', {
          error: 'No SSE data found',
          code: 'NO_SSE_DATA'
        });
        return;
      }

      const recommendations = await this.generateRecommendations(user.userId, currentSSE.components);

      // Filter recommendations if category or priority specified
      let filteredRecommendations = recommendations;
      if (category) {
        filteredRecommendations = {
          immediate: recommendations.immediate.filter((r: any) => r.category === category),
          shortTerm: recommendations.shortTerm.filter((r: any) => r.category === category),
          longTerm: recommendations.longTerm.filter((r: any) => r.category === category)
        };
      }

      if (priority) {
        filteredRecommendations = {
          immediate: filteredRecommendations.immediate.filter((r: any) => r.impact === priority),
          shortTerm: filteredRecommendations.shortTerm.filter((r: any) => r.impact === priority),
          longTerm: filteredRecommendations.longTerm.filter((r: any) => r.impact === priority)
        };
      }

      socket.emit('sse_recommendations', {
        category,
        priority,
        recommendations: filteredRecommendations,
        totalCount: {
          immediate: filteredRecommendations.immediate.length,
          shortTerm: filteredRecommendations.shortTerm.length,
          longTerm: filteredRecommendations.longTerm.length
        },
        timestamp: new Date()
      });

      timer.end();

      logger.info('SSE recommendations sent', {
        userId: user.userId,
        category,
        priority,
        totalRecommendations:
          filteredRecommendations.immediate.length +
          filteredRecommendations.shortTerm.length +
          filteredRecommendations.longTerm.length,
        socketId: socket.id
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get SSE recommendations', {
        userId: user.userId,
        category,
        priority,
        error: (error as Error).message
      });

      socket.emit('sse_recommendations_error', {
        error: 'Failed to retrieve recommendations',
        code: 'RECOMMENDATIONS_ERROR'
      });
    }
  }

  /**
   * Handle implement recommendation
   */
  private async handleImplementRecommendation(
    socket: Socket,
    user: WebSocketUser,
    recommendationId: string,
    implementationNotes?: string
  ): Promise<void> {
    const timer = performanceTimer('websocket_sse_implement_recommendation');

    try {
      // Mark recommendation as implemented
      await redisClient.setex(
        `recommendation_implemented_${recommendationId}`,
        30 * 24 * 60 * 60, // 30 days
        JSON.stringify({
          userId: user.userId,
          implementedAt: new Date(),
          notes: implementationNotes,
          socketId: socket.id
        })
      );

      // Award points for implementation
      const pointsAwarded = 50; // Base points for implementing recommendation
      const auxTokensAwarded = 5;

      // Update gamification (would integrate with gamification service)
      // await gamificationService.awardPoints(user.userId, pointsAwarded, 'recommendation_implementation');

      socket.emit('sse_recommendation_implemented', {
        recommendationId,
        pointsAwarded,
        auxTokensAwarded,
        implementationNotes,
        timestamp: new Date()
      });

      // Trigger SSE recalculation if significant recommendation
      await this.triggerSSERecalculation(user.userId, {
        trigger: 'recommendation_implementation',
        recommendationId,
        implementationNotes
      });

      timer.end();

      logger.info('Recommendation implemented', {
        userId: user.userId,
        recommendationId,
        pointsAwarded,
        socketId: socket.id
      });

    } catch (error) {
      timer.end();
      logger.error('Recommendation implementation failed', {
        userId: user.userId,
        recommendationId,
        error: (error as Error).message
      });

      socket.emit('sse_recommendation_implementation_error', {
        error: 'Failed to mark recommendation as implemented',
        code: 'IMPLEMENTATION_FAILED'
      });
    }
  }

  /**
   * Handle get SSE benchmarks
   */
  private async handleGetSSEBenchmarks(
    socket: Socket,
    user: WebSocketUser,
    compareWith: 'industry' | 'stage' | 'region' | 'similar_startups',
    filters?: any
  ): Promise<void> {
    const timer = performanceTimer('websocket_sse_get_benchmarks');

    try {
      const currentSSE = await this.getCurrentSSEData(user.userId);
      if (!currentSSE) {
        socket.emit('sse_benchmarks_error', {
          error: 'No SSE data found',
          code: 'NO_SSE_DATA'
        });
        return;
      }

      const benchmarks = await this.generateBenchmarks(user.userId, compareWith, filters);

      socket.emit('sse_benchmarks', {
        compareWith,
        filters,
        userScore: currentSSE.currentScore,
        userComponents: currentSSE.components,
        benchmarks,
        insights: {
          strengths: this.identifyStrengths(currentSSE.components, benchmarks),
          improvements: this.identifyImprovements(currentSSE.components, benchmarks),
          ranking: this.calculateRanking(currentSSE.currentScore, benchmarks),
          percentile: this.calculatePercentile(currentSSE.currentScore, benchmarks)
        },
        timestamp: new Date()
      });

      timer.end();

      logger.info('SSE benchmarks sent', {
        userId: user.userId,
        compareWith,
        userScore: currentSSE.currentScore,
        socketId: socket.id
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get SSE benchmarks', {
        userId: user.userId,
        compareWith,
        error: (error as Error).message
      });

      socket.emit('sse_benchmarks_error', {
        error: 'Failed to retrieve benchmarks',
        code: 'BENCHMARKS_ERROR'
      });
    }
  }

  // Public methods for external services

  /**
   * Broadcast SSE update to all subscribers
   */
  async broadcastSSEUpdate(userId: string, updateEvent: SSEUpdateEvent): Promise<void> {
    const timer = performanceTimer('websocket_sse_broadcast_update');

    try {
      // Send to user's private room
      const wsServer = this.getWebSocketServer();
      await wsServer.sendToUser(userId, 'sse_score_update', updateEvent);

      // Send to real-time subscribers
      await wsServer.sendToRoom('sse_real_time', 'sse_score_broadcast', {
        userId,
        scoreChange: updateEvent.sseData.scoreChange,
        newScore: updateEvent.sseData.currentScore,
        timestamp: updateEvent.timestamp
      });

      // Store analytics event
      const analyticsEvent: SSEAnalyticsEvent = {
        eventType: updateEvent.eventType,
        userId,
        scoreData: updateEvent.sseData,
        timestamp: updateEvent.timestamp,
        metadata: updateEvent.metadata
      };

      this.analyticsBuffer.push(analyticsEvent);

      // Flush analytics buffer if it gets too large
      if (this.analyticsBuffer.length >= 100) {
        await this.flushAnalyticsBuffer();
      }

      timer.end();

      logger.info('SSE update broadcasted', {
        userId,
        eventType: updateEvent.eventType,
        scoreChange: updateEvent.sseData.scoreChange,
        newScore: updateEvent.sseData.currentScore
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to broadcast SSE update', {
        userId,
        eventType: updateEvent.eventType,
        error: (error as Error).message
      });
    }
  }

  /**
   * Send SSE milestone achievement
   */
  async sendMilestoneAchievement(userId: string, milestone: {
    milestoneType: string;
    title: string;
    description: string;
    scoreThreshold: number;
    currentScore: number;
    rewards: {
      points: number;
      auxTokens: number;
      badges?: string[];
    };
  }): Promise<void> {
    const timer = performanceTimer('websocket_sse_milestone_achievement');

    try {
      const wsServer = this.getWebSocketServer();

      await wsServer.sendToUser(userId, 'sse_milestone_achieved', {
        milestone,
        celebration: true,
        timestamp: new Date()
      });

      // Send to milestone alerts subscribers
      await wsServer.sendToRoom('sse_milestone_alerts', 'sse_milestone_broadcast', {
        userId,
        milestoneType: milestone.milestoneType,
        scoreThreshold: milestone.scoreThreshold,
        currentScore: milestone.currentScore,
        timestamp: new Date()
      });

      timer.end();

      logger.info('SSE milestone achievement sent', {
        userId,
        milestoneType: milestone.milestoneType,
        scoreThreshold: milestone.scoreThreshold,
        currentScore: milestone.currentScore
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to send milestone achievement', {
        userId,
        milestoneType: milestone.milestoneType,
        error: (error as Error).message
      });
    }
  }

  /**
   * Send SSE risk alert
   */
  async sendRiskAlert(userId: string, riskAlert: {
    riskType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    affectedComponents: string[];
    recommendations: string[];
    urgency: boolean;
  }): Promise<void> {
    const timer = performanceTimer('websocket_sse_risk_alert');

    try {
      const wsServer = this.getWebSocketServer();

      await wsServer.sendToUser(userId, 'sse_risk_alert', {
        riskAlert,
        urgent: riskAlert.urgency,
        timestamp: new Date()
      });

      // Send to admin dashboard if critical
      if (riskAlert.severity === 'critical') {
        await wsServer.sendToRoom('admin_dashboard', 'sse_critical_risk', {
          userId,
          riskAlert,
          timestamp: new Date()
        });
      }

      timer.end();

      logger.info('SSE risk alert sent', {
        userId,
        riskType: riskAlert.riskType,
        severity: riskAlert.severity,
        urgency: riskAlert.urgency
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to send risk alert', {
        userId,
        riskType: riskAlert.riskType,
        error: (error as Error).message
      });
    }
  }

  // Private helper methods

  private async setupRealtimeUpdates(userId: string): Promise<void> {
    // Clear existing timer if any
    const existingTimer = this.realtimeUpdates.get(userId);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // Set up new real-time update timer (every 30 seconds)
    const updateTimer = setInterval(async () => {
      try {
        const currentSSE = await this.getCurrentSSEData(userId);
        if (currentSSE) {
          const wsServer = this.getWebSocketServer();
          await wsServer.sendToUser(userId, 'sse_realtime_update', {
            currentScore: currentSSE.currentScore,
            components: currentSSE.components,
            lastUpdated: new Date(),
            isRealtime: true
          });
        }
      } catch (error) {
        logger.error('Real-time SSE update failed', {
          userId,
          error: (error as Error).message
        });
      }
    }, 30000); // 30 seconds

    this.realtimeUpdates.set(userId, updateTimer);
  }

  private async getCurrentSSEData(userId: string): Promise<any> {
    // Get from Redis cache first
    const cachedData = await redisClient.get(`sse_current_${userId}`);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // Fallback to database query (would implement)
    // return await sseService.getCurrentSSEData(userId);

    // Mock data for now
    return {
      currentScore: 75,
      components: {
        strategy: 80,
        execution: 70,
        market: 75,
        team: 85,
        financial: 65,
        product: 80,
        traction: 70,
        risk: 25
      },
      trends: {
        daily: [73, 74, 75],
        weekly: [70, 72, 75],
        monthly: [65, 70, 75]
      },
      benchmarks: {
        industry: 68,
        stage: 72,
        region: 70,
        percentile: 78
      }
    };
  }

  private async getLatestSSEAnalysis(userId: string): Promise<any> {
    const cachedAnalysis = await redisClient.get(`sse_analysis_${userId}`);
    if (cachedAnalysis) {
      return JSON.parse(cachedAnalysis);
    }

    // Generate new analysis
    return {
      strengths: ['Strong team composition', 'Clear market opportunity'],
      weaknesses: ['Limited financial runway', 'Early product development'],
      opportunities: ['Market expansion potential', 'Strategic partnerships'],
      threats: ['Competitive pressure', 'Market volatility'],
      keyInsights: ['Focus on customer acquisition', 'Improve financial metrics'],
      actionItems: ['Develop go-to-market strategy', 'Secure additional funding']
    };
  }

  private async getActiveRecommendations(userId: string): Promise<any> {
    // Get from cache or generate new recommendations
    return {
      immediate: [
        {
          category: 'strategy',
          action: 'Define clear value proposition',
          impact: 'high',
          effort: 'medium',
          timeline: '1-2 weeks'
        }
      ],
      shortTerm: [
        {
          category: 'execution',
          action: 'Implement customer feedback loop',
          impact: 'high',
          effort: 'medium',
          timeline: '1-2 months'
        }
      ],
      longTerm: [
        {
          category: 'market',
          action: 'Expand to adjacent markets',
          impact: 'high',
          effort: 'high',
          timeline: '6-12 months'
        }
      ]
    };
  }

  private async getSSEHistory(
    userId: string,
    timeframe: string,
    granularity: string
  ): Promise<any[]> {
    // Mock historical data - would implement database query
    const mockData = [];
    const now = new Date();
    const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;

    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      mockData.push({
        date,
        score: 70 + Math.random() * 20,
        components: {
          strategy: 70 + Math.random() * 20,
          execution: 70 + Math.random() * 20,
          market: 70 + Math.random() * 20,
          team: 70 + Math.random() * 20,
          financial: 70 + Math.random() * 20,
          product: 70 + Math.random() * 20,
          traction: 70 + Math.random() * 20,
          risk: 20 + Math.random() * 20
        }
      });
    }

    return mockData;
  }

  private calculateSSETrends(historyData: any[]): any {
    if (historyData.length === 0) return {};

    const scores = historyData.map(d => d.score);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    // Calculate trend direction
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const overallTrend = secondAvg > firstAvg ? 'improving' : secondAvg < firstAvg ? 'declining' : 'stable';

    // Calculate volatility
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - averageScore, 2), 0) / scores.length;
    const volatility = Math.sqrt(variance);

    return {
      averageScore,
      maxScore,
      minScore,
      overallTrend,
      volatility,
      trendStrength: Math.abs(secondAvg - firstAvg)
    };
  }

  private generateHistoryInsights(historyData: any[], trends: any): string[] {
    const insights = [];

    if (trends.overallTrend === 'improving') {
      insights.push(`Your SSE score has improved by ${trends.trendStrength.toFixed(1)} points over the period`);
    } else if (trends.overallTrend === 'declining') {
      insights.push(`Your SSE score has declined by ${trends.trendStrength.toFixed(1)} points - focus on key improvements`);
    }

    if (trends.volatility > 10) {
      insights.push('Your score shows high volatility - consider focusing on consistency');
    } else if (trends.volatility < 3) {
      insights.push('Your score is very stable - good consistency in performance');
    }

    if (trends.maxScore - trends.minScore > 20) {
      insights.push('You have significant score variation - identify what drives your best performance');
    }

    return insights;
  }

  private calculateOverallScore(components: any): number {
    const weights = {
      strategy: 0.15,
      execution: 0.20,
      market: 0.15,
      team: 0.15,
      financial: 0.15,
      product: 0.10,
      traction: 0.10,
      risk: -0.05 // Risk reduces overall score
    };

    let weightedSum = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([component, weight]) => {
      if (components[component] !== undefined) {
        weightedSum += components[component] * weight;
        totalWeight += Math.abs(weight);
      }
    });

    return Math.round(weightedSum / totalWeight * 100) / 100;
  }

  private async generatePredictions(userId: string, components: any): Promise<any> {
    // Mock prediction logic - would use ML models
    const currentScore = this.calculateOverallScore(components);

    return {
      nextWeek: currentScore + (Math.random() - 0.5) * 5,
      nextMonth: currentScore + (Math.random() - 0.5) * 10,
      confidence: 0.75 + Math.random() * 0.2
    };
  }

  private async generateAnalysis(userId: string, components: any): Promise<any> {
    // Mock analysis - would use AI/ML for real analysis
    return {
      strengths: ['Strong execution capabilities', 'Good team composition'],
      weaknesses: ['Limited market traction', 'Financial constraints'],
      opportunities: ['Market expansion', 'Strategic partnerships'],
      threats: ['Competitive pressure', 'Economic uncertainty'],
      keyInsights: ['Focus on customer acquisition', 'Improve financial metrics'],
      actionItems: ['Develop marketing strategy', 'Secure funding']
    };
  }

  private async generateRecommendations(userId: string, components: any): Promise<any> {
    // Mock recommendations - would use AI for personalized recommendations
    return {
      immediate: [
        {
          category: 'strategy',
          action: 'Define clear value proposition',
          impact: 'high',
          effort: 'medium',
          timeline: '1-2 weeks'
        }
      ],
      shortTerm: [
        {
          category: 'execution',
          action: 'Implement customer feedback system',
          impact: 'high',
          effort: 'medium',
          timeline: '1-2 months'
        }
      ],
      longTerm: [
        {
          category: 'market',
          action: 'Expand to new geographic markets',
          impact: 'high',
          effort: 'high',
          timeline: '6-12 months'
        }
      ]
    };
  }

  private async generateBenchmarks(userId: string, compareWith: string, filters?: any): Promise<any> {
    // Mock benchmarks - would query database for real benchmarks
    return {
      averageScore: 68,
      medianScore: 70,
      topQuartile: 82,
      bottomQuartile: 55,
      sampleSize: 1250,
      componentAverages: {
        strategy: 70,
        execution: 65,
        market: 68,
        team: 72,
        financial: 60,
        product: 68,
        traction: 62,
        risk: 30
      }
    };
  }

  private identifyStrengths(userComponents: any, benchmarks: any): string[] {
    const strengths = [];
    Object.entries(userComponents).forEach(([component, value]) => {
      const benchmarkValue = benchmarks.componentAverages[component];
      if (value > benchmarkValue + 10) {
        strengths.push(`${component}: ${value} (${(value - benchmarkValue).toFixed(1)} above average)`);
      }
    });
    return strengths;
  }

  private identifyImprovements(userComponents: any, benchmarks: any): string[] {
    const improvements = [];
    Object.entries(userComponents).forEach(([component, value]) => {
      const benchmarkValue = benchmarks.componentAverages[component];
      if (value < benchmarkValue - 5) {
        improvements.push(`${component}: ${value} (${(benchmarkValue - value).toFixed(1)} below average)`);
      }
    });
    return improvements;
  }

  private calculateRanking(userScore: number, benchmarks: any): number {
    // Mock ranking calculation
    if (userScore >= benchmarks.topQuartile) return 1;
    if (userScore >= benchmarks.medianScore) return 2;
    if (userScore >= benchmarks.bottomQuartile) return 3;
    return 4;
  }

  private calculatePercentile(userScore: number, benchmarks: any): number {
    // Mock percentile calculation
    const range = benchmarks.topQuartile - benchmarks.bottomQuartile;
    const position = (userScore - benchmarks.bottomQuartile) / range;
    return Math.max(0, Math.min(100, position * 100));
  }

  private async saveSSEUpdate(userId: string, updateEvent: SSEUpdateEvent): Promise<void> {
    try {
      // Save to Redis cache
      await redisClient.setex(
        `sse_current_${userId}`,
        60 * 60, // 1 hour
        JSON.stringify(updateEvent.sseData)
      );

      // Save to analytics buffer
      const analyticsEvent: SSEAnalyticsEvent = {
        eventType: updateEvent.eventType,
        userId,
        scoreData: updateEvent.sseData,
        timestamp: updateEvent.timestamp,
        metadata: updateEvent.metadata
      };

      this.analyticsBuffer.push(analyticsEvent);

    } catch (error) {
      logger.error('Failed to save SSE update', {
        userId,
        error: (error as Error).message
      });
    }
  }

  private async triggerSSERecalculation(userId: string, trigger: any): Promise<void> {
    try {
      // Trigger SSE recalculation (would integrate with SSE service)
      // await sseService.recalculateSSE(userId, trigger);

      logger.info('SSE recalculation triggered', {
        userId,
        trigger
      });

    } catch (error) {
      logger.error('Failed to trigger SSE recalculation', {
        userId,
        trigger,
        error: (error as Error).message
      });
    }
  }

  private async flushAnalyticsBuffer(): Promise<void> {
    if (this.analyticsBuffer.length === 0) return;

    try {
      // Batch insert analytics events to database
      const events = [...this.analyticsBuffer];
      this.analyticsBuffer = [];

      // Store in Redis for analytics processing
      await redisClient.lpush('sse_analytics_queue', ...events.map(e => JSON.stringify(e)));

      logger.info('Analytics buffer flushed', {
        eventCount: events.length
      });

    } catch (error) {
      logger.error('Failed to flush analytics buffer', {
        bufferSize: this.analyticsBuffer.length,
        error: (error as Error).message
      });
    }
  }

  private getWebSocketServer(): WebSocketServer {
    // This would be injected or accessed through a singleton
    // For now, return a mock interface
    return {
      sendToUser: async (userId: string, eventType: string, data: any) => {
        // Implementation would be provided by the main WebSocket server
      },
      sendToRoom: async (roomId: string, eventType: string, data: any) => {
        // Implementation would be provided by the main WebSocket server
      }
    } as any;
  }

  // Placeholder analysis methods
  private async performComponentBreakdownAnalysisPlaceholder(userId: string, parameters: any): Promise<any> {
    return {
      type: 'component_breakdown',
      userId,
      components: {
        market: { score: 75, trend: 'improving' },
        product: { score: 82, trend: 'stable' },
        team: { score: 68, trend: 'declining' },
        traction: { score: 71, trend: 'improving' }
      },
      insights: ['Market validation shows strong potential', 'Team expansion needed'],
      timestamp: new Date()
    };
  }

  private async performTrendAnalysisPlaceholder(userId: string, parameters: any): Promise<any> {
    return {
      type: 'trend_analysis',
      userId,
      trends: {
        overall: 'improving',
        components: {
          market: 'stable',
          product: 'improving',
          team: 'declining',
          traction: 'improving'
        }
      },
      predictions: {
        nextMonth: 78,
        nextQuarter: 82
      },
      timestamp: new Date()
    };
  }

  private async performPeerComparisonPlaceholder(userId: string, parameters: any): Promise<any> {
    return {
      type: 'peer_comparison',
      userId,
      comparison: {
        percentile: 75,
        industry: 'fintech',
        stage: 'seed',
        similarCompanies: 12
      },
      strengths: ['Strong product-market fit', 'Experienced team'],
      weaknesses: ['Limited traction', 'Funding runway'],
      timestamp: new Date()
    };
  }

  private async performImprovementSimulationPlaceholder(userId: string, parameters: any): Promise<any> {
    return {
      type: 'improvement_simulation',
      userId,
      scenarios: [
        { action: 'Hire senior developer', impact: +5, timeframe: '3 months' },
        { action: 'Launch marketing campaign', impact: +8, timeframe: '2 months' },
        { action: 'Secure strategic partnership', impact: +12, timeframe: '6 months' }
      ],
      projectedScore: 85,
      timestamp: new Date()
    };
  }

  private async performRiskAssessmentPlaceholder(userId: string, parameters: any): Promise<any> {
    return {
      type: 'risk_assessment',
      userId,
      risks: [
        { category: 'market', level: 'medium', description: 'Market saturation risk' },
        { category: 'team', level: 'high', description: 'Key person dependency' },
        { category: 'financial', level: 'low', description: 'Funding runway adequate' }
      ],
      overallRisk: 'medium',
      recommendations: ['Diversify team leadership', 'Monitor market trends'],
      timestamp: new Date()
    };
  }
}

export const sseHandler = new SSEHandler();
