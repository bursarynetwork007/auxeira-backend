# Startup Profiles API Documentation

## Overview
This API provides access to 10,000 simulated startup profiles with timestamped data, supporting both 365-day rolling feed (default) and 5-year historical data toggle.

## Base URL
```
/api/startup-profiles
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. List Startup Profiles
Get a paginated list of startup profiles with filtering and sorting.

**Endpoint:** `GET /api/startup-profiles/`

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 50, max: 100) - Items per page
- `stage` (string) - Filter by stage: `seed`, `early`, `growth`, `scale`
- `industry` (string) - Filter by industry
- `min_sse` (integer) - Minimum SSE score (0-100)
- `max_sse` (integer) - Maximum SSE score (0-100)
- `sort_by` (string, default: `created_at`) - Sort field: `sse_score`, `company_name`, `created_at`, `mrr`, `arr`, `employees`
- `sort_order` (string, default: `desc`) - Sort order: `asc`, `desc`

**Example Request:**
```bash
GET /api/startup-profiles/?page=1&limit=50&stage=growth&min_sse=70&sort_by=sse_score&sort_order=desc
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "profiles": [
      {
        "profile_id": "uuid",
        "company_name": "TechCorp Inc",
        "founder_name": "John Doe",
        "industry": "Technology",
        "sector": "SaaS",
        "stage": "growth",
        "sse_score": 85,
        "sse_percentile": 92,
        "mrr": 150000.00,
        "arr": 1800000.00,
        "revenue": 2000000.00,
        "growth_rate": 25.5,
        "employees": 45,
        "customers": 1200,
        "active_users": 5000,
        "activities_completed": 87,
        "last_activity_date": "2025-01-15T10:30:00Z",
        "created_at": "2024-06-01T00:00:00Z",
        "updated_at": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1250,
      "totalPages": 25,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "stage": "growth",
      "industry": null,
      "minSse": 70,
      "maxSse": null
    }
  }
}
```

---

### 2. Get Startup Profile Details
Get detailed information about a specific startup profile.

**Endpoint:** `GET /api/startup-profiles/<profile_id>`

**Query Parameters:**
- `include_history` (boolean, default: false) - Include SSE score history
- `include_metrics` (boolean, default: false) - Include metrics history

**Example Request:**
```bash
GET /api/startup-profiles/550e8400-e29b-41d4-a716-446655440000?include_history=true&include_metrics=true
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "profile_id": "550e8400-e29b-41d4-a716-446655440000",
    "company_name": "TechCorp Inc",
    "founder_name": "John Doe",
    "industry": "Technology",
    "stage": "growth",
    "sse_score": 85,
    "sse_history": [
      {"date": "2025-01-01", "score": 85},
      {"date": "2024-12-01", "score": 82},
      {"date": "2024-11-01", "score": 78}
    ],
    "metrics_history": [
      {
        "metric_date": "2025-01-15",
        "metric_name": "MRR",
        "metric_value": 150000.00,
        "metric_type": "financial"
      }
    ]
  }
}
```

---

### 3. Get Activity Feed (365-Day Rolling Feed with 5-Year Toggle)
Get activity feed with rolling window support. **Default is 365 days, with optional 5-year toggle.**

**Endpoint:** `GET /api/startup-profiles/activity-feed`

**Query Parameters:**
- `days` (integer, default: **365**, max: **1825**) - Number of days to look back
  - **365** = Default 365-day rolling feed
  - **1825** = 5-year historical data (5 years × 365 days)
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 50, max: 100) - Items per page
- `profile_id` (uuid) - Filter by specific profile
- `activity_type` (string) - Filter by activity type
- `industry` (string) - Filter by industry

**Example Request (Default 365-day feed):**
```bash
GET /api/startup-profiles/activity-feed?page=1&limit=50
```

**Example Request (5-year toggle enabled):**
```bash
GET /api/startup-profiles/activity-feed?days=1825&page=1&limit=50
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "activity_id": "uuid",
        "profile_id": "uuid",
        "activity_date": "2025-01-15T10:30:00Z",
        "activity_type": "Product Launch",
        "activity_title": "Launched new feature",
        "activity_description": "Released AI-powered analytics dashboard",
        "impact_score": 8.5,
        "company_name": "TechCorp Inc",
        "industry": "Technology",
        "stage": "growth",
        "sse_score": 85
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 45000,
      "totalPages": 900,
      "hasNext": true,
      "hasPrev": false
    },
    "timeRange": {
      "days": 365,
      "isDefault": true,
      "isFiveYear": false
    },
    "filters": {
      "profileId": null,
      "activityType": null,
      "industry": null
    }
  }
}
```

---

### 4. Get Profile Activities
Get activities for a specific startup profile.

**Endpoint:** `GET /api/startup-profiles/<profile_id>/activities`

**Query Parameters:**
- `days` (integer, default: **365**, max: **1825**) - Number of days to look back
- `limit` (integer, default: 50, max: 100) - Number of activities to return

**Example Request:**
```bash
GET /api/startup-profiles/550e8400-e29b-41d4-a716-446655440000/activities?days=365&limit=50
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "profileId": "550e8400-e29b-41d4-a716-446655440000",
    "activities": [
      {
        "activity_id": "uuid",
        "activity_date": "2025-01-15T10:30:00Z",
        "activity_type": "Product Launch",
        "activity_title": "Launched new feature",
        "impact_score": 8.5
      }
    ],
    "count": 45,
    "timeRange": {
      "days": 365,
      "isDefault": true,
      "isFiveYear": false
    }
  }
}
```

---

### 5. Get Profile Metrics
Get metrics history for a startup profile.

**Endpoint:** `GET /api/startup-profiles/<profile_id>/metrics`

**Query Parameters:**
- `days` (integer, default: **365**, max: **1825**) - Number of days to look back
- `metric_name` (string) - Filter by specific metric name (e.g., `MRR`, `ARR`, `Customers`)
- `metric_type` (string) - Filter by metric type: `financial`, `team`, `market`, `activity`

**Example Request:**
```bash
GET /api/startup-profiles/550e8400-e29b-41d4-a716-446655440000/metrics?days=365&metric_type=financial
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "profileId": "550e8400-e29b-41d4-a716-446655440000",
    "metrics": [
      {
        "metric_date": "2025-01-15",
        "metric_name": "MRR",
        "metric_value": 150000.00,
        "metric_type": "financial"
      }
    ],
    "metricsByName": {
      "MRR": [
        {"date": "2025-01-15", "value": 150000.00, "type": "financial"},
        {"date": "2025-01-08", "value": 145000.00, "type": "financial"}
      ],
      "ARR": [
        {"date": "2025-01-15", "value": 1800000.00, "type": "financial"}
      ]
    },
    "count": 52,
    "timeRange": {
      "days": 365,
      "isDefault": true,
      "isFiveYear": false
    },
    "filters": {
      "metricName": null,
      "metricType": "financial"
    }
  }
}
```

---

### 6. Get Startup Statistics
Get aggregate statistics across all startup profiles.

**Endpoint:** `GET /api/startup-profiles/stats`

**Query Parameters:**
- `days` (integer, default: **365**, max: **1825**) - Number of days for activity stats

**Example Request:**
```bash
GET /api/startup-profiles/stats?days=365
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "profiles": {
      "total_profiles": 10000,
      "avg_sse_score": 65.4,
      "seed_count": 2500,
      "early_count": 3000,
      "growth_count": 2800,
      "scale_count": 1700,
      "total_mrr": 450000000.00,
      "total_arr": 5400000000.00,
      "total_employees": 125000,
      "total_customers": 2500000
    },
    "activities": {
      "total_activities": 450000,
      "active_profiles": 9850,
      "activity_types": 15
    },
    "topIndustries": [
      {"industry": "Technology", "count": 2500},
      {"industry": "Healthcare", "count": 1800},
      {"industry": "Finance", "count": 1500}
    ],
    "timeRange": {
      "days": 365,
      "isDefault": true
    }
  }
}
```

---

### 7. Search Startups
Search startup profiles by company name, founder name, or industry.

**Endpoint:** `GET /api/startup-profiles/search`

**Query Parameters:**
- `q` (string, required) - Search query
- `limit` (integer, default: 20, max: 50) - Number of results

**Example Request:**
```bash
GET /api/startup-profiles/search?q=tech&limit=20
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "query": "tech",
    "results": [
      {
        "profile_id": "uuid",
        "company_name": "TechCorp Inc",
        "founder_name": "John Doe",
        "industry": "Technology",
        "stage": "growth",
        "sse_score": 85,
        "mrr": 150000.00,
        "arr": 1800000.00,
        "employees": 45,
        "customers": 1200
      }
    ],
    "count": 15
  }
}
```

---

## 365-Day Rolling Feed vs 5-Year Toggle

### Default Behavior (365-Day Rolling Feed)
By default, all activity and metrics endpoints return data from the **last 365 days**. This provides:
- Recent, relevant data
- Optimized query performance (uses partial indexes)
- Focus on current trends and activities

**Example:**
```bash
GET /api/startup-profiles/activity-feed
# Returns activities from the last 365 days
```

### 5-Year Toggle
To access historical data beyond 365 days, use the `days` parameter with a value up to **1825** (5 years):

**Example:**
```bash
GET /api/startup-profiles/activity-feed?days=1825
# Returns activities from the last 5 years
```

**Response includes toggle state:**
```json
{
  "timeRange": {
    "days": 1825,
    "isDefault": false,
    "isFiveYear": true
  }
}
```

### Performance Considerations
- **365-day queries**: Use optimized partial indexes for fast performance
- **5-year queries**: May be slower due to larger dataset, but still efficient with proper indexing

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required field: email"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Profile not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "Database connection failed"
}
```

---

## Data Generation

### Seed 10,000 Startup Profiles
To populate the database with 10,000 simulated startup profiles:

```bash
cd /workspaces/auxeira-backend/backend/central-database/database
python3 seed_10000_startups.py
```

This will generate:
- 10,000 unique startup profiles
- 10-100 activities per startup (exponentially distributed, more recent activities are more common)
- 52 weekly metric data points per startup
- Realistic data based on stage (seed, early, growth, scale)

---

## Frontend Integration Examples

### React/JavaScript Example

#### Fetch 365-Day Activity Feed (Default)
```javascript
const fetchActivityFeed = async () => {
  const response = await fetch('/api/startup-profiles/activity-feed?page=1&limit=50', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.data.activities;
};
```

#### Toggle to 5-Year View
```javascript
const [timeRange, setTimeRange] = useState(365); // Default 365 days

const toggleFiveYearView = () => {
  setTimeRange(timeRange === 365 ? 1825 : 365);
};

const fetchActivityFeed = async () => {
  const response = await fetch(
    `/api/startup-profiles/activity-feed?days=${timeRange}&page=1&limit=50`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  const data = await response.json();
  return data.data;
};
```

#### Display Toggle Button
```jsx
<button onClick={toggleFiveYearView}>
  {timeRange === 365 ? 'Show 5-Year History' : 'Show Last 365 Days'}
</button>
```

---

## Database Schema

### Tables
1. **startup_profiles** - 10,000 startup profiles with comprehensive metrics
2. **activity_feed** - Timestamped activities for each startup
3. **metrics_history** - Time-series metrics data

### Views
1. **activity_feed_365_days** - Optimized view for 365-day rolling feed
2. **activity_feed_5_years** - View for 5-year historical data

### Functions
1. **get_activity_feed(profile_id, days, limit)** - Flexible activity retrieval
2. **get_metrics_history(profile_id, days, metric_name, metric_type)** - Flexible metrics retrieval

---

## Rate Limiting
- Default: 100 requests per minute per IP
- Authenticated: 1000 requests per minute per user

## Support
For issues or questions, contact: support@auxeira.com
