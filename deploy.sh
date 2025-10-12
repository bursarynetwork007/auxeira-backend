#!/bin/bash
# Complete deployment script

echo "🚀 Deploying Auxeira ESG Dashboard"
echo ""

# 1. Upload to S3
echo "1️⃣ Uploading to S3..."
aws s3 cp dashboard-html/esg_education.html \
    s3://dashboard.auxeira.com/esg_education.html \
    --content-type "text/html" \
    --cache-control "no-cache"

if [ -f dashboard-html/sim-data.json ]; then
    aws s3 cp dashboard-html/sim-data.json \
        s3://dashboard.auxeira.com/sim-data.json \
        --content-type "application/json"
fi

echo "✅ Uploaded to S3"

# 2. Invalidate CloudFront
echo ""
echo "2️⃣ Invalidating CloudFront..."
INVALIDATION=$(aws cloudfront create-invalidation \
    --distribution-id E2SK5CDOUJ7KKB \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)
echo "✅ Invalidation: $INVALIDATION"

# 3. Commit to GitHub
echo ""
echo "3️⃣ Committing to GitHub..."
git add dashboard-html/
git commit -m "Deploy: Update dashboard $(date +%Y-%m-%d)" || echo "No changes to commit"
git push origin main
echo "✅ Pushed to GitHub"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🌐 Live URL: https://dashboard.auxeira.com/esg_education.html"
echo "⏰ Wait 1-2 minutes for CloudFront propagation"
echo "🔄 Hard refresh: Ctrl+Shift+R"
echo ""
