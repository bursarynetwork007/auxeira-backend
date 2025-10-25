# Auxeira Platform - Comprehensive Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [AWS Infrastructure Setup](#aws-infrastructure-setup)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Database Configuration](#database-configuration)
8. [Authentication System](#authentication-system)
9. [Test User Login Issue - Root Cause & Fix](#test-user-login-issue)
10. [Deployment Checklist](#deployment-checklist)
11. [Troubleshooting](#troubleshooting)
12. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Overview

Auxeira is a startup success platform with:
- **Frontend**: Static HTML/CSS/JS hosted on S3 + CloudFront
- **Backend**: AWS Lambda functions with API Gateway
- **Database**: DynamoDB for user data
- **Authentication**: JWT-based auth with custom Lambda handlers
- **Payment**: Paystack integration for subscriptions

### Key URLs
- Main Site: https://auxeira.com
- Dashboard: https://dashboard.auxeira.com
- API Gateway: https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod

---

## Architecture

```
┌─────────────────┐
│   CloudFront    │ (CDN)
│  auxeira.com    │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ S3 Bucket│
    │ Frontend │
    └──────────┘

┌─────────────────┐
│   CloudFront    │ (CDN)
│dashboard.auxeira│
└────────┬────────┘
         │
    ┌────▼─────┐
    │ S3 Bucket│
    │Dashboard │
    └──────────┘

┌─────────────────┐
│  API Gateway    │
│   /prod/api/*   │
└────────┬────────┘
         │
    ┌────▼─────┐
    │  Lambda  │
    │ Functions│
    └────┬─────┘
         │
    ┌────▼─────┐
    │ DynamoDB │
    │  Tables  │
    └──────────┘
```

---

## Prerequisites

### Required Tools
- AWS CLI v2
- Node.js 18+
- Git
- Python 3.12+ (for local testing)

### AWS Credentials
```bash
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1
# - Default output format: json
```

### Environment Variables
```bash
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
```

---

## AWS Infrastructure Setup

### 1. S3 Buckets

#### Main Website Bucket
```bash
# Create bucket
aws s3 mb s3://auxeira.com --region us-east-1

# Enable static website hosting
aws s3 website s3://auxeira.com \
  --index-document index.html \
  --error-document index.html

# Set bucket policy for public read
cat > /tmp/bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::auxeira.com/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket auxeira.com \
  --policy file:///tmp/bucket-policy.json
```

#### Dashboard Bucket
```bash
# Create bucket
aws s3 mb s3://dashboard.auxeira.com --region us-east-1

# Enable static website hosting
aws s3 website s3://dashboard.auxeira.com \
  --index-document index.html \
  --error-document index.html

# Set bucket policy
cat > /tmp/dashboard-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::dashboard.auxeira.com/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket dashboard.auxeira.com \
  --policy file:///tmp/dashboard-policy.json
```

### 2. CloudFront Distributions

#### Main Site Distribution
```bash
aws cloudfront create-distribution \
  --origin-domain-name auxeira.com.s3.us-east-1.amazonaws.com \
  --default-root-object index.html
```

**Note the Distribution ID** (e.g., E1O2Q0Z86U0U5T)

#### Dashboard Distribution
```bash
aws cloudfront create-distribution \
  --origin-domain-name dashboard.auxeira.com.s3.us-east-1.amazonaws.com \
  --default-root-object index.html
```

**Note the Distribution ID** (e.g., E2SK5CDOUJ7KKB)

### 3. DynamoDB Tables

#### Users Table
```bash
aws dynamodb create-table \
  --table-name auxeira-users-prod \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=EmailIndex,KeySchema=[{AttributeName=email,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --provisioned-throughput \
    ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

---

## Backend Deployment

### Lambda Functions

The backend uses Lambda functions for API endpoints. Main handler: `backend/lambda-enhanced.js`

#### Deploy Lambda Function
```bash
cd backend

# Install dependencies
npm install

# Create deployment package
zip -r function.zip . -x "*.git*" "node_modules/aws-sdk/*"

# Create/Update Lambda function
aws lambda create-function \
  --function-name auxeira-api-prod \
  --runtime nodejs18.x \
  --role arn:aws:iam::${AWS_ACCOUNT_ID}:role/lambda-execution-role \
  --handler lambda-enhanced.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables="{
    DYNAMODB_TABLE=auxeira-users-prod,
    JWT_SECRET=your-secret-key-here,
    NODE_ENV=production
  }"

# Or update existing function
aws lambda update-function-code \
  --function-name auxeira-api-prod \
  --zip-file fileb://function.zip
```

### API Gateway Setup

#### Create REST API
```bash
aws apigateway create-rest-api \
  --name auxeira-api-prod \
  --description "Auxeira Platform API" \
  --endpoint-configuration types=REGIONAL
```

#### Configure Routes
Key routes:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/signup
- GET /api/auth/profile
- GET /health

#### Enable CORS
```bash
# For each resource, enable CORS
aws apigateway put-method \
  --rest-api-id <API_ID> \
  --resource-id <RESOURCE_ID> \
  --http-method OPTIONS \
  --authorization-type NONE

aws apigateway put-integration \
  --rest-api-id <API_ID> \
  --resource-id <RESOURCE_ID> \
  --http-method OPTIONS \
  --type MOCK \
  --request-templates '{"application/json": "{\"statusCode\": 200}"}'
```

#### Deploy API
```bash
aws apigateway create-deployment \
  --rest-api-id <API_ID> \
  --stage-name prod
```

---

## Frontend Deployment

### Deploy Main Website

```bash
cd frontend

# Upload all files
aws s3 sync . s3://auxeira.com/ \
  --exclude "*.git*" \
  --exclude "node_modules/*" \
  --exclude "*.backup" \
  --cache-control "public, max-age=3600"

# Set correct content types
aws s3 cp index.html s3://auxeira.com/index.html \
  --content-type "text/html" \
  --cache-control "public, max-age=300"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1O2Q0Z86U0U5T \
  --paths "/*"
```

### Deploy Dashboard

```bash
cd frontend/dashboard

# Upload dashboard files
aws s3 sync . s3://dashboard.auxeira.com/ \
  --exclude "*.git*" \
  --exclude "node_modules/*" \
  --cache-control "public, max-age=3600"

# Upload JavaScript files with correct content type
aws s3 cp profile-check.js s3://dashboard.auxeira.com/dashboard/profile-check.js \
  --content-type "application/javascript"

aws s3 cp dashboard-tabs.js s3://dashboard.auxeira.com/dashboard/dashboard-tabs.js \
  --content-type "application/javascript"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E2SK5CDOUJ7KKB \
  --paths "/*"
```

---

## Database Configuration

### User Schema (DynamoDB)

```javascript
{
  userId: "uuid",              // Primary Key
  email: "user@example.com",   // GSI
  firstName: "John",
  lastName: "Doe",
  role: "startup_founder",     // or venture_capital, corporate_partner, etc.
  profileType: "startup_founder",
  companyName: "Acme Inc",
  isActive: true,
  isEmailVerified: false,
  passwordHash: "bcrypt_hash",
  createdAt: "2025-10-22T08:55:28.661Z",
  updatedAt: "2025-10-25T22:35:09.283Z",
  lastLoginAt: "2025-10-25T22:35:14.186Z",
  loginCount: 57,
  profileTypeLocked: true,
  metadata: {}
}
```

### Create Test User

```bash
# Using AWS CLI
aws dynamodb put-item \
  --table-name auxeira-users-prod \
  --item '{
    "userId": {"S": "045b4095-3388-4ea6-8de3-b7b04be5bc1b"},
    "email": {"S": "founder@startup.com"},
    "firstName": {"S": "Jane"},
    "lastName": {"S": "Doe"},
    "role": {"S": "startup_founder"},
    "profileType": {"S": "startup_founder"},
    "companyName": {"S": "Acme Inc"},
    "isActive": {"BOOL": true},
    "isEmailVerified": {"BOOL": false},
    "passwordHash": {"S": "$2b$10$hashed_password_here"},
    "createdAt": {"S": "2025-10-22T08:55:28.661Z"},
    "updatedAt": {"S": "2025-10-25T22:35:09.283Z"},
    "loginCount": {"N": "1"},
    "profileTypeLocked": {"BOOL": true},
    "metadata": {"M": {}}
  }'
```

---

## Authentication System

### JWT Token Flow

1. User submits login credentials
2. Lambda validates credentials against DynamoDB
3. Lambda generates JWT tokens (access + refresh)
4. Frontend stores tokens in localStorage
5. Frontend includes access token in API requests

### Token Structure

```javascript
// Access Token (24h expiry)
{
  userId: "uuid",
  email: "user@example.com",
  role: "startup_founder",
  iat: 1761429690,
  exp: 1761516090
}

// Refresh Token (7d expiry)
{
  userId: "uuid",
  email: "user@example.com",
  iat: 1761429690,
  exp: 1762034490
}
```

### LocalStorage Keys

```javascript
localStorage.setItem('auxeira_auth_token', accessToken);
localStorage.setItem('auxeira_refresh_token', refreshToken);
localStorage.setItem('auxeira_user', JSON.stringify(userData));
localStorage.setItem('onboarding_completed', 'true');
localStorage.setItem('subscription_status', 'active');
localStorage.setItem('subscription_tier', 'founder');
```

---

## Test User Login Issue - Root Cause & Fix

### Problem Description
Test user `founder@startup.com` was immediately logged out after successful login. Dashboard would flash briefly then redirect to home page.

### Root Cause Analysis

1. **API Response Missing Fields**
   - API returns user object WITHOUT `onboardingCompleted` or `tier` fields
   - Frontend creates userData object with these fields defaulting to `false`

2. **Profile Check Validation**
   - `profile-check.js` runs on dashboard page load
   - Checks if `userData.onboardingCompleted === true`
   - If false, redirects to onboarding or home page

3. **CloudFront Caching Issue**
   - Updated JavaScript files were cached by CloudFront
   - Old HTML redirect page was served instead of actual JS file
   - Cache invalidation required 2-3 minutes to propagate

### Solution Implemented

#### 1. Update Login Flow (frontend/index.html)

```javascript
// Check if this is a test user
const testUsers = ['founder@startup.com', 'test@auxeira.com'];
const isTestUser = testUsers.includes(loginData.email);

// Build userData with proper defaults for test users
const userData = {
    userId: data.data?.user?.userId || data.data?.user?.id,
    id: data.data?.user?.userId || data.data?.user?.id,
    email: data.data?.user?.email || loginData.email,
    firstName: data.data?.user?.firstName || '',
    lastName: data.data?.user?.lastName || '',
    userType: data.data?.user?.role || data.data?.user?.profileType || 'venture_capital',
    role: data.data?.user?.role || data.data?.user?.profileType,
    tier: data.data?.user?.tier || (isTestUser ? 'founder' : 'founder'),
    onboardingCompleted: data.data?.user?.onboardingCompleted || isTestUser  // TRUE for test users
};

localStorage.setItem('auxeira_user', JSON.stringify(userData));

// Set additional flags for test users
if (isTestUser) {
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('subscription_status', 'active');
    localStorage.setItem('subscription_tier', 'founder');
    localStorage.setItem('subscription_date', new Date().toISOString());
}
```

#### 2. Add Debug Logging (frontend/dashboard/profile-check.js)

```javascript
async function checkProfileAndPayment() {
    try {
        const userData = JSON.parse(localStorage.getItem('auxeira_user') || '{}');
        
        console.log('[Profile Check] userData:', userData);
        console.log('[Profile Check] userId:', userData.userId);
        console.log('[Profile Check] onboardingCompleted:', userData.onboardingCompleted);
        
        if (!userData.userId) {
            console.log('[Profile Check] No userId found, redirecting to auxeira.com');
            window.location.href = 'https://auxeira.com';
            return false;
        }

        if (!userData.onboardingCompleted) {
            console.log('[Profile Check] Onboarding not completed, redirecting to onboarding.html');
            window.location.href = '/dashboard/onboarding.html';
            return false;
        }
        
        console.log('[Profile Check] All checks passed');
        return true;
    } catch (error) {
        console.error('Profile check error:', error);
        return true;
    }
}
```

#### 3. Ensure Proper File Deployment

```bash
# Upload with correct content type
aws s3 cp frontend/dashboard/profile-check.js \
  s3://dashboard.auxeira.com/dashboard/profile-check.js \
  --content-type "application/javascript"

# Aggressive cache invalidation
aws cloudfront create-invalidation \
  --distribution-id E2SK5CDOUJ7KKB \
  --paths "/*" "/dashboard/*"
```

### Verification Steps

1. **Check API Response**
```bash
curl -X POST https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"founder@startup.com","password":"Testpass123"}' | jq .
```

2. **Verify CloudFront Serves Correct File**
```bash
curl -s https://dashboard.auxeira.com/dashboard/profile-check.js | head -5
# Should show: /**
# NOT: <!DOCTYPE html>
```

3. **Test Login Flow**
- Open browser console (F12)
- Login with test credentials
- Check console logs for `[Profile Check]` messages
- Verify localStorage contains correct userData

---

## Deployment Checklist

### Pre-Deployment
- [ ] AWS credentials configured
- [ ] All environment variables set
- [ ] Code tested locally
- [ ] Git repository up to date

### Backend Deployment
- [ ] Lambda function code updated
- [ ] Environment variables configured
- [ ] API Gateway routes configured
- [ ] CORS enabled on all endpoints
- [ ] API deployed to prod stage

### Frontend Deployment
- [ ] All HTML files uploaded to S3
- [ ] JavaScript files uploaded with correct content-type
- [ ] CSS files uploaded
- [ ] Images and assets uploaded
- [ ] CloudFront cache invalidated

### Post-Deployment
- [ ] Test API endpoints with curl
- [ ] Test login flow in incognito mode
- [ ] Verify CloudFront serves latest files
- [ ] Check browser console for errors
- [ ] Test on multiple browsers
- [ ] Verify mobile responsiveness

---

## Troubleshooting

### Issue: User Logged Out Immediately

**Symptoms**: Dashboard flashes then redirects to home

**Diagnosis**:
```bash
# Check what CloudFront is serving
curl -s https://dashboard.auxeira.com/dashboard/profile-check.js | head -10

# Check localStorage in browser console
localStorage.getItem('auxeira_user')
```

**Solution**:
1. Verify profile-check.js is actual JavaScript, not HTML
2. Invalidate CloudFront cache
3. Wait 2-3 minutes for propagation
4. Clear browser cache and test in incognito

### Issue: API Returns 404

**Symptoms**: Login fails with "Route not found"

**Diagnosis**:
```bash
# Check available routes
curl -X POST https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' | jq .
```

**Solution**:
- Verify correct endpoint: `/api/auth/login` (not `/signin`)
- Check API Gateway configuration
- Verify Lambda function is deployed

### Issue: CORS Errors

**Symptoms**: Browser console shows CORS policy errors

**Solution**:
```bash
# Add CORS headers to Lambda response
{
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  },
  body: JSON.stringify(data)
}
```

### Issue: CloudFront Serves Stale Content

**Solution**:
```bash
# Invalidate entire distribution
aws cloudfront create-invalidation \
  --distribution-id <DIST_ID> \
  --paths "/*"

# Check invalidation status
aws cloudfront get-invalidation \
  --distribution-id <DIST_ID> \
  --id <INVALIDATION_ID>
```

---

## Monitoring & Maintenance

### CloudWatch Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/auxeira-api-prod --follow

# View API Gateway logs
aws logs tail API-Gateway-Execution-Logs_<API_ID>/prod --follow
```

### Metrics to Monitor

1. **Lambda Metrics**
   - Invocations
   - Errors
   - Duration
   - Throttles

2. **API Gateway Metrics**
   - 4XX errors
   - 5XX errors
   - Latency
   - Request count

3. **CloudFront Metrics**
   - Cache hit rate
   - Error rate
   - Bytes downloaded

### Regular Maintenance

**Weekly**:
- Review CloudWatch logs for errors
- Check API response times
- Monitor DynamoDB capacity

**Monthly**:
- Review AWS costs
- Update dependencies
- Security patches
- Backup DynamoDB tables

**Quarterly**:
- Review and rotate secrets
- Update SSL certificates
- Performance optimization
- Security audit

---

## Quick Reference Commands

### Deploy Frontend
```bash
aws s3 sync frontend/ s3://auxeira.com/ --exclude "*.git*"
aws cloudfront create-invalidation --distribution-id E1O2Q0Z86U0U5T --paths "/*"
```

### Deploy Dashboard
```bash
aws s3 sync frontend/dashboard/ s3://dashboard.auxeira.com/ --exclude "*.git*"
aws cloudfront create-invalidation --distribution-id E2SK5CDOUJ7KKB --paths "/*"
```

### Update Lambda
```bash
cd backend && zip -r function.zip . && \
aws lambda update-function-code --function-name auxeira-api-prod --zip-file fileb://function.zip
```

### View Logs
```bash
aws logs tail /aws/lambda/auxeira-api-prod --follow
```

### Test API
```bash
curl -X POST https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"founder@startup.com","password":"Testpass123"}'
```

---

## Support & Resources

- **AWS Documentation**: https://docs.aws.amazon.com
- **GitHub Repository**: https://github.com/bursarynetwork007/auxeira-backend
- **API Endpoint**: https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod

---

**Last Updated**: October 25, 2025
**Version**: 1.0.0
