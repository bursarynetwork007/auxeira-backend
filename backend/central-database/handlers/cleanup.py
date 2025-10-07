#!/usr/bin/env python3
"""
Data Cleanup Lambda Handler
Performs cleanup of old synthetic data and maintenance tasks
"""

import json
import logging
import os
from datetime import datetime, timedelta
import sys

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from utils.database_manager import DatabaseManager

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Lambda handler for data cleanup
    """
    try:
        logger.info("Starting data cleanup")
        
        # Initialize database manager
        db_manager = DatabaseManager(
            host=os.environ.get('DB_HOST'),
            port=int(os.environ.get('DB_PORT', 5432)),
            database=os.environ.get('DB_NAME'),
            username=os.environ.get('DB_USER'),
            password=os.environ.get('DB_PASSWORD')
        )
        
        # Parse cleanup parameters
        body = event.get('body', '{}')
        if isinstance(body, str):
            params = json.loads(body) if body != '{}' else {}
        else:
            params = body
        
        # Default cleanup settings
        retention_days = params.get('retentionDays', 90)
        cleanup_synthetic = params.get('cleanupSynthetic', True)
        cleanup_old_sessions = params.get('cleanupOldSessions', True)
        vacuum_database = params.get('vacuumDatabase', False)
        
        cleanup_results = {}
        
        # 1. Cleanup old synthetic data
        if cleanup_synthetic:
            logger.info(f"Cleaning up synthetic data older than {retention_days} days")
            deleted_count = db_manager.cleanup_old_synthetic_data(retention_days)
            cleanup_results['synthetic_data_deleted'] = deleted_count
            logger.info(f"Deleted {deleted_count} old synthetic data records")
        
        # 2. Cleanup old synthetic data sessions
        if cleanup_old_sessions:
            logger.info("Cleaning up expired synthetic data sessions")
            
            cleanup_query = """
                DELETE FROM synthetic_data_sessions 
                WHERE expiry_date < %s OR 
                      (expiry_date IS NULL AND created_at < %s)
            """
            
            cutoff_date = datetime.utcnow() - timedelta(days=30)  # 30 days for sessions
            
            with db_manager.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(cleanup_query, (datetime.utcnow(), cutoff_date))
                    sessions_deleted = cursor.rowcount
                    conn.commit()
            
            cleanup_results['sessions_deleted'] = sessions_deleted
            logger.info(f"Deleted {sessions_deleted} expired synthetic data sessions")
        
        # 3. Cleanup old SSE score history (keep only last 10 versions per startup)
        logger.info("Cleaning up old SSE score history")
        
        history_cleanup_query = """
            DELETE FROM sse_score_history 
            WHERE history_id NOT IN (
                SELECT history_id FROM (
                    SELECT history_id,
                           ROW_NUMBER() OVER (PARTITION BY startup_id ORDER BY created_at DESC) as rn
                    FROM sse_score_history
                ) ranked
                WHERE rn <= 10
            )
        """
        
        with db_manager.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(history_cleanup_query)
                history_deleted = cursor.rowcount
                conn.commit()
        
        cleanup_results['history_deleted'] = history_deleted
        logger.info(f"Deleted {history_deleted} old SSE score history records")
        
        # 4. Cleanup old integration data (keep last 90 days)
        logger.info("Cleaning up old integration data")
        
        integration_cleanup_query = """
            DELETE FROM integration_data 
            WHERE created_at < %s AND is_synthetic = TRUE
        """
        
        integration_cutoff = datetime.utcnow() - timedelta(days=retention_days)
        
        with db_manager.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(integration_cleanup_query, (integration_cutoff,))
                integration_deleted = cursor.rowcount
                conn.commit()
        
        cleanup_results['integration_data_deleted'] = integration_deleted
        logger.info(f"Deleted {integration_deleted} old integration data records")
        
        # 5. Update table statistics (optional vacuum)
        if vacuum_database:
            logger.info("Running database vacuum and analyze")
            
            tables_to_vacuum = [
                'dashboard_metrics',
                'integration_data', 
                'sse_score_history',
                'synthetic_data_sessions'
            ]
            
            with db_manager.get_connection() as conn:
                conn.autocommit = True
                with conn.cursor() as cursor:
                    for table in tables_to_vacuum:
                        try:
                            cursor.execute(f"VACUUM ANALYZE {table}")
                            logger.info(f"Vacuumed table: {table}")
                        except Exception as vacuum_error:
                            logger.warning(f"Failed to vacuum {table}: {vacuum_error}")
                
                conn.autocommit = False
            
            cleanup_results['vacuum_completed'] = True
        
        # 6. Get updated database statistics
        stats = db_manager.get_database_stats()
        
        # 7. Log cleanup summary
        total_deleted = sum([
            cleanup_results.get('synthetic_data_deleted', 0),
            cleanup_results.get('sessions_deleted', 0),
            cleanup_results.get('history_deleted', 0),
            cleanup_results.get('integration_data_deleted', 0)
        ])
        
        logger.info(f"Cleanup completed. Total records deleted: {total_deleted}")
        
        # Close database connections
        db_manager.close()
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data cleanup completed successfully',
                'cleanup_results': cleanup_results,
                'total_deleted': total_deleted,
                'retention_days': retention_days,
                'database_stats': stats,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
        
    except Exception as e:
        logger.error(f"Data cleanup error: {str(e)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': f'Data cleanup failed: {str(e)}',
                'timestamp': datetime.utcnow().isoformat()
            })
        }
