#!/usr/bin/env python3
"""
Synthetic Data Generation Lambda Handler
Generates synthetic data for all dashboard types on schedule
"""

import json
import logging
import os
from datetime import datetime
import sys
import random

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from utils.database_manager import DatabaseManager
from utils.synthetic_data_generator import SyntheticDataGenerator, SyntheticDataConfig

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Lambda handler for synthetic data generation
    """
    try:
        logger.info("Starting synthetic data generation")
        
        # Initialize managers
        db_manager = DatabaseManager(
            host=os.environ.get('DB_HOST'),
            port=int(os.environ.get('DB_PORT', 5432)),
            database=os.environ.get('DB_NAME'),
            username=os.environ.get('DB_USER'),
            password=os.environ.get('DB_PASSWORD')
        )
        
        synthetic_generator = SyntheticDataGenerator()
        
        # Check if this is a scheduled event or manual trigger
        is_scheduled = 'source' in event and event['source'] == 'aws.events'
        
        if is_scheduled:
            logger.info("Scheduled synthetic data generation")
            
            # Generate data for all active users
            users_query = """
                SELECT u.user_id, u.user_type, uo.org_id
                FROM users u
                JOIN user_organizations uo ON u.user_id = uo.user_id
                WHERE u.is_active = TRUE AND uo.is_primary = TRUE
                LIMIT 100
            """
            
            users = db_manager.execute_query(users_query, fetch=True)
            
            if not users:
                logger.info("No active users found")
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': 'No active users found for data generation',
                        'timestamp': datetime.utcnow().isoformat()
                    })
                }
            
            total_generated = 0
            
            for user in users:
                try:
                    # Generate synthetic data for this user
                    config = SyntheticDataConfig(
                        user_type=user['user_type'],
                        data_type='metrics',
                        count=random.randint(5, 15),  # Random number of data points
                        time_range_days=7,  # Last week's data
                        variance=0.2,
                        trend=random.choice(['stable', 'improving', 'declining']),
                        seed=None
                    )
                    
                    synthetic_data = synthetic_generator.generate_data(config)
                    
                    if synthetic_data:
                        success = db_manager.insert_synthetic_data(
                            data=synthetic_data,
                            user_id=user['user_id'],
                            org_id=user['org_id']
                        )
                        
                        if success:
                            total_generated += len(synthetic_data)
                            logger.info(f"Generated {len(synthetic_data)} records for user {user['user_id']}")
                        
                except Exception as user_error:
                    logger.error(f"Failed to generate data for user {user['user_id']}: {user_error}")
                    continue
            
            response = {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Scheduled synthetic data generation completed',
                    'totalUsers': len(users),
                    'totalRecords': total_generated,
                    'timestamp': datetime.utcnow().isoformat()
                })
            }
            
        else:
            # Manual trigger - generate data based on event parameters
            logger.info("Manual synthetic data generation")
            
            # Parse event parameters
            body = event.get('body', '{}')
            if isinstance(body, str):
                params = json.loads(body)
            else:
                params = body
            
            config = SyntheticDataConfig(
                user_type=params.get('userType', 'startup_founder'),
                data_type=params.get('dataType', 'metrics'),
                count=params.get('count', 30),
                time_range_days=params.get('timeRangeDays', 30),
                variance=params.get('variance', 0.2),
                trend=params.get('trend', 'stable'),
                seed=params.get('seed')
            )
            
            # Generate synthetic data
            synthetic_data = synthetic_generator.generate_data(config)
            
            # For manual generation, we need user_id and org_id
            user_id = params.get('userId')
            org_id = params.get('orgId')
            
            if user_id and org_id and synthetic_data:
                success = db_manager.insert_synthetic_data(
                    data=synthetic_data,
                    user_id=user_id,
                    org_id=org_id
                )
                
                if success:
                    response = {
                        'statusCode': 200,
                        'body': json.dumps({
                            'message': 'Synthetic data generated successfully',
                            'generated': len(synthetic_data),
                            'config': config.__dict__,
                            'timestamp': datetime.utcnow().isoformat()
                        })
                    }
                else:
                    response = {
                        'statusCode': 500,
                        'body': json.dumps({
                            'error': 'Failed to insert synthetic data',
                            'timestamp': datetime.utcnow().isoformat()
                        })
                    }
            else:
                # Return generated data without inserting
                response = {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': 'Synthetic data generated (not inserted)',
                        'data': synthetic_data[:5] if synthetic_data else [],  # Return first 5 records
                        'total': len(synthetic_data) if synthetic_data else 0,
                        'config': config.__dict__,
                        'timestamp': datetime.utcnow().isoformat()
                    })
                }
        
        # Close database connections
        db_manager.close()
        
        return response
        
    except Exception as e:
        logger.error(f"Synthetic data generation error: {str(e)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': f'Synthetic data generation failed: {str(e)}',
                'timestamp': datetime.utcnow().isoformat()
            })
        }
