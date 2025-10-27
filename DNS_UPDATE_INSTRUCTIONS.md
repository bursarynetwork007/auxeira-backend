# DNS Update Instructions - Zero Downtime Migration

## New CloudFront Distribution

**Distribution ID:** E1FI2XLYHN0LZK
**CloudFront Domain:** d2r7l9rcpjuax0.cloudfront.net
**Status:** ✅ Deployed and Tested

## Test Results

✅ File size: 239KB (correct)
✅ Cache headers: max-age=60 (optimized)
✅ Profile modal: Present (3 occurrences)
✅ Activities: 37 entries (all 25 activities)
✅ HTTP/2: Enabled
✅ SSL: Valid
✅ Response time: 0.037s (very fast)

## DNS Update Options

### Option 1: Automated (Route 53)

```bash
# Get hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name auxeira.com \
  --query 'HostedZones[0].Id' \
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

### Option 2: AWS Console

1. Go to Route 53 → Hosted Zones
2. Select `auxeira.com`
3. Find record: `dashboard.auxeira.com`
4. Click Edit
5. Change value to: `d2r7l9rcpjuax0.cloudfront.net`
6. Set TTL: 300 seconds
7. Click Save

### Option 3: Other DNS Provider

If using a different DNS provider:
1. Log in to your DNS provider
2. Find CNAME record for `dashboard.auxeira.com`
3. Update value to: `d2r7l9rcpjuax0.cloudfront.net`
4. Set TTL: 300 seconds (5 minutes)
5. Save changes

## Verification

After updating DNS (wait 5-15 minutes):

```bash
# Check DNS propagation
dig dashboard.auxeira.com CNAME +short
# Should show: d2r7l9rcpjuax0.cloudfront.net

# Test production URL
curl -I https://dashboard.auxeira.com/startup_founder.html | grep content-length
# Should show: 239708

# Run full test suite
./test-distribution.sh dashboard.auxeira.com
```

## What Happens Next

1. **DNS Propagates** (5-15 minutes)
   - Old distribution still works during transition
   - Zero downtime

2. **Users Gradually Switch**
   - As DNS propagates, users get new distribution
   - Both distributions serve same content

3. **Monitor** (24 hours)
   - Watch CloudWatch metrics
   - Verify no errors
   - Check user reports

4. **Clean Up Old Distribution** (after 24 hours)
   ```bash
   # Disable old distribution
   aws cloudfront get-distribution-config --id E2SK5CDOUJ7KKB > old-config.json
   # Edit: set Enabled: false
   aws cloudfront update-distribution --id E2SK5CDOUJ7KKB --if-match <etag> --distribution-config file://old-config.json
   
   # Wait for deployment
   aws cloudfront wait distribution-deployed --id E2SK5CDOUJ7KKB
   
   # Delete
   aws cloudfront delete-distribution --id E2SK5CDOUJ7KKB --if-match <new-etag>
   ```

## Rollback Plan

If issues occur:

```bash
# Revert DNS to old distribution
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

## Current Status

**Old Distribution (Corrupted):**
- ID: E2SK5CDOUJ7KKB
- Domain: d2nwfm8dh1kp59.cloudfront.net
- Status: Still active (serving 201KB corrupted file)
- DNS: Currently points here

**New Distribution (Optimized):**
- ID: E1FI2XLYHN0LZK
- Domain: d2r7l9rcpjuax0.cloudfront.net
- Status: ✅ Deployed and tested
- DNS: Not yet pointing here

## Benefits After Migration

✅ **Fixed Corruption** - No more 201KB ghost file
✅ **Fast Updates** - HTML changes live in 60 seconds
✅ **Optimized Cache** - 60s for HTML, proper headers
✅ **Better Performance** - HTTP/2, compression
✅ **Profile Modal** - Works correctly (no logout)
✅ **All 25 Activities** - Visible and working

## Support

If you need help:
1. Check DNS propagation: `dig dashboard.auxeira.com`
2. Test new distribution: `./test-distribution.sh d2r7l9rcpjuax0.cloudfront.net`
3. Check CloudWatch metrics in AWS Console
4. Review logs if any errors

## Ready to Update DNS?

Run one of the commands above to update DNS and complete the migration!
