# Admin Login Debugging Guide

## Issue: Cannot Access Admin Dashboard

### Test Page Available

**URL:** [https://auxeira.com/test-admin-login.html](https://auxeira.com/test-admin-login.html)

This page will help you test each step of the login flow:
1. Login API call
2. Token storage in localStorage
3. Token verification
4. Redirect to admin dashboard

### Manual Testing Steps

#### Step 1: Clear Browser Data
```javascript
// Open browser console (F12) and run:
localStorage.clear();
sessionStorage.clear();
console.log('✅ Storage cleared');
```

#### Step 2: Login at auxeira.com
1. Go to [https://auxeira.com](https://auxeira.com)
2. Click "Sign In"
3. Enter credentials:
   - Email: `gina@auxeira.com`
   - Password: `SSEngine@25`
4. Click "Login"

#### Step 3: Check Console for Errors
Open browser console (F12) and look for:
- ✅ "Login successful, storing tokens..."
- ✅ "Stored auxeira_auth_token"
- ✅ "Token verified in localStorage"
- ✅ "Redirecting to dashboard (token in localStorage, NOT in URL)"

#### Step 4: Verify Token Storage
```javascript
// In browser console:
const token = localStorage.getItem('auxeira_auth_token');
const user = localStorage.getItem('auxeira_user');

console.log('Token exists:', token ? 'YES' : 'NO');
console.log('User exists:', user ? 'YES' : 'NO');

if (token) {
    console.log('Token preview:', token.substring(0, 50) + '...');
}

if (user) {
    const userData = JSON.parse(user);
    console.log('User data:', userData);
    console.log('Role:', userData.role);
}
```

#### Step 5: Check Redirect URL
After login, you should be redirected to:
```
https://dashboard.auxeira.com/admin.html
```

**NOT:**
```
https://dashboard.auxeira.com/admin.html#token=...
```

The token should be in localStorage, NOT in the URL.

#### Step 6: Check Auth Guard on Dashboard
Once on the admin dashboard, open console and look for:
- 🔒 "AUTH GUARD: Page content hidden"
- 🔍 "AUTH GUARD: Checking authentication..."
- ✅ "Token found in localStorage"
- 📋 "Token payload: ..."
- ✅ "AUTHENTICATION SUCCESSFUL"

### Common Issues & Solutions

#### Issue 1: "No token found in localStorage"
**Symptoms:**
- Auth guard shows: "❌ AUTH GUARD: No token found"
- Dashboard redirects back to login

**Solution:**
1. Clear localStorage: `localStorage.clear()`
2. Login again at auxeira.com
3. Check console for "Stored auxeira_auth_token"
4. Verify token exists: `localStorage.getItem('auxeira_auth_token')`

#### Issue 2: "Token expired"
**Symptoms:**
- Auth guard shows: "❌ Token expired X minutes ago"

**Solution:**
1. Clear localStorage: `localStorage.clear()`
2. Login again to get fresh token
3. Tokens expire after 24 hours

#### Issue 3: "Role mismatch"
**Symptoms:**
- Auth guard shows: "❌ Role mismatch"
- Shows: "Required: ['admin']"
- Shows: "User role: something_else"

**Solution:**
1. Verify you're logging in with: `gina@auxeira.com`
2. Check user role in token:
```javascript
const token = localStorage.getItem('auxeira_auth_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Role:', payload.role); // Should be "admin"
```

#### Issue 4: Dashboard shows blank page
**Symptoms:**
- Page loads but stays blank
- No console errors

**Solution:**
1. Check if auth guard is hiding page:
```javascript
// In console:
document.documentElement.style.visibility = 'visible';
document.documentElement.style.opacity = '1';
```
2. If page appears, auth guard is blocking it
3. Check console for auth errors

#### Issue 5: Redirect loop
**Symptoms:**
- Keeps redirecting between login and dashboard

**Solution:**
1. Clear all storage:
```javascript
localStorage.clear();
sessionStorage.clear();
```
2. Close all browser tabs
3. Open new tab and login fresh

### Testing with cURL

#### Test 1: Login API
```bash
curl -X POST "https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gina@auxeira.com",
    "password": "SSEngine@25"
  }' | jq '.'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "email": "gina@auxeira.com",
      "role": "admin",
      "status": "active"
    },
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  }
}
```

#### Test 2: Decode Token
```bash
# Get token from login response
TOKEN="your_token_here"

# Decode payload (middle part)
echo $TOKEN | cut -d'.' -f2 | base64 -d | jq '.'
```

**Expected Payload:**
```json
{
  "userId": "88370b7a-5daf-4ab7-a5a0-4a8f8432db21",
  "email": "gina@auxeira.com",
  "role": "admin",
  "iat": 1762337083,
  "exp": 1762423483
}
```

### Browser Console Debugging

#### Check Auth Guard Execution
```javascript
// Run this on admin dashboard page
console.log('=== AUTH GUARD DEBUG ===');
console.log('Token in localStorage:', localStorage.getItem('auxeira_auth_token') ? 'YES' : 'NO');
console.log('User in localStorage:', localStorage.getItem('auxeira_user') ? 'YES' : 'NO');

const token = localStorage.getItem('auxeira_auth_token');
if (token) {
    try {
        const parts = token.split('.');
        const payload = JSON.parse(atob(parts[1]));
        console.log('Token payload:', payload);
        console.log('Role:', payload.role);
        console.log('Expires:', new Date(payload.exp * 1000).toISOString());
        
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            console.error('❌ Token is EXPIRED');
        } else {
            console.log('✅ Token is VALID');
        }
    } catch (e) {
        console.error('❌ Error decoding token:', e);
    }
}
```

#### Force Show Page (Bypass Auth Guard)
```javascript
// If auth guard is blocking, temporarily show page to see content
document.documentElement.style.visibility = 'visible';
document.documentElement.style.opacity = '1';
```

### Network Tab Debugging

1. Open DevTools (F12)
2. Go to Network tab
3. Login at auxeira.com
4. Look for:
   - `POST /api/auth/login` - Should return 200 with token
   - Redirect to `dashboard.auxeira.com/admin.html`
   - `GET /admin.html` - Should return 200

### Expected Console Output (Success)

When everything works, you should see:

```
🔒 AUTH GUARD: Page content hidden
🔍 AUTH GUARD: Checking authentication...
✅ Token found in localStorage
📋 Token payload:
   User: gina@auxeira.com
   Role: admin
   Expires: 2025-11-06T...
═══════════════════════════════════════════
✅ AUTHENTICATION SUCCESSFUL
   User: gina@auxeira.com
   Role: admin
   Dashboard: Admin Dashboard
═══════════════════════════════════════════
🧹 Cleaning URL (removing hash/query)
```

### Still Not Working?

If you've tried all the above and still can't access the dashboard:

1. **Take a screenshot** of:
   - Browser console errors
   - Network tab showing the login request
   - localStorage contents

2. **Check these specific things:**
   - Are you using the correct email? `gina@auxeira.com`
   - Are you using the correct password? `SSEngine@25`
   - Is your browser blocking localStorage?
   - Are you in incognito/private mode? (localStorage works differently)
   - Do you have any browser extensions blocking scripts?

3. **Try the test page:**
   - Go to [https://auxeira.com/test-admin-login.html](https://auxeira.com/test-admin-login.html)
   - Follow the 4 steps
   - This will show exactly where the flow breaks

### Contact Support

If none of the above works, provide:
- Browser and version
- Console error messages
- Screenshot of Network tab
- Output from the test page

---

**Last Updated:** 2025-11-05  
**Version:** 1.0
