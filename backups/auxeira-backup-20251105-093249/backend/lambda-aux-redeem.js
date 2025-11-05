/**
 * AUX Redeem Lambda Function
 * Generates redemption catalog for Earn AUX tab
 */

const Anthropic = require('@anthropic-ai/sdk');

let anthropic;

const initializeAnthropic = () => {
    if (!anthropic) {
        const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || 'YOUR_ANTHROPIC_API_KEY';
        anthropic = new Anthropic({ apiKey: CLAUDE_API_KEY });
        
    }
    return anthropic;
};

const buildAuxRedeemPrompt = (context) => {
    return `You are a Startup Rewards Strategist AI that generates personalized redemption catalogs for founders. You specialize in creating valuable, stage-appropriate rewards across mentorship, tools, wellness, and growth resources.

**STARTUP PROFILE:**
- Startup: ${context.startupName || 'Unknown'}
- Current SSE: ${context.sseScore || 72}
- Stage: ${context.stage || 'seed'}
- Current AUX Balance: ${context.auxBalance || 500}
- Recent Milestones: ${context.milestones || 'None'}
- Upcoming Goals: ${context.upcomingGoals || 'Fundraising'}

**REWARD GENERATION RULES:**
- Generate exactly 8-10 redemption options
- Category mix: 2-3 Mentorship, 2-3 Tools/Resources, 1-2 Wellness, 1-2 Network Access
- Price range: 150-1000 AUX with good distribution
- Ensure realistic delivery timelines
- Include both immediate and long-term value options

**OUTPUT (JSON array ONLY):**

{
  "redemptionCatalog": [
    {
      "title": "Clear reward title",
      "costAux": 500,
      "description": "1-2 sentence benefit-focused description with specific outcomes",
      "category": "Mentorship/Tools/Wellness/Network/Resources",
      "urgencyBadge": "Limited/New/Popular/Essential" or null,
      "deliveryTimeline": "Instant/24h/48h/1 week",
      "successMetrics": "What founder will achieve",
      "stageRelevance": "Why this matters now",
      "specialFeatures": "Any unique aspects or benchmarks"
    }
  ]
}

**CALIBRATION:**
- Low tier (150-300 AUX): Quick wins, templates, basic resources
- Medium tier (300-600 AUX): Sessions, coaching, tool access
- High tier (600-1000 AUX): Premium access, intros, network benefits

**CRITICAL: Output ONLY the JSON, no explanatory text.**`;
};

exports.handler = async (event) => {
    console.log('AUX Redeem Lambda invoked');
    
    try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const context = body.context || {};
        
        const client = initializeAnthropic();
        const prompt = buildAuxRedeemPrompt(context);
        
        const response = await client.messages.create({
            model: 'claude-opus-4-20250514',
            max_tokens: 3000,
            temperature: 0.7,
            messages: [{ role: 'user', content: prompt }]
        });
        
        const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { redemptionCatalog: [] };
        
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
        console.error('Error generating redemption catalog:', error);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: {
                    redemptionCatalog: [
                        {
                            title: "Series A VC Mentor Session",
                            costAux: 500,
                            description: "1-hour 1-on-1 session with a Series A-experienced VC to review your pitch and fundraising strategy.",
                            category: "Mentorship",
                            urgencyBadge: "Limited",
                            deliveryTimeline: "1 week",
                            successMetrics: "Refined pitch strategy and 3-5 actionable investor outreach tips",
                            stageRelevance: "Critical as you approach Series A readiness",
                            specialFeatures: "Post-session summary report with action items"
                        },
                        {
                            title: "AI Market Validation Report",
                            costAux: 200,
                            description: "Custom 10-page report with competitor analysis, TAM sizing, and 5 validation experiments—powered by Auxeira's predictive models.",
                            category: "Tools",
                            urgencyBadge: "New",
                            deliveryTimeline: "Instant",
                            successMetrics: "85.7% accuracy benchmark on market fit predictions",
                            stageRelevance: "Essential for product roadmap validation",
                            specialFeatures: "Includes 5 validation experiment templates"
                        },
                        {
                            title: "Founder Wellness Check-In",
                            costAux: 150,
                            description: "30-min AI + human hybrid session on burnout prevention, using behavioral econ nudges and leverage audit.",
                            category: "Wellness",
                            urgencyBadge: "Essential",
                            deliveryTimeline: "24h",
                            successMetrics: "Personalized wellness plan and stress reduction strategies",
                            stageRelevance: "Critical during intensive fundraising periods",
                            specialFeatures: "Includes 2-week follow-up check-in"
                        },
                        {
                            title: "Investor Introduction Package",
                            costAux: 750,
                            description: "Warm introduction to 3 carefully matched Series A investors based on your sector, stage, and traction metrics.",
                            category: "Network",
                            urgencyBadge: "Limited",
                            deliveryTimeline: "2 weeks",
                            successMetrics: "3 qualified investor connections and scheduled meetings",
                            stageRelevance: "Accelerates fundraising timeline by 4-6 weeks",
                            specialFeatures: "Includes investor briefing package preparation"
                        }
                    ]
                },
                fallback: true
            })
        };
    }
};
