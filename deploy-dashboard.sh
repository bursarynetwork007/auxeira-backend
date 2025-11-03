#!/bin/bash
# Auxeira Dashboard Deployment Script
# This script deploys the integrated startup_founder_live.html to S3

set -e

echo "========================================="
echo "Auxeira Dashboard Deployment"
echo "========================================="
echo ""

# Configuration
S3_BUCKET="dashboard.auxeira.com"
CLOUDFRONT_DIST_ID="E2SK5CDOUJ7KKB"
SOURCE_FILE="frontend/dashboard/startup_founder_live.html"
REGION="us-east-1"

# Check if source file exists
if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ Error: Source file not found: $SOURCE_FILE"
    exit 1
fi

echo "📦 Source file: $SOURCE_FILE"
echo "🪣 S3 Bucket: s3://$S3_BUCKET"
echo "🌐 CloudFront Distribution: $CLOUDFRONT_DIST_ID"
echo ""

# Deploy to primary path
echo "1️⃣ Deploying to /startup_founder.html..."
aws s3 cp "$SOURCE_FILE" \
  "s3://$S3_BUCKET/startup_founder.html" \
  --region "$REGION" \
  --content-type "text/html" \
  --cache-control "max-age=0, no-cache, no-store, must-revalidate"

if [ $? -eq 0 ]; then
    echo "✅ Deployed to /startup_founder.html"
else
    echo "❌ Failed to deploy to /startup_founder.html"
    exit 1
fi

echo ""

# Deploy to alternate path
echo "2️⃣ Deploying to /startup/index.html..."
aws s3 cp "$SOURCE_FILE" \
  "s3://$S3_BUCKET/startup/index.html" \
  --region "$REGION" \
  --content-type "text/html" \
  --cache-control "max-age=0, no-cache, no-store, must-revalidate"

if [ $? -eq 0 ]; then
    echo "✅ Deployed to /startup/index.html"
else
    echo "❌ Failed to deploy to /startup/index.html"
    exit 1
fi

echo ""

# Invalidate CloudFront cache
echo "3️⃣ Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DIST_ID" \
  --paths "/startup_founder.html" "/startup/index.html" \
  --region "$REGION" \
  --query 'Invalidation.Id' \
  --output text)

if [ $? -eq 0 ]; then
    echo "✅ CloudFront invalidation created: $INVALIDATION_ID"
else
    echo "❌ Failed to create CloudFront invalidation"
    exit 1
fi

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
echo "🔗 Dashboard URLs:"
echo "   - https://dashboard.auxeira.com/startup_founder.html"
echo "   - https://dashboard.auxeira.com/startup/index.html"
echo ""
echo "⏳ Note: CloudFront cache invalidation may take 5-10 minutes to propagate"
echo ""
echo "🧪 Test with:"
echo "   Email: founder@startup.com"
echo "   Password: Testpass123"
echo ""
