#!/bin/bash
# Deploy dashboard to dashboard.auxeira.com bucket

echo "📤 Deploying ESG Dashboard to dashboard.auxeira.com..."

# Upload to correct bucket
aws s3 cp dashboard-html/esg_education.html \
    s3://dashboard.auxeira.com/esg_education.html \
    --content-type "text/html" \
    --cache-control "no-cache, no-store, must-revalidate"

# Also upload sim-data.json if it exists
if [ -f "dashboard-html/sim-data.json" ]; then
    aws s3 cp dashboard-html/sim-data.json \
        s3://dashboard.auxeira.com/sim-data.json \
        --content-type "application/json" \
        --cache-control "no-cache"
fi

echo "✅ Uploaded to S3"

# Invalidate CloudFront
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id E2SK5CDOUJ7KKB \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo "✅ CloudFront invalidated: $INVALIDATION_ID"
echo ""
echo "🌐 Live at: https://dashboard.auxeira.com/esg_education.html"
echo "   (May take 1-2 minutes to propagate)"
