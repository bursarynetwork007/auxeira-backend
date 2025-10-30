/**
 * Urgent Actions Generator Lambda Function
 * Generates 3 personalized urgent actions (red blocker, yellow overdue, blue opportunity)
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
 * Build prompt for urgent actions generation with external context
 */
const buildUrgentActionsPrompt = (context, externalContext) => {
    const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    // Format external context if available
    const extContextStr = externalContext ? `

**External Context (Website/Social/Web):**
${externalContext}

Use this external context to make urgent actions more specific and timely. Reference real signals like:
- Recent website activity or user feedback
- X/Twitter engagement or community discussions
- Press mentions or funding announcements
- Industry trends or competitive moves` : '';

    return `As Coach Gina, generate exactly 3 personalized items for the "Urgent Actions & Opportunities" section to accelerate ${context.startupName || 'this startup'}'s success.

**CRITICAL: DO NOT use section headers or name-drop thinkers. Be natural and conversational.**

**Current Context:**
- Date: ${currentDate}
- SSE Score: ${context.sseScore || 72}/100
- Industry: ${context.industry || 'AI-blockchain for startups'}
- MRR: $${context.mrr || '18,000'} (${context.mrrGrowth || '+23%'} MoM)
- Users: ${context.users || '2,847'}
- Interviews: ${context.interviewsCompleted || 7}/10 complete
- Projections: ${context.projectionsAge || 'Overdue 45 days'}
- Stage: ${context.stage || 'Series A'}${extContextStr}

**Generate exactly 3 items as a JSON array (NO additional text, ONLY the JSON array):**

[
  {
    "title": "Concise, bold label (10-15 words max)",
    "description": "1-2 sentences: Urgency/impact + personalization (e.g., 'Leverage your 23% user growth for...')",
    "buttonText": "Action-oriented CTA (e.g., 'Start Now')",
    "urgencyColor": "red",
    "auxReward": 100-200,
    "actionId": "unique_lowercase_with_underscores (e.g., partner_interview_3)",
    "workflowType": "Modal"
  },
  {
    "title": "...",
    "description": "...",
    "buttonText": "...",
    "urgencyColor": "yellow",
    "auxReward": 150-250,
    "actionId": "...",
    "workflowType": "Edit"
  },
  {
    "title": "...",
    "description": "...",
    "buttonText": "...",
    "urgencyColor": "blue",
    "auxReward": 300-500,
    "actionId": "...",
    "workflowType": "Redirect"
  }
]

**Requirements:**
1. **Red (Blocker)**: Critical validation gap requiring immediate attention
   - Example: "Customer Interview #${context.interviewsCompleted + 1} - Required to unlock Series A assessment"
   - Focus: Missing validation, incomplete data, critical blockers
   - AUX: 100-200

2. **Yellow (Overdue)**: Stale data risk that needs updating
   - Example: "Financial Model Update - Your projections are ${context.projectionsAge}"
   - Focus: Outdated metrics, overdue tasks, data freshness
   - AUX: 150-250

3. **Blue (Opportunity)**: Timely high-reward opportunity
   - Example: "ESG Grant Opportunity - NEXUS Scaleup €2M climate tech deadline ${currentDate}"
   - Focus: Funding opportunities, investor intros, strategic partnerships
   - AUX: 300-500

**Personalization:**
- Tie to SSE score (prioritize for Series A readiness if SSE < 85)
- Reference actual metrics (MRR growth, user count, etc.)
- 80% feasibility (<3h effort)
- Motivational tone
- Ties to success levers (e.g., "Unlocks 20% faster partner closes")

**CRITICAL: Output ONLY the JSON array, no explanatory text before or after.**`;
};

/**
 * Parse urgent actions response from Claude
 */
const parseUrgentActionsResponse = (response) => {
    try {
        // Try to extract JSON array from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const actions = JSON.parse(jsonMatch[0]);
            
            // Validate structure
            if (!Array.isArray(actions) || actions.length !== 3) {
                throw new Error('Invalid actions array structure');
            }
            
            // Validate each action has required fields
            const requiredFields = ['title', 'description', 'buttonText', 'urgencyColor', 'auxReward', 'actionId', 'workflowType'];
            actions.forEach((action, index) => {
                requiredFields.forEach(field => {
                    if (!action[field]) {
                        throw new Error(`Action ${index} missing required field: ${field}`);
                    }
                });
                
                // Validate urgency colors
                if (!['red', 'yellow', 'blue'].includes(action.urgencyColor)) {
                    throw new Error(`Action ${index} has invalid urgencyColor: ${action.urgencyColor}`);
                }
            });
            
            return actions;
        }
        throw new Error('No JSON array found in response');
    } catch (error) {
        console.error('Error parsing urgent actions response:', error);
        throw error;
    }
};

/**
 * Get fallback urgent actions if AI generation fails
 */
const getFallbackUrgentActions = (context) => {
    const actions = [
        {
            title: `Customer Interview #${context.interviewsCompleted + 1 || 9}`,
            description: 'Required to unlock Series A assessment. Complete final validation interview.',
            buttonText: 'Start Now',
            urgencyColor: 'red',
            auxReward: 150,
            actionId: `customer_interview_${context.interviewsCompleted + 1 || 9}`,
            workflowType: 'Modal'
        },
        {
            title: 'Financial Model Update',
            description: `Your projections are ${context.projectionsAge || '30 days old'} - Overdue. Update to reflect current metrics.`,
            buttonText: 'Update',
            urgencyColor: 'yellow',
            auxReward: 200,
            actionId: 'financial_model_update',
            workflowType: 'Edit'
        },
        {
            title: 'Investor Introduction',
            description: 'Warm intro to Series A investor available. High-fit based on your traction.',
            buttonText: 'Accept',
            urgencyColor: 'blue',
            auxReward: 500,
            actionId: 'investor_intro',
            workflowType: 'Redirect'
        }
    ];
    
    // Customize based on context
    if (context.sseScore && context.sseScore < 70) {
        actions[2].title = 'SSE Boost Workshop';
        actions[2].description = `Your SSE at ${context.sseScore} needs attention. Join workshop to reach Series A threshold (85+).`;
        actions[2].actionId = 'sse_boost_workshop';
    }
    
    return actions;
};

/**
 * Generate urgent actions using Claude API with optional external context
 */
const generateUrgentActions = async (context, externalContext = null) => {
    try {
        const client = initializeAnthropic();
        const prompt = buildUrgentActionsPrompt(context, externalContext);
        
        console.log('Generating urgent actions with context:', JSON.stringify(context, null, 2));
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
        
        const actions = parseUrgentActionsResponse(responseText);
        
        return {
            success: true,
            actions: actions,
            source: 'ai',
            usage: {
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens
            }
        };
        
    } catch (error) {
        console.error('Error generating urgent actions:', error);
        
        // Return fallback actions
        return {
            success: true,
            actions: getFallbackUrgentActions(context),
            source: 'fallback',
            error: error.message
        };
    }
};

/**
 * Lambda handler
 */
exports.handler = async (event) => {
    console.log('Urgent Actions Generator Lambda invoked:', JSON.stringify(event, null, 2));
    
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
                            interviewsCompleted: 8,
                            projectionsAge: '30 days old'
                        },
                        externalContext: 'Website: Beta sign-up form (30% conversion); X: Feedback thread (10 comments on pricing pain); Web: Reddit r/fintech mention' // Optional
                    }
                })
            };
        }
        
        // Generate urgent actions with optional external context
        const result = await generateUrgentActions(context, externalContext);
        
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
                error: 'Failed to generate urgent actions',
                message: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};
