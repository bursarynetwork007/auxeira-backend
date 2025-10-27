# Activity Rewards System - Deployment Checklist

## Pre-Deployment

- [x] Backend API routes implemented (`activity-rewards.ts`)
- [x] Database migration created (`005_activity_rewards.sql`)
- [x] Frontend dashboard updated with Activity Rewards tab
- [x] API client library created (`activity-rewards-api-client.js`)
- [x] Documentation completed
- [ ] Database migration executed
- [ ] Backend server tested locally
- [ ] API endpoints tested with Postman/curl

## Database Setup

### Step 1: Verify Database Connection

```bash
# Check if PostgreSQL is running
psql -U postgres -d auxeira_central -c "SELECT version();"
```

### Step 2: Run Migration

```bash
cd /workspaces/auxeira-backend/backend
node run-migration.js
```

**Expected Output:**
```
🚀 Starting Activity Rewards migration...
📄 Migration file loaded
🔄 Transaction started
✅ Migration executed successfully
✅ Transaction committed
📊 Created tables:
   ✓ activities
   ✓ activity_submissions
   ✓ token_balances
   ✓ token_transactions
📝 Seeded 25 activities
🎉 Migration completed successfully!
```

### Step 3: Verify Tables

```bash
psql -U postgres -d auxeira_central -c "\dt"
```

Should show:
- activities
- activity_submissions
- token_transactions
- token_balances

## Backend Deployment

### Step 1: Install Dependencies

```bash
cd /workspaces/auxeira-backend/backend
npm install
```

### Step 2: Configure Environment

Verify `.env` file has:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auxeira_central
DB_USER=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=your_jwt_secret_here
PORT=3000
NODE_ENV=development
```

### Step 3: Start Server

```bash
npm start
```

**Expected Output:**
```
🚀 Auxeira SSE Backend Starting...
✅ Database connected
✅ Redis connected
🌐 Server running on port 3000
📚 API Documentation: http://localhost:3000/api/docs
```

### Step 4: Test Health Endpoint

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Auxeira SSE Backend is healthy",
  "features": {
    "activityRewards": true
  }
}
```

## API Testing

### Test 1: Get Activities

```bash
# First, login to get JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Save the token from response
TOKEN="your_jwt_token_here"

# Get activities
curl http://localhost:3000/api/activities \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** JSON with 25 activities

### Test 2: Submit Activity

```bash
curl -X POST http://localhost:3000/api/activities/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_id": 1,
    "proof_text": "Conducted 5 customer interviews with detailed notes. Key insights: customers struggle with onboarding complexity. Documented pain points and validated our solution hypothesis. Each interview lasted 30-45 minutes and covered key questions about their current workflow, pain points, and willingness to pay for a solution.",
    "proof_urls": ["https://example.com/interview-notes.pdf"]
  }'
```

**Expected:** Submission created with UUID

### Test 3: Calculate Tokens

```bash
# Use submission_id from previous response
SUBMISSION_ID="your_submission_uuid_here"

curl -X POST http://localhost:3000/api/activities/calculate-tokens \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id": "'$SUBMISSION_ID'",
    "quality_score": 0.9,
    "consistency_weeks": 4
  }'
```

**Expected:** Tokens calculated and awarded

### Test 4: Get History

```bash
curl http://localhost:3000/api/activities/history \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** Activity history with totals

## Frontend Deployment

### Step 1: Verify Dashboard

Dashboard is already deployed to:
- **URL:** https://dashboard.auxeira.com/startup_founder.html
- **S3:** s3://auxeira-dashboards-jsx-1759943238/startup_founder.html

### Step 2: Test Dashboard

1. Open: https://dashboard.auxeira.com/startup_founder.html
2. Login with test credentials
3. Navigate to "Activity Rewards" tab
4. Verify three sub-tabs load:
   - Submit Activity
   - Assess Submissions
   - Activity History

### Step 3: Update API Endpoint (if needed)

If backend is deployed to a different URL, update the API endpoint in the dashboard:

```javascript
// In startup_founder.html, find and update:
const API_BASE_URL = 'https://api.auxeira.com'; // Update this
```

## Production Deployment

### Backend (Railway/Heroku/AWS)

1. **Set Environment Variables:**
   ```
   DB_HOST=production-db-host
   DB_PORT=5432
   DB_NAME=auxeira_central
   DB_USER=postgres
   DB_PASSWORD=secure_password
   JWT_SECRET=secure_jwt_secret
   NODE_ENV=production
   PORT=3000
   ```

2. **Deploy:**
   ```bash
   # Railway
   railway up

   # Heroku
   git push heroku main

   # AWS (using Docker)
   docker build -t auxeira-backend .
   docker push your-registry/auxeira-backend
   ```

3. **Run Migration:**
   ```bash
   # SSH into production server
   node run-migration.js
   ```

### Frontend (CloudFront)

Already deployed. To update:

```bash
aws s3 cp startup_founder.html s3://auxeira-dashboards-jsx-1759943238/startup_founder.html --content-type "text/html"
aws cloudfront create-invalidation --distribution-id E1L1Q8VK3LAEFC --paths "/startup_founder.html"
```

## Post-Deployment Verification

### 1. Database Check

```sql
-- Check activities count
SELECT COUNT(*) FROM activities;
-- Expected: 25

-- Check submissions
SELECT COUNT(*) FROM activity_submissions;

-- Check token balances
SELECT * FROM token_balances LIMIT 5;
```

### 2. API Health

```bash
curl https://api.auxeira.com/health
```

### 3. Frontend Check

- [ ] Dashboard loads without errors
- [ ] Activity Rewards tab is visible
- [ ] Activities load in Submit Activity tab
- [ ] Submission form works
- [ ] History displays correctly

## Monitoring

### Logs to Monitor

1. **API Errors:**
   ```bash
   tail -f logs/error.log | grep "activity"
   ```

2. **Database Performance:**
   ```sql
   SELECT * FROM pg_stat_activity WHERE query LIKE '%activity%';
   ```

3. **Token Calculations:**
   ```sql
   SELECT 
     COUNT(*) as total_submissions,
     AVG(tokens_awarded) as avg_tokens,
     SUM(tokens_awarded) as total_tokens
   FROM activity_submissions
   WHERE status = 'approved';
   ```

## Rollback Plan

If issues occur:

1. **Rollback Database:**
   ```sql
   DROP TABLE IF EXISTS token_balances CASCADE;
   DROP TABLE IF EXISTS token_transactions CASCADE;
   DROP TABLE IF EXISTS activity_submissions CASCADE;
   DROP TABLE IF EXISTS activities CASCADE;
   ```

2. **Rollback Backend:**
   ```bash
   git revert HEAD
   git push
   ```

3. **Rollback Frontend:**
   ```bash
   # Restore previous version from S3
   aws s3 cp s3://auxeira-dashboards-jsx-1759943238/startup_founder.html.backup startup_founder.html
   aws s3 cp startup_founder.html s3://auxeira-dashboards-jsx-1759943238/startup_founder.html
   ```

## Success Criteria

- [x] All 25 activities seeded in database
- [ ] API endpoints return 200 status codes
- [ ] Token calculation matches algorithm
- [ ] Frontend displays activities correctly
- [ ] Submissions can be created
- [ ] Tokens are awarded correctly
- [ ] History displays all activities

## Next Steps After Deployment

1. **Implement AI Assessment**
   - Integrate Claude API
   - Process proof text
   - Generate quality scores

2. **Add Admin Interface**
   - Manual assessment UI
   - Override capabilities
   - Fraud detection

3. **Monitor & Optimize**
   - Track API performance
   - Optimize database queries
   - Add caching layer

## Support

For issues or questions:
- Documentation: `ACTIVITY_REWARDS_API.md`
- Implementation: `ACTIVITY_REWARDS_IMPLEMENTATION.md`
- Code: `backend/src/routes/activity-rewards.ts`

---

**Last Updated:** 2025-10-27
**Version:** 1.0.0
