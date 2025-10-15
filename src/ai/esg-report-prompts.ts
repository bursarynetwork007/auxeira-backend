export interface ESGUserProfile {
  organizationName?: string;
  websiteUrl?: string;
  sectorType?: string;
  country?: string;
  educationFocusAreas: string[];
  sdgAlignment: number[];
  annualEducationSpend?: number;
  kpisOfInterest: string[];
  goalStatement?: string;
  politicalContext?: string;
  relevantPolicies: string[];
  projectPartners?: string;
}

export interface ScrapedData {
  websiteSummary?: string;
  recentNews?: string[];
  partnerUpdates?: string[];
  policyChanges?: string[];
  sources?: string[];
  policyContext?: string;
}

export const ESG_REPORT_PROMPTS: any = {
  impact_story: (profile: ESGUserProfile, scrapedData: ScrapedData) => `
Generate an immersive impact story for ${profile.organizationName}.
Focus: ${profile.educationFocusAreas.join(', ')}
Geography: ${profile.country}
Goals: ${profile.goalStatement}
Recent data: ${scrapedData.websiteSummary}

Create an 800-word narrative with:
- Individual transformation story
- Measurable outcomes
- SDG ${profile.sdgAlignment.join(', ')} alignment
- ROI projection
`,

  scalability_expansion: (profile: ESGUserProfile, scrapedData: ScrapedData) => `
Generate scalability forecast for ${profile.organizationName}.
Focus: ${profile.educationFocusAreas.join(', ')}
Current spend: $${profile.annualEducationSpend?.toLocaleString()}
Goals: ${profile.goalStatement}

Provide:
- Executive summary (200 words)
- Growth matrix with 3-5 strategies
- 3-year projection
- Risk factors and mitigation
`,
};

export function getESGPrompt(reportType: string, userProfile: ESGUserProfile, scrapedData: ScrapedData): string | { systemPrompt: string, userPrompt: string } {
  // Use enhanced prompt for impact_story
  if (reportType === 'impact_story') {
    const scrapedDataStr = scrapedData.websiteSummary || JSON.stringify(scrapedData);
    return getImpactStoryPrompt(userProfile, scrapedDataStr);
  }
  
  // Use simple prompts for other report types
  const promptGen = ESG_REPORT_PROMPTS[reportType];
  if (!promptGen) {
    return `Generate a comprehensive ${reportType} report for ${userProfile.organizationName} focused on ${userProfile.educationFocusAreas.join(', ')} in ${userProfile.country}.`;
  }
  return promptGen(userProfile, scrapedData);
}

export function getImpactStoryPrompt(profile: any, scrapedData: string) {
  const systemPrompt = `You are an ESG storyteller for ${profile.organizationName}'s Education Dashboard. Craft immersive, evidence-based narratives blending user goals with real-world impact. Use vivid language, anonymized case studies, and tie to SDGs. Output ONLY valid JSON with this exact structure:
{
  "title": "Impact Story: [Organization Name]",
  "executive_summary": "100-word summary",
  "full_narrative": "800-word transformation story",
  "key_metrics": [
    {"metric": "Students Reached", "value": "25,000", "source": "Organization data 2024"},
    {"metric": "Teachers Trained", "value": "500", "source": "Program reports"},
    {"metric": "Schools Supported", "value": "75", "source": "Partnership data"}
  ],
  "success_stories": [
    {"title": "Story 1 Title", "narrative": "Under 100 words narrative"},
    {"title": "Story 2 Title", "narrative": "Under 100 words narrative"}
  ],
  "trendline_data": {
    "historical": [{"year": 2020, "value": 15000}, {"year": 2021, "value": 18000}, {"year": 2022, "value": 21000}, {"year": 2023, "value": 24000}, {"year": 2024, "value": 27000}],
    "forecast": [{"year": 2025, "value": 31000}, {"year": 2026, "value": 36000}, {"year": 2027, "value": 42000}]
  },
  "policy_insights": "Link to SDG4 and relevant education policies",
  "roi_projection": "Specific ROI calculation with numbers",
  "recommended_actions": ["Action 1", "Action 2", "Action 3"],
  "visuals": [
    {"type": "line_chart", "title": "Student Reach Growth", "description": "Historical and projected student engagement"},
    {"type": "bar_chart", "title": "Teacher Training Impact", "description": "Trained teachers by region"},
    {"type": "map", "title": "Geographic Coverage", "description": "Schools supported across regions"}
  ]
}`;

  const userPrompt = `Generate an Impact Story Report for ${profile.organizationName} (${profile.sectorType}) focused on ${profile.educationFocusAreas.join(', ')}.

**Organization Profile:**
- Focus Areas: ${profile.educationFocusAreas.join(', ')}
- Goals: ${profile.goalStatement}
- Geography: ${profile.country}
- SDG Alignment: SDG ${profile.sdgAlignment.join(', SDG ')}
- Annual Spend: $${profile.annualEducationSpend ? profile.annualEducationSpend.toLocaleString() : 'Not provided'}
- Website: ${profile.websiteUrl}

**Recent Data from Website:**
${scrapedData || 'Use industry benchmarks and create realistic projections based on organization size and focus'}

**Requirements:**
1. Create a compelling narrative (800 words) showing transformation - follow a student or teacher journey empowered by ${profile.organizationName}'s initiatives
2. Include 3 specific key metrics with realistic values and sources
3. Write 2 success stories (under 100 words each) with emotional resonance and concrete outcomes
4. Generate realistic trendline data (2020-2024 historical) and 3-year forecast (2025-2027) for student reach
5. Provide policy insight linking to SDG4 targets and education policies in ${profile.country}
6. Calculate ROI projection with specific numbers (e.g., "15% enrollment boost = $2.3M economic value over 5 years")
7. Recommend 3 actionable next steps for scaling impact
8. Suggest 3 specific visualization ideas

Use real statistics from scraped data when available. When data is limited, make conservative estimates based on:
- Organization type: ${profile.sectorType}
- Annual budget: $${profile.annualEducationSpend ? profile.annualEducationSpend.toLocaleString() : '500,000'}
- Geographic scope: ${profile.country}

Make this suitable for ESG investor reports - data-driven yet emotionally compelling. Output ONLY the JSON object, no additional text.`;

  return { systemPrompt, userPrompt };
}
