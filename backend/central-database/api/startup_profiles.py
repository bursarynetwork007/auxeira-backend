#!/usr/bin/env python3
"""
Startup Profiles API - 10,000 Simulated Startups
Provides endpoints for accessing startup profiles with 365-day rolling feed and 5-year toggle
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from flask import Blueprint, request, jsonify, g
from functools import wraps
import psycopg2
from psycopg2.extras import RealDictCursor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
startup_profiles_bp = Blueprint('startup_profiles', __name__, url_prefix='/api/startup-profiles')

# Database connection helper
def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        port=int(os.environ.get('DB_PORT', 5432)),
        database=os.environ.get('DB_NAME', 'auxeira_central'),
        user=os.environ.get('DB_USER', 'postgres'),
        password=os.environ.get('DB_PASSWORD', 'postgres'),
        cursor_factory=RealDictCursor
    )

# =============================================
# STARTUP PROFILES ENDPOINTS
# =============================================

@startup_profiles_bp.route('/', methods=['GET'])
def list_startup_profiles():
    """
    List startup profiles with pagination and filtering
    
    Query Parameters:
    - page: Page number (default: 1)
    - limit: Items per page (default: 50, max: 100)
    - stage: Filter by stage (seed, early, growth, scale)
    - industry: Filter by industry
    - min_sse: Minimum SSE score
    - max_sse: Maximum SSE score
    - sort_by: Sort field (sse_score, company_name, created_at)
    - sort_order: Sort order (asc, desc)
    """
    try:
        # Parse query parameters
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 50))))
        offset = (page - 1) * limit
        
        stage = request.args.get('stage')
        industry = request.args.get('industry')
        min_sse = request.args.get('min_sse', type=int)
        max_sse = request.args.get('max_sse', type=int)
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc').upper()
        
        # Validate sort parameters
        allowed_sort_fields = ['sse_score', 'company_name', 'created_at', 'mrr', 'arr', 'employees']
        if sort_by not in allowed_sort_fields:
            sort_by = 'created_at'
        
        if sort_order not in ['ASC', 'DESC']:
            sort_order = 'DESC'
        
        # Build query
        query = """
            SELECT 
                profile_id, company_name, founder_name, industry, sector, stage,
                sse_score, sse_percentile, mrr, arr, revenue, growth_rate,
                employees, customers, active_users, activities_completed,
                last_activity_date, created_at, updated_at
            FROM startup_profiles
            WHERE 1=1
        """
        params = []
        
        # Add filters
        if stage:
            query += " AND stage = %s"
            params.append(stage)
        
        if industry:
            query += " AND industry = %s"
            params.append(industry)
        
        if min_sse is not None:
            query += " AND sse_score >= %s"
            params.append(min_sse)
        
        if max_sse is not None:
            query += " AND sse_score <= %s"
            params.append(max_sse)
        
        # Add sorting
        query += f" ORDER BY {sort_by} {sort_order}"
        
        # Add pagination
        query += " LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        # Execute query
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, params)
        profiles = cursor.fetchall()
        
        # Get total count
        count_query = "SELECT COUNT(*) as total FROM startup_profiles WHERE 1=1"
        count_params = []
        
        if stage:
            count_query += " AND stage = %s"
            count_params.append(stage)
        
        if industry:
            count_query += " AND industry = %s"
            count_params.append(industry)
        
        if min_sse is not None:
            count_query += " AND sse_score >= %s"
            count_params.append(min_sse)
        
        if max_sse is not None:
            count_query += " AND sse_score <= %s"
            count_params.append(max_sse)
        
        cursor.execute(count_query, count_params)
        total_count = cursor.fetchone()['total']
        
        cursor.close()
        conn.close()
        
        # Calculate pagination metadata
        total_pages = (total_count + limit - 1) // limit
        
        return jsonify({
            'success': True,
            'data': {
                'profiles': [dict(p) for p in profiles],
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total_count,
                    'totalPages': total_pages,
                    'hasNext': page < total_pages,
                    'hasPrev': page > 1
                },
                'filters': {
                    'stage': stage,
                    'industry': industry,
                    'minSse': min_sse,
                    'maxSse': max_sse
                }
            }
        })
        
    except Exception as e:
        logger.error(f"List profiles error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@startup_profiles_bp.route('/<profile_id>', methods=['GET'])
def get_startup_profile(profile_id):
    """
    Get detailed startup profile by ID
    
    Query Parameters:
    - include_history: Include SSE score history (default: false)
    - include_metrics: Include metrics history (default: false)
    """
    try:
        include_history = request.args.get('include_history', 'false').lower() == 'true'
        include_metrics = request.args.get('include_metrics', 'false').lower() == 'true'
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get profile
        query = "SELECT * FROM startup_profiles WHERE profile_id = %s"
        cursor.execute(query, (profile_id,))
        profile = cursor.fetchone()
        
        if not profile:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Profile not found'}), 404
        
        result = dict(profile)
        
        # Include SSE score history if requested
        if include_history:
            result['sse_history'] = profile.get('sse_score_history', [])
        
        # Include metrics history if requested
        if include_metrics:
            metrics_query = """
                SELECT metric_date, metric_name, metric_value, metric_type
                FROM metrics_history
                WHERE profile_id = %s
                ORDER BY metric_date DESC
                LIMIT 100
            """
            cursor.execute(metrics_query, (profile_id,))
            metrics = cursor.fetchall()
            result['metrics_history'] = [dict(m) for m in metrics]
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Get profile error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

# =============================================
# ACTIVITY FEED ENDPOINTS - 365 DAY ROLLING FEED
# =============================================

@startup_profiles_bp.route('/activity-feed', methods=['GET'])
def get_activity_feed():
    """
    Get activity feed with rolling window support
    
    Query Parameters:
    - days: Number of days to look back (default: 365, max: 1825 for 5 years)
    - page: Page number (default: 1)
    - limit: Items per page (default: 50, max: 100)
    - profile_id: Filter by specific profile
    - activity_type: Filter by activity type
    - industry: Filter by industry
    """
    try:
        # Parse query parameters
        days = min(1825, max(1, int(request.args.get('days', 365))))  # Default 365, max 5 years
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 50))))
        offset = (page - 1) * limit
        
        profile_id = request.args.get('profile_id')
        activity_type = request.args.get('activity_type')
        industry = request.args.get('industry')
        
        # Build query using the optimized view or function
        if days <= 365:
            # Use optimized 365-day view
            query = """
                SELECT 
                    af.activity_id, af.profile_id, af.activity_date, af.activity_type,
                    af.activity_title, af.activity_description, af.impact_score,
                    af.metadata, sp.company_name, sp.industry, sp.stage, sp.sse_score
                FROM activity_feed af
                JOIN startup_profiles sp ON af.profile_id = sp.profile_id
                WHERE af.activity_date >= NOW() - INTERVAL '365 days'
            """
        else:
            # Use 5-year data
            query = """
                SELECT 
                    af.activity_id, af.profile_id, af.activity_date, af.activity_type,
                    af.activity_title, af.activity_description, af.impact_score,
                    af.metadata, sp.company_name, sp.industry, sp.stage, sp.sse_score
                FROM activity_feed af
                JOIN startup_profiles sp ON af.profile_id = sp.profile_id
                WHERE af.activity_date >= NOW() - INTERVAL '%s days'
            """
        
        params = []
        
        # Add filters
        if profile_id:
            query += " AND af.profile_id = %s"
            params.append(profile_id)
        
        if activity_type:
            query += " AND af.activity_type = %s"
            params.append(activity_type)
        
        if industry:
            query += " AND sp.industry = %s"
            params.append(industry)
        
        # Add sorting and pagination
        query += " ORDER BY af.activity_date DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        # Execute query
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if days > 365:
            # For 5-year query, inject days parameter
            query = query.replace("INTERVAL '%s days'", f"INTERVAL '{days} days'")
        
        cursor.execute(query, params)
        activities = cursor.fetchall()
        
        # Get total count
        count_query = """
            SELECT COUNT(*) as total
            FROM activity_feed af
            JOIN startup_profiles sp ON af.profile_id = sp.profile_id
            WHERE af.activity_date >= NOW() - INTERVAL '%s days'
        """ % days
        
        count_params = []
        
        if profile_id:
            count_query += " AND af.profile_id = %s"
            count_params.append(profile_id)
        
        if activity_type:
            count_query += " AND af.activity_type = %s"
            count_params.append(activity_type)
        
        if industry:
            count_query += " AND sp.industry = %s"
            count_params.append(industry)
        
        cursor.execute(count_query, count_params)
        total_count = cursor.fetchone()['total']
        
        cursor.close()
        conn.close()
        
        # Calculate pagination metadata
        total_pages = (total_count + limit - 1) // limit
        
        return jsonify({
            'success': True,
            'data': {
                'activities': [dict(a) for a in activities],
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total_count,
                    'totalPages': total_pages,
                    'hasNext': page < total_pages,
                    'hasPrev': page > 1
                },
                'timeRange': {
                    'days': days,
                    'isDefault': days == 365,
                    'isFiveYear': days >= 1825
                },
                'filters': {
                    'profileId': profile_id,
                    'activityType': activity_type,
                    'industry': industry
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Get activity feed error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@startup_profiles_bp.route('/<profile_id>/activities', methods=['GET'])
def get_profile_activities(profile_id):
    """
    Get activities for a specific startup profile
    
    Query Parameters:
    - days: Number of days to look back (default: 365, max: 1825)
    - limit: Number of activities to return (default: 50, max: 100)
    """
    try:
        days = min(1825, max(1, int(request.args.get('days', 365))))
        limit = min(100, max(1, int(request.args.get('limit', 50))))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Use the database function for flexible date range
        query = """
            SELECT * FROM get_activity_feed(
                p_profile_id := %s,
                p_days := %s,
                p_limit := %s
            )
        """
        
        cursor.execute(query, (profile_id, days, limit))
        activities = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'profileId': profile_id,
                'activities': [dict(a) for a in activities],
                'count': len(activities),
                'timeRange': {
                    'days': days,
                    'isDefault': days == 365,
                    'isFiveYear': days >= 1825
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Get profile activities error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

# =============================================
# METRICS HISTORY ENDPOINTS
# =============================================

@startup_profiles_bp.route('/<profile_id>/metrics', methods=['GET'])
def get_profile_metrics(profile_id):
    """
    Get metrics history for a startup profile
    
    Query Parameters:
    - days: Number of days to look back (default: 365, max: 1825)
    - metric_name: Filter by specific metric name
    - metric_type: Filter by metric type (financial, team, market, activity)
    """
    try:
        days = min(1825, max(1, int(request.args.get('days', 365))))
        metric_name = request.args.get('metric_name')
        metric_type = request.args.get('metric_type')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Use the database function
        query = """
            SELECT * FROM get_metrics_history(
                p_profile_id := %s,
                p_days := %s,
                p_metric_name := %s,
                p_metric_type := %s
            )
        """
        
        cursor.execute(query, (profile_id, days, metric_name, metric_type))
        metrics = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Group metrics by name for easier charting
        metrics_by_name = {}
        for metric in metrics:
            name = metric['metric_name']
            if name not in metrics_by_name:
                metrics_by_name[name] = []
            metrics_by_name[name].append({
                'date': metric['metric_date'].isoformat() if metric['metric_date'] else None,
                'value': float(metric['metric_value']) if metric['metric_value'] else 0,
                'type': metric['metric_type']
            })
        
        return jsonify({
            'success': True,
            'data': {
                'profileId': profile_id,
                'metrics': [dict(m) for m in metrics],
                'metricsByName': metrics_by_name,
                'count': len(metrics),
                'timeRange': {
                    'days': days,
                    'isDefault': days == 365,
                    'isFiveYear': days >= 1825
                },
                'filters': {
                    'metricName': metric_name,
                    'metricType': metric_type
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Get profile metrics error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

# =============================================
# STATISTICS AND AGGREGATIONS
# =============================================

@startup_profiles_bp.route('/stats', methods=['GET'])
def get_startup_stats():
    """
    Get aggregate statistics across all startup profiles
    
    Query Parameters:
    - days: Number of days for activity stats (default: 365)
    """
    try:
        days = min(1825, max(1, int(request.args.get('days', 365))))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get profile statistics
        stats_query = """
            SELECT 
                COUNT(*) as total_profiles,
                AVG(sse_score) as avg_sse_score,
                COUNT(CASE WHEN stage = 'seed' THEN 1 END) as seed_count,
                COUNT(CASE WHEN stage = 'early' THEN 1 END) as early_count,
                COUNT(CASE WHEN stage = 'growth' THEN 1 END) as growth_count,
                COUNT(CASE WHEN stage = 'scale' THEN 1 END) as scale_count,
                SUM(mrr) as total_mrr,
                SUM(arr) as total_arr,
                SUM(employees) as total_employees,
                SUM(customers) as total_customers
            FROM startup_profiles
        """
        
        cursor.execute(stats_query)
        stats = cursor.fetchone()
        
        # Get activity statistics
        activity_stats_query = """
            SELECT 
                COUNT(*) as total_activities,
                COUNT(DISTINCT profile_id) as active_profiles,
                COUNT(DISTINCT activity_type) as activity_types
            FROM activity_feed
            WHERE activity_date >= NOW() - INTERVAL '%s days'
        """ % days
        
        cursor.execute(activity_stats_query)
        activity_stats = cursor.fetchone()
        
        # Get industry distribution
        industry_query = """
            SELECT industry, COUNT(*) as count
            FROM startup_profiles
            GROUP BY industry
            ORDER BY count DESC
            LIMIT 10
        """
        
        cursor.execute(industry_query)
        industries = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'profiles': dict(stats),
                'activities': dict(activity_stats),
                'topIndustries': [dict(i) for i in industries],
                'timeRange': {
                    'days': days,
                    'isDefault': days == 365
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Get stats error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

# =============================================
# SEARCH ENDPOINT
# =============================================

@startup_profiles_bp.route('/search', methods=['GET'])
def search_startups():
    """
    Search startup profiles by company name or founder name
    
    Query Parameters:
    - q: Search query
    - limit: Number of results (default: 20, max: 50)
    """
    try:
        query_text = request.args.get('q', '').strip()
        limit = min(50, max(1, int(request.args.get('limit', 20))))
        
        if not query_text:
            return jsonify({'error': 'Search query required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Search query with ILIKE for case-insensitive partial matching
        search_query = """
            SELECT 
                profile_id, company_name, founder_name, industry, stage,
                sse_score, mrr, arr, employees, customers
            FROM startup_profiles
            WHERE 
                company_name ILIKE %s OR
                founder_name ILIKE %s OR
                industry ILIKE %s
            ORDER BY sse_score DESC
            LIMIT %s
        """
        
        search_pattern = f'%{query_text}%'
        cursor.execute(search_query, (search_pattern, search_pattern, search_pattern, limit))
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'query': query_text,
                'results': [dict(r) for r in results],
                'count': len(results)
            }
        })
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
