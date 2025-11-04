# Auxeira Platform - Troubleshooting Playbook

**Version:** 1.0  
**Last Updated:** November 4, 2025

---

## Quick Diagnostic Commands

```bash
# Check all Lambda functions status
aws lambda list-functions --region us-east-1 \
  --query 'Functions[?contains(FunctionName, `auxeira`)].{Name:FunctionName,Status:State}' \
  --output table

# Check CloudFront distribution status
aws cloudfront get-distribution --id E1L1Q8VK3LAEFC \
  --query 'Distribution.Status' --output text

# Check S3 bucket contents
aws s3 ls s3://auxeira-dashboards-jsx-1759943238/ --human-readable

# View recent Lambda logs
aws logs tail /aws/lambda/auxeira-backend-prod-api --since 30m --follow
```

---

## Common Issues & Solutions

### 1. Admin Dashboard Redirect Loop

**Symptoms:**
- Dashboard loads briefly then redirects to landing page
- No error messages visible to user
- Console shows API call failures

**Diagnosis:**
```bash
# Check Lambda has dependencies
aws lambda get-function --function-name auxeira-admin-dashboard-prod \
  --query 'Configuration.CodeSize' --output text

# Should be ~3.4 MB, not 3-4 KB
```

**Solution:**
```bash
# Redeploy with dependencies
cd /tmp && mkdir admin-lambda && cd admin-lambda
cp /path/to/lambda-admin-dashboard.js .
npm install jsonwebtoken @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
zip -r lambda-admin-dashboard-full.zip .

aws lambda update-function-code \
  --function-name auxeira-admin-dashboard-prod \
  --zip-file fileb://lambda-admin-dashboard-full.zip \
  --region us-east-1
```

**Prevention:**
- Always include node_modules in Lambda deployment packages
- Test Lambda locally before deployment
- Monitor Lambda CloudWatch logs for module errors

---

### 2. CORS Errors in Browser

**Symptoms:**
```
Access to fetch at 'https://api...' from origin 'https://d3uxo0bxmd9yjr.cloudfront.net' 
has been blocked by CORS policy
```

**Diagnosis:**
```bash
# Test CORS headers
curl -H "Origin: https://d3uxo0bxmd9yjr.cloudfront.net" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -X OPTIONS \
  https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod/api/admin/dashboard \
  -v 2>&1 | grep -i "access-control"
```

**Solution:**
Update Lambda CORS configuration:
```javascript
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://auxeira.com',
    'https://www.auxeira.com',
    /^https:\/\/.*\.cloudfront\.net$/,
    /^https:\/\/.*\.s3\.amazonaws\.com$/,
    'http://localhost:3000'
  ];
  
  const isAllowed = allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') return allowed === origin;
    if (allowed instanceof RegExp) return allowed.test(origin);
    return false;
  });
  
  if (isAllowed) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
```

**Prevention:**
- Use regex patterns for dynamic origins (CloudFront, S3)
- Always handle OPTIONS preflight requests
- Test from actual CloudFront URL, not S3 direct URL

---

### 3. CloudFront Serving Stale Content

**Symptoms:**
- Code changes not reflecting in browser
- Old version of dashboard loading
- Hard refresh (Ctrl+Shift+R) doesn't help

**Diagnosis:**
```bash
# Check file in S3
aws s3 cp s3://auxeira-dashboards-jsx-1759943238/admin.html /tmp/test.html
grep "ADMIN_API_URL" /tmp/test.html

# Check CloudFront cache status
aws cloudfront get-distribution --id E1L1Q8VK3LAEFC \
  --query 'Distribution.DistributionConfig.DefaultCacheBehavior.MinTTL'
```

**Solution:**
```bash
# Create invalidation
aws cloudfront create-invalidation \
  --distribution-id E1L1Q8VK3LAEFC \
  --paths "/admin.html" "/startup_founder.html" "/*" \
  --region us-east-1

# Wait for completion (usually 1-2 minutes)
aws cloudfront wait invalidation-completed \
  --distribution-id E1L1Q8VK3LAEFC \
  --id INVALIDATION_ID
```

**Prevention:**
- Set proper cache headers on upload:
  ```bash
  aws s3 cp file.html s3://bucket/ \
    --cache-control "max-age=0, no-cache, no-store, must-revalidate"
  ```
- Create invalidation immediately after upload
- Use versioned filenames for assets (e.g., `app.v2.js`)

---

### 4. JWT Token Expired/Invalid

**Symptoms:**
- 401 Unauthorized errors
- User logged out unexpectedly
- "Invalid or expired token" messages

**Diagnosis:**
```javascript
// In browser console
const token = localStorage.getItem('authToken');
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Token expires:', new Date(payload.exp * 1000));
console.log('Current time:', new Date());
console.log('Expired:', payload.exp < Date.now() / 1000);
```

**Solution:**
```javascript
// Implement token refresh logic
async function refreshTokenIfNeeded() {
  const token = getAuthToken();
  if (!token) return null;
  
  const parts = token.split('.');
  const payload = JSON.parse(atob(parts[1]));
  const expiresIn = payload.exp - (Date.now() / 1000);
  
  // Refresh if less than 5 minutes remaining
  if (expiresIn < 300) {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    return data.token;
  }
  
  return token;
}
```

**Prevention:**
- Implement automatic token refresh
- Set reasonable token expiry (e.g., 24 hours)
- Store refresh tokens separately
- Clear tokens on logout

---

### 5. Lambda Cold Start Timeouts

**Symptoms:**
- First request takes 3-5 seconds
- Subsequent requests fast (<500ms)
- Timeout errors on complex operations

**Diagnosis:**
```bash
# Check Lambda timeout setting
aws lambda get-function-configuration \
  --function-name auxeira-backend-prod-api \
  --query 'Timeout' --output text

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=auxeira-backend-prod-api \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum
```

**Solution:**
```bash
# Increase timeout
aws lambda update-function-configuration \
  --function-name auxeira-backend-prod-api \
  --timeout 30

# Increase memory (improves CPU allocation)
aws lambda update-function-configuration \
  --function-name auxeira-backend-prod-api \
  --memory-size 2048

# Enable provisioned concurrency (costs more)
aws lambda put-provisioned-concurrency-config \
  --function-name auxeira-backend-prod-api \
  --provisioned-concurrent-executions 2
```

**Prevention:**
- Keep Lambda packages small (<50MB)
- Use Lambda layers for shared dependencies
- Implement connection pooling for databases
- Cache frequently accessed data

---

### 6. DynamoDB Throttling

**Symptoms:**
- `ProvisionedThroughputExceededException` errors
- Slow API responses
- Intermittent failures

**Diagnosis:**
```bash
# Check table metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=auxeira-backend-users-prod \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

**Solution:**
```bash
# Switch to on-demand billing (if using provisioned)
aws dynamodb update-table \
  --table-name auxeira-backend-users-prod \
  --billing-mode PAY_PER_REQUEST

# Or increase provisioned capacity
aws dynamodb update-table \
  --table-name auxeira-backend-users-prod \
  --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=5
```

**Prevention:**
- Use on-demand billing for unpredictable workloads
- Implement exponential backoff in Lambda
- Use batch operations where possible
- Add caching layer (ElastiCache/Lambda cache)

---

### 7. API Gateway 502/504 Errors

**Symptoms:**
- 502 Bad Gateway errors
- 504 Gateway Timeout errors
- Intermittent failures

**Diagnosis:**
```bash
# Check Lambda execution logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/auxeira-backend-prod-api \
  --start-time $(date -u -d '1 hour ago' +%s)000 \
  --filter-pattern "ERROR"

# Check API Gateway logs (if enabled)
aws logs tail /aws/apigateway/6qfa3ssb10/prod --follow
```

**Solution:**
1. **502 Bad Gateway** - Lambda returning invalid response format
   ```javascript
   // Ensure proper response format
   return {
     statusCode: 200,
     headers: {
       'Content-Type': 'application/json',
       'Access-Control-Allow-Origin': '*'
     },
     body: JSON.stringify({ success: true, data: result })
   };
   ```

2. **504 Gateway Timeout** - Lambda exceeding timeout
   ```bash
   # Increase Lambda timeout
   aws lambda update-function-configuration \
     --function-name auxeira-backend-prod-api \
     --timeout 29  # API Gateway max is 29 seconds
   ```

**Prevention:**
- Always return proper response format
- Set Lambda timeout < 29 seconds
- Implement async processing for long operations
- Enable API Gateway logging

---

## Emergency Procedures

### Complete System Outage

1. **Check AWS Service Health**
   ```bash
   # Visit: https://status.aws.amazon.com/
   ```

2. **Verify Core Services**
   ```bash
   # CloudFront
   curl -I https://d3uxo0bxmd9yjr.cloudfront.net/
   
   # API Gateway
   curl https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod/health
   
   # DynamoDB
   aws dynamodb describe-table --table-name auxeira-backend-users-prod
   ```

3. **Rollback Procedure**
   ```bash
   # Revert Lambda to previous version
   aws lambda update-function-code \
     --function-name auxeira-backend-prod-api \
     --s3-bucket auxeira-backend-deployment-bucket-prod \
     --s3-key lambda-enhanced-backup.zip
   
   # Revert frontend
   aws s3 cp s3://auxeira-dashboards-jsx-1759943238/admin.html.backup \
     s3://auxeira-dashboards-jsx-1759943238/admin.html
   
   # Invalidate CloudFront
   aws cloudfront create-invalidation \
     --distribution-id E1L1Q8VK3LAEFC \
     --paths "/*"
   ```

### Database Corruption

1. **Enable Point-in-Time Recovery**
   ```bash
   aws dynamodb update-continuous-backups \
     --table-name auxeira-backend-users-prod \
     --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
   ```

2. **Restore from Backup**
   ```bash
   aws dynamodb restore-table-to-point-in-time \
     --source-table-name auxeira-backend-users-prod \
     --target-table-name auxeira-backend-users-prod-restored \
     --restore-date-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)
   ```

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Lambda Errors**
   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name auxeira-lambda-errors \
     --metric-name Errors \
     --namespace AWS/Lambda \
     --statistic Sum \
     --period 300 \
     --threshold 10 \
     --comparison-operator GreaterThanThreshold \
     --evaluation-periods 1
   ```

2. **API Gateway 5xx Errors**
   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name auxeira-api-5xx \
     --metric-name 5XXError \
     --namespace AWS/ApiGateway \
     --statistic Sum \
     --period 300 \
     --threshold 5 \
     --comparison-operator GreaterThanThreshold
   ```

3. **DynamoDB Throttling**
   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name auxeira-dynamodb-throttle \
     --metric-name UserErrors \
     --namespace AWS/DynamoDB \
     --statistic Sum \
     --period 300 \
     --threshold 10 \
     --comparison-operator GreaterThanThreshold
   ```

---

## Best Practices

### Deployment
- ✅ Always test in dev environment first
- ✅ Create backups before major changes
- ✅ Deploy during low-traffic periods
- ✅ Monitor for 30 minutes post-deployment
- ✅ Have rollback plan ready

### Code Quality
- ✅ Include all dependencies in Lambda packages
- ✅ Use environment variables for configuration
- ✅ Implement proper error handling
- ✅ Add comprehensive logging
- ✅ Write unit tests for critical functions

### Security
- ✅ Rotate JWT secrets regularly
- ✅ Use IAM roles with least privilege
- ✅ Enable CloudTrail logging
- ✅ Implement rate limiting
- ✅ Validate all user inputs

### Performance
- ✅ Keep Lambda packages small
- ✅ Use connection pooling
- ✅ Implement caching strategies
- ✅ Optimize database queries
- ✅ Use CloudFront for static assets

---

## Support Contacts

### AWS Support
- **Console:** https://console.aws.amazon.com/support/
- **Phone:** 1-866-947-7829

### Internal Team
- **Repository:** https://github.com/bursarynetwork007/auxeira-backend
- **Documentation:** See ENHANCED_DEPLOYMENT_SPEC.md

---

**Document End**

*Keep this playbook updated as new issues are discovered and resolved.*
