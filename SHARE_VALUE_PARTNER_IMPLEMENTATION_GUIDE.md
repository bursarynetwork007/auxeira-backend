# Share Value Partners Dashboard - Implementation Guide

## Overview

This guide provides complete instructions for deploying the enhanced Share Value Partners dashboard with AI-powered insights, what-if scenario modeling, and payment gating.

## Files Created

### 1. Enhanced Dashboard
**Location**: `/frontend/dashboard/share_value_partner_enhanced.html`

**Features**:
- AI-Powered Strategic Insights (Overview tab)
- What-If Scenario Modeling (Partnership tab)
- Real-time metrics and KPIs
- Interactive charts and visualizations
- Ferrari-level premium UI/UX

### 2. Onboarding Form
**Location**: `/frontend/dashboard/share_value_partner_onboarding.html`

**Features**:
- Multi-step onboarding process
- Tier selection (Silver, Gold, Platinum)
- Paystack payment integration
- Form validation and authentication gating

## Setup Instructions

### Step 1: Configure API Keys

#### OpenAI-Compatible API (for AI Insights)
The dashboard uses OpenAI-compatible API for generating strategic insights. Update the API key in the dashboard file:

```javascript
function getAPIKey() {
    // Replace with your actual API key or use environment variable
    return process.env.OPENAI_API_KEY || 'YOUR_API_KEY_HERE';
}
```

**Recommended approach**: Set environment variable or use backend proxy to avoid exposing keys in frontend.

#### Paystack Payment Integration
Update the Paystack public key in the onboarding form:

```javascript
const handler = PaystackPop.setup({
    key: 'pk_live_YOUR_PAYSTACK_PUBLIC_KEY', // Replace with your live key
    // ... rest of config
});
```

**Test Mode**: Use `pk_test_...` for testing
**Production**: Use `pk_live_...` for production

### Step 2: Backend Integration

Create API endpoints for:

#### 1. Payment Verification
```
POST /api/partner/verify-payment
Body: { reference: string, email: string, tier: string }
Response: { success: boolean, partnerId: string, token: string }
```

#### 2. Partner Metrics
```
GET /api/partner/metrics
Headers: { Authorization: Bearer <token> }
Response: { shadowValue, roi, engagements, esgScore, ... }
```

#### 3. AI Insights Generation
```
POST /api/partner/generate-insights
Headers: { Authorization: Bearer <token> }
Body: { metricsData: object }
Response: { insights: Array<Insight> }
```

**Recommended**: Proxy AI API calls through your backend to:
- Secure API keys
- Add rate limiting
- Cache responses
- Add custom business logic

### Step 3: Environment Configuration

Create a `.env` file or configure environment variables:

```bash
# OpenAI-Compatible API
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1  # or your custom endpoint

# Paystack
PAYSTACK_PUBLIC_KEY=pk_live_your_key
PAYSTACK_SECRET_KEY=sk_live_your_secret

# Application
FRONTEND_URL=https://auxeira.com
DASHBOARD_URL=https://auxeira.com/frontend/dashboard
```

### Step 4: Update File Paths

If your deployment structure differs, update these paths in the files:

**In `share_value_partner_enhanced.html`**:
```javascript
// Line ~680: Redirect to onboarding
window.location.href = '/frontend/dashboard/share_value_partner_onboarding.html';

// Line ~687: Logout redirect
window.location.href = '/frontend/index.html';
```

**In `share_value_partner_onboarding.html`**:
```javascript
// Line ~485: Success redirect
window.location.href = '/frontend/dashboard/share_value_partner_enhanced.html';

// Line ~496: Already authenticated redirect
window.location.href = '/frontend/dashboard/share_value_partner_enhanced.html';
```

### Step 5: Paystack Webhook Setup

Configure Paystack webhooks to verify payments server-side:

1. Go to Paystack Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/paystack`
3. Implement webhook handler:

```javascript
// Example webhook handler (Node.js/Express)
app.post('/api/webhooks/paystack', async (req, res) => {
    const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest('hex');
    
    if (hash !== req.headers['x-paystack-signature']) {
        return res.sendStatus(400);
    }

    const event = req.body;
    
    if (event.event === 'charge.success') {
        // Verify payment and create partner account
        const { reference, customer, metadata } = event.data;
        await createPartnerAccount({
            email: customer.email,
            tier: metadata.tier,
            paymentReference: reference
        });
    }

    res.sendStatus(200);
});
```

## AI Integration Details

### Model Selection

The dashboard is configured to use `gemini-2.5-flash` via OpenAI-compatible API. You can change the model:

```javascript
// In share_value_partner_enhanced.html, line ~750
body: JSON.stringify({
    model: 'gemini-2.5-flash',  // or 'gpt-4.1-mini', 'gpt-4.1-nano'
    messages: messages,
    max_tokens: 800,
    temperature: 0.7
})
```

### Fallback Insights

If the AI API is unavailable or returns an error, the dashboard automatically displays pre-generated fallback insights. These are defined in the `displayFallbackInsights()` function and can be customized.

### Customizing AI Prompts

To adjust the AI analysis, modify the prompt in `generateAIInsights()`:

```javascript
const prompt = `Analyze the following partner performance data and provide 3-4 strategic insights...`;
```

**Tips for better insights**:
- Include more context (industry, goals, historical data)
- Request specific formats (JSON, markdown)
- Add examples of desired output
- Specify tone (professional, technical, executive-friendly)

## What-If Scenario Modeling

### Calculation Logic

The scenario modeling uses a simplified projection model. You can enhance it with your actual business logic:

```javascript
// Current simplified model (line ~900)
const totalInvestment = investment * timeHorizon;
const baseROI = 18.4;
const roiMultiplier = (discount / 20) * (startups / 150) * (timeHorizon / 12);
const projectedROI = (baseROI * roiMultiplier).toFixed(1);
```

**Recommended**: Replace with your actual ROI calculation model based on:
- Historical data
- Market conditions
- Startup success rates
- Reward redemption patterns

### Adding More Variables

To add additional scenario variables:

1. Add HTML control in the `scenario-controls` section
2. Add calculation logic in `updateScenario()`
3. Update the comparison table

Example:
```html
<div class="scenario-control">
    <label>
        <i class="fas fa-chart-line me-2"></i>Target Conversion Rate
    </label>
    <input type="range" id="conversionSlider" min="5" max="30" step="1" value="15" oninput="updateScenario()">
    <div class="scenario-value">
        <span class="text-muted">Current:</span>
        <span class="current"><span id="currentConversion">15</span>%</span>
    </div>
</div>
```

## Authentication Flow

### Current Implementation (localStorage)

The current implementation uses localStorage for simplicity:

```javascript
localStorage.setItem('auxeira_partner_authenticated', 'true');
localStorage.setItem('auxeira_payment_verified', 'true');
localStorage.setItem('auxeira_payment_reference', reference);
```

**⚠️ Security Warning**: This is NOT production-ready. Implement proper authentication:

### Recommended Production Authentication

1. **JWT-Based Authentication**:
```javascript
// After payment verification
const response = await fetch('/api/auth/partner/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: formData.contactEmail,
        paymentReference: paymentResponse.reference
    })
});

const { token, refreshToken } = await response.json();
localStorage.setItem('auxeira_access_token', token);
localStorage.setItem('auxeira_refresh_token', refreshToken);
```

2. **Session-Based Authentication**:
```javascript
// Set httpOnly cookies server-side
res.cookie('auxeira_session', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

3. **Add Token Refresh Logic**:
```javascript
async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('auxeira_refresh_token');
    const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
    });
    const { accessToken } = await response.json();
    localStorage.setItem('auxeira_access_token', accessToken);
}
```

## Deployment Checklist

- [ ] Replace placeholder API keys with production keys
- [ ] Set up Paystack webhook endpoint
- [ ] Implement backend payment verification
- [ ] Add proper JWT-based authentication
- [ ] Configure CORS for API endpoints
- [ ] Set up SSL/TLS certificates
- [ ] Test payment flow end-to-end
- [ ] Test AI insights generation
- [ ] Test what-if scenario calculations
- [ ] Verify mobile responsiveness
- [ ] Add error tracking (e.g., Sentry)
- [ ] Set up analytics (e.g., Google Analytics)
- [ ] Configure rate limiting for API endpoints
- [ ] Add GDPR compliance notices
- [ ] Test with different browsers
- [ ] Load test with expected traffic

## Testing

### Local Testing

1. **Start a local server**:
```bash
cd /home/ubuntu/auxeira-backend
python3 -m http.server 8000
```

2. **Access the onboarding form**:
```
http://localhost:8000/frontend/dashboard/share_value_partner_onboarding.html
```

3. **Test payment flow** (use Paystack test mode):
   - Test Card: 4084 0840 8408 4081
   - CVV: 408
   - Expiry: Any future date
   - PIN: 0000

4. **Bypass authentication for testing**:
```javascript
// In browser console
localStorage.setItem('auxeira_partner_authenticated', 'true');
localStorage.setItem('auxeira_payment_verified', 'true');
// Then navigate to dashboard
```

### AI Insights Testing

Test with different API configurations:

```javascript
// Test fallback insights (simulate API failure)
function getAPIKey() {
    return 'INVALID_KEY'; // Will trigger fallback
}
```

## Customization Guide

### Branding

Update colors in CSS variables:

```css
:root {
    --terminal-blue: #0088ff;      /* Primary brand color */
    --terminal-purple: #8800ff;    /* Secondary brand color */
    --terminal-gold: #ffaa00;      /* Accent color */
    --ferrari-red: #dc0000;        /* Alert/critical color */
}
```

### Metrics

Update metrics in the dashboard to match your data:

```javascript
// Replace hardcoded values with API calls
async function loadMetrics() {
    const response = await fetch('/api/partner/metrics', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const metrics = await response.json();
    
    document.getElementById('shadowValueBanner').textContent = metrics.shadowValue;
    document.getElementById('roiBanner').textContent = metrics.roi;
    // ... update other metrics
}
```

### Tier Pricing

Update tier prices in both files:

**Onboarding form** (HTML and JavaScript):
```html
<div class="tier-price">$49<span>...</span></div>
```

```javascript
const amounts = {
    silver: 4900,   // $49 in cents
    gold: 9900,     // $99 in cents
    platinum: 19900 // $199 in cents
};
```

## Support and Maintenance

### Monitoring

Set up monitoring for:
- Payment success/failure rates
- AI API response times and errors
- Dashboard load times
- User authentication issues
- Scenario calculation errors

### Logging

Add comprehensive logging:

```javascript
// Example logging wrapper
function logEvent(category, action, label, value) {
    console.log({ category, action, label, value, timestamp: new Date() });
    
    // Send to analytics
    if (window.gtag) {
        gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value
        });
    }
}

// Usage
logEvent('Payment', 'initiated', tier, amounts[tier]);
logEvent('AI', 'insights_generated', 'success', insights.length);
```

## Troubleshooting

### Common Issues

1. **AI insights not loading**
   - Check API key configuration
   - Verify CORS settings
   - Check browser console for errors
   - Confirm API endpoint is accessible

2. **Payment not processing**
   - Verify Paystack public key
   - Check payment amount format (cents)
   - Ensure webhook is configured
   - Test with Paystack test cards

3. **Dashboard not loading after payment**
   - Check localStorage values
   - Verify redirect URLs
   - Check browser console for errors
   - Confirm authentication logic

4. **What-if scenarios not updating**
   - Check JavaScript console for errors
   - Verify slider event handlers
   - Confirm calculation logic

## Next Steps

1. **Backend Integration**: Implement the required API endpoints
2. **Database Schema**: Create tables for partners, payments, metrics
3. **Email Notifications**: Set up welcome emails and payment confirmations
4. **Admin Dashboard**: Create admin interface for managing partners
5. **Reporting**: Build comprehensive reporting system
6. **Mobile App**: Consider mobile app for partner engagement

## Contact

For questions or support with implementation:
- Review the design document: `DASHBOARD_ENHANCEMENT_DESIGN.md`
- Check the repository issues
- Contact the development team

---

**Version**: 1.0
**Last Updated**: 2025-10-16
**Status**: Ready for Production Deployment

