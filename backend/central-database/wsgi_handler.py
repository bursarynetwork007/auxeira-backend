#!/usr/bin/env python3
"""
WSGI Handler for AWS Lambda
Handles HTTP requests to the Flask API
"""

try:
    import unzip_requirements
except ImportError:
    pass

from api.main import app

def handler(event, context):
    """
    AWS Lambda handler for WSGI application
    """
    try:
        from serverless_wsgi import handle_request
        return handle_request(app, event, context)
    except Exception as e:
        return {
            'statusCode': 500,
            'body': f'WSGI Handler Error: {str(e)}'
        }
