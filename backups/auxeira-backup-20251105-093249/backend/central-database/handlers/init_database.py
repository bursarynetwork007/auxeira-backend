#!/usr/bin/env python3
"""
Database Initialization Lambda Handler
Initializes the central database schema and performs maintenance tasks
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
    Lambda handler for database initialization
    """
    try:
        logger.info("Starting database initialization")
        
        # Initialize database manager
        db_manager = DatabaseManager(
            host=os.environ.get('DB_HOST'),
            port=int(os.environ.get('DB_PORT', 5432)),
            database=os.environ.get('DB_NAME'),
            username=os.environ.get('DB_USER'),
            password=os.environ.get('DB_PASSWORD')
        )
        
        # Check if this is a scheduled event or manual trigger
        is_scheduled = 'source' in event and event['source'] == 'aws.events'
        
        if is_scheduled:
            logger.info("Scheduled maintenance run")
            
            # Perform maintenance tasks
            stats = db_manager.get_database_stats()
            logger.info(f"Database stats: {stats}")
            
            # Cleanup old synthetic data (older than 90 days)
            deleted_count = db_manager.cleanup_old_synthetic_data(90)
            logger.info(f"Cleaned up {deleted_count} old synthetic records")
            
            response = {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Database maintenance completed',
                    'stats': stats,
                    'cleanedRecords': deleted_count,
                    'timestamp': datetime.utcnow().isoformat()
                })
            }
            
        else:
            logger.info("Manual database initialization")
            
            # Initialize database schema
            schema_file = os.path.join(os.path.dirname(__file__), '..', 'database', 'init.sql')
            success = db_manager.initialize_database(schema_file)
            
            if success:
                logger.info("Database schema initialized successfully")
                
                # Get initial stats
                stats = db_manager.get_database_stats()
                
                response = {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': 'Database initialized successfully',
                        'stats': stats,
                        'timestamp': datetime.utcnow().isoformat()
                    })
                }
            else:
                logger.error("Database initialization failed")
                response = {
                    'statusCode': 500,
                    'body': json.dumps({
                        'error': 'Database initialization failed',
                        'timestamp': datetime.utcnow().isoformat()
                    })
                }
        
        # Close database connections
        db_manager.close()
        
        return response
        
    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': f'Database initialization failed: {str(e)}',
                'timestamp': datetime.utcnow().isoformat()
            })
        }
