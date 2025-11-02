/**
 * Investor Matching Lambda Function
 * Generates investor matches for Funding Readiness tab
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

const buildInvestorMatchingPrompt = (context) => {
    return `You are an AI Investor Matching Engine for AuxEira. You specialize in connecting startups with perfectly aligned investors based on stage, sector, geography, and strategic fit.

**STARTUP PROFILE:**
- Startup: ${context.startupName || 'Unknown'}
- Stage: ${context.stage || 'Seed'} | SSE Score: ${context.sseScore || 72}
- Sector: ${context.sector || 'SaaS'}
- Geographic Preference: ${context.geography || 'Global'}
- Investor Type: ${context.investorType || 'VC Fund'}
- Recent Milestones: ${context.milestones || 'None'}
- Funding Goal: ${context.fundingGoal || '$1M-$3M'}

**OUTPUT REQUIREMENTS:**
Generate exactly 2 investor matches with this JSON structure:

{
  "investors": [
    {
      "name": "Investor Name",
      "type": "Angel/VC Fund/Corporate VC",
      "focus": "Primary focus areas",
      "checkSize": "Typical check size",
      "portfolioHighlights": ["Relevant company 1", "Relevant company 2"],
      "matchPercentage": 85,
      "matchReason": "1-2 sentences on strategic alignment",
      "recentActivity": "Recent relevant investment or focus area",
      "contactApproach": "Best way to connect"
    },
    {
      "name": "Investor Name 2",
      "type": "Angel/VC Fund/Corporate VC",
      "focus": "Primary focus areas",
      "checkSize": "Typical check size",
      "portfolioHighlights": ["Relevant company 1", "Relevant company 2"],
      "matchPercentage": 95,
      "matchReason": "1-2 sentences on strategic alignment",
      "recentActivity": "Recent relevant investment or focus area",
      "contactApproach": "Best way to connect"
    }
  ]
}

**CRITICAL: Output ONLY the JSON, no explanatory text before or after.**`;
};

exports.handler = async (event) => {
    console.log('Investor Matching Lambda invoked');
    
    try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const context = body.context || {};
        
        const prompt = buildInvestorMatchingPrompt(context);
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
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { investors: [] };
        
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
        console.error('Error generating investor matches:', error);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: {
                    investors: [
                        {
                            name: "Local Angel Network",
                            type: "Angel Group",
                            focus: "Early-stage startups",
                            checkSize: "$50K - $150K",
                            portfolioHighlights: ["Various early-stage companies"],
                            matchPercentage: 75,
                            matchReason: "Active in your sector and geography",
                            recentActivity: "Monthly pitch events",
                            contactApproach: "Apply through website portal"
                        },
                        {
                            name: "Sector-Focused Micro VC",
                            type: "VC Fund",
                            focus: "Seed stage companies",
                            checkSize: "$200K - $500K",
                            portfolioHighlights: ["Growing companies in your sector"],
                            matchPercentage: 70,
                            matchReason: "Thesis aligns with your business model",
                            recentActivity: "Actively investing",
                            contactApproach: "Warm introduction recommended"
                        }
                    ]
                },
                fallback: true
            })
        };
    }
};
