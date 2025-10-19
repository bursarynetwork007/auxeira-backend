#!/bin/bash

echo "🚀 Deploying ESG Education Dashboard..."

# Navigate to directory
cd /workspaces/auxeira-backend

# Git commit and push
git add dashboard-html/esg_education.html
git commit -m "Update ESG education dashboard - $(date '+%Y-%m-%d %H:%M')"
git push origin main

# Deploy to AWS
aws s3 cp dashboard-html/esg_education.html s3://dashboard.auxeira.com/esg_education.html

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id E2SK5CDOUJ7KKB \
  --paths "/esg_education.html"

echo "✅ COMPLETE: Dashboard deployed to GitHub and AWS!"
echo "🌐 View at: https://dashboard.auxeira.com/esg_education.html"
