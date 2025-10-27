# Activity Rewards - Complete Workflow Integration ✅

## Overview

The complete Activity Rewards workflow has been integrated with backend API, Claude AI assessment, and token calculation. The system now supports the full 5-step workflow from submission to token award.

## Workflow Implementation

### Step 1: Nudge/Selection ✅
**UI Component:** Activity Feed / Planner Dashboard
**Backend Action:** `GET /api/activities` - Fetch list of activities filtered by startup stage
**Output:** Display personalized list of 25 high-impact activities

### Step 2: Submission ✅
**UI Component:** Activity Submission Modal/Form
**Backend Action:** `POST /api/activities/submit` - Upload proof, validate data
**Output:** Temporary submission ID with "pending" status

### Step 3: Assessment ✅
**UI Component:** "Pending Review" Status
**Backend Action:** Claude AI Agent processes proof, generates quality_score (0.0-1.0)
**Output:** quality_score, feedback, strengths, improvements, consistency_weeks

### Step 4: Calculation ✅
**UI Component:** "Processing" Status
**Backend Action:** Token calculation using EconomicsCalc algorithm
**Formula:** `final_tokens = base_tokens × quality_bonus × stage_multiplier × consistency_bonus`
**Output:** final_tokens and detailed breakdown

### Step 5: Award/Display ✅
**UI Component:** Token Wallet / Activity History
**Backend Action:** Update token balance in database
**Output:** Display "Activity Complete" with awarded tokens

## Technical Implementation

### Backend Services

#### 1. AI Assessment Service (`ai-assessment.service.ts`)
```typescript
// Uses Claude 3.5 Sonnet for assessment
const assessment = await assessActivitySubmission(
  proofText,
  proofUrls,
  activityContext
);

// Returns:
{
  quality_score: 0.85,
  feedback: "Excellent execution...",
  strengths: ["..."],
  improvements: ["..."],
  consistency_weeks: 4
}
```

#### 2. Activity Rewards Routes (`activity-rewards.ts`)
- `GET /api/activities` - Get activity catalog
- `POST /api/activities/submit` - Submit activity
- `GET /api/activities/submissions` - Get user submissions
- `GET /api/activities/history` - Get activity history
- Auto-triggers AI assessment on submission
- Auto-calculates and awards tokens after assessment

#### 3. Token Calculation
```typescript
// Stage multipliers - INVERTED: larger startups get MORE tokens
// Rationale: Same activity is more meaningful/impactful for larger organizations
pre-seed: 0.6x
seed: 0.7x
series-a: 0.9x
series-b: 1.1x
series-c: 1.3x
growth: 1.4x
late-stage: 1.5x

// Quality bonus
< 0.7: 1.0x
0.7-0.85: 1.2x
≥ 0.85: 1.5x

// Consistency bonus
4 weeks: 1.0x
8 weeks: 1.1x
12 weeks: 1.25x
24 weeks: 1.5x
52 weeks: 2.0x
```

### Frontend Integration

#### API Client (`ACTIVITY_API`)
```javascript
// Submit activity
const result = await ACTIVITY_API.submitActivity(
  activityId,
  proofText,
  proofUrls
);

// Get submissions
const submissions = await ACTIVITY_API.getSubmissions('pending');

// Get history
const history = await ACTIVITY_API.getHistory();
```

#### Automatic Updates
- Submissions load automatically when switching to "Assess Submissions" tab
- History loads automatically when switching to "Activity History" tab
- Real-time status updates from backend

## Database Schema

### Tables Created
1. **activities** - 25 activities with descriptions, nudges, base tokens
2. **activity_submissions** - User submissions with proof, status, scores
3. **token_transactions** - All token movements (earn, spend, transfer)
4. **token_balances** - Current balance per user/startup

### Migration
Run: `node run-migration.js` or execute `005_activity_rewards.sql`

## Configuration

### Environment Variables

```env
# Claude AI
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auxeira_central
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT
JWT_SECRET=your_jwt_secret_here
```

### Frontend API URL

Update in dashboard JavaScript:
```javascript
const ACTIVITY_API = {
    baseURL: 'https://api.auxeira.com', // Production URL
    token: localStorage.getItem('authToken'),
    // ...
};
```

## Deployment Steps

### 1. Deploy Backend

```bash
cd /workspaces/auxeira-backend/backend

# Install dependencies
npm install

# Run database migration
node run-migration.js

# Start server
npm start
```

### 2. Deploy Frontend

```bash
# Upload dashboard
aws s3 cp dashboard-with-api.html s3://auxeira-dashboards-jsx-1759943238/startup_founder.html \
  --content-type "text/html" \
  --cache-control "no-cache, no-store, must-revalidate"

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id E1L1Q8VK3LAEFC \
  --paths "/startup_founder.html"
```

## Testing the Workflow

### Test Submission
1. Open dashboard: https://dashboard.auxeira.com/startup_founder.html
2. Navigate to Activity Rewards tab
3. Click on an activity (e.g., "Customer Interviews Conducted")
4. Fill in proof text (minimum 50 characters)
5. Click "Submit Activity"
6. Check console for API response

### Test Assessment
1. Backend automatically triggers Claude AI assessment
2. Check backend logs: `AI assessment completed: quality_score=0.85`
3. Tokens calculated and awarded automatically
4. Status updates to "approved"

### Test History
1. Switch to "Activity History" tab
2. See completed activities with token totals
3. View quality scores and status

## API Endpoints

### GET /api/activities
Fetch activity catalog

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "activities": [...]
  }
}
```

### POST /api/activities/submit
Submit activity for assessment

**Request:**
```json
{
  "activity_id": 1,
  "proof_text": "Conducted 5 customer interviews...",
  "proof_urls": ["https://..."],
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "submission_id": "uuid",
    "status": "pending",
    "next_step": "AI assessment in progress"
  }
}
```

### GET /api/activities/submissions
Get user's submissions

**Query:** `?status=pending`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "submissions": [...]
  }
}
```

### GET /api/activities/history
Get activity history with totals

**Response:**
```json
{
  "success": true,
  "data": {
    "totals": {
      "total_tokens": 1250,
      "total_activities": 15,
      "approved": 12,
      "pending": 3
    },
    "activities": [...]
  }
}
```

## Files Created/Modified

### Backend
- ✅ `/backend/src/services/ai-assessment.service.ts` - Claude AI integration
- ✅ `/backend/src/routes/activity-rewards.ts` - API routes with AI trigger
- ✅ `/backend/src/database/migrations/005_activity_rewards.sql` - Database schema
- ✅ `/backend/package.json` - Added @anthropic-ai/sdk

### Frontend
- ✅ `/workspaces/auxeira-backend/dashboard-with-api.html` - Integrated dashboard
- ✅ API client code added to Activity Rewards Scripts section
- ✅ Auto-loading of submissions and history

### Documentation
- ✅ `ACTIVITY_REWARDS_API.md` - API reference
- ✅ `ACTIVITY_REWARDS_IMPLEMENTATION.md` - Implementation guide
- ✅ `ACTIVITY_REWARDS_COMPLETE_WORKFLOW.md` - This file

## Monitoring & Logs

### Backend Logs
```bash
# Watch logs
tail -f logs/app.log | grep "activity"

# Key log messages
"AI assessment completed: quality_score=0.85"
"Tokens calculated and awarded for submission {id}"
"Awarded {tokens} tokens for submission {id}"
```

### Frontend Console
```javascript
// Enable debug logging
localStorage.setItem('debug', 'true');

// Check API calls
console.log('API Response:', result);
```

## Troubleshooting

### Issue: AI Assessment Fails
**Solution:** Check ANTHROPIC_API_KEY is set correctly

### Issue: Tokens Not Awarded
**Solution:** Check database migration ran successfully

### Issue: Frontend Can't Connect
**Solution:** Update ACTIVITY_API.baseURL to correct backend URL

### Issue: CORS Errors
**Solution:** Add frontend domain to backend CORS whitelist

## Next Steps

1. **File Upload to S3** - Implement proof file upload
2. **Real-time Updates** - Add WebSocket for live status updates
3. **Admin Dashboard** - Build admin interface for manual review
4. **Analytics** - Track submission rates, quality scores, token distribution
5. **Notifications** - Email/push notifications for assessment completion

## Success Metrics

- ✅ Complete 5-step workflow implemented
- ✅ Claude AI assessment integrated
- ✅ Token calculation automated
- ✅ Frontend-backend integration complete
- ✅ Database schema deployed
- ✅ API endpoints functional
- ✅ Documentation complete

## Support

For issues or questions:
- Backend API: `ACTIVITY_REWARDS_API.md`
- Implementation: `ACTIVITY_REWARDS_IMPLEMENTATION.md`
- Deployment: `DEPLOYMENT_CHECKLIST.md`

---

**Status:** ✅ Complete and ready for deployment
**Last Updated:** 2025-10-27
**Version:** 1.0.0
