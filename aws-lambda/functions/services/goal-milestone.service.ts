/**
 * Goal Setting and Milestone Tracking Service
 * Comprehensive service for managing goals, milestones, and progress tracking
 */

import { Pool } from 'pg';
import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';
import {
  Goal,
  Milestone,
  KeyResult,
  ActionItem,
  ProgressUpdate,
  GoalAnalytics,
  GoalRecommendation,
  TeamGoal,
  CreateGoalRequest,
  UpdateGoalRequest,
  CreateMilestoneRequest,
  CreateActionItemRequest,
  ProgressUpdateRequest,
  GoalResponse,
  GoalDashboardResponse,
  GoalType,
  GoalCategory,
  GoalPriority,
  GoalStatus,
  MilestoneType,
  MilestoneStatus,
  ActionType,
  ActionStatus,
  ActionPriority,
  UpdateType,
  TrackingMethod,
  MetricType,
  IndicatorType,
  TrendDirection,
  RecommendationType,
  GoalVisibility,
  ConfidenceLevel,
  ImpactLevel
} from '../types/goal-milestone.types';

export class GoalMilestoneService {
  constructor(private pool: Pool) {}

  // =====================================================
  // GOAL MANAGEMENT
  // =====================================================

  /**
   * Create a new goal
   */
  async createGoal(userId: string, request: CreateGoalRequest): Promise<Goal> {
    const timer = performanceTimer('create_goal');
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Create the goal
      const goalResult = await client.query(`
        INSERT INTO goals (
          user_id, title, description, goal_type, goal_category, priority,
          target_date, target_value, unit_of_measurement, success_criteria,
          stakeholders, resources_required, tags, visibility, parent_goal_id,
          status, progress_percentage
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `, [
        userId,
        request.title,
        request.description,
        request.goal_type,
        request.goal_category,
        request.priority,
        request.target_date,
        request.target_value,
        request.unit_of_measurement,
        JSON.stringify(request.success_criteria),
        JSON.stringify(request.stakeholders || []),
        JSON.stringify(request.resources_required || []),
        JSON.stringify(request.tags || []),
        request.visibility,
        request.parent_goal_id,
        GoalStatus.PLANNED,
        0
      ]);

      const goal = goalResult.rows[0];

      // Create key results if provided
      if (request.key_results && request.key_results.length > 0) {
        for (const keyResult of request.key_results) {
          await client.query(`
            INSERT INTO key_results (
              goal_id, title, description, metric_type, target_value,
              current_value, unit, measurement_frequency, data_source,
              calculation_method, threshold_values, owner, automated_tracking
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `, [
            goal.id,
            keyResult.title,
            keyResult.description,
            keyResult.metric_type,
            keyResult.target_value,
            keyResult.current_value || 0,
            keyResult.unit,
            keyResult.measurement_frequency,
            JSON.stringify(keyResult.data_source),
            keyResult.calculation_method,
            JSON.stringify(keyResult.threshold_values),
            keyResult.owner,
            keyResult.automated_tracking || false
          ]);
        }
      }

      // Create milestones if provided
      if (request.milestones && request.milestones.length > 0) {
        for (const [index, milestone] of request.milestones.entries()) {
          await client.query(`
            INSERT INTO milestones (
              goal_id, title, description, milestone_type, sequence_order,
              target_date, estimated_effort_hours, assigned_to, deliverables,
              acceptance_criteria, status, progress_percentage
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            goal.id,
            milestone.title,
            milestone.description,
            milestone.milestone_type,
            index + 1,
            milestone.target_date,
            milestone.estimated_effort_hours,
            JSON.stringify(milestone.assigned_to),
            JSON.stringify(milestone.deliverables),
            JSON.stringify(milestone.acceptance_criteria),
            MilestoneStatus.NOT_STARTED,
            0
          ]);
        }
      }

      // Initialize goal analytics
      await this.initializeGoalAnalytics(goal.id);

      // Generate initial recommendations
      await this.generateGoalRecommendations(goal.id);

      await client.query('COMMIT');

      logger.info('Goal created successfully', {
        goalId: goal.id,
        title: request.title,
        userId,
        executionTime: timer.end()
      });

      return this.getGoalById(goal.id);

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create goal', {
        error: (error as Error).message,
        userId,
        title: request.title
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get goal by ID with full details
   */
  async getGoalById(goalId: string): Promise<Goal> {
    const timer = performanceTimer('get_goal');

    try {
      const result = await this.pool.query(`
        SELECT
          g.*,
          json_agg(
            DISTINCT jsonb_build_object(
              'id', m.id,
              'title', m.title,
              'status', m.status,
              'progress_percentage', m.progress_percentage,
              'target_date', m.target_date,
              'sequence_order', m.sequence_order
            ) ORDER BY m.sequence_order
          ) FILTER (WHERE m.id IS NOT NULL) as milestones,
          json_agg(
            DISTINCT jsonb_build_object(
              'id', kr.id,
              'title', kr.title,
              'current_value', kr.current_value,
              'target_value', kr.target_value,
              'unit', kr.unit,
              'progress_percentage', kr.progress_percentage
            )
          ) FILTER (WHERE kr.id IS NOT NULL) as key_results,
          json_agg(
            DISTINCT jsonb_build_object(
              'id', ai.id,
              'title', ai.title,
              'status', ai.status,
              'assigned_to', ai.assigned_to,
              'due_date', ai.due_date,
              'priority', ai.priority
            )
          ) FILTER (WHERE ai.id IS NOT NULL) as action_items
        FROM goals g
        LEFT JOIN milestones m ON g.id = m.goal_id
        LEFT JOIN key_results kr ON g.id = kr.goal_id
        LEFT JOIN action_items ai ON g.id = ai.goal_id
        WHERE g.id = $1
        GROUP BY g.id
      `, [goalId]);

      if (result.rows.length === 0) {
        throw new Error('Goal not found');
      }

      const goal = result.rows[0];

      logger.info('Goal retrieved successfully', {
        goalId,
        executionTime: timer.end()
      });

      return {
        ...goal,
        success_criteria: JSON.parse(goal.success_criteria || '[]'),
        stakeholders: JSON.parse(goal.stakeholders || '[]'),
        resources_required: JSON.parse(goal.resources_required || '[]'),
        tags: JSON.parse(goal.tags || '[]'),
        dependencies: JSON.parse(goal.dependencies || '[]'),
        metrics: JSON.parse(goal.metrics || '[]'),
        automation_rules: JSON.parse(goal.automation_rules || '[]'),
        milestones: goal.milestones || [],
        key_results: goal.key_results || [],
        action_items: goal.action_items || []
      };

    } catch (error) {
      logger.error('Failed to get goal', {
        error: (error as Error).message,
        goalId
      });
      throw error;
    }
  }

  /**
   * Update goal
   */
  async updateGoal(
    goalId: string,
    userId: string,
    updates: UpdateGoalRequest
  ): Promise<Goal> {
    const timer = performanceTimer('update_goal');

    try {
      // Check if user has permission to update
      const permissionCheck = await this.pool.query(`
        SELECT user_id FROM goals WHERE id = $1
      `, [goalId]);

      if (permissionCheck.rows.length === 0) {
        throw new Error('Goal not found');
      }

      if (permissionCheck.rows[0].user_id !== userId) {
        throw new Error('Unauthorized to update this goal');
      }

      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && key !== 'id' && key !== 'created_at') {
          updateFields.push(`${key} = $${paramCount}`);
          updateValues.push(typeof value === 'object' ? JSON.stringify(value) : value);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        return this.getGoalById(goalId);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const query = `
        UPDATE goals
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      await this.pool.query(query, [...updateValues, goalId]);

      // Update analytics if progress changed
      if (updates.progress_percentage !== undefined) {
        await this.updateGoalAnalytics(goalId);
      }

      logger.info('Goal updated successfully', {
        goalId,
        userId,
        updatedFields: Object.keys(updates),
        executionTime: timer.end()
      });

      return this.getGoalById(goalId);

    } catch (error) {
      logger.error('Failed to update goal', {
        error: (error as Error).message,
        goalId,
        userId
      });
      throw error;
    }
  }

  /**
   * Delete goal
   */
  async deleteGoal(goalId: string, userId: string): Promise<void> {
    const timer = performanceTimer('delete_goal');

    try {
      // Check if user has permission to delete
      const permissionCheck = await this.pool.query(`
        SELECT user_id FROM goals WHERE id = $1
      `, [goalId]);

      if (permissionCheck.rows.length === 0) {
        throw new Error('Goal not found');
      }

      if (permissionCheck.rows[0].user_id !== userId) {
        throw new Error('Unauthorized to delete this goal');
      }

      // Soft delete by archiving
      await this.pool.query(`
        UPDATE goals
        SET status = $1, archived_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [GoalStatus.ARCHIVED, goalId]);

      logger.info('Goal deleted successfully', {
        goalId,
        userId,
        executionTime: timer.end()
      });

    } catch (error) {
      logger.error('Failed to delete goal', {
        error: (error as Error).message,
        goalId,
        userId
      });
      throw error;
    }
  }

  // =====================================================
  // MILESTONE MANAGEMENT
  // =====================================================

  /**
   * Create milestone
   */
  async createMilestone(
    userId: string,
    request: CreateMilestoneRequest
  ): Promise<Milestone> {
    const timer = performanceTimer('create_milestone');

    try {
      // Check if user has permission to add milestones to this goal
      const permissionCheck = await this.pool.query(`
        SELECT user_id FROM goals WHERE id = $1
      `, [request.goal_id]);

      if (permissionCheck.rows.length === 0) {
        throw new Error('Goal not found');
      }

      if (permissionCheck.rows[0].user_id !== userId) {
        throw new Error('Unauthorized to add milestones to this goal');
      }

      // Get next sequence order
      const sequenceResult = await this.pool.query(`
        SELECT COALESCE(MAX(sequence_order), 0) + 1 as next_order
        FROM milestones WHERE goal_id = $1
      `, [request.goal_id]);

      const sequenceOrder = sequenceResult.rows[0].next_order;

      // Create milestone
      const result = await this.pool.query(`
        INSERT INTO milestones (
          goal_id, title, description, milestone_type, sequence_order,
          target_date, estimated_effort_hours, assigned_to, deliverables,
          acceptance_criteria, dependencies, status, progress_percentage
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        request.goal_id,
        request.title,
        request.description,
        request.milestone_type,
        sequenceOrder,
        request.target_date,
        request.estimated_effort_hours,
        JSON.stringify(request.assigned_to),
        JSON.stringify(request.deliverables),
        JSON.stringify(request.acceptance_criteria),
        JSON.stringify(request.dependencies || []),
        MilestoneStatus.NOT_STARTED,
        0
      ]);

      const milestone = result.rows[0];

      logger.info('Milestone created successfully', {
        milestoneId: milestone.id,
        goalId: request.goal_id,
        title: request.title,
        userId,
        executionTime: timer.end()
      });

      return {
        ...milestone,
        assigned_to: JSON.parse(milestone.assigned_to || '[]'),
        deliverables: JSON.parse(milestone.deliverables || '[]'),
        acceptance_criteria: JSON.parse(milestone.acceptance_criteria || '[]'),
        dependencies: JSON.parse(milestone.dependencies || '[]'),
        blockers: JSON.parse(milestone.blockers || '[]'),
        resources_allocated: JSON.parse(milestone.resources_allocated || '[]'),
        quality_metrics: JSON.parse(milestone.quality_metrics || '[]')
      };

    } catch (error) {
      logger.error('Failed to create milestone', {
        error: (error as Error).message,
        userId,
        goalId: request.goal_id
      });
      throw error;
    }
  }

  /**
   * Update milestone
   */
  async updateMilestone(
    milestoneId: string,
    userId: string,
    updates: Partial<Milestone>
  ): Promise<Milestone> {
    const timer = performanceTimer('update_milestone');

    try {
      // Check if user has permission to update
      const permissionCheck = await this.pool.query(`
        SELECT g.user_id
        FROM milestones m
        JOIN goals g ON m.goal_id = g.id
        WHERE m.id = $1
      `, [milestoneId]);

      if (permissionCheck.rows.length === 0) {
        throw new Error('Milestone not found');
      }

      if (permissionCheck.rows[0].user_id !== userId) {
        throw new Error('Unauthorized to update this milestone');
      }

      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && key !== 'id' && key !== 'created_at') {
          updateFields.push(`${key} = $${paramCount}`);
          updateValues.push(typeof value === 'object' ? JSON.stringify(value) : value);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        return this.getMilestoneById(milestoneId);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const query = `
        UPDATE milestones
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await this.pool.query(query, [...updateValues, milestoneId]);
      const milestone = result.rows[0];

      // Update goal progress if milestone progress changed
      if (updates.progress_percentage !== undefined) {
        await this.updateGoalProgressFromMilestones(milestone.goal_id);
      }

      logger.info('Milestone updated successfully', {
        milestoneId,
        userId,
        updatedFields: Object.keys(updates),
        executionTime: timer.end()
      });

      return this.getMilestoneById(milestoneId);

    } catch (error) {
      logger.error('Failed to update milestone', {
        error: (error as Error).message,
        milestoneId,
        userId
      });
      throw error;
    }
  }

  /**
   * Complete milestone
   */
  async completeMilestone(
    milestoneId: string,
    userId: string,
    completionNotes?: string
  ): Promise<void> {
    const timer = performanceTimer('complete_milestone');

    try {
      await this.pool.query(`
        UPDATE milestones
        SET
          status = $1,
          progress_percentage = 100,
          completion_date = CURRENT_TIMESTAMP,
          retrospective_notes = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [MilestoneStatus.COMPLETED, completionNotes, milestoneId]);

      // Get milestone details for goal update
      const milestoneResult = await this.pool.query(`
        SELECT goal_id FROM milestones WHERE id = $1
      `, [milestoneId]);

      if (milestoneResult.rows.length > 0) {
        const goalId = milestoneResult.rows[0].goal_id;
        await this.updateGoalProgressFromMilestones(goalId);

        // Create progress update
        await this.createProgressUpdate({
          milestone_id: milestoneId,
          progress_percentage: 100,
          description: `Milestone completed: ${completionNotes || 'No additional notes'}`,
          achievements: ['Milestone completed successfully'],
          next_steps: ['Proceed to next milestone']
        }, userId);
      }

      logger.info('Milestone completed successfully', {
        milestoneId,
        userId,
        executionTime: timer.end()
      });

    } catch (error) {
      logger.error('Failed to complete milestone', {
        error: (error as Error).message,
        milestoneId,
        userId
      });
      throw error;
    }
  }

  // =====================================================
  // ACTION ITEM MANAGEMENT
  // =====================================================

  /**
   * Create action item
   */
  async createActionItem(
    userId: string,
    request: CreateActionItemRequest
  ): Promise<ActionItem> {
    const timer = performanceTimer('create_action_item');

    try {
      const result = await this.pool.query(`
        INSERT INTO action_items (
          goal_id, milestone_id, title, description, action_type, priority,
          assigned_to, created_by, due_date, estimated_duration_hours,
          resources_needed, skills_required, status, effort_level,
          complexity_level, impact_level, urgency_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `, [
        request.goal_id,
        request.milestone_id,
        request.title,
        request.description,
        request.action_type,
        request.priority,
        request.assigned_to,
        userId,
        request.due_date,
        request.estimated_duration_hours,
        JSON.stringify(request.resources_needed || []),
        JSON.stringify(request.skills_required || []),
        ActionStatus.TODO,
        'medium', // Default effort level
        'moderate', // Default complexity level
        'medium', // Default impact level
        'medium' // Default urgency level
      ]);

      const actionItem = result.rows[0];

      logger.info('Action item created successfully', {
        actionItemId: actionItem.id,
        title: request.title,
        assignedTo: request.assigned_to,
        userId,
        executionTime: timer.end()
      });

      return {
        ...actionItem,
        resources_needed: JSON.parse(actionItem.resources_needed || '[]'),
        skills_required: JSON.parse(actionItem.skills_required || '[]'),
        dependencies: JSON.parse(actionItem.dependencies || '[]'),
        prerequisites: JSON.parse(actionItem.prerequisites || '[]'),
        deliverables: JSON.parse(actionItem.deliverables || '[]'),
        progress_notes: JSON.parse(actionItem.progress_notes || '[]'),
        blockers: JSON.parse(actionItem.blockers || '[]'),
        sub_tasks: JSON.parse(actionItem.sub_tasks || '[]'),
        time_tracking: JSON.parse(actionItem.time_tracking || '[]'),
        quality_checklist: JSON.parse(actionItem.quality_checklist || '[]'),
        collaboration_notes: JSON.parse(actionItem.collaboration_notes || '[]'),
        attachments: JSON.parse(actionItem.attachments || '[]'),
        tags: JSON.parse(actionItem.tags || '[]')
      };

    } catch (error) {
      logger.error('Failed to create action item', {
        error: (error as Error).message,
        userId,
        title: request.title
      });
      throw error;
    }
  }

  /**
   * Update action item status
   */
  async updateActionItemStatus(
    actionItemId: string,
    userId: string,
    status: ActionStatus,
    notes?: string
  ): Promise<void> {
    const timer = performanceTimer('update_action_item_status');

    try {
      const updateData: any[] = [status, actionItemId];
      let query = `
        UPDATE action_items
        SET status = $1, updated_at = CURRENT_TIMESTAMP
      `;

      if (status === ActionStatus.COMPLETED) {
        query += `, completion_date = CURRENT_TIMESTAMP`;
      }

      if (notes) {
        query += `, progress_notes = progress_notes || $${updateData.length + 1}::jsonb`;
        updateData.push(JSON.stringify([{
          note: notes,
          created_at: new Date(),
          created_by: userId
        }]));
      }

      query += ` WHERE id = $2`;

      await this.pool.query(query, updateData);

      logger.info('Action item status updated successfully', {
        actionItemId,
        status,
        userId,
        executionTime: timer.end()
      });

    } catch (error) {
      logger.error('Failed to update action item status', {
        error: (error as Error).message,
        actionItemId,
        userId,
        status
      });
      throw error;
    }
  }

  // =====================================================
  // PROGRESS TRACKING
  // =====================================================

  /**
   * Create progress update
   */
  async createProgressUpdate(
    request: ProgressUpdateRequest,
    userId: string
  ): Promise<ProgressUpdate> {
    const timer = performanceTimer('create_progress_update');

    try {
      // Get previous progress for delta calculation
      let previousProgress = 0;
      let targetTable = '';
      let targetId = '';

      if (request.goal_id) {
        targetTable = 'goals';
        targetId = request.goal_id;
      } else if (request.milestone_id) {
        targetTable = 'milestones';
        targetId = request.milestone_id;
      } else if (request.action_item_id) {
        targetTable = 'action_items';
        targetId = request.action_item_id;
      }

      if (targetTable && targetId) {
        const progressResult = await this.pool.query(`
          SELECT progress_percentage FROM ${targetTable} WHERE id = $1
        `, [targetId]);

        if (progressResult.rows.length > 0) {
          previousProgress = progressResult.rows[0].progress_percentage || 0;
        }
      }

      const progressDelta = request.progress_percentage - previousProgress;

      // Create progress update
      const result = await this.pool.query(`
        INSERT INTO progress_updates (
          goal_id, milestone_id, action_item_id, update_type, progress_percentage,
          previous_percentage, progress_delta, description, achievements,
          challenges, next_steps, time_spent_hours, evidence, updated_by,
          update_source, automated, confidence_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `, [
        request.goal_id,
        request.milestone_id,
        request.action_item_id,
        UpdateType.PROGRESS,
        request.progress_percentage,
        previousProgress,
        progressDelta,
        request.description,
        JSON.stringify(request.achievements || []),
        JSON.stringify(request.challenges || []),
        JSON.stringify(request.next_steps || []),
        request.time_spent_hours || 0,
        JSON.stringify(request.evidence || []),
        userId,
        'manual',
        false,
        'medium'
      ]);

      const progressUpdate = result.rows[0];

      // Update target entity progress
      if (targetTable && targetId) {
        await this.pool.query(`
          UPDATE ${targetTable}
          SET progress_percentage = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [request.progress_percentage, targetId]);

        // Update parent goal progress if this is a milestone or action item
        if (request.milestone_id) {
          const milestoneResult = await this.pool.query(`
            SELECT goal_id FROM milestones WHERE id = $1
          `, [request.milestone_id]);

          if (milestoneResult.rows.length > 0) {
            await this.updateGoalProgressFromMilestones(milestoneResult.rows[0].goal_id);
          }
        }
      }

      logger.info('Progress update created successfully', {
        progressUpdateId: progressUpdate.id,
        targetTable,
        targetId,
        progressPercentage: request.progress_percentage,
        progressDelta,
        userId,
        executionTime: timer.end()
      });

      return {
        ...progressUpdate,
        achievements: JSON.parse(progressUpdate.achievements || '[]'),
        challenges: JSON.parse(progressUpdate.challenges || '[]'),
        next_steps: JSON.parse(progressUpdate.next_steps || '[]'),
        evidence: JSON.parse(progressUpdate.evidence || '[]'),
        risk_updates: JSON.parse(progressUpdate.risk_updates || '[]'),
        stakeholder_feedback: JSON.parse(progressUpdate.stakeholder_feedback || '[]')
      };

    } catch (error) {
      logger.error('Failed to create progress update', {
        error: (error as Error).message,
        userId,
        request
      });
      throw error;
    }
  }

  // =====================================================
  // ANALYTICS AND INSIGHTS
  // =====================================================

  /**
   * Get goal dashboard for user
   */
  async getGoalDashboard(userId: string): Promise<GoalDashboardResponse> {
    const timer = performanceTimer('get_goal_dashboard');

    try {
      // Get active goals
      const activeGoalsResult = await this.pool.query(`
        SELECT * FROM goals
        WHERE user_id = $1 AND status IN ('planned', 'active', 'on_track', 'at_risk', 'behind')
        ORDER BY priority DESC, target_date ASC
        LIMIT 10
      `, [userId]);

      // Get goal counts by status
      const goalCountsResult = await this.pool.query(`
        SELECT
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_goals_count,
          COUNT(CASE WHEN status IN ('behind', 'blocked') OR target_date < CURRENT_DATE THEN 1 END) as overdue_goals_count,
          COUNT(CASE WHEN status = 'at_risk' THEN 1 END) as at_risk_goals_count,
          AVG(progress_percentage) as overall_progress
        FROM goals
        WHERE user_id = $1 AND archived_at IS NULL
      `, [userId]);

      // Get upcoming milestones
      const upcomingMilestonesResult = await this.pool.query(`
        SELECT m.*, g.title as goal_title
        FROM milestones m
        JOIN goals g ON m.goal_id = g.id
        WHERE g.user_id = $1
          AND m.status NOT IN ('completed', 'cancelled')
          AND m.target_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
        ORDER BY m.target_date ASC
        LIMIT 5
      `, [userId]);

      // Get recent achievements (completed milestones in last 30 days)
      const recentAchievementsResult = await this.pool.query(`
        SELECT m.*, g.title as goal_title
        FROM milestones m
        JOIN goals g ON m.goal_id = g.id
        WHERE g.user_id = $1
          AND m.status = 'completed'
          AND m.completion_date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY m.completion_date DESC
        LIMIT 5
      `, [userId]);

      const goalCounts = goalCountsResult.rows[0];

      const dashboard: GoalDashboardResponse = {
        active_goals: activeGoalsResult.rows,
        completed_goals_count: parseInt(goalCounts.completed_goals_count || '0'),
        overdue_goals_count: parseInt(goalCounts.overdue_goals_count || '0'),
        at_risk_goals_count: parseInt(goalCounts.at_risk_goals_count || '0'),
        overall_progress: parseFloat(goalCounts.overall_progress || '0'),
        upcoming_milestones: upcomingMilestonesResult.rows,
        recent_achievements: recentAchievementsResult.rows.map(row => ({
          id: row.id,
          title: row.title,
          goal_title: row.goal_title,
          completion_date: row.completion_date,
          type: 'milestone_completion'
        })),
        performance_trends: [], // Calculate separately
        team_performance: {}, // Calculate separately
        recommendations: [], // Generate separately
        insights: [] // Generate separately
      };

      logger.info('Goal dashboard retrieved successfully', {
        userId,
        activeGoalsCount: dashboard.active_goals.length,
        overallProgress: dashboard.overall_progress,
        executionTime: timer.end()
      });

      return dashboard;

    } catch (error) {
      logger.error('Failed to get goal dashboard', {
        error: (error as Error).message,
        userId
      });
      throw error;
    }
  }

  /**
   * Generate goal recommendations
   */
  async generateGoalRecommendations(goalId: string): Promise<GoalRecommendation[]> {
    const timer = performanceTimer('generate_goal_recommendations');

    try {
      // Get goal details for analysis
      const goal = await this.getGoalById(goalId);

      const recommendations: GoalRecommendation[] = [];

      // Analyze goal progress and generate recommendations
      if (goal.progress_percentage < 25 && this.isOverdue(goal.target_date)) {
        recommendations.push({
          id: `rec_${Date.now()}_1`,
          goal_id: goalId,
          recommendation_type: RecommendationType.TIMELINE_ADJUSTMENT,
          category: 'timeline',
          priority: 'high',
          title: 'Consider Timeline Adjustment',
          description: 'This goal appears to be behind schedule. Consider adjusting the timeline or breaking it into smaller milestones.',
          rationale: 'Low progress percentage combined with approaching deadline indicates potential timeline issues.',
          expected_impact: {
            success_probability_increase: 0.3,
            timeline_improvement: 0.2,
            resource_efficiency_gain: 0.1
          },
          implementation_effort: 'low',
          implementation_timeline: {
            estimated_hours: 2,
            estimated_days: 1
          },
          required_resources: [],
          success_probability: 0.8,
          risk_level: 'low',
          dependencies: [],
          alternatives: [],
          evidence: [],
          similar_cases: [],
          expert_opinions: [],
          data_sources: [],
          confidence_score: 0.75,
          relevance_score: 0.9,
          urgency_score: 0.8,
          feasibility_score: 0.9,
          impact_score: 0.7,
          overall_score: 0.8,
          status: 'pending',
          feedback: [],
          implementation_progress: {
            started: false,
            progress_percentage: 0,
            milestones_completed: 0,
            total_milestones: 0
          },
          results_tracking: {
            metrics_tracked: [],
            baseline_values: {},
            current_values: {},
            target_values: {}
          },
          generated_by: 'system',
          generated_at: new Date(),
          accepted: false,
          implemented: false,
          created_at: new Date(),
          updated_at: new Date(),
          metadata: {}
        });
      }

      // Check for resource optimization opportunities
      if (goal.milestones && goal.milestones.length > 5) {
        recommendations.push({
          id: `rec_${Date.now()}_2`,
          goal_id: goalId,
          recommendation_type: RecommendationType.PROCESS_IMPROVEMENT,
          category: 'efficiency',
          priority: 'medium',
          title: 'Optimize Milestone Structure',
          description: 'Consider consolidating some milestones to improve focus and reduce overhead.',
          rationale: 'Goals with many milestones can become difficult to manage effectively.',
          expected_impact: {
            success_probability_increase: 0.2,
            timeline_improvement: 0.15,
            resource_efficiency_gain: 0.25
          },
          implementation_effort: 'medium',
          implementation_timeline: {
            estimated_hours: 4,
            estimated_days: 2
          },
          required_resources: [],
          success_probability: 0.7,
          risk_level: 'low',
          dependencies: [],
          alternatives: [],
          evidence: [],
          similar_cases: [],
          expert_opinions: [],
          data_sources: [],
          confidence_score: 0.65,
          relevance_score: 0.8,
          urgency_score: 0.5,
          feasibility_score: 0.8,
          impact_score: 0.6,
          overall_score: 0.7,
          status: 'pending',
          feedback: [],
          implementation_progress: {
            started: false,
            progress_percentage: 0,
            milestones_completed: 0,
            total_milestones: 0
          },
          results_tracking: {
            metrics_tracked: [],
            baseline_values: {},
            current_values: {},
            target_values: {}
          },
          generated_by: 'system',
          generated_at: new Date(),
          accepted: false,
          implemented: false,
          created_at: new Date(),
          updated_at: new Date(),
          metadata: {}
        });
      }

      // Store recommendations in database
      for (const recommendation of recommendations) {
        await this.pool.query(`
          INSERT INTO goal_recommendations (
            goal_id, recommendation_type, category, priority, title, description,
            rationale, expected_impact, implementation_effort, implementation_timeline,
            success_probability, risk_level, confidence_score, relevance_score,
            urgency_score, feasibility_score, impact_score, overall_score,
            status, generated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        `, [
          recommendation.goal_id,
          recommendation.recommendation_type,
          recommendation.category,
          recommendation.priority,
          recommendation.title,
          recommendation.description,
          recommendation.rationale,
          JSON.stringify(recommendation.expected_impact),
          recommendation.implementation_effort,
          JSON.stringify(recommendation.implementation_timeline),
          recommendation.success_probability,
          recommendation.risk_level,
          recommendation.confidence_score,
          recommendation.relevance_score,
          recommendation.urgency_score,
          recommendation.feasibility_score,
          recommendation.impact_score,
          recommendation.overall_score,
          recommendation.status,
          recommendation.generated_by
        ]);
      }

      logger.info('Goal recommendations generated successfully', {
        goalId,
        recommendationCount: recommendations.length,
        executionTime: timer.end()
      });

      return recommendations;

    } catch (error) {
      logger.error('Failed to generate goal recommendations', {
        error: (error as Error).message,
        goalId
      });
      throw error;
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private async getMilestoneById(milestoneId: string): Promise<Milestone> {
    const result = await this.pool.query(`
      SELECT * FROM milestones WHERE id = $1
    `, [milestoneId]);

    if (result.rows.length === 0) {
      throw new Error('Milestone not found');
    }

    const milestone = result.rows[0];
    return {
      ...milestone,
      assigned_to: JSON.parse(milestone.assigned_to || '[]'),
      deliverables: JSON.parse(milestone.deliverables || '[]'),
      acceptance_criteria: JSON.parse(milestone.acceptance_criteria || '[]'),
      dependencies: JSON.parse(milestone.dependencies || '[]'),
      blockers: JSON.parse(milestone.blockers || '[]'),
      resources_allocated: JSON.parse(milestone.resources_allocated || '[]'),
      quality_metrics: JSON.parse(milestone.quality_metrics || '[]')
    };
  }

  private async updateGoalProgressFromMilestones(goalId: string): Promise<void> {
    const result = await this.pool.query(`
      SELECT AVG(progress_percentage) as avg_progress
      FROM milestones
      WHERE goal_id = $1
    `, [goalId]);

    if (result.rows.length > 0) {
      const avgProgress = result.rows[0].avg_progress || 0;

      await this.pool.query(`
        UPDATE goals
        SET progress_percentage = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [Math.round(avgProgress), goalId]);
    }
  }

  private async initializeGoalAnalytics(goalId: string): Promise<void> {
    await this.pool.query(`
      INSERT INTO goal_analytics (
        goal_id, performance_summary, progress_trends, velocity_metrics,
        predictive_analytics, comparative_analysis, risk_analysis,
        resource_efficiency, stakeholder_satisfaction, impact_measurement,
        success_factors, failure_factors, lessons_learned_analysis,
        recommendation_engine, optimization_opportunities, benchmark_analysis,
        roi_analysis, time_analysis, quality_analysis, collaboration_effectiveness,
        analysis_confidence, data_completeness, methodology
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
    `, [
      goalId,
      JSON.stringify({}), // performance_summary
      JSON.stringify([]), // progress_trends
      JSON.stringify({}), // velocity_metrics
      JSON.stringify({}), // predictive_analytics
      JSON.stringify({}), // comparative_analysis
      JSON.stringify({}), // risk_analysis
      JSON.stringify({}), // resource_efficiency
      JSON.stringify({}), // stakeholder_satisfaction
      JSON.stringify({}), // impact_measurement
      JSON.stringify([]), // success_factors
      JSON.stringify([]), // failure_factors
      JSON.stringify({}), // lessons_learned_analysis
      JSON.stringify({}), // recommendation_engine
      JSON.stringify([]), // optimization_opportunities
      JSON.stringify({}), // benchmark_analysis
      JSON.stringify({}), // roi_analysis
      JSON.stringify({}), // time_analysis
      JSON.stringify({}), // quality_analysis
      JSON.stringify({}), // collaboration_effectiveness
      0.5, // analysis_confidence
      0.0, // data_completeness
      JSON.stringify({}) // methodology
    ]);
  }

  private async updateGoalAnalytics(goalId: string): Promise<void> {
    // Update analytics based on current goal state
    // This would involve complex calculations based on progress, milestones, etc.

    await this.pool.query(`
      UPDATE goal_analytics
      SET
        data_completeness = data_completeness + 0.1,
        updated_at = CURRENT_TIMESTAMP
      WHERE goal_id = $1
    `, [goalId]);
  }

  private isOverdue(targetDate: Date): boolean {
    return new Date(targetDate) < new Date();
  }

  /**
   * Search goals
   */
  async searchGoals(
    userId: string,
    query: string,
    filters: {
      goal_type?: GoalType;
      goal_category?: GoalCategory;
      status?: GoalStatus;
      priority?: GoalPriority;
      date_range?: { start: Date; end: Date };
    } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{ goals: Goal[]; total: number; page: number; totalPages: number }> {
    const timer = performanceTimer('search_goals');

    try {
      let whereConditions = ['g.user_id = $1', 'g.archived_at IS NULL'];
      const queryParams: any[] = [userId];
      let paramCount = 2;

      // Text search
      if (query) {
        whereConditions.push(`(
          g.title ILIKE $${paramCount} OR
          g.description ILIKE $${paramCount} OR
          array_to_string(g.tags, ' ') ILIKE $${paramCount}
        )`);
        queryParams.push(`%${query}%`);
        paramCount++;
      }

      // Filters
      if (filters.goal_type) {
        whereConditions.push(`g.goal_type = $${paramCount}`);
        queryParams.push(filters.goal_type);
        paramCount++;
      }

      if (filters.goal_category) {
        whereConditions.push(`g.goal_category = $${paramCount}`);
        queryParams.push(filters.goal_category);
        paramCount++;
      }

      if (filters.status) {
        whereConditions.push(`g.status = $${paramCount}`);
        queryParams.push(filters.status);
        paramCount++;
      }

      if (filters.priority) {
        whereConditions.push(`g.priority = $${paramCount}`);
        queryParams.push(filters.priority);
        paramCount++;
      }

      if (filters.date_range) {
        whereConditions.push(`g.target_date BETWEEN $${paramCount} AND $${paramCount + 1}`);
        queryParams.push(filters.date_range.start, filters.date_range.end);
        paramCount += 2;
      }

      // Pagination
      const offset = (pagination.page - 1) * pagination.limit;

      const searchQuery = `
        SELECT
          g.*,
          COUNT(m.id) as milestone_count,
          COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed_milestones
        FROM goals g
        LEFT JOIN milestones m ON g.id = m.goal_id
        WHERE ${whereConditions.join(' AND ')}
        GROUP BY g.id
        ORDER BY g.priority DESC, g.target_date ASC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      const countQuery = `
        SELECT COUNT(DISTINCT g.id) as total
        FROM goals g
        WHERE ${whereConditions.join(' AND ')}
      `;

      queryParams.push(pagination.limit, offset);

      const [searchResult, countResult] = await Promise.all([
        this.pool.query(searchQuery, queryParams.slice(0, -2).concat([pagination.limit, offset])),
        this.pool.query(countQuery, queryParams.slice(0, -2))
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / pagination.limit);

      logger.info('Goals search completed', {
        query,
        resultsCount: searchResult.rows.length,
        total,
        page: pagination.page,
        userId,
        executionTime: timer.end()
      });

      return {
        goals: searchResult.rows.map(row => ({
          ...row,
          tags: JSON.parse(row.tags || '[]'),
          success_criteria: JSON.parse(row.success_criteria || '[]'),
          stakeholders: JSON.parse(row.stakeholders || '[]'),
          resources_required: JSON.parse(row.resources_required || '[]'),
          dependencies: JSON.parse(row.dependencies || '[]'),
          metrics: JSON.parse(row.metrics || '[]'),
          automation_rules: JSON.parse(row.automation_rules || '[]')
        })),
        total,
        page: pagination.page,
        totalPages
      };

    } catch (error) {
      logger.error('Failed to search goals', {
        error: (error as Error).message,
        query,
        filters,
        userId
      });
      throw error;
    }
  }
}
