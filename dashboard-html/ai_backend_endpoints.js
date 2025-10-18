/**
 * Auxeira AI Backend Endpoints
 * Express.js server endpoints for AI integration with Claude, Grok, Manus, and NanoGPT-5
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Rate limiting
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many AI requests from this IP, please try again later.'
});

app.use('/api/ai', aiLimiter);

// ===========================================
// AI PROVIDER CONFIGURATIONS
// ===========================================

const AI_CONFIGS = {
    claude: {
        baseURL: 'https://api.anthropic.com/v1/messages',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
        },
        model: 'claude-3-sonnet-20240229'
    },
    grok: {
        baseURL: 'https://api.x.ai/v1/chat/completions',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROK_API_KEY}`
        },
        model: 'grok-beta'
    },
    manus: {
        baseURL: 'https://api.manus.ai/v1/completions',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MANUS_API_KEY}`
        },
        model: 'manus-ai-v1'
    },
    nanoGPT5: {
        baseURL: 'https://api.openai.com/v1/chat/completions',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        model: 'gpt-4-1106-preview'
    }
};

// ===========================================
// AI ENDPOINT HANDLERS
// ===========================================

// Claude API Endpoint
app.post('/api/ai/claude', async (req, res) => {
    try {
        const { messages, max_tokens = 4000, temperature = 0.7 } = req.body;
        
        const claudeRequest = {
            model: AI_CONFIGS.claude.model,
            max_tokens,
            temperature,
            messages: messages.map(msg => ({
                role: msg.role === 'system' ? 'user' : msg.role,
                content: msg.role === 'system' ? `System: ${msg.content}` : msg.content
            }))
        };

        const response = await axios.post(AI_CONFIGS.claude.baseURL, claudeRequest, {
            headers: AI_CONFIGS.claude.headers,
            timeout: 30000
        });

        res.json({
            choices: [{
                message: {
                    content: response.data.content[0].text,
                    role: 'assistant'
                }
            }],
            usage: response.data.usage,
            model: AI_CONFIGS.claude.model
        });

    } catch (error) {
        console.error('Claude API Error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Claude API request failed',
            details: error.response?.data?.error || error.message
        });
    }
});

// Grok API Endpoint
app.post('/api/ai/grok', async (req, res) => {
    try {
        const { messages, max_tokens = 3000, temperature = 0.8 } = req.body;
        
        const grokRequest = {
            model: AI_CONFIGS.grok.model,
            messages,
            max_tokens,
            temperature,
            stream: false
        };

        const response = await axios.post(AI_CONFIGS.grok.baseURL, grokRequest, {
            headers: AI_CONFIGS.grok.headers,
            timeout: 30000
        });

        res.json(response.data);

    } catch (error) {
        console.error('Grok API Error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Grok API request failed',
            details: error.response?.data?.error || error.message
        });
    }
});

// Manus API Endpoint
app.post('/api/ai/manus', async (req, res) => {
    try {
        const { messages, max_tokens = 5000, temperature = 0.6 } = req.body;
        
        const manusRequest = {
            model: AI_CONFIGS.manus.model,
            messages,
            max_tokens,
            temperature,
            response_format: { type: 'text' }
        };

        const response = await axios.post(AI_CONFIGS.manus.baseURL, manusRequest, {
            headers: AI_CONFIGS.manus.headers,
            timeout: 45000
        });

        res.json(response.data);

    } catch (error) {
        console.error('Manus API Error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Manus API request failed',
            details: error.response?.data?.error || error.message
        });
    }
});

// NanoGPT-5 API Endpoint
app.post('/api/ai/nanogpt5', async (req, res) => {
    try {
        const { messages, max_tokens = 2000, temperature = 0.5 } = req.body;
        
        const nanoGPTRequest = {
            model: AI_CONFIGS.nanoGPT5.model,
            messages,
            max_tokens,
            temperature
        };

        const response = await axios.post(AI_CONFIGS.nanoGPT5.baseURL, nanoGPTRequest, {
            headers: AI_CONFIGS.nanoGPT5.headers,
            timeout: 30000
        });

        res.json(response.data);

    } catch (error) {
        console.error('NanoGPT-5 API Error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'NanoGPT-5 API request failed',
            details: error.response?.data?.error || error.message
        });
    }
});

// ===========================================
// DASHBOARD-SPECIFIC ENDPOINTS
// ===========================================

// Generate Overview Section
app.post('/api/ai/generate-overview', async (req, res) => {
    try {
        const { sdgNumber, userProfile, dashboardData } = req.body;
        
        const prompt = `You are an AI administrator for Auxeira.com's ESG Dashboard. Generate a personalized overview for an ESG user with profile ${JSON.stringify(userProfile)}. Use data: ${JSON.stringify(dashboardData)}. Create a narrative hero section (150 words) with teaser tiles, emphasizing impact stories for SDG ${sdgNumber}. Output in HTML for glass-card, with dynamic SDG dropdown and zoom-in tags.`;

        const claudeResponse = await callAI('claude', prompt);
        
        res.json({
            success: true,
            content: claudeResponse,
            sdg: sdgNumber,
            generated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Overview generation error:', error);
        res.status(500).json({
            error: 'Failed to generate overview',
            details: error.message
        });
    }
});

// Generate Analytics Section
app.post('/api/ai/generate-analytics', async (req, res) => {
    try {
        const { sdgNumber, userProfile, dashboardData } = req.body;
        
        const prompt = `Administer the Analytics tab for Auxeira.com's ESG Dashboard. For an ESG user with profile ${JSON.stringify(userProfile)}, simulate causal inference using data: ${JSON.stringify(dashboardData)}. Generate a narrative (150 words) on counterfactuals for SDG ${sdgNumber} (e.g., "With Auxeira rewards, ESG impact 25% higher"). Include HTML for Chart.js doughnut chart and JS for dynamic updates.`;

        const grokResponse = await callAI('grok', prompt);
        
        res.json({
            success: true,
            content: grokResponse,
            sdg: sdgNumber,
            generated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Analytics generation error:', error);
        res.status(500).json({
            error: 'Failed to generate analytics',
            details: error.message
        });
    }
});

// Generate Reports Section
app.post('/api/ai/generate-reports', async (req, res) => {
    try {
        const { sdgNumber, userProfile, dashboardData } = req.body;
        
        const prompt = `Generate a premium report for Auxeira.com's ESG Dashboard. For an ESG user with profile ${JSON.stringify(userProfile)}, use data: ${JSON.stringify(dashboardData)}. Create a narrative structure for SDG ${sdgNumber}: Executive Summary, SDG Impact Stories, Causal Analysis (Auxeira uplift). Output HTML for html2pdf.js, personalized for hybrid SDG tiles.`;

        // Use dual AI approach: Manus + NanoGPT-5
        const manusResponse = await callAI('manus', prompt);
        const aggregationPrompt = `Aggregate and enhance this report for professional presentation: ${manusResponse}`;
        const nanoResponse = await callAI('nanoGPT5', aggregationPrompt);
        
        res.json({
            success: true,
            content: nanoResponse,
            rawContent: manusResponse,
            sdg: sdgNumber,
            generated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Reports generation error:', error);
        res.status(500).json({
            error: 'Failed to generate reports',
            details: error.message
        });
    }
});

// ===========================================
// BATCH GENERATION ENDPOINTS
// ===========================================

// Generate All Dashboard Content
app.post('/api/ai/generate-all-dashboards', async (req, res) => {
    try {
        const { userProfile } = req.body;
        const results = [];
        
        for (let sdgNumber = 1; sdgNumber <= 17; sdgNumber++) {
            try {
                const dashboardData = generateMockDashboardData(sdgNumber);
                
                const [overview, analytics, reports] = await Promise.all([
                    generateOverviewContent(sdgNumber, userProfile, dashboardData),
                    generateAnalyticsContent(sdgNumber, userProfile, dashboardData),
                    generateReportsContent(sdgNumber, userProfile, dashboardData)
                ]);
                
                results.push({
                    sdg: sdgNumber,
                    status: 'success',
                    content: { overview, analytics, reports }
                });
                
            } catch (error) {
                console.error(`Error generating SDG ${sdgNumber}:`, error);
                results.push({
                    sdg: sdgNumber,
                    status: 'error',
                    error: error.message
                });
            }
        }
        
        res.json({
            success: true,
            results,
            generated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Batch generation error:', error);
        res.status(500).json({
            error: 'Failed to generate all dashboards',
            details: error.message
        });
    }
});

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

async function callAI(provider, prompt, additionalConfig = {}) {
    const config = AI_CONFIGS[provider];
    const requestBody = {
        model: config.model,
        messages: [
            {
                role: 'system',
                content: getSystemPrompt(provider)
            },
            {
                role: 'user',
                content: prompt
            }
        ],
        max_tokens: additionalConfig.max_tokens || getDefaultMaxTokens(provider),
        temperature: additionalConfig.temperature || getDefaultTemperature(provider)
    };

    if (provider === 'claude') {
        // Claude has a different request format
        const claudeRequest = {
            model: config.model,
            max_tokens: requestBody.max_tokens,
            temperature: requestBody.temperature,
            messages: requestBody.messages.map(msg => ({
                role: msg.role === 'system' ? 'user' : msg.role,
                content: msg.role === 'system' ? `System: ${msg.content}` : msg.content
            }))
        };

        const response = await axios.post(config.baseURL, claudeRequest, {
            headers: config.headers,
            timeout: 30000
        });

        return response.data.content[0].text;
    } else {
        const response = await axios.post(config.baseURL, requestBody, {
            headers: config.headers,
            timeout: 30000
        });

        return response.data.choices[0].message.content;
    }
}

function getSystemPrompt(provider) {
    const prompts = {
        claude: 'You are an AI administrator for Auxeira.com ESG dashboards, specializing in SDG-aligned narratives and impact storytelling.',
        grok: 'You are a predictive analytics AI for Auxeira.com, specializing in causal inference and impact forecasting for ESG investments.',
        manus: 'You are a comprehensive report generation AI for Auxeira.com, creating premium ESG investment reports with detailed analysis.',
        nanoGPT5: 'You are a data aggregation and synthesis AI for Auxeira.com, combining multiple AI outputs into coherent reports.'
    };
    return prompts[provider] || prompts.claude;
}

function getDefaultMaxTokens(provider) {
    const tokens = {
        claude: 4000,
        grok: 3000,
        manus: 5000,
        nanoGPT5: 2000
    };
    return tokens[provider] || 3000;
}

function getDefaultTemperature(provider) {
    const temperatures = {
        claude: 0.7,
        grok: 0.8,
        manus: 0.6,
        nanoGPT5: 0.5
    };
    return temperatures[provider] || 0.7;
}

function generateMockDashboardData(sdgNumber) {
    // Generate realistic mock data for each SDG
    const baseData = {
        sdg: sdgNumber,
        impactScore: Math.floor(Math.random() * 20) + 80, // 80-100
        investmentAmount: Math.floor(Math.random() * 900) + 100, // 100-1000M
        peopleImpacted: Math.floor(Math.random() * 50) + 10, // 10-60M
        roiPercentage: Math.floor(Math.random() * 200) + 150, // 150-350%
        timestamp: new Date().toISOString()
    };

    // Add SDG-specific metrics
    const sdgSpecificData = getSDGSpecificData(sdgNumber);
    return { ...baseData, ...sdgSpecificData };
}

function getSDGSpecificData(sdgNumber) {
    const specificData = {
        1: { povertyReduction: 45, jobsCreated: 125000, incomeIncrease: 67 },
        2: { foodSecurityIndex: 89, cropsImproved: 340000, nutritionAccess: 78 },
        3: { healthcareAccess: 94, treatmentSuccess: 89, livesImpacted: 45000000 },
        4: { literacyRate: 87, schoolsBuilt: 450, studentsReached: 2300000 },
        5: { genderParityIndex: 0.89, womenEmpowered: 890000, leadershipRoles: 34 },
        6: { waterAccess: 92, sanitationCoverage: 85, waterQuality: 96 },
        7: { renewableCapacity: 1200, energyAccess: 89, carbonReduction: 45 },
        8: { employmentRate: 87, wageGrowth: 23, jobQuality: 78 },
        9: { rdInvestment: 2.3, innovationIndex: 89, techAdoption: 67 },
        10: { inequalityReduction: 34, socialMobility: 67, inclusionIndex: 78 },
        11: { urbanSustainability: 82, transportEfficiency: 78, greenSpace: 45 },
        12: { recyclingRate: 67, resourceEfficiency: 78, circularIndex: 82 },
        13: { carbonFootprint: -34, climateResilience: 89, emissionReduction: 45 },
        14: { marineProtection: 78, oceanHealth: 82, fishStocks: 67 },
        15: { forestCover: 89, speciesProtection: 92, ecosystemHealth: 85 },
        16: { governanceIndex: 78, corruptionReduction: 45, justiceAccess: 82 },
        17: { partnershipEffectiveness: 89, cooperationIndex: 85, knowledgeTransfer: 78 }
    };
    
    return specificData[sdgNumber] || specificData[1];
}

async function generateOverviewContent(sdgNumber, userProfile, dashboardData) {
    const prompt = `Generate personalized overview for SDG ${sdgNumber} with profile: ${JSON.stringify(userProfile)} and data: ${JSON.stringify(dashboardData)}`;
    return await callAI('claude', prompt);
}

async function generateAnalyticsContent(sdgNumber, userProfile, dashboardData) {
    const prompt = `Generate analytics content for SDG ${sdgNumber} with profile: ${JSON.stringify(userProfile)} and data: ${JSON.stringify(dashboardData)}`;
    return await callAI('grok', prompt);
}

async function generateReportsContent(sdgNumber, userProfile, dashboardData) {
    const prompt = `Generate premium report for SDG ${sdgNumber} with profile: ${JSON.stringify(userProfile)} and data: ${JSON.stringify(dashboardData)}`;
    const manusContent = await callAI('manus', prompt);
    return await callAI('nanoGPT5', `Enhance this report: ${manusContent}`);
}

// ===========================================
// HEALTH CHECK AND STATUS
// ===========================================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            claude: !!process.env.CLAUDE_API_KEY,
            grok: !!process.env.GROK_API_KEY,
            manus: !!process.env.MANUS_API_KEY,
            nanoGPT5: !!process.env.OPENAI_API_KEY
        }
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        server: 'Auxeira AI Backend',
        version: '1.0.0',
        uptime: process.uptime(),
        endpoints: [
            '/api/ai/claude',
            '/api/ai/grok',
            '/api/ai/manus',
            '/api/ai/nanogpt5',
            '/api/ai/generate-overview',
            '/api/ai/generate-analytics',
            '/api/ai/generate-reports',
            '/api/ai/generate-all-dashboards'
        ]
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server Error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        availableEndpoints: [
            '/api/health',
            '/api/status',
            '/api/ai/*'
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Auxeira AI Backend running on port ${PORT}`);
    console.log(`📊 Dashboard AI endpoints ready`);
    console.log(`🤖 AI providers: Claude, Grok, Manus, NanoGPT-5`);
});

module.exports = app;
