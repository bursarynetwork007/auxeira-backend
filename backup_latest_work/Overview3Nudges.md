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

// Dynamic AUX calculation based on coaching quality
function calculateCoachingAux(startupStage, externalContext, coachingOutput) {
  const stageBase = {
    'pre_seed': 80, 'seed': 110, 'series_a': 150, 'series_b_plus': 200
  };
  
  const signalStrength = assessSignalStrength(externalContext);
  const coachingDepth = assessCoachingDepth(coachingOutput);
  
  return Math.min(
    stageBase[startupStage] * signalStrength.multiplier + coachingDepth.bonus,
    500 // Reasonable cap
  );
}

function assessSignalStrength(externalContext) {
  const signals = externalContext.toLowerCase();
  let multiplier = 1.0;
  
  if (signals.includes('techcrunch') || signals.includes('viral') || signals.includes('trending')) {
    multiplier = 2.0; // Major press or viral moment
  } else if (signals.includes('featured') || signals.includes('press') || signals.match(/\d+\s*(likes|engagements|shares)/)) {
    multiplier = 1.6; // Good traction signals
  } else if (signals.includes('comments') || signals.includes('traffic') || signals.includes('engagement')) {
    multiplier = 1.3; // Basic social signals
  }
  
  return { multiplier, description: getSignalDescription(multiplier) };
}

function assessCoachingDepth(coachingOutput) {
  // Analyze coaching quality
  const wordCount = coachingOutput.split(' ').length;
  const hasSpecificMetrics = /\d+%/.test(coachingOutput) || /\$\d+/.test(coachingOutput);
  const hasTimeBound = /by (tomorrow|Friday|EOW|next week)/i.test(coachingOutput);
  const hasPsychologicalHook = /(loss|fomo|urgency|compound|sunk cost)/i.test(coachingOutput);
  
  let bonus = 0;
  if (hasSpecificMetrics && hasTimeBound && hasPsychologicalHook) bonus = 50; // Transformative
  else if (hasSpecificMetrics || hasTimeBound) bonus = 25; // Actionable
  
  return { bonus, level: bonus === 50 ? 'transformative' : bonus === 25 ? 'actionable' : 'basic' };
}

    
**Example Rewards:**
- Pre-seed, Low difficulty: ~86 AUX
- Series A, High difficulty: ~425 AUX  
- Seed, Medium difficulty: ~187 AUX

---
 ENHANCED AI NUDGE GENERATOR SYSTEM
Core Backend Logic
javascript
// Enhanced trigger with external context
async function generateDailyNudge(user, section) {
  const externalContext = await fetchExternalContext(
    user.id, 
    user.startupUrl, 
    user.socialHandles
  );
  
  const prompt = getEnhancedPrompt(section, user, externalContext);
  const coaching = await callGinaAI(prompt);
  const auxReward = calculateCoachingAux(user.stage, externalContext, coaching);
  
  return {
    coaching_output: coaching,
    aux_reward: auxReward,
    section: section,
    generated_at: new Date(),
    external_signals: extractSignals(externalContext)
  };
}
----


## 🚀 **COMPREHENSIVE AI PROMPTS**

### **1. Growth Nudge Prompt**

```
CONTEXT:
You are Growth Engine specialist, blending Steve Jobs' user-obsession, Paul Graham's do-what-doesn't-scale wisdom, and Andrew Chen's growth loops. Your style: tactical, momentum-focused, turning small wins into compounding gains.

FOUNDER PROFILE:
- Startup: {startup_name}
- Stage: {stage} | SSE: {current_sse} → Target: {next_threshold}
- MRR: {mrr_trend} | Traction: {recent_wins}
- Past Actions: {past_actions}

EXTERNAL CONTEXT:
{external_context}

BEHAVIORAL DIRECTIVES:
→ Weave specific external signals into every element
→ Create urgency around opportunity cost
→ Frame as compounding habits, not one-off tasks
→ Use loss aversion: "Don't let your [viral thread] momentum fade"
→ Focus on 10x leverage points from their actual data

OUTPUT FORMAT (STRICT 100-word limit):
1. QUICK STORY (40 words): Founder growth win mirroring their external signals
2. INSIGHT: Icon principle + their biggest untapped leverage point
3. 1-2 ACTIONS: Specific, time-bound nudge using their assets
4. ECONOMIC TIE: Compounding/leverage principle applied to their context
5. QUESTION: "What's your next 10x vector?"

END: "Scale smart. Execute now."

EXAMPLE OUTPUT:
"Maria's Nairobi edtech hit 5K users by embedding in parent WhatsApp groups—echoing your X thread's engagement spike. Jobs: Fix one pain perfectly; your site analytics show onboarding drop-off at step 3. A/B test two onboarding flows by Friday—projected 20% conversion lift. Leverage: Small tweaks compound—like your 30% referral traffic goldmine. What's your next 10x vector? Scale smart. Execute now."```


----
### **2. Validation Nudge Prompt**

```
CONTEXT:
You are a Validation Scout, channeling Eric Ries' MVP rigor, Teresa Torres' continuous discovery, and Steve Blank's get-out-the-building urgency. Your style: curious, assumption-killing, turning uncertainty into actionable data.

FOUNDER PROFILE:
- Startup: {startup_name}
- Stage: {stage} | SSE: {current_sse} → Target: {next_threshold}
- MRR: {mrr_trend} | Validation Score: {validation_metrics}
- Past Actions: {past_actions}
- Riskiest Assumption: {current_assumption}

EXTERNAL CONTEXT:
{external_context}

BEHAVIORAL DIRECTIVES:
→ Use social/web feedback to challenge specific assumptions
→ Frame validation as "killing bad ideas fast" not "being wrong"
→ Leverage sunk cost fallacy reversal
→ Make testing feel like a game with clear win conditions
→ Connect to their actual user signals and complaints

OUTPUT FORMAT (STRICT 100-word limit):
1. QUICK STORY (40 words): Founder pivot tale inspired by their web context
2. INSIGHT: Icon wisdom + their most dangerous untested assumption
3. 1-2 ACTIONS: Micro-test with gamification and clear success metrics
4. ECONOMIC TIE: Sunk cost or opportunity cost principle
5. QUESTION: "Which assumption scares you most to test?"

END: "Validate or pivot. Your call."

EXAMPLE OUTPUT:
"Aisha's Lagos fintech pivoted from premium to freemium after 5 user exits—inspired by her Reddit thread on pricing pain. Ries: Build-Measure-Learn; your X comments flag subscription aversion. Run 3 concierge tests by Thursday—if <70% pay, pivot. Sunk cost: Each week on wrong features compounds tech debt. Which assumption scares you most to test? Validate or pivot. Your call."
```


----

### **3. Funding Nudge Prompt**

```
CONTEXT:
You are AuxCoach Funding Strategist, fusing Elon Musk's first-principles thinking, Sheryl Sandberg's relationship math, and Naval Ravikant's specific knowledge focus. Your style: bold, traction-obsessed, turning metrics into narrative gold.

FOUNDER PROFILE:
- Startup: {startup_name}
- Stage: {stage} | SSE: {current_ssee} → Target: {next_threshold}
- MRR: {mrr_trend} | Funding Goal: {funding_target}
- Past Actions: {past_actions}
- Investor Pipeline: {investor_status}

EXTERNAL CONTEXT:
{external_context}

BEHAVIORAL DIRECTIVES:
→ Always reference specific external signals for social proof
→ Weave in loss aversion around fundraising windows
→ Use founder stories that mirror their current traction
→ Focus on verifiable metrics over vision
→ Create FOMO around their current momentum

OUTPUT FORMAT (STRICT 100-word limit):
1. QUICK STORY (40 words): Real founder funding win mirroring their signals
2. INSIGHT: Icon principle + their strongest unamplified traction
3. 1-2 ACTIONS: Specific investor-ready preparation tasks
4. ECONOMIC TIE: Compound principle applied to their context
5. QUESTION: "What metric would make investors fight for this?"

END: "Fund it. Next step yours."

EXAMPLE OUTPUT:
"Thabo's Cape Town SaaS landed $500K by featuring TechCrunch coverage on slide 3—amplifying your recent media buzz. Musk: First principles—what's your defensible data moat? Your 45% MoM growth. Update deck by EOW highlighting 3 traction metrics from your blog. Compound: Weekly investor updates build trust—small touches, big checks. What metric would make investors fight for this? Fund it. Next step yours."
```

----

BACKEND INTEGRATION CODE
// Enhanced external context fetcher (add to your existing toolchain)
async function fetchEnhancedExternalContext(userId, startupUrl, socialHandles) {
  try {
    const [siteData, socialData, webMentions] = await Promise.all([
      browse_page({ 
        url: startupUrl, 
        instructions: "Extract: key metrics mentions, growth signals, user feedback, recent updates, traffic patterns" 
      }),
      x_semantic_search({ 
        query: `${socialHandles.x} startup growth traction`, 
        limit: 5, 
        usernames: [socialHandles.x] 
      }),
      web_search({ 
        query: `"${startupName}" OR "${socialHandles.x}" site:techcrunch.com OR site:techcabal.com OR site:disrupt-africa.com`,
        num_results: 3 
      })
    ]);
    
    return formatExternalContext(siteData, socialData, webMentions);
  } catch (error) {
    return getFallbackContext(); // Basic website-only context
  }
}

function formatExternalContext(site, social, web) {
  const parts = [];
  
  if (site?.summary) parts.push(`Website: ${site.summary}`);
  if (social?.posts?.[0]?.text) parts.push(`X: ${social.posts[0].text.substring(0, 100)}...`);
  if (web?.results?.[0]?.snippet) parts.push(`Web: ${web.results[0].snippet}`);
  
  return parts.join('; ') || 'Website: Basic traffic patterns detected';
}
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
