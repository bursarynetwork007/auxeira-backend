import { pool } from '../config/database';
import { logger, loggers } from '../utils/logger';

/**
 * Database Migration Script
 * This script automatically creates all necessary tables and indexes
 * when the backend starts up
 */

const migrations = [
  {
    version: '001',
    name: 'Initial Schema',
    sql: `
      -- Enable UUID extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'founder', 'investor', 'admin')),
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- SSE Scores table
      CREATE TABLE IF NOT EXISTS sse_scores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        overall_score DECIMAL(5,2) NOT NULL,
        social_score DECIMAL(5,2) NOT NULL,
        sustainability_score DECIMAL(5,2) NOT NULL,
        economic_score DECIMAL(5,2) NOT NULL,
        calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        version VARCHAR(10) DEFAULT '1.0',
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- Daily Questions table
      CREATE TABLE IF NOT EXISTS daily_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_text TEXT NOT NULL,
        question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('multiple_choice', 'scale', 'boolean', 'text')),
        category VARCHAR(20) NOT NULL CHECK (category IN ('social', 'sustainability', 'economic')),
        subcategory VARCHAR(50),
        options JSONB,
        scale_min INTEGER,
        scale_max INTEGER,
        weight DECIMAL(3,2) DEFAULT 1.0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- Question Responses table
      CREATE TABLE IF NOT EXISTS question_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        question_id UUID NOT NULL REFERENCES daily_questions(id) ON DELETE CASCADE,
        response JSONB NOT NULL,
        response_date DATE NOT NULL DEFAULT CURRENT_DATE,
        impact_score DECIMAL(5,2) DEFAULT 0,
        category VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- Behavior Data table
      CREATE TABLE IF NOT EXISTS behavior_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        behavior_type VARCHAR(100) NOT NULL,
        category VARCHAR(20) NOT NULL CHECK (category IN ('social', 'sustainability', 'economic')),
        impact VARCHAR(10) NOT NULL CHECK (impact IN ('positive', 'negative', 'neutral')),
        magnitude DECIMAL(3,2) NOT NULL DEFAULT 1.0,
        description TEXT,
        recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        source VARCHAR(20) DEFAULT 'user_input' CHECK (source IN ('user_input', 'system_detected', 'ai_inferred')),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- SSE Insights table
      CREATE TABLE IF NOT EXISTS sse_insights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('strength', 'weakness', 'opportunity', 'trend', 'warning')),
        category VARCHAR(20) NOT NULL CHECK (category IN ('social', 'sustainability', 'economic', 'overall')),
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        impact VARCHAR(10) NOT NULL CHECK (impact IN ('high', 'medium', 'low')),
        confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5,
        actionable BOOLEAN DEFAULT TRUE,
        related_metrics JSONB DEFAULT '[]'::jsonb,
        generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- SSE Recommendations table
      CREATE TABLE IF NOT EXISTS sse_recommendations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(20) NOT NULL CHECK (category IN ('social', 'sustainability', 'economic')),
        priority VARCHAR(10) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        action_steps JSONB DEFAULT '[]'::jsonb,
        expected_impact DECIMAL(5,2) DEFAULT 0,
        timeframe VARCHAR(20) DEFAULT 'medium_term' CHECK (timeframe IN ('immediate', 'short_term', 'medium_term', 'long_term')),
        difficulty VARCHAR(15) DEFAULT 'moderate' CHECK (difficulty IN ('easy', 'moderate', 'challenging')),
        resources JSONB DEFAULT '[]'::jsonb,
        related_metrics JSONB DEFAULT '[]'::jsonb,
        generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- Achievements table
      CREATE TABLE IF NOT EXISTS achievements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(30) NOT NULL CHECK (type IN ('score_milestone', 'streak', 'improvement', 'category_leader', 'behavior_change')),
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(20) CHECK (category IN ('social', 'sustainability', 'economic')),
        threshold DECIMAL(10,2) NOT NULL,
        current_value DECIMAL(10,2) DEFAULT 0,
        is_unlocked BOOLEAN DEFAULT FALSE,
        unlocked_at TIMESTAMP WITH TIME ZONE,
        badge_icon VARCHAR(100),
        points INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- Goals table
      CREATE TABLE IF NOT EXISTS goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(30) NOT NULL CHECK (type IN ('score_target', 'behavior_change', 'metric_improvement', 'custom')),
        category VARCHAR(20) NOT NULL CHECK (category IN ('social', 'sustainability', 'economic', 'overall')),
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        target_value DECIMAL(10,2) NOT NULL,
        current_value DECIMAL(10,2) DEFAULT 0,
        deadline DATE,
        status VARCHAR(15) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
        progress DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- Milestones table
      CREATE TABLE IF NOT EXISTS milestones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        target_value DECIMAL(10,2) NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP WITH TIME ZONE,
        order_index INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `
  },
  {
    version: '002',
    name: 'Create Indexes',
    sql: `
      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

      CREATE INDEX IF NOT EXISTS idx_sse_scores_user_id ON sse_scores(user_id);
      CREATE INDEX IF NOT EXISTS idx_sse_scores_calculated_at ON sse_scores(calculated_at);
      CREATE INDEX IF NOT EXISTS idx_sse_scores_overall_score ON sse_scores(overall_score);

      CREATE INDEX IF NOT EXISTS idx_daily_questions_category ON daily_questions(category);
      CREATE INDEX IF NOT EXISTS idx_daily_questions_is_active ON daily_questions(is_active);
      CREATE INDEX IF NOT EXISTS idx_daily_questions_type ON daily_questions(question_type);

      CREATE INDEX IF NOT EXISTS idx_question_responses_user_id ON question_responses(user_id);
      CREATE INDEX IF NOT EXISTS idx_question_responses_question_id ON question_responses(question_id);
      CREATE INDEX IF NOT EXISTS idx_question_responses_date ON question_responses(response_date);
      CREATE INDEX IF NOT EXISTS idx_question_responses_category ON question_responses(category);

      CREATE INDEX IF NOT EXISTS idx_behavior_data_user_id ON behavior_data(user_id);
      CREATE INDEX IF NOT EXISTS idx_behavior_data_category ON behavior_data(category);
      CREATE INDEX IF NOT EXISTS idx_behavior_data_recorded_at ON behavior_data(recorded_at);
      CREATE INDEX IF NOT EXISTS idx_behavior_data_impact ON behavior_data(impact);

      CREATE INDEX IF NOT EXISTS idx_sse_insights_user_id ON sse_insights(user_id);
      CREATE INDEX IF NOT EXISTS idx_sse_insights_type ON sse_insights(type);
      CREATE INDEX IF NOT EXISTS idx_sse_insights_category ON sse_insights(category);
      CREATE INDEX IF NOT EXISTS idx_sse_insights_generated_at ON sse_insights(generated_at);

      CREATE INDEX IF NOT EXISTS idx_sse_recommendations_user_id ON sse_recommendations(user_id);
      CREATE INDEX IF NOT EXISTS idx_sse_recommendations_category ON sse_recommendations(category);
      CREATE INDEX IF NOT EXISTS idx_sse_recommendations_priority ON sse_recommendations(priority);

      CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
      CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(type);
      CREATE INDEX IF NOT EXISTS idx_achievements_is_unlocked ON achievements(is_unlocked);

      CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
      CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
      CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
      CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);

      CREATE INDEX IF NOT EXISTS idx_milestones_goal_id ON milestones(goal_id);
      CREATE INDEX IF NOT EXISTS idx_milestones_is_completed ON milestones(is_completed);
    `
  },
  {
    version: '003',
    name: 'Insert Sample Data',
    sql: `
      -- Insert sample daily questions
      INSERT INTO daily_questions (question_text, question_type, category, subcategory, weight, options) VALUES
      ('How many hours did you volunteer for community service this week?', 'scale', 'social', 'community_engagement', 1.0, '{"scale_min": 0, "scale_max": 20}'),
      ('Did you choose sustainable transportation today?', 'boolean', 'sustainability', 'carbon_footprint', 0.8, null),
      ('How would you rate your work-life balance this week?', 'scale', 'economic', 'employee_wellbeing', 0.9, '{"scale_min": 1, "scale_max": 10}'),
      ('Which sustainable practices did you implement today?', 'multiple_choice', 'sustainability', 'daily_practices', 1.0, '["Recycling", "Energy conservation", "Water saving", "Sustainable transport", "None"]'),
      ('How many people from diverse backgrounds did you collaborate with this week?', 'scale', 'social', 'diversity_inclusion', 1.0, '{"scale_min": 0, "scale_max": 20}'),
      ('Did you make any environmentally conscious purchasing decisions today?', 'boolean', 'sustainability', 'sustainable_consumption', 0.7, null),
      ('How satisfied are you with your current financial planning?', 'scale', 'economic', 'financial_planning', 0.8, '{"scale_min": 1, "scale_max": 10}'),
      ('What social impact initiative did you support this month?', 'multiple_choice', 'social', 'social_impact', 1.2, '["Education", "Healthcare", "Environment", "Poverty alleviation", "Human rights", "None"]'),
      ('How many sustainable products did you choose over conventional ones this week?', 'scale', 'sustainability', 'sustainable_products', 0.9, '{"scale_min": 0, "scale_max": 10}'),
      ('Did you contribute to any economic development in your community this month?', 'boolean', 'economic', 'community_development', 1.1, null)
      ON CONFLICT DO NOTHING;

      -- Create migration tracking table
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(10) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `
  }
];

/**
 * Check if a migration has been executed
 */
async function isMigrationExecuted(version: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT version FROM schema_migrations WHERE version = $1',
      [version]
    );
    return result.rows.length > 0;
  } catch (error) {
    // If table doesn't exist, migration hasn't been executed
    return false;
  }
}

/**
 * Mark migration as executed
 */
async function markMigrationExecuted(version: string, name: string): Promise<void> {
  try {
    await pool.query(
      'INSERT INTO schema_migrations (version, name) VALUES ($1, $2) ON CONFLICT (version) DO NOTHING',
      [version, name]
    );
  } catch (error) {
    loggers.errorWithContext(error as Error, 'MARK_MIGRATION_EXECUTED', { version, name });
  }
}

/**
 * Execute a single migration
 */
async function executeMigration(migration: { version: string; name: string; sql: string }): Promise<void> {
  const client = await pool.connect();

  try {
    loggers.database(`Executing migration ${migration.version}: ${migration.name}`);

    // Start transaction
    await client.query('BEGIN');

    // Execute migration SQL
    await client.query(migration.sql);

    // Mark migration as executed
    await client.query(
      'INSERT INTO schema_migrations (version, name) VALUES ($1, $2) ON CONFLICT (version) DO NOTHING',
      [migration.version, migration.name]
    );

    // Commit transaction
    await client.query('COMMIT');

    loggers.database(`Migration ${migration.version} executed successfully`);
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    loggers.errorWithContext(error as Error, 'EXECUTE_MIGRATION', {
      version: migration.version,
      name: migration.name
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    loggers.database('Starting database migrations...');

    let migrationsExecuted = 0;

    for (const migration of migrations) {
      const isExecuted = await isMigrationExecuted(migration.version);

      if (!isExecuted) {
        await executeMigration(migration);
        migrationsExecuted++;
      } else {
        loggers.database(`Migration ${migration.version} already executed, skipping`);
      }
    }

    if (migrationsExecuted > 0) {
      loggers.database(`Database migrations completed. ${migrationsExecuted} migrations executed.`);
    } else {
      loggers.database('Database is up to date. No migrations needed.');
    }

    // Verify database structure
    await verifyDatabaseStructure();

  } catch (error) {
    loggers.errorWithContext(error as Error, 'RUN_MIGRATIONS');
    throw new Error(`Database migration failed: ${error}`);
  }
}

/**
 * Verify database structure is correct
 */
async function verifyDatabaseStructure(): Promise<void> {
  try {
    const requiredTables = [
      'users',
      'sse_scores',
      'daily_questions',
      'question_responses',
      'behavior_data',
      'sse_insights',
      'sse_recommendations',
      'achievements',
      'goals',
      'milestones',
      'schema_migrations'
    ];

    for (const table of requiredTables) {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )`,
        [table]
      );

      if (!result.rows[0].exists) {
        throw new Error(`Required table '${table}' does not exist`);
      }
    }

    loggers.database('Database structure verification completed successfully');
  } catch (error) {
    loggers.errorWithContext(error as Error, 'VERIFY_DATABASE_STRUCTURE');
    throw error;
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{
  totalMigrations: number;
  executedMigrations: number;
  pendingMigrations: string[];
  lastMigration?: { version: string; name: string; executedAt: Date };
}> {
  try {
    const executedResult = await pool.query(
      'SELECT version, name, executed_at FROM schema_migrations ORDER BY version DESC'
    );

    const executedVersions = executedResult.rows.map(row => row.version);
    const pendingMigrations = migrations
      .filter(migration => !executedVersions.includes(migration.version))
      .map(migration => migration.version);

    const lastMigration = executedResult.rows[0] ? {
      version: executedResult.rows[0].version,
      name: executedResult.rows[0].name,
      executedAt: executedResult.rows[0].executed_at
    } : undefined;

    return {
      totalMigrations: migrations.length,
      executedMigrations: executedVersions.length,
      pendingMigrations,
      lastMigration
    };
  } catch (error) {
    loggers.errorWithContext(error as Error, 'GET_MIGRATION_STATUS');
    throw error;
  }
}

/**
 * Reset database (WARNING: This will delete all data!)
 */
export async function resetDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database reset is not allowed in production environment');
  }

  try {
    loggers.database('WARNING: Resetting database - all data will be lost!');

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Drop all tables
      const dropTablesSQL = `
        DROP TABLE IF EXISTS milestones CASCADE;
        DROP TABLE IF EXISTS goals CASCADE;
        DROP TABLE IF EXISTS achievements CASCADE;
        DROP TABLE IF EXISTS sse_recommendations CASCADE;
        DROP TABLE IF EXISTS sse_insights CASCADE;
        DROP TABLE IF EXISTS behavior_data CASCADE;
        DROP TABLE IF EXISTS question_responses CASCADE;
        DROP TABLE IF EXISTS daily_questions CASCADE;
        DROP TABLE IF EXISTS sse_scores CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        DROP TABLE IF EXISTS schema_migrations CASCADE;
      `;

      await client.query(dropTablesSQL);
      await client.query('COMMIT');

      loggers.database('Database reset completed');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // Run migrations again
    await runMigrations();

  } catch (error) {
    loggers.errorWithContext(error as Error, 'RESET_DATABASE');
    throw error;
  }
}
