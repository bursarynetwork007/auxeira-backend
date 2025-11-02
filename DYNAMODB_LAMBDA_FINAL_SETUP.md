# 🎯 DynamoDB/Lambda Final Setup - dashboard.auxeira.com

**Objective**: Deploy real database integration to `dashboard.auxeira.com/startup_founder.html`  
**Status**: Ready to Deploy  
**Date**: October 31, 2025

---

## ✅ Current Status

### What's Working
- ✅ DynamoDB tables with 10,000 startups
- ✅ Lambda function: `auxeira-dashboard-context-prod`
- ✅ API URL: https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/
- ✅ Test user: `founder@startup.com` → EdTech Solutions 96
- ✅ All 13 AI Lambda functions deployed

### What's Deployed
- ✅ `auxeira.com/dashboard/startup_founder_live.html` - Working with real data
- ✅ `dashboard.auxeira.com` - Subdomain exists
- ✅ `dashboard.auxeira.com/startup_founder.html` - File exists (needs update)

---

## 🎯 Deployment Plan

### Step 1: Copy Updated Dashboard to Correct Location

The file at `frontend/dashboard/startup_founder_live.html` has the real database integration.  
We need to deploy it as `startup_founder.html` to `dashboard.auxeira.com`.

**Find S3 bucket for dashboard.auxeira.com**:

```bash
# Check CloudFront distributions
aws cloudfront list-distributions --output json | \
  jq -r '.DistributionList.Items[] | select(.Aliases.Items[]? | contains("dashboard.auxeira.com")) | {Id: .Id, Origin: .Origins.Items[0].DomainName}'
```

### Step 2: Deploy Updated File

```bash
# Copy the working file
cd frontend/dashboard
cp startup_founder_live.html startup_founder.html

# Upload to S3 (replace BUCKET_NAME with actual bucket)
aws s3 cp startup_founder.html s3://BUCKET_NAME/ \
  --content-type "text/html" \
  --cache-control "max-age=300" \
  --region us-east-1

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id DISTRIBUTION_ID \
  --paths "/startup_founder.html" "/index.html"
```

### Step 3: Verify Deployment

```bash
# Test the endpoint
curl -s https://dashboard.auxeira.com/startup_founder.html | grep -o "loadUserData\|DASHBOARD_CONTEXT_API"

# Should see:
# - DASHBOARD_CONTEXT_API
# - loadUserData
```

---

## 📊 Architecture (DynamoDB/Lambda)

```
User Login
    ↓
dashboard.auxeira.com/startup_founder.html
    ↓
JavaScript: loadUserData()
    ↓
Lambda Function URL
https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/
    ↓
Lambda: auxeira-dashboard-context-prod
    ↓
DynamoDB Tables:
  - auxeira-users-prod
  - auxeira-user-startup-mapping-prod
  - auxeira-startup-profiles-prod
  - auxeira-startup-activities-prod
    ↓
Response: JSON with real data
    ↓
Frontend: Update UI
    ↓
AI Components: Receive real context
    ↓
Dashboard: Ready
```

---

## 🔧 Configuration

### Lambda Function
- **Name**: `auxeira-dashboard-context-prod`
- **Runtime**: Node.js 18.x
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **URL**: https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/

### DynamoDB Tables
- `auxeira-users-prod` - User profiles
- `auxeira-startup-profiles-prod` - Startup data (10,000 records)
- `auxeira-user-startup-mapping-prod` - User-to-startup links
- `auxeira-startup-activities-prod` - Activity feed

### Frontend Configuration
```javascript
// API endpoint (in startup_founder.html)
const DASHBOARD_CONTEXT_API = 'https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/';

// Load user data
async function loadUserData() {
  const token = localStorage.getItem('authToken');
  const response = await fetch(DASHBOARD_CONTEXT_API, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}
```

---

## 🚀 Deployment Commands

### Find Dashboard S3 Bucket

```bash
# Method 1: Check CloudFront origin
aws cloudfront get-distribution --id $(aws cloudfront list-distributions --output json | \
  jq -r '.DistributionList.Items[] | select(.Aliases.Items[]? | contains("dashboard.auxeira.com")) | .Id') \
  --query 'Distribution.DistributionConfig.Origins.Items[0].DomainName' --output text

# Method 2: List all S3 buckets
aws s3 ls | grep -i dashboard
```

### Deploy to S3

```bash
cd /workspaces/auxeira-backend/frontend/dashboard

# Rename file for dashboard.auxeira.com
cp startup_founder_live.html startup_founder.html

# Upload (replace with actual bucket name)
aws s3 cp startup_founder.html s3://dashboard-auxeira-com/ \
  --content-type "text/html" \
  --cache-control "max-age=300"

# Or if it's in a subdomain of main bucket
aws s3 cp startup_founder.html s3://auxeira-com-frontend-prod/dashboard-subdomain/ \
  --content-type "text/html" \
  --cache-control "max-age=300"
```

### Invalidate CloudFront

```bash
# Get distribution ID
DIST_ID=$(aws cloudfront list-distributions --output json | \
  jq -r '.DistributionList.Items[] | select(.Aliases.Items[]? | contains("dashboard.auxeira.com")) | .Id')

echo "Distribution ID: $DIST_ID"

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id $DIST_ID \
  --paths "/*"
```

---

## 🧪 Testing

### Test API Endpoint

```bash
# Test with userId
curl "https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/?userId=045b4095-3388-4ea6-8de3-b7b04be5bc1b"

# Expected response
{
  "success": true,
  "data": {
    "startupName": "EdTech Solutions 96",
    "sseScore": 62,
    "mrr": 380177,
    "teamSize": 21,
    ...
  }
}
```

### Test Dashboard

1. Go to https://dashboard.auxeira.com/startup_founder.html
2. Login: `founder@startup.com` / `Testpass123`
3. Verify:
   - Company: "EdTech Solutions 96"
   - SSE Score: 62
   - MRR: $380,177
   - Team: 21 people
4. Check browser console:
   - "Loading user data from API..."
   - "Dashboard initialized successfully with real data"

### Test AI Components

1. **Coach Gina**: Click chat button
   - Should reference "EdTech Solutions 96"
   - Should mention SSE score 62
2. **Nudges**: Check 3 nudges
   - Should be personalized to EdTech
3. **Urgent Actions**: Check actions
   - Should reference real metrics

---

## 📝 File Comparison

### Current File (Needs Update)
- **Location**: `dashboard.auxeira.com/startup_founder.html`
- **Status**: Has mock data
- **Data Source**: Hardcoded values

### Updated File (Ready to Deploy)
- **Location**: `frontend/dashboard/startup_founder_live.html`
- **Status**: Real database integration
- **Data Source**: DynamoDB via Lambda

### Key Differences

**Before (Mock)**:
```javascript
const founderContext = {
  startupName: 'Auxeira',
  sseScore: 72,
  mrr: 18500,
  // ... hardcoded
};
```

**After (Real)**:
```javascript
const founderContext = await loadUserData();
// Returns:
{
  startupName: 'EdTech Solutions 96',
  sseScore: 62,
  mrr: 380177,
  // ... from DynamoDB
}
```

---

## 🔍 Verification Checklist

### Pre-Deployment
- [x] Lambda function deployed
- [x] DynamoDB tables populated
- [x] API endpoint tested
- [x] Frontend file updated
- [x] Test user verified

### Deployment
- [ ] Find S3 bucket for dashboard.auxeira.com
- [ ] Upload startup_founder.html
- [ ] Invalidate CloudFront cache
- [ ] Wait 2-3 minutes for propagation

### Post-Deployment
- [ ] Test dashboard loads
- [ ] Verify real data displays
- [ ] Test AI components
- [ ] Check browser console
- [ ] Test with multiple users

---

## 🎯 Quick Deploy Script

```bash
#!/bin/bash

echo "🚀 Deploying to dashboard.auxeira.com..."

# Step 1: Find distribution
DIST_ID=$(aws cloudfront list-distributions --output json | \
  jq -r '.DistributionList.Items[] | select(.Aliases.Items[]? | contains("dashboard.auxeira.com")) | .Id')

if [ -z "$DIST_ID" ]; then
  echo "❌ Could not find CloudFront distribution for dashboard.auxeira.com"
  exit 1
fi

echo "✅ Found distribution: $DIST_ID"

# Step 2: Get S3 origin
ORIGIN=$(aws cloudfront get-distribution --id $DIST_ID \
  --query 'Distribution.DistributionConfig.Origins.Items[0].DomainName' --output text)

BUCKET=$(echo $ORIGIN | sed 's/.s3.amazonaws.com//' | sed 's/.s3.[^.]*amazonaws.com//')

echo "✅ Found bucket: $BUCKET"

# Step 3: Prepare file
cd /workspaces/auxeira-backend/frontend/dashboard
cp startup_founder_live.html startup_founder.html

echo "✅ File prepared"

# Step 4: Upload
aws s3 cp startup_founder.html s3://$BUCKET/ \
  --content-type "text/html" \
  --cache-control "max-age=300"

echo "✅ File uploaded"

# Step 5: Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id $DIST_ID \
  --paths "/startup_founder.html" "/index.html" \
  --output json | jq -r '.Invalidation.Id'

echo "✅ Cache invalidated"
echo ""
echo "🎉 Deployment complete!"
echo "🔗 Test at: https://dashboard.auxeira.com/startup_founder.html"
echo "👤 Login: founder@startup.com / Testpass123"
```

---

## 📊 Data Flow Summary

### User Journey
1. User visits `dashboard.auxeira.com`
2. Redirects to `/startup_founder.html`
3. JavaScript loads and calls `loadUserData()`
4. Fetches from Lambda URL with auth token
5. Lambda queries DynamoDB tables
6. Returns real user data
7. Frontend updates UI with real metrics
8. AI components receive accurate context
9. Dashboard ready with personalized data

### No Supabase Needed
- ✅ DynamoDB handles all data storage
- ✅ Lambda provides API layer
- ✅ Direct integration with frontend
- ✅ Real-time via polling (optional)
- ✅ Scalable to 10,000+ users

---

## 🎉 Summary

**Current State**:
- ✅ Lambda function: Working
- ✅ DynamoDB: Populated with 10,000 startups
- ✅ API: Tested and returning real data
- ✅ Frontend: Updated with database integration
- ✅ Subdomain: dashboard.auxeira.com exists

**Next Action**:
1. Run the quick deploy script above
2. Wait 2-3 minutes for CloudFront
3. Test at https://dashboard.auxeira.com/startup_founder.html
4. Verify real data loads

**No Supabase Required** - Sticking with DynamoDB/Lambda architecture!

---

**Status**: 🚀 **READY TO DEPLOY**  
**Time**: 5-10 minutes  
**Complexity**: Low (just file upload + cache invalidation)
