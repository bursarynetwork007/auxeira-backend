# 🚀 Supabase Implementation Guide - Step by Step

**Goal**: Replace DynamoDB/Lambda with Supabase for `dashboard.auxeira.com/startup_founder.html`  
**Status**: Ready to Implement  
**Time**: 4-6 hours

---

## ✅ Prerequisites

Before starting, you need:
1. Supabase account (free tier is fine)
2. Supabase project URL and API keys
3. Access to `dashboard.auxeira.com` DNS/hosting

---

## 📋 Step 1: Create Supabase Project (15 minutes)

### 1.1 Sign Up & Create Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New Project"
5. Fill in:
   - **Name**: `auxeira-production`
   - **Database Password**: (generate strong password)
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait 2-3 minutes for provisioning

### 1.2 Get API Keys

1. Go to Project Settings → API
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (safe for client-side)
   - **service_role key**: `eyJhbGc...` (keep secret, server-side only)

### 1.3 Save to Environment

Create `.env.local`:
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_KEY=eyJhbGc...your-service-key
```

---

## 📊 Step 2: Create Database Schema (20 minutes)

### 2.1 Open SQL Editor

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"

### 2.2 Run Schema Script

Copy and paste this entire script, then click "Run":

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (extends Supabase Auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'startup_founder',
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Startup Profiles
CREATE TABLE public.startup_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL,
  industry TEXT,
  funding_stage TEXT,
  region TEXT,
  
  -- SSE & Success
  sse_score INTEGER DEFAULT 0,
  success_probability DECIMAL(5,3),
  
  -- Financial
  mrr INTEGER DEFAULT 0,
  arr INTEGER DEFAULT 0,
  growth_rate DECIMAL(5,2),
  burn_rate INTEGER DEFAULT 0,
  runway_months DECIMAL(5,1),
  total_funding INTEGER DEFAULT 0,
  
  -- Team
  team_size INTEGER DEFAULT 0,
  founder_experience DECIMAL(3,1),
  
  -- Customers
  customers INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  churn_rate DECIMAL(5,2),
  
  -- Unit Economics
  cac INTEGER DEFAULT 0,
  ltv INTEGER DEFAULT 0,
  ltv_cac_ratio DECIMAL(5,1),
  nps INTEGER DEFAULT 0,
  
  -- Activity
  total_activities_completed INTEGER DEFAULT 0,
  last_activity_date TIMESTAMPTZ,
  
  -- Tokens
  token_balance INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Metrics History
CREATE TABLE public.startup_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  startup_id UUID REFERENCES public.startup_profiles(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,2),
  metric_type TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Activities
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  startup_id UUID REFERENCES public.startup_profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_title TEXT,
  activity_description TEXT,
  impact_score INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Investor Pool
CREATE TABLE public.investor_pool (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT,
  focus_areas TEXT[],
  check_size_min INTEGER,
  check_size_max INTEGER,
  stage_preference TEXT[],
  geography TEXT[],
  portfolio_companies TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Token Transactions
CREATE TABLE public.token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  activity_id UUID REFERENCES public.activities(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX idx_startup_profiles_user ON public.startup_profiles(user_id);
CREATE INDEX idx_metrics_user_date ON public.startup_metrics(user_id, recorded_at DESC);
CREATE INDEX idx_activities_user_date ON public.activities(user_id, completed_at DESC);
CREATE INDEX idx_token_transactions_user ON public.token_transactions(user_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own startup" ON public.startup_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own startup" ON public.startup_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own metrics" ON public.startup_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activities" ON public.activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON public.token_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Investor pool is public (read-only)
CREATE POLICY "Anyone can view investors" ON public.investor_pool
  FOR SELECT USING (true);
```

### 2.3 Verify Tables Created

1. Go to **Table Editor**
2. You should see: `users`, `startup_profiles`, `startup_metrics`, `activities`, `investor_pool`, `token_transactions`

---

## 🔄 Step 3: Migrate Test Data (30 minutes)

### 3.1 Create Test User

In SQL Editor, run:

```sql
-- Insert test user (matches your existing test user)
INSERT INTO auth.users (id, email)
VALUES ('045b4095-3388-4ea6-8de3-b7b04be5bc1b', 'founder@startup.com')
ON CONFLICT DO NOTHING;

INSERT INTO public.users (id, email, first_name, last_name, company_name)
VALUES (
  '045b4095-3388-4ea6-8de3-b7b04be5bc1b',
  'founder@startup.com',
  'Jane',
  'Doe',
  'EdTech Solutions 96'
)
ON CONFLICT DO NOTHING;

-- Insert startup profile
INSERT INTO public.startup_profiles (
  user_id, company_name, industry, funding_stage, region,
  sse_score, mrr, arr, growth_rate, burn_rate, runway_months,
  team_size, customers, active_users, churn_rate,
  cac, ltv, ltv_cac_ratio, nps, token_balance
)
VALUES (
  '045b4095-3388-4ea6-8de3-b7b04be5bc1b',
  'EdTech Solutions 96',
  'EdTech',
  'Pre-Seed',
  'Asia-Pacific',
  62,
  380177,
  4562124,
  12.6,
  228106,
  19.3,
  21,
  8441,
  21104,
  2.3,
  127,
  1890,
  14.9,
  68,
  1034
)
ON CONFLICT (user_id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  sse_score = EXCLUDED.sse_score,
  mrr = EXCLUDED.mrr;
```

### 3.2 Add Sample Investors

```sql
INSERT INTO public.investor_pool (name, type, focus_areas, check_size_min, check_size_max, stage_preference, geography)
VALUES
  ('Velocity Ventures', 'VC Fund', ARRAY['EdTech', 'SaaS'], 500000, 2000000, ARRAY['Seed', 'Series A'], ARRAY['Global']),
  ('Sarah Chen', 'Angel', ARRAY['EdTech', 'FinTech'], 50000, 250000, ARRAY['Pre-Seed', 'Seed'], ARRAY['Asia', 'US']),
  ('TechStars', 'Accelerator', ARRAY['Tech'], 20000, 120000, ARRAY['Pre-Seed'], ARRAY['Global']);
```

### 3.3 Test Query

```sql
-- Test: Get startup profile
SELECT * FROM public.startup_profiles WHERE user_id = '045b4095-3388-4ea6-8de3-b7b04be5bc1b';

-- Should return EdTech Solutions 96 data
```

---

## 💻 Step 4: Update Frontend Code (90 minutes)

### 4.1 Install Supabase Client

```bash
cd frontend
npm install @supabase/supabase-js
```

### 4.2 Create Supabase Client

**File**: `frontend/js/supabaseClient.js`

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xxxxx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper: Get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Helper: Load startup profile
export async function loadStartupProfile(userId) {
  const { data, error } = await supabase
    .from('startup_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) throw error
  return data
}

// Helper: Load metrics history
export async function loadMetricsHistory(userId, days = 365) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const { data, error } = await supabase
    .from('startup_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('recorded_at', startDate.toISOString())
    .order('recorded_at', { ascending: false })
  
  if (error) throw error
  return data
}

// Helper: Load recent activities
export async function loadRecentActivities(userId, limit = 10) {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

// Helper: Get matching investors
export async function getMatchingInvestors(industry, stage, limit = 5) {
  const { data, error } = await supabase
    .from('investor_pool')
    .select('*')
    .contains('focus_areas', [industry])
    .contains('stage_preference', [stage])
    .limit(limit)
  
  if (error) throw error
  return data
}
```

### 4.3 Update Dashboard HTML

**File**: `dashboard.auxeira.com/startup_founder.html`

Replace the data loading section:

```html
<script type="module">
import { supabase, getCurrentUser, loadStartupProfile, loadRecentActivities } from './js/supabaseClient.js';

// Initialize dashboard with real data
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Dashboard initializing with Supabase...');
    
    try {
        // Show loading state
        showLoadingState();
        
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            window.location.href = '/login';
            return;
        }
        
        // Load startup profile
        const profile = await loadStartupProfile(user.id);
        
        // Load recent activities
        const activities = await loadRecentActivities(user.id, 30);
        
        // Build founder context
        const founderContext = {
            startupName: profile.company_name,
            sseScore: profile.sse_score,
            stage: profile.funding_stage,
            industry: profile.industry,
            geography: profile.region || 'United States',
            teamSize: profile.team_size,
            runway: profile.runway_months,
            mrr: profile.mrr,
            mrrGrowth: `+${profile.growth_rate}%`,
            users: profile.active_users,
            customers: profile.customers,
            cac: profile.cac,
            ltv: profile.ltv,
            churnRate: profile.churn_rate,
            nps: profile.nps,
            interviewsCompleted: activities.filter(a => 
                a.activity_type === 'customer_interview'
            ).length,
            projectionsAge: '30 days old',
            recentMilestones: buildRecentMilestones(profile, activities),
            activeChallenges: buildActiveChallenges(profile)
        };
        
        // Update UI
        updateDashboardUI(founderContext);
        
        // Initialize AI components
        initializeAIComponents(founderContext);
        
        // Set up real-time updates
        setupRealtimeSubscription(user.id);
        
        // Hide loading state
        hideLoadingState();
        
        console.log('Dashboard initialized successfully with Supabase');
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showErrorState('Failed to load your data. Please refresh the page.');
    }
});

// Real-time subscription for live updates
function setupRealtimeSubscription(userId) {
    const subscription = supabase
        .channel('startup_profile_changes')
        .on('postgres_changes', 
            { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'startup_profiles',
                filter: `user_id=eq.${userId}`
            }, 
            (payload) => {
                console.log('Profile updated in real-time:', payload);
                const updatedProfile = payload.new;
                const context = buildContextFromProfile(updatedProfile);
                updateDashboardUI(context);
            }
        )
        .subscribe();
    
    return subscription;
}

function buildRecentMilestones(profile, activities) {
    const milestones = [];
    
    if (profile.mrr > 10000) {
        milestones.push(`Achieved $${(profile.mrr / 1000).toFixed(1)}K MRR`);
    }
    
    if (profile.growth_rate > 15) {
        milestones.push(`${profile.growth_rate}% monthly growth rate`);
    }
    
    if (profile.customers > 1000) {
        milestones.push(`Reached ${profile.customers.toLocaleString()} customers`);
    }
    
    return milestones.slice(0, 3);
}

function buildActiveChallenges(profile) {
    const challenges = [];
    
    if (profile.churn_rate > 2.0) {
        challenges.push(`Churn rate above SaaS benchmark (${profile.churn_rate}% vs 1-2%)`);
    }
    
    if (profile.runway_months < 12) {
        challenges.push(`Limited runway (${profile.runway_months} months remaining)`);
    }
    
    if (profile.growth_rate < 10) {
        challenges.push(`Growth rate below target (${profile.growth_rate}% vs 15%+ target)`);
    }
    
    return challenges.slice(0, 3);
}
</script>
```

---

## 🌐 Step 5: Deploy to dashboard.auxeira.com (30 minutes)

### 5.1 Set Up Subdomain

**Option A: Using Vercel/Netlify**
1. Deploy frontend to Vercel
2. Add custom domain: `dashboard.auxeira.com`
3. Add environment variables (Supabase keys)

**Option B: Using CloudFront + S3**
1. Create S3 bucket: `dashboard-auxeira-com`
2. Upload `startup_founder.html` and `js/` folder
3. Create CloudFront distribution
4. Point `dashboard.auxeira.com` to CloudFront

### 5.2 Update DNS

Add CNAME record:
```
dashboard.auxeira.com → your-cloudfront-url.cloudfront.net
```

Or A record if using Vercel:
```
dashboard.auxeira.com → 76.76.21.21
```

### 5.3 Test Deployment

1. Go to https://dashboard.auxeira.com/startup_founder.html
2. Login with `founder@startup.com`
3. Verify data loads from Supabase

---

## ✅ Step 6: Verification Checklist

- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] Test user created
- [ ] Test data inserted
- [ ] Supabase client installed
- [ ] Frontend code updated
- [ ] Real-time subscriptions working
- [ ] Deployed to dashboard.auxeira.com
- [ ] DNS configured
- [ ] End-to-end test passed

---

## 🐛 Troubleshooting

### Error: "Invalid API key"
- Check `.env` file has correct keys
- Verify keys are from correct Supabase project

### Error: "Row Level Security policy violation"
- Check RLS policies are created
- Verify user is authenticated
- Test with `service_role` key (bypasses RLS)

### Data not loading
- Check browser console for errors
- Verify user ID matches database
- Test queries in Supabase SQL Editor

### Real-time not working
- Check subscription is active
- Verify Realtime is enabled in Supabase project settings
- Check browser console for WebSocket errors

---

## 📞 Next Steps

1. **Create Supabase project** (15 min)
2. **Run SQL schema** (5 min)
3. **Insert test data** (10 min)
4. **Update frontend code** (60 min)
5. **Deploy to dashboard.auxeira.com** (30 min)
6. **Test end-to-end** (15 min)

**Total Time**: ~2-3 hours

---

**Ready to start?** Follow Step 1 above to create your Supabase project!
