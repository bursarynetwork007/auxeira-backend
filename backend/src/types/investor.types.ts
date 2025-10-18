/**
 * Investor Dashboard Type Definitions
 * Comprehensive types for investor profiles, opportunities, and portfolio management
 */

export interface InvestorProfile {
  id: string;
  userId: string;
  investorType: InvestorType;
  investmentFocus: InvestmentFocus[];
  investmentRange: InvestmentRange;
  portfolioSize: number;
  totalInvested: number;
  successfulExits: number;
  investmentCriteria: InvestmentCriteria;
  geographicPreferences: string[];
  industryPreferences: string[];
  stagePreferences: StartupStage[];
  isActive: boolean;
  isVerified: boolean;
  verificationDocuments: VerificationDocument[];
  performanceMetrics: InvestorPerformanceMetrics;
  createdAt: Date;
  updatedAt?: Date;
}

export interface InvestmentOpportunity {
  id: string;
  startupId: string;
  startupName: string;
  startupLogo?: string;
  title: string;
  description: string;
  fundingGoal: number;
  fundingRaised: number;
  valuation: number;
  equityOffered: number;
  minimumInvestment: number;
  maximumInvestment?: number;
  investmentType: InvestmentType;
  stage: StartupStage;
  industry: string;
  region: string;
  sseScore: number;
  riskAssessment: RiskAssessment;
  financialProjections: FinancialProjections;
  documents: OpportunityDocument[];
  status: OpportunityStatus;
  isFeatured: boolean;
  deadline?: Date;
  metrics: OpportunityMetrics;
  createdAt: Date;
  updatedAt?: Date;
}

export interface InvestmentInterest {
  id: string;
  investorId: string;
  opportunityId: string;
  interestLevel: InterestLevel;
  investmentAmount?: number;
  message?: string;
  status: InterestStatus;
  dueDiligenceStatus: DueDiligenceStatus;
  dueDiligenceNotes?: string;
  meetingScheduled: boolean;
  meetingDate?: Date;
  decisionDate?: Date;
  decision?: InvestmentDecision;
  decisionNotes?: string;
  timeline: InterestTimeline;
  createdAt: Date;
  updatedAt?: Date;
}

export interface InvestmentTransaction {
  id: string;
  investorId: string;
  opportunityId: string;
  interestId: string;
  amount: number;
  equityPercentage: number;
  valuation: number;
  transactionType: TransactionType;
  status: TransactionStatus;
  contractDocuments: ContractDocument[];
  legalReviewStatus: LegalReviewStatus;
  complianceChecks: ComplianceCheck[];
  executedAt?: Date;
  settlementDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PortfolioCompany {
  id: string;
  investorId: string;
  startupId: string;
  startupName: string;
  startupLogo?: string;
  investmentTransactionId: string;
  equityPercentage: number;
  investmentAmount: number;
  currentValuation?: number;
  performanceMetrics: PortfolioPerformanceMetrics;
  milestones: PortfolioMilestone[];
  status: PortfolioStatus;
  exitDate?: Date;
  exitValuation?: number;
  exitType?: ExitType;
  roi?: number;
  communications: PortfolioCommunication[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface InvestmentRange {
  minimum: number;
  maximum: number;
  preferred: number;
  currency: string;
  checkSize: {
    seed: { min: number; max: number; };
    seriesA: { min: number; max: number; };
    seriesB: { min: number; max: number; };
    growth: { min: number; max: number; };
  };
}

export interface InvestmentCriteria {
  minimumSSEScore?: number;
  requiredStages: StartupStage[];
  preferredIndustries: string[];
  excludedIndustries: string[];
  geographicRestrictions: string[];
  minimumRevenue?: number;
  minimumGrowthRate?: number;
  teamSizeRange?: { min: number; max: number; };
  customCriteria: CustomCriterion[];
}

export interface CustomCriterion {
  name: string;
  description: string;
  type: 'boolean' | 'number' | 'string' | 'range';
  value: any;
  weight: number;
  isRequired: boolean;
}

export interface RiskAssessment {
  overallRisk: RiskLevel;
  riskFactors: RiskFactor[];
  riskScore: number;
  mitigationStrategies: string[];
  marketRisk: number;
  executionRisk: number;
  financialRisk: number;
  competitiveRisk: number;
  regulatoryRisk: number;
  assessmentDate: Date;
  assessedBy: string;
}

export interface RiskFactor {
  category: string;
  description: string;
  severity: RiskSeverity;
  probability: number;
  impact: number;
  mitigation?: string;
}

export interface FinancialProjections {
  projectionPeriod: number; // in years
  revenue: YearlyProjection[];
  expenses: YearlyProjection[];
  netIncome: YearlyProjection[];
  cashFlow: YearlyProjection[];
  assumptions: ProjectionAssumption[];
  scenarios: {
    conservative: ScenarioProjection;
    base: ScenarioProjection;
    optimistic: ScenarioProjection;
  };
  keyMetrics: FinancialMetrics;
}

export interface YearlyProjection {
  year: number;
  value: number;
  growth: number;
  confidence: number;
}

export interface ProjectionAssumption {
  category: string;
  description: string;
  value: any;
  rationale: string;
}

export interface ScenarioProjection {
  probability: number;
  revenue5Year: number;
  valuation5Year: number;
  exitMultiple: number;
  timeToExit: number;
}

export interface FinancialMetrics {
  currentARR?: number;
  monthlyGrowthRate: number;
  burnRate: number;
  runway: number; // in months
  ltv: number; // Lifetime value
  cac: number; // Customer acquisition cost
  ltvCacRatio: number;
  grossMargin: number;
  netMargin: number;
}

export interface OpportunityMetrics {
  viewCount: number;
  interestCount: number;
  applicationCount: number;
  conversionRate: number;
  averageInvestmentSize: number;
  timeToClose: number; // in days
  investorQuality: number;
  lastUpdated: Date;
}

export interface InvestorPerformanceMetrics {
  totalInvestments: number;
  totalReturns: number;
  averageROI: number;
  successRate: number;
  averageHoldingPeriod: number; // in years
  portfolioValue: number;
  unrealizedGains: number;
  realizedGains: number;
  irr: number; // Internal rate of return
  tvpi: number; // Total value to paid-in
  dpi: number; // Distributions to paid-in
  lastUpdated: Date;
}

export interface PortfolioPerformanceMetrics {
  currentValuation: number;
  valuationChange: number;
  revenueGrowth: number;
  userGrowth: number;
  sseScoreChange: number;
  milestoneCompletion: number;
  riskScore: number;
  healthScore: number;
  lastUpdated: Date;
}

export interface PortfolioMilestone {
  id: string;
  title: string;
  description: string;
  category: MilestoneCategory;
  targetDate: Date;
  completedDate?: Date;
  status: MilestoneStatus;
  impact: MilestoneImpact;
  evidence?: string[];
  notes?: string;
}

export interface PortfolioCommunication {
  id: string;
  type: CommunicationType;
  subject: string;
  content: string;
  sender: string;
  recipient: string;
  attachments?: string[];
  isRead: boolean;
  sentAt: Date;
  readAt?: Date;
}

export interface InterestTimeline {
  expressed: Date;
  initialReview?: Date;
  dueDiligenceStarted?: Date;
  meetingScheduled?: Date;
  meetingCompleted?: Date;
  termSheetSent?: Date;
  termSheetSigned?: Date;
  legalReviewStarted?: Date;
  legalReviewCompleted?: Date;
  fundsTransferred?: Date;
}

export interface VerificationDocument {
  id: string;
  type: DocumentType;
  name: string;
  url: string;
  status: VerificationStatus;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  notes?: string;
}

export interface OpportunityDocument {
  id: string;
  type: OpportunityDocumentType;
  name: string;
  url: string;
  size: number;
  isPublic: boolean;
  accessLevel: AccessLevel;
  uploadedAt: Date;
  downloadCount: number;
}

export interface ContractDocument {
  id: string;
  type: ContractType;
  name: string;
  url: string;
  version: string;
  status: DocumentStatus;
  signedBy: string[];
  createdAt: Date;
  signedAt?: Date;
}

export interface ComplianceCheck {
  checkType: string;
  status: ComplianceStatus;
  result: boolean;
  details: string;
  checkedAt: Date;
  checkedBy: string;
}

// Enums and Union Types
export type InvestorType =
  | 'angel'
  | 'venture_capital'
  | 'private_equity'
  | 'family_office'
  | 'corporate_venture'
  | 'government'
  | 'crowdfunding'
  | 'strategic';

export type InvestmentFocus =
  | 'early_stage'
  | 'growth_stage'
  | 'late_stage'
  | 'pre_seed'
  | 'seed'
  | 'series_a'
  | 'series_b'
  | 'series_c_plus'
  | 'bridge'
  | 'mezzanine';

export type StartupStage =
  | 'idea'
  | 'pre_seed'
  | 'seed'
  | 'early_stage'
  | 'growth_stage'
  | 'expansion'
  | 'mature'
  | 'exit_ready';

export type InvestmentType =
  | 'equity'
  | 'convertible_note'
  | 'safe'
  | 'debt'
  | 'revenue_share'
  | 'hybrid';

export type OpportunityStatus =
  | 'draft'
  | 'review'
  | 'active'
  | 'paused'
  | 'closed'
  | 'funded'
  | 'cancelled';

export type InterestLevel =
  | 'watching'
  | 'interested'
  | 'very_interested'
  | 'ready_to_invest';

export type InterestStatus =
  | 'pending'
  | 'under_review'
  | 'due_diligence'
  | 'term_sheet'
  | 'legal_review'
  | 'completed'
  | 'declined'
  | 'withdrawn';

export type DueDiligenceStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'on_hold'
  | 'cancelled';

export type InvestmentDecision =
  | 'invest'
  | 'decline'
  | 'defer'
  | 'counter_offer';

export type TransactionType =
  | 'initial_investment'
  | 'follow_on'
  | 'bridge_round'
  | 'exit_partial'
  | 'exit_full';

export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'disputed';

export type LegalReviewStatus =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'requires_changes'
  | 'rejected';

export type PortfolioStatus =
  | 'active'
  | 'monitoring'
  | 'at_risk'
  | 'exited'
  | 'written_off';

export type ExitType =
  | 'ipo'
  | 'acquisition'
  | 'merger'
  | 'buyback'
  | 'liquidation';

export type RiskLevel =
  | 'very_low'
  | 'low'
  | 'medium'
  | 'high'
  | 'very_high';

export type RiskSeverity =
  | 'minor'
  | 'moderate'
  | 'major'
  | 'critical';

export type MilestoneCategory =
  | 'revenue'
  | 'user_growth'
  | 'product'
  | 'team'
  | 'funding'
  | 'partnerships'
  | 'compliance'
  | 'exit_prep';

export type MilestoneStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'delayed'
  | 'at_risk'
  | 'cancelled';

export type MilestoneImpact =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type CommunicationType =
  | 'update'
  | 'milestone'
  | 'request'
  | 'alert'
  | 'report'
  | 'meeting_notes';

export type DocumentType =
  | 'identity'
  | 'accreditation'
  | 'financial_statement'
  | 'tax_document'
  | 'compliance_certificate'
  | 'reference_letter';

export type VerificationStatus =
  | 'pending'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'expired';

export type OpportunityDocumentType =
  | 'pitch_deck'
  | 'business_plan'
  | 'financial_model'
  | 'legal_documents'
  | 'product_demo'
  | 'market_research'
  | 'team_bios'
  | 'references';

export type AccessLevel =
  | 'public'
  | 'interested_investors'
  | 'due_diligence'
  | 'term_sheet'
  | 'confidential';

export type ContractType =
  | 'term_sheet'
  | 'investment_agreement'
  | 'shareholders_agreement'
  | 'board_consent'
  | 'disclosure_schedule'
  | 'side_letter';

export type DocumentStatus =
  | 'draft'
  | 'review'
  | 'final'
  | 'signed'
  | 'executed';

export type ComplianceStatus =
  | 'pending'
  | 'passed'
  | 'failed'
  | 'requires_review';

// Request/Response Interfaces
export interface CreateInvestorProfileRequest {
  investorType: InvestorType;
  investmentFocus: InvestmentFocus[];
  investmentRange: InvestmentRange;
  investmentCriteria: InvestmentCriteria;
  geographicPreferences: string[];
  industryPreferences: string[];
  stagePreferences: StartupStage[];
}

export interface UpdateInvestorProfileRequest {
  investmentFocus?: InvestmentFocus[];
  investmentRange?: Partial<InvestmentRange>;
  investmentCriteria?: Partial<InvestmentCriteria>;
  geographicPreferences?: string[];
  industryPreferences?: string[];
  stagePreferences?: StartupStage[];
}

export interface CreateOpportunityRequest {
  title: string;
  description: string;
  fundingGoal: number;
  valuation: number;
  equityOffered: number;
  minimumInvestment: number;
  maximumInvestment?: number;
  investmentType: InvestmentType;
  stage: StartupStage;
  industry: string;
  region: string;
  deadline?: Date;
}

export interface UpdateOpportunityRequest {
  title?: string;
  description?: string;
  fundingGoal?: number;
  valuation?: number;
  equityOffered?: number;
  minimumInvestment?: number;
  maximumInvestment?: number;
  deadline?: Date;
  status?: OpportunityStatus;
}

export interface ExpressInterestRequest {
  opportunityId: string;
  interestLevel: InterestLevel;
  investmentAmount?: number;
  message?: string;
}

export interface UpdateInterestRequest {
  interestLevel?: InterestLevel;
  investmentAmount?: number;
  dueDiligenceNotes?: string;
  meetingDate?: Date;
  decision?: InvestmentDecision;
  decisionNotes?: string;
}

export interface GetOpportunitiesRequest {
  stage?: StartupStage;
  industry?: string;
  region?: string;
  minFunding?: number;
  maxFunding?: number;
  minSSEScore?: number;
  investmentType?: InvestmentType;
  status?: OpportunityStatus;
  featured?: boolean;
  sortBy?: 'created_at' | 'funding_goal' | 'sse_score' | 'deadline';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface GetInvestorsRequest {
  investorType?: InvestorType;
  investmentFocus?: InvestmentFocus;
  minInvestment?: number;
  maxInvestment?: number;
  industry?: string;
  region?: string;
  verified?: boolean;
  active?: boolean;
  limit?: number;
  offset?: number;
}

export interface InvestorDashboardResponse {
  profile: InvestorProfile;
  opportunities: {
    recommended: InvestmentOpportunity[];
    watching: InvestmentOpportunity[];
    applied: InvestmentOpportunity[];
    total: number;
  };
  portfolio: {
    companies: PortfolioCompany[];
    totalValue: number;
    totalROI: number;
    performanceSummary: PortfolioPerformanceMetrics;
  };
  interests: InvestmentInterest[];
  analytics: InvestorAnalytics;
  notifications: InvestorNotification[];
}

export interface StartupInvestorResponse {
  opportunity: InvestmentOpportunity;
  interests: {
    total: number;
    byLevel: Record<InterestLevel, number>;
    recent: InvestmentInterest[];
  };
  matchedInvestors: {
    investor: InvestorProfile;
    matchScore: number;
    matchReasons: string[];
  }[];
  analytics: OpportunityAnalytics;
}

export interface InvestorAnalytics {
  period: string;
  opportunitiesViewed: number;
  interestsExpressed: number;
  investmentsMade: number;
  totalInvested: number;
  portfolioPerformance: PortfolioPerformanceMetrics;
  roiMetrics: {
    realized: number;
    unrealized: number;
    total: number;
    irr: number;
  };
  riskMetrics: {
    portfolioRisk: number;
    diversificationScore: number;
    concentrationRisk: number;
  };
  benchmarkComparison: {
    vsMarket: number;
    vsPeers: number;
    percentile: number;
  };
}

export interface OpportunityAnalytics {
  totalViews: number;
  uniqueInvestors: number;
  interestConversion: number;
  averageInterestAmount: number;
  geographicDistribution: Record<string, number>;
  investorTypeDistribution: Record<InvestorType, number>;
  timeToInterest: number; // average days
  competitiveAnalysis: {
    similarOpportunities: number;
    averageValuation: number;
    marketPosition: string;
  };
}

export interface InvestorNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  relatedEntityId?: string;
  relatedEntityType?: string;
  actionRequired: boolean;
  actionUrl?: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

export type NotificationType =
  | 'new_opportunity'
  | 'opportunity_update'
  | 'interest_response'
  | 'due_diligence_request'
  | 'meeting_scheduled'
  | 'term_sheet_ready'
  | 'investment_completed'
  | 'portfolio_update'
  | 'milestone_achieved'
  | 'risk_alert'
  | 'performance_report';

export type NotificationPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

// Database Schema Interfaces
export interface InvestorProfileDB {
  id: string;
  user_id: string;
  investor_type: InvestorType;
  investment_focus: string; // JSON string
  investment_range: string; // JSON string
  portfolio_size: number;
  total_invested: number;
  successful_exits: number;
  investment_criteria: string; // JSON string
  geographic_preferences: string; // JSON string
  industry_preferences: string; // JSON string
  stage_preferences: string; // JSON string
  is_active: boolean;
  is_verified: boolean;
  verification_documents: string; // JSON string
  created_at: Date;
  updated_at?: Date;
}

export interface InvestmentOpportunityDB {
  id: string;
  startup_id: string;
  title: string;
  description: string;
  funding_goal: number;
  funding_raised: number;
  valuation: number;
  equity_offered: number;
  minimum_investment: number;
  maximum_investment?: number;
  investment_type: InvestmentType;
  stage: StartupStage;
  industry: string;
  region: string;
  sse_score: number;
  risk_assessment: string; // JSON string
  financial_projections: string; // JSON string
  documents: string; // JSON string
  status: OpportunityStatus;
  is_featured: boolean;
  deadline?: Date;
  created_at: Date;
  updated_at?: Date;
}

export interface InvestmentInterestDB {
  id: string;
  investor_id: string;
  opportunity_id: string;
  interest_level: InterestLevel;
  investment_amount?: number;
  message?: string;
  status: InterestStatus;
  due_diligence_status: DueDiligenceStatus;
  due_diligence_notes?: string;
  meeting_scheduled: boolean;
  meeting_date?: Date;
  decision_date?: Date;
  decision?: InvestmentDecision;
  decision_notes?: string;
  created_at: Date;
  updated_at?: Date;
}
