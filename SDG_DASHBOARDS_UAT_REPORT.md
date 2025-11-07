# SDG Dashboards UAT Report

**Date:** November 7, 2025  
**Tester:** Automated UAT  
**Scope:** All 17 SDG Dashboards (SDG 1-17)  
**Test Users:** sdg1@test.auxeira.com through sdg17@test.auxeira.com (Password: TestSDG2024!)

---

## Executive Summary

**Status:** ⚠️ **CRITICAL ISSUE FOUND**

All SDG test users are being redirected to a generic "esg_funder.html" dashboard instead of their respective SDG-specific dashboards. This indicates a routing/redirect issue in the authentication system.

---

## Test Execution Log

### SDG 1: No Poverty

**Test User:** sdg1@test.auxeira.com  
**Password:** TestSDG2024!  
**Expected Dashboard:** esg_poverty_enhanced.html  
**Actual Dashboard:** esg_funder.html ❌  

**Login Status:** ✅ Success  
**Dashboard Loads:** ✅ Yes  
**Correct Dashboard:** ❌ **NO - Wrong dashboard**  

**Dashboard Content:**
- Title: "Auxeira - esg funder Dashboard"
- Message: "Welcome to Your Dashboard"
- Notice: "Your account has been created successfully! Dashboard features coming soon."
- User Type: "esg funder"

**Issues Found:**
1. 🔴 **CRITICAL:** User is redirected to generic "esg_funder.html" instead of "esg_poverty_enhanced.html"
2. 🔴 **CRITICAL:** User type shows "esg funder" instead of SDG-specific role
3. ⚠️ **WARNING:** Dashboard shows placeholder message "Dashboard features coming soon"
4. ⚠️ **WARNING:** No SDG-specific content visible
5. ⚠️ **WARNING:** No metrics, charts, or data displayed

**Expected vs Actual:**

| Attribute | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Dashboard URL | esg_poverty_enhanced.html | esg_funder.html | ❌ FAIL |
| User Role | sdg_1 or poverty_funder | esg funder | ❌ FAIL |
| SDG Content | SDG 1: No Poverty metrics | Generic placeholder | ❌ FAIL |
| Dashboard Status | Fully functional | "Coming soon" message | ❌ FAIL |

---

## Root Cause Analysis

### Issue: Wrong Dashboard Redirect

**Problem:** The authentication system is redirecting all SDG users to a generic "esg_funder.html" dashboard instead of their SDG-specific dashboards.

**Possible Causes:**

1. **Login API Route Mapping Issue**
   - The login API may not have proper mapping for SDG-specific user types
   - Default fallback is redirecting to "esg_funder.html"

2. **User Role Not Set Correctly in Database**
   - SDG test users may not have their specific SDG role assigned
   - All users defaulting to "esg_funder" role

3. **Dashboard Redirect Logic**
   - The redirect logic in index.html or login handler may not include SDG-specific routes
   - Missing mapping: `sdg_1` → `esg_poverty_enhanced.html`

4. **JWT Token Role Mismatch**
   - JWT token shows `role: "esg_funder"` instead of SDG-specific role
   - Token decoded from URL: `"role":"esg_funder"`

---

## Recommended Fixes

### Priority 1: Fix User Role Assignment

**Action:** Update database to assign correct SDG-specific roles

```sql
-- Example for SDG 1 user
UPDATE auxeira-users-prod
SET user_type = 'sdg_1_funder'  -- or 'poverty_funder'
WHERE email = 'sdg1@test.auxeira.com'
```

### Priority 2: Update Login Redirect Logic

**File:** `index.html` (login modal)

**Current mapping (likely):**
```javascript
const dashboardMap = {
  'startup_founder': 'startup_founder.html',
  'angel_investor': 'angel_investor.html',
  'venture_capital': 'vc.html',
  'corporate_partner': 'corporate_partner_new.html',
  'government': 'government.html',
  'admin': 'admin.html',
  'esg_funder': 'esg_funder.html'  // ❌ Default fallback
};
```

**Required mapping:**
```javascript
const dashboardMap = {
  // ... existing mappings ...
  'sdg_1': 'esg_poverty_enhanced.html',
  'sdg_2': 'esg_hunger_enhanced.html',
  'sdg_3': 'esg_health_enhanced.html',
  'sdg_4': 'esg_education_enhanced.html',
  'sdg_5': 'esg_gender_enhanced.html',
  'sdg_6': 'esg_water_enhanced.html',
  'sdg_7': 'esg_energy_enhanced.html',
  'sdg_8': 'esg_work_enhanced.html',
  'sdg_9': 'esg_innovation_enhanced.html',
  'sdg_10': 'esg_inequalities_enhanced.html',
  'sdg_11': 'esg_cities_enhanced.html',
  'sdg_12': 'esg_consumption_enhanced.html',
  'sdg_13': 'esg_climate_enhanced.html',
  'sdg_14': 'esg_ocean_enhanced.html',
  'sdg_15': 'esg_land_enhanced.html',
  'sdg_16': 'esg_justice_enhanced.html',
  'sdg_17': 'esg_partnerships_enhanced.html'
};
```

### Priority 3: Update Lambda Function

**File:** `lambda/lambda-dashboard-context.js`

Ensure the Lambda function returns the correct user_type for SDG users when they log in.

---

## Testing Status

| SDG | Email | Expected Dashboard | Actual Dashboard | Status |
|-----|-------|-------------------|------------------|--------|
| 1 | sdg1@test.auxeira.com | esg_poverty_enhanced.html | esg_funder.html | ❌ FAIL |
| 2-17 | ... | ... | Not tested yet | ⏸️ PENDING |

**Note:** Testing paused after SDG 1 failure. All remaining SDGs likely have the same issue.

---

## Next Steps

1. ✅ **Immediate:** Fix user role assignment in database for all 17 SDG test users
2. ✅ **Immediate:** Update login redirect logic to include SDG dashboard mappings
3. ✅ **Immediate:** Update Lambda function to return correct SDG roles
4. ⏳ **After Fix:** Retest SDG 1 to verify fix
5. ⏳ **After Fix:** Continue testing SDG 2-17

---

**Current Status:** ⚠️ **BLOCKED - Waiting for redirect logic fix**  
**Tests Completed:** 1/17 (5.9%)  
**Tests Passed:** 0/17 (0%)  
**Critical Issues:** 1

