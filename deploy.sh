#!/bin/bash
set -e

echo "=== Auxeira Dashboard Deployment ==="
echo "Date: $(date)"
echo ""

# Deploy Frontend
echo "1. Deploying dashboard to S3..."
aws s3 cp frontend/dashboard/startup_founder_live.html \
  s3://dashboard.auxeira.com/startup_founder.html \
  --region us-east-1 \
  --content-type "text/html" \
  --cache-control "max-age=0, no-cache, no-store, must-revalidate"

aws s3 cp frontend/dashboard/startup_founder_live.html \
  s3://dashboard.auxeira.com/startup/index.html \
  --region us-east-1 \
  --content-type "text/html" \
  --cache-control "max-age=0, no-cache, no-store, must-revalidate"

echo "2. Deploying login page to S3..."
aws s3 cp frontend/index.html \
  s3://auxeira.com/index.html \
  --region us-east-1 \
  --content-type "text/html" \
  --cache-control "max-age=0, no-cache, no-store, must-revalidate"

echo "3. Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id E2SK5CDOUJ7KKB \
  --paths "/startup_founder.html" "/startup/index.html" \
  --region us-east-1 \
  --query 'Invalidation.Id' \
  --output text

aws cloudfront create-invalidation \
  --distribution-id E1O2Q0Z86U0U5T \
  --paths "/index.html" \
  --region us-east-1 \
  --query 'Invalidation.Id' \
  --output text

echo "4. Deploying Lambda functions..."
cd backend

# Package and deploy Auth Lambda
echo "   - Packaging Auth Lambda..."
zip -q -r lambda-enhanced.zip . \
  -x "*.git*" "node_modules/aws-sdk/*" "*.zip"

echo "   - Deploying Auth Lambda..."
aws lambda update-function-code \
  --function-name auxeira-backend-prod-api \
  --zip-file fileb://lambda-enhanced.zip \
  --region us-east-1 \
  --query 'LastModified' \
  --output text

# Package and deploy Dashboard Context Lambda
echo "   - Packaging Dashboard Context Lambda..."
zip -q -j lambda-dashboard-context.zip lambda-dashboard-context.js

echo "   - Deploying Dashboard Context Lambda..."
aws lambda update-function-code \
  --function-name auxeira-dashboard-context-prod \
  --zip-file fileb://lambda-dashboard-context.zip \
  --region us-east-1 \
  --query 'LastModified' \
  --output text

cd ..

echo ""
echo "=== Deployment Complete ==="
echo "Dashboard: https://dashboard.auxeira.com/startup_founder.html"
echo "Login: https://auxeira.com"
echo ""
echo "Test credentials:"
echo "  Email: founder@startup.com"
echo "  Password: Testpass123"
echo ""
