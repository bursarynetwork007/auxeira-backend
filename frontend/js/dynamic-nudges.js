/**
 * Dynamic Nudges & Urgent Actions Manager
 * Generates AI-powered personalized nudges and urgent actions for the Overview tab
 */

class DynamicNudgesManager {
    constructor(coachGinaApiUrl) {
        this.apiUrl = coachGinaApiUrl;
        this.cache = {
            nudges: null,
            urgentActions: null,
            timestamp: null
        };
        this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    }

    /**
     * Generate dynamic nudges for Growth, Validation, and Funding
     */
    async generateNudges(userContext) {
        // Check cache
        if (this.cache.nudges && this.cache.timestamp && 
            (Date.now() - this.cache.timestamp < this.CACHE_DURATION)) {
            return this.cache.nudges;
        }

        const prompt = this.buildNudgesPrompt(userContext);

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: prompt,
                    context: userContext
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const nudges = this.parseNudgesResponse(data.response);

            // Cache the results
            this.cache.nudges = nudges;
            this.cache.timestamp = Date.now();

            return nudges;
        } catch (error) {
            console.error('Error generating nudges:', error);
            return this.getFallbackNudges(userContext);
        }
    }

    /**
     * Generate urgent actions and opportunities
     */
    async generateUrgentActions(userContext) {
        // Check cache
        if (this.cache.urgentActions && this.cache.timestamp && 
            (Date.now() - this.cache.timestamp < this.CACHE_DURATION)) {
            return this.cache.urgentActions;
        }

        const prompt = this.buildUrgentActionsPrompt(userContext);

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: prompt,
                    context: userContext
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const actions = this.parseUrgentActionsResponse(data.response);

            // Cache the results
            this.cache.urgentActions = actions;
            this.cache.timestamp = Date.now();

            return actions;
        } catch (error) {
            console.error('Error generating urgent actions:', error);
            return this.getFallbackUrgentActions(userContext);
        }
    }

    /**
     * Build prompt for nudges generation
     */
    buildNudgesPrompt(context) {
        const currentDate = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        return `As Coach Gina, generate 3 personalized nudges for ${context.startupName || 'this startup'}'s dashboard.

Current Context:
- SSE Score: ${context.sseScore || 72}/100
- Stage: ${context.stage || 'Series A'}
- Industry: ${context.industry || 'SaaS'}
- MRR: $${context.mrr || '18,000'} (${context.mrrGrowth || '+23%'} MoM)
- Users: ${context.users || '2,847'}
- Date: ${currentDate}

Generate exactly 3 nudges (Growth, Validation, Funding) as JSON array:

[
  {
    "type": "growth",
    "goal": "Concise action title (<10 words)",
    "description": "1-sentence explainer with projected impact",
    "buttonText": "Action-oriented CTA",
    "auxReward": 100-150,
    "difficulty": "Low/Medium/High"
  },
  {
    "type": "validation",
    "goal": "Concise action title (<10 words)",
    "description": "1-sentence explainer with projected impact",
    "buttonText": "Action-oriented CTA",
    "auxReward": 150-200,
    "difficulty": "Medium/High"
  },
  {
    "type": "funding",
    "goal": "Concise action title (<10 words)",
    "description": "1-sentence explainer with projected impact",
    "buttonText": "Action-oriented CTA",
    "auxReward": 200-300,
    "difficulty": "High"
  }
]

Prioritize quick wins if SSE < 60. Draw from YC/a16z playbooks. Be specific and actionable.`;
    }

    /**
     * Build prompt for urgent actions generation
     */
    buildUrgentActionsPrompt(context) {
        const currentDate = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        return `As Coach Gina, generate exactly 3 personalized items for "Urgent Actions & Opportunities" section.

Current Context:
- SSE Score: ${context.sseScore || 72}/100
- Industry: ${context.industry || 'AI-blockchain for startups'}
- MRR: $${context.mrr || '18,000'} (${context.mrrGrowth || '+23%'} MoM)
- Users: ${context.users || '2,847'}
- Interviews: ${context.interviewsCompleted || 7}/10 complete
- Projections: ${context.projectionsAge || 'Overdue 45 days'}
- Date: ${currentDate}

Generate exactly 3 items as JSON array:

[
  {
    "title": "Concise, bold label (10-15 words max)",
    "description": "1-2 sentences: Urgency/impact + personalization",
    "buttonText": "Action-oriented CTA",
    "urgencyColor": "red",
    "auxReward": 100-200,
    "actionId": "unique_action_id",
    "workflowType": "Modal/Redirect/Edit"
  },
  {
    "title": "...",
    "urgencyColor": "yellow",
    "auxReward": 150-250,
    ...
  },
  {
    "title": "...",
    "urgencyColor": "blue",
    "auxReward": 300-500,
    ...
  }
]

1. Red (Blocker): Critical validation gap
2. Yellow (Overdue): Stale data risk
3. Blue (Opportunity): Timely funding or intro

Ensure 80% feasibility (<3h effort), motivational tone, ties to success levers.`;
    }

    /**
     * Parse nudges response from AI
     */
    parseNudgesResponse(response) {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('No JSON found in response');
        } catch (error) {
            console.error('Error parsing nudges response:', error);
            return null;
        }
    }

    /**
     * Parse urgent actions response from AI
     */
    parseUrgentActionsResponse(response) {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('No JSON found in response');
        } catch (error) {
            console.error('Error parsing urgent actions response:', error);
            return null;
        }
    }

    /**
     * Fallback nudges if AI generation fails
     */
    getFallbackNudges(context) {
        return [
            {
                type: 'growth',
                goal: 'Launch Customer Referral Program',
                description: 'Reduce CAC by 25% through customer referrals. Quick setup with proven templates.',
                buttonText: 'Launch Now',
                auxReward: 120,
                difficulty: 'Medium'
            },
            {
                type: 'validation',
                goal: 'Complete Customer Interviews',
                description: 'Need 2 more interviews to reach Series A validation threshold.',
                buttonText: 'Schedule Now',
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
    }

    /**
     * Fallback urgent actions if AI generation fails
     */
    getFallbackUrgentActions(context) {
        return [
            {
                title: 'Customer Interview #8',
                description: 'Required to unlock Series A assessment. Complete final validation interview.',
                buttonText: 'Start Now',
                urgencyColor: 'red',
                auxReward: 150,
                actionId: 'customer_interview_8',
                workflowType: 'Modal'
            },
            {
                title: 'Financial Model Update',
                description: 'Your projections are 30 days old - Overdue. Update to reflect current metrics.',
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
    }

    /**
     * Render nudges in the Overview tab
     */
    renderNudges(nudges, containerSelector = '#nudgesContainer') {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.error('Nudges container not found');
            return;
        }

        const colorMap = {
            growth: { color: 'success', icon: 'bullseye', cssVar: '--success-green' },
            validation: { color: 'warning', icon: 'chart-line', cssVar: '--neon-gold' },
            funding: { color: 'primary', icon: 'rocket', cssVar: '--neon-blue' }
        };

        const html = nudges.map(nudge => {
            const config = colorMap[nudge.type];
            const badgeClass = nudge.type === 'validation' ? 'bg-warning text-dark' : `bg-${config.color}`;
            
            return `
                <div class="col-md-4">
                    <div class="nudge-card" style="border-left-color: var(${config.cssVar});">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="text-${config.color} mb-1">
                                <i class="fas fa-${config.icon} me-1"></i>${nudge.type.charAt(0).toUpperCase() + nudge.type.slice(1)} Nudge
                            </h6>
                            <span class="badge ${badgeClass}">+${nudge.auxReward} AUX</span>
                        </div>
                        <p class="small mb-2">
                            <strong>${nudge.goal}:</strong> ${nudge.description}
                        </p>
                        <button class="btn btn-sm btn-${config.color} w-100" id="${nudge.type}NudgeBtn">${nudge.buttonText}</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Render urgent actions in the Overview tab
     */
    renderUrgentActions(actions, containerSelector = '#urgentActionsContainer') {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.error('Urgent actions container not found');
            return;
        }

        const colorMap = {
            red: { cssClass: 'danger', cssVar: '--danger-red' },
            yellow: { cssClass: 'warning', cssVar: '--warning-orange' },
            blue: { cssClass: 'primary', cssVar: '--neon-blue' }
        };

        const html = actions.map(action => {
            const config = colorMap[action.urgencyColor];
            const auxBadge = action.auxReward ? ` - +${action.auxReward} AUX` : '';
            
            return `
                <div class="nudge-card urgent mb-3" style="border-left-color: var(${config.cssVar});">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="text-${config.cssClass} mb-0">${action.title}</h6>
                            <p class="mb-0 small text-secondary">${action.description}${auxBadge}</p>
                        </div>
                        <button class="btn btn-sm btn-${config.cssClass}" data-action-id="${action.actionId}">${action.buttonText}</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Initialize and load all dynamic content
     */
    async initialize(userContext) {
        try {
            // Generate nudges and urgent actions in parallel
            const [nudges, urgentActions] = await Promise.all([
                this.generateNudges(userContext),
                this.generateUrgentActions(userContext)
            ]);

            // Render both sections
            this.renderNudges(nudges);
            this.renderUrgentActions(urgentActions);

            return { nudges, urgentActions };
        } catch (error) {
            console.error('Error initializing dynamic nudges:', error);
            
            // Render fallbacks
            this.renderNudges(this.getFallbackNudges(userContext));
            this.renderUrgentActions(this.getFallbackUrgentActions(userContext));
        }
    }

    /**
     * Clear cache (useful for testing or manual refresh)
     */
    clearCache() {
        this.cache = {
            nudges: null,
            urgentActions: null,
            timestamp: null
        };
    }
}

// Export for use in dashboard
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicNudgesManager;
}
