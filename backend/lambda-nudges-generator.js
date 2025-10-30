/**
 * Nudges Generator Lambda Function
 * Generates personalized Growth, Validation, and Funding nudges using Coach Gina AI
 */

const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
let anthropic;

const initializeAnthropic = () => {
    if (!anthropic) {
        const apiKey = process.env.CLAUDE_API_KEY;
        if (!apiKey) {
            throw new Error('CLAUDE_API_KEY environment variable not set');
        }
        anthropic = new Anthropic({ apiKey });
    }
    return anthropic;
};

/**
 * Build prompt for nudges generation with external context
 */
const buildNudgesPrompt = (context, externalContext) => {
    const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    // Format external context if available
    const extContextStr = externalContext ? `

**External Context (Website/Social/Web):**
${externalContext}

Use this external context to make nudges more specific and actionable. Reference real signals like:
- Website traffic spikes or content engagement
- X/Twitter posts with high engagement
- Press mentions or industry recognition
- User feedback from social channels` : '';

    return `As Coach Gina, generate 3 personalized nudges for ${context.startupName || 'this startup'}'s dashboard to boost their SSE from ${context.sseScore || 72} toward Series A readiness (>85).

**CRITICAL: DO NOT use section headers or name-drop thinkers in your nudges. Be natural and conversational.**

**Current Context:**
- Date: ${currentDate}
- SSE Score: ${context.sseScore || 72}/100
- Stage: ${context.stage || 'Series A'}
- Industry: ${context.industry || 'SaaS'}
- MRR: $${context.mrr || '18,000'} (${context.mrrGrowth || '+23%'} MoM)
- Users: ${context.users || '2,847'}
- CAC: $${context.cac || '127'}
- Churn Rate: ${context.churnRate || '2.3'}%
- Interviews Completed: ${context.interviewsCompleted || 8}/10
- Projections Age: ${context.projectionsAge || '30 days old'}${extContextStr}

**Generate exactly 3 nudges as a JSON array (NO additional text, ONLY the JSON array):**

[
  {
    "type": "growth",
    "goal": "Concise action title (<10 words, e.g., 'Launch referral program for 25% CAC cut')",
    "description": "1-sentence explainer with projected impact (e.g., 'Projected 25% CAC reduction in 30 days')",
    "buttonText": "Action-oriented CTA (e.g., 'Launch Now', 'Start Program')",
    "auxReward": 100-150,
    "difficulty": "Low/Medium/High"
  },
  {
    "type": "validation",
    "goal": "Concise action title (<10 words, e.g., 'Complete 2 customer interviews')",
    "description": "1-sentence explainer with projected impact (e.g., 'Unlock Series A validation threshold')",
    "buttonText": "Action-oriented CTA (e.g., 'Schedule Now', 'Start Interviews')",
    "auxReward": 150-200,
    "difficulty": "Medium/High"
  },
  {
    "type": "funding",
    "goal": "Concise action title (<10 words, e.g., 'Update 18-month financial model')",
    "description": "1-sentence explainer with projected impact (e.g., 'Reflect recent MRR growth for investor readiness')",
    "buttonText": "Action-oriented CTA (e.g., 'Update Model', 'Prepare Projections')",
    "auxReward": 200-300,
    "difficulty": "High"
  }
]

**Requirements:**
- Draw from YC/a16z playbooks
- Prioritize quick wins if SSE < 60
- Make goals specific and actionable
- Tie to their actual metrics (MRR, CAC, churn, etc.)
- AUX rewards based on difficulty: Low (<1h) = 100-120, Medium (1-3h) = 120-180, High (3-5h) = 180-300
- If CAC > $200, bias toward referral/organic growth
- If churn > 5%, bias toward retention/activation
- If interviews < 10, bias toward validation

**CRITICAL: Output ONLY the JSON array, no explanatory text before or after.**`;
};

/**
 * Parse nudges response from Claude
 */
const parseNudgesResponse = (response) => {
    try {
        // Try to extract JSON array from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const nudges = JSON.parse(jsonMatch[0]);
            
            // Validate structure
            if (!Array.isArray(nudges) || nudges.length !== 3) {
                throw new Error('Invalid nudges array structure');
            }
            
            // Validate each nudge has required fields
            const requiredFields = ['type', 'goal', 'description', 'buttonText', 'auxReward', 'difficulty'];
            nudges.forEach((nudge, index) => {
                requiredFields.forEach(field => {
                    if (!nudge[field]) {
                        throw new Error(`Nudge ${index} missing required field: ${field}`);
                    }
                });
            });
            
            return nudges;
        }
        throw new Error('No JSON array found in response');
    } catch (error) {
        console.error('Error parsing nudges response:', error);
        throw error;
    }
};

/**
 * Get fallback nudges if AI generation fails
 */
const getFallbackNudges = (context) => {
    const nudges = [
        {
            type: 'growth',
            goal: 'Launch Customer Referral Program',
            description: 'Reduce CAC by 25% through customer referrals with proven templates.',
            buttonText: 'Launch Program',
            auxReward: 120,
            difficulty: 'Medium'
        },
        {
            type: 'validation',
            goal: 'Complete Customer Interviews',
            description: 'Need 2 more interviews to reach Series A validation threshold.',
            buttonText: 'Schedule Interviews',
            auxReward: 180,
            difficulty: 'High'
        },
        {
            type: 'funding',
            goal: 'Update Financial Projections',
            description: 'Refresh 18-month model to reflect recent MRR growth trends.',
            buttonText: 'Update Model',
            auxReward: 220,
            difficulty: 'High'
        }
    ];
    
    // Customize based on context
    if (context.cac && context.cac > 200) {
        nudges[0].goal = 'Reduce CAC via Organic Channels';
        nudges[0].description = `Your CAC at $${context.cac} is high. Focus on organic growth to improve unit economics.`;
    }
    
    if (context.churnRate && context.churnRate > 5) {
        nudges[1].goal = 'Reduce Churn Rate';
        nudges[1].description = `Your ${context.churnRate}% churn is bleeding revenue. Interview churned users to find the leak.`;
    }
    
    return nudges;
};

/**
 * Generate nudges using Claude API with optional external context
 */
const generateNudges = async (context, externalContext = null) => {
    try {
        const client = initializeAnthropic();
        const prompt = buildNudgesPrompt(context, externalContext);
        
        console.log('Generating nudges with context:', JSON.stringify(context, null, 2));
        if (externalContext) {
            console.log('External context:', externalContext);
        }
        
        const response = await client.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1500,
            temperature: 0.7,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });
        
        const responseText = response.content[0].text;
        console.log('Claude response:', responseText);
        
        const nudges = parseNudgesResponse(responseText);
        
        return {
            success: true,
            nudges: nudges,
            source: 'ai',
            usage: {
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens
            }
        };
        
    } catch (error) {
        console.error('Error generating nudges:', error);
        
        // Return fallback nudges
        return {
            success: true,
            nudges: getFallbackNudges(context),
            source: 'fallback',
            error: error.message
        };
    }
};

/**
 * Lambda handler
 */
exports.handler = async (event) => {
    console.log('Nudges Generator Lambda invoked:', JSON.stringify(event, null, 2));
    
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Content-Type': 'application/json'
    };
    
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
        const { context, externalContext } = body;
        
        if (!context) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Context is required',
                    example: {
                        context: {
                            startupName: 'Auxeira',
                            sseScore: 72,
                            stage: 'Series A',
                            industry: 'FinTech',
                            mrr: 18500,
                            mrrGrowth: '+23%',
                            users: 2847,
                            cac: 127,
                            churnRate: 2.3,
                            interviewsCompleted: 8,
                            projectionsAge: '30 days old'
                        },
                        externalContext: 'Website: Recent blog on funding journey (500 views, 20 shares); X: Post on traction got 45 engagements; Web: Mentioned in TechCabal article' // Optional
                    }
                })
            };
        }
        
        // Generate nudges with optional external context
        const result = await generateNudges(context, externalContext);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: result,
                hasExternalContext: !!externalContext,
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('Lambda error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to generate nudges',
                message: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};
