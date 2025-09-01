/**
 * Partnership Management Service
 * Handles partnership ecosystem, applications, and benefit redemptions
 * Based on the performance-driven partnership architecture from the tech specs
 */

import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';
import {
  Partnership,
  PartnershipApplication,
  PartnershipBenefit,
  BenefitRedemption,
  PartnershipMatch,
  PartnershipAnalytics,
  PartnershipRecommendation,
  CreatePartnershipRequest,
  UpdatePartnershipRequest,
  ApplyPartnershipRequest,
  ReviewApplicationRequest,
  RedeemBenefitRequest,
  GetPartnershipsRequest,
  GetApplicationsRequest,
  PartnershipType,
  PartnershipCategory,
  ApplicationStatus,
  StartupStage,
  PricingTier
} from '../types/partnership.types';

export class PartnershipService {
  /**
   * Create a new partnership
   */
  async createPartnership(request: CreatePartnershipRequest): Promise<Partnership> {
    const timer = performanceTimer('partnership_create');

    try {
      const query = `
        INSERT INTO partnerships (
          id, name, type, category, description, benefits, requirements,
          sse_threshold, is_active, featured, logo_url, website_url, contact_email,
          region, industries, stages, expires_at, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW()
        ) RETURNING *
      `;

      const result = await pool.query(query, [
        request.name,
        request.type,
        request.category,
        request.description,
        JSON.stringify(request.benefits),
        JSON.stringify(request.requirements),
        request.sseThreshold,
        true, // is_active
        false, // featured
        request.logoUrl,
        request.websiteUrl,
        request.contactEmail,
        JSON.stringify(request.region),
        JSON.stringify(request.industries),
        JSON.stringify(request.stages),
        request.expiresAt
      ]);

      const partnership = this.mapPartnershipFromDB(result.rows[0]);

      timer.end();

      logger.info('Partnership created', {
        partnershipId: partnership.id,
        name: partnership.name,
        type: partnership.type
      });

      return partnership;

    } catch (error) {
      timer.end();
      logger.error('Failed to create partnership', {
        error: (error as Error).message,
        request
      });
      throw new Error('Failed to create partnership');
    }
  }

  /**
   * Get partnerships with filtering and pagination
   */
  async getPartnerships(request: GetPartnershipsRequest): Promise<{
    partnerships: Partnership[];
    total: number;
    hasMore: boolean;
  }> {
    const timer = performanceTimer('partnership_get_list');

    try {
      let whereClause = 'WHERE is_active = true';
      const params: any[] = [];
      let paramCount = 0;

      // Build dynamic WHERE clause
      if (request.type) {
        whereClause += ` AND type = $${++paramCount}`;
        params.push(request.type);
      }

      if (request.category) {
        whereClause += ` AND category = $${++paramCount}`;
        params.push(request.category);
      }

      if (request.region) {
        whereClause += ` AND region::jsonb ? $${++paramCount}`;
        params.push(request.region);
      }

      if (request.industry) {
        whereClause += ` AND industries::jsonb ? $${++paramCount}`;
        params.push(request.industry);
      }

      if (request.stage) {
        whereClause += ` AND stages::jsonb ? $${++paramCount}`;
        params.push(request.stage);
      }

      if (request.minSSEScore) {
        whereClause += ` AND sse_threshold >= $${++paramCount}`;
        params.push(request.minSSEScore);
      }

      if (request.maxSSEScore) {
        whereClause += ` AND sse_threshold <= $${++paramCount}`;
        params.push(request.maxSSEScore);
      }

      if (request.featured !== undefined) {
        whereClause += ` AND featured = $${++paramCount}`;
        params.push(request.featured);
      }

      if (request.search) {
        whereClause += ` AND (name ILIKE $${++paramCount} OR description ILIKE $${paramCount})`;
        params.push(`%${request.search}%`);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM partnerships ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Build ORDER BY clause
      const sortBy = request.sortBy || 'created_at';
      const sortOrder = request.sortOrder || 'desc';
      const orderClause = `ORDER BY ${sortBy} ${sortOrder}`;

      // Add pagination
      const limit = Math.min(request.limit || 20, 100);
      const offset = request.offset || 0;
      const paginationClause = `LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(limit, offset);

      // Get partnerships
      const query = `
        SELECT * FROM partnerships
        ${whereClause}
        ${orderClause}
        ${paginationClause}
      `;

      const result = await pool.query(query, params);
      const partnerships = result.rows.map(row => this.mapPartnershipFromDB(row));

      timer.end();

      return {
        partnerships,
        total,
        hasMore: offset + partnerships.length < total
      };

    } catch (error) {
      timer.end();
      logger.error('Failed to get partnerships', {
        error: (error as Error).message,
        request
      });
      throw new Error('Failed to get partnerships');
    }
  }

  /**
   * Get partnership by ID
   */
  async getPartnershipById(partnershipId: string): Promise<Partnership | null> {
    const timer = performanceTimer('partnership_get_by_id');

    try {
      const query = 'SELECT * FROM partnerships WHERE id = $1 AND is_active = true';
      const result = await pool.query(query, [partnershipId]);

      timer.end();

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapPartnershipFromDB(result.rows[0]);

    } catch (error) {
      timer.end();
      logger.error('Failed to get partnership by ID', {
        error: (error as Error).message,
        partnershipId
      });
      throw new Error('Failed to get partnership');
    }
  }

  /**
   * Update partnership
   */
  async updatePartnership(
    partnershipId: string,
    request: UpdatePartnershipRequest
  ): Promise<Partnership> {
    const timer = performanceTimer('partnership_update');

    try {
      const updates: string[] = [];
      const params: any[] = [];
      let paramCount = 0;

      // Build dynamic UPDATE clause
      if (request.name !== undefined) {
        updates.push(`name = $${++paramCount}`);
        params.push(request.name);
      }

      if (request.description !== undefined) {
        updates.push(`description = $${++paramCount}`);
        params.push(request.description);
      }

      if (request.benefits !== undefined) {
        updates.push(`benefits = $${++paramCount}`);
        params.push(JSON.stringify(request.benefits));
      }

      if (request.requirements !== undefined) {
        updates.push(`requirements = $${++paramCount}`);
        params.push(JSON.stringify(request.requirements));
      }

      if (request.sseThreshold !== undefined) {
        updates.push(`sse_threshold = $${++paramCount}`);
        params.push(request.sseThreshold);
      }

      if (request.isActive !== undefined) {
        updates.push(`is_active = $${++paramCount}`);
        params.push(request.isActive);
      }

      if (request.featured !== undefined) {
        updates.push(`featured = $${++paramCount}`);
        params.push(request.featured);
      }

      if (request.logoUrl !== undefined) {
        updates.push(`logo_url = $${++paramCount}`);
        params.push(request.logoUrl);
      }

      if (request.websiteUrl !== undefined) {
        updates.push(`website_url = $${++paramCount}`);
        params.push(request.websiteUrl);
      }

      if (request.contactEmail !== undefined) {
        updates.push(`contact_email = $${++paramCount}`);
        params.push(request.contactEmail);
      }

      if (request.region !== undefined) {
        updates.push(`region = $${++paramCount}`);
        params.push(JSON.stringify(request.region));
      }

      if (request.industries !== undefined) {
        updates.push(`industries = $${++paramCount}`);
        params.push(JSON.stringify(request.industries));
      }

      if (request.stages !== undefined) {
        updates.push(`stages = $${++paramCount}`);
        params.push(JSON.stringify(request.stages));
      }

      if (request.expiresAt !== undefined) {
        updates.push(`expires_at = $${++paramCount}`);
        params.push(request.expiresAt);
      }

      if (updates.length === 0) {
        throw new Error('No updates provided');
      }

      updates.push(`updated_at = NOW()`);
      params.push(partnershipId);

      const query = `
        UPDATE partnerships
        SET ${updates.join(', ')}
        WHERE id = $${++paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        throw new Error('Partnership not found');
      }

      const partnership = this.mapPartnershipFromDB(result.rows[0]);

      timer.end();

      logger.info('Partnership updated', {
        partnershipId: partnership.id,
        updates: Object.keys(request)
      });

      return partnership;

    } catch (error) {
      timer.end();
      logger.error('Failed to update partnership', {
        error: (error as Error).message,
        partnershipId,
        request
      });
      throw new Error('Failed to update partnership');
    }
  }

  /**
   * Apply for a partnership
   */
  async applyForPartnership(
    userId: string,
    request: ApplyPartnershipRequest
  ): Promise<PartnershipApplication> {
    const timer = performanceTimer('partnership_apply');

    try {
      // Check if partnership exists and is active
      const partnership = await this.getPartnershipById(request.partnershipId);
      if (!partnership) {
        throw new Error('Partnership not found or inactive');
      }

      // Check if user already has an active application
      const existingQuery = `
        SELECT id FROM partnership_applications
        WHERE user_id = $1 AND partnership_id = $2 AND status IN ('pending', 'under_review', 'approved')
      `;
      const existingResult = await pool.query(existingQuery, [userId, request.partnershipId]);

      if (existingResult.rows.length > 0) {
        throw new Error('You already have an active application for this partnership');
      }

      // Get user's current SSE score
      const sseQuery = `
        SELECT overall_score
        FROM sse_scores
        WHERE user_id = $1
        ORDER BY calculated_at DESC
        LIMIT 1
      `;
      const sseResult = await pool.query(sseQuery, [userId]);
      const currentSSEScore = sseResult.rows[0]?.overall_score || 0;

      // Check if user meets minimum requirements
      if (currentSSEScore < partnership.sseThreshold) {
        throw new Error(`Minimum SSE score of ${partnership.sseThreshold} required. Your current score: ${currentSSEScore}`);
      }

      // Create application
      const applicationData = {
        ...request.applicationData,
        currentSSEScore
      };

      const query = `
        INSERT INTO partnership_applications (
          id, user_id, partnership_id, status, application_data,
          applied_at, expires_at, total_value_redeemed, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, 'pending', $3, NOW(),
          NOW() + INTERVAL '30 days', 0, NOW()
        ) RETURNING *
      `;

      const result = await pool.query(query, [
        userId,
        request.partnershipId,
        JSON.stringify(applicationData)
      ]);

      const application = this.mapApplicationFromDB(result.rows[0]);

      timer.end();

      logger.info('Partnership application created', {
        applicationId: application.id,
        userId,
        partnershipId: request.partnershipId
      });

      return application;

    } catch (error) {
      timer.end();
      logger.error('Failed to apply for partnership', {
        error: (error as Error).message,
        userId,
        request
      });
      throw error;
    }
  }

  /**
   * Review partnership application
   */
  async reviewApplication(
    reviewerId: string,
    request: ReviewApplicationRequest
  ): Promise<PartnershipApplication> {
    const timer = performanceTimer('partnership_review_application');

    try {
      const updateQuery = `
        UPDATE partnership_applications
        SET status = $1,
            reviewed_at = NOW(),
            ${request.status === 'approved' ? 'approved_at = NOW(),' : 'rejected_at = NOW(),'}
            reviewer_id = $2,
            review_notes = $3
        WHERE id = $4 AND status IN ('pending', 'under_review')
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [
        request.status,
        reviewerId,
        request.reviewNotes,
        request.applicationId
      ]);

      if (result.rows.length === 0) {
        throw new Error('Application not found or already reviewed');
      }

      const application = this.mapApplicationFromDB(result.rows[0]);

      timer.end();

      logger.info('Partnership application reviewed', {
        applicationId: application.id,
        status: request.status,
        reviewerId
      });

      return application;

    } catch (error) {
      timer.end();
      logger.error('Failed to review application', {
        error: (error as Error).message,
        reviewerId,
        request
      });
      throw new Error('Failed to review application');
    }
  }

  /**
   * Redeem partnership benefit
   */
  async redeemBenefit(
    userId: string,
    request: RedeemBenefitRequest
  ): Promise<BenefitRedemption> {
    const timer = performanceTimer('partnership_redeem_benefit');

    try {
      // Verify application belongs to user and is approved
      const appQuery = `
        SELECT pa.*, p.benefits
        FROM partnership_applications pa
        JOIN partnerships p ON pa.partnership_id = p.id
        WHERE pa.id = $1 AND pa.user_id = $2 AND pa.status = 'approved'
      `;
      const appResult = await pool.query(appQuery, [request.applicationId, userId]);

      if (appResult.rows.length === 0) {
        throw new Error('Application not found or not approved');
      }

      const application = appResult.rows[0];
      const benefits = JSON.parse(application.benefits) as PartnershipBenefit[];
      const benefit = benefits.find(b => b.id === request.benefitId);

      if (!benefit) {
        throw new Error('Benefit not found');
      }

      if (!benefit.isActive) {
        throw new Error('Benefit is no longer active');
      }

      // Check if benefit has already been redeemed
      const existingQuery = `
        SELECT id FROM benefit_redemptions
        WHERE application_id = $1 AND benefit_id = $2
      `;
      const existingResult = await pool.query(existingQuery, [request.applicationId, request.benefitId]);

      if (existingResult.rows.length > 0) {
        throw new Error('Benefit has already been redeemed');
      }

      // Generate redemption code
      const redemptionCode = this.generateRedemptionCode();

      // Create redemption record
      const redemptionQuery = `
        INSERT INTO benefit_redemptions (
          id, application_id, benefit_id, redeemed_at, value, currency,
          redemption_code, notes, expires_at, is_used, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, NOW(), $3, $4, $5, $6, $7, false, NOW()
        ) RETURNING *
      `;

      const redemptionResult = await pool.query(redemptionQuery, [
        request.applicationId,
        request.benefitId,
        benefit.value.estimatedValue || 0,
        'USD',
        redemptionCode,
        request.notes,
        benefit.validUntil
      ]);

      // Update total value redeemed in application
      await pool.query(
        'UPDATE partnership_applications SET total_value_redeemed = total_value_redeemed + $1 WHERE id = $2',
        [benefit.value.estimatedValue || 0, request.applicationId]
      );

      const redemption = this.mapRedemptionFromDB(redemptionResult.rows[0]);

      timer.end();

      logger.info('Benefit redeemed', {
        redemptionId: redemption.id,
        userId,
        benefitId: request.benefitId,
        value: redemption.value
      });

      return redemption;

    } catch (error) {
      timer.end();
      logger.error('Failed to redeem benefit', {
        error: (error as Error).message,
        userId,
        request
      });
      throw error;
    }
  }

  /**
   * Get partnership recommendations for user
   */
  async getPartnershipRecommendations(userId: string): Promise<PartnershipRecommendation> {
    const timer = performanceTimer('partnership_get_recommendations');

    try {
      // Get user context
      const userContext = await this.getUserContext(userId);

      // Get all active partnerships
      const partnerships = await this.getPartnerships({
        isActive: true,
        limit: 100
      });

      // Calculate match scores
      const matches: PartnershipMatch[] = [];

      for (const partnership of partnerships.partnerships) {
        const matchScore = this.calculateMatchScore(userContext, partnership);

        if (matchScore.score > 0.3) { // Only include partnerships with >30% match
          matches.push({
            userId,
            partnership,
            matchScore: matchScore.score,
            matchReasons: matchScore.reasons,
            missingRequirements: matchScore.missingRequirements,
            potentialValue: this.calculatePotentialValue(partnership),
            recommendationPriority: matchScore.score > 0.7 ? 'high' : matchScore.score > 0.5 ? 'medium' : 'low'
          });
        }
      }

      // Sort by match score
      matches.sort((a, b) => b.matchScore - a.matchScore);

      // Take top 10 recommendations
      const topRecommendations = matches.slice(0, 10);

      const totalPotentialValue = topRecommendations.reduce((sum, match) => sum + match.potentialValue, 0);

      const recommendation: PartnershipRecommendation = {
        userId,
        recommendations: topRecommendations,
        totalPotentialValue,
        topCategories: this.getTopCategories(topRecommendations),
        personalizedMessage: this.generatePersonalizedMessage(userContext, topRecommendations),
        generatedAt: new Date()
      };

      timer.end();

      return recommendation;

    } catch (error) {
      timer.end();
      logger.error('Failed to get partnership recommendations', {
        error: (error as Error).message,
        userId
      });
      throw new Error('Failed to get partnership recommendations');
    }
  }

  /**
   * Get user's partnership applications
   */
  async getUserApplications(
    userId: string,
    request: GetApplicationsRequest
  ): Promise<{
    applications: PartnershipApplication[];
    total: number;
    hasMore: boolean;
  }> {
    const timer = performanceTimer('partnership_get_user_applications');

    try {
      let whereClause = 'WHERE user_id = $1';
      const params: any[] = [userId];
      let paramCount = 1;

      if (request.status) {
        whereClause += ` AND status = $${++paramCount}`;
        params.push(request.status);
      }

      if (request.partnershipId) {
        whereClause += ` AND partnership_id = $${++paramCount}`;
        params.push(request.partnershipId);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM partnership_applications ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Build ORDER BY clause
      const sortBy = request.sortBy || 'applied_at';
      const sortOrder = request.sortOrder || 'desc';
      const orderClause = `ORDER BY ${sortBy} ${sortOrder}`;

      // Add pagination
      const limit = Math.min(request.limit || 20, 100);
      const offset = request.offset || 0;
      const paginationClause = `LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(limit, offset);

      // Get applications
      const query = `
        SELECT * FROM partnership_applications
        ${whereClause}
        ${orderClause}
        ${paginationClause}
      `;

      const result = await pool.query(query, params);
      const applications = result.rows.map(row => this.mapApplicationFromDB(row));

      timer.end();

      return {
        applications,
        total,
        hasMore: offset + applications.length < total
      };

    } catch (error) {
      timer.end();
      logger.error('Failed to get user applications', {
        error: (error as Error).message,
        userId,
        request
      });
      throw new Error('Failed to get user applications');
    }
  }

  /**
   * Get partnership analytics
   */
  async getPartnershipAnalytics(
    partnershipId: string,
    period?: string
  ): Promise<PartnershipAnalytics> {
    const timer = performanceTimer('partnership_get_analytics');

    try {
      const periodFilter = period ? `AND DATE_TRUNC('month', applied_at) = $2::date` : '';
      const params = period ? [partnershipId, period] : [partnershipId];

      // Get application statistics
      const appStatsQuery = `
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'approved') as approved,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
          COUNT(*) FILTER (WHERE status IN ('pending', 'under_review')) as pending
        FROM partnership_applications
        WHERE partnership_id = $1 ${periodFilter}
      `;

      const appStatsResult = await pool.query(appStatsQuery, params);
      const appStats = appStatsResult.rows[0];

      // Get redemption statistics
      const redemptionStatsQuery = `
        SELECT
          COUNT(*) as total,
          SUM(value) as total_value,
          AVG(value) as average_value
        FROM benefit_redemptions br
        JOIN partnership_applications pa ON br.application_id = pa.id
        WHERE pa.partnership_id = $1 ${periodFilter}
      `;

      const redemptionStatsResult = await pool.query(redemptionStatsQuery, params);
      const redemptionStats = redemptionStatsResult.rows[0];

      const analytics: PartnershipAnalytics = {
        partnershipId,
        period: period || new Date().toISOString().slice(0, 7),
        applications: {
          total: parseInt(appStats.total),
          approved: parseInt(appStats.approved),
          rejected: parseInt(appStats.rejected),
          pending: parseInt(appStats.pending)
        },
        redemptions: {
          total: parseInt(redemptionStats.total || '0'),
          totalValue: parseFloat(redemptionStats.total_value || '0'),
          averageValue: parseFloat(redemptionStats.average_value || '0'),
          topBenefits: [] // Would need additional query
        },
        userEngagement: {
          uniqueApplicants: parseInt(appStats.total), // Simplified
          repeatApplicants: 0, // Would need additional query
          averageSSEScore: 0, // Would need additional query
          topIndustries: [], // Would need additional query
          topRegions: [] // Would need additional query
        },
        roi: {
          partnerInvestment: 0, // Would need partner data
          valueDelivered: parseFloat(redemptionStats.total_value || '0'),
          roiPercentage: 0 // Would calculate based on investment
        }
      };

      timer.end();

      return analytics;

    } catch (error) {
      timer.end();
      logger.error('Failed to get partnership analytics', {
        error: (error as Error).message,
        partnershipId,
        period
      });
      throw new Error('Failed to get partnership analytics');
    }
  }

  // Private helper methods
  private mapPartnershipFromDB(row: any): Partnership {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      category: row.category,
      description: row.description,
      benefits: JSON.parse(row.benefits || '[]'),
      requirements: JSON.parse(row.requirements || '{}'),
      sseThreshold: row.sse_threshold,
      isActive: row.is_active,
      featured: row.featured,
      logoUrl: row.logo_url,
      websiteUrl: row.website_url,
      contactEmail: row.contact_email,
      region: JSON.parse(row.region || '[]'),
      industries: JSON.parse(row.industries || '[]'),
      stages: JSON.parse(row.stages || '[]'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      expiresAt: row.expires_at
    };
  }

  private mapApplicationFromDB(row: any): PartnershipApplication {
    return {
      id: row.id,
      userId: row.user_id,
      partnershipId: row.partnership_id,
      status: row.status,
      applicationData: JSON.parse(row.application_data || '{}'),
      appliedAt: row.applied_at,
      reviewedAt: row.reviewed_at,
      approvedAt: row.approved_at,
      rejectedAt: row.rejected_at,
      expiresAt: row.expires_at,
      reviewerId: row.reviewer_id,
      reviewNotes: row.review_notes,
      benefitsRedeemed: [], // Would need separate query
      totalValueRedeemed: row.total_value_redeemed
    };
  }

  private mapRedemptionFromDB(row: any): BenefitRedemption {
    return {
      id: row.id,
      applicationId: row.application_id,
      benefitId: row.benefit_id,
      redeemedAt: row.redeemed_at,
      value: row.value,
      currency: row.currency,
      redemptionCode: row.redemption_code,
      notes: row.notes,
      expiresAt: row.expires_at,
      isUsed: row.is_used,
      usedAt: row.used_at
    };
  }

  private async getUserContext(userId: string): Promise<any> {
    const query = `
      SELECT
        u.first_name, u.last_name, u.role,
        o.name as organization_name, o.industry, o.stage, o.region,
        o.funding_raised, o.monthly_revenue, o.employee_count,
        s.overall_score, s.social_score, s.sustainability_score, s.economic_score
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      LEFT JOIN sse_scores s ON u.id = s.user_id
      WHERE u.id = $1
      ORDER BY s.calculated_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0] || {};
  }

  private calculateMatchScore(userContext: any, partnership: Partnership): {
    score: number;
    reasons: string[];
    missingRequirements?: string[];
  } {
    let score = 0;
    const reasons: string[] = [];
    const missingRequirements: string[] = [];

    // SSE Score match
    const userSSEScore = userContext.overall_score || 0;
    if (userSSEScore >= partnership.sseThreshold) {
      score += 0.3;
      reasons.push(`Meets SSE threshold (${userSSEScore} >= ${partnership.sseThreshold})`);
    } else {
      missingRequirements.push(`SSE score below ${partnership.sseThreshold} (current: ${userSSEScore})`);
    }

    // Industry match
    if (partnership.industries.includes(userContext.industry)) {
      score += 0.2;
      reasons.push(`Industry match: ${userContext.industry}`);
    }

    // Stage match
    if (partnership.stages.includes(userContext.stage)) {
      score += 0.2;
      reasons.push(`Stage match: ${userContext.stage}`);
    }

    // Region match
    if (partnership.region.includes(userContext.region)) {
      score += 0.1;
      reasons.push(`Region match: ${userContext.region}`);
    }

    // Additional criteria based on requirements
    const requirements = partnership.requirements;

    if (requirements.employeeCount) {
      const userEmployees = userContext.employee_count || 0;
      if ((!requirements.employeeCount.min || userEmployees >= requirements.employeeCount.min) &&
          (!requirements.employeeCount.max || userEmployees <= requirements.employeeCount.max)) {
        score += 0.1;
        reasons.push('Employee count matches requirements');
      }
    }

    if (requirements.revenue) {
      const userRevenue = userContext.monthly_revenue || 0;
      if ((!requirements.revenue.min || userRevenue >= requirements.revenue.min) &&
          (!requirements.revenue.max || userRevenue <= requirements.revenue.max)) {
        score += 0.1;
        reasons.push('Revenue matches requirements');
      }
    }

    return { score: Math.min(score, 1), reasons, missingRequirements };
  }

  private calculatePotentialValue(partnership: Partnership): number {
    return partnership.benefits.reduce((total, benefit) => {
      return total + (benefit.value.estimatedValue || 0);
    }, 0);
  }

  private getTopCategories(matches: PartnershipMatch[]): PartnershipCategory[] {
    const categoryCount: Record<PartnershipCategory, number> = {} as any;

    matches.forEach(match => {
      categoryCount[match.partnership.category] = (categoryCount[match.partnership.category] || 0) + 1;
    });

    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category as PartnershipCategory);
  }

  private generatePersonalizedMessage(userContext: any, matches: PartnershipMatch[]): string {
    const userName = `${userContext.first_name || 'Entrepreneur'}`;
    const totalValue = matches.reduce((sum, match) => sum + match.potentialValue, 0);

    return `Hi ${userName}! Based on your ${userContext.industry || 'startup'} in the ${userContext.stage || 'current'} stage, we've found ${matches.length} partnership opportunities worth up to $${totalValue.toLocaleString()} in potential value. These partnerships align with your SSE score and business profile.`;
  }

  private generateRedemptionCode(): string {
    return 'AUX-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
}

export const partnershipService = new PartnershipService();
export default partnershipService;
