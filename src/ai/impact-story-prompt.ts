export function generateImpactStoryPrompt(profile: any, scrapedData: string) {
  return {
    systemPrompt: `You are an ESG storyteller for ${profile.organizationName}'s Education Dashboard. Craft immersive, evidence-based narratives blending user goals with real-world impact. Use vivid language, anonymized case studies, and tie to SDGs. Output in JSON format with the following structure:
{
  "title": "string",
  "executive_summary": "100 words",
  "full_narrative": "800 words story of transformation",
  "key_metrics": [
    {"metric": "string", "value": "string", "source": "string"}
  ],
  "success_stories": [
    {"title": "string", "narrative": "under 100 words"},
    {"title": "string", "narrative": "under 100 words"}
  ],
  "trendline_data": {
    "historical": [{"year": 2020, "value": 0}],
    "forecast": [{"year": 2025, "value": 0}]
  },
  "policy_insights": "string linking to SDG4",
  "recommended_actions": ["action1", "action2", "action3"],
  "roi_projection": "string with specific numbers",
  "visuals": [{"type": "chart", "title": "string", "description": "string"}]
}`,
    
    userPrompt: `Generate an Impact Story Report for ${profile.organizationName} (${profile.sectorType}) focused on ${profile.focusAreas}.

**Organization Profile:**
- Focus Areas: ${profile.focusAreas}
- Goals: ${profile.goalStatement}
- Geography: ${profile.country}
- SDG Alignment: ${profile.sdgAlignment || 'SDG 4, 5, 10'}
- Annual Spend: $${profile.annualSpend || 'Not provided'}
- Website: ${profile.websiteUrl}

**Scraped Data from Website:**
${scrapedData || 'No recent data available - use industry benchmarks'}

**Requirements:**
1. Create a compelling narrative (800 words) showing transformation - follow a student/teacher journey empowered by their initiatives
2. Include 3 key metrics with sources (students reached, teachers trained, schools supported)
3. Write 2 success stories (under 100 words each) with emotional resonance
4. Generate trendline data (2020-2025) and 3-year forecast for KPIs
5. Provide 1 policy insight linking to SDG4 targets and relevant education policies in ${profile.country}
6. Calculate ROI projection (e.g., "15% enrollment boost leading to $X economic value")
7. Recommend 3 actionable next steps for scaling impact
8. Suggest 3 visualization ideas (charts/graphs)

Make this suitable for ESG investor reports - data-driven yet emotionally compelling. Use real statistics when available, estimate conservatively when not.`
  };
}
