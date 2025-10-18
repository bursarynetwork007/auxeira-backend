# Auxeira Dashboard Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Setup ✓

- [ ] Copy `.env.example` to `.env`
- [ ] Set `OPENAI_API_KEY` with production key
- [ ] Set `NODE_ENV=production`
- [ ] Set `PORT` (default: 3000)
- [ ] Configure `CORS_ORIGIN` for your domain
- [ ] (Optional) Set up Redis for production caching

```bash
cp .env.example .env
nano .env  # Edit with your values
```

### 2. Dependencies Installation ✓

- [ ] Install Node.js dependencies

```bash
cd dashboard-html
npm install
```

### 3. Backend Testing ✓

- [ ] Start backend server
- [ ] Test health endpoint
- [ ] Test content generation
- [ ] Test causal narrative generation
- [ ] Verify caching works

```bash
# Start server
npm start

# Test endpoints
curl http://localhost:3000/health
curl -X POST http://localhost:3000/generate-content \
  -H "Content-Type: application/json" \
  -d '{"dashboard":"VC","tab":"overview","profile":{"type":"VC"},"data":{}}'
```

### 4. Frontend Testing ✓

- [ ] Open `vc.html` in browser
- [ ] Open `angel_investor.html` in browser
- [ ] Check browser console for errors
- [ ] Verify AI content loads
- [ ] Test tab switching
- [ ] Test refresh functionality
- [ ] Verify charts render correctly
- [ ] Test causal impact modals

### 5. Security Review ✓

- [ ] Verify `.env` is in `.gitignore`
- [ ] Check CORS configuration
- [ ] Verify API key is not exposed in frontend
- [ ] Test XSS prevention
- [ ] Review error messages (no sensitive data)

### 6. Performance Testing ✓

- [ ] Test with cache enabled
- [ ] Measure response times
- [ ] Check memory usage
- [ ] Test concurrent requests
- [ ] Verify lazy loading works

---

## Deployment Steps

### Option 1: Traditional Server Deployment

#### Step 1: Prepare Server

```bash
# SSH into your server
ssh user@your-server.com

# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### Step 2: Upload Files

```bash
# From local machine
scp -r dashboard-html user@your-server.com:/var/www/auxeira/

# Or use git
ssh user@your-server.com
cd /var/www/auxeira
git clone https://github.com/bursarynetwork007/auxeira-backend.git
cd auxeira-backend/dashboard-html
```

#### Step 3: Configure Environment

```bash
# On server
cd /var/www/auxeira/auxeira-backend/dashboard-html
cp .env.example .env
nano .env  # Set production values
```

#### Step 4: Install Dependencies

```bash
npm install --production
```

#### Step 5: Start with PM2

```bash
pm2 start ai-backend-server.js --name auxeira-ai
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

#### Step 6: Configure Nginx (Reverse Proxy)

```nginx
# /etc/nginx/sites-available/auxeira
server {
    listen 80;
    server_name api.auxeira.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name dashboard.auxeira.com;

    root /var/www/auxeira/auxeira-backend/dashboard-html;
    index vc.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/auxeira /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 7: SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.auxeira.com -d dashboard.auxeira.com
```

### Option 2: Docker Deployment

#### Step 1: Create Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "ai-backend-server.js"]
```

#### Step 2: Create docker-compose.yml

```yaml
# docker-compose.yml
version: '3.8'

services:
  auxeira-ai:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

#### Step 3: Build and Run

```bash
docker-compose up -d
```

### Option 3: Cloud Platform Deployment

#### Heroku

```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create auxeira-ai-backend

# Set environment variables
heroku config:set OPENAI_API_KEY=your_key_here
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Scale
heroku ps:scale web=1
```

#### AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js auxeira-ai

# Create environment
eb create auxeira-ai-prod

# Deploy
eb deploy
```

#### Google Cloud Run

```bash
# Build container
gcloud builds submit --tag gcr.io/your-project/auxeira-ai

# Deploy
gcloud run deploy auxeira-ai \
  --image gcr.io/your-project/auxeira-ai \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Post-Deployment Checklist

### 1. Verification ✓

- [ ] Backend API is accessible
- [ ] Frontend dashboards load correctly
- [ ] AI content generates successfully
- [ ] SSL certificate is valid
- [ ] CORS works for your domain
- [ ] Caching is functioning
- [ ] Error logging is working

### 2. Monitoring Setup ✓

- [ ] Set up application monitoring (PM2, New Relic, etc.)
- [ ] Configure error tracking (Sentry, Rollbar, etc.)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Configure log aggregation (CloudWatch, Papertrail, etc.)
- [ ] Set up alerts for errors and downtime

### 3. Performance Optimization ✓

- [ ] Enable Redis caching
- [ ] Configure CDN for static assets
- [ ] Enable gzip compression
- [ ] Set up database connection pooling (if applicable)
- [ ] Configure rate limiting

### 4. Documentation ✓

- [ ] Update API documentation
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Document environment variables
- [ ] Create backup and recovery procedures

### 5. User Communication ✓

- [ ] Notify users of new features
- [ ] Provide user guide or tutorial
- [ ] Set up feedback collection
- [ ] Create support channels

---

## Rollback Plan

If deployment fails or issues arise:

### 1. Quick Rollback (PM2)

```bash
pm2 stop auxeira-ai
pm2 delete auxeira-ai
# Restore backup
pm2 start ai-backend-server.js.backup --name auxeira-ai
```

### 2. Git Rollback

```bash
git log  # Find previous working commit
git revert <commit-hash>
git push
# Redeploy
```

### 3. Database Rollback (if applicable)

```bash
# Restore from backup
# Follow your database-specific restore procedure
```

---

## Maintenance Tasks

### Daily

- [ ] Check error logs
- [ ] Monitor API usage
- [ ] Verify uptime

### Weekly

- [ ] Review performance metrics
- [ ] Check cache hit rates
- [ ] Analyze user feedback
- [ ] Update AI prompts if needed

### Monthly

- [ ] Update dependencies
- [ ] Review and optimize prompts
- [ ] Analyze cost (API usage)
- [ ] Backup configuration
- [ ] Security audit

---

## Troubleshooting Guide

### Issue: Backend not starting

**Check:**
1. Port 3000 is not in use: `lsof -i :3000`
2. Environment variables are set: `echo $OPENAI_API_KEY`
3. Dependencies installed: `npm install`
4. Check logs: `pm2 logs auxeira-ai`

### Issue: AI content not loading

**Check:**
1. Backend is running: `curl http://localhost:3000/health`
2. CORS is configured correctly
3. API key is valid
4. Check browser console for errors
5. Verify network requests in DevTools

### Issue: Slow performance

**Check:**
1. Enable caching
2. Check API rate limits
3. Optimize prompts
4. Use Redis for production
5. Monitor server resources

---

## Success Metrics

Track these metrics post-deployment:

### Technical Metrics
- API response time (target: < 2s)
- Cache hit rate (target: > 70%)
- Error rate (target: < 1%)
- Uptime (target: 99.9%)

### Business Metrics
- User engagement (time on dashboard)
- Feature adoption (AI sections viewed)
- Premium conversion rate
- User satisfaction (NPS score)

---

## Support Contacts

- **Technical Issues**: dev@auxeira.com
- **User Support**: support@auxeira.com
- **Emergency**: +1-XXX-XXX-XXXX

---

## Final Checklist Before Go-Live

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Monitoring configured
- [ ] Backup procedures in place
- [ ] Rollback plan tested
- [ ] Team trained on new features
- [ ] Users notified
- [ ] Support channels ready

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Version**: 1.0.0  
**Status**: ⬜ Ready for Deployment

---

**Good luck with your deployment! 🚀**

