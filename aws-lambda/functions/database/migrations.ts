/**
 * Database Migrations Manager
 * Handles database schema migrations with proper versioning and rollback support
 */

import { Pool, PoolClient } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';

export interface Migration {
  version: string;
  description: string;
  filename: string;
  up: string;
  down?: string;
  checksum?: string;
}

export interface MigrationResult {
  version: string;
  success: boolean;
  executionTime: number;
  error?: string;
}

export class DatabaseMigrations {
  private pool: Pool;
  private migrationsPath: string;

  constructor(pool: Pool, migrationsPath: string = __dirname) {
    this.pool = pool;
    this.migrationsPath = migrationsPath;
  }

  /**
   * Get all available migrations
   */
  private getMigrations(): Migration[] {
    return [
      {
        version: '001_initial_schema',
        description: 'Initial database schema with core functionality',
        filename: '001_initial_schema.sql',
        up: this.loadMigrationFile('001_initial_schema.sql')
      },
      {
        version: '002_blockchain_solana_chainlink',
        description: 'Solana and Chainlink blockchain integration',
        filename: '002_blockchain_solana_chainlink.sql',
        up: this.loadMigrationFile('002_blockchain_solana_chainlink.sql')
      }
      // Add new migrations here as needed
    ];
  }

  /**
   * Load migration file content
   */
  private loadMigrationFile(filename: string): string {
    try {
      const filePath = join(this.migrationsPath, filename);
      return readFileSync(filePath, 'utf8');
    } catch (error) {
      logger.error('Failed to load migration file', {
        filename,
        error: (error as Error).message
      });
      throw new Error(`Migration file not found: ${filename}`);
    }
  }

  /**
   * Calculate checksum for migration content
   */
  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Ensure migrations table exists
   */
  private async ensureMigrationsTable(client: PoolClient): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER,
        checksum VARCHAR(64)
      );
    `;

    await client.query(createTableSQL);
  }

  /**
   * Get executed migrations from database
   */
  private async getExecutedMigrations(client: PoolClient): Promise<Set<string>> {
    try {
      const result = await client.query(
        'SELECT version FROM schema_migrations ORDER BY executed_at'
      );
      return new Set(result.rows.map(row => row.version));
    } catch (error) {
      // If table doesn't exist, return empty set
      return new Set();
    }
  }

  /**
   * Record migration execution
   */
  private async recordMigration(
    client: PoolClient,
    migration: Migration,
    executionTime: number
  ): Promise<void> {
    const checksum = this.calculateChecksum(migration.up);

    await client.query(
      `INSERT INTO schema_migrations (version, description, execution_time_ms, checksum)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (version) DO UPDATE SET
         executed_at = CURRENT_TIMESTAMP,
         execution_time_ms = EXCLUDED.execution_time_ms,
         checksum = EXCLUDED.checksum`,
      [migration.version, migration.description, executionTime, checksum]
    );
  }

  /**
   * Execute a single migration
   */
  private async executeMigration(
    client: PoolClient,
    migration: Migration
  ): Promise<MigrationResult> {
    const timer = performanceTimer(`migration_${migration.version}`);

    try {
      logger.info('Executing migration', {
        version: migration.version,
        description: migration.description
      });

      // Execute migration SQL
      await client.query(migration.up);

      const executionTime = timer.end();

      // Record successful migration
      await this.recordMigration(client, migration, executionTime);

      logger.info('Migration completed successfully', {
        version: migration.version,
        executionTime
      });

      return {
        version: migration.version,
        success: true,
        executionTime
      };

    } catch (error) {
      timer.end();

      logger.error('Migration failed', {
        version: migration.version,
        error: (error as Error).message
      });

      return {
        version: migration.version,
        success: false,
        executionTime: 0,
        error: (error as Error).message
      };
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<MigrationResult[]> {
    const client = await this.pool.connect();
    const results: MigrationResult[] = [];

    try {
      // Start transaction
      await client.query('BEGIN');

      // Ensure migrations table exists
      await this.ensureMigrationsTable(client);

      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations(client);

      // Get all available migrations
      const allMigrations = this.getMigrations();

      // Filter pending migrations
      const pendingMigrations = allMigrations.filter(
        migration => !executedMigrations.has(migration.version)
      );

      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations to execute');
        await client.query('COMMIT');
        return results;
      }

      logger.info('Running pending migrations', {
        pendingCount: pendingMigrations.length,
        migrations: pendingMigrations.map(m => m.version)
      });

      // Execute pending migrations in order
      for (const migration of pendingMigrations) {
        const result = await this.executeMigration(client, migration);
        results.push(result);

        // If migration failed, rollback and stop
        if (!result.success) {
          await client.query('ROLLBACK');
          throw new Error(`Migration ${migration.version} failed: ${result.error}`);
        }
      }

      // Commit all migrations
      await client.query('COMMIT');

      logger.info('All migrations completed successfully', {
        executedCount: results.length,
        totalTime: results.reduce((sum, r) => sum + r.executionTime, 0)
      });

      return results;

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Migration process failed', {
        error: (error as Error).message
      });
      throw error;

    } finally {
      client.release();
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<{
    executed: string[];
    pending: string[];
    total: number;
  }> {
    const client = await this.pool.connect();

    try {
      await this.ensureMigrationsTable(client);

      const executedMigrations = await this.getExecutedMigrations(client);
      const allMigrations = this.getMigrations();

      const executed = allMigrations
        .filter(m => executedMigrations.has(m.version))
        .map(m => m.version);

      const pending = allMigrations
        .filter(m => !executedMigrations.has(m.version))
        .map(m => m.version);

      return {
        executed,
        pending,
        total: allMigrations.length
      };

    } finally {
      client.release();
    }
  }

  /**
   * Validate migration checksums
   */
  async validateMigrations(): Promise<{
    valid: boolean;
    issues: Array<{
      version: string;
      issue: string;
    }>;
  }> {
    const client = await this.pool.connect();
    const issues: Array<{ version: string; issue: string }> = [];

    try {
      await this.ensureMigrationsTable(client);

      // Get executed migrations with checksums
      const result = await client.query(
        'SELECT version, checksum FROM schema_migrations WHERE checksum IS NOT NULL'
      );

      const executedMigrations = new Map(
        result.rows.map(row => [row.version, row.checksum])
      );

      // Check each migration
      const allMigrations = this.getMigrations();

      for (const migration of allMigrations) {
        const storedChecksum = executedMigrations.get(migration.version);

        if (storedChecksum) {
          const currentChecksum = this.calculateChecksum(migration.up);

          if (storedChecksum !== currentChecksum) {
            issues.push({
              version: migration.version,
              issue: 'Migration content has changed after execution'
            });
          }
        }
      }

      return {
        valid: issues.length === 0,
        issues
      };

    } finally {
      client.release();
    }
  }

  /**
   * Reset database (DROP ALL TABLES - USE WITH CAUTION)
   */
  async resetDatabase(): Promise<void> {
    const client = await this.pool.connect();

    try {
      logger.warn('Resetting database - dropping all tables');

      await client.query('BEGIN');

      // Drop all tables in the public schema
      const dropTablesSQL = `
        DO $$ DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
        END $$;
      `;

      await client.query(dropTablesSQL);

      // Drop all sequences
      const dropSequencesSQL = `
        DO $$ DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public') LOOP
            EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequencename) || ' CASCADE';
          END LOOP;
        END $$;
      `;

      await client.query(dropSequencesSQL);

      // Drop all functions
      const dropFunctionsSQL = `
        DO $$ DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT proname, oidvectortypes(proargtypes) as argtypes
                   FROM pg_proc INNER JOIN pg_namespace ns ON (pg_proc.pronamespace = ns.oid)
                   WHERE ns.nspname = 'public') LOOP
            EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || '(' || r.argtypes || ') CASCADE';
          END LOOP;
        END $$;
      `;

      await client.query(dropFunctionsSQL);

      await client.query('COMMIT');

      logger.info('Database reset completed');

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Database reset failed', {
        error: (error as Error).message
      });
      throw error;

    } finally {
      client.release();
    }
  }

  /**
   * Create a new migration template
   */
  createMigrationTemplate(name: string): string {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const version = `${timestamp}_${name}`;

    const template = `-- =====================================================
-- AUXEIRA MIGRATION: ${name.toUpperCase()}
-- =====================================================
-- Migration: ${version}
-- Created: ${new Date().toISOString().slice(0, 10)}
-- =====================================================

-- Add your migration SQL here

-- Example:
-- CREATE TABLE example_table (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE INDEX idx_example_table_name ON example_table(name);

-- Record migration
INSERT INTO schema_migrations (version, description) VALUES
('${version}', '${name.replace(/_/g, ' ')}');
`;

    logger.info('Migration template created', {
      version,
      filename: `${version}.sql`
    });

    return template;
  }
}

// Export singleton instance
export const migrations = new DatabaseMigrations(
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })
);

// CLI interface for running migrations
if (require.main === module) {
  const command = process.argv[2];

  async function runCLI() {
    try {
      switch (command) {
        case 'up':
        case 'migrate':
          const results = await migrations.runMigrations();
          console.log('Migration results:', results);
          break;

        case 'status':
          const status = await migrations.getMigrationStatus();
          console.log('Migration status:', status);
          break;

        case 'validate':
          const validation = await migrations.validateMigrations();
          console.log('Migration validation:', validation);
          break;

        case 'reset':
          if (process.env.NODE_ENV === 'production') {
            console.error('Cannot reset database in production');
            process.exit(1);
          }
          await migrations.resetDatabase();
          console.log('Database reset completed');
          break;

        case 'create':
          const migrationName = process.argv[3];
          if (!migrationName) {
            console.error('Please provide a migration name');
            process.exit(1);
          }
          const template = migrations.createMigrationTemplate(migrationName);
          console.log(template);
          break;

        default:
          console.log('Available commands:');
          console.log('  up|migrate  - Run pending migrations');
          console.log('  status      - Show migration status');
          console.log('  validate    - Validate migration checksums');
          console.log('  reset       - Reset database (development only)');
          console.log('  create <name> - Create migration template');
          break;
      }

    } catch (error) {
      console.error('Migration command failed:', error);
      process.exit(1);
    }
  }

  runCLI();
}
