/**
 * Tier Tracking Service
 * Monitors user metrics and automatically recalculates subscription tiers
 */

import { pool } from '../config/database';
import { logger } from '../utils/logger';

interface MetricsUpdate {
  userId: number;
  fundingRaised?: number;
  mrr?: number;
  teamSize?: number;
}

/**
 * Update user metrics and trigger tier recalculation
 * This is called automatically when dashboard metrics are updated
 */
export async function updateMetrics(update: MetricsUpdate): Promise<void> {
  const { userId, fundingRaised, mrr, teamSize } = update;

  try {
    const client = await pool.connect();
    try {
      // Build dynamic update query
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (fundingRaised !== undefined) {
        updates.push(`funding_raised = $${paramIndex++}`);
        values.push(fundingRaised);
      }
      if (mrr !== undefined) {
        updates.push(`mrr = $${paramIndex++}`);
        values.push(mrr);
      }
      if (teamSize !== undefined) {
        updates.push(`team_size = $${paramIndex++}`);
        values.push(teamSize);
      }

      if (updates.length === 0) {
        return; // Nothing to update
      }

      updates.push(`updated_at = NOW()`);
      values.push(userId);

      const query = `
        UPDATE user_profiles 
        SET ${updates.join(', ')}
        WHERE user_id = $${paramIndex}
        RETURNING subscription_tier, subscription_price
      `;

      const result = await client.query(query, values);

      if (result.rows.length > 0) {
        logger.info(`Metrics updated for user ${userId}, tier: ${result.rows[0].subscription_tier}`);
      }
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error(`Error updating metrics for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Create daily metrics snapshot for all users
 * Should be run via cron job daily
 */
export async function createDailySnapshots(): Promise<void> {
  try {
    await pool.query('SELECT create_metrics_snapshot()');
    logger.info('Daily metrics snapshots created successfully');
  } catch (error) {
    logger.error('Error creating daily snapshots:', error);
    throw error;
  }
}

/**
 * Get tier history for a user
 */
export async function getTierHistory(userId: number): Promise<any[]> {
  try {
    const result = await pool.query(
      `SELECT tier, price, reason, created_at 
       FROM tier_history 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    logger.error(`Error fetching tier history for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get metrics trend for a user
 */
export async function getMetricsTrend(userId: number, days: number = 30): Promise<any[]> {
  try {
    const result = await pool.query(
      `SELECT 
        snapshot_date,
        funding_raised,
        mrr,
        team_size,
        tier
       FROM metrics_snapshots 
       WHERE user_id = $1 
         AND snapshot_date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY snapshot_date ASC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    logger.error(`Error fetching metrics trend for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Check if user should be upgraded/downgraded
 * Returns recommendation without making changes
 */
export async function checkTierRecommendation(userId: number): Promise<{
  currentTier: string;
  recommendedTier: string;
  shouldChange: boolean;
  reason: string;
}> {
  try {
    const result = await pool.query(
      'SELECT funding_raised, mrr, team_size, subscription_tier FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User profile not found');
    }

    const { funding_raised, mrr, team_size, subscription_tier } = result.rows[0];
    
    // Calculate recommended tier
    let recommendedTier = 'founder';
    if (funding_raised >= 5000000 || mrr >= 100000 || team_size >= 50) {
      recommendedTier = 'scale';
    } else if (funding_raised >= 500000 || mrr >= 25000 || team_size >= 15) {
      recommendedTier = 'growth';
    } else if (funding_raised >= 10000 || mrr >= 5000 || team_size >= 5) {
      recommendedTier = 'startup';
    }

    const shouldChange = recommendedTier !== subscription_tier;
    let reason = '';

    if (shouldChange) {
      const tierOrder = ['founder', 'startup', 'growth', 'scale'];
      const currentIndex = tierOrder.indexOf(subscription_tier);
      const recommendedIndex = tierOrder.indexOf(recommendedTier);

      if (recommendedIndex > currentIndex) {
        reason = `Your metrics have grown! Consider upgrading to ${recommendedTier} tier for more features.`;
      } else {
        reason = `Your metrics suggest ${recommendedTier} tier may be more appropriate.`;
      }
    } else {
      reason = 'Your current tier matches your metrics.';
    }

    return {
      currentTier: subscription_tier,
      recommendedTier,
      shouldChange,
      reason
    };
  } catch (error) {
    logger.error(`Error checking tier recommendation for user ${userId}:`, error);
    throw error;
  }
}

export default {
  updateMetrics,
  createDailySnapshots,
  getTierHistory,
  getMetricsTrend,
  checkTierRecommendation
};
