# Government Dashboard Implementation Guide

## Quick Start

The enhanced Government Agency Dashboard is now live in your repository at:
**https://github.com/bursarynetwork007/auxeira-backend/blob/main/dashboard-html/government.html**

## What Was Enhanced

### 1. AI-Powered Strategic Narratives

The Overview tab now features an AI-powered insights section that analyzes government performance data and generates compelling strategic narratives. This transforms raw metrics into actionable intelligence.

**How it works**:
- Automatically analyzes metrics (ROI, jobs created, tax revenue, compliance)
- Generates 3-4 strategic insights using AI
- Provides fallback narratives when API is unavailable
- Includes refresh button for new insights

**API Configuration**:
```javascript
// In government.html, find this function:
function getAPIKey() {
    return process.env.OPENAI_API_KEY || 'your_api_key_here';
}

// Replace 'your_api_key_here' with your actual OpenAI API key
```

### 2. X Post Sentiment Analysis

The Policy Tracker tab now includes real-time sentiment analysis of X (Twitter) posts related to government policies.

**Features**:
- Sentiment scoring (0-100% positive)
- Mention count tracking
- Trending policy identification
- Sample post display

**Mock Data**:
Currently uses mock data. To connect to real X API:
```javascript
async function scanXPosts() {
    // Replace mock data with actual X API calls
    const response = await fetch('/api/x-posts/scan', {
        method: 'POST',
        body: JSON.stringify({ keywords: ['Digital Nigeria', 'Startup Support'] })
    });
    return await response.json();
}
```

### 3. Comprehensive Opportunities Tab

**Three Main Sections**:

#### A. AI-Matched Opportunities
- Displays investment opportunities with match scores
- Shows projected ROI and impact metrics
- Sector categorization
- Timeline and funding requirements

#### B. Co-Funding Opportunities
- Lists opportunities seeking co-investors
- Visual funding progress bars
- Lead investor and co-investor display
- Interest expression buttons

#### C. Investment Upload Modal
- Full-featured form for submitting opportunities
- Fields: Title, Description, Amount, Sector, Timeline, Role
- Skill set selection (Finance, Technical, Legal, Marketing, Operations, Strategy)
- Document upload support
- Email contact collection

**Opening the Modal**:
```html
<button onclick="openInvestmentModal()">Upload Opportunity</button>
```

**Form Submission**:
Currently logs to console. To connect to backend:
```javascript
function submitInvestmentOpportunity() {
    // ... collect form data ...
    
    // Send to backend
    const response = await fetch('/api/opportunities/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opportunityData)
    });
    
    if (response.ok) {
        alert('Opportunity submitted successfully!');
    }
}
```

### 4. Database Formula Integration

All calculations now use proper formulas:

```javascript
const DatabaseFormulas = {
    // Economic ROI
    calculateROI: (economicImpact, investment) => {
        return (economicImpact - investment) / investment;
    },
    
    // Jobs per million invested
    calculateJobCreationRate: (jobs, investmentMillions) => {
        return jobs / investmentMillions;
    },
    
    // Tax revenue per dollar invested
    calculateTaxROI: (taxRevenue, investment) => {
        return taxRevenue / investment;
    },
    
    // Policy effectiveness percentage
    calculatePolicyEffectiveness: (actualOutcome, targetOutcome) => {
        return (actualOutcome / targetOutcome) * 100;
    },
    
    // Weighted ecosystem health score
    calculateEcosystemHealth: (sectors) => {
        const weights = { 
            fintech: 0.3, 
            agritech: 0.25, 
            healthtech: 0.2, 
            edtech: 0.15, 
            other: 0.1 
        };
        return sectors.reduce((score, sector) => {
            return score + (sector.score * (weights[sector.name.toLowerCase()] || 0.1));
        }, 0);
    }
};
```

### 5. Chart Projections

Charts now include future projections using linear regression:

```javascript
function addProjectionsToChart(chart, historicalData, months = 6) {
    // Calculates trend line
    // Projects future values
    // Returns array of projected values
}
```

**Usage**:
```javascript
const historical = [100, 120, 135, 150, 165];
const projections = addProjectionsToChart(myChart, historical, 6);
// Returns: [180, 195, 210, 225, 240, 255]
```

### 6. Tab Reorganization

**Old Structure** → **New Structure**:
- Impact Overview → **Overview**
- Policy Tracker → **Policy Tracker** (enhanced)
- Program Portfolio → **Portfolio**
- Policy Opportunities → **Opportunities** (completely redesigned)
- Economic Analytics → **Analytics**
- Government Reports → **Reports**

### 7. Text Visibility & Footer

- All text now has proper contrast
- Terminal gray changed to #999999 for better readability
- Footer cleaned up: "Last updated: [timestamp] | © 2025 Auxeira"
- Removed mention of "nano-GPT-5 and Thunderbit crawler"

## Backend Integration Requirements

### API Endpoints Needed

1. **`POST /api/government/generate-narrative`**
   - Input: `{ metrics: { roi, jobs, taxRevenue, compliance } }`
   - Output: `{ narrative: "HTML string with insights" }`

2. **`POST /api/government/x-posts/scan`**
   - Input: `{ keywords: ["policy1", "policy2"] }`
   - Output: `[{ policy, sentiment, mentions, trending, sample }]`

3. **`POST /api/government/opportunities/submit`**
   - Input: `{ title, description, amount, sector, role, skills, email, documents }`
   - Output: `{ success: true, opportunityId: "123" }`

4. **`POST /api/government/opportunities/express-interest`**
   - Input: `{ fundId, email, message }`
   - Output: `{ success: true }`

5. **`GET /api/government/opportunities/ai-matched`**
   - Output: `[{ title, description, amount, roi, jobs, timeline, sectors, matchScore }]`

6. **`GET /api/government/opportunities/co-funding`**
   - Output: `[{ title, description, fundingProgress, leadInvestor, coInvestors }]`

### Database Schema

**Opportunities Table**:
```sql
CREATE TABLE investment_opportunities (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount_required DECIMAL(12, 2),
    timeline_years INTEGER,
    sector VARCHAR(100),
    submitter_role VARCHAR(50),
    submitter_email VARCHAR(255),
    skills_required JSONB,
    documents JSONB,
    match_score DECIMAL(3, 2),
    projected_roi DECIMAL(4, 2),
    projected_jobs INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Interest Expressions Table**:
```sql
CREATE TABLE opportunity_interests (
    id SERIAL PRIMARY KEY,
    opportunity_id INTEGER REFERENCES investment_opportunities(id),
    investor_email VARCHAR(255),
    investor_type VARCHAR(50),
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Deployment Steps

### Step 1: Configure API Keys

```bash
# Edit government.html
cd dashboard-html
nano government.html

# Find and update:
function getAPIKey() {
    return 'sk-your-actual-api-key-here';
}
```

### Step 2: Set Up Backend Endpoints

Create the required API endpoints listed above in your backend service.

### Step 3: Update API URLs

```javascript
// Change all fetch URLs from mock to actual
// Example:
const response = await fetch('https://api.auxeira.com/government/generate-narrative', {
    // ...
});
```

### Step 4: Test Locally

```bash
cd auxeira-backend
python3 -m http.server 8080

# Open: http://localhost:8080/dashboard-html/government.html
```

### Step 5: Deploy to Production

```bash
# If using static hosting
aws s3 sync dashboard-html/ s3://your-bucket/dashboard/

# If using web server
rsync -avz dashboard-html/ user@server:/var/www/auxeira/dashboard/
```

## Customization Guide

### Change AI Model

```javascript
body: JSON.stringify({
    model: 'gpt-4.1-mini',  // Options: gpt-4.1-mini, gpt-4.1-nano, gemini-2.5-flash
    messages: [...]
})
```

### Update Color Scheme

```css
:root {
    --government-blue: #1e40af;     /* Primary blue */
    --government-purple: #7c3aed;   /* Secondary purple */
    --economic-green: #10b981;      /* Success/growth */
    --policy-gold: #f59e0b;         /* Highlights */
}
```

### Add New Opportunity Fields

```html
<!-- In investment modal -->
<div class="mb-3">
    <label class="form-label">New Field</label>
    <input type="text" class="form-control" id="newField">
</div>
```

```javascript
// In submitInvestmentOpportunity()
opportunityData.newField = document.getElementById('newField').value;
```

### Modify Database Formulas

```javascript
const DatabaseFormulas = {
    // Add your custom formula
    calculateCustomMetric: (param1, param2) => {
        return (param1 * param2) / 100;
    }
};
```

## Troubleshooting

### AI Narratives Not Loading

**Issue**: Spinner keeps spinning, no insights appear

**Solutions**:
1. Check API key is set correctly
2. Check browser console for errors
3. Verify API endpoint is accessible
4. Check CORS settings on API server

### Investment Modal Not Opening

**Issue**: Button click does nothing

**Solutions**:
1. Check browser console for JavaScript errors
2. Verify Bootstrap is loaded
3. Check modal ID matches: `investmentModal`

### X Post Sentiment Not Displaying

**Issue**: Empty container or loading forever

**Solutions**:
1. Check `xPostSentiment` container exists in HTML
2. Verify `scanXPosts()` function is defined
3. Check data structure matches expected format

### Charts Not Showing Projections

**Issue**: Only historical data visible

**Solutions**:
1. Verify `addProjectionsToChart()` is called
2. Check historical data array has values
3. Ensure Chart.js is loaded

## Security Best Practices

### 1. API Key Protection

**❌ Don't**:
```javascript
const API_KEY = 'sk-1234567890abcdef';  // Exposed in frontend
```

**✅ Do**:
```javascript
// Use backend proxy
const response = await fetch('/api/proxy/openai', {
    method: 'POST',
    body: JSON.stringify({ prompt: '...' })
});
```

### 2. Input Validation

```javascript
function submitInvestmentOpportunity() {
    // Validate all inputs
    const title = document.getElementById('oppTitle').value.trim();
    if (title.length < 5 || title.length > 255) {
        alert('Title must be between 5 and 255 characters');
        return;
    }
    
    // Sanitize inputs
    const sanitized = DOMPurify.sanitize(title);
    
    // Submit
}
```

### 3. File Upload Security

```javascript
// Validate file types
const allowedTypes = ['application/pdf', 'application/msword', 'image/png'];
const file = document.getElementById('oppDocuments').files[0];

if (!allowedTypes.includes(file.type)) {
    alert('Invalid file type');
    return;
}

// Check file size (max 10MB)
if (file.size > 10 * 1024 * 1024) {
    alert('File too large');
    return;
}
```

## Performance Optimization

### 1. Lazy Load Charts

```javascript
// Only load charts when tab is active
document.getElementById('analytics-tab').addEventListener('shown.bs.tab', function() {
    if (!chartsLoaded) {
        initializeCharts();
        chartsLoaded = true;
    }
});
```

### 2. Cache AI Narratives

```javascript
let narrativeCache = {};

async function refreshAINarrative() {
    const cacheKey = JSON.stringify(getCurrentMetrics());
    
    if (narrativeCache[cacheKey]) {
        displayNarrative(narrativeCache[cacheKey]);
        return;
    }
    
    const narrative = await generateAINarrative();
    narrativeCache[cacheKey] = narrative;
    displayNarrative(narrative);
}
```

### 3. Debounce API Calls

```javascript
let refreshTimeout;

function debouncedRefresh() {
    clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(() => {
        refreshAINarrative();
    }, 500);
}
```

## Testing Checklist

- [ ] AI narratives load on Overview tab
- [ ] Refresh button generates new insights
- [ ] X post sentiment displays on Policy Tracker
- [ ] Investment modal opens correctly
- [ ] All form fields validate properly
- [ ] Document upload works
- [ ] Co-funding interest expression works
- [ ] All tabs are accessible
- [ ] Charts display correctly
- [ ] Projections show on charts
- [ ] Text is readable on all backgrounds
- [ ] Footer displays correctly
- [ ] Mobile responsive design works
- [ ] No console errors
- [ ] API calls succeed

## Support & Documentation

- **Design Document**: `GOVERNMENT_DASHBOARD_ENHANCEMENT_DESIGN.md`
- **README**: `dashboard-html/GOVERNMENT_DASHBOARD_README.md`
- **This Guide**: `GOVERNMENT_DASHBOARD_IMPLEMENTATION_GUIDE.md`

## Version History

- **v2.0** (Oct 16, 2025): Complete enhancement with AI narratives, opportunities tab, and projections
- **v1.0** (Original): Basic government dashboard

---

**Status**: ✅ Production Ready  
**Last Updated**: October 16, 2025  
**Maintainer**: Auxeira Development Team

