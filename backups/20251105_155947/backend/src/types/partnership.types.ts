/**
 * Partnership Management Type Definitions
 * Comprehensive types for the partnership ecosystem
 */

export interface Partnership {
  id: string;
  name: string;
  type: PartnershipType;
  category: PartnershipCategory;
  description: string;
  benefits: PartnershipBenefit[];
  requirements: PartnershipRequirement;
  sseThreshold: number;
  isActive: boolean;
  featured: boolean;
  logoUrl?: string;
  websiteUrl?: string;
  contactEmail?: string;
  region: string[];
  industries: string[];
  stages: StartupStage[];
  createdAt: Date;
  updatedAt?: Date;
  expiresAt?: Date;
}

export interface PartnershipBenefit {
  id: string;
  title: string;
  description: string;
  type: BenefitType;
  value: BenefitValue;
  conditions?: string[];
  redemptionInstructions: string;
  maxRedemptions?: number;
  validUntil?: Date;
  isActive: boolean;
}

export interface BenefitValue {
  type: 'percentage' | 'fixed_amount' | 'free_months' | 'credits' | 'custom';
  amount?: number;
  currency?: string;
  description: string;
  estimatedValue?: number; // USD equivalent
}

export interface PartnershipRequirement {
  sseScore: {
    minimum: number;
    domains?: SSEDomain[];
  };
  tier: PricingTier[];
  fundingStage?: StartupStage[];
  industry?: string[];
  region?: string[];
  employeeCount?: {
    min?: number;
    max?: number;
  };
  revenue?: {
    min?: number;
    max?: number;
  };
  customCriteria?: {
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
    value: any;
  }[];
}

export interface PartnershipApplication {
  id: string;
  userId: string;
  partnershipId: string;
  status: ApplicationStatus;
  applicationData: ApplicationData;
  appliedAt: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  expiresAt?: Date;
  reviewerId?: string;
  reviewNotes?: string;
  benefitsRedeemed: BenefitRedemption[];
  totalValueRedeemed: number;
}

export interface ApplicationData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  website?: string;
  currentSSEScore: number;
  fundingStage: StartupStage;
  industry: string;
  employeeCount: number;
  monthlyRevenue?: number;
  useCase: string;
  additionalInfo?: string;
  attachments?: string[];
}

export interface BenefitRedemption {
  id: string;
  applicationId: string;
  benefitId: string;
  redeemedAt: Date;
  value: number;
  currency: string;
  redemptionCode?: string;
  notes?: string;
  expiresAt?: Date;
  isUsed: boolean;
  usedAt?: Date;
}

export interface PartnershipAnalytics {
  partnershipId: string;
  period: string; // YYYY-MM format
  applications: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
  };
  redemptions: {
    total: number;
    totalValue: number;
    averageValue: number;
    topBenefits: {
      benefitId: string;
      count: number;
      value: number;
    }[];
  };
  userEngagement: {
    uniqueApplicants: number;
    repeatApplicants: number;
    averageSSEScore: number;
    topIndustries: string[];
    topRegions: string[];
  };
  roi: {
    partnerInvestment: number;
    valueDelivered: number;
    roiPercentage: number;
  };
}

export interface PartnershipMatch {
  userId: string;
  partnership: Partnership;
  matchScore: number;
  matchReasons: string[];
  missingRequirements?: string[];
  potentialValue: number;
  recommendationPriority: 'high' | 'medium' | 'low';
}

export interface PartnerDirectory {
  partnerships: Partnership[];
  categories: PartnershipCategory[];
  filters: {
    types: PartnershipType[];
    regions: string[];
    industries: string[];
    stages: StartupStage[];
    benefitTypes: BenefitType[];
  };
  total: number;
  hasMore: boolean;
}

export interface PartnershipRecommendation {
  userId: string;
  recommendations: PartnershipMatch[];
  totalPotentialValue: number;
  topCategories: PartnershipCategory[];
  personalizedMessage: string;
  generatedAt: Date;
}

export interface PartnerOnboarding {
  id: string;
  partnerName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  website?: string;
  companySize: string;
  industry: string;
  partnershipGoals: string[];
  targetStartupProfile: {
    stages: StartupStage[];
    industries: string[];
    regions: string[];
    sseScoreRange: {
      min: number;
      max: number;
    };
  };
  proposedBenefits: {
    description: string;
    type: BenefitType;
    estimatedValue: number;
    conditions: string[];
  }[];
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  notes?: string;
}

export interface PartnershipPerformance {
  partnershipId: string;
  metrics: {
    totalApplications: number;
    approvalRate: number;
    averageProcessingTime: number; // in hours
    redemptionRate: number;
    userSatisfactionScore: number;
    repeatUsageRate: number;
  };
  trends: {
    period: string;
    applications: number;
    approvals: number;
    redemptions: number;
    value: number;
  }[];
  benchmarks: {
    industryAverage: number;
    topPerformer: number;
    ranking: number;
  };
}

export interface PartnershipContract {
  id: string;
  partnershipId: string;
  contractType: 'standard' | 'premium' | 'enterprise' | 'custom';
  terms: {
    duration: number; // in months
    autoRenewal: boolean;
    terminationNotice: number; // in days
    exclusivity?: string[];
    performanceRequirements?: {
      metric: string;
      target: number;
      period: string;
    }[];
  };
  financials: {
    setupFee?: number;
    monthlyFee?: number;
    commissionRate?: number;
    minimumCommitment?: number;
  };
  signedAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'terminated' | 'suspended';
}

// Enums and Union Types
export type PartnershipType =
  | 'technology'
  | 'service'
  | 'funding'
  | 'mentorship'
  | 'market_access'
  | 'infrastructure'
  | 'legal'
  | 'marketing'
  | 'talent'
  | 'education';

export type PartnershipCategory =
  | 'software_tools'
  | 'cloud_services'
  | 'financial_services'
  | 'legal_services'
  | 'marketing_tools'
  | 'hr_tools'
  | 'development_tools'
  | 'analytics'
  | 'communication'
  | 'productivity'
  | 'security'
  | 'compliance'
  | 'consulting'
  | 'education'
  | 'networking';

export type BenefitType =
  | 'discount'
  | 'free_trial'
  | 'credits'
  | 'consultation'
  | 'priority_support'
  | 'exclusive_access'
  | 'waived_fees'
  | 'custom_pricing'
  | 'extended_trial'
  | 'bonus_features';

export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export type StartupStage =
  | 'idea'
  | 'pre_seed'
  | 'seed'
  | 'series_a'
  | 'series_b'
  | 'series_c'
  | 'growth'
  | 'mature';

export type SSEDomain =
  | 'social'
  | 'sustainability'
  | 'economic'
  | 'overall';

export type PricingTier =
  | 'founder'
  | 'startup'
  | 'growth'
  | 'scale'
  | 'enterprise';

// Request/Response Interfaces
export interface CreatePartnershipRequest {
  name: string;
  type: PartnershipType;
  category: PartnershipCategory;
  description: string;
  benefits: Omit<PartnershipBenefit, 'id'>[];
  requirements: PartnershipRequirement;
  sseThreshold: number;
  logoUrl?: string;
  websiteUrl?: string;
  contactEmail?: string;
  region: string[];
  industries: string[];
  stages: StartupStage[];
  expiresAt?: Date;
}

export interface UpdatePartnershipRequest {
  name?: string;
  description?: string;
  benefits?: Omit<PartnershipBenefit, 'id'>[];
  requirements?: PartnershipRequirement;
  sseThreshold?: number;
  isActive?: boolean;
  featured?: boolean;
  logoUrl?: string;
  websiteUrl?: string;
  contactEmail?: string;
  region?: string[];
  industries?: string[];
  stages?: StartupStage[];
  expiresAt?: Date;
}

export interface ApplyPartnershipRequest {
  partnershipId: string;
  applicationData: Omit<ApplicationData, 'currentSSEScore'>;
}

export interface ReviewApplicationRequest {
  applicationId: string;
  status: 'approved' | 'rejected';
  reviewNotes?: string;
  customBenefits?: Omit<PartnershipBenefit, 'id'>[];
}

export interface RedeemBenefitRequest {
  applicationId: string;
  benefitId: string;
  notes?: string;
}

export interface GetPartnershipsRequest {
  type?: PartnershipType;
  category?: PartnershipCategory;
  region?: string;
  industry?: string;
  stage?: StartupStage;
  minSSEScore?: number;
  maxSSEScore?: number;
  featured?: boolean;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created_at' | 'sse_threshold' | 'applications';
  sortOrder?: 'asc' | 'desc';
}

export interface GetApplicationsRequest {
  status?: ApplicationStatus;
  partnershipId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'applied_at' | 'reviewed_at' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface PartnershipListResponse {
  partnerships: Partnership[];
  total: number;
  hasMore: boolean;
  filters: {
    types: PartnershipType[];
    categories: PartnershipCategory[];
    regions: string[];
    industries: string[];
    stages: StartupStage[];
  };
}

export interface ApplicationListResponse {
  applications: PartnershipApplication[];
  total: number;
  hasMore: boolean;
  summary: {
    pending: number;
    approved: number;
    rejected: number;
    totalValueRedeemed: number;
  };
}

export interface PartnershipRecommendationResponse {
  recommendations: PartnershipMatch[];
  totalPotentialValue: number;
  personalizedMessage: string;
  categories: {
    category: PartnershipCategory;
    count: number;
    averageValue: number;
  }[];
}

// Database Schema Interfaces
export interface PartnershipDB {
  id: string;
  name: string;
  type: PartnershipType;
  category: PartnershipCategory;
  description: string;
  benefits: string; // JSON string
  requirements: string; // JSON string
  sse_threshold: number;
  is_active: boolean;
  featured: boolean;
  logo_url?: string;
  website_url?: string;
  contact_email?: string;
  region: string; // JSON string
  industries: string; // JSON string
  stages: string; // JSON string
  created_at: Date;
  updated_at?: Date;
  expires_at?: Date;
}

export interface PartnershipApplicationDB {
  id: string;
  user_id: string;
  partnership_id: string;
  status: ApplicationStatus;
  application_data: string; // JSON string
  applied_at: Date;
  reviewed_at?: Date;
  approved_at?: Date;
  rejected_at?: Date;
  expires_at?: Date;
  reviewer_id?: string;
  review_notes?: string;
  total_value_redeemed: number;
  created_at: Date;
}

export interface BenefitRedemptionDB {
  id: string;
  application_id: string;
  benefit_id: string;
  redeemed_at: Date;
  value: number;
  currency: string;
  redemption_code?: string;
  notes?: string;
  expires_at?: Date;
  is_used: boolean;
  used_at?: Date;
  created_at: Date;
}
