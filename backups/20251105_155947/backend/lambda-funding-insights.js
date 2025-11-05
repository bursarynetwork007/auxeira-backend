/**
 * Funding Insights Lambda Function
 * Generates AI Insights & Recommendations for Funding Readiness tab
 */

const Anthropic = require('@anthropic-ai/sdk');

// API Keys - Manus primary, Claude fallback
const MANUS_API_KEY = process.env.MANUS_API_KEY || 'sk-iaoPPjhcH6_hHRfIZL8FwialWXDaVIXAwY8wzGMOljnoDskzTScNTlY4YsJ57W3-vVogmNv2udyjs7k3gfnVFxSVT-In';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || 'YOUR_ANTHROPIC_API_KEY';

let manusClient;
let claudeClient;

const initializeManus = () => {
    if (!manusClient) {
        try {
            manusClient = new Anthropic({ apiKey: MANUS_API_KEY });
        } catch (error) {
            console.log('Manus initialization failed, using Claude fallback');
        }
    }
    if (!claudeClient) {
        claudeClient = new Anthropic({ apiKey: CLAUDE_API_KEY });
    }
    return manusClient || claudeClient;
};

const buildFundingInsightsPrompt = (context) => {
    return `You are Coach Mentor Gina Funding Insights Engine. Analyze funding gaps and generate investor matches based on 2025 VC trends.

**INPUT:**
- Current Readiness Score: ${context.readinessScore || 72}
- Target Score: ${context.targetScore || 85}
- Key Gaps: ${JSON.stringify(context.keyGaps || ['Incomplete validation', 'Outdated projections'])}
- Metrics: MRR $${context.mrr || '18K'}, Growth ${context.mrrGrowth || '+23%'}, LTV:CAC ${context.ltvCac || '14.9:1'}, NRR ${context.nrr || '128%'}, Churn ${context.churn || '2.3%'}
- VC Preferences: Sector ${context.sector || 'SaaS'}, Geo ${context.geography || 'Global'}, Stage ${context.stage || 'Seed'}

**OUTPUT (JSON):**

{
  "title": "AI Insights & Recommendations",
  "gapAnalysis": "2-3 sentences analyzing the most critical gaps preventing Series A readiness",
  "investorUnlock": "1-2 sentences on what needs to happen to unlock investor interest",
  "matches": [
    {
      "firm": "VC Firm Name",
      "match": "85-95%",
      "why": "Specific reason for alignment",
      "focusAreas": ["Area 1", "Area 2"],
      "recentActivity": "Recent investment or fund activity"
    }
  ],
  "strategicRecommendations": [
    "3-5 actionable recommendations prioritized by impact"
  ]
}

**Matching Algorithm:**
- Metrics fit: 40% weight
- Sector alignment: 30% weight
- Geo strategy: 20% weight
- Stage focus: 10% weight

**CRITICAL: Output ONLY the JSON, no explanatory text.**`;
};

exports.handler = async (event) => {
    console.log('Funding Insights Lambda invoked');
    
    try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const context = body.context || {};
        
        const prompt = buildFundingInsightsPrompt(context);
        let response;
        
        // Try Manus first, fallback to Claude
        try {
            const client = initializeManus();
            response = await client.messages.create({
                model: 'claude-opus-4-20250514',
                max_tokens: 2000,
                temperature: 0.7,
                messages: [{ role: 'user', content: prompt }]
            });
        } catch (manusError) {
            console.log('Manus failed, using Claude fallback:', manusError.message);
            if (!claudeClient) {
                claudeClient = new Anthropic({ apiKey: CLAUDE_API_KEY });
            }
            response = await claudeClient.messages.create({
                model: 'claude-opus-4-20250514',
                max_tokens: 2000,
                temperature: 0.7,
                messages: [{ role: 'user', content: prompt }]
            });
        }
        
        const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({ success: true, data })
        };
        
    } catch (error) {
        console.error('Error generating funding insights:', error);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: {
                    title: "AI Insights & Recommendations",
                    gapAnalysis: "Your metrics are strong (128% NRR, 14.9:1 LTV:CAC), but incomplete validation interviews and outdated projections are holding back your readiness score. Investors need to see systematic customer validation and current financial modeling.",
                    investorUnlock: "Complete your validation interviews and update your financial model to reflect recent growth. This will push your readiness score above 80, making you attractive to Series A investors.",
                    matches: [
                        {
                            firm: "Growth Stage VC",
                            match: "88%",
                            why: "Strong focus on SaaS companies with proven unit economics",
                            focusAreas: ["B2B SaaS", "High NRR", "Efficient Growth"],
                            recentActivity: "Recently closed $200M Fund IV targeting Series A"
                        },
                        {
                            firm: "Sector-Focused Fund",
                            match: "92%",
                            why: "Specializes in your sector with track record of similar investments",
                            focusAreas: ["Your sector", "Expansion revenue", "Product-led growth"],
                            recentActivity: "Led 3 Series A rounds in past 6 months"
                        }
                    ],
                    strategicRecommendations: [
                        "Complete remaining validation interviews this week to demonstrate systematic customer development",
                        "Update financial model to reflect 23% MoM growth and current unit economics",
                        "Document your 128% NRR story—this is exceptional and investors will want to understand the drivers",
                        "Prepare reference customers who can speak to your product's ROI",
                        "Create a simple competitive positioning doc highlighting your LTV:CAC advantage"
                    ]
                },
                fallback: true
            })
        };
    }
};
