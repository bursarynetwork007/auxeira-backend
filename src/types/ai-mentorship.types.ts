// AI Mentorship System Types

export interface AIMentorshipSession {
  id: string;
  userId: string;

  // Session details
  sessionType: 'goal_setting' | 'score_improvement' | 'career_guidance' | 'sustainability_advice' | 'general_chat';
  topic?: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';

  // AI configuration
  aiModel: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
  aiPersonality: 'supportive' | 'challenging' | 'analytical' | 'creative' | 'professional';

  // Session context
  userContext: UserMentorshipContext;
  sessionGoals: string[];

  // Session metadata
  startedAt: Date;
  endedAt?: Date;
  durationMinutes?: number;
  messageCount: number;

  // Performance metrics
  userSatisfactionRating?: number;
  aiResponseQuality?: number;
  goalAchievementProgress?: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMentorshipContext {
  // User profile
  role: 'student' | 'founder' | 'investor';
  industry?: string;
  experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  // Current SSE scores
  currentSSEScore: {
    overall: number;
    social: number;
    sustainability: number;
    economic: number;
  };

  // Historical performance
  scoreHistory: Array<{
    date: Date;
    overall: number;
    social: number;
    sustainability: number;
    economic: number;
  }>;

  // Goals and preferences
  primaryGoals: string[];
  focusAreas: ('social' | 'sustainability' | 'economic')[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';

  // Recent activities
  recentBehaviors: Array<{
    type: string;
    category: 'social' | 'sustainability' | 'economic';
    impact: number;
    date: Date;
  }>;

  // Challenges and pain points
  identifiedChallenges: string[];
  improvementAreas: string[];
}

export interface AIMentorshipMessage {
  id: string;
  sessionId: string;

  // Message details
  sender: 'user' | 'ai';
  messageText: string;
  messageData?: {
    attachments?: string[];
    suggestedActions?: string[];
    relatedResources?: string[];
    followUpQuestions?: string[];
  };

  // AI response metadata (for AI messages)
  aiModel?: string;
  tokensUsed?: number;
  responseTimeMs?: number;
  confidence?: number;

  // Message context
  contextUsed?: {
    sseScores?: boolean;
    userHistory?: boolean;
    sessionGoals?: boolean;
    recentBehaviors?: boolean;
  };

  // User feedback (for AI messages)
  userRating?: number;
  userFeedback?: string;
  wasHelpful?: boolean;

  // Metadata
  sentAt: Date;
  createdAt: Date;
}

export interface MentorshipGoal {
  id: string;
  userId: string;
  sessionId?: string;

  // Goal details
  title: string;
  description: string;
  category: 'social' | 'sustainability' | 'economic' | 'career' | 'personal';
  priority: 'high' | 'medium' | 'low';

  // Goal metrics
  targetValue?: number;
  currentValue?: number;
  unit?: string;

  // Timeline
  targetDate?: Date;
  createdDate: Date;

  // Progress tracking
  status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  progressPercentage: number;
  milestones: GoalMilestone[];

  // AI assistance
  aiRecommendations: string[];
  suggestedActions: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  isCompleted: boolean;
  progressPercentage: number;
}

export interface MentorshipInsight {
  id: string;
  userId: string;
  sessionId?: string;

  // Insight details
  type: 'pattern_recognition' | 'improvement_opportunity' | 'strength_identification' | 'risk_warning' | 'achievement_recognition';
  category: 'social' | 'sustainability' | 'economic' | 'behavioral' | 'goal_progress';

  // Insight content
  title: string;
  description: string;
  significance: 'high' | 'medium' | 'low';

  // Supporting data
  dataPoints: any[];
  confidence: number;

  // Recommendations
  actionableRecommendations: string[];
  relatedResources: string[];

  // User interaction
  userAcknowledged: boolean;
  userRating?: number;
  userNotes?: string;

  // Metadata
  generatedAt: Date;
  expiresAt?: Date;
  createdAt: Date;
}

// Request/Response Types

export interface StartMentorshipSessionRequest {
  sessionType: 'goal_setting' | 'score_improvement' | 'career_guidance' | 'sustainability_advice' | 'general_chat';
  topic?: string;
  aiPersonality?: 'supportive' | 'challenging' | 'analytical' | 'creative' | 'professional';
  sessionGoals?: string[];
  focusAreas?: ('social' | 'sustainability' | 'economic')[];
}

export interface SendMentorshipMessageRequest {
  sessionId: string;
  messageText: string;
  attachments?: string[];
  context?: {
    includeSSEScores?: boolean;
    includeRecentBehaviors?: boolean;
    includeGoals?: boolean;
  };
}

export interface MentorshipMessageResponse {
  success: boolean;
  message: string;
  data: {
    messageId: string;
    aiResponse: AIMentorshipMessage;
    suggestedActions?: string[];
    followUpQuestions?: string[];
    relatedInsights?: MentorshipInsight[];
    sessionUpdated?: boolean;
  };
  timestamp: string;
}

export interface CreateGoalRequest {
  title: string;
  description: string;
  category: 'social' | 'sustainability' | 'economic' | 'career' | 'personal';
  priority: 'high' | 'medium' | 'low';
  targetValue?: number;
  unit?: string;
  targetDate?: string;
  milestones?: Array<{
    title: string;
    description: string;
    targetDate: string;
  }>;
}

export interface UpdateGoalProgressRequest {
  goalId: string;
  currentValue?: number;
  progressPercentage?: number;
  status?: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  milestoneUpdates?: Array<{
    milestoneId: string;
    isCompleted: boolean;
    progressPercentage: number;
  }>;
  notes?: string;
}

export interface GetMentorshipAnalyticsRequest {
  userId: string;
  timeRange?: {
    startDate: Date;
    endDate: Date;
  };
  includeGoalProgress?: boolean;
  includeInsights?: boolean;
  includeSessionMetrics?: boolean;
}

export interface MentorshipAnalytics {
  userId: string;

  // Session statistics
  sessionStats: {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    totalDurationMinutes: number;
    averageSessionDuration: number;
    totalMessages: number;
    averageMessagesPerSession: number;
  };

  // AI interaction metrics
  aiMetrics: {
    averageResponseTime: number;
    averageUserSatisfaction: number;
    mostUsedPersonality: string;
    preferredSessionTypes: string[];
    totalTokensUsed: number;
  };

  // Goal progress
  goalProgress: {
    totalGoals: number;
    completedGoals: number;
    inProgressGoals: number;
    averageCompletionTime: number;
    goalCompletionRate: number;
    mostSuccessfulCategory: string;
  };

  // Insights and patterns
  insights: {
    totalInsights: number;
    acknowledgedInsights: number;
    highSignificanceInsights: number;
    mostCommonInsightType: string;
    averageInsightRating: number;
  };

  // Behavioral impact
  behavioralImpact: {
    sessionsWithScoreImprovement: number;
    averageScoreImprovementPerSession: number;
    mostImpactfulSessionType: string;
    behaviorChangeFrequency: number;
  };

  // Recommendations
  recommendations: string[];
  nextSteps: string[];
}

// AI Configuration Types

export interface AIModelConfig {
  model: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface AIPersonalityConfig {
  personality: 'supportive' | 'challenging' | 'analytical' | 'creative' | 'professional';
  systemPrompt: string;
  responseStyle: string;
  focusAreas: string[];
  communicationTone: string;
}

export interface MentorshipPromptTemplate {
  id: string;
  name: string;
  category: 'goal_setting' | 'score_improvement' | 'career_guidance' | 'sustainability_advice' | 'general_chat';
  template: string;
  variables: string[];
  description: string;
  isActive: boolean;
}

// Webhook and Integration Types

export interface MentorshipWebhook {
  id: string;
  userId: string;

  // Webhook details
  eventType: 'session_started' | 'session_completed' | 'goal_achieved' | 'insight_generated' | 'milestone_reached';
  url: string;
  secret: string;

  // Configuration
  isActive: boolean;
  retryAttempts: number;
  timeoutSeconds: number;

  // Metadata
  createdAt: Date;
  lastTriggeredAt?: Date;
  successCount: number;
  failureCount: number;
}

export interface ExternalIntegration {
  id: string;
  userId: string;

  // Integration details
  platform: 'slack' | 'discord' | 'teams' | 'email' | 'calendar';
  configuration: any;

  // Integration settings
  notificationTypes: string[];
  isActive: boolean;

  // Metadata
  createdAt: Date;
  lastSyncAt?: Date;
  syncStatus: 'success' | 'error' | 'pending';
}
