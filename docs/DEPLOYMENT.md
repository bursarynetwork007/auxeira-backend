# Auxeira Deployment Guide

This guide walks you through deploying Auxeira to production with proper security and authentication.

---

## 📋 Prerequisites

- Node.js 18+ installed
- Domain names configured:
  - `auxeira.com` (main site)
  - `dashboard.auxeira.com` (dashboard)
  - `api.auxeira.com` (optional, for API)
- SSL certificates (Let's Encrypt recommended)
- Server with at least 2GB RAM
- PostgreSQL database (optional, for production)

---

## 🔧 Step 1: Server Setup

### Ubuntu/Debian

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

---

## 📦 Step 2: Clone and Configure

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/bursarynetwork007/auxeira-backend.git auxeira
cd auxeira

# Set permissions
sudo chown -R $USER:$USER /var/www/auxeira

# Install backend dependencies
cd backend
npm install --production

# Configure environment
cp .env.example .env
nano .env  # Edit with your production values
```

### Production Environment Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://auxeira.com,https://dashboard.auxeira.com

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Payment Integration
PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key
PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key

# AI Features
OPENAI_API_KEY=sk-your-production-key

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_BLOCKCHAIN=true
ENABLE_ANALYTICS=true

# Database
DATABASE_URL=postgresql://auxeira_user:secure_password@localhost:5432/auxeira_prod

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_very_secure_random_string_here
JWT_EXPIRY=7d

# Session Secret
SESSION_SECRET=another_very_secure_random_string
```

---

## 🔐 Step 3: Update Authentication Configuration

### Update auth-guard.js for Production

Edit `dashboard/utils/auth-guard.js`:

```javascript
constructor() {
    // Change this to your production domain
    this.mainSiteURL = 'https://auxeira.com';
    this.tokenKey = 'auxeira_auth_token';
    this.userKey = 'auxeira_user_data';
}

// Remove development bypass
protect(requiredUserType = null) {
    // Remove the isDevelopment check
    if (!this.isAuthenticated()) {
        this.redirectToLogin();
        return false;
    }
    // ... rest of the code
}
```

### Update Frontend Auth Modal

Edit `frontend/index.html` - find the redirect URLs (around line 5248 and 5348):

```javascript
// Update dashboard URLs to use your domain
const dashboardMap = {
    'startup_founder': 'https://dashboard.auxeira.com/startup/',
    'corporate_partner': 'https://dashboard.auxeira.com/corporate/',
    'venture_capital': 'https://dashboard.auxeira.com/vc/',
    'angel_investor': 'https://dashboard.auxeira.com/angel/',
    'government': 'https://dashboard.auxeira.com/government/',
    'esg_funder': 'https://dashboard.auxeira.com/esg/'
};
```

---

## 🌐 Step 4: Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/auxeira
```

Add this configuration:

```nginx
# Main site (auxeira.com)
server {
    listen 80;
    listen [::]:80;
    server_name auxeira.com www.auxeira.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name auxeira.com www.auxeira.com;
    
    # SSL Configuration (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/auxeira.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/auxeira.com/privkey.pem;
    
    root /var/www/auxeira/frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}

# Dashboard (dashboard.auxeira.com)
server {
    listen 80;
    listen [::]:80;
    server_name dashboard.auxeira.com;
    
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dashboard.auxeira.com;
    
    ssl_certificate /etc/letsencrypt/live/dashboard.auxeira.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dashboard.auxeira.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# API (api.auxeira.com) - Optional
server {
    listen 80;
    listen [::]:80;
    server_name api.auxeira.com;
    
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.auxeira.com;
    
    ssl_certificate /etc/letsencrypt/live/api.auxeira.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.auxeira.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/auxeira /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 Step 5: SSL Certificates

```bash
# Get SSL certificates for all domains
sudo certbot --nginx -d auxeira.com -d www.auxeira.com
sudo certbot --nginx -d dashboard.auxeira.com
sudo certbot --nginx -d api.auxeira.com  # Optional

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 🚀 Step 6: Start Backend Server

```bash
cd /var/www/auxeira/backend

# Start with PM2
pm2 start server.js --name auxeira-backend --env production

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the instructions from the command output

# Monitor logs
pm2 logs auxeira-backend
```

---

## 🗄️ Step 7: Database Setup (Optional)

If using PostgreSQL:

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql

CREATE DATABASE auxeira_prod;
CREATE USER auxeira_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE auxeira_prod TO auxeira_user;
\q

# Run migrations (when you have them)
cd /var/www/auxeira/backend
npm run migrate
```

---

## 🧪 Step 8: Testing

### Test Main Site

```bash
curl -I https://auxeira.com
# Should return 200 OK
```

### Test Dashboard

```bash
curl -I https://dashboard.auxeira.com
# Should return 200 OK
```

### Test API

```bash
curl https://dashboard.auxeira.com/api/health
# Should return: {"status":"healthy",...}
```

### Test Authentication Flow

1. Visit https://auxeira.com
2. Click "Login" button
3. Try signing in
4. Should redirect to https://dashboard.auxeira.com/startup/

---

## 📊 Step 9: Monitoring

### Set up PM2 Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# View monitoring dashboard
pm2 monit
```

### Set up Server Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Check server resources
htop
```

---

## 🔄 Step 10: Updates and Maintenance

### Deploying Updates

```bash
cd /var/www/auxeira

# Pull latest changes
git pull origin main

# Update backend dependencies if needed
cd backend
npm install --production

# Restart backend
pm2 restart auxeira-backend

# Reload Nginx if frontend changed
sudo systemctl reload nginx
```

### Backup Strategy

```bash
# Create backup script
sudo nano /usr/local/bin/auxeira-backup.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/auxeira"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump auxeira_prod > $BACKUP_DIR/db_$DATE.sql

# Backup environment file
cp /var/www/auxeira/backend/.env $BACKUP_DIR/env_$DATE

# Compress and keep last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "env_*" -mtime +7 -delete
```

Make executable and schedule:

```bash
sudo chmod +x /usr/local/bin/auxeira-backup.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/auxeira-backup.sh
```

---

## 🐛 Troubleshooting

### Backend Not Starting

```bash
# Check logs
pm2 logs auxeira-backend

# Check if port is in use
sudo lsof -i :3000

# Restart
pm2 restart auxeira-backend
```

### Authentication Not Working

1. Check browser console for errors
2. Verify CORS_ORIGINS in .env includes your domains
3. Check JWT_SECRET is set
4. Verify auth-guard.js has correct mainSiteURL

### Dashboard Not Loading

1. Check Nginx configuration
2. Verify backend is running: `pm2 status`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Test API: `curl http://localhost:3000/api/health`

---

## 📞 Support

If you encounter issues:

1. Check logs: `pm2 logs auxeira-backend`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Review this guide
4. Contact: hello@auxeira.com

---

**Deployment Checklist:**

- [ ] Server configured with Node.js 18+
- [ ] Repository cloned to `/var/www/auxeira`
- [ ] Environment variables configured in `.env`
- [ ] Production API keys obtained
- [ ] auth-guard.js updated for production
- [ ] Nginx configured and tested
- [ ] SSL certificates installed
- [ ] Backend started with PM2
- [ ] Database configured (if using)
- [ ] Monitoring set up
- [ ] Backup strategy implemented
- [ ] All tests passing
- [ ] DNS records pointing to server

**You're ready to launch! 🚀**

