import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { pool } from '../config/database';
import { assessActivitySubmission, validateSubmission } from '../services/ai-assessment.service';

const router = Router();

// Rate limiting
const activityRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    error: 'RATE_LIMIT_EXCEEDED',
  },
});

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      details: errors.array(),
    });
  }
  next();
};

// ============================================================================
// ACTIVITY CATALOG ENDPOINTS
// ============================================================================

/**
 * GET /api/activities
 * Fetch list of available activities, optionally filtered by startup stage
 */
router.get(
  '/',
  activityRateLimit,
  authenticateToken,
  [
    query('stage').optional().isIn(['pre-seed', 'seed', 'series-a', 'series-b', 'series-c', 'growth', 'late-stage']),
    query('category').optional().isString(),
    query('tier').optional().isIn(['bronze', 'silver', 'gold']),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { stage, category, tier } = req.query;

      let query = `
        SELECT 
          id,
          name,
          description,
          category,
          tier,
          base_tokens,
          nudges,
          created_at,
          updated_at
        FROM activities
        WHERE is_active = true
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (category) {
        query += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (tier) {
        query += ` AND tier = $${paramIndex}`;
        params.push(tier);
        paramIndex++;
      }

      query += ' ORDER BY tier DESC, base_tokens DESC, name ASC';

      const result = await pool.query(query, params);

      res.json({
        success: true,
        message: 'Activities fetched successfully',
        data: {
          total: result.rows.length,
          activities: result.rows,
        },
      });
    } catch (error) {
      logger.error('Error fetching activities:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activities',
        error: 'INTERNAL_SERVER_ERROR',
      });
    }
  }
);

/**
 * GET /api/activities/:id
 * Get details of a specific activity
 */
router.get(
  '/:id',
  activityRateLimit,
  authenticateToken,
  [param('id').isInt({ min: 1 })],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `
        SELECT 
          id,
          name,
          description,
          category,
          tier,
          base_tokens,
          nudges,
          created_at,
          updated_at
        FROM activities
        WHERE id = $1 AND is_active = true
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Activity not found',
          error: 'NOT_FOUND',
        });
      }

      res.json({
        success: true,
        message: 'Activity fetched successfully',
        data: result.rows[0],
      });
    } catch (error) {
      logger.error('Error fetching activity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activity',
        error: 'INTERNAL_SERVER_ERROR',
      });
    }
  }
);

// ============================================================================
// ACTIVITY SUBMISSION ENDPOINTS
// ============================================================================

/**
 * POST /api/activities/submit
 * Submit an activity for assessment
 */
router.post(
  '/submit',
  activityRateLimit,
  authenticateToken,
  [
    body('activity_id').isInt({ min: 1 }),
    body('proof_text').isString().isLength({ min: 50, max: 5000 }),
    body('proof_urls').optional().isArray(),
    body('proof_urls.*').optional().isURL(),
    body('metadata').optional().isObject(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { activity_id, proof_text, proof_urls, metadata } = req.body;

      // Verify activity exists
      const activityCheck = await pool.query(
        'SELECT id, name FROM activities WHERE id = $1 AND is_active = true',
        [activity_id]
      );

      if (activityCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Activity not found',
          error: 'NOT_FOUND',
        });
      }

      // Get user's startup
      const startupResult = await pool.query(
        'SELECT id, stage FROM startups WHERE user_id = $1 AND is_active = true LIMIT 1',
        [userId]
      );

      if (startupResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No active startup found for user',
          error: 'NO_STARTUP',
        });
      }

      const startupId = startupResult.rows[0].id;
      const startupStage = startupResult.rows[0].stage;

      // Create submission
      const submissionResult = await pool.query(
        `
        INSERT INTO activity_submissions (
          user_id,
          startup_id,
          activity_id,
          proof_text,
          proof_urls,
          status,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, 'pending', $6)
        RETURNING id, created_at
        `,
        [userId, startupId, activity_id, proof_text, proof_urls || [], metadata || {}]
      );

      const submission = submissionResult.rows[0];

      // Trigger AI assessment asynchronously (don't wait for it)
      triggerAIAssessment(
        submission.id,
        activity_id,
        proof_text,
        proof_urls || [],
        activityCheck.rows[0]
      ).catch(error => {
        logger.error(`AI assessment failed for submission ${submission.id}:`, error);
      });

      res.status(201).json({
        success: true,
        message: 'Activity submitted successfully',
        data: {
          submission_id: submission.id,
          activity_id,
          activity_name: activityCheck.rows[0].name,
          status: 'pending',
          created_at: submission.created_at,
          next_step: 'AI assessment in progress',
        },
      });
    } catch (error) {
      logger.error('Error submitting activity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit activity',
        error: 'INTERNAL_SERVER_ERROR',
      });
    }
  }
);

/**
 * GET /api/activities/submissions
 * Get user's activity submissions
 */
router.get(
  '/submissions',
  activityRateLimit,
  authenticateToken,
  [
    query('status').optional().isIn(['pending', 'processing', 'approved', 'rejected']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { status, limit = 20, offset = 0 } = req.query;

      let query = `
        SELECT 
          s.id,
          s.activity_id,
          a.name as activity_name,
          a.tier,
          s.proof_text,
          s.proof_urls,
          s.status,
          s.quality_score,
          s.consistency_weeks,
          s.tokens_awarded,
          s.ai_feedback,
          s.created_at,
          s.assessed_at
        FROM activity_submissions s
        JOIN activities a ON s.activity_id = a.id
        WHERE s.user_id = $1
      `;

      const params: any[] = [userId];
      let paramIndex = 2;

      if (status) {
        query += ` AND s.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ` ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM activity_submissions
        WHERE user_id = $1 ${status ? 'AND status = $2' : ''}
      `;
      const countParams = status ? [userId, status] : [userId];
      const countResult = await pool.query(countQuery, countParams);

      res.json({
        success: true,
        message: 'Submissions fetched successfully',
        data: {
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          submissions: result.rows,
        },
      });
    } catch (error) {
      logger.error('Error fetching submissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch submissions',
        error: 'INTERNAL_SERVER_ERROR',
      });
    }
  }
);

/**
 * GET /api/activities/submissions/:id
 * Get details of a specific submission
 */
router.get(
  '/submissions/:id',
  activityRateLimit,
  authenticateToken,
  [param('id').isUUID()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;

      const result = await pool.query(
        `
        SELECT 
          s.id,
          s.activity_id,
          a.name as activity_name,
          a.description as activity_description,
          a.tier,
          a.base_tokens,
          s.proof_text,
          s.proof_urls,
          s.status,
          s.quality_score,
          s.consistency_weeks,
          s.tokens_awarded,
          s.ai_feedback,
          s.metadata,
          s.created_at,
          s.assessed_at
        FROM activity_submissions s
        JOIN activities a ON s.activity_id = a.id
        WHERE s.id = $1 AND s.user_id = $2
        `,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found',
          error: 'NOT_FOUND',
        });
      }

      res.json({
        success: true,
        message: 'Submission fetched successfully',
        data: result.rows[0],
      });
    } catch (error) {
      logger.error('Error fetching submission:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch submission',
        error: 'INTERNAL_SERVER_ERROR',
      });
    }
  }
);

// ============================================================================
// TOKEN CALCULATION ENDPOINT
// ============================================================================

/**
 * POST /api/activities/calculate-tokens
 * Calculate tokens for an activity submission
 * This endpoint is called after AI assessment
 */
router.post(
  '/calculate-tokens',
  activityRateLimit,
  authenticateToken,
  [
    body('submission_id').isUUID(),
    body('quality_score').isFloat({ min: 0, max: 1 }),
    body('consistency_weeks').optional().isInt({ min: 0 }),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { submission_id, quality_score, consistency_weeks = 0 } = req.body;

      // Get submission details
      const submissionResult = await pool.query(
        `
        SELECT 
          s.id,
          s.activity_id,
          s.startup_id,
          s.status,
          a.base_tokens,
          a.tier,
          st.stage as startup_stage
        FROM activity_submissions s
        JOIN activities a ON s.activity_id = a.id
        JOIN startups st ON s.startup_id = st.id
        WHERE s.id = $1 AND s.user_id = $2
        `,
        [submission_id, userId]
      );

      if (submissionResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found',
          error: 'NOT_FOUND',
        });
      }

      const submission = submissionResult.rows[0];

      if (submission.status !== 'pending' && submission.status !== 'processing') {
        return res.status(400).json({
          success: false,
          message: 'Submission already processed',
          error: 'ALREADY_PROCESSED',
        });
      }

      // Calculate tokens using the algorithm from token_calculator_api.py
      const { final_tokens, breakdown } = calculateTokens(
        submission.base_tokens,
        quality_score,
        submission.startup_stage,
        consistency_weeks
      );

      // Update submission with calculated tokens
      await pool.query(
        `
        UPDATE activity_submissions
        SET 
          quality_score = $1,
          consistency_weeks = $2,
          tokens_awarded = $3,
          status = 'approved',
          assessed_at = CURRENT_TIMESTAMP,
          metadata = metadata || $4::jsonb
        WHERE id = $5
        `,
        [
          quality_score,
          consistency_weeks,
          final_tokens,
          JSON.stringify({ breakdown }),
          submission_id,
        ]
      );

      // Award tokens to user
      await pool.query(
        `
        INSERT INTO token_transactions (
          user_id,
          startup_id,
          amount,
          transaction_type,
          source_type,
          source_id,
          description,
          metadata
        ) VALUES ($1, $2, $3, 'earn', 'activity_reward', $4, $5, $6)
        `,
        [
          userId,
          submission.startup_id,
          final_tokens,
          submission_id,
          `Activity reward: ${submission.tier} tier`,
          JSON.stringify({ breakdown }),
        ]
      );

      res.json({
        success: true,
        message: 'Tokens calculated and awarded successfully',
        data: {
          submission_id,
          tokens_awarded: final_tokens,
          quality_score,
          consistency_weeks,
          breakdown,
        },
      });
    } catch (error) {
      logger.error('Error calculating tokens:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate tokens',
        error: 'INTERNAL_SERVER_ERROR',
      });
    }
  }
);

// ============================================================================
// ACTIVITY HISTORY ENDPOINT
// ============================================================================

/**
 * GET /api/activities/history
 * Get user's complete activity history with token totals
 */
router.get(
  '/history',
  activityRateLimit,
  authenticateToken,
  [
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { start_date, end_date } = req.query;

      let query = `
        SELECT 
          s.id,
          s.activity_id,
          a.name as activity_name,
          a.category,
          a.tier,
          s.tokens_awarded,
          s.quality_score,
          s.status,
          s.created_at,
          s.assessed_at
        FROM activity_submissions s
        JOIN activities a ON s.activity_id = a.id
        WHERE s.user_id = $1
      `;

      const params: any[] = [userId];
      let paramIndex = 2;

      if (start_date) {
        query += ` AND s.created_at >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
      }

      if (end_date) {
        query += ` AND s.created_at <= $${paramIndex}`;
        params.push(end_date);
        paramIndex++;
      }

      query += ' ORDER BY s.created_at DESC';

      const result = await pool.query(query, params);

      // Calculate totals
      const totals = {
        total_activities: result.rows.length,
        total_tokens: result.rows.reduce((sum, row) => sum + (row.tokens_awarded || 0), 0),
        approved: result.rows.filter(r => r.status === 'approved').length,
        pending: result.rows.filter(r => r.status === 'pending').length,
        by_tier: {
          bronze: result.rows.filter(r => r.tier === 'bronze').length,
          silver: result.rows.filter(r => r.tier === 'silver').length,
          gold: result.rows.filter(r => r.tier === 'gold').length,
        },
      };

      res.json({
        success: true,
        message: 'Activity history fetched successfully',
        data: {
          totals,
          activities: result.rows,
        },
      });
    } catch (error) {
      logger.error('Error fetching activity history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activity history',
        error: 'INTERNAL_SERVER_ERROR',
      });
    }
  }
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate tokens based on the Auxeira Smart Reward Algorithm
 */
function calculateTokens(
  baseTokens: number,
  qualityScore: number,
  startupStage: string,
  consistencyWeeks: number
): { final_tokens: number; breakdown: any } {
  // Stage multipliers - INVERTED: larger startups get MORE tokens
  // Rationale: Same activity is more meaningful/impactful for larger organizations
  const stageMultipliers: { [key: string]: number } = {
    'pre-seed': 0.6,
    'seed': 0.7,
    'series-a': 0.9,
    'series-b': 1.1,
    'series-c': 1.3,
    'growth': 1.4,
    'late-stage': 1.5,
  };

  // Quality bonus
  let qualityBonus = 1.0;
  if (qualityScore >= 0.85) {
    qualityBonus = 1.5;
  } else if (qualityScore >= 0.7) {
    qualityBonus = 1.2;
  }

  // Consistency bonus
  let consistencyBonus = 1.0;
  if (consistencyWeeks >= 52) {
    consistencyBonus = 2.0;
  } else if (consistencyWeeks >= 24) {
    consistencyBonus = 1.5;
  } else if (consistencyWeeks >= 12) {
    consistencyBonus = 1.25;
  } else if (consistencyWeeks >= 8) {
    consistencyBonus = 1.1;
  }

  const stageMultiplier = stageMultipliers[startupStage] || 1.0;

  const finalTokens = Math.floor(
    baseTokens * qualityBonus * stageMultiplier * consistencyBonus
  );

  return {
    final_tokens: finalTokens,
    breakdown: {
      base_tokens: baseTokens,
      quality_bonus: qualityBonus,
      stage_multiplier: stageMultiplier,
      consistency_bonus: consistencyBonus,
    },
  };
}

/**
 * Trigger AI assessment for a submission (async)
 */
async function triggerAIAssessment(
  submissionId: string,
  activityId: number,
  proofText: string,
  proofUrls: string[],
  activityInfo: any
): Promise<void> {
  try {
    logger.info(`Starting AI assessment for submission ${submissionId}`);

    // Update status to processing
    await pool.query(
      'UPDATE activity_submissions SET status = $1 WHERE id = $2',
      ['processing', submissionId]
    );

    // Get full activity details for context
    const activityDetails = await pool.query(
      'SELECT name, description, category, tier, nudges FROM activities WHERE id = $1',
      [activityId]
    );

    if (activityDetails.rows.length === 0) {
      throw new Error('Activity not found');
    }

    const activity = activityDetails.rows[0];

    // Call AI assessment service
    const assessment = await assessActivitySubmission(
      proofText,
      proofUrls,
      {
        activity_name: activity.name,
        activity_description: activity.description,
        category: activity.category,
        tier: activity.tier,
        nudges: activity.nudges || [],
      }
    );

    logger.info(`AI assessment completed: quality_score=${assessment.quality_score}`);

    // Update submission with assessment results
    await pool.query(
      `
      UPDATE activity_submissions
      SET 
        quality_score = $1,
        ai_feedback = $2,
        status = 'assessed',
        assessed_at = CURRENT_TIMESTAMP,
        metadata = metadata || $3::jsonb
      WHERE id = $4
      `,
      [
        assessment.quality_score,
        assessment.feedback,
        JSON.stringify({
          strengths: assessment.strengths,
          improvements: assessment.improvements,
        }),
        submissionId,
      ]
    );

    // Automatically calculate and award tokens
    await autoCalculateTokens(submissionId, assessment.quality_score, assessment.consistency_weeks);

    logger.info(`Tokens calculated and awarded for submission ${submissionId}`);
  } catch (error) {
    logger.error(`AI assessment failed for submission ${submissionId}:`, error);
    
    // Update submission status to failed
    await pool.query(
      `UPDATE activity_submissions 
       SET status = 'failed', 
           ai_feedback = $1 
       WHERE id = $2`,
      ['Assessment failed. Please contact support.', submissionId]
    );
  }
}

/**
 * Automatically calculate and award tokens after assessment
 */
async function autoCalculateTokens(
  submissionId: string,
  qualityScore: number,
  consistencyWeeks: number
): Promise<void> {
  try {
    // Get submission details
    const submissionResult = await pool.query(
      `
      SELECT 
        s.user_id,
        s.startup_id,
        s.activity_id,
        a.base_tokens,
        st.stage as startup_stage
      FROM activity_submissions s
      JOIN activities a ON s.activity_id = a.id
      JOIN startups st ON s.startup_id = st.id
      WHERE s.id = $1
      `,
      [submissionId]
    );

    if (submissionResult.rows.length === 0) {
      throw new Error('Submission not found');
    }

    const submission = submissionResult.rows[0];

    // Calculate tokens
    const { final_tokens, breakdown } = calculateTokens(
      submission.base_tokens,
      qualityScore,
      submission.startup_stage,
      consistencyWeeks
    );

    // Update submission with tokens
    await pool.query(
      `
      UPDATE activity_submissions
      SET 
        tokens_awarded = $1,
        consistency_weeks = $2,
        status = 'approved',
        metadata = metadata || $3::jsonb
      WHERE id = $4
      `,
      [final_tokens, consistencyWeeks, JSON.stringify({ breakdown }), submissionId]
    );

    // Award tokens to user
    await pool.query(
      `
      INSERT INTO token_transactions (
        user_id,
        startup_id,
        amount,
        transaction_type,
        source_type,
        source_id,
        description,
        metadata
      ) VALUES ($1, $2, $3, 'earn', 'activity_reward', $4, $5, $6)
      `,
      [
        submission.user_id,
        submission.startup_id,
        final_tokens,
        submissionId,
        `Activity reward: ${final_tokens} tokens`,
        JSON.stringify({ breakdown }),
      ]
    );

    logger.info(`Awarded ${final_tokens} tokens for submission ${submissionId}`);
  } catch (error) {
    logger.error(`Failed to calculate tokens for submission ${submissionId}:`, error);
    throw error;
  }
}

export default router;
