/**
 * Startup Visibility Controller
 * Implements performance-driven visibility controls and opt-in system
 */

import { Request, Response } from 'express';
import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { EnhancedAuthenticatedRequest } from './enhanced_access_control_middleware';

export interface StartupVisibilitySettings {
  visibilityLevel: 'private' | 'portfolio_only' | 'qualified_investors' | 'public';
  investorVisibilityEnabled: boolean;
  performanceThresholdMet: boolean;
  sseScore: number;
  eligibleForUpgrade: boolean;
  visibilityBenefits: string[];
  privacyControls: PrivacyControl[];
}

export interface PrivacyControl {
  controlType: 'investor_type' | 'geographic_region' | 'investment_stage' | 'industry_focus';
  allowedValues: string[];
  description: string;
}

export class StartupVisibilityController {

  /**
   * Get current visibility settings and eligibility
   */
  async getVisibilitySettings(req: EnhancedAuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'founder') {
        res.status(403).json({
          success: false,
          message: 'Founder access required',
          error: 'FORBIDDEN'
        });
        return;
      }

      const visibilityQuery = `
        SELECT
          sp.current_sse_score,
          sp.visibility_level,
          sp.investor_visibility_enabled,
          sp.performance_threshold_met,
          sp.opted_in_date,
          sp.visibility_restrictions,
          s.company_name,
          s.industry,
          s.stage,
          -- Count current investor views
          (
            SELECT COUNT(DISTINCT investor_id)
            FROM investor_startup_views isv
            WHERE isv.startup_id = s.id
              AND isv.viewed_at > NOW() - INTERVAL '30 days'
          ) as recent_investor_views,
          -- Count introduction requests
          (
            SELECT COUNT(*)
            FROM introduction_requests ir
            WHERE ir.startup_id = s.id
              AND ir.status = 'pending'
          ) as pending_introductions
        FROM startup_profiles sp
        JOIN startups s ON sp.startup_id = s.id
        WHERE s.founder_id = $1
      `;

      const result = await pool.query(visibilityQuery, [req.user.userId]);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Startup profile not found',
          error: 'NOT_FOUND'
        });
        return;
      }

      const data = result.rows[0];
      const sseScore = data.current_sse_score || 0;
      const eligibleForUpgrade = sseScore >= 70;

      const visibilitySettings: StartupVisibilitySettings = {
        visibilityLevel: data.visibility_level || 'private',
        investorVisibilityEnabled: data.investor_visibility_enabled || false,
        performanceThresholdMet: eligibleForUpgrade,
        sseScore,
        eligibleForUpgrade,
        visibilityBenefits: this.getVisibilityBenefits(sseScore),
        privacyControls: this.getPrivacyControls()
      };

      res.json({
        success: true,
        data: {
          visibilitySettings,
          currentMetrics: {
            sseScore,
            recentInvestorViews: data.recent_investor_views,
            pendingIntroductions: data.pending_introductions,
            companyName: data.company_name,
            industry: data.industry,
            stage: data.stage
          },
          eligibilityInfo: {
            currentThreshold: sseScore,
            requiredThreshold: 70,
            canUpgrade: eligibleForUpgrade,
            nextMilestone: eligibleForUpgrade ? 85 : 70,
            improvementNeeded: Math.max(0, 70 - sseScore)
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get visibility settings', {
        error: (error as Error).message,
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve visibility settings',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Update startup visibility settings (opt-in/opt-out)
   */
  async updateVisibilitySettings(req: EnhancedAuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'founder') {
        res.status(403).json({
          success: false,
          message: 'Founder access required',
          error: 'FORBIDDEN'
        });
        return;
      }

      const {
        visibilityLevel,
        investorVisibilityEnabled,
        privacyRestrictions
      } = req.body;

      // Validate visibility level
      const validLevels = ['private', 'portfolio_only', 'qualified_investors', 'public'];
      if (visibilityLevel && !validLevels.includes(visibilityLevel)) {
        res.status(400).json({
          success: false,
          message: 'Invalid visibility level',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      // Check if startup meets performance threshold for higher visibility
      const currentDataQuery = `
        SELECT sp.current_sse_score, s.id as startup_id
        FROM startup_profiles sp
        JOIN startups s ON sp.startup_id = s.id
        WHERE s.founder_id = $1
      `;

      const currentResult = await pool.query(currentDataQuery, [req.user.userId]);

      if (currentResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Startup profile not found',
          error: 'NOT_FOUND'
        });
        return;
      }

      const currentData = currentResult.rows[0];
      const sseScore = currentData.current_sse_score || 0;
      const startupId = currentData.startup_id;

      // Validate performance requirements for visibility upgrade
      if ((visibilityLevel === 'qualified_investors' || visibilityLevel === 'public') && sseScore < 70) {
        res.status(400).json({
          success: false,
          message: `SSE score of 70+ required for ${visibilityLevel} visibility. Current score: ${sseScore}`,
          error: 'PERFORMANCE_THRESHOLD_NOT_MET',
          data: {
            currentScore: sseScore,
            requiredScore: 70,
            improvementNeeded: 70 - sseScore
          }
        });
        return;
      }

      // Update visibility settings
      const updateQuery = `
        UPDATE startup_profiles
        SET
          visibility_level = COALESCE($2, visibility_level),
          investor_visibility_enabled = COALESCE($3, investor_visibility_enabled),
          performance_threshold_met = $4,
          visibility_restrictions = COALESCE($5, visibility_restrictions),
          opted_in_date = CASE
            WHEN $3 = true AND investor_visibility_enabled = false THEN NOW()
            ELSE opted_in_date
          END,
          updated_at = NOW()
        WHERE startup_id = $1
        RETURNING *
      `;

      const updateResult = await pool.query(updateQuery, [
        startupId,
        visibilityLevel,
        investorVisibilityEnabled,
        sseScore >= 70,
        JSON.stringify(privacyRestrictions || {})
      ]);

      // Log visibility change
      await this.logVisibilityChange(req.user.userId, {
        previousLevel: currentData.visibility_level,
        newLevel: visibilityLevel,
        sseScore,
        timestamp: new Date()
      });

      // Send notifications if visibility was increased
      if (investorVisibilityEnabled && visibilityLevel !== 'private') {
        await this.notifyEligibleInvestors(startupId, visibilityLevel);
      }

      res.json({
        success: true,
        message: 'Visibility settings updated successfully',
        data: {
          visibilityLevel: updateResult.rows[0].visibility_level,
          investorVisibilityEnabled: updateResult.rows[0].investor_visibility_enabled,
          performanceThresholdMet: updateResult.rows[0].performance_threshold_met,
          sseScore,
          effectiveDate: new Date()
        }
      });

    } catch (error) {
      logger.error('Failed to update visibility settings', {
        error: (error as Error).message,
        userId: req.user?.userId,
        requestBody: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to update visibility settings',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get visibility analytics and impact metrics
   */
  async getVisibilityAnalytics(req: EnhancedAuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'founder') {
        res.status(403).json({
          success: false,
          message: 'Founder access required',
          error: 'FORBIDDEN'
        });
        return;
      }

      const analyticsQuery = `
        SELECT
          s.id as startup_id,
          sp.visibility_level,
          sp.investor_visibility_enabled,
          sp.opted_in_date,
          -- Investor engagement metrics
          COUNT(DISTINCT isv.investor_id) as unique_investor_views,
          COUNT(isv.id) as total_views,
          COUNT(DISTINCT CASE WHEN isv.viewed_at > NOW() - INTERVAL '7 days' THEN isv.investor_id END) as recent_viewers,
          -- Introduction requests
          COUNT(DISTINCT ir.id) as total_introduction_requests,
          COUNT(DISTINCT CASE WHEN ir.status = 'accepted' THEN ir.id END) as accepted_introductions,
          COUNT(DISTINCT CASE WHEN ir.created_at > NOW() - INTERVAL '30 days' THEN ir.id END) as recent_requests,
          -- Investment interest
          COUNT(DISTINCT ii.investor_id) as interested_investors,
          AVG(ii.interest_level_numeric) as avg_interest_level,
          -- Performance correlation
          sp.current_sse_score,
          LAG(sp.current_sse_score) OVER (ORDER BY sp.updated_at) as previous_sse_score
        FROM startups s
        JOIN startup_profiles sp ON s.id = sp.startup_id
        LEFT JOIN investor_startup_views isv ON s.id = isv.startup_id
        LEFT JOIN introduction_requests ir ON s.id = ir.startup_id
        LEFT JOIN investor_interest ii ON s.id = ii.startup_id
        WHERE s.founder_id = $1
        GROUP BY s.id, sp.visibility_level, sp.investor_visibility_enabled,
                 sp.opted_in_date, sp.current_sse_score, sp.updated_at
      `;

      const analyticsResult = await pool.query(analyticsQuery, [req.user.userId]);

      if (analyticsResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'No analytics data found',
          error: 'NOT_FOUND'
        });
        return;
      }

      const data = analyticsResult.rows[0];

      // Calculate visibility impact metrics
      const visibilityImpact = {
        investorReach: data.unique_investor_views,
        engagementRate: data.total_views > 0 ? (data.recent_viewers / data.unique_investor_views * 100) : 0,
        conversionRate: data.total_introduction_requests > 0 ? (data.accepted_introductions / data.total_introduction_requests * 100) : 0,
        interestLevel: data.avg_interest_level || 0,
        trendDirection: this.calculateTrendDirection(data.current_sse_score, data.previous_sse_score)
      };

      // Get benchmark comparison
      const benchmarkData = await this.getBenchmarkComparison(data.startup_id, data.current_sse_score);

      res.json({
        success: true,
        data: {
          visibilityMetrics: {
            currentLevel: data.visibility_level,
            isVisible: data.investor_visibility_enabled,
            optedInDate: data.opted_in_date,
            sseScore: data.current_sse_score
          },
          engagementMetrics: {
            uniqueInvestorViews: data.unique_investor_views,
            totalViews: data.total_views,
            recentViewers: data.recent_viewers,
            introductionRequests: data.total_introduction_requests,
            acceptedIntroductions: data.accepted_introductions,
            recentRequests: data.recent_requests,
            interestedInvestors: data.interested_investors
          },
          impactAnalysis: visibilityImpact,
          benchmarkComparison: benchmarkData,
          recommendations: this.generateVisibilityRecommendations(data, visibilityImpact)
        }
      });

    } catch (error) {
      logger.error('Failed to get visibility analytics', {
        error: (error as Error).message,
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve analytics',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get eligible investors for startup based on performance and preferences
   */
  async getEligibleInvestors(req: EnhancedAuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'founder') {
        res.status(403).json({
          success: false,
          message: 'Founder access required',
          error: 'FORBIDDEN'
        });
        return;
      }

      // Check if startup is eligible for investor visibility
      const eligibilityQuery = `
        SELECT
          sp.current_sse_score,
          sp.investor_visibility_enabled,
          sp.visibility_level,
          s.industry,
          s.stage,
          s.location
        FROM startup_profiles sp
        JOIN startups s ON sp.startup_id = s.id
        WHERE s.founder_id = $1
      `;

      const eligibilityResult = await pool.query(eligibilityQuery, [req.user.userId]);

      if (eligibilityResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Startup profile not found',
          error: 'NOT_FOUND'
        });
        return;
      }

      const startupData = eligibilityResult.rows[0];

      if (!startupData.investor_visibility_enabled || startupData.current_sse_score < 70) {
        res.status(403).json({
          success: false,
          message: 'Startup not eligible for investor discovery. Requires SSE score 70+ and opt-in to investor visibility.',
          error: 'NOT_ELIGIBLE',
          data: {
            currentScore: startupData.current_sse_score,
            requiredScore: 70,
            visibilityEnabled: startupData.investor_visibility_enabled
          }
        });
        return;
      }

      // Get matching investors based on preferences
      const investorsQuery = `
        SELECT
          ip.id,
          u.email,
          ip.investor_type,
          ip.investment_focus,
          ip.geographic_preferences,
          ip.industry_preferences,
          ip.stage_preferences,
          ip.investment_range,
          ip.portfolio_size,
          ip.successful_exits,
          -- Calculate match score
          (
            CASE WHEN $2 = ANY(string_to_array(ip.industry_preferences::text, ',')) THEN 30 ELSE 0 END +
            CASE WHEN $3 = ANY(string_to_array(ip.stage_preferences::text, ',')) THEN 25 ELSE 0 END +
            CASE WHEN $4 = ANY(string_to_array(ip.geographic_preferences::text, ',')) THEN 20 ELSE 0 END +
            CASE WHEN ip.investor_tier = 'tier2' THEN 25 ELSE 0 END
          ) as match_score,
          ip.investor_tier,
          ip.subscription_status
        FROM investor_profiles ip
        JOIN users u ON ip.user_id = u.id
        WHERE ip.investor_tier = 'tier2'
          AND ip.subscription_status = 'active'
          AND (
            $2 = ANY(string_to_array(ip.industry_preferences::text, ','))
            OR $3 = ANY(string_to_array(ip.stage_preferences::text, ','))
            OR $4 = ANY(string_to_array(ip.geographic_preferences::text, ','))
          )
        ORDER BY match_score DESC, ip.successful_exits DESC
        LIMIT 50
      `;

      const investorsResult = await pool.query(investorsQuery, [
        req.user.userId,
        startupData.industry,
        startupData.stage,
        startupData.location
      ]);

      res.json({
        success: true,
        data: {
          eligibleInvestors: investorsResult.rows,
          totalMatches: investorsResult.rows.length,
          startupMetrics: {
            sseScore: startupData.current_sse_score,
            industry: startupData.industry,
            stage: startupData.stage,
            location: startupData.location,
            visibilityLevel: startupData.visibility_level
          },
          matchingCriteria: {
            industryMatch: 30,
            stageMatch: 25,
            locationMatch: 20,
            tier2Access: 25
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get eligible investors', {
        error: (error as Error).message,
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve eligible investors',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  // Helper methods

  private getVisibilityBenefits(sseScore: number): string[] {
    const baseBenefits = [
      'Portfolio investor access to your performance data',
      'Automated LP reporting for your investors'
    ];

    if (sseScore >= 70) {
      baseBenefits.push(
        'Access to qualified investor pool',
        'Performance-based investor matching',
        'Priority in investor deal flow',
        'Enhanced credibility through verified metrics'
      );
    }

    if (sseScore >= 85) {
      baseBenefits.push(
        'Featured in top performer showcases',
        'Speaking opportunities and media features',
        'Advisory and mentorship roles for other startups'
      );
    }

    return baseBenefits;
  }

  private getPrivacyControls(): PrivacyControl[] {
    return [
      {
        controlType: 'investor_type',
        allowedValues: ['angel', 'venture_capital', 'private_equity', 'family_office'],
        description: 'Control which types of investors can see your startup'
      },
      {
        controlType: 'geographic_region',
        allowedValues: ['north_america', 'europe', 'asia_pacific', 'latin_america'],
        description: 'Limit visibility to investors in specific regions'
      },
      {
        controlType: 'investment_stage',
        allowedValues: ['pre_seed', 'seed', 'series_a', 'series_b', 'growth'],
        description: 'Show only to investors focused on your funding stage'
      },
      {
        controlType: 'industry_focus',
        allowedValues: ['saas', 'fintech', 'healthtech', 'ecommerce', 'deeptech'],
        description: 'Restrict to investors with relevant industry expertise'
      }
    ];
  }

  private async logVisibilityChange(userId: string, changeData: any): Promise<void> {
    const logQuery = `
      INSERT INTO visibility_change_log (
        user_id, previous_level, new_level, sse_score, changed_at
      ) VALUES ($1, $2, $3, $4, $5)
    `;

    await pool.query(logQuery, [
      userId,
      changeData.previousLevel,
      changeData.newLevel,
      changeData.sseScore,
      changeData.timestamp
    ]);
  }

  private async notifyEligibleInvestors(startupId: string, visibilityLevel: string): Promise<void> {
    // Implementation for notifying investors about new high-performing startup
    logger.info('Notifying eligible investors', {
      startupId,
      visibilityLevel
    });
  }

  private calculateTrendDirection(current: number, previous: number): 'improving' | 'stable' | 'declining' {
    if (!previous) return 'stable';
    if (current > previous) return 'improving';
    if (current < previous) return 'declining';
    return 'stable';
  }

  private async getBenchmarkComparison(startupId: string, sseScore: number): Promise<any> {
    // Implementation for benchmark comparison
    return {
      industryAverage: 65,
      stageAverage: 68,
      topPercentile: 85,
      yourRanking: sseScore >= 85 ? 'top_10_percent' : sseScore >= 70 ? 'top_25_percent' : 'below_average'
    };
  }

  private generateVisibilityRecommendations(data: any, impact: any): string[] {
    const recommendations = [];

    if (data.current_sse_score < 70) {
      recommendations.push('Focus on improving SSE score to 70+ to unlock investor visibility');
    }

    if (impact.engagementRate < 20) {
      recommendations.push('Consider updating your startup profile to increase investor engagement');
    }

    if (impact.conversionRate < 10) {
      recommendations.push('Improve your pitch materials to convert more views to introductions');
    }

    return recommendations;
  }
}

export const startupVisibilityController = new StartupVisibilityController();
