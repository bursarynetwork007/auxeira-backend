#!/usr/bin/env python3
"""
Health Check Lambda Handler
Provides health status for the central database system
"""

import json
import logging
import os
from datetime import datetime
import sys

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from utils.database_manager import DatabaseManager

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Lambda handler for health checks
    """
    try:
        logger.info("Starting health check")
        
        health_status = {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0',
            'checks': {}
        }
        
        # 1. Database connectivity check
        try:
            db_manager = DatabaseManager(
                host=os.environ.get('DB_HOST'),
                port=int(os.environ.get('DB_PORT', 5432)),
                database=os.environ.get('DB_NAME'),
                username=os.environ.get('DB_USER'),
                password=os.environ.get('DB_PASSWORD')
            )
            
            # Test basic query
            test_query = "SELECT 1 as test"
            result = db_manager.execute_query(test_query, fetch=True)
            
            if result and result[0]['test'] == 1:
                health_status['checks']['database'] = {
                    'status': 'healthy',
                    'message': 'Database connection successful'
                }
            else:
                health_status['checks']['database'] = {
                    'status': 'unhealthy',
                    'message': 'Database query failed'
                }
                health_status['status'] = 'unhealthy'
                
        except Exception as db_error:
            health_status['checks']['database'] = {
                'status': 'unhealthy',
                'message': f'Database connection failed: {str(db_error)}'
            }
            health_status['status'] = 'unhealthy'
        
        # 2. Database statistics check
        try:
            if 'db_manager' in locals():
                stats = db_manager.get_database_stats()
                
                # Check for reasonable data volumes
                total_users = stats.get('users_count', 0)
                total_metrics = stats.get('dashboard_metrics_count', 0)
                
                if total_users > 0 and total_metrics > 0:
                    health_status['checks']['data_volume'] = {
                        'status': 'healthy',
                        'message': f'Users: {total_users}, Metrics: {total_metrics}'
                    }
                else:
                    health_status['checks']['data_volume'] = {
                        'status': 'warning',
                        'message': 'Low data volume detected'
                    }
                
                health_status['database_stats'] = stats
                
        except Exception as stats_error:
            health_status['checks']['data_volume'] = {
                'status': 'unhealthy',
                'message': f'Failed to get database stats: {str(stats_error)}'
            }
            health_status['status'] = 'unhealthy'
        
        # 3. Recent activity check
        try:
            if 'db_manager' in locals():
                activity_query = """
                    SELECT COUNT(*) as recent_count
                    FROM dashboard_metrics 
                    WHERE created_at >= NOW() - INTERVAL '24 hours'
                """
                
                activity_result = db_manager.execute_query(activity_query, fetch=True)
                recent_activity = activity_result[0]['recent_count'] if activity_result else 0
                
                if recent_activity > 0:
                    health_status['checks']['recent_activity'] = {
                        'status': 'healthy',
                        'message': f'{recent_activity} records in last 24 hours'
                    }
                else:
                    health_status['checks']['recent_activity'] = {
                        'status': 'warning',
                        'message': 'No recent activity detected'
                    }
                    
        except Exception as activity_error:
            health_status['checks']['recent_activity'] = {
                'status': 'unhealthy',
                'message': f'Failed to check recent activity: {str(activity_error)}'
            }
            health_status['status'] = 'unhealthy'
        
        # 4. Synthetic data generation check
        try:
            if 'db_manager' in locals():
                synthetic_query = """
                    SELECT 
                        COUNT(*) as total_synthetic,
                        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '6 hours') as recent_synthetic
                    FROM dashboard_metrics 
                    WHERE is_synthetic = TRUE
                """
                
                synthetic_result = db_manager.execute_query(synthetic_query, fetch=True)
                
                if synthetic_result:
                    total_synthetic = synthetic_result[0]['total_synthetic']
                    recent_synthetic = synthetic_result[0]['recent_synthetic']
                    
                    if total_synthetic > 0:
                        health_status['checks']['synthetic_data'] = {
                            'status': 'healthy',
                            'message': f'Total: {total_synthetic}, Recent: {recent_synthetic}'
                        }
                    else:
                        health_status['checks']['synthetic_data'] = {
                            'status': 'warning',
                            'message': 'No synthetic data found'
                        }
                else:
                    health_status['checks']['synthetic_data'] = {
                        'status': 'unhealthy',
                        'message': 'Failed to query synthetic data'
                    }
                    
        except Exception as synthetic_error:
            health_status['checks']['synthetic_data'] = {
                'status': 'unhealthy',
                'message': f'Failed to check synthetic data: {str(synthetic_error)}'
            }
            health_status['status'] = 'unhealthy'
        
        # 5. Environment variables check
        required_env_vars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
        missing_vars = [var for var in required_env_vars if not os.environ.get(var)]
        
        if not missing_vars:
            health_status['checks']['environment'] = {
                'status': 'healthy',
                'message': 'All required environment variables present'
            }
        else:
            health_status['checks']['environment'] = {
                'status': 'unhealthy',
                'message': f'Missing environment variables: {missing_vars}'
            }
            health_status['status'] = 'unhealthy'
        
        # Close database connections
        if 'db_manager' in locals():
            db_manager.close()
        
        # Determine overall status code
        status_code = 200 if health_status['status'] == 'healthy' else 503
        
        return {
            'statusCode': status_code,
            'headers': {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            'body': json.dumps(health_status, indent=2)
        }
        
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        
        return {
            'statusCode': 503,
            'headers': {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            'body': json.dumps({
                'status': 'unhealthy',
                'error': f'Health check failed: {str(e)}',
                'timestamp': datetime.utcnow().isoformat()
            })
        }
