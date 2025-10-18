#!/bin/bash
# Auxeira Production Deployment Script
# Secure deployment without exposing API keys

set -e

echo "🚀 Auxeira Production Deployment"
echo "================================"

# Check environment variables
if [ -z "$CLAUDE_API_KEY" ] || [ -z "$PAYSTACK_SECRET_KEY" ]; then
    echo "❌ Missing required environment variables"
    echo "Please set: CLAUDE_API_KEY, PAYSTACK_SECRET_KEY, OPENAI_API_KEY, MANUS_API_KEY"
    exit 1
fi

# Deploy frontend to S3
echo "🌐 Deploying frontend to S3..."
aws s3 sync frontend/dashboards/ s3://dashboard.auxeira.com/ \
    --exclude "*.md" \
    --exclude "node_modules/*" \
    --cache-control "max-age=300"

# Update Lambda function
echo "⚡ Updating Lambda function..."
zip -r auxeira-backend.zip backend/ -x "*.md" "node_modules/*"
aws lambda update-function-code \
    --function-name auxeira-backend-prod-api \
    --zip-file fileb://auxeira-backend.zip

# Set environment variables in Lambda
echo "⚙️ Updating Lambda environment variables..."
aws lambda update-function-configuration \
    --function-name auxeira-backend-prod-api \
    --environment Variables="{
        CLAUDE_API_KEY=$CLAUDE_API_KEY,
        OPENAI_API_KEY=$OPENAI_API_KEY,
        MANUS_API_KEY=$MANUS_API_KEY,
        PAYSTACK_SECRET_KEY=$PAYSTACK_SECRET_KEY,
        PAYSTACK_PUBLIC_KEY=$PAYSTACK_PUBLIC_KEY,
        NODE_ENV=production
    }"

# Invalidate CloudFront
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
    --distribution-id E2SK5CDOUJ7KKB \
    --paths "/*"

echo "✅ Deployment complete!"
echo "🌐 Live at: https://dashboard.auxeira.com"
