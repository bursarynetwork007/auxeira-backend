# Debug Instructions for Login Issue

## Current Status
- Landing page loads correctly ✅
- Login modal opens ✅  
- Login API call succeeds ✅
- Dashboard loads briefly then redirects to home ❌

## Root Cause Investigation

The dashboard HTML files are clean with NO auth checks. Something else is causing the redirect.

## Debugging Steps

### 1. Clear ALL Caches
```bash
# In browser DevTools (F12):
1. Application tab → Storage → Clear site data
2. Application tab → Service Workers → Unregister all
3. Network tab → Disable cache checkbox
4. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### 2. Check What's Actually Happening

Open browser console (F12) and run this BEFORE logging in:

```javascript
// Monitor all redirects
const originalLocation = window.location.href;
Object.defineProperty(window, 'location', {
  set: function(value) {
    console.trace('REDIRECT ATTEMPT TO:', value);
    debugger; // This will pause execution
  },
  get: function() {
    return originalLocation;
  }
});

// Monitor localStorage changes
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  console.log('localStorage.setItem:', key, value);
  return originalSetItem.apply(this, arguments);
};

// Monitor all fetch calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('FETCH:', args[0]);
  return originalFetch.apply(this, arguments);
};
```

Then login and watch the console. It will show you EXACTLY what's causing the redirect.

### 3. Check Service Worker

```javascript
// In console:
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Active service workers:', registrations);
  registrations.forEach(reg => reg.unregister());
});
```

### 4. Test Direct Dashboard Access

Try accessing the dashboard directly WITHOUT logging in:
- https://dashboard.auxeira.com/startup_founder.html

If it loads and stays loaded, the issue is in the login flow.
If it redirects immediately, something is checking auth on the dashboard.

### 5. Check CloudFront Behavior

The issue might be CloudFront redirect rules. Check:

```bash
aws cloudfront get-distribution-config --id E2SK5CDOUJ7KKB --query 'DistributionConfig.DefaultCacheBehavior'
```

Look for any Lambda@Edge functions or redirect rules.

### 6. Check for Hidden Scripts

Search for ANY script that might be injected:

```bash
curl -s https://dashboard.auxeira.com/startup_founder.html | grep -i "<script"
```

Compare with local file:
```bash
grep -i "<script" frontend/dashboard/startup_founder.html
```

If they're different, CloudFront or S3 is serving a different file.

### 7. Network Tab Analysis

1. Open DevTools → Network tab
2. Check "Preserve log"
3. Login
4. Look for:
   - Any 301/302 redirects
   - Any failed requests (red)
   - The sequence of requests after login

### 8. Check S3 Bucket

Verify the correct file is in S3:

```bash
aws s3 cp s3://dashboard.auxeira.com/startup_founder.html - | head -35
```

Compare with local file.

## Possible Causes

1. **Service Worker Caching** - Most likely. The SW is serving old cached files.
2. **CloudFront Lambda@Edge** - A function might be intercepting requests
3. **Browser Extension** - Ad blocker or security extension interfering
4. **DNS/CDN Issue** - Old version cached at CDN level
5. **Hidden Script Injection** - Something modifying the HTML

## Quick Fix to Test

Create a completely new test dashboard file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Dashboard</title>
</head>
<body>
    <h1>TEST DASHBOARD - If you see this, auth is working!</h1>
    <p>User: <span id="user"></span></p>
    <script>
        const user = JSON.parse(localStorage.getItem('auxeira_user') || '{}');
        document.getElementById('user').textContent = JSON.stringify(user, null, 2);
        console.log('User data:', user);
        console.log('All localStorage:', localStorage);
    </script>
</body>
</html>
```

Upload as `test-dashboard.html` and redirect login to it instead of startup_founder.html.

If this loads and stays, the issue is specific to the startup_founder.html file or its path.

## Contact Info

If none of this works, we need to:
1. Screen share to see the actual behavior
2. Check AWS CloudWatch logs for Lambda/API Gateway
3. Verify DynamoDB user record
4. Check if there's a backend auth middleware rejecting requests

## Last Resort

Roll back to the last known working commit:

```bash
git checkout 86d1ab0
# Test if login works
# If yes, bisect to find the breaking commit
git bisect start
git bisect bad HEAD
git bisect good 86d1ab0
```
