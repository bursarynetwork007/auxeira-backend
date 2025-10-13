const getBaseSystemPrompt = (orgName) => `You are an ESG report generator for ${orgName}. Generate professional reports of 1200-1500 words. Output ONLY valid JSON with NO markdown. Structure: {title, executive_summary (150 words), full_narrative (1200-1500 words), key_metrics (array of 4-5 objects), success_stories (array of 2 objects), policy_insights (150 words), roi_projection (150 words), recommended_actions (array of 5 strings), chart_data (object)}`;

const prompts = {
  impact_story: (profile, scrapedData) => ({
    system: getBaseSystemPrompt(profile.organizationName),
    user: `Generate an Impact Story Report for ${profile.organizationName} (${profile.sectorType}) in ${profile.country}.

Focus: ${profile.focusAreas}
Goals: ${profile.goalStatement}
Budget: $${profile.annualSpend || '500,000'}

Create 1200-1500 word narrative with:
- 3 anonymized transformation stories
- Specific measurable outcomes
- SDG 4, 5, 10 alignment
- ROI calculation with economic value
- 5 recommended actions

Include chart_data:
{
  "student_growth": {
    "type": "line",
    "labels": ["2020", "2021", "2022", "2023", "2024", "2025"],
    "data": [15000, 18500, 23000, 28500, 34000, 41000]
  }
}`
  }),

  comparative_benchmark: (profile, scrapedData) => ({
    system: getBaseSystemPrompt(profile.organizationName) + ` Focus on comparative analysis.`,
    user: `Generate Comparative Benchmark Report for ${profile.organizationName} in ${profile.country}.

Focus: ${profile.focusAreas}
Budget: $${profile.annualSpend || '500,000'}

1200-1500 word analysis comparing to peers:
- Efficiency ratios vs sector average
- Cost per student vs 3-4 similar orgs
- Performance gaps and opportunities
- 5 specific recommendations

Include chart_data:
{
  "efficiency_comparison": {
    "type": "bar",
    "labels": ["Your Org", "Peer 1", "Peer 2", "Sector Avg"],
    "data": [28, 35, 32, 33]
  }
}`
  }),

  scalability_expansion: (profile, scrapedData) => ({
    system: getBaseSystemPrompt(profile.organizationName),
    user: `Generate Scalability Report for ${profile.organizationName}.

Focus: ${profile.focusAreas}
Budget: $${profile.annualSpend || '500,000'}
Country: ${profile.country}

1200-1500 word analysis:
- 5 scalability strategies
- 3-year growth projections
- Cost efficiency targets (20-30%)
- Risk mitigation plans

Include chart_data with growth forecasts`
  })
};

module.exports = { prompts };
