/**
 * Growth Story Lambda Function
 * Generates "Your Growth Story & Key Insight" section for Growth Metrics tab
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

const buildGrowthStoryPrompt = (context) => {
    return `You are Coach Mentor Gina, a Strategic Business Advisor for Auxeira's Growth Metrics dashboard. Transform raw metrics into an engaging, narrative-driven "Your Growth Story & Key Insight" section.

**Input Data:**
- MRR Growth: ${context.mrrGrowth || '40% in last 3 months'}
- NRR: ${context.nrr || '128%'}
- LTV:CAC: ${context.ltvCac || '14.9:1'}
- Churn: ${context.churn || '2.3%'}
- Financial Upside: ${context.churnUpside || '$50K'}

**Output Format (JSON):**

{
  "growthStory": {
    "tone": "Confident, narrative",
    "content": "100-150 word story synthesizing positives into momentum arc"
  },
  "keyInsight": {
    "tone": "Direct, analytical",
    "headline": "Bold headline",
    "breakdown": "Superpower and leaky bucket analysis",
    "actions": {
      "immediate": ["2-3 quick wins"],
      "strategic": ["2 levers for 6 months"]
    },
    "question": "One reflective question"
  }
}

Output only JSON.`;
};

exports.handler = async (event) => {
    console.log('Growth Story Lambda invoked');
    
    try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const context = body.context || {};
        
        const client = initializeAnthropic();
        const prompt = buildGrowthStoryPrompt(context);
        
        const response = await client.messages.create({
            model: 'claude-opus-4-20250514',
            max_tokens: 2000,
            temperature: 0.7,
            messages: [{ role: 'user', content: prompt }]
        });
        
        const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {
            growthStory: {
                tone: "Confident, narrative",
                content: `Your metrics tell a compelling story. With ${context.mrrGrowth || '40% MRR growth'} and ${context.nrr || '128% NRR'}, you're building momentum.`
            },
            keyInsight: {
                tone: "Direct, analytical",
                headline: "Scale Acquisition: Your Unit Economics Are Ready",
                breakdown: `Your LTV:CAC of ${context.ltvCac || '14.9:1'} is exceptional.`,
                actions: {
                    immediate: ["Run 5 exit surveys this week"],
                    strategic: ["Build customer success playbook"]
                },
                question: "What's your boldest acquisition bet this quarter?"
            }
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
                    growthStory: {
                        tone: "Confident, narrative",
                        content: "Your metrics show strong momentum. Focus on scaling what's working."
                    },
                    keyInsight: {
                        tone: "Direct, analytical",
                        headline: "Scale Acquisition Now",
                        breakdown: "Your unit economics are strong.",
                        actions: {
                            immediate: ["Run customer surveys"],
                            strategic: ["Build retention playbook"]
                        },
                        question: "What's your next growth lever?"
                    }
                },
                fallback: true
            })
        };
    }
};
