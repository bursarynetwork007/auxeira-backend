import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../config/database';
import { redis } from '../config/redis';
import { config } from '../config';
import { logger, logUserActivity } from '../utils/logger';
import { sseScoringService } from './sse-scoring.service';
import {
  AIMentorshipSession,
  AIMentorshipMessage,
  UserMentorshipContext,
  MentorshipGoal,
  MentorshipInsight,
  StartMentorshipSessionRequest,
  SendMentorshipMessageRequest,
  MentorshipMessageResponse,
  CreateGoalRequest,
  UpdateGoalProgressRequest,
  MentorshipAnalytics,
  AIModelConfig,
  AIPersonalityConfig,
} from '../types/ai-mentorship.types';

/**
 * AI Mentorship Service
 * Handles OpenAI integration for personalized mentorship based on SSE scores
 */
export class AIMentorshipService {
  private openai: OpenAI;

  // AI Model configurations
  private readonly MODEL_CONFIGS: Record<string, AIModelConfig> = {
    'gpt-4': {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      topP: 0.9,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
    },
    'gpt-4-turbo': {
      model: 'gpt-4-turbo',
      temperature: 0.7,
      maxTokens: 1200,
      topP: 0.9,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
    },
    'gpt-3.5-turbo': {
      model: 'gpt-3.5-turbo',
      temperature: 0.8,
      maxTokens: 800,
      topP: 0.9,
      frequencyPenalty: 0.2,
      presencePenalty: 0.1,
    },
  };

  // AI Personality configurations
  private readonly PERSONALITY_CONFIGS: Record<string, AIPersonalityConfig> = {
    supportive: {
      personality: 'supportive',
      systemPrompt: `You are a supportive and encouraging AI mentor focused on helping users improve their Social, Sustainability, and Economic (SSE) impact. You provide positive reinforcement, celebrate achievements, and offer gentle guidance for improvement. Always maintain an optimistic and empathetic tone.`,
      responseStyle: 'encouraging and warm',
      focusAreas: ['motivation', 'positive reinforcement', 'emotional support'],
      communicationTone: 'warm and understanding',
    },
    challenging: {
      personality: 'challenging',
      systemPrompt: `You are a direct and challenging AI mentor who pushes users to achieve their full potential in Social, Sustainability, and Economic (SSE) impact. You ask tough questions, set high standards, and provide honest feedback to drive growth and improvement.`,
      responseStyle: 'direct and thought-provoking',
      focusAreas: ['accountability', 'high standards', 'critical thinking'],
      communicationTone: 'direct but constructive',
    },
    analytical: {
      personality: 'analytical',
      systemPrompt: `You are an analytical and data-driven AI mentor who helps users understand their Social, Sustainability, and Economic (SSE) performance through metrics, trends, and evidence-based insights. You focus on patterns, correlations, and measurable improvements.`,
      responseStyle: 'logical and data-focused',
      focusAreas: ['data analysis', 'pattern recognition', 'metrics interpretation'],
      communicationTone: 'professional and precise',
    },
    creative: {
      personality: 'creative',
      systemPrompt: `You are a creative and innovative AI mentor who helps users find unique and imaginative solutions to improve their Social, Sustainability, and Economic (SSE) impact. You encourage out-of-the-box thinking and creative problem-solving approaches.`,
      responseStyle: 'imaginative and inspiring',
      focusAreas: ['innovation', 'creative solutions', 'brainstorming'],
      communicationTone: 'enthusiastic and inspiring',
    },
    professional: {
      personality: 'professional',
      systemPrompt: `You are a professional and business-focused AI mentor who helps users improve their Social, Sustainability, and Economic (SSE) impact from a strategic business perspective. You provide practical advice, industry insights, and professional development guidance.`,
      responseStyle: 'professional and strategic',
      focusAreas: ['business strategy', 'professional development', 'industry insights'],
      communicationTone: 'professional and authoritative',
    },
  };

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_API_BASE,
    });
  }

  /**
   * Start a new mentorship session
   */
  async startMentorshipSession(
    userId: string,
    request: StartMentorshipSessionRequest
  ): Promise<{ success: boolean; session: AIMentorshipSession; message: string }> {
    try {
      // Get user context for the session
      const userContext = await this.buildUserContext(userId);

      // Create session
      const session: AIMentorshipSession = {
        id: uuidv4(),
        userId,
        sessionType: request.sessionType,
        topic: request.topic,
        status: 'active',
        aiModel: 'gpt-4',
        aiPersonality: request.aiPersonality || 'supportive',
        userContext,
        sessionGoals: request.sessionGoals || [],
        startedAt: new Date(),
        messageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save session to database
      await this.saveMentorshipSession(session);

      // Generate welcome message
      const welcomeMessage = await this.generateWelcomeMessage(session);

      // Save welcome message
      await this.saveMentorshipMessage(welcomeMessage);

      // Update session message count
      session.messageCount = 1;
      await this.updateMentorshipSession(session);

      // Log session start
      await logUserActivity(userId, 'mentorship_session_started', 'mentorship', {
        sessionId: session.id,
        sessionType: request.sessionType,
        aiPersonality: session.aiPersonality,
        goals: request.sessionGoals,
      });

      return {
        success: true,
        session,
        message: 'Mentorship session started successfully',
      };
    } catch (error) {
      logger.error('Failed to start mentorship session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        request,
      });

      throw error;
    }
  }

  /**
   * Send message in mentorship session
   */
  async sendMentorshipMessage(
    userId: string,
    request: SendMentorshipMessageRequest
  ): Promise<MentorshipMessageResponse> {
    try {
      // Get session
      const session = await this.getMentorshipSession(request.sessionId);
      if (!session || session.userId !== userId) {
        return {
          success: false,
          message: 'Session not found or access denied',
          data: {} as any,
          timestamp: new Date().toISOString(),
        };
      }

      if (session.status !== 'active') {
        return {
          success: false,
          message: 'Session is not active',
          data: {} as any,
          timestamp: new Date().toISOString(),
        };
      }

      // Save user message
      const userMessage: AIMentorshipMessage = {
        id: uuidv4(),
        sessionId: request.sessionId,
        sender: 'user',
        messageText: request.messageText,
        messageData: {
          attachments: request.attachments,
        },
        sentAt: new Date(),
        createdAt: new Date(),
      };

      await this.saveMentorshipMessage(userMessage);

      // Generate AI response
      const aiResponse = await this.generateAIResponse(session, userMessage, request.context);

      // Save AI response
      await this.saveMentorshipMessage(aiResponse);

      // Update session
      session.messageCount += 2;
      session.updatedAt = new Date();
      await this.updateMentorshipSession(session);

      // Generate insights if applicable
      const insights = await this.generateSessionInsights(session, userMessage, aiResponse);

      // Log message exchange
      await logUserActivity(userId, 'mentorship_message_sent', 'mentorship', {
        sessionId: request.sessionId,
        messageLength: request.messageText.length,
        aiModel: session.aiModel,
        responseTime: aiResponse.responseTimeMs,
      });

      return {
        success: true,
        message: 'Message sent successfully',
        data: {
          messageId: aiResponse.id,
          aiResponse,
          suggestedActions: aiResponse.messageData?.suggestedActions,
          followUpQuestions: aiResponse.messageData?.followUpQuestions,
          relatedInsights: insights,
          sessionUpdated: true,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to send mentorship message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        sessionId: request.sessionId,
      });

      return {
        success: false,
        message: 'Failed to send message',
        data: {} as any,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Create a new goal
   */
  async createGoal(userId: string, request: CreateGoalRequest): Promise<{ success: boolean; goal: MentorshipGoal }> {
    try {
      const goal: MentorshipGoal = {
        id: uuidv4(),
        userId,
        title: request.title,
        description: request.description,
        category: request.category,
        priority: request.priority,
        targetValue: request.targetValue,
        currentValue: 0,
        unit: request.unit,
        targetDate: request.targetDate ? new Date(request.targetDate) : undefined,
        createdDate: new Date(),
        status: 'not_started',
        progressPercentage: 0,
        milestones: request.milestones?.map(m => ({
          id: uuidv4(),
          title: m.title,
          description: m.description,
          targetDate: new Date(m.targetDate),
          isCompleted: false,
          progressPercentage: 0,
        })) || [],
        aiRecommendations: [],
        suggestedActions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Generate AI recommendations for the goal
      goal.aiRecommendations = await this.generateGoalRecommendations(userId, goal);

      // Save goal to database
      await this.saveGoal(goal);

      // Log goal creation
      await logUserActivity(userId, 'mentorship_goal_created', 'goal', {
        goalId: goal.id,
        category: goal.category,
        priority: goal.priority,
        targetDate: goal.targetDate,
      });

      return {
        success: true,
        goal,
      };
    } catch (error) {
      logger.error('Failed to create goal', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        request,
      });

      throw error;
    }
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(
    userId: string,
    request: UpdateGoalProgressRequest
  ): Promise<{ success: boolean; goal: MentorshipGoal; insights?: MentorshipInsight[] }> {
    try {
      // Get goal
      const goal = await this.getGoal(request.goalId);
      if (!goal || goal.userId !== userId) {
        throw new Error('Goal not found or access denied');
      }

      // Update goal progress
      if (request.currentValue !== undefined) {
        goal.currentValue = request.currentValue;
      }

      if (request.progressPercentage !== undefined) {
        goal.progressPercentage = request.progressPercentage;
      }

      if (request.status) {
        goal.status = request.status;
      }

      // Update milestones
      if (request.milestoneUpdates) {
        request.milestoneUpdates.forEach(update => {
          const milestone = goal.milestones.find(m => m.id === update.milestoneId);
          if (milestone) {
            milestone.isCompleted = update.isCompleted;
            milestone.progressPercentage = update.progressPercentage;
            if (update.isCompleted && !milestone.completedDate) {
              milestone.completedDate = new Date();
            }
          }
        });
      }

      // Calculate overall progress
      if (goal.milestones.length > 0) {
        const completedMilestones = goal.milestones.filter(m => m.isCompleted).length;
        goal.progressPercentage = Math.round((completedMilestones / goal.milestones.length) * 100);
      }

      // Check if goal is completed
      if (goal.progressPercentage >= 100 && goal.status !== 'completed') {
        goal.status = 'completed';
      }

      goal.updatedAt = new Date();

      // Save updated goal
      await this.updateGoal(goal);

      // Generate insights based on progress
      const insights = await this.generateProgressInsights(userId, goal);

      // Log goal update
      await logUserActivity(userId, 'mentorship_goal_updated', 'goal', {
        goalId: goal.id,
        progressPercentage: goal.progressPercentage,
        status: goal.status,
        milestonesCompleted: goal.milestones.filter(m => m.isCompleted).length,
      });

      return {
        success: true,
        goal,
        insights,
      };
    } catch (error) {
      logger.error('Failed to update goal progress', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        goalId: request.goalId,
      });

      throw error;
    }
  }

  /**
   * Get mentorship analytics
   */
  async getMentorshipAnalytics(userId: string): Promise<MentorshipAnalytics> {
    try {
      // Get session statistics
      const sessionStats = await this.getSessionStatistics(userId);

      // Get AI interaction metrics
      const aiMetrics = await this.getAIMetrics(userId);

      // Get goal progress
      const goalProgress = await this.getGoalProgress(userId);

      // Get insights statistics
      const insights = await this.getInsightsStatistics(userId);

      // Get behavioral impact
      const behavioralImpact = await this.getBehavioralImpact(userId);

      // Generate recommendations
      const recommendations = await this.generateAnalyticsRecommendations(userId, {
        sessionStats,
        aiMetrics,
        goalProgress,
        insights,
        behavioralImpact,
      });

      return {
        userId,
        sessionStats,
        aiMetrics,
        goalProgress,
        insights,
        behavioralImpact,
        recommendations,
        nextSteps: recommendations.slice(0, 3), // Top 3 as next steps
      };
    } catch (error) {
      logger.error('Failed to get mentorship analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });

      throw error;
    }
  }

  // Private helper methods

  private async buildUserContext(userId: string): Promise<UserMentorshipContext> {
    try {
      // Get user profile
      const userQuery = `
        SELECT role, organization_id, preferences
        FROM users
        WHERE id = $1
      `;
      const userResult = await database.query(userQuery, [userId]);
      const user = userResult.rows[0];

      // Get current SSE scores
      const sseScoreRequest = {
        userId,
        organizationId: user.organization_id,
        includeProjections: false,
        includeBenchmarks: false,
      };
      const sseResult = await sseScoringService.calculateSSEScore(sseScoreRequest);

      // Get score history
      const historyQuery = `
        SELECT calculated_at, overall_score, social_score, sustainability_score, economic_score
        FROM sse_scores
        WHERE user_id = $1
        ORDER BY calculated_at DESC
        LIMIT 10
      `;
      const historyResult = await database.query(historyQuery, [userId]);

      // Get recent behaviors
      const behaviorsQuery = `
        SELECT behavior_type, behavior_category, social_impact, sustainability_impact, economic_impact, occurred_at
        FROM user_behaviors
        WHERE user_id = $1
        ORDER BY occurred_at DESC
        LIMIT 20
      `;
      const behaviorsResult = await database.query(behaviorsQuery, [userId]);

      return {
        role: user.role,
        industry: user.preferences?.industry,
        experience: user.preferences?.experience || 'intermediate',
        currentSSEScore: {
          overall: sseResult.data.currentScore.overallScore,
          social: sseResult.data.currentScore.socialScore,
          sustainability: sseResult.data.currentScore.sustainabilityScore,
          economic: sseResult.data.currentScore.economicScore,
        },
        scoreHistory: historyResult.rows.map(row => ({
          date: row.calculated_at,
          overall: row.overall_score,
          social: row.social_score,
          sustainability: row.sustainability_score,
          economic: row.economic_score,
        })),
        primaryGoals: user.preferences?.goals || [],
        focusAreas: user.preferences?.focusAreas || ['social', 'sustainability', 'economic'],
        learningStyle: user.preferences?.learningStyle || 'visual',
        recentBehaviors: behaviorsResult.rows.map(row => ({
          type: row.behavior_type,
          category: row.behavior_category,
          impact: row.social_impact + row.sustainability_impact + row.economic_impact,
          date: row.occurred_at,
        })),
        identifiedChallenges: [],
        improvementAreas: [],
      };
    } catch (error) {
      logger.error('Failed to build user context', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });

      // Return minimal context on error
      return {
        role: 'student',
        experience: 'intermediate',
        currentSSEScore: { overall: 0, social: 0, sustainability: 0, economic: 0 },
        scoreHistory: [],
        primaryGoals: [],
        focusAreas: ['social', 'sustainability', 'economic'],
        learningStyle: 'visual',
        recentBehaviors: [],
        identifiedChallenges: [],
        improvementAreas: [],
      };
    }
  }

  private async generateWelcomeMessage(session: AIMentorshipSession): Promise<AIMentorshipMessage> {
    const personalityConfig = this.PERSONALITY_CONFIGS[session.aiPersonality];
    const modelConfig = this.MODEL_CONFIGS[session.aiModel];

    const systemPrompt = `${personalityConfig.systemPrompt}

User Context:
- Role: ${session.userContext.role}
- Current SSE Score: Overall ${session.userContext.currentSSEScore.overall}, Social ${session.userContext.currentSSEScore.social}, Sustainability ${session.userContext.currentSSEScore.sustainability}, Economic ${session.userContext.currentSSEScore.economic}
- Session Type: ${session.sessionType}
- Session Goals: ${session.sessionGoals.join(', ')}

Generate a personalized welcome message for this mentorship session. Keep it concise (2-3 sentences) and relevant to their goals and current performance.`;

    const startTime = Date.now();

    try {
      const completion = await this.openai.chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Hello! I'm ready to start our ${session.sessionType} session.` },
        ],
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
        top_p: modelConfig.topP,
        frequency_penalty: modelConfig.frequencyPenalty,
        presence_penalty: modelConfig.presencePenalty,
      });

      const responseTime = Date.now() - startTime;
      const messageText = completion.choices[0]?.message?.content || 'Welcome to your mentorship session! How can I help you today?';

      return {
        id: uuidv4(),
        sessionId: session.id,
        sender: 'ai',
        messageText,
        messageData: {
          suggestedActions: this.generateSuggestedActions(session.sessionType),
          followUpQuestions: this.generateFollowUpQuestions(session.sessionType),
        },
        aiModel: session.aiModel,
        tokensUsed: completion.usage?.total_tokens,
        responseTimeMs: responseTime,
        confidence: 0.9,
        contextUsed: {
          sseScores: true,
          userHistory: false,
          sessionGoals: true,
          recentBehaviors: false,
        },
        sentAt: new Date(),
        createdAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to generate welcome message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: session.id,
      });

      // Return fallback welcome message
      return {
        id: uuidv4(),
        sessionId: session.id,
        sender: 'ai',
        messageText: `Welcome to your ${session.sessionType} session! I'm here to help you improve your SSE impact. What would you like to focus on today?`,
        messageData: {
          suggestedActions: this.generateSuggestedActions(session.sessionType),
          followUpQuestions: this.generateFollowUpQuestions(session.sessionType),
        },
        aiModel: session.aiModel,
        tokensUsed: 0,
        responseTimeMs: Date.now() - startTime,
        confidence: 0.5,
        sentAt: new Date(),
        createdAt: new Date(),
      };
    }
  }

  private async generateAIResponse(
    session: AIMentorshipSession,
    userMessage: AIMentorshipMessage,
    context?: any
  ): Promise<AIMentorshipMessage> {
    const personalityConfig = this.PERSONALITY_CONFIGS[session.aiPersonality];
    const modelConfig = this.MODEL_CONFIGS[session.aiModel];

    // Build context-aware system prompt
    let systemPrompt = `${personalityConfig.systemPrompt}

User Context:
- Role: ${session.userContext.role}
- Current SSE Score: Overall ${session.userContext.currentSSEScore.overall}, Social ${session.userContext.currentSSEScore.social}, Sustainability ${session.userContext.currentSSEScore.sustainability}, Economic ${session.userContext.currentSSEScore.economic}
- Session Type: ${session.sessionType}
- Session Goals: ${session.sessionGoals.join(', ')}`;

    if (context?.includeRecentBehaviors && session.userContext.recentBehaviors.length > 0) {
      systemPrompt += `\n\nRecent Behaviors:\n${session.userContext.recentBehaviors.slice(0, 5).map(b => `- ${b.type} (${b.category}, impact: ${b.impact})`).join('\n')}`;
    }

    systemPrompt += `\n\nProvide helpful, actionable advice based on their current situation and goals. Be specific and practical.`;

    const startTime = Date.now();

    try {
      // Get recent conversation history
      const conversationHistory = await this.getConversationHistory(session.id, 10);

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.messageText,
        })),
        { role: 'user', content: userMessage.messageText },
      ];

      const completion = await this.openai.chat.completions.create({
        model: modelConfig.model,
        messages: messages as any,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
        top_p: modelConfig.topP,
        frequency_penalty: modelConfig.frequencyPenalty,
        presence_penalty: modelConfig.presencePenalty,
      });

      const responseTime = Date.now() - startTime;
      const messageText = completion.choices[0]?.message?.content || 'I understand your question. Let me help you with that.';

      return {
        id: uuidv4(),
        sessionId: session.id,
        sender: 'ai',
        messageText,
        messageData: {
          suggestedActions: this.extractSuggestedActions(messageText),
          followUpQuestions: this.generateContextualFollowUps(session.sessionType, userMessage.messageText),
          relatedResources: this.generateRelatedResources(session.sessionType),
        },
        aiModel: session.aiModel,
        tokensUsed: completion.usage?.total_tokens,
        responseTimeMs: responseTime,
        confidence: 0.85,
        contextUsed: {
          sseScores: true,
          userHistory: true,
          sessionGoals: true,
          recentBehaviors: context?.includeRecentBehaviors || false,
        },
        sentAt: new Date(),
        createdAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to generate AI response', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: session.id,
        userMessage: userMessage.messageText.substring(0, 100),
      });

      // Return fallback response
      return {
        id: uuidv4(),
        sessionId: session.id,
        sender: 'ai',
        messageText: 'I apologize, but I encountered an issue processing your message. Could you please rephrase your question?',
        messageData: {
          suggestedActions: ['Try rephrasing your question', 'Ask about a specific SSE area'],
          followUpQuestions: ['What specific area would you like to focus on?'],
        },
        aiModel: session.aiModel,
        tokensUsed: 0,
        responseTimeMs: Date.now() - startTime,
        confidence: 0.3,
        sentAt: new Date(),
        createdAt: new Date(),
      };
    }
  }

  private generateSuggestedActions(sessionType: string): string[] {
    const actionMap: Record<string, string[]> = {
      goal_setting: [
        'Set a specific SSE improvement target',
        'Break down your goal into milestones',
        'Identify your biggest challenge area',
      ],
      score_improvement: [
        'Review your current SSE breakdown',
        'Focus on your lowest scoring category',
        'Track daily behaviors that impact your score',
      ],
      career_guidance: [
        'Explore SSE-focused career opportunities',
        'Develop sustainability skills',
        'Network with impact-driven professionals',
      ],
      sustainability_advice: [
        'Calculate your carbon footprint',
        'Implement energy-saving practices',
        'Choose sustainable products and services',
      ],
      general_chat: [
        'Ask about specific SSE topics',
        'Share your recent achievements',
        'Discuss challenges you\'re facing',
      ],
    };

    return actionMap[sessionType] || actionMap.general_chat;
  }

  private generateFollowUpQuestions(sessionType: string): string[] {
    const questionMap: Record<string, string[]> = {
      goal_setting: [
        'What specific SSE area do you want to improve most?',
        'What timeline are you working with?',
        'What obstacles do you anticipate?',
      ],
      score_improvement: [
        'Which category needs the most attention?',
        'What behaviors could you change today?',
        'How do you currently track your progress?',
      ],
      career_guidance: [
        'What type of impact do you want to make?',
        'Are you interested in any specific industries?',
        'What skills do you want to develop?',
      ],
      sustainability_advice: [
        'What sustainability practices do you already follow?',
        'What\'s your biggest environmental concern?',
        'Are you looking for personal or business advice?',
      ],
      general_chat: [
        'What brought you to focus on SSE?',
        'What\'s your biggest challenge right now?',
        'How can I best support your goals?',
      ],
    };

    return questionMap[sessionType] || questionMap.general_chat;
  }

  private extractSuggestedActions(messageText: string): string[] {
    // Simple extraction of action-oriented sentences
    const sentences = messageText.split(/[.!?]+/);
    const actions = sentences
      .filter(s => s.includes('try') || s.includes('consider') || s.includes('start') || s.includes('focus'))
      .map(s => s.trim())
      .filter(s => s.length > 10)
      .slice(0, 3);

    return actions.length > 0 ? actions : ['Continue our conversation', 'Ask follow-up questions'];
  }

  private generateContextualFollowUps(sessionType: string, userMessage: string): string[] {
    // Generate contextual follow-ups based on user message content
    const followUps = [];

    if (userMessage.toLowerCase().includes('goal')) {
      followUps.push('What specific timeline do you have in mind?');
    }

    if (userMessage.toLowerCase().includes('challenge') || userMessage.toLowerCase().includes('problem')) {
      followUps.push('What have you tried so far to address this?');
    }

    if (userMessage.toLowerCase().includes('score') || userMessage.toLowerCase().includes('improve')) {
      followUps.push('Which SSE category is most important to you?');
    }

    // Add default follow-ups if none generated
    if (followUps.length === 0) {
      followUps.push(...this.generateFollowUpQuestions(sessionType).slice(0, 2));
    }

    return followUps.slice(0, 3);
  }

  private generateRelatedResources(sessionType: string): string[] {
    const resourceMap: Record<string, string[]> = {
      goal_setting: [
        'SMART Goals Framework',
        'Goal Tracking Templates',
        'Progress Measurement Tools',
      ],
      score_improvement: [
        'SSE Best Practices Guide',
        'Improvement Action Plans',
        'Benchmarking Resources',
      ],
      career_guidance: [
        'Sustainable Career Paths',
        'Impact Job Boards',
        'Professional Development Resources',
      ],
      sustainability_advice: [
        'Sustainability Guides',
        'Carbon Calculator Tools',
        'Green Living Tips',
      ],
      general_chat: [
        'SSE Learning Resources',
        'Community Forums',
        'Impact Measurement Tools',
      ],
    };

    return resourceMap[sessionType] || resourceMap.general_chat;
  }

  private async generateGoalRecommendations(userId: string, goal: MentorshipGoal): Promise<string[]> {
    // Generate AI-powered recommendations for achieving the goal
    try {
      const userContext = await this.buildUserContext(userId);

      const prompt = `Based on this user's profile and goal, provide 3-5 specific, actionable recommendations:

User Profile:
- Role: ${userContext.role}
- Current SSE Score: ${userContext.currentSSEScore.overall}
- Focus Areas: ${userContext.focusAreas.join(', ')}

Goal:
- Title: ${goal.title}
- Category: ${goal.category}
- Priority: ${goal.priority}
- Description: ${goal.description}

Provide practical, specific recommendations that this user can implement.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      });

      const response = completion.choices[0]?.message?.content || '';

      // Extract recommendations (assuming they're in a list format)
      const recommendations = response
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
        .map(line => line.replace(/^[-\d.]\s*/, '').trim())
        .filter(rec => rec.length > 10)
        .slice(0, 5);

      return recommendations.length > 0 ? recommendations : [
        'Break down your goal into smaller, manageable tasks',
        'Set up regular check-ins to track progress',
        'Find an accountability partner or mentor',
      ];
    } catch (error) {
      logger.error('Failed to generate goal recommendations', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        goalId: goal.id,
      });

      return [
        'Break down your goal into smaller, manageable tasks',
        'Set up regular check-ins to track progress',
        'Find an accountability partner or mentor',
      ];
    }
  }

  // Database helper methods (simplified - would need full implementation)

  private async saveMentorshipSession(session: AIMentorshipSession): Promise<void> {
    const query = `
      INSERT INTO ai_mentorship_sessions (
        id, user_id, session_type, topic, status, ai_model, ai_personality,
        user_context, session_goals, started_at, message_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    await database.query(query, [
      session.id,
      session.userId,
      session.sessionType,
      session.topic,
      session.status,
      session.aiModel,
      session.aiPersonality,
      JSON.stringify(session.userContext),
      JSON.stringify(session.sessionGoals),
      session.startedAt,
      session.messageCount,
    ]);
  }

  private async getMentorshipSession(sessionId: string): Promise<AIMentorshipSession | null> {
    const query = `
      SELECT * FROM ai_mentorship_sessions WHERE id = $1
    `;

    const result = await database.query(query, [sessionId]);
    const row = result.rows[0];

    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      sessionType: row.session_type,
      topic: row.topic,
      status: row.status,
      aiModel: row.ai_model,
      aiPersonality: row.ai_personality,
      userContext: JSON.parse(row.user_context),
      sessionGoals: JSON.parse(row.session_goals),
      startedAt: row.started_at,
      endedAt: row.ended_at,
      durationMinutes: row.duration_minutes,
      messageCount: row.message_count,
      userSatisfactionRating: row.user_satisfaction_rating,
      aiResponseQuality: row.ai_response_quality,
      goalAchievementProgress: row.goal_achievement_progress,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private async saveMentorshipMessage(message: AIMentorshipMessage): Promise<void> {
    const query = `
      INSERT INTO ai_mentorship_messages (
        id, session_id, sender, message_text, message_data, ai_model,
        tokens_used, response_time_ms, confidence, context_used, sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    await database.query(query, [
      message.id,
      message.sessionId,
      message.sender,
      message.messageText,
      JSON.stringify(message.messageData),
      message.aiModel,
      message.tokensUsed,
      message.responseTimeMs,
      message.confidence,
      JSON.stringify(message.contextUsed),
      message.sentAt,
    ]);
  }

  private async updateMentorshipSession(session: AIMentorshipSession): Promise<void> {
    const query = `
      UPDATE ai_mentorship_sessions
      SET message_count = $2, updated_at = $3, status = $4, ended_at = $5, duration_minutes = $6
      WHERE id = $1
    `;

    await database.query(query, [
      session.id,
      session.messageCount,
      session.updatedAt,
      session.status,
      session.endedAt,
      session.durationMinutes,
    ]);
  }

  private async getConversationHistory(sessionId: string, limit: number): Promise<AIMentorshipMessage[]> {
    const query = `
      SELECT * FROM ai_mentorship_messages
      WHERE session_id = $1
      ORDER BY sent_at DESC
      LIMIT $2
    `;

    const result = await database.query(query, [sessionId, limit]);
    return result.rows.reverse(); // Return in chronological order
  }

  private async generateSessionInsights(
    session: AIMentorshipSession,
    userMessage: AIMentorshipMessage,
    aiResponse: AIMentorshipMessage
  ): Promise<MentorshipInsight[]> {
    // Generate insights based on the conversation
    // This would be implemented with more sophisticated analysis
    return [];
  }

  private async generateProgressInsights(userId: string, goal: MentorshipGoal): Promise<MentorshipInsight[]> {
    // Generate insights based on goal progress
    // This would be implemented with progress analysis
    return [];
  }

  private async saveGoal(goal: MentorshipGoal): Promise<void> {
    // Implementation would save goal to database
  }

  private async getGoal(goalId: string): Promise<MentorshipGoal | null> {
    // Implementation would retrieve goal from database
    return null;
  }

  private async updateGoal(goal: MentorshipGoal): Promise<void> {
    // Implementation would update goal in database
  }

  private async getSessionStatistics(userId: string): Promise<any> {
    // Implementation would calculate session statistics
    return {
      totalSessions: 0,
      activeSessions: 0,
      completedSessions: 0,
      totalDurationMinutes: 0,
      averageSessionDuration: 0,
      totalMessages: 0,
      averageMessagesPerSession: 0,
    };
  }

  private async getAIMetrics(userId: string): Promise<any> {
    // Implementation would calculate AI interaction metrics
    return {
      averageResponseTime: 0,
      averageUserSatisfaction: 0,
      mostUsedPersonality: 'supportive',
      preferredSessionTypes: [],
      totalTokensUsed: 0,
    };
  }

  private async getGoalProgress(userId: string): Promise<any> {
    // Implementation would calculate goal progress metrics
    return {
      totalGoals: 0,
      completedGoals: 0,
      inProgressGoals: 0,
      averageCompletionTime: 0,
      goalCompletionRate: 0,
      mostSuccessfulCategory: 'social',
    };
  }

  private async getInsightsStatistics(userId: string): Promise<any> {
    // Implementation would calculate insights statistics
    return {
      totalInsights: 0,
      acknowledgedInsights: 0,
      highSignificanceInsights: 0,
      mostCommonInsightType: 'improvement_opportunity',
      averageInsightRating: 0,
    };
  }

  private async getBehavioralImpact(userId: string): Promise<any> {
    // Implementation would calculate behavioral impact metrics
    return {
      sessionsWithScoreImprovement: 0,
      averageScoreImprovementPerSession: 0,
      mostImpactfulSessionType: 'score_improvement',
      behaviorChangeFrequency: 0,
    };
  }

  private async generateAnalyticsRecommendations(userId: string, analytics: any): Promise<string[]> {
    // Generate recommendations based on analytics
    return [
      'Continue regular mentorship sessions for consistent progress',
      'Focus on goal-setting sessions to improve completion rates',
      'Try different AI personalities to find your preferred style',
    ];
  }
}

// Export singleton instance
export const aiMentorshipService = new AIMentorshipService();
export default aiMentorshipService;
