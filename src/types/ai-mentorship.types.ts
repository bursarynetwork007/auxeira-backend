/**
 * AI Mentorship Type Definitions
 * Comprehensive types for the AI mentorship system
 */

export interface AIMentorSession {
  id: string;
  userId: string;
  sessionType: SessionType;
  topic?: string;
  aiPersonality: AIPersonality;
  sessionGoals: string[];
  focusAreas: string[];
  status: SessionStatus;
  createdAt: Date;
  endedAt?: Date;
  lastActivityAt?: Date;
  lastMessage?: string;
  messageCount?: number;
  feedback?: string;
  rating?: number;
  startupContext?: any;
  welcomeMessage?: string;
}

export interface AIMentorMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: MessageMetadata;
  createdAt: Date;
}

export interface AIMentorResponse {
  sessionId: string;
  message: string;
  confidence: number;
  recommendations: string[];
  followUpQuestions: string[];
  actionItems: string[];
  timestamp: string;
  success?: boolean;
  data?: any;
}

export interface MentorshipRequest {
  userId: string;
  sessionType: SessionType;
  topic?: string;
  aiPersonality?: AIPersonality;
  sessionGoals?: string[];
  focusAreas?: string[];
  urgency?: 'low' | 'medium' | 'high';
  context?: string;
  sessionId?: string;
  message?: string;
  metadata?: any;
}

export interface ConversationContext {
  sessionId: string;
  recentMessages: AIMentorMessage[];
  startupContext?: StartupContext;
  behavioralAnalysis?: BehavioralAnalysis;
  industryInsights?: IndustryInsights;
}

export interface StartupContext {
  userName: string;
  userRole: string;
  organizationName?: string;
  industry?: string;
  stage?: string;
  region?: string;
  currentSSEScore?: {
    overall?: number;
    social?: number;
    sustainability?: number;
    economic?: number;
  };
  recentMetrics?: {
    revenue?: number;
    users?: number;
    funding?: number;
    employees?: number;
  };
  challenges?: string[];
  goals?: string[];
}

export interface BehavioralAnalysis {
  engagementLevel: 'low' | 'medium' | 'high';
  responsePatterns: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  decisionMakingStyle: 'analytical' | 'intuitive' | 'collaborative' | 'directive';
  stressLevel: 'low' | 'medium' | 'high';
  motivationFactors: string[];
  communicationPreference: 'direct' | 'supportive' | 'detailed' | 'concise';
}

export interface IndustryInsights {
  industry: string;
  marketTrends: string[];
  competitiveAnalysis: string[];
  bestPractices: string[];
  commonChallenges: string[];
  successFactors: string[];
  benchmarkMetrics: {
    [key: string]: number;
  };
}

export interface MessageMetadata {
  messageType?: 'welcome' | 'question' | 'update' | 'request' | 'response';
  personality?: AIPersonality;
  confidence?: number;
  recommendations?: string[];
  actionItems?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  topics?: string[];
  urgency?: 'low' | 'medium' | 'high';
}

export interface SessionAnalytics {
  sessionId: string;
  duration: number; // in minutes
  messageCount: number;
  userEngagement: number; // 0-1 score
  topicsDiscussed: string[];
  recommendationsGiven: number;
  actionItemsCreated: number;
  followUpQuestions: number;
  userSatisfaction?: number; // 1-5 rating
  outcomeAchieved: boolean;
}

export interface MentorPerformanceMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  averageUserSatisfaction: number;
  responseTime: number; // in seconds
  recommendationAccuracy: number; // 0-1 score
  userRetention: number; // 0-1 score
  successfulOutcomes: number;
  topTopics: string[];
}

export interface AIPersonalityConfig {
  name: AIPersonality;
  description: string;
  traits: string[];
  communicationStyle: string;
  responsePatterns: {
    greeting: string[];
    encouragement: string[];
    challenge: string[];
    clarification: string[];
    summary: string[];
  };
  expertise: string[];
  limitations: string[];
}

export interface SessionGoal {
  id: string;
  description: string;
  category: 'learning' | 'problem-solving' | 'planning' | 'decision-making';
  priority: 'low' | 'medium' | 'high';
  timeframe: string;
  measurable: boolean;
  completed: boolean;
  completedAt?: Date;
}

export interface MentorshipInsight {
  id: string;
  sessionId: string;
  type: 'recommendation' | 'warning' | 'opportunity' | 'trend';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: Date;
  implementedAt?: Date;
  outcome?: string;
}

export interface ConversationSummary {
  sessionId: string;
  keyTopics: string[];
  mainChallenges: string[];
  recommendationsGiven: string[];
  actionItemsCreated: string[];
  nextSteps: string[];
  followUpRequired: boolean;
  followUpDate?: Date;
  overallSentiment: 'positive' | 'neutral' | 'negative';
  progressMade: boolean;
}

export interface AIKnowledgeBase {
  startupBestPractices: {
    [industry: string]: {
      [stage: string]: string[];
    };
  };
  industryBenchmarks: {
    [industry: string]: {
      [metric: string]: number;
    };
  };
  commonChallenges: {
    [stage: string]: {
      challenge: string;
      solutions: string[];
      resources: string[];
    }[];
  };
  successPatterns: {
    pattern: string;
    description: string;
    indicators: string[];
    recommendations: string[];
  }[];
}

// Enums and Union Types
export type SessionType =
  | 'general_guidance'
  | 'problem_solving'
  | 'strategic_planning'
  | 'funding_preparation'
  | 'market_analysis'
  | 'team_building'
  | 'product_development'
  | 'sales_marketing'
  | 'operations'
  | 'financial_planning'
  | 'crisis_management'
  | 'growth_strategy'
  | 'exit_planning';

export type AIPersonality =
  | 'supportive'
  | 'challenging'
  | 'analytical'
  | 'creative'
  | 'professional';

export type SessionStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'expired';

export type MessageRole = 'user' | 'assistant' | 'system';

export type ConversationTone =
  | 'formal'
  | 'casual'
  | 'encouraging'
  | 'direct'
  | 'empathetic';

export type MentorshipOutcome =
  | 'problem_solved'
  | 'decision_made'
  | 'plan_created'
  | 'insight_gained'
  | 'action_taken'
  | 'goal_achieved'
  | 'incomplete'
  | 'follow_up_needed';

// Request/Response Interfaces
export interface StartSessionRequest {
  sessionType: SessionType;
  topic?: string;
  aiPersonality?: AIPersonality;
  sessionGoals?: string[];
  focusAreas?: string[];
  urgency?: 'low' | 'medium' | 'high';
}

export interface SendMessageRequest {
  sessionId: string;
  message: string;
  messageType?: 'question' | 'update' | 'request';
}

export interface GetSessionsRequest {
  status?: 'active' | 'completed' | 'all';
  limit?: number;
  offset?: number;
}

export interface EndSessionRequest {
  sessionId: string;
  feedback?: string;
  rating?: number;
  outcome?: MentorshipOutcome;
}

export interface SessionListResponse {
  sessions: AIMentorSession[];
  total: number;
  hasMore: boolean;
}

export interface ConversationHistoryResponse {
  messages: AIMentorMessage[];
  sessionInfo: AIMentorSession;
  analytics?: SessionAnalytics;
}

// Database Schema Interfaces
export interface AIMentorSessionDB {
  id: string;
  user_id: string;
  session_type: SessionType;
  topic?: string;
  ai_personality: AIPersonality;
  session_goals: string; // JSON string
  focus_areas: string; // JSON string
  startup_context: string; // JSON string
  status: SessionStatus;
  created_at: Date;
  ended_at?: Date;
  last_activity_at?: Date;
  feedback?: string;
  rating?: number;
}

export interface AIMentorMessageDB {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  metadata: string; // JSON string
  created_at: Date;
}

export interface AIMentorAnalyticsDB {
  id: string;
  session_id: string;
  user_id: string;
  duration_minutes: number;
  message_count: number;
  user_engagement_score: number;
  topics_discussed: string; // JSON string
  recommendations_given: number;
  action_items_created: number;
  user_satisfaction?: number;
  outcome_achieved: boolean;
  created_at: Date;
}