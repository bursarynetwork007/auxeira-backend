# AI Nudges Implementation - Complete Guide

## Overview

Implemented three AI-powered nudges on the Startup Founder Dashboard Overview tab, each using a different AI model and providing specific workflows to help founders take action.

---

## Three Nudge Types

### 1. Growth Nudge (Powered by Manus/GPT-4)
**Goal**: Reduce CAC via Referrals  
**Reward**: +100 AUX tokens  
**AI Model**: Manus API (currently using GPT-4 as placeholder)  
**API Key**: `sk-IZSj-L-fQt2gbvZFZ0nKrCPay1c3Tqyt_-huNom5MFzVodoRwmivegKAoheM1BjDzGh4FU2_wRF24AYMdhbEJz3_KhFf`

**Workflow**:
1. Click "Take Action" button
2. Modal opens with AI-generated referral program plan
3. Displays:
   - Referral incentive structure
   - Implementation checklist (5-7 steps)
   - Success metrics to track
   - Expected timeline (25% CAC reduction)
4. Click "Mark as Complete" to earn +100 AUX

### 2. Validation Nudge (Powered by nanoGPT-5/GPT-4)
**Goal**: Complete Customer Interviews  
**Reward**: +150 AUX tokens  
**AI Model**: OpenAI GPT-4  
**API Key**: Set via environment variable `OPENAI_API_KEY`

**Workflow**:
1. Click "Schedule Interviews" button
2. Modal opens with AI-generated interview guide
3. Displays:
   - Email template for scheduling (with copy button)
   - Three critical questions to ask
   - What to listen for (PMF signals)
   - Documentation tips
4. Click "Mark as Complete" to earn +150 AUX

### 3. Funding Nudge (Powered by Claude)
**Goal**: Prepare Financial Projections  
**Reward**: +200 AUX tokens  
**AI Model**: Claude 3 Haiku  
**API Key**: Set via environment variable `CLAUDE_API_KEY`

**Workflow**:
1. Click "Update Model" button
2. Modal opens with AI-generated financial guidance
3. Displays:
   - Three key focus areas for 18-month projection
   - Critical metrics to update
   - Investor-ready presentation tips
   - File upload area for financial model
4. Upload Excel/CSV file
5. Click "Mark as Complete" to earn +200 AUX

---

## Technical Architecture

### Backend

#### Lambda Function: `lambda-nudges.js`
```javascript
// Handles three types of nudges
- generateGrowthNudge(context)    // Manus/GPT-4
- generateValidationNudge(context) // GPT-4
- generateFundingNudge(context)    // Claude

// Completion handler
- completeNudge(userId, nudgeType, data)
```

#### API Endpoints
```
POST /api/nudges
Body: {
  action: 'generate' | 'complete',
  nudgeType: 'growth' | 'validation' | 'funding',
  context: { stage, industry, metrics, ... },
  userId: 'string'
}
```

#### Environment Variables
```bash
MANUS_API_KEY=your-manus-api-key-here
CLAUDE_API_KEY=your-claude-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

### Frontend

#### JavaScript Class: `NudgesWorkflow`
```javascript
// Main methods
- openGrowthNudge(context)
- openValidationNudge(context)
- openFundingNudge(context)
- completeNudge(type)
- closeModal(type)
```

#### Modal Components
- Growth Nudge Modal
- Validation Nudge Modal
- Funding Nudge Modal

Each modal includes:
- Header with icon and title
- Loading spinner
- Content area (AI-generated)
- Footer with Cancel and Complete buttons

---

## Files Created/Modified

### Backend Files
```
backend/lambda-nudges.js              - Lambda function for AI nudges
backend/serverless-nudges.yml         - Serverless deployment config
backend/package.json                  - Added openai dependency
```

### Frontend Files
```
frontend/js/nudges-workflow.js        - Workflow manager class
frontend/dashboard/startup_founder_live.html - Updated with button IDs and handlers
```

### Deployed Files
```
s3://auxeira.com/js/nudges-workflow.js (17.3 KB)
```

---

## Dashboard Integration

### Button IDs Added
```html
<button id="growthNudgeBtn">Take Action</button>
<button id="validationNudgeBtn">Schedule Interviews</button>
<button id="fundingNudgeBtn">Update Model</button>
```

### Event Handlers
```javascript
document.getElementById('growthNudgeBtn').addEventListener('click', function(e) {
    e.preventDefault();
    nudgesWorkflow.openGrowthNudge(founderContext);
});

document.getElementById('validationNudgeBtn').addEventListener('click', function(e) {
    e.preventDefault();
    nudgesWorkflow.openValidationNudge({
        ...founderContext,
        interviewsCompleted: 8
    });
});

document.getElementById('fundingNudgeBtn').addEventListener('click', function(e) {
    e.preventDefault();
    nudgesWorkflow.openFundingNudge({
        ...founderContext,
        burnRate: 12500
    });
});
```

---

## Deployment Steps

### 1. Deploy Nudges Workflow Script
```bash
aws s3 cp frontend/js/nudges-workflow.js \
  s3://auxeira.com/js/nudges-workflow.js \
  --content-type "application/javascript" \
  --cache-control "public, max-age=300"
```

### 2. Deploy Lambda Function
```bash
cd backend
export MANUS_API_KEY="your-manus-api-key-here"
export CLAUDE_API_KEY="your-claude-api-key-here"
export OPENAI_API_KEY="your-openai-api-key-here"
npx serverless deploy --config serverless-nudges.yml --stage prod
```

### 3. Deploy Updated Dashboard
```bash
aws s3 cp frontend/dashboard/startup_founder_live.html \
  s3://auxeira-dashboards-jsx-1759943238/startup_founder.html \
  --content-type "text/html" \
  --cache-control "no-cache, no-store, must-revalidate"
```

### 4. Invalidate CloudFront Cache
```bash
aws cloudfront create-invalidation \
  --distribution-id E1L1Q8VK3LAEFC \
  --paths "/startup_founder.html" "/js/nudges-workflow.js"
```

---

## User Flow

### Growth Nudge Flow
1. Founder sees "Growth Nudge" card with "+100 AUX" badge
2. Clicks "Take Action" button
3. Modal opens with loading spinner
4. AI (Manus/GPT-4) generates referral program plan
5. Modal displays:
   - Incentive structure (e.g., "Give $20, Get $20")
   - Checklist (7 steps to implement)
   - Success metrics (track referral signups, conversion rate)
   - Timeline (25% CAC reduction in 3-4 months)
6. Founder reviews plan
7. Clicks "Mark as Complete (+100 AUX)"
8. System awards 100 AUX tokens
9. SSE score increases by +5%
10. Modal closes, page refreshes

### Validation Nudge Flow
1. Founder sees "Validation Nudge" card with "+150 AUX" badge
2. Clicks "Schedule Interviews" button
3. Modal opens with loading spinner
4. AI (GPT-4) generates interview guide
5. Modal displays:
   - Email template (with copy button)
   - Three critical questions
   - PMF signals to listen for
   - Documentation tips
6. Founder copies email template
7. Schedules interviews
8. Clicks "Mark as Complete (+150 AUX)"
9. System awards 150 AUX tokens
10. SSE score increases by +8%
11. Modal closes, page refreshes

### Funding Nudge Flow
1. Founder sees "Funding Nudge" card with "+200 AUX" badge
2. Clicks "Update Model" button
3. Modal opens with loading spinner
4. AI (Claude) generates financial guidance
5. Modal displays:
   - Three key focus areas
   - Critical metrics to update
   - Investor-ready tips
   - File upload area
6. Founder uploads Excel/CSV file
7. File name and size displayed
8. Clicks "Mark as Complete (+200 AUX)"
9. System awards 200 AUX tokens
10. SSE score increases by +12%
11. Modal closes, page refreshes

---

## AI Model Specifications

### Growth Nudge (Manus/GPT-4)
**Model**: `gpt-4`  
**Temperature**: 0.7  
**Max Tokens**: 1000  
**Output Format**: JSON with keys: incentiveStructure, checklist, metrics, timeline

**Prompt Template**:
```
You are a growth marketing expert helping a {stage} {industry} startup 
reduce their CAC through a referral program.

Current metrics:
- CAC: ${cac}
- MRR: ${mrr}
- Customers: {customers}

Generate a detailed referral program implementation plan...
```

### Validation Nudge (nanoGPT-5/GPT-4)
**Model**: `gpt-4`  
**Temperature**: 0.7  
**Max Tokens**: 1200  
**Output Format**: JSON with keys: emailTemplate, questions, signals, documentation

**Prompt Template**:
```
You are a product validation expert helping a {stage} {industry} startup 
conduct customer interviews for Series A readiness.

Current status:
- Interviews completed: {interviewsCompleted}
- Target: 10 interviews
- Stage: {stage}

Generate a comprehensive customer interview guide...
```

### Funding Nudge (Claude)
**Model**: `claude-3-haiku-20240307`  
**Max Tokens**: 800  
**Output Format**: Text (guidance)

**Prompt Template**:
```
You are a Series A fundraising advisor helping a {stage} {industry} startup 
update their financial projections.

Current metrics:
- MRR: ${mrr}
- Burn Rate: ${burnRate}
- Runway: {runway} months
- Team Size: {teamSize}

Generate a focused financial model update guide...
```

---

## Rewards System

### AUX Token Awards
| Nudge Type | AUX Reward | SSE Impact |
|------------|-----------|------------|
| Growth     | +100 AUX  | +5%        |
| Validation | +150 AUX  | +8%        |
| Funding    | +200 AUX  | +12%       |

### Completion Tracking
- User ID stored in localStorage
- Completion logged to backend
- AUX balance updated
- SSE score recalculated
- Dashboard refreshed to show new balance

---

## Testing

### Manual Testing Steps

#### Test Growth Nudge
1. Log in to dashboard
2. Navigate to Overview tab
3. Find "Growth Nudge" card
4. Click "Take Action"
5. Verify modal opens
6. Verify AI-generated content loads
7. Verify "Mark as Complete" button appears
8. Click complete button
9. Verify success message
10. Verify AUX balance increases by 100

#### Test Validation Nudge
1. Find "Validation Nudge" card
2. Click "Schedule Interviews"
3. Verify modal opens
4. Verify email template appears
5. Click "Copy Template" button
6. Verify template copied to clipboard
7. Verify three questions displayed
8. Click "Mark as Complete"
9. Verify AUX balance increases by 150

#### Test Funding Nudge
1. Find "Funding Nudge" card
2. Click "Update Model"
3. Verify modal opens
4. Verify financial guidance appears
5. Click file upload area
6. Select Excel/CSV file
7. Verify file name displayed
8. Click "Mark as Complete"
9. Verify AUX balance increases by 200

---

## API Testing

### Test Growth Nudge Generation
```bash
curl -X POST https://YOUR-API-ENDPOINT/api/nudges \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate",
    "nudgeType": "growth",
    "context": {
      "stage": "Series A",
      "industry": "FinTech",
      "cac": 127,
      "mrr": 18500,
      "customers": 1247
    }
  }'
```

### Test Validation Nudge Generation
```bash
curl -X POST https://YOUR-API-ENDPOINT/api/nudges \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate",
    "nudgeType": "validation",
    "context": {
      "stage": "Series A",
      "industry": "FinTech",
      "interviewsCompleted": 8
    }
  }'
```

### Test Funding Nudge Generation
```bash
curl -X POST https://YOUR-API-ENDPOINT/api/nudges \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate",
    "nudgeType": "funding",
    "context": {
      "stage": "Series A",
      "industry": "FinTech",
      "mrr": 18500,
      "burnRate": 12500,
      "runway": 14,
      "teamSize": 12
    }
  }'
```

### Test Nudge Completion
```bash
curl -X POST https://YOUR-API-ENDPOINT/api/nudges \
  -H "Content-Type: application/json" \
  -d '{
    "action": "complete",
    "nudgeType": "growth",
    "userId": "demo-user"
  }'
```

---

## Next Steps

### Phase 1 (Current)
- ✅ Backend Lambda function created
- ✅ Frontend workflow manager created
- ✅ Dashboard integration complete
- ⏳ Deploy Lambda function
- ⏳ Test end-to-end workflows
- ⏳ Deploy to production

### Phase 2 (Future Enhancements)
- [ ] Integrate with actual Manus API (replace GPT-4 placeholder)
- [ ] Connect to user database for AUX balance
- [ ] Implement SSE score calculation
- [ ] Add webhook for completion notifications
- [ ] Track completion analytics
- [ ] Add progress indicators
- [ ] Implement file processing for financial models
- [ ] Add email integration for interview scheduling
- [ ] Create admin dashboard for nudge analytics

---

## Troubleshooting

### Modal Not Opening
1. Check browser console for errors
2. Verify nudges-workflow.js loaded
3. Check button IDs match
4. Verify event handlers attached

### AI Content Not Loading
1. Check API endpoint URL
2. Verify API keys in environment variables
3. Check Lambda function logs in CloudWatch
4. Verify CORS configuration

### Completion Not Working
1. Check userId in localStorage
2. Verify API endpoint for completion
3. Check backend logs
4. Verify AUX balance update logic

---

## Status

✅ **Backend**: Lambda function created  
✅ **Frontend**: Workflow manager created  
✅ **Dashboard**: Integration complete  
✅ **Script Deployed**: nudges-workflow.js on S3  
⏳ **Lambda Deployed**: Pending deployment  
⏳ **Testing**: Pending end-to-end tests  
⏳ **Live**: Pending production deployment  

---

**Created**: October 29, 2025  
**Status**: Implementation Complete, Pending Deployment  
**Next**: Deploy Lambda function and test workflows
