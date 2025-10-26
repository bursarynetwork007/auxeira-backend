# Auxeira V2 - Clean Rebuild Plan

## Problem Statement
Current system has accumulated technical debt with:
- Service worker caching issues causing mysterious redirects
- Multiple conflicting JavaScript files
- Unclear auth flow with hidden dependencies
- Dashboard redirect happening even on direct access (not auth-related)

## Root Cause Discovery
**CRITICAL FINDING**: Direct access to `https://dashboard.auxeira.com/startup_founder.html` redirects even WITHOUT login attempt. This means:
- ❌ NOT a login flow issue
- ❌ NOT a localStorage issue  
- ❌ NOT an auth validation issue
- ✅ Something at the infrastructure level (CloudFront, S3, DNS, or hidden script)

## V2 Architecture - Clean Slate

### Phase 1: Marketing Site (Week 1)
**Goal**: Static marketing pages with NO authentication

#### Files to Preserve (UI/Styling Only):
```
frontend/
├── index.html (landing page - strip all auth logic)
├── about.html
├── careers.html
├── partners.html
├── press.html
├── privacy.html
├── terms.html
├── whitepaper.html
├── css/
│   └── style.css (keep all styling)
└── images/
    └── (all assets)
```

#### What to Remove:
- All JavaScript auth handlers
- Service worker (sw.js)
- All external JS files (script.js, api-integration.js, etc.)
- Login/signup modals
- Any dynamic functionality

#### What to Add:
- Simple "Request Demo" form (email only, no auth)
- Contact form
- Newsletter signup
- All forms POST to a simple Lambda function (no complex auth)

#### Deployment:
```bash
# New S3 bucket for v2
aws s3 mb s3://auxeira-v2.com

# New CloudFront distribution (clean slate)
# No Lambda@Edge, no redirects, pure static hosting
```

---

### Phase 2: Authentication System (Week 2)
**Goal**: Rock-solid auth with ZERO complexity

#### Tech Stack:
- **Frontend**: Pure HTML + Vanilla JS (no frameworks)
- **Backend**: AWS Cognito (managed auth, no custom code)
- **Session**: JWT tokens in httpOnly cookies (NOT localStorage)
- **API**: API Gateway + Lambda (one function per endpoint)

#### Auth Flow:
```
1. User clicks "Sign Up" on marketing site
2. Redirect to auth.auxeira.com/signup
3. Cognito handles signup/verification
4. On success, redirect to dashboard.auxeira.com with JWT cookie
5. Dashboard checks cookie on EVERY page load
6. No service workers, no caching of auth logic
```

#### Files:
```
auth/
├── signup.html (Cognito hosted UI or custom)
├── login.html
├── verify.html
├── forgot-password.html
└── auth.js (minimal, single responsibility)
```

#### Why Cognito:
- ✅ Managed service (no custom auth bugs)
- ✅ Built-in email verification
- ✅ MFA support
- ✅ Password reset flows
- ✅ JWT tokens
- ✅ No localStorage issues

---

### Phase 3: Dashboard Foundation (Week 3)
**Goal**: Single working dashboard with proper auth

#### Start with ONE dashboard:
```
dashboard/
├── index.html (dashboard home - shows after login)
├── startup-founder.html (single dashboard type)
├── dashboard.css (styling only)
└── dashboard.js (minimal logic)
```

#### Dashboard Auth Check (SIMPLE):
```javascript
// dashboard.js - runs on EVERY dashboard page
(function() {
    // Check for JWT cookie
    const token = getCookie('auxeira_token');
    
    if (!token) {
        // No token = not logged in
        window.location.href = 'https://auth.auxeira.com/login';
        return;
    }
    
    // Verify token with backend
    fetch('https://api.auxeira.com/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
    })
    .then(user => {
        // Token valid, load dashboard
        console.log('User authenticated:', user);
    })
    .catch(err => {
        // Token invalid, redirect to login
        console.error('Auth failed:', err);
        window.location.href = 'https://auth.auxeira.com/login';
    });
})();

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
```

#### Key Principles:
- ✅ Auth check on EVERY page load
- ✅ Server-side token verification
- ✅ Fail closed (redirect if ANY error)
- ✅ No localStorage
- ✅ No service workers
- ✅ No caching of auth logic

---

### Phase 4: Add Dashboard Features (Week 4+)
**Goal**: Incrementally add features to working foundation

#### Order:
1. User profile page
2. Settings page
3. Dashboard metrics (static first)
4. API integrations (one at a time)
5. Additional dashboard types (VC, Corporate, etc.)

#### Testing Protocol:
For EACH feature:
1. Test in incognito mode
2. Test direct URL access
3. Test after logout
4. Test with expired token
5. Test with invalid token

---

## Migration Strategy

### Option A: Parallel Deployment (Recommended)
```
Current: auxeira.com (keep running)
V2: auxeira-v2.com (build and test)

When v2 is stable:
1. Point auxeira.com DNS to v2 infrastructure
2. Keep v1 as auxeira-v1.com (backup)
```

### Option B: Subdomain Testing
```
Current: auxeira.com (keep running)
V2: beta.auxeira.com (build and test)

When v2 is stable:
1. Swap infrastructure
2. beta.auxeira.com becomes v1 backup
```

---

## What We're Fixing

### Current Issues:
1. ❌ Service worker caching old code
2. ❌ Multiple conflicting JS files
3. ❌ localStorage auth (unreliable)
4. ❌ Unclear redirect sources
5. ❌ No clear auth verification
6. ❌ Dashboard redirects even on direct access

### V2 Solutions:
1. ✅ No service workers (at least initially)
2. ✅ Single auth.js file (one responsibility)
3. ✅ httpOnly cookies (secure, reliable)
4. ✅ Explicit auth checks on every page
5. ✅ Server-side token verification
6. ✅ Clean infrastructure (no hidden redirects)

---

## File Structure - V2

```
auxeira-v2/
├── marketing/              # Phase 1
│   ├── index.html
│   ├── about.html
│   ├── css/
│   └── images/
│
├── auth/                   # Phase 2
│   ├── signup.html
│   ├── login.html
│   └── auth.js
│
├── dashboard/              # Phase 3
│   ├── index.html
│   ├── startup-founder.html
│   ├── dashboard.js
│   └── dashboard.css
│
├── backend/                # Phase 2-4
│   ├── auth/
│   │   ├── signup.js
│   │   ├── login.js
│   │   └── verify.js
│   └── api/
│       └── (feature endpoints)
│
└── infrastructure/
    ├── cloudformation/     # IaC for clean deployment
    ├── scripts/
    └── docs/
```

---

## Development Workflow

### Step 1: Create V2 Branch
```bash
git checkout -b v2-rebuild
mkdir -p v2/{marketing,auth,dashboard,backend}
```

### Step 2: Extract UI/Styling
```bash
# Copy only HTML structure and CSS
cp frontend/index.html v2/marketing/
cp -r frontend/css v2/marketing/
cp -r frontend/images v2/marketing/

# Strip all JavaScript
# Keep only CSS and HTML structure
```

### Step 3: Build Phase by Phase
```bash
# Phase 1: Marketing site
cd v2/marketing
# Build static pages
# Test locally: python3 -m http.server 8000

# Phase 2: Auth
cd v2/auth
# Implement Cognito integration
# Test auth flow

# Phase 3: Dashboard
cd v2/dashboard
# Build single dashboard
# Test with real auth

# Phase 4: Features
# Add incrementally
```

### Step 4: Deploy to Staging
```bash
# New infrastructure
aws s3 mb s3://auxeira-v2-staging
# Deploy and test

# When stable, deploy to production
aws s3 mb s3://auxeira-v2-prod
```

---

## Timeline

### Week 1: Marketing Site
- Day 1-2: Extract and clean HTML/CSS
- Day 3-4: Remove all auth logic
- Day 5: Deploy to staging, test
- Day 6-7: Polish and finalize

### Week 2: Authentication
- Day 1-2: Set up Cognito
- Day 3-4: Build auth pages
- Day 5: Integrate with marketing site
- Day 6-7: Test all auth flows

### Week 3: Dashboard Foundation
- Day 1-2: Build dashboard shell
- Day 3-4: Implement auth checks
- Day 5: Test thoroughly
- Day 6-7: Add basic features

### Week 4: Features & Polish
- Day 1-3: Add dashboard features
- Day 4-5: Testing and bug fixes
- Day 6-7: Documentation and handoff

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Marketing site loads fast (<2s)
- ✅ All pages accessible
- ✅ Forms submit successfully
- ✅ No JavaScript errors
- ✅ Mobile responsive

### Phase 2 Complete When:
- ✅ User can sign up
- ✅ Email verification works
- ✅ User can log in
- ✅ JWT token issued
- ✅ Password reset works

### Phase 3 Complete When:
- ✅ Dashboard loads after login
- ✅ Dashboard stays loaded (no redirects!)
- ✅ Logout works
- ✅ Direct URL access requires auth
- ✅ Expired token redirects to login

### Phase 4 Complete When:
- ✅ All dashboard features work
- ✅ No regressions in auth
- ✅ Performance is good
- ✅ All tests pass

---

## Risk Mitigation

### Risk: V2 takes too long
**Mitigation**: Keep v1 running, no pressure to switch

### Risk: V2 has same issues
**Mitigation**: Different architecture (Cognito, no SW, cookies)

### Risk: Users affected during migration
**Mitigation**: Parallel deployment, test thoroughly before DNS switch

### Risk: Data migration issues
**Mitigation**: Export v1 users, import to Cognito, test with subset first

---

## Immediate Next Steps

1. **Create v2 branch**
   ```bash
   git checkout -b v2-rebuild
   ```

2. **Set up clean directory structure**
   ```bash
   mkdir -p v2/{marketing,auth,dashboard,backend}
   ```

3. **Extract marketing pages**
   - Copy HTML/CSS only
   - Remove ALL JavaScript
   - Test static pages

4. **Document current user data**
   - Export from DynamoDB
   - Plan Cognito migration

5. **Set up new AWS infrastructure**
   - New S3 buckets
   - New CloudFront distributions
   - Cognito user pool
   - Clean API Gateway

---

## Questions to Answer

1. **User Data**: How many users in current system? Need migration plan?
2. **Custom Domain**: Keep auxeira.com or use new domain for v2?
3. **Timeline**: Is 4-week timeline acceptable?
4. **Features**: Which dashboard features are critical for v2 launch?
5. **Testing**: Who will test v2 before production deployment?

---

## Conclusion

This rebuild will give us:
- ✅ Clean, maintainable codebase
- ✅ Reliable authentication
- ✅ No mysterious redirects
- ✅ Clear separation of concerns
- ✅ Easy to debug and extend
- ✅ Production-ready foundation

The current system has too many unknowns. Starting fresh with proven patterns (Cognito, httpOnly cookies, explicit auth checks) will save time in the long run.

**Ready to start?** Let me know and I'll begin Phase 1: Marketing Site extraction.
