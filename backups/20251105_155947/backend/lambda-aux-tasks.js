/**
 * AUX Tasks Lambda Function
 * Generates AI-Recommended Tasks for Earn AUX tab
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

const buildAuxTasksPrompt = (context) => {
    return `You are a Startup Growth Strategist AI that generates high-impact, stage-appropriate tasks for founders. You specialize in prioritizing activities that maximize SSE growth and funding readiness.

**STARTUP PROFILE:**
- Startup: ${context.startupName || 'Unknown'}
- Current SSE: ${context.sseScore || 72}
- Target SSE: ${context.targetSse || 85}
- Stage: ${context.stage || 'seed'}
- MRR: ${context.mrrTrend || '$18K (+23% MoM)'}
- Recent Milestones: ${context.milestones || 'None'}
- Past Completed Tasks: ${context.pastTasks || 'None'}

**TASK GENERATION RULES:**
- Generate exactly 5 tasks (no more, no less)
- Mix: 1 Easy, 2 Medium, 2 Hard tasks
- Due dates should create urgency but be realistic
- SSE impact: 5-20% range based on strategic importance
- Category balance: 2 Validation, 2 Funding, 1 Growth/Market

**OUTPUT (JSON array ONLY):**

{
  "recommendedTasks": [
    {
      "title": "Task Title (Optional Detail)",
      "description": "1-2 sentence actionable description with clear outcome",
      "dueInDays": 7,
      "impactType": "SSE" or "Funding Readiness",
      "impactValue": 15,
      "difficulty": "Easy/Medium/Hard",
      "auxReward": 450
    }
  ]
}

**CALIBRATION:**
- Easy: 200-350 AUX, 5-8% impact, 3-7 days
- Medium: 350-500 AUX, 8-15% impact, 7-14 days
- Hard: 500-650 AUX, 15-20% impact, 14-21 days

**CRITICAL: Output ONLY the JSON, no explanatory text.**`;
};

exports.handler = async (event) => {
    console.log('AUX Tasks Lambda invoked');
    
    try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const context = body.context || {};
        
        const client = initializeAnthropic();
        const prompt = buildAuxTasksPrompt(context);
        
        const response = await client.messages.create({
            model: 'claude-opus-4-20250514',
            max_tokens: 2000,
            temperature: 0.7,
            messages: [{ role: 'user', content: prompt }]
        });
        
        const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { recommendedTasks: [] };
        
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
        console.error('Error generating AUX tasks:', error);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: {
                    recommendedTasks: [
                        {
                            title: "Customer Interview Series (5+ Interviews)",
                            description: "Conduct 5 in-depth customer interviews to validate your product-market fit and gather testimonials for investor pitches.",
                            dueInDays: 7,
                            impactType: "SSE",
                            impactValue: 15,
                            difficulty: "Medium",
                            auxReward: 450
                        },
                        {
                            title: "Financial Model Refinement",
                            description: "Update your 18-month financial projections with latest metrics. Include unit economics, CAC, LTV, and runway calculations.",
                            dueInDays: 3,
                            impactType: "Funding Readiness",
                            impactValue: 12,
                            difficulty: "Hard",
                            auxReward: 550
                        },
                        {
                            title: "Pitch Deck v3.0 Update",
                            description: "Create or refine your Series A pitch deck with updated metrics, team bios, market opportunity, and competitive positioning.",
                            dueInDays: 10,
                            impactType: "Funding Readiness",
                            impactValue: 10,
                            difficulty: "Medium",
                            auxReward: 420
                        },
                        {
                            title: "Reference Customer Calls",
                            description: "Schedule and conduct 3 reference calls with your best customers. Prepare them to speak with potential investors.",
                            dueInDays: 14,
                            impactType: "SSE",
                            impactValue: 8,
                            difficulty: "Easy",
                            auxReward: 320
                        },
                        {
                            title: "Market Research & Competitive Analysis",
                            description: "Conduct comprehensive market sizing and competitive landscape analysis. Document TAM, SAM, and competitive advantages.",
                            dueInDays: 21,
                            impactType: "SSE",
                            impactValue: 6,
                            difficulty: "Medium",
                            auxReward: 380
                        }
                    ]
                },
                fallback: true
            })
        };
    }
};
