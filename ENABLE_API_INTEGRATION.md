# Enable Activity Rewards API Integration

## Current Status

✅ **Dashboard Deployed**: All tabs are visible and working with mock data
✅ **API Integration Added**: Backend API connection code is in place
⚠️ **API Disabled**: Currently using mock data (safe mode)

## What Was Added

The dashboard now includes:

1. **API Configuration Object** (`ACTIVITY_REWARDS_API`)
   - Base URL configuration
   - Enable/disable flag
   - Token management
   - API call helper method

2. **Enhanced Activity Feed**
   - Automatically loads from API when enabled
   - Falls back to mock data if API fails
   - Graceful error handling

3. **Console Logging**
   - Shows when API is disabled
   - Logs successful API calls
   - Reports errors without breaking the UI

## How to Enable the API

### Step 1: Deploy the Backend

First, ensure the backend is running:

```bash
cd /workspaces/auxeira-backend/backend

# Run the database migration
node run-migration.js

# Start the server
npm start
```

The backend should be accessible at `http://localhost:3000` or your production URL.

### Step 2: Test the Backend

Verify the API is working:

```bash
# Health check
curl http://localhost:3000/health

# Get activities (requires authentication)
curl http://localhost:3000/api/activities \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 3: Update Dashboard Configuration

Open the dashboard HTML file and find this section (around line 3103):

```javascript
const ACTIVITY_REWARDS_API = {
    baseURL: 'https://api.auxeira.com', // Update this with your backend URL
    enabled: false, // Set to true when backend is ready
    token: null, // Will be set from user session
```

**Change:**
1. Update `baseURL` to your backend URL (e.g., `http://localhost:3000` for local testing)
2. Change `enabled: false` to `enabled: true`
3. Set `token` to a valid JWT token (or implement token retrieval from session)

**Example:**

```javascript
const ACTIVITY_REWARDS_API = {
    baseURL: 'http://localhost:3000', // or 'https://api.auxeira.com'
    enabled: true, // ✓ API enabled
    token: localStorage.getItem('authToken'), // Get from session
```

### Step 4: Deploy Updated Dashboard

```bash
# Upload to S3
aws s3 cp startup_founder.html s3://auxeira-dashboards-jsx-1759943238/startup_founder.html \
  --content-type "text/html" \
  --cache-control "no-cache, no-store, must-revalidate"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1L1Q8VK3LAEFC \
  --paths "/startup_founder.html"
```

### Step 5: Test the Integration

1. Open the dashboard: https://dashboard.auxeira.com/startup_founder.html
2. Navigate to the "Activity Rewards" tab
3. Open browser console (F12)
4. Look for:
   - `✓ Loaded activities from API` (success)
   - `API disabled, using mock data` (API still disabled)
   - Error messages (if API call fails)

## Verification Checklist

- [ ] Backend server is running
- [ ] Database migration completed successfully
- [ ] API health check returns 200
- [ ] `/api/activities` endpoint returns 25 activities
- [ ] Dashboard `baseURL` points to backend
- [ ] Dashboard `enabled` is set to `true`
- [ ] JWT token is available in dashboard
- [ ] Browser console shows "Loaded activities from API"
- [ ] Activity feed displays activities from backend

## Troubleshooting

### Issue: "API disabled, using mock data"

**Solution:** Set `enabled: true` in the dashboard configuration.

### Issue: CORS errors in browser console

**Solution:** Ensure backend CORS is configured to allow your dashboard domain:

```javascript
// In backend/src/server.js
const corsOptions = {
  origin: [
    'https://dashboard.auxeira.com',
    'http://localhost:3000'
  ],
  credentials: true
};
```

### Issue: 401 Unauthorized

**Solution:** Ensure JWT token is valid and included in requests:

```javascript
token: localStorage.getItem('authToken') || 'your-test-token-here'
```

### Issue: Activities not loading

**Solution:** Check:
1. Backend is running: `curl http://localhost:3000/health`
2. Database has activities: `SELECT COUNT(*) FROM activities;`
3. Browser console for error messages
4. Network tab in browser DevTools

## Rollback Plan

If issues occur, disable the API:

1. Open dashboard HTML
2. Change `enabled: true` to `enabled: false`
3. Redeploy dashboard
4. Dashboard will use mock data (safe mode)

## Next Steps After Enabling

Once the API is working:

1. **Implement Activity Submission**
   - Add API call to `/api/activities/submit`
   - Handle file uploads to S3
   - Show submission status

2. **Add Activity History**
   - Load from `/api/activities/history`
   - Display token totals
   - Show submission status

3. **Implement Token Calculation**
   - Call `/api/activities/calculate-tokens`
   - Display awarded tokens
   - Update user balance

## Support

For issues:
- Backend API: `ACTIVITY_REWARDS_API.md`
- Implementation: `ACTIVITY_REWARDS_IMPLEMENTATION.md`
- Deployment: `DEPLOYMENT_CHECKLIST.md`

---

**Current Dashboard Status**: ✅ All tabs visible, API integration ready (disabled)
**Last Updated**: 2025-10-27
