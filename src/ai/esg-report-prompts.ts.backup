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

export function getESGPrompt(reportType: string, userProfile: ESGUserProfile, scrapedData: ScrapedData): string {
  const promptGen = ESG_REPORT_PROMPTS[reportType];
  if (!promptGen) {
    return `Generate a comprehensive ${reportType} report for ${userProfile.organizationName} focused on ${userProfile.educationFocusAreas.join(', ')} in ${userProfile.country}.`;
  }
  return promptGen(userProfile, scrapedData);
}
