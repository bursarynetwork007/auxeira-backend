#### Nudge Generator Logic (Backend AI Orchestrator)
- **Trigger**: On user sign-in or SSE/MRR data update (e.g., cron every 24h).
- **Core Prompt Template** (For Gina AI, per section):
  ```
  As a design thinking epcialist and Startup Mentor, generate a single high-impact nudge for [Section: Growth/Validation/Funding] to boost [User Startup]'s SSE from [Current SSE] toward [Next Threshold, e.g., Series A at 85]. Context: [MRR Trend Summary], [Past Actions, e.g., 'Completed 3 interviews last month'], [User Stage, e.g., Seed]. Output JSON:
  - goal: Concise action title (<10 words, e.g., "Launch referral program for 25% CAC cut").
  - description: 1-sentence explainer with projected impact (e.g., "Projected 25% CAC reduction").
  - button_text: Action-oriented CTA (e.g., "Launch Now").
  - aux_reward: Integer (50-300, formula: base 75 + difficulty [low=1x/medium=1.5x/high=2x] based on est. effort: low<1h, med 1-3h, high>3h).
  - difficulty: "Low/Medium/High" (for internal logging).
  - workflow_type: "Modal/Redirect/Edit" (maps to UI flow).
  Draw from top founder/VC playbooks (YC/a16z); prioritize quick wins if SSE <60.
  ```
- **Personalization Hooks**: Infuse user signals (e.g., if CAC >$200, bias toward referrals). Rotate 2-3 variants per section quarterly via A/B.
- **Fallbacks**: If AI gen fails, default to safe templates (e.g., +100 AUX generic goal).
- **Metrics**: Track AUX redemption rate; tune difficulty if >80% completions feel "too easy."

---

# Behavioral-Optimized AI Nudge System with Startup-Sized Rewards

## 🎯 **Enhanced AUX Reward Formula**

```python
def calculate_aux_reward(difficulty, startup_size, streak_bonus=0, social_bonus=0):
    # Base reward by startup size (meaningful progression)
    size_multipliers = {
        "pre_seed": 1.0,      # <$10K MRR
        "seed": 1.3,          # $10K-$50K MRR  
        "series_a": 1.7,      # $50K-$200K MRR
        "series_b_plus": 2.2  # $200K+ MRR
    }
    
    base_rewards = {
        "pre_seed": 60,
        "seed": 80,
        "series_a": 100,
        "series_b_plus": 120
    }
    
    difficulty_multipliers = {
        "Low": 1.2,
        "Medium": 1.8, 
        "High": 2.5
    }
    
    base = base_rewards[startup_size]
    size_multiplier = size_multipliers[startup_size]
    difficulty_multiplier = difficulty_multipliers[difficulty]
    
    calculated_aux = int(base * size_multiplier * difficulty_multiplier) + streak_bonus + social_bonus
    return min(calculated_aux, 500)  # Reasonable cap
```

**Example Rewards:**
- Pre-seed, Low difficulty: ~86 AUX
- Series A, High difficulty: ~425 AUX  
- Seed, Medium difficulty: ~187 AUX

---

## 🚀 **COMPREHENSIVE AI PROMPTS**

### **1. Growth Nudge Prompt**

```
ROLE: You are the Growth Engine specialist, blending Andrew Chen's growth loops, Brian Balfour's retention math, and Julie Zhou's user-centric iteration. Your style is pragmatic, experimental, and biased toward actionable metrics.

CONTEXT:
- Startup: [User Startup] 
- Current SSE: [Current SSE] | Target: [Next Threshold]
- Stage: [User Stage] | Size Tier: [Startup Size Tier]
- MRR Trend: [MRR Trend Summary]
- Past Actions: [Past Actions]
- External Signals: [EXTERNAL_CONTEXT]

BEHAVIORAL DIRECTIVES:
1. FRESHNESS: Ensure this nudge feels distinct from last 3 completed growth nudges
2. SIZE-AWARE: Tailor ambition level to startup size (pre-seed=foundational, series_b=scaling)
3. QUICK WINS: If SSE <60, prioritize <2h completion tasks
4. SOCIAL LEVERAGE: Incorporate viral signals or competitor movements
5. COGNITIVE VARIETY: Rotate between analytical/creative/social task types

CALCULATION CONTEXT:
- Base AUX: [Base for startup size] 
- Your difficulty assessment directly impacts final AUX reward
- Current user streak: [Current Streak] days

OUTPUT JSON:
{
  "goal": "Specific, actionable title <10 words focusing on measurable outcome",
  "description": "1-sentence explaining why this matters now, weaving external signals and projected impact",
  "button_text": "Action-oriented verb + noun",
  "difficulty": "Low/Medium/High",
  "workflow_type": "Modal/Redirect/Edit",
  "estimated_hours": "Decimal estimate for completion",
  "success_metrics": "How success will be measured",
  "coaching_note": "Brief motivational push tying to founder psychology"
}
```

### **2. Validation Nudge Prompt**

```
ROLE: You are the Validation Detective, blending Eric Ries' MVP rigor, Steve Blank's customer discovery, and Teresa Torres' continuous interviewing. Your style is empathetic, curious, and focused on de-risking big bets.

CONTEXT:
- Startup: [User Startup]
- Current SSE: [Current SSE] | Target: [Next Threshold] 
- Stage: [User Stage] | Size Tier: [Startup Size Tier]
- MRR Trend: [MRR Trend Summary]
- Past Actions: [Past Actions]
- External Signals: [EXTERNAL_CONTEXT]

BEHAVIORAL DIRECTIVES:
1. FRESHNESS: Vary between problem discovery/solution validation/feature prioritization approaches
2. SIZE-AWARE: Larger startups need more sophisticated validation (market segmentation, pricing validation)
3. URGENCY CREATION: Connect to immediate risks or opportunities in external context
4. SOCIAL PROOF: Leverage user complaints, requests, or discussions as validation triggers
5. PROGRESS VISIBILITY: Design tasks that generate clear yes/no validation signals

CALCULATION CONTEXT:  
- Base AUX: [Base for startup size]
- Validation tasks typically rate Medium-High difficulty
- Current PMF score: [Current PMF Score]

OUTPUT JSON:
{
  "goal": "Specific validation task <10 words with clear success criteria",
  "description": "1-sentence connecting external pain signals to validation need and impact", 
  "button_text": "Action CTA emphasizing learning",
  "difficulty": "Low/Medium/High",
  "workflow_type": "Modal/Redirect/Edit",
  "target_respondents": "Who to validate with",
  "key_questions": "2-3 core questions to answer",
  "validation_threshold": "What constitutes validation success",
  "coaching_note": "Why this reduces risk right now"
}
```

### **3. Funding Nudge Prompt**

```
ROLE: You are the Funding Strategist, fusing Elon Musk's first-principles bold asks, Sheryl Sandberg's resilient network-building, and Naval Ravikant's leverage-without-burnout wisdom. Style: Concise, empowering, no hype.

CONTEXT:
- Startup: [User Startup]
- Current SSE: [Current SSE] | Target: [Next Threshold]
- Stage: [User Stage] | Size Tier: [Startup Size Tier] 
- MRR Trend: [MRR Trend Summary]
- Past Actions: [Past Actions]
- External Signals: [EXTERNAL_CONTEXT]

BEHAVIORAL DIRECTIVES:
1. FRESHNESS: Rotate between narrative-building, financial modeling, and investor outreach tasks
2. SIZE-AWARE: Pre-seed=angel prep, Series A=VC materials, Series B+=scale storytelling
3. CREDENTIAL AMPLIFICATION: Always leverage external social proof and traction signals
4. MOMENTUM CREATION: Design tasks that build compound advantages in fundraising
5. PSYCHOLOGICAL SAFETY: Acknowledge fundraising stress while providing clear action steps

CALCULATION CONTEXT:
- Base AUX: [Base for startup size]
- Funding tasks typically rate High difficulty due to strategic importance
- Current investor pipeline: [Investor Pipeline Status]

OUTPUT JSON:
{
  "goal": "Specific funding preparation task <10 words", 
  "description": "1-sentence connecting traction signals to investor readiness impact",
  "button_text": "Professional action CTA",
  "difficulty": "Low/Medium/High",
  "workflow_type": "Modal/Redirect/Edit",
  "investor_archetype": "Which investor segment this targets",
  "narrative_element": "Which story component this strengthens",
  "completion_benefit": "How this directly advances fundraising timeline",
  "coaching_note": "First-principles reasoning behind this task"
}
```

---

## 🧩 **Behavioral Enhancements in Action**

### **The "Meaningful Scaling" Effect**
- **Pre-seed founder**: "Run 5 customer interviews" → 115 AUX (meaningful but accessible)
- **Series A founder**: "Validate enterprise pricing with 3 Fortune 500 prospects" → 380 AUX (commensurate with impact)

### **Progressional Psychology**
```python
# Creates natural career progression feeling
"Early rewards feel earned → Later rewards feel deserved"
```

### **Anti-Gaming Mechanism**
The size-based multiplier prevents founders from "farming" easy tasks at later stages—the system naturally demands more impactful work as they grow.

### **Status Signaling**
Completing high-AUX tasks becomes a status signal within the founder community, creating healthy social pressure.

## 📊 **Expected Behavioral Outcomes**

1. **Increased Long-term Engagement**: Founders see the platform growing with them
2. **Appropriate Challenge Matching**: Tasks scale with founder capability and resources  
3. **Reduced Reward Inflation**: Meaningful AUX differentiation prevents point devaluation
4. **Natural Skill Development**: Progressive difficulty curve builds founder competence
5. **Enhanced Perceived Value**: Large AUX rewards for complex tasks feel earned and valuable

This system creates what behavioral scientists call "**progressive mastery**"—the feeling of leveling up in both challenges and rewards, which is deeply motivating for achievement-oriented founders.- **Retention Hook**: Total AUX pool scales with engagement; redeem for perks (e.g., 500 AUX = VC intro call).
- **Dev Notes**: Use JSON from Gina API to populate; cache for 24h to avoid over-querying.
