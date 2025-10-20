#!/bin/bash

##############################################################################
# Auxeira Dashboards Deployment Script
# Deploys dashboard-optimized/ to S3 bucket: dashboard.auxeira.com
# Uses existing CloudFront distribution: E2SK5CDOUJ7KKB
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Auxeira Dashboards Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Configuration (from your existing setup)
S3_BUCKET="dashboard.auxeira.com"
CLOUDFRONT_ID="E2SK5CDOUJ7KKB"
AWS_REGION="us-east-1"
SOURCE_DIR="dashboard-optimized"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}Error: Source directory '$SOURCE_DIR' not found${NC}"
    exit 1
fi

echo -e "${BLUE}Configuration:${NC}"
echo -e "  S3 Bucket: ${YELLOW}$S3_BUCKET${NC}"
echo -e "  CloudFront: ${YELLOW}$CLOUDFRONT_ID${NC}"
echo -e "  Source: ${YELLOW}$SOURCE_DIR/${NC}"
echo -e "  Region: ${YELLOW}$AWS_REGION${NC}"
echo ""

# Confirm deployment
read -p "Deploy to production? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Step 1: Syncing dashboard files to S3...${NC}"

# Sync all dashboard files
aws s3 sync $SOURCE_DIR/ s3://$S3_BUCKET/dashboard/ \
  --exclude ".git/*" \
  --exclude "*.backup" \
  --exclude ".DS_Store" \
  --exclude "*.md" \
  --exclude "node_modules/*" \
  --delete \
  --cache-control "public, max-age=3600" \
  --region $AWS_REGION

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dashboard files synced successfully${NC}"
else
    echo -e "${RED}✗ Failed to sync dashboard files${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Setting correct content types for dashboards...${NC}"

# Set HTML files (no cache for dashboards)
aws s3 cp s3://$S3_BUCKET/dashboard/ s3://$S3_BUCKET/dashboard/ \
  --recursive \
  --exclude "*" \
  --include "*.html" \
  --content-type "text/html; charset=utf-8" \
  --metadata-directive REPLACE \
  --cache-control "no-cache, no-store, must-revalidate"

# Set CSS files
aws s3 cp s3://$S3_BUCKET/dashboard/ s3://$S3_BUCKET/dashboard/ \
  --recursive \
  --exclude "*" \
  --include "*.css" \
  --content-type "text/css; charset=utf-8" \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=86400"

# Set JS files
aws s3 cp s3://$S3_BUCKET/dashboard/ s3://$S3_BUCKET/dashboard/ \
  --recursive \
  --exclude "*" \
  --include "*.js" \
  --content-type "application/javascript; charset=utf-8" \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=86400"

# Set JSON files
aws s3 cp s3://$S3_BUCKET/dashboard/ s3://$S3_BUCKET/dashboard/ \
  --recursive \
  --exclude "*" \
  --include "*.json" \
  --content-type "application/json; charset=utf-8" \
  --metadata-directive REPLACE \
  --cache-control "no-cache"

echo -e "${GREEN}✓ Content types set${NC}"

echo ""
echo -e "${YELLOW}Step 3: Uploading legacy dashboard-html files...${NC}"

# Also sync legacy dashboard-html for backward compatibility
if [ -d "dashboard-html" ]; then
    aws s3 sync dashboard-html/ s3://$S3_BUCKET/ \
      --exclude ".git/*" \
      --exclude "*.backup" \
      --exclude ".DS_Store" \
      --exclude "*.md" \
      --exclude "node_modules/*" \
      --cache-control "public, max-age=3600" \
      --region $AWS_REGION
    
    echo -e "${GREEN}✓ Legacy files synced${NC}"
else
    echo -e "${YELLOW}⚠ dashboard-html not found, skipping${NC}"
fi

echo ""
echo -e "${YELLOW}Step 4: Invalidating CloudFront cache...${NC}"

INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_ID \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo -e "${GREEN}✓ CloudFront invalidation created: $INVALIDATION_ID${NC}"
echo -e "${YELLOW}  Waiting for invalidation to complete (this may take 1-2 minutes)...${NC}"

aws cloudfront wait invalidation-completed \
  --distribution-id $CLOUDFRONT_ID \
  --id $INVALIDATION_ID

echo -e "${GREEN}✓ CloudFront cache invalidated${NC}"

echo ""
echo -e "${YELLOW}Step 5: Verifying deployment...${NC}"

# Count deployed files
DASHBOARD_COUNT=$(aws s3 ls s3://$S3_BUCKET/dashboard/ --recursive | grep "index.html" | wc -l)
TOTAL_FILES=$(aws s3 ls s3://$S3_BUCKET/ --recursive | wc -l)

echo -e "${GREEN}✓ Dashboards deployed: $DASHBOARD_COUNT${NC}"
echo -e "${GREEN}✓ Total files: $TOTAL_FILES${NC}"

# Verify key dashboards exist
echo ""
echo -e "${YELLOW}Checking key dashboards...${NC}"

DASHBOARDS=("startup" "vc" "angel" "corporate" "government" "esg-investor")
for dashboard in "${DASHBOARDS[@]}"; do
    if aws s3 ls s3://$S3_BUCKET/dashboard/$dashboard/index.html &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} $dashboard"
    else
        echo -e "  ${RED}✗${NC} $dashboard (missing)"
    fi
done

echo ""
echo -e "${YELLOW}Step 6: Committing to GitHub...${NC}"

git add $SOURCE_DIR/
if [ -d "dashboard-html" ]; then
    git add dashboard-html/
fi

if git diff --staged --quiet; then
    echo -e "${YELLOW}⚠ No changes to commit${NC}"
else
    git commit -m "Deploy dashboards - $(date +%Y-%m-%d\ %H:%M:%S)"
    git push origin main
    echo -e "${GREEN}✓ Changes committed and pushed${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Dashboard URLs:${NC}"
echo -e "  Production: ${BLUE}https://dashboard.auxeira.com/dashboard/startup/${NC}"
echo -e "  CloudFront: ${BLUE}https://d2nwfm8dh1kp59.cloudfront.net/dashboard/startup/${NC}"
echo ""
echo -e "${YELLOW}Test Dashboards:${NC}"
for dashboard in "${DASHBOARDS[@]}"; do
    echo -e "  ${dashboard}: ${BLUE}https://dashboard.auxeira.com/dashboard/$dashboard/${NC}"
done
echo ""
echo -e "${YELLOW}AWS Console Links:${NC}"
echo -e "  S3: ${BLUE}https://s3.console.aws.amazon.com/s3/buckets/$S3_BUCKET${NC}"
echo -e "  CloudFront: ${BLUE}https://console.aws.amazon.com/cloudfront/v3/home#/distributions/$CLOUDFRONT_ID${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo -e "  1. Test dashboards at the URLs above"
echo -e "  2. Verify authentication flow"
echo -e "  3. Check API connectivity"
echo ""

