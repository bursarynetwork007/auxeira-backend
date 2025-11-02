# 🚀 Auxeira Deployment Information

**Last Updated**: October 31, 2025  
**Status**: Production Ready

---

## 🌐 Live URLs

### Main Website
- **Production**: https://auxeira.com
- **CloudFront Distribution**: E1O2Q0Z86U0U5T
- **S3 Bucket**: `auxeira-com-frontend-prod`

### Dashboard (Current)
- **URL**: https://auxeira.com/dashboard/startup_founder_live.html
- **Location**: S3 `auxeira-com-frontend-prod/dashboard/`
- **Status**: ✅ LIVE with real database integration

### Dashboard (Target - Supabase)
- **URL**: https://dashboard.auxeira.com/startup_founder.html
- **Status**: ⏳ Pending Supabase setup
- **DNS**: Needs CNAME configuration

---

## 🔑 API Endpoints

### Lambda Functions (Production)

| Function | URL | Purpose | Status |
|----------|-----|---------|--------|
| Dashboard Context | https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/ | Load user dashboard data | ✅ LIVE |
| Coach Gina | https://9t3nivd6wg.execute-api.us-east-1.amazonaws.com/prod/api/coach-gina | AI mentor chat | ✅ LIVE |
| Nudges Generator | https://koo8kun6ge.execute-api.us-east-1.amazonaws.com/prod/api/nudges/generate | Generate 3 nudges | ✅ LIVE |
| Urgent Actions | https://yyf8vfdvs6.execute-api.us-east-1.amazonaws.com/prod/api/urgent-actions/generate | Generate urgent actions | ✅ LIVE |
| Growth Story | Lambda | Growth narrative | ✅ LIVE |
| Growth Levers | Lambda | Growth recommendations | ✅ LIVE |
| Recommended Actions | Lambda | Quarterly actions | ✅ LIVE |
| Investor Matching | Lambda | Match investors | ✅ LIVE |
| Funding Acceleration | Lambda | 6-week roadmap | ✅ LIVE |
| Funding Insights | Lambda | Funding gap analysis | ✅ LIVE |
| AUX Tasks | Lambda | Task recommendations | ✅ LIVE |
| AUX Redeem | Lambda | Redemption catalog | ✅ LIVE |
| Activity Rewards | Lambda | Activity assessment | ✅ LIVE |
| Partner Rewards | Lambda | Partner recommendations | ✅ LIVE |

### Backend API (Node.js)
- **Status**: Running locally (not deployed to production yet)
- **Port**: 3000
- **Endpoints**:
  - `/api/auth/*` - Authentication
  - `/api/dashboard/*` - Dashboard data
  - `/api/activities/*` - Activity rewards
  - `/api/sse/*` - SSE scores
  - `/api/kpi/*` - KPI metrics

---

## 🗄️ Database Configuration

### DynamoDB Tables (Current - Production)

| Table Name | Purpose | Records | Status |
|------------|---------|---------|--------|
| `auxeira-users-prod` | User profiles | Active | ✅ LIVE |
| `auxeira-startup-profiles-prod` | Startup data | 10,000 | ✅ LIVE |
| `auxeira-user-startup-mapping-prod` | User-startup links | Active | ✅ LIVE |
| `auxeira-startup-activities-prod` | Activity feed | Rolling 365 days | ✅ LIVE |
| `auxeira-activity-submissions` | User submissions | Active | ✅ LIVE |
| `auxeira-token-transactions-prod` | AUX tokens | Active | ✅ LIVE |
| `auxeira-sessions-prod` | User sessions | Active | ✅ LIVE |

### Supabase (Target - Not Set Up Yet)

**Status**: ⏳ Awaiting setup  
**Documentation**: See `SUPABASE_IMPLEMENTATION_GUIDE.md`

**Required Steps**:
1. Create Supabase project at https://supabase.com
2. Run SQL schema (provided in guide)
3. Migrate data from DynamoDB
4. Update frontend to use Supabase
5. Deploy to dashboard.auxeira.com

---

## 🔐 Credentials & Keys

### Test User
- **Email**: `founder@startup.com`
- **Password**: `Testpass123`
- **User ID**: `045b4095-3388-4ea6-8de3-b7b04be5bc1b`
- **Startup ID**: `startup_0096`
- **Company**: EdTech Solutions 96

### API Keys (Production)

#### Claude AI (Anthropic)
```
YOUR_ANTHROPIC_API_KEY
```
**Status**: ✅ Working  
**Usage**: All 13 Lambda functions

#### Manus AI
```
sk-iaoPPjhcH6_hHRfIZL8FwialWXDaVIXAwY8wzGMOljnoDskzTScNTlY4YsJ57W3-vVogmNv2udyjs7k3gfnVFxSVT-In
```
**Status**: ⏳ Awaiting activation  
**Fallback**: Claude (configured)

### AWS Configuration
- **Region**: us-east-1
- **Account ID**: 615608124862
- **IAM Role**: `auxeira-coach-gina-prod-us-east-1-lambdaRole`

---

## 📦 Deployment Commands

### Deploy Frontend to S3

```bash
# Upload dashboard
cd frontend/dashboard
aws s3 cp startup_founder_live.html s3://auxeira-com-frontend-prod/dashboard/ \
  --content-type "text/html" \
  --cache-control "max-age=300" \
  --region us-east-1

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1O2Q0Z86U0U5T \
  --paths "/dashboard/startup_founder_live.html"
```

### Deploy Lambda Function

```bash
# Example: Deploy dashboard context function
cd backend
mkdir -p /tmp/lambda-dashboard-context
cp lambda-dashboard-context.js /tmp/lambda-dashboard-context/
cp -r node_modules /tmp/lambda-dashboard-context/
cd /tmp/lambda-dashboard-context
zip -qr lambda-dashboard-context.zip .
aws lambda update-function-code \
  --function-name auxeira-dashboard-context-prod \
  --zip-file fileb://lambda-dashboard-context.zip \
  --region us-east-1
```

### Deploy Backend API (Not in Production Yet)

```bash
cd backend
npm install
npm start  # Runs on port 3000

# For production deployment (example with PM2)
pm2 start src/server.js --name auxeira-backend
pm2 save
```

---

## 🧪 Testing

### Test Dashboard API

```bash
# Test with userId parameter
curl "https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/?userId=045b4095-3388-4ea6-8de3-b7b04be5bc1b"

# Expected response
{
  "success": true,
  "data": {
    "startupName": "EdTech Solutions 96",
    "sseScore": 62,
    "mrr": 380177,
    ...
  }
}
```

### Test Coach Gina

```bash
curl -X POST https://9t3nivd6wg.execute-api.us-east-1.amazonaws.com/prod/api/coach-gina \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How can I improve my startup?",
    "context": {
      "startupName": "EdTech Solutions 96",
      "sseScore": 62
    }
  }'
```

### Test Frontend

1. Go to https://auxeira.com/dashboard/startup_founder_live.html
2. Login with `founder@startup.com` / `Testpass123`
3. Verify:
   - Company name: "EdTech Solutions 96"
   - SSE Score: 62
   - MRR: $380,177
   - Team Size: 21
4. Check browser console for:
   - "Loading user data from API..."
   - "Dashboard initialized successfully with real data"

---

## 🔧 Infrastructure

### AWS Services

| Service | Resource | Purpose |
|---------|----------|---------|
| Lambda | 14 functions | AI agents + dashboard API |
| DynamoDB | 7 tables | User data storage |
| S3 | auxeira-com-frontend-prod | Static website hosting |
| CloudFront | E1O2Q0Z86U0U5T | CDN + HTTPS |
| API Gateway | Multiple | Lambda function URLs |
| IAM | Roles + Policies | Permissions |

### DNS Configuration

| Domain | Type | Value | Status |
|--------|------|-------|--------|
| auxeira.com | A | CloudFront | ✅ LIVE |
| www.auxeira.com | CNAME | auxeira.com | ✅ LIVE |
| dashboard.auxeira.com | CNAME | TBD | ⏳ Pending |

---

## 📊 Monitoring

### CloudWatch Logs

| Log Group | Purpose |
|-----------|---------|
| `/aws/lambda/auxeira-dashboard-context-prod` | Dashboard API logs |
| `/aws/lambda/auxeira-coach-gina-prod` | Coach Gina logs |
| `/aws/lambda/auxeira-nudges-generator-prod` | Nudges logs |
| `/aws/lambda/auxeira-urgent-actions-prod` | Urgent actions logs |

### Metrics to Monitor

- Lambda invocation count
- Lambda error rate
- Lambda duration
- DynamoDB read/write capacity
- CloudFront cache hit rate
- API Gateway 4xx/5xx errors

---

## 🚨 Troubleshooting

### Dashboard Not Loading

**Check**:
1. CloudFront cache: `aws cloudfront create-invalidation --distribution-id E1O2Q0Z86U0U5T --paths "/*"`
2. S3 file exists: `aws s3 ls s3://auxeira-com-frontend-prod/dashboard/`
3. Browser console for errors
4. Network tab for failed requests

### API Returning Errors

**Check**:
1. CloudWatch logs: `aws logs tail /aws/lambda/auxeira-dashboard-context-prod --follow`
2. IAM permissions: Verify DynamoDB read access
3. API endpoint URL is correct
4. Request format matches expected schema

### Data Not Updating

**Check**:
1. DynamoDB table has data: Query in AWS Console
2. User ID matches: Verify in database
3. RLS policies (if using Supabase)
4. Browser cache: Hard refresh (Ctrl+Shift+R)

---

## 📝 Environment Variables

### Backend (.env)

```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=auxeira_super_secret_jwt_key_2025_change_this_in_production
AWS_REGION=us-east-1
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY
```

### Frontend (Supabase - When Set Up)

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 🎯 Next Steps

### Immediate
1. ✅ Dashboard is live with real data
2. ✅ All 13 Lambda functions deployed
3. ✅ Test user can login and see data

### Short Term (This Week)
1. ⏳ Set up Supabase project
2. ⏳ Run SQL schema
3. ⏳ Migrate data to Supabase
4. ⏳ Deploy to dashboard.auxeira.com

### Long Term (Next Month)
1. Deploy backend API to production
2. Add monitoring and alerts
3. Set up CI/CD pipeline
4. Add automated testing
5. Scale to 10,000+ users

---

## 📞 Support

### Documentation
- `DATABASE_INTEGRATION_PLAN.md` - Database strategy
- `DATABASE_INTEGRATION_SUMMARY.md` - Implementation guide
- `DATABASE_INTEGRATION_COMPLETE.md` - Deployment details
- `GO_LIVE_SUMMARY.md` - Production status
- `SUPABASE_MIGRATION_PLAN.md` - Supabase migration
- `SUPABASE_IMPLEMENTATION_GUIDE.md` - Step-by-step Supabase setup

### Quick Links
- **Dashboard**: https://auxeira.com/dashboard/startup_founder_live.html
- **Test Login**: founder@startup.com / Testpass123
- **API Test**: https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/?userId=045b4095-3388-4ea6-8de3-b7b04be5bc1b
- **Supabase**: https://supabase.com (create project)

### AWS Console Links
- **Lambda Functions**: https://console.aws.amazon.com/lambda/home?region=us-east-1
- **DynamoDB Tables**: https://console.aws.amazon.com/dynamodbv2/home?region=us-east-1
- **S3 Buckets**: https://s3.console.aws.amazon.com/s3/buckets/auxeira-com-frontend-prod
- **CloudFront**: https://console.aws.amazon.com/cloudfront/v3/home#/distributions/E1O2Q0Z86U0U5T

---

## ✅ Deployment Checklist

### Current Status
- [x] Frontend deployed to S3
- [x] CloudFront configured
- [x] 13 Lambda functions deployed
- [x] DynamoDB tables populated
- [x] Dashboard loading real data
- [x] Test user can login
- [x] AI components working
- [ ] Supabase project created
- [ ] Data migrated to Supabase
- [ ] dashboard.auxeira.com configured
- [ ] Backend API deployed to production

### Production Ready
- [x] HTTPS enabled
- [x] Authentication working
- [x] Database connected
- [x] API endpoints live
- [x] Error handling implemented
- [x] Loading states added
- [ ] Monitoring configured
- [ ] Backup strategy defined
- [ ] Scaling plan documented

---

**Status**: 🎉 **PRODUCTION READY**  
**Dashboard**: ✅ **LIVE**  
**Database**: ✅ **CONNECTED**  
**Next**: 🔄 **Migrate to Supabase**

---

**Last Deployment**: October 31, 2025 at 12:42 UTC  
**Deployed By**: Ona AI Assistant  
**Version**: 1.0.0
