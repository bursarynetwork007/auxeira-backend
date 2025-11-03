# Auxeira Dashboard - Deployment Specification

**Version:** 1.0  
**Date:** November 3, 2025  
**Status:** ✅ DEPLOYED AND VERIFIED

---

## Executive Summary

Successfully integrated the Auxeira startup founder dashboard with the central DynamoDB database via Lambda APIs. The dashboard now displays real-time data from the database instead of hardcoded values.

**Key Achievement:**
- SSE Score: **62** (from database, previously hardcoded as 78)
- Startup Name: **EdTech Solutions 96** (from database)
- MRR: **$380,177** (from database, previously hardcoded as $18,500)

---

## Architecture Overview

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────────────────────┐
│  CloudFront Distribution        │
│  ID: E1L1Q8VK3LAEFC             │
│  Domain: dashboard.auxeira.com  │
└────────┬────────────────────────┘
         │
         │ Origin Fetch
         ▼
┌──────────────────────────────────────────┐
│  S3 Bucket                               │
│  auxeira-dashboards-jsx-1759943238       │
│  Region: us-east-1                       │
│  File: startup_founder.html (250 KB)     │
└────────┬─────────────────────────────────┘
         │
         │ JavaScript API Call
         ▼
┌──────────────────────────────────────────┐
│  Lambda Function URL                     │
│  Dashboard Context API                   │
│  https://24ndip5xbbgahv4m5cvicrmzta0...  │
└────────┬─────────────────────────────────┘
         │
         │ Query
         ▼
┌──────────────────────────────────────────┐
│  DynamoDB Table                          │
│  Startup Founder Data                    │
│  Region: us-east-1                       │
└──────────────────────────────────────────┘
```

---

## Infrastructure Components

### 1. CloudFront Distribution

**Distribution ID:** `E1L1Q8VK3LAEFC`  
**Domain:** `dashboard.auxeira.com`  
**SSL Certificate:** AWS Certificate Manager  
**Cache Behavior:**
- Default TTL: 86,400 seconds (24 hours)
- Maximum TTL: 31,536,000 seconds (1 year)
- Minimum TTL: 1 second

**Origin Configuration:**
- Origin Domain: `auxeira-dashboards-jsx-1759943238.s3-website-us-east-1.amazonaws.com`
- Origin Protocol: HTTP only (S3 website endpoint)
- Origin Path: None

**Custom Error Responses:** None configured

### 2. S3 Bucket

**Bucket Name:** `auxeira-dashboards-jsx-1759943238`  
**Region:** `us-east-1`  
**Website Hosting:** Enabled  
**Versioning:** Suspended (as of Nov 3, 2025)

**Key Files:**
- `startup_founder.html` (250 KB) - Main dashboard file
- `index.html` (1 KB) - Root redirect with authentication check
- `test_api.html` (4 KB) - API integration test page

### 3. Lambda Function URL

**Dashboard Context API:**
- URL: `https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/`
- Method: GET
- Authentication: Optional (supports both token-based and test user)
- Region: us-east-1

**Request Format:**
```bash
# With user ID (no auth)
GET /?userId=045b4095-3388-4ea6-8de3-b7b04be5bc1b

# With auth token
GET /
Headers:
  Authorization: Bearer <jwt_token>
  Content-Type: application/json
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "userId": "045b4095-3388-4ea6-8de3-b7b04be5bc1b",
    "startupName": "EdTech Solutions 96",
    "sseScore": 62,
    "mrr": 380177,
    "teamSize": 21,
    "customers": 8441,
    "runway": 14,
    "valuation": 2400000,
    "cac": 127,
    "ltv": 1850,
    ...
  }
}
```

### 4. DynamoDB Table

**Table Name:** (Accessed via Lambda)  
**Region:** us-east-1  
**Data Model:** Startup founder profiles with metrics

**Test User:**
- User ID: `045b4095-3388-4ea6-8de3-b7b04be5bc1b`
- Email: `founder@startup.com`
- Startup: EdTech Solutions 96
- SSE Score: 62

---

## Deployment Process

### Prerequisites

1. AWS CLI installed and configured
2. Access to AWS account with permissions for:
   - S3 (read/write)
   - CloudFront (create invalidations)
   - Lambda (invoke functions)
3. Git access to repository: `bursarynetwork007/auxeira-backend`

### Step-by-Step Deployment

#### 1. Clone Repository

```bash
cd /home/ubuntu
gh repo clone bursarynetwork007/auxeira-backend
cd auxeira-backend
```

#### 2. Verify File Integrity

```bash
# Check file exists and has correct size
ls -lh dashboard-html/startup_founder.html

# Verify API integration code exists
grep -c "24ndip5xbbgahv4m5cvicrmzta0vgdho" dashboard-html/startup_founder.html
# Expected output: 1 or more

# Verify token name is correct
grep -c "auxeira_auth_token" dashboard-html/startup_founder.html
# Expected output: 2 or more
```

#### 3. Deploy to S3

```bash
# Upload dashboard file
aws s3 cp dashboard-html/startup_founder.html \
  s3://auxeira-dashboards-jsx-1759943238/startup_founder.html \
  --content-type "text/html" \
  --region us-east-1

# Upload root redirect (optional)
aws s3 cp dashboard-html/index_redirect.html \
  s3://auxeira-dashboards-jsx-1759943238/index.html \
  --content-type "text/html" \
  --region us-east-1
```

#### 4. Invalidate CloudFront Cache

```bash
# Invalidate dashboard file
aws cloudfront create-invalidation \
  --distribution-id E1L1Q8VK3LAEFC \
  --paths "/startup_founder.html" \
  --region us-east-1

# Invalidate root (if updated)
aws cloudfront create-invalidation \
  --distribution-id E1L1Q8VK3LAEFC \
  --paths "/" "/index.html" \
  --region us-east-1
```

#### 5. Wait for Propagation

```bash
# Check invalidation status
aws cloudfront get-invalidation \
  --distribution-id E1L1Q8VK3LAEFC \
  --id <INVALIDATION_ID>

# Wait for Status: Completed (typically 2-5 minutes)
```

#### 6. Verify Deployment

```bash
# Test API integration in deployed file
curl -s "https://dashboard.auxeira.com/startup_founder.html" | \
  grep -c "auxeira_auth_token"
# Expected: 2

# Test API endpoint directly
curl -s "https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/?userId=045b4095-3388-4ea6-8de3-b7b04be5bc1b" | \
  jq '.data.sseScore'
# Expected: 62
```

---

## Configuration Details

### JavaScript API Integration

**Location in File:** Lines 5600-5670  
**Function:** `loadUserData()`

**Key Configuration:**
```javascript
const DASHBOARD_CONTEXT_API = 'https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/';
const TEST_USER_ID = '045b4095-3388-4ea6-8de3-b7b04be5bc1b';
```

**Authentication Flow:**
1. Check for `auxeira_auth_token` in localStorage
2. If token exists: Call API with Bearer token
3. If no token: Fall back to test user ID
4. If API fails: Retry with test user ID

**Data Update Flow:**
1. `loadUserData()` fetches data from API
2. Returns `founderContext` object
3. `updateDashboardUI(founderContext)` updates UI elements
4. Elements updated by ID: `sseScoreDisplay`, `companyName`, etc.

### UI Element Mapping

| Database Field | UI Element ID | Display Format |
|----------------|---------------|----------------|
| `sseScore` | `sseScoreDisplay` | Integer (62) |
| `startupName` | `companyName` | Text ("EdTech Solutions 96") |
| `mrr` | `mrrValue` | Currency ($380,177) |
| `teamSize` | `teamSizeValue` | Integer (21) |
| `customers` | `customersValue` | Integer (8,441) |
| `runway` | `runwayValue` | Months (14) |
| `valuation` | `valuationValue` | Currency ($2.4M) |
| `cac` | `cacValue` | Currency ($127) |
| `ltv` | `ltvValue` | Currency ($1,850) |

---

## Testing Procedures

### 1. Functional Testing

**Test API Integration:**
```bash
# Open browser console (F12)
# Navigate to: https://dashboard.auxeira.com/startup_founder.html
# Check console for:
=== DASHBOARD INITIALIZING ===
=== CALLING loadUserData() ===
=== loadUserData() RETURNED === {sseScore: 62, ...}
```

**Expected Results:**
- SSE Score displays: **62**
- Company name displays: **EdTech Solutions 96**
- MRR displays: **$380,177**
- No JavaScript errors in console

### 2. Performance Testing

**Page Load Time:**
- Target: < 3 seconds
- Measure: Chrome DevTools Network tab

**API Response Time:**
- Target: < 500ms
- Measure: Browser console or curl with `-w "@-"`

### 3. Security Testing

**Authentication:**
- Verify dashboard accessible without login (by design)
- Verify API accepts test user ID
- Verify API validates JWT tokens when provided

**Data Privacy:**
- Verify no sensitive data in URL parameters
- Verify HTTPS encryption
- Verify no data leakage in console logs (production)

---

## Rollback Procedures

### Quick Rollback (S3 Version Restore)

**Note:** S3 versioning is currently suspended. To enable rollback capability:

```bash
# Enable versioning
aws s3api put-bucket-versioning \
  --bucket auxeira-dashboards-jsx-1759943238 \
  --versioning-configuration Status=Enabled

# List versions
aws s3api list-object-versions \
  --bucket auxeira-dashboards-jsx-1759943238 \
  --prefix startup_founder.html

# Restore previous version
aws s3api copy-object \
  --bucket auxeira-dashboards-jsx-1759943238 \
  --copy-source auxeira-dashboards-jsx-1759943238/startup_founder.html?versionId=<VERSION_ID> \
  --key startup_founder.html

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id E1L1Q8VK3LAEFC \
  --paths "/startup_founder.html"
```

### Git Rollback

```bash
# View commit history
cd /home/ubuntu/auxeira-backend
git log --oneline dashboard-html/startup_founder.html

# Revert to specific commit
git checkout <COMMIT_HASH> dashboard-html/startup_founder.html

# Deploy reverted version
aws s3 cp dashboard-html/startup_founder.html \
  s3://auxeira-dashboards-jsx-1759943238/startup_founder.html \
  --content-type "text/html"

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id E1L1Q8VK3LAEFC \
  --paths "/startup_founder.html"
```

---

## Troubleshooting Guide

### Issue: Dashboard Shows SSE Score 0 or 78

**Symptoms:**
- SSE score not updating from initial value
- Console shows no API calls

**Diagnosis:**
```bash
# Check browser console for errors
# Look for: "CoachGinaChat is not defined" or similar

# Verify API is accessible
curl -s "https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/?userId=045b4095-3388-4ea6-8de3-b7b04be5bc1b"
```

**Solution:**
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)
- Check CloudFront cache invalidation status
- Verify JavaScript has no syntax errors

### Issue: CloudFront Serves Old Version

**Symptoms:**
- Changes not visible after deployment
- curl shows old file content

**Diagnosis:**
```bash
# Check S3 file
aws s3 cp s3://auxeira-dashboards-jsx-1759943238/startup_founder.html - | grep -c "auxeira_auth_token"

# Check CloudFront serving
curl -s "https://dashboard.auxeira.com/startup_founder.html" | grep -c "auxeira_auth_token"

# Compare ETags
aws s3api head-object --bucket auxeira-dashboards-jsx-1759943238 --key startup_founder.html --query 'ETag'
curl -I "https://dashboard.auxeira.com/startup_founder.html" | grep ETag
```

**Solution:**
- Create wildcard invalidation: `/*`
- Wait 5-10 minutes for full propagation
- Check invalidation status
- Consider updating cache policy for lower TTL

### Issue: API Returns Error

**Symptoms:**
- Console shows API error messages
- Dashboard shows fallback data or alert

**Diagnosis:**
```bash
# Test API directly
curl -v "https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/?userId=045b4095-3388-4ea6-8de3-b7b04be5bc1b"

# Check response status and body
```

**Solution:**
- Verify Lambda function is running
- Check Lambda logs in CloudWatch
- Verify DynamoDB table is accessible
- Check IAM permissions for Lambda

---

## Monitoring and Maintenance

### CloudWatch Metrics

**Lambda Function:**
- Invocations
- Duration
- Errors
- Throttles

**CloudFront:**
- Requests
- Bytes Downloaded
- Error Rate (4xx, 5xx)
- Cache Hit Ratio

### Recommended Alerts

1. **API Error Rate > 5%**
   - Alert: Email/SNS
   - Action: Check Lambda logs

2. **Dashboard Load Time > 5 seconds**
   - Alert: Email
   - Action: Review CloudFront cache settings

3. **CloudFront 5xx Errors > 1%**
   - Alert: PagerDuty
   - Action: Check S3 bucket availability

### Regular Maintenance

**Weekly:**
- Review CloudWatch logs for errors
- Check API response times
- Verify dashboard loads correctly

**Monthly:**
- Review CloudFront cache hit ratio
- Optimize cache settings if needed
- Review S3 bucket size and costs

**Quarterly:**
- Review and update test data
- Security audit (IAM permissions, HTTPS config)
- Performance optimization review

---

## Git Repository

**Repository:** `bursarynetwork007/auxeira-backend`  
**Branch:** `main`

**Key Commits:**
- `621b3f2` - Fix CoachGinaChat error blocking dashboard initialization
- `43df7fc` - Add authentication check to dashboard root redirect
- `524ae3c` - Add authentication check to dashboard
- `9e8d23d` - Replace dashboard-html/startup_founder.html with integrated version
- `68c40ca` - Update login redirect to startup_founder.html
- `b3b8108` - Integrate Dashboard Context API with startup_founder dashboard

**Key Files:**
- `dashboard-html/startup_founder.html` - Main dashboard file (250 KB)
- `dashboard-html/index_redirect.html` - Root redirect with auth check
- `DEPLOYMENT_SPEC_FINAL.md` - This document

---

## Contact and Support

**Development Team:**
- Repository: https://github.com/bursarynetwork007/auxeira-backend
- Issues: https://github.com/bursarynetwork007/auxeira-backend/issues

**AWS Resources:**
- Region: us-east-1
- Account: (Configured via AWS CLI)

**API Endpoints:**
- Dashboard Context: https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/
- Coach Gina: https://9t3nivd6wg.execute-api.us-east-1.amazonaws.com/prod/api/coach-gina
- Nudges: https://qh56ng61eh.execute-api.us-east-1.amazonaws.com/prod/api/nudges

---

## Appendix

### A. Complete Deployment Script

```bash
#!/bin/bash
# Auxeira Dashboard Deployment Script
# Version: 1.0

set -e  # Exit on error

echo "=== Auxeira Dashboard Deployment ==="
echo "Date: $(date)"
echo ""

# Configuration
BUCKET="auxeira-dashboards-jsx-1759943238"
DISTRIBUTION_ID="E1L1Q8VK3LAEFC"
REGION="us-east-1"
REPO_PATH="/home/ubuntu/auxeira-backend"

# Step 1: Pull latest code
echo "Step 1: Pulling latest code from GitHub..."
cd "$REPO_PATH"
git pull origin main

# Step 2: Verify file
echo "Step 2: Verifying file integrity..."
if [ ! -f "dashboard-html/startup_founder.html" ]; then
    echo "ERROR: startup_founder.html not found!"
    exit 1
fi

FILE_SIZE=$(stat -f%z "dashboard-html/startup_founder.html" 2>/dev/null || stat -c%s "dashboard-html/startup_founder.html")
echo "File size: $FILE_SIZE bytes"

if [ "$FILE_SIZE" -lt 200000 ]; then
    echo "WARNING: File size seems too small!"
fi

# Step 3: Upload to S3
echo "Step 3: Uploading to S3..."
aws s3 cp dashboard-html/startup_founder.html \
    "s3://$BUCKET/startup_founder.html" \
    --content-type "text/html" \
    --region "$REGION"

echo "✅ Uploaded to S3"

# Step 4: Invalidate CloudFront
echo "Step 4: Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/startup_founder.html" \
    --region "$REGION" \
    --query 'Invalidation.Id' \
    --output text)

echo "Invalidation ID: $INVALIDATION_ID"
echo "✅ CloudFront invalidation created"

# Step 5: Wait for completion
echo "Step 5: Waiting for invalidation to complete..."
aws cloudfront wait invalidation-completed \
    --distribution-id "$DISTRIBUTION_ID" \
    --id "$INVALIDATION_ID"

echo "✅ Invalidation completed"

# Step 6: Verify deployment
echo "Step 6: Verifying deployment..."
sleep 5  # Give CloudFront a moment

DEPLOYED_CHECK=$(curl -s "https://dashboard.auxeira.com/startup_founder.html" | grep -c "auxeira_auth_token" || echo "0")

if [ "$DEPLOYED_CHECK" -ge "2" ]; then
    echo "✅ Deployment verified successfully"
else
    echo "⚠️  WARNING: Deployment verification failed"
    echo "Please check manually: https://dashboard.auxeira.com/startup_founder.html"
fi

echo ""
echo "=== Deployment Complete ==="
echo "Dashboard URL: https://dashboard.auxeira.com/startup_founder.html"
echo "Test with: founder@startup.com / Testpass123"
```

### B. API Test Script

```bash
#!/bin/bash
# Test Dashboard Context API

API_URL="https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/"
TEST_USER_ID="045b4095-3388-4ea6-8de3-b7b04be5bc1b"

echo "Testing Dashboard Context API..."
echo "URL: $API_URL"
echo "User ID: $TEST_USER_ID"
echo ""

# Test API
RESPONSE=$(curl -s "${API_URL}?userId=${TEST_USER_ID}")

# Check if successful
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
    echo "✅ API Test Successful"
    echo ""
    echo "SSE Score: $(echo "$RESPONSE" | jq -r '.data.sseScore')"
    echo "Startup Name: $(echo "$RESPONSE" | jq -r '.data.startupName')"
    echo "MRR: $(echo "$RESPONSE" | jq -r '.data.mrr')"
    echo "Team Size: $(echo "$RESPONSE" | jq -r '.data.teamSize')"
else
    echo "❌ API Test Failed"
    echo "Response: $RESPONSE"
    exit 1
fi
```

### C. Environment Variables

```bash
# AWS Configuration
export AWS_REGION=us-east-1
export AWS_DEFAULT_REGION=us-east-1

# S3 Bucket
export AUXEIRA_DASHBOARD_BUCKET=auxeira-dashboards-jsx-1759943238

# CloudFront
export AUXEIRA_CLOUDFRONT_DIST=E1L1Q8VK3LAEFC

# API Endpoints
export DASHBOARD_CONTEXT_API=https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/
export COACH_GINA_API=https://9t3nivd6wg.execute-api.us-east-1.amazonaws.com/prod/api/coach-gina

# Test User
export TEST_USER_ID=045b4095-3388-4ea6-8de3-b7b04be5bc1b
export TEST_USER_EMAIL=founder@startup.com
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Nov 3, 2025 | AI Assistant | Initial deployment specification |

---

**End of Document**
