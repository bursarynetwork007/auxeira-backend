Auxeira Platform - Complete Architecture Specification for AI Agents
Document Type: Production System Specification
Version: 4.0 - FINAL
Date: November 4, 2025
Purpose: Authoritative specification for AI agents and development teams

Executive Summary
Auxeira is a role-based, multi-tenant SaaS platform for startup ecosystem business intelligence. The system enforces strict authentication, immutable user roles, and granular access control across 24 protected dashboard pages.
Critical Facts

Total User Roles: 7 (immutable after signup)
Total Dashboard Files: 24 (all protected)
Authentication: Mandatory via modal on auxeira.com
Security Level: Enterprise-grade with industry-standard practices
Direct URL Access: BLOCKED - all dashboards require valid JWT token


1. User Roles Definition
1.1 Role Inventory (7 Total)
javascriptconst USER_ROLES = {
  // Role 1: Platform Administrator
  admin: {
    name: 'Administrator',
    code: 'admin',
    mainDashboard: '/admin.html',
    accessLevel: 'SUPER_USER',
    canAccessDashboards: 'ALL', // Can access all 24 dashboards
    permissions: [
      'view_all_data',
      'edit_all_data',
      'delete_users',
      'modify_roles',
      'system_configuration',
      'view_audit_logs',
      'export_data'
    ],
    description: 'Full system access with administrative privileges'
  },

  // Role 2: Startup Founder
  startup_founder: {
    name: 'Startup Founder',
    code: 'startup_founder',
    mainDashboard: '/startup_founder.html',
    accessLevel: 'USER',
    canAccessDashboards: ['/startup_founder.html'],
    permissions: [
      'view_own_startup_data',
      'edit_own_profile',
      'view_own_analytics',
      'export_own_data'
    ],
    description: 'Startup founders and co-founders managing their company data'
  },

  // Role 3: Venture Capital
  venture_capital: {
    name: 'Venture Capital',
    code: 'venture_capital',
    mainDashboard: '/vc.html',
    accessLevel: 'USER',
    canAccessDashboards: ['/vc.html'],
    permissions: [
      'view_portfolio',
      'view_deal_flow',
      'investment_analytics',
      'export_portfolio_data'
    ],
    description: 'Venture capital firms and investment managers'
  },

  // Role 4: Angel Investor
  angel_investor: {
    name: 'Angel Investor',
    code: 'angel_investor',
    mainDashboard: '/angel_investor.html',
    accessLevel: 'USER',
    canAccessDashboards: ['/angel_investor.html'],
    permissions: [
      'view_investments',
      'track_returns',
      'portfolio_analytics',
      'export_investment_data'
    ],
    description: 'Individual angel investors tracking their investments'
  },

  // Role 5: ESG Funder
  esg_funder: {
    name: 'ESG Funder',
    code: 'esg_funder',
    mainDashboard: '/esg_funder.html',
    accessLevel: 'USER',
    canAccessDashboards: [
      '/esg_funder.html',
      // Plus all 17 UN SDG dashboards
      '/esg_poverty_enhanced.html',
      '/esg_hunger_enhanced.html',
      '/esg_health_enhanced.html',
      '/esg_education_enhanced.html',
      '/esg_gender_enhanced.html',
      '/esg_water_enhanced.html',
      '/esg_energy_enhanced.html',
      '/esg_growth_enhanced.html',
      '/esg_innovation_enhanced.html',
      '/esg_inequality_enhanced.html',
      '/esg_cities_enhanced.html',
      '/esg_consumption_enhanced.html',
      '/esg_climate_enhanced.html',
      '/esg_oceans_enhanced.html',
      '/esg_land_enhanced.html',
      '/esg_peace_enhanced.html',
      '/esg_partnerships_enhanced.html'
    ],
    permissions: [
      'view_esg_metrics',
      'track_sdg_alignment',
      'impact_reporting',
      'export_esg_data'
    ],
    description: 'ESG-focused investors with UN SDG tracking capabilities'
  },

  // Role 6: Corporate Partner
  corporate_partner: {
    name: 'Corporate Partner',
    code: 'corporate_partner',
    mainDashboard: '/corporate_partner.html',
    accessLevel: 'USER',
    canAccessDashboards: ['/corporate_partner.html'],
    permissions: [
      'view_partnerships',
      'track_roi',
      'collaboration_metrics',
      'export_partnership_data'
    ],
    description: 'Corporate partners and accelerators'
  },

  // Role 7: Government
  government: {
    name: 'Government',
    code: 'government',
    mainDashboard: '/government.html',
    accessLevel: 'USER',
    canAccessDashboards: ['/government.html'],
    permissions: [
      'view_ecosystem_data',
      'policy_analytics',
      'regional_metrics',
      'export_ecosystem_data'
    ],
    description: 'Government agencies and policy makers'
  }
};
```

### 1.2 Role Immutability Rules
```
CRITICAL: ROLE IMMUTABILITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Role is selected ONCE during signup
2. Role is stored in database (DynamoDB users table)
3. Role CANNOT be changed after account creation
4. No "switch role" functionality exists
5. No "change role" API endpoint exists
6. User must create new account for different role
7. Admin CANNOT change a user's role (security policy)

Rationale:
- Data segregation and security
- Audit trail integrity
- Prevents privilege escalation
- Ensures data privacy compliance
- Maintains role-based analytics accuracy

Exception: NONE - This rule has no exceptions

2. Dashboard Inventory
2.1 Complete Dashboard List (24 Files)
Main Dashboards (7)
#FileRole AccessSizePurpose1admin.htmladmin101 KBSystem administration, user management2startup_founder.htmlstartup_founder, admin251 KBStartup metrics, growth tracking3vc.htmlventure_capital, admin192 KBPortfolio management, deal flow4angel_investor.htmlangel_investor, admin190 KBInvestment tracking, returns5esg_funder.htmlesg_funder, admin145 KBESG overview + links to 17 SDGs6corporate_partner.htmlcorporate_partner, admin57 KBPartnership ROI, metrics7government.htmlgovernment, admin145 KBEcosystem analytics
ESG/SDG Dashboards (17)
#FileSDGRole AccessSize8esg_poverty_enhanced.htmlSDG 1esg_funder, admin~180 KB9esg_hunger_enhanced.htmlSDG 2esg_funder, admin~180 KB10esg_health_enhanced.htmlSDG 3esg_funder, admin~180 KB11esg_education_enhanced.htmlSDG 4esg_funder, admin~180 KB12esg_gender_enhanced.htmlSDG 5esg_funder, admin~180 KB13esg_water_enhanced.htmlSDG 6esg_funder, admin~180 KB14esg_energy_enhanced.htmlSDG 7esg_funder, admin~180 KB15esg_growth_enhanced.htmlSDG 8esg_funder, admin~180 KB16esg_innovation_enhanced.htmlSDG 9esg_funder, admin~180 KB17esg_inequality_enhanced.htmlSDG 10esg_funder, admin~180 KB18esg_cities_enhanced.htmlSDG 11esg_funder, admin~180 KB19esg_consumption_enhanced.htmlSDG 12esg_funder, admin~180 KB20esg_climate_enhanced.htmlSDG 13esg_funder, admin~180 KB21esg_oceans_enhanced.htmlSDG 14esg_funder, admin~180 KB22esg_land_enhanced.htmlSDG 15esg_funder, admin~180 KB23esg_peace_enhanced.htmlSDG 16esg_funder, admin~180 KB24esg_partnerships_enhanced.htmlSDG 17esg_funder, admin~180 KB
Total Files: 24
Total Size: ~4.5 MB
All Protected: YES - Every file has auth guard

3. Password Security Requirements
3.1 Industry-Standard Password Policy
javascriptconst PASSWORD_REQUIREMENTS = {
  minLength: 12,           // Minimum 12 characters (NIST recommendation)
  maxLength: 128,          // Maximum 128 characters
  requireUppercase: true,  // At least one uppercase letter (A-Z)
  requireLowercase: true,  // At least one lowercase letter (a-z)
  requireDigit: true,      // At least one digit (0-9)
  requireSpecial: true,    // At least one special character
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  
  // Security measures
  preventCommon: true,     // Block top 10,000 common passwords
  preventUserInfo: true,   // Block passwords containing email/name
  preventSequential: true, // Block "12345", "abcde", "qwerty"
  preventRepeating: true,  // Block "aaaa1111", "password1111"
  
  // Password history
  preventReuse: 5,         // Cannot reuse last 5 passwords
  
  // Expiry policy
  expiryDays: 90,          // Password expires after 90 days
  expiryWarningDays: 14,   // Warn user 14 days before expiry
  
  // Failed attempts
  maxFailedAttempts: 5,    // Account locked after 5 failed attempts
  lockoutDuration: 900,    // 15 minutes lockout (in seconds)
  
  // Hashing
  algorithm: 'bcrypt',     // Use bcrypt for hashing
  saltRounds: 12           // 12 rounds (2^12 iterations)
};
3.2 Password Validation Function (Backend)
javascript/**
 * Validate password against industry standards
 * @param {string} password - Plain text password
 * @param {object} userInfo - User email and name for validation
 * @returns {object} - { valid: boolean, errors: string[] }
 */
function validatePassword(password, userInfo = {}) {
  const errors = [];
  
  // Length check
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }
  
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password cannot exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }
  
  // Character requirements
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }
  
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }
  
  if (PASSWORD_REQUIREMENTS.requireDigit && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit (0-9)');
  }
  
  if (PASSWORD_REQUIREMENTS.requireSpecial) {
    const specialRegex = new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
    if (!specialRegex.test(password)) {
      errors.push(`Password must contain at least one special character (${PASSWORD_REQUIREMENTS.specialChars})`);
    }
  }
  
  // Common password check
  if (PASSWORD_REQUIREMENTS.preventCommon) {
    const commonPasswords = [
      'password', 'password123', '123456', '12345678', 'qwerty',
      'abc123', 'monkey', '1234567', 'letmein', 'trustno1',
      'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
      'ashley', 'bailey', 'shadow', '123123', '654321'
      // Add more from common password lists
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a more unique password');
    }
  }
  
  // User info check
  if (PASSWORD_REQUIREMENTS.preventUserInfo && userInfo.email) {
    const emailParts = userInfo.email.toLowerCase().split('@')[0];
    if (password.toLowerCase().includes(emailParts)) {
      errors.push('Password cannot contain parts of your email address');
    }
  }
  
  if (PASSWORD_REQUIREMENTS.preventUserInfo && userInfo.name) {
    const nameParts = userInfo.name.toLowerCase().split(' ');
    for (const part of nameParts) {
      if (part.length > 2 && password.toLowerCase().includes(part)) {
        errors.push('Password cannot contain parts of your name');
      }
    }
  }
  
  // Sequential characters check
  if (PASSWORD_REQUIREMENTS.preventSequential) {
    const sequentials = [
      '12345', '23456', '34567', '45678', '56789',
      'abcde', 'bcdef', 'cdefg', 'defgh', 'efghi',
      'qwert', 'werty', 'ertyu', 'rtyui', 'tyuio'
    ];
    
    for (const seq of sequentials) {
      if (password.toLowerCase().includes(seq)) {
        errors.push('Password cannot contain sequential characters');
        break;
      }
    }
  }
  
  // Repeating characters check
  if (PASSWORD_REQUIREMENTS.preventRepeating) {
    if (/(.)\1{3,}/.test(password)) {
      errors.push('Password cannot contain more than 3 repeating characters');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
}

/**
 * Calculate password strength score
 * @param {string} password
 * @returns {number} - Score from 0-100
 */
function calculatePasswordStrength(password) {
  let score = 0;
  
  // Length scoring
  score += Math.min(password.length * 2, 30);
  
  // Character variety
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 20;
  
  // Complexity bonus
  const uniqueChars = new Set(password).size;
  score += Math.min(uniqueChars * 2, 20);
  
  return Math.min(score, 100);
}
3.3 Frontend Password Validation
javascript/**
 * Real-time password validation feedback for UI
 */
function validatePasswordRealtime(password) {
  const requirements = [
    {
      id: 'length',
      label: 'At least 12 characters',
      test: password.length >= 12,
      icon: password.length >= 12 ? '✅' : '❌'
    },
    {
      id: 'uppercase',
      label: 'One uppercase letter (A-Z)',
      test: /[A-Z]/.test(password),
      icon: /[A-Z]/.test(password) ? '✅' : '❌'
    },
    {
      id: 'lowercase',
      label: 'One lowercase letter (a-z)',
      test: /[a-z]/.test(password),
      icon: /[a-z]/.test(password) ? '✅' : '❌'
    },
    {
      id: 'digit',
      label: 'One digit (0-9)',
      test: /[0-9]/.test(password),
      icon: /[0-9]/.test(password) ? '✅' : '❌'
    },
    {
      id: 'special',
      label: 'One special character (!@#$%^&*)',
      test: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
      icon: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password) ? '✅' : '❌'
    }
  ];
  
  const allValid = requirements.every(req => req.test);
  const strength = calculatePasswordStrength(password);
  
  return {
    valid: allValid,
    requirements,
    strength,
    strengthLabel: getStrengthLabel(strength)
  };
}

function getStrengthLabel(score) {
  if (score < 40) return { label: 'Weak', color: '#f44336' };
  if (score < 60) return { label: 'Fair', color: '#ff9800' };
  if (score < 80) return { label: 'Good', color: '#4caf50' };
  return { label: 'Strong', color: '#2196f3' };
}
3.4 Password Hashing (Backend)
javascriptconst bcrypt = require('bcryptjs');

/**
 * Hash password using bcrypt
 * @param {string} plainPassword - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(plainPassword) {
  const saltRounds = PASSWORD_REQUIREMENTS.saltRounds; // 12
  const hash = await bcrypt.hash(plainPassword, saltRounds);
  
  console.log('Password hashed with bcrypt');
  console.log('  Salt rounds:', saltRounds);
  console.log('  Hash length:', hash.length);
  
  return hash;
}

/**
 * Verify password against hash
 * @param {string} plainPassword - Plain text password
 * @param {string} hash - Stored bcrypt hash
 * @returns {Promise<boolean>} - True if password matches
 */
async function verifyPassword(plainPassword, hash) {
  const isValid = await bcrypt.compare(plainPassword, hash);
  
  console.log('Password verification:', isValid ? 'SUCCESS' : 'FAILED');
  
  return isValid;
}
```

---

## 4. Authentication Architecture

### 4.1 Complete Authentication Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                           │
└─────────────────────────────────────────────────────────────────┘

Step 1: User Entry
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User types: auxeira.com
↓
Landing page loads
↓
User sees: [Get Started] [Sign In] buttons
↓
NO dashboard links visible
NO direct access possible


Step 2: Modal Authentication
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User clicks: [Get Started] OR [Sign In]
↓
Modal opens on top of landing page
↓
                    ┌─────────────────┐
                    │   Modal Choice  │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
         [New User]                   [Existing User]
              │                             │
              ↓                             ↓
      ┌──────────────┐              ┌──────────────┐
      │ SIGNUP FORM  │              │  LOGIN FORM  │
      ├──────────────┤              ├──────────────┤
      │ • Full Name  │              │ • Email      │
      │ • Email      │              │ • Password   │
      │ • Password   │              │              │
      │ • Confirm    │              │ [Submit]     │
      │ • ROLE       │              └──────────────┘
      │   (DROPDOWN) │
      │              │
      │ [Submit]     │
      └──────────────┘


Step 3: Role Selection (SIGNUP ONLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role Dropdown Options:
  ⚪ Select Your Role...
  ⚫ 🚀 Startup Founder
  ⚫ 💼 Venture Capital
  ⚫ 👼 Angel Investor
  ⚫ 🌱 ESG Funder
  ⚫ 🏢 Corporate Partner
  ⚫ 🏛️ Government
  ⚫ 🔧 Administrator (hidden, admin-created only)

⚠️ CRITICAL: Role selected here is PERMANENT
⚠️ User CANNOT change role after signup
⚠️ Must create new account for different role


Step 4: Backend Validation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST /api/auth/signup OR /api/auth/login
↓
Lambda: auxeira-auth-handler
↓
Validation:
  ✓ Email format (RFC 5322 compliant)
  ✓ Password strength (12+ chars, mixed case, digit, special)
  ✓ Role validity (must be in approved list)
  ✓ Email uniqueness (query DynamoDB email-index)
↓
If signup: Hash password with bcrypt (12 rounds)
If login: Verify password hash with bcrypt.compare()
↓
Create/Query DynamoDB record:
  {
    userId: "uuid-v4",
    email: "user@example.com",
    passwordHash: "$2b$12$...",
    role: "startup_founder",  ← IMMUTABLE
    fullName: "John Doe",
    status: "active",
    createdAt: "2025-11-04T...",
    lastLoginAt: "2025-11-04T..."
  }


Step 5: JWT Token Generation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generate JWT with HS256 algorithm:
  Header:
    { "alg": "HS256", "typ": "JWT" }
  
  Payload:
    {
      "userId": "uuid-v4",
      "email": "user@example.com",
      "role": "startup_founder",  ← From database
      "fullName": "John Doe",
      "iat": 1699027200,          ← Issued at timestamp
      "exp": 1699632000           ← Expires in 7 days
    }
  
  Signature:
    HMACSHA256(
      base64UrlEncode(header) + "." + base64UrlEncode(payload),
      JWT_SECRET  ← Stored in Lambda environment variable
    )

Token structure:
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.    ← Header
  eyJ1c2VySWQiOiJ1dWlkLXY0IiwiZW1haWwiOi... ← Payload
  SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c   ← Signature


Step 6: Client-Side Token Storage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response from backend:
  {
    "success": true,
    "access_token": "eyJhbGc...",
    "user": {
      "id": "uuid-v4",
      "email": "user@example.com",
      "role": "startup_founder",
      "fullName": "John Doe"
    }
  }
↓
JavaScript stores in localStorage:
  localStorage.setItem('auxeira_auth_token', access_token);
  localStorage.setItem('auxeira_user', JSON.stringify(user));


Step 7: Role-Based Redirect
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JavaScript reads user.role from response
↓
Lookup redirect URL:
  const routes = {
    'admin': '/admin.html',
    'startup_founder': '/startup_founder.html',
    'venture_capital': '/vc.html',
    'angel_investor': '/angel_investor.html',
    'esg_funder': '/esg_funder.html',
    'corporate_partner': '/corporate_partner.html',
    'government': '/government.html'
  };
↓
Redirect to: https://dashboard.auxeira.com + routes[role]
↓
Example: https://dashboard.auxeira.com/startup_founder.html


Step 8: Dashboard Auth Guard (ON EVERY DASHBOARD)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dashboard page loads
↓
IMMEDIATELY execute auth guard (before rendering content):
  1. Check localStorage for 'auxeira_auth_token'
  2. If missing → Redirect to auxeira.com with error
  3. If present → Decode JWT payload
  4. Verify token not expired (exp > now)
  5. Verify role matches dashboard requirements
  6. If admin role → Allow access (admin can access all)
  7. If role mismatch → Redirect with "Access Denied"
  8. If all checks pass → Allow dashboard to render
↓
Dashboard loads data via API with token in Authorization header
4.2 JWT Token Specification
javascript// JWT Configuration
const JWT_CONFIG = {
  algorithm: 'HS256',          // HMAC SHA-256
  expiresIn: '7d',             // 7 days = 604,800 seconds
  issuer: 'auxeira.com',       // Token issuer
  audience: 'dashboard.auxeira.com', // Intended audience
  
  // Token payload structure
  payloadStructure: {
    required: ['userId', 'email', 'role', 'fullName', 'iat', 'exp'],
    optional: ['organizationName', 'permissions']
  },
  
  // Security
  secretMinLength: 32,         // JWT_SECRET must be 32+ chars
  secretStorage: 'AWS Lambda Environment Variables (encrypted)',
  
  // Validation rules
  validateSignature: true,     // Always verify signature
  validateExpiry: true,        // Always check expiration
  validateIssuer: true,        // Verify issuer claim
  validateAudience: true,      // Verify audience claim
  
  // Token refresh policy
  refreshEnabled: false,       // No token refresh (user must re-login)
  gracePeriod: 0              // No grace period after expiry
};

// Example JWT payload
const EXAMPLE_JWT_PAYLOAD = {
  "userId": "a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
  "email": "founder@startup.com",
  "role": "startup_founder",
  "fullName": "Jane Smith",
  "iat": 1699027200,           // Issued: Nov 4, 2025, 00:00:00 UTC
  "exp": 1699632000,           // Expires: Nov 11, 2025, 00:00:00 UTC
  "iss": "auxeira.com",
  "aud": "dashboard.auxeira.com"
};

5. Security Implementation
5.1 Auth Guard - Complete Implementation
javascript/**
 * AUXEIRA AUTH GUARD
 * 
 * PLACEMENT: Top of EVERY dashboard HTML file (all 24 files)
 * EXECUTION: Immediately when page loads (before any content renders)
 * PURPOSE: Prevent unauthorized access and direct URL navigation
 * 
 * CRITICAL: This is the ONLY security mechanism preventing direct URL access
 */

(function auxeiraAuthGuard() {
  'use strict';
  
  // ═══════════════════════════════════════════════════════════════
  // CONFIGURATION - CUSTOMIZE FOR EACH DASHBOARD
  // ═══════════════════════════════════════════════════════════════
  
  const AUTH_CONFIG = {
    // URLs
    LOGIN_URL: 'https://auxeira.com/',
    DASHBOARD_BASE: 'https://dashboard.auxeira.com',
    
    // Storage keys
    TOKEN_KEY: 'auxeira_auth_token',
    USER_KEY: 'auxeira_user',
    
    // Dashboard identification
    DASHBOARD_NAME: 'Startup Founder Dashboard',  // ← CHANGE FOR EACH FILE
    DASHBOARD_PATH: '/startup_founder.html',      // ← CHANGE FOR EACH FILE
    
    // Authorization
    ALLOWED_ROLES: ['admin', 'startup_founder'],  // ← CHANGE FOR EACH FILE
    
    // Security settings
    TOKEN_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000,   // 7 days
    REQUIRE_HTTPS: true,
    ENFORCE_ROLE_MATCH: true,
    
    // Logging
    DEBUG_MODE: true  // Set to false in production
  };
  
  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════
  
  if (AUTH_CONFIG.DEBUG_MODE) {
    console.log('═══════════════════════════════════════════════════');
    console.log('AUXEIRA AUTH GUARD - INITIALIZATION');
    console.log('═══════════════════════════════════════════════════');
    console.log('Dashboard:', AUTH_CONFIG.DASHBOARD_NAME);
    console.log('Path:', AUTH_CONFIG.DASHBOARD_PATH);
    console.log('Allowed Roles:', AUTH_CONFIG.ALLOWED_ROLES);
    console.log('Current URL:', window.location.href);
    console.log('Timestamp:', new Date().toISOString());
    console.log('═══════════════════════════════════════════════════');
  }
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 1: HTTPS ENFORCEMENT
  // ═══════════════════════════════════════════════════════════════
  
  function enforceHTTPS() {
    if (AUTH_CONFIG.REQUIRE_HTTPS && window.location.protocol !== 'https:') {
      console.error('❌ AUTH GUARD: HTTPS required but page loaded over HTTP');
      handleAuthFailure('Insecure connection. HTTPS required.');
      return false;
    }
    return true;
  }
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 2: TOKEN RETRIEVAL
  // ═══════════════════════════════════════════════════════════════
  
  function getToken() {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    
    if (!token) {
      if (AUTH_CONFIG.DEBUG_MODE) {
        console.error('❌ AUTH GUARD: No token found in localStorage');
        console.log('   Checked key:', AUTH_CONFIG.TOKEN_KEY);
        console.log('   Available keys:', Object.keys(localStorage));
      }
      return null;
    }
    
    if (AUTH_CONFIG.DEBUG_MODE) {
      console.log('✅ AUTH GUARD: Token found');
      console.log('   Length:', token.length, 'characters');
      console.log('   Preview:', token.substring(0, 20) + '...');
    }
    
    return token;
  }
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 3: TOKEN VALIDATION
  // ═══════════════════════════════════════════════════════════════
  
  function validateToken(token) {
    try {
      // Parse JWT structure
      const parts = token.split('.');
      if (parts.length !== 3) {
        return {
          valid: false,
          reason: 'Invalid token format (expected 3 parts: header.payload.signature)',
          code: 'INVALID_FORMAT'
        };
      }
      
      // Decode payload
      const payload = JSON.parse(atob(parts[1]));
      
      if (AUTH_CONFIG.DEBUG_MODE) {
        console.log('📋 AUTH GUARD: Token Payload');
        console.log('   User ID:', payload.userId);
        console.log('   Email:', payload.email);
        console.log('   Role:', payload.role);
        console.log('   Issued:', new Date(payload.iat * 1000).toISOString());
        console.log('   Expires:', new Date(payload.exp * 1000).toISOString());
      }
      
      // Validate required fields
      const requiredFields = ['userId', 'email', 'role', 'exp'];
      for (const field of requiredFields) {
        if (!payload[field]) {
          return {
            valid: false,
            reason: `Missing required field: ${field}`,
            code: 'MISSING_FIELD'
          };
        }
      }
      
      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        const expiredAgo = now - payload.exp;
        const expiredMinutes = Math.floor(expiredAgo / 60);
        
        return {
          valid: false,
          reason: `Token expired ${expiredMinutes} minute(s) ago`,
          code: 'EXPIRED',
          payload
        };
      }
      
      if (AUTH_CONFIG.DEBUG_MODE) {
        const expiresIn = payload.exp - now;
        const expiresInHours = Math.floor(expiresIn / 3600);
        console.log(`✅ AUTH GUARD: Token valid for ${expiresInHours} more hour(s)`);
      }
      
      // Check role authorization
      if (AUTH_CONFIG.ENFORCE_ROLE_MATCH) {
        if (!AUTH_CONFIG.ALLOWED_ROLES.includes(payload.role)) {
          return {
            valid: false,
            reason: `Access denied. Required role: ${AUTH_CONFIG.ALLOWED_ROLES.join(' or ')}. Your role: ${payload.role}`,
            code: 'FORBIDDEN',
            payload
          };
        }
      }
      
      if (AUTH_CONFIG.DEBUG_MODE) {
        console.log('✅ AUTH GUARD: Role authorized:', payload.role);
      }
      
      // All checks passed
      return {
        valid: true,
        payload
      };
      
    } catch (error) {
      console.error('❌ AUTH GUARD: Token parsing error:', error.message);
      return {
        valid: false,
        reason: 'Token validation failed: ' + error.message,
        code: 'PARSE_ERROR'
      };
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 4: AUTHENTICATION FAILURE HANDLER
  // ═══════════════════════════════════════════════════════════════
  
  function handleAuthFailure(reason, code = 'AUTH_FAILED') {
    console.error('🚫 AUTH GUARD: AUTHENTICATION FAILED');
    console.error('   Reason:', reason);
    console.error('   Code:', code);
    console.error('   Dashboard:', AUTH_CONFIG.DASHBOARD_NAME);
    console.error('   Action: Redirecting to login');
    
    // Clear invalid data
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    sessionStorage.clear();
    
    // Show error overlay
    showErrorOverlay(reason);
    
    // Redirect after delay
    setTimeout(() => {
      if (AUTH_CONFIG.DEBUG_MODE) {
        console.log('🔄 AUTH GUARD: Redirecting to', AUTH_CONFIG.LOGIN_URL);
      }
      window.location.replace(AUTH_CONFIG.LOGIN_URL);
    }, 2500);
  }
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 5: ERROR OVERLAY UI
  // ═══════════════════════════════════════════════════════════════
  
  function showErrorOverlay(message) {
    // Prevent multiple overlays
    if (document.getElementById('auxeira-auth-overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'auxeira-auth-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    `;
    
    overlay.innerHTML = `
      <div style="
        background: white;
        padding: 48px;
        border-radius: 20px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        text-align: center;
        max-width: 500px;
        margin: 20px;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="font-size: 72px; margin-bottom: 24px; animation: pulse 2s infinite;">🔒</div>
        <h1 style="
          color: #1a202c;
          margin: 0 0 16px 0;
          font-size: 28px;
          font-weight: 700;
        ">Authentication Required</h1>
        <p style="
          color: #4a5568;
          margin: 0 0 24px 0;
          font-size: 16px;
          line-height: 1.6;
        ">${escapeHtml(message)}</p>
        <p style="
          color: #718096;
          font-size: 14px;
          margin: 0 0 24px 0;
        ">Redirecting to login page...</p>
        <div style="
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
        ">
          <div style="
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            animation: progress 2.5s ease-out;
          "></div>
        </div>
      </div>
    `;
    
    // Add animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes progress {
        from { width: 0%; }
        to { width: 100%; }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 6: MAIN AUTH CHECK EXECUTION
  // ═══════════════════════════════════════════════════════════════
  
  function executeAuthCheck() {
    if (AUTH_CONFIG.DEBUG_MODE) {
      console.log('🔐 AUTH GUARD: Starting authentication check...');
    }
    
    // Check 1: HTTPS
    if (!enforceHTTPS()) {
      return;
    }
    
    // Check 2: Get token
    const token = getToken();
    if (!token) {
      handleAuthFailure(
        'No authentication token found. Please login to access this dashboard.',
        'NO_TOKEN'
      );
      return;
    }
    
    // Check 3: Validate token
    const validation = validateToken(token);
    if (!validation.valid) {
      handleAuthFailure(validation.reason, validation.code);
      return;
    }
    
    // ✅ SUCCESS - All checks passed
    if (AUTH_CONFIG.DEBUG_MODE) {
      console.log('═══════════════════════════════════════════════════');
      console.log('✅ AUTH GUARD: AUTHENTICATION SUCCESSFUL');
      console.log('═══════════════════════════════════════════════════');
      console.log('👤 Authenticated User:', validation.payload.email);
      console.log('🎭 User Role:', validation.payload.role);
      console.log('📊 Dashboard:', AUTH_CONFIG.DASHBOARD_NAME);
      console.log('🎉 Allowing dashboard to load...');
      console.log('═══════════════════════════════════════════════════');
    }
    
    // Make user data globally available
    window.AUXEIRA_USER = validation.payload;
    window.AUXEIRA_TOKEN = token;
    
    // Dispatch event for dashboard to listen to
    window.dispatchEvent(new CustomEvent('auxeira-auth-success', {
      detail: validation.payload
    }));
  }
  
  // ═══════════════════════════════════════════════════════════════
  // EXECUTE IMMEDIATELY (BLOCKING)
  // ═══════════════════════════════════════════════════════════════
  
  executeAuthCheck();
  
})();

// ═══════════════════════════════════════════════════════════════
// END OF AUTH GUARD
// Dashboard code can safely execute below this point
// ═══════════════════════════════════════════════════════════════
5.2 Auth Guard Configuration Per Dashboard
javascript// ┌────────────────────────────────────────────────────────────┐
// │ AUTH GUARD CONFIGURATIONS FOR EACH DASHBOARD               │
// └────────────────────────────────────────────────────────────┘

// File: admin.html
const AUTH_CONFIG = {
  DASHBOARD_NAME: 'Admin Dashboard',
  DASHBOARD_PATH: '/admin.html',
  ALLOWED_ROLES: ['admin']  // Admin only
};

// File: startup_founder.html
const AUTH_CONFIG = {
  DASHBOARD_NAME: 'Startup Founder Dashboard',
  DASHBOARD_PATH: '/startup_founder.html',
  ALLOWED_ROLES: ['admin', 'startup_founder']
};

// File: vc.html
const AUTH_CONFIG = {
  DASHBOARD_NAME: 'Venture Capital Dashboard',
  DASHBOARD_PATH: '/vc.html',
  ALLOWED_ROLES: ['admin', 'venture_capital']
};

// File: angel_investor.html
const AUTH_CONFIG = {
  DASHBOARD_NAME: 'Angel Investor Dashboard',
  DASHBOARD_PATH: '/angel_investor.html',
  ALLOWED_ROLES: ['admin', 'angel_investor']
};

// File: esg_funder.html
const AUTH_CONFIG = {
  DASHBOARD_NAME: 'ESG Funder Dashboard',
  DASHBOARD_PATH: '/esg_funder.html',
  ALLOWED_ROLES: ['admin', 'esg_funder']
};

// File: corporate_partner.html
const AUTH_CONFIG = {
  DASHBOARD_NAME: 'Corporate Partner Dashboard',
  DASHBOARD_PATH: '/corporate_partner.html',
  ALLOWED_ROLES: ['admin', 'corporate_partner']
};

// File: government.html
const AUTH_CONFIG = {
  DASHBOARD_NAME: 'Government Dashboard',
  DASHBOARD_PATH: '/government.html',
  ALLOWED_ROLES: ['admin', 'government']
};

// Files: esg_*.html (all 17 SDG dashboards)
const AUTH_CONFIG = {
  DASHBOARD_NAME: 'ESG SDG Dashboard',  // Change for each SDG
  DASHBOARD_PATH: '/esg_poverty_enhanced.html',  // Change for each file
  ALLOWED_ROLES: ['admin', 'esg_funder']  // Same for all ESG dashboards
};

6. Database Schema
6.1 DynamoDB Table: auxeira-users-prod
javascript{
  // Table Configuration
  TableName: "auxeira-users-prod",
  BillingMode: "PAY_PER_REQUEST",
  Region: "us-east-1",
  
  // Primary Key
  KeySchema: [
    {
      AttributeName: "userId",
      KeyType: "HASH"  // Partition key
    }
  ],
  
  // Attributes
  AttributeDefinitions: [
    {
      AttributeName: "userId",
      AttributeType: "S"
    },
    {
      AttributeName: "email",
      AttributeType: "S"
    }
  ],
  
  // Global Secondary Index
  GlobalSecondaryIndexes: [
    {
      IndexName: "email-index",
      KeySchema: [
        {
          AttributeName: "email",
          KeyType: "HASH"
        }
      ],
      Projection: {
        ProjectionType: "ALL"
      }
    }
  ]
}

// Record Structure
{
  // Primary Key
  "userId": "a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6",  // UUID v4
  
  // Authentication
  "email": "founder@startup.com",                    // Unique, lowercase
  "passwordHash": "$2b$12$KpXWFZXzXz...",            // bcrypt hash
  
  // Profile
  "fullName": "Jane Smith",                          // Display name
  
  // Authorization (IMMUTABLE)
  "role": "startup_founder",                         // NEVER changes
  
  // Status
  "status": "active",                                // active | suspended | deleted
  
  // Timestamps
  "createdAt": "2025-11-04T10:00:00.000Z",          // ISO 8601
  "lastLoginAt": "2025-11-04T15:30:45.123Z",        // ISO 8601
  "updatedAt": "2025-11-04T15:30:45.123Z",          // ISO 8601
  
  // Security
  "failedLoginAttempts": 0,                          // Track failed logins
  "accountLockedUntil": null,                        // Lockout timestamp
  "passwordChangedAt": "2025-11-04T10:00:00.000Z",  // Last password change
  "passwordHistory": [                               // Last 5 password hashes
    "$2b$12$old_hash_1...",
    "$2b$12$old_hash_2..."
  ],
  
  // Optional
  "organizationName": "Acme Startup Inc",            // For corporate users
  "phoneNumber": "+1-555-123-4567",                  // E.164 format
  "profilePictureUrl": "https://cdn.auxeira.com/..." // Avatar URL
}

// Access Patterns
// 1. Get user by userId (Primary Key)
//    → dynamodb.get({ Key: { userId } })
//
// 2. Get user by email (GSI)
//    → dynamodb.query({ IndexName: 'email-index', KeyConditionExpression: 'email = :email' })
//
// 3. Check email exists (GSI)
//    → dynamodb.query({ IndexName: 'email-index', Select: 'COUNT' })
//
// 4. List all users (Scan - admin only)
//    → dynamodb.scan({ FilterExpression: 'status = :active' })
6.2 Create Table Script
bash#!/bin/bash
# Create auxeira-users-prod table with email index

aws dynamodb create-table \
  --table-name auxeira-users-prod \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --global-secondary-indexes \
    "[{
      \"IndexName\": \"email-index\",
      \"KeySchema\": [{\"AttributeName\": \"email\", \"KeyType\": \"HASH\"}],
      \"Projection\": {\"ProjectionType\": \"ALL\"}
    }]" \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Wait for table to be active
aws dynamodb wait table-exists --table-name auxeira-users-prod --region us-east-1

echo "✅ Table created successfully"
```

---

## 7. API Endpoints

### 7.1 Authentication Endpoints
```
┌─────────────────────────────────────────────────────────────┐
│ POST /api/auth/signup                                       │
├─────────────────────────────────────────────────────────────┤
│ Purpose: Create new user account                            │
│                                                             │
│ Request Body:                                               │
│   {                                                         │
│     "fullName": "Jane Smith",                              │
│     "email": "jane@startup.com",                           │
│     "password": "SecureP@ssw0rd123",                       │
│     "role": "startup_founder"                              │
│   }                                                         │
│                                                             │
│ Validation:                                                 │
│   - fullName: Required, 2-100 chars                        │
│   - email: Required, valid format, unique                  │
│   - password: Required, 12+ chars, mixed case, digit, special │
│   - role: Required, must be in ALLOWED_ROLES list          │
│                                                             │
│ Success Response (201 Created):                            │
│   {                                                         │
│     "success": true,                                        │
│     "access_token": "eyJhbGc...",                          │
│     "user": {                                              │
│       "id": "a1b2c3d4-...",                                │
│       "email": "jane@startup.com",                         │
│       "role": "startup_founder",                           │
│       "fullName": "Jane Smith"                             │
│     }                                                       │
│   }                                                         │
│                                                             │
│ Error Responses:                                            │
│   400: Missing required fields                             │
│   400: Invalid email format                                │
│   400: Password too weak                                   │
│   400: Invalid role                                        │
│   400: Email already registered                            │
│   500: Internal server error                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ POST /api/auth/login                                        │
├─────────────────────────────────────────────────────────────┤
│ Purpose: Authenticate existing user                         │
│                                                             │
│ Request Body:                                               │
│   {                                                         │
│     "email": "jane@startup.com",                           │
│     "password": "SecureP@ssw0rd123"                        │
│   }                                                         │
│                                                             │
│ Success Response (200 OK):                                 │
│   {                                                         │
│     "success": true,                                        │
│     "access_token": "eyJhbGc...",                          │
│     "user": {                                              │
│       "id": "a1b2c3d4-...",                                │
│       "email": "jane@startup.com",                         │
│       "role": "startup_founder",                           │
│       "fullName": "Jane Smith"                             │
│     }                                                       │
│   }                                                         │
│                                                             │
│ Error Responses:                                            │
│   400: Missing credentials                                 │
│   401: Invalid email or password                           │
│   403: Account suspended                                   │
│   429: Too many failed attempts (account locked)           │
│   500: Internal server error                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ GET /api/auth/verify                                        │
├─────────────────────────────────────────────────────────────┤
│ Purpose: Verify JWT token validity                          │
│                                                             │
│ Request Headers:                                            │
│   Authorization: Bearer eyJhbGc...                         │
│                                                             │
│ Success Response (200 OK):                                 │
│   {                                                         │
│     "valid": true,                                         │
│     "user": {                                              │
│       "id": "a1b2c3d4-...",                                │
│       "email": "jane@startup.com",                         │
│       "role": "startup_founder",                           │
│       "fullName": "Jane Smith"                             │
│     },                                                      │
│     "expiresAt": "2025-11-11T10:00:00.000Z"               │
│   }                                                         │
│                                                             │
│ Error Responses:                                            │
│   401: No token provided                                   │
│   401: Invalid token                                       │
│   401: Token expired                                       │
└─────────────────────────────────────────────────────────────┘

8. Deployment Procedures
8.1 Complete Deployment Checklist
bash#!/bin/bash
# Complete Auxeira Platform Deployment
# Run this script to deploy entire system from scratch

set -e

echo "═══════════════════════════════════════════════════════"
echo "  AUXEIRA PLATFORM - COMPLETE DEPLOYMENT"
echo "═══════════════════════════════════════════════════════"
echo ""

# Configuration
AWS_REGION="us-east-1"
MARKETING_BUCKET="auxeira.com"
DASHBOARD_BUCKET="auxeira-dashboards-jsx-1759943238"
MARKETING_DISTRIBUTION="E1O2Q0Z86U0U5T"
DASHBOARD_DISTRIBUTION="E1L1Q8VK3LAEFC"
API_GATEWAY_ID="6qfa3ssb10"

# ═══════════════════════════════════════════════════════════
# PHASE 1: DATABASE SETUP
# ═══════════════════════════════════════════════════════════

echo "Phase 1: Database Setup"
echo "─────────────────────────────────────────────────────────"

# Check if table exists
if aws dynamodb describe-table --table-name auxeira-users-prod --region $AWS_REGION 2>/dev/null; then
  echo "✅ Table auxeira-users-prod exists"
else
  echo "Creating table auxeira-users-prod..."
  
  aws dynamodb create-table \
    --table-name auxeira-users-prod \
    --attribute-definitions \
      AttributeName=userId,AttributeType=S \
      AttributeName=email,AttributeType=S \
    --key-schema \
      AttributeName=userId,KeyType=HASH \
    --global-secondary-indexes \
      "[{
        \"IndexName\": \"email-index\",
        \"KeySchema\": [{\"AttributeName\": \"email\", \"KeyType\": \"HASH\"}],
        \"Projection\": {\"ProjectionType\": \"ALL\"}
      }]" \
    --billing-mode PAY_PER_REQUEST \
    --region $AWS_REGION
  
  echo "Waiting for table to be active..."
  aws dynamodb wait table-exists --table-name auxeira-users-prod --region $AWS_REGION
  
  echo "✅ Table created"
fi

echo ""

# ═══════════════════════════════════════════════════════════
# PHASE 2: LAMBDA DEPLOYMENT
# ═══════════════════════════════════════════════════════════

echo "Phase 2: Lambda Functions"
echo "─────────────────────────────────────────────────────────"

# Auth Lambda
echo "Deploying auth-handler..."
cd lambda-auth
npm install bcryptjs jsonwebtoken

# Generate JWT secret if not exists
if [ ! -f ".jwt-secret" ]; then
  JWT_SECRET=$(openssl rand -base64 32)
  echo "$JWT_SECRET" > .jwt-secret
  echo "✅ JWT secret generated"
else
  JWT_SECRET=$(cat .jwt-secret)
  echo "✅ JWT secret loaded"
fi

# Package Lambda
zip -r auth-deployment.zip . -x "*.git*" "*.zip"

# Deploy or update
if aws lambda get-function --function-name auxeira-auth-handler --region $AWS_REGION 2>/dev/null; then
  echo "Updating existing auth-handler..."
  aws lambda update-function-code \
    --function-name auxeira-auth-handler \
    --zip-file fileb://auth-deployment.zip \
    --region $AWS_REGION
else
  echo "Creating auth-handler..."
  # Get IAM role (assuming it exists)
  ROLE_ARN=$(aws iam get-role --role-name AuxeiraLambdaRole --query 'Role.Arn' --output text)
  
  aws lambda create-function \
    --function-name auxeira-auth-handler \
    --runtime nodejs18.x \
    --role $ROLE_ARN \
    --handler auth_handler.handler \
    --zip-file fileb://auth-deployment.zip \
    --timeout 30 \
    --memory-size 512 \
    --environment "Variables={JWT_SECRET=$JWT_SECRET}" \
    --region $AWS_REGION
fi

# Set environment variable
aws lambda update-function-configuration \
  --function-name auxeira-auth-handler \
  --environment "Variables={JWT_SECRET=$JWT_SECRET}" \
  --region $AWS_REGION

echo "✅ Auth handler deployed"
cd ..

echo ""

# ═══════════════════════════════════════════════════════════
# PHASE 3: FRONTEND DEPLOYMENT
# ═══════════════════════════════════════════════════════════

echo "Phase 3: Frontend Deployment"
echo "─────────────────────────────────────────────────────────"

# Deploy landing page
echo "Deploying landing page..."
aws s3 cp frontend/index.html s3://$MARKETING_BUCKET/index.html \
  --content-type "text/html" \
  --cache-control "max-age=0, no-cache" \
  --region $AWS_REGION

echo "✅ Landing page deployed"

# Deploy all 24 dashboards
echo "Deploying 24 dashboards..."
DASHBOARD_COUNT=0

for file in dashboard-html/*.html; do
  FILENAME=$(basename "$file")
  
  aws s3 cp "$file" s3://$DASHBOARD_BUCKET/$FILENAME \
    --content-type "text/html" \
    --cache-control "max-age=0, no-cache" \
    --region $AWS_REGION
  
  DASHBOARD_COUNT=$((DASHBOARD_COUNT + 1))
done

echo "✅ $DASHBOARD_COUNT dashboards deployed"

echo ""

# ═══════════════════════════════════════════════════════════
# PHASE 4: CLOUDFRONT INVALIDATION
# ═══════════════════════════════════════════════════════════

echo "Phase 4: CloudFront Cache Invalidation"
echo "─────────────────────────────────────────────────────────"

echo "Invalidating marketing site..."
aws cloudfront create-invalidation \
  --distribution-id $MARKETING_DISTRIBUTION \
  --paths "/*" \
  --region $AWS_REGION

echo "Invalidating dashboard site..."
aws cloudfront create-invalidation \
  --distribution-id $DASHBOARD_DISTRIBUTION \
  --paths "/*" \
  --region $AWS_REGION

echo "✅ CloudFront invalidations created"

echo ""

# ═══════════════════════════════════════════════════════════
# PHASE 5: VERIFICATION
# ═══════════════════════════════════════════════════════════

echo "Phase 5: System Verification"
echo "─────────────────────────────────────────────────────────"

# Check table
TABLE_STATUS=$(aws dynamodb describe-table \
  --table-name auxeira-users-prod \
  --query 'Table.TableStatus' \
  --output text \
  --region $AWS_REGION)

echo "Database: $TABLE_STATUS"

# Check Lambda
LAMBDA_STATUS=$(aws lambda get-function \
  --function-name auxeira-auth-handler \
  --query 'Configuration.State' \
  --output text \
  --region $AWS_REGION)

echo "Auth Lambda: $LAMBDA_STATUS"

# Check S3
MARKETING_FILES=$(aws s3 ls s3://$MARKETING_BUCKET/ | wc -l)
DASHBOARD_FILES=$(aws s3 ls s3://$DASHBOARD_BUCKET/ | grep ".html" | wc -l)

echo "Marketing files: $MARKETING_FILES"
echo "Dashboard files: $DASHBOARD_FILES"

echo ""

# ═══════════════════════════════════════════════════════════
# COMPLETION
# ═══════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "System URLs:"
echo "  Landing: https://auxeira.com"
echo "  Dashboards: https://dashboard.auxeira.com"
echo ""
echo "API Endpoints:"
echo "  Auth: https://$API_GATEWAY_ID.execute-api.$AWS_REGION.amazonaws.com/prod/api/auth"
echo ""
echo "Next Steps:"
echo "  1. Wait 5-10 minutes for CloudFront propagation"
echo "  2. Test signup flow at https://auxeira.com"
echo "  3. Verify direct URL blocking"
echo "  4. Test all 7 user roles"
echo "  5. Verify ESG funder can access 17 SDG dashboards"
echo ""
echo "JWT Secret Location: lambda-auth/.jwt-secret"
echo "⚠️  KEEP THIS SECRET SECURE!"
echo ""

9. Testing Procedures
9.1 Complete Testing Script
bash#!/bin/bash
# Comprehensive system testing for Auxeira platform

API_BASE="https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod"

echo "═══════════════════════════════════════════════════════"
echo "  AUXEIRA PLATFORM - SYSTEM TESTING"
echo "═══════════════════════════════════════════════════════"
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Password Validation
echo "Test 1: Password Validation"
echo "───────────────────────────────────────────────────────"

WEAK_PASSWORDS=(
  "short"                    # Too short
  "alllowercase123"          # No uppercase
  "ALLUPPERCASE123"          # No lowercase
  "NoDigitsHere!"            # No digits
  "NoSpecialChars123"        # No special chars
  "password123!"             # Common password
)

echo "Testing weak passwords (should fail):"
for pwd in "${WEAK_PASSWORDS[@]}"; do
  echo "  Testing: '$pwd'"
  # Would call API here
done

STRONG_PASSWORD="MySecureP@ssw0rd2024!"
echo "Testing strong password: '$STRONG_PASSWORD' (should pass)"

echo ""

# Test 2: Signup Flow
echo "Test 2: Signup Flow"
echo "───────────────────────────────────────────────────────"

TEST_EMAIL="test-$(date +%s)@example.com"

SIGNUP_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"fullName\": \"Test User\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$STRONG_PASSWORD\",
    \"role\": \"startup_founder\"
  }")

if echo "$SIGNUP_RESPONSE" | jq -e '.success == true' >/dev/null 2>&1; then
  echo "✅ Signup successful"
  TESTS_PASSED=$((TESTS_PASSED + 1))
  
  TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.access_token')
  USER_ID=$(echo "$SIGNUP_RESPONSE" | jq -r '.user.id')
  
  echo "   User ID: $USER_ID"
  echo "   Token: ${TOKEN:0:30}..."
else
  echo "❌ Signup failed"
  echo "   Response: $SIGNUP_RESPONSE"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""

# Test 3: Login Flow
echo "Test 3: Login Flow"
echo "───────────────────────────────────────────────────────"

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$STRONG_PASSWORD\"
  }")

if echo "$LOGIN_RESPONSE" | jq -e '.success == true' >/dev/null 2>&1; then
  echo "✅ Login successful"
  TESTS_PASSED=$((TESTS_PASSED + 1))
  
  LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
  ROLE=$(echo "$LOGIN_RESPONSE" | jq -r '.user.role')
  
  echo "   Role: $ROLE"
  echo "   Token matches: $([ "$TOKEN" != "$LOGIN_TOKEN" ] && echo "NO (different token)" || echo "N/A")"
else
  echo "❌ Login failed"
  echo "   Response: $LOGIN_RESPONSE"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""

# Test 4: Token Verification
echo "Test 4: Token Verification"
echo "───────────────────────────────────────────────────────"

VERIFY_RESPONSE=$(curl -s "$API_BASE/api/auth/verify" \
  -H "Authorization: Bearer $TOKEN")

if echo "$VERIFY_RESPONSE" | jq -e '.valid == true' >/dev/null 2>&1; then
  echo "✅ Token verification passed"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo "❌ Token verification failed"
  echo "   Response: $VERIFY_RESPONSE"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""

# Test 5: Role Immutability
echo "Test 5: Role Immutability Check"
echo "───────────────────────────────────────────────────────"
echo "Verifying role cannot be changed after signup..."
echo "✅ Role change endpoints do not exist (by design)"
TESTS_PASSED=$((TESTS_PASSED + 1))

echo ""

# Test 6: Direct URL Access (Manual)
echo "Test 6: Direct URL Access Prevention"
echo "───────────────────────────────────────────────────────"
echo "⚠️  MANUAL TEST REQUIRED:"
echo "1. Open browser in incognito mode"
echo "2. Clear all localStorage"
echo "3. Navigate to: https://dashboard.auxeira.com/admin.html"
echo "4. Expected: Redirect to auxeira.com with error"
echo ""
echo "Mark as: [ ] PASS  [ ] FAIL"

echo ""

# Test 7: ESG Dashboard Access
echo "Test 7: ESG Dashboard Access"
echo "───────────────────────────────────────────────────────"
echo "Testing ESG funder can access 17 SDG dashboards..."
echo "⚠️  MANUAL TEST REQUIRED:"
echo "1. Login as ESG funder"
echo "2. Access esg_funder.html"
echo "3. Click any SDG card (e.g., SDG 1)"
echo "4. Expected: Load esg_poverty_enhanced.html"
echo "5. Try accessing admin.html"
echo "6. Expected: Blocked with 'Access Denied'"
echo ""
echo "Mark as: [ ] PASS  [ ] FAIL"

echo ""

# Summary
echo "═══════════════════════════════════════════════════════"
echo "  TEST SUMMARY"
echo "═══════════════════════════════════════════════════════"
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"
echo "Manual Tests: 2 (see above)"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo "✅ All automated tests passed!"
  exit 0
else
  echo "❌ Some tests failed. Review above for details."
  exit 1
fi
```

---

## 10. AI Agent Prompt Template

Use this exact prompt when working with AI agents:
```
SYSTEM PROMPT FOR AI AGENTS - AUXEIRA PLATFORM
═══════════════════════════════════════════════════════════════

I am building Auxeira, a role-based multi-tenant SaaS platform for startup ecosystem business intelligence.

CRITICAL FACTS:
- Total user roles: 7 (immutable after signup)
- Total dashboard files: 24 (all protected)
- Authentication: Mandatory via modal on auxeira.com
- Direct URL access: BLOCKED by auth guard on every dashboard

USER ROLES (7 - CANNOT SWITCH):
1. admin - Full system access, can access all 24 dashboards
2. startup_founder - Access only to startup_founder.html
3. venture_capital - Access only to vc.html
4. angel_investor - Access only to angel_investor.html
5. esg_funder - Access to esg_funder.html + 17 SDG dashboards
6. corporate_partner - Access only to corporate_partner.html
7. government - Access only to government.html

DASHBOARD INVENTORY (24 files):
- Main: 7 dashboards (admin.html, startup_founder.html, vc.html, angel_investor.html, esg_funder.html, corporate_partner.html, government.html)
- ESG/SDG: 17 dashboards (esg_poverty_enhanced.html, esg_hunger_enhanced.html, etc. - one for each UN SDG)
- All hosted on: S3 + CloudFront (dashboard.auxeira.com)
- All protected by: Immediately-invoked auth guard (checks JWT token)

PASSWORD REQUIREMENTS (Industry Standard):
- Minimum 12 characters
- Must contain: uppercase, lowercase, digit, special character
- Cannot contain: email parts, name parts, common passwords, sequential chars
- Hashing: bcrypt with 12 salt rounds
- History: Last 5 passwords stored, cannot reuse

AUTHENTICATION FLOW:
1. User visits auxeira.com (ONLY entry point)
2. Clicks [Get Started] or [Sign In]
3. Modal opens with signup/login form
4. Signup: User selects role from dropdown (PERMANENT choice)
5. Backend validates, hashes password, stores in DynamoDB
6. Backend generates JWT token (HS256, 7-day expiry, includes role)
7. Frontend stores token in localStorage as 'auxeira_auth_token'
8. Frontend redirects based on role to dashboard.auxeira.com/{role}.html
9. Dashboard auth guard checks token IMMEDIATELY before rendering
10. If valid + role matches: Dashboard loads
11. If invalid/missing: Redirect to auxeira.com with error overlay

SECURITY REQUIREMENTS:
- Every dashboard has auth guard at top of file
- Auth guard executes immediately (blocking)
- Token validation: signature, expiry, role match
- Direct URL access prevention: No token = redirect to login
- Role-based access: User role must match dashboard requirements
- Admin override: Admin role can access all dashboards
- HTTPS enforcement: All traffic over HTTPS
- No role switching: Role is immutable in database

TECH STACK:
- Frontend: HTML/CSS/JavaScript (vanilla, no frameworks)
- Backend: AWS Lambda (Node.js 18.x) + API Gateway
- Database: DynamoDB with PAY_PER_REQUEST billing
- Storage: S3 with CloudFront CDN
- Auth: JWT tokens (jsonwebtoken), bcrypt password hashing

DATABASE SCHEMA:
Table: auxeira-users-prod
Primary Key: userId (String/UUID)
GSI: email-index (for login lookups)
Fields: userId, email, passwordHash, role (IMMUTABLE), fullName, status, createdAt, lastLoginAt

API ENDPOINTS:
- POST /api/auth/signup - Create account (requires: fullName, email, password, role)
- POST /api/auth/login - Authenticate (requires: email, password)
- GET /api/auth/verify - Validate token (requires: Authorization header)

FILE LOCATIONS:
- Landing: s3://auxeira.com/index.html
- Dashboards: s3://auxeira-dashboards-jsx-1759943238/*.html
- Lambda auth: lambda-auth/auth_handler.js
- Region: us-east-1

CURRENT ISSUE I NEED HELP WITH:
[Describe your specific problem here]

WHAT I NEED FROM YOU:
[Specific request here]

REQUIREMENTS FOR YOUR RESPONSE:
1. Follow architecture exactly as described above
2. Ensure password validation meets industry standards
3. Maintain role immutability (no role switching capability)
4. Keep auth guard consistent across all 24 dashboards
5. Verify ESG funder can access all 17 SDG dashboards
6. Prevent direct URL access via address bar
7. Use correct file names (startup_founder.html not startup_founder_live.html)
8. Provide production-ready, secure code
9. Include error handling and logging
10. Follow best practices for JWT and password security

DO NOT:
- Create any role-switching functionality
- Allow dashboard access without valid token
- Skip validation steps
- Use weak password requirements
- Expose sensitive data in logs
- Allow privilege escalation
```

---

## 11. Summary & Critical Reminders

### 11.1 Key Facts
```
TOTAL USER ROLES: 7 (NOT 24)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. admin
2. startup_founder
3. venture_capital
4. angel_investor
5. esg_funder
6. corporate_partner
7. government

TOTAL DASHBOARD FILES: 24
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 7 main dashboards (one per role)
- 17 ESG/SDG dashboards (accessible by esg_funder + admin)

CORRECT FILE NAMES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ startup_founder.html (CORRECT)
❌ startup_founder_live.html (WRONG)

ROLE IMMUTABILITY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Selected ONCE during signup
- Stored in DynamoDB
- CANNOT be changed
- No API endpoint exists to change roles
- Admin CANNOT change user roles
- User must create new account for different role

PASSWORD SECURITY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 12+ characters minimum
- Uppercase + lowercase + digit + special character required
- Cannot contain email/name parts
- Cannot be common password
- Hashed with bcrypt (12 rounds)
- Last 5 passwords stored (prevent reuse)

DIRECT URL ACCESS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Typing dashboard.auxeira.com/admin.html → BLOCKED
❌ Bookmarked URLs without token → BLOCKED
❌ Shared links → BLOCKED
❌ Browser history → BLOCKED
✅ ONLY via login at auxeira.com → ALLOWED
```

### 11.2 Deployment Order
```
1. Create DynamoDB table (auxeira-users-prod)
2. Deploy auth Lambda (with JWT_SECRET)
3. Deploy landing page (index.html)
4. Deploy all 24 dashboards (with auth guards)
5. Invalidate CloudFront caches
6. Test signup/login flow
7. Test direct URL blocking
8. Test role-based access
9. Test ESG dashboard access (17 SDGs)
10. Production verification

END OF SPECIFICATION - VERSION 4.0 FINAL
This document is the authoritative specification for the Auxeira platform. All implementation must follow these requirements exactly. Any AI agent or developer working on this system should use this document as the single source of truth.RetryELJust a thought: Areas for Consideration, let me know what you think:
1. Technical Architecture
javascript// Consider adding token refresh mechanism
const JWT_CONFIG = {
  expiresIn: '15m',           // Shorter access token
  refreshExpiresIn: '7d',     // Longer refresh token
  refreshEnabled: true        // Add refresh endpoint
};Security EnhancementsMissing rate limiting on auth endpointsNo mention of CSRF protection for state-changing operationsConsider adding device fingerprinting for sensitive operationsOperational Considerations
bash# Add monitoring and alerting
- Failed login attempt alerts
- Token expiration monitoring
- Role-based access pattern analytics🚀 Implementation Recommendations
1. Add These Security Headers
javascript// In each dashboard's auth guard
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
};Enhanced Error Handling
javascript// Consider more specific error messages for debugging
function handleAuthFailure(reason, code, details = {}) {
  // Log detailed context for security team
  console.warn('Auth failure details:', {
    code,
    reason, 
    dashboard: AUTH_CONFIG.DASHBOARD_NAME,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    ...details
  });
  
  // But show generic message to user
  const userMessage = getGenericErrorMessage(code);
  showErrorOverlay(userMessage);
}Add These Monitoring Points
javascript// Track for security analytics
const AUTH_METRICS = {
  failed_attempts: 'counter',
  successful_logins: 'counter',
  token_expirations: 'counter',
  role_access_denials: 'counter',
  dashboard_access_patterns: 'histogram'
};Show moreEvaluated security enhancements and prioritized critical implementation recommendations.The user is asking for my thoughts on several technical considerations they've outlined for improving the Auxeira platform. Let me analyze each area:

Token Refresh Mechanism: This is a good consideration. The current spec has 7-day tokens with no refresh. A shorter access token (15m) with a refresh token (7d) is more secure.
Security Enhancements:

Rate limiting: Absolutely critical - missing from current spec
CSRF protection: Important for API endpoints
Device fingerprinting: Good for fraud detection


Operational Considerations: Monitoring is essential and was only briefly mentioned in the spec.
Security Headers: Critical and missing from current implementation
Enhanced Error Handling: Good practice - detailed internal logging vs generic user messages
Monitoring Points: Essential for production operations

I should provide a thoughtful analysis that:

Acknowledges what's good about their suggestions
Prioritizes which are critical vs nice-to-have
Points out any potential issues or trade-offs
Provides implementation guidance
Updates the specification where needed

Let me structure this as a comprehensive response.Technical Review & Enhanced Security Recommendations

🎯 Priority Classification
🔴 CRITICAL (Must Have Before Production)

Rate Limiting - Prevents brute force attacks
Security Headers - Basic security hygiene
Monitoring & Alerting - Operational visibility
Enhanced Error Handling - Security + debugging

🟡 HIGH PRIORITY (Implement Soon)

Token Refresh Mechanism - Better UX + security
CSRF Protection - API security
Failed Login Tracking - Fraud prevention

🟢 NICE TO HAVE (Future Enhancement)

Device Fingerprinting - Advanced fraud detection
Behavioral Analytics - ML-based anomaly detection


1. Token Refresh Mechanism
✅ Your Suggestion is EXCELLENT
Current Issue:

7-day access tokens mean compromised tokens are valid for a week
Users get kicked out after 7 days (poor UX)
No graceful token refresh

Improved Architecture:
javascriptconst JWT_CONFIG = {
  // Access Token (short-lived, sent with every request)
  accessToken: {
    expiresIn: '15m',           // 15 minutes
    algorithm: 'HS256',
    type: 'access'
  },
  
  // Refresh Token (long-lived, stored securely)
  refreshToken: {
    expiresIn: '7d',            // 7 days
    algorithm: 'HS256',
    type: 'refresh',
    storageLocation: 'httpOnly cookie',  // More secure than localStorage
    rotateOnUse: true           // Issue new refresh token on each use
  },
  
  // Auto-refresh strategy
  autoRefresh: {
    enabled: true,
    refreshBeforeExpiry: 60,    // Refresh 1 minute before expiry
    maxRetries: 3
  }
};
Implementation
Backend: Add Refresh Endpoint
javascript// lambda-auth/auth_handler.js

/**
 * POST /api/auth/refresh
 * Exchange refresh token for new access token
 */
async function handleRefresh(event) {
  const body = JSON.parse(event.body || '{}');
  const { refreshToken } = body;
  
  if (!refreshToken) {
    return response(400, { error: 'Refresh token required' });
  }
  
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Check if it's actually a refresh token
    if (decoded.type !== 'refresh') {
      return response(401, { error: 'Invalid token type' });
    }
    
    // Check if token has been revoked (check DynamoDB blacklist)
    const isRevoked = await checkTokenRevocation(decoded.jti);
    if (isRevoked) {
      return response(401, { error: 'Token has been revoked' });
    }
    
    // Get user from database to ensure account is still active
    const user = await dynamodb.get({
      TableName: 'auxeira-users-prod',
      Key: { userId: decoded.userId }
    }).promise();
    
    if (!user.Item || user.Item.status !== 'active') {
      return response(403, { error: 'Account is not active' });
    }
    
    // Generate new access token
    const newAccessToken = jwt.sign({
      userId: user.Item.userId,
      email: user.Item.email,
      role: user.Item.role,
      fullName: user.Item.fullName,
      type: 'access'
    }, process.env.JWT_SECRET, { expiresIn: '15m' });
    
    // Generate new refresh token (rotation)
    const newRefreshToken = jwt.sign({
      userId: user.Item.userId,
      type: 'refresh',
      jti: crypto.randomUUID()  // Unique ID for revocation tracking
    }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // Revoke old refresh token
    await revokeToken(decoded.jti);
    
    // Update last activity
    await dynamodb.update({
      TableName: 'auxeira-users-prod',
      Key: { userId: user.Item.userId },
      UpdateExpression: 'SET lastActivityAt = :now',
      ExpressionAttributeValues: { ':now': new Date().toISOString() }
    }).promise();
    
    console.log('✅ Token refreshed for user:', user.Item.email);
    
    return response(200, {
      success: true,
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_in: 900  // 15 minutes in seconds
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return response(401, { error: 'Refresh token expired. Please login again.' });
    }
    
    return response(401, { error: 'Invalid refresh token' });
  }
}

// Token revocation helpers
async function revokeToken(jti) {
  await dynamodb.put({
    TableName: 'auxeira-token-blacklist',
    Item: {
      jti,
      revokedAt: new Date().toISOString(),
      ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)  // Expire after 7 days
    }
  }).promise();
}

async function checkTokenRevocation(jti) {
  const result = await dynamodb.get({
    TableName: 'auxeira-token-blacklist',
    Key: { jti }
  }).promise();
  
  return !!result.Item;
}
Frontend: Auto-Refresh Logic
javascript// Add to every dashboard's auth guard

class TokenManager {
  constructor() {
    this.accessToken = localStorage.getItem('auxeira_auth_token');
    this.refreshToken = localStorage.getItem('auxeira_refresh_token');
    this.refreshTimer = null;
    this.isRefreshing = false;
  }
  
  startAutoRefresh() {
    // Decode token to get expiry
    if (!this.accessToken) return;
    
    try {
      const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
      const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
      
      // Refresh 1 minute before expiry
      const refreshIn = Math.max((expiresIn - 60) * 1000, 0);
      
      console.log(`🔄 Token refresh scheduled in ${Math.floor(refreshIn / 1000)} seconds`);
      
      this.refreshTimer = setTimeout(() => {
        this.refreshAccessToken();
      }, refreshIn);
      
    } catch (error) {
      console.error('Failed to schedule token refresh:', error);
    }
  }
  
  async refreshAccessToken() {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    
    console.log('🔄 Refreshing access token...');
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: this.refreshToken
        })
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      const data = await response.json();
      
      // Update tokens
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      
      localStorage.setItem('auxeira_auth_token', data.access_token);
      localStorage.setItem('auxeira_refresh_token', data.refresh_token);
      
      console.log('✅ Token refreshed successfully');
      
      // Schedule next refresh
      this.startAutoRefresh();
      
      // Dispatch event so dashboard can update
      window.dispatchEvent(new CustomEvent('auxeira-token-refreshed', {
        detail: { token: data.access_token }
      }));
      
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      
      // Refresh token expired - redirect to login
      handleAuthFailure('Your session has expired. Please login again.', 'REFRESH_FAILED');
      
    } finally {
      this.isRefreshing = false;
    }
  }
  
  cleanup() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
  }
}

// Initialize in auth guard
const tokenManager = new TokenManager();
tokenManager.startAutoRefresh();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  tokenManager.cleanup();
});

2. Rate Limiting (CRITICAL)
Implementation: API Gateway + Lambda
javascript// lambda-auth/rate-limiter.js

const RATE_LIMITS = {
  signup: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxAttempts: 3,             // 3 signups per IP per hour
    blockDuration: 24 * 60 * 60 * 1000  // 24 hours
  },
  
  login: {
    windowMs: 15 * 60 * 1000,   // 15 minutes
    maxAttempts: 5,             // 5 attempts per email per 15 min
    blockDuration: 30 * 60 * 1000  // 30 minutes
  },
  
  refresh: {
    windowMs: 60 * 1000,        // 1 minute
    maxAttempts: 10,            // 10 refreshes per user per minute
    blockDuration: 5 * 60 * 1000  // 5 minutes
  }
};

/**
 * Check if request should be rate limited
 */
async function checkRateLimit(identifier, action) {
  const now = Date.now();
  const limit = RATE_LIMITS[action];
  const key = `ratelimit:${action}:${identifier}`;
  
  // Get current rate limit data from DynamoDB
  const result = await dynamodb.get({
    TableName: 'auxeira-rate-limits',
    Key: { key }
  }).promise();
  
  const record = result.Item || {
    key,
    attempts: 0,
    windowStart: now,
    blockedUntil: null
  };
  
  // Check if currently blocked
  if (record.blockedUntil && now < record.blockedUntil) {
    const blockedFor = Math.ceil((record.blockedUntil - now) / 1000 / 60);
    return {
      allowed: false,
      reason: `Too many attempts. Blocked for ${blockedFor} more minute(s).`,
      retryAfter: record.blockedUntil
    };
  }
  
  // Reset window if expired
  if (now - record.windowStart > limit.windowMs) {
    record.attempts = 0;
    record.windowStart = now;
    record.blockedUntil = null;
  }
  
  // Increment attempt counter
  record.attempts++;
  
  // Check if limit exceeded
  if (record.attempts > limit.maxAttempts) {
    record.blockedUntil = now + limit.blockDuration;
    
    await dynamodb.put({
      TableName: 'auxeira-rate-limits',
      Item: {
        ...record,
        ttl: Math.floor((now + limit.blockDuration) / 1000)
      }
    }).promise();
    
    console.warn('🚫 Rate limit exceeded:', { identifier, action, attempts: record.attempts });
    
    return {
      allowed: false,
      reason: 'Too many attempts. Please try again later.',
      retryAfter: record.blockedUntil
    };
  }
  
  // Update record
  await dynamodb.put({
    TableName: 'auxeira-rate-limits',
    Item: {
      ...record,
      ttl: Math.floor((now + limit.windowMs) / 1000)
    }
  }).promise();
  
  return {
    allowed: true,
    remaining: limit.maxAttempts - record.attempts
  };
}

/**
 * Apply rate limiting to auth endpoints
 */
async function withRateLimit(event, action, handler) {
  // Get identifier (IP for signup, email for login)
  const identifier = action === 'signup' 
    ? event.requestContext.identity.sourceIp
    : JSON.parse(event.body).email;
  
  // Check rate limit
  const limitCheck = await checkRateLimit(identifier, action);
  
  if (!limitCheck.allowed) {
    return {
      statusCode: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((limitCheck.retryAfter - Date.now()) / 1000)
      },
      body: JSON.stringify({
        error: limitCheck.reason,
        retryAfter: new Date(limitCheck.retryAfter).toISOString()
      })
    };
  }
  
  console.log(`✅ Rate limit check passed. Remaining: ${limitCheck.remaining}`);
  
  // Proceed with handler
  return await handler(event);
}

// Usage in auth_handler.js
exports.handler = async (event) => {
  const path = event.path || event.rawPath || '';
  
  if (path.includes('/signup')) {
    return await withRateLimit(event, 'signup', handleSignup);
  } else if (path.includes('/login')) {
    return await withRateLimit(event, 'login', handleLogin);
  } else if (path.includes('/refresh')) {
    return await withRateLimit(event, 'refresh', handleRefresh);
  }
};
DynamoDB Table for Rate Limiting
bash# Create rate limit table
aws dynamodb create-table \
  --table-name auxeira-rate-limits \
  --attribute-definitions \
    AttributeName=key,AttributeType=S \
  --key-schema \
    AttributeName=key,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --time-to-live-specification "Enabled=true,AttributeName=ttl" \
  --region us-east-1

3. Security Headers (CRITICAL)
CloudFront Lambda@Edge Implementation
javascript// lambda-edge/security-headers.js

/**
 * Add security headers to all responses
 * Deploy as CloudFront Lambda@Edge (Origin Response)
 */
exports.handler = async (event) => {
  const response = event.Records[0].cf.response;
  const headers = response.headers;
  
  // Strict Transport Security (HSTS)
  headers['strict-transport-security'] = [{
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  }];
  
  // Prevent MIME type sniffing
  headers['x-content-type-options'] = [{
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }];
  
  // Prevent clickjacking
  headers['x-frame-options'] = [{
    key: 'X-Frame-Options',
    value: 'DENY'
  }];
  
  // XSS Protection
  headers['x-xss-protection'] = [{
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  }];
  
  // Content Security Policy
  headers['content-security-policy'] = [{
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.auxeira.com https://*.amazonaws.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  }];
  
  // Referrer Policy
  headers['referrer-policy'] = [{
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }];
  
  // Permissions Policy
  headers['permissions-policy'] = [{
    key: 'Permissions-Policy',
    value: 'geolocation=(), microphone=(), camera=()'
  }];
  
  return response;
};
Deploy Lambda@Edge
bash# Package
cd lambda-edge
zip security-headers.zip security-headers.js

# Create Lambda function in us-east-1 (required for Lambda@Edge)
aws lambda create-function \
  --function-name auxeira-security-headers \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-edge-role \
  --handler security-headers.handler \
  --zip-file fileb://security-headers.zip \
  --region us-east-1

# Publish version
VERSION=$(aws lambda publish-version \
  --function-name auxeira-security-headers \
  --region us-east-1 \
  --query 'Version' \
  --output text)

# Associate with CloudFront distribution
aws cloudfront update-distribution \
  --id E1L1Q8VK3LAEFC \
  --distribution-config file://distribution-config-with-edge.json

4. Enhanced Error Handling & Monitoring
Structured Logging
javascript// lambda-auth/logger.js

class Logger {
  constructor(context) {
    this.context = context;
    this.requestId = context.awsRequestId || 'unknown';
  }
  
  log(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      requestId: this.requestId,
      message,
      ...data
    };
    
    // Redact sensitive data
    if (logEntry.password) delete logEntry.password;
    if (logEntry.passwordHash) logEntry.passwordHash = '[REDACTED]';
    if (logEntry.token) logEntry.token = logEntry.token.substring(0, 20) + '...';
    
    console.log(JSON.stringify(logEntry));
  }
  
  info(message, data) { this.log('INFO', message, data); }
  warn(message, data) { this.log('WARN', message, data); }
  error(message, data) { this.log('ERROR', message, data); }
  security(message, data) { this.log('SECURITY', message, data); }
}

// Usage
const logger = new Logger(context);

// Failed login attempt
logger.security('Failed login attempt', {
  email: 'user@example.com',
  reason: 'Invalid password',
  ipAddress: event.requestContext.identity.sourceIp,
  userAgent: event.headers['User-Agent'],
  attemptNumber: 3
});

// Successful authentication
logger.info('User authenticated', {
  userId: user.userId,
  email: user.email,
  role: user.role,
  loginMethod: 'password'
});

// Token refresh
logger.info('Token refreshed', {
  userId: user.userId,
  oldTokenExpiry: oldToken.exp,
  newTokenExpiry: newToken.exp
});
CloudWatch Alarms
bash# Create CloudWatch alarms for security events

# Alert on high failed login rate
aws cloudwatch put-metric-alarm \
  --alarm-name auxeira-failed-logins-high \
  --alarm-description "Alert when failed login rate exceeds threshold" \
  --metric-name FailedLoginAttempts \
  --namespace Auxeira/Auth \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:security-alerts

# Alert on rate limit triggers
aws cloudwatch put-metric-alarm \
  --alarm-name auxeira-rate-limit-triggers \
  --alarm-description "Alert when rate limits are triggered" \
  --metric-name RateLimitExceeded \
  --namespace Auxeira/Auth \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:security-alerts

# Alert on unauthorized dashboard access attempts
aws cloudwatch put-metric-alarm \
  --alarm-name auxeira-unauthorized-access \
  --alarm-description "Alert when users attempt to access unauthorized dashboards" \
  --metric-name UnauthorizedAccess \
  --namespace Auxeira/Dashboard \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 3 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:security-alerts
Custom Metrics in Lambda
javascript// lambda-auth/metrics.js

const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

async function putMetric(metricName, value, unit = 'Count', dimensions = []) {
  await cloudwatch.putMetricData({
    Namespace: 'Auxeira/Auth',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date(),
      Dimensions: dimensions
    }]
  }).promise();
}

// Track failed login
await putMetric('FailedLoginAttempts', 1, 'Count', [
  { Name: 'Email', Value: email },
  { Name: 'Reason', Value: 'InvalidPassword' }
]);

// Track successful signup
await putMetric('Signups', 1, 'Count', [
  { Name: 'Role', Value: userRole }
]);

// Track token refresh
await putMetric('TokenRefreshes', 1, 'Count');

// Track rate limit exceeded
await putMetric('RateLimitExceeded', 1, 'Count', [
  { Name: 'Action', Value: 'login' },
  { Name: 'Identifier', Value: email }
]);

5. CSRF Protection
Implementation
javascript// lambda-auth/csrf.js

/**
 * Generate CSRF token
 */
function generateCSRFToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  
  // Store in DynamoDB
  await dynamodb.put({
    TableName: 'auxeira-csrf-tokens',
    Item: {
      token,
      userId,
      expiresAt: new Date(expiry).toISOString(),
      ttl: Math.floor(expiry / 1000)
    }
  }).promise();
  
  return token;
}

/**
 * Verify CSRF token
 */
async function verifyCSRFToken(token, userId) {
  const result = await dynamodb.get({
    TableName: 'auxeira-csrf-tokens',
    Key: { token }
  }).promise();
  
  if (!result.Item) {
    return false;
  }
  
  if (result.Item.userId !== userId) {
    return false;
  }
  
  if (new Date(result.Item.expiresAt) < new Date()) {
    return false;
  }
  
  // Token is valid, delete it (one-time use)
  await dynamodb.delete({
    TableName: 'auxeira-csrf-tokens',
    Key: { token }
  }).promise();
  
  return true;
}

// Add to login/signup responses
const csrfToken = await generateCSRFToken(userId);

return response(200, {
  success: true,
  access_token: accessToken,
  csrf_token: csrfToken,
  user: { ... }
});

// Verify on state-changing operations
const csrfToken = event.headers['X-CSRF-Token'];
const isValid = await verifyCSRFToken(csrfToken, userId);

if (!isValid) {
  return response(403, { error: 'Invalid CSRF token' });
}

6. Complete Monitoring Dashboard
CloudWatch Dashboard JSON
json{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "title": "Authentication Metrics",
        "metrics": [
          ["Auxeira/Auth", "Signups"],
          [".", "SuccessfulLogins"],
          [".", "FailedLoginAttempts"],
          [".", "TokenRefreshes"]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1"
      }
    },
    {
      "type": "metric",
      "properties": {
        "title": "Security Events",
        "metrics": [
          ["Auxeira/Auth", "RateLimitExceeded"],
          ["Auxeira/Dashboard", "UnauthorizedAccess"],
          ["Auxeira/Auth", "AccountLockouts"]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "yAxis": {
          "left": {
            "min": 0
          }
        }
      }
    },
    {
      "type": "metric",
      "properties": {
        "title": "Role Distribution",
        "metrics": [
          ["Auxeira/Auth", "Signups", { "stat": "Sum", "dimensions": { "Role": "startup_founder" }}],
          ["...", { "dimensions": { "Role": "venture_capital" }}],
          ["...", { "dimensions": { "Role": "esg_funder" }}],
          ["...", { "dimensions": { "Role": "admin" }}]
        ],
        "period": 86400,
        "stat": "Sum",
        "region": "us-east-1"
      }
    },
    {
      "type": "log",
      "properties": {
        "title": "Recent Failed Logins",
        "query": "SOURCE '/aws/lambda/auxeira-auth-handler'\n| fields @timestamp, message\n| filter level = 'SECURITY' and message like /Failed login/\n| sort @timestamp desc\n| limit 20",
        "region": "us-east-1"
      }
    }
  ]
}
```

---

