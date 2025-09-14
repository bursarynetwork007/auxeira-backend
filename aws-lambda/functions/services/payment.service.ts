/**
 * Payment Service
 * Handles Stripe integration, subscription management, and pricing tiers
 * Based on the revised pricing structure with geographic and performance multipliers
 */

import Stripe from 'stripe';
import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';
import {
  PricingTier,
  SubscriptionPlan,
  PaymentIntent,
  Customer,
  Invoice,
  PricingCalculation,
  GeographicMultiplier,
  PerformanceMultiplier,
  UsageBasedCharges
} from '../types/payment.types';

export class PaymentService {
  private stripe: Stripe;
  private readonly WEBHOOK_SECRET: string;

  // Revised pricing tiers from the specification
  private readonly PRICING_TIERS: Record<PricingTier, {
    basePrice: number;
    annualPrice: number;
    targetSegment: string;
    qualificationCriteria: {
      fundingRaised: { min: number; max: number };
      monthlyRevenue: { min: number; max: number };
      employees: { min: number; max: number };
    };
    features: string[];
  }> = {
    founder: {
      basePrice: 0,
      annualPrice: 0,
      targetSegment: 'Bootstrap/Pre-revenue',
      qualificationCriteria: {
        fundingRaised: { min: 0, max: 10000 },
        monthlyRevenue: { min: 0, max: 5000 },
        employees: { min: 0, max: 5 }
      },
      features: ['Basic SSE tracking', 'Limited partner benefits', 'Community access']
    },
    startup: {
      basePrice: 99,
      annualPrice: 949, // 20% discount
      targetSegment: 'Pre-Seed to Seed',
      qualificationCriteria: {
        fundingRaised: { min: 10000, max: 500000 },
        monthlyRevenue: { min: 0, max: 25000 },
        employees: { min: 5, max: 15 }
      },
      features: ['Full SSE tracking', 'Partner discounts', 'AI mentorship', 'Basic analytics']
    },
    growth: {
      basePrice: 299,
      annualPrice: 2869,
      targetSegment: 'Series A',
      qualificationCriteria: {
        fundingRaised: { min: 500000, max: 5000000 },
        monthlyRevenue: { min: 25000, max: 100000 },
        employees: { min: 15, max: 50 }
      },
      features: ['Advanced analytics', 'Investor dashboard', 'Priority support', 'Custom reports']
    },
    scale: {
      basePrice: 699,
      annualPrice: 6709,
      targetSegment: 'Series B+',
      qualificationCriteria: {
        fundingRaised: { min: 5000000, max: 50000000 },
        monthlyRevenue: { min: 100000, max: 1000000 },
        employees: { min: 50, max: 200 }
      },
      features: ['Enterprise features', 'Dedicated success manager', 'API access', 'White-label options']
    },
    enterprise: {
      basePrice: 1999,
      annualPrice: 19189,
      targetSegment: 'Late-stage/Public',
      qualificationCriteria: {
        fundingRaised: { min: 50000000, max: Infinity },
        monthlyRevenue: { min: 1000000, max: Infinity },
        employees: { min: 200, max: Infinity }
      },
      features: ['Full platform access', 'Custom integrations', 'SLA guarantees', 'On-premise deployment']
    }
  };

  // Geographic multipliers for PPP adjustments
  private readonly GEOGRAPHIC_MULTIPLIERS: Record<string, number> = {
    'US': 1.0,
    'CA': 0.95,
    'GB': 1.05,
    'DE': 0.98,
    'FR': 0.98,
    'AU': 0.92,
    'JP': 0.88,
    'SG': 0.85,
    'IN': 0.35,
    'BR': 0.45,
    'MX': 0.42,
    'ZA': 0.38,
    'NG': 0.25,
    'KE': 0.28,
    'EG': 0.32,
    'default': 0.6 // Default for unlisted countries
  };

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key is required');
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Stripe webhook secret is required');
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      typescript: true,
    });

    this.WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  }

  /**
   * Calculate pricing based on tier, geography, and performance
   */
  async calculatePricing(
    userId: string,
    tier: PricingTier,
    isAnnual: boolean = false,
    countryCode?: string
  ): Promise<PricingCalculation> {
    const timer = performanceTimer('payment_calculate_pricing');

    try {
      const baseTier = this.PRICING_TIERS[tier];
      const basePrice = isAnnual ? baseTier.annualPrice : baseTier.basePrice;

      // Get geographic multiplier
      const geoMultiplier = this.getGeographicMultiplier(countryCode);

      // Get performance multiplier based on SSE score
      const performanceMultiplier = await this.getPerformanceMultiplier(userId);

      // Calculate final price
      const finalPrice = Math.round(basePrice * geoMultiplier * performanceMultiplier);

      const calculation: PricingCalculation = {
        tier,
        basePrice,
        geographicMultiplier: geoMultiplier,
        performanceMultiplier,
        finalPrice,
        currency: this.getCurrencyForCountry(countryCode),
        isAnnual,
        discountPercentage: isAnnual ? 20 : 0,
        features: baseTier.features,
        qualificationCriteria: baseTier.qualificationCriteria
      };

      timer.end();
      return calculation;

    } catch (error) {
      timer.end();
      logger.error('Failed to calculate pricing', {
        error: (error as Error).message,
        userId,
        tier
      });
      throw new Error('Failed to calculate pricing');
    }
  }

  /**
   * Create a new customer in Stripe
   */
  async createCustomer(
    userId: string,
    email: string,
    name: string,
    organizationName?: string,
    countryCode?: string
  ): Promise<Customer> {
    const timer = performanceTimer('payment_create_customer');

    try {
      // Create Stripe customer
      const stripeCustomer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
          organizationName: organizationName || '',
          countryCode: countryCode || 'US'
        }
      });

      // Save customer to database
      const customerQuery = `
        INSERT INTO stripe_customers (
          id, user_id, stripe_customer_id, email, name,
          organization_name, country_code, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW()
        ) RETURNING *
      `;

      const customerResult = await pool.query(customerQuery, [
        userId,
        stripeCustomer.id,
        email,
        name,
        organizationName,
        countryCode
      ]);

      const customer: Customer = {
        id: customerResult.rows[0].id,
        userId: customerResult.rows[0].user_id,
        stripeCustomerId: customerResult.rows[0].stripe_customer_id,
        email: customerResult.rows[0].email,
        name: customerResult.rows[0].name,
        organizationName: customerResult.rows[0].organization_name,
        countryCode: customerResult.rows[0].country_code,
        createdAt: customerResult.rows[0].created_at
      };

      timer.end();
      return customer;

    } catch (error) {
      timer.end();
      logger.error('Failed to create customer', {
        error: (error as Error).message,
        userId,
        email
      });
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Create a subscription for a customer
   */
  async createSubscription(
    userId: string,
    tier: PricingTier,
    isAnnual: boolean = false,
    paymentMethodId?: string
  ): Promise<SubscriptionPlan> {
    const timer = performanceTimer('payment_create_subscription');

    try {
      // Get customer
      const customer = await this.getCustomerByUserId(userId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Calculate pricing
      const pricing = await this.calculatePricing(userId, tier, isAnnual, customer.countryCode);

      // Create Stripe price if it doesn't exist
      const priceId = await this.getOrCreatePrice(tier, pricing);

      // Create Stripe subscription
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: customer.stripeCustomerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId,
          tier,
          isAnnual: isAnnual.toString()
        }
      };

      if (paymentMethodId) {
        subscriptionData.default_payment_method = paymentMethodId;
      }

      const stripeSubscription = await this.stripe.subscriptions.create(subscriptionData);

      // Save subscription to database
      const subscriptionQuery = `
        INSERT INTO subscriptions (
          id, user_id, stripe_subscription_id, plan_type, status,
          current_period_start, current_period_end, pricing_data, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW()
        ) RETURNING *
      `;

      const subscriptionResult = await pool.query(subscriptionQuery, [
        userId,
        stripeSubscription.id,
        tier,
        stripeSubscription.status,
        new Date(stripeSubscription.current_period_start * 1000),
        new Date(stripeSubscription.current_period_end * 1000),
        JSON.stringify(pricing)
      ]);

      const subscription: SubscriptionPlan = {
        id: subscriptionResult.rows[0].id,
        userId: subscriptionResult.rows[0].user_id,
        stripeSubscriptionId: subscriptionResult.rows[0].stripe_subscription_id,
        planType: subscriptionResult.rows[0].plan_type,
        status: subscriptionResult.rows[0].status,
        currentPeriodStart: subscriptionResult.rows[0].current_period_start,
        currentPeriodEnd: subscriptionResult.rows[0].current_period_end,
        pricingData: JSON.parse(subscriptionResult.rows[0].pricing_data),
        createdAt: subscriptionResult.rows[0].created_at
      };

      timer.end();
      return subscription;

    } catch (error) {
      timer.end();
      logger.error('Failed to create subscription', {
        error: (error as Error).message,
        userId,
        tier
      });
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Handle subscription upgrade/downgrade
   */
  async updateSubscription(
    userId: string,
    newTier: PricingTier,
    isAnnual?: boolean
  ): Promise<SubscriptionPlan> {
    const timer = performanceTimer('payment_update_subscription');

    try {
      // Get current subscription
      const currentSubscription = await this.getUserSubscription(userId);
      if (!currentSubscription) {
        throw new Error('No active subscription found');
      }

      // Get customer
      const customer = await this.getCustomerByUserId(userId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Calculate new pricing
      const newPricing = await this.calculatePricing(
        userId,
        newTier,
        isAnnual ?? currentSubscription.pricingData.isAnnual,
        customer.countryCode
      );

      // Create new price
      const newPriceId = await this.getOrCreatePrice(newTier, newPricing);

      // Update Stripe subscription
      const stripeSubscription = await this.stripe.subscriptions.update(
        currentSubscription.stripeSubscriptionId,
        {
          items: [{
            id: (await this.stripe.subscriptions.retrieve(currentSubscription.stripeSubscriptionId)).items.data[0].id,
            price: newPriceId
          }],
          proration_behavior: 'create_prorations',
          metadata: {
            userId,
            tier: newTier,
            isAnnual: (isAnnual ?? currentSubscription.pricingData.isAnnual).toString()
          }
        }
      );

      // Update subscription in database
      const updateQuery = `
        UPDATE subscriptions
        SET plan_type = $1,
            pricing_data = $2,
            current_period_start = $3,
            current_period_end = $4,
            updated_at = NOW()
        WHERE user_id = $5 AND status = 'active'
        RETURNING *
      `;

      const updateResult = await pool.query(updateQuery, [
        newTier,
        JSON.stringify(newPricing),
        new Date(stripeSubscription.current_period_start * 1000),
        new Date(stripeSubscription.current_period_end * 1000),
        userId
      ]);

      timer.end();

      return {
        id: updateResult.rows[0].id,
        userId: updateResult.rows[0].user_id,
        stripeSubscriptionId: updateResult.rows[0].stripe_subscription_id,
        planType: updateResult.rows[0].plan_type,
        status: updateResult.rows[0].status,
        currentPeriodStart: updateResult.rows[0].current_period_start,
        currentPeriodEnd: updateResult.rows[0].current_period_end,
        pricingData: JSON.parse(updateResult.rows[0].pricing_data),
        createdAt: updateResult.rows[0].created_at,
        updatedAt: updateResult.rows[0].updated_at
      };

    } catch (error) {
      timer.end();
      logger.error('Failed to update subscription', {
        error: (error as Error).message,
        userId,
        newTier
      });
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    userId: string,
    cancelAtPeriodEnd: boolean = true,
    reason?: string
  ): Promise<void> {
    const timer = performanceTimer('payment_cancel_subscription');

    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      if (cancelAtPeriodEnd) {
        // Cancel at period end
        await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
          metadata: {
            cancellation_reason: reason || 'User requested'
          }
        });

        // Update database
        await pool.query(
          'UPDATE subscriptions SET cancel_at_period_end = true, cancellation_reason = $1 WHERE user_id = $2',
          [reason, userId]
        );
      } else {
        // Cancel immediately
        await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

        // Update database
        await pool.query(
          'UPDATE subscriptions SET status = $1, cancelled_at = NOW(), cancellation_reason = $2 WHERE user_id = $3',
          ['canceled', reason, userId]
        );
      }

      timer.end();

      logger.info('Subscription cancelled', {
        userId,
        subscriptionId: subscription.stripeSubscriptionId,
        cancelAtPeriodEnd,
        reason
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to cancel subscription', {
        error: (error as Error).message,
        userId
      });
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Process usage-based charges
   */
  async processUsageCharges(userId: string, usageData: UsageBasedCharges): Promise<void> {
    const timer = performanceTimer('payment_process_usage_charges');

    try {
      const customer = await this.getCustomerByUserId(userId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      let totalCharges = 0;
      const chargeItems: any[] = [];

      // API call overages
      if (usageData.apiCallOverages > 0) {
        const apiCharges = usageData.apiCallOverages * 0.01; // $0.01 per call
        totalCharges += apiCharges;
        chargeItems.push({
          description: `API call overages (${usageData.apiCallOverages} calls)`,
          amount: Math.round(apiCharges * 100), // Convert to cents
          currency: 'usd'
        });
      }

      // Premium partner introductions
      if (usageData.premiumIntroductions > 0) {
        const introCharges = usageData.premiumIntroductions * 500; // $500 per intro
        totalCharges += introCharges;
        chargeItems.push({
          description: `Premium partner introductions (${usageData.premiumIntroductions})`,
          amount: introCharges * 100,
          currency: 'usd'
        });
      }

      // Custom reports
      if (usageData.customReports > 0) {
        const reportCharges = usageData.customReports * 100; // $100 per report
        totalCharges += reportCharges;
        chargeItems.push({
          description: `Custom reports (${usageData.customReports})`,
          amount: reportCharges * 100,
          currency: 'usd'
        });
      }

      if (totalCharges > 0) {
        // Create invoice item
        await this.stripe.invoiceItems.create({
          customer: customer.stripeCustomerId,
          amount: Math.round(totalCharges * 100),
          currency: 'usd',
          description: 'Usage-based charges',
          metadata: {
            userId,
            period: new Date().toISOString().slice(0, 7), // YYYY-MM format
            ...usageData
          }
        });

        // Save usage charges to database
        const usageQuery = `
          INSERT INTO usage_charges (
            id, user_id, period, api_overages, premium_introductions,
            custom_reports, total_amount, created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW()
          )
        `;

        await pool.query(usageQuery, [
          userId,
          new Date().toISOString().slice(0, 7),
          usageData.apiCallOverages,
          usageData.premiumIntroductions,
          usageData.customReports,
          totalCharges
        ]);
      }

      timer.end();

    } catch (error) {
      timer.end();
      logger.error('Failed to process usage charges', {
        error: (error as Error).message,
        userId,
        usageData
      });
      throw new Error('Failed to process usage charges');
    }
  }

  /**
   * Handle Stripe webhooks
   */
  async handleWebhook(body: string, signature: string): Promise<void> {
    const timer = performanceTimer('payment_handle_webhook');

    try {
      const event = this.stripe.webhooks.constructEvent(body, signature, this.WEBHOOK_SECRET);

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          logger.info('Unhandled webhook event', { type: event.type });
      }

      timer.end();

    } catch (error) {
      timer.end();
      logger.error('Failed to handle webhook', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get recommended tier based on startup metrics
   */
  async getRecommendedTier(userId: string): Promise<{
    recommendedTier: PricingTier;
    qualificationStatus: Record<PricingTier, boolean>;
    reasoning: string;
  }> {
    try {
      // Get startup metrics
      const metricsQuery = `
        SELECT
          o.funding_raised,
          o.monthly_revenue,
          o.employee_count,
          s.overall_score
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        LEFT JOIN sse_scores s ON u.id = s.user_id
        WHERE u.id = $1
        ORDER BY s.calculated_at DESC
        LIMIT 1
      `;

      const result = await pool.query(metricsQuery, [userId]);
      const metrics = result.rows[0] || {};

      const fundingRaised = metrics.funding_raised || 0;
      const monthlyRevenue = metrics.monthly_revenue || 0;
      const employeeCount = metrics.employee_count || 0;

      // Check qualification for each tier
      const qualificationStatus: Record<PricingTier, boolean> = {} as any;
      let recommendedTier: PricingTier = 'founder';

      for (const [tier, config] of Object.entries(this.PRICING_TIERS)) {
        const criteria = config.qualificationCriteria;
        const qualifies =
          fundingRaised >= criteria.fundingRaised.min &&
          fundingRaised <= criteria.fundingRaised.max &&
          monthlyRevenue >= criteria.monthlyRevenue.min &&
          monthlyRevenue <= criteria.monthlyRevenue.max &&
          employeeCount >= criteria.employees.min &&
          employeeCount <= criteria.employees.max;

        qualificationStatus[tier as PricingTier] = qualifies;

        if (qualifies) {
          recommendedTier = tier as PricingTier;
        }
      }

      const reasoning = `Based on funding raised ($${fundingRaised.toLocaleString()}), monthly revenue ($${monthlyRevenue.toLocaleString()}), and team size (${employeeCount} employees), the ${recommendedTier} tier is recommended.`;

      return {
        recommendedTier,
        qualificationStatus,
        reasoning
      };

    } catch (error) {
      logger.error('Failed to get recommended tier', {
        error: (error as Error).message,
        userId
      });
      throw new Error('Failed to get recommended tier');
    }
  }

  // Private helper methods
  private getGeographicMultiplier(countryCode?: string): number {
    if (!countryCode) return 1.0;
    return this.GEOGRAPHIC_MULTIPLIERS[countryCode] || this.GEOGRAPHIC_MULTIPLIERS.default;
  }

  private async getPerformanceMultiplier(userId: string): Promise<number> {
    try {
      const scoreQuery = `
        SELECT overall_score
        FROM sse_scores
        WHERE user_id = $1
        ORDER BY calculated_at DESC
        LIMIT 1
      `;

      const result = await pool.query(scoreQuery, [userId]);
      const score = result.rows[0]?.overall_score || 70; // Default to neutral

      if (score >= 85) return 0.8; // 20% discount for high performers
      if (score >= 60) return 1.0; // Standard rate
      return 1.2; // 20% premium to incentivize improvement
    } catch (error) {
      return 1.0; // Default to standard rate on error
    }
  }

  private getCurrencyForCountry(countryCode?: string): string {
    const currencyMap: Record<string, string> = {
      'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR',
      'AU': 'AUD', 'JP': 'JPY', 'SG': 'SGD', 'IN': 'INR', 'BR': 'BRL'
    };
    return currencyMap[countryCode || 'US'] || 'USD';
  }

  private async getOrCreatePrice(tier: PricingTier, pricing: PricingCalculation): Promise<string> {
    // Implementation to get or create Stripe price
    // This would cache prices and create new ones as needed
    const priceKey = `${tier}_${pricing.currency}_${pricing.finalPrice}_${pricing.isAnnual}`;

    // Check if price exists in cache/database
    // If not, create new Stripe price
    const price = await this.stripe.prices.create({
      unit_amount: pricing.finalPrice * 100, // Convert to cents
      currency: pricing.currency.toLowerCase(),
      recurring: {
        interval: pricing.isAnnual ? 'year' : 'month'
      },
      product_data: {
        name: `Auxeira ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
        metadata: {
          tier,
          priceKey
        }
      }
    });

    return price.id;
  }

  private async getCustomerByUserId(userId: string): Promise<Customer | null> {
    const query = 'SELECT * FROM stripe_customers WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  private async getUserSubscription(userId: string): Promise<SubscriptionPlan | null> {
    const query = 'SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2';
    const result = await pool.query(query, [userId, 'active']);

    if (result.rows[0]) {
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        stripeSubscriptionId: row.stripe_subscription_id,
        planType: row.plan_type,
        status: row.status,
        currentPeriodStart: row.current_period_start,
        currentPeriodEnd: row.current_period_end,
        pricingData: JSON.parse(row.pricing_data),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    }

    return null;
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    // Handle subscription updates from webhooks
    logger.info('Subscription updated', { subscriptionId: subscription.id });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    // Handle subscription deletions from webhooks
    logger.info('Subscription deleted', { subscriptionId: subscription.id });
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    // Handle successful payments from webhooks
    logger.info('Payment succeeded', { invoiceId: invoice.id });
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    // Handle failed payments from webhooks
    logger.error('Payment failed', { invoiceId: invoice.id });
  }
}

export const paymentService = new PaymentService();
export default paymentService;
