# Auxeira AWS Deployment Guide

## 🎯 Overview

This guide shows you how to deploy the complete Auxeira platform to AWS using your existing infrastructure.

---

## 📋 Prerequisites

### AWS Resources (Already Configured)
- ✅ S3 Bucket: `dashboard.auxeira.com`
- ✅ CloudFront Distribution: `E2SK5CDOUJ7KKB`
- ✅ SSL Certificate: `arn:aws:acm:us-east-1:615608124862:certificate/79af196b-2665-413b-8402-dbc649920d75`
- ✅ AWS Account: `615608124862`
- ✅ Region: `us-east-1`

### Required Tools
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install Serverless Framework
npm install -g serverless

# Configure AWS credentials
aws configure
```

---

## 🚀 Deployment Options

### Option 1: Quick Deploy (Recommended)

Deploy everything at once:

```bash
cd /path/to/auxeira-backend

# Deploy all components
./deploy-all.sh

# Or deploy individually:
./deploy-marketing.sh      # Marketing site (auxeira.com)
./deploy-dashboards.sh     # Dashboards (dashboard.auxeira.com)
cd backend-optimized && serverless deploy --stage prod
```

### Option 2: Manual Step-by-Step

Follow the detailed steps below for more control.

---

## 📦 Component 1: Marketing Site (auxeira.com)

### Setup S3 Bucket

```bash
# Create bucket for marketing site
aws s3 mb s3://auxeira.com --region us-east-1

# Enable website hosting
aws s3 website s3://auxeira.com \
  --index-document index.html \
  --error-document index.html

# Set bucket policy for public access
cat > /tmp/marketing-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::auxeira.com/*"
  }]
}
EOF

aws s3api put-bucket-policy \
  --bucket auxeira.com \
  --policy file:///tmp/marketing-policy.json
```

### Deploy Marketing Files

```bash
# Sync frontend files to S3
aws s3 sync frontend/ s3://auxeira.com/ \
  --exclude ".git/*" \
  --exclude "*.backup" \
  --exclude ".DS_Store" \
  --delete \
  --cache-control "public, max-age=3600"

# Set HTML files to no-cache
aws s3 cp s3://auxeira.com/ s3://auxeira.com/ \
  --recursive \
  --exclude "*" \
  --include "*.html" \
  --content-type "text/html" \
  --metadata-directive REPLACE \
  --cache-control "no-cache, no-store, must-revalidate"
```

### Create CloudFront Distribution

```bash
# Create distribution for auxeira.com
aws cloudfront create-distribution \
  --origin-domain-name auxeira.com.s3-website-us-east-1.amazonaws.com \
  --default-root-object index.html
```

---

## 📊 Component 2: Dashboards (dashboard.auxeira.com)

### Deploy to Existing S3 Bucket

```bash
# Sync optimized dashboards
aws s3 sync dashboard-optimized/ s3://dashboard.auxeira.com/dashboard/ \
  --exclude ".git/*" \
  --exclude "*.backup" \
  --exclude ".DS_Store" \
  --exclude "node_modules/*" \
  --delete \
  --cache-control "public, max-age=3600"

# Also sync legacy dashboards for backward compatibility
aws s3 sync dashboard-html/ s3://dashboard.auxeira.com/ \
  --exclude ".git/*" \
  --exclude "*.backup" \
  --exclude ".DS_Store" \
  --cache-control "public, max-age=3600"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E2SK5CDOUJ7KKB \
  --paths "/*"
```

### Test Dashboards

```bash
# Test via S3
curl -I http://dashboard.auxeira.com.s3-website-us-east-1.amazonaws.com/dashboard/startup/

# Test via CloudFront
curl -I https://dashboard.auxeira.com/dashboard/startup/
```

---

## 🔌 Component 3: Backend API (api.auxeira.com)

### Prepare Backend

```bash
cd backend-optimized

# Create .env file
cat > .env << 'EOF'
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PAYSTACK_SECRET_KEY=sk_live_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_live_your_public_key
EOF

# Install dependencies
npm install

# Install serverless plugins
npm install --save-dev serverless-offline serverless-dotenv-plugin
```

### Deploy to Lambda

```bash
# Deploy to production
serverless deploy --stage prod --region us-east-1 --verbose

# Output will show:
# - API Gateway endpoint URL
# - Lambda function name
# - DynamoDB table name
```

### Configure Custom Domain (api.auxeira.com)

```bash
# Create API Gateway custom domain
aws apigateway create-domain-name \
  --domain-name api.auxeira.com \
  --certificate-arn arn:aws:acm:us-east-1:615608124862:certificate/79af196b-2665-413b-8402-dbc649920d75 \
  --endpoint-configuration types=EDGE

# Get the distribution domain name from output
# Add CNAME record in your DNS:
# api.auxeira.com → [distribution-domain-name]

# Map domain to API
aws apigateway create-base-path-mapping \
  --domain-name api.auxeira.com \
  --rest-api-id [YOUR_API_ID] \
  --stage prod
```

### Test API

```bash
# Get API endpoint
API_URL=$(serverless info --stage prod | grep "endpoint:" | awk '{print $2}')

# Test health endpoint
curl $API_URL/health

# Test startups endpoint
curl $API_URL/api/startups?limit=5

# Test dashboard endpoint
curl $API_URL/api/dashboard/startup
```

---

## 🔐 Environment Variables

### Backend Lambda Environment

Set these in AWS Lambda console or serverless.yml:

```yaml
environment:
  NODE_ENV: production
  JWT_SECRET: ${env:JWT_SECRET}
  PAYSTACK_SECRET_KEY: ${env:PAYSTACK_SECRET_KEY}
  PAYSTACK_PUBLIC_KEY: ${env:PAYSTACK_PUBLIC_KEY}
  DATABASE_TABLE: auxeira-prod-startups
```

### Frontend Configuration

Update API URLs in dashboards:

```javascript
// dashboard-optimized/utils/api-client.js
const API_BASE_URL = 
  window.location.hostname === 'localhost' 
  ? 'http://localhost:3000'
  : 'https://api.auxeira.com';  // Update this after deployment
```

---

## 🌐 DNS Configuration

### Route 53 (or your DNS provider)

```
# A Records (or CNAME)
auxeira.com              → CloudFront distribution for marketing
dashboard.auxeira.com    → d2nwfm8dh1kp59.cloudfront.net (existing)
api.auxeira.com          → API Gateway custom domain

# Example Route 53 commands
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch file://dns-changes.json
```

---

## 📊 Database Migration

### Option 1: Keep JSON File (Simple)

The database.json file (71MB) is included in the Lambda deployment package.

**Pros:**
- No additional setup
- Works immediately
- No extra costs

**Cons:**
- Limited to 250MB Lambda package size
- No concurrent writes
- Slower queries on large datasets

### Option 2: Migrate to DynamoDB (Recommended)

```bash
# Create DynamoDB table (already in serverless.yml)
serverless deploy --stage prod

# Seed database
curl -X POST https://api.auxeira.com/admin/seed

# Or manually import
aws dynamodb batch-write-item --request-items file://dynamodb-import.json
```

### Option 3: Use RDS PostgreSQL (Scalable)

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier auxeira-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username auxeira \
  --master-user-password [SECURE_PASSWORD] \
  --allocated-storage 20

# Update backend to use PostgreSQL
npm install pg
# Update server.js to use PostgreSQL instead of JSON
```

---

## 🔄 Deployment Workflow

### Development → Production

```bash
# 1. Test locally
cd backend-optimized
npm start  # Test at localhost:3000

# 2. Deploy to staging
serverless deploy --stage staging

# 3. Test staging
curl https://staging-api.auxeira.com/health

# 4. Deploy to production
serverless deploy --stage prod

# 5. Deploy frontend
./deploy-dashboards.sh
```

### Continuous Deployment (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy Backend
        run: |
          cd backend-optimized
          npm install
          serverless deploy --stage prod
      
      - name: Deploy Dashboards
        run: ./deploy-dashboards.sh
```

---

## 📈 Monitoring & Logs

### View Lambda Logs

```bash
# Tail live logs
cd backend-optimized
serverless logs -f api --stage prod --tail

# View recent logs
serverless logs -f api --stage prod --startTime 5m

# CloudWatch Logs
aws logs tail /aws/lambda/auxeira-backend-prod-api --follow
```

### CloudWatch Metrics

```bash
# View API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=auxeira-backend-prod \
  --start-time 2025-10-19T00:00:00Z \
  --end-time 2025-10-20T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

### Set Up Alarms

```bash
# Create alarm for API errors
aws cloudwatch put-metric-alarm \
  --alarm-name auxeira-api-errors \
  --alarm-description "Alert on API errors" \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

---

## 💰 Cost Estimation

### Monthly AWS Costs

| Service | Usage | Cost |
|---------|-------|------|
| S3 (Marketing) | 100MB, 10K requests | $0.50 |
| S3 (Dashboards) | 500MB, 50K requests | $2.00 |
| CloudFront | 10GB transfer | $1.00 |
| Lambda | 1M requests, 512MB | $2.50 |
| API Gateway | 1M requests | $3.50 |
| DynamoDB (optional) | On-demand | $2.00 |
| **Total** | | **~$11.50/month** |

### Cost Optimization

- Use CloudFront caching to reduce S3 requests
- Set Lambda memory to optimal size (test 256MB vs 512MB)
- Use DynamoDB on-demand pricing for variable traffic
- Enable S3 lifecycle policies to delete old files

---

## 🔧 Troubleshooting

### Issue: CORS Errors

```javascript
// Update backend-optimized/lambda.js
const corsOptions = {
    origin: [
        'https://dashboard.auxeira.com',
        'https://auxeira.com'
    ],
    credentials: true
};
```

### Issue: Lambda Timeout

```yaml
# Increase timeout in serverless.yml
provider:
  timeout: 30  # seconds
```

### Issue: Package Too Large

```bash
# Exclude unnecessary files
package:
  exclude:
    - node_modules/**
    - .git/**
    - database.json  # Move to S3 or DynamoDB
```

### Issue: CloudFront Not Updating

```bash
# Force invalidation
aws cloudfront create-invalidation \
  --distribution-id E2SK5CDOUJ7KKB \
  --paths "/*"

# Wait for completion
aws cloudfront wait invalidation-completed \
  --distribution-id E2SK5CDOUJ7KKB \
  --id [INVALIDATION_ID]
```

---

## ✅ Post-Deployment Checklist

### Verify All Components

- [ ] Marketing site loads: https://auxeira.com
- [ ] Dashboards load: https://dashboard.auxeira.com/dashboard/startup/
- [ ] API responds: https://api.auxeira.com/health
- [ ] Authentication flow works
- [ ] Dashboards fetch real data from API
- [ ] Payment integration works (Paystack)
- [ ] All 25 dashboards accessible
- [ ] SSL certificates valid
- [ ] DNS records correct
- [ ] CloudWatch logs working
- [ ] Monitoring alerts configured

### Security Checks

- [ ] No API keys in frontend code
- [ ] Environment variables set correctly
- [ ] CORS configured properly
- [ ] S3 buckets not publicly writable
- [ ] Lambda has minimum required permissions
- [ ] Database access restricted
- [ ] SSL/TLS enabled everywhere

### Performance Checks

- [ ] CloudFront caching working
- [ ] Lambda cold start < 3s
- [ ] API response time < 500ms
- [ ] Dashboard load time < 2s
- [ ] Images optimized
- [ ] Gzip compression enabled

---

## 📞 Support

### Useful Commands

```bash
# Check deployment status
serverless info --stage prod

# View all S3 buckets
aws s3 ls

# List CloudFront distributions
aws cloudfront list-distributions

# Check Lambda functions
aws lambda list-functions

# View API Gateway APIs
aws apigateway get-rest-apis
```

### AWS Console Links

- [S3 Buckets](https://s3.console.aws.amazon.com/s3/buckets)
- [CloudFront Distributions](https://console.aws.amazon.com/cloudfront/v3/home)
- [Lambda Functions](https://console.aws.amazon.com/lambda/home?region=us-east-1)
- [API Gateway](https://console.aws.amazon.com/apigateway/home?region=us-east-1)
- [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups)

---

## 🎉 You're Done!

Your Auxeira platform is now live on AWS with:

✅ Marketing site at auxeira.com
✅ Dashboards at dashboard.auxeira.com
✅ API at api.auxeira.com
✅ Secure, scalable infrastructure
✅ Global CDN delivery
✅ Monitoring and logging

**Next steps:**
1. Test the complete user flow
2. Monitor CloudWatch for errors
3. Set up backups
4. Configure auto-scaling if needed
5. Launch! 🚀

