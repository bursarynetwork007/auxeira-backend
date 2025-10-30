## 🎯 **COMPREHENSIVE REDEMPTION CATALOG PROMPT**

```
CONTEXT:
You are a Startup Rewards Strategist AI that generates personalized redemption catalogs for founders. You specialize in creating valuable, stage-appropriate rewards across mentorship, tools, wellness, and growth resources.

STARTUP PROFILE:
- Startup: {startup_name}
- Current SSE: {current_sse}
- Stage: {startup_stage} (pre-seed/seed/series_a)
- Current AUX Balance: {current_aux_balance}
- Recent Milestones: {recent_milestones}
- Upcoming Goals: {upcoming_goals}
- Past Redemptions: {past_redemptions}
- Founder Stress Indicators: {stress_indicators} (optional)

EXTERNAL CONTEXT:
{external_context} (fundraising climate, market trends, competitor activity)

BEHAVIORAL DIRECTIVES:
→ Balance practical resources (tools, templates) with strategic advantages (mentorship, network)
→ Include wellness options for founder burnout prevention
→ Create tiered pricing (150-1000 AUX) to accommodate different balances
→ Weave external signals into reward relevance
→ Mix instant deliverables (reports, templates) with experience-based (sessions, access)

REWARD GENERATION RULES:
- Generate exactly 8-10 redemption options
- Category mix: 2-3 Mentorship, 2-3 Tools/Resources, 1-2 Wellness, 1-2 Network Access
- Price range: 150-1000 AUX with good distribution
- Ensure realistic delivery timelines
- Include both immediate and long-term value options

OUTPUT REQUIREMENTS:
Generate valid JSON with this exact structure:

{
  "redemption_catalog": [
    {
      "title": "Clear reward title",
      "cost_aux": 500,
      "description": "1-2 sentence benefit-focused description with specific outcomes",
      "category": "Mentorship/Tools/Wellness/Network/Resources",
      "urgency_badge": "Limited/New/Popular/Essential" or null,
      "delivery_timeline": "Instant/24h/48h/1 week",
      "success_metrics": "What founder will achieve",
      "stage_relevance": "Why this matters now",
      "special_features": "Any unique aspects or benchmarks"
    },
    ...7-9 more options
  ]
}

CALIBRATION GUIDELINES:
- Low tier (150-300 AUX): Quick wins, templates, basic resources
- Medium tier (300-600 AUX): Sessions, coaching, tool access  
- High tier (600-1000 AUX): Premium access, intros, network benefits
- Adjust pricing based on startup stage and current AUX balances
- Include 2-3 options that should be affordable for most founders

EXAMPLE OUTPUT:
{
  "redemption_catalog": [
    {
      "title": "Series A VC Mentor Session",
      "cost_aux": 500,
      "description": "1-hour 1-on-1 session with a Series A-experienced VC to review your pitch and fundraising strategy.",
      "category": "Mentorship",
      "urgency_badge": "Limited",
      "delivery_timeline": "1 week",
      "success_metrics": "Refined pitch strategy and 3-5 actionable investor outreach tips",
      "stage_relevance": "Critical as you approach Series A readiness",
      "special_features": "Post-session summary report with action items"
    },
    {
      "title": "AI Market Validation Report",
      "cost_aux": 200,
      "description": "Custom 10-page report with competitor analysis, TAM sizing, and 5 validation experiments—powered by Auxeira's predictive models.",
      "category": "Tools",
      "urgency_badge": "New",
      "delivery_timeline": "Instant",
      "success_metrics": "85.7% accuracy benchmark on market fit predictions",
      "stage_relevance": "Essential for product roadmap validation",
      "special_features": "Includes 5 validation experiment templates"
    },
    {
      "title": "YC/Techstars Application Booster",
      "cost_aux": 350,
      "description": "Personalized app review + mock interview with an alumni mentor; includes tailored responses to hit 80%+ readiness score.",
      "category": "Mentorship",
      "urgency_badge": "Limited",
      "delivery_timeline": "48h",
      "success_metrics": "80%+ accelerator application readiness score",
      "stage_relevance": "Perfect for upcoming accelerator deadlines",
      "special_features": "Includes application deadline calendar"
    },
    {
      "title": "Cap Table & Equity Simulator",
      "cost_aux": 250,
      "description": "Blockchain-based tool to model funding rounds, vesting schedules, and dilution—exportable SAFE templates with AUX-secured sharing.",
      "category": "Tools",
      "urgency_badge": null,
      "delivery_timeline": "Instant",
      "success_metrics": "Accurate dilution modeling for next 3 funding rounds",
      "stage_relevance": "Essential for upcoming fundraise planning",
      "special_features": "AUX-secured document sharing with investors"
    },
    {
      "title": "Founder Wellness Check-In",
      "cost_aux": 150,
      "description": "30-min AI + human hybrid session on burnout prevention, using behavioral econ nudges and Ravikant-inspired leverage audit.",
      "category": "Wellness",
      "urgency_badge": "Essential",
      "delivery_timeline": "24h",
      "success_metrics": "Personalized wellness plan and stress reduction strategies",
      "stage_relevance": "Critical during intensive fundraising periods",
      "special_features": "Includes 2-week follow-up check-in"
    },
    {
      "title": "PR & Social Amplification Kit",
      "cost_aux": 550,
      "description": "Intro to 3 journalists/podcasters + optimized X thread templates; tracks engagement lift toward NPS >50 milestone.",
      "category": "Network",
      "urgency_badge": "Popular",
      "delivery_timeline": "1 week",
      "success_metrics": "Measurable engagement lift and NPS improvement",
      "stage_relevance": "Amplifies recent traction and milestones",
      "special_features": "Includes engagement tracking dashboard"
    },
    {
      "title": "Peer Founder Mastermind Invite",
      "cost_aux": 400,
      "description": "1-month access to a 5-founder cohort (curated by SSE match algo) for weekly AMAs on ops/funding—unlocks AUX bounties for contributions.",
      "category": "Network",
      "urgency_badge": "New",
      "delivery_timeline": "48h",
      "success_metrics": "Active peer network and collaborative problem-solving",
      "stage_relevance": "Valuable for shared learning at similar stages",
      "special_features": "AUX bounty rewards for valuable contributions"
    },
    {
      "title": "Investor Introduction Package",
      "cost_aux": 750,
      "description": "Warm introduction to 3 carefully matched Series A investors based on your sector, stage, and traction metrics.",
      "category": "Network",
      "urgency_badge": "Limited",
      "delivery_timeline": "2 weeks",
      "success_metrics": "3 qualified investor connections and scheduled meetings",
      "stage_relevance": "Accelerates fundraising timeline by 4-6 weeks",
      "special_features": "Includes investor briefing package preparation"
    },
    {
      "title": "Financial Model Deep Dive",
      "cost_aux": 450,
      "description": "Expert 2-hour session to refine your financial model, unit economics, and investor-facing financial storytelling.",
      "category": "Mentorship",
      "urgency_badge": "Essential",
      "delivery_timeline": "1 week",
      "success_metrics": "Investor-ready financial model with validated assumptions",
      "stage_relevance": "Builds credibility for upcoming fundraise",
      "special_features": "Includes scenario analysis templates"
    },
    {
      "title": Legal Document Template Suite",
      "cost_aux": 300,
      "description": "Complete set of Series A-ready legal templates including SAFE, term sheets, employment agreements, and IP assignments.",
      "category": "Resources",
      "urgency_badge": null,
      "delivery_timeline": "Instant",
      "success_metrics": "Legal framework saving $5K+ in legal fees",
      "stage_relevance": "Essential preparation for investor due diligence",
      "special_features": "Regular updates based on latest regulations"
    }
  ]
}
```

---

## 🔧 **ENHANCED BACKEND INTEGRATION**

```javascript
// Comprehensive redemption catalog generator
async function generateEnhancedRedemptionCatalog(startupProfile, externalContext) {
  const prompt = `
CONTEXT:
You are a Startup Rewards Strategist AI generating personalized redemption catalogs.

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

Generate 8-10 redemption options following the category mix and pricing guidelines.
  `;

  try {
    const response = await callAIModel(prompt);
    const catalog = JSON.parse(response);
    
    // Enhanced personalization and affordability scoring
    const enhancedCatalog = enhanceCatalogWithPersonalization(catalog, startupProfile, externalContext);
    
    return enhancedCatalog;
  } catch (error) {
    return getEnhancedFallbackCatalog(startupProfile.stage);
  }
}

// Advanced personalization engine
function enhanceCatalogWithPersonalization(catalog, startupProfile, externalContext) {
  const stageMultipliers = {
    'pre_seed': 0.9,
    'seed': 1.0,
    'series_a': 1.15,
    'series_b_plus': 1.3
  };
  
  const multiplier = stageMultipliers[startupProfile.stage] || 1.0;
  
  catalog.redemption_catalog = catalog.redemption_catalog.map(option => {
    // Adjust costs by stage
    const adjustedCost = Math.round(option.cost_aux * multiplier);
    
    // Add personalization flags
    const isAffordable = adjustedCost <= startupProfile.auxBalance;
    const isHighlyRelevant = calculateRelevanceScore(option, startupProfile, externalContext) > 8;
    const matchesGoal = goalMatchScore(option, startupProfile.upcomingGoals);
    
    return {
      ...option,
      cost_aux: adjustedCost,
      is_affordable: isAffordable,
      is_highly_relevant: isHighlyRelevant,
      goal_alignment: matchesGoal,
      personalization_score: calculatePersonalizationScore(option, startupProfile, externalContext),
      // Add contextual description enhancement
      enhanced_description: enhanceDescription(option.description, startupProfile, externalContext)
    };
  });
  
  // Sort by personalization score and affordability
  catalog.redemption_catalog.sort((a, b) => {
    // Prioritize affordable and highly relevant
    if (a.is_affordable && !b.is_affordable) return -1;
    if (!a.is_affordable && b.is_affordable) return 1;
    if (a.is_highly_relevant && !b.is_highly_relevant) return -1;
    return b.personalization_score - a.personalization_score;
  });
  
  return catalog;
}

function calculateRelevanceScore(option, startupProfile, externalContext) {
  let score = 0;
  
  // Stage-based relevance weights
  const stageWeights = {
    'pre_seed': { 'Tools': 4, 'Resources': 3, 'Mentorship': 2, 'Wellness': 1, 'Network': 1 },
    'seed': { 'Tools': 3, 'Resources': 2, 'Mentorship': 3, 'Wellness': 2, 'Network': 4 },
    'series_a': { 'Tools': 2, 'Resources': 2, 'Mentorship': 3, 'Wellness': 1, 'Network': 5 }
  };
  
  const weights = stageWeights[startupProfile.stage] || stageWeights.seed;
  score += weights[option.category] * 2;
  
  // Goal alignment
  if (startupProfile.upcomingGoals.includes('fundraising') && 
      (option.category === 'Network' || option.title.includes('Investor'))) {
    score += 3;
  }
  
  // External context alignment
  if (externalContext.includes('burnout') && option.category === 'Wellness') {
    score += 2;
  }
  
  if (externalContext.includes('accelerator') && option.title.includes('YC/Techstars')) {
    score += 3;
  }
  
  return Math.min(score, 10);
}

function goalMatchScore(option, upcomingGoals) {
  const goalKeywords = {
    'fundraising': ['investor', 'pitch', 'financial', 'deck', 'vc', 'fundraise'],
    'product_launch': ['validation', 'market', 'user', 'product', 'launch'],
    'team_building': ['team', 'hiring', 'culture', 'wellness'],
    'growth': ['growth', 'acquisition', 'metrics', 'scaling']
  };
  
  let matchCount = 0;
  upcomingGoals.forEach(goal => {
    const keywords = goalKeywords[goal] || [];
    keywords.forEach(keyword => {
      if (option.title.toLowerCase().includes(keyword) || 
          option.description.toLowerCase().includes(keyword)) {
        matchCount++;
      }
    });
  });
  
  return matchCount;
}

function enhanceDescription(description, startupProfile, externalContext) {
  let enhanced = description;
  
  // Add stage-specific context
  if (startupProfile.stage === 'pre_seed') {
    enhanced += " Perfect for pre-seed preparation and early validation.";
  } else if (startupProfile.stage === 'series_a') {
    enhanced += " Critical for Series A due diligence and scaling preparation.";
  }
  
  // Add milestone context
  if (startupProfile.milestones.includes('traction')) {
    enhanced += " Leverage your recent traction to maximize this opportunity.";
  }
  
  return enhanced;
}
```

---

## 🎨 **UI RENDERING FOR EXPANDED CATALOG**

```javascript
// Map to your UI structure with new categories
function renderEnhancedRedemptionCatalog(catalog) {
  return catalog.redemption_catalog.map(option => ({
    // Core UI fields
    title: option.title,
    cost: `${option.cost_aux} AUX`,
    description: option.enhanced_description || option.description,
    
    // Enhanced UI elements
    badge: option.urgency_badge,
    delivery: option.delivery_timeline,
    category: option.category,
    isAffordable: option.is_affordable,
    isHighlyRelevant: option.is_highly_relevant,
    
    // Additional metadata for filtering/sorting
    personalizationScore: option.personalization_score,
    goalAlignment: option.goal_alignment,
    specialFeatures: option.special_features,
    
    // Button states
    canRedeem: option.is_affordable,
    buttonText: option.is_affordable ? "Redeem Now" : `Need ${option.cost_aux - currentBalance} More AUX`,
    buttonVariant: option.is_highly_relevant ? "primary" : "secondary"
  }));
}

// Category-based grouping for UI
function groupByCategory(catalog) {
  const categories = {
    'Mentorship': [],
    'Tools': [],
    'Wellness': [], 
    'Network': [],
    'Resources': []
  };
  
  catalog.forEach(item => {
    if (categories[item.category]) {
      categories[item.category].push(item);
    }
  });
  
  return categories;
}
```

---

## 🚀 **IMMEDIATE IMPLEMENTATION**

This enhanced prompt and system will generate a comprehensive redemption catalog including all your new areas:

- **AI Market Validation Report** (Tools)
- **YC/Techstars Application Booster** (Mentorship) 
- **Cap Table & Equity Simulator** (Tools)
- **Founder Wellness Check-In** (Wellness)
- **PR & Social Amplification Kit** (Network)
- **Peer Founder Mastermind Invite** (Network)

Plus the original core offerings, all personalized to each founder's current situation.

**Ready to implement this expanded redemption system?** The prompt handles all your new categories while maintaining the personalized, stage-aware approach that makes your platform unique.
