#!/usr/bin/env python3
"""
Auxeira Database Manager
Handles database connections, migrations, and data operations with timestamping
"""

import os
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple
from contextlib import contextmanager
import psycopg2
from psycopg2.extras import RealDictCursor, Json
from psycopg2.pool import ThreadedConnectionPool
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    """Main database manager class with connection pooling and timestamping"""
    
    def __init__(self, 
                 host: str = "localhost",
                 port: int = 5432,
                 database: str = "auxeira_central",
                 username: str = "postgres",
                 password: str = "postgres",
                 min_connections: int = 1,
                 max_connections: int = 20):
        
        self.connection_params = {
            'host': host,
            'port': port,
            'database': database,
            'user': username,
            'password': password
        }
        
        # Initialize connection pool
        try:
            self.pool = ThreadedConnectionPool(
                min_connections, 
                max_connections,
                **self.connection_params
            )
            logger.info(f"Database connection pool initialized: {min_connections}-{max_connections} connections")
        except Exception as e:
            logger.error(f"Failed to initialize connection pool: {e}")
            raise
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = None
        try:
            conn = self.pool.getconn()
            yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Database operation failed: {e}")
            raise
        finally:
            if conn:
                self.pool.putconn(conn)
    
    def execute_query(self, query: str, params: Optional[Tuple] = None, fetch: bool = False) -> Optional[List[Dict]]:
        """Execute a query with optional parameters"""
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, params)
                
                if fetch:
                    return [dict(row) for row in cursor.fetchall()]
                else:
                    conn.commit()
                    return None
    
    def execute_many(self, query: str, params_list: List[Tuple]) -> None:
        """Execute a query multiple times with different parameters"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.executemany(query, params_list)
                conn.commit()
    
    def initialize_database(self, schema_file: str = "database/init.sql") -> bool:
        """Initialize the database with the schema"""
        try:
            with open(schema_file, 'r') as f:
                schema_sql = f.read()
            
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(schema_sql)
                    conn.commit()
            
            logger.info("Database schema initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            return False
    
    def insert_synthetic_data(self, data: List[Dict[str, Any]], user_id: str, org_id: str) -> bool:
        """Insert synthetic data with proper timestamping"""
        try:
            insert_query = """
                INSERT INTO dashboard_metrics (
                    metric_id, user_id, org_id, dashboard_type, metric_name, 
                    metric_value, metric_timestamp, is_synthetic, synthetic_algorithm, created_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """
            
            params_list = []
            current_time = datetime.now(timezone.utc)
            
            for record in data:
                params = (
                    record.get('metric_id', str(uuid.uuid4())),
                    user_id,
                    org_id,
                    record['dashboard_type'],
                    'synthetic_metrics',
                    Json(record['metrics']),
                    record['metric_timestamp'],
                    record.get('is_synthetic', True),
                    record.get('synthetic_algorithm', 'default'),
                    current_time
                )
                params_list.append(params)
            
            self.execute_many(insert_query, params_list)
            logger.info(f"Inserted {len(data)} synthetic data records")
            return True
            
        except Exception as e:
            logger.error(f"Failed to insert synthetic data: {e}")
            return False
    
    def get_dashboard_metrics(self, 
                            user_id: str, 
                            dashboard_type: str, 
                            days: int = 30,
                            include_synthetic: bool = True) -> List[Dict[str, Any]]:
        """Retrieve dashboard metrics with timestamp filtering"""
        
        query = """
            SELECT 
                metric_id,
                dashboard_type,
                metric_name,
                metric_value,
                metric_timestamp,
                is_synthetic,
                synthetic_algorithm,
                created_at
            FROM dashboard_metrics 
            WHERE user_id = %s 
                AND dashboard_type = %s 
                AND metric_timestamp >= NOW() - INTERVAL '%s days'
        """
        
        params = [user_id, dashboard_type, days]
        
        if not include_synthetic:
            query += " AND is_synthetic = FALSE"
        
        query += " ORDER BY metric_timestamp DESC"
        
        return self.execute_query(query, params, fetch=True) or []
    
    def create_user(self, email: str, password_hash: str, user_type: str, profile: Dict[str, Any]) -> Optional[str]:
        """Create a new user with timestamping"""
        try:
            user_id = str(uuid.uuid4())
            query = """
                INSERT INTO users (user_id, email, password_hash, user_type, profile, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING user_id
            """
            
            current_time = datetime.now(timezone.utc)
            params = (user_id, email, password_hash, user_type, Json(profile), current_time, current_time)
            
            result = self.execute_query(query, params, fetch=True)
            if result:
                logger.info(f"Created user: {email} ({user_type})")
                return result[0]['user_id']
            return None
            
        except Exception as e:
            logger.error(f"Failed to create user: {e}")
            return None
    
    def create_organization(self, name: str, org_type: str, metadata: Dict[str, Any] = None) -> Optional[str]:
        """Create a new organization"""
        try:
            org_id = str(uuid.uuid4())
            query = """
                INSERT INTO organizations (org_id, name, org_type, metadata, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING org_id
            """
            
            current_time = datetime.now(timezone.utc)
            params = (org_id, name, org_type, Json(metadata or {}), current_time, current_time)
            
            result = self.execute_query(query, params, fetch=True)
            if result:
                logger.info(f"Created organization: {name} ({org_type})")
                return result[0]['org_id']
            return None
            
        except Exception as e:
            logger.error(f"Failed to create organization: {e}")
            return None
    
    def link_user_organization(self, user_id: str, org_id: str, role: str = "member") -> bool:
        """Link a user to an organization"""
        try:
            query = """
                INSERT INTO user_organizations (user_id, org_id, role, joined_at)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (user_id, org_id) DO UPDATE SET
                    role = EXCLUDED.role,
                    joined_at = EXCLUDED.joined_at
            """
            
            params = (user_id, org_id, role, datetime.now(timezone.utc))
            self.execute_query(query, params)
            logger.info(f"Linked user {user_id} to organization {org_id} as {role}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to link user to organization: {e}")
            return False
    
    def insert_sse_score(self, 
                         startup_id: str, 
                         total_score: int, 
                         component_scores: Dict[str, Any],
                         responses: Dict[str, Any],
                         created_by: str,
                         is_synthetic: bool = False) -> Optional[str]:
        """Insert SSE score with versioning and timestamping"""
        try:
            # Get next version number
            version_query = """
                SELECT COALESCE(MAX(version), 0) + 1 as next_version 
                FROM sse_scores 
                WHERE startup_id = %s
            """
            version_result = self.execute_query(version_query, (startup_id,), fetch=True)
            next_version = version_result[0]['next_version'] if version_result else 1
            
            # Insert new score
            score_id = str(uuid.uuid4())
            insert_query = """
                INSERT INTO sse_scores (
                    score_id, startup_id, version, total_score, component_scores, 
                    responses, is_synthetic, created_at, created_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING score_id
            """
            
            params = (
                score_id, startup_id, next_version, total_score,
                Json(component_scores), Json(responses), is_synthetic,
                datetime.now(timezone.utc), created_by
            )
            
            result = self.execute_query(insert_query, params, fetch=True)
            if result:
                logger.info(f"Inserted SSE score for startup {startup_id}, version {next_version}")
                return result[0]['score_id']
            return None
            
        except Exception as e:
            logger.error(f"Failed to insert SSE score: {e}")
            return None
    
    def get_latest_sse_score(self, startup_id: str) -> Optional[Dict[str, Any]]:
        """Get the latest SSE score for a startup"""
        query = """
            SELECT * FROM sse_scores 
            WHERE startup_id = %s 
            ORDER BY version DESC 
            LIMIT 1
        """
        
        result = self.execute_query(query, (startup_id,), fetch=True)
        return result[0] if result else None
    
    def insert_action(self, 
                     user_id: str, 
                     startup_id: str, 
                     action_type: str,
                     domain: str,
                     base_tokens: int,
                     actual_tokens: int,
                     metadata: Dict[str, Any] = None,
                     is_synthetic: bool = False) -> Optional[str]:
        """Insert user action with token calculation"""
        try:
            action_id = str(uuid.uuid4())
            query = """
                INSERT INTO actions (
                    action_id, user_id, startup_id, action_type, domain,
                    base_tokens, actual_tokens, metadata, is_synthetic,
                    completed_at, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING action_id
            """
            
            current_time = datetime.now(timezone.utc)
            params = (
                action_id, user_id, startup_id, action_type, domain,
                base_tokens, actual_tokens, Json(metadata or {}), is_synthetic,
                current_time, current_time
            )
            
            result = self.execute_query(query, params, fetch=True)
            if result:
                logger.info(f"Inserted action: {action_type} for user {user_id}")
                return result[0]['action_id']
            return None
            
        except Exception as e:
            logger.error(f"Failed to insert action: {e}")
            return None
    
    def update_gamification_profile(self, user_id: str, token_delta: int, action_count: int = 1) -> bool:
        """Update gamification profile with new tokens and actions"""
        try:
            query = """
                INSERT INTO gamification_profiles (
                    user_id, total_tokens, lifetime_tokens, actions_this_week, 
                    last_active_date, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id) DO UPDATE SET
                    total_tokens = gamification_profiles.total_tokens + EXCLUDED.total_tokens,
                    lifetime_tokens = gamification_profiles.lifetime_tokens + EXCLUDED.lifetime_tokens,
                    actions_this_week = gamification_profiles.actions_this_week + EXCLUDED.actions_this_week,
                    last_active_date = EXCLUDED.last_active_date,
                    updated_at = EXCLUDED.updated_at
            """
            
            current_date = datetime.now(timezone.utc).date()
            current_time = datetime.now(timezone.utc)
            
            params = (user_id, token_delta, token_delta, action_count, current_date, current_time)
            self.execute_query(query, params)
            logger.info(f"Updated gamification profile for user {user_id}: +{token_delta} tokens")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update gamification profile: {e}")
            return False
    
    def cleanup_old_synthetic_data(self, days: int = 90) -> int:
        """Clean up old synthetic data beyond retention period"""
        try:
            query = """
                DELETE FROM dashboard_metrics 
                WHERE is_synthetic = TRUE 
                    AND created_at < NOW() - INTERVAL '%s days'
            """
            
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, (days,))
                    deleted_count = cursor.rowcount
                    conn.commit()
            
            logger.info(f"Cleaned up {deleted_count} old synthetic data records")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Failed to cleanup old synthetic data: {e}")
            return 0
    
    def get_database_stats(self) -> Dict[str, Any]:
        """Get database statistics and health metrics"""
        try:
            stats = {}
            
            # Table row counts
            tables = [
                'users', 'organizations', 'sse_scores', 'dashboard_metrics',
                'actions', 'gamification_profiles', 'integrations'
            ]
            
            for table in tables:
                query = f"SELECT COUNT(*) as count FROM {table}"
                result = self.execute_query(query, fetch=True)
                stats[f"{table}_count"] = result[0]['count'] if result else 0
            
            # Synthetic data percentage
            synthetic_query = """
                SELECT 
                    COUNT(*) FILTER (WHERE is_synthetic = TRUE) as synthetic_count,
                    COUNT(*) as total_count
                FROM dashboard_metrics
            """
            result = self.execute_query(synthetic_query, fetch=True)
            if result and result[0]['total_count'] > 0:
                stats['synthetic_data_percentage'] = (
                    result[0]['synthetic_count'] / result[0]['total_count'] * 100
                )
            else:
                stats['synthetic_data_percentage'] = 0
            
            # Recent activity
            activity_query = """
                SELECT COUNT(*) as recent_actions
                FROM actions 
                WHERE created_at >= NOW() - INTERVAL '24 hours'
            """
            result = self.execute_query(activity_query, fetch=True)
            stats['recent_actions_24h'] = result[0]['recent_actions'] if result else 0
            
            stats['timestamp'] = datetime.now(timezone.utc).isoformat()
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get database stats: {e}")
            return {}
    
    def close(self):
        """Close all database connections"""
        if hasattr(self, 'pool'):
            self.pool.closeall()
            logger.info("Database connection pool closed")

def main():
    """Example usage of the database manager"""
    # Initialize database manager
    db = DatabaseManager()
    
    try:
        # Initialize database schema
        if db.initialize_database():
            print("✓ Database schema initialized")
        
        # Create test user and organization
        user_id = db.create_user(
            email="test@auxeira.com",
            password_hash="hashed_password",
            user_type="startup_founder",
            profile={"firstName": "Test", "lastName": "User"}
        )
        
        if user_id:
            print(f"✓ Created test user: {user_id}")
            
            org_id = db.create_organization(
                name="Test Startup",
                org_type="startup",
                metadata={"industry": "tech", "stage": "seed"}
            )
            
            if org_id:
                print(f"✓ Created test organization: {org_id}")
                
                # Link user to organization
                if db.link_user_organization(user_id, org_id, "founder"):
                    print("✓ Linked user to organization")
                
                # Insert test SSE score
                score_id = db.insert_sse_score(
                    startup_id=org_id,
                    total_score=78,
                    component_scores={"team": 20, "market": 16, "product": 15},
                    responses={"team": {"founder_experience": 2}},
                    created_by=user_id,
                    is_synthetic=True
                )
                
                if score_id:
                    print(f"✓ Inserted test SSE score: {score_id}")
        
        # Get database statistics
        stats = db.get_database_stats()
        print(f"\n📊 Database Statistics:")
        for key, value in stats.items():
            print(f"  {key}: {value}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    finally:
        db.close()

if __name__ == "__main__":
    main()
