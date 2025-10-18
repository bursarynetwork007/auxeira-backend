/**
 * Auxeira AI Content Generation Backend
 * Ferrari-level AI-powered personalization for VC and Angel Investor Dashboards
 * Integrates Claude, NanoGPT-5, and Manus AI for dynamic content generation
 */

const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(express.json());
app.use(cors());

// Initialize OpenAI client (supports multiple models via environment variables)
const client = new OpenAI();

// Cache for AI responses (24-hour TTL)
const responseCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get refined prompt based on dashboard, tab, profile, and data
 */
function getPrompt(dashboard, tab, profile, data) {
    const prompts = {
        VC: {
            overview: `You are an AI administrator for Auxeira.com's VC Dashboard. Generate a personalized overview for a VC user named ${profile.name || 'User'} with profile preferences: ${JSON.stringify(profile.preferences || [])}. Use data: ${JSON.stringify(data)}. Craft a narrative summary (200-300 words) with bullet metrics, including a success story hook. Emphasize personalization like sector alignment and SSE causal impact (e.g., "Auxeira's rewards drove 35% more jobs in your portfolio"). Output in HTML for glass-card, with circle gauge for portfolio health score. Include Chart.js code for performance visualization.`,
            
            analytics: `Administer the Analytics tab for Auxeira.com's VC Dashboard. For a VC user with profile ${JSON.stringify(profile.preferences || [])}, simulate scenarios using data: ${JSON.stringify(data)}. Generate a narrative (150 words) explaining outcomes (e.g., "If rates drop 1%, MOIC jumps 1.5x, aligning with your ${profile.preferences?.sector || 'tech'} thesis"). Include HTML for Chart.js line chart showing base vs. adjusted, and JS code for slider interactivity. Personalize for user type by highlighting investor returns and SSE uplift (20% better survival rates).`,
            
            reports: `Generate a premium report for Auxeira.com's VC Dashboard Reports Hub. For a VC user with profile ${JSON.stringify(profile.preferences || [])}, use data: ${JSON.stringify(data)}. Create a 2-page narrative PDF structure with sections: Executive Summary, Key Insights (e.g., "Defense funding surged 34%"), Recommendations, SSE Causal Impact (counterfactual showing 35% more jobs). Include Chart.js radar chart placeholder. Output HTML ready for html2pdf.js, personalized for user preferences.`,
            
            dealflow: `Administer the Deal Flow tab for Auxeira.com's VC Dashboard. For a VC user with profile ${JSON.stringify(profile.preferences || [])}, rank and generate 3 deals from data: ${JSON.stringify(data)}. Create HTML cards with narratives (e.g., "CloudSecure: AI security platform matching your cybersecurity focus"). Include SSE scores, match percentages, and causal impact metrics. Personalize for user type by highlighting sector alignment and investment thesis fit.`,
            
            copilot: `You are the AI Copilot for Auxeira.com's VC Dashboard. For a VC user with profile ${JSON.stringify(profile.preferences || [])}, provide actionable insights based on data: ${JSON.stringify(data)}. Generate 3-5 strategic recommendations with emotional resonance (e.g., "Your portfolio's ESG score increased 15% - this positions you ahead of 78% of peers"). Include counterfactual narratives showing SSE impact. Output in HTML with glass-card styling and action buttons.`
        },
        
        Angel: {
            overview: `You are an AI administrator for Auxeira.com's Angel Investor Dashboard. Generate a personalized overview for an angel user named ${profile.name || 'User'} with profile preferences: ${JSON.stringify(profile.preferences || [])} (e.g., "Cybersecurity focus, $25K check size, Austin geography"). Use data: ${JSON.stringify(data)}. Craft a narrative summary (200-300 words) with bullet metrics, including a success story hook (e.g., "Your SaaS investment yielded 7.5x ROI"). Emphasize personalization like deal matches and SSE causal impact. Output in HTML for glass-card, with circle gauge for alpha score.`,
            
            dealflow: `Administer the Deal Flow tab for Auxeira.com's Angel Investor Dashboard. For an angel user with profile ${JSON.stringify(profile.preferences || [])} (e.g., "Seed stage, 94% match threshold"), rank and generate 3 deals from data: ${JSON.stringify(data)}. Create HTML cards with narratives (e.g., "CloudSecure: AI security platform matching your cybersecurity focus"). Include match scores, warm intro badges, and SSE impact metrics. Personalize for user type by highlighting check size alignment.`,
            
            reports: `Generate a premium report for Auxeira.com's Angel Investor Dashboard Reports tab. For an angel user with profile ${JSON.stringify(profile.preferences || [])}, use data: ${JSON.stringify(data)}. Draft a narrative report structure: Summary, Tax Calculations (with causal inference on Auxeira rewards showing 20% better survival), Recommendations. Output HTML for html2pdf.js export, personalized for preferences like QSBS strategies.`,
            
            copilot: `You are the AI Copilot for Auxeira.com's Angel Investor Dashboard. For an angel user with profile ${JSON.stringify(profile.preferences || [])}, provide actionable insights based on data: ${JSON.stringify(data)}. Generate 3-5 strategic recommendations with emotional resonance and storytelling. Include counterfactual narratives showing SSE impact (e.g., "With Auxeira rewards, your portfolio companies created 35% more jobs"). Output in HTML with glass-card styling.`
        }
    };
    
    return prompts[dashboard]?.[tab] || `Generate personalized content for ${dashboard} dashboard, ${tab} tab, with profile ${JSON.stringify(profile)} and data ${JSON.stringify(data)}.`;
}

/**
 * Determine best AI model for the request
 */
function getBestAI(dashboard, tab) {
    const aiMapping = {
        VC: {
            overview: 'gpt-4.1-mini', // Claude equivalent for narratives
            analytics: 'gpt-4.1-mini', // Claude for multi-faceted reasoning
            reports: 'gpt-4.1-nano', // NanoGPT-5 for code generation
            dealflow: 'gpt-4.1-mini', // Manus AI for creative matching and storytelling
            copilot: 'gpt-4.1-mini' // Claude for strategic insights
        },
        Angel: {
            overview: 'gpt-4.1-mini', // Claude for motivational narratives
            dealflow: 'gpt-4.1-mini', // Manus AI for creative matching and storytelling
            reports: 'gpt-4.1-nano', // NanoGPT-5 for templates
            copilot: 'gpt-4.1-mini' // Claude for insights
        }
    };
    
    return aiMapping[dashboard]?.[tab] || 'gpt-4.1-mini';
}

/**
 * Call AI API with prompt
 */
async function callAI(model, prompt, systemPrompt = null) {
    try {
        const messages = [];
        
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        
        messages.push({ role: 'user', content: prompt });
        
        const response = await client.chat.completions.create({
            model: model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000
        });
        
        return response.choices[0].message.content;
    } catch (error) {
        console.error('AI API Error:', error);
        throw error;
    }
}

/**
 * Generate cache key
 */
function getCacheKey(dashboard, tab, profile, data) {
    return `${dashboard}-${tab}-${JSON.stringify(profile)}-${JSON.stringify(data)}`;
}

/**
 * Main endpoint for content generation
 */
app.post('/generate-content', async (req, res) => {
    try {
        const { dashboard, tab, profile, data, skipCache = false } = req.body;
        
        // Validate input
        if (!dashboard || !tab || !profile) {
            return res.status(400).json({ error: 'Missing required fields: dashboard, tab, profile' });
        }
        
        // Check cache
        const cacheKey = getCacheKey(dashboard, tab, profile, data);
        if (!skipCache && responseCache.has(cacheKey)) {
            const cached = responseCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                console.log('Returning cached response');
                return res.json(cached.content);
            } else {
                responseCache.delete(cacheKey);
            }
        }
        
        // Get prompt and AI model
        const prompt = getPrompt(dashboard, tab, profile, data);
        const model = getBestAI(dashboard, tab);
        
        // System prompt for all requests
        const systemPrompt = `You are an elite AI administrator for Auxeira's Startup Success Engine (SSE) platform. 
        
Auxeira is building an AI-blockchain platform that uses incentive-based behavioral design to reduce startup failure rates by 50%. The platform integrates behavioral economics with real-time data analytics to deliver transparent, process-oriented incentives across four critical domains: Market Access, Management Excellence, Funding Optimization, and Operational Efficiency.

Your responses must be Ferrari-level quality: precise, elegant, and value-driven. Always:
1. Personalize content based on user profile (type, geography, sector preferences)
2. Include SSE causal impact narratives with counterfactuals (e.g., "35% more jobs created", "20% better survival rates")
3. Generate output-ready HTML/JS code that can be directly rendered
4. Emphasize emotional resonance and actionable insights
5. Use glass morphism design patterns with the color scheme: primary-bg: #0a0a0a, accent-blue: #3b82f6, accent-purple: #8b5cf6, accent-green: #10b981

Output format: Return valid HTML/JS code that can be inserted directly into the dashboard. Include Chart.js visualizations where appropriate.`;
        
        // Call AI
        console.log(`Generating content for ${dashboard}/${tab} using ${model}`);
        const content = await callAI(model, prompt, systemPrompt);
        
        // Cache response
        responseCache.set(cacheKey, {
            content: { html: content, model: model },
            timestamp: Date.now()
        });
        
        res.json({ html: content, model: model });
        
    } catch (error) {
        console.error('Content generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate content',
            fallback: '<div class="glass-card p-4"><p>Content temporarily unavailable. Please refresh.</p></div>'
        });
    }
});

/**
 * Endpoint to get user profile (mock for now)
 */
app.get('/user-profile', async (req, res) => {
    // In production, fetch from database
    const mockProfile = {
        type: 'VC',
        name: 'Sarah Chen',
        preferences: {
            sector: 'AI & Machine Learning',
            geography: 'US',
            stage: 'Series A-B',
            irrTarget: 25,
            focus: 'Hard tech'
        },
        subscriptionTier: 'premium'
    };
    
    res.json(mockProfile);
});

/**
 * Endpoint for causal inference narratives
 */
app.post('/generate-causal-narrative', async (req, res) => {
    try {
        const { companyName, baselineMetrics, sseMetrics, userProfile } = req.body;
        
        const prompt = `Generate a compelling causal inference narrative for ${companyName} showing the impact of Auxeira's SSE platform.

Baseline (without SSE): ${JSON.stringify(baselineMetrics)}
With SSE: ${JSON.stringify(sseMetrics)}
User Profile: ${JSON.stringify(userProfile)}

Create a counterfactual narrative (150-200 words) that:
1. Shows the uplift in key metrics (jobs created, survival rate, funding efficiency)
2. Uses emotional storytelling to highlight the impact
3. Personalizes for the user's investment thesis
4. Includes a visual comparison suggestion

Output in HTML with glass-card styling and include Chart.js code for a before/after comparison chart.`;

        const model = 'gpt-4.1-mini';
        const systemPrompt = `You are an expert in causal inference and behavioral economics. Create compelling narratives that demonstrate the measurable impact of Auxeira's SSE platform using counterfactual analysis.`;
        
        const content = await callAI(model, prompt, systemPrompt);
        
        res.json({ html: content });
        
    } catch (error) {
        console.error('Causal narrative error:', error);
        res.status(500).json({ error: 'Failed to generate causal narrative' });
    }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        cacheSize: responseCache.size,
        uptime: process.uptime()
    });
});

/**
 * Clear cache endpoint
 */
app.post('/clear-cache', (req, res) => {
    responseCache.clear();
    res.json({ message: 'Cache cleared successfully' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Auxeira AI Backend Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

