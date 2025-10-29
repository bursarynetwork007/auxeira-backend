# Overview Tab Implementation Plan

## Summary
Systematic implementation of three AI-powered components for the Startup Founder Dashboard Overview tab:
1. **Coach Gina Chat** - AI mentor with natural conversational responses (no headers)
2. **Dynamic Nudges** - Growth, Validation, and Funding nudges with AI-generated personalized actions
3. **Urgent Actions** - 3 dynamic items (red blocker, yellow overdue, blue opportunity)

## Component 1: Coach Gina Chat (Already Implemented)

### Current Status
✅ Lambda function deployed
✅ Frontend chat widget integrated
✅ System prompt includes instruction to avoid headers

### Required Updates
1. **Strengthen system prompt** to absolutely prevent headers
   - Add explicit examples of forbidden patterns
   - Emphasize natural conversation flow
   - Already done in previous commit

2. **Test responses** to ensure no headers appear
   - Test with various founder queries
   - Verify 4-part structure is internal only

### Key Requirements from Mentor.md
- **Structure (Internal Only)**: Reality Check → Insight → Action → Question + Nudge
- **NO visible headers** in responses
- **150-200 words** (max 250)
- **Use specific numbers** from founder context
- **Do the math** for them
- **Warm + Direct** tone
- **3 bullets max** for actions

## Component 2: Dynamic Nudges (To Implement)

### Overview3Nudges.md Requirements

#### Backend: Nudge Generator
- **Trigger**: On user sign-in or SSE/MRR data update (cron every 24h)
- **AI Model**: Coach Gina (Claude) for all three nudges
- **Output**: JSON with goal, description, button_text, aux_reward, difficulty, workflow_type

#### Three Nudge Types

**1. Growth Nudge**
- **Goal**: Optimize for MRR/CAC improvement
- **Examples**: "Launch referral program for 25% CAC cut", "Test pricing tiers for 15% MRR uplift"
- **AUX Reward**: 100-150 (Medium difficulty: 1-3h setup)
- **Button Action**: Open Modal with AI plan
- **Workflow**: Modal loads AI plan (e.g., 3 pricing variants pre-filled), resources, checklist

**2. Validation Nudge**
- **Goal**: Complete customer interviews/surveys for PMF signals
- **Examples**: "Run 3 user surveys for PMF signals", "Schedule 2 founder interviews"
- **AUX Reward**: 150-200 (High difficulty: Outreach + analysis, 3-4h)
- **Button Action**: Redirect to Integrated Tool or Modal
- **Workflow**: Pre-pop email/script with AI questions, track completion

**3. Funding Nudge**
- **Goal**: Prepare financial projections/cap table for investor readiness
- **Examples**: "Refine cap table for investor diligence", "Update 18-month projections"
- **AUX Reward**: 200-300 (High difficulty: Legal/financial tweaks, 4-5h)
- **Button Action**: Open Submission/Editing Interface
- **Workflow**: AI-flagged edits, upload/edit → validate → AUX/SSE

#### Personalization Hooks
- Infuse user signals (e.g., if CAC >$200, bias toward referrals)
- Rotate 2-3 variants per section quarterly via A/B
- Fallbacks: If AI gen fails, default to safe templates

#### Metrics
- Track AUX redemption rate
- Tune difficulty if >80% completions feel "too easy"

### Implementation Steps

1. **Create Nudge Generator Lambda**
   - Input: User context (SSE, MRR, stage, industry, challenges)
   - Prompt: Generate 3 nudges (Growth, Validation, Funding) as JSON
   - Output: Array of 3 nudge objects
   - Cache: 24 hours per user

2. **Update Frontend**
   - Replace static nudges with dynamic loading
   - Call nudge generator API on page load
   - Render nudges with proper styling
   - Attach click handlers to existing workflow modals

3. **Prompt Template**
```
As Coach Gina, generate 3 personalized nudges for [User Startup]'s dashboard.

Context:
- SSE Score: [current_sse]/100
- Stage: [stage]
- Industry: [industry]
- MRR: $[mrr] ([growth]% MoM)
- Key Challenges: [challenges]

Generate exactly 3 nudges as JSON array:
[
  {
    "type": "growth",
    "goal": "Concise action title (<10 words)",
    "description": "1-sentence explainer with projected impact",
    "buttonText": "Action-oriented CTA",
    "auxReward": 100-150,
    "difficulty": "Low/Medium/High"
  },
  {
    "type": "validation",
    "goal": "...",
    "auxReward": 150-200,
    ...
  },
  {
    "type": "funding",
    "goal": "...",
    "auxReward": 200-300,
    ...
  }
]

Draw from YC/a16z playbooks. Prioritize quick wins if SSE < 60.
```

## Component 3: Urgent Actions & Opportunities (To Implement)

### UrgentActions.md Requirements

#### Backend: Urgent Actions Generator
- **Trigger**: On dashboard load
- **AI Model**: Claude (Opus 4.1 or equivalent)
- **Output**: Exactly 3 items (1 red, 1 yellow, 1 blue)
- **Deep Scans**: Web/X searches for ESG funding, interview enhancements, info gaps

#### Three Action Types

**1. Blocker (Red Urgency)**
- **Purpose**: Critical validation gap
- **Example**: "Customer Interview #8 - Required to unlock Series A assessment"
- **AUX Reward**: 100-200
- **Enhancement**: Scan for missing opportunities (e.g., X tips for interview questions)

**2. Overdue (Yellow Urgency)**
- **Purpose**: Stale data risk
- **Example**: "Financial Model Update - Your projections are 30 days old"
- **AUX Reward**: 150-250
- **Enhancement**: Flag necessary info needs (e.g., "Add behavioral churn benchmarks")

**3. Opportunity (Blue High-Reward)**
- **Purpose**: Timely ESG funding or intro
- **Example**: "ESG Grant Opportunity - NEXUS Scaleup €2M climate tech deadline Oct 31"
- **AUX Reward**: 300-500
- **Enhancement**: Deep scan web/X for 2-3 fits, leverage user strengths

#### Personalization
- Tie to user stage (e.g., pre-pilot for Auxeira)
- 80% feasibility (<3h effort)
- Motivational tone
- Ties to success levers (e.g., "Unlocks 20% faster partner closes")

### Implementation Steps

1. **Create Urgent Actions Lambda**
   - Input: User context (SSE, MRR trends, interview logs, projection staleness)
   - Prompt: Generate 3 urgent actions (red, yellow, blue) as JSON
   - Output: Array of 3 action objects
   - Cache: 24 hours per user

2. **Update Frontend**
   - Replace static urgent actions with dynamic loading
   - Call urgent actions API on page load
   - Render actions with proper color coding
   - Attach click handlers for workflows

3. **Prompt Template**
```
As Coach Gina, generate exactly 3 personalized items for "Urgent Actions & Opportunities".

Current date: [date]
Context:
- SSE Score: [sse]/100
- Industry: [industry]
- MRR: $[mrr] ([growth]% MoM)
- Users: [users]
- Interviews: [completed]/10 complete
- Projections: [staleness]

Generate exactly 3 items as JSON array:
[
  {
    "title": "Concise label (10-15 words max)",
    "description": "1-2 sentences: Urgency/impact + personalization",
    "buttonText": "Action-oriented CTA",
    "urgencyColor": "red",
    "auxReward": 100-200,
    "actionId": "unique_action_id",
    "workflowType": "Modal/Redirect/Edit"
  },
  {
    "urgencyColor": "yellow",
    "auxReward": 150-250,
    ...
  },
  {
    "urgencyColor": "blue",
    "auxReward": 300-500,
    ...
  }
]

1. Red (Blocker): Critical validation gap
2. Yellow (Overdue): Stale data risk
3. Blue (Opportunity): Timely funding or intro

Ensure 80% feasibility (<3h effort), motivational tone.
```

## Implementation Order

### Phase 1: Coach Gina (Already Complete)
✅ System prompt updated with no-headers instruction
✅ Lambda deployed
✅ Frontend integrated

### Phase 2: Dynamic Nudges
1. Create nudge generator Lambda function
2. Add API endpoint to serverless config
3. Update frontend to call API and render dynamic nudges
4. Test with various user contexts
5. Deploy to production

### Phase 3: Urgent Actions
1. Create urgent actions Lambda function
2. Add API endpoint to serverless config
3. Update frontend to call API and render dynamic actions
4. Test with various user contexts
5. Deploy to production

### Phase 4: Integration & Testing
1. Test all three components together
2. Verify caching works (24-hour refresh)
3. Test fallbacks if AI generation fails
4. Monitor API usage and costs
5. Gather user feedback

## Technical Architecture

### Backend
```
Lambda Functions:
1. coach-gina (existing) - Chat responses
2. nudges-generator (new) - 3 nudges
3. urgent-actions (new) - 3 actions

All use Claude API (Haiku for cost efficiency)
All cache results for 24 hours per user
```

### Frontend
```
JavaScript Modules:
1. coach-gina-chat.js (existing) - Chat widget
2. nudges-workflow.js (existing) - Nudge modals
3. overview-dynamic.js (new) - Orchestrates nudges + actions

Dashboard Integration:
- Load dynamic content on page load
- Show loading spinners while generating
- Render with existing glass morphism styling
- Attach handlers to existing workflows
```

### API Endpoints
```
POST /api/coach-gina (existing)
POST /api/nudges/generate (new)
POST /api/urgent-actions/generate (new)
```

## Success Metrics

### Coach Gina
- ✅ No section headers in responses
- ✅ 150-200 word responses
- ✅ Uses specific numbers from context
- ✅ Warm + direct tone

### Dynamic Nudges
- 3 personalized nudges per user
- AUX rewards match difficulty
- >60% click-through rate
- <20% fallback usage

### Urgent Actions
- 3 personalized actions per user
- Proper color coding (red/yellow/blue)
- >50% engagement rate
- Timely opportunities (e.g., grant deadlines)

## Rollout Plan

1. **Development** (Local testing)
   - Test prompts with sample data
   - Verify JSON parsing
   - Test fallbacks

2. **Staging** (Test environment)
   - Deploy to test Lambda functions
   - Test with real user data
   - Verify caching

3. **Production** (Gradual rollout)
   - Deploy Lambda functions
   - Update frontend
   - Invalidate CloudFront cache
   - Monitor for 24 hours
   - Gather feedback

4. **Optimization** (Post-launch)
   - Tune prompts based on feedback
   - Adjust AUX rewards
   - Add A/B testing for variants
   - Monitor API costs

## Notes

- All three components use the same Coach Gina personality
- Prompts emphasize NO HEADERS in responses
- 24-hour caching reduces API costs
- Fallbacks ensure graceful degradation
- Existing workflows (modals) remain unchanged
- Only the content generation is dynamic
