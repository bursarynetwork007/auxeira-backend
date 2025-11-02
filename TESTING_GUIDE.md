# Testing Guide - Database Bindings and Activity Feed

## Overview
This guide provides comprehensive testing procedures for the database binding implementation, including the 365-day rolling feed and 5-year toggle functionality.

---

## Prerequisites

### 1. Database Setup
```bash
# Ensure PostgreSQL is running
sudo systemctl status postgresql

# Create database if not exists
createdb auxeira_central

# Run schema
psql auxeira_central < backend/central-database/database/startup_profiles_schema.sql

# Run seed script
cd backend/central-database/database
python3 seed_10000_startups.py
```

### 2. Backend Setup
```bash
# Install dependencies
cd backend/central-database
pip install -r requirements.txt

# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=auxeira_central
export DB_USER=postgres
export DB_PASSWORD=your_password
export SECRET_KEY=your_secret_key

# Start API server
python3 wsgi_handler.py
```

### 3. Frontend Setup
```bash
# Ensure JS files are in place
ls frontend/js/api-client.js
ls frontend/js/dashboard-data.js
ls frontend/js/activity-feed.js

# Start development server (if using)
cd frontend
python3 -m http.server 8000
```

---

## Test Suite 1: Database and Schema

### Test 1.1: Verify Tables Created
```sql
-- Connect to database
psql auxeira_central

-- Check tables exist
\dt

-- Expected output:
-- startup_profiles
-- activity_feed
-- metrics_history
-- users
-- organizations
-- gamification_profiles
-- actions
```

**Expected Result:** ✅ All tables exist

### Test 1.2: Verify Data Populated
```sql
-- Check startup profiles count
SELECT COUNT(*) FROM startup_profiles;
-- Expected: 10000

-- Check activity feed count
SELECT COUNT(*) FROM activity_feed;
-- Expected: 450000 - 1000000 (10-100 per startup)

-- Check metrics history count
SELECT COUNT(*) FROM metrics_history;
-- Expected: 520000 (52 per startup)
```

**Expected Result:** ✅ All counts match expected ranges

### Test 1.3: Verify Indexes
```sql
-- Check indexes
\di

-- Verify partial indexes exist
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'activity_feed';

-- Expected:
-- idx_activity_feed_365_days
-- idx_activity_feed_5_years
```

**Expected Result:** ✅ Optimized indexes exist

### Test 1.4: Verify Views
```sql
-- Check views
\dv

-- Test 365-day view
SELECT COUNT(*) FROM activity_feed_365_days;

-- Test 5-year view
SELECT COUNT(*) FROM activity_feed_5_years;
```

**Expected Result:** ✅ Views return data

### Test 1.5: Verify Functions
```sql
-- Check functions
\df get_activity_feed
\df get_metrics_history

-- Test activity feed function
SELECT * FROM get_activity_feed(
    p_profile_id := NULL,
    p_days := 365,
    p_limit := 10
);

-- Test metrics history function
SELECT * FROM get_metrics_history(
    p_profile_id := (SELECT profile_id FROM startup_profiles LIMIT 1),
    p_days := 365,
    p_metric_name := NULL,
    p_metric_type := 'financial'
);
```

**Expected Result:** ✅ Functions return data

---

## Test Suite 2: API Endpoints

### Test 2.1: List Startup Profiles
```bash
# Basic list
curl -X GET "http://localhost:5000/api/startup-profiles/?page=1&limit=10"

# With filters
curl -X GET "http://localhost:5000/api/startup-profiles/?stage=growth&min_sse=70&limit=10"

# With sorting
curl -X GET "http://localhost:5000/api/startup-profiles/?sort_by=sse_score&sort_order=desc&limit=10"
```

**Expected Result:** ✅ Returns JSON with profiles array and pagination

**Verify:**
- Response has `success: true`
- `data.profiles` is an array
- `data.pagination` has page, limit, total, totalPages
- Filters apply correctly
- Sorting works correctly

### Test 2.2: Get Single Profile
```bash
# Get first profile ID
PROFILE_ID=$(curl -s "http://localhost:5000/api/startup-profiles/?limit=1" | jq -r '.data.profiles[0].profile_id')

# Get profile details
curl -X GET "http://localhost:5000/api/startup-profiles/$PROFILE_ID"

# Get profile with history
curl -X GET "http://localhost:5000/api/startup-profiles/$PROFILE_ID?include_history=true&include_metrics=true"
```

**Expected Result:** ✅ Returns complete profile data

**Verify:**
- All fields populated
- SSE score between 0-100
- Financial metrics are reasonable
- Dates are valid

### Test 2.3: Activity Feed - 365 Days (Default)
```bash
# Default 365-day feed
curl -X GET "http://localhost:5000/api/startup-profiles/activity-feed?page=1&limit=50"

# Explicit 365 days
curl -X GET "http://localhost:5000/api/startup-profiles/activity-feed?days=365&page=1&limit=50"
```

**Expected Result:** ✅ Returns activities from last 365 days

**Verify:**
- `timeRange.days` = 365
- `timeRange.isDefault` = true
- `timeRange.isFiveYear` = false
- All activities within last 365 days
- Pagination works

### Test 2.4: Activity Feed - 5 Year Toggle
```bash
# 5-year feed
curl -X GET "http://localhost:5000/api/startup-profiles/activity-feed?days=1825&page=1&limit=50"
```

**Expected Result:** ✅ Returns activities from last 5 years

**Verify:**
- `timeRange.days` = 1825
- `timeRange.isDefault` = false
- `timeRange.isFiveYear` = true
- Activities span up to 5 years
- More activities than 365-day feed

### Test 2.5: Activity Feed with Filters
```bash
# Filter by activity type
curl -X GET "http://localhost:5000/api/startup-profiles/activity-feed?activity_type=Product%20Launch&limit=20"

# Filter by industry
curl -X GET "http://localhost:5000/api/startup-profiles/activity-feed?industry=Technology&limit=20"

# Combined filters
curl -X GET "http://localhost:5000/api/startup-profiles/activity-feed?days=365&activity_type=Funding%20Round&industry=Healthcare&limit=20"
```

**Expected Result:** ✅ Returns filtered activities

**Verify:**
- Filters apply correctly
- Activity count decreases with filters
- All returned activities match filters

### Test 2.6: Profile Activities
```bash
# Get activities for specific profile
curl -X GET "http://localhost:5000/api/startup-profiles/$PROFILE_ID/activities?days=365&limit=50"

# 5-year activities for profile
curl -X GET "http://localhost:5000/api/startup-profiles/$PROFILE_ID/activities?days=1825&limit=100"
```

**Expected Result:** ✅ Returns activities for specific profile

**Verify:**
- All activities belong to the profile
- Time range respected
- Sorted by date descending

### Test 2.7: Profile Metrics
```bash
# Get financial metrics
curl -X GET "http://localhost:5000/api/startup-profiles/$PROFILE_ID/metrics?days=365&metric_type=financial"

# Get specific metric
curl -X GET "http://localhost:5000/api/startup-profiles/$PROFILE_ID/metrics?days=365&metric_name=MRR"

# 5-year metrics
curl -X GET "http://localhost:5000/api/startup-profiles/$PROFILE_ID/metrics?days=1825&metric_type=financial"
```

**Expected Result:** ✅ Returns metrics history

**Verify:**
- Metrics grouped by name
- Time series data present
- Values are reasonable

### Test 2.8: Statistics
```bash
# Get aggregate stats (365 days)
curl -X GET "http://localhost:5000/api/startup-profiles/stats?days=365"

# Get 5-year stats
curl -X GET "http://localhost:5000/api/startup-profiles/stats?days=1825"
```

**Expected Result:** ✅ Returns aggregate statistics

**Verify:**
- Total profiles = 10000
- Average SSE score reasonable
- Stage counts add up to 10000
- Activity stats present

### Test 2.9: Search
```bash
# Search by company name
curl -X GET "http://localhost:5000/api/startup-profiles/search?q=tech&limit=20"

# Search by industry
curl -X GET "http://localhost:5000/api/startup-profiles/search?q=healthcare&limit=20"
```

**Expected Result:** ✅ Returns matching profiles

**Verify:**
- Results match search query
- Sorted by relevance (SSE score)
- Limit respected

---

## Test Suite 3: Frontend Components

### Test 3.1: API Client
```javascript
// Open browser console on dashboard page

// Test 1: Get profile
const profile = await apiClient.getProfile('profile-id-here');
console.log(profile);
// Expected: Profile data object

// Test 2: List profiles
const profiles = await apiClient.listProfiles({ stage: 'growth', limit: 10 });
console.log(profiles);
// Expected: Array of profiles

// Test 3: Activity feed (365 days)
const feed = await apiClient.getActivityFeed({ page: 1, limit: 50 });
console.log(feed);
// Expected: Activities from last 365 days

// Test 4: Activity feed (5 years)
const historicalFeed = await apiClient.getActivityFeed({ days: 1825, page: 1, limit: 50 });
console.log(historicalFeed);
// Expected: Activities from last 5 years

// Test 5: Caching
const cached1 = await apiClient.getProfile('profile-id-here');
const cached2 = await apiClient.getProfile('profile-id-here');
// Expected: Second call should be instant (from cache)

// Test 6: Formatting
console.log(apiClient.formatCurrency(150000)); // Expected: $150,000
console.log(apiClient.formatNumber(1500000)); // Expected: 1.5M
console.log(apiClient.formatRelativeTime('2025-01-26T10:00:00Z')); // Expected: "2 days ago"
```

**Expected Result:** ✅ All API client methods work correctly

### Test 3.2: Dashboard Data Manager
```javascript
// Initialize dashboard
const dashboard = new DashboardData('profile-id-here');

// Wait for initialization
setTimeout(() => {
    // Test 1: Data binding
    console.log(dashboard.data);
    // Expected: All fields populated
    
    // Test 2: DOM binding
    const sseElement = document.querySelector('[data-bind="sse_score"]');
    console.log(sseElement.textContent);
    // Expected: SSE score value
    
    // Test 3: Charts
    console.log(dashboard.charts);
    // Expected: growth, acquisition, revenue charts
    
    // Test 4: Refresh
    await dashboard.refresh();
    // Expected: Data updates, notification shown
}, 2000);
```

**Expected Result:** ✅ Dashboard initializes and displays data

**Verify:**
- Loading state shows initially
- Data loads from API
- All `[data-bind]` elements populated
- Charts render with actual data
- No hardcoded values visible

### Test 3.3: Activity Feed Component
```javascript
// Initialize activity feed
const activityFeed = new ActivityFeed('profile-id-here');

// Wait for initialization
setTimeout(() => {
    // Test 1: Activities loaded
    console.log(activityFeed.activities);
    // Expected: Array of activities
    
    // Test 2: Time range
    console.log(activityFeed.timeRange);
    // Expected: 365 (default)
    
    // Test 3: Toggle to 5 years
    await activityFeed.toggleTimeRange();
    console.log(activityFeed.timeRange);
    // Expected: 1825
    
    // Test 4: Toggle back to 365 days
    await activityFeed.toggleTimeRange();
    console.log(activityFeed.timeRange);
    // Expected: 365
    
    // Test 5: Pagination
    await activityFeed.nextPage();
    console.log(activityFeed.currentPage);
    // Expected: 2
    
    // Test 6: Filters
    document.getElementById('activityTypeFilter').value = 'Product Launch';
    document.getElementById('activityTypeFilter').dispatchEvent(new Event('change'));
    // Expected: Activities filtered
}, 2000);
```

**Expected Result:** ✅ Activity feed works correctly

**Verify:**
- Activities display in list
- Time range indicator shows "365 days"
- Toggle button changes text
- Pagination works
- Filters apply correctly
- Search works

---

## Test Suite 4: Integration Tests

### Test 4.1: End-to-End Flow
```
1. User opens dashboard
2. Dashboard loads profile data from API
3. Data binds to DOM elements
4. Charts render with actual data
5. User clicks "Activity Feed" tab
6. Activity feed loads 365-day data
7. User clicks "Show 5-Year History"
8. Activity feed reloads with 5-year data
9. User applies filters
10. Activity feed updates with filtered data
11. User clicks pagination
12. Next page of activities loads
```

**Expected Result:** ✅ Complete flow works without errors

### Test 4.2: Performance Test
```javascript
// Measure API response times
const startTime = Date.now();
const profile = await apiClient.getProfile('profile-id-here');
const profileTime = Date.now() - startTime;
console.log(`Profile load time: ${profileTime}ms`);
// Expected: < 500ms

const feedStart = Date.now();
const feed = await apiClient.getActivityFeed({ days: 365, limit: 50 });
const feedTime = Date.now() - feedStart;
console.log(`Activity feed load time: ${feedTime}ms`);
// Expected: < 500ms

const historicalStart = Date.now();
const historical = await apiClient.getActivityFeed({ days: 1825, limit: 50 });
const historicalTime = Date.now() - historicalStart;
console.log(`5-year feed load time: ${historicalTime}ms`);
// Expected: < 1000ms
```

**Expected Result:** ✅ All operations complete within acceptable time

### Test 4.3: Error Handling
```javascript
// Test 1: Invalid profile ID
try {
    await apiClient.getProfile('invalid-id');
} catch (error) {
    console.log('Error caught:', error.message);
    // Expected: Error message displayed
}

// Test 2: Network error
// Disconnect network, then:
try {
    await apiClient.getActivityFeed();
} catch (error) {
    console.log('Network error caught:', error.message);
    // Expected: Error message displayed
}

// Test 3: Invalid token
apiClient.setToken('invalid-token');
try {
    await apiClient.getProfile('profile-id-here');
} catch (error) {
    console.log('Auth error caught:', error.message);
    // Expected: Redirected to login
}
```

**Expected Result:** ✅ Errors handled gracefully

### Test 4.4: Caching Test
```javascript
// Clear cache
apiClient.clearCache();

// First call (no cache)
const start1 = Date.now();
const data1 = await apiClient.getProfile('profile-id-here');
const time1 = Date.now() - start1;
console.log(`First call: ${time1}ms`);

// Second call (cached)
const start2 = Date.now();
const data2 = await apiClient.getProfile('profile-id-here');
const time2 = Date.now() - start2;
console.log(`Second call (cached): ${time2}ms`);

// Expected: time2 << time1 (should be instant)
```

**Expected Result:** ✅ Caching significantly improves performance

---

## Test Suite 5: UI/UX Tests

### Test 5.1: Visual Verification
**Manual Checks:**
- [ ] Dashboard loads without layout issues
- [ ] All metrics display correctly
- [ ] Charts render properly
- [ ] Activity feed displays in clean list
- [ ] Toggle button is visible and styled
- [ ] Time range indicator updates correctly
- [ ] Pagination controls work
- [ ] Loading states show during data fetch
- [ ] Error messages display clearly
- [ ] Responsive design works on mobile

### Test 5.2: Interaction Tests
**Manual Checks:**
- [ ] Click toggle button → Time range changes
- [ ] Click next page → New activities load
- [ ] Select filter → Activities filter correctly
- [ ] Type in search → Results update
- [ ] Click refresh → Data reloads
- [ ] Switch tabs → Content updates
- [ ] Hover over elements → Tooltips show (if applicable)

### Test 5.3: Accessibility Tests
**Manual Checks:**
- [ ] Keyboard navigation works
- [ ] Screen reader announces changes
- [ ] Focus indicators visible
- [ ] Color contrast sufficient
- [ ] Alt text on images
- [ ] ARIA labels present

---

## Test Suite 6: Data Accuracy

### Test 6.1: Verify Data Consistency
```sql
-- Check SSE scores are in valid range
SELECT COUNT(*) FROM startup_profiles WHERE sse_score < 0 OR sse_score > 100;
-- Expected: 0

-- Check MRR is non-negative
SELECT COUNT(*) FROM startup_profiles WHERE mrr < 0;
-- Expected: 0

-- Check activity dates are within 5 years
SELECT COUNT(*) FROM activity_feed 
WHERE activity_date < NOW() - INTERVAL '5 years' 
   OR activity_date > NOW();
-- Expected: 0

-- Check metrics have valid values
SELECT COUNT(*) FROM metrics_history WHERE metric_value < 0;
-- Expected: 0 (or very few for negative metrics like burn rate)
```

**Expected Result:** ✅ All data within valid ranges

### Test 6.2: Verify Relationships
```sql
-- Check all activities have valid profile references
SELECT COUNT(*) FROM activity_feed af
LEFT JOIN startup_profiles sp ON af.profile_id = sp.profile_id
WHERE sp.profile_id IS NULL;
-- Expected: 0

-- Check all metrics have valid profile references
SELECT COUNT(*) FROM metrics_history mh
LEFT JOIN startup_profiles sp ON mh.profile_id = sp.profile_id
WHERE sp.profile_id IS NULL;
-- Expected: 0
```

**Expected Result:** ✅ All foreign keys valid

---

## Test Results Template

```markdown
## Test Execution Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** [Development/Staging/Production]

### Test Suite 1: Database and Schema
- [ ] Test 1.1: Tables Created - PASS/FAIL
- [ ] Test 1.2: Data Populated - PASS/FAIL
- [ ] Test 1.3: Indexes Created - PASS/FAIL
- [ ] Test 1.4: Views Working - PASS/FAIL
- [ ] Test 1.5: Functions Working - PASS/FAIL

### Test Suite 2: API Endpoints
- [ ] Test 2.1: List Profiles - PASS/FAIL
- [ ] Test 2.2: Get Profile - PASS/FAIL
- [ ] Test 2.3: Activity Feed 365 - PASS/FAIL
- [ ] Test 2.4: Activity Feed 5 Year - PASS/FAIL
- [ ] Test 2.5: Activity Filters - PASS/FAIL
- [ ] Test 2.6: Profile Activities - PASS/FAIL
- [ ] Test 2.7: Profile Metrics - PASS/FAIL
- [ ] Test 2.8: Statistics - PASS/FAIL
- [ ] Test 2.9: Search - PASS/FAIL

### Test Suite 3: Frontend Components
- [ ] Test 3.1: API Client - PASS/FAIL
- [ ] Test 3.2: Dashboard Data - PASS/FAIL
- [ ] Test 3.3: Activity Feed - PASS/FAIL

### Test Suite 4: Integration Tests
- [ ] Test 4.1: End-to-End Flow - PASS/FAIL
- [ ] Test 4.2: Performance - PASS/FAIL
- [ ] Test 4.3: Error Handling - PASS/FAIL
- [ ] Test 4.4: Caching - PASS/FAIL

### Test Suite 5: UI/UX Tests
- [ ] Test 5.1: Visual Verification - PASS/FAIL
- [ ] Test 5.2: Interaction Tests - PASS/FAIL
- [ ] Test 5.3: Accessibility - PASS/FAIL

### Test Suite 6: Data Accuracy
- [ ] Test 6.1: Data Consistency - PASS/FAIL
- [ ] Test 6.2: Relationships - PASS/FAIL

### Issues Found
1. [Issue description]
2. [Issue description]

### Overall Result
- Total Tests: [Number]
- Passed: [Number]
- Failed: [Number]
- Pass Rate: [Percentage]

### Recommendations
[Any recommendations for improvements]
```

---

## Automated Testing Script

```bash
#!/bin/bash
# automated-tests.sh

echo "Starting Automated Tests..."

# Test 1: Database Connection
echo "Test 1: Database Connection"
psql -U postgres -d auxeira_central -c "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Test 2: Table Count
echo "Test 2: Table Count"
TABLE_COUNT=$(psql -U postgres -d auxeira_central -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
if [ $TABLE_COUNT -ge 7 ]; then
    echo "✅ All tables exist ($TABLE_COUNT tables)"
else
    echo "❌ Missing tables (found $TABLE_COUNT)"
fi

# Test 3: Profile Count
echo "Test 3: Profile Count"
PROFILE_COUNT=$(psql -U postgres -d auxeira_central -t -c "SELECT COUNT(*) FROM startup_profiles;")
if [ $PROFILE_COUNT -eq 10000 ]; then
    echo "✅ Correct number of profiles ($PROFILE_COUNT)"
else
    echo "⚠️  Unexpected profile count ($PROFILE_COUNT, expected 10000)"
fi

# Test 4: API Health Check
echo "Test 4: API Health Check"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/startup-profiles/?limit=1)
if [ $HTTP_CODE -eq 200 ]; then
    echo "✅ API is responding (HTTP $HTTP_CODE)"
else
    echo "❌ API not responding (HTTP $HTTP_CODE)"
fi

# Test 5: 365-Day Feed
echo "Test 5: 365-Day Activity Feed"
FEED_365=$(curl -s "http://localhost:5000/api/startup-profiles/activity-feed?days=365&limit=1" | jq -r '.data.timeRange.days')
if [ "$FEED_365" == "365" ]; then
    echo "✅ 365-day feed working"
else
    echo "❌ 365-day feed not working"
fi

# Test 6: 5-Year Feed
echo "Test 6: 5-Year Activity Feed"
FEED_5Y=$(curl -s "http://localhost:5000/api/startup-profiles/activity-feed?days=1825&limit=1" | jq -r '.data.timeRange.isFiveYear')
if [ "$FEED_5Y" == "true" ]; then
    echo "✅ 5-year feed working"
else
    echo "❌ 5-year feed not working"
fi

echo "Automated tests complete!"
```

---

## Conclusion

This comprehensive testing guide covers all aspects of the database binding implementation. Follow each test suite systematically to ensure the system works correctly before deployment.

**Remember:**
- Test in development environment first
- Document all issues found
- Retest after fixes
- Get sign-off before production deployment

**Next Steps:**
1. Run all tests
2. Document results
3. Fix any issues
4. Retest
5. Deploy to production
6. Monitor performance

---

**Last Updated:** January 28, 2025
**Version:** 1.0.0
