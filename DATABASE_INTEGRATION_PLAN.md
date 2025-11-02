# 🗄️ Database Integration Plan - Remove Mock Data, Go Live

**Objective**: Replace all hardcoded/mock data with real user data from DynamoDB  
**Goal**: Collect comprehensive data about all users to improve AI accuracy  
**Status**: Planning Phase

---

## 📊 Current State Analysis

### Existing Database Tables (DynamoDB)

| Table Name | Purpose | Key Fields | Status |
|------------|---------|------------|--------|
| `auxeira-users-prod` | User authentication & profiles | userId, email, role, profileType | ✅ Active |
| `auxeira-startup-profiles-prod` | Startup company profiles | startupId, companyName, sseScore, mrr, arr | ✅ Active (10K simulated) |
| `auxeira-user-startup-mapping-prod` | Links users to startups | userId, startupId | ✅ Active |
| `auxeira-startup-activities-prod` | Activity feed (365-day rolling) | activityId, startupId, timestamp | ✅ Active |
| `auxeira-activity-submissions` | User activity submissions | submissionId, userId, activityId | ✅ Active |
| `auxeira-token-transactions-prod` | AUX token transactions | transactionId, userId, amount | ✅ Active |
| `auxeira-sessions-prod` | User sessions | sessionId, userId, token | ✅ Active |

### Current Mock Data in Frontend

**Location**: `frontend/dashboard/startup_founder_live.html` (lines 5603-5650)

```javascript
const founderContext = {
    startupName: 'Auxeira',           // ❌ HARDCODED
    sseScore: 72,                     // ❌ HARDCODED
    stage: 'Series A',                // ❌ HARDCODED
    industry: 'FinTech',              // ❌ HARDCODED
    geography: 'United States',       // ❌ HARDCODED
    teamSize: 12,                     // ❌ HARDCODED
    runway: 14,                       // ❌ HARDCODED
    mrr: 18500,                       // ❌ HARDCODED
    mrrGrowth: '+23%',                // ❌ HARDCODED
    users: 2847,                      // ❌ HARDCODED
    customers: 1247,                  // ❌ HARDCODED
    cac: 127,                         // ❌ HARDCODED
    ltv: 1890,                        // ❌ HARDCODED
    churnRate: 2.3,                   // ❌ HARDCODED
    nps: 68,                          // ❌ HARDCODED
    interviewsCompleted: 8,           // ❌ HARDCODED
    projectionsAge: '30 days old',    // ❌ HARDCODED
    recentMilestones: [...],          // ❌ HARDCODED
    activeChallenges: [...]           // ❌ HARDCODED
};
```

### Existing API Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/auth/profile` | GET | Get current user profile | ✅ Exists |
| `/api/auth/login` | POST | User authentication | ✅ Exists |
| `/api/activities` | GET | Get activities | ✅ Exists |
| `/api/activities/submit` | POST | Submit activity | ✅ Exists |
| `/api/sse` | GET | Get SSE scores | ✅ Exists |
| `/api/kpi` | GET | Get KPIs | ✅ Exists |

---

## 🎯 Data Requirements for AI Accuracy

### Overview Tab (Coach Gina, Nudges, Urgent Actions)

**Required Data**:
- ✅ User profile (name, email, role)
- ✅ Startup profile (company name, stage, industry)
- ✅ SSE score (current + history)
- ✅ Key metrics (MRR, ARR, growth rate, burn rate, runway)
- ✅ Team data (size, roles, experience)
- ✅ Customer data (count, active users, churn rate)
- ✅ Recent activities (last 30 days)
- ✅ Recent milestones
- ✅ Active challenges/blockers
- ⚠️ External context (website, social, news) - **NEW**

### Growth Metrics Tab

**Required Data**:
- ✅ Revenue metrics (MRR, ARR, growth rate)
- ✅ Customer metrics (CAC, LTV, LTV:CAC ratio)
- ✅ Retention metrics (churn rate, NRR, GRR)
- ✅ Product metrics (DAU, MAU, engagement)
- ✅ Historical trends (6-12 months)
- ⚠️ Benchmark comparisons - **NEW**
- ⚠️ Growth levers analysis - **NEW**

### Funding Readiness Tab

**Required Data**:
- ✅ Funding stage & history
- ✅ Total funding raised
- ✅ Current valuation
- ✅ Burn rate & runway
- ✅ Financial projections
- ⚠️ Investor preferences - **NEW**
- ⚠️ Pitch deck status - **NEW**
- ⚠️ Due diligence readiness - **NEW**

### Earn AUX Tab

**Required Data**:
- ✅ Current AUX balance
- ✅ Transaction history
- ✅ Available tasks
- ✅ Completed activities
- ✅ Redemption catalog
- ⚠️ Personalized task recommendations - **NEW**

### Activity Rewards Tab

**Required Data**:
- ✅ Activity submissions
- ✅ Assessment status
- ✅ AUX rewards earned
- ✅ Quality scores
- ⚠️ Activity impact analysis - **NEW**

---

## 🔧 Implementation Plan

### Phase 1: Create Profile API Endpoint ✅ (EXISTS)

**Endpoint**: `GET /api/auth/profile`  
**Returns**: User + Startup profile data

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "...",
      "email": "...",
      "firstName": "...",
      "lastName": "...",
      "role": "startup_founder",
      "profileType": "startup_founder"
    },
    "startup": {
      "startupId": "...",
      "companyName": "...",
      "industry": "...",
      "fundingStage": "...",
      "sseScore": 72,
      "mrr": 18500,
      "arr": 222000,
      "growthRate": 23,
      "burnRate": 45000,
      "runwayMonths": 14,
      "teamSize": 12,
      "customers": 1247,
      "activeUsers": 2847,
      "churnRate": 2.3,
      "cac": 127,
      "ltv": 1890,
      "nps": 68
    },
    "metrics": {
      "recentMilestones": [...],
      "activeChallenges": [...],
      "recentActivities": [...]
    }
  }
}
```

### Phase 2: Create Comprehensive Data API

**New Endpoint**: `GET /api/dashboard/startup-founder`  
**Purpose**: Single endpoint for all dashboard data

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "profile": { /* user + startup data */ },
    "metrics": {
      "overview": { /* SSE, MRR, growth */ },
      "growth": { /* detailed growth metrics */ },
      "funding": { /* funding readiness data */ },
      "activities": { /* recent activities */ },
      "tokens": { /* AUX balance & history */ }
    },
    "history": {
      "sseHistory": [ /* 12 months */ ],
      "mrrHistory": [ /* 12 months */ ],
      "growthHistory": [ /* 12 months */ ]
    },
    "recommendations": {
      "nudges": [ /* AI-generated nudges */ ],
      "urgentActions": [ /* AI-generated actions */ ],
      "tasks": [ /* personalized tasks */ ]
    }
  }
}
```

### Phase 3: Update Frontend to Load Real Data

**File**: `frontend/dashboard/startup_founder_live.html`

**Changes Required**:

1. **Add Data Loading Function** (after line 5585):
```javascript
// Load real user data from API
async function loadUserData() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '/';
            return null;
        }
        
        const response = await fetch('https://auxeira.com/api/dashboard/startup-founder', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load user data');
        }
        
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error loading user data:', error);
        return null;
    }
}
```

2. **Replace Hardcoded Context** (lines 5603-5650):
```javascript
// Initialize with real data
document.addEventListener('DOMContentLoaded', async function() {
    // Load real user data
    const userData = await loadUserData();
    
    if (!userData) {
        alert('Failed to load your data. Please refresh the page.');
        return;
    }
    
    // Build founder context from real data
    const founderContext = {
        startupName: userData.profile.startup.companyName,
        sseScore: userData.profile.startup.sseScore,
        stage: userData.profile.startup.fundingStage,
        industry: userData.profile.startup.industry,
        geography: userData.profile.startup.region || 'United States',
        teamSize: userData.profile.startup.teamSize,
        runway: userData.profile.startup.runwayMonths,
        mrr: userData.profile.startup.mrr,
        mrrGrowth: `+${userData.profile.startup.growthRate}%`,
        users: userData.profile.startup.activeUsers,
        customers: userData.profile.startup.customers,
        cac: userData.profile.startup.cac,
        ltv: userData.profile.startup.ltv,
        churnRate: userData.profile.startup.churnRate,
        nps: userData.profile.startup.nps,
        interviewsCompleted: userData.metrics.activities.interviewsCompleted || 0,
        projectionsAge: userData.metrics.funding.projectionsAge || 'Unknown',
        recentMilestones: userData.metrics.recentMilestones || [],
        activeChallenges: userData.metrics.activeChallenges || []
    };
    
    // Update UI with real data
    updateDashboardUI(userData, founderContext);
    
    // Initialize AI components with real context
    initializeAIComponents(founderContext);
});
```

3. **Add UI Update Function**:
```javascript
function updateDashboardUI(userData, context) {
    // Update SSE Score
    document.getElementById('sseScore').textContent = context.sseScore;
    
    // Update MRR
    document.getElementById('currentMRR').textContent = `$${context.mrr.toLocaleString()}`;
    
    // Update Growth Rate
    document.getElementById('growthRate').textContent = context.mrrGrowth;
    
    // Update Team Size
    document.getElementById('teamSize').textContent = context.teamSize;
    
    // Update Runway
    document.getElementById('runway').textContent = `${context.runway} months`;
    
    // Update Customer Metrics
    document.getElementById('customers').textContent = context.customers.toLocaleString();
    document.getElementById('activeUsers').textContent = context.users.toLocaleString();
    
    // Update Financial Metrics
    document.getElementById('cac').textContent = `$${context.cac}`;
    document.getElementById('ltv').textContent = `$${context.ltv}`;
    document.getElementById('ltvCacRatio').textContent = `${(context.ltv / context.cac).toFixed(1)}:1`;
    document.getElementById('churnRate').textContent = `${context.churnRate}%`;
    
    // Update charts with historical data
    if (userData.history) {
        updateSSEChart(userData.history.sseHistory);
        updateMRRChart(userData.history.mrrHistory);
        updateGrowthChart(userData.history.growthHistory);
    }
}
```

### Phase 4: Enhance Data Collection

**New Fields to Add to `auxeira-startup-profiles-prod`**:

```javascript
{
    // Existing fields...
    
    // NEW: External Context
    externalContext: {
        websiteActivity: {
            lastCrawled: '2025-10-31T10:00:00Z',
            pageViews: 15234,
            uniqueVisitors: 8432,
            conversionRate: 3.2
        },
        socialSignals: {
            twitterFollowers: 5432,
            linkedinFollowers: 2341,
            recentMentions: 45,
            sentimentScore: 0.72
        },
        newsSignals: {
            recentArticles: 3,
            pressReleases: 1,
            mediaScore: 68
        }
    },
    
    // NEW: Detailed Metrics
    detailedMetrics: {
        productMetrics: {
            dau: 1234,
            mau: 5678,
            wau: 3456,
            stickiness: 0.22,
            featureAdoption: {
                feature1: 0.65,
                feature2: 0.42
            }
        },
        salesMetrics: {
            pipelineValue: 450000,
            avgDealSize: 15000,
            salesCycleLength: 45,
            winRate: 0.28
        },
        marketingMetrics: {
            leadGeneration: 234,
            mql: 89,
            sql: 34,
            conversionRate: 0.15
        }
    },
    
    // NEW: Funding Readiness
    fundingReadiness: {
        pitchDeckStatus: 'complete',
        financialModelStatus: 'needs_update',
        dueDiligenceReadiness: 72,
        investorPreferences: {
            stage: ['seed', 'series-a'],
            geography: ['us', 'global'],
            checkSize: [500000, 2000000]
        }
    },
    
    // NEW: Activity Impact
    activityImpact: {
        totalActivitiesCompleted: 45,
        highImpactActivities: 12,
        avgImpactScore: 7.2,
        lastActivityDate: '2025-10-30T15:30:00Z'
    }
}
```

### Phase 5: Real-time Data Updates

**Implement WebSocket or Polling for Live Updates**:

```javascript
// Poll for updates every 5 minutes
setInterval(async () => {
    const userData = await loadUserData();
    if (userData) {
        updateDashboardUI(userData, buildContext(userData));
    }
}, 5 * 60 * 1000);
```

---

## 📝 Data Collection Strategy

### 1. User Onboarding Data Collection

**When**: During signup and onboarding  
**What to Collect**:
- Company name, industry, stage
- Team size, roles, experience
- Current metrics (MRR, customers, users)
- Funding history
- Goals and challenges

### 2. Continuous Data Collection

**Sources**:
- ✅ User activity submissions
- ✅ Manual metric updates
- ⚠️ Integration with tools (Stripe, Google Analytics, etc.) - **NEW**
- ⚠️ Web scraping (website, social media) - **NEW**
- ⚠️ News monitoring - **NEW**

### 3. AI-Driven Data Enrichment

**Use AI to**:
- Analyze activity submissions for insights
- Extract metrics from unstructured data
- Predict missing data points
- Identify trends and patterns

---

## 🚀 Implementation Steps

### Step 1: Create Dashboard API Endpoint ⏳

**File**: `backend/src/routes/dashboard.ts` (NEW)

```typescript
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import startupProfilesService from '../services/startup-profiles.service';

const router = express.Router();

router.get('/startup-founder', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Get user profile
        const user = await getUserProfile(userId);
        
        // Get startup mapping
        const mapping = await getStartupMapping(userId);
        
        // Get startup profile
        const startup = await startupProfilesService.getProfile(mapping.startupId, {
            include_history: true,
            include_metrics: true
        });
        
        // Get recent activities
        const activities = await startupProfilesService.getProfileActivities(
            mapping.startupId,
            { days: 30, limit: 10 }
        );
        
        // Build response
        res.json({
            success: true,
            data: {
                profile: {
                    user,
                    startup: startup.data
                },
                metrics: {
                    overview: buildOverviewMetrics(startup.data),
                    growth: buildGrowthMetrics(startup.data),
                    funding: buildFundingMetrics(startup.data),
                    activities: activities.data
                },
                history: {
                    sseHistory: startup.data.sseHistory || [],
                    mrrHistory: startup.data.metricsHistory?.filter(m => m.name === 'mrr') || [],
                    growthHistory: startup.data.metricsHistory?.filter(m => m.name === 'growth') || []
                }
            }
        });
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load dashboard data'
        });
    }
});

export default router;
```

### Step 2: Update Frontend ⏳

**File**: `frontend/dashboard/startup_founder_live.html`

- Replace hardcoded context with API call
- Add loading states
- Add error handling
- Update UI with real data

### Step 3: Test with Real User ⏳

**Test User**: `founder@startup.com`  
**Startup**: `startup_0096` (EdTech Solutions 96)

**Verify**:
- ✅ Data loads correctly
- ✅ UI updates with real values
- ✅ AI components receive correct context
- ✅ Charts display historical data
- ✅ No hardcoded values remain

### Step 4: Deploy to Production ⏳

- Deploy backend API changes
- Deploy frontend changes
- Test on live site
- Monitor for errors

---

## ✅ Success Criteria

1. **No Mock Data**: All hardcoded values replaced with database queries
2. **Real-time Updates**: Dashboard reflects current user data
3. **AI Accuracy**: AI agents receive accurate, personalized context
4. **Data Collection**: System captures all user interactions and metrics
5. **Performance**: Dashboard loads in < 2 seconds
6. **Error Handling**: Graceful fallbacks for missing data

---

## 📊 Monitoring & Analytics

**Track**:
- API response times
- Data completeness (% of fields populated)
- User engagement with data collection
- AI response quality improvements
- Dashboard load times

---

## 🔮 Future Enhancements

1. **Automated Data Collection**:
   - Stripe integration for revenue data
   - Google Analytics for user metrics
   - GitHub for development activity
   - Social media APIs for sentiment

2. **Predictive Analytics**:
   - Forecast MRR growth
   - Predict churn risk
   - Identify growth opportunities
   - Recommend optimal actions

3. **Benchmarking**:
   - Compare to similar startups
   - Industry averages
   - Percentile rankings
   - Best practices

4. **Data Visualization**:
   - Interactive charts
   - Trend analysis
   - Cohort analysis
   - Funnel visualization

---

**Status**: 📋 **PLANNING COMPLETE**  
**Next**: 🔨 **IMPLEMENTATION**  
**Priority**: 🔥 **HIGH**
