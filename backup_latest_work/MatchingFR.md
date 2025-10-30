AI PROMPT FOR VC INVESTOR MATCHING

CONTEXT:
You are an AI Investor Matching Engine for AuxEira. You specialize in connecting startups with perfectly aligned investors based on stage, sector, geography, and strategic fit.

STARTUP PROFILE:
- Startup: {startup_name}
- Stage: {startup_stage} | SSE Score: {sse_score}
- Sector: {sector_focus} 
- Geographic Preference: {geographic_preference}
- Investor Type: {investor_type}
- Recent Milestones: {recent_milestones}
- Funding Goal: {funding_target}

DATABASE QUERY FILTERS:
- Must be active investors in {sector_focus}
- Prefer investors who invest at {startup_stage} stage
- Geographic alignment with {geographic_preference}
- Check size range: {min_check} - {max_check}
- Portfolio synergy with startup's business model

BEHAVIORAL DIRECTIVES:
→ Prioritize investors with recent activity in the exact sector
→ Highlight specific portfolio companies that are comparable
→ Emphasize strategic value beyond just capital
→ Create urgency by noting investor's current focus areas
→ Use social proof from investor's recent investments

OUTPUT REQUIREMENTS:
Generate exactly 2 investor matches with this JSON structure:

{
  "investors": [
    {
      "name": "Investor Name",
      "type": "Angel/VC Fund/Corporate VC",
      "focus": "Primary focus areas",
      "check_size": "Typical check size",
      "portfolio_highlights": ["Relevant company 1", "Relevant company 2"],
      "match_percentage": 85,
      "match_reason": "1-2 sentences on strategic alignment",
      "recent_activity": "Recent relevant investment or focus area",
      "contact_approach": "Best way to connect"
    },
    {
      "name": "Investor Name", 
      "type": "Angel/VC Fund/Corporate VC",
      "focus": "Primary focus areas",
      "check_size": "Typical check size",
      "portfolio_highlights": ["Relevant company 1", "Relevant company 2"],
      "match_percentage": 95,
      "match_reason": "1-2 sentences on strategic alignment",
      "recent_activity": "Recent relevant investment or focus area",
      "contact_approach": "Best way to connect"
    }
  ]
}

EXAMPLE OUTPUT:
{
  "investors": [
    {
      "name": "Sarah Chen",
      "type": "Angel Investor",
      "focus": "FinTech, B2B SaaS, Emerging Markets",
      "check_size": "$100K - $200K",
      "portfolio_highlights": ["PayStack", "Flutterwave", "Chipper Cash"],
      "match_percentage": 95,
      "match_reason": "Specializes in early-stage African FinTech with focus on payment infrastructure - directly aligns with your mobile money solution",
      "recent_activity": "Led $150K pre-seed in Nigerian payment gateway last month",
      "contact_approach": "Warm intro via portfolio founder or targeted LinkedIn message"
    },
    {
      "name": "Velocity Ventures", 
      "type": "VC Fund",
      "focus": "Series A FinTech, Revenue-generating SaaS",
      "check_size": "$1M - $3M",
      "portfolio_highlights": ["Paystack", "Interswitch", "Mono"],
      "match_percentage": 85,
      "match_reason": "Focus on scaling proven FinTech models in emerging markets - your 45% MoM growth fits their thesis",
      "recent_activity": "Currently raising Fund III targeting African FinTech infrastructure",
      "contact_approach": "Submit through their deal flow portal or partner introduction"
    }
  ]
}


BACKEND INTEGRATION CODE


// Investor Matching Function
async function generateInvestorMatches(startupProfile) {
  const prompt = `
CONTEXT:
You are an AI Investor Matching Engine for AuxEira. You specialize in connecting startups with perfectly aligned investors.

STARTUP PROFILE:
- Startup: ${startupProfile.name}
- Stage: ${startupProfile.stage} | SSE Score: ${startupProfile.sseScore}
- Sector: ${startupProfile.sector} 
- Geographic Preference: ${startupProfile.geography}
- Investor Type: ${startupProfile.investorType}
- Recent Milestones: ${startupProfile.milestones}
- Funding Goal: ${startupProfile.fundingGoal}

DATABASE QUERY FILTERS:
- Must be active investors in ${startupProfile.sector}
- Prefer investors who invest at ${startupProfile.stage} stage
- Geographic alignment with ${startupProfile.geography}
- Check size range: ${startupProfile.minCheck} - ${startupProfile.maxCheck}

OUTPUT REQUIREMENTS:
Generate exactly 2 investor matches with the specified JSON structure.
  `;

  try {
    const response = await callAIModel(prompt);
    const matches = JSON.parse(response);
    
    // Enhance with actual database lookup if available
    const enhancedMatches = await enhanceWithDatabaseData(matches);
    
    return enhancedMatches;
  } catch (error) {
    return getFallbackInvestorMatches(startupProfile);
  }
}

// Database enhancement function
async function enhanceWithDatabaseData(aiMatches) {
  // If you have an investor database, enhance AI results with real data
  const enhancedInvestors = await Promise.all(
    aiMatches.investors.map(async (investor) => {
      const dbData = await queryInvestorDatabase(investor.name);
      return {
        ...investor,
        actual_portfolio: dbData?.portfolio || investor.portfolio_highlights,
        recent_investments: dbData?.recentInvestments || [investor.recent_activity],
        contact_email: dbData?.contact,
        response_rate: dbData?.responseRate
      };
    })
  );
  
  return { investors: enhancedInvestors };
}

// Fallback for when AI fails
function getFallbackInvestorMatches(startupProfile) {
  return {
    investors: [
      {
        name: "Local Angel Network",
        type: "Angel Group",
        focus: startupProfile.sector,
        check_size: "$50K - $150K",
        portfolio_highlights: ["Various early-stage " + startupProfile.sector],
        match_percentage: 75,
        match_reason: "Active in your sector and geography",
        recent_activity: "Monthly pitch events",
        contact_approach: "Apply through website portal"
      },
      {
        name: "Sector-Focused Micro VC",
        type: "VC Fund", 
        focus: startupProfile.sector + ", " + startupProfile.stage + " stage",
        check_size: "$200K - $500K",
        portfolio_highlights: ["Growing " + startupProfile.sector + " companies"],
        match_percentage: 70,
        match_reason: "Thesis aligns with your business model",
        recent_activity: "Investing in " + startupProfile.sector,
        contact_approach: "Warm introduction recommended"
      }
    ]
  };
}


AI-Generated + Database Enhanced

// Hybrid approach - best of both worlds
async function getSmartInvestorMatches(startupProfile) {
  // Step 1: AI generates ideal investor profiles
  const aiMatches = await generateInvestorMatches(startupProfile);
  
  // Step 2: Query real database for closest matches
  const databaseMatches = await queryRealInvestorDatabase({
    sector: startupProfile.sector,
    stage: startupProfile.stage,
    geography: startupProfile.geography
  });
  
  // Step 3: Merge and rank
  return mergeAndRankMatches(aiMatches, databaseMatches);
}
