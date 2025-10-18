# 🚀 ESG Dashboard Deployment Guide

## Overview

This guide provides comprehensive deployment strategies specifically for the Auxeira ESG Dashboard suite, including best practices, automation, and monitoring.

## 🎯 Deployment Options Comparison

| Method | Complexity | Features | Recommended For |
|--------|------------|----------|-----------------|
| **Enhanced Script** | Medium | Full automation, validation, backup | **Production (Recommended)** |
| **Your Current Method** | Low | Basic deployment | Development/Testing |
| **CI/CD Pipeline** | High | Enterprise automation | Large teams |

## ✅ **Enhanced Deployment Script (Recommended)**

Your current method is good, but here's a **production-ready enhancement**:

### Quick Start
```bash
# Make script executable
chmod +x deploy-enhanced.sh

# Production deployment with full validation
./deploy-enhanced.sh production

# Test deployment (no actual changes)
./deploy-enhanced.sh production dry-run
```

### Key Improvements Over Your Current Method

| Feature | Your Method | Enhanced Method |
|---------|-------------|-----------------|
| **File Validation** | ❌ None | ✅ Size, content, completeness checks |
| **Backup** | ❌ No backup | ✅ Automatic backup before deployment |
| **Verification** | ❌ Manual | ✅ Automatic post-deployment testing |
| **Performance** | ❌ No monitoring | ✅ Load time monitoring |
| **Rollback** | ❌ Manual | ✅ Automated rollback capability |
| **Error Handling** | ❌ Basic | ✅ Comprehensive error handling |

## 🔧 **Your Current Method (Enhanced)**

Here's your current method with improvements:

```bash
cd /workspaces/auxeira-backend

# 1. PRE-DEPLOYMENT VALIDATION (NEW)
echo "🔍 Validating files..."
for file in dashboard-html/esg_*.html; do
  size=$(stat -c%s "$file")
  if [ $size -lt 30000 ]; then
    echo "⚠️ Warning: $file is only ${size} bytes (may be incomplete)"
  fi
done

# 2. BACKUP CURRENT PRODUCTION (NEW)
echo "💾 Creating backup..."
aws s3 sync s3://dashboard.auxeira.com/ backups/$(date +%Y%m%d_%H%M%S)/ \
  --include "esg_*.html" --quiet

# 3. COMMIT CHANGES (YOUR EXISTING)
git add dashboard-html/
git commit -m "Promote enhanced ESG files to production"
git push origin main

# 4. DEPLOY TO S3 (YOUR EXISTING - IMPROVED)
echo "🚀 Deploying to S3..."
aws s3 sync dashboard-html/ s3://dashboard.auxeira.com/ \
  --include "esg_*.html" \
  --exclude "_old_versions/*" \
  --exclude "*_enhanced.html" \
  --exclude "*_complete.html" \
  --content-type "text/html" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --delete

# 5. INVALIDATE CLOUDFRONT (YOUR EXISTING - IMPROVED)
echo "🌐 Invalidating CloudFront..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id E2SK5CDOUJ7KKB \
  --paths "/esg_*.html" "/esg_*.js" \
  --query 'Invalidation.Id' --output text)
echo "✅ Invalidation created: $INVALIDATION_ID"

# 6. VERIFICATION (NEW)
echo "🔍 Verifying deployment..."
sleep 30  # Wait for propagation
for file in esg_education.html esg_poverty.html; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "https://dashboard.auxeira.com/$file")
  if [ "$status" = "200" ]; then
    echo "✅ $file is accessible"
  else
    echo "❌ $file returned HTTP $status"
  fi
done

echo "🎉 Deployment completed!"
```

## 📋 **Deployment Checklist**

### Before Deployment
- [ ] **17 ESG files validated** (all > 30KB)
- [ ] **Profile completion system active**
- [ ] **AI integration working** (reports, analytics)
- [ ] **Charts rendering properly** (no stretching issues)
- [ ] **Mobile responsive** design verified

### During Deployment
- [ ] **Backup created** of current production
- [ ] **All files uploaded** to S3 successfully
- [ ] **CloudFront invalidated** (paths: /esg_*.html)
- [ ] **Git committed** and pushed to main branch

### After Deployment
- [ ] **URLs accessible** (test 3-5 key dashboards)
- [ ] **Load times acceptable** (< 3 seconds)
- [ ] **Features working** (profile modal, reports, charts)
- [ ] **Mobile compatibility** verified

## 🚨 **Quick Fixes for Common Issues**

### Issue 1: Charts Stretching
```bash
# Check if chart containers have proper CSS
grep -n "portfolio-chart-container" dashboard-html/esg_*.html
```

### Issue 2: Files Too Small
```bash
# Find undersized files
find dashboard-html/ -name "esg_*.html" -size -30k -exec ls -lh {} \;
```

### Issue 3: Profile Modal Not Working
```bash
# Verify profile completion system is included
grep -n "forceProfileCompletion" dashboard-html/esg_education.html
```

### Issue 4: CloudFront Not Updating
```bash
# Force cache invalidation
aws cloudfront create-invalidation \
  --distribution-id E2SK5CDOUJ7KKB \
  --paths "/*"
```

## 🎯 **Recommended Deployment Workflow**

### For Your Team (Immediate Use)
```bash
# 1. Use your current method with enhancements
cd /workspaces/auxeira-backend

# 2. Quick validation
ls -la dashboard-html/esg_*.html | awk '$5 < 30000 {print "⚠️ " $9 " is small (" $5 " bytes)"}'

# 3. Deploy with your existing script
./deploy.sh

# 4. Quick verification
curl -I https://dashboard.auxeira.com/esg_education.html
```

### For Production (When Ready)
```bash
# Use the enhanced script for full automation
./deploy-enhanced.sh production
```

## 📊 **Performance Monitoring**

### Quick Performance Check
```bash
# Test load times
time curl -s https://dashboard.auxeira.com/esg_education.html > /dev/null

# Check file sizes
aws s3 ls s3://dashboard.auxeira.com/esg_*.html --human-readable
```

### CloudWatch Metrics to Monitor
- **4XX Error Rate** (should be < 1%)
- **Cache Hit Ratio** (should be > 90%)
- **Origin Response Time** (should be < 500ms)

## 🔄 **Emergency Rollback**

If something goes wrong:

```bash
# 1. Quick rollback using backup
aws s3 sync backups/LATEST_BACKUP_FOLDER/ s3://dashboard.auxeira.com/ --delete

# 2. Invalidate cache
aws cloudfront create-invalidation --distribution-id E2SK5CDOUJ7KKB --paths "/*"

# 3. Verify rollback
curl -I https://dashboard.auxeira.com/esg_education.html
```

## 🎉 **Summary**

**Your current deployment method is solid!** The enhancements I've provided add:

1. **Safety**: Validation and backup before deployment
2. **Reliability**: Verification and error handling
3. **Performance**: Monitoring and optimization
4. **Recovery**: Easy rollback capabilities

**Recommendation**: Start with your current method + the validation steps above, then migrate to the enhanced script when you're ready for full automation.

The enhanced deployment script is ready to use whenever you want to upgrade your deployment process to enterprise-level automation! 🚀
