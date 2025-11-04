Auxeira Multi-Tenant Dashboard - Simplified Auth Flow
Updated: November 3, 2025
Flow: Sign-up with user type → Auto-redirect to dashboard → User type locked

Simplified Authentication Flow
User Journey
1. FIRST TIME (Sign Up)
   auxeira.com
      ↓
   Click "Get Started"
      ↓
   Sign Up Modal Opens
      ├─ Enter: Email
      ├─ Enter: Password
      └─ Select: User Type (ONE TIME ONLY)
      ↓
   POST /auth/signup
      ↓
   Account Created
      ↓
   JWT Token Generated
      ↓
   Auto-redirect to: dashboard.auxeira.com/{userType}.html
      └─ startup_founder    → /startup_founder.html
      └─ venture_capital    → /venture_capital.html
      └─ angel_investor     → /angel_investor.html
      └─ esg_funder         → /esg_funder.html
      └─ corporate_partner  → /corporate_partner.html
      └─ government         → /government.html
      └─ admin              → /admin/dashboard.html

2. RETURNING USER (Login)
   auxeira.com
      ↓
   Click "Sign In"
      ↓
   Login Modal Opens
      ├─ Enter: Email
      └─ Enter: Password (NO user type selection)
      ↓
   POST /auth/login
      ↓
   Verify credentials
      ↓
   Get userType from database
      ↓
   JWT Token Generated
      ↓
   Auto-redirect to: dashboard.auxeira.com/{userType}.html
Key Points

✅ User type selected ONCE during signup
✅ Stored permanently in database
✅ No user type dropdown on login
✅ Auto-redirect based on stored userType
✅ Immutable - user can't change their type


Updated Frontend Implementation
Sign Up Modal (auxeira.com/index.html)
html<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Auxeira - Startup Ecosystem Analysis</title>
    <style>
        /* Modal styles */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        
        .modal-content {
            background: #fff;
            margin: 5% auto;
            padding: 40px;
            border-radius: 12px;
            width: 450px;
            max-width: 90%;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #333;
        }
        
        .form-group input,
        .form-group select {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 15px;
        }
        
        .btn-primary {
            width: 100%;
            padding: 14px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
        }
        
        .btn-primary:hover {
            background: #45a049;
        }
        
        .toggle-mode {
            text-align: center;
            margin-top: 20px;
            color: #666;
        }
        
        .toggle-mode a {
            color: #4CAF50;
            text-decoration: none;
            font-weight: 500;
        }
        
        .error-message {
            background: #fee;
            color: #c33;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: none;
        }
        
        .user-type-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-top: 10px;
        }
        
        .user-type-option {
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 8px;
            cursor: pointer;
            text-align: center;
            transition: all 0.2s;
        }
        
        .user-type-option:hover {
            border-color: #4CAF50;
            background: #f0f8f0;
        }
        
        .user-type-option.selected {
            border-color: #4CAF50;
            background: #4CAF50;
            color: white;
        }
        
        .user-type-option input[type="radio"] {
            display: none;
        }
    </style>
</head>
<body>
    <!-- Marketing Page -->
    <header>
        <nav>
            <div class="logo">Auxeira</div>
            <div class="nav-buttons">
                <button id="loginBtn" class="btn-secondary">Sign In</button>
                <button id="getStartedBtn" class="btn-primary">Get Started</button>
            </div>
        </nav>
    </header>
    
    <main>
        <!-- Your marketing content -->
    </main>
    
    <!-- Auth Modal -->
    <div id="authModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modalTitle">Get Started</h2>
                <span class="close">&times;</span>
            </div>
            
            <div id="errorMessage" class="error-message"></div>
            
            <!-- SIGN UP FORM -->
            <form id="signupForm" style="display: block;">
                <div class="form-group">
                    <label for="signupName">Full Name</label>
                    <input type="text" id="signupName" placeholder="John Doe" required>
                </div>
                
                <div class="form-group">
                    <label for="signupEmail">Email</label>
                    <input type="email" id="signupEmail" placeholder="your@email.com" required>
                </div>
                
                <div class="form-group">
                    <label for="signupPassword">Password</label>
                    <input type="password" id="signupPassword" placeholder="••••••••" required>
                </div>
                
                <div class="form-group">
                    <label>I am a...</label>
                    <div class="user-type-grid">
                        <label class="user-type-option">
                            <input type="radio" name="userType" value="startup_founder" required>
                            <div>🚀 Startup Founder</div>
                        </label>
                        <label class="user-type-option">
                            <input type="radio" name="userType" value="venture_capital">
                            <div>💼 VC Firm</div>
                        </label>
                        <label class="user-type-option">
                            <input type="radio" name="userType" value="angel_investor">
                            <div>👼 Angel Investor</div>
                        </label>
                        <label class="user-type-option">
                            <input type="radio" name="userType" value="esg_funder">
                            <div>🌱 ESG Funder</div>
                        </label>
                        <label class="user-type-option">
                            <input type="radio" name="userType" value="corporate_partner">
                            <div>🏢 Corporate</div>
                        </label>
                        <label class="user-type-option">
                            <input type="radio" name="userType" value="government">
                            <div>🏛️ Government</div>
                        </label>
                    </div>
                </div>
                
                <button type="submit" class="btn-primary">Create Account</button>
                
                <p class="toggle-mode">
                    Already have an account? <a href="#" id="showLogin">Sign In</a>
                </p>
            </form>
            
            <!-- LOGIN FORM -->
            <form id="loginForm" style="display: none;">
                <div class="form-group">
                    <label for="loginEmail">Email</label>
                    <input type="email" id="loginEmail" placeholder="your@email.com" required>
                </div>
                
                <div class="form-group">
                    <label for="loginPassword">Password</label>
                    <input type="password" id="loginPassword" placeholder="••••••••" required>
                </div>
                
                <button type="submit" class="btn-primary">Sign In</button>
                
                <p class="toggle-mode">
                    Don't have an account? <a href="#" id="showSignup">Get Started</a>
                </p>
            </form>
        </div>
    </div>

    <script>
        // Configuration
        const AUTH_API = 'YOUR_AUTH_LAMBDA_URL'; // From deployment
        
        // Elements
        const modal = document.getElementById('authModal');
        const loginBtn = document.getElementById('loginBtn');
        const getStartedBtn = document.getElementById('getStartedBtn');
        const closeBtn = document.querySelector('.close');
        const signupForm = document.getElementById('signupForm');
        const loginForm = document.getElementById('loginForm');
        const showLogin = document.getElementById('showLogin');
        const showSignup = document.getElementById('showSignup');
        const modalTitle = document.getElementById('modalTitle');
        const errorMessage = document.getElementById('errorMessage');
        
        // User type selection
        document.querySelectorAll('.user-type-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.user-type-option').forEach(o => 
                    o.classList.remove('selected')
                );
                this.classList.add('selected');
                this.querySelector('input[type="radio"]').checked = true;
            });
        });
        
        // Open modals
        getStartedBtn.onclick = () => {
            modal.style.display = 'block';
            signupForm.style.display = 'block';
            loginForm.style.display = 'none';
            modalTitle.textContent = 'Get Started';
            hideError();
        };
        
        loginBtn.onclick = () => {
            modal.style.display = 'block';
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
            modalTitle.textContent = 'Sign In';
            hideError();
        };
        
        closeBtn.onclick = () => modal.style.display = 'none';
        
        window.onclick = (e) => {
            if (e.target == modal) modal.style.display = 'none';
        };
        
        // Toggle forms
        showLogin.onclick = (e) => {
            e.preventDefault();
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
            modalTitle.textContent = 'Sign In';
            hideError();
        };
        
        showSignup.onclick = (e) => {
            e.preventDefault();
            signupForm.style.display = 'block';
            loginForm.style.display = 'none';
            modalTitle.textContent = 'Get Started';
            hideError();
        };
        
        // Handle signup
        signupForm.onsubmit = async (e) => {
            e.preventDefault();
            hideError();
            
            const fullName = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const userType = document.querySelector('input[name="userType"]:checked')?.value;
            
            if (!userType) {
                showError('Please select a user type');
                return;
            }
            
            try {
                const response = await fetch(`${AUTH_API}/signup`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({fullName, email, password, userType})
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    // Store token and user info
                    localStorage.setItem('auxeira_auth_token', data.token);
                    localStorage.setItem('auxeira_user', JSON.stringify(data.user));
                    
                    // Redirect to dashboard
                    redirectToDashboard(data.user.userType);
                } else {
                    showError(data.error || 'Signup failed. Please try again.');
                }
            } catch (error) {
                console.error('Signup error:', error);
                showError('Connection error. Please try again.');
            }
        };
        
        // Handle login
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            hideError();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const response = await fetch(`${AUTH_API}/login`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({email, password})
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    // Store token and user info
                    localStorage.setItem('auxeira_auth_token', data.token);
                    localStorage.setItem('auxeira_user', JSON.stringify(data.user));
                    
                    // Redirect to dashboard (userType from database)
                    redirectToDashboard(data.user.userType);
                } else {
                    showError(data.error || 'Login failed. Please try again.');
                }
            } catch (error) {
                console.error('Login error:', error);
                showError('Connection error. Please try again.');
            }
        };
        
        // Redirect to appropriate dashboard
        function redirectToDashboard(userType) {
            const routes = {
                'startup_founder': '/startup_founder.html',
                'venture_capital': '/venture_capital.html',
                'angel_investor': '/angel_investor.html',
                'corporate_partner': '/corporate_partner.html',
                'government': '/government.html',
                'esg_funder': '/esg_funder.html',
                'impact_investor': '/impact_investor.html',
                'admin': '/admin/dashboard.html'
            };
            
            const route = routes[userType] || '/startup_founder.html';
            window.location.href = `https://dashboard.auxeira.com${route}`;
        }
        
        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }
        
        function hideError() {
            errorMessage.style.display = 'none';
        }
    </script>
</body>
</html>

Updated Lambda Functions
1. auth_handler.js (Simplified)
javascriptconst AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = 'auxeira-users-prod';
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
    console.log('Auth request:', JSON.stringify(event, null, 2));
    
    const path = event.path || event.rawPath || '';
    const body = event.body ? JSON.parse(event.body) : {};
    
    try {
        if (path.includes('/signup')) {
            return await handleSignup(body);
        } else if (path.includes('/login')) {
            return await handleLogin(body);
        }
        
        return response(404, {error: 'Not found'});
    } catch (error) {
        console.error('Auth error:', error);
        return response(500, {error: 'Internal server error'});
    }
};

async function handleSignup(body) {
    const {fullName, email, password, userType} = body;
    
    // Validation
    if (!fullName || !email || !password || !userType) {
        return response(400, {error: 'Missing required fields'});
    }
    
    if (password.length < 8) {
        return response(400, {error: 'Password must be at least 8 characters'});
    }
    
    const validUserTypes = [
        'startup_founder', 'venture_capital', 'angel_investor',
        'esg_funder', 'corporate_partner', 'government', 'impact_investor', 'admin'
    ];
    
    if (!validUserTypes.includes(userType)) {
        return response(400, {error: 'Invalid user type'});
    }
    
    // Check if email exists
    const existing = await dynamodb.query({
        TableName: USERS_TABLE,
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {':email': email.toLowerCase()}
    }).promise();
    
    if (existing.Items.length > 0) {
        return response(400, {error: 'Email already registered'});
    }
    
    // Create user
    const userId = require('crypto').randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    
    await dynamodb.put({
        TableName: USERS_TABLE,
        Item: {
            userId,
            email: email.toLowerCase(),
            passwordHash,
            userType,  // ← LOCKED FOREVER
            fullName,
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        }
    }).promise();
    
    console.log(`User created: ${email} as ${userType}`);
    
    // Generate JWT
    const token = jwt.sign({
        userId,
        email: email.toLowerCase(),
        userType,  // ← IN TOKEN
        fullName
    }, JWT_SECRET, {expiresIn: '7d'});
    
    return response(201, {
        success: true,
        token,
        user: {
            id: userId,
            email: email.toLowerCase(),
            userType,  // ← RETURNED TO CLIENT
            fullName
        }
    });
}

async function handleLogin(body) {
    const {email, password} = body;  // ← NO userType parameter!
    
    // Validation
    if (!email || !password) {
        return response(400, {error: 'Email and password required'});
    }
    
    // Get user by email
    const result = await dynamodb.query({
        TableName: USERS_TABLE,
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {':email': email.toLowerCase()}
    }).promise();
    
    if (result.Items.length === 0) {
        return response(401, {error: 'Invalid email or password'});
    }
    
    const user = result.Items[0];
    
    // Check status
    if (user.status !== 'active') {
        return response(403, {error: 'Account suspended or inactive'});
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
        return response(401, {error: 'Invalid email or password'});
    }
    
    // Update last login
    await dynamodb.update({
        TableName: USERS_TABLE,
        Key: {userId: user.userId},
        UpdateExpression: 'SET lastLogin = :now',
        ExpressionAttributeValues: {':now': new Date().toISOString()}
    }).promise();
    
    console.log(`User logged in: ${email} as ${user.userType}`);
    
    // Generate JWT with userType from database
    const token = jwt.sign({
        userId: user.userId,
        email: user.email,
        userType: user.userType,  // ← FROM DATABASE
        fullName: user.fullName
    }, JWT_SECRET, {expiresIn: '7d'});
    
    return response(200, {
        success: true,
        token,
        user: {
            id: user.userId,
            email: user.email,
            userType: user.userType,  // ← TELLS FRONTEND WHERE TO REDIRECT
            fullName: user.fullName
        }
    });
}

function response(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        body: JSON.stringify(body)
    };
}
Key Changes:

Signup: User selects type ONCE → stored in DB → included in JWT
Login: NO user type parameter → retrieved from DB → auto-redirect
User Type: Immutable field in database


Database Schema Update
auxeira-users-prod
javascript{
  userId: "abc-123",           // Primary Key
  email: "founder@test.com",   // GSI Key
  passwordHash: "$2b$10...",
  userType: "startup_founder", // ← IMMUTABLE (set once at signup)
  fullName: "John Doe",
  status: "active",
  createdAt: "2025-11-03T...",
  lastLogin: "2025-11-03T..."
}
```

**Global Secondary Index:**
```
IndexName: email-index
KeySchema: email (HASH)
Projection: ALL

Deployment Steps (Updated)
Quick Start
bash# 1. Create email GSI
aws dynamodb update-table \
  --table-name auxeira-users-prod \
  --attribute-definitions AttributeName=email,AttributeType=S \
  --global-secondary-index-updates \
    '[{"Create":{"IndexName":"email-index","KeySchema":[{"AttributeName":"email","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}}]'

# 2. Deploy auth Lambda
cd /home/ubuntu/auxeira-backend/lambda-auth
npm install bcryptjs jsonwebtoken
zip -r auth-deployment.zip .

aws lambda create-function \
  --function-name auxeira-auth-handler \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler auth_handler.handler \
  --zip-file fileb://auth-deployment.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables="{JWT_SECRET=$(openssl rand -base64 32)}"

# 3. Get Function URL
aws lambda create-function-url-config \
  --function-name auxeira-auth-handler \
  --auth-type NONE \
  --cors AllowOrigins="*",AllowMethods="*",AllowHeaders="*"

# Save the URL - you'll need it for frontend

# 4. Create test users
node create-test-users.js

# 5. Update index.html with AUTH_API URL
# Edit frontend/index.html: const AUTH_API = 'YOUR_LAMBDA_URL';

# 6. Deploy index.html
aws s3 cp frontend/index.html s3://auxeira.com/index.html
aws cloudfront create-invalidation --distribution-id E1O2Q0Z86U0U5T --paths "/index.html"

Testing Flow
Test Signup Flow
bash# 1. Sign up as startup founder
curl -X POST "YOUR_AUTH_LAMBDA_URL/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Founder",
    "email": "test@startup.com",
    "password": "Test1234!",
    "userType": "startup_founder"
  }'

# Response should include:
# - token (JWT)
# - user.userType = "startup_founder"
# Frontend will redirect to: /startup_founder.html
Test Login Flow
bash# 2. Login (NO userType needed)
curl -X POST "YOUR_AUTH_LAMBDA_URL/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@startup.com",
    "password": "Test1234!"
  }'

# Response includes:
# - user.userType = "startup_founder" (from DB)
# Frontend will redirect to: /startup_founder.html
Test in Browser

Visit https://auxeira.com
Click "Get Started"
Fill form:

Name: Test User
Email: new@test.com
Password: Test1234!
Select: 🚀 Startup Founder


Click "Create Account"
Should auto-redirect to: https://dashboard.auxeira.com/startup_founder.html
Logout and login again
Enter only email + password (no type selection)
Should auto-redirect to same dashboard


Summary
What's Different
Before (Complex):

❌ User selects type on both signup AND login
❌ User could theoretically change type
❌ More validation needed

After (Simplified):

✅ User selects type ONCE during signup
✅ Type stored permanently in database
✅ Login only needs email + password
✅ Auto-redirect based on stored type
✅ Cleaner, simpler flow

Implementation Checklist

 Create email GSI on auxeira-users-prod
 Deploy auth_handler Lambda
 Get Lambda Function URL
 Update frontend/index.html with AUTH_API
 Deploy updated index.html
 Create test users with passwords
 Test signup flow
 Test login flow
 Verify auto-redirect works

This is much cleaner! Want me to help with any specific step?RetryELMay you put together a comprehensive functional document with deployment instructions, database set-up so that a new developer can takeover.Architected comprehensive handoff document spanning deployment, infrastructure, and operational guidance.The user wants a comprehensive functional document with deployment instructions and database setup that a new developer can use to take over the project. This should be a complete, standalone document that covers:

Project overview and architecture
Current state and what's deployed
Database schema and setup
All Lambda functions with code
Frontend files and structure
Step-by-step deployment instructions
Testing procedures
Troubleshooting guide
API documentation
Security considerations
Cost estimates
Maintenance procedures

I need to make this extremely detailed and comprehensive so a new developer can pick up the project without needing to ask questions.Auxeira Multi-Tenant Dashboard Platform
Complete Developer Handoff Documentation
Version: 2.1
Date: November 3, 2025
Status: Phase 1 Complete, Phase 2 Ready for Deployment
Document Type: Developer Handoff

Table of Contents

Project Overview
System Architecture
Current Deployment Status
Database Schema
Lambda Functions
Frontend Applications
Infrastructure Setup
Deployment Procedures
Authentication Flow
API Documentation
Testing Guide
Monitoring & Maintenance
Security Considerations
Cost Analysis
Troubleshooting
Future Roadmap


1. Project Overview
1.1 Product Description
Auxeira is a multi-tenant SaaS platform that provides role-based dashboards for different stakeholders in the startup ecosystem. The platform integrates real-time data from DynamoDB to display metrics, insights, and analytics tailored to each user type.
1.2 User Types
User TypeDescriptionDashboard AccessStartup FounderEntrepreneurs building companiesMetrics: SSE score, MRR, CAC, LTV, runway, growthVenture CapitalVC firms investing in startupsPortfolio analytics, deal flow, ROI trackingAngel InvestorIndividual investorsInvestment portfolio, company performanceESG FunderImpact investors focused on SDGs17 SDG-specific dashboards, impact metricsCorporate PartnerCompanies partnering with startupsPartnership value, ROI, collaboration metricsGovernmentGovernment agenciesEcosystem health, policy impact, regional analyticsAdminPlatform administratorsUser management, system statistics, analytics
1.3 Key Features

Role-Based Access Control (RBAC): Users are automatically routed to dashboards based on their user type
Real-Time Data: All metrics calculated from live DynamoDB data
17 SDG Dashboards: Specialized dashboards for each UN Sustainable Development Goal
Intelligent Calculations: Industry-standard formulas for CAC, LTV, churn rate, NPS, etc.
Activity Tracking: User actions tracked and used for insights
Immutable User Types: User type selected once during signup and cannot be changed

1.4 Technology Stack
Frontend:

HTML5, CSS3, JavaScript (Vanilla)
No frameworks (for simplicity and performance)
Hosted on Amazon S3
Distributed via Amazon CloudFront

Backend:

AWS Lambda (Node.js 18.x)
Amazon DynamoDB (NoSQL database)
Lambda Function URLs (for API access)

Infrastructure:

AWS S3 (static hosting)
AWS CloudFront (CDN)
AWS Lambda (serverless compute)
AWS DynamoDB (database)
AWS IAM (security)
AWS CloudWatch (monitoring)

Development:

Git/GitHub (version control)
AWS CLI (deployment)
Node.js 18+ (local development)


2. System Architecture
2.1 High-Level Architecture
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│              CLOUDFRONT CDN (Global Edge Network)               │
│                                                                 │
│  Distribution 1: E1O2Q0Z86U0U5T (auxeira.com)                 │
│  • Marketing site + Authentication modal                        │
│  • SSL Certificate: ACM                                         │
│                                                                 │
│  Distribution 2: E1L1Q8VK3LAEFC (dashboard.auxeira.com)       │
│  • All dashboard files (23 total)                              │
│  • SSL Certificate: ACM                                         │
└────────┬────────────────────────────────┬─────────────────────────┘
         │                                │
         │ Origin Fetch                   │ Origin Fetch
         ↓                                ↓
┌──────────────────────┐      ┌──────────────────────────────────┐
│   S3: auxeira.com    │      │  S3: auxeira-dashboards-jsx-     │
│   • index.html       │      │      1759943238                  │
│   • assets/          │      │  • startup_founder.html          │
│                      │      │  • venture_capital.html          │
│                      │      │  • angel_investor.html           │
│                      │      │  • esg_funder.html               │
│                      │      │  • 17 SDG dashboards             │
│                      │      │  • admin/dashboard.html          │
└──────────────────────┘      └──────────────┬───────────────────┘
                                             │
                                             │ JavaScript API Calls
                                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    LAMBDA FUNCTIONS                             │
│                                                                 │
│  auth_handler (TO BE DEPLOYED)                                 │
│  • /signup → Create user account                               │
│  • /login  → Authenticate user                                 │
│                                                                 │
│  auxeira-dashboard-context-prod (DEPLOYED)                     │
│  • Fetch user dashboard data                                   │
│  • Calculate metrics (CAC, LTV, churn, NPS, etc.)             │
│  • Role-specific data builders                                 │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         │ DynamoDB SDK
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DYNAMODB TABLES                            │
│                                                                 │
│  auxeira-users-prod                                            │
│  • User accounts (email, password, userType)                   │
│  • Primary Key: userId                                          │
│  • GSI: email-index                                            │
│                                                                 │
│  auxeira-user-startup-mapping-prod                             │
│  • Maps users to startups                                      │
│  • Primary Key: userId                                          │
│                                                                 │
│  auxeira-startup-profiles-prod                                 │
│  • Startup data (revenue, metrics, stage)                      │
│  • Primary Key: startupId                                       │
│                                                                 │
│  auxeira-startup-activities-prod                               │
│  • User activities and events                                  │
│  • Primary Key: activityId                                      │
│  • GSI: startupId-timestamp-index                              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

#### Authentication Flow
```
1. User visits auxeira.com
2. Clicks "Get Started" or "Sign In"
3. Modal opens (signup or login form)
4. User submits credentials
5. JavaScript calls auth_handler Lambda
6. Lambda verifies credentials with DynamoDB
7. Lambda generates JWT token
8. Token + user info returned to browser
9. JavaScript stores token in localStorage
10. JavaScript redirects to appropriate dashboard
11. Dashboard loads from CloudFront/S3
12. Dashboard calls dashboard_handler with JWT
13. Lambda verifies JWT
14. Lambda fetches data from DynamoDB
15. Lambda calculates metrics
16. Data returned to dashboard
17. Dashboard updates UI
```

#### Dashboard Data Flow
```
Dashboard Load
    ↓
Check localStorage for token
    ↓
If no token → Redirect to auxeira.com
    ↓
If token exists → Call API
    ↓
GET /dashboard/context
    Headers: Authorization: Bearer {token}
    ↓
Lambda: Verify JWT signature
    ↓
Lambda: Extract userId from token
    ↓
Lambda: Query DynamoDB
    ├── auxeira-users-prod (user profile)
    ├── auxeira-user-startup-mapping-prod (startup link)
    ├── auxeira-startup-profiles-prod (startup data)
    └── auxeira-startup-activities-prod (activities)
    ↓
Lambda: Calculate metrics
    ├── CAC = Marketing Spend / New Customers
    ├── LTV = (Avg Revenue × Margin) / Churn
    ├── Churn = Industry benchmark by stage
    ├── NPS = (% Promoters - % Detractors) × 100
    └── ... more calculations
    ↓
Lambda: Format response by user type
    ↓
Return JSON
    ↓
Dashboard: Update UI elements
```

### 2.3 Network Diagram
```
┌────────────────────────────────────────────────────────────────┐
│                      AWS REGION: us-east-1                     │
│                                                                │
│  ┌──────────────────┐         ┌──────────────────┐           │
│  │   CloudFront     │────────→│   S3 Buckets     │           │
│  │   Distributions  │         │                  │           │
│  │                  │         │  • auxeira.com   │           │
│  │  • E1O2Q0Z86U0U5T│         │  • dashboards    │           │
│  │  • E1L1Q8VK3LAEFC│         │                  │           │
│  └──────────────────┘         └──────────────────┘           │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │             Lambda Functions                         │    │
│  │                                                      │    │
│  │  ┌─────────────────┐    ┌────────────────────────┐ │    │
│  │  │ auth_handler    │    │ dashboard_handler      │ │    │
│  │  │ (To Deploy)     │    │ (Deployed)             │ │    │
│  │  │                 │    │                        │ │    │
│  │  │ • 512 MB        │    │ • 512 MB               │ │    │
│  │  │ • 30s timeout   │    │ • 30s timeout          │ │    │
│  │  │ • Node.js 18    │    │ • Node.js 18           │ │    │
│  │  └────────┬────────┘    └────────┬───────────────┘ │    │
│  │           │                      │                  │    │
│  └───────────┼──────────────────────┼──────────────────┘    │
│              │                      │                        │
│              └──────────┬───────────┘                        │
│                         │                                     │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                DynamoDB Tables                        │   │
│  │                                                       │   │
│  │  • auxeira-users-prod                                │   │
│  │  • auxeira-user-startup-mapping-prod                 │   │
│  │  • auxeira-startup-profiles-prod                     │   │
│  │  • auxeira-startup-activities-prod                   │   │
│  │                                                       │   │
│  │  Billing Mode: PAY_PER_REQUEST                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              CloudWatch Logs                          │   │
│  │  • Lambda execution logs                             │   │
│  │  • Error tracking                                     │   │
│  │  • Performance metrics                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Current Deployment Status

### 3.1 What's Deployed (Phase 1 - Complete ✅)

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| **Marketing Site** | ✅ Live | s3://auxeira.com | Needs auth modal added |
| **Startup Founder Dashboard** | ✅ Live | dashboard.auxeira.com/startup_founder.html | Fully integrated |
| **17 SDG Dashboards** | ✅ Live | dashboard.auxeira.com/esg_*.html | All integrated |
| **Dashboard Lambda** | ✅ Deployed | auxeira-dashboard-context-prod | 6.3 KB, real calculations |
| **DynamoDB Tables** | ✅ Active | us-east-1 | 4 tables with test data |
| **CloudFront** | ✅ Active | 2 distributions | Caching configured |
| **Test User** | ✅ Created | userId: 045b4095... | Working with test data |

### 3.2 What's Pending (Phase 2 - Ready to Deploy 🔄)

| Component | Status | Priority | Estimated Time |
|-----------|--------|----------|----------------|
| **Auth Handler Lambda** | 🔄 Code ready | HIGH | 2 hours |
| **Email GSI** | 🔄 Needs creation | HIGH | 30 minutes |
| **Login Modal** | 🔄 Code ready | HIGH | 1 hour |
| **Password Hashing** | 🔄 Needs implementation | HIGH | Included in auth |
| **Other User Dashboards** | 🔄 Files exist | MEDIUM | 4 hours |
| **Admin Panel** | 🔄 Partial | LOW | 8 hours |
| **API Gateway** | 🔄 Optional | LOW | 4 hours |

### 3.3 Git Repository

**Repository:** `bursarynetwork007/auxeira-backend`  
**Branch:** `main`  
**Latest Commits:**
- `1974903` - SDG dashboards integration (Nov 3, 2025)
- `11a0d61` - Enhanced Lambda with real calculations (Nov 3, 2025)
- `621b3f2` - Fixed dashboard initialization (Nov 3, 2025)

**Directory Structure:**
```
auxeira-backend/
├── lambda-enhanced/
│   └── lambda-dashboard-context.js (6.3 KB) ✅ DEPLOYED
├── lambda-auth/ (TO BE CREATED)
│   ├── auth_handler.js
│   ├── package.json
│   └── node_modules/
├── dashboard-html/
│   ├── startup_founder.html ✅ DEPLOYED
│   ├── venture_capital.html (needs update)
│   ├── angel_investor.html (needs update)
│   ├── corporate_partner.html (needs update)
│   ├── government.html (needs update)
│   ├── esg_funder.html (needs update)
│   ├── esg_poverty_enhanced.html ✅ DEPLOYED
│   ├── esg_hunger_enhanced.html ✅ DEPLOYED
│   └── ... (15 more SDG files) ✅ DEPLOYED
├── frontend/
│   └── index.html (needs auth modal)
├── scripts/
│   ├── deploy.sh
│   └── test-api.sh
└── docs/
    └── DEPLOYMENT_SPEC_V2.md
3.4 AWS Resources Inventory
S3 Buckets
bash# List buckets
aws s3 ls

# Expected output:
# auxeira.com (marketing site)
# auxeira-dashboards-jsx-1759943238 (dashboards)
CloudFront Distributions
bash# List distributions
aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,DomainName,Origins.Items[0].DomainName]'

# Expected output:
# E1O2Q0Z86U0U5T | d123.cloudfront.net | auxeira.com.s3-website-us-east-1.amazonaws.com
# E1L1Q8VK3LAEFC | d456.cloudfront.net | auxeira-dashboards-jsx-1759943238.s3-website-us-east-1.amazonaws.com
Lambda Functions
bash# List functions
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `auxeira`)].FunctionName'

# Expected output:
# auxeira-dashboard-context-prod (DEPLOYED)
# (auth_handler will be added in Phase 2)
DynamoDB Tables
bash# List tables
aws dynamodb list-tables --query 'TableNames[?starts_with(@, `auxeira`)]'

# Expected output:
# auxeira-users-prod
# auxeira-user-startup-mapping-prod
# auxeira-startup-profiles-prod
# auxeira-startup-activities-prod

4. Database Schema
4.1 Table: auxeira-users-prod
Purpose: Store user account information, credentials, and profile data.
Table Configuration:
yamlTableName: auxeira-users-prod
BillingMode: PAY_PER_REQUEST
Region: us-east-1

Primary Key:
  PartitionKey: userId (String)

Global Secondary Indexes:
  email-index:
    PartitionKey: email (String)
    ProjectionType: ALL
    Status: TO BE CREATED (Phase 2)
Schema:
javascript{
  // Primary Key
  userId: String,              // UUID, e.g., "045b4095-3388-4ea6-8de3-b7b04be5bc1b"
  
  // Authentication
  email: String,               // Unique, lowercase, e.g., "founder@startup.com"
  passwordHash: String,        // bcrypt hash, e.g., "$2b$10$..." (TO BE ADDED)
  
  // Profile
  userType: String,            // IMMUTABLE: startup_founder, venture_capital, angel_investor,
                              //            esg_funder, corporate_partner, government, admin
  fullName: String,           // e.g., "John Doe"
  
  // Status
  status: String,             // "active", "inactive", "suspended"
  
  // Timestamps
  createdAt: String,          // ISO 8601, e.g., "2025-11-03T12:00:00.000Z"
  lastLogin: String,          // ISO 8601, updated on each login
  
  // Optional
  phoneNumber: String,        // Optional
  organizationName: String,   // Optional, for VC/Corporate/Government users
  profilePictureUrl: String   // Optional
}
Example Record:
json{
  "userId": "045b4095-3388-4ea6-8de3-b7b04be5bc1b",
  "email": "founder@startup.com",
  "passwordHash": "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
  "userType": "startup_founder",
  "fullName": "Test Founder",
  "status": "active",
  "createdAt": "2025-11-03T10:00:00.000Z",
  "lastLogin": "2025-11-03T14:30:00.000Z"
}
Access Patterns:

Get user by userId (Primary Key)
Get user by email (GSI: email-index)
Scan all users (Admin only)

Indexes to Create:
bash# Create email-index GSI (Phase 2 deployment)
aws dynamodb update-table \
  --table-name auxeira-users-prod \
  --attribute-definitions AttributeName=email,AttributeType=S \
  --global-secondary-index-updates \
    '[{
      "Create": {
        "IndexName": "email-index",
        "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}],
        "Projection": {"ProjectionType": "ALL"}
      }
    }]'

4.2 Table: auxeira-user-startup-mapping-prod
Purpose: Many-to-many relationship between users and startups.
Table Configuration:
yamlTableName: auxeira-user-startup-mapping-prod
BillingMode: PAY_PER_REQUEST
Region: us-east-1

Primary Key:
  PartitionKey: userId (String)
Schema:
javascript{
  // Primary Key
  userId: String,              // UUID, links to auxeira-users-prod
  
  // Relationship
  startupId: String,           // UUID, links to auxeira-startup-profiles-prod
  role: String,               // "founder", "co-founder", "investor", "advisor", etc.
  
  // Permissions (optional)
  permissions: Array,         // ["view", "edit", "admin"], etc.
  
  // Timestamps
  joinedAt: String,           // ISO 8601
  updatedAt: String           // ISO 8601
}
Example Record:
json{
  "userId": "045b4095-3388-4ea6-8de3-b7b04be5bc1b",
  "startupId": "startup-edtech-96",
  "role": "founder",
  "permissions": ["view", "edit", "admin"],
  "joinedAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-11-03T10:00:00.000Z"
}
Access Patterns:

Get startup for a user (userId = partition key)
Get all users for a startup (requires scan or GSI)


4.3 Table: auxeira-startup-profiles-prod
Purpose: Store all startup data, metrics, and profile information.
Table Configuration:
yamlTableName: auxeira-startup-profiles-prod
BillingMode: PAY_PER_REQUEST
Region: us-east-1

Primary Key:
  PartitionKey: startupId (String)
Schema:
javascript{
  // Primary Key
  startupId: String,              // UUID
  
  // Company Info
  companyName: String,            // e.g., "EdTech Solutions 96"
  industry: String,               // e.g., "EdTech", "FinTech", "HealthTech"
  sector: String,                 // e.g., "Education", "Finance", "Healthcare"
  description: String,            // Company description
  websiteUrl: String,             // Company website
  logoUrl: String,                // Logo image URL
  
  // Stage & Geography
  fundingStage: String,           // "pre-seed", "seed", "series-a", "series-b", "series-c"
  region: String,                 // e.g., "North America", "Asia-Pacific", "Europe"
  country: String,                // e.g., "United States", "India", "South Africa"
  
  // Team
  teamSize: Number,               // Number of employees
  foundedDate: String,            // ISO 8601 date
  
  // Financial Metrics
  currentRevenue: Number,         // Monthly Recurring Revenue in cents
  mrr: Number,                    // Alias for currentRevenue
  monthlyGrowthRate: Number,      // Percentage, e.g., 12.6
  growthRate: Number,             // Alias for monthlyGrowthRate
  
  monthlyBurnRate: Number,        // Monthly expenses in cents
  monthlyExpenses: Number,        // Alias for monthlyBurnRate
  
  cashBalance: Number,            // Current cash in cents
  currentCash: Number,            // Alias for cashBalance
  
  runwayMonths: Number,           // Calculated: cashBalance / burnRate
  
  totalFunding: Number,           // Total raised to date in cents
  valuation: Number,              // Current valuation in cents
  
  // Marketing & Sales
  monthlyMarketingSpend: Number,  // In cents
  monthlySalesSpend: Number,      // In cents
  
  grossMargin: Number,            // Decimal, e.g., 0.7 for 70%
  
  // Customer Metrics
  currentUsers: Number,           // Total users (free + paid)
  users: Number,                  // Alias for currentUsers
  
  customers: Number,              // Paying customers
  payingCustomers: Number,        // Alias for customers
  
  monthlyChurnRate: Number,       // Percentage, e.g., 2.3
  churnRate: Number,              // Alias for monthlyChurnRate
  
  npsScore: Number,               // Net Promoter Score, -100 to 100
  sentimentScore: Number,         // Alias for npsScore
  
  // SSE/ESG Scores
  currentSSIScore: Number,        // Startup Sustainability Index, 0-100
  sseScore: Number,               // Alias for currentSSIScore
  
  currentESGScore: Number,        // ESG Score, 0-100
  esgScore: Number,               // Alias for currentESGScore
  
  // Timestamps
  createdAt: String,              // ISO 8601
  updatedAt: String,              // ISO 8601
  
  // Optional Fields
  pitchDeckUrl: String,
  businessModel: String,
  targetMarket: String,
  competitiveAdvantage: String
}
Example Record:
json{
  "startupId": "startup-edtech-96",
  "companyName": "EdTech Solutions 96",
  "industry": "EdTech",
  "sector": "Education",
  "description": "AI-powered learning platform",
  "websiteUrl": "https://edtech96.com",
  "fundingStage": "pre-seed",
  "region": "Asia-Pacific",
  "country": "India",
  "teamSize": 21,
  "foundedDate": "2024-03-15",
  "currentRevenue": 38017700,
  "mrr": 38017700,
  "monthlyGrowthRate": 12.6,
  "monthlyBurnRate": 15000000,
  "cashBalance": 29000000,
  "runwayMonths": 19.3,
  "totalFunding": 250000000,
  "valuation": 240000000,
  "monthlyMarketingSpend": 5000000,
  "monthlySalesSpend": 3000000,
  "grossMargin": 0.7,
  "currentUsers": 21104,
  "customers": 8441,
  "monthlyChurnRate": 5.5,
  "npsScore": 68.6,
  "currentSSIScore": 62,
  "currentESGScore": 58,
  "createdAt": "2024-03-15T10:00:00.000Z",
  "updatedAt": "2025-11-03T10:00:00.000Z"
}
Access Patterns:

Get startup by startupId (Primary Key)
Get all startups (Scan - for admin/analytics)


4.4 Table: auxeira-startup-activities-prod
Purpose: Track user actions, events, and activities related to startups.
Table Configuration:
yamlTableName: auxeira-startup-activities-prod
BillingMode: PAY_PER_REQUEST
Region: us-east-1

Primary Key:
  PartitionKey: activityId (String)

Global Secondary Indexes:
  startupId-timestamp-index:
    PartitionKey: startupId (String)
    SortKey: timestamp (String)
    ProjectionType: ALL
Schema:
javascript{
  // Primary Key
  activityId: String,           // UUID
  
  // Relationships
  startupId: String,            // UUID, links to auxeira-startup-profiles-prod
  userId: String,               // UUID, links to auxeira-users-prod
  
  // Activity Details
  activityType: String,         // See Activity Types below
  timestamp: String,            // ISO 8601, used for sorting
  
  // Activity-Specific Data
  score: Number,                // For feedback/rating activities
  rating: Number,               // Alias for score
  
  metadata: Object,             // Flexible object for additional data
  
  // Examples of metadata by activity type:
  // - customer_acquired: {channel: "organic", cost: 127}
  // - milestone_completed: {milestone: "First 1000 users", impact: "high"}
  // - customer_feedback: {feedback: "Great product!", rating: 9}
  // - revenue_milestone: {amount: 100000, currency: "USD"}
}
Activity Types:
javascriptconst ACTIVITY_TYPES = [
  // Customer
  'customer_acquired',
  'customer_churned',
  'customer_feedback',
  'customer_interview',
  
  // Milestones
  'milestone_completed',
  'revenue_milestone',
  'user_milestone',
  
  // Product
  'feature_launched',
  'product_update',
  'bug_fixed',
  
  // Funding
  'funding_received',
  'investor_meeting',
  'pitch_completed',
  
  // Team
  'team_member_hired',
  'team_member_departed',
  
  // Marketing
  'campaign_launched',
  'press_mention',
  'partnership_signed'
];
Example Record:
json{
  "activityId": "activity-abc-123",
  "startupId": "startup-edtech-96",
  "userId": "045b4095-3388-4ea6-8de3-b7b04be5bc1b",
  "activityType": "customer_acquired",
  "timestamp": "2025-11-03T14:30:00.000Z",
  "metadata": {
    "channel": "organic",
    "cost": 127,
    "source": "google_search"
  }
}
Access Patterns:

Get activity by activityId (Primary Key)
Get all activities for a startup, sorted by time (GSI: startupId-timestamp-index)
Get recent activities (Query with limit)


4.5 Database Setup Script
File: scripts/setup-database.sh
bash#!/bin/bash
# Auxeira Database Setup Script
# Run this on a fresh AWS account to set up all tables

set -e

REGION="us-east-1"

echo "=== Auxeira Database Setup ==="
echo "Region: $REGION"
echo ""

# Check if tables already exist
echo "Checking for existing tables..."
EXISTING_TABLES=$(aws dynamodb list-tables --region $REGION --query 'TableNames' --output text)

if [[ $EXISTING_TABLES == *"auxeira-users-prod"* ]]; then
    echo "❌ Tables already exist. Skipping creation."
    echo "To recreate, manually delete tables first."
    exit 0
fi

echo "✅ No existing tables found. Creating..."
echo ""

# 1. Create auxeira-users-prod
echo "1/4 Creating auxeira-users-prod..."
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
  --region $REGION

echo "✅ auxeira-users-prod created"

# 2. Create auxeira-user-startup-mapping-prod
echo "2/4 Creating auxeira-user-startup-mapping-prod..."
aws dynamodb create-table \
  --table-name auxeira-user-startup-mapping-prod \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION

echo "✅ auxeira-user-startup-mapping-prod created"

# 3. Create auxeira-startup-profiles-prod
echo "3/4 Creating auxeira-startup-profiles-prod..."
aws dynamodb create-table \
  --table-name auxeira-startup-profiles-prod \
  --attribute-definitions \
    AttributeName=startupId,AttributeType=S \
  --key-schema \
    AttributeName=startupId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION

echo "✅ auxeira-startup-profiles-prod created"

# 4. Create auxeira-startup-activities-prod
echo "4/4 Creating auxeira-startup-activities-prod..."
aws dynamodb create-table \
  --table-name auxeira-startup-activities-prod \
  --attribute-definitions \
    AttributeName=activityId,AttributeType=S \
    AttributeName=startupId,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=activityId,KeyType=HASH \
  --global-secondary-indexes \
    "[{
      \"IndexName\": \"startupId-timestamp-index\",
      \"KeySchema\": [
        {\"AttributeName\": \"startupId\", \"KeyType\": \"HASH\"},
        {\"AttributeName\": \"timestamp\", \"KeyType\": \"RANGE\"}
      ],
      \"Projection\": {\"ProjectionType\": \"ALL\"}
    }]" \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION

echo "✅ auxeira-startup-activities-prod created"

echo ""
echo "=== Waiting for tables to become active ==="
aws dynamodb wait table-exists --table-name auxeira-users-prod --region $REGION
aws dynamodb wait table-exists --table-name auxeira-user-startup-mapping-prod --region $REGION
aws dynamodb wait table-exists --table-name auxeira-startup-profiles-prod --region $REGION
aws dynamodb wait table-exists --table-name auxeira-startup-activities-prod --region $REGION

echo ""
echo "✅ All tables created successfully!"
echo ""
echo "Next steps:"
echo "1. Run scripts/seed-test-data.js to populate test data"
echo "2. Deploy Lambda functions"
echo "3. Deploy frontend"
Usage:
bashchmod +x scripts/setup-database.sh
./scripts/setup-database.sh

4.6 Test Data Seeding Script
File: scripts/seed-test-data.js
javascript/**
 * Seed Test Data for Auxeira Database
 * 
 * This script creates:
 * - Test users (5 different user types)
 * - Test startups (1-2 per user)
 * - Test activities (10-20 per startup)
 * 
 * Usage: node scripts/seed-test-data.js
 */

const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

AWS.config.update({ region: 'us-east-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Test Users
const TEST_USERS = [
  {
    email: 'founder@test.com',
    password: 'Test1234!',
    userType: 'startup_founder',
    fullName: 'Sarah Founder',
    startup: {
      companyName: 'EdTech Solutions 96',
      industry: 'EdTech',
      sector: 'Education',
      fundingStage: 'pre-seed',
      region: 'Asia-Pacific',
      teamSize: 21,
      currentRevenue: 380177,
      monthlyGrowthRate: 12.6,
      currentUsers: 21104,
      customers: 8441,
      currentSSIScore: 62
    }
  },
  {
    email: 'vc@test.com',
    password: 'Test1234!',
    userType: 'venture_capital',
    fullName: 'Michael Venture',
    organizationName: 'Tech Ventures LLC'
  },
  {
    email: 'angel@test.com',
    password: 'Test1234!',
    userType: 'angel_investor',
    fullName: 'Angela Angel',
    organizationName: 'Angel Investor'
  },
  {
    email: 'esg@test.com',
    password: 'Test1234!',
    userType: 'esg_funder',
    fullName: 'Emma ESG',
    organizationName: 'Global Impact Fund'
  },
  {
    email: 'admin@auxeira.com',
    password: 'Admin1234!',
    userType: 'admin',
    fullName: 'Admin User'
  }
];

async function seedDatabase() {
  console.log('=== Seeding Auxeira Test Data ===\n');
  
  try {
    for (const userData of TEST_USERS) {
      console.log(`Creating user: ${userData.email}`);
      
      // Create user
      const userId = crypto.randomUUID();
      const passwordHash = await bcrypt.hash(userData.password, 10);
      
      await dynamodb.put({
        TableName: 'auxeira-users-prod',
        Item: {
          userId,
          email: userData.email.toLowerCase(),
          passwordHash,
          userType: userData.userType,
          fullName: userData.fullName,
          organizationName: userData.organizationName || null,
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        }
      }).promise();
      
      console.log(`  ✅ User created: ${userId}`);
      
      // Create startup if provided
      if (userData.startup) {
        const startupId = crypto.randomUUID();
        
        await dynamodb.put({
          TableName: 'auxeira-startup-profiles-prod',
          Item: {
            startupId,
            companyName: userData.startup.companyName,
            industry: userData.startup.industry,
            sector: userData.startup.sector,
            fundingStage: userData.startup.fundingStage,
            region: userData.startup.region,
            teamSize: userData.startup.teamSize,
            currentRevenue: userData.startup.currentRevenue,
            mrr: userData.startup.currentRevenue,
            monthlyGrowthRate: userData.startup.monthlyGrowthRate,
            currentUsers: userData.startup.currentUsers,
            customers: userData.startup.customers,
            currentSSIScore: userData.startup.currentSSIScore,
            sseScore: userData.startup.currentSSIScore,
            monthlyBurnRate: 150000,
            cashBalance: 2900000,
            runwayMonths: 19.3,
            totalFunding: 2500000,
            valuation: 24000000,
            monthlyMarketingSpend: 50000,
            monthlySalesSpend: 30000,
            grossMargin: 0.7,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }).promise();
        
        console.log(`  ✅ Startup created: ${startupId}`);
        
        // Create mapping
        await dynamodb.put({
          TableName: 'auxeira-user-startup-mapping-prod',
          Item: {
            userId,
            startupId,
            role: 'founder',
            permissions: ['view', 'edit', 'admin'],
            joinedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }).promise();
        
        console.log(`  ✅ Mapping created`);
        
        // Create sample activities
        const activityTypes = [
          'customer_acquired',
          'customer_interview',
          'milestone_completed',
          'feature_launched',
          'customer_feedback'
        ];
        
        for (let i = 0; i < 10; i++) {
          const activityId = crypto.randomUUID();
          const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
          
          await dynamodb.put({
            TableName: 'auxeira-startup-activities-prod',
            Item: {
              activityId,
              startupId,
              userId,
              activityType,
              timestamp: new Date(Date.now() - i * 86400000).toISOString(), // Last 10 days
              score: activityType.includes('feedback') ? Math.floor(Math.random() * 10) + 1 : null,
              metadata: {
                note: `Sample ${activityType} activity`
              }
            }
          }).promise();
        }
        
        console.log(`  ✅ 10 activities created`);
      }
      
      console.log('');
    }
    
    console.log('=== Seeding Complete ===');
    console.log('\nTest Accounts Created:');
    TEST_USERS.forEach(user => {
      console.log(`  ${user.email} / ${user.password} (${user.userType})`);
    });
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
Usage:
bash# Install dependencies
npm install aws-sdk bcryptjs

# Run seeding script
node scripts/seed-test-data.js

5. Lambda Functions
5.1 Dashboard Context Lambda (DEPLOYED)
Function Name: auxeira-dashboard-context-prod
Runtime: Node.js 18.x
Memory: 512 MB
Timeout: 30 seconds
Handler: lambda-dashboard-context.handler
Function URL: https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws
Purpose:

Fetch user-specific dashboard data from DynamoDB
Calculate metrics using real formulas (CAC, LTV, Churn, NPS, etc.)
Provide role-specific data for each user type

Current Implementation: [Full code in repo at lambda-enhanced/lambda-dashboard-context.js]
Key Features:

✅ JWT verification (to be enhanced in Phase 2)
✅ Role-specific data builders for 6 user types
✅ Real metric calculations (7 formulas)
✅ Industry benchmarks for intelligent fallbacks
✅ Activity-based insights
✅ Error handling and logging

Environment Variables:
bashJWT_SECRET=your-secret-key-min-32-chars  # To be added in Phase 2
IAM Permissions Required:
json{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/auxeira-users-prod",
        "arn:aws:dynamodb:us-east-1:*:table/auxeira-users-prod/index/*",
        "arn:aws:dynamodb:us-east-1:*:table/auxeira-user-startup-mapping-prod",
        "arn:aws:dynamodb:us-east-1:*:table/auxeira-startup-profiles-prod",
        "arn:aws:dynamodb:us-east-1:*:table/auxeira-startup-activities-prod",
        "arn:aws:dynamodb:us-east-1:*:table/auxeira-startup-activities-prod/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}

5.2 Auth Handler Lambda (TO DEPLOY)
Function Name: auxeira-auth-handler
Runtime: Node.js 18.x
Memory: 512 MB
Timeout: 30 seconds
Handler: auth_handler.handler
Purpose:

Handle user signup
Handle user login
Generate JWT tokens
Validate credentials

File: lambda-auth/auth_handler.js
javascript/**
 * Auxeira Authentication Handler
 * 
 * Endpoints:
 * - POST /signup - Create new user account
 * - POST /login  - Authenticate existing user
 */

const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

AWS.config.update({ region: 'us-east-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const USERS_TABLE = 'auxeira-users-prod';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '7d';

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
    console.log('Auth Request:', JSON.stringify(event, null, 2));
    
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
        return corsResponse(200, { message: 'OK' });
    }
    
    const path = event.path || event.rawPath || '';
    const body = event.body ? JSON.parse(event.body) : {};
    
    try {
        if (path.includes('/signup')) {
            return await handleSignup(body);
        } else if (path.includes('/login')) {
            return await handleLogin(body);
        } else {
            return corsResponse(404, { error: 'Endpoint not found' });
        }
    } catch (error) {
        console.error('Auth Error:', error);
        return corsResponse(500, { 
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Handle user signup
 */
async function handleSignup(body) {
    console.log('Signup request for:', body.email);
    
    // Validation
    const { fullName, email, password, userType } = body;
    
    if (!fullName || !email || !password || !userType) {
        return corsResponse(400, { 
            error: 'Missing required fields',
            required: ['fullName', 'email', 'password', 'userType']
        });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return corsResponse(400, { error: 'Invalid email format' });
    }
    
    // Validate password strength
    if (password.length < 8) {
        return corsResponse(400, { error: 'Password must be at least 8 characters' });
    }
    
    // Validate user type
    const validUserTypes = [
        'startup_founder',
        'venture_capital',
        'angel_investor',
        'esg_funder',
        'corporate_partner',
        'government',
        'impact_investor',
        'admin'
    ];
    
    if (!validUserTypes.includes(userType)) {
        return corsResponse(400, { 
            error: 'Invalid user type',
            validTypes: validUserTypes
        });
    }
    
    // Check if email already exists
    try {
        const existing = await dynamodb.query({
            TableName: USERS_TABLE,
            IndexName: 'email-index',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email.toLowerCase()
            }
        }).promise();
        
        if (existing.Items && existing.Items.length > 0) {
            return corsResponse(400, { error: 'Email already registered' });
        }
    } catch (error) {
        console.error('Error checking existing user:', error);
        return corsResponse(500, { error: 'Database error' });
    }
    
    // Create user
    const userId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    
    const newUser = {
        userId,
        email: email.toLowerCase(),
        passwordHash,
        userType,
        fullName,
        status: 'active',
        createdAt: now,
        lastLogin: now
    };
    
    try {
        await dynamodb.put({
            TableName: USERS_TABLE,
            Item: newUser
        }).promise();
        
        console.log(`User created successfully: ${userId}`);
    } catch (error) {
        console.error('Error creating user:', error);
        return corsResponse(500, { error: 'Failed to create user account' });
    }
    
    // Generate JWT token
    const token = jwt.sign({
        userId,
        email: email.toLowerCase(),
        userType,
        fullName
    }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    
    // Return success response
    return corsResponse(201, {
        success: true,
        token,
        user: {
            id: userId,
            email: email.toLowerCase(),
            userType,
            fullName
        }
    });
}

/**
 * Handle user login
 */
async function handleLogin(body) {
    console.log('Login request for:', body.email);
    
    // Validation
    const { email, password } = body;
    
    if (!email || !password) {
        return corsResponse(400, { 
            error: 'Missing required fields',
            required: ['email', 'password']
        });
    }
    
    // Get user by email
    let user;
    try {
        const result = await dynamodb.query({
            TableName: USERS_TABLE,
            IndexName: 'email-index',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email.toLowerCase()
            }
        }).promise();
        
        if (!result.Items || result.Items.length === 0) {
            return corsResponse(401, { error: 'Invalid email or password' });
        }
        
        user = result.Items[0];
    } catch (error) {
        console.error('Error querying user:', error);
        return corsResponse(500, { error: 'Database error' });
    }
    
    // Check user status
    if (user.status !== 'active') {
        return corsResponse(403, { 
            error: 'Account is not active',
            status: user.status
        });
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
        return corsResponse(401, { error: 'Invalid email or password' });
    }
    
    // Update last login
    try {
        await dynamodb.update({
            TableName: USERS_TABLE,
            Key: { userId: user.userId },
            UpdateExpression: 'SET lastLogin = :now',
            ExpressionAttributeValues: {
                ':now': new Date().toISOString()
            }
        }).promise();
    } catch (error) {
        console.error('Error updating last login:', error);
        // Non-critical error, continue
    }
    
    console.log(`User logged in successfully: ${user.userId}`);
    
    // Generate JWT token
    const token = jwt.sign({
        userId: user.userId,
        email: user.email,
        userType: user.userType,
        fullName: user.fullName
    }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    
    // Return success response
    return corsResponse(200, {
        success: true,
        token,
        user: {
            id: user.userId,
            email: user.email,
            userType: user.userType,
            fullName: user.fullName
        }
    });
}

/**
 * Create CORS-enabled response
 */
function corsResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Max-Age': '86400'
        },
        body: JSON.stringify(body)
    };
}
Dependencies: lambda-auth/package.json
json{
  "name": "auxeira-auth-handler",
  "version": "1.0.0",
  "description": "Authentication handler for Auxeira platform",
  "main": "auth_handler.js",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
Environment Variables:
bashJWT_SECRET=your-secret-key-min-32-chars-CHANGE-IN-PRODUCTION
NODE_ENV=production
IAM Permissions Required:
json{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/auxeira-users-prod",
        "arn:aws:dynamodb:us-east-1:*:table/auxeira-users-prod/index/email-index"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

---

## 6. Frontend Applications

### 6.1 Marketing Site (auxeira.com)

**Location:** `frontend/index.html`  
**S3 Bucket:** `s3://auxeira.com`  
**CloudFront:** `https://auxeira.com` (Distribution E1O2Q0Z86U0U5T)

**Current Status:** Needs auth modal added

**File Structure:**
```
auxeira.com/
├── index.html          (marketing page + auth modal)
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── main.js
│   └── images/
│       ├── logo.png
│       └── hero.png
└── favicon.ico
Complete index.html with Auth Modal: [See Section 9.2 for full code]

6.2 Dashboard Applications
Location: dashboard-html/
S3 Bucket: s3://auxeira-dashboards-jsx-1759943238
CloudFront: https://dashboard.auxeira.com (Distribution E1L1Q8VK3LAEFC)
Dashboard Files:
FileUser TypeStatusSizestartup_founder.htmlStartup Founder✅ Deployed250 KBventure_capital.htmlVC Firm🔄 Needs update-angel_investor.htmlAngel Investor🔄 Needs update-corporate_partner.htmlCorporate🔄 Needs update-government.htmlGovernment🔄 Needs update-esg_funder.htmlESG Funder🔄 Needs update-impact_investor.htmlImpact Investor🔄 Needs update-admin/dashboard.htmlAdmin🔄 Needs creation-esg_poverty_enhanced.htmlSDG 1✅ Deployed180 KBesg_hunger_enhanced.htmlSDG 2✅ Deployed180 KB... (15 more SDG files)SDG 3-17✅ Deployed~180 KB each
Common Dashboard Structure:
All dashboards follow this pattern:
html<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Auxeira</title>
    <style>
        /* Dashboard-specific styles */
    </style>
</head>
<body>
    <!-- Dashboard content -->
    
    <script>
        // Configuration
        const API_BASE = 'https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws';
        
        // Authentication check
        function checkAuth() {
            const token = localStorage.getItem('auxeira_auth_token');
            if (!token) {
                window.location.href = 'https://auxeira.com';
                return false;
            }
            return token;
        }
        
        // Load dashboard data
        async function loadDashboardData() {
            const token = checkAuth();
            if (!token) return;
            
            try {
                const response = await fetch(API_BASE, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                const data = await response.json();
                updateDashboardUI(data);
            } catch (error) {
                console.error('Error loading dashboard:', error);
                // Handle error (show message, redirect, etc.)
            }
        }
        
        // Update UI with data
        function updateDashboardUI(data) {
            // Dashboard-specific UI updates
        }
        
        // Initialize on page load
        window.addEventListener('DOMContentLoaded', loadDashboardData);
    </script>
</body>
</html>

6.3 Deployment Scripts
File: scripts/deploy-frontend.sh
bash#!/bin/bash
# Deploy Frontend Files to S3 and Invalidate CloudFront

set -e

MARKETING_BUCKET="auxeira.com"
DASHBOARD_BUCKET="auxeira-dashboards-jsx-1759943238"
MARKETING_DIST="E1O2Q0Z86U0U5T"
DASHBOARD_DIST="E1L1Q8VK3LAEFC"
REGION="us-east-1"

echo "=== Auxeira Frontend Deployment ==="
echo ""

# Deploy marketing site
if [ -f "frontend/index.html" ]; then
    echo "1. Deploying marketing site..."
    aws s3 cp frontend/index.html s3://$MARKETING_BUCKET/index.html \
      --content-type "text/html" \
      --cache-control "no-cache, max-age=0" \
      --region $REGION
    
    aws s3 sync frontend/assets/ s3://$MARKETING_BUCKET/assets/ \
      --delete \
      --cache-control "public, max-age=31536000" \
      --region $REGION
    
    echo "✅ Marketing site deployed"
    
    echo "2. Invalidating CloudFront..."
    aws cloudfront create-invalidation \
      --distribution-id $MARKETING_DIST \
      --paths "/index.html" "/assets/*" \
      --region $REGION
    echo "✅ CloudFront invalidation created"
else
    echo "⚠️  Skipping marketing site (file not found)"
fi

echo ""

# Deploy dashboards
if [ -d "dashboard-html" ]; then
    echo "3. Deploying dashboards..."
    aws s3 sync dashboard-html/ s3://$DASHBOARD_BUCKET/ \
      --exclude "*.md" \
      --exclude ".git*" \
      --content-type "text/html" \
      --cache-control "no-cache, max-age=0" \
      --region $REGION
    
    echo "✅ Dashboards deployed"
    
    echo "4. Invalidating dashboard CloudFront..."
    aws cloudfront create-invalidation \
      --distribution-id $DASHBOARD_DIST \
      --paths "/*" \
      --region $REGION
    echo "✅ CloudFront invalidation created"
else
    echo "⚠️  Skipping dashboards (directory not found)"
fi

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "URLs:"
echo "  Marketing: https://auxeira.com"
echo "  Dashboard: https://dashboard.auxeira.com"
echo ""
echo "Wait 5-10 minutes for CloudFront invalidation to complete."
Usage:
bashchmod +x scripts/deploy-frontend.sh
./scripts/deploy-frontend.sh

7. Infrastructure Setup
7.1 Prerequisites
Required Tools:

AWS CLI v2 (configured with credentials)
Node.js 18+ and npm
Git
Bash shell (Linux/Mac) or Git Bash (Windows)

AWS Account Requirements:

IAM user with AdministratorAccess or specific permissions:

DynamoDB: Full access
Lambda: Full access
S3: Full access
CloudFront: Full access
IAM: Read access (to create execution roles)
CloudWatch: Logs access



Install AWS CLI:
bash# Mac (Homebrew)
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Windows
# Download installer from: https://awscli.amazonaws.com/AWSCLIV2.msi

# Verify installation
aws --version
Configure AWS CLI:
bashaws configure
# AWS Access Key ID: [Your access key]
# AWS Secret Access Key: [Your secret key]
# Default region name: us-east-1
# Default output format: json

7.2 IAM Roles Setup
File: scripts/setup-iam-roles.sh
bash#!/bin/bash
# Create IAM roles for Lambda functions

set -e

ROLE_NAME="AuxeiraLambdaExecutionRole"

echo "=== Creating IAM Role for Lambda ==="

# Check if role already exists
if aws iam get-role --role-name $ROLE_NAME 2>/dev/null; then
    echo "✅ Role $ROLE_NAME already exists"
    exit 0
fi

# Create trust policy
cat > /tmp/lambda-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document file:///tmp/lambda-trust-policy.json \
  --description "Execution role for Auxeira Lambda functions"

echo "✅ Role created: $ROLE_NAME"

# Create permission policy
cat > /tmp/lambda-permissions.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/auxeira-*",
        "arn:aws:dynamodb:us-east-1:*:table/auxeira-*/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
EOF

# Attach policy
aws iam put-role-policy \
  --role-name $ROLE_NAME \
  --policy-name AuxeiraDynamoDBAccess \
  --policy-document file:///tmp/lambda-permissions.json

echo "✅ Permissions attached"

echo ""
echo "Role ARN:"
aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text

rm /tmp/lambda-trust-policy.json /tmp/lambda-permissions.json
Usage:
bashchmod +x scripts/setup-iam-roles.sh
./scripts/setup-iam-roles.sh

7.3 S3 Buckets Setup
File: scripts/setup-s3-buckets.sh
bash#!/bin/bash
# Create and configure S3 buckets for static hosting

set -e

MARKETING_BUCKET="auxeira.com"
DASHBOARD_BUCKET="auxeira-dashboards-jsx-1759943238"
REGION="us-east-1"

echo "=== Creating S3 Buckets ==="
echo ""

# Create marketing bucket
echo "1. Creating $MARKETING_BUCKET..."
aws s3 mb s3://$MARKETING_BUCKET --region $REGION 2>/dev/null || echo "Bucket already exists"

# Enable static website hosting
aws s3 website s3://$MARKETING_BUCKET \
  --index-document index.html \
  --error-document 404.html

# Set bucket policy for public read
cat > /tmp/marketing-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$MARKETING_BUCKET/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket $MARKETING_BUCKET \
  --policy file:///tmp/marketing-policy.json

echo "✅ $MARKETING_BUCKET configured"
echo ""

# Create dashboard bucket
echo "2. Creating $DASHBOARD_BUCKET..."
aws s3 mb s3://$DASHBOARD_BUCKET --region $REGION 2>/dev/null || echo "Bucket already exists"

# Enable static website hosting
aws s3 website s3://$DASHBOARD_BUCKET \
  --index-document startup_founder.html

# Set bucket policy for public read
cat > /tmp/dashboard-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$DASHBOARD_BUCKET/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket $DASHBOARD_BUCKET \
  --policy file:///tmp/dashboard-policy.json

echo "✅ $DASHBOARD_BUCKET configured"
echo ""

echo "=== S3 Buckets Ready ==="
echo ""
echo "Bucket URLs:"
echo "  Marketing: http://$MARKETING_BUCKET.s3-website-$REGION.amazonaws.com"
echo "  Dashboard: http://$DASHBOARD_BUCKET.s3-website-$REGION.amazonaws.com"

rm /tmp/marketing-policy.json /tmp/dashboard-policy.json
Usage:
bashchmod +x scripts/setup-s3-buckets.sh
./scripts/setup-s3-buckets.sh

7.4 CloudFront Setup
Note: CloudFront distributions already exist. If you need to recreate them:
File: scripts/setup-cloudfront.sh
bash#!/bin/bash
# Create CloudFront distributions for S3 buckets

# NOTE: This script is for reference only.
# CloudFront distributions already exist:
# - E1O2Q0Z86U0U5T (auxeira.com)
# - E1L1Q8VK3LAEFC (dashboard.auxeira.com)

# To view existing distributions:
aws cloudfront list-distributions \
  --query 'DistributionList.Items[*].[Id,DomainName,Origins.Items[0].DomainName]' \
  --output table

# If you need to update cache behavior:
# 1. Get distribution config:
aws cloudfront get-distribution-config --id E1L1Q8VK3LAEFC > dist-config.json

# 2. Extract ETag:
ETAG=$(jq -r '.ETag' dist-config.json)

# 3. Edit dist-config.json (modify DistributionConfig section)

# 4. Update distribution:
aws cloudfront update-distribution \
  --id E1L1Q8VK3LAEFC \
  --if-match "$ETAG" \
  --distribution-config file://dist-config-updated.json

8. Deployment Procedures
8.1 First-Time Setup (Fresh AWS Account)
Complete Setup from Scratch:
bash# 1. Clone repository
git clone https://github.com/bursarynetwork007/auxeira-backend.git
cd auxeira-backend

# 2. Install Node.js dependencies
npm install

# 3. Create IAM role
./scripts/setup-iam-roles.sh

# Save the Role ARN output, you'll need it later

# 4. Create DynamoDB tables
./scripts/setup-database.sh

# Wait for tables to be active (5-10 minutes)

# 5. Seed test data
npm install aws-sdk bcryptjs
node scripts/seed-test-data.js

# 6. Create S3 buckets
./scripts/setup-s3-buckets.sh

# 7. Deploy auth Lambda
cd lambda-auth
npm install
zip -r auth-deployment.zip .

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET" > .env

# Get Role ARN from step 3
ROLE_ARN="arn:aws:iam::YOUR_ACCOUNT:role/AuxeiraLambdaExecutionRole"

# Create Lambda function
aws lambda create-function \
  --function-name auxeira-auth-handler \
  --runtime nodejs18.x \
  --role $ROLE_ARN \
  --handler auth_handler.handler \
  --zip-file fileb://auth-deployment.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment "Variables={JWT_SECRET=$JWT_SECRET}"

# Create Function URL
aws lambda create-function-url-config \
  --function-name auxeira-auth-handler \
  --auth-type NONE \
  --cors AllowOrigins="*",AllowMethods="*",AllowHeaders="*"

# Save the Function URL output

# 8. Update dashboard Lambda with JWT support
cd ../lambda-enhanced
npm install jsonwebtoken

# Update lambda-dashboard-context.js environment variable
aws lambda update-function-configuration \
  --function-name auxeira-dashboard-context-prod \
  --environment "Variables={JWT_SECRET=$JWT_SECRET}"

# 9. Update frontend with API URLs
# Edit frontend/index.html:
# - Replace AUTH_API with your auth Lambda Function URL
# - Replace DASHBOARD_API with existing dashboard Lambda URL

# 10. Deploy frontend
cd ..
./scripts/deploy-frontend.sh

# 11. Create CloudFront distributions (if needed)
# See CloudFront management console or use AWS CLI

# 12. Test the application
./scripts/test-deployment.sh

8.2 Regular Deployment (Code Updates)
Deploy Lambda Function Updates:
bash# Update dashboard Lambda
cd lambda-enhanced

# Make your changes to lambda-dashboard-context.js

# Package and deploy
zip lambda-deployment.zip lambda-dashboard-context.js
aws lambda update-function-code \
  --function-name auxeira-dashboard-context-prod \
  --zip-file fileb://lambda-deployment.zip

# Wait for update to complete
aws lambda wait function-updated \
  --function-name auxeira-dashboard-context-prod

echo "✅ Lambda updated"

# Update auth Lambda (similar process)
cd ../lambda-auth
npm install  # If dependencies changed
zip -r auth-deployment.zip .
aws lambda update-function-code \
  --function-name auxeira-auth-handler \
  --zip-file fileb://auth-deployment.zip
Deploy Frontend Updates:
bash# Update dashboards
./scripts/deploy-frontend.sh

# Or deploy specific files
aws s3 cp dashboard-html/startup_founder.html \
  s3://auxeira-dashboards-jsx-1759943238/startup_founder.html

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id E1L1Q8VK3LAEFC \
  --paths "/startup_founder.html"

8.3 Database Migration
Add New Fields to Existing Tables:
javascript// Example: Add new field to startup profiles
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function addFieldToStartups() {
  // Scan all startups
  const result = await dynamodb.scan({
    TableName: 'auxeira-startup-profiles-prod'
  }).promise();
  
  // Update each with new field
  for (const startup of result.Items) {
    await dynamodb.update({
      TableName: 'auxeira-startup-profiles-prod',
      Key: { startupId: startup.startupId },
      UpdateExpression: 'SET newField = :value',
      ExpressionAttributeValues: {
        ':value': 'default_value'
      }
    }).promise();
  }
  
  console.log(`Updated ${result.Items.length} startups`);
}

addFieldToStartups();
```

---

## 9. Authentication Flow

### 9.1 Complete Auth Flow Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    USER JOURNEY                             │
└─────────────────────────────────────────────────────────────┘

FIRST TIME USER (Signup):
1. Visit auxeira.com
2. Click "Get Started"
3. Fill form:
   - Full Name
   - Email
   - Password
   - Select User Type (ONE TIME ONLY)
4. Submit → POST /signup
5. auth_handler:
   - Validate input
   - Check email not exists
   - Hash password (bcrypt)
   - Create user in DynamoDB
   - Generate JWT token
6. Return: {token, user: {id, email, userType, fullName}}
7. JavaScript:
   - localStorage.setItem('auxeira_auth_token', token)
   - localStorage.setItem('auxeira_user', JSON.stringify(user))
   - window.location.href = 'https://dashboard.auxeira.com/{userType}.html'

RETURNING USER (Login):
1. Visit auxeira.com
2. Click "Sign In"
3. Fill form:
   - Email
   - Password
   (NO user type selection)
4. Submit → POST /login
5. auth_handler:
   - Query user by email (GSI)
   - Verify password (bcrypt.compare)
   - Get userType from database
   - Generate JWT token
6. Return: {token, user: {id, email, userType, fullName}}
7. JavaScript:
   - localStorage.setItem('auxeira_auth_token', token)
   - localStorage.setItem('auxeira_user', JSON.stringify(user))
   - window.location.href = 'https://dashboard.auxeira.com/{userType}.html'

DASHBOARD ACCESS:
1. Dashboard page loads
2. JavaScript:
   - token = localStorage.getItem('auxeira_auth_token')
   - if (!token) redirect to auxeira.com
3. Call API:
   - GET /dashboard/context
   - Headers: Authorization: Bearer {token}
4. dashboard_handler:
   - Verify JWT signature
   - Extract userId from token
   - Query DynamoDB for user data
   - Calculate metrics
   - Return role-specific data
5. Dashboard:
   - Receive data
   - Update UI
   - Show metrics

9.2 Complete Login Modal Code
File: frontend/index.html (relevant sections)
html<!-- Add this in the <head> section -->
<style>
/* Modal Styles */
.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    animation: fadeIn 0.3s;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.modal-content {
    background: #fff;
    margin: 5% auto;
    padding: 40px;
    border-radius: 12px;
    width: 450px;
    max-width: 90%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    animation: slideIn 0.3s;
}

@keyframes slideIn {
    from {
        transform: translateY(-50px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
}

.modal-header h2 {
    margin: 0;
    color: #333;
    font-size: 24px;
}

.close {
    font-size: 32px;
    cursor: pointer;
    color: #999;
    transition: color 0.2s;
    line-height: 1;
}

.close:hover {
    color: #333;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #333;
    font-size: 14px;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 15px;
    transition: border-color 0.2s;
    box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: #4CAF50;
}

.btn-primary {
    width: 100%;
    padding: 14px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
}

.btn-primary:hover {
    background: #45a049;
}

.btn-primary:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.toggle-mode {
    text-align: center;
    margin-top: 20px;
    color: #666;
    font-size: 14px;
}

.toggle-mode a {
    color: #4CAF50;
    text-decoration: none;
    font-weight: 500;
}

.toggle-mode a:hover {
    text-decoration: underline;
}

.error-message {
    background: #fee;
    color: #c33;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 20px;
    display: none;
    font-size: 14px;
}

.user-type-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-top: 10px;
}

.user-type-option {
    padding: 15px;
    border: 2px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    text-align: center;
    transition: all 0.2s;
    font-size: 14px;
}

.user-type-option:hover {
    border-color: #4CAF50;
    background: #f0f8f0;
}

.user-type-option.selected {
    border-color: #4CAF50;
    background: #4CAF50;
    color: white;
}

.user-type-option input[type="radio"] {
    display: none;
}

.user-type-option .icon {
    font-size: 24px;
    margin-bottom: 5px;
}
</style>

<!-- Add this before closing </body> tag -->
<div id="authModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="modalTitle">Get Started</h2>
            <span class="close">&times;</span>
        </div>
        
        <div id="errorMessage" class="error-message"></div>
        
        <!-- SIGNUP FORM -->
        <form id="signupForm" style="display: block;">
            <div class="form-group">
                <label for="signupName">Full Name *</label>
                <input 
                    type="text" 
                    id="signupName" 
                    placeholder="John Doe" 
                    required
                    autocomplete="name"
                >
            </div>
            
            <div class="form-group">
                <label for="signupEmail">Email *</label>
                <input 
                    type="email" 
                    id="signupEmail" 
                    placeholder="your@email.com" 
                    required
                    autocomplete="email"
                >
            </div>
            
            <div class="form-group">
                <label for="signupPassword">Password *</label>
                <input 
                    type="password" 
                    id="signupPassword" 
                    placeholder="Minimum 8 characters" 
                    required
                    minlength="8"
                    autocomplete="new-password"
                >
            </div>
            
            <div class="form-group">
                <label>I am a... *</label>
                <div class="user-type-grid">
                    <label class="user-type-option">
                        <input type="radio" name="userType" value="startup_founder" required>
                        <div class="icon">🚀</div>
                        <div>Startup Founder</div>
                    </label>
                    <label class="user-type-option">
                        <input type="radio" name="userType" value="venture_capital">
                        <div class="icon">💼</div>
                        <div>VC Firm</div>
                    </label>
                    <label class="user-type-option">
                        <input type="radio" name="userType" value="angel_investor">
                        <div class="icon">👼</div>
                        <div>Angel Investor</div>
                    </label>
                    <label class="user-type-option">
                        <input type="radio" name="userType" value="esg_funder">
                        <div class="icon">🌱</div>
                        <div>ESG Funder</div>
                    </label>
                    <label class="user-type-option">
                        <input type="radio" name="userType" value="corporate_partner">
                        <div class="icon">🏢</div>
                        <div>Corporate</div>
                    </label>
                    <label class="user-type-option">
                        <input type="radio" name="userType" value="government">
                        <div class="icon">🏛️</div>
                        <div>Government</div>
                    </label>
                </div>
            </div>
            
            <button type="submit" class="btn-primary" id="signupBtn">
                Create Account
            </button>
            
            <p class="toggle-mode">
                Already have an account? <a href="#" id="showLogin">Sign In</a>
            </p>
        </form>
        
        <!-- LOGIN FORM -->
        <form id="loginForm" style="display: none;">
            <div class="form-group">
                <label for="loginEmail">Email *</label>
                <input 
                    type="email" 
                    id="loginEmail" 
                    placeholder="your@email.com" 
                    required
                    autocomplete="email"
                >
            </div>
            
            <div class="form-group">
                <label for="loginPassword">Password *</label>
                <input 
                    type="password" 
                    id="loginPassword" 
                    placeholder="Your password" 
                    required
                    autocomplete="current-password"
                >
            </div>
            
            <button type="submit" class="btn-primary" id="loginBtn">
                Sign In
            </button>
            
            <p class="toggle-mode">
                Don't have an account? <a href="#" id="showSignup">Get Started</a>
            </p>
        </form>
    </div>
</div>

<script>
// Configuration - UPDATE THESE AFTER DEPLOYMENT
const AUTH_API = 'YOUR_AUTH_LAMBDA_FUNCTION_URL'; // e.g., https://abc123.lambda-url.us-east-1.on.aws

// Elements
const modal = document.getElementById('authModal');
const loginBtnNav = document.getElementById('loginBtn');
const getStartedBtn = document.getElementById('getStartedBtn');
const closeBtn = document.querySelector('.close');
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
const showLogin = document.getElementById('showLogin');
const showSignup = document.getElementById('showSignup');
const modalTitle = document.getElementById('modalTitle');
const errorMessage = document.getElementById('errorMessage');
const signupBtn = document.getElementById('signupBtn');
const loginBtn = document.getElementById('loginBtn');

// User type selection
document.querySelectorAll('.user-type-option').forEach(option => {
    option.addEventListener('click', function() {
        document.querySelectorAll('.user-type-option').forEach(o => 
            o.classList.remove('selected')
        );
        this.classList.add('selected');
        this.querySelector('input[type="radio"]').checked = true;
    });
});

// Open signup modal
getStartedBtn.addEventListener('click', () => {
    modal.style.display = 'block';
    signupForm.style.display = 'block';
    loginForm.style.display = 'none';
    modalTitle.textContent = 'Get Started';
    hideError();
});

// Open login modal
loginBtnNav.addEventListener('click', () => {
    modal.style.display = 'block';
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
    modalTitle.textContent = 'Sign In';
    hideError();
});

// Close modal
closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target == modal) {
        modal.style.display = 'none';
    }
});

// Toggle forms
showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
    modalTitle.textContent = 'Sign In';
    hideError();
});

showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.style.display = 'block';
    loginForm.style.display = 'none';
    modalTitle.textContent = 'Get Started';
    hideError();
});

// Handle signup
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    const fullName = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const userType = document.querySelector('input[name="userType"]:checked')?.value;
    
    if (!userType) {
        showError('Please select a user type');
        return;
    }
    
    // Disable button
    signupBtn.disabled = true;
    signupBtn.textContent = 'Creating account...';
    
    try {
        const response = await fetch(`${AUTH_API}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullName,
                email,
                password,
                userType
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store auth data
            localStorage.setItem('auxeira_auth_token', data.token);
            localStorage.setItem('auxeira_user', JSON.stringify(data.user));
            
            // Redirect to dashboard
            redirectToDashboard(data.user.userType);
        } else {
            showError(data.error || 'Signup failed. Please try again.');
            signupBtn.disabled = false;
            signupBtn.textContent = 'Create Account';
        }
    } catch (error) {
        console.error('Signup error:', error);
        showError('Connection error. Please check your internet and try again.');
        signupBtn.disabled = false;
        signupBtn.textContent = 'Create Account';
    }
});

// Handle login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    // Disable button
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';
    
    try {
        const response = await fetch(`${AUTH_API}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store auth data
            localStorage.setItem('auxeira_auth_token', data.token);
            localStorage.setItem('auxeira_user', JSON.stringify(data.user));
            
            // Redirect to dashboard
            redirectToDashboard(data.user.userType);
        } else {
            showError(data.error || 'Login failed. Please try again.');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Connection error. Please check your internet and try again.');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
    }
});

// Redirect to appropriate dashboard
function redirectToDashboard(userType) {
    const routes = {
        'startup_founder': '/startup_founder.html',
        'venture_capital': '/venture_capital.html',
        'angel_investor': '/angel_investor.html',
        'corporate_partner': '/corporate_partner.html',
        'government': '/government.html',
        'esg_funder': '/esg_funder.html',
        'impact_investor': '/impact_investor.html',
        'admin': '/admin/dashboard.html'
    };
    
    const route = routes[userType] || '/startup_founder.html';
    window.location.href = `https://dashboard.auxeira.com${route}`;
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Hide error message
function hideError() {
    errorMessage.style.display = 'none';
}
</script>

10. API Documentation
10.1 Authentication API
Base URL: https://YOUR_AUTH_LAMBDA_URL
POST /signup
Create a new user account.
Request:
httpPOST /signup HTTP/1.1
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "userType": "startup_founder"
}
Response (201 Created):
json{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "email": "john@example.com",
    "userType": "startup_founder",
    "fullName": "John Doe"
  }
}
Error Response (400 Bad Request):
json{
  "error": "Email already registered"
}
Validation Rules:

fullName: Required, non-empty string
email: Required, valid email format
password: Required, minimum 8 characters
userType: Required, one of: startup_founder, venture_capital, angel_investor, esg_funder, corporate_partner, government, impact_investor, admin


POST /login
Authenticate existing user.
Request:
httpPOST /login HTTP/1.1
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
Response (200 OK):
json{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "email": "john@example.com",
    "userType": "startup_founder",
    "fullName": "John Doe"
  }
}
Error Response (401 Unauthorized):
json{
  "error": "Invalid email or password"
}

10.2 Dashboard API
Base URL: https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws
GET /
Get dashboard data for authenticated user.
Request:
httpGET / HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Response (200 OK) - Startup Founder:
json{
  "success": true,
  "data": {
    "startupName": "EdTech Solutions 96",
    "stage": "Pre-Seed",
    "industry": "EdTech",
    "geography": "Asia-Pacific",
    "teamSize": 21,
    "mrr": 380177,
    "mrrGrowth": "+12.6%",
    "burnRate": 150000,
    "runway": 19.3,
    "cashBalance": 2900000,
    "users": 21104,
    "customers": 8441,
    "cac": 127,
    "ltv": 1850,
    "ltvCacRatio": 14.6,
    "churnRate": 5.5,
    "nps": 68.6,
    "sseScore": 62,
    "interviewsCompleted": 15,
    "activitiesThisMonth": 6,
    "milestonesCompleted": 3,
    "recentMilestones": [
      "Achieved $380.2K MRR",
      "Reached 8,441 customers",
      "Completed 15 customer interviews"
    ],
    "activeChallenges": [
      "Churn rate above target (5.5% vs 2-3% target)",
      "CAC needs optimization"
    ],
    "lastUpdated": "2025-11-03T21:32:39.590Z",
    "dataSource": "dynamodb"
  },
  "userType": "startup_founder"
}
Error Response (401 Unauthorized):
json{
  "error": "Unauthorized - Invalid or expired token"
}
Error Response (404 Not Found):
json{
  "error": "User data not found"
}
```

---

### 10.3 JWT Token Format

**Token Structure:**
```
Header.Payload.Signature
Decoded Payload:
json{
  "userId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "email": "john@example.com",
  "userType": "startup_founder",
  "fullName": "John Doe",
  "iat": 1699027200,
  "exp": 1699632000
}
Expiration: 7 days from issuance
Verification:

Algorithm: HS256
Secret: JWT_SECRET environment variable
Validate signature
Check expiration date


11. Testing Guide
11.1 End-to-End Testing Script
File: scripts/test-deployment.sh
bash#!/bin/bash
# Complete end-to-end testing for Auxeira deployment

set -e

AUTH_API="YOUR_AUTH_LAMBDA_URL"
DASHBOARD_API="https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws"

echo "=== Auxeira Deployment Testing ==="
echo ""

# Test 1: Health check
echo "1. Testing auth API health..."
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$AUTH_API/health" || echo "000")
if [ "$AUTH_STATUS" = "404" ] || [ "$AUTH_STATUS" = "200" ]; then
    echo "✅ Auth API reachable"
else
    echo "❌ Auth API not reachable (HTTP $AUTH_STATUS)"
    exit 1
fi

# Test 2: Signup
echo ""
echo "2. Testing user signup..."
TEST_EMAIL="test-$(date +%s)@example.com"
SIGNUP_RESPONSE=$(curl -s -X POST "$AUTH_API/signup" \
    -H "Content-Type: application/json" \
    -d '{
        "fullName": "Test User",
        "email": "'$TEST_EMAIL'",
        "password": "Test1234!",
        "userType": "startup_founder"
    }')

TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.token')
if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo "✅ Signup successful"
    echo "   Token: ${TOKEN:0:20}..."
else
    echo "❌ Signup failed"
    echo "   Response: $SIGNUP_RESPONSE"
    exit 1
fi

# Test 3: Login
echo ""
echo "3. Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_API/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "'$TEST_EMAIL'",
        "password": "Test1234!"
    }')

LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
if [ "$LOGIN_TOKEN" != "null" ] && [ -n "$LOGIN_TOKEN" ]; then
    echo "✅ Login successful"
else
    echo "❌ Login failed"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi

# Test 4: Dashboard access with token
echo ""
echo "4. Testing dashboard API with auth..."
DASHBOARD_RESPONSE=$(curl -s "$DASHBOARD_API" \
    -H "Authorization: Bearer $TOKEN")

SUCCESS=$(echo "$DASHBOARD_RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    echo "✅ Dashboard API working"
    SSE_SCORE=$(echo "$DASHBOARD_RESPONSE" | jq -r '.data.sseScore')
    echo "   SSE Score: $SSE_SCORE"
else
    echo "❌ Dashboard API failed"
    echo "   Response: $DASHBOARD_RESPONSE"
fi

# Test 5: Test with existing user
echo ""
echo "5. Testing with test user..."
TEST_USER_RESPONSE=$(curl -s "$DASHBOARD_API?userId=045b4095-3388-4ea6-8de3-b7b04be5bc1b")

TEST_SUCCESS=$(echo "$TEST_USER_RESPONSE" | jq -r '.success')
if [ "$TEST_SUCCESS" = "true" ]; then
    echo "✅ Test user data loading"
    COMPANY=$(echo "$TEST_USER_RESPONSE" | jq -r '.data.startupName')
    echo "   Company: $COMPANY"
else
    echo "❌ Test user data failed"
fi

# Test 6: Check DynamoDB tables
echo ""
echo "6. Checking DynamoDB tables..."
TABLES=$(aws dynamodb list-tables --query 'TableNames' --output text)
if [[ $TABLES == *"auxeira-users-prod"* ]]; then
    echo "✅ DynamoDB tables exist"
else
    echo "❌ DynamoDB tables missing"
fi

# Test 7: Check S3 buckets
echo ""
echo "7. Checking S3 buckets..."
BUCKETS=$(aws s3 ls | grep auxeira || echo "")
if [[ -n $BUCKETS ]]; then
    echo "✅ S3 buckets exist"
else
    echo "❌ S3 buckets missing"
fi

# Test 8: Check frontend accessibility
echo ""
echo "8. Testing frontend accessibility..."
MARKETING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://auxeira.com")
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://dashboard.auxeira.com/startup_founder.html")

if [ "$MARKETING_STATUS" = "200" ]; then
    echo "✅ Marketing site accessible"
else
    echo "⚠️  Marketing site returned HTTP $MARKETING_STATUS"
fi

if [ "$DASHBOARD_STATUS" = "200" ]; then
    echo "✅ Dashboard accessible"
else
    echo "⚠️  Dashboard returned HTTP $DASHBOARD_STATUS"
fi

echo ""
echo "=== Testing Complete ==="
echo ""
echo "Summary:"
echo "  Auth API: ✅"
echo "  Signup: ✅"
echo "  Login: ✅"
echo "  Dashboard API: ✅"
echo "  Database: ✅"
echo "  Frontend: ✅"
Usage:
bashchmod +x scripts/test-deployment.sh
./scripts/test-deployment.sh
```

---

### 11.2 Manual Testing Checklist

**Test Account Credentials:**
```
Email: founder@test.com
Password: Test1234!
Type: Startup Founder

Email: vc@test.com
Password: Test1234!
Type: Venture Capital

Email: admin@auxeira.com
Password: Admin1234!
Type: Admin
Test Steps:

Signup Flow:

 Visit https://auxeira.com
 Click "Get Started"
 Fill signup form with new email
 Select user type
 Submit form
 Verify redirect to correct dashboard
 Verify dashboard loads data


Login Flow:

 Visit https://auxeira.com
 Click "Sign In"
 Enter test credentials
 Submit form
 Verify redirect to correct dashboard
 Verify dashboard shows real data


Dashboard Data:

 Verify SSE score displays (should be 62 for test user)
 Verify MRR displays ($380.2K for test user)
 Verify all metrics calculated correctly
 Check browser console for errors
 Verify API response shows dataSource: "dynamodb"


Error Handling:

 Try login with wrong password (should show error)
 Try signup with existing email (should show error)
 Try accessing dashboard without token (should redirect)
 Try signup with weak password (should show error)


Browser Compatibility:

 Chrome (latest)
 Firefox (latest)
 Safari (latest)
 Edge (latest)
 Mobile Safari (iOS)
 Mobile Chrome (Android)




12. Monitoring & Maintenance
12.1 CloudWatch Logs
View Lambda Logs:
bash# Auth handler logs
aws logs tail /aws/lambda/auxeira-auth-handler --follow

# Dashboard handler logs
aws logs tail /aws/lambda/auxeira-dashboard-context-prod --follow

# Filter for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/auxeira-auth-handler \
  --filter-pattern "ERROR"

12.2 Monitoring Metrics
Key Metrics to Monitor:

Lambda Invocations

bashaws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=auxeira-auth-handler \
  --start-time 2025-11-03T00:00:00Z \
  --end-time 2025-11-03T23:59:59Z \
  --period 3600 \
  --statistics Sum

Lambda Errors

bashaws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=auxeira-auth-handler \
  --start-time 2025-11-03T00:00:00Z \
  --end-time 2025-11-03T23:59:59Z \
  --period 3600 \
  --statistics Sum

DynamoDB Consumed Capacity

bashaws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=auxeira-users-prod \
  --start-time 2025-11-03T00:00:00Z \
  --end-time 2025-11-03T23:59:59Z \
  --period 3600 \
  --statistics Sum

12.3 Backup Strategy
DynamoDB Backups:
bash# Enable point-in-time recovery
aws dynamodb update-continuous-backups \
  --table-name auxeira-users-prod \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

# Create on-demand backup
aws dynamodb create-backup \
  --table-name auxeira-users-prod \
  --backup-name auxeira-users-backup-$(date +%Y%m%d)

# List backups
aws dynamodb list-backups \
  --table-name auxeira-users-prod
Automated Backup Script:
bash#!/bin/bash
# Backup all Auxeira DynamoDB tables

TABLES=(
  "auxeira-users-prod"
  "auxeira-user-startup-mapping-prod"
  "auxeira-startup-profiles-prod"
  "auxeira-startup-activities-prod"
)

DATE=$(date +%Y%m%d-%H%M%S)

for TABLE in "${TABLES[@]}"; do
  echo "Backing up $TABLE..."
  aws dynamodb create-backup \
    --table-name $TABLE \
    --backup-name "${TABLE}-backup-${DATE}"
  echo "✅ $TABLE backed up"
done
Schedule with Cron:
bash# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup-dynamodb.sh

12.4 Cost Monitoring
View Current Month Costs:
bashaws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
Set up Billing Alerts:
bash# Create SNS topic for alerts
aws sns create-topic --name auxeira-billing-alerts

# Subscribe email to topic
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:auxeira-billing-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Create CloudWatch alarm
aws cloudwatch put-metric-alarm \
  --alarm-name auxeira-monthly-cost-alert \
  --alarm-description "Alert when monthly cost exceeds $100" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:auxeira-billing-alerts

13. Security Considerations
13.1 Security Checklist

 JWT Secret: Use strong, random 32+ character secret
 Password Hashing: bcrypt with salt rounds 10+
 HTTPS Only: All traffic encrypted (CloudFront enforces)
 Input Validation: All Lambda functions validate input
 SQL Injection: Not applicable (NoSQL DynamoDB)
 XSS Protection: Sanitize user input in frontend
 CORS: Properly configured on Lambda Function URLs
 IAM Roles: Least privilege principle
 Secrets Management: JWT_SECRET in environment variables
 API Rate Limiting: Consider adding (future)
 Logging: No sensitive data in logs
 Token Expiration: 7 days, implement refresh if needed

13.2 Security Best Practices
1. Rotate JWT Secret Regularly:
bash# Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# Update Lambda environment
aws lambda update-function-configuration \
  --function-name auxeira-auth-handler \
  --environment "Variables={JWT_SECRET=$NEW_SECRET}"

aws lambda update-function-configuration \
  --function-name auxeira-dashboard-context-prod \
  --environment "Variables={JWT_SECRET=$NEW_SECRET}"

# Force all users to re-login (tokens invalidated)
2. Monitor Failed Login Attempts:
bash# Query CloudWatch for failed logins
aws logs filter-log-events \
  --log-group-name /aws/lambda/auxeira-auth-handler \
  --filter-pattern "Invalid email or password" \
  --start-time $(date -u -d '1 hour ago' +%s)000
3. Review IAM Permissions:
bash# List policies attached to Lambda role
aws iam list-attached-role-policies \
  --role-name AuxeiraLambdaExecutionRole

# Review inline policies
aws iam get-role-policy \
  --role-name AuxeiraLambdaExecutionRole \
  --policy-name AuxeiraDynamoDBAccess

14. Cost Analysis
14.1 Monthly Cost Estimate
Based on 1,000 active users:
ServiceUsageCostDynamoDB- Storage (1 GB)1 GB$0.25- Read requests (1M/month)1,000,000$0.25- Write requests (100K/month)100,000$1.25Lambda- Auth invocations (50K/month)50,000 @ 512MB, 2s avg$2.08- Dashboard invocations (500K/month)500,000 @ 512MB, 1s avg$8.34S3- Storage (1 GB)1 GB$0.023- Requests (100K GET)100,000$0.04CloudFront- Data transfer (50 GB)50 GB$4.25- Requests (1M)1,000,000$0.75TOTAL~$17/month
At 10,000 users: ~$85/month
At 100,000 users: ~$650/month
Cost Optimization Tips:

DynamoDB: Use on-demand billing (already implemented)
Lambda: Optimize cold starts, reduce memory if possible
S3: Enable S3 Intelligent-Tiering for older files
CloudFront: Use cache effectively to reduce origin requests


15. Troubleshooting
15.1 Common Issues
Issue: "Email already registered" on signup
Cause: Email exists in database
Solution:
bash# Check if email exists
aws dynamodb query \
  --table-name auxeira-users-prod \
  --index-name email-index \
  --key-condition-expression "email = :email" \
  --expression-attribute-values '{":email":{"S":"test@example.com"}}'

# Delete user if needed (testing only)
aws dynamodb delete-item \
  --table-name auxeira-users-prod \
  --key '{"userId":{"S":"USER_ID_HERE"}}'

Issue: "Invalid email or password" on login
Causes:

Wrong credentials
User doesn't exist
Password hash mismatch

Debugging:
bash# Check if user exists
aws dynamodb query \
  --table-name auxeira-users-prod \
  --index-name email-index \
  --key-condition-expression "email = :email" \
  --expression-attribute-values '{":email":{"S":"test@example.com"}}'

# Check Lambda logs for bcrypt errors
aws logs tail /aws/lambda/auxeira-auth-handler --follow | grep -i error

Issue: "Unauthorized" on dashboard API
Causes:

Token expired (> 7 days old)
Invalid token signature
JWT_SECRET mismatch between functions

Solution:
bash# Verify JWT_SECRET matches on both Lambdas
aws lambda get-function-configuration \
  --function-name auxeira-auth-handler \
  --query 'Environment.Variables.JWT_SECRET'

aws lambda get-function-configuration \
  --function-name auxeira-dashboard-context-prod \
  --query 'Environment.Variables.JWT_SECRET'

# If different, update to match

Issue: Dashboard shows "SSE Score: 0" instead of real data
Causes:

User not linked to startup
Startup data missing
API returning null

Debugging:
bash# Check user-startup mapping
aws dynamodb get-item \
  --table-name auxeira-user-startup-mapping-prod \
  --key '{"userId":{"S":"USER_ID_HERE"}}'

# Check startup profile
aws dynamodb get-item \
  --table-name auxeira-startup-profiles-prod \
  --key '{"startupId":{"S":"STARTUP_ID_HERE"}}'

# Check Lambda logs
aws logs tail /aws/lambda/auxeira-dashboard-context-prod --follow

Issue: CloudFront serves old content
Solution:
bash# Create invalidation
aws cloudfront create-invalidation \
  --distribution-id E1L1Q8VK3LAEFC \
  --paths "/*"

# Wait for completion
aws cloudfront wait invalidation-completed \
  --distribution-id E1L1Q8VK3LAEFC \
  --id INVALIDATION_ID

# If still not working, check cache policy
aws cloudfront get-distribution-config \
  --id E1L1Q8VK3LAEFC \
  --query 'DistributionConfig.DefaultCacheBehavior.CachePolicyId'

Issue: "GSI email-index not found"
Cause: Global Secondary Index not created
Solution:
bash# Create GSI
aws dynamodb update-table \
  --table-name auxeira-users-prod \
  --attribute-definitions AttributeName=email,AttributeType=S \
  --global-secondary-index-updates \
    '[{
      "Create": {
        "IndexName": "email-index",
        "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}],
        "Projection": {"ProjectionType": "ALL"}
      }
    }]'

# Wait for index to be active (5-10 minutes)
aws dynamodb wait table-exists --table-name auxeira-users-prod

15.2 Debug Mode
Enable Verbose Logging:
Update Lambda functions to include detailed logs:
javascript// Add at the start of your handler
const DEBUG = process.env.DEBUG === 'true';

function log(...args) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}

// Use throughout code
log('User object:', user);
log('Query params:', queryParams);
Enable debug mode:
bashaws lambda update-function-configuration \
  --function-name auxeira-auth-handler \
  --environment "Variables={JWT_SECRET=$JWT_SECRET,DEBUG=true}"

16. Future Roadmap
16.1 Phase 2 (Next 2-4 weeks)
High Priority:

 Deploy auth_handler Lambda
 Add email GSI to users table
 Update all 6 main dashboard files
 Create admin panel
 Add password reset functionality
 Implement email verification

Medium Priority:

 Add API Gateway (replace Function URLs)
 Implement rate limiting
 Add user profile editing
 Create user settings page
 Add multi-factor authentication (MFA)


16.2 Phase 3 (1-2 months)
Features:

 Advanced analytics dashboards
 Export data to PDF/Excel
 Team collaboration features
 Real-time notifications
 Mobile app (React Native)
 Integrations (Stripe, Salesforce, etc.)

Technical:

 API versioning
 GraphQL API option
 WebSocket for real-time updates
 Redis caching layer
 ElasticSearch for advanced search


16.3 Phase 4 (3-6 months)
Enterprise Features:

 SSO (SAML, OAuth)
 Custom branding/white-labeling
 Advanced permissions (RBAC)
 Audit logs
 Data residency options
 SLA guarantees

Scaling:

 Multi-region deployment
 Read replicas for DynamoDB
 CDN edge functions
 Automated failover
 Load testing & optimization


Appendix A: Quick Reference
Environment Variables
bash# Auth Handler
JWT_SECRET=your-secret-key-min-32-chars
NODE_ENV=production

# Dashboard Handler
JWT_SECRET=your-secret-key-min-32-chars
```

### AWS Resource IDs
```
CloudFront Distributions:
- Marketing: E1O2Q0Z86U0U5T
- Dashboard: E1L1Q8VK3LAEFC

S3 Buckets:
- Marketing: auxeira.com
- Dashboard: auxeira-dashboards-jsx-1759943238

Lambda Functions:
- Auth: auxeira-auth-handler (TO DEPLOY)
- Dashboard: auxeira-dashboard-context-prod (DEPLOYED)

DynamoDB Tables:
- auxeira-users-prod
- auxeira-user-startup-mapping-prod
- auxeira-startup-profiles-prod
- auxeira-startup-activities-prod

IAM Role:
- AuxeiraLambdaExecutionRole
Useful Commands
bash# View logs
aws logs tail /aws/lambda/auxeira-dashboard-context-prod --follow

# Deploy frontend
./scripts/deploy-frontend.sh

# Test API
./scripts/test-deployment.sh

# Backup database
./scripts/backup-dynamodb.sh

# View costs
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics BlendedCost

Appendix B: Contact Information
Repository: https://github.com/bursarynetwork007/auxeira-backend
Issues: https://github.com/bursarynetwork007/auxeira-backend/issues
AWS Support:

Console: https://console.aws.amazon.com
Documentation: https://docs.aws.amazon.com

Key Documentation:

DynamoDB: https://docs.aws.amazon.com/dynamodb
Lambda: https://docs.aws.amazon.com/lambda
CloudFront: https://docs.aws.amazon.com/cloudfront
S3: https://docs.aws.amazon.com/s3


Document Changelog
VersionDateAuthorChanges1.0Nov 3, 2025AI AssistantInitial Phase 1 documentation2.0Nov 3, 2025AI AssistantAdded Phase 2 auth flow2.1Nov 3, 2025AI AssistantComplete developer handoff

END OF DOCUMENT
This documentation provides everything a new developer needs to understand, deploy, maintain, and extend the Auxeira platform. For questions or issues, please open a GitHub issue or refer to the AWS documentation links provided.
