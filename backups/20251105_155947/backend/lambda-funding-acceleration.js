/**
 * Funding Acceleration Plan Lambda Function
 * Generates 6-week Series A preparation roadmap
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

const buildFundingAccelerationPrompt = (context) => {
    return `You are Coach Mentor Gina Funding Roadmap Builder. Create a 6-week Series A preparation roadmap prioritizing quick wins.

**INPUT:**
- Current Readiness Score: ${context.readinessScore || 72}
- Target Score: ${context.targetScore || 85}
- Checklist Gaps: ${JSON.stringify(context.checklistGaps || [])}
- Metrics: MRR $${context.mrr || '18K'}, Growth ${context.mrrGrowth || '+23%'}, LTV:CAC ${context.ltvCac || '14.9:1'}, NRR ${context.nrr || '128%'}
- Location: ${context.location || 'Unknown'}
- Sector: ${context.sector || 'SaaS'}
- Raise Target: ${context.raiseTarget || '$1M-$3M'}

**OUTPUT (JSON):**

{
  "title": "Your 6-Week Series A Acceleration Plan",
  "subtitle": "Prioritized roadmap to boost readiness from ${context.readinessScore || 72} to ${context.targetScore || 85}+",
  "currentStatus": {
    "score": "${context.readinessScore || 72}/100",
    "gapAnalysis": "Brief analysis of main gaps",
    "quickWins": ["3-5 quick wins that deliver largest score increases"]
  },
  "roadmap": [
    {
      "week": "Week 1-2",
      "theme": "Foundation & Quick Wins",
      "tasks": ["Specific tasks"],
      "pointsImpact": "+8-10 points",
      "cta": "Start Now"
    },
    {
      "week": "Week 3-4",
      "theme": "Strategic Positioning",
      "tasks": ["Specific tasks"],
      "pointsImpact": "+5-7 points",
      "cta": "Schedule"
    },
    {
      "week": "Week 5-6",
      "theme": "Investor Readiness",
      "tasks": ["Specific tasks"],
      "pointsImpact": "+3-5 points",
      "cta": "Launch"
    }
  ]
}

**CRITICAL: Output ONLY the JSON, no explanatory text.**`;
};

exports.handler = async (event) => {
    console.log('Funding Acceleration Lambda invoked');
    
    try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const context = body.context || {};
        
        const prompt = buildFundingAccelerationPrompt(context);
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
        console.error('Error generating funding acceleration plan:', error);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: {
                    title: "Your 6-Week Series A Acceleration Plan",
                    subtitle: "Prioritized roadmap to boost readiness",
                    currentStatus: {
                        score: "72/100",
                        gapAnalysis: "Focus on completing validation interviews and updating financial projections",
                        quickWins: [
                            "Complete remaining customer interviews",
                            "Update financial model with latest metrics",
                            "Prepare investor deck with recent traction"
                        ]
                    },
                    roadmap: [
                        {
                            week: "Week 1-2",
                            theme: "Foundation & Quick Wins",
                            tasks: [
                                "Complete 3 customer validation interviews",
                                "Update financial projections",
                                "Gather customer testimonials"
                            ],
                            pointsImpact: "+8-10 points",
                            cta: "Start Now"
                        },
                        {
                            week: "Week 3-4",
                            theme: "Strategic Positioning",
                            tasks: [
                                "Refine pitch deck with latest metrics",
                                "Document competitive advantages",
                                "Prepare reference customer list"
                            ],
                            pointsImpact: "+5-7 points",
                            cta: "Schedule"
                        },
                        {
                            week: "Week 5-6",
                            theme: "Investor Readiness",
                            tasks: [
                                "Practice pitch with advisors",
                                "Prepare data room",
                                "Identify warm intro paths to target investors"
                            ],
                            pointsImpact: "+3-5 points",
                            cta: "Launch"
                        }
                    ]
                },
                fallback: true
            })
        };
    }
};
