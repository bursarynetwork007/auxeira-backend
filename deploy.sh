#!/bin/bash
# Auxeira Dashboard Deployment Script
# Deploys to: dashboard.auxeira.com (CloudFront origin)

echo "🚀 Deploying Auxeira ESG Dashboard"
echo ""

# 1. Upload to S3
echo "1️⃣ Uploading to S3: dashboard.auxeira.com"
aws s3 cp dashboard-html/esg_education.html \
    s3://dashboard.auxeira.com/esg_education.html \
    --content-type "text/html" \
    --cache-control "no-cache, no-store, must-revalidate"

if [ -f dashboard-html/sim-data.json ]; then
    aws s3 cp dashboard-html/sim-data.json \
        s3://dashboard.auxeira.com/sim-data.json \
        --content-type "application/json"
fi

echo "✅ Uploaded to S3"
echo ""

# 2. Invalidate CloudFront
echo "2️⃣ Invalidating CloudFront"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id E2SK5CDOUJ7KKB \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo "✅ Invalidation: $INVALIDATION_ID"
echo ""

# 3. Commit to GitHub
echo "3️⃣ Committing to GitHub..."
git add dashboard-html/
git commit -m "Update dashboard $(date +%Y-%m-%d)" || echo "No changes"
git push origin main || echo "Already up to date"
echo ""

echo "✅ DEPLOYMENT COMPLETE!"
echo "🌐 https://dashboard.auxeira.com/esg_education.html"
echo "⏰ Wait 30-60 seconds for propagation"
echo ""

# Check status
sleep 30
LIVE_COUNT=$(curl -s https://dashboard.auxeira.com/esg_education.html | grep -c "report-card" || echo "0")
echo "📊 Reports on live site: $LIVE_COUNT"

if [ "$LIVE_COUNT" -ge 15 ]; then
    echo "🎉 All 15 reports are live!"
else
    echo "⏰ Propagating... ($LIVE_COUNT visible now)"
fi
