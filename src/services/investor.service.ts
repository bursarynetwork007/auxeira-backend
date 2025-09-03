/**
 * Investor Dashboard Service
 * Handles investor profiles, investment opportunities, and portfolio management
 * Enhanced with statistical insights from the SSE efficacy analysis
 */

import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';
import {
  InvestorProfile,
  InvestmentOpportunity,
  InvestmentInterest,
  InvestmentTransaction,
  PortfolioCompany,
  CreateInvestorProfileRequest,
  UpdateInvestorProfileRequest,
  CreateOpportunityRequest,
  UpdateOpportunityRequest,
  ExpressInterestRequest,
  UpdateInterestRequest,
  GetOpportunitiesRequest,
  GetInvestorsRequest,
  InvestorDashboardResponse,
  StartupInvestorResponse,
  InvestorAnalytics,
  OpportunityAnalytics,
  InvestorType,
  StartupStage,
  OpportunityStatus,
  InterestLevel,
  RiskLevel
} from '../types/investor.types';

export class InvestorDashboardService {
  // SSE Platform efficacy metrics from the evaluation study
  private readonly SSE_SUCCESS_RATE = 0.356; // 35.6% vs 15.2% control
  private readonly SSE_ODDS_RATIO = 3.09; // Treatment effectiveness
  private readonly SSE_HAZARD_RATIO = 0.68; // 32% failure risk reduction
  private readonly SSE_LOSS_RATE_IMPROVEMENT = 0.32; // 32% improvement in loss rate

  /**
   * Create investor profile
   */
  async createInvestorProfile(
    userId: string,
    request: CreateInvestorProfileRequest
  ): Promise<InvestorProfile> {
    const timer = performanceTimer('investor_dashboard_create_profile');

    try {
      // Check if profile already exists
      const existingQuery = 'SELECT id FROM investor_profiles WHERE user_id = $1';
      const existingResult = await pool.query(existingQuery, [userId]);

      if (existingResult.rows.length > 0) {
        throw new Error('Investor profile already exists');
      }

      const query = `
        INSERT INTO investor_profiles (
          id, user_id, investor_type, investment_focus, investment_range,
          portfolio_size, total_invested, successful_exits, investment_criteria,
          geographic_preferences, industry_preferences, stage_preferences,
          is_active, is_verified, verification_documents, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()
        ) RETURNING *
      `;

      const result = await pool.query(query, [
        userId,
        request.investorType,
        JSON.stringify(request.investmentFocus),
        JSON.stringify(request.investmentRange),
        0, // portfolio_size
        0, // total_invested
        0, // successful_exits
        JSON.stringify(request.investmentCriteria),
        JSON.stringify(request.geographicPreferences),
        JSON.stringify(request.industryPreferences),
        JSON.stringify(request.stagePreferences),
        true, // is_active
        false, // is_verified
        JSON.stringify([]) // verification_documents
      ]);

      const profile = this.mapInvestorProfileFromDB(result.rows[0]);

      timer.end();

      logger.info('Investor profile created', {
        userId,
        investorType: request.investorType
      });

      return profile;

    } catch (error) {
      timer.end();
      logger.error('Failed to create investor profile', {
        error: (error as Error).message,
        userId
      });
      throw error;
    }
  }

  /**
   * Get investment opportunities with SSE-enhanced risk assessment
   */
  async getInvestmentOpportunities(
    investorId: string,
    request: GetOpportunitiesRequest
  ): Promise<{
    opportunities: InvestmentOpportunity[];
    total: number;
    hasMore: boolean;
    sseInsights: {
      averageSuccessRate: number;
      riskReduction: number;
      recommendedOpportunities: string[];
    };
  }> {
    const timer = performanceTimer('investor_dashboard_get_opportunities');

    try {
      // Get investor preferences
      const investor = await this.getInvestorProfile(investorId);
      if (!investor) {
        throw new Error('Investor profile not found');
      }

      let whereClause = 'WHERE o.status = \'active\'';
      const params: any[] = [];
      let paramCount = 0;

      // Apply filters based on request
      if (request.stage) {
        whereClause += ` AND o.stage = $${++paramCount}`;
        params.push(request.stage);
      }

      if (request.industry) {
        whereClause += ` AND o.industry = $${++paramCount}`;
        params.push(request.industry);
      }

      if (request.region) {
        whereClause += ` AND o.region = $${++paramCount}`;
        params.push(request.region);
      }

      if (request.minFunding) {
        whereClause += ` AND o.funding_goal >= $${++paramCount}`;
        params.push(request.minFunding);
      }

      if (request.maxFunding) {
        whereClause += ` AND o.funding_goal <= $${++paramCount}`;
        params.push(request.maxFunding);
      }

      if (request.minSSEScore) {
        whereClause += ` AND o.sse_score >= $${++paramCount}`;
        params.push(request.minSSEScore);
      }

      if (request.investmentType) {
        whereClause += ` AND o.investment_type = $${++paramCount}`;
        params.push(request.investmentType);
      }

      if (request.featured) {
        whereClause += ` AND o.is_featured = $${++paramCount}`;
        params.push(request.featured);
      }

      // Apply investor preferences
      if (investor.investmentCriteria.minimumSSEScore) {
        whereClause += ` AND o.sse_score >= $${++paramCount}`;
        params.push(investor.investmentCriteria.minimumSSEScore);
      }

      if (investor.investmentRange.minimum) {
        whereClause += ` AND o.minimum_investment >= $${++paramCount}`;
        params.push(investor.investmentRange.minimum);
      }

      if (investor.investmentRange.maximum) {
        whereClause += ` AND o.maximum_investment <= $${++paramCount}`;
        params.push(investor.investmentRange.maximum);
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*)
        FROM investment_opportunities o
        JOIN users u ON o.startup_id = u.id
        ${whereClause}
      `;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Get opportunities with enhanced data
      const sortBy = request.sortBy || 'created_at';
      const sortOrder = request.sortOrder || 'desc';
      const limit = Math.min(request.limit || 20, 100);
      const offset = request.offset || 0;

      const query = `
        SELECT
          o.*,
          u.name as startup_name,
          u.logo_url as startup_logo,
          COALESCE(
            (SELECT COUNT(*) FROM investment_interests WHERE opportunity_id = o.id),
            0
          ) as interest_count,
          COALESCE(
            (SELECT AVG(investment_amount) FROM investment_interests WHERE opportunity_id = o.id AND investment_amount IS NOT NULL),
            0
          ) as average_interest_amount
        FROM investment_opportunities o
        JOIN users u ON o.startup_id = u.id
        ${whereClause}
        ORDER BY ${this.getSortColumn(sortBy)} ${sortOrder.toUpperCase()}
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;

      params.push(limit, offset);

      const result = await pool.query(query, params);
      const opportunities = result.rows.map(row => this.mapOpportunityFromDB(row));

      // Calculate SSE-enhanced insights
      const sseInsights = await this.calculateSSEInsights(opportunities);

      timer.end();

      return {
        opportunities,
        total,
        hasMore: offset + opportunities.length < total,
        sseInsights
      };

    } catch (error) {
      timer.end();
      logger.error('Failed to get investment opportunities', {
        error: (error as Error).message,
        investorId
      });
      throw new Error('Failed to get investment opportunities');
    }
  }

  /**
   * Express interest in an investment opportunity
   */
  async expressInterest(
    investorId: string,
    request: ExpressInterestRequest
  ): Promise<InvestmentInterest> {
    const timer = performanceTimer('investor_dashboard_express_interest');

    try {
      // Check if interest already exists
      const existingQuery = `
        SELECT id FROM investment_interests
        WHERE investor_id = $1 AND opportunity_id = $2
      `;
      const existingResult = await pool.query(existingQuery, [investorId, request.opportunityId]);

      if (existingResult.rows.length > 0) {
        throw new Error('Interest already expressed for this opportunity');
      }

      // Verify opportunity exists and is active
      const opportunityQuery = `
        SELECT id, status, minimum_investment, maximum_investment
        FROM investment_opportunities
        WHERE id = $1 AND status = 'active'
      `;
      const opportunityResult = await pool.query(opportunityQuery, [request.opportunityId]);

      if (opportunityResult.rows.length === 0) {
        throw new Error('Investment opportunity not found or inactive');
      }

      const opportunity = opportunityResult.rows[0];

      // Validate investment amount
      if (request.investmentAmount) {
        if (request.investmentAmount < opportunity.minimum_investment) {
          throw new Error(`Investment amount below minimum of $${opportunity.minimum_investment}`);
        }
        if (opportunity.maximum_investment && request.investmentAmount > opportunity.maximum_investment) {
          throw new Error(`Investment amount exceeds maximum of $${opportunity.maximum_investment}`);
        }
      }

      const query = `
        INSERT INTO investment_interests (
          id, investor_id, opportunity_id, interest_level, investment_amount,
          message, status, due_diligence_status, meeting_scheduled, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, 'pending', 'not_started', false, NOW()
        ) RETURNING *
      `;

      const result = await pool.query(query, [
        investorId,
        request.opportunityId,
        request.interestLevel,
        request.investmentAmount,
        request.message
      ]);

      const interest = this.mapInterestFromDB(result.rows[0]);

      // Update opportunity metrics
      await this.updateOpportunityMetrics(request.opportunityId);

      timer.end();

      logger.info('Investment interest expressed', {
        investorId,
        opportunityId: request.opportunityId,
        interestLevel: request.interestLevel
      });

      return interest;

    } catch (error) {
      timer.end();
      logger.error('Failed to express interest', {
        error: (error as Error).message,
        investorId,
        request
      });
      throw error;
    }
  }

  /**
   * Get investor dashboard with SSE-enhanced analytics
   */
  async getInvestorDashboard(investorId: string): Promise<InvestorDashboardResponse> {
    const timer = performanceTimer('investor_dashboard_get_dashboard');

    try {
      // Get investor profile
      const profile = await this.getInvestorProfile(investorId);
      if (!profile) {
        throw new Error('Investor profile not found');
      }

      // Get recommended opportunities (SSE-enhanced)
      const recommendedOpportunities = await this.getRecommendedOpportunities(investorId, 10);

      // Get watching opportunities
      const watchingOpportunities = await this.getWatchingOpportunities(investorId, 5);

      // Get applied opportunities
      const appliedOpportunities = await this.getAppliedOpportunities(investorId, 5);

      // Get portfolio companies
      const portfolioCompanies = await this.getPortfolioCompanies(investorId);

      // Get active interests
      const interests = await this.getActiveInterests(investorId);

      // Calculate analytics with SSE insights
      const analytics = await this.calculateInvestorAnalytics(investorId);

      // Get notifications
      const notifications = await this.getInvestorNotifications(investorId, 10);

      // Calculate portfolio performance with SSE enhancement
      const portfolioValue = portfolioCompanies.reduce((sum, company) =>
        sum + (company.currentValuation || company.investmentAmount), 0
      );

      const totalROI = portfolioCompanies.reduce((sum, company) =>
        sum + (company.roi || 0), 0
      ) / Math.max(portfolioCompanies.length, 1);

      // Enhanced performance summary with SSE insights
      const performanceSummary = {
        currentValuation: portfolioValue,
        valuationChange: analytics.roiMetrics.unrealized,
        revenueGrowth: 0, // Would be calculated from portfolio companies
        userGrowth: 0, // Would be calculated from portfolio companies
        sseScoreChange: 0, // Average SSE score improvement across portfolio
        milestoneCompletion: 0, // Percentage of milestones completed
        riskScore: analytics.riskMetrics.portfolioRisk,
        healthScore: this.calculatePortfolioHealthScore(portfolioCompanies),
        sseEnhancedMetrics: {
          expectedSuccessRate: this.calculateSSEEnhancedSuccessRate(portfolioCompanies),
          riskReduction: this.SSE_LOSS_RATE_IMPROVEMENT,
          projectedROI: this.calculateSSEEnhancedROI(analytics.roiMetrics.total)
        },
        lastUpdated: new Date()
      };

      timer.end();

      return {
        profile,
        opportunities: {
          recommended: recommendedOpportunities,
          watching: watchingOpportunities,
          applied: appliedOpportunities,
          total: recommendedOpportunities.length + watchingOpportunities.length + appliedOpportunities.length
        },
        portfolio: {
          companies: portfolioCompanies,
          totalValue: portfolioValue,
          totalROI,
          performanceSummary
        },
        interests,
        analytics,
        notifications
      };

    } catch (error) {
      timer.end();
      logger.error('Failed to get investor dashboard', {
        error: (error as Error).message,
        investorId
      });
      throw new Error('Failed to get investor dashboard');
    }
  }

  /**
   * Get startup investor view with SSE insights
   */
  async getStartupInvestorView(startupId: string): Promise<StartupInvestorResponse> {
    const timer = performanceTimer('investor_dashboard_startup_view');

    try {
      // Get opportunity details
      const opportunityQuery = `
        SELECT o.*, u.name as startup_name, u.logo_url as startup_logo
        FROM investment_opportunities o
        JOIN users u ON o.startup_id = u.id
        WHERE o.startup_id = $1 AND o.status = 'active'
        ORDER BY o.created_at DESC
        LIMIT 1
      `;

      const opportunityResult = await pool.query(opportunityQuery, [startupId]);

      if (opportunityResult.rows.length === 0) {
        throw new Error('No active investment opportunity found for this startup');
      }

      const opportunity = this.mapOpportunityFromDB(opportunityResult.rows[0]);

      // Get interest statistics
      const interestStatsQuery = `
        SELECT
          COUNT(*) as total_interests,
          COUNT(CASE WHEN interest_level = 'watching' THEN 1 END) as watching,
          COUNT(CASE WHEN interest_level = 'interested' THEN 1 END) as interested,
          COUNT(CASE WHEN interest_level = 'very_interested' THEN 1 END) as very_interested,
          COUNT(CASE WHEN interest_level = 'ready_to_invest' THEN 1 END) as ready_to_invest
        FROM investment_interests
        WHERE opportunity_id = $1
      `;

      const interestStatsResult = await pool.query(interestStatsQuery, [opportunity.id]);
      const interestStats = interestStatsResult.rows[0];

      // Get recent interests
      const recentInterestsQuery = `
        SELECT ii.*, ip.investor_type, u.name as investor_name
        FROM investment_interests ii
        JOIN investor_profiles ip ON ii.investor_id = ip.id
        JOIN users u ON ip.user_id = u.id
        WHERE ii.opportunity_id = $1
        ORDER BY ii.created_at DESC
        LIMIT 10
      `;

      const recentInterestsResult = await pool.query(recentInterestsQuery, [opportunity.id]);
      const recentInterests = recentInterestsResult.rows.map(row => this.mapInterestFromDB(row));

      // Get matched investors with SSE-enhanced scoring
      const matchedInvestors = await this.getMatchedInvestors(opportunity, 20);

      // Calculate opportunity analytics with SSE insights
      const analytics = await this.calculateOpportunityAnalytics(opportunity.id);

      timer.end();

      return {
        opportunity,
        interests: {
          total: parseInt(interestStats.total_interests),
          byLevel: {
            watching: parseInt(interestStats.watching),
            interested: parseInt(interestStats.interested),
            very_interested: parseInt(interestStats.very_interested),
            ready_to_invest: parseInt(interestStats.ready_to_invest)
          },
          recent: recentInterests
        },
        matchedInvestors,
        analytics
      };

    } catch (error) {
      timer.end();
      logger.error('Failed to get startup investor view', {
        error: (error as Error).message,
        startupId
      });
      throw new Error('Failed to get startup investor view');
    }
  }

  /**
   * Calculate SSE-enhanced investment recommendations
   */
  async getRecommendedOpportunities(
    investorId: string,
    limit: number = 10
  ): Promise<InvestmentOpportunity[]> {
    const timer = performanceTimer('investor_dashboard_recommendations');

    try {
      const investor = await this.getInvestorProfile(investorId);
      if (!investor) {
        return [];
      }

      // Enhanced recommendation query with SSE scoring
      const query = `
        SELECT
          o.*,
          u.name as startup_name,
          u.logo_url as startup_logo,
          -- SSE-enhanced scoring algorithm
          (
            CASE
              WHEN o.sse_score >= 80 THEN 100
              WHEN o.sse_score >= 70 THEN 85
              WHEN o.sse_score >= 60 THEN 70
              ELSE 50
            END +
            CASE
              WHEN o.stage = ANY($1) THEN 20 ELSE 0
            END +
            CASE
              WHEN o.industry = ANY($2) THEN 15 ELSE 0
            END +
            CASE
              WHEN o.region = ANY($3) THEN 10 ELSE 0
            END +
            CASE
              WHEN o.minimum_investment BETWEEN $4 AND $5 THEN 15 ELSE 0
            END
          ) as recommendation_score
        FROM investment_opportunities o
        JOIN users u ON o.startup_id = u.id
        WHERE o.status = 'active'
        AND o.sse_score >= COALESCE($6, 0)
        AND o.minimum_investment >= $7
        AND o.maximum_investment <= $8
        AND o.id NOT IN (
          SELECT opportunity_id FROM investment_interests WHERE investor_id = $9
        )
        ORDER BY recommendation_score DESC, o.sse_score DESC
        LIMIT $10
      `;

      const result = await pool.query(query, [
        investor.stagePreferences,
        investor.industryPreferences,
        investor.geographicPreferences,
        investor.investmentRange.minimum,
        investor.investmentRange.maximum,
        investor.investmentCriteria.minimumSSEScore || 0,
        investor.investmentRange.minimum,
        investor.investmentRange.maximum,
        investorId,
        limit
      ]);

      const opportunities = result.rows.map(row => {
        const opportunity = this.mapOpportunityFromDB(row);
        // Add SSE-enhanced risk assessment
        opportunity.riskAssessment = this.enhanceRiskAssessmentWithSSE(opportunity.riskAssessment, row.sse_score);
        return opportunity;
      });

      timer.end();
      return opportunities;

    } catch (error) {
      timer.end();
      logger.error('Failed to get recommended opportunities', {
        error: (error as Error).message,
        investorId
      });
      return [];
    }
  }

  /**
   * Calculate portfolio performance with SSE enhancement
   */
  async calculatePortfolioPerformance(investorId: string): Promise<{
    traditional: InvestorAnalytics;
    sseEnhanced: {
      projectedSuccessRate: number;
      riskAdjustedReturns: number;
      portfolioOptimization: string[];
      benchmarkComparison: {
        vsTraditionalVC: number;
        vsSSEEnhanced: number;
        improvementPotential: number;
      };
    };
  }> {
    const timer = performanceTimer('investor_dashboard_portfolio_performance');

    try {
      // Get traditional analytics
      const traditional = await this.calculateInvestorAnalytics(investorId);

      // Get portfolio companies for SSE analysis
      const portfolioCompanies = await this.getPortfolioCompanies(investorId);

      // Calculate SSE-enhanced metrics
      const avgSSEScore = portfolioCompanies.reduce((sum, company) =>
        sum + (company.performanceMetrics.sseScoreChange || 0), 0
      ) / Math.max(portfolioCompanies.length, 1);

      // Apply SSE efficacy model to calculate enhanced projections
      const baseSuccessRate = 0.152; // Control group success rate
      const sseSuccessRate = 0.356; // SSE-enhanced success rate
      const portfolioSSEScore = Math.max(avgSSEScore, 50); // Minimum baseline

      // Calculate projected success rate based on portfolio SSE scores
      const projectedSuccessRate = baseSuccessRate +
        ((sseSuccessRate - baseSuccessRate) * (portfolioSSEScore / 100));

      // Risk-adjusted returns calculation
      const riskReduction = this.SSE_LOSS_RATE_IMPROVEMENT;
      const riskAdjustedReturns = traditional.roiMetrics.total * (1 + riskReduction);

      // Portfolio optimization recommendations
      const portfolioOptimization = this.generatePortfolioOptimizationRecommendations(
        portfolioCompanies,
        avgSSEScore
      );

      // Benchmark comparison
      const traditionalVCLossRate = 0.65; // 65% loss rate for traditional VC
      const sseEnhancedLossRate = 0.43; // 43% projected loss rate with SSE
      const improvementPotential = (traditionalVCLossRate - sseEnhancedLossRate) / traditionalVCLossRate;

      timer.end();

      return {
        traditional,
        sseEnhanced: {
          projectedSuccessRate,
          riskAdjustedReturns,
          portfolioOptimization,
          benchmarkComparison: {
            vsTraditionalVC: traditional.roiMetrics.total,
            vsSSEEnhanced: riskAdjustedReturns,
            improvementPotential
          }
        }
      };

    } catch (error) {
      timer.end();
      logger.error('Failed to calculate portfolio performance', {
        error: (error as Error).message,
        investorId
      });
      throw new Error('Failed to calculate portfolio performance');
    }
  }

  // Private helper methods
  private async getInvestorProfile(investorId: string): Promise<InvestorProfile | null> {
    const query = 'SELECT * FROM investor_profiles WHERE id = $1';
    const result = await pool.query(query, [investorId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapInvestorProfileFromDB(result.rows[0]);
  }

  private async calculateSSEInsights(opportunities: InvestmentOpportunity[]): Promise<{
    averageSuccessRate: number;
    riskReduction: number;
    recommendedOpportunities: string[];
  }> {
    // Calculate average success rate with SSE enhancement
    const avgSSEScore = opportunities.reduce((sum, opp) => sum + opp.sseScore, 0) / opportunities.length;
    const baseSuccessRate = 0.152;
    const maxSuccessRate = 0.356;

    const averageSuccessRate = baseSuccessRate +
      ((maxSuccessRate - baseSuccessRate) * (avgSSEScore / 100));

    // Identify top SSE-scored opportunities
    const recommendedOpportunities = opportunities
      .filter(opp => opp.sseScore >= 70)
      .sort((a, b) => b.sseScore - a.sseScore)
      .slice(0, 5)
      .map(opp => opp.id);

    return {
      averageSuccessRate,
      riskReduction: this.SSE_LOSS_RATE_IMPROVEMENT,
      recommendedOpportunities
    };
  }

  private enhanceRiskAssessmentWithSSE(
    originalRisk: any,
    sseScore: number
  ): any {
    // Apply SSE risk reduction model
    const sseRiskMultiplier = sseScore >= 80 ? 0.5 :
                             sseScore >= 70 ? 0.68 :
                             sseScore >= 60 ? 0.85 : 1.0;

    return {
      ...originalRisk,
      overallRisk: this.adjustRiskLevel(originalRisk.overallRisk, sseRiskMultiplier),
      riskScore: Math.max(0.1, (originalRisk.riskScore || 0.5) * sseRiskMultiplier),
      sseEnhancement: {
        originalRiskScore: originalRisk.riskScore || 0.5,
        sseMultiplier: sseRiskMultiplier,
        adjustedRiskScore: Math.max(0.1, (originalRisk.riskScore || 0.5) * sseRiskMultiplier),
        riskReductionPercentage: (1 - sseRiskMultiplier) * 100
      }
    };
  }

  private adjustRiskLevel(originalLevel: RiskLevel, multiplier: number): RiskLevel {
    const riskLevels: RiskLevel[] = ['very_low', 'low', 'medium', 'high', 'very_high'];
    const currentIndex = riskLevels.indexOf(originalLevel);
    const adjustedIndex = Math.max(0, Math.min(4,
      Math.round(currentIndex * multiplier)
    ));
    return riskLevels[adjustedIndex] || originalLevel; // Fallback to original level
  }

  private calculateSSEEnhancedSuccessRate(portfolioCompanies: PortfolioCompany[]): number {
    if (portfolioCompanies.length === 0) return this.SSE_SUCCESS_RATE;

    const avgSSEScore = portfolioCompanies.reduce((sum, company) => {
      // Estimate SSE score from performance metrics
      const healthScore = company.performanceMetrics.healthScore || 50;
      return sum + healthScore;
    }, 0) / portfolioCompanies.length;

    // Apply SSE efficacy model
    const baseRate = 0.152;
    const maxRate = 0.356;
    return baseRate + ((maxRate - baseRate) * (avgSSEScore / 100));
  }

  private calculateSSEEnhancedROI(currentROI: number): number {
    // Apply 32% risk reduction to improve expected returns
    return currentROI * (1 + this.SSE_LOSS_RATE_IMPROVEMENT);
  }

  private calculatePortfolioHealthScore(portfolioCompanies: PortfolioCompany[]): number {
    if (portfolioCompanies.length === 0) return 0;

    return portfolioCompanies.reduce((sum, company) =>
      sum + (company.performanceMetrics.healthScore || 50), 0
    ) / portfolioCompanies.length;
  }

  private generatePortfolioOptimizationRecommendations(
    portfolioCompanies: PortfolioCompany[],
    avgSSEScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (avgSSEScore < 60) {
      recommendations.push('Focus on startups with SSE scores above 70 for better risk-adjusted returns');
      recommendations.push('Consider SSE coaching programs for existing portfolio companies');
    }

    if (portfolioCompanies.length < 10) {
      recommendations.push('Diversify portfolio to reduce concentration risk');
    }

    const atRiskCompanies = portfolioCompanies.filter(c =>
      c.performanceMetrics.healthScore < 50
    ).length;

    if (atRiskCompanies > portfolioCompanies.length * 0.3) {
      recommendations.push('High concentration of at-risk companies - consider intervention strategies');
    }

    recommendations.push('Leverage SSE platform insights for due diligence enhancement');

    return recommendations;
  }

  private getSortColumn(sortBy: string): string {
    const sortMap: Record<string, string> = {
      'created_at': 'o.created_at',
      'funding_goal': 'o.funding_goal',
      'sse_score': 'o.sse_score',
      'deadline': 'o.deadline'
    };
    return sortMap[sortBy] || 'o.created_at';
  }

  // Additional helper methods would be implemented here
  private async getWatchingOpportunities(investorId: string, limit: number): Promise<InvestmentOpportunity[]> {
    // Implementation for getting watching opportunities
    return [];
  }

  private async getAppliedOpportunities(investorId: string, limit: number): Promise<InvestmentOpportunity[]> {
    // Implementation for getting applied opportunities
    return [];
  }

  private async getPortfolioCompanies(investorId: string): Promise<PortfolioCompany[]> {
    // Implementation for getting portfolio companies
    return [];
  }

  private async getActiveInterests(investorId: string): Promise<InvestmentInterest[]> {
    // Implementation for getting active interests
    return [];
  }

  private async calculateInvestorAnalytics(investorId: string): Promise<InvestorAnalytics> {
    // Implementation for calculating investor analytics
    return {} as InvestorAnalytics;
  }

  private async getInvestorNotifications(investorId: string, limit: number): Promise<any[]> {
    // Implementation for getting investor notifications
    return [];
  }

  private async getMatchedInvestors(opportunity: InvestmentOpportunity, limit: number): Promise<any[]> {
    // Implementation for getting matched investors
    return [];
  }

  private async calculateOpportunityAnalytics(opportunityId: string): Promise<OpportunityAnalytics> {
    // Implementation for calculating opportunity analytics
    return {} as OpportunityAnalytics;
  }

  private async updateOpportunityMetrics(opportunityId: string): Promise<void> {
    // Implementation for updating opportunity metrics
  }

  private mapInvestorProfileFromDB(row: any): InvestorProfile {
    return {
      id: row.id,
      userId: row.user_id,
      investorType: row.investor_type,
      investmentFocus: JSON.parse(row.investment_focus || '[]'),
      investmentRange: JSON.parse(row.investment_range || '{}'),
      portfolioSize: row.portfolio_size,
      totalInvested: row.total_invested,
      successfulExits: row.successful_exits,
      investmentCriteria: JSON.parse(row.investment_criteria || '{}'),
      geographicPreferences: JSON.parse(row.geographic_preferences || '[]'),
      industryPreferences: JSON.parse(row.industry_preferences || '[]'),
      stagePreferences: JSON.parse(row.stage_preferences || '[]'),
      isActive: row.is_active,
      isVerified: row.is_verified,
      verificationDocuments: JSON.parse(row.verification_documents || '[]'),
      performanceMetrics: {} as any, // Would be calculated
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapOpportunityFromDB(row: any): InvestmentOpportunity {
    return {
      id: row.id,
      startupId: row.startup_id,
      startupName: row.startup_name || '',
      startupLogo: row.startup_logo,
      title: row.title,
      description: row.description,
      fundingGoal: row.funding_goal,
      fundingRaised: row.funding_raised,
      valuation: row.valuation,
      equityOffered: row.equity_offered,
      minimumInvestment: row.minimum_investment,
      maximumInvestment: row.maximum_investment,
      investmentType: row.investment_type,
      stage: row.stage,
      industry: row.industry,
      region: row.region,
      sseScore: row.sse_score,
      riskAssessment: JSON.parse(row.risk_assessment || '{}'),
      financialProjections: JSON.parse(row.financial_projections || '{}'),
      documents: JSON.parse(row.documents || '[]'),
      status: row.status,
      isFeatured: row.is_featured,
      deadline: row.deadline,
      metrics: {
        viewCount: row.view_count || 0,
        interestCount: row.interest_count || 0,
        applicationCount: row.application_count || 0,
        conversionRate: 0,
        averageInvestmentSize: row.average_interest_amount || 0,
        timeToClose: 0,
        investorQuality: 0,
        lastUpdated: new Date()
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapInterestFromDB(row: any): InvestmentInterest {
    return {
      id: row.id,
      investorId: row.investor_id,
      opportunityId: row.opportunity_id,
      interestLevel: row.interest_level,
      investmentAmount: row.investment_amount,
      message: row.message,
      status: row.status,
      dueDiligenceStatus: row.due_diligence_status,
      dueDiligenceNotes: row.due_diligence_notes,
      meetingScheduled: row.meeting_scheduled,
      meetingDate: row.meeting_date,
      decisionDate: row.decision_date,
      decision: row.decision,
      decisionNotes: row.decision_notes,
      timeline: {
        expressed: row.created_at,
        // Other timeline events would be populated from additional queries
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const investorDashboardService = new InvestorDashboardService();
export default investorDashboardService;