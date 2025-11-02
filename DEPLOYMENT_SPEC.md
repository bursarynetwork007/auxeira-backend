# Auxeira Dashboard Deployment Specification

**Date:** October 31, 2025  
**Version:** 1.0  
**Environment:** Production

---

## Overview

This document outlines the deployment of the Auxeira startup founder dashboard with real-time data integration from DynamoDB via Lambda APIs.

---

## Architecture

### Frontend
- **Hosting:** AWS S3 + CloudFront CDN
- **Domain:** https://dashboard.auxeira.com
- **Main Dashboard:** `/startup_founder.html`
- **Alternative Path:** `/startup/index.html`

### Backend
- **API Gateway:** AWS Lambda Function URLs
- **Database:** Amazon DynamoDB
- **Authentication:** JWT tokens with bcrypt password hashing

### Key Components
1. **Login System:** https://auxeira.com (index.html)
2. **Dashboard Context API:** Lambda function providing startup data
3. **Auth API:** Lambda function handling login/registration
4. **DynamoDB Tables:**
   - `auxeira-backend-users-prod` - User accounts
   - `auxeira-users-prod` - Legacy user data
   - `auxeira-user-startup-mapping-prod` - User to startup relationships
   - `auxeira-startup-profiles-prod` - Startup profile data
   - `auxeira-startup-activities-prod` - Activity tracking

---

## Deployed Files

### Frontend Files

#### Main Dashboard
- **Source:** `/frontend/dashboard/startup_founder_live.html`
- **Destinations:**
  - `s3://dashboard.auxeira.com/startup_founder.html`
  - `s3://dashboard.auxeira.com/startup/index.html`
- **CloudFront Distribution:** E2SK5CDOUJ7KKB

#### Login Page
- **Source:** `/frontend/index.html`
- **Destination:** `s3://auxeira.com/index.html`
- **CloudFront Distribution:** E1O2Q0Z86U0U5T

#### Supporting Files
- `/frontend/js/overview-dynamic.js` → `s3://dashboard.auxeira.com/js/overview-dynamic.js`

### Backend Files

#### Lambda Functions

**1. Dashboard Context API**
- **Function Name:** `auxeira-dashboard-context-prod`
- **Source:** `/backend/lambda-dashboard-context.js`
- **URL:** https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/
- **Purpose:** Provides startup context data for dashboard initialization
- **Method:** GET
- **Auth:** JWT Bearer token or userId query parameter

**2. Backend API (Auth & More)**
- **Function Name:** `auxeira-backend-prod-api`
- **Source:** `/backend/lambda-enhanced.js` + `/backend/src/services/auth-dynamodb.service.js`
- **Endpoint:** https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod/api/auth/login
- **Purpose:** User authentication, registration, profile management
- **Methods:** POST /api/auth/login, POST /api/auth/register

---

## Key Changes Implemented

### 1. Authentication System
- **Fixed:** JWT token now includes `userId` field (was missing)
- **Fixed:** Auth service supports both `password` and `passwordHash` fields in DynamoDB
- **Fixed:** Login page saves token as `auxeira_auth_token`
- **Fixed:** Dashboard checks for both `authToken` and `auxeira_auth_token`
- **Fixed:** Login redirect uses `role` field from user data

### 2. Dashboard Data Integration
- **Added:** Real-time data loading from DynamoDB via Lambda API
- **Added:** `updateDashboardUI()` function to populate all metrics
- **Added:** Element IDs for dynamic updates:
  - `#sseScoreDisplay` - SSE Score
  - `#seriesAReadiness` - Series A Readiness percentage
  - `#currentMRR` - Monthly Recurring Revenue
  - `#mrrOverview` - MRR in SSE card
  - `#cacOverview` - CAC in SSE card
  - `#runwayOverview` - Runway in SSE card
  - `#customers` - Total customers
  - `#churnRate` - Churn rate
  - `#ltv` - Lifetime value
  - `#cac` - Customer acquisition cost
  - `#ltvCacRatio` - LTV:CAC ratio
  - `#runway` - Runway months
  - `#teamSize` - Team size

### 3. Lambda API Updates
- **Fixed:** Dashboard Context Lambda handles both JWT tokens and userId query params
- **Fixed:** CORS headers removed from Lambda code (handled by Function URL)
- **Fixed:** Timestamp field query uses ISO string format (not milliseconds)
- **Updated:** Auth service generates tokens with userId field

### 4. User Data
- **Created:** User `founder@startup.com` in `auxeira-backend-users-prod` table
- **Credentials:** 
  - Email: founder@startup.com
  - Password: Testpass123
  - User ID: 045b4095-3388-4ea6-8de3-b7b04be5bc1b
  - Startup: startup_0096 (EdTech Solutions 96)

---

## Data Flow

```
1. User logs in at auxeira.com
   ↓
2. POST to Lambda: /api/auth/login
   ↓
3. Lambda validates credentials in DynamoDB
   ↓
4. Returns JWT token with userId, email, role
   ↓
5. Frontend saves token as 'auxeira_auth_token'
   ↓
6. Redirect to dashboard.auxeira.com/startup_founder.html
   ↓
7. Dashboard loads, calls Dashboard Context API with JWT
   ↓
8. Lambda extracts userId from JWT
   ↓
9. Lambda queries DynamoDB for:
   - User profile
   - Startup mapping
   - Startup profile
   - Recent activities
   ↓
10. Returns context object with all metrics
   ↓
11. updateDashboardUI() populates all elements
```

---

## API Response Format

### Dashboard Context API Response
```json
{
  "success": true,
  "data": {
    "startupName": "EdTech Solutions 96",
    "sseScore": 62,
    "stage": "Pre-Seed",
    "industry": "EdTech",
    "geography": "Asia-Pacific",
    "teamSize": 21,
    "runway": 19.3,
    "mrr": 380177,
    "mrrGrowth": "+12.6%",
    "users": 21104,
    "customers": 8441,
    "cac": 127,
    "ltv": 1890,
    "churnRate": 2.3,
    "nps": 68.6,
    "interviewsCompleted": 0,
    "projectionsAge": "30 days old",
    "recentMilestones": [
      "Achieved $380.2K MRR",
      "Reached 8,441 customers",
      "Completed 6 activities this month"
    ],
    "activeChallenges": [
      "Churn rate above SaaS benchmark (2.3% vs 1-2%)",
      "Need to complete more activities to improve SSE score"
    ]
  }
}
```

---

## Deployment Commands

### Deploy Frontend

```bash
# Deploy dashboard
aws s3 cp frontend/dashboard/startup_founder_live.html \
  s3://dashboard.auxeira.com/startup_founder.html \
  --region us-east-1 \
  --content-type "text/html" \
  --cache-control "max-age=0, no-cache, no-store, must-revalidate"

# Deploy to alternate path
aws s3 cp frontend/dashboard/startup_founder_live.html \
  s3://dashboard.auxeira.com/startup/index.html \
  --region us-east-1 \
  --content-type "text/html" \
  --cache-control "max-age=0, no-cache, no-store, must-revalidate"

# Deploy login page
aws s3 cp frontend/index.html \
  s3://auxeira.com/index.html \
  --region us-east-1 \
  --content-type "text/html" \
  --cache-control "max-age=0, no-cache, no-store, must-revalidate"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E2SK5CDOUJ7KKB \
  --paths "/startup_founder.html" "/startup/index.html" \
  --region us-east-1

aws cloudfront create-invalidation \
  --distribution-id E1O2Q0Z86U0U5T \
  --paths "/index.html" \
  --region us-east-1
```

### Deploy Backend

```bash
# Package Lambda
cd backend
zip -r lambda-enhanced.zip . \
  -x "*.git*" "node_modules/aws-sdk/*" "*.zip"

# Deploy Auth Lambda
aws lambda update-function-code \
  --function-name auxeira-backend-prod-api \
  --zip-file fileb://lambda-enhanced.zip \
  --region us-east-1

# Package Dashboard Context Lambda
zip -j lambda-dashboard-context.zip lambda-dashboard-context.js

# Deploy Dashboard Context Lambda
aws lambda update-function-code \
  --function-name auxeira-dashboard-context-prod \
  --zip-file fileb://lambda-dashboard-context.zip \
  --region us-east-1
```

---

## Environment Variables

### Lambda: auxeira-backend-prod-api
```
USERS_TABLE=auxeira-backend-users-prod
SESSIONS_TABLE=auxeira-sessions
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
AWS_REGION=us-east-1
```

### Lambda: auxeira-dashboard-context-prod
```
AWS_REGION=us-east-1
```

---

## Testing

### Test Login
```bash
curl -X POST https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"founder@startup.com","password":"Testpass123"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  }
}
```

### Test Dashboard Context API
```bash
# With userId (for testing)
curl "https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/?userId=045b4095-3388-4ea6-8de3-b7b04be5bc1b"

# With JWT token
TOKEN="<jwt_token_from_login>"
curl -H "Authorization: Bearer $TOKEN" \
  "https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/"
```

---

## Troubleshooting

### Issue: SSE Score shows 78 instead of 62
**Cause:** Browser or CDN caching old JavaScript  
**Solution:** 
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Use incognito mode
4. Wait 5-10 minutes for CDN propagation

### Issue: "Invalid token" error
**Cause:** JWT doesn't include userId field  
**Solution:** Redeploy auth Lambda with updated code

### Issue: "No auth token found"
**Cause:** Token saved with wrong key name  
**Solution:** Dashboard now checks both `authToken` and `auxeira_auth_token`

### Issue: Login redirect fails
**Cause:** User data missing `role` field  
**Solution:** Login page now uses `userData.role || userData.userType`

---

## Rollback Procedure

If issues occur:

1. **Revert Frontend:**
```bash
# Restore previous version from S3 versioning
aws s3api list-object-versions \
  --bucket dashboard.auxeira.com \
  --prefix startup_founder.html

aws s3api get-object \
  --bucket dashboard.auxeira.com \
  --key startup_founder.html \
  --version-id <previous-version-id> \
  startup_founder.html

aws s3 cp startup_founder.html \
  s3://dashboard.auxeira.com/startup_founder.html
```

2. **Revert Lambda:**
```bash
# List previous versions
aws lambda list-versions-by-function \
  --function-name auxeira-backend-prod-api

# Revert to previous version
aws lambda update-function-configuration \
  --function-name auxeira-backend-prod-api \
  --publish \
  --revision-id <previous-revision-id>
```

---

## Monitoring

### CloudWatch Logs
- Lambda logs: `/aws/lambda/auxeira-backend-prod-api`
- Lambda logs: `/aws/lambda/auxeira-dashboard-context-prod`

### Key Metrics to Monitor
- Lambda invocation count
- Lambda error rate
- API Gateway 4xx/5xx errors
- CloudFront cache hit ratio
- DynamoDB read/write capacity

---

## Security Notes

1. **JWT Secrets:** Stored in Lambda environment variables (not in code)
2. **Password Hashing:** bcrypt with 12 rounds
3. **CORS:** Configured at Lambda Function URL level
4. **DynamoDB:** IAM role-based access only
5. **S3 Buckets:** Public read for static assets, CloudFront origin access

---

## Support Contacts

- **AWS Account:** 615608124862
- **Region:** us-east-1
- **Test User:** founder@startup.com / Testpass123

---

## Change Log

### 2025-10-31
- Initial deployment with real-time data integration
- Fixed authentication flow
- Added dynamic UI updates
- Deployed to production

---

## Next Steps

1. Enable S3 versioning for rollback capability
2. Set up CloudWatch alarms for Lambda errors
3. Implement automated testing
4. Add monitoring dashboard
5. Document API rate limits
6. Set up backup strategy for DynamoDB
