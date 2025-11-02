# Placeholder Data Mapping and Database Binding Plan

## Overview
This document identifies all placeholder/hardcoded data in the Auxeira dashboards and provides a comprehensive plan to replace them with real database bindings from the central database with 10,000 simulated startup profiles.

---

## Current Placeholder Data Locations

### 1. Startup Founder Dashboard (`/dashboard-optimized/startup/index.html`)

#### DashboardData Class (Lines 1840-1867)
**Current Hardcoded Data:**
```javascript
this.data = {
    founder_name: "Sarah Chen",
    company_name: "TechFlow Solutions",
    sse_score: 78,
    company_valuation: "$2.4M",
    mrr: "$18,500",
    cac: "$127",
    aux_tokens: 1247,
    total_customers: 1247,
    ltv: "$1,890",
    churn_rate: "2.3%",
    funding_readiness: 72,
    runway_months: 14,
    burn_rate: "$12,500",
    revenue_multiple: "13.2x",
    team_size: 12,
    learning_streak: 15,
    aux_earned_today: 45,
    knowledge_score: 87,
    partnership_revenue: "$45K",
    active_partnerships: 3,
    partnership_leads: 127
};
```

**Database Binding:**
- **API Endpoint:** `GET /api/startup-profiles/<profile_id>`
- **Mapping:**
  - `founder_name` → `startup_profiles.founder_name`
  - `company_name` → `startup_profiles.company_name`
  - `sse_score` → `startup_profiles.sse_score`
  - `company_valuation` → `startup_profiles.valuation`
  - `mrr` → `startup_profiles.mrr`
  - `cac` → `startup_profiles.cac`
  - `aux_tokens` → `gamification_profiles.total_tokens`
  - `total_customers` → `startup_profiles.customers`
  - `ltv` → `startup_profiles.ltv`
  - `churn_rate` → `startup_profiles.churn_rate`
  - `funding_readiness` → `startup_profiles.funding_readiness_score`
  - `runway_months` → `startup_profiles.runway_months`
  - `burn_rate` → `startup_profiles.burn_rate`
  - `revenue_multiple` → Calculated: `valuation / arr`
  - `team_size` → `startup_profiles.employees`
  - `learning_streak` → `gamification_profiles.current_streak`
  - `aux_earned_today` → Query: `SUM(actual_tokens) FROM actions WHERE DATE(created_at) = CURRENT_DATE`
  - `knowledge_score` → `gamification_profiles.knowledge_score`
  - `partnership_revenue` → `startup_profiles.partnership_revenue`
  - `active_partnerships` → `startup_profiles.active_partnerships`
  - `partnership_leads` → `startup_profiles.partnership_leads`

---

#### Growth Chart Data (Lines 1880-1895)
**Current Hardcoded Data:**
```javascript
labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
datasets: [{
    label: 'MRR ($K)',
    data: [8, 12, 15, 16, 17, 18.5],
    // ...
}, {
    label: 'SSE Score',
    data: [65, 68, 72, 75, 76, 78],
    // ...
}]
```

**Database Binding:**
- **API Endpoint:** `GET /api/startup-profiles/<profile_id>/metrics?days=180&metric_type=financial`
- **Data Processing:**
  1. Fetch metrics history for last 6 months
  2. Group by month
  3. Extract MRR values: `WHERE metric_name = 'MRR'`
  4. Extract SSE scores from `sse_score_history` JSONB field
  5. Format labels as month names
  6. Populate datasets with actual values

**Implementation:**
```javascript
async function fetchGrowthChartData(profileId) {
    const response = await fetch(`/api/startup-profiles/${profileId}/metrics?days=180&metric_type=financial`);
    const data = await response.json();
    
    // Group by month and extract MRR
    const monthlyData = groupByMonth(data.data.metrics);
    const labels = monthlyData.map(m => m.month);
    const mrrData = monthlyData.map(m => m.mrr / 1000); // Convert to $K
    
    // Fetch SSE history
    const profileResponse = await fetch(`/api/startup-profiles/${profileId}?include_history=true`);
    const profileData = await profileResponse.json();
    const sseData = profileData.data.sse_history.slice(-6).map(h => h.score);
    
    return { labels, mrrData, sseData };
}
```

---

#### Customer Acquisition Chart (Lines 1897-1920)
**Current Hardcoded Data:**
```javascript
labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
datasets: [{
    label: 'New Customers',
    data: [45, 67, 89, 123, 156, 187],
    // ...
}]
```

**Database Binding:**
- **API Endpoint:** `GET /api/startup-profiles/<profile_id>/metrics?days=180&metric_name=Customers`
- **Data Processing:**
  1. Fetch customer metrics for last 6 months
  2. Calculate new customers per month (difference from previous month)
  3. Format as chart data

**Implementation:**
```javascript
async function fetchAcquisitionChartData(profileId) {
    const response = await fetch(`/api/startup-profiles/${profileId}/metrics?days=180&metric_name=Customers`);
    const data = await response.json();
    
    const monthlyData = groupByMonth(data.data.metricsByName.Customers);
    const labels = monthlyData.map(m => m.month);
    const newCustomers = monthlyData.map((m, i) => {
        if (i === 0) return m.value;
        return m.value - monthlyData[i-1].value;
    });
    
    return { labels, newCustomers };
}
```

---

#### Revenue Breakdown Chart (Lines 1922-1950)
**Current Hardcoded Data:**
```javascript
labels: ['Enterprise', 'SMB', 'Startup', 'Individual'],
datasets: [{
    data: [45, 30, 20, 5],
    // ...
}]
```

**Database Binding:**
- **API Endpoint:** `GET /api/startup-profiles/<profile_id>/metrics?metric_name=Revenue_Breakdown`
- **Alternative:** Store in `startup_profiles.revenue_breakdown` JSONB field
- **Data Processing:**
  1. Fetch revenue breakdown from profile metadata
  2. Parse JSONB data
  3. Format as chart data

**Implementation:**
```javascript
async function fetchRevenueBreakdownData(profileId) {
    const response = await fetch(`/api/startup-profiles/${profileId}`);
    const data = await response.json();
    
    const breakdown = data.data.revenue_breakdown || {
        enterprise: 45,
        smb: 30,
        startup: 20,
        individual: 5
    };
    
    return {
        labels: ['Enterprise', 'SMB', 'Startup', 'Individual'],
        data: [breakdown.enterprise, breakdown.smb, breakdown.startup, breakdown.individual]
    };
}
```

---

### 2. Activity Feed (Throughout Dashboard)

**Current State:** No activity feed implemented in current dashboard

**Database Binding:**
- **API Endpoint:** `GET /api/startup-profiles/activity-feed?days=365&profile_id=<profile_id>`
- **Default:** 365-day rolling feed
- **Toggle:** 5-year view with `days=1825`

**Implementation:**
```javascript
class ActivityFeed {
    constructor(profileId) {
        this.profileId = profileId;
        this.timeRange = 365; // Default 365 days
        this.currentPage = 1;
        this.limit = 50;
    }
    
    async fetchActivities() {
        const response = await fetch(
            `/api/startup-profiles/activity-feed?` +
            `days=${this.timeRange}&` +
            `profile_id=${this.profileId}&` +
            `page=${this.currentPage}&` +
            `limit=${this.limit}`
        );
        const data = await response.json();
        return data.data;
    }
    
    toggleFiveYearView() {
        this.timeRange = this.timeRange === 365 ? 1825 : 365;
        this.currentPage = 1;
        this.fetchActivities().then(data => this.renderActivities(data));
    }
    
    renderActivities(data) {
        const container = document.getElementById('activityFeedContainer');
        container.innerHTML = data.activities.map(activity => `
            <div class="activity-item glass-card mb-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="text-primary">${activity.activity_title}</h6>
                        <p class="text-secondary mb-1">${activity.activity_description}</p>
                        <small class="text-muted">
                            ${activity.company_name} • ${activity.industry} • 
                            ${new Date(activity.activity_date).toLocaleDateString()}
                        </small>
                    </div>
                    <span class="badge bg-primary">Impact: ${activity.impact_score}/10</span>
                </div>
            </div>
        `).join('');
        
        // Render pagination
        this.renderPagination(data.pagination);
    }
    
    renderPagination(pagination) {
        const paginationContainer = document.getElementById('activityPagination');
        paginationContainer.innerHTML = `
            <button class="btn btn-sm btn-outline-primary" 
                    ${!pagination.hasPrev ? 'disabled' : ''}
                    onclick="activityFeed.previousPage()">
                Previous
            </button>
            <span class="mx-3">Page ${pagination.page} of ${pagination.totalPages}</span>
            <button class="btn btn-sm btn-outline-primary" 
                    ${!pagination.hasNext ? 'disabled' : ''}
                    onclick="activityFeed.nextPage()">
                Next
            </button>
        `;
    }
    
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.fetchActivities().then(data => this.renderActivities(data));
        }
    }
    
    nextPage() {
        this.currentPage++;
        this.fetchActivities().then(data => this.renderActivities(data));
    }
}

// Initialize activity feed
let activityFeed;
document.addEventListener('DOMContentLoaded', () => {
    const profileId = getCurrentUserProfileId(); // Get from auth context
    activityFeed = new ActivityFeed(profileId);
    activityFeed.fetchActivities().then(data => activityFeed.renderActivities(data));
});
```

---

### 3. Other Dashboards

#### Angel Investor Dashboard (`/dashboard-optimized/angel/index.html`)
**Placeholder Data:**
- Portfolio companies list
- Investment metrics
- Deal flow statistics

**Database Binding:**
- **API Endpoint:** `GET /api/startup-profiles/?min_sse=70&stage=seed,early&limit=50`
- **Use Case:** Show high-potential startups for investment consideration
- **Filters:** SSE score, stage, industry, funding needs

#### Government Dashboard (`/dashboard-optimized/government/index.html`)
**Placeholder Data:**
- Economic impact metrics
- Job creation statistics
- Innovation indicators

**Database Binding:**
- **API Endpoint:** `GET /api/startup-profiles/stats?days=365`
- **Aggregations:**
  - Total startups by region
  - Total employees (job creation)
  - Total revenue (economic impact)
  - Industry distribution

#### Corporate Partner Dashboard (`/dashboard-optimized/corporate/index.html`)
**Placeholder Data:**
- Partnership opportunities
- Innovation pipeline
- Collaboration metrics

**Database Binding:**
- **API Endpoint:** `GET /api/startup-profiles/?industry=<relevant_industry>&stage=growth,scale`
- **Use Case:** Identify startups for partnerships, acquisitions, or innovation programs

---

## Implementation Plan

### Phase 1: API Integration Layer (Week 1)
1. Create `api-client.js` utility for all API calls
2. Implement authentication token management
3. Add error handling and retry logic
4. Create data transformation utilities

**File:** `/frontend/js/api-client.js`
```javascript
class AuxeiraAPIClient {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('auxeira_token');
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            ...options.headers
        };
        
        try {
            const response = await fetch(url, { ...options, headers });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request Failed:', error);
            throw error;
        }
    }
    
    // Startup Profiles
    async getProfile(profileId, options = {}) {
        const params = new URLSearchParams(options);
        return this.request(`/startup-profiles/${profileId}?${params}`);
    }
    
    async listProfiles(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/startup-profiles/?${params}`);
    }
    
    async getActivityFeed(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/startup-profiles/activity-feed?${params}`);
    }
    
    async getProfileActivities(profileId, options = {}) {
        const params = new URLSearchParams(options);
        return this.request(`/startup-profiles/${profileId}/activities?${params}`);
    }
    
    async getProfileMetrics(profileId, options = {}) {
        const params = new URLSearchParams(options);
        return this.request(`/startup-profiles/${profileId}/metrics?${params}`);
    }
    
    async getStats(options = {}) {
        const params = new URLSearchParams(options);
        return this.request(`/startup-profiles/stats?${params}`);
    }
    
    async searchProfiles(query, limit = 20) {
        const params = new URLSearchParams({ q: query, limit });
        return this.request(`/startup-profiles/search?${params}`);
    }
}

// Export singleton instance
const apiClient = new AuxeiraAPIClient();
```

---

### Phase 2: Dashboard Data Binding (Week 2)
1. Update `DashboardData` class to fetch from API
2. Replace hardcoded chart data with API calls
3. Implement loading states and error handling
4. Add data caching for performance

**Updated DashboardData Class:**
```javascript
class DashboardData {
    constructor(profileId) {
        this.profileId = profileId;
        this.data = {};
        this.charts = {};
        this.init();
    }
    
    async init() {
        this.showLoading();
        try {
            await this.fetchProfileData();
            await this.fetchMetricsData();
            this.bindData();
            this.initializeCharts();
            this.setupEventListeners();
            this.startDataUpdates();
        } catch (error) {
            this.showError('Failed to load dashboard data');
            console.error(error);
        } finally {
            this.hideLoading();
        }
    }
    
    async fetchProfileData() {
        const response = await apiClient.getProfile(this.profileId, {
            include_history: true,
            include_metrics: false
        });
        
        if (response.success) {
            this.data = {
                founder_name: response.data.founder_name,
                company_name: response.data.company_name,
                sse_score: response.data.sse_score,
                company_valuation: this.formatCurrency(response.data.valuation),
                mrr: this.formatCurrency(response.data.mrr),
                cac: this.formatCurrency(response.data.cac),
                total_customers: response.data.customers,
                ltv: this.formatCurrency(response.data.ltv),
                churn_rate: `${response.data.churn_rate}%`,
                funding_readiness: response.data.funding_readiness_score,
                runway_months: response.data.runway_months,
                burn_rate: this.formatCurrency(response.data.burn_rate),
                revenue_multiple: `${(response.data.valuation / response.data.arr).toFixed(1)}x`,
                team_size: response.data.employees,
                partnership_revenue: this.formatCurrency(response.data.partnership_revenue),
                active_partnerships: response.data.active_partnerships,
                partnership_leads: response.data.partnership_leads
            };
        }
    }
    
    async fetchMetricsData() {
        const response = await apiClient.getProfileMetrics(this.profileId, {
            days: 180,
            metric_type: 'financial'
        });
        
        if (response.success) {
            this.metricsData = response.data;
        }
    }
    
    formatCurrency(value) {
        if (!value) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }
    
    showLoading() {
        document.getElementById('dashboardContent').innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-secondary">Loading your dashboard...</p>
            </div>
        `;
    }
    
    hideLoading() {
        document.getElementById('dashboardContent').style.display = 'block';
    }
    
    showError(message) {
        document.getElementById('dashboardContent').innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
                <button class="btn btn-sm btn-outline-danger ms-3" onclick="location.reload()">
                    Retry
                </button>
            </div>
        `;
    }
    
    // ... rest of the methods
}
```

---

### Phase 3: Activity Feed Implementation (Week 3)
1. Create activity feed component
2. Implement 365-day rolling feed (default)
3. Add 5-year toggle button
4. Implement pagination and filtering
5. Add real-time updates

**HTML Structure:**
```html
<!-- Activity Feed Section -->
<div class="tab-pane fade" id="activity" role="tabpanel">
    <div class="glass-card">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4 class="mb-0">Activity Feed</h4>
            <div>
                <button class="btn btn-sm btn-outline-primary" id="toggleTimeRange">
                    <i class="fas fa-clock me-2"></i>
                    <span id="timeRangeText">Show 5-Year History</span>
                </button>
                <button class="btn btn-sm btn-outline-secondary ms-2" onclick="activityFeed.refresh()">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
        </div>
        
        <!-- Time Range Indicator -->
        <div class="alert alert-info mb-3" id="timeRangeIndicator">
            <i class="fas fa-info-circle me-2"></i>
            Showing activities from the last <strong id="currentTimeRange">365 days</strong>
        </div>
        
        <!-- Filters -->
        <div class="row mb-3">
            <div class="col-md-4">
                <select class="form-select" id="activityTypeFilter">
                    <option value="">All Activity Types</option>
                    <option value="Product Launch">Product Launch</option>
                    <option value="Funding Round">Funding Round</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Customer Interviews">Customer Interviews</option>
                    <!-- More options -->
                </select>
            </div>
            <div class="col-md-4">
                <select class="form-select" id="industryFilter">
                    <option value="">All Industries</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <!-- More options -->
                </select>
            </div>
            <div class="col-md-4">
                <input type="text" class="form-control" id="searchActivities" 
                       placeholder="Search activities...">
            </div>
        </div>
        
        <!-- Activity Feed Container -->
        <div id="activityFeedContainer">
            <!-- Activities will be rendered here -->
        </div>
        
        <!-- Pagination -->
        <div class="d-flex justify-content-center mt-4" id="activityPagination">
            <!-- Pagination will be rendered here -->
        </div>
    </div>
</div>
```

---

### Phase 4: Testing and Optimization (Week 4)
1. Test all API integrations
2. Verify data accuracy
3. Optimize query performance
4. Add caching layer
5. Implement error recovery
6. Load testing with 10,000 profiles

---

## Database Schema Updates Required

### Add Missing Fields to `startup_profiles` Table
```sql
ALTER TABLE startup_profiles ADD COLUMN IF NOT EXISTS cac DECIMAL(15,2) DEFAULT 0;
ALTER TABLE startup_profiles ADD COLUMN IF NOT EXISTS ltv DECIMAL(15,2) DEFAULT 0;
ALTER TABLE startup_profiles ADD COLUMN IF NOT EXISTS churn_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE startup_profiles ADD COLUMN IF NOT EXISTS funding_readiness_score INTEGER DEFAULT 0;
ALTER TABLE startup_profiles ADD COLUMN IF NOT EXISTS partnership_revenue DECIMAL(15,2) DEFAULT 0;
ALTER TABLE startup_profiles ADD COLUMN IF NOT EXISTS active_partnerships INTEGER DEFAULT 0;
ALTER TABLE startup_profiles ADD COLUMN IF NOT EXISTS partnership_leads INTEGER DEFAULT 0;
ALTER TABLE startup_profiles ADD COLUMN IF NOT EXISTS revenue_breakdown JSONB DEFAULT '{}';
```

### Update Seed Script
Update `seed_10000_startups.py` to generate these additional fields:
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- Churn Rate
- Funding Readiness Score
- Partnership metrics
- Revenue breakdown by customer segment

---

## Frontend File Structure

```
frontend/
├── js/
│   ├── api-client.js              # API client utility
│   ├── dashboard-data.js          # Dashboard data management
│   ├── activity-feed.js           # Activity feed component
│   ├── charts.js                  # Chart utilities
│   └── utils.js                   # Helper functions
├── dashboard/
│   ├── startup_founder.html       # Main dashboard (updated)
│   ├── angel_investor.html        # Angel dashboard (updated)
│   ├── government.html            # Government dashboard (updated)
│   └── corporate_partner.html     # Corporate dashboard (updated)
└── components/
    ├── activity-feed.html         # Activity feed template
    ├── metrics-card.html          # Metrics card template
    └── chart-container.html       # Chart container template
```

---

## Environment Configuration

### Frontend Environment Variables
```javascript
// config.js
const CONFIG = {
    API_BASE_URL: process.env.API_BASE_URL || '/api',
    DEFAULT_TIME_RANGE: 365,
    MAX_TIME_RANGE: 1825,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    REFRESH_INTERVAL: 30 * 1000,   // 30 seconds
    PAGINATION_LIMIT: 50
};
```

---

## Success Metrics

### Data Binding Success Criteria
1. ✅ All hardcoded data replaced with API calls
2. ✅ 365-day rolling feed implemented and working
3. ✅ 5-year toggle functional
4. ✅ Real-time data updates working
5. ✅ Charts displaying actual data from database
6. ✅ Activity feed showing timestamped activities
7. ✅ Pagination working correctly
8. ✅ Filters and search functional
9. ✅ Error handling and loading states implemented
10. ✅ Performance: Page load < 2 seconds

### Performance Targets
- Initial page load: < 2 seconds
- API response time: < 500ms
- Chart rendering: < 1 second
- Activity feed load: < 1 second
- Search results: < 300ms

---

## Rollout Plan

### Week 1: API Integration
- Day 1-2: Create API client utility
- Day 3-4: Implement authentication and error handling
- Day 5: Testing and documentation

### Week 2: Dashboard Updates
- Day 1-2: Update DashboardData class
- Day 3-4: Replace chart data with API calls
- Day 5: Testing and bug fixes

### Week 3: Activity Feed
- Day 1-2: Implement activity feed component
- Day 3: Add 365-day/5-year toggle
- Day 4: Implement pagination and filters
- Day 5: Testing and optimization

### Week 4: Testing and Launch
- Day 1-2: Integration testing
- Day 3: Performance optimization
- Day 4: User acceptance testing
- Day 5: Production deployment

---

## Maintenance and Monitoring

### Monitoring Points
1. API response times
2. Error rates
3. User engagement with activity feed
4. Toggle usage (365-day vs 5-year)
5. Most viewed metrics
6. Search query patterns

### Logging
```javascript
// Log all API calls for monitoring
apiClient.request = async function(endpoint, options) {
    const startTime = Date.now();
    try {
        const response = await fetch(url, { ...options, headers });
        const duration = Date.now() - startTime;
        
        // Log successful request
        console.log({
            endpoint,
            method: options.method || 'GET',
            duration,
            status: response.status,
            timestamp: new Date().toISOString()
        });
        
        return await response.json();
    } catch (error) {
        // Log error
        console.error({
            endpoint,
            error: error.message,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
};
```

---

## Next Steps

1. ✅ Review and approve this mapping document
2. ⏳ Update database schema with missing fields
3. ⏳ Update seed script to generate additional data
4. ⏳ Run seed script to populate 10,000 profiles
5. ⏳ Implement API client utility
6. ⏳ Update dashboard with database bindings
7. ⏳ Implement activity feed with toggle
8. ⏳ Test and deploy

---

## Questions and Clarifications

1. **User Authentication:** How do we determine which profile_id to use for each logged-in user?
   - Option A: Store profile_id in JWT token
   - Option B: Query user_organizations table to get org_id, then use as profile_id
   - Option C: Create user_profiles mapping table

2. **Data Refresh Rate:** How often should we refresh dashboard data?
   - Recommendation: Every 30 seconds for metrics, real-time for activity feed

3. **Caching Strategy:** Should we implement client-side caching?
   - Recommendation: Yes, cache for 5 minutes to reduce API calls

4. **Fallback Data:** What should we show if API fails?
   - Recommendation: Show last cached data with warning banner

5. **Multi-Profile Support:** Should users be able to view multiple startup profiles?
   - Recommendation: Yes, add profile switcher in header

---

## Conclusion

This comprehensive mapping provides a clear path to replace all placeholder data with real database bindings. The implementation will transform the dashboard from a static prototype to a fully functional, data-driven application powered by 10,000 simulated startup profiles with timestamped data and a 365-day rolling feed (with 5-year toggle option).

**Estimated Total Implementation Time:** 4 weeks
**Team Size:** 2-3 developers
**Priority:** High
**Risk Level:** Medium (requires careful testing to ensure data accuracy)
