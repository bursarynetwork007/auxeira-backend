/**
 * Payment Type Definitions
 * Comprehensive types for the payment and subscription system
 */

export interface PricingCalculation {
  tier: PricingTier;
  basePrice: number;
  geographicMultiplier: number;
  performanceMultiplier: number;
  finalPrice: number;
  currency: string;
  isAnnual: boolean;
  discountPercentage: number;
  features: string[];
  qualificationCriteria: QualificationCriteria;
  savings?: number; // Annual savings if applicable
}

export interface QualificationCriteria {
  fundingRaised: { min: number; max: number };
  monthlyRevenue: { min: number; max: number };
  employees: { min: number; max: number };
}

export interface Customer {
  id: string;
  userId: string;
  stripeCustomerId: string;
  email: string;
  name: string;
  organizationName?: string;
  countryCode?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface SubscriptionPlan {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  planType: PricingTier;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  pricingData: PricingCalculation;
  createdAt: Date;
  updatedAt?: Date;
  cancelAtPeriodEnd?: boolean;
  cancelledAt?: Date;
  cancellationReason?: string;
}

export interface PaymentIntent {
  id: string;
  userId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  confirmedAt?: Date;
}

export interface Invoice {
  id: string;
  userId: string;
  stripeInvoiceId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate?: Date;
  paidAt?: Date;
  createdAt: Date;
}

export interface UsageBasedCharges {
  apiCallOverages: number; // Number of API calls over the limit
  premiumIntroductions: number; // Number of premium partner introductions
  customReports: number; // Number of custom reports generated
  period: string; // YYYY-MM format
}

export interface UsageCharge {
  id: string;
  userId: string;
  period: string;
  apiOverages: number;
  premiumIntroductions: number;
  customReports: number;
  totalAmount: number;
  createdAt: Date;
}

export interface GeographicMultiplier {
  countryCode: string;
  multiplier: number;
  currency: string;
  region: string;
}

export interface PerformanceMultiplier {
  sseScore: number;
  multiplier: number;
  description: string;
}

export interface PricingTierConfig {
  basePrice: number;
  annualPrice: number;
  targetSegment: string;
  qualificationCriteria: QualificationCriteria;
  features: string[];
  limits: {
    apiCalls: number;
    partnerIntroductions: number;
    customReports: number;
    users: number;
  };
  support: {
    level: 'community' | 'email' | 'priority' | 'dedicated';
    responseTime: string;
  };
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  stripePaymentMethodId: string;
  type: 'card' | 'bank_account' | 'wallet';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  billingAddress?: BillingAddress;
  createdAt: Date;
}

export interface TierRecommendation {
  recommendedTier: PricingTier;
  qualificationStatus: Record<PricingTier, boolean>;
  reasoning: string;
  potentialSavings?: number;
  upgradeIncentives?: string[];
}

export interface SubscriptionAnalytics {
  userId: string;
  tier: PricingTier;
  monthlyRevenue: number;
  annualRevenue: number;
  churnRisk: 'low' | 'medium' | 'high';
  usageMetrics: {
    apiCalls: number;
    partnerIntroductions: number;
    customReports: number;
    loginFrequency: number;
  };
  valueRealization: {
    partnerSavings: number;
    auxTokensEarned: number;
    roiPercentage: number;
  };
  upgradeOpportunity?: {
    suggestedTier: PricingTier;
    additionalValue: string[];
    estimatedRoi: number;
  };
}

export interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  currency?: string;
  validFrom: Date;
  validUntil: Date;
  maxUses?: number;
  usedCount: number;
  applicableTiers: PricingTier[];
  isActive: boolean;
  createdAt: Date;
}

export interface SubscriptionUpgrade {
  id: string;
  userId: string;
  fromTier: PricingTier;
  toTier: PricingTier;
  effectiveDate: Date;
  prorationAmount: number;
  reason: string;
  createdAt: Date;
}

export interface ChurnPrevention {
  userId: string;
  riskScore: number; // 0-100
  riskFactors: string[];
  interventions: {
    type: 'discount' | 'feature_unlock' | 'support_outreach' | 'tier_adjustment';
    description: string;
    implemented: boolean;
    implementedAt?: Date;
  }[];
  lastAssessment: Date;
}

export interface RevenueMetrics {
  period: string; // YYYY-MM format
  totalRevenue: number;
  recurringRevenue: number;
  usageRevenue: number;
  newCustomers: number;
  churnedCustomers: number;
  upgrades: number;
  downgrades: number;
  averageRevenuePerUser: number;
  customerLifetimeValue: number;
  churnRate: number;
  growthRate: number;
}

export interface TierMigration {
  userId: string;
  currentTier: PricingTier;
  eligibleTiers: PricingTier[];
  migrationPath: {
    tier: PricingTier;
    requirements: string[];
    timeline: string;
    benefits: string[];
  }[];
  autoUpgradeEnabled: boolean;
  nextReviewDate: Date;
}

// Enums and Union Types
export type PricingTier =
  | 'founder'
  | 'startup'
  | 'growth'
  | 'scale'
  | 'enterprise';

export type SubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid';

export type PaymentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded';

export type InvoiceStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'uncollectible'
  | 'void';

export type BillingInterval = 'month' | 'year';

export type Currency =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'CAD'
  | 'AUD'
  | 'JPY'
  | 'SGD'
  | 'INR'
  | 'BRL'
  | 'MXN'
  | 'ZAR';

export type PaymentMethodType = 'card' | 'bank_account' | 'wallet';

export type ChurnRisk = 'low' | 'medium' | 'high';

export type DiscountType = 'percentage' | 'fixed_amount';

// Request/Response Interfaces
export interface CreateCustomerRequest {
  email: string;
  name: string;
  organizationName?: string;
  countryCode?: string;
  billingAddress?: BillingAddress;
}

export interface CreateSubscriptionRequest {
  tier: PricingTier;
  isAnnual?: boolean;
  paymentMethodId?: string;
  promoCode?: string;
}

export interface UpdateSubscriptionRequest {
  tier: PricingTier;
  isAnnual?: boolean;
  effectiveDate?: Date;
}

export interface CancelSubscriptionRequest {
  cancelAtPeriodEnd?: boolean;
  reason?: string;
  feedback?: string;
}

export interface CalculatePricingRequest {
  tier: PricingTier;
  isAnnual?: boolean;
  countryCode?: string;
  promoCode?: string;
}

export interface ProcessUsageRequest {
  apiCallOverages?: number;
  premiumIntroductions?: number;
  customReports?: number;
}

export interface GetRecommendationRequest {
  includeUpgradeIncentives?: boolean;
  includeDowngradeOptions?: boolean;
}

export interface PricingResponse {
  calculation: PricingCalculation;
  recommendation?: TierRecommendation;
  promoApplied?: {
    code: string;
    discount: number;
    description: string;
  };
}

export interface SubscriptionResponse {
  subscription: SubscriptionPlan;
  customer: Customer;
  paymentMethod?: PaymentMethod;
  nextInvoice?: {
    amount: number;
    date: Date;
  };
}

export interface UsageResponse {
  currentUsage: {
    apiCalls: number;
    partnerIntroductions: number;
    customReports: number;
  };
  limits: {
    apiCalls: number;
    partnerIntroductions: number;
    customReports: number;
  };
  overages: UsageBasedCharges;
  estimatedCharges: number;
}

export interface BillingHistoryResponse {
  invoices: Invoice[];
  payments: PaymentIntent[];
  usageCharges: UsageCharge[];
  total: number;
  hasMore: boolean;
}

// Database Schema Interfaces
export interface StripeCustomerDB {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  email: string;
  name: string;
  organization_name?: string;
  country_code?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface SubscriptionDB {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  plan_type: PricingTier;
  status: SubscriptionStatus;
  current_period_start: Date;
  current_period_end: Date;
  pricing_data: string; // JSON string
  cancel_at_period_end?: boolean;
  cancelled_at?: Date;
  cancellation_reason?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface PaymentDB {
  id: string;
  user_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  metadata?: string; // JSON string
  created_at: Date;
  confirmed_at?: Date;
}

export interface UsageChargeDB {
  id: string;
  user_id: string;
  period: string;
  api_overages: number;
  premium_introductions: number;
  custom_reports: number;
  total_amount: number;
  created_at: Date;
}
