# Auxeira V2 - Clean Version

## The Cleanest Possible Implementation

### Files
- `index.html` - Landing page + login (ONE file, inline CSS/JS)
- `dashboard.html` - Dashboard (ONE file, inline CSS/JS)

That's it. Two files. Total.

## Key Features

### ✅ Cookies (NOT localStorage)
```javascript
// Set cookie
setCookie('auxeira_token', token, 7);

// Get cookie
const token = getCookie('auxeira_token');

// Delete cookie
deleteCookie('auxeira_token');
```

### ✅ Load Data BEFORE Render
```javascript
// Dashboard shows loading spinner
// Loads user data from cookies
// Validates auth
// THEN shows content
// No race conditions, no flashing
```

### ✅ Live Stubs (NOT placeholders)
```javascript
// Real data from cookies
document.getElementById('userName').textContent = userData.email;

// Live stubs for metrics (replace with API later)
document.getElementById('successScore').textContent = '85.7%';
```

### ✅ No External Dependencies
- No script.js
- No style.css
- No service worker
- No external libraries
- Just pure HTML/CSS/JS

## How It Works

### Login Flow
1. User enters email/password
2. Calls API: `POST /api/auth/login`
3. Stores token + user data in **cookies**
4. Redirects to dashboard
5. **No localStorage, no race conditions**

### Dashboard Flow
1. Shows loading spinner
2. Reads cookies
3. If no cookies → redirect to login
4. If cookies exist → load user data
5. Populate UI with real data
6. Hide loading, show content
7. **Data loaded BEFORE render**

### Logout Flow
1. Delete cookies
2. Redirect to home
3. Done

## Testing

### Local Test
```bash
cd v2/clean
python3 -m http.server 8003
# Open http://localhost:8003
```

### Test Flow
1. Open index.html
2. Click "Sign In"
3. Use: founder@startup.com / Testpass123
4. Should redirect to dashboard
5. Dashboard should show user data
6. Click logout
7. Should return to home

## What's Different from V1

| Feature | V1 | V2 Clean |
|---------|----|----|
| Files | 50+ | 2 |
| Storage | localStorage | Cookies |
| Loading | Race conditions | Load before render |
| Data | Placeholders | Live stubs |
| Service Worker | Yes (caching issues) | No |
| External JS | 5+ files | 0 |
| Redirects | Mysterious | Explicit |
| Debug | Impossible | Easy |

## Deployment

```bash
# Upload to S3
aws s3 cp index.html s3://auxeira-v2-clean/
aws s3 cp dashboard.html s3://auxeira-v2-clean/

# Enable website hosting
aws s3 website s3://auxeira-v2-clean \
  --index-document index.html

# Make public
aws s3api put-bucket-policy --bucket auxeira-v2-clean \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::auxeira-v2-clean/*"
    }]
  }'
```

## Next Steps

### Add Real API Calls
Replace live stubs with real data:

```javascript
// In dashboard.html, replace:
document.getElementById('successScore').textContent = '85.7%';

// With:
const response = await fetch('https://api.auxeira.com/metrics', {
    headers: { 'Authorization': `Bearer ${token}` }
});
const metrics = await response.json();
document.getElementById('successScore').textContent = metrics.successScore;
```

### Add More Pages
- `profile.html` - User profile
- `settings.html` - Account settings
- `metrics.html` - Detailed metrics

Each page: ONE file, inline CSS/JS, cookies, load before render.

## Why This Works

1. **Cookies are reliable** - No localStorage race conditions
2. **Load before render** - No flashing content
3. **Live stubs** - Real data from cookies, fake data for metrics
4. **Single files** - Easy to debug, no dependencies
5. **Explicit flow** - Every redirect is intentional and visible

## The Rule

**ONE HTML file = ONE complete page**

No external CSS, no external JS, no dependencies.
Everything inline, everything explicit, everything debuggable.

Simple. Clean. Works.
