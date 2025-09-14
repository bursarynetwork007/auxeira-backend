/**
 * Payment Controller
 * Handles all payment-related API endpoints including subscriptions, billing, and pricing
 */

import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';
import {
  CreateCustomerRequest,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  CancelSubscriptionRequest,
  CalculatePricingRequest,
  ProcessUsageRequest,
  GetRecommendationRequest,
  PricingTier
} from '../types/payment.types';

export class PaymentController {
  /**
   * Calculate pricing for a specific tier
   * GET /api/payments/pricing
   */
  async calculatePricing(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('payment_controller_calculate_pricing');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { tier, isAnnual, countryCode, promoCode } = req.query as any;

      if (!tier || !Object.values(['founder', 'startup', 'growth', 'scale', 'enterprise']).includes(tier)) {
        res.status(400).json({ error: 'Valid tier is required' });
        return;
      }

      const calculation = await paymentService.calculatePricing(
        userId,
        tier as PricingTier,
        isAnnual === 'true',
        countryCode
      );

      // Get tier recommendation
      const recommendation = await paymentService.getRecommendedTier(userId);

      timer.end();

      res.json({
        success: true,
        data: {
          calculation,
          recommendation,
          // Add promo code handling if needed
          promoApplied: promoCode ? null : undefined
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to calculate pricing', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to calculate pricing' });
    }
  }

  /**
   * Get tier recommendation for user
   * GET /api/payments/recommendation
   */
  async getTierRecommendation(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('payment_controller_get_recommendation');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const recommendation = await paymentService.getRecommendedTier(userId);

      timer.end();

      res.json({
        success: true,
        data: recommendation
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get tier recommendation', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to get recommendation' });
    }
  }

  /**
   * Create a new customer
   * POST /api/payments/customer
   */
  async createCustomer(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('payment_controller_create_customer');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { email, name, organizationName, countryCode }: CreateCustomerRequest = req.body;

      if (!email || !name) {
        res.status(400).json({ error: 'Email and name are required' });
        return;
      }

      const customer = await paymentService.createCustomer(
        userId,
        email,
        name,
        organizationName,
        countryCode
      );

      timer.end();

      res.status(201).json({
        success: true,
        data: customer
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to create customer', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to create customer' });
    }
  }

  /**
   * Create a new subscription
   * POST /api/payments/subscription
   */
  async createSubscription(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('payment_controller_create_subscription');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { tier, isAnnual, paymentMethodId, promoCode }: CreateSubscriptionRequest = req.body;

      if (!tier || !Object.values(['founder', 'startup', 'growth', 'scale', 'enterprise']).includes(tier)) {
        res.status(400).json({ error: 'Valid tier is required' });
        return;
      }

      const subscription = await paymentService.createSubscription(
        userId,
        tier,
        isAnnual || false,
        paymentMethodId
      );

      timer.end();

      res.status(201).json({
        success: true,
        data: subscription
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to create subscription', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  }

  /**
   * Update existing subscription
   * PUT /api/payments/subscription
   */
  async updateSubscription(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('payment_controller_update_subscription');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { tier, isAnnual }: UpdateSubscriptionRequest = req.body;

      if (!tier || !Object.values(['founder', 'startup', 'growth', 'scale', 'enterprise']).includes(tier)) {
        res.status(400).json({ error: 'Valid tier is required' });
        return;
      }

      const subscription = await paymentService.updateSubscription(
        userId,
        tier,
        isAnnual
      );

      timer.end();

      res.json({
        success: true,
        data: subscription
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to update subscription', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to update subscription' });
    }
  }

  /**
   * Cancel subscription
   * DELETE /api/payments/subscription
   */
  async cancelSubscription(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('payment_controller_cancel_subscription');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { cancelAtPeriodEnd, reason }: CancelSubscriptionRequest = req.body;

      await paymentService.cancelSubscription(
        userId,
        cancelAtPeriodEnd !== false, // Default to true
        reason
      );

      timer.end();

      res.json({
        success: true,
        message: 'Subscription cancelled successfully'
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to cancel subscription', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  }

  /**
   * Get current subscription details
   * GET /api/payments/subscription
   */
  async getSubscription(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('payment_controller_get_subscription');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // This would need to be implemented in the payment service
      // const subscription = await paymentService.getUserSubscription(userId);

      timer.end();

      res.json({
        success: true,
        data: null // subscription
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get subscription', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to get subscription' });
    }
  }

  /**
   * Process usage-based charges
   * POST /api/payments/usage
   */
  async processUsageCharges(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('payment_controller_process_usage');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { apiCallOverages, premiumIntroductions, customReports }: ProcessUsageRequest = req.body;

      const usageData = {
        apiCallOverages: apiCallOverages || 0,
        premiumIntroductions: premiumIntroductions || 0,
        customReports: customReports || 0,
        period: new Date().toISOString().slice(0, 7) // YYYY-MM format
      };

      await paymentService.processUsageCharges(userId, usageData);

      timer.end();

      res.json({
        success: true,
        message: 'Usage charges processed successfully'
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to process usage charges', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to process usage charges' });
    }
  }

  /**
   * Get billing history
   * GET /api/payments/billing-history
   */
  async getBillingHistory(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('payment_controller_get_billing_history');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { limit = 20, offset = 0 } = req.query;

      // This would need to be implemented in the payment service
      // const billingHistory = await paymentService.getBillingHistory(userId, Number(limit), Number(offset));

      timer.end();

      res.json({
        success: true,
        data: {
          invoices: [],
          payments: [],
          usageCharges: [],
          total: 0,
          hasMore: false
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get billing history', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to get billing history' });
    }
  }

  /**
   * Get current usage and limits
   * GET /api/payments/usage
   */
  async getCurrentUsage(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('payment_controller_get_current_usage');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // This would need to be implemented in the payment service
      // const usage = await paymentService.getCurrentUsage(userId);

      timer.end();

      res.json({
        success: true,
        data: {
          currentUsage: {
            apiCalls: 0,
            partnerIntroductions: 0,
            customReports: 0
          },
          limits: {
            apiCalls: 10000,
            partnerIntroductions: 5,
            customReports: 2
          },
          overages: {
            apiCallOverages: 0,
            premiumIntroductions: 0,
            customReports: 0,
            period: new Date().toISOString().slice(0, 7)
          },
          estimatedCharges: 0
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get current usage', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to get current usage' });
    }
  }

  /**
   * Handle Stripe webhooks
   * POST /api/payments/webhook
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('payment_controller_handle_webhook');

    try {
      const signature = req.headers['stripe-signature'] as string;
      const body = req.body;

      if (!signature) {
        res.status(400).json({ error: 'Missing stripe-signature header' });
        return;
      }

      await paymentService.handleWebhook(body, signature);

      timer.end();

      res.json({ received: true });

    } catch (error) {
      timer.end();
      logger.error('Failed to handle webhook', {
        error: (error as Error).message
      });
      res.status(400).json({ error: 'Webhook signature verification failed' });
    }
  }

  /**
   * Get pricing page data
   * GET /api/payments/pricing-page
   */
  async getPricingPageData(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('payment_controller_get_pricing_page');

    try {
      const { countryCode } = req.query;
      const userId = req.user?.id; // Optional for pricing page

      // Get pricing for all tiers
      const tiers: PricingTier[] = ['founder', 'startup', 'growth', 'scale', 'enterprise'];
      const pricingData = [];

      for (const tier of tiers) {
        const monthlyPricing = await paymentService.calculatePricing(
          userId || 'anonymous',
          tier,
          false,
          countryCode as string
        );

        const annualPricing = await paymentService.calculatePricing(
          userId || 'anonymous',
          tier,
          true,
          countryCode as string
        );

        pricingData.push({
          tier,
          monthly: monthlyPricing,
          annual: annualPricing,
          savings: monthlyPricing.finalPrice * 12 - annualPricing.finalPrice,
          savingsPercentage: Math.round(((monthlyPricing.finalPrice * 12 - annualPricing.finalPrice) / (monthlyPricing.finalPrice * 12)) * 100)
        });
      }

      // Get recommendation if user is logged in
      let recommendation = null;
      if (userId) {
        try {
          recommendation = await paymentService.getRecommendedTier(userId);
        } catch (error) {
          // Ignore recommendation errors for pricing page
        }
      }

      timer.end();

      res.json({
        success: true,
        data: {
          pricing: pricingData,
          recommendation,
          currency: paymentService['getCurrencyForCountry'](countryCode as string),
          comparisonMatrix: {
            competitors: [
              { name: 'FoundersCard', monthlyFee: 179, value: 'Lifestyle benefits' },
              { name: 'Techstars Network', monthlyFee: 500, value: 'Accelerator access' },
              { name: 'AngelList', monthlyFee: 249, value: 'Investor access' },
              { name: 'Crunchbase Pro', monthlyFee: 49, value: 'Data access' },
              { name: 'PitchBook', monthlyFee: 3000, value: 'Market intelligence' }
            ],
            advantages: [
              'Performance-based business ROI',
              'Continuous support, not batch-based',
              'Holistic ecosystem + verification',
              'Actionable insights + partner benefits',
              'Real-time performance + rewards'
            ]
          }
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get pricing page data', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to get pricing page data' });
    }
  }

  /**
   * Validate promo code
   * POST /api/payments/validate-promo
   */
  async validatePromoCode(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('payment_controller_validate_promo');

    try {
      const { code, tier } = req.body;

      if (!code || !tier) {
        res.status(400).json({ error: 'Promo code and tier are required' });
        return;
      }

      // This would need to be implemented in the payment service
      // const promoValidation = await paymentService.validatePromoCode(code, tier);

      timer.end();

      res.json({
        success: true,
        data: {
          valid: false,
          discount: 0,
          description: 'Promo code validation not implemented'
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to validate promo code', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to validate promo code' });
    }
  }

  /**
   * Get subscription analytics
   * GET /api/payments/analytics
   */
  async getSubscriptionAnalytics(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('payment_controller_get_analytics');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // This would need to be implemented in the payment service
      // const analytics = await paymentService.getSubscriptionAnalytics(userId);

      timer.end();

      res.json({
        success: true,
        data: {
          tier: 'startup',
          monthlyRevenue: 99,
          annualRevenue: 949,
          churnRisk: 'low',
          usageMetrics: {
            apiCalls: 5000,
            partnerIntroductions: 2,
            customReports: 1,
            loginFrequency: 15
          },
          valueRealization: {
            partnerSavings: 2500,
            auxTokensEarned: 150,
            roiPercentage: 250
          }
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get subscription analytics', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to get subscription analytics' });
    }
  }
}

export const paymentController = new PaymentController();
export default paymentController;
