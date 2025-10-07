#!/usr/bin/env python3
"""
Auxeira Central Database API
REST API endpoints for managing timestamped synthetic data across all dashboards
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from functools import wraps
import jwt
from werkzeug.security import check_password_hash, generate_password_hash

# Import our custom modules
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from utils.database_manager import DatabaseManager
from utils.synthetic_data_generator import SyntheticDataGenerator, SyntheticDataConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'auxeira-dev-secret-key-2025')
CORS(app)

# Initialize database manager
db_manager = DatabaseManager(
    host=os.environ.get('DB_HOST', 'localhost'),
    port=int(os.environ.get('DB_PORT', 5432)),
    database=os.environ.get('DB_NAME', 'auxeira_central'),
    username=os.environ.get('DB_USER', 'postgres'),
    password=os.environ.get('DB_PASSWORD', 'postgres')
)

# Initialize synthetic data generator
synthetic_generator = SyntheticDataGenerator()

# JWT Configuration
JWT_EXPIRATION_HOURS = 24
JWT_ALGORITHM = 'HS256'

def generate_jwt_token(user_id: str, user_type: str) -> str:
    """Generate JWT token for user authentication"""
    payload = {
        'user_id': user_id,
        'user_type': user_type,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(f):
    """Decorator to require authentication for API endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        g.current_user_id = payload['user_id']
        g.current_user_type = payload['user_type']
        return f(*args, **kwargs)
    
    return decorated_function

# =============================================
# AUTHENTICATION ENDPOINTS
# =============================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'userType']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Hash password
        password_hash = generate_password_hash(data['password'])
        
        # Create user
        user_id = db_manager.create_user(
            email=data['email'],
            password_hash=password_hash,
            user_type=data['userType'],
            profile=data.get('profile', {})
        )
        
        if not user_id:
            return jsonify({'error': 'Failed to create user'}), 500
        
        # Generate JWT token
        token = generate_jwt_token(user_id, data['userType'])
        
        return jsonify({
            'success': True,
            'data': {
                'userId': user_id,
                'token': token,
                'expiresIn': JWT_EXPIRATION_HOURS * 3600
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        # Get user from database
        query = "SELECT user_id, password_hash, user_type FROM users WHERE email = %s AND is_active = TRUE"
        result = db_manager.execute_query(query, (data['email'],), fetch=True)
        
        if not result:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        user = result[0]
        
        # Verify password
        if not check_password_hash(user['password_hash'], data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Update last login
        update_query = "UPDATE users SET last_login = %s, login_count = login_count + 1 WHERE user_id = %s"
        db_manager.execute_query(update_query, (datetime.utcnow(), user['user_id']))
        
        # Generate JWT token
        token = generate_jwt_token(user['user_id'], user['user_type'])
        
        return jsonify({
            'success': True,
            'data': {
                'userId': user['user_id'],
                'userType': user['user_type'],
                'token': token,
                'expiresIn': JWT_EXPIRATION_HOURS * 3600
            }
        })
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# =============================================
# DASHBOARD DATA ENDPOINTS
# =============================================

@app.route('/api/dashboard/metrics', methods=['GET'])
@require_auth
def get_dashboard_metrics():
    """Get dashboard metrics for the authenticated user"""
    try:
        dashboard_type = request.args.get('type', g.current_user_type)
        days = int(request.args.get('days', 30))
        include_synthetic = request.args.get('includeSynthetic', 'true').lower() == 'true'
        
        metrics = db_manager.get_dashboard_metrics(
            user_id=g.current_user_id,
            dashboard_type=dashboard_type,
            days=days,
            include_synthetic=include_synthetic
        )
        
        return jsonify({
            'success': True,
            'data': {
                'metrics': metrics,
                'count': len(metrics),
                'dashboardType': dashboard_type,
                'timeRange': f'{days} days',
                'includeSynthetic': include_synthetic
            }
        })
        
    except Exception as e:
        logger.error(f"Get metrics error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/dashboard/metrics', methods=['POST'])
@require_auth
def create_dashboard_metrics():
    """Create new dashboard metrics"""
    try:
        data = request.get_json()
        
        # Get user's organization
        org_query = """
            SELECT org_id FROM user_organizations 
            WHERE user_id = %s AND is_primary = TRUE
            LIMIT 1
        """
        org_result = db_manager.execute_query(org_query, (g.current_user_id,), fetch=True)
        
        if not org_result:
            return jsonify({'error': 'User organization not found'}), 400
        
        org_id = org_result[0]['org_id']
        
        # Insert metrics
        success = db_manager.insert_synthetic_data(
            data=data.get('metrics', []),
            user_id=g.current_user_id,
            org_id=org_id
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Inserted {len(data.get("metrics", []))} metrics'
            }), 201
        else:
            return jsonify({'error': 'Failed to insert metrics'}), 500
            
    except Exception as e:
        logger.error(f"Create metrics error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# =============================================
# SYNTHETIC DATA ENDPOINTS
# =============================================

@app.route('/api/synthetic/generate', methods=['POST'])
@require_auth
def generate_synthetic_data():
    """Generate synthetic data for dashboards"""
    try:
        data = request.get_json()
        
        # Create configuration
        config = SyntheticDataConfig(
            user_type=data.get('userType', g.current_user_type),
            data_type=data.get('dataType', 'metrics'),
            count=data.get('count', 30),
            time_range_days=data.get('timeRangeDays', 30),
            variance=data.get('variance', 0.2),
            trend=data.get('trend', 'stable'),
            seed=data.get('seed')
        )
        
        # Generate synthetic data
        synthetic_data = synthetic_generator.generate_data(config)
        
        # Get user's organization
        org_query = """
            SELECT org_id FROM user_organizations 
            WHERE user_id = %s AND is_primary = TRUE
            LIMIT 1
        """
        org_result = db_manager.execute_query(org_query, (g.current_user_id,), fetch=True)
        
        if org_result:
            org_id = org_result[0]['org_id']
            
            # Insert generated data
            success = db_manager.insert_synthetic_data(
                data=synthetic_data,
                user_id=g.current_user_id,
                org_id=org_id
            )
            
            if success:
                return jsonify({
                    'success': True,
                    'data': {
                        'generated': len(synthetic_data),
                        'config': config.__dict__,
                        'preview': synthetic_data[:3] if synthetic_data else []
                    }
                }), 201
        
        return jsonify({'error': 'Failed to generate synthetic data'}), 500
        
    except Exception as e:
        logger.error(f"Generate synthetic data error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/synthetic/templates', methods=['GET'])
@require_auth
def get_synthetic_templates():
    """Get available synthetic data templates"""
    try:
        query = """
            SELECT template_id, template_name, template_type, user_type, 
                   description, sample_data, usage_count
            FROM synthetic_data_templates 
            WHERE is_active = TRUE AND (user_type = %s OR user_type = 'all')
            ORDER BY usage_count DESC, template_name
        """
        
        templates = db_manager.execute_query(query, (g.current_user_type,), fetch=True)
        
        return jsonify({
            'success': True,
            'data': {
                'templates': templates or [],
                'count': len(templates) if templates else 0
            }
        })
        
    except Exception as e:
        logger.error(f"Get templates error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# =============================================
# SSE SCORING ENDPOINTS
# =============================================

@app.route('/api/sse/calculate', methods=['POST'])
@require_auth
def calculate_sse_score():
    """Calculate SSE score for a startup"""
    try:
        data = request.get_json()
        
        if not data.get('startupId') or not data.get('responses'):
            return jsonify({'error': 'Missing startupId or responses'}), 400
        
        # Calculate score (simplified version)
        total_score = 0
        component_scores = {}
        
        # SSE component weights
        weights = {
            'team': 0.25,
            'market': 0.20,
            'product': 0.20,
            'business': 0.15,
            'financial': 0.10,
            'traction': 0.10
        }
        
        for component, weight in weights.items():
            if component in data['responses']:
                component_responses = data['responses'][component]
                component_score = sum(component_responses.values()) / len(component_responses) * 100 * weight
                component_scores[component] = round(component_score, 1)
                total_score += component_score
        
        total_score = round(total_score, 0)
        
        # Insert SSE score
        score_id = db_manager.insert_sse_score(
            startup_id=data['startupId'],
            total_score=int(total_score),
            component_scores=component_scores,
            responses=data['responses'],
            created_by=g.current_user_id,
            is_synthetic=data.get('isSynthetic', False)
        )
        
        if score_id:
            return jsonify({
                'success': True,
                'data': {
                    'scoreId': score_id,
                    'totalScore': int(total_score),
                    'breakdown': component_scores,
                    'percentile': min(95, max(5, int(total_score * 1.2))),  # Simplified percentile
                    'successProbability': round(total_score / 100 * 0.8, 3),
                    'timestamp': datetime.utcnow().isoformat()
                }
            }), 201
        else:
            return jsonify({'error': 'Failed to save SSE score'}), 500
            
    except Exception as e:
        logger.error(f"Calculate SSE error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/sse/score/<startup_id>', methods=['GET'])
@require_auth
def get_sse_score(startup_id):
    """Get latest SSE score for a startup"""
    try:
        score = db_manager.get_latest_sse_score(startup_id)
        
        if score:
            return jsonify({
                'success': True,
                'data': {
                    'currentScore': score['total_score'],
                    'breakdown': score['component_scores'],
                    'version': score['version'],
                    'createdAt': score['created_at'].isoformat() if score['created_at'] else None,
                    'isSynthetic': score['is_synthetic']
                }
            })
        else:
            return jsonify({'error': 'SSE score not found'}), 404
            
    except Exception as e:
        logger.error(f"Get SSE score error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# =============================================
# GAMIFICATION ENDPOINTS
# =============================================

@app.route('/api/gamification/action', methods=['POST'])
@require_auth
def complete_action():
    """Record a completed action and award tokens"""
    try:
        data = request.get_json()
        
        required_fields = ['actionType', 'domain', 'baseTokens']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Calculate actual tokens (simplified multiplier logic)
        base_tokens = data['baseTokens']
        multipliers = data.get('multipliers', {})
        actual_tokens = base_tokens
        
        for multiplier_type, value in multipliers.items():
            actual_tokens = int(actual_tokens * value)
        
        # Get user's organization
        org_query = """
            SELECT org_id FROM user_organizations 
            WHERE user_id = %s AND is_primary = TRUE
            LIMIT 1
        """
        org_result = db_manager.execute_query(org_query, (g.current_user_id,), fetch=True)
        
        if not org_result:
            return jsonify({'error': 'User organization not found'}), 400
        
        startup_id = org_result[0]['org_id']
        
        # Insert action
        action_id = db_manager.insert_action(
            user_id=g.current_user_id,
            startup_id=startup_id,
            action_type=data['actionType'],
            domain=data['domain'],
            base_tokens=base_tokens,
            actual_tokens=actual_tokens,
            metadata=data.get('metadata', {}),
            is_synthetic=data.get('isSynthetic', False)
        )
        
        if action_id:
            # Update gamification profile
            db_manager.update_gamification_profile(g.current_user_id, actual_tokens)
            
            return jsonify({
                'success': True,
                'data': {
                    'actionId': action_id,
                    'tokensAwarded': actual_tokens,
                    'multipliers': multipliers,
                    'baseTokens': base_tokens
                }
            }), 201
        else:
            return jsonify({'error': 'Failed to record action'}), 500
            
    except Exception as e:
        logger.error(f"Complete action error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/gamification/profile', methods=['GET'])
@require_auth
def get_gamification_profile():
    """Get user's gamification profile"""
    try:
        query = """
            SELECT * FROM gamification_profiles 
            WHERE user_id = %s
        """
        
        result = db_manager.execute_query(query, (g.current_user_id,), fetch=True)
        
        if result:
            profile = result[0]
            return jsonify({
                'success': True,
                'data': profile
            })
        else:
            # Create default profile
            default_profile = {
                'user_id': g.current_user_id,
                'total_tokens': 0,
                'lifetime_tokens': 0,
                'current_streak': 0,
                'longest_streak': 0,
                'week_number': 1,
                'actions_this_week': 0
            }
            
            return jsonify({
                'success': True,
                'data': default_profile
            })
            
    except Exception as e:
        logger.error(f"Get gamification profile error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# =============================================
# ADMIN AND UTILITY ENDPOINTS
# =============================================

@app.route('/api/admin/stats', methods=['GET'])
@require_auth
def get_database_stats():
    """Get database statistics (admin only)"""
    try:
        stats = db_manager.get_database_stats()
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        logger.error(f"Get stats error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/admin/cleanup', methods=['POST'])
@require_auth
def cleanup_old_data():
    """Clean up old synthetic data"""
    try:
        days = int(request.args.get('days', 90))
        deleted_count = db_manager.cleanup_old_synthetic_data(days)
        
        return jsonify({
            'success': True,
            'data': {
                'deletedRecords': deleted_count,
                'retentionDays': days
            }
        })
        
    except Exception as e:
        logger.error(f"Cleanup error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        stats = db_manager.get_database_stats()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected',
            'version': '1.0.0'
        })
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

# =============================================
# ERROR HANDLERS
# =============================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Method not allowed'}), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# =============================================
# APPLICATION STARTUP
# =============================================

@app.before_first_request
def initialize_app():
    """Initialize application on first request"""
    logger.info("Initializing Auxeira Central Database API")
    
    # Test database connection
    try:
        stats = db_manager.get_database_stats()
        logger.info(f"Database connected successfully. Stats: {stats}")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting Auxeira Central Database API on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
