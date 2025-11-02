# 🔄 Supabase Migration Plan - Replace Mocks with Live Data

**Objective**: Migrate from DynamoDB + mocks to Supabase for `dashboard.auxeira.com/startup_founder.html`  
**Status**: Planning Phase  
**Date**: October 31, 2025

---

## 📋 Current State

### What We Have
- ✅ DynamoDB tables with 10,000 simulated startups
- ✅ Lambda function returning real data
- ✅ Frontend loading from Lambda API
- ❌ Not using Supabase yet
- ❌ Dashboard at wrong location (should be `dashboard.auxeira.com`)

### What You Want
- ✅ Supabase as primary database
- ✅ Dashboard at `dashboard.auxeira.com/startup_founder.html`
- ✅ Real-time data updates
- ✅ Row-level security
- ✅ Direct client-side queries (no Lambda)

---

## 🗄️ Supabase Schema Design

### Tables to Create

#### 1. `users` (Auth handled by Supabase Auth)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'startup_founder',
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);
```

#### 2. `startup_profiles`
```sql
CREATE TABLE startup_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  funding_stage TEXT,
  region TEXT,
  
  -- SSE & Success Metrics
  sse_score INTEGER DEFAULT 0,
  success_probability DECIMAL(5,3),
  
  -- Financial Metrics
  mrr INTEGER DEFAULT 0,
  arr INTEGER DEFAULT 0,
  growth_rate DECIMAL(5,2),
  burn_rate INTEGER DEFAULT 0,
  runway_months DECIMAL(5,1),
  total_funding INTEGER DEFAULT 0,
  
  -- Team Metrics
  team_size INTEGER DEFAULT 0,
  founder_experience DECIMAL(3,1),
  
  -- Customer Metrics
  customers INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  churn_rate DECIMAL(5,2),
  
  -- Unit Economics
  cac INTEGER DEFAULT 0,
  ltv INTEGER DEFAULT 0,
  ltv_cac_ratio DECIMAL(5,1),
  nps INTEGER DEFAULT 0,
  
  -- Activity Metrics
  total_activities_completed INTEGER DEFAULT 0,
  last_activity_date TIMESTAMPTZ,
  
  -- Token Balance
  token_balance INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE startup_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own startup
CREATE POLICY "Users can view own startup" ON startup_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own startup" ON startup_profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

#### 3. `startup_metrics` (Historical Data)
```sql
CREATE TABLE startup_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  startup_id UUID REFERENCES startup_profiles(id) ON DELETE CASCADE,
  
  -- Metric Details
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,2),
  metric_type TEXT, -- 'financial', 'customer', 'product', etc.
  
  -- Timestamp
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for fast queries
  INDEX idx_startup_metrics_user_date (user_id, recorded_at DESC),
  INDEX idx_startup_metrics_name (metric_name)
);

-- Enable RLS
ALTER TABLE startup_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metrics" ON startup_metrics
  FOR SELECT USING (auth.uid() = user_id);
```

#### 4. `activities`
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  startup_id UUID REFERENCES startup_profiles(id) ON DELETE CASCADE,
  
  activity_type TEXT NOT NULL,
  activity_title TEXT,
  activity_description TEXT,
  impact_score INTEGER DEFAULT 0,
  
  -- Timestamps
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities" ON activities
  FOR SELECT USING (auth.uid() = user_id);
```

#### 5. `investor_pool`
```sql
CREATE TABLE investor_pool (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT, -- 'VC Fund', 'Angel', 'Corporate VC'
  focus_areas TEXT[],
  check_size_min INTEGER,
  check_size_max INTEGER,
  stage_preference TEXT[],
  geography TEXT[],
  portfolio_companies TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public read access (no RLS needed for investor pool)
```

#### 6. `token_transactions`
```sql
CREATE TABLE token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  transaction_type TEXT NOT NULL, -- 'earn', 'redeem', 'bonus'
  amount INTEGER NOT NULL,
  description TEXT,
  activity_id UUID REFERENCES activities(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON token_transactions
  FOR SELECT USING (auth.uid() = user_id);
```

---

## 🔧 Supabase Client Setup

### 1. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 2. Create Supabase Client

**File**: `frontend/js/supabaseClient.js`

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 3. Environment Variables

**File**: `.env`

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📝 Migration Steps

### Step 1: Set Up Supabase Project

1. Go to https://supabase.com
2. Create new project
3. Copy Project URL and Anon Key
4. Run SQL schema (from above)
5. Enable Row Level Security

### Step 2: Migrate Data from DynamoDB to Supabase

**Script**: `scripts/migrate-dynamodb-to-supabase.js`

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { createClient } = require('@supabase/supabase-js');

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function migrateStartupProfiles() {
  console.log('Migrating startup profiles...');
  
  // Scan DynamoDB
  const result = await dynamodb.send(new ScanCommand({
    TableName: 'auxeira-startup-profiles-prod'
  }));
  
  const profiles = result.Items || [];
  console.log(`Found ${profiles.length} profiles to migrate`);
  
  // Insert into Supabase
  for (const profile of profiles) {
    const { data, error } = await supabase
      .from('startup_profiles')
      .insert({
        company_name: profile.companyName,
        industry: profile.industry || profile.sector,
        funding_stage: profile.fundingStage,
        region: profile.region,
        sse_score: profile.currentSSIScore || profile.sseScore || 0,
        mrr: profile.currentRevenue || profile.mrr || 0,
        arr: (profile.currentRevenue || profile.mrr || 0) * 12,
        growth_rate: profile.monthlyGrowthRate || profile.growthRate || 0,
        burn_rate: profile.burnRate || 0,
        runway_months: profile.runwayMonths || 0,
        total_funding: profile.totalFunding || 0,
        team_size: profile.teamSize || 0,
        customers: Math.floor((profile.currentUsers || 0) * 0.4),
        active_users: profile.currentUsers || 0,
        token_balance: profile.tokenBalance || 0
      });
    
    if (error) {
      console.error('Error inserting profile:', error);
    } else {
      console.log(`Migrated: ${profile.companyName}`);
    }
  }
  
  console.log('Migration complete!');
}

migrateStartupProfiles();
```

### Step 3: Update Frontend to Use Supabase

**File**: `dashboard.auxeira.com/startup_founder.html`

Replace Lambda API calls with Supabase queries:

```javascript
import { supabase } from './js/supabaseClient.js';

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Load startup profile
async function loadStartupProfile() {
  const { data, error } = await supabase
    .from('startup_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (error) {
    console.error('Error loading profile:', error);
    return null;
  }
  
  return data;
}

// Load metrics history
async function loadMetricsHistory(days = 365) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const { data, error } = await supabase
    .from('startup_metrics')
    .select('*')
    .eq('user_id', user.id)
    .gte('recorded_at', startDate.toISOString())
    .order('recorded_at', { ascending: false });
  
  if (error) {
    console.error('Error loading metrics:', error);
    return [];
  }
  
  return data;
}

// Load recent activities
async function loadRecentActivities(limit = 10) {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error loading activities:', error);
    return [];
  }
  
  return data;
}

// Real-time subscription for updates
const subscription = supabase
  .channel('startup_profile_changes')
  .on('postgres_changes', 
    { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'startup_profiles',
      filter: `user_id=eq.${user.id}`
    }, 
    (payload) => {
      console.log('Profile updated:', payload);
      updateDashboardUI(payload.new);
    }
  )
  .subscribe();
```

### Step 4: Update Each Tab

#### Overview Tab

**Before (Mock)**:
```javascript
const founderContext = {
  startupName: 'Auxeira',
  sseScore: 72,
  mrr: 18500,
  // ... hardcoded values
};
```

**After (Supabase)**:
```javascript
const profile = await loadStartupProfile();
const founderContext = {
  startupName: profile.company_name,
  sseScore: profile.sse_score,
  mrr: profile.mrr,
  mrrGrowth: `+${profile.growth_rate}%`,
  users: profile.active_users,
  customers: profile.customers,
  cac: profile.cac,
  ltv: profile.ltv,
  churnRate: profile.churn_rate,
  nps: profile.nps,
  // ... all from database
};
```

#### Growth Metrics Tab

**Before (Mock)**:
```javascript
const mockMetrics = { 
  mrrGrowth: 40, 
  nrr: 128, 
  ltvCac: 14.9, 
  churn: 2.3 
};
```

**After (Supabase)**:
```javascript
const profile = await loadStartupProfile();
const metricsHistory = await loadMetricsHistory(180);

const metrics = {
  mrrGrowth: profile.growth_rate,
  nrr: calculateNRR(metricsHistory),
  ltvCac: profile.ltv_cac_ratio,
  churn: profile.churn_rate
};
```

#### Funding Readiness Tab

**Before (Mock)**:
```javascript
const mockInvestors = [
  { name: 'Sarah Chen', firm: 'Velocity Ventures', ... }
];
```

**After (Supabase)**:
```javascript
const { data: investors } = await supabase
  .from('investor_pool')
  .select('*')
  .contains('focus_areas', [profile.industry])
  .contains('stage_preference', [profile.funding_stage])
  .limit(5);
```

---

## 🚀 Deployment Plan

### Step 1: Set Up Supabase
- [ ] Create Supabase project
- [ ] Run SQL schema
- [ ] Configure RLS policies
- [ ] Get API keys

### Step 2: Migrate Data
- [ ] Run migration script
- [ ] Verify data integrity
- [ ] Test queries

### Step 3: Update Frontend
- [ ] Install Supabase client
- [ ] Replace Lambda calls with Supabase
- [ ] Add real-time subscriptions
- [ ] Test locally

### Step 4: Deploy to dashboard.auxeira.com
- [ ] Update DNS/subdomain
- [ ] Deploy frontend
- [ ] Test authentication
- [ ] Verify data loading

### Step 5: Go Live
- [ ] Monitor errors
- [ ] Check performance
- [ ] Gather user feedback

---

## 🔒 Security Checklist

- [ ] Enable Row Level Security on all tables
- [ ] Test RLS policies (users can only see their data)
- [ ] Use Supabase Auth for authentication
- [ ] Store API keys in environment variables
- [ ] Enable HTTPS only
- [ ] Set up rate limiting
- [ ] Monitor for suspicious activity

---

## 📊 Performance Optimization

### Indexes
```sql
-- Speed up common queries
CREATE INDEX idx_startup_profiles_user ON startup_profiles(user_id);
CREATE INDEX idx_metrics_user_date ON startup_metrics(user_id, recorded_at DESC);
CREATE INDEX idx_activities_user_date ON activities(user_id, completed_at DESC);
```

### Caching
```javascript
// Cache profile data for 5 minutes
const cachedProfile = localStorage.getItem('profile');
const cacheTime = localStorage.getItem('profile_cache_time');

if (cachedProfile && Date.now() - cacheTime < 5 * 60 * 1000) {
  return JSON.parse(cachedProfile);
}

// Otherwise fetch fresh data
const profile = await loadStartupProfile();
localStorage.setItem('profile', JSON.stringify(profile));
localStorage.setItem('profile_cache_time', Date.now());
```

---

## 🧪 Testing

### Test User Setup
```sql
-- Create test user
INSERT INTO users (id, email, first_name, last_name, company_name)
VALUES (
  '045b4095-3388-4ea6-8de3-b7b04be5bc1b',
  'founder@startup.com',
  'Jane',
  'Doe',
  'EdTech Solutions 96'
);

-- Create test startup profile
INSERT INTO startup_profiles (user_id, company_name, sse_score, mrr, ...)
VALUES (...);
```

### Test Queries
```javascript
// Test 1: Load profile
const profile = await loadStartupProfile();
console.assert(profile.company_name === 'EdTech Solutions 96');

// Test 2: Load metrics
const metrics = await loadMetricsHistory(30);
console.assert(metrics.length > 0);

// Test 3: Real-time updates
// Update profile in Supabase dashboard
// Verify dashboard updates automatically
```

---

## 📝 Next Steps

1. **Create Supabase project** and get API keys
2. **Run SQL schema** to create tables
3. **Migrate data** from DynamoDB
4. **Update frontend** to use Supabase
5. **Deploy to dashboard.auxeira.com**
6. **Test end-to-end**

---

**Status**: 📋 **READY TO IMPLEMENT**  
**Estimated Time**: 4-6 hours  
**Priority**: 🔥 **HIGH**
