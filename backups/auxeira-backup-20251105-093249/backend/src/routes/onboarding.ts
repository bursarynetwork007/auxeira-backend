import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { pool } from '../config/database';

const router = Router();

interface TierCriteria {
  funding_raised?: { min?: number; max?: number };
  mrr?: { min?: number; max?: number };
  team_size?: { min?: number; max?: number };
}

interface PricingTier {
  name: string;
  price: number;
  criteria: TierCriteria;
}

const PRICING_TIERS: { [key: string]: PricingTier } = {
  founder: {
    name: 'Founder (FREE)',
    price: 0,
    criteria: {
      funding_raised: { max: 10000 },
      mrr: { max: 5000 },
      team_size: { max: 5 }
    }
  },
  startup: {
    name: 'Startup',
    price: 149,
    criteria: {
      funding_raised: { min: 10000, max: 500000 },
      mrr: { min: 5000, max: 25000 },
      team_size: { min: 5, max: 15 }
    }
  },
  growth: {
    name: 'Growth',
    price: 499,
    criteria: {
      funding_raised: { min: 500000, max: 5000000 },
      mrr: { min: 25000, max: 100000 },
      team_size: { min: 15, max: 50 }
    }
  },
  scale: {
    name: 'Scale',
    price: 999,
    criteria: {
      funding_raised: { min: 5000000 },
      mrr: { min: 100000 },
      team_size: { min: 50 }
    }
  }
};

/**
 * Calculate subscription tier based on startup metrics
 */
function calculateTier(fundingRaised: number, mrr: number, teamSize: number): string {
  // Check from highest to lowest tier
  if (fundingRaised >= 5000000 || mrr >= 100000 || teamSize >= 50) {
    return 'scale';
  } else if (fundingRaised >= 500000 || mrr >= 25000 || teamSize >= 15) {
    return 'growth';
  } else if (fundingRaised >= 10000 || mrr >= 5000 || teamSize >= 5) {
    return 'startup';
  } else {
    return 'founder';
  }
}

/**
 * POST /api/onboarding/complete
 * Complete onboarding and set subscription tier
 */
router.post(
  '/complete',
  authenticateToken,
  [
    body('startup_name').notEmpty().trim(),
    body('industry').notEmpty().trim(),
    body('stage').notEmpty().trim(),
    body('country').notEmpty().trim(),
    body('funding_raised').isNumeric(),
    body('mrr').isNumeric(),
    body('team_size').isInt({ min: 0 }),
    body('arpa').optional().isNumeric(),
    body('customer_lifetime_months').optional().isNumeric(),
    body('monthly_marketing_spend').optional().isNumeric(),
    body('new_customers_per_month').optional().isNumeric(),
    body('total_cash').optional().isNumeric(),
    body('monthly_burn_rate').optional().isNumeric(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const userId = (req as any).user.userId;
      const {
        startup_name,
        industry,
        stage,
        country,
        funding_raised,
        mrr,
        team_size,
        arpa,
        customer_lifetime_months,
        monthly_marketing_spend,
        new_customers_per_month,
        total_cash,
        monthly_burn_rate,
      } = req.body;

      // Calculate tier
      const tier = calculateTier(
        parseFloat(funding_raised),
        parseFloat(mrr),
        parseInt(team_size)
      );
      const tierInfo = PRICING_TIERS[tier];

      // Calculate derived metrics
      const ltv = arpa && customer_lifetime_months 
        ? parseFloat(arpa) * parseFloat(customer_lifetime_months) 
        : null;
      
      const cac = monthly_marketing_spend && new_customers_per_month && parseFloat(new_customers_per_month) > 0
        ? parseFloat(monthly_marketing_spend) / parseFloat(new_customers_per_month)
        : null;
      
      const ltv_cac_ratio = ltv && cac && cac > 0 ? ltv / cac : null;
      
      const runway = total_cash && monthly_burn_rate && parseFloat(monthly_burn_rate) > 0
        ? parseFloat(total_cash) / parseFloat(monthly_burn_rate)
        : null;

      // Store in database
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Update user profile
        await client.query(
          `INSERT INTO user_profiles (
            user_id, startup_name, industry, stage, country,
            funding_raised, mrr, team_size, subscription_tier, subscription_price,
            arpa, customer_lifetime_months, monthly_marketing_spend,
            new_customers_per_month, total_cash, monthly_burn_rate,
            ltv, cac, ltv_cac_ratio, runway,
            onboarding_completed_at, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW(), NOW()
          )
          ON CONFLICT (user_id) DO UPDATE SET
            startup_name = EXCLUDED.startup_name,
            industry = EXCLUDED.industry,
            stage = EXCLUDED.stage,
            country = EXCLUDED.country,
            funding_raised = EXCLUDED.funding_raised,
            mrr = EXCLUDED.mrr,
            team_size = EXCLUDED.team_size,
            subscription_tier = EXCLUDED.subscription_tier,
            subscription_price = EXCLUDED.subscription_price,
            arpa = EXCLUDED.arpa,
            customer_lifetime_months = EXCLUDED.customer_lifetime_months,
            monthly_marketing_spend = EXCLUDED.monthly_marketing_spend,
            new_customers_per_month = EXCLUDED.new_customers_per_month,
            total_cash = EXCLUDED.total_cash,
            monthly_burn_rate = EXCLUDED.monthly_burn_rate,
            ltv = EXCLUDED.ltv,
            cac = EXCLUDED.cac,
            ltv_cac_ratio = EXCLUDED.ltv_cac_ratio,
            runway = EXCLUDED.runway,
            onboarding_completed_at = NOW(),
            updated_at = NOW()`,
          [
            userId, startup_name, industry, stage, country,
            funding_raised, mrr, team_size, tier, tierInfo.price,
            arpa || null, customer_lifetime_months || null, monthly_marketing_spend || null,
            new_customers_per_month || null, total_cash || null, monthly_burn_rate || null,
            ltv, cac, ltv_cac_ratio, runway
          ]
        );

        // Log tier assignment
        await client.query(
          `INSERT INTO tier_history (user_id, tier, price, reason, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [userId, tier, tierInfo.price, 'Initial onboarding']
        );

        await client.query('COMMIT');

        logger.info(`Onboarding completed for user ${userId}, tier: ${tier}`);

        res.json({
          success: true,
          message: 'Onboarding completed successfully',
          data: {
            tier,
            tier_name: tierInfo.name,
            price: tierInfo.price,
            calculated_metrics: {
              ltv,
              cac,
              ltv_cac_ratio: ltv_cac_ratio ? ltv_cac_ratio.toFixed(2) : null,
              runway: runway ? runway.toFixed(1) : null
            }
          }
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Onboarding error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete onboarding',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/onboarding/recalculate-tier
 * Recalculate tier based on updated metrics (automatic)
 */
router.post(
  '/recalculate-tier',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;

      // Get current profile
      const result = await pool.query(
        'SELECT funding_raised, mrr, team_size, subscription_tier FROM user_profiles WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found'
        });
      }

      const profile = result.rows[0];
      const currentTier = profile.subscription_tier;
      
      // Calculate new tier
      const newTier = calculateTier(
        parseFloat(profile.funding_raised),
        parseFloat(profile.mrr),
        parseInt(profile.team_size)
      );

      // If tier changed, update
      if (newTier !== currentTier) {
        const tierInfo = PRICING_TIERS[newTier];
        
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          await client.query(
            `UPDATE user_profiles 
             SET subscription_tier = $1, subscription_price = $2, updated_at = NOW()
             WHERE user_id = $3`,
            [newTier, tierInfo.price, userId]
          );

          await client.query(
            `INSERT INTO tier_history (user_id, tier, price, reason, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [userId, newTier, tierInfo.price, 'Automatic recalculation based on metrics']
          );

          await client.query('COMMIT');

          logger.info(`Tier updated for user ${userId}: ${currentTier} -> ${newTier}`);

          res.json({
            success: true,
            message: 'Tier updated',
            data: {
              old_tier: currentTier,
              new_tier: newTier,
              tier_name: tierInfo.name,
              price: tierInfo.price
            }
          });
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      } else {
        res.json({
          success: true,
          message: 'Tier unchanged',
          data: {
            tier: currentTier,
            tier_name: PRICING_TIERS[currentTier].name,
            price: PRICING_TIERS[currentTier].price
          }
        });
      }
    } catch (error) {
      logger.error('Tier recalculation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to recalculate tier',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/onboarding/status
 * Check if user has completed onboarding
 */
router.get(
  '/status',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;

      const result = await pool.query(
        'SELECT onboarding_completed_at, subscription_tier, subscription_price FROM user_profiles WHERE user_id = $1',
        [userId]
      );

      const completed = result.rows.length > 0 && result.rows[0].onboarding_completed_at !== null;

      res.json({
        success: true,
        data: {
          completed,
          tier: completed ? result.rows[0].subscription_tier : null,
          price: completed ? result.rows[0].subscription_price : null
        }
      });
    } catch (error) {
      logger.error('Onboarding status check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check onboarding status'
      });
    }
  }
);

export default router;
