/**
 * Partner Rewards Lambda Function
 * Generates partner recommendations for Partner Rewards tab
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

const buildPartnerRewardsPrompt = (context) => {
    return `You are the AI Partner Recommendation Engine for Auxeira's startup ecosystem. Your function is to analyze startup profiles, activity patterns, and growth metrics to recommend highly relevant service partners that address critical blind spots at each development stage.

**STARTUP PROFILE:**
- Stage: ${context.stage || 'seed'}
- Activity History: ${context.activityHistory || 'Regular customer interviews, product updates'}
- Quality Metrics: ${context.qualityMetrics || 'High execution quality'}
- Growth Blockers: ${context.growthBlockers || 'None identified'}
- Funding Level: ${context.fundingLevel || '$100K-$500K'}
- Sector: ${context.sector || 'SaaS'}
- Geography: ${context.geography || 'Global'}

**RECOMMENDATION DIMENSIONS:**
1. Stage Alignment - Partners specialized for current startup maturity
2. Activity Gaps - Services addressing missing critical activities
3. Quality Deficiencies - Partners that improve execution quality
4. Growth Blockers - Services removing immediate bottlenecks
5. Cost Efficiency - Value-priced solutions for current funding level

**OUTPUT (JSON array with 3 recommendations):**

{
  "partnerRecommendations": [
    {
      "name": "Partner Service Name",
      "price": "$2,500-$5,000",
      "problemSolved": "Clear value proposition and specific outcomes",
      "whyNow": "Stage-specific urgency and consequence of delay",
      "stageFit": ["seed", "series-a"],
      "triggerMetrics": ["Specific conditions that make this relevant"],
      "successEvidence": "Data-driven results from similar startups",
      "category": "Legal/Security/Recruiting/Sales/Technical",
      "urgency": "HIGH/MEDIUM/LOW"
    }
  ]
}

**PARTNER CATEGORIES BY STAGE:**

**Pre-Seed & Bootstrap ($1K-$5K):**
- Global IP Protection Suite ($4,000)
- Founder Legal Package ($2,500)

**Seed Stage ($2K-$8K):**
- SOC 2 & Security Readiness ($3,500)
- Specialized Tech Recruiting ($2,500)

**Series A & Growth ($5K-$20K):**
- Enterprise Sales Acceleration ($8,000)
- Scale Infrastructure Audit ($6,500)

**SCORING ALGORITHM:**
- Stage Match: 40% weight
- Activity Gap Coverage: 30% weight
- Quality Improvement: 20% weight
- Cost Appropriateness: 10% weight

**CRITICAL: Output ONLY the JSON, no explanatory text.**`;
};

exports.handler = async (event) => {
    console.log('Partner Rewards Lambda invoked');
    
    try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const context = body.context || {};
        
        const client = initializeAnthropic();
        const prompt = buildPartnerRewardsPrompt(context);
        
        const response = await client.messages.create({
            model: 'claude-opus-4-20250514',
            max_tokens: 2000,
            temperature: 0.7,
            messages: [{ role: 'user', content: prompt }]
        });
        
        const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { partnerRecommendations: [] };
        
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
        console.error('Error generating partner rewards:', error);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: {
                    partnerRecommendations: [
                        {
                            name: "Founder Legal Package",
                            price: "$2,500",
                            problemSolved: "Comprehensive legal setup: incorporation, founder agreements, cap table, and compliance basics.",
                            whyNow: "Legal mistakes in early days can cost 10x more to fix later and create founder conflicts.",
                            stageFit: ["pre-seed", "seed"],
                            triggerMetrics: ["Multiple founders", "No legal activities", "Equity discussions"],
                            successEvidence: "Startups with proper legal foundation avoid 80% of common founder disputes",
                            category: "Legal",
                            urgency: "HIGH"
                        },
                        {
                            name: "SOC 2 & Security Readiness",
                            price: "$3,500",
                            problemSolved: "Achieve SOC 2 compliance and pass enterprise security audits. Unlock $100K+ in enterprise deals.",
                            whyNow: "Enterprise customers require SOC 2 before signing contracts. Waiting costs revenue.",
                            stageFit: ["seed", "series-a"],
                            triggerMetrics: ["Enterprise customers", "B2B focus", "No security activities"],
                            successEvidence: "SOC 2 compliant startups close enterprise deals 3x faster",
                            category: "Security",
                            urgency: "MEDIUM"
                        },
                        {
                            name: "Specialized Tech Recruiting",
                            price: "$2,500",
                            problemSolved: "Hire top engineering talent without the 20% recruiter fees. Access vetted candidate network.",
                            whyNow: "Bad technical hires at this stage can derail product development for 6+ months.",
                            stageFit: ["seed", "series-a"],
                            triggerMetrics: ["Hiring activities", "Technical debt", "Slow product velocity"],
                            successEvidence: "Reduces time-to-hire by 40% and improves quality-of-hire scores",
                            category: "Recruiting",
                            urgency: "MEDIUM"
                        }
                    ]
                },
                fallback: true
            })
        };
    }
};
