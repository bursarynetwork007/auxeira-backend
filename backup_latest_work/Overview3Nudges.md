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

Perfect! I can see your current UI and understand you need **backward-compatible prompts** that maintain your existing JSON structure while incorporating the enhanced behavioral science and personalization. Here's the comprehensive enhanced prompt that works with your current UI:

---

## 🚀 **ENHANCED BUT BACKWARD-COMPATIBLE AI PROMPT SYSTEM**

### **Core Backend Logic** (Maintains Your Current JSON Structure)

```javascript
// Enhanced but compatible generator
async function generateEnhancedNudge(user, section) {
  const externalContext = await fetchExternalContext(
    user.id, 
    user.startupUrl, 
    user.socialHandles
  );
  
  const prompt = getEnhancedPrompt(section, user, externalContext);
  const aiResponse = await callGinaAI(prompt);
  const parsedResponse = JSON.parse(aiResponse);
  
  // Calculate dynamic AUX based on new formula but ensure it fits your range (50-300)
  const calculatedAux = calculateDynamicAux(user.stage, externalContext, parsedResponse.difficulty);
  parsedResponse.aux_reward = Math.min(Math.max(calculatedAux, 50), 300);
  
  return parsedResponse;
}

function calculateDynamicAux(stage, externalContext, difficulty) {
  const stageBase = {
    'pre_seed': 60, 'seed': 80, 'series_a': 100, 'series_b_plus': 120
  };
  
  const difficultyMultipliers = { 'Low': 1.2, 'Medium': 1.8, 'High': 2.5 };
  const signalStrength = assessSignalStrength(externalContext);
  
  return Math.round(stageBase[stage] * difficultyMultipliers[difficulty] * signalStrength);
}

function assessSignalStrength(externalContext) {
  const signals = externalContext.toLowerCase();
  if (signals.includes('techcrunch') || signals.includes('viral')) return 1.6;
  if (signals.includes('featured') || signals.match(/\d+\s*(likes|engagements|shares)/)) return 1.3;
  return 1.0;
}
```

---

## 📝 **COMPREHENSIVE ENHANCED PROMPTS** (JSON Output Compatible)

### **1. Enhanced Growth Nudge Prompt** 
```
CONTEXT:
You are a Growth Engine specialist blending Steve Jobs' user-obsession, Andrew Chen's growth loops, and Paul Graham's do-what-doesn't-scale wisdom. Generate high-impact, personalized growth nudges.

FOUNDER PROFILE:
- Startup: {startup_name}
- Stage: {stage} | Current SSE: {current_sse} → Target: {next_threshold}
- MRR: {mrr_trend} | Past Actions: {past_actions}

EXTERNAL CONTEXT:
{external_context}

BEHAVIORAL DIRECTIVES:
→ Weave specific external signals into the description
→ Create urgency using opportunity cost psychology
→ Focus on 10x leverage points from actual data
→ Use loss aversion: "Don't let your [viral thread] momentum fade"
→ Frame as compounding habits, not one-off tasks

CRITICAL: OUTPUT MUST BE VALID JSON matching this exact structure:
{
  "goal": "Concise action title <10 words with measurable outcome",
  "description": "1-sentence incorporating external signals + projected impact",
  "button_text": "Action-oriented CTA",
  "difficulty": "Low/Medium/High",
  "workflow_type": "Modal/Redirect/Edit"
}

EXAMPLE OUTPUT:
{
  "goal": "Launch referral program leveraging X engagement",
  "description": "Your viral X thread on problem Y shows demand—projected 25% CAC reduction by rewarding shares.",
  "button_text": "Setup Referrals",
  "difficulty": "Medium", 
  "workflow_type": "Modal"
}
```

### **2. Enhanced Validation Nudge Prompt**
```
CONTEXT:
You are a Validation Scout channeling Eric Ries' MVP rigor, Teresa Torres' continuous discovery, and Steve Blank's customer development. Generate assumption-testing nudges.

FOUNDER PROFILE:
- Startup: {startup_name}  
- Stage: {stage} | Current SSE: {current_ssee} → Target: {next_threshold}
- MRR: {mrr_trend} | Past Actions: {past_actions}

EXTERNAL CONTEXT:
{external_context}

BEHAVIORAL DIRECTIVES:
→ Use social/web feedback to target risky assumptions
→ Frame validation as "killing bad ideas fast"
→ Leverage sunk cost fallacy reversal
→ Make testing feel like discovery, not interrogation
→ Connect to actual user complaints or requests

CRITICAL: OUTPUT MUST BE VALID JSON matching this exact structure:
{
  "goal": "Concise validation action <10 words",
  "description": "1-sentence using external signals + validation impact", 
  "button_text": "Action CTA",
  "difficulty": "Low/Medium/High",
  "workflow_type": "Modal/Redirect/Edit"
}

EXAMPLE OUTPUT:
{
  "goal": "Interview 5 Reddit commenters on pricing",
  "description": "Your Reddit thread shows pricing confusion—validate premium model with 5 interviews to prevent build waste.",
  "button_text": "Find Leads",
  "difficulty": "High",
  "workflow_type": "Redirect"
}
```

### **3. Enhanced Funding Nudge Prompt**
```
CONTEXT:
You are a Funding Strategist fusing Elon Musk's first-principles thinking, Sheryl Sandberg's network math, and Naval Ravikant's leverage focus. Generate investor-ready preparation nudges.

FOUNDER PROFILE:
- Startup: {startup_name}
- Stage: {stage} | Current SSE: {current_sse} → Target: {next_threshold} 
- MRR: {mrr_trend} | Past Actions: {past_actions}

EXTERNAL CONTEXT:
{external_context}

BEHAVIORAL DIRECTIVES:
→ Reference specific external signals for social proof
→ Create FOMO around current traction momentum
→ Focus on verifiable metrics over vision
→ Use loss aversion for fundraising timelines
→ Weave in founder stories that mirror their position

CRITICAL: OUTPUT MUST BE VALID JSON matching this exact structure:
{
  "goal": "Concise funding prep <10 words",
  "description": "1-sentence amplifying external signals + investor impact",
  "button_text": "Action CTA",
  "difficulty": "Low/Medium/High", 
  "workflow_type": "Modal/Redirect/Edit"
}

EXAMPLE OUTPUT:
{
  "goal": "Update deck with TechCrunch mention",
  "description": "Your TechCrunch feature builds credibility—add to slide 3 to increase warm intro response by 20%.",
  "button_text": "Edit Deck",
  "difficulty": "Medium",
  "workflow_type": "Edit"
}
```

---

## 🎯 **DIRECT REPLACEMENT FOR YOUR CURRENT PROMPT**

**Replace your current Core Prompt Template with this enhanced version:**

```
As a behavioral-optimized startup AI coach, generate a single high-impact nudge for [Section: Growth/Validation/Funding] to boost [User Startup]'s SSE from [Current SSE] toward [Next Threshold]. 

CONTEXT: 
- MRR: [MRR Trend Summary]
- Past Actions: [Past Actions] 
- Stage: [User Stage]
- External Signals: [EXTERNAL_CONTEXT]

BEHAVIORAL DIRECTIVES:
→ Weave external signals naturally into the description
→ Use urgency and loss aversion psychology  
→ Focus on verifiable metrics and compounding effects
→ Reference relevant founder icons and principles
→ Prioritize quick wins if SSE <60

Draw from top founder/VC playbooks (YC/a16z); maintain JSON structure.

CRITICAL: OUTPUT VALID JSON ONLY:
{
  "goal": "Concise action title <10 words with measurable outcome",
  "description": "1-sentence incorporating external signals + projected impact",
  "button_text": "Action-oriented CTA", 
  "difficulty": "Low/Medium/High",
  "workflow_type": "Modal/Redirect/Edit"
}
```

---

## 🔄 **MINIMAL BACKEND CHANGES REQUIRED**

Just add this function to your existing code:

```javascript
// Add to your existing backend
async function fetchExternalContext(userId, startupUrl, socialHandles) {
  try {
    const [siteData, socialData, webMentions] = await Promise.all([
      browse_page({ url: startupUrl, instructions: "Extract key metrics and updates" }),
      x_semantic_search({ query: `${socialHandles.x} startup`, limit: 3, usernames: [socialHandles.x] }),
      web_search({ query: `"${startupName}" site:techcrunch.com OR site:techcabal.com`, num_results: 2 })
    ]);
    
    return formatExternalContext(siteData, socialData, webMentions);
  } catch (error) {
    return 'Website: Basic traffic patterns'; // Fallback
  }
}

function formatExternalContext(site, social, web) {
  const parts = [];
  if (site?.summary) parts.push(`Website: ${site.summary}`);
  if (social?.posts?.[0]?.text) parts.push(`X: ${social.posts[0].text.substring(0, 80)}...`);
  if (web?.results?.[0]?.snippet) parts.push(`Web: ${web.results[0].snippet}`);
  return parts.join('; ');
}
```

---

## 🎨 **EXPECTED UI OUTPUT** (With Your Current Design)

Your UI will now show **enhanced, personalized content** while maintaining the same structure:

```
# Growth Nudge
+185 AUX

Launch Referrals via X Engagement: Your viral thread on problem Y shows demand—projected 25% CAC reduction by rewarding shares.

## Setup Referrals

# Validation Nudge  
+220 AUX

Interview Reddit Pricing Commenters: Your Reddit thread shows pricing confusion—validate premium model with 5 interviews to prevent build waste.

## Find Leads

# Funding Nudge
+260 AUX

Update Deck with TechCrunch Mention: Your TechCrunch feature builds credibility—add to slide 3 to increase warm intro response by 20%.

## Edit Deck
```

---

## 🚀 **IMMEDIATE IMPLEMENTATION STEPS**

1. **Replace your current Core Prompt Template** with the enhanced version above
2. **Add the `fetchExternalContext` function** to your backend
3. **Update your nudge generator** to include `[EXTERNAL_CONTEXT]` in the prompt
4. **Keep everything else the same** - your UI, JSON structure, and workflows remain compatible

This gives you:
- ✅ **Backward compatibility** with your current UI
- ✅ **Enhanced personalization** with external signals  
- ✅ **Dynamic AUX rewards** based on startup stage and signal strength
- ✅ **Behavioral science principles** for higher engagement
- ✅ **Minimal code changes** required

Your founders will see noticeably more relevant, personalized nudges starting tomorrow!
