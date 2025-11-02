/**
 * Urgent Actions Generator Lambda Function
 * Generates 3 personalized urgent actions (red blocker, yellow overdue, blue opportunity)
 */

const Anthropic = require('@anthropic-ai/sdk');

// Claude API Key for Overview tab
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || 'YOUR_ANTHROPIC_API_KEY';

// Initialize Anthropic client
let anthropic;

const initializeAnthropic = () => {
    if (!anthropic) {
        anthropic = new Anthropic({ apiKey: CLAUDE_API_KEY });
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

    return `As Coach Gina, an AI startup mentor blending insights from top founders (YC, Techstars) and VCs (a16z, Sequoia), generate exactly 3 personalized items for the "Urgent Actions & Opportunities" section to accelerate ${context.startupName || 'this startup'}'s success.

**Current date**: ${currentDate}

**Analyze user profile:**
- SSE: ${context.sseScore || 72}/100
- Industry: ${context.industry || 'AI-blockchain for startups'}
- Key Metrics: MRR $${context.mrr || '18K'} (${context.mrrGrowth || '+23%'} MoM); Users ${context.users || '2,847'}
- Console Gaps: Interviews: ${context.interviewsCompleted || 7}/10 complete; Projections ${context.projectionsAge || 'overdue 45 days'}; Missing: Churn data, ESG alignment score (low)
- Stage: ${context.stage || 'pre-pilot'}${extContextStr}

**Prioritize for SSE boost toward Series A readiness (>85):**

1. **Blocker (Red Urgency)**: Critical validation gap, e.g., final interview—enhance with scan for missing opportunities (query X semantic: 'startup interview enhancements 2025 hypothesis-led questions' for tips like probing implicit PMF signals).

2. **Overdue (Yellow Urgency)**: Stale data risk, e.g., model update—flag necessary info needs (e.g., 'Add behavioral churn benchmarks') and tie to console trends.

3. **Opportunity (Blue High-Reward)**: Timely ESG funding or intro—deep scan web/X (query: 'ESG grants ${context.industry || 'AI'} startups ${currentDate.split(',')[1]} deadlines' e.g., NEXUS Scaleup, EU €2M climate tech; X: 'ESG investor intros for AI impact tools') for 2-3 fits, leveraging user strengths (e.g., 85.7% success prediction).

**For each item, ensure 80% feasibility (<3h effort), motivational tone, and ties to success levers (e.g., 'Unlocks 20% faster partner closes').**

**Output a JSON array with no extra text:**

[
  {
    "title": "Concise, bold label (10-15 words max)",
    "description": "1-2 sentences: Urgency/impact + personalization (e.g., 'Leverage your 23% user growth for...') + scan insight (e.g., 'X tips: Structure as buyer chat')",
    "buttonText": "Action-oriented CTA (e.g., 'Start Now')",
    "urgencyColor": "red",
    "auxReward": 50-500,
    "actionId": "unique_lowercase_with_underscores (e.g., partner_interview_3)",
    "workflowType": "Redirect/Modal/Edit",
    "enhancementTip": "Brief scan-derived add-on (e.g., 'Probe: How do bias blind spots tank ROI?')"
  },
  {
    "title": "...",
    "description": "...",
    "buttonText": "...",
    "urgencyColor": "yellow",
    "auxReward": 50-500,
    "actionId": "...",
    "workflowType": "...",
    "enhancementTip": "..."
  },
  {
    "title": "...",
    "description": "...",
    "buttonText": "...",
    "urgencyColor": "blue",
    "auxReward": 50-500,
    "actionId": "...",
    "workflowType": "...",
    "enhancementTip": "..."
  }
]

**AUX Reward Guidelines:**
- Low effort/quick wins: 50-100 AUX
- Medium strategic tasks: 100-300 AUX
- High-impact opportunities: 300-500 AUX
- Difficulty-based: low=100 for quick, high=500 for strategic

**If scans yield no fits, default to strong generics (e.g., 'Generic ESG Audit +50 AUX'). Ensure outputs are empowering and founder-specific—no hallucinations.**

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
                // Convert camelCase to snake_case for consistency
                if (action.urgencyColor && !action.urgency_color) {
                    action.urgency_color = action.urgencyColor;
                    delete action.urgencyColor;
                }
                if (action.buttonText && !action.button_text) {
                    action.button_text = action.buttonText;
                    delete action.buttonText;
                }
                if (action.auxReward && !action.aux_reward) {
                    action.aux_reward = action.auxReward;
                    delete action.auxReward;
                }
                if (action.actionId && !action.action_id) {
                    action.action_id = action.actionId;
                    delete action.actionId;
                }
                if (action.workflowType && !action.workflow_type) {
                    action.workflow_type = action.workflowType;
                    delete action.workflowType;
                }
                if (action.enhancementTip && !action.enhancement_tip) {
                    action.enhancement_tip = action.enhancementTip;
                    delete action.enhancementTip;
                }
                
                requiredFields.forEach(field => {
                    const snakeField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
                    if (!action[field] && !action[snakeField]) {
                        throw new Error(`Action ${index} missing required field: ${field}`);
                    }
                });
                
                // Validate urgency colors
                const urgencyColor = action.urgency_color || action.urgencyColor;
                if (!['red', 'yellow', 'blue'].includes(urgencyColor)) {
                    throw new Error(`Action ${index} has invalid urgencyColor: ${urgencyColor}`);
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
    
    // Only allow POST (skip check for direct Lambda invocation)
    if (event.httpMethod && event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    try {
        // Parse request body (handle both API Gateway and direct invocation)
        const body = event.body ? JSON.parse(event.body) : event;
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
