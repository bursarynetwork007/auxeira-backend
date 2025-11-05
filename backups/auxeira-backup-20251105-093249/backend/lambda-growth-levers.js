/**
 * Growth Levers Lambda Function
 * Generates "AI-Recommended Growth Levers" section for Growth Metrics tab
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

const buildGrowthLeversPrompt = (context) => {
    return `You are Coach Mentor Gina, a Data-Driven Growth Strategist. Generate 3 high-impact "Growth Levers" based on metrics.

**Input Data:**
- MRR Growth: ${context.mrrGrowth || '40% in last 3 months'}
- NRR: ${context.nrr || '128%'}
- LTV:CAC: ${context.ltvCac || '14.9:1'}
- Churn: ${context.churn || '2.3%'}

**Output Format (Markdown, max 200 words):**

## AI-Recommended Growth Levers

Based on your metrics, here are the highest-impact opportunities:

**Lever 1 Title** (e.g., Reduce Churn to 1.5% Benchmark)
Brief explanation (1-2 sentences).
- **Actionable Step**: Specific action
- **Impact**: Quantified impact

**Lever 2 Title**
Brief explanation.
- **Actionable Step**: Specific action
- **Impact**: Quantified impact

**Lever 3 Title**
Brief explanation.
- **Actionable Step**: Specific action
- **Impact**: Quantified impact

Prioritize: #1 = Retention, #2 = Acquisition, #3 = Expansion. End with: "Pick one—small levers compound big. Which first?"`;
};

exports.handler = async (event) => {
    console.log('Growth Levers Lambda invoked');
    
    try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const context = body.context || {};
        
        const client = initializeAnthropic();
        const prompt = buildGrowthLeversPrompt(context);
        
        const response = await client.messages.create({
            model: 'claude-opus-4-20250514',
            max_tokens: 1500,
            temperature: 0.7,
            messages: [{ role: 'user', content: prompt }]
        });
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                success: true,
                data: { markdown: response.content[0].text.trim() }
            })
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
                    markdown: `## AI-Recommended Growth Levers\n\n**Reduce Churn**\nFocus on retention first.\n- **Action**: Launch customer success program\n- **Impact**: +$50K ARR\n\n**Scale Acquisition**\nYour unit economics support growth.\n- **Action**: Increase paid spend by 20%\n- **Impact**: +150 customers\n\n**Expand Upsells**\nSystematize expansion revenue.\n- **Action**: Target top 20% customers\n- **Impact**: +$3K MRR\n\nPick one—small levers compound big. Which first?`
                },
                fallback: true
            })
        };
    }
};
