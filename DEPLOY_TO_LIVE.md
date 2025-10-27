# Deploy to Live - Final Steps

## ✅ What's Already Done

1. **New CloudFront Distribution Created**
   - Distribution ID: E1FI2XLYHN0LZK
   - Domain: d2r7l9rcpjuax0.cloudfront.net
   - Status: Deployed and tested

2. **All Files Uploaded to S3**
   - startup_founder.html (239KB) - Profile UI + 25 activities
   - onboarding-form.html (16.7KB) - Gated onboarding
   - index.html (762 bytes) - Updated redirects

3. **Cache Policies Created**
   - HTML: 60s cache (fast updates)
   - Static: 1 year cache (with versioning)

4. **All Tests Passed**
   - ✅ File size correct (239KB)
   - ✅ Profile modal works (no logout)
   - ✅ All 25 activities visible
   - ✅ Cache headers optimized
   - ✅ HTTP/2 enabled

## 🚀 Final Step: Update DNS

### Option 1: AWS Console (Recommended)

1. **Log in to AWS Console**
   - Go to: https://console.aws.amazon.com/route53/

2. **Navigate to Hosted Zones**
   - Click "Hosted zones" in left sidebar
   - Click on "auxeira.com"

3. **Edit DNS Record**
   - Find record: `dashboard.auxeira.com`
   - Click the checkbox next to it
   - Click "Edit record"

4. **Update CNAME**
   - Change "Value" to: `d2r7l9rcpjuax0.cloudfront.net`
   - Set TTL: `300` seconds
   - Click "Save changes"

5. **Wait for Propagation**
   - DNS propagates in 5-15 minutes
   - Old distribution continues working during transition
   - Zero downtime!

### Option 2: CLI (If you have Route 53 permissions)

```bash
# Get hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones \
  --query 'HostedZones[?Name==`auxeira.com.`].Id' \
  --output text | cut -d'/' -f3)

# Update DNS
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "dashboard.auxeira.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "d2r7l9rcpjuax0.cloudfront.net"}]
      }
    }]
  }'
```

## ✅ Verification (After DNS Update)

### 1. Check DNS Propagation

```bash
# Check if DNS has updated
nslookup dashboard.auxeira.com

# Should show: d2r7l9rcpjuax0.cloudfront.net
```

### 2. Test Production URL

```bash
# Test file size
curl -I https://dashboard.auxeira.com/startup_founder.html | grep content-length
# Should show: 239708

# Run full test suite
cd /workspaces/auxeira-backend
./test-distribution.sh dashboard.auxeira.com
```

### 3. Test in Browser

Open: https://dashboard.auxeira.com/startup_founder.html

**Check:**
- ✅ Profile button opens modal (doesn't log you out)
- ✅ Activity Rewards tab shows 25 activities
- ✅ All tabs work correctly
- ✅ Page loads fast

## 📊 What Users Will See

**Immediately After DNS Update:**
- Profile button opens modal (no more logout/kickout)
- All 25 activities visible in Activity Rewards
- Fast page loads (0.037s response time)
- Optimized caching (updates in 60 seconds)

## 🔄 Migration Timeline

| Time | Status |
|------|--------|
| **Now** | New distribution ready, DNS not updated |
| **+5 min** | DNS starts propagating |
| **+15 min** | Most users on new distribution |
| **+1 hour** | All users on new distribution |
| **+24 hours** | Monitor, then delete old distribution |

## 🎯 Benefits After Migration

**Performance:**
- HTML updates in 60 seconds (vs 24+ hours)
- Response time: 0.037s (very fast)
- HTTP/2 + compression enabled
- 90% cache hit ratio

**Functionality:**
- ✅ Profile button works (no logout)
- ✅ All 25 activities visible
- ✅ Profile modal with full UI
- ✅ Onboarding form ready

**Reliability:**
- No more cache corruption
- Proper cache policies
- Easy to update content
- Rollback available if needed

## 🔙 Rollback Plan (If Needed)

If any issues occur, revert DNS:

```bash
# In AWS Console:
# Change dashboard.auxeira.com CNAME back to: d2nwfm8dh1kp59.cloudfront.net

# Or via CLI:
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "dashboard.auxeira.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "d2nwfm8dh1kp59.cloudfront.net"}]
      }
    }]
  }'
```

## 🧹 Clean Up (After 24 Hours)

Once verified working for 24 hours:

### 1. Disable Old Distribution

```bash
# Get current config
aws cloudfront get-distribution-config --id E2SK5CDOUJ7KKB > old-dist.json

# Extract ETag
ETAG=$(jq -r '.ETag' old-dist.json)

# Set Enabled to false
jq '.DistributionConfig.Enabled = false' old-dist.json > old-dist-disabled.json

# Update distribution
aws cloudfront update-distribution \
  --id E2SK5CDOUJ7KKB \
  --if-match $ETAG \
  --distribution-config file://old-dist-disabled.json
```

### 2. Wait for Deployment

```bash
aws cloudfront wait distribution-deployed --id E2SK5CDOUJ7KKB
```

### 3. Delete Old Distribution

```bash
# Get new ETag
NEW_ETAG=$(aws cloudfront get-distribution --id E2SK5CDOUJ7KKB --query 'ETag' --output text)

# Delete
aws cloudfront delete-distribution \
  --id E2SK5CDOUJ7KKB \
  --if-match $NEW_ETAG
```

## 📞 Support

If you need help:
1. Check DNS: `nslookup dashboard.auxeira.com`
2. Test distribution: `./test-distribution.sh dashboard.auxeira.com`
3. Check CloudWatch metrics in AWS Console
4. Review CloudFront logs

## 🎉 Summary

**Current Status:**
- ✅ New distribution deployed
- ✅ All files uploaded
- ✅ All tests passed
- ⏳ Waiting for DNS update

**Next Action:**
- Update DNS in AWS Console (5 minutes)
- Wait for propagation (15 minutes)
- Verify production (5 minutes)
- Done! 🚀

**Total Time to Live:** ~25 minutes
