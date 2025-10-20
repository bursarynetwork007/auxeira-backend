# Auxeira Platform - Complete Deployment Architecture

## 🌐 Domain Structure & User Flow

### **Production Domains**

```
auxeira.com                    → Marketing website (landing page)
dashboard.auxeira.com          → User dashboards (after authentication)
api.auxeira.com                → Backend API server
```

---

## 👤 Complete User Journey

### **Step-by-Step Flow**

```
1. User visits auxeira.com
   └─ Lands on marketing page (frontend/index.html)
   
2. User clicks "Login" or "Get Started"
   └─ Authentication modal opens
   
3. Auth modal displays:
   ├─ Sign In tab (existing users)
   └─ Sign Up tab (new users)
   
4. User authenticates via:
   ├─ Email/Password
   ├─ Google OAuth
   └─ LinkedIn OAuth
   
5. Frontend sends credentials to backend:
   POST https://api.auxeira.com/auth/login
   POST https://api.auxeira.com/auth/signup
   
6. Backend validates credentials:
   ├─ Checks database
   ├─ Generates JWT token
   └─ Returns user data + token
   
7. Frontend stores authentication:
   ├─ localStorage.setItem('authToken', token)
   ├─ localStorage.setItem('userData', JSON.stringify(user))
   └─ sessionStorage (if "Remember me" unchecked)
   
8. Frontend redirects based on user type:
   ├─ Startup Founder    → https://dashboard.auxeira.com/startup/
   ├─ VC                 → https://dashboard.auxeira.com/vc/
   ├─ Angel Investor     → https://dashboard.auxeira.com/angel/
   ├─ Corporate Partner  → https://dashboard.auxeira.com/corporate/
   ├─ Government         → https://dashboard.auxeira.com/government/
   └─ ESG Funder         → https://dashboard.auxeira.com/esg-investor/
   
9. Dashboard loads:
   ├─ auth-guard.js checks for valid token
   ├─ If valid → Load dashboard with real data
   └─ If invalid → Redirect back to auxeira.com
```

---

## 🏗️ Architecture Components

### **1. Marketing Website (auxeira.com)**

**Location:** `frontend/` directory

**Pages:**
- `index.html` - Main landing page with auth modal
- `about.html` - About Auxeira
- `team.html` - Team page
- `partners.html` - Partners
- `careers.html` - Careers
- `insights.html` - Blog/Insights
- `reports.html` - Reports
- `studies.html` - Case studies
- `whitepaper.html` - Whitepaper
- `api.html` - API documentation
- `demo.html` - Product demo
- `press.html` - Press releases
- `privacy.html` - Privacy policy
- `terms.html` - Terms of service

**Authentication Modal:**
```html
<!-- In index.html -->
<div id="authModal">
  <div class="modal-tabs">
    <button class="tab active" data-tab="signin">Sign In</button>
    <button class="tab" data-tab="signup">Sign Up</button>
  </div>
  
  <!-- Sign In Form -->
  <form class="signin-form">
    <input type="email" name="email" required>
    <input type="password" name="password" required>
    <button type="submit">Sign In</button>
    
    <!-- Social Login -->
    <button class="google-login">Continue with Google</button>
    <button class="linkedin-login">Continue with LinkedIn</button>
  </form>
  
  <!-- Sign Up Form -->
  <form class="signup-form">
    <input type="text" name="name" required>
    <input type="email" name="email" required>
    <input type="password" name="password" required>
    <select name="userType" required>
      <option value="startup">Startup Founder</option>
      <option value="vc">Venture Capital</option>
      <option value="angel">Angel Investor</option>
      <option value="corporate">Corporate Partner</option>
      <option value="government">Government</option>
      <option value="esg">ESG Funder</option>
    </select>
    <button type="submit">Create Account</button>
  </form>
</div>
```

---

### **2. Dashboard Application (dashboard.auxeira.com)**

**Location:** `dashboard-optimized/` directory

**Structure:**
```
dashboard-optimized/
├── startup/           → Startup Founder Dashboard
├── vc/                → VC Dashboard
├── angel/             → Angel Investor Dashboard
├── corporate/         → Corporate Partner Dashboard
├── government/        → Government Dashboard
├── esg-investor/      → ESG Investor Dashboard
├── esg-index/         → ESG Index
├── esg-[17 SDGs]/     → 17 SDG-specific dashboards
├── subscription/      → Subscription management
├── partner/           → Partner onboarding
└── utils/             → Shared utilities
    ├── api-client.js      → API communication
    ├── auth-guard.js      → Authentication protection
    └── [feature modules]  → 21 JS modules
```

**Authentication Guard:**
```javascript
// utils/auth-guard.js
(function() {
    const token = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Check if user is authenticated
    if (!token) {
        window.location.href = 'https://auxeira.com';
        return;
    }
    
    // Verify token with backend
    fetch('https://api.auxeira.com/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (!data.valid) {
            localStorage.clear();
            window.location.href = 'https://auxeira.com';
        }
    })
    .catch(() => {
        window.location.href = 'https://auxeira.com';
    });
})();
```

---

### **3. Backend API (api.auxeira.com)**

**Location:** `backend-optimized/` directory

**Server:** Express.js (Node.js)

**Endpoints:**

#### **Authentication**
```javascript
POST   /auth/signup              // Create new account
POST   /auth/login               // Login with credentials
POST   /auth/google              // Google OAuth
POST   /auth/linkedin            // LinkedIn OAuth
GET    /auth/verify              // Verify JWT token
POST   /auth/logout              // Logout
POST   /auth/refresh             // Refresh token
```

#### **Dashboard Data**
```javascript
GET    /api/dashboard/startup    // Startup founder data
GET    /api/dashboard/vc         // VC portfolio data
GET    /api/dashboard/angel      // Angel investor data
GET    /api/dashboard/corporate  // Corporate partner data
GET    /api/dashboard/government // Government data
GET    /api/dashboard/esg/:sdg   // ESG impact by SDG
```

#### **Startup Data**
```javascript
GET    /api/startups             // List all (paginated)
GET    /api/startups/:id         // Single startup
GET    /api/startups/:id/timeseries  // 365-day data
POST   /api/startups             // Create startup
PUT    /api/startups/:id         // Update startup
DELETE /api/startups/:id         // Delete startup
```

#### **Search & Analytics**
```javascript
GET    /api/search?q=query       // Search startups
GET    /api/stats                // Aggregate statistics
GET    /api/analytics/trends     // Market trends
```

#### **Configuration (Secure)**
```javascript
GET    /api/config/paystack-public-key   // Fetch Paystack key
GET    /api/config/features              // Feature flags
```

---

## 🔐 Authentication Flow Implementation

### **Frontend (index.html)**

```javascript
// Authentication handler
document.querySelector('.signin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    try {
        const response = await fetch('https://api.auxeira.com/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store authentication
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userData', JSON.stringify(data.user));
            
            // Redirect based on user type
            const dashboardMap = {
                'startup': '/startup/',
                'vc': '/vc/',
                'angel': '/angel/',
                'corporate': '/corporate/',
                'government': '/government/',
                'esg': '/esg-investor/'
            };
            
            const dashboardPath = dashboardMap[data.user.type];
            window.location.href = `https://dashboard.auxeira.com${dashboardPath}`;
        } else {
            alert('Invalid credentials');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
});
```

### **Backend (server.js)**

```javascript
// Authentication endpoint
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    // Find user in database
    const user = await db.users.findOne({ email });
    
    if (!user) {
        return res.json({ success: false, message: 'User not found' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
        return res.json({ success: false, message: 'Invalid password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
        { userId: user.id, email: user.email, type: user.type },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
    
    // Return token and user data
    res.json({
        success: true,
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            type: user.type
        }
    });
});

// Token verification endpoint
app.get('/auth/verify', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// Middleware to verify JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ valid: false });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ valid: false });
        }
        req.user = user;
        next();
    });
}
```

---

## 🚀 Deployment Configuration

### **AWS Deployment (Recommended)**

#### **Option 1: Single Server (Simple)**

```
EC2 Instance (t3.medium or larger)
├── Nginx
│   ├── auxeira.com → Serve frontend/ files
│   └── dashboard.auxeira.com → Serve dashboard-optimized/ files
│
└── Node.js (PM2)
    └── api.auxeira.com → Run backend-optimized/server.js
```

**Nginx Configuration:**
```nginx
# auxeira.com (Marketing)
server {
    listen 80;
    server_name auxeira.com www.auxeira.com;
    root /var/www/auxeira/frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# dashboard.auxeira.com (Dashboards)
server {
    listen 80;
    server_name dashboard.auxeira.com;
    root /var/www/auxeira/dashboard-optimized;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# api.auxeira.com (Backend API)
server {
    listen 80;
    server_name api.auxeira.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### **Option 2: Scalable (Production)**

```
CloudFront CDN
├── auxeira.com → S3 Bucket (frontend/)
└── dashboard.auxeira.com → S3 Bucket (dashboard-optimized/)

Application Load Balancer
└── api.auxeira.com → ECS/EC2 Auto Scaling Group
                      └── Node.js containers

Database
├── RDS PostgreSQL (user data, startups)
└── ElastiCache Redis (sessions, caching)

Storage
└── S3 (file uploads, backups)
```

---

## 📋 Environment Variables

### **Backend (.env)**

```bash
# Environment
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/auxeira
REDIS_URL=redis://cache.auxeira.com:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRY=7d

# Paystack
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx

# OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
LINKEDIN_CLIENT_ID=xxxxx
LINKEDIN_CLIENT_SECRET=xxxxx

# CORS
CORS_ORIGIN=https://dashboard.auxeira.com,https://auxeira.com

# Email (for notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx

# AWS (if using S3)
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=us-east-1
S3_BUCKET=auxeira-uploads
```

---

## ✅ Deployment Checklist

### **Pre-Deployment**
- [ ] Register domains (auxeira.com, dashboard.auxeira.com, api.auxeira.com)
- [ ] Set up AWS account
- [ ] Create SSL certificates (Let's Encrypt or AWS Certificate Manager)
- [ ] Set up database (PostgreSQL on RDS or self-hosted)
- [ ] Configure environment variables
- [ ] Test authentication flow locally

### **Deployment**
- [ ] Deploy backend to EC2/ECS
- [ ] Deploy frontend to S3 or EC2
- [ ] Deploy dashboards to S3 or EC2
- [ ] Configure Nginx/Load Balancer
- [ ] Set up DNS records
- [ ] Enable SSL/HTTPS
- [ ] Configure CORS
- [ ] Set up monitoring (CloudWatch)

### **Post-Deployment**
- [ ] Test complete user flow (signup → login → dashboard)
- [ ] Verify API endpoints
- [ ] Test authentication on all dashboards
- [ ] Monitor error logs
- [ ] Set up backups
- [ ] Configure CDN caching
- [ ] Performance testing

---

## 🎯 Summary

**Complete User Flow:**
```
auxeira.com (Marketing) 
    → Auth Modal 
    → api.auxeira.com (Backend validates) 
    → dashboard.auxeira.com/[user-type]/ (Dashboard loads)
```

**All Components Ready:**
- ✅ Marketing pages (frontend/)
- ✅ Authentication system
- ✅ 25 dashboards (dashboard-optimized/)
- ✅ Backend API (backend-optimized/)
- ✅ Database (1,000 startups)
- ✅ Security (JWT, auth guards)

**Ready to deploy! 🚀**

