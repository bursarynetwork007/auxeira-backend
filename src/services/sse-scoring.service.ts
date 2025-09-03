import { pool } from '../config/database';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';
import {
  SSEScore,
  SSEScoreComponents,
  SSEMetric,
  SSEBenchmark,
  UserBenchmarkPosition,
  CalculateSSEScoreRequest,
  SSEScoreResponse,
  SSERecommendation,
  SSEScoreTrend,
  SSEAnalytics,
  UserBehavior,
  DailyQuestion,
  UserQuestionResponse,
} from '../types/sse.types';

/**
 * SSE Scoring Service
 * Handles all SSE (Social, Sustainability, Economic) scoring calculations
 */
export class SSEScoringService {
  // Scoring weights (configurable)
  private readonly WEIGHTS = {
    social: 0.40,      // 40%
    sustainability: 0.35, // 35%
    economic: 0.25,    // 25%
  };

  // Social component weights
  private readonly SOCIAL_WEIGHTS = {
    communityImpact: 0.30,
    diversityInclusion: 0.25,
    employeeWellbeing: 0.20,
    stakeholderEngagement: 0.15,
    socialInnovation: 0.10,
  };

  // Sustainability component weights
  private readonly SUSTAINABILITY_WEIGHTS = {
    environmentalImpact: 0.35,
    resourceManagement: 0.25,
    greenInnovation: 0.20,
    complianceCertifications: 0.15,
    futureSustainability: 0.05,
  };

  // Economic component weights
  private readonly ECONOMIC_WEIGHTS = {
    financialPerformance: 0.40,
    economicImpact: 0.25,
    innovationRD: 0.20,
    marketPosition: 0.10,
    riskManagement: 0.05,
  };

  /**
   * Calculate comprehensive SSE score for a user
   */
  async calculateSSEScore(request: CalculateSSEScoreRequest): Promise<SSEScoreResponse> {
    try {
      const { userId, organizationId, includeProjections, includeBenchmarks, timeRange } = request;

      // Get user metrics
      const metrics = await this.getUserMetrics(userId, organizationId, timeRange);

      // Calculate component scores
      const socialComponents = await this.calculateSocialScore(metrics.social);
      const sustainabilityComponents = await this.calculateSustainabilityScore(metrics.sustainability);
      const economicComponents = await this.calculateEconomicScore(metrics.economic);

      // Calculate overall scores
      const socialScore = this.calculateWeightedScore(socialComponents, this.SOCIAL_WEIGHTS);
      const sustainabilityScore = this.calculateWeightedScore(sustainabilityComponents, this.SUSTAINABILITY_WEIGHTS);
      const economicScore = this.calculateWeightedScore(economicComponents, this.ECONOMIC_WEIGHTS);

      const overallScore =
        (socialScore * this.WEIGHTS.social) +
        (sustainabilityScore * this.WEIGHTS.sustainability) +
        (economicScore * this.WEIGHTS.economic);

      // Create score components
      const scoreComponents: SSEScoreComponents = {
        social: socialComponents,
        sustainability: sustainabilityComponents,
        economic: economicComponents,
      };

      // Get benchmarking data if requested
      let benchmarkPosition: UserBenchmarkPosition | undefined;
      if (includeBenchmarks) {
        benchmarkPosition = await this.calculateBenchmarkPosition(
          userId,
          overallScore,
          socialScore,
          sustainabilityScore,
          economicScore
        );
      }

      // Create SSE score object
      const sseScore: SSEScore = {
        id: this.generateId(),
        userId,
        organizationId,
        overallScore: Math.round(overallScore * 100) / 100,
        socialScore: Math.round(socialScore * 100) / 100,
        sustainabilityScore: Math.round(sustainabilityScore * 100) / 100,
        economicScore: Math.round(economicScore * 100) / 100,
        scoreComponents,
        industryPercentile: benchmarkPosition?.overallPercentile,
        peerPercentile: benchmarkPosition?.overallPercentile,
        calculatedAt: new Date(),
        version: 1,
        createdAt: new Date(),
      };

      // Save score to database
      await this.saveSSEScore(sseScore);

      // Get previous score for comparison
      const previousScore = await this.getPreviousScore(userId, organizationId);
      const scoreChange = previousScore ? this.calculateScoreChange(sseScore, previousScore) : undefined;

      // Generate recommendations
      const recommendations = await this.generateRecommendations(sseScore, metrics);

      // Get trends if requested
      const trends = includeProjections ? await this.getScoreTrends(userId, organizationId) : undefined;

      // Cache the result
      await this.cacheSSEScore(userId, sseScore);

      return {
        success: true,
        message: 'SSE score calculated successfully',
        data: {
          currentScore: sseScore,
          previousScore,
          scoreChange,
          benchmarkPosition,
          recommendations,
          trends,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('SSE score calculation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: request.userId,
        organizationId: request.organizationId,
      });

      return {
        success: false,
        message: 'Failed to calculate SSE score',
        data: {
          currentScore: {} as SSEScore,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Calculate social score components
   */
  private async calculateSocialScore(socialMetrics: any): Promise<any> {
    return {
      communityImpact: {
        volunteerHours: socialMetrics.volunteerHours || 0,
        communityProjects: socialMetrics.communityProjects || 0,
        localPartnerships: socialMetrics.localPartnerships || 0,
        socialInitiatives: socialMetrics.socialInitiatives || 0,
        score: this.calculateComponentScore([
          socialMetrics.volunteerHours || 0,
          socialMetrics.communityProjects || 0,
          socialMetrics.localPartnerships || 0,
          socialMetrics.socialInitiatives || 0,
        ]),
      },
      diversityInclusion: {
        diversityIndex: socialMetrics.diversityIndex || 0,
        inclusionPolicies: socialMetrics.inclusionPolicies || 0,
        equalOpportunities: socialMetrics.equalOpportunities || 0,
        culturalCompetency: socialMetrics.culturalCompetency || 0,
        score: this.calculateComponentScore([
          socialMetrics.diversityIndex || 0,
          socialMetrics.inclusionPolicies || 0,
          socialMetrics.equalOpportunities || 0,
          socialMetrics.culturalCompetency || 0,
        ]),
      },
      employeeWellbeing: {
        workLifeBalance: socialMetrics.workLifeBalance || 0,
        mentalHealthSupport: socialMetrics.mentalHealthSupport || 0,
        professionalDevelopment: socialMetrics.professionalDevelopment || 0,
        employeeSatisfaction: socialMetrics.employeeSatisfaction || 0,
        score: this.calculateComponentScore([
          socialMetrics.workLifeBalance || 0,
          socialMetrics.mentalHealthSupport || 0,
          socialMetrics.professionalDevelopment || 0,
          socialMetrics.employeeSatisfaction || 0,
        ]),
      },
      stakeholderEngagement: {
        customerSatisfaction: socialMetrics.customerSatisfaction || 0,
        supplierRelations: socialMetrics.supplierRelations || 0,
        investorCommunication: socialMetrics.investorCommunication || 0,
        publicTransparency: socialMetrics.publicTransparency || 0,
        score: this.calculateComponentScore([
          socialMetrics.customerSatisfaction || 0,
          socialMetrics.supplierRelations || 0,
          socialMetrics.investorCommunication || 0,
          socialMetrics.publicTransparency || 0,
        ]),
      },
      socialInnovation: {
        socialTechSolutions: socialMetrics.socialTechSolutions || 0,
        accessibilityFeatures: socialMetrics.accessibilityFeatures || 0,
        digitalInclusion: socialMetrics.digitalInclusion || 0,
        socialEntrepreneurship: socialMetrics.socialEntrepreneurship || 0,
        score: this.calculateComponentScore([
          socialMetrics.socialTechSolutions || 0,
          socialMetrics.accessibilityFeatures || 0,
          socialMetrics.digitalInclusion || 0,
          socialMetrics.socialEntrepreneurship || 0,
        ]),
      },
    };
  }

  /**
   * Calculate sustainability score components
   */
  private async calculateSustainabilityScore(sustainabilityMetrics: any): Promise<any> {
    return {
      environmentalImpact: {
        carbonFootprint: sustainabilityMetrics.carbonFootprint || 0,
        energyEfficiency: sustainabilityMetrics.energyEfficiency || 0,
        wasteReduction: sustainabilityMetrics.wasteReduction || 0,
        waterConservation: sustainabilityMetrics.waterConservation || 0,
        score: this.calculateComponentScore([
          sustainabilityMetrics.carbonFootprint || 0,
          sustainabilityMetrics.energyEfficiency || 0,
          sustainabilityMetrics.wasteReduction || 0,
          sustainabilityMetrics.waterConservation || 0,
        ]),
      },
      resourceManagement: {
        renewableEnergy: sustainabilityMetrics.renewableEnergy || 0,
        sustainableMaterials: sustainabilityMetrics.sustainableMaterials || 0,
        circularEconomy: sustainabilityMetrics.circularEconomy || 0,
        resourceEfficiency: sustainabilityMetrics.resourceEfficiency || 0,
        score: this.calculateComponentScore([
          sustainabilityMetrics.renewableEnergy || 0,
          sustainabilityMetrics.sustainableMaterials || 0,
          sustainabilityMetrics.circularEconomy || 0,
          sustainabilityMetrics.resourceEfficiency || 0,
        ]),
      },
      greenInnovation: {
        cleanTechnology: sustainabilityMetrics.cleanTechnology || 0,
        sustainableProducts: sustainabilityMetrics.sustainableProducts || 0,
        ecoFriendlyProcesses: sustainabilityMetrics.ecoFriendlyProcesses || 0,
        greenResearch: sustainabilityMetrics.greenResearch || 0,
        score: this.calculateComponentScore([
          sustainabilityMetrics.cleanTechnology || 0,
          sustainabilityMetrics.sustainableProducts || 0,
          sustainabilityMetrics.ecoFriendlyProcesses || 0,
          sustainabilityMetrics.greenResearch || 0,
        ]),
      },
      complianceCertifications: {
        environmentalCertifications: sustainabilityMetrics.environmentalCertifications || 0,
        regulatoryCompliance: sustainabilityMetrics.regulatoryCompliance || 0,
        sustainabilityReporting: sustainabilityMetrics.sustainabilityReporting || 0,
        thirdPartyAudits: sustainabilityMetrics.thirdPartyAudits || 0,
        score: this.calculateComponentScore([
          sustainabilityMetrics.environmentalCertifications || 0,
          sustainabilityMetrics.regulatoryCompliance || 0,
          sustainabilityMetrics.sustainabilityReporting || 0,
          sustainabilityMetrics.thirdPartyAudits || 0,
        ]),
      },
      futureSustainability: {
        sustainabilityGoals: sustainabilityMetrics.sustainabilityGoals || 0,
        climateCommitments: sustainabilityMetrics.climateCommitments || 0,
        sustainabilityInnovation: sustainabilityMetrics.sustainabilityInnovation || 0,
        longTermPlanning: sustainabilityMetrics.longTermPlanning || 0,
        score: this.calculateComponentScore([
          sustainabilityMetrics.sustainabilityGoals || 0,
          sustainabilityMetrics.climateCommitments || 0,
          sustainabilityMetrics.sustainabilityInnovation || 0,
          sustainabilityMetrics.longTermPlanning || 0,
        ]),
      },
    };
  }

  /**
   * Calculate economic score components
   */
  private async calculateEconomicScore(economicMetrics: any): Promise<any> {
    return {
      financialPerformance: {
        profitability: economicMetrics.profitability || 0,
        revenue: economicMetrics.revenue || 0,
        growthRate: economicMetrics.growthRate || 0,
        financialStability: economicMetrics.financialStability || 0,
        score: this.calculateComponentScore([
          economicMetrics.profitability || 0,
          economicMetrics.revenue || 0,
          economicMetrics.growthRate || 0,
          economicMetrics.financialStability || 0,
        ]),
      },
      economicImpact: {
        jobCreation: economicMetrics.jobCreation || 0,
        localEconomicContribution: economicMetrics.localEconomicContribution || 0,
        supplierPayments: economicMetrics.supplierPayments || 0,
        taxContribution: economicMetrics.taxContribution || 0,
        score: this.calculateComponentScore([
          economicMetrics.jobCreation || 0,
          economicMetrics.localEconomicContribution || 0,
          economicMetrics.supplierPayments || 0,
          economicMetrics.taxContribution || 0,
        ]),
      },
      innovationRD: {
        rdInvestment: economicMetrics.rdInvestment || 0,
        patentsTrademarks: economicMetrics.patentsTrademarks || 0,
        productInnovation: economicMetrics.productInnovation || 0,
        technologyAdoption: economicMetrics.technologyAdoption || 0,
        score: this.calculateComponentScore([
          economicMetrics.rdInvestment || 0,
          economicMetrics.patentsTrademarks || 0,
          economicMetrics.productInnovation || 0,
          economicMetrics.technologyAdoption || 0,
        ]),
      },
      marketPosition: {
        marketShare: economicMetrics.marketShare || 0,
        competitiveAdvantage: economicMetrics.competitiveAdvantage || 0,
        brandValue: economicMetrics.brandValue || 0,
        customerLoyalty: economicMetrics.customerLoyalty || 0,
        score: this.calculateComponentScore([
          economicMetrics.marketShare || 0,
          economicMetrics.competitiveAdvantage || 0,
          economicMetrics.brandValue || 0,
          economicMetrics.customerLoyalty || 0,
        ]),
      },
      riskManagement: {
        financialRisk: economicMetrics.financialRisk || 0,
        operationalRisk: economicMetrics.operationalRisk || 0,
        marketRisk: economicMetrics.marketRisk || 0,
        complianceRisk: economicMetrics.complianceRisk || 0,
        score: this.calculateComponentScore([
          economicMetrics.financialRisk || 0,
          economicMetrics.operationalRisk || 0,
          economicMetrics.marketRisk || 0,
          economicMetrics.complianceRisk || 0,
        ]),
      },
    };
  }

  /**
   * Process daily question response and update SSE score
   */
  async processDailyQuestionResponse(
    userId: string,
    questionId: string,
    responseValue: string,
    responseData?: any
  ): Promise<{ success: boolean; impact: { social: number; sustainability: number; economic: number } }> {
    try {
      // Get question details
      const question = await this.getDailyQuestion(questionId);
      if (!question) {
        throw new Error('Question not found');
      }

      // Calculate impact based on response
      const impact = this.calculateQuestionImpact(question, responseValue, responseData);

      // Save response
      const response: UserQuestionResponse = {
        id: this.generateId(),
        userId,
        questionId,
        responseValue,
        responseData,
        socialImpact: impact.social,
        sustainabilityImpact: impact.sustainability,
        economicImpact: impact.economic,
        respondedAt: new Date(),
        createdAt: new Date(),
      };

      await this.saveQuestionResponse(response);

      // Record behavior
      await this.recordBehavior(userId, 'daily_question_answered', question.category, {
        questionId,
        responseValue,
        impact,
      }, impact.social, impact.sustainability, impact.economic);

      // Trigger score recalculation (async)
      this.triggerScoreRecalculation(userId);

      return {
        success: true,
        impact,
      };
    } catch (error) {
      logger.error('Failed to process daily question response', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        questionId,
        responseValue,
      });

      return {
        success: false,
        impact: { social: 0, sustainability: 0, economic: 0 },
      };
    }
  }

  /**
   * Record user behavior and its impact on SSE score
   */
  async recordBehavior(
    userId: string,
    behaviorType: string,
    behaviorCategory: 'social' | 'sustainability' | 'economic',
    behaviorData: any,
    socialImpact: number,
    sustainabilityImpact: number,
    economicImpact: number
  ): Promise<void> {
    try {
      const behavior: UserBehavior = {
        id: this.generateId(),
        userId,
        behaviorType,
        behaviorCategory,
        behaviorData,
        socialImpact,
        sustainabilityImpact,
        economicImpact,
        occurredAt: new Date(),
        createdAt: new Date(),
      };

      await this.saveBehavior(behavior);

      // Update real-time score impact
      await this.updateRealTimeScoreImpact(userId, socialImpact, sustainabilityImpact, economicImpact);
    } catch (error) {
      logger.error('Failed to record behavior', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        behaviorType,
        behaviorCategory,
      });
    }
  }

  /**
   * Get SSE analytics for a user
   */
  async getSSEAnalytics(userId: string, organizationId?: string): Promise<SSEAnalytics> {
    try {
      // Get score progression
      const scoreProgression = await this.getScoreTrends(userId, organizationId);

      // Calculate performance metrics
      const performanceMetrics = await this.calculatePerformanceMetrics(userId, scoreProgression);

      // Get behavioral insights
      const behavioralInsights = await this.getBehavioralInsights(userId);

      // Get comparative analysis
      const comparativeAnalysis = await this.getComparativeAnalysis(userId);

      return {
        userId,
        organizationId,
        scoreProgression,
        performanceMetrics,
        behavioralInsights,
        comparativeAnalysis,
      };
    } catch (error) {
      logger.error('Failed to get SSE analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        organizationId,
      });

      throw error;
    }
  }

  // Private helper methods

  private async getUserMetrics(userId: string, organizationId?: string, timeRange?: any): Promise<any> {
    // This would query the sse_metrics table and aggregate metrics by category
    const query = `
      SELECT metric_category, metric_name, metric_code, value, weight, measured_at
      FROM sse_metrics
      WHERE user_id = $1
        AND ($2::uuid IS NULL OR organization_id = $2)
        AND ($3::timestamp IS NULL OR measured_at >= $3)
        AND ($4::timestamp IS NULL OR measured_at <= $4)
      ORDER BY measured_at DESC
    `;

    const values = [
      userId,
      organizationId || null,
      timeRange?.startDate || null,
      timeRange?.endDate || null,
    ];

    const result = await pool.query(query, values);

    // Group metrics by category
    const metrics = {
      social: {},
      sustainability: {},
      economic: {},
    };

    result.rows.forEach((row: any) => {
      const category = row.metric_category as keyof typeof metrics;
      if (category in metrics) {
        (metrics[category] as any)[row.metric_code] = row.value;
      }
    });

    return metrics;
  }

  private calculateComponentScore(values: number[]): number {
    if (values.length === 0) return 0;
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.min(100, Math.max(0, average));
  }

  private calculateWeightedScore(components: any, weights: any): number {
    let totalScore = 0;
    let totalWeight = 0;

    Object.keys(weights).forEach(key => {
      if (components[key] && typeof components[key].score === 'number') {
        totalScore += components[key].score * weights[key];
        totalWeight += weights[key];
      }
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private async calculateBenchmarkPosition(
    userId: string,
    overallScore: number,
    socialScore: number,
    sustainabilityScore: number,
    economicScore: number
  ): Promise<UserBenchmarkPosition> {
    // This would query benchmarks and calculate percentiles
    // For now, return mock data
    return {
      userId,
      industry: 'technology',
      organizationSize: 'startup',
      region: 'north_america',
      overallPercentile: 75,
      overallRank: 250,
      totalParticipants: 1000,
      socialPercentile: 80,
      sustainabilityPercentile: 70,
      economicPercentile: 75,
      industryAverage: {} as SSEScore,
      topPerformer: {} as SSEScore,
      improvementPotential: 25,
    };
  }

  private calculateScoreChange(currentScore: SSEScore, previousScore: SSEScore) {
    return {
      overall: currentScore.overallScore - previousScore.overallScore,
      social: currentScore.socialScore - previousScore.socialScore,
      sustainability: currentScore.sustainabilityScore - previousScore.sustainabilityScore,
      economic: currentScore.economicScore - previousScore.economicScore,
    };
  }

  private async generateRecommendations(score: SSEScore, metrics: any): Promise<SSERecommendation[]> {
    const recommendations: SSERecommendation[] = [];

    // Analyze weak areas and generate recommendations
    if (score.socialScore < 70) {
      recommendations.push({
        id: this.generateId(),
        category: 'social',
        priority: 'high',
        title: 'Improve Community Engagement',
        description: 'Increase volunteer hours and community project participation to boost social impact.',
        expectedImpact: 15,
        effort: 'medium',
        timeframe: '2-3 months',
        actionItems: [
          'Set up monthly volunteer program',
          'Partner with local nonprofits',
          'Track and report community impact',
        ],
      });
    }

    if (score.sustainabilityScore < 70) {
      recommendations.push({
        id: this.generateId(),
        category: 'sustainability',
        priority: 'high',
        title: 'Reduce Carbon Footprint',
        description: 'Implement energy efficiency measures and renewable energy adoption.',
        expectedImpact: 20,
        effort: 'high',
        timeframe: '6-12 months',
        actionItems: [
          'Conduct energy audit',
          'Switch to renewable energy sources',
          'Implement waste reduction program',
        ],
      });
    }

    if (score.economicScore < 70) {
      recommendations.push({
        id: this.generateId(),
        category: 'economic',
        priority: 'medium',
        title: 'Enhance Financial Performance',
        description: 'Focus on revenue growth and operational efficiency improvements.',
        expectedImpact: 12,
        effort: 'medium',
        timeframe: '3-6 months',
        actionItems: [
          'Optimize operational processes',
          'Diversify revenue streams',
          'Improve cost management',
        ],
      });
    }

    return recommendations;
  }

  private async getScoreTrends(userId: string, organizationId?: string): Promise<SSEScoreTrend[]> {
    const query = `
      SELECT calculated_at, overall_score, social_score, sustainability_score, economic_score
      FROM sse_scores
      WHERE user_id = $1
        AND ($2::uuid IS NULL OR organization_id = $2)
      ORDER BY calculated_at DESC
      LIMIT 30
    `;

    const result = await pool.query(query, [userId, organizationId || null]);

    return result.rows.map((row: any) => ({
      date: row.calculated_at,
      overallScore: row.overall_score,
      socialScore: row.social_score,
      sustainabilityScore: row.sustainability_score,
      economicScore: row.economic_score,
    }));
  }

  private calculateQuestionImpact(question: DailyQuestion, responseValue: string, responseData?: any) {
    // Calculate impact based on question type and response
    let baseImpact = 0;

    switch (question.questionType) {
      case 'boolean':
        baseImpact = responseValue === 'true' ? 5 : -2;
        break;
      case 'numeric':
        const numValue = parseFloat(responseValue);
        baseImpact = Math.min(10, numValue / 2); // Scale numeric responses
        break;
      case 'scale':
        const scaleValue = parseInt(responseValue);
        baseImpact = (scaleValue - 3) * 2; // Scale 1-5 to -4 to 4
        break;
      default:
        baseImpact = 1;
    }

    return {
      social: baseImpact * question.socialWeight,
      sustainability: baseImpact * question.sustainabilityWeight,
      economic: baseImpact * question.economicWeight,
    };
  }

  private async saveSSEScore(score: SSEScore): Promise<void> {
    const query = `
      INSERT INTO sse_scores (
        id, user_id, organization_id, overall_score, social_score,
        sustainability_score, economic_score, score_components,
        industry_percentile, peer_percentile, calculated_at, version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;

    const values = [
      score.id,
      score.userId,
      score.organizationId,
      score.overallScore,
      score.socialScore,
      score.sustainabilityScore,
      score.economicScore,
      JSON.stringify(score.scoreComponents),
      score.industryPercentile,
      score.peerPercentile,
      score.calculatedAt,
      score.version,
    ];

    await pool.query(query, values);
  }

  private async getPreviousScore(userId: string, organizationId?: string): Promise<SSEScore | undefined> {
    const query = `
      SELECT * FROM sse_scores
      WHERE user_id = $1
        AND ($2::uuid IS NULL OR organization_id = $2)
      ORDER BY calculated_at DESC
      LIMIT 1 OFFSET 1
    `;

    const result = await pool.query(query, [userId, organizationId || null]);
    return result.rows[0] || undefined;
  }

  private async cacheSSEScore(userId: string, score: SSEScore): Promise<void> {
    try {
      if (redis.isReady()) {
        await redis.set(`sse_score:${userId}`, JSON.stringify(score), 3600); // 1 hour cache
      }
    } catch (error) {
      logger.warn('Failed to cache SSE score', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
    }
  }

  private async getDailyQuestion(questionId: string): Promise<DailyQuestion | null> {
    const query = `
      SELECT * FROM daily_questions
      WHERE id = $1 AND is_active = true
    `;

    const result = await pool.query(query, [questionId]);
    return result.rows[0] || null;
  }

  private async saveQuestionResponse(response: UserQuestionResponse): Promise<void> {
    const query = `
      INSERT INTO user_question_responses (
        id, user_id, question_id, response_value, response_data,
        social_impact, sustainability_impact, economic_impact, responded_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    const values = [
      response.id,
      response.userId,
      response.questionId,
      response.responseValue,
      JSON.stringify(response.responseData),
      response.socialImpact,
      response.sustainabilityImpact,
      response.economicImpact,
      response.respondedAt,
    ];

    await pool.query(query, values);
  }

  private async saveBehavior(behavior: UserBehavior): Promise<void> {
    const query = `
      INSERT INTO user_behaviors (
        id, user_id, behavior_type, behavior_category, behavior_data,
        social_impact, sustainability_impact, economic_impact, occurred_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    const values = [
      behavior.id,
      behavior.userId,
      behavior.behaviorType,
      behavior.behaviorCategory,
      JSON.stringify(behavior.behaviorData),
      behavior.socialImpact,
      behavior.sustainabilityImpact,
      behavior.economicImpact,
      behavior.occurredAt,
    ];

    await pool.query(query, values);
  }

  private async updateRealTimeScoreImpact(
    userId: string,
    socialImpact: number,
    sustainabilityImpact: number,
    economicImpact: number
  ): Promise<void> {
    // Update cached score with real-time impact
    try {
      if (redis.isReady()) {
        const cachedScore = await redis.get(`sse_score:${userId}`);
        if (cachedScore) {
          const score = JSON.parse(cachedScore);
          score.socialScore += socialImpact;
          score.sustainabilityScore += sustainabilityImpact;
          score.economicScore += economicImpact;
          score.overallScore =
            (score.socialScore * this.WEIGHTS.social) +
            (score.sustainabilityScore * this.WEIGHTS.sustainability) +
            (score.economicScore * this.WEIGHTS.economic);

          await redis.set(`sse_score:${userId}`, JSON.stringify(score), 3600);
        }
      }
    } catch (error) {
      logger.warn('Failed to update real-time score impact', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
    }
  }

  private async triggerScoreRecalculation(userId: string): Promise<void> {
    // Queue score recalculation for later processing
    try {
      if (redis.isReady()) {
        await redis.getClient().lPush('score_recalculation_queue', userId);
      }
    } catch (error) {
      logger.warn('Failed to queue score recalculation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
    }
  }

  private async calculatePerformanceMetrics(userId: string, scoreProgression: SSEScoreTrend[]): Promise<any> {
    // Calculate performance metrics from score progression
    if (scoreProgression.length < 2) {
      return {
        averageMonthlyImprovement: 0,
        bestPerformingCategory: 'social',
        mostImprovedMetric: 'community_impact',
        consistencyScore: 0,
      };
    }

    const improvements = scoreProgression.slice(0, -1).map((current, index) => {
      const previous = scoreProgression[index + 1];
      return previous ? current.overallScore - previous.overallScore : 0;
    });

    const averageMonthlyImprovement = improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;

    return {
      averageMonthlyImprovement,
      bestPerformingCategory: 'social', // TODO: Calculate actual best performing category
      mostImprovedMetric: 'community_impact', // TODO: Calculate actual most improved metric
      consistencyScore: 85, // TODO: Calculate consistency based on score variance
    };
  }

  private async getBehavioralInsights(userId: string): Promise<any> {
    // Get behavioral insights from user_behaviors table
    return {
      mostImpactfulBehaviors: ['daily_questions', 'volunteer_work', 'energy_saving'],
      behaviorFrequency: {
        daily_questions: 25,
        volunteer_work: 8,
        energy_saving: 15,
      },
      streakDays: 12,
      engagementScore: 78,
    };
  }

  private async getComparativeAnalysis(userId: string): Promise<any> {
    // Get comparative analysis data
    return {
      industryComparison: 15, // 15% above industry average
      peerComparison: 8,      // 8% above peer average
      globalComparison: 22,   // 22% above global average
      improvementPotential: 25, // 25% improvement potential
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

// Export singleton instance
export const sseScoringService = new SSEScoringService();
export default sseScoringService;