## 🎯 **AI REDEMPTION CATALOG PROMPT**

```
CONTEXT:
You are a Startup Rewards Strategist AI that generates personalized redemption options for founders based on their current stage, SSE score, and recent activities. You specialize in creating valuable, stage-appropriate rewards that drive engagement and progress.

STARTUP PROFILE:
- Startup: {startup_name}
- Current SSE: {current_sse}
- Stage: {startup_stage} (pre-seed/seed/series_a)
- Current AUX Balance: {current_aux_balance}
- Recent Milestones: {recent_milestones}
- Upcoming Goals: {upcoming_goals} (e.g., fundraising, product launch)
- Past Redemptions: {past_redemptions}

EXTERNAL CONTEXT:
{external_context} (fundraising climate, market trends, investor activity)

BEHAVIORAL DIRECTIVES:
→ Prioritize rewards that address the founder's current biggest challenges
→ Create tiered options (low/medium/high AUX) to accommodate different balances
→ Weave external signals into reward descriptions for relevance
→ Balance immediate value (resources) with long-term value (connections)
→ Create scarcity and urgency for high-value items

REWARD GENERATION RULES:
- Generate exactly 6 redemption options
- Tier distribution: 2 Low (200-400), 2 Medium (400-700), 2 High (700-1000+ AUX)
- Mix of categories: Mentorship, Investor Access, Resources, Tools
- Ensure rewards are realistically deliverable
- Align with current startup stage and immediate needs

OUTPUT REQUIREMENTS:
Generate valid JSON with this exact structure:

{
  "redemption_options": [
    {
      "title": "Clear reward title",
      "cost_aux": 500,
      "description": "1-2 sentence benefit-focused description with outcome",
      "category": "Mentorship/Investor Access/Resources/Tools",
      "urgency_badge": "Limited/New/Popular" or null,
      "delivery_timeline": "Instant/24h/1 week",
      "success_metrics": "What founder will achieve",
      "stage_relevance": "Why this matters now"
    },
    ...5 more options
  ]
}

CALIBRATION GUIDELINES:
- Low tier (200-400 AUX): Templates, quick reviews, basic resources
- Medium tier (400-700 AUX): Sessions, coaching, tool access
- High tier (700-1000+ AUX): Investor intros, network access, premium services
- Adjust costs upward for later startup stages
- Ensure 2-3 options are achievable with current average AUX balances

EXAMPLE OUTPUT:
{
  "redemption_options": [
    {
      "title": "Series A VC Mentor Session",
      "cost_aux": 500,
      "description": "1-hour 1-on-1 session with a Series A-experienced VC to review your pitch and fundraising strategy.",
      "category": "Mentorship",
      "urgency_badge": "Limited",
      "delivery_timeline": "1 week",
      "success_metrics": "Refined pitch strategy and 3-5 actionable investor outreach tips",
      "stage_relevance": "Critical as you approach Series A readiness"
    },
    {
      "title": "Investor Introduction",
      "cost_aux": 750,
      "description": "Warm introduction to a carefully matched Series A investor based on your sector and traction.",
      "category": "Investor Access", 
      "urgency_badge": "Popular",
      "delivery_timeline": "2 weeks",
      "success_metrics": "Direct investor connection and scheduled first meeting",
      "stage_relevance": "Accelerates fundraising timeline by 4-6 weeks"
    },
    {
      "title": "Legal Document Template Pack",
      "cost_aux": 300,
      "description": "Series A-ready legal templates including SAFE agreements, term sheets, and cap table templates.",
      "category": "Resources",
      "urgency_badge": null,
      "delivery_timeline": "Instant",
      "success_metrics": "Legal framework saving $5K+ in legal fees",
      "stage_relevance": "Essential preparation for investor due diligence"
    },
    {
      "title": "Financial Model Expert Review",
      "cost_aux": 400,
      "description": "Comprehensive review of your financial projections by a startup financial expert with feedback.",
      "category": "Mentorship",
      "urgency_badge": "New",
      "delivery_timeline": "3 days", 
      "success_metrics": "Investor-ready financial model with validated assumptions",
      "stage_relevance": "Builds credibility for upcoming fundraise"
    },
    {
      "title": "Pitch Deck Coaching Package",
      "cost_aux": 600,
      "description": "3-session pitch coaching with a top pitch coach to refine narrative, slides, and delivery.",
      "category": "Mentorship",
      "urgency_badge": "Limited",
      "delivery_timeline": "2 weeks",
      "success_metrics": "Polished, investor-winning pitch deck and presentation skills",
      "stage_relevance": "Maximizes impact of investor meetings"
    },
    {
      "title": "Investor Network Access",
      "cost_aux": 1000,
      "description": "3-month access to Auxeira's premium investor network with curated introductions and deal flow.",
      "category": "Investor Access",
      "urgency_badge": "Popular", 
      "delivery_timeline": "24h",
      "success_metrics": "Multiple qualified investor connections and increased deal visibility",
      "stage_relevance": "Game-changing for Series A fundraising process"
    }
  ]
}
```

---

## 🔧 **BACKEND INTEGRATION CODE**

```javascript
// Redemption Catalog Generator
async function generateRedemptionCatalog(startupProfile, externalContext) {
  const prompt = `
CONTEXT:
You are a Startup Rewards Strategist AI generating personalized redemption options.

STARTUP PROFILE:
- Startup: ${startupProfile.name}
- Current SSE: ${startupProfile.sse}
- Stage: ${startupProfile.stage}
- Current AUX Balance: ${startupProfile.auxBalance}
- Recent Milestones: ${startupProfile.milestones}
- Upcoming Goals: ${startupProfile.upcomingGoals}
- Past Redemptions: ${startupProfile.pastRedemptions}

EXTERNAL CONTEXT:
${externalContext}

Generate exactly 6 redemption options following the tier distribution and JSON structure.
  `;

  try {
    const response = await callAIModel(prompt);
    const catalog = JSON.parse(response);
    
    // Ensure options are affordable and relevant
    const validatedCatalog = validateAndRankOptions(catalog, startupProfile.auxBalance, startupProfile.stage);
    
    return validatedCatalog;
  } catch (error) {
    return getFallbackRedemptionCatalog(startupProfile.stage);
  }
}

// Validation and ranking
function validateAndRankOptions(catalog, auxBalance, stage) {
  const stageMultipliers = {
    'pre_seed': 0.8,
    'seed': 1.0,
    'series_a': 1.2,
    'series_b_plus': 1.4
  };
  
  const multiplier = stageMultipliers[stage] || 1.0;
  
  // Adjust costs by stage and ensure affordability
  catalog.redemption_options = catalog.redemption_options.map(option => ({
    ...option,
    cost_aux: Math.round(option.cost_aux * multiplier),
    // Add affordability indicator
    is_affordable: option.cost_aux <= auxBalance,
    // Add value score for sorting
    value_score: calculateValueScore(option, stage)
  }));
  
  // Sort by value score and affordability
  catalog.redemption_options.sort((a, b) => {
    if (a.is_affordable && !b.is_affordable) return -1;
    if (!a.is_affordable && b.is_affordable) return 1;
    return b.value_score - a.value_score;
  });
  
  return catalog;
}

function calculateValueScore(option, stage) {
  let score = 0;
  
  // Category weights by stage
  const stageWeights = {
    'pre_seed': { 'Mentorship': 3, 'Resources': 2, 'Tools': 1, 'Investor Access': 1 },
    'seed': { 'Mentorship': 2, 'Resources': 2, 'Tools': 2, 'Investor Access': 3 },
    'series_a': { 'Mentorship': 1, 'Resources': 1, 'Tools': 2, 'Investor Access': 4 }
  };
  
  const weights = stageWeights[stage] || stageWeights.seed;
  score += weights[option.category] * 10;
  
  // Cost efficiency (lower cost per AUX = higher score)
  score += (1000 / option.cost_aux) * 2;
  
  // Urgency bonus
  if (option.urgency_badge) score += 5;
  
  return Math.round(score);
}

// Fallback catalog
function getFallbackRedemptionCatalog(stage) {
  const baseCatalog = {
    "redemption_options": [
      {
        "title": "VC Mentor Session",
        "cost_aux": 500,
        "description": "1-hour 1-on-1 session with an experienced VC to review your strategy and pitch.",
        "category": "Mentorship",
        "urgency_badge": "Limited",
        "delivery_timeline": "1 week",
        "success_metrics": "Refined fundraising strategy and actionable feedback",
        "stage_relevance": "Accelerates investor readiness"
      },
      {
        "title": "Investor Introduction",
        "cost_aux": 750,
        "description": "Warm introduction to a matched investor based on your sector and stage.",
        "category": "Investor Access",
        "urgency_badge": "Popular", 
        "delivery_timeline": "2 weeks",
        "success_metrics": "Direct investor connection and meeting scheduled",
        "stage_relevance": "Opens doors to qualified capital"
      },
      {
        "title": "Legal Template Pack",
        "cost_aux": 300,
        "description": "Startup legal templates including SAFE agreements and term sheets.",
        "category": "Resources",
        "urgency_badge": null,
        "delivery_timeline": "Instant",
        "success_metrics": "Legal framework saving thousands in fees",
        "stage_relevance": "Essential for fundraising preparation"
      },
      {
        "title": "Financial Model Review",
        "cost_aux": 400,
        "description": "Expert review of your financial projections and unit economics.",
        "category": "Mentorship",
        "urgency_badge": "New",
        "delivery_timeline": "3 days",
        "success_metrics": "Investor-ready financial model",
        "stage_relevance": "Builds credibility with investors"
      },
      {
        "title": "Pitch Deck Coaching",
        "cost_aux": 600,
        "description": "Multi-session pitch coaching to refine your narrative and delivery.",
        "category": "Mentorship", 
        "urgency_badge": "Limited",
        "delivery_timeline": "2 weeks",
        "success_metrics": "Polished, compelling investor pitch",
        "stage_relevance": "Maximizes meeting outcomes"
      },
      {
        "title": "Investor Network Access",
        "cost_aux": 1000,
        "description": "Extended access to curated investor network and deal flow.",
        "category": "Investor Access",
        "urgency_badge": "Popular",
        "delivery_timeline": "24h",
        "success_metrics": "Multiple qualified investor connections",
        "stage_relevance": "Accelerates entire fundraising process"
      }
    ]
  };
  
  return validateAndRankOptions(baseCatalog, 0, stage); // 0 balance for fallback
}
```

---

## 🎨 **UI RENDERING SUGGESTION**

```javascript
// Map to your existing UI structure
function renderRedemptionCatalog(catalog) {
  return catalog.redemption_options.map(option => ({
    // Your exact UI fields from screenshot
    title: option.title,
    cost: `${option.cost_aux} AUX`,
    description: option.description,
    
    // Additional UI enhancements
    badge: option.urgency_badge,
    delivery: option.delivery_timeline,
    isAffordable: option.is_affordable,
    category: option.category,
    
    // For the "Redeem" button state
    canRedeem: option.is_affordable,
    buttonText: option.is_affordable ? "Redeem Now" : "Earn More AUX"
  }));
}
```

---

## 📊 **PERSONALIZATION LOGIC**

```javascript
// Smart reward personalization
function personalizeRewards(catalog, startupProfile) {
  return catalog.redemption_options.map(option => {
    let personalizedDescription = option.description;
    
    // Add stage-specific context
    if (startupProfile.stage === 'pre_seed') {
      personalizedDescription += " Perfect for pre-seed preparation and angel fundraising.";
    } else if (startupProfile.stage === 'series_a') {
      personalizedDescription += " Critical for Series A due diligence and partner meetings.";
    }
    
    // Add milestone context
    if (startupProfile.milestones.includes('fundraising')) {
      personalizedDescription += " Accelerate your current fundraise with this exclusive access.";
    }
    
    return {
      ...option,
      description: personalizedDescription,
      // Highlight if particularly relevant
      is_highly_relevant: isHighlyRelevant(option, startupProfile)
    };
  });
}

function isHighlyRelevant(option, startupProfile) {
  const relevanceRules = {
    'pre_seed': ['Legal Template Pack', 'Financial Model Review'],
    'seed': ['Investor Introduction', 'Pitch Deck Coaching'],
    'series_a': ['Investor Network Access', 'VC Mentor Session']
  };
  
  return relevanceRules[startupProfile.stage]?.includes(option.title) || false;
}
```

---


---

## 🚀 **IMMEDIATE IMPLEMENTATION**

1. **Use the provided prompt** as your redemption catalog generator
2. **Integrate the backend code** for stage-based personalization
3. **Render in your existing UI** with the enhanced fields
4. **Track redemption patterns** to optimize future offerings

This system creates a **dynamic, personalized redemption experience** that feels tailored to each founder's current situation while maintaining your clean UI structure.

**Ready to implement this redemption system?** The prompt is optimized for your exact use case and UI.
