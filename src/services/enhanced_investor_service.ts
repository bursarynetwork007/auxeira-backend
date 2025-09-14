/**
 * Enhanced Investor Service with Tiered Access Control
 * Implements Tier 1 (Portfolio) vs Tier 2 (Deal Flow Discovery) functionality
 */

import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { VisibilityFilter } from './enhanced_access_control_middleware';

export interface TieredInvestorDashboard {
  tier1Data: {
    portfolioCompanies: PortfolioCompany[];
    portfolioPerformance: PortfolioMetrics;
    riskAlerts: RiskAlert[];
    lpReporting: LPReport[];
  };
  tier2Data?: {
    dealFlowOpportunities: DealFlowOpportunity[];
    marketIntelligence: MarketInsights;
    performanceRankings: StartupRanking[];
    discoveryFilters: DiscoveryFilters;
  };
  accessInfo: {
    currentTier: 'tier1' | 'tier2';
    subscriptionStatus: string;
    upgradeAvailable: boolean;
    tier2Benefits: string[];
  };
}

export interface DealFlowOpportunity {
  startupId: string;
  companyName: string;
  industry: string;
  stage: string;
  sseScore: number;
  fundingGoal: number;
  valuation: number;
  location: string;
  performanceTrend: 'improving' | 'stable' | 'declining';
  investorMatch: number; // 0-100 compatibility score
  lastUpdated: Date;
  optedInDate: Date;
}

export interface StartupRanking {
  startupId: string;
  companyName: string;
  sseScore: number;
  rank: number;
  industryRank: number;
  successProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendationStrength: 'weak' | 'moderate' | 'strong';
}

export class EnhancedInvestorService {

  /**
   * Get tiered investor dashboard based on access level
   */
  async getTieredDashboard(
    investorId: string,
    visibilityFilter: VisibilityFilter
  ): Promise<TieredInvestorDashboard> {
    try {
      // Always get Tier 1 data (portfolio companies)
      const tier1Data = await this.getTier1PortfolioData(investorId);

      // Get Tier 2 data only if investor has access
      let tier2Data = undefined;
      if (visibilityFilter.canAccessDealFlow) {
        tier2Data = await this.getTier2DealFlowData(investorId, visibilityFilter);
      }

      // Get access information
      const accessInfo = await this.getInvestorAccessInfo(investorId);

      return {
        tier1Data,
        tier2Data,
        accessInfo
      };

    } catch (error) {
      logger.error('Failed to get tiered dashboard', {
        error: (error as Error).message,
        investorId
      });
      throw error;
    }
  }

  /**
   * Tier 1: Portfolio Dashboard (Their Investees Only)
   */
  private async getTier1PortfolioData(investorId: string) {
    const portfolioQuery = `
      SELECT
        s.id as startup_id,
        s.company_name,
        s.industry,
        s.stage,
        sp.current_sse_score,
        sp.last_score_update,
        i.investment_amount,
        i.equity_percentage,
        i.investment_date,
        i.status as investment_status,
        -- Performance metrics
        sm.monthly_revenue,
        sm.burn_rate,
        sm.runway_months,
        sm.customer_count,
        sm.growth_rate,
        -- Risk indicators
        CASE
          WHEN sp.current_sse_score < 50 THEN 'high'
          WHEN sp.current_sse_score < 70 THEN 'medium'
          ELSE 'low'
        END as risk_level,
        -- Recent alerts
        (
          SELECT COUNT(*)
          FROM risk_alerts ra
          WHERE ra.startup_id = s.id
          AND ra.created_at > NOW() - INTERVAL '30 days'
          AND ra.severity IN ('high', 'critical')
        ) as recent_alerts
      FROM investments i
      JOIN startups s ON i.startup_id = s.id
      JOIN startup_profiles sp ON s.id = sp.startup_id
      LEFT JOIN startup_metrics sm ON s.id = sm.startup_id
        AND sm.month_year = DATE_TRUNC('month', CURRENT_DATE)
      WHERE i.investor_id = $1
        AND i.status = 'active'
      ORDER BY sp.current_sse_score DESC, i.investment_date DESC
    `;

    const portfolioResult = await pool.query(portfolioQuery, [investorId]);

    // Get portfolio performance summary
    const performanceQuery = `
      SELECT
        COUNT(*) as total_investments,
        SUM(i.investment_amount) as total_invested,
        AVG(sp.current_sse_score) as avg_sse_score,
        COUNT(CASE WHEN sp.current_sse_score >= 70 THEN 1 END) as high_performers,
        COUNT(CASE WHEN sp.current_sse_score < 50 THEN 1 END) as at_risk_companies,
        -- Portfolio IRR calculation (simplified)
        AVG(
          CASE
            WHEN s.current_valuation > 0 AND i.investment_amount > 0
            THEN ((s.current_valuation * i.equity_percentage / 100) - i.investment_amount) / i.investment_amount * 100
            ELSE 0
          END
        ) as estimated_irr
      FROM investments i
      JOIN startups s ON i.startup_id = s.id
      JOIN startup_profiles sp ON s.id = sp.startup_id
      WHERE i.investor_id = $1 AND i.status = 'active'
    `;

    const performanceResult = await pool.query(performanceQuery, [investorId]);

    // Get recent risk alerts
    const alertsQuery = `
      SELECT
        ra.id,
        ra.startup_id,
        s.company_name,
        ra.alert_type,
        ra.severity,
        ra.message,
        ra.created_at,
        ra.acknowledged
      FROM risk_alerts ra
      JOIN startups s ON ra.startup_id = s.id
      JOIN investments i ON s.id = i.startup_id
      WHERE i.investor_id = $1
        AND i.status = 'active'
        AND ra.created_at > NOW() - INTERVAL '90 days'
      ORDER BY ra.severity DESC, ra.created_at DESC
      LIMIT 20
    `;

    const alertsResult = await pool.query(alertsQuery, [investorId]);

    return {
      portfolioCompanies: portfolioResult.rows,
      portfolioPerformance: performanceResult.rows[0],
      riskAlerts: alertsResult.rows,
      lpReporting: await this.generateLPReporting(investorId)
    };
  }

  /**
   * Tier 2: Deal Flow Discovery (Broader Platform Access)
   */
  private async getTier2DealFlowData(investorId: string, visibilityFilter: VisibilityFilter) {
    // Get investor preferences for intelligent matching
    const preferencesQuery = `
      SELECT
        investment_focus,
        investment_range,
        geographic_preferences,
        industry_preferences,
        stage_preferences,
        investment_criteria
      FROM investor_profiles
      WHERE user_id = $1
    `;
    const preferencesResult = await pool.query(preferencesQuery, [investorId]);
    const preferences = preferencesResult.rows[0];

    // Get high-performing startups that opted in to investor visibility
    const dealFlowQuery = `
      SELECT
        s.id as startup_id,
        s.company_name,
        s.industry,
        s.stage,
        s.location,
        sp.current_sse_score,
        sp.visibility_level,
        sp.investor_visibility_enabled,
        so.funding_goal,
        so.current_valuation,
        so.equity_offered,
        so.minimum_investment,
        so.deadline,
        -- Performance trend calculation
        CASE
          WHEN sp.current_sse_score > sp.previous_sse_score THEN 'improving'
          WHEN sp.current_sse_score = sp.previous_sse_score THEN 'stable'
          ELSE 'declining'
        END as performance_trend,
        -- Calculate investor match score based on preferences
        (
          CASE WHEN s.industry = ANY(string_to_array($2, ',')) THEN 25 ELSE 0 END +
          CASE WHEN s.stage = ANY(string_to_array($3, ',')) THEN 25 ELSE 0 END +
          CASE WHEN s.location = ANY(string_to_array($4, ',')) THEN 20 ELSE 0 END +
          CASE WHEN so.funding_goal BETWEEN $5 AND $6 THEN 30 ELSE 0 END
        ) as investor_match_score,
        sp.last_score_update,
        sp.opted_in_date
      FROM startups s
      JOIN startup_profiles sp ON s.id = sp.startup_id
      LEFT JOIN startup_opportunities so ON s.id = so.startup_id AND so.status = 'active'
      WHERE sp.current_sse_score >= 70
        AND sp.investor_visibility_enabled = true
        AND sp.visibility_level IN ('qualified_investors', 'public')
        AND NOT EXISTS (
          SELECT 1 FROM investments i
          WHERE i.investor_id = $1 AND i.startup_id = s.id
        )
      ORDER BY sp.current_sse_score DESC, investor_match_score DESC
      LIMIT 50
    `;

    const dealFlowResult = await pool.query(dealFlowQuery, [
      investorId,
      preferences.industry_preferences?.join(',') || '',
      preferences.stage_preferences?.join(',') || '',
      preferences.geographic_preferences?.join(',') || '',
      preferences.investment_range?.minimum || 0,
      preferences.investment_range?.maximum || 999999999
    ]);

    // Get market intelligence
    const marketIntelligence = await this.getMarketIntelligence(preferences);

    // Get performance rankings
    const rankingsQuery = `
      SELECT
        s.id as startup_id,
        s.company_name,
        sp.current_sse_score,
        ROW_NUMBER() OVER (ORDER BY sp.current_sse_score DESC) as rank,
        ROW_NUMBER() OVER (PARTITION BY s.industry ORDER BY sp.current_sse_score DESC) as industry_rank,
        -- Success probability based on SSE score and historical data
        CASE
          WHEN sp.current_sse_score >= 85 THEN 0.75
          WHEN sp.current_sse_score >= 70 THEN 0.55
          WHEN sp.current_sse_score >= 50 THEN 0.35
          ELSE 0.15
        END as success_probability,
        CASE
          WHEN sp.current_sse_score >= 70 THEN 'low'
          WHEN sp.current_sse_score >= 50 THEN 'medium'
          ELSE 'high'
        END as risk_level
      FROM startups s
      JOIN startup_profiles sp ON s.id = sp.startup_id
      WHERE sp.investor_visibility_enabled = true
        AND sp.current_sse_score >= 70
      ORDER BY sp.current_sse_score DESC
      LIMIT 100
    `;

    const rankingsResult = await pool.query(rankingsQuery);

    return {
      dealFlowOpportunities: dealFlowResult.rows,
      marketIntelligence,
      performanceRankings: rankingsResult.rows,
      discoveryFilters: this.getDiscoveryFilters(preferences)
    };
  }

  /**
   * Get investor access information and upgrade options
   */
  private async getInvestorAccessInfo(investorId: string) {
    const accessQuery = `
      SELECT
        ip.investor_tier,
        ip.subscription_status,
        ip.tier2_access_expires_at,
        ip.deal_flow_access_enabled
      FROM investor_profiles ip
      WHERE ip.user_id = $1
    `;

    const accessResult = await pool.query(accessQuery, [investorId]);
    const accessData = accessResult.rows[0];

    const tier2Benefits = [
      "Access to 500+ high-performing startups (SSE >70)",
      "AI-powered startup rankings and success predictions",
      "Advanced filtering by performance metrics",
      "Early access to funding opportunities",
      "Market intelligence and trend analysis",
      "Automated deal flow notifications",
      "Performance-based startup recommendations"
    ];

    return {
      currentTier: accessData?.investor_tier || 'tier1',
      subscriptionStatus: accessData?.subscription_status || 'inactive',
      upgradeAvailable: accessData?.investor_tier !== 'tier2',
      tier2Benefits
    };
  }

  /**
   * Upgrade investor to Tier 2 access
   */
  async upgradeTier2Access(investorId: string, subscriptionData: any) {
    try {
      const updateQuery = `
        UPDATE investor_profiles
        SET
          investor_tier = 'tier2',
          subscription_status = 'active',
          tier2_access_expires_at = $2,
          deal_flow_access_enabled = true,
          updated_at = NOW()
        WHERE user_id = $1
      `;

      // Set expiration to 1 year from now
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);

      await pool.query(updateQuery, [investorId, expirationDate]);

      // Log the upgrade
      logger.info('Investor upgraded to Tier 2', {
        investorId,
        expirationDate,
        subscriptionData
      });

      return {
        success: true,
        message: 'Successfully upgraded to Tier 2 access',
        tier: 'tier2',
        expiresAt: expirationDate
      };

    } catch (error) {
      logger.error('Failed to upgrade investor tier', {
        error: (error as Error).message,
        investorId
      });
      throw error;
    }
  }

  /**
   * Get market intelligence for Tier 2 investors
   */
  private async getMarketIntelligence(preferences: any) {
    // This would include sector performance analytics, benchmark reports, etc.
    const marketQuery = `
      SELECT
        industry,
        AVG(current_sse_score) as avg_sse_score,
        COUNT(*) as startup_count,
        COUNT(CASE WHEN current_sse_score >= 70 THEN 1 END) as high_performers,
        AVG(CASE WHEN funding_raised > 0 THEN funding_raised END) as avg_funding
      FROM startups s
      JOIN startup_profiles sp ON s.id = sp.startup_id
      WHERE sp.investor_visibility_enabled = true
      GROUP BY industry
      ORDER BY avg_sse_score DESC
    `;

    const marketResult = await pool.query(marketQuery);

    return {
      sectorPerformance: marketResult.rows,
      totalVisibleStartups: marketResult.rows.reduce((sum, row) => sum + row.startup_count, 0),
      averageSSEScore: marketResult.rows.reduce((sum, row) => sum + row.avg_sse_score, 0) / marketResult.rows.length,
      topPerformingSectors: marketResult.rows.slice(0, 5)
    };
  }

  /**
   * Generate LP reporting data
   */
  private async generateLPReporting(investorId: string) {
    // Implementation for automated LP reporting
    const reportQuery = `
      SELECT
        DATE_TRUNC('quarter', i.investment_date) as quarter,
        COUNT(*) as investments_made,
        SUM(i.investment_amount) as total_invested,
        AVG(sp.current_sse_score) as avg_portfolio_sse,
        COUNT(CASE WHEN sp.current_sse_score >= 70 THEN 1 END) as high_performers
      FROM investments i
      JOIN startups s ON i.startup_id = s.id
      JOIN startup_profiles sp ON s.id = sp.startup_id
      WHERE i.investor_id = $1 AND i.status = 'active'
      GROUP BY DATE_TRUNC('quarter', i.investment_date)
      ORDER BY quarter DESC
      LIMIT 8
    `;

    const reportResult = await pool.query(reportQuery, [investorId]);
    return reportResult.rows;
  }

  /**
   * Get discovery filters for Tier 2 interface
   */
  private getDiscoveryFilters(preferences: any) {
    return {
      industries: preferences.industry_preferences || [],
      stages: preferences.stage_preferences || [],
      locations: preferences.geographic_preferences || [],
      sseScoreRange: { min: 70, max: 100 },
      fundingRange: preferences.investment_range || { min: 0, max: 10000000 },
      performanceTrends: ['improving', 'stable'],
      riskLevels: ['low', 'medium']
    };
  }
}

export const enhancedInvestorService = new EnhancedInvestorService();
