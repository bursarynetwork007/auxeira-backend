#!/bin/bash
# Sync all files to S3 and GitHub

echo "🔄 Syncing All Sources..."
echo ""

# Upload to S3
echo "1️⃣ Uploading to S3..."
aws s3 sync dashboard-html/ s3://dashboard.auxeira.com/ \
    --exclude "*" \
    --include "*.html" \
    --include "*.json" \
    --include "*.js" \
    --include "*.css"

echo "✅ S3 updated"
echo ""

# Invalidate CloudFront
echo "2️⃣ Invalidating CloudFront..."
aws cloudfront create-invalidation \
    --distribution-id E2SK5CDOUJ7KKB \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text

echo "✅ CloudFront invalidated"
echo ""

# Commit to GitHub
echo "3️⃣ Committing to GitHub..."
git add dashboard-html/
git commit -m "Sync: Dashboard files $(date +%Y-%m-%d)" || echo "No changes"
git push origin main

echo ""
echo "✅ All sources synced!"
