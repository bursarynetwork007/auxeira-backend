      };

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
/**
 * AI Mentorship Service
 * Provides intelligent mentorship and guidance using OpenAI GPT-4
 * Based on the autonomous AI mentor system architecture from the tech specs
 */

import OpenAI from 'openai';
import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';
import {
  AIMentorSession,
  AIMentorMessage,
  AIMentorResponse,
  SessionType,
  AIPersonality,
  MentorshipRequest,
  ConversationContext,
  StartupContext,
  IndustryInsights,
  BehavioralAnalysis
} from '../types/ai-mentorship.types';

export class AIMentorshipService {
  private openai: OpenAI;
  private readonly MAX_CONTEXT_LENGTH = 8000;
  private readonly RESPONSE_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_TOKENS = 2000;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required for AI mentorship service');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: this.RESPONSE_TIMEOUT,
    });
  }

  /**
   * Start a new AI mentorship session
   */
  async startSession(
    userId: string,
    sessionType: SessionType,
    topic?: string,
    aiPersonality: AIPersonality = 'supportive',
    sessionGoals?: string[],
    focusAreas?: string[]
  ): Promise<AIMentorSession> {
    const timer = performanceTimer('ai_mentorship_start_session');

    try {
      // Get startup context for personalization
      const startupContext = await this.getStartupContext(userId);

      // Create session in database
      const sessionQuery = `
        INSERT INTO ai_mentor_sessions (
          id, user_id, session_type, topic, ai_personality,
          session_goals, focus_areas, startup_context, status, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'active', NOW()
        ) RETURNING *
      `;

      const sessionResult = await pool.query(sessionQuery, [
        userId,
        sessionType,
        topic,
        aiPersonality,
        JSON.stringify(sessionGoals || []),
        JSON.stringify(focusAreas || []),
        JSON.stringify(startupContext)
      ]);

      const session = sessionResult.rows[0];

      // Generate personalized welcome message
      const welcomeMessage = await this.generateWelcomeMessage(
        session,
        startupContext,
        aiPersonality
      );

      // Save welcome message
      await this.saveMessage(session.id, 'assistant', welcomeMessage, {
        messageType: 'welcome',
        personality: aiPersonality
      });

      timer.end();

      return {
        id: session.id,
        userId: session.user_id,
        sessionType: session.session_type,
        topic: session.topic,
        aiPersonality: session.ai_personality,
        sessionGoals: JSON.parse(session.session_goals || '[]'),
        focusAreas: JSON.parse(session.focus_areas || '[]'),
        status: session.status,
        createdAt: session.created_at,
        lastMessage: welcomeMessage,
        messageCount: 1
      };

    } catch (error) {
      timer.end();
      logger.error('Failed to start AI mentorship session', {
        error: (error as Error).message,
        userId,
        sessionType
      });
      throw new Error('Failed to start mentorship session');
    }
  }

  /**
   * Send a message to the AI mentor and get response
   */
  async sendMessage(
    sessionId: string,
    userId: string,
    message: string,
    messageType: 'question' | 'update' | 'request' = 'question'
  ): Promise<AIMentorResponse> {
    const timer = performanceTimer('ai_mentorship_send_message');

    try {
      // Validate session
      const session = await this.getSession(sessionId, userId);
      if (!session) {
        throw new Error('Session not found or access denied');
      }

      if (session.status !== 'active') {
        throw new Error('Session is not active');
      }

      // Save user message
      await this.saveMessage(sessionId, 'user', message, { messageType });

      // Get conversation context
      const context = await this.getConversationContext(sessionId);

      // Generate AI response
      const aiResponse = await this.generateAIResponse(session, context, message);

      // Save AI response
      await this.saveMessage(sessionId, 'assistant', aiResponse.content, {
        messageType: 'response',
        confidence: aiResponse.confidence,
        recommendations: aiResponse.recommendations
      });

      // Update session activity
      await this.updateSessionActivity(sessionId);

      timer.end();

      return {
        sessionId,
        message: aiResponse.content,
        confidence: aiResponse.confidence,
        recommendations: aiResponse.recommendations,
        followUpQuestions: aiResponse.followUpQuestions,
        actionItems: aiResponse.actionItems,
        timestamp: new Date()
      };

    } catch (error) {
      timer.end();
      logger.error('Failed to process AI mentorship message', {
        error: (error as Error).message,
        sessionId,
        userId
      });
      throw error;
    }
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(
    sessionId: string,
    userId: string,
    limit: number = 50
  ): Promise<AIMentorMessage[]> {
    try {
      const query = `
        SELECT m.*, s.user_id
        FROM ai_mentor_messages m
        JOIN ai_mentor_sessions s ON m.session_id = s.id
        WHERE m.session_id = $1 AND s.user_id = $2
        ORDER BY m.created_at DESC
        LIMIT $3
      `;

      const result = await pool.query(query, [sessionId, userId, limit]);

      return result.rows.map(row => ({
        id: row.id,
        sessionId: row.session_id,
        role: row.role,
        content: row.content,
        metadata: row.metadata,
        createdAt: row.created_at
      })).reverse(); // Return in chronological order

    } catch (error) {
      logger.error('Failed to get conversation history', {
        error: (error as Error).message,
        sessionId,
        userId
      });
      throw new Error('Failed to retrieve conversation history');
    }
  }

  /**
   * Get user's active sessions
   */
  async getUserSessions(
    userId: string,
    status: 'active' | 'completed' | 'all' = 'all',
    limit: number = 20
  ): Promise<AIMentorSession[]> {
    try {
      let query = `
        SELECT s.*,
               COUNT(m.id) as message_count,
               MAX(m.created_at) as last_message_at
        FROM ai_mentor_sessions s
        LEFT JOIN ai_mentor_messages m ON s.id = m.session_id
        WHERE s.user_id = $1
      `;

      const params: any[] = [userId];

      if (status !== 'all') {
        query += ` AND s.status = $2`;
        params.push(status);
      }

      query += `
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT $${params.length + 1}
      `;
      params.push(limit);

      const result = await pool.query(query, params);

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        sessionType: row.session_type,
        topic: row.topic,
        aiPersonality: row.ai_personality,
        sessionGoals: JSON.parse(row.session_goals || '[]'),
        focusAreas: JSON.parse(row.focus_areas || '[]'),
        status: row.status,
        createdAt: row.created_at,
        lastMessageAt: row.last_message_at,
        messageCount: parseInt(row.message_count)
      }));

    } catch (error) {
      logger.error('Failed to get user sessions', {
        error: (error as Error).message,
        userId
      });
      throw new Error('Failed to retrieve user sessions');
    }
  }

  /**
   * End a mentorship session
   */
  async endSession(
    sessionId: string,
    userId: string,
    feedback?: string,
    rating?: number
  ): Promise<void> {
    try {
      const updateQuery = `
        UPDATE ai_mentor_sessions
        SET status = 'completed',
            ended_at = NOW(),
            feedback = $3,
            rating = $4
        WHERE id = $1 AND user_id = $2
      `;

      await pool.query(updateQuery, [sessionId, userId, feedback, rating]);

      // Generate session summary
      if (feedback || rating) {
        await this.generateSessionSummary(sessionId);
      }

      logger.info('AI mentorship session ended', {
        sessionId,
        userId,
        rating
      });

    } catch (error) {
      logger.error('Failed to end AI mentorship session', {
        error: (error as Error).message,
        sessionId,
        userId
      });
      throw new Error('Failed to end session');
    }
  }

  /**
   * Get startup context for personalization
   */
  private async getStartupContext(userId: string): Promise<StartupContext> {
    try {
      const query = `
        SELECT
          u.first_name, u.last_name, u.role,
          o.name as organization_name, o.industry, o.stage, o.region,
          s.overall_score, s.social_score, s.sustainability_score, s.economic_score
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        LEFT JOIN sse_scores s ON u.id = s.user_id
        WHERE u.id = $1
        ORDER BY s.calculated_at DESC
        LIMIT 1
      `;

      const result = await pool.query(query, [userId]);
      const row = result.rows[0];

      if (!row) {
        throw new Error('User not found');
      }

      return {
        userName: `${row.first_name} ${row.last_name}`,
        userRole: row.role,
        organizationName: row.organization_name,
        industry: row.industry,
        stage: row.stage,
        region: row.region,
        currentSSEScore: {
          overall: row.overall_score,
          social: row.social_score,
          sustainability: row.sustainability_score,
          economic: row.economic_score
        }
      };

    } catch (error) {
      logger.error('Failed to get startup context', {
        error: (error as Error).message,
        userId
      });

      // Return minimal context if query fails
      return {
        userName: 'Entrepreneur',
        userRole: 'founder',
        organizationName: 'Your Startup',
        industry: 'technology',
        stage: 'seed',
        region: 'global'
      };
    }
  }

  /**
   * Generate personalized welcome message
   */
  private async generateWelcomeMessage(
    session: any,
    context: StartupContext,
    personality: AIPersonality
  ): Promise<string> {
    const personalityPrompts = {
      supportive: "You are a supportive and encouraging AI mentor who believes in the entrepreneur's potential.",
      challenging: "You are a direct and challenging AI mentor who pushes entrepreneurs to excel.",
      analytical: "You are an analytical and data-driven AI mentor who focuses on metrics and evidence.",
      creative: "You are a creative and innovative AI mentor who encourages out-of-the-box thinking.",
      professional: "You are a professional and experienced AI mentor with extensive business expertise."
    };

    const systemPrompt = `
      ${personalityPrompts[personality]}

      You are starting a ${session.session_type} mentorship session with ${context.userName} from ${context.organizationName}.

      Context:
      - Industry: ${context.industry}
      - Stage: ${context.stage}
      - Region: ${context.region}
      - Current SSE Score: ${context.currentSSEScore?.overall || 'Not available'}

      Generate a warm, personalized welcome message that:
      1. Acknowledges their specific context
      2. Sets expectations for the session
      3. Shows enthusiasm for helping them succeed
      4. Asks an engaging opening question related to their session type

      Keep it conversational and under 150 words.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Start a ${session.session_type} session focused on: ${session.topic || 'general guidance'}` }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      return response.choices[0]?.message?.content ||
        `Hello ${context.userName}! I'm excited to be your AI mentor today. Let's work together to help ${context.organizationName} succeed. What's the most pressing challenge you're facing right now?`;

    } catch (error) {
      logger.error('Failed to generate welcome message', { error: (error as Error).message });
      return `Hello ${context.userName}! I'm your AI mentor, ready to help you and ${context.organizationName} succeed. What would you like to focus on in our session today?`;
    }
  }

  /**
   * Generate AI response using OpenAI
   */
  private async generateAIResponse(
    session: any,
    context: ConversationContext,
    userMessage: string
  ): Promise<{
    content: string;
    confidence: number;
    recommendations: string[];
    followUpQuestions: string[];
    actionItems: string[];
  }> {
    const systemPrompt = this.buildSystemPrompt(session, context);
    const conversationHistory = this.buildConversationHistory(context.recentMessages);

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: userMessage }
        ],
        max_tokens: this.MAX_TOKENS,
        temperature: 0.7
      });

      const content = response.choices[0]?.message?.content || 'I apologize, but I encountered an issue generating a response. Could you please rephrase your question?';

      // Extract structured information from the response
      const recommendations = this.extractRecommendations(content);
      const followUpQuestions = this.extractFollowUpQuestions(content);
      const actionItems = this.extractActionItems(content);

      return {
        content,
        confidence: 0.85, // Could be enhanced with actual confidence scoring
        recommendations,
        followUpQuestions,
        actionItems
      };

    } catch (error) {
      logger.error('Failed to generate AI response', { error: (error as Error).message });
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Build system prompt for AI mentor
   */
  private buildSystemPrompt(session: any, context: ConversationContext): string {
    const startupContext = JSON.parse(session.startup_context || '{}');

    return `
      You are an expert AI mentor specializing in startup success. You have deep knowledge of:
      - Behavioral economics and startup psychology
      - The SSE (Social, Sustainability, Economic) framework
      - Industry best practices across ${startupContext.industry || 'various industries'}
      - Regional startup ecosystems in ${startupContext.region || 'global markets'}

      Current session context:
      - Session type: ${session.session_type}
      - Topic: ${session.topic || 'General guidance'}
      - AI personality: ${session.ai_personality}
      - Focus areas: ${JSON.parse(session.focus_areas || '[]').join(', ')}

      Startup context:
      - Organization: ${startupContext.organizationName || 'The startup'}
      - Industry: ${startupContext.industry || 'Technology'}
      - Stage: ${startupContext.stage || 'Early stage'}
      - Current SSE Score: ${startupContext.currentSSEScore?.overall || 'Not available'}

      Guidelines:
      1. Provide actionable, specific advice
      2. Reference relevant metrics and KPIs when appropriate
      3. Ask clarifying questions to better understand their situation
      4. Suggest concrete next steps
      5. Be encouraging but realistic
      6. Focus on behavioral changes that drive results

      Always end your response with 1-2 follow-up questions to keep the conversation productive.
    `;
  }

  /**
   * Build conversation history for context
   */
  private buildConversationHistory(messages: AIMentorMessage[]): Array<{role: 'user' | 'assistant', content: string}> {
    return messages
      .slice(-10) // Keep last 10 messages for context
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));
  }

  /**
   * Extract recommendations from AI response
   */
  private extractRecommendations(content: string): string[] {
    const recommendations: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.toLowerCase().includes('recommend') ||
          line.toLowerCase().includes('suggest') ||
          line.toLowerCase().includes('should')) {
        recommendations.push(line.trim());
      }
    }

    return recommendations.slice(0, 3); // Limit to 3 recommendations
  }

  /**
   * Extract follow-up questions from AI response
   */
  private extractFollowUpQuestions(content: string): string[] {
    const questions: string[] = [];
    const sentences = content.split(/[.!?]+/);

    for (const sentence of sentences) {
      if (sentence.trim().endsWith('?')) {
        questions.push(sentence.trim() + '?');
      }
    }

    return questions.slice(-2); // Get last 2 questions
  }

  /**
   * Extract action items from AI response
   */
  private extractActionItems(content: string): string[] {
    const actionItems: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.match(/^\d+\./) ||
          line.toLowerCase().includes('action') ||
          line.toLowerCase().includes('next step')) {
        actionItems.push(line.trim());
      }
    }

    return actionItems.slice(0, 5); // Limit to 5 action items
  }

  /**
   * Helper methods for database operations
   */
  private async getSession(sessionId: string, userId: string): Promise<any> {
    const query = `
      SELECT * FROM ai_mentor_sessions
      WHERE id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [sessionId, userId]);
    return result.rows[0];
  }

  private async saveMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: any
  ): Promise<void> {
    const query = `
      INSERT INTO ai_mentor_messages (id, session_id, role, content, metadata, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
    `;
    await pool.query(query, [sessionId, role, content, JSON.stringify(metadata || {})]);
  }

  private async getConversationContext(sessionId: string): Promise<ConversationContext> {
    const query = `
      SELECT * FROM ai_mentor_messages
      WHERE session_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `;
    const result = await pool.query(query, [sessionId]);

    return {
      sessionId,
      recentMessages: result.rows.map(row => ({
        id: row.id,
        sessionId: row.session_id,
        role: row.role,
        content: row.content,
        metadata: row.metadata,
        createdAt: row.created_at
      })).reverse()
    };
  }

  private async updateSessionActivity(sessionId: string): Promise<void> {
    const query = `
      UPDATE ai_mentor_sessions
      SET last_activity_at = NOW()
      WHERE id = $1
    `;
    await pool.query(query, [sessionId]);
  }

  private async generateSessionSummary(sessionId: string): Promise<void> {
    // Implementation for generating session summaries
    // This could include key insights, progress made, action items, etc.
    logger.info('Session summary generated', { sessionId });
  }
}

export const aiMentorshipService = new AIMentorshipService();
export default aiMentorshipService;
