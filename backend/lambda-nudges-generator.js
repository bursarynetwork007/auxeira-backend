/**
 * Nudges Generator Lambda Function
 * Generates personalized Growth, Validation, and Funding nudges using Coach Gina AI
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

    return `As a design thinking specialist and Startup Mentor, generate 3 high-impact nudges for ${context.startupName || 'this startup'} to boost SSE from ${context.sseScore || 72} toward Series A readiness (>85).

**CONTEXT:**
- Date: ${currentDate}
- Startup: ${context.startupName || 'Unknown'}
- SSE Score: ${context.sseScore || 72}/100 → Target: Series A (85+)
- Stage: ${context.stage || 'Seed'}
- Industry: ${context.industry || 'SaaS'}
- MRR: $${context.mrr || '18,000'} (${context.mrrGrowth || '+23%'} MoM)
- Users: ${context.users || '2,847'}
- CAC: $${context.cac || '127'}
- Churn Rate: ${context.churnRate || '2.3'}%
- Past Actions: ${context.pastActions || 'Completed 3 interviews last month'}${extContextStr}

**BEHAVIORAL DIRECTIVES:**
→ Weave specific external signals into the description
→ Create urgency using opportunity cost psychology
→ Focus on 10x leverage points from actual data
→ Use loss aversion: "Don't let your [viral thread] momentum fade"
→ Frame as compounding habits, not one-off tasks

**OUTPUT FORMAT (JSON array ONLY, no extra text):**

[
  {
    "type": "growth",
    "goal": "Concise action title <10 words with measurable outcome",
    "description": "1-sentence incorporating external signals + projected impact",
    "buttonText": "Action-oriented CTA",
    "auxReward": 75-300,
    "difficulty": "Low/Medium/High",
    "workflowType": "Modal/Redirect/Edit"
  },
  {
    "type": "validation",
    "goal": "Concise validation action <10 words",
    "description": "1-sentence using external signals + validation impact",
    "buttonText": "Action CTA",
    "auxReward": 75-300,
    "difficulty": "Low/Medium/High",
    "workflowType": "Modal/Redirect/Edit"
  },
  {
    "type": "funding",
    "goal": "Concise funding prep <10 words",
    "description": "1-sentence amplifying external signals + investor impact",
    "buttonText": "Action CTA",
    "auxReward": 75-300,
    "difficulty": "Low/Medium/High",
    "workflowType": "Modal/Redirect/Edit"
  }
]

**PERSONALIZATION HOOKS:**
- Infuse user signals (e.g., if CAC >$200, bias toward referrals)
- Draw from top founder/VC playbooks (YC/a16z)
- Prioritize quick wins if SSE <60
- AUX reward formula: base 75 + difficulty [low=1x/medium=1.5x/high=2x] based on est. effort: low<1h, med 1-3h, high>3h

**EXAMPLE OUTPUT:**
[
  {
    "type": "growth",
    "goal": "Launch referral program leveraging X engagement",
    "description": "Your viral X thread on problem Y shows demand—projected 25% CAC reduction by rewarding shares.",
    "buttonText": "Setup Referrals",
    "auxReward": 185,
    "difficulty": "Medium",
    "workflowType": "Modal"
  },
  {
    "type": "validation",
    "goal": "Interview 5 Reddit commenters on pricing",
    "description": "Your Reddit thread shows pricing confusion—validate premium model with 5 interviews to prevent build waste.",
    "buttonText": "Find Leads",
    "auxReward": 220,
    "difficulty": "High",
    "workflowType": "Redirect"
  },
  {
    "type": "funding",
    "goal": "Update deck with TechCrunch mention",
    "description": "Your TechCrunch feature builds credibility—add to slide 3 to increase warm intro response by 20%.",
    "buttonText": "Edit Deck",
    "auxReward": 260,
    "difficulty": "Medium",
    "workflowType": "Edit"
  }
]

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
                // Convert workflowType to workflow_type if present
                if (nudge.workflowType && !nudge.workflow_type) {
                    nudge.workflow_type = nudge.workflowType;
                    delete nudge.workflowType;
                }
                
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
