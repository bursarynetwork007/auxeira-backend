/**
 * AI Nudges Lambda Function
 * Handles Growth, Validation, and Funding nudges with different AI models
 */

const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');

// API Keys from environment
const MANUS_API_KEY = process.env.MANUS_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize AI clients
let anthropic, openai;

const initializeClients = () => {
    if (!anthropic && CLAUDE_API_KEY) {
        anthropic = new Anthropic({ apiKey: CLAUDE_API_KEY });
    }
    if (!openai && OPENAI_API_KEY) {
        openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    }
};

/**
 * Growth Nudge - Powered by Manus
 * Generates referral program implementation plan
 */
const generateGrowthNudge = async (context) => {
    // For now, using OpenAI as Manus placeholder
    // TODO: Replace with actual Manus API when available
    
    const prompt = `You are a growth marketing expert helping a ${context.stage} ${context.industry} startup reduce their CAC through a referral program.

Current metrics:
- CAC: $${context.cac}
- MRR: $${context.mrr}
- Customers: ${context.customers}

Generate a detailed referral program implementation plan that includes:
1. Referral incentive structure (what to offer)
2. Implementation checklist (5-7 steps)
3. Success metrics to track
4. Expected CAC reduction timeline

Be specific and actionable. Format as JSON with keys: incentiveStructure, checklist, metrics, timeline.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        });

        const content = response.choices[0].message.content;
        
        // Try to parse as JSON, fallback to text
        try {
            return JSON.parse(content);
        } catch {
            return { plan: content };
        }
    } catch (error) {
        console.error('Growth Nudge Error:', error);
        throw new Error('Failed to generate growth nudge');
    }
};

/**
 * Funding Nudge - Powered by Claude
 * Generates financial projection update guidance
 */
const generateFundingNudge = async (context) => {
    initializeClients();
    
    const prompt = `You are a Series A fundraising advisor helping a ${context.stage} ${context.industry} startup update their financial projections.

Current metrics:
- MRR: $${context.mrr}
- Burn Rate: $${context.burnRate || 'Unknown'}
- Runway: ${context.runway} months
- Team Size: ${context.teamSize}

Generate a focused financial model update guide that includes:
1. Three key focus areas for the 18-month projection
2. Critical metrics to update (with formulas)
3. Investor-ready presentation tips
4. Red flags to avoid

Be specific and actionable. Keep it under 300 words.`;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 800,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        return {
            guidance: response.content[0].text,
            usage: {
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens
            }
        };
    } catch (error) {
        console.error('Funding Nudge Error:', error);
        throw new Error('Failed to generate funding nudge');
    }
};

/**
 * Validation Nudge - Powered by nanoGPT-5 (OpenAI GPT-4)
 * Generates customer interview guide
 */
const generateValidationNudge = async (context) => {
    const prompt = `You are a product validation expert helping a ${context.stage} ${context.industry} startup conduct customer interviews for Series A readiness.

Current status:
- Interviews completed: ${context.interviewsCompleted || 0}
- Target: 10 interviews
- Stage: ${context.stage}

Generate a comprehensive customer interview guide that includes:
1. Email template for scheduling (personalized, warm)
2. Three critical questions to ask (with follow-up prompts)
3. What to listen for (signals of product-market fit)
4. How to document insights

Be specific and actionable. Format as JSON with keys: emailTemplate, questions, signals, documentation.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1200
        });

        const content = response.choices[0].message.content;
        
        // Try to parse as JSON, fallback to text
        try {
            return JSON.parse(content);
        } catch {
            return { guide: content };
        }
    } catch (error) {
        console.error('Validation Nudge Error:', error);
        throw new Error('Failed to generate validation nudge');
    }
};

/**
 * Complete a nudge and award AUX tokens
 */
const completeNudge = async (userId, nudgeType, data) => {
    // TODO: Integrate with your user/rewards system
    
    const rewards = {
        growth: 100,
        validation: 150,
        funding: 200
    };
    
    const auxReward = rewards[nudgeType] || 0;
    
    // Here you would:
    // 1. Update user's AUX balance
    // 2. Update SSE score
    // 3. Log the completion
    // 4. Trigger any webhooks/notifications
    
    return {
        success: true,
        auxAwarded: auxReward,
        message: `Congratulations! You've earned ${auxReward} AUX tokens.`,
        sseImpact: nudgeType === 'funding' ? '+12%' : nudgeType === 'validation' ? '+8%' : '+5%'
    };
};

/**
 * Lambda handler
 */
exports.handler = async (event) => {
    console.log('Nudges Lambda invoked:', JSON.stringify(event, null, 2));
    
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Content-Type': 'application/json'
    };
    
    // Initialize AI clients
    initializeClients();
    
    // Handle OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    try {
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        const { action, nudgeType, context, userId, data } = body;
        
        // Validate input
        if (!action) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Action is required' })
            };
        }
        
        let result;
        
        // Route to appropriate handler
        switch (action) {
            case 'generate':
                if (!nudgeType || !context) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'nudgeType and context are required' })
                    };
                }
                
                switch (nudgeType) {
                    case 'growth':
                        result = await generateGrowthNudge(context);
                        break;
                    case 'validation':
                        result = await generateValidationNudge(context);
                        break;
                    case 'funding':
                        result = await generateFundingNudge(context);
                        break;
                    default:
                        return {
                            statusCode: 400,
                            headers,
                            body: JSON.stringify({ error: 'Invalid nudge type' })
                        };
                }
                break;
                
            case 'complete':
                if (!nudgeType || !userId) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'nudgeType and userId are required' })
                    };
                }
                
                result = await completeNudge(userId, nudgeType, data);
                break;
                
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid action' })
                };
        }
        
        // Return response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: result,
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('Error in Nudges handler:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: error.message || 'Internal server error',
                timestamp: new Date().toISOString()
            })
        };
    }
};
