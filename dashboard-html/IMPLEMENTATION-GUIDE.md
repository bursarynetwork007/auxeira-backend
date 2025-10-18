# Auxeira Dashboard AI Enhancement - Implementation Guide

## Quick Start Guide for Developers

This guide will help you implement and customize the AI-enhanced dashboards for Auxeira's SSE platform.

---

## 🎯 Prerequisites

- Node.js 18+ installed
- OpenAI API key (or compatible API)
- Basic knowledge of JavaScript, HTML, CSS
- Understanding of Express.js and REST APIs

---

## 📦 Installation Steps

### Step 1: Clone and Navigate

```bash
cd /path/to/auxeira-backend/dashboard-html
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web server framework
- `cors` - Cross-origin resource sharing
- `openai` - OpenAI API client

### Step 3: Configure Environment

Create a `.env` file:

```bash
# .env file
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
NODE_ENV=development
CACHE_TTL=86400000
```

Or export environment variables:

```bash
export OPENAI_API_KEY="your_key_here"
export PORT=3000
```

### Step 4: Start Backend Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

You should see:
```
Auxeira AI Backend Server running on port 3000
Environment: development
```

### Step 5: Open Dashboards

Open in browser:
- VC Dashboard: `file:///path/to/dashboard-html/vc.html`
- Angel Dashboard: `file:///path/to/dashboard-html/angel_investor.html`

**Note**: For local file access, you may need to:
1. Run a local web server (e.g., `python3 -m http.server 8000`)
2. Or configure browser to allow CORS for local files

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Browser)                       │
│  ┌────────────────┐         ┌──────────────────────┐       │
│  │  vc.html       │         │ angel_investor.html  │       │
│  └────────┬───────┘         └──────────┬───────────┘       │
│           │                            │                    │
│           └────────────┬───────────────┘                    │
│                        │                                    │
│           ┌────────────▼───────────────┐                   │
│           │  auxeira-ai-client.js      │                   │
│           │  (Frontend SDK)            │                   │
│           └────────────┬───────────────┘                   │
│                        │                                    │
│           ┌────────────▼───────────────┐                   │
│           │ sse-causal-inference.js    │                   │
│           │ (Causal Impact Module)     │                   │
│           └────────────────────────────┘                   │
└────────────────────┬───────────────────────────────────────┘
                     │ HTTP/REST API
                     │
┌────────────────────▼───────────────────────────────────────┐
│                Backend (Node.js/Express)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           ai-backend-server.js                       │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │  Endpoint: /generate-content                 │   │  │
│  │  │  - Route requests to appropriate AI model    │   │  │
│  │  │  - Build personalized prompts                │   │  │
│  │  │  - Cache responses (24h TTL)                 │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │  Endpoint: /generate-causal-narrative        │   │  │
│  │  │  - Generate SSE impact narratives            │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬───────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────┐
│                   AI APIs (OpenAI-compatible)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Claude       │  │ NanoGPT-5    │  │ Manus AI     │    │
│  │ (gpt-4.1-    │  │ (gpt-4.1-    │  │ (gpt-4.1-    │    │
│  │  mini)       │  │  nano)       │  │  mini)       │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Customization Guide

### 1. Adding New Dashboard Sections

#### Backend: Update `getPrompt()` function

```javascript
// In ai-backend-server.js
function getPrompt(dashboard, tab, profile, data) {
    const prompts = {
        VC: {
            // ... existing prompts
            
            // Add new section
            newSection: `Generate content for new section with profile ${JSON.stringify(profile)} and data ${JSON.stringify(data)}. Include SSE impact metrics and personalization.`
        }
    };
    
    return prompts[dashboard]?.[tab] || defaultPrompt;
}
```

#### Backend: Update `getBestAI()` function

```javascript
function getBestAI(dashboard, tab) {
    const aiMapping = {
        VC: {
            // ... existing mappings
            newSection: 'gpt-4.1-mini' // Choose appropriate model
        }
    };
    
    return aiMapping[dashboard]?.[tab] || 'gpt-4.1-mini';
}
```

#### Frontend: Add loading function

```javascript
// In vc.html or angel_investor.html
async function loadNewSection() {
    const newSection = document.getElementById('ai-new-section');
    if (!newSection) {
        const targetTab = document.getElementById('target-tab');
        if (targetTab) {
            const section = document.createElement('div');
            section.id = 'ai-new-section';
            section.className = 'row mb-4';
            targetTab.insertBefore(section, targetTab.firstChild);
            
            const data = {
                // Your data here
            };
            
            await auxeiraAI.loadSection('VC', 'newSection', 'ai-new-section', data);
        }
    }
}
```

### 2. Customizing AI Prompts

Edit the prompt templates in `ai-backend-server.js`:

```javascript
const prompts = {
    VC: {
        overview: `You are an AI administrator for Auxeira.com's VC Dashboard.
        
        User Profile: ${JSON.stringify(profile)}
        Data: ${JSON.stringify(data)}
        
        Generate a personalized overview that:
        1. Addresses the user by name (${profile.name})
        2. Highlights metrics aligned with their preferences
        3. Includes SSE causal impact (35% more jobs, 20% better survival)
        4. Uses emotional storytelling
        5. Outputs HTML with glass-card styling
        
        Focus on: ${profile.preferences?.sector || 'technology'} sector
        Investment thesis: ${profile.preferences?.focus || 'growth'}
        
        Output format: HTML with Chart.js visualizations`
    }
};
```

### 3. Modifying SSE Impact Metrics

Edit `sse-causal-inference.js`:

```javascript
class SSECausalInference {
    constructor() {
        this.impactMetrics = {
            jobsUplift: 0.35,        // Change to your metrics
            survivalUplift: 0.20,
            fundingEfficiency: 0.28,
            revenueGrowth: 0.42,
            esgScore: 0.25
        };
    }
    
    // Customize calculation methods
    calculateSSEImpact(baseline) {
        // Your custom logic here
    }
}
```

### 4. Styling Customization

The dashboards use CSS custom properties for easy theming:

```css
:root {
    --primary-bg: #0a0a0a;
    --secondary-bg: #1a1a1a;
    --accent-blue: #3b82f6;
    --accent-purple: #8b5cf6;
    --accent-green: #10b981;
    /* Modify these to change the theme */
}
```

### 5. User Profile Management

#### Mock Profile (Development)

```javascript
// In ai-backend-server.js
app.get('/user-profile', async (req, res) => {
    const mockProfile = {
        type: 'VC',
        name: 'Sarah Chen',
        preferences: {
            sector: 'AI & Machine Learning',
            geography: 'US',
            stage: 'Series A-B',
            irrTarget: 25
        },
        subscriptionTier: 'premium'
    };
    
    res.json(mockProfile);
});
```

#### Production Profile (Database)

```javascript
// Connect to your database
const { db } = require('./database');

app.get('/user-profile', async (req, res) => {
    const userId = req.headers['x-user-id']; // From auth middleware
    
    const profile = await db.collection('users').findOne({ _id: userId });
    
    res.json(profile);
});
```

---

## 🎨 Design Patterns

### 1. Glass Morphism Cards

```html
<div class="glass-card p-4">
    <h4>Your Content</h4>
    <p>Glass morphism effect with blur and transparency</p>
</div>
```

### 2. Metric Cards

```html
<div class="metric-card text-center">
    <div class="metric-value text-success">$125M</div>
    <div class="metric-label">Portfolio Value</div>
</div>
```

### 3. Signal Badges

```html
<span class="signal-badge signal-strong-buy">Strong Buy</span>
<span class="signal-badge signal-hold">Hold</span>
<span class="signal-badge signal-sell">Sell</span>
```

### 4. Causal Impact Display

```html
<div class="causal-impact p-3">
    <h6 class="text-success">With SSE</h6>
    <p>35% more jobs created</p>
</div>

<div class="counterfactual p-3">
    <h6 class="text-muted">Without SSE</h6>
    <p>Baseline performance</p>
</div>
```

---

## 📊 Data Flow Examples

### Example 1: Loading Portfolio Overview

```javascript
// 1. Frontend triggers load
await auxeiraAI.loadSection('VC', 'overview', 'ai-overview-section', {
    portfolioValue: '$125M',
    irr: 28.5,
    moic: 3.2
});

// 2. Client makes API request
POST /generate-content
{
    "dashboard": "VC",
    "tab": "overview",
    "profile": { "type": "VC", "name": "Sarah Chen" },
    "data": { "portfolioValue": "$125M", "irr": 28.5 }
}

// 3. Backend generates prompt
const prompt = getPrompt('VC', 'overview', profile, data);

// 4. Backend calls AI
const content = await callAI('gpt-4.1-mini', prompt);

// 5. Backend returns HTML
{
    "html": "<div class='glass-card'>...</div>",
    "model": "gpt-4.1-mini"
}

// 6. Frontend renders content
element.innerHTML = content.html;
```

### Example 2: Generating Causal Narrative

```javascript
// 1. Frontend calls causal inference
const narrative = await auxeiraAI.generateCausalNarrative(
    'CloudSecure AI',
    { jobs: 25, revenue: 2000000, survival_probability: 0.65 },
    { jobs: 34, revenue: 2700000, survival_probability: 0.85 }
);

// 2. Client makes API request
POST /generate-causal-narrative
{
    "companyName": "CloudSecure AI",
    "baselineMetrics": { "jobs": 25, ... },
    "sseMetrics": { "jobs": 34, ... },
    "userProfile": { "type": "VC", ... }
}

// 3. Backend generates narrative
const prompt = `Generate causal narrative showing SSE impact...`;
const content = await callAI('gpt-4.1-mini', prompt);

// 4. Frontend displays in modal
modalBody.innerHTML = narrative;
modal.show();
```

---

## 🧪 Testing Checklist

### Backend Tests

- [ ] Server starts successfully
- [ ] `/health` endpoint returns 200
- [ ] `/user-profile` returns valid profile
- [ ] `/generate-content` generates HTML
- [ ] `/generate-causal-narrative` works
- [ ] Caching works (check logs)
- [ ] Error handling works (invalid requests)

### Frontend Tests

- [ ] Dashboard loads without errors
- [ ] AI client initializes
- [ ] Overview section loads AI content
- [ ] Tab switching triggers AI loading
- [ ] Causal narratives display correctly
- [ ] Charts render properly
- [ ] Loading states show
- [ ] Error fallbacks work
- [ ] Premium prompts display for free users

### Integration Tests

- [ ] End-to-end flow works
- [ ] Multiple tabs load correctly
- [ ] Refresh button works
- [ ] Cache invalidation works
- [ ] Profile updates trigger cache clear

---

## 🐛 Common Issues & Solutions

### Issue: "CORS Error"

**Cause**: Browser blocking cross-origin requests

**Solution**:
```javascript
// In ai-backend-server.js
const cors = require('cors');
app.use(cors({
    origin: '*', // Or specify your domain
    methods: ['GET', 'POST'],
    credentials: true
}));
```

### Issue: "OpenAI API Error"

**Cause**: Invalid API key or rate limit

**Solution**:
1. Check `OPENAI_API_KEY` is set correctly
2. Verify API key has credits
3. Check rate limits in OpenAI dashboard
4. Implement retry logic (already included)

### Issue: "Content Not Loading"

**Cause**: Backend not running or wrong URL

**Solution**:
1. Ensure backend is running: `npm start`
2. Check API URL in `auxeira-ai-client.js`
3. Check browser console for errors
4. Verify network tab in DevTools

### Issue: "Slow Performance"

**Cause**: No caching or large prompts

**Solution**:
1. Enable caching (check `CACHE_TTL`)
2. Use Redis for production
3. Optimize prompts to be shorter
4. Use faster models for non-critical sections

---

## 🚀 Deployment

### Development

```bash
npm run dev
```

### Production

```bash
# Set production environment
export NODE_ENV=production
export PORT=3000

# Start with PM2 (process manager)
npm install -g pm2
pm2 start ai-backend-server.js --name auxeira-ai

# Or use Docker
docker build -t auxeira-ai-backend .
docker run -p 3000:3000 -e OPENAI_API_KEY=xxx auxeira-ai-backend
```

### Environment Variables for Production

```bash
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=your_production_key
CACHE_TTL=86400000
REDIS_URL=redis://your-redis-instance
CORS_ORIGIN=https://yourdomain.com
```

---

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)

---

## 🤝 Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Happy Coding! 🚀**

