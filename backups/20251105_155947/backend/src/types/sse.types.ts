// SSE (Social, Sustainability, Economic) Scoring System Types

export interface SSEScore {
  id: string;
  userId: string;
  organizationId?: string;

  // Overall scores (0-100)
  overallScore: number;
  socialScore: number;
  sustainabilityScore: number;
  economicScore: number;

  // Score components breakdown
  scoreComponents: SSEScoreComponents;

  // Benchmarking
  industryPercentile?: number;
  peerPercentile?: number;

  // Metadata
  calculatedAt: Date;
  version: number;
  createdAt: Date;
}

export interface SSEScoreComponents {
  social: SocialScoreComponents;
  sustainability: SustainabilityScoreComponents;
  economic: EconomicScoreComponents;
}

// =============================================================================
// SOCIAL SCORE COMPONENTS (40% weight)
// =============================================================================

export interface SocialScoreComponents {
  // Community Impact (30% of social)
  communityImpact: {
    volunteerHours: number;
    communityProjects: number;
    localPartnerships: number;
    socialInitiatives: number;
    score: number;
  };

  // Diversity & Inclusion (25% of social)
  diversityInclusion: {
    diversityIndex: number;
    inclusionPolicies: number;
    equalOpportunities: number;
    culturalCompetency: number;
    score: number;
  };

  // Employee Wellbeing (20% of social)
  employeeWellbeing: {
    workLifeBalance: number;
    mentalHealthSupport: number;
    professionalDevelopment: number;
    employeeSatisfaction: number;
    score: number;
  };

  // Stakeholder Engagement (15% of social)
  stakeholderEngagement: {
    customerSatisfaction: number;
    supplierRelations: number;
    investorCommunication: number;
    publicTransparency: number;
    score: number;
  };

  // Social Innovation (10% of social)
  socialInnovation: {
    socialTechSolutions: number;
    accessibilityFeatures: number;
    digitalInclusion: number;
    socialEntrepreneurship: number;
    score: number;
  };
}

// =============================================================================
// SUSTAINABILITY SCORE COMPONENTS (35% weight)
// =============================================================================

export interface SustainabilityScoreComponents {
  // Environmental Impact (35% of sustainability)
  environmentalImpact: {
    carbonFootprint: number;
    energyEfficiency: number;
    wasteReduction: number;
    waterConservation: number;
    score: number;
  };

  // Resource Management (25% of sustainability)
  resourceManagement: {
    renewableEnergy: number;
    sustainableMaterials: number;
    circularEconomy: number;
    resourceEfficiency: number;
    score: number;
  };

  // Green Innovation (20% of sustainability)
  greenInnovation: {
    cleanTechnology: number;
    sustainableProducts: number;
    ecoFriendlyProcesses: number;
    greenResearch: number;
    score: number;
  };

  // Compliance & Certifications (15% of sustainability)
  complianceCertifications: {
    environmentalCertifications: number;
    regulatoryCompliance: number;
    sustainabilityReporting: number;
    thirdPartyAudits: number;
    score: number;
  };

  // Future Sustainability (5% of sustainability)
  futureSustainability: {
    sustainabilityGoals: number;
    climateCommitments: number;
    sustainabilityInnovation: number;
    longTermPlanning: number;
    score: number;
  };
}

// =============================================================================
// ECONOMIC SCORE COMPONENTS (25% weight)
// =============================================================================

export interface EconomicScoreComponents {
  // Financial Performance (40% of economic)
  financialPerformance: {
    profitability: number;
    revenue: number;
    growthRate: number;
    financialStability: number;
    score: number;
  };

  // Economic Impact (25% of economic)
  economicImpact: {
    jobCreation: number;
    localEconomicContribution: number;
    supplierPayments: number;
    taxContribution: number;
    score: number;
  };

  // Innovation & R&D (20% of economic)
  innovationRD: {
    rdInvestment: number;
    patentsTrademarks: number;
    productInnovation: number;
    technologyAdoption: number;
    score: number;
  };

  // Market Position (10% of economic)
  marketPosition: {
    marketShare: number;
    competitiveAdvantage: number;
    brandValue: number;
    customerLoyalty: number;
    score: number;
  };

  // Risk Management (5% of economic)
  riskManagement: {
    financialRisk: number;
    operationalRisk: number;
    marketRisk: number;
    complianceRisk: number;
    score: number;
  };
}

// =============================================================================
// SSE METRICS
// =============================================================================

export interface SSEMetric {
  id: string;
  userId: string;
  organizationId?: string;

  // Metric identification
  metricCategory: 'social' | 'sustainability' | 'economic';
  metricName: string;
  metricCode: string;

  // Metric value
  value: number;
  unit?: string;
  weight: number;

  // Data source and quality
  dataSource?: string;
  dataQualityScore: number;

  // Metadata
  measuredAt: Date;
  createdAt: Date;
}

export interface SSEMetricDefinition {
  code: string;
  name: string;
  description: string;
  category: 'social' | 'sustainability' | 'economic';
  subcategory: string;
  unit: string;
  weight: number;
  calculationMethod: string;
  dataRequirements: string[];
  benchmarkAvailable: boolean;
  updateFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
}

// =============================================================================
// BENCHMARKING
// =============================================================================

export interface SSEBenchmark {
  id: string;
  industry: string;
  organizationSize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  region: string;

  // Social benchmarks
  socialP25: number;
  socialP50: number;
  socialP75: number;
  socialP90: number;

  // Sustainability benchmarks
  sustainabilityP25: number;
  sustainabilityP50: number;
  sustainabilityP75: number;
  sustainabilityP90: number;

  // Economic benchmarks
  economicP25: number;
  economicP50: number;
  economicP75: number;
  economicP90: number;

  // Sample data
  sampleSize: number;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
}

export interface UserBenchmarkPosition {
  userId: string;
  industry: string;
  organizationSize: string;
  region: string;

  // Overall position
  overallPercentile: number;
  overallRank: number;
  totalParticipants: number;

  // Category positions
  socialPercentile: number;
  sustainabilityPercentile: number;
  economicPercentile: number;

  // Comparison data
  industryAverage: SSEScore;
  topPerformer: SSEScore;
  improvementPotential: number;
}

// =============================================================================
// BEHAVIORAL TRACKING
// =============================================================================

export interface UserBehavior {
  id: string;
  userId: string;

  // Behavior details
  behaviorType: string;
  behaviorCategory: 'social' | 'sustainability' | 'economic';
  behaviorData: any;

  // Impact on SSE scores
  socialImpact: number;
  sustainabilityImpact: number;
  economicImpact: number;

  // Metadata
  occurredAt: Date;
  createdAt: Date;
}

export interface DailyQuestion {
  id: string;
  questionText: string;
  questionType: 'boolean' | 'numeric' | 'multiple_choice' | 'scale';
  category: 'social' | 'sustainability' | 'economic';

  // Question options (for multiple choice)
  options?: { [key: string]: string };

  // Scoring weights
  socialWeight: number;
  sustainabilityWeight: number;
  economicWeight: number;

  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserQuestionResponse {
  id: string;
  userId: string;
  questionId: string;

  // Response data
  responseValue: string;
  responseData?: any;

  // Calculated impact
  socialImpact: number;
  sustainabilityImpact: number;
  economicImpact: number;

  // Metadata
  respondedAt: Date;
  createdAt: Date;
}

// =============================================================================
// SCORING REQUESTS AND RESPONSES
// =============================================================================

export interface CalculateSSEScoreRequest {
  userId: string;
  organizationId?: string;
  includeProjections?: boolean;
  includeBenchmarks?: boolean;
  timeRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface SSEScoreResponse {
  success: boolean;
  message: string;
  data: {
    currentScore: SSEScore;
    previousScore?: SSEScore;
    scoreChange?: {
      overall: number;
      social: number;
      sustainability: number;
      economic: number;
    };
    benchmarkPosition?: UserBenchmarkPosition;
    recommendations?: SSERecommendation[];
    trends?: SSEScoreTrend[];
  };
  timestamp: string;
}

export interface SSERecommendation {
  id: string;
  category: 'social' | 'sustainability' | 'economic';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: number;
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
  actionItems: string[];
}

export interface SSEScoreTrend {
  date: Date;
  overallScore: number;
  socialScore: number;
  sustainabilityScore: number;
  economicScore: number;
}

// =============================================================================
// ANALYTICS AND REPORTING
// =============================================================================

export interface SSEAnalytics {
  userId: string;
  organizationId?: string;

  // Score progression
  scoreProgression: SSEScoreTrend[];

  // Performance metrics
  performanceMetrics: {
    averageMonthlyImprovement: number;
    bestPerformingCategory: 'social' | 'sustainability' | 'economic';
    mostImprovedMetric: string;
    consistencyScore: number;
  };

  // Behavioral insights
  behavioralInsights: {
    mostImpactfulBehaviors: string[];
    behaviorFrequency: { [behavior: string]: number };
    streakDays: number;
    engagementScore: number;
  };

  // Comparative analysis
  comparativeAnalysis: {
    industryComparison: number;
    peerComparison: number;
    globalComparison: number;
    improvementPotential: number;
  };
}

export interface SSEReport {
  id: string;
  userId: string;
  organizationId?: string;

  // Report details
  reportType: 'monthly' | 'quarterly' | 'annual' | 'custom';
  title: string;
  description: string;

  // Report data
  executiveSummary: string;
  keyFindings: string[];
  scoreAnalysis: SSEAnalytics;
  recommendations: SSERecommendation[];

  // Report metadata
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
  version: string;
}

// =============================================================================
// GAMIFICATION
// =============================================================================

export interface SSEAchievement {
  id: string;
  name: string;
  description: string;
  category: 'social' | 'sustainability' | 'economic' | 'overall';

  // Achievement criteria
  criteria: {
    metricCode?: string;
    threshold?: number;
    timeframe?: string;
    condition: string;
  };

  // Rewards
  points: number;
  badgeIcon: string;

  // Metadata
  isActive: boolean;
  createdAt: Date;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;

  // Achievement details
  unlockedAt: Date;
  progress: number;
  isCompleted: boolean;

  // Metadata
  createdAt: Date;
}

export interface SSELeaderboard {
  id: string;
  name: string;
  description: string;
  category: 'social' | 'sustainability' | 'economic' | 'overall';

  // Leaderboard settings
  scope: 'global' | 'industry' | 'organization' | 'region';
  timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'all_time';

  // Leaderboard data
  entries: SSELeaderboardEntry[];

  // Metadata
  lastUpdated: Date;
  createdAt: Date;
}

export interface SSELeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  organizationName?: string;
  score: number;
  change: number;
  avatar?: string;
}
