/**
 * Auxeira Complete Platform Backend
 * Supporting ALL dashboard types: ESG (17 SDGs), VC, Angel Investor, Government, Impact Investor, Startup, Corporate Partner
 * 
 * Dashboard Categories:
 * 1. ESG Dashboards (17 SDG focus areas) - Impact investors, foundations, ESG funds
 * 2. VC Dashboard - Venture capital firms and funds
 * 3. Angel Investor Dashboard - Individual high-net-worth investors
 * 4. Government Agency Dashboard - Policy makers and government departments
 * 5. Impact Investor Dashboard - Impact-focused investment funds
 * 6. Startup Dashboard - Entrepreneurs and founding teams
 * 7. Corporate Partner Dashboard - Corporate partnerships and share value partners
 */

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { CompleteDashboardService } = require('./complete-dashboard-database');

const app = express();
const port = process.env.PORT || 3000;

// Initialize complete dashboard service
const dbService = new CompleteDashboardService();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
    origin: [
        'https://dashboard.auxeira.com',
        'https://vc.auxeira.com',
        'https://angel.auxeira.com',
        'https://government.auxeira.com',
        'https://startup.auxeira.com',
        'https://corporate.auxeira.com',
        'http://localhost:3000',
        'http://localhost:8080'
    ],
    credentials: true
}));

// Authentication middleware (reused from previous implementation)
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'auxeira-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// ================================
// DASHBOARD TYPE VALIDATION
// ================================

const VALID_DASHBOARD_TYPES = [
    'esg_poverty', 'esg_hunger', 'esg_health', 'esg_education', 'esg_gender',
    'esg_water', 'esg_energy', 'esg_work', 'esg_innovation', 'esg_inequalities',
    'esg_cities', 'esg_consumption', 'esg_climate', 'esg_ocean', 'esg_land',
    'esg_justice', 'esg_partnerships',
    'vc', 'angel', 'government', 'impact', 'startup', 'corporate'
];

const validateDashboardType = (req, res, next) => {
    const { dashboardType } = req.body;
    if (dashboardType && !VALID_DASHBOARD_TYPES.includes(dashboardType)) {
        return res.status(400).json({ 
            error: 'Invalid dashboard type',
            validTypes: VALID_DASHBOARD_TYPES 
        });
    }
    next();
};

// ================================
// USER AUTHENTICATION (Enhanced)
// ================================

app.post('/api/auth/register', validateDashboardType, async (req, res) => {
    try {
        const { email, password, firstName, lastName, dashboardType, organizationType } = req.body;

        if (!email || !password || !firstName || !lastName || !dashboardType) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await dbService.getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user with dashboard type
        const result = await dbService.createUser({
            email,
            passwordHash,
            firstName,
            lastName,
            role: 'user',
            dashboardType,
            organizationType: organizationType || getDashboardDefaultOrgType(dashboardType)
        });

        if (result.success) {
            const token = jwt.sign(
                { 
                    userId: result.user.userId, 
                    email: result.user.email,
                    dashboardType: dashboardType
                },
                process.env.JWT_SECRET || 'auxeira-secret-key',
                { expiresIn: '24h' }
            );

            res.status(201).json({
                success: true,
                user: result.user,
                token,
                dashboardType
            });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================
// ENHANCED PROFILE MANAGEMENT
// ================================

app.post('/api/profile/complete', authenticateToken, validateDashboardType, async (req, res) => {
    try {
        const profileData = req.body;
        const userId = req.user.userId;
        const dashboardType = profileData.dashboardType || req.user.dashboardType;

        // Validate required fields based on dashboard type
        const validationResult = validateProfileData(profileData, dashboardType);
        if (!validationResult.isValid) {
            return res.status(400).json({ 
                error: 'Profile validation failed',
                missingFields: validationResult.missingFields 
            });
        }

        const result = await dbService.createUserProfile(userId, profileData, dashboardType);

        // Update leaderboard based on dashboard type
        if (result.success && result.profile.completionScore === 100) {
            await dbService.updateDashboardLeaderboard(
                userId,
                dashboardType,
                'profile_completion',
                100,
                {
                    organizationType: profileData.organizationType,
                    organizationName: profileData.organizationName,
                    country: profileData.country,
                    metrics: { completionScore: 100 }
                }
            );
        }

        res.json(result);
    } catch (error) {
        console.error('Profile completion error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================
// VC DASHBOARD ENDPOINTS
// ================================

app.post('/api/vc/deals', authenticateToken, async (req, res) => {
    try {
        const dealData = req.body;
        const investorId = req.user.userId;

        // Validate VC dashboard access
        if (req.user.dashboardType !== 'vc') {
            return res.status(403).json({ error: 'VC dashboard access required' });
        }

        const result = await dbService.createDeal({
            ...dealData,
            investorId
        });

        // Track activity
        await dbService.trackUserActivity(investorId, 'deal_created', {
            dealId: result.dealId,
            sector: dealData.sector,
            fundingAmount: dealData.fundingAmount
        });

        res.json(result);
    } catch (error) {
        console.error('Create deal error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/vc/dealflow', authenticateToken, async (req, res) => {
    try {
        const investorId = req.user.userId;
        const filters = req.query;

        if (req.user.dashboardType !== 'vc') {
            return res.status(403).json({ error: 'VC dashboard access required' });
        }

        const deals = await dbService.getVCDealFlow(investorId, filters);
        res.json({ success: true, deals });
    } catch (error) {
        console.error('Get deal flow error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/vc/portfolio/:investorId', authenticateToken, async (req, res) => {
    try {
        const { investorId } = req.params;

        // Ensure user can only access their own portfolio
        if (req.user.userId !== investorId || req.user.dashboardType !== 'vc') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const portfolio = await dbService.getVCPortfolio(investorId);
        res.json({ success: true, portfolio });
    } catch (error) {
        console.error('Get VC portfolio error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================
// STARTUP DASHBOARD ENDPOINTS
// ================================

app.post('/api/startup/profile', authenticateToken, async (req, res) => {
    try {
        const startupData = req.body;
        const founderId = req.user.userId;

        if (req.user.dashboardType !== 'startup') {
            return res.status(403).json({ error: 'Startup dashboard access required' });
        }

        const result = await dbService.createStartupProfile({
            ...startupData,
            founderId
        });

        // Update leaderboard
        await dbService.updateDashboardLeaderboard(
            founderId,
            'startup',
            'profile_strength',
            calculateStartupScore(startupData),
            {
                organizationType: 'Startup',
                organizationName: startupData.companyName,
                country: startupData.country,
                metrics: { 
                    esgScore: startupData.esgScore,
                    fundingStage: startupData.fundingStage,
                    sector: startupData.sector
                }
            }
        );

        res.json(result);
    } catch (error) {
        console.error('Create startup profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/startup/discover', async (req, res) => {
    try {
        const filters = req.query;
        const startups = await dbService.getStartupsByFilter(filters);
        res.json({ success: true, startups });
    } catch (error) {
        console.error('Discover startups error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/startup/funding-opportunities/:startupId', authenticateToken, async (req, res) => {
    try {
        const { startupId } = req.params;

        if (req.user.dashboardType !== 'startup') {
            return res.status(403).json({ error: 'Startup dashboard access required' });
        }

        const opportunities = await dbService.getFundingOpportunities(startupId);
        res.json({ success: true, opportunities });
    } catch (error) {
        console.error('Get funding opportunities error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================
// GOVERNMENT DASHBOARD ENDPOINTS
// ================================

app.post('/api/government/policies', authenticateToken, async (req, res) => {
    try {
        const policyData = req.body;
        const governmentId = req.user.userId;

        if (req.user.dashboardType !== 'government') {
            return res.status(403).json({ error: 'Government dashboard access required' });
        }

        const result = await dbService.createPolicy({
            ...policyData,
            governmentId
        });

        // Track policy creation
        await dbService.trackUserActivity(governmentId, 'policy_created', {
            policyId: result.policyId,
            policyType: policyData.policyType,
            sdgAlignment: policyData.sdgAlignment
        });

        res.json(result);
    } catch (error) {
        console.error('Create policy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/government/policies/sdg/:sdgAlignment', async (req, res) => {
    try {
        const { sdgAlignment } = req.params;
        const { country } = req.query;

        const policies = await dbService.getPoliciesBySDG(sdgAlignment, country);
        res.json({ success: true, policies });
    } catch (error) {
        console.error('Get policies by SDG error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/government/impact-analysis/:policyId', authenticateToken, async (req, res) => {
    try {
        const { policyId } = req.params;

        if (req.user.dashboardType !== 'government') {
            return res.status(403).json({ error: 'Government dashboard access required' });
        }

        const analysis = await dbService.getPolicyImpactAnalysis(policyId);
        res.json({ success: true, analysis });
    } catch (error) {
        console.error('Get impact analysis error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================
// CORPORATE PARTNERSHIP ENDPOINTS
// ================================

app.post('/api/corporate/partnerships', authenticateToken, async (req, res) => {
    try {
        const partnershipData = req.body;
        const corporateId = req.user.userId;

        if (req.user.dashboardType !== 'corporate') {
            return res.status(403).json({ error: 'Corporate dashboard access required' });
        }

        const result = await dbService.createPartnership({
            ...partnershipData,
            corporateId
        });

        // Track partnership creation
        await dbService.trackUserActivity(corporateId, 'partnership_created', {
            partnershipId: result.partnershipId,
            partnershipType: partnershipData.partnershipType,
            value: partnershipData.value
        });

        res.json(result);
    } catch (error) {
        console.error('Create partnership error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/corporate/partnerships/:corporateId', authenticateToken, async (req, res) => {
    try {
        const { corporateId } = req.params;
        const { status } = req.query;

        // Ensure user can only access their own partnerships
        if (req.user.userId !== corporateId || req.user.dashboardType !== 'corporate') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const partnerships = await dbService.getCorporatePartnerships(corporateId, status);
        res.json({ success: true, partnerships });
    } catch (error) {
        console.error('Get partnerships error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/corporate/share-value-opportunities', authenticateToken, async (req, res) => {
    try {
        if (req.user.dashboardType !== 'corporate') {
            return res.status(403).json({ error: 'Corporate dashboard access required' });
        }

        const opportunities = await dbService.getShareValueOpportunities(req.user.userId);
        res.json({ success: true, opportunities });
    } catch (error) {
        console.error('Get share value opportunities error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================
// ANGEL INVESTOR ENDPOINTS
// ================================

app.get('/api/angel/investment-opportunities', authenticateToken, async (req, res) => {
    try {
        if (req.user.dashboardType !== 'angel') {
            return res.status(403).json({ error: 'Angel investor dashboard access required' });
        }

        const { sector, stage, location } = req.query;
        const opportunities = await dbService.getAngelInvestmentOpportunities({
            sector, stage, location, investorId: req.user.userId
        });
        
        res.json({ success: true, opportunities });
    } catch (error) {
        console.error('Get angel opportunities error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/angel/mentorship', authenticateToken, async (req, res) => {
    try {
        const mentorshipData = req.body;

        if (req.user.dashboardType !== 'angel') {
            return res.status(403).json({ error: 'Angel investor dashboard access required' });
        }

        const result = await dbService.createMentorshipOffer({
            ...mentorshipData,
            mentorId: req.user.userId
        });

        res.json(result);
    } catch (error) {
        console.error('Create mentorship error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================
// IMPACT INVESTOR ENDPOINTS
// ================================

app.get('/api/impact/opportunities', authenticateToken, async (req, res) => {
    try {
        if (req.user.dashboardType !== 'impact') {
            return res.status(403).json({ error: 'Impact investor dashboard access required' });
        }

        const { sdgFocus, impactThesis, geography } = req.query;
        const opportunities = await dbService.getImpactInvestmentOpportunities({
            sdgFocus, impactThesis, geography, investorId: req.user.userId
        });
        
        res.json({ success: true, opportunities });
    } catch (error) {
        console.error('Get impact opportunities error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/impact/measurement/:investmentId', authenticateToken, async (req, res) => {
    try {
        const { investmentId } = req.params;

        if (req.user.dashboardType !== 'impact') {
            return res.status(403).json({ error: 'Impact investor dashboard access required' });
        }

        const measurement = await dbService.getImpactMeasurement(investmentId);
        res.json({ success: true, measurement });
    } catch (error) {
        console.error('Get impact measurement error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================
// CROSS-DASHBOARD LEADERBOARDS
// ================================

app.get('/api/leaderboard/:dashboardType/:category', async (req, res) => {
    try {
        const { dashboardType, category } = req.params;
        const limit = parseInt(req.query.limit) || 100;

        if (!VALID_DASHBOARD_TYPES.includes(dashboardType)) {
            return res.status(400).json({ error: 'Invalid dashboard type' });
        }

        const leaderboard = await dbService.getDashboardLeaderboard(dashboardType, category, limit);
        res.json({ success: true, leaderboard });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================
// ENHANCED AI REPORTS (All Dashboards)
// ================================

app.post('/api/reports/generate/:dashboardType', authenticateToken, async (req, res) => {
    try {
        const { dashboardType } = req.params;
        const { reportType, profile } = req.body;
        const userId = req.user.userId;

        // Validate dashboard access
        if (req.user.dashboardType !== dashboardType && !dashboardType.startsWith('esg')) {
            return res.status(403).json({ error: 'Dashboard access denied' });
        }

        const reportData = await generateDashboardSpecificReport(dashboardType, reportType, profile);

        // Save report
        const result = await dbService.createESGReport({
            userId,
            dashboardType,
            reportType,
            title: reportData.title,
            executiveSummary: reportData.executiveSummary,
            fullNarrative: reportData.fullNarrative,
            keyMetrics: reportData.keyMetrics,
            visualizations: reportData.visualizations,
            recommendedActions: reportData.recommendedActions,
            scrapedDataSources: reportData.scrapedDataSources,
            promptUsed: reportData.promptUsed,
            tokensUsed: reportData.tokensUsed,
            generationTime: reportData.generationTime,
            isPremium: reportData.isPremium,
            unlockPrice: reportData.unlockPrice,
            isUnlocked: !reportData.isPremium
        });

        res.json({
            success: true,
            reportId: result.reportId,
            report: reportData,
            isPremium: reportData.isPremium,
            unlockPrice: reportData.unlockPrice
        });
    } catch (error) {
        console.error('Generate dashboard report error:', error);
        res.status(500).json({ error: 'Report generation failed' });
    }
});

// ================================
// CROSS-DASHBOARD ANALYTICS
// ================================

app.get('/api/analytics/:dashboardType/metrics', authenticateToken, async (req, res) => {
    try {
        const { dashboardType } = req.params;
        const { timeframe } = req.query;

        const analytics = await dbService.getDashboardAnalytics(dashboardType, timeframe);
        res.json({ success: true, analytics });
    } catch (error) {
        console.error('Get dashboard analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================
// UTILITY FUNCTIONS
// ================================

function getDashboardDefaultOrgType(dashboardType) {
    const defaults = {
        'vc': 'Venture Capital Fund',
        'angel': 'Angel Investor',
        'government': 'Government Agency',
        'impact': 'Impact Investment Fund',
        'startup': 'Startup Company',
        'corporate': 'Corporation'
    };
    
    if (dashboardType.startsWith('esg')) {
        return 'ESG Organization';
    }
    
    return defaults[dashboardType] || 'Organization';
}

function validateProfileData(profileData, dashboardType) {
    const commonRequired = ['organizationName', 'organizationType', 'website', 'country'];
    
    const dashboardSpecific = {
        'vc': ['fundSize', 'investmentStage', 'sectorFocus'],
        'angel': ['investmentCapacity', 'expertiseAreas'],
        'government': ['department', 'policyAreas', 'jurisdiction'],
        'impact': ['impactThesis', 'measurementFramework'],
        'startup': ['foundingYear', 'sector', 'fundingStage'],
        'corporate': ['industry', 'marketCap', 'esgRating'],
        'esg': ['focusAreas', 'sdgAlignment', 'impactGoals']
    };

    const requiredFields = [
        ...commonRequired,
        ...(dashboardSpecific[dashboardType] || dashboardSpecific['esg'])
    ];

    const missingFields = requiredFields.filter(field => 
        !profileData[field] || profileData[field].toString().trim().length === 0
    );

    return {
        isValid: missingFields.length === 0,
        missingFields
    };
}

function calculateStartupScore(startupData) {
    let score = 0;
    
    // ESG Score (40%)
    score += (startupData.esgScore || 0) * 0.4;
    
    // Funding Stage (30%)
    const stageScores = { 'Pre-seed': 20, 'Seed': 40, 'Series A': 60, 'Series B': 80, 'Series C+': 100 };
    score += (stageScores[startupData.fundingStage] || 0) * 0.3;
    
    // Revenue (20%)
    const revenueScore = Math.min((startupData.revenue || 0) / 1000000 * 100, 100);
    score += revenueScore * 0.2;
    
    // Team Size (10%)
    const teamScore = Math.min((startupData.teamSize || 0) / 50 * 100, 100);
    score += teamScore * 0.1;
    
    return Math.round(score);
}

async function generateDashboardSpecificReport(dashboardType, reportType, profile) {
    // Dashboard-specific report generation logic
    const startTime = Date.now();
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const dashboardTitles = {
        'vc': 'Venture Capital Intelligence Report',
        'angel': 'Angel Investment Opportunity Analysis',
        'government': 'Policy Impact Assessment Report',
        'impact': 'Impact Investment Analysis',
        'startup': 'Startup Growth Strategy Report',
        'corporate': 'Corporate Partnership Intelligence'
    };

    const baseTitle = dashboardTitles[dashboardType] || 'ESG Impact Report';
    const isPremium = !['impact_story', 'comparative_benchmark'].includes(reportType);
    
    return {
        title: `${baseTitle} - ${profile.organizationName}`,
        executiveSummary: `Comprehensive ${dashboardType} analysis for ${profile.organizationName} reveals significant opportunities for strategic growth and impact optimization.`,
        fullNarrative: generateDashboardNarrative(dashboardType, profile),
        keyMetrics: generateDashboardMetrics(dashboardType),
        visualizations: ['trend_analysis', 'performance_matrix', 'opportunity_map'],
        recommendedActions: generateDashboardActions(dashboardType),
        scrapedDataSources: ['Industry reports', 'Market intelligence', 'Regulatory updates'],
        promptUsed: `Generate ${reportType} for ${dashboardType} dashboard`,
        tokensUsed: Math.floor(Math.random() * 3000) + 1000,
        generationTime: Date.now() - startTime,
        isPremium,
        unlockPrice: isPremium ? 399 : 0
    };
}

function generateDashboardNarrative(dashboardType, profile) {
    const narratives = {
        'vc': `${profile.organizationName}'s venture capital strategy shows strong alignment with emerging market trends. Our analysis indicates optimal positioning for Series A and B investments in the ${profile.sectorFocus} sectors.`,
        'angel': `As an angel investor, ${profile.organizationName} has significant opportunities to leverage expertise in ${profile.expertiseAreas} for high-impact investments and mentorship roles.`,
        'government': `${profile.organizationName}'s policy framework demonstrates strong commitment to sustainable development. Strategic focus on ${profile.policyAreas} can drive significant socioeconomic impact.`,
        'startup': `${profile.organizationName} shows exceptional growth potential in the ${profile.sector} sector. Current funding stage positioning enables strategic scaling opportunities.`,
        'corporate': `${profile.organizationName}'s corporate partnership strategy aligns well with ESG objectives and market positioning in the ${profile.industry} industry.`
    };
    
    return narratives[dashboardType] || `${profile.organizationName} demonstrates strong ESG commitment with significant impact potential.`;
}

function generateDashboardMetrics(dashboardType) {
    const baseMetrics = {
        impactScore: Math.floor(Math.random() * 30) + 70,
        performanceIndex: Math.floor(Math.random() * 25) + 75,
        growthPotential: Math.floor(Math.random() * 40) + 60
    };

    const dashboardSpecific = {
        'vc': { dealFlowScore: 85, portfolioHealth: 92, roiProjection: 18 },
        'angel': { networkStrength: 78, mentorshipImpact: 88, investmentROI: 22 },
        'government': { policyEffectiveness: 82, citizenImpact: 91, budgetEfficiency: 76 },
        'startup': { scalabilityIndex: 87, marketFit: 83, fundingReadiness: 79 },
        'corporate': { partnershipValue: 89, esgAlignment: 85, shareValueCreation: 92 }
    };

    return { ...baseMetrics, ...(dashboardSpecific[dashboardType] || {}) };
}

function generateDashboardActions(dashboardType) {
    const actions = {
        'vc': [
            'Expand deal flow in AI and fintech sectors',
            'Strengthen due diligence processes',
            'Develop ESG scoring framework'
        ],
        'angel': [
            'Increase mentorship program participation',
            'Diversify investment portfolio geographically',
            'Leverage network for co-investment opportunities'
        ],
        'government': [
            'Enhance stakeholder engagement mechanisms',
            'Implement digital transformation initiatives',
            'Strengthen public-private partnerships'
        ],
        'startup': [
            'Accelerate product-market fit validation',
            'Expand strategic partnerships',
            'Strengthen ESG practices for investor appeal'
        ],
        'corporate': [
            'Develop strategic partnership pipeline',
            'Enhance ESG reporting and transparency',
            'Create shared value measurement framework'
        ]
    };

    return actions[dashboardType] || [
        'Enhance ESG measurement and reporting',
        'Strengthen stakeholder engagement',
        'Develop strategic partnerships'
    ];
}

// ================================
// HEALTH CHECK
// ================================

app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        message: 'Auxeira Complete Platform Backend is running!',
        supportedDashboards: VALID_DASHBOARD_TYPES,
        timestamp: new Date().toISOString(),
        version: '3.0'
    });
});

// ================================
// ERROR HANDLING
// ================================

app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// ================================
// START SERVER
// ================================

if (require.main === module) {
    app.listen(port, () => {
        console.log(`🚀 Auxeira Complete Platform Backend running on port ${port}`);
        console.log(`📊 Health check: http://localhost:${port}/health`);
        console.log(`🔗 API Base URL: http://localhost:${port}/api`);
        console.log(`📱 Supported Dashboards: ${VALID_DASHBOARD_TYPES.length} types`);
        console.log(`   - ESG Dashboards: 17 SDG focus areas`);
        console.log(`   - VC Dashboard: Venture capital intelligence`);
        console.log(`   - Angel Dashboard: Individual investor tools`);
        console.log(`   - Government Dashboard: Policy maker interface`);
        console.log(`   - Impact Dashboard: Impact investment platform`);
        console.log(`   - Startup Dashboard: Entrepreneur tools`);
        console.log(`   - Corporate Dashboard: Partnership management`);
    });
}

module.exports = app;
