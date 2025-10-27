# Onboarding & Subscription Tier System

## Overview

Gated onboarding system that collects startup metrics and automatically assigns subscription tiers. Pricing changes automatically as the business grows or shrinks based on tracked parameters.

## Pricing Tiers

| Tier | Price | Criteria |
|------|-------|----------|
| **Founder (FREE)** | $0/month | Funding < $10K OR MRR < $5K OR Team < 5 |
| **Startup** | $149/month | Funding $10K-$500K OR MRR $5K-$25K OR Team 5-15 |
| **Growth** | $499/month | Funding $500K-$5M OR MRR $25K-$100K OR Team 15-50 |
| **Scale** | $999/month | Funding > $5M OR MRR > $100K OR Team > 50 |

**Note:** Tier is determined by the HIGHEST qualifying metric (OR logic, not AND).

## User Flow

### 1. First-Time User Sign Up
```
User Signs Up → Email Verification → Onboarding Form (Gated)
```

### 2. Onboarding Form (2 Steps)

**Step 1: Company Information**
- Startup Name *
- Industry *
- Startup Stage *
- Country *

**Step 2: Business Metrics**
- Total Funding Raised * (for tier calculation)
- Monthly Recurring Revenue (MRR) * (for tier calculation)
- Team Size * (for tier calculation)
- Average Revenue Per Customer (ARPA) (optional, for dashboard)
- Customer Lifetime (months) (optional, for dashboard)
- Monthly Marketing Spend (optional, for dashboard)
- New Customers/Month (optional, for dashboard)
- Total Cash on Hand (optional, for dashboard)
- Monthly Burn Rate (optional, for dashboard)

**Tier Recommendation:**
- Real-time calculation as user enters metrics
- Shows recommended tier with pricing
- Explains why that tier was selected

### 3. Dashboard Access
```
Onboarding Complete → Redirect to Dashboard (Direct S3 URL)
```

## Automatic Tier Recalculation

### Triggers
Tier is automatically recalculated when:
1. User updates funding_raised in profile
2. User updates mrr in profile
3. User updates team_size in profile
4. Dashboard metrics are synced (via tier-tracking service)

### Database Trigger
```sql
CREATE TRIGGER trigger_recalculate_tier
BEFORE UPDATE OF funding_raised, mrr, team_size ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION recalculate_tier();
```

### Tier Change Logging
Every tier change is logged in `tier_history` table:
- Old tier → New tier
- Timestamp
- Reason (e.g., "Automatic recalculation", "Manual update")
- Price change

## API Endpoints

### POST /api/onboarding/complete
Complete onboarding and assign initial tier.

**Request:**
```json
{
  "startup_name": "Auxeira Analytics",
  "industry": "FinTech",
  "stage": "Series A",
  "country": "United States",
  "funding_raised": 500000,
  "mrr": 25000,
  "team_size": 15,
  "arpa": 150,
  "customer_lifetime_months": 12,
  "monthly_marketing_spend": 10000,
  "new_customers_per_month": 50,
  "total_cash": 400000,
  "monthly_burn_rate": 40000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "data": {
    "tier": "growth",
    "tier_name": "Growth",
    "price": 499,
    "calculated_metrics": {
      "ltv": 1800,
      "cac": 200,
      "ltv_cac_ratio": "9.00",
      "runway": "10.0"
    }
  }
}
```

### POST /api/onboarding/recalculate-tier
Manually trigger tier recalculation (also happens automatically).

**Response:**
```json
{
  "success": true,
  "message": "Tier updated",
  "data": {
    "old_tier": "startup",
    "new_tier": "growth",
    "tier_name": "Growth",
    "price": 499
  }
}
```

### GET /api/onboarding/status
Check if user has completed onboarding.

**Response:**
```json
{
  "success": true,
  "data": {
    "completed": true,
    "tier": "growth",
    "price": 499
  }
}
```

## Database Schema

### user_profiles
```sql
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    
    -- Company Info
    startup_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    stage VARCHAR(50) NOT NULL,
    country VARCHAR(100) NOT NULL,
    
    -- Tier Calculation Metrics
    funding_raised DECIMAL(15, 2) NOT NULL DEFAULT 0,
    mrr DECIMAL(15, 2) NOT NULL DEFAULT 0,
    team_size INTEGER NOT NULL DEFAULT 0,
    
    -- Subscription
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'founder',
    subscription_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    
    -- Optional Financial Metrics
    arpa DECIMAL(10, 2),
    customer_lifetime_months INTEGER,
    monthly_marketing_spend DECIMAL(15, 2),
    new_customers_per_month INTEGER,
    total_cash DECIMAL(15, 2),
    monthly_burn_rate DECIMAL(15, 2),
    
    -- Calculated Metrics
    ltv DECIMAL(15, 2),
    cac DECIMAL(15, 2),
    ltv_cac_ratio DECIMAL(10, 2),
    runway DECIMAL(10, 2),
    
    -- Timestamps
    onboarding_completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### tier_history
```sql
CREATE TABLE tier_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    tier VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### metrics_snapshots
```sql
CREATE TABLE metrics_snapshots (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    funding_raised DECIMAL(15, 2) NOT NULL,
    mrr DECIMAL(15, 2) NOT NULL,
    team_size INTEGER NOT NULL,
    tier VARCHAR(50) NOT NULL,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, snapshot_date)
);
```

## Tier Tracking Service

### updateMetrics(userId, metrics)
Update user metrics and trigger automatic tier recalculation.

```typescript
import { updateMetrics } from './services/tier-tracking.service';

await updateMetrics({
  userId: 123,
  fundingRaised: 600000,
  mrr: 30000,
  teamSize: 20
});
// Tier automatically recalculated via database trigger
```

### checkTierRecommendation(userId)
Check if user should upgrade/downgrade without making changes.

```typescript
const recommendation = await checkTierRecommendation(123);
// {
//   currentTier: 'startup',
//   recommendedTier: 'growth',
//   shouldChange: true,
//   reason: 'Your metrics have grown! Consider upgrading to growth tier.'
// }
```

### getTierHistory(userId)
Get tier change history for audit trail.

### getMetricsTrend(userId, days)
Get daily metrics snapshots for trend analysis.

### createDailySnapshots()
Create daily snapshot of all user metrics (run via cron).

## Integration with Dashboard

### Onboarding Check
Add to dashboard JavaScript:

```javascript
async function checkOnboardingStatus() {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/onboarding/status', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    if (!data.data.completed) {
        window.location.href = '/onboarding-form.html';
    }
}

checkOnboardingStatus();
```

### Metrics Sync
When dashboard updates metrics (e.g., MRR from financial data):

```javascript
import { updateMetrics } from './services/tier-tracking.service';

// After calculating new MRR from dashboard data
await updateMetrics({
  userId: currentUser.id,
  mrr: calculatedMRR
});
```

## Deployment

### 1. Run Migration
```bash
cd backend
node run-migration.js 006_onboarding_and_tiers.sql
```

### 2. Deploy Onboarding Form
```bash
aws s3 cp onboarding-form.html s3://dashboard.auxeira.com/onboarding-form.html
```

### 3. Update Dashboard
Add onboarding check to dashboard startup_founder.html

### 4. Set Up Cron Job (Optional)
For daily metrics snapshots:
```bash
# Add to crontab
0 0 * * * curl -X POST https://api.auxeira.com/api/admin/create-snapshots
```

## Testing

### Test Tier Calculation
```bash
# Founder tier (< $10K funding)
curl -X POST https://api.auxeira.com/api/onboarding/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startup_name": "Test Startup",
    "industry": "SaaS",
    "stage": "Pre-Seed",
    "country": "US",
    "funding_raised": 5000,
    "mrr": 1000,
    "team_size": 2
  }'

# Expected: tier = "founder", price = 0
```

### Test Automatic Recalculation
```bash
# Update metrics to trigger tier change
curl -X PUT https://api.auxeira.com/api/profile/metrics \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "funding_raised": 600000,
    "mrr": 30000,
    "team_size": 20
  }'

# Check tier history
curl https://api.auxeira.com/api/profile/tier-history \
  -H "Authorization: Bearer $TOKEN"
```

## Direct S3 URL (CloudFront Bypass)

Due to CloudFront caching issues, use direct S3 URL:

**Dashboard URL:**
```
https://s3.amazonaws.com/dashboard.auxeira.com/startup_founder.html
```

**Onboarding URL:**
```
https://s3.amazonaws.com/dashboard.auxeira.com/onboarding-form.html
```

## Future Enhancements

1. **Payment Integration**: Connect to Stripe for automatic billing
2. **Tier Upgrade Prompts**: Show in-app notifications when user qualifies for upgrade
3. **Tier Downgrade Grace Period**: Allow 30-day grace period before downgrading
4. **Custom Tiers**: Allow enterprise customers to negotiate custom pricing
5. **Metrics Dashboard**: Show tier history and metrics trends in profile
6. **A/B Testing**: Test different tier thresholds for optimal conversion
