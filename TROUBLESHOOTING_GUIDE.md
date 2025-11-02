# 🔧 Troubleshooting Guide - Dashboard Error

**Date**: October 31, 2025  
**Issue**: Error message when accessing dashboard  
**Status**: Investigating

---

## 🧪 Test Page Created

**URL**: https://dashboard.auxeira.com/test.html

This test page will:
- ✅ Test API connection automatically
- ✅ Show if you have an auth token
- ✅ Display the actual error message
- ✅ Show full API response

**Please visit this page and tell me what you see!**

---

## 📍 Available URLs

### Option 1: Startup Folder (Recommended)
**URL**: https://dashboard.auxeira.com/startup/

This should work because we deployed to `/startup/index.html`

### Option 2: Direct File
**URL**: https://dashboard.auxeira.com/startup_founder.html

This might have issues with S3 website routing

### Option 3: Test Page
**URL**: https://dashboard.auxeira.com/test.html

Use this to diagnose the issue

---

## 🔍 Common Issues & Solutions

### Issue 1: "No Auth Token" Error

**Symptoms**: Dashboard shows "Failed to load data" or "No auth token found"

**Solution**:
1. Go to https://auxeira.com
2. Login with `founder@startup.com` / `Testpass123`
3. After login, go to https://dashboard.auxeira.com/startup/

**Why**: The dashboard needs an authentication token stored in localStorage

### Issue 2: "Invalid Token" Error

**Symptoms**: API returns 401 or "Invalid token"

**Solution**:
1. Clear browser cache and localStorage
2. Login again at https://auxeira.com
3. Try dashboard again

**Command to clear localStorage** (in browser console):
```javascript
localStorage.clear();
sessionStorage.clear();
```

### Issue 3: 500 Server Error

**Symptoms**: Page shows "500 Internal Server Error"

**Possible Causes**:
- S3 website configuration issue
- Wrong file path
- CloudFront cache not invalidated

**Solution**:
1. Wait 2-3 minutes for CloudFront cache to clear
2. Try https://dashboard.auxeira.com/startup/ instead
3. Hard refresh browser (Ctrl+Shift+R)

### Issue 4: API Connection Failed

**Symptoms**: "Failed to load user data" or network error

**Solution**:
1. Check if Lambda is working: Visit test page
2. Check browser console for CORS errors
3. Verify you're using HTTPS (not HTTP)

---

## 🧪 Manual Testing Steps

### Step 1: Test API Directly

Open browser console and run:
```javascript
fetch('https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/?userId=045b4095-3388-4ea6-8de3-b7b04be5bc1b')
  .then(r => r.json())
  .then(d => console.log(d));
```

**Expected**: Should show EdTech Solutions 96 data

### Step 2: Check Auth Token

In browser console:
```javascript
console.log('Auth Token:', localStorage.getItem('authToken'));
console.log('User Data:', localStorage.getItem('auxeira_user'));
```

**Expected**: Should show a JWT token

### Step 3: Test Dashboard Load

In browser console:
```javascript
async function testDashboard() {
  const token = localStorage.getItem('authToken');
  const response = await fetch('https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  console.log('Dashboard Data:', data);
}
testDashboard();
```

**Expected**: Should show startup data

---

## 📊 Current Deployment Status

### Files Deployed
- ✅ `/startup_founder.html` (root)
- ✅ `/startup/index.html` (folder)
- ✅ `/test.html` (diagnostic page)

### CloudFront Invalidations
- ✅ IAPVRLE7IYJDPR7WW9AT0FZPRF (startup folder)
- ✅ I827HIN1WOJPQS6I47V3ANQWHB (test page)

### Lambda Function
- ✅ Working (tested successfully)
- ✅ Returns real data for test user
- ✅ URL: https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/

### DynamoDB
- ✅ Tables populated
- ✅ Test user exists
- ✅ Data accessible

---

## 🎯 Next Steps

### For You:
1. **Visit test page**: https://dashboard.auxeira.com/test.html
2. **Tell me**:
   - What error message you see
   - What the test page shows
   - Which URL you're trying to access

### For Me:
Once I know the exact error, I can:
- Fix the specific issue
- Update the deployment
- Verify it works

---

## 📞 Quick Diagnosis

**If test page shows**:
- ✅ "API Test Successful" → API is working, issue is with auth
- ❌ "Connection Error" → Network/CORS issue
- ⚠️ "No Auth Token" → Need to login first
- ❌ "API Error" → Lambda function issue

**Most Likely Issue**: Missing auth token

**Quick Fix**: 
1. Login at https://auxeira.com
2. Then go to https://dashboard.auxeira.com/startup/

---

**Please check the test page and let me know what you see!**
