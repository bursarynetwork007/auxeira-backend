export interface PromptContext {
  investorProfile: any;
  portfolioData: any;
  marketData: any;
  impactData: any;
}

export const REPORT_PROMPTS = {
  daily_digest: (ctx: PromptContext) => `Generate a daily digest for ${ctx.investorProfile.investorName}...`,
  portfolio_deep_dive: (ctx: PromptContext) => `Generate portfolio analysis...`,
  market_intelligence: (ctx: PromptContext) => `Generate market intelligence...`,
  impact_story: (ctx: PromptContext) => `Generate impact story...`,
};

export function generateTeaser(fullReport: string, maxWords: number = 100): string {
  const words = fullReport.split(' ');
  return words.slice(0, maxWords).join(' ') + '... [Unlock full report]';
}

export function calculateProfileCompleteness(profile: any): number {
  const fields = {
    investorName: 10, fundName: 10, investorType: 10,
    focusAreas: 15, geographicFocus: 10, ticketSize: 5,
    stagePreference: 10, primarySDG: 10, impactMetrics: 10,
    theoryOfChange: 20,
  };

  let score = 0;
  for (const [field, weight] of Object.entries(fields)) {
    if (profile[field] && (Array.isArray(profile[field]) ? profile[field].length > 0 : true)) {
      score += weight;
    }
  }
  return score;
}
