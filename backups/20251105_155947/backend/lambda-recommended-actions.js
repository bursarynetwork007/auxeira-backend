/**
 * Recommended Actions Lambda Function
 * Generates "Recommended Actions This Quarter" section for Growth Metrics tab
 */

const Anthropic = require('@anthropic-ai/sdk');

// Claude API Key
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || 'YOUR_ANTHROPIC_API_KEY';

let anthropic;

const initializeAnthropic = () => {
    if (!anthropic) {
        anthropic = new Anthropic({ apiKey: CLAUDE_API_KEY });
    }
    return anthropic;
};

const buildRecommendedActionsPrompt = (context) => {
    return `You are Coach Mentor Gina. Generate "Recommended Actions This Quarter" - a 90-day execution plan.

**Input:**
- Churn: ${context.churn || '2.3%'}
- NRR: ${context.nrr || '128%'}
- Growth Levers: Reduce churn, Scale acquisition, Expand upsells

**Output (JSON):**

{
  "sectionTitle": "Recommended Actions This Quarter",
  "sectionSubtitle": "Your 90-day execution plan for maximum traction.",
  "actions": [
    {
      "title": "Project-style name",
      "objective": "Specific, measurable goal",
      "keyInitiatives": ["2-3 concrete tasks"],
      "successMetrics": ["Exact KPIs to track"],
      "resourceHint": "Effort/team required"
    }
  ]
}

Generate 3 quarterly actions. Output only JSON.`;
};

exports.handler = async (event) => {
    console.log('Recommended Actions Lambda invoked');
    
    try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const context = body.context || {};
        
        const client = initializeAnthropic();
        const prompt = buildRecommendedActionsPrompt(context);
        
        const response = await client.messages.create({
            model: 'claude-opus-4-20250514',
            max_tokens: 2000,
            temperature: 0.7,
            messages: [{ role: 'user', content: prompt }]
        });
        
        const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {
            sectionTitle: "Recommended Actions This Quarter",
            sectionSubtitle: "Your 90-day execution plan for maximum traction.",
            actions: [
                {
                    title: "Project Retention: Customer Success Initiative",
                    objective: `Reduce churn from ${context.churn || '2.3%'} to 1.5%`,
                    keyInitiatives: [
                        "Implement weekly health-check calls for top 20% customers",
                        "Create at-risk customer scoring model",
                        "Launch customer success playbook"
                    ],
                    successMetrics: [
                        "Churn rate <1.8% by month 3",
                        "$50K ARR preserved"
                    ],
                    resourceHint: "Requires CS lead + 5hrs/wk eng time"
                },
                {
                    title: "Project Acquisition: Paid Growth Scale-Up",
                    objective: "Scale paid acquisition by 20%",
                    keyInitiatives: [
                        "Increase paid ad budget by 20%",
                        "A/B test 3 new ad creatives",
                        "Implement weekly LTV:CAC monitoring"
                    ],
                    successMetrics: [
                        "+150 new customers by quarter end",
                        "+$25K MRR added"
                    ],
                    resourceHint: "Requires marketing lead + $5K monthly ad spend"
                },
                {
                    title: "Project Expansion: Systematic Upsell Program",
                    objective: `Boost NRR from ${context.nrr || '128%'} to 135%+`,
                    keyInitiatives: [
                        "Identify top 20% customers",
                        "Create personalized upgrade offers",
                        "Launch quarterly business review program"
                    ],
                    successMetrics: [
                        "NRR reaches 135%+ by quarter end",
                        "+$3K additional MRR"
                    ],
                    resourceHint: "Requires account manager + product marketing"
                }
            ]
        };
        
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
        console.error('Error:', error);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: {
                    sectionTitle: "Recommended Actions This Quarter",
                    sectionSubtitle: "Your 90-day execution plan",
                    actions: [
                        {
                            title: "Focus on Retention",
                            objective: "Reduce churn",
                            keyInitiatives: ["Launch customer success program"],
                            successMetrics: ["Churn <1.8%"],
                            resourceHint: "CS lead needed"
                        }
                    ]
                },
                fallback: true
            })
        };
    }
};
