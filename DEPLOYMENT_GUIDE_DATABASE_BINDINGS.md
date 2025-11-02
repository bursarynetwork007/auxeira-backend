# Deployment Guide - Database Bindings and 10,000 Startup Profiles

## Overview
This guide provides step-by-step instructions for deploying the database binding system with 10,000 simulated startup profiles, 365-day rolling feed, and 5-year toggle functionality.

---

## Pre-Deployment Checklist

### Code Review
- [ ] All code reviewed and approved
- [ ] No hardcoded credentials
- [ ] Environment variables configured
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Security best practices followed

### Testing
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Performance tests passing
- [ ] UI/UX tests passing
- [ ] Accessibility tests passing
- [ ] Cross-browser testing complete

### Documentation
- [ ] API documentation complete
- [ ] Code comments added
- [ ] README updated
- [ ] Deployment guide reviewed
- [ ] Testing guide reviewed

---

## Deployment Steps

### Step 1: Database Setup

#### 1.1 Create Database
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE auxeira_central;

# Create user (if not exists)
CREATE USER auxeira_user WITH PASSWORD 'secure_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE auxeira_central TO auxeira_user;

# Exit
\q
```

#### 1.2 Run Schema
```bash
# Navigate to database directory
cd /workspaces/auxeira-backend/backend/central-database/database

# Run schema script
psql -U auxeira_user -d auxeira_central -f startup_profiles_schema.sql

# Verify tables created
psql -U auxeira_user -d auxeira_central -c "\dt"
```

**Expected Output:**
```
List of relations
 Schema |         Name          | Type  |    Owner     
--------+-----------------------+-------+--------------
 public | startup_profiles      | table | auxeira_user
 public | activity_feed         | table | auxeira_user
 public | metrics_history       | table | auxeira_user
 public | users                 | table | auxeira_user
 public | organizations         | table | auxeira_user
 public | gamification_profiles | table | auxeira_user
 public | actions               | table | auxeira_user
```

#### 1.3 Verify Indexes
```bash
psql -U auxeira_user -d auxeira_central -c "\di"
```

**Expected:** Indexes including `idx_activity_feed_365_days` and `idx_activity_feed_5_years`

#### 1.4 Verify Views
```bash
psql -U auxeira_user -d auxeira_central -c "\dv"
```

**Expected:** Views including `activity_feed_365_days` and `activity_feed_5_years`

#### 1.5 Verify Functions
```bash
psql -U auxeira_user -d auxeira_central -c "\df"
```

**Expected:** Functions including `get_activity_feed` and `get_metrics_history`

---

### Step 2: Data Population

#### 2.1 Configure Seed Script
```bash
# Edit seed script with database credentials
nano backend/central-database/database/seed_10000_startups.py

# Update DB_CONFIG
DB_CONFIG = {
    'host': 'localhost',  # or your database host
    'database': 'auxeira_central',
    'user': 'auxeira_user',
    'password': 'secure_password_here'
}
```

#### 2.2 Install Dependencies
```bash
cd backend/central-database/database

# Install required packages
pip3 install psycopg2-binary faker numpy

# Or use requirements.txt
pip3 install -r ../requirements.txt
```

#### 2.3 Run Seed Script
```bash
# Run seed script (this will take 10-30 minutes)
python3 seed_10000_startups.py

# Monitor progress
# Expected output:
# Generating 10,000 startup profiles...
# Progress: 1000/10000 (10%)
# Progress: 2000/10000 (20%)
# ...
# Progress: 10000/10000 (100%)
# 
# Generating activities...
# Progress: 1000/10000 (10%)
# ...
# 
# Generating metrics history...
# Progress: 1000/10000 (10%)
# ...
# 
# Summary:
# - Startup Profiles: 10,000
# - Activities: 550,000
# - Metrics: 520,000
# - Total Time: 15 minutes
```

#### 2.4 Verify Data Population
```bash
# Check counts
psql -U auxeira_user -d auxeira_central << EOF
SELECT 'Startup Profiles' as table_name, COUNT(*) as count FROM startup_profiles
UNION ALL
SELECT 'Activity Feed', COUNT(*) FROM activity_feed
UNION ALL
SELECT 'Metrics History', COUNT(*) FROM metrics_history;
EOF
```

**Expected Output:**
```
    table_name     | count  
-------------------+--------
 Startup Profiles  | 10000
 Activity Feed     | 550000
 Metrics History   | 520000
```

#### 2.5 Verify Data Quality
```bash
# Check SSE score distribution
psql -U auxeira_user -d auxeira_central -c "
SELECT 
    CASE 
        WHEN sse_score < 40 THEN 'Low (0-39)'
        WHEN sse_score < 60 THEN 'Medium (40-59)'
        WHEN sse_score < 80 THEN 'Good (60-79)'
        ELSE 'Excellent (80-100)'
    END as sse_range,
    COUNT(*) as count
FROM startup_profiles
GROUP BY sse_range
ORDER BY sse_range;
"

# Check stage distribution
psql -U auxeira_user -d auxeira_central -c "
SELECT stage, COUNT(*) as count
FROM startup_profiles
GROUP BY stage
ORDER BY stage;
"

# Check activity date distribution
psql -U auxeira_user -d auxeira_central -c "
SELECT 
    CASE 
        WHEN activity_date >= NOW() - INTERVAL '30 days' THEN 'Last 30 days'
        WHEN activity_date >= NOW() - INTERVAL '90 days' THEN 'Last 90 days'
        WHEN activity_date >= NOW() - INTERVAL '365 days' THEN 'Last 365 days'
        ELSE 'Older than 1 year'
    END as time_range,
    COUNT(*) as count
FROM activity_feed
GROUP BY time_range
ORDER BY time_range;
"
```

---

### Step 3: Backend API Deployment

#### 3.1 Configure Environment Variables
```bash
# Create .env file
cat > backend/central-database/.env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auxeira_central
DB_USER=auxeira_user
DB_PASSWORD=secure_password_here

# API Configuration
SECRET_KEY=$(openssl rand -hex 32)
JWT_EXPIRATION_HOURS=24
JWT_ALGORITHM=HS256

# Server Configuration
FLASK_ENV=production
FLASK_DEBUG=False
PORT=5000

# CORS Configuration
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/auxeira/api.log
EOF

# Secure the .env file
chmod 600 backend/central-database/.env
```

#### 3.2 Install Backend Dependencies
```bash
cd backend/central-database

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 3.3 Test API Locally
```bash
# Start API server
python3 wsgi_handler.py

# In another terminal, test endpoints
curl http://localhost:5000/api/startup-profiles/?limit=1
curl http://localhost:5000/api/startup-profiles/activity-feed?days=365&limit=10
curl http://localhost:5000/api/startup-profiles/stats
```

**Expected:** All endpoints return valid JSON responses

#### 3.4 Deploy API (Production)

**Option A: Using Gunicorn**
```bash
# Install Gunicorn
pip install gunicorn

# Start with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 wsgi_handler:app

# Or with systemd service
sudo nano /etc/systemd/system/auxeira-api.service
```

**Service File:**
```ini
[Unit]
Description=Auxeira API Service
After=network.target postgresql.service

[Service]
Type=notify
User=auxeira
Group=auxeira
WorkingDirectory=/workspaces/auxeira-backend/backend/central-database
Environment="PATH=/workspaces/auxeira-backend/backend/central-database/venv/bin"
ExecStart=/workspaces/auxeira-backend/backend/central-database/venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 wsgi_handler:app
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable auxeira-api
sudo systemctl start auxeira-api
sudo systemctl status auxeira-api
```

**Option B: Using Docker**
```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "wsgi_handler:app"]
```

```bash
# Build and run
docker build -t auxeira-api .
docker run -d -p 5000:5000 --env-file .env auxeira-api
```

**Option C: Using AWS Lambda (Serverless)**
```bash
# Install serverless framework
npm install -g serverless

# Deploy
cd backend/central-database
serverless deploy --stage production
```

#### 3.5 Configure Nginx Reverse Proxy
```bash
sudo nano /etc/nginx/sites-available/auxeira-api
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name api.auxeira.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/auxeira-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 3.6 Setup SSL Certificate
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.auxeira.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

### Step 4: Frontend Deployment

#### 4.1 Update Frontend Files
```bash
# Copy JS files to frontend directory
cp frontend/js/api-client.js /path/to/frontend/js/
cp frontend/js/dashboard-data.js /path/to/frontend/js/
cp frontend/js/activity-feed.js /path/to/frontend/js/
```

#### 4.2 Update Dashboard HTML
```html
<!-- Add to dashboard HTML before closing </body> tag -->

<!-- API Client -->
<script src="/js/api-client.js"></script>

<!-- Dashboard Data Manager -->
<script src="/js/dashboard-data.js"></script>

<!-- Activity Feed Component -->
<script src="/js/activity-feed.js"></script>

<!-- Initialize Dashboard -->
<script>
document.addEventListener('DOMContentLoaded', () => {
    // Get profile ID from auth context
    const profileId = apiClient.getCurrentProfileId();
    
    if (!profileId) {
        console.error('No profile ID found');
        window.location.href = '/login.html';
        return;
    }
    
    // Initialize dashboard with real data
    const dashboard = new DashboardData(profileId);
    
    // Initialize activity feed (if activity tab exists)
    const activityTab = document.getElementById('activityFeedContainer');
    if (activityTab) {
        window.activityFeed = new ActivityFeed(profileId);
    }
});
</script>
```

#### 4.3 Update API Base URL
```javascript
// In api-client.js or config file
const API_BASE_URL = 'https://api.auxeira.com/api';  // Production URL

// Or use environment-based configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'
    : 'https://api.auxeira.com/api';
```

#### 4.4 Deploy Frontend

**Option A: Static Hosting (S3, Netlify, Vercel)**
```bash
# Build frontend (if using build process)
npm run build

# Deploy to S3
aws s3 sync dist/ s3://auxeira-frontend/ --delete

# Or deploy to Netlify
netlify deploy --prod --dir=dist
```

**Option B: Nginx Static Files**
```bash
# Copy files to web root
sudo cp -r frontend/* /var/www/auxeira/

# Configure Nginx
sudo nano /etc/nginx/sites-available/auxeira-frontend
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name auxeira.com www.auxeira.com;
    root /var/www/auxeira;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /js/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /css/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

### Step 5: Verification

#### 5.1 Verify Database
```bash
# Check database is accessible
psql -U auxeira_user -d auxeira_central -c "SELECT COUNT(*) FROM startup_profiles;"

# Check indexes are being used
psql -U auxeira_user -d auxeira_central -c "
EXPLAIN ANALYZE 
SELECT * FROM activity_feed 
WHERE activity_date >= NOW() - INTERVAL '365 days' 
LIMIT 50;
"
# Should show "Index Scan using idx_activity_feed_365_days"
```

#### 5.2 Verify API
```bash
# Test all endpoints
curl https://api.auxeira.com/api/startup-profiles/?limit=1
curl https://api.auxeira.com/api/startup-profiles/activity-feed?days=365&limit=10
curl https://api.auxeira.com/api/startup-profiles/activity-feed?days=1825&limit=10
curl https://api.auxeira.com/api/startup-profiles/stats
```

**Expected:** All return HTTP 200 with valid JSON

#### 5.3 Verify Frontend
1. Open https://auxeira.com in browser
2. Login to dashboard
3. Verify all metrics display real data (not hardcoded values)
4. Check charts display actual data
5. Navigate to Activity Feed tab
6. Verify activities display
7. Click "Show 5-Year History" button
8. Verify time range changes and more activities load
9. Test filters and pagination
10. Check browser console for errors

#### 5.4 Performance Check
```bash
# Test API response times
time curl -s https://api.auxeira.com/api/startup-profiles/?limit=50 > /dev/null
time curl -s https://api.auxeira.com/api/startup-profiles/activity-feed?days=365&limit=50 > /dev/null
time curl -s https://api.auxeira.com/api/startup-profiles/activity-feed?days=1825&limit=50 > /dev/null
```

**Expected:** All < 1 second

---

### Step 6: Monitoring and Logging

#### 6.1 Setup Application Monitoring
```bash
# Install monitoring tools
pip install prometheus-flask-exporter

# Add to API
from prometheus_flask_exporter import PrometheusMetrics
metrics = PrometheusMetrics(app)
```

#### 6.2 Setup Database Monitoring
```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Monitor slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

#### 6.3 Setup Log Aggregation
```bash
# Configure logging
sudo nano /etc/rsyslog.d/auxeira.conf
```

```
# Auxeira API logs
if $programname == 'auxeira-api' then /var/log/auxeira/api.log
& stop
```

#### 6.4 Setup Alerts
```bash
# Create alert script
cat > /usr/local/bin/auxeira-health-check.sh << 'EOF'
#!/bin/bash

# Check API health
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://api.auxeira.com/api/startup-profiles/?limit=1)

if [ $HTTP_CODE -ne 200 ]; then
    echo "API health check failed: HTTP $HTTP_CODE"
    # Send alert (email, Slack, PagerDuty, etc.)
    exit 1
fi

# Check database
psql -U auxeira_user -d auxeira_central -c "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Database health check failed"
    # Send alert
    exit 1
fi

echo "All systems operational"
EOF

chmod +x /usr/local/bin/auxeira-health-check.sh

# Add to crontab (run every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/auxeira-health-check.sh") | crontab -
```

---

### Step 7: Backup and Recovery

#### 7.1 Setup Database Backups
```bash
# Create backup script
cat > /usr/local/bin/auxeira-backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/auxeira"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/auxeira_central_$DATE.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U auxeira_user auxeira_central | gzip > $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
EOF

chmod +x /usr/local/bin/auxeira-backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/auxeira-backup.sh") | crontab -
```

#### 7.2 Test Backup Restoration
```bash
# Test restore
gunzip -c /var/backups/auxeira/auxeira_central_20250128_020000.sql.gz | \
    psql -U auxeira_user -d auxeira_central_test
```

---

## Post-Deployment Checklist

### Functionality
- [ ] All API endpoints responding
- [ ] Database queries performing well
- [ ] Frontend loading correctly
- [ ] Data binding working
- [ ] Charts displaying real data
- [ ] Activity feed showing activities
- [ ] 365-day default working
- [ ] 5-year toggle working
- [ ] Filters working
- [ ] Pagination working
- [ ] Search working

### Performance
- [ ] API response times < 500ms
- [ ] Page load time < 2 seconds
- [ ] Database queries optimized
- [ ] Indexes being used
- [ ] Caching working

### Security
- [ ] SSL certificates installed
- [ ] Environment variables secured
- [ ] Database credentials protected
- [ ] API authentication working
- [ ] CORS configured correctly

### Monitoring
- [ ] Application monitoring setup
- [ ] Database monitoring setup
- [ ] Log aggregation configured
- [ ] Alerts configured
- [ ] Health checks running

### Backup
- [ ] Database backups configured
- [ ] Backup restoration tested
- [ ] Backup retention policy set

---

## Rollback Plan

If issues occur after deployment:

### 1. Immediate Rollback
```bash
# Stop new API
sudo systemctl stop auxeira-api

# Restore previous version
git checkout previous-version
sudo systemctl start auxeira-api

# Restore database from backup
gunzip -c /var/backups/auxeira/latest_backup.sql.gz | \
    psql -U auxeira_user -d auxeira_central
```

### 2. Partial Rollback
```bash
# Keep database, rollback API only
git checkout previous-api-version
sudo systemctl restart auxeira-api

# Or keep API, rollback frontend only
git checkout previous-frontend-version
sudo cp -r frontend/* /var/www/auxeira/
```

---

## Troubleshooting

### Issue: API Not Responding
```bash
# Check service status
sudo systemctl status auxeira-api

# Check logs
sudo journalctl -u auxeira-api -n 100

# Check port
sudo netstat -tlnp | grep 5000
```

### Issue: Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U auxeira_user -d auxeira_central

# Check logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Issue: Slow Queries
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Analyze query plan
EXPLAIN ANALYZE SELECT * FROM activity_feed 
WHERE activity_date >= NOW() - INTERVAL '365 days' 
LIMIT 50;
```

### Issue: Frontend Not Loading Data
1. Open browser console (F12)
2. Check for JavaScript errors
3. Check network tab for failed API calls
4. Verify API base URL is correct
5. Check CORS headers

---

## Success Metrics

### Week 1
- [ ] Zero critical errors
- [ ] API uptime > 99%
- [ ] Average response time < 500ms
- [ ] User feedback positive

### Month 1
- [ ] All features working as expected
- [ ] Performance metrics met
- [ ] No data integrity issues
- [ ] User adoption increasing

---

## Support Contacts

- **Database Issues:** dba@auxeira.com
- **API Issues:** backend@auxeira.com
- **Frontend Issues:** frontend@auxeira.com
- **Infrastructure:** devops@auxeira.com
- **Emergency:** oncall@auxeira.com

---

## Conclusion

This deployment guide provides comprehensive instructions for deploying the database binding system with 10,000 startup profiles. Follow each step carefully and verify at each stage.

**Remember:**
- Test thoroughly before production
- Have rollback plan ready
- Monitor closely after deployment
- Document any issues encountered

---

**Last Updated:** January 28, 2025
**Version:** 1.0.0
**Status:** Ready for Deployment
