/**
 * Run Activity Rewards Migration
 * This script runs the 005_activity_rewards.sql migration
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'auxeira_central',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Activity Rewards migration...\n');
    
    // Read the migration file
    const migrationPath = join(__dirname, 'src', 'database', 'migrations', '005_activity_rewards.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    console.log(`📍 Path: ${migrationPath}\n`);
    
    // Begin transaction
    await client.query('BEGIN');
    console.log('🔄 Transaction started\n');
    
    // Execute migration
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully\n');
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('✅ Transaction committed\n');
    
    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('activities', 'activity_submissions', 'token_transactions', 'token_balances')
      ORDER BY table_name
    `);
    
    console.log('📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    // Count activities
    const activityCount = await client.query('SELECT COUNT(*) as count FROM activities');
    console.log(`\n📝 Seeded ${activityCount.rows[0].count} activities\n`);
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
