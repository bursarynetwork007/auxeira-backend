/**
 * Kafka Producer for Real-time ML Pipeline
 * Handles streaming of startup data, SSE scores, and behavioral events to ML processing pipeline
 */

// Mock Kafka types since kafkajs is not installed
interface Kafka {
  producer(): Producer;
}
interface Producer {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(record: ProducerRecord): Promise<any>;
}
interface ProducerRecord {
  topic: string;
  messages: Message[];
}
interface Message {
  key?: string;
  value: string;
  partition?: number;
  timestamp?: string;
}

import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';

export interface MLEvent {
  eventId: string;
  userId: string;
  eventType: MLEventType;
  timestamp: Date;
  data: any;
  metadata?: {
    source: string;
    version: string;
    sessionId?: string;
    correlationId?: string;
  };
}

export type MLEventType =
  | 'sse_score_update'
  | 'user_behavior'
  | 'milestone_achievement'
  | 'partnership_application'
  | 'payment_transaction'
  | 'ai_mentorship_session'
  | 'gamification_event'
  | 'document_generation'
  | 'external_validation'
  | 'investor_interaction'
  | 'performance_metric'
  | 'risk_assessment'
  | 'market_data'
  | 'social_signal';

export interface SSEScoreEvent {
  userId: string;
  previousScore: number;
  newScore: number;
  scoreComponents: {
    financial: number;
    operational: number;
    market: number;
    team: number;
    product: number;
    traction: number;
  };
  improvementFactors: string[];
  riskFactors: string[];
  timestamp: Date;
}

export interface BehaviorEvent {
  userId: string;
  action: string;
  category: string;
  properties: Record<string, any>;
  sessionId: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    location?: string;
  };
  timestamp: Date;
}

export interface PerformanceMetricEvent {
  userId: string;
  metricType: string;
  metricValue: number;
  previousValue?: number;
  changePercentage?: number;
  benchmark?: number;
  industry?: string;
  stage?: string;
  timestamp: Date;
}

export class KafkaMLProducer {
  private kafka: Kafka;
  private producer: Producer;
  private isConnected: boolean = false;

  // Kafka topics for different data streams
  private readonly TOPICS = {
    SSE_SCORES: 'sse-scores-stream',
    USER_BEHAVIOR: 'user-behavior-stream',
    PERFORMANCE_METRICS: 'performance-metrics-stream',
    MILESTONE_EVENTS: 'milestone-events-stream',
    PARTNERSHIP_EVENTS: 'partnership-events-stream',
    PAYMENT_EVENTS: 'payment-events-stream',
    AI_MENTORSHIP: 'ai-mentorship-stream',
    GAMIFICATION: 'gamification-stream',
    EXTERNAL_VALIDATION: 'external-validation-stream',
    INVESTOR_INTERACTIONS: 'investor-interactions-stream',
    RISK_ASSESSMENTS: 'risk-assessments-stream',
    MARKET_DATA: 'market-data-stream',
    SOCIAL_SIGNALS: 'social-signals-stream',
    FEATURE_STORE: 'feature-store-stream'
  };

  constructor() {
    this.kafka = new Kafka({
      clientId: 'auxeira-ml-producer',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      ssl: process.env.KAFKA_SSL === 'true',
      sasl: process.env.KAFKA_USERNAME ? {
        mechanism: 'plain',
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD || ''
      } : undefined,
      retry: {
        initialRetryTime: 100,
        retries: 8
      },
      connectionTimeout: 3000,
      requestTimeout: 30000
    });

    this.producer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
  }

  /**
   * Initialize Kafka producer connection
   */
  async connect(): Promise<void> {
    const timer = performanceTimer('kafka_producer_connect');

    try {
      await this.producer.connect();
      this.isConnected = true;

      timer.end();

      logger.info('Kafka ML Producer connected successfully', {
        topics: Object.values(this.TOPICS)
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to connect Kafka ML Producer', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Disconnect Kafka producer
   */
  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      this.isConnected = false;

      logger.info('Kafka ML Producer disconnected');

    } catch (error) {
      logger.error('Error disconnecting Kafka ML Producer', {
        error: (error as Error).message
      });
    }
  }

  /**
   * Send SSE score update event
   */
  async sendSSEScoreUpdate(event: SSEScoreEvent): Promise<void> {
    const timer = performanceTimer('kafka_send_sse_score');

    try {
      const mlEvent: MLEvent = {
        eventId: this.generateEventId(),
        userId: event.userId,
        eventType: 'sse_score_update',
        timestamp: event.timestamp,
        data: event,
        metadata: {
          source: 'sse-scoring-service',
          version: '1.0'
        }
      };

      await this.sendEvent(this.TOPICS.SSE_SCORES, mlEvent);

      // Also send to feature store for real-time feature updates
      await this.sendToFeatureStore({
        userId: event.userId,
        features: {
          sse_score: event.newScore,
          sse_score_change: event.newScore - event.previousScore,
          financial_score: event.scoreComponents.financial,
          operational_score: event.scoreComponents.operational,
          market_score: event.scoreComponents.market,
          team_score: event.scoreComponents.team,
          product_score: event.scoreComponents.product,
          traction_score: event.scoreComponents.traction,
          improvement_factor_count: event.improvementFactors.length,
          risk_factor_count: event.riskFactors.length
        },
        timestamp: event.timestamp
      });

      timer.end();

      logger.info('SSE score update sent to ML pipeline', {
        userId: event.userId,
        newScore: event.newScore,
        change: event.newScore - event.previousScore
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to send SSE score update', {
        error: (error as Error).message,
        userId: event.userId
      });
      throw error;
    }
  }

  /**
   * Send user behavior event
   */
  async sendBehaviorEvent(event: BehaviorEvent): Promise<void> {
    const timer = performanceTimer('kafka_send_behavior');

    try {
      const mlEvent: MLEvent = {
        eventId: this.generateEventId(),
        userId: event.userId,
        eventType: 'user_behavior',
        timestamp: event.timestamp,
        data: event,
        metadata: {
          source: 'behavior-tracking',
          version: '1.0',
          sessionId: event.sessionId
        }
      };

      await this.sendEvent(this.TOPICS.USER_BEHAVIOR, mlEvent);

      // Extract behavioral features for feature store
      await this.sendToFeatureStore({
        userId: event.userId,
        features: {
          last_action: event.action,
          action_category: event.category,
          session_duration: event.properties.sessionDuration || 0,
          page_views: event.properties.pageViews || 0,
          clicks: event.properties.clicks || 0,
          platform: event.deviceInfo.platform,
          engagement_score: this.calculateEngagementScore(event)
        },
        timestamp: event.timestamp
      });

      timer.end();

    } catch (error) {
      timer.end();
      logger.error('Failed to send behavior event', {
        error: (error as Error).message,
        userId: event.userId,
        action: event.action
      });
      throw error;
    }
  }

  /**
   * Send performance metric event
   */
  async sendPerformanceMetric(event: PerformanceMetricEvent): Promise<void> {
    const timer = performanceTimer('kafka_send_performance_metric');

    try {
      const mlEvent: MLEvent = {
        eventId: this.generateEventId(),
        userId: event.userId,
        eventType: 'performance_metric',
        timestamp: event.timestamp,
        data: event,
        metadata: {
          source: 'performance-tracking',
          version: '1.0'
        }
      };

      await this.sendEvent(this.TOPICS.PERFORMANCE_METRICS, mlEvent);

      // Send performance features to feature store
      await this.sendToFeatureStore({
        userId: event.userId,
        features: {
          [`${event.metricType}_current`]: event.metricValue,
          [`${event.metricType}_change`]: event.changePercentage || 0,
          [`${event.metricType}_vs_benchmark`]: event.benchmark ?
            (event.metricValue / event.benchmark) : 1,
          performance_trend: event.changePercentage ?
            (event.changePercentage > 0 ? 'improving' : 'declining') : 'stable'
        },
        timestamp: event.timestamp
      });

      timer.end();

    } catch (error) {
      timer.end();
      logger.error('Failed to send performance metric', {
        error: (error as Error).message,
        userId: event.userId,
        metricType: event.metricType
      });
      throw error;
    }
  }

  /**
   * Send milestone achievement event
   */
  async sendMilestoneEvent(userId: string, milestone: {
    id: string;
    title: string;
    category: string;
    impact: string;
    completedAt: Date;
    targetDate: Date;
    evidence?: string[];
  }): Promise<void> {
    const timer = performanceTimer('kafka_send_milestone');

    try {
      const mlEvent: MLEvent = {
        eventId: this.generateEventId(),
        userId,
        eventType: 'milestone_achievement',
        timestamp: milestone.completedAt,
        data: milestone,
        metadata: {
          source: 'milestone-tracking',
          version: '1.0'
        }
      };

      await this.sendEvent(this.TOPICS.MILESTONE_EVENTS, mlEvent);

      // Calculate milestone features
      const daysEarly = Math.floor(
        (milestone.targetDate.getTime() - milestone.completedAt.getTime()) /
        (1000 * 60 * 60 * 24)
      );

      await this.sendToFeatureStore({
        userId,
        features: {
          milestone_completed: 1,
          milestone_category: milestone.category,
          milestone_impact: milestone.impact,
          milestone_timing: daysEarly > 0 ? 'early' : 'late',
          days_early_late: daysEarly,
          evidence_provided: milestone.evidence ? milestone.evidence.length : 0
        },
        timestamp: milestone.completedAt
      });

      timer.end();

    } catch (error) {
      timer.end();
      logger.error('Failed to send milestone event', {
        error: (error as Error).message,
        userId,
        milestoneId: milestone.id
      });
      throw error;
    }
  }

  /**
   * Send AI mentorship session event
   */
  async sendAIMentorshipEvent(userId: string, session: {
    sessionId: string;
    mentorPersonality: string;
    sessionType: string;
    duration: number;
    messageCount: number;
    tokensUsed: number;
    satisfactionRating?: number;
    recommendations: any[];
    timestamp: Date;
  }): Promise<void> {
    const timer = performanceTimer('kafka_send_ai_mentorship');

    try {
      const mlEvent: MLEvent = {
        eventId: this.generateEventId(),
        userId,
        eventType: 'ai_mentorship_session',
        timestamp: session.timestamp,
        data: session,
        metadata: {
          source: 'ai-mentorship-service',
          version: '1.0',
          sessionId: session.sessionId
        }
      };

      await this.sendEvent(this.TOPICS.AI_MENTORSHIP, mlEvent);

      // Extract mentorship engagement features
      await this.sendToFeatureStore({
        userId,
        features: {
          mentorship_sessions_count: 1,
          avg_session_duration: session.duration,
          avg_messages_per_session: session.messageCount,
          mentorship_satisfaction: session.satisfactionRating || 0,
          recommendations_received: session.recommendations.length,
          preferred_mentor_type: session.mentorPersonality,
          mentorship_engagement_score: this.calculateMentorshipEngagement(session)
        },
        timestamp: session.timestamp
      });

      timer.end();

    } catch (error) {
      timer.end();
      logger.error('Failed to send AI mentorship event', {
        error: (error as Error).message,
        userId,
        sessionId: session.sessionId
      });
      throw error;
    }
  }

  /**
   * Send gamification event
   */
  async sendGamificationEvent(userId: string, event: {
    eventType: string;
    action: string;
    points: number;
    auxTokens: number;
    level?: number;
    achievement?: string;
    challenge?: string;
    timestamp: Date;
  }): Promise<void> {
    const timer = performanceTimer('kafka_send_gamification');

    try {
      const mlEvent: MLEvent = {
        eventId: this.generateEventId(),
        userId,
        eventType: 'gamification_event',
        timestamp: event.timestamp,
        data: event,
        metadata: {
          source: 'gamification-service',
          version: '1.0'
        }
      };

      await this.sendEvent(this.TOPICS.GAMIFICATION, mlEvent);

      // Extract gamification engagement features
      await this.sendToFeatureStore({
        userId,
        features: {
          total_points_earned: event.points,
          total_aux_tokens_earned: event.auxTokens,
          current_level: event.level || 0,
          achievements_unlocked: event.achievement ? 1 : 0,
          challenges_completed: event.challenge ? 1 : 0,
          gamification_engagement: this.calculateGamificationEngagement(event)
        },
        timestamp: event.timestamp
      });

      timer.end();

    } catch (error) {
      timer.end();
      logger.error('Failed to send gamification event', {
        error: (error as Error).message,
        userId,
        eventType: event.eventType
      });
      throw error;
    }
  }

  /**
   * Send investor interaction event
   */
  async sendInvestorInteraction(userId: string, interaction: {
    investorId: string;
    interactionType: string;
    opportunityId?: string;
    interestLevel?: string;
    investmentAmount?: number;
    stage: string;
    timestamp: Date;
  }): Promise<void> {
    const timer = performanceTimer('kafka_send_investor_interaction');

    try {
      const mlEvent: MLEvent = {
        eventId: this.generateEventId(),
        userId,
        eventType: 'investor_interaction',
        timestamp: interaction.timestamp,
        data: interaction,
        metadata: {
          source: 'investor-dashboard',
          version: '1.0'
        }
      };

      await this.sendEvent(this.TOPICS.INVESTOR_INTERACTIONS, mlEvent);

      // Extract investor appeal features
      await this.sendToFeatureStore({
        userId,
        features: {
          investor_interactions_count: 1,
          investor_interest_level: interaction.interestLevel || 'unknown',
          avg_investment_interest: interaction.investmentAmount || 0,
          investor_stage_match: interaction.stage,
          investor_appeal_score: this.calculateInvestorAppeal(interaction)
        },
        timestamp: interaction.timestamp
      });

      timer.end();

    } catch (error) {
      timer.end();
      logger.error('Failed to send investor interaction', {
        error: (error as Error).message,
        userId,
        investorId: interaction.investorId
      });
      throw error;
    }
  }

  /**
   * Send external validation event
   */
  async sendExternalValidation(userId: string, validation: {
    source: string;
    validationType: string;
    score: number;
    confidence: number;
    data: any;
    timestamp: Date;
  }): Promise<void> {
    const timer = performanceTimer('kafka_send_external_validation');

    try {
      const mlEvent: MLEvent = {
        eventId: this.generateEventId(),
        userId,
        eventType: 'external_validation',
        timestamp: validation.timestamp,
        data: validation,
        metadata: {
          source: 'external-validation-service',
          version: '1.0'
        }
      };

      await this.sendEvent(this.TOPICS.EXTERNAL_VALIDATION, mlEvent);

      // Extract validation features
      await this.sendToFeatureStore({
        userId,
        features: {
          [`${validation.source}_score`]: validation.score,
          [`${validation.source}_confidence`]: validation.confidence,
          external_validation_count: 1,
          avg_external_score: validation.score,
          validation_reliability: validation.confidence
        },
        timestamp: validation.timestamp
      });

      timer.end();

    } catch (error) {
      timer.end();
      logger.error('Failed to send external validation', {
        error: (error as Error).message,
        userId,
        source: validation.source
      });
      throw error;
    }
  }

  /**
   * Send market data event
   */
  async sendMarketData(data: {
    industry: string;
    region: string;
    stage: string;
    metrics: Record<string, number>;
    trends: Record<string, number>;
    timestamp: Date;
  }): Promise<void> {
    const timer = performanceTimer('kafka_send_market_data');

    try {
      const mlEvent: MLEvent = {
        eventId: this.generateEventId(),
        userId: 'system',
        eventType: 'market_data',
        timestamp: data.timestamp,
        data,
        metadata: {
          source: 'market-data-service',
          version: '1.0'
        }
      };

      await this.sendEvent(this.TOPICS.MARKET_DATA, mlEvent);

      timer.end();

    } catch (error) {
      timer.end();
      logger.error('Failed to send market data', {
        error: (error as Error).message,
        industry: data.industry,
        region: data.region
      });
      throw error;
    }
  }

  /**
   * Send batch events for bulk processing
   */
  async sendBatchEvents(events: MLEvent[]): Promise<void> {
    const timer = performanceTimer('kafka_send_batch');

    try {
      const messages: Message[] = events.map(event => ({
        key: event.userId,
        value: JSON.stringify(event),
        timestamp: event.timestamp.getTime().toString(),
        headers: {
          eventType: event.eventType,
          source: event.metadata?.source || 'unknown'
        }
      }));

      // Group events by topic based on event type
      const topicGroups = this.groupEventsByTopic(events);

      // Send to appropriate topics
      const sendPromises = Object.entries(topicGroups).map(([topic, topicEvents]) => {
        const topicMessages = topicEvents.map(event => ({
          key: event.userId,
          value: JSON.stringify(event),
          timestamp: event.timestamp.getTime().toString(),
          headers: {
            eventType: event.eventType,
            source: event.metadata?.source || 'unknown'
          }
        }));

        return this.producer.send({
          topic,
          messages: topicMessages
        });
      });

      await Promise.all(sendPromises);

      timer.end();

      logger.info('Batch events sent to ML pipeline', {
        eventCount: events.length,
        topics: Object.keys(topicGroups)
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to send batch events', {
        error: (error as Error).message,
        eventCount: events.length
      });
      throw error;
    }
  }

  // Private helper methods

  private async sendEvent(topic: string, event: MLEvent): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    const message: Message = {
      key: event.userId,
      value: JSON.stringify(event),
      timestamp: event.timestamp.getTime().toString(),
      headers: {
        eventType: event.eventType,
        eventId: event.eventId,
        source: event.metadata?.source || 'unknown'
      }
    };

    await this.producer.send({
      topic,
      messages: [message]
    });
  }

  private async sendToFeatureStore(featureUpdate: {
    userId: string;
    features: Record<string, any>;
    timestamp: Date;
  }): Promise<void> {
    const mlEvent: MLEvent = {
      eventId: this.generateEventId(),
      userId: featureUpdate.userId,
      eventType: 'performance_metric',
      timestamp: featureUpdate.timestamp,
      data: featureUpdate,
      metadata: {
        source: 'feature-store-update',
        version: '1.0'
      }
    };

    await this.sendEvent(this.TOPICS.FEATURE_STORE, mlEvent);
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateEngagementScore(event: BehaviorEvent): number {
    const weights = {
      sessionDuration: 0.3,
      pageViews: 0.2,
      clicks: 0.2,
      formSubmissions: 0.3
    };

    const sessionDuration = Math.min(event.properties.sessionDuration || 0, 3600); // Cap at 1 hour
    const pageViews = Math.min(event.properties.pageViews || 0, 50);
    const clicks = Math.min(event.properties.clicks || 0, 100);
    const formSubmissions = event.properties.formSubmissions || 0;

    return (
      (sessionDuration / 3600) * weights.sessionDuration +
      (pageViews / 50) * weights.pageViews +
      (clicks / 100) * weights.clicks +
      Math.min(formSubmissions / 5, 1) * weights.formSubmissions
    ) * 100;
  }

  private calculateMentorshipEngagement(session: any): number {
    const durationScore = Math.min(session.duration / 1800, 1); // 30 min max
    const messageScore = Math.min(session.messageCount / 20, 1); // 20 messages max
    const satisfactionScore = (session.satisfactionRating || 3) / 5;
    const recommendationScore = Math.min(session.recommendations.length / 5, 1);

    return (durationScore + messageScore + satisfactionScore + recommendationScore) * 25;
  }

  private calculateGamificationEngagement(event: any): number {
    const pointsScore = Math.min(event.points / 100, 1);
    const tokensScore = Math.min(event.auxTokens / 50, 1);
    const achievementBonus = event.achievement ? 0.5 : 0;
    const challengeBonus = event.challenge ? 0.5 : 0;

    return (pointsScore + tokensScore + achievementBonus + challengeBonus) * 50;
  }

  private calculateInvestorAppeal(interaction: any): number {
    const interestLevels = {
      'watching': 0.25,
      'interested': 0.5,
      'very_interested': 0.75,
      'ready_to_invest': 1.0
    };

    const interestScore = interestLevels[interaction.interestLevel as keyof typeof interestLevels] || 0;
    const amountScore = interaction.investmentAmount ?
      Math.min(interaction.investmentAmount / 1000000, 1) : 0; // $1M max

    return (interestScore * 0.7 + amountScore * 0.3) * 100;
  }

  private groupEventsByTopic(events: MLEvent[]): Record<string, MLEvent[]> {
    const groups: Record<string, MLEvent[]> = {};

    events.forEach(event => {
      let topic: string;

      switch (event.eventType) {
        case 'sse_score_update':
          topic = this.TOPICS.SSE_SCORES;
          break;
        case 'user_behavior':
          topic = this.TOPICS.USER_BEHAVIOR;
          break;
        case 'performance_metric':
          topic = this.TOPICS.PERFORMANCE_METRICS;
          break;
        case 'milestone_achievement':
          topic = this.TOPICS.MILESTONE_EVENTS;
          break;
        case 'partnership_application':
          topic = this.TOPICS.PARTNERSHIP_EVENTS;
          break;
        case 'payment_transaction':
          topic = this.TOPICS.PAYMENT_EVENTS;
          break;
        case 'ai_mentorship_session':
          topic = this.TOPICS.AI_MENTORSHIP;
          break;
        case 'gamification_event':
          topic = this.TOPICS.GAMIFICATION;
          break;
        case 'external_validation':
          topic = this.TOPICS.EXTERNAL_VALIDATION;
          break;
        case 'investor_interaction':
          topic = this.TOPICS.INVESTOR_INTERACTIONS;
          break;
        case 'risk_assessment':
          topic = this.TOPICS.RISK_ASSESSMENTS;
          break;
        case 'market_data':
          topic = this.TOPICS.MARKET_DATA;
          break;
        case 'social_signal':
          topic = this.TOPICS.SOCIAL_SIGNALS;
          break;
        default:
          topic = this.TOPICS.FEATURE_STORE;
      }

      if (!groups[topic]) {
        groups[topic] = [];
      }
      groups[topic].push(event);
    });

    return groups;
  }

  /**
   * Health check for Kafka connection
   */
  async healthCheck(): Promise<{
    connected: boolean;
    topics: string[];
    lastEventTime?: Date;
  }> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const metadata = await admin.fetchTopicMetadata({
        topics: Object.values(this.TOPICS)
      });

      await admin.disconnect();

      return {
        connected: this.isConnected,
        topics: Object.values(this.TOPICS),
        lastEventTime: new Date()
      };

    } catch (error) {
      logger.error('Kafka health check failed', {
        error: (error as Error).message
      });

      return {
        connected: false,
        topics: []
      };
    }
  }
}

export const kafkaMLProducer = new KafkaMLProducer();
export default kafkaMLProducer;