# Coach Gina v3 Improvements

## Summary
Enhanced Coach Gina to deliver deeply personalized, data-driven responses that use specific founder metrics and avoid generic advice.

## Problems Fixed

### 1. ❌ Lacked Specific Data Integration
**Before**: "Churn rate above industry benchmarks"
**After**: "Your churn at 8% monthly means your 127-user cohort drops to 47 by month 12"

### 2. ❌ Name-Dropped Philosophy Instead of Embodying It
**Before**: "Elon Musk's first-principles thinking..."
**After**: "Strip this down: why do users churn? Is it product gap, expectation mismatch, or activation failure?"

### 3. ❌ Micro-Habits Were Too Vague
**Before**: "Review customer support logs"
**After**: "Run exit interviews with 3 churned users from last month. Ask: 'What nearly made you stay?'"

### 4. ❌ No Emotional Connection
**Before**: "Your churn is concerning"
**After**: "8% churn feels scary—let's fix it"

### 5. ❌ Too Long for Value Delivered
**Before**: 300+ words with repetitive phrasing
**After**: 150-230 words, ruthlessly concise

### 6. ❌ Question Wasn't Provocative
**Before**: "What are the 3 core jobs your product serves?"
**After**: "What's the one assumption you're avoiding testing that could unlock your activation?"

## Key Improvements

### 1. Concrete Examples in System Prompt

Added side-by-side comparison showing:
- ❌ Generic response (what to avoid)
- ✅ Personalized response (what to aim for)

This gives Claude a clear template to follow.

### 2. Enhanced Context Building

**Before**:
```javascript
- MRR: $18500
- Churn Rate: 8%
```

**After**:
```javascript
- MRR: $18,500
  → Growth: +23% MoM
- Churn Rate: 8% monthly
  → Impact: 127-user cohort drops to 47 by month 12
  → WARNING: Above 5% threshold - bleeding revenue
- CAC: $145, LTV: $260
  → LTV:CAC Ratio: 1.79x (Below 3x threshold - acquisition burns runway)
```

The Lambda now calculates:
- LTV:CAC ratios with interpretation
- Cohort retention projections (month 12)
- Burn coverage percentage
- Threshold warnings

### 3. Quality Gate Checklist

Added self-check before sending:
- [ ] Used at least 3 specific data points?
- [ ] Explained WHY metrics matter with math?
- [ ] Actions specific enough to start in 24 hours?
- [ ] Question makes them uncomfortable (in a good way)?
- [ ] Tone is warm + direct, not corporate?
- [ ] Under 200 words?
- [ ] Would THIS founder feel seen and understood?

### 4. Red Flags List

Explicit list of what NOT to do:
- ❌ "you should consider," "it's important to," "moving forward"
- ❌ No actual numbers from their data
- ❌ Actions without timeframes or triggers
- ❌ Questions starting with "What are..." or "How can you..."
- ❌ Name-dropping thinkers
- ❌ Word count over 250

## Test Results

### Test 1: High Churn Scenario
**Context**: FinTech startup, Lagos, 8% churn, $18.5K MRR

**Response Highlights**:
- ✅ "$18,500 MRR in month 8 — that's 23% month-over-month growth"
- ✅ "127-user cohort drops to 47 by month 12"
- ✅ "LTV:CAC at 1.79x means you spend $1 to earn $1.79"
- ✅ "Map your full user journey in 10 steps"
- ✅ "What's the one assumption you're avoiding testing?"
- ✅ 230 words

### Test 2: Funding Decision Scenario
**Context**: Pre-Seed SaaS, SF, 3.5% churn, $5K MRR, 6 months runway

**Response Highlights**:
- ✅ "$5,000 in MRR with 40% month-over-month growth"
- ✅ "LTV:CAC ratio of 4.0x is healthy"
- ✅ "45-user cohort drops to just 29 by month 12"
- ✅ "Interview 5 of your 16 churned users"
- ✅ "Which would create more value: fixing churn or raising now?"
- ✅ Geography-specific: "in San Francisco"

## Technical Changes

### Files Modified
1. `backend/lambda-coach-gina.js`
   - Updated system prompt to v3
   - Added concrete examples section
   - Added quality gate checklist
   - Enhanced `buildContextString()` with calculations

### System Prompt Structure
```
1. Core Identity (unchanged)
2. Communication Principles (unchanged)
3. Structure: 4-Part Framework (unchanged)
4. Context Integration Requirements (unchanged)
5. Example Comparison (NEW)
   - Generic vs. Personalized side-by-side
6. Quality Gate Checklist (NEW)
   - Self-check before sending
   - Red flags list
7. Final Instructions (enhanced)
8. Response Formatting (unchanged)
```

### Context Building Enhancements
```javascript
// Now calculates and includes:
- LTV:CAC ratio with interpretation
- Cohort retention at month 12
- Burn coverage percentage
- Threshold warnings (churn > 5%, LTV:CAC < 3)
- MRR growth rate
```

## Deployment

**Lambda Function**: `auxeira-coach-gina-prod`
**API Endpoint**: `https://9t3nivd6wg.execute-api.us-east-1.amazonaws.com/prod/api/coach-gina`
**Status**: ✅ Deployed and tested

## Before/After Comparison

### Before (Generic)
```
You've made impressive progress. However, churn is a red flag that needs attention. 
Steve Jobs would say focus on user experience. Elon Musk would use first-principles 
thinking to understand the root cause.

Actions:
- Review customer support logs to identify pain points
- Conduct customer interviews to understand needs
- Segment your customer base for better targeting

Question: What are the core jobs your product serves? How well does it deliver?
```

### After (Personalized)
```
$18,500 MRR in month 8 — that's 23% month-over-month growth. You're not invisible. 
But churn at 8% monthly is bleeding you: your 127-user cohort drops to 47 by month 12. 
LTV:CAC at 1.79x means you spend $1 to earn $1.79. Below 3x, acquisition burns runway 
faster than revenue replaces it.

The problem isn't your ability to acquire users. It's your ability to activate them. 
You have an activation leak, not a growth problem.

This week:
- Map your full user journey in 10 steps (signup → aha → habit). Circle where 50%+ ghost.
- Run exit interviews with 3 churned users from last month. Ask: "What nearly made you stay?"

If you cut churn from 8% to 4% monthly, your LTV doubles. That turns 1.79 LTV:CAC into 
3.58 — suddenly you're fundable and profitable.

What's the one assumption you're avoiding testing that could unlock your activation? 
Go find that leak. Report back.
```

## Success Metrics

✅ **Specific Numbers**: Uses 5+ data points per response
✅ **Math Shown**: Calculates consequences (cohort retention, LTV:CAC)
✅ **Actionable**: Timeframes, triggers, specifics
✅ **Provocative**: Questions force prioritization
✅ **Concise**: 150-230 words (vs 300+ before)
✅ **Warm + Direct**: Acknowledges struggle, celebrates wins
✅ **No Name-Dropping**: Embodies principles without citing thinkers
✅ **No Headers**: Natural conversation flow

## Next Steps

1. ✅ Deploy to production
2. ✅ Test with various scenarios
3. ✅ Verify personalization
4. Monitor user feedback
5. Iterate based on engagement metrics

## Notes

- System prompt is now ~4,500 tokens (within Claude's context window)
- Concrete examples help Claude understand the target quality
- Enhanced context building provides richer data for personalization
- Quality gate prevents generic responses from slipping through
- All improvements maintain the 4-part structure (internal only, no headers in output)
