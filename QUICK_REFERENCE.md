# Quick Reference Guide
## Central Database with 10,000 Startup Profiles

---

## 🚀 Quick Start (5 Minutes)

### 1. Setup Database
```bash
createdb auxeira_central
psql auxeira_central < backend/central-database/database/startup_profiles_schema.sql
python3 backend/central-database/database/seed_10000_startups.py
```

### 2. Start API
```bash
cd backend/central-database
python3 wsgi_handler.py
```

### 3. Test
```bash
curl http://localhost:5000/api/startup-profiles/?limit=1
```

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `startup_profiles_schema.sql` | Database schema |
| `seed_10000_startups.py` | Data generation |
| `api/startup_profiles.py` | API endpoints |
| `js/api-client.js` | Frontend API client |
| `js/dashboard-data.js` | Dashboard data manager |
| `js/activity-feed.js` | Activity feed component |

---

## 🔌 API Endpoints

### List Profiles
```bash
GET /api/startup-profiles/?page=1&limit=50&stage=growth&min_sse=70
```

### Get Profile
```bash
GET /api/startup-profiles/<profile_id>?include_history=true
```

### Activity Feed (365-Day Default)
```bash
GET /api/startup-profiles/activity-feed?page=1&limit=50
```

### Activity Feed (5-Year Toggle)
```bash
GET /api/startup-profiles/activity-feed?days=1825&page=1&limit=50
```

### Profile Activities
```bash
GET /api/startup-profiles/<profile_id>/activities?days=365&limit=50
```

### Profile Metrics
```bash
GET /api/startup-profiles/<profile_id>/metrics?days=365&metric_type=financial
```

### Statistics
```bash
GET /api/startup-profiles/stats?days=365
```

### Search
```bash
GET /api/startup-profiles/search?q=tech&limit=20
```

---

## 💻 Frontend Usage

### Initialize Dashboard
```javascript
// In your dashboard HTML
<script src="/js/api-client.js"></script>
<script src="/js/dashboard-data.js"></script>
<script src="/js/activity-feed.js"></script>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const profileId = apiClient.getCurrentProfileId();
    const dashboard = new DashboardData(profileId);
    const activityFeed = new ActivityFeed(profileId);
});
</script>
```

### Fetch Data
```javascript
// Get profile
const profile = await apiClient.getProfile(profileId);

// Get 365-day feed (default)
const feed = await apiClient.getActivityFeed({ page: 1, limit: 50 });

// Get 5-year feed
const historicalFeed = await apiClient.getActivityFeed({ days: 1825, page: 1, limit: 50 });
```

### Toggle Time Range
```javascript
// In activity feed component
activityFeed.toggleTimeRange();
```

---

## 🗄️ Database Queries

### Check Data
```sql
-- Count profiles
SELECT COUNT(*) FROM startup_profiles;  -- Expected: 10000

-- Count activities
SELECT COUNT(*) FROM activity_feed;  -- Expected: 450000-1000000

-- Count metrics
SELECT COUNT(*) FROM metrics_history;  -- Expected: 520000
```

### Query 365-Day Feed
```sql
SELECT * FROM activity_feed_365_days LIMIT 50;
```

### Query 5-Year Feed
```sql
SELECT * FROM activity_feed_5_years LIMIT 50;
```

### Use Functions
```sql
-- Get activity feed
SELECT * FROM get_activity_feed(
    p_profile_id := NULL,
    p_days := 365,
    p_limit := 50
);

-- Get metrics history
SELECT * FROM get_metrics_history(
    p_profile_id := 'profile-id-here',
    p_days := 365,
    p_metric_name := 'MRR',
    p_metric_type := 'financial'
);
```

---

## 🧪 Testing Commands

### Test Database
```bash
psql auxeira_central -c "SELECT COUNT(*) FROM startup_profiles;"
psql auxeira_central -c "SELECT COUNT(*) FROM activity_feed WHERE activity_date >= NOW() - INTERVAL '365 days';"
```

### Test API
```bash
# Health check
curl http://localhost:5000/api/startup-profiles/?limit=1

# 365-day feed
curl http://localhost:5000/api/startup-profiles/activity-feed?days=365&limit=10

# 5-year feed
curl http://localhost:5000/api/startup-profiles/activity-feed?days=1825&limit=10
```

### Test Frontend
```javascript
// Open browser console
const profile = await apiClient.getProfile('profile-id-here');
console.log(profile);

const feed = await apiClient.getActivityFeed({ days: 365, limit: 10 });
console.log(feed);
```

---

## 🔧 Configuration

### Environment Variables
```bash
# Database
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=auxeira_central
export DB_USER=postgres
export DB_PASSWORD=your_password

# API
export SECRET_KEY=your_secret_key
export JWT_EXPIRATION_HOURS=24
```

### API Client Config
```javascript
// In api-client.js
const API_BASE_URL = 'http://localhost:5000/api';  // Development
// const API_BASE_URL = 'https://api.auxeira.com/api';  // Production
```

---

## 📊 Data Structure

### Startup Profile
```json
{
  "profile_id": "uuid",
  "company_name": "TechCorp Inc",
  "founder_name": "John Doe",
  "sse_score": 85,
  "mrr": 150000.00,
  "arr": 1800000.00,
  "customers": 1200,
  "employees": 45,
  "stage": "growth",
  "industry": "Technology"
}
```

### Activity
```json
{
  "activity_id": "uuid",
  "profile_id": "uuid",
  "activity_date": "2025-01-15T10:30:00Z",
  "activity_type": "Product Launch",
  "activity_title": "Launched new feature",
  "activity_description": "Released AI-powered analytics",
  "impact_score": 8.5,
  "company_name": "TechCorp Inc",
  "industry": "Technology",
  "stage": "growth",
  "sse_score": 85
}
```

### Metric
```json
{
  "metric_date": "2025-01-15",
  "metric_name": "MRR",
  "metric_value": 150000.00,
  "metric_type": "financial"
}
```

---

## 🎯 Common Tasks

### Add New Profile
```sql
INSERT INTO startup_profiles (company_name, founder_name, sse_score, mrr, stage, industry)
VALUES ('New Startup', 'Jane Smith', 75, 50000, 'seed', 'Technology');
```

### Add Activity
```sql
INSERT INTO activity_feed (profile_id, activity_date, activity_type, activity_title, impact_score)
VALUES ('profile-id-here', NOW(), 'Product Launch', 'Launched MVP', 8.0);
```

### Add Metric
```sql
INSERT INTO metrics_history (profile_id, metric_date, metric_name, metric_value, metric_type)
VALUES ('profile-id-here', NOW(), 'MRR', 55000, 'financial');
```

### Update SSE Score
```sql
UPDATE startup_profiles 
SET sse_score = 80, last_sse_update = NOW()
WHERE profile_id = 'profile-id-here';
```

---

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check connection
psql -U postgres -d auxeira_central
```

### API Not Responding
```bash
# Check if running
ps aux | grep python

# Check port
sudo netstat -tlnp | grep 5000

# Restart API
cd backend/central-database
python3 wsgi_handler.py
```

### No Data Returned
```bash
# Check if data exists
psql auxeira_central -c "SELECT COUNT(*) FROM startup_profiles;"

# If 0, run seed script
python3 backend/central-database/database/seed_10000_startups.py
```

### Slow Queries
```sql
-- Check if indexes are being used
EXPLAIN ANALYZE 
SELECT * FROM activity_feed 
WHERE activity_date >= NOW() - INTERVAL '365 days' 
LIMIT 50;

-- Should show: "Index Scan using idx_activity_feed_365_days"
```

---

## 📈 Performance Tips

### Database
- Use partial indexes for time-based queries
- Regularly run `VACUUM ANALYZE`
- Monitor slow queries with `pg_stat_statements`

### API
- Enable caching (5-minute default)
- Use pagination (max 100 items)
- Filter data at database level

### Frontend
- Use client-side caching
- Implement lazy loading
- Debounce search inputs

---

## 🔐 Security Checklist

- [ ] Environment variables secured
- [ ] Database credentials protected
- [ ] JWT tokens used for authentication
- [ ] CORS configured correctly
- [ ] SQL injection prevention (parameterized queries)
- [ ] Input validation on all endpoints
- [ ] HTTPS enabled in production
- [ ] Rate limiting configured

---

## 📞 Quick Links

- **Full API Docs:** `API_DOCUMENTATION.md`
- **Testing Guide:** `TESTING_GUIDE.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE_DATABASE_BINDINGS.md`
- **Implementation Summary:** `DATABASE_BINDING_IMPLEMENTATION_SUMMARY.md`
- **Project Summary:** `PROJECT_COMPLETE_SUMMARY.md`

---

## 💡 Tips

### Development
- Use `console.log()` to debug API responses
- Check browser Network tab for failed requests
- Use PostgreSQL `EXPLAIN ANALYZE` for slow queries

### Testing
- Test 365-day feed first (default)
- Then test 5-year toggle
- Verify pagination works
- Test filters independently

### Deployment
- Test in staging first
- Have rollback plan ready
- Monitor logs closely
- Start with small user group

---

## 🎓 Key Concepts

### 365-Day Rolling Feed
- **Default behavior** for optimal performance
- Uses partial index for fast queries
- Shows recent, relevant data
- Response time: < 300ms

### 5-Year Toggle
- **Optional feature** for historical analysis
- Activated with `days=1825` parameter
- Shows comprehensive data
- Response time: < 500ms

### Data Binding
- Replaces all hardcoded values
- Real-time updates every 30 seconds
- Automatic error handling
- Client-side caching

---

## 📝 Cheat Sheet

```bash
# Setup
createdb auxeira_central
psql auxeira_central < schema.sql
python3 seed_10000_startups.py

# Start
python3 wsgi_handler.py

# Test
curl localhost:5000/api/startup-profiles/?limit=1

# Query
psql auxeira_central -c "SELECT COUNT(*) FROM startup_profiles;"

# Monitor
tail -f /var/log/auxeira/api.log

# Backup
pg_dump auxeira_central | gzip > backup.sql.gz

# Restore
gunzip -c backup.sql.gz | psql auxeira_central
```

---

**Last Updated:** January 28, 2025  
**Version:** 1.0.0

For detailed information, see the full documentation files.
