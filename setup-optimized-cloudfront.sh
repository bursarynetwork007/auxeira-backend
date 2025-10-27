#!/bin/bash
set -e

echo "=========================================="
echo "Auxeira Optimized CloudFront Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BUCKET_NAME="dashboard.auxeira.com"
DOMAIN_NAME="dashboard.auxeira.com"

echo -e "${BLUE}Step 1: Creating Custom Cache Policies${NC}"
echo "----------------------------------------"

# Create HTML cache policy (short TTL)
echo "Creating HTML cache policy (60s default, 300s max)..."
HTML_POLICY_ID=$(aws cloudfront create-cache-policy \
  --cache-policy-config file://cache-policy-html.json \
  --query 'CachePolicy.Id' \
  --output text 2>/dev/null || echo "")

if [ -z "$HTML_POLICY_ID" ]; then
  echo -e "${YELLOW}HTML cache policy might already exist, checking...${NC}"
  HTML_POLICY_ID=$(aws cloudfront list-cache-policies \
    --query "CachePolicyList.Items[?CachePolicy.CachePolicyConfig.Name=='Auxeira-HTML-ShortCache'].CachePolicy.Id" \
    --output text)
fi

echo -e "${GREEN}✓ HTML Cache Policy ID: $HTML_POLICY_ID${NC}"

# Create Static cache policy (long TTL)
echo "Creating Static cache policy (1 year)..."
STATIC_POLICY_ID=$(aws cloudfront create-cache-policy \
  --cache-policy-config file://cache-policy-static.json \
  --query 'CachePolicy.Id' \
  --output text 2>/dev/null || echo "")

if [ -z "$STATIC_POLICY_ID" ]; then
  echo -e "${YELLOW}Static cache policy might already exist, checking...${NC}"
  STATIC_POLICY_ID=$(aws cloudfront list-cache-policies \
    --query "CachePolicyList.Items[?CachePolicy.CachePolicyConfig.Name=='Auxeira-Static-LongCache'].CachePolicy.Id" \
    --output text)
fi

echo -e "${GREEN}✓ Static Cache Policy ID: $STATIC_POLICY_ID${NC}"
echo ""

echo -e "${BLUE}Step 2: Preparing Distribution Configuration${NC}"
echo "----------------------------------------"

# Update the config file with actual policy IDs
sed -i "s/CUSTOM_HTML_POLICY/$HTML_POLICY_ID/g" cloudfront-optimized-config.json
sed -i "s/CUSTOM_STATIC_POLICY/$STATIC_POLICY_ID/g" cloudfront-optimized-config.json

echo -e "${YELLOW}⚠️  IMPORTANT: You need to update the ACM Certificate ARN${NC}"
echo "Please get your ACM certificate ARN for dashboard.auxeira.com:"
echo ""
echo "  aws acm list-certificates --region us-east-1"
echo ""
read -p "Enter your ACM Certificate ARN (or press Enter to use CloudFront default): " ACM_ARN

if [ -n "$ACM_ARN" ]; then
  sed -i "s|REPLACE_WITH_YOUR_ACM_CERTIFICATE_ARN|$ACM_ARN|g" cloudfront-optimized-config.json
  echo -e "${GREEN}✓ Using custom certificate${NC}"
else
  # Use CloudFront default certificate
  sed -i 's/"CloudFrontDefaultCertificate": false/"CloudFrontDefaultCertificate": true/g' cloudfront-optimized-config.json
  sed -i '/"ACMCertificateArn":/d' cloudfront-optimized-config.json
  sed -i '/"SSLSupportMethod":/d' cloudfront-optimized-config.json
  echo -e "${YELLOW}Using CloudFront default certificate (*.cloudfront.net)${NC}"
fi
echo ""

echo -e "${BLUE}Step 3: Creating New CloudFront Distribution${NC}"
echo "----------------------------------------"
echo "This will take 5-10 minutes to deploy..."

DISTRIBUTION_ID=$(aws cloudfront create-distribution \
  --distribution-config file://cloudfront-optimized-config.json \
  --query 'Distribution.Id' \
  --output text)

echo -e "${GREEN}✓ Distribution Created: $DISTRIBUTION_ID${NC}"
echo ""

echo -e "${BLUE}Step 4: Waiting for Distribution Deployment${NC}"
echo "----------------------------------------"
echo "Status: Deploying..."

aws cloudfront wait distribution-deployed --id $DISTRIBUTION_ID

echo -e "${GREEN}✓ Distribution Deployed!${NC}"
echo ""

# Get distribution domain name
CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
  --id $DISTRIBUTION_ID \
  --query 'Distribution.DomainName' \
  --output text)

echo -e "${BLUE}Step 5: Setting Proper S3 Cache Headers${NC}"
echo "----------------------------------------"

# Upload HTML files with short cache
echo "Uploading HTML files with short cache headers..."
for file in startup_founder.html onboarding-form.html index.html; do
  if [ -f "$file" ]; then
    aws s3 cp "$file" "s3://$BUCKET_NAME/$file" \
      --content-type "text/html" \
      --cache-control "public, max-age=60, must-revalidate" \
      --metadata-directive REPLACE
    echo -e "${GREEN}✓ Uploaded $file${NC}"
  fi
done

echo ""
echo -e "${GREEN}=========================================="
echo "Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "New Distribution Details:"
echo "  Distribution ID: $DISTRIBUTION_ID"
echo "  CloudFront Domain: $CLOUDFRONT_DOMAIN"
echo "  Status: Deployed"
echo ""
echo "Cache Policies:"
echo "  HTML Files: 60s default, 300s max (must-revalidate)"
echo "  Static Assets: 1 year (with versioning)"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test the new distribution:"
echo "   curl -I https://$CLOUDFRONT_DOMAIN/startup_founder.html"
echo ""
echo "2. Update DNS (Route 53 or your DNS provider):"
echo "   dashboard.auxeira.com → CNAME → $CLOUDFRONT_DOMAIN"
echo ""
echo "3. After DNS propagates, test:"
echo "   curl -I https://dashboard.auxeira.com/startup_founder.html"
echo ""
echo "4. Once verified, delete old distribution:"
echo "   aws cloudfront delete-distribution --id E2SK5CDOUJ7KKB --if-match <etag>"
echo ""
echo -e "${GREEN}Distribution is ready for testing!${NC}"
