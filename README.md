# Auxeira - The Bloomberg Terminal for Entrepreneurship

**Autonomous AI-blockchain platform reducing startup failure rates by 50% through behavioral economics, verified performance data, and strategic ecosystem partnerships.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/bursarynetwork007/auxeira-backend.git
cd auxeira-backend

# Install dependencies
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start the server
npm run server

# Visit the application
# Main site: http://localhost:3000
# Dashboard: http://localhost:3000/dashboard/startup/
```

---

## 📁 Repository Structure

```
auxeira-backend/
├── backend/                    # Backend server and API
│   ├── server.js              # Express server with secure API endpoints
│   ├── package.json           # Dependencies and scripts
│   ├── .env.example           # Environment variables template
│   └── .gitignore             # Git ignore rules
│
├── frontend/                   # Main landing page (auxeira.com)
│   └── index.html             # Marketing site with auth modal
│
├── dashboard/                  # Dashboard application (dashboard.auxeira.com)
│   ├── startup/               # Startup founder dashboard
│   │   └── index.html         # Main dashboard page
│   ├── vc/                    # Venture capital dashboard (coming soon)
│   ├── angel/                 # Angel investor dashboard (coming soon)
│   ├── corporate/             # Corporate partner dashboard (coming soon)
│   ├── government/            # Government dashboard (coming soon)
│   ├── esg/                   # ESG funder dashboard (coming soon)
│   └── utils/                 # Shared utilities
│       └── auth-guard.js      # Authentication protection
│
└── docs/                       # Documentation
    └── DEPLOYMENT.md          # Deployment guide
```

---

## 🔐 Security Enhancements

### ✅ What We Fixed

1. **Removed All Hardcoded API Keys**
   - ❌ Before: API keys exposed in 20+ HTML files
   - ✅ After: All keys managed server-side via environment variables

2. **Implemented Authentication Flow**
   - Users must sign up/sign in at auxeira.com
   - JWT token-based authentication
   - Protected dashboard routes
   - Session management

3. **Secure Backend API**
   - All sensitive operations handled server-side
   - Rate limiting to prevent abuse
   - CORS protection
   - Helmet.js security headers
   - Environment-based configuration

4. **Payment Security**
   - Paystack public key fetched from backend
   - Payment initialization handled server-side
   - No secret keys exposed to frontend

---

## 🏗️ Architecture

### Authentication Flow

```
User visits auxeira.com (frontend/index.html)
         ↓
Clicks "Login" or "Get Started"
         ↓
Auth modal opens (Sign In / Sign Up)
         ↓
User authenticates via:
  - Email/Password
  - Google OAuth
  - LinkedIn OAuth
         ↓
Backend validates credentials
         ↓
JWT token + user data stored
         ↓
Redirects to dashboard based on user type:
  - Startup Founder → /dashboard/startup/
  - VC → /dashboard/vc/
  - Angel → /dashboard/angel/
  - Corporate → /dashboard/corporate/
  - Government → /dashboard/government/
  - ESG → /dashboard/esg/
         ↓
auth-guard.js protects dashboard pages
         ↓
Unauthorized users redirected to login
```

### API Architecture

```
Frontend (HTML/JS)
      ↓
API Calls (/api/*)
      ↓
Backend Server (Express)
      ↓
External Services:
  - Paystack (payments)
  - OpenAI (AI features)
  - Database (user data)
  - Blockchain (verification)
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Payment Integration (Paystack)
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here

# AI Features (OpenAI)
OPENAI_API_KEY=sk-your-openai-key-here

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_BLOCKCHAIN=false
ENABLE_ANALYTICS=true

# Database (when ready)
DATABASE_URL=postgresql://user:password@localhost:5432/auxeira
```

### Required API Keys

1. **Paystack** (Payment Processing)
   - Sign up at https://paystack.com
   - Get your test keys from dashboard
   - Add to `.env` file

2. **OpenAI** (AI Features)
   - Sign up at https://platform.openai.com
   - Create API key
   - Add to `.env` file

3. **Google OAuth** (Social Login)
   - Create project at https://console.cloud.google.com
   - Enable Google+ API
   - Create OAuth 2.0 credentials

4. **LinkedIn OAuth** (Social Login)
   - Create app at https://www.linkedin.com/developers
   - Get Client ID and Secret

---

## 🚀 Deployment

### Development

```bash
cd backend
npm install
npm run server:dev  # Uses nodemon for auto-reload
```

### Production

```bash
# Set environment to production
export NODE_ENV=production

# Install production dependencies only
cd backend
npm install --production

# Start server
npm run server

# Or use PM2 for process management
npm install -g pm2
pm2 start server.js --name auxeira-backend
pm2 save
pm2 startup
```

### Domain Configuration

**For Production Deployment:**

1. **Main Site (auxeira.com)**
   - Point to `frontend/index.html`
   - Serve static files

2. **Dashboard (dashboard.auxeira.com)**
   - Point to `dashboard/` directory
   - Serve through backend server

3. **API (api.auxeira.com)**
   - Point to backend server
   - Configure reverse proxy (nginx/Apache)

**Example Nginx Configuration:**

```nginx
# Main site
server {
    listen 80;
    server_name auxeira.com www.auxeira.com;
    root /var/www/auxeira/frontend;
    index index.html;
}

# Dashboard
server {
    listen 80;
    server_name dashboard.auxeira.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# API
server {
    listen 80;
    server_name api.auxeira.com;
    
    location / {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

---

## 📊 Features

### Implemented ✅

- [x] Landing page with authentication modal
- [x] Sign In / Sign Up functionality
- [x] Social login (Google, LinkedIn)
- [x] Startup Founder Dashboard (fully functional)
- [x] Authentication guard for protected routes
- [x] Secure backend API
- [x] Payment integration (Paystack)
- [x] Environment-based configuration
- [x] Rate limiting and security headers

### Coming Soon 🚧

- [ ] VC Dashboard
- [ ] Angel Investor Dashboard
- [ ] Corporate Partner Dashboard
- [ ] Government Dashboard
- [ ] ESG Funder Dashboard
- [ ] Database integration
- [ ] Blockchain verification
- [ ] AI-powered insights
- [ ] Email verification
- [ ] Password reset
- [ ] Two-factor authentication

---

## 🛠️ Development

### Adding a New Dashboard

1. Create directory: `dashboard/[type]/`
2. Copy template from `dashboard/startup/index.html`
3. Customize for user type
4. Update `auth-guard.js` dashboard map
5. Update backend redirect logic

### API Endpoints

```
GET  /api/health                          # Health check
GET  /api/config/public                   # Public configuration
GET  /api/config/paystack-public-key      # Paystack public key
GET  /api/user/profile                    # User profile
GET  /api/dashboard/:type                 # Dashboard data
POST /api/ai/generate                     # AI content generation
POST /api/payment/initialize              # Payment initialization
```

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📧 Contact

- **Website:** https://auxeira.com
- **Email:** hello@auxeira.com
- **GitHub:** https://github.com/bursarynetwork007/auxeira-backend

---

## 🙏 Acknowledgments

- Built with behavioral economics principles from Thaler, Ariely, and Kahneman
- Inspired by Bloomberg Terminal's data-driven approach
- Powered by modern web technologies and AI

---

**Made with ❤️ by the Auxeira Team**

