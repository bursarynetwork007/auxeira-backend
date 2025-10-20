#!/bin/bash

##############################################################################
# Auxeira Marketing Site Deployment Script
# Deploys frontend/ to S3 bucket: auxeira.com
# CloudFront distribution for auxeira.com
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Auxeira Marketing Site Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Configuration
S3_BUCKET="auxeira.com"
CLOUDFRONT_ID="YOUR_MARKETING_CLOUDFRONT_ID"  # TODO: Update after creating CloudFront
AWS_REGION="us-east-1"
SOURCE_DIR="frontend"

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

echo -e "${YELLOW}Step 1: Syncing files to S3...${NC}"
aws s3 sync $SOURCE_DIR/ s3://$S3_BUCKET/ \
  --exclude ".git/*" \
  --exclude "*.backup" \
  --exclude ".DS_Store" \
  --exclude "*.md" \
  --delete \
  --cache-control "public, max-age=3600" \
  --region $AWS_REGION

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Files synced successfully${NC}"
else
    echo -e "${RED}✗ Failed to sync files${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Setting correct content types...${NC}"

# Set HTML files
aws s3 cp s3://$S3_BUCKET/ s3://$S3_BUCKET/ \
  --recursive \
  --exclude "*" \
  --include "*.html" \
  --content-type "text/html" \
  --metadata-directive REPLACE \
  --cache-control "no-cache, no-store, must-revalidate"

# Set CSS files
aws s3 cp s3://$S3_BUCKET/ s3://$S3_BUCKET/ \
  --recursive \
  --exclude "*" \
  --include "*.css" \
  --content-type "text/css" \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=86400"

# Set JS files
aws s3 cp s3://$S3_BUCKET/ s3://$S3_BUCKET/ \
  --recursive \
  --exclude "*" \
  --include "*.js" \
  --content-type "application/javascript" \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=86400"

echo -e "${GREEN}✓ Content types set${NC}"

echo ""
echo -e "${YELLOW}Step 3: Invalidating CloudFront cache...${NC}"

if [ "$CLOUDFRONT_ID" != "YOUR_MARKETING_CLOUDFRONT_ID" ]; then
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
      --distribution-id $CLOUDFRONT_ID \
      --paths "/*" \
      --query 'Invalidation.Id' \
      --output text)
    
    echo -e "${GREEN}✓ CloudFront invalidation created: $INVALIDATION_ID${NC}"
    echo -e "${YELLOW}  Waiting for invalidation to complete...${NC}"
    
    aws cloudfront wait invalidation-completed \
      --distribution-id $CLOUDFRONT_ID \
      --id $INVALIDATION_ID
    
    echo -e "${GREEN}✓ CloudFront cache invalidated${NC}"
else
    echo -e "${YELLOW}⚠ CloudFront ID not configured, skipping invalidation${NC}"
fi

echo ""
echo -e "${YELLOW}Step 4: Verifying deployment...${NC}"

# Check if index.html exists
if aws s3 ls s3://$S3_BUCKET/index.html &> /dev/null; then
    echo -e "${GREEN}✓ index.html found${NC}"
else
    echo -e "${RED}✗ index.html not found${NC}"
    exit 1
fi

# List uploaded files
FILE_COUNT=$(aws s3 ls s3://$S3_BUCKET/ --recursive | wc -l)
echo -e "${GREEN}✓ Total files deployed: $FILE_COUNT${NC}"

echo ""
echo -e "${YELLOW}Step 5: Committing to GitHub...${NC}"

git add $SOURCE_DIR/
if git diff --staged --quiet; then
    echo -e "${YELLOW}⚠ No changes to commit${NC}"
else
    git commit -m "Deploy marketing site - $(date +%Y-%m-%d\ %H:%M:%S)"
    git push origin main
    echo -e "${GREEN}✓ Changes committed and pushed${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Marketing Site URLs:${NC}"
echo -e "  S3: http://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com"
echo -e "  Production: https://auxeira.com"
echo ""
echo -e "${YELLOW}AWS Console Links:${NC}"
echo -e "  S3: https://s3.console.aws.amazon.com/s3/buckets/$S3_BUCKET"
if [ "$CLOUDFRONT_ID" != "YOUR_MARKETING_CLOUDFRONT_ID" ]; then
    echo -e "  CloudFront: https://console.aws.amazon.com/cloudfront/v3/home#/distributions/$CLOUDFRONT_ID"
fi
echo ""

