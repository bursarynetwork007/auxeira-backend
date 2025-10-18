/**
 * Auxeira ESG Dashboard - DynamoDB Backend Integration
 * Express.js API server with DynamoDB for all dashboard features
 */

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AuxeiraDynamoDBService } = require('./dynamodb-central-database');

const app = express();
const port = process.env.PORT || 3000;

// Initialize DynamoDB service
const dbService = new AuxeiraDynamoDBService();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
    origin: [
        'https://dashboard.auxeira.com',
        'http://localhost:3000',
        'http://localhost:8080'
    ],
    credentials: true
}));

// ================================
// AUTHENTICATION MIDDLEWARE
// ================================

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
// USER AUTHENTICATION ROUTES
// ================================

// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, organizationType } = req.body;

        // Validate input
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await dbService.getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const result = await dbService.createUser({
            email,
            passwordHash,
            firstName,
            lastName,
            role: 'user',
            organizationType: organizationType || 'Unknown'
        });

        if (result.success) {
            // Generate JWT token
            const token = jwt.sign(
                { userId: result.user.userId, email: result.user.email },
                process.env.JWT_SECRET || 'auxeira-secret-key',
                { expiresIn: '24h' }
            );

            res.status(201).json({
                success: true,
                user: result.user,
                token
            });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Get user by email
        const user = await dbService.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.userId, email: user.email },
            process.env.JWT_SECRET || 'auxeira-secret-key',
            { expiresIn: '24h' }
        );

        // Update login stats
        await dbService.trackUserActivity(user.userId, 'login', {
            timestamp: new Date().toISOString(),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.json({
            success: true,
            user: dbService.sanitizeUser(user),
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================
// USER PROFILE ROUTES
// ================================

// Get user profile
app.get('/api/profile/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Ensure user can only access their own profile
        if (req.user.userId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const profile = await dbService.getUserProfile(userId);
        res.json({ success: true, profile });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user profile
app.post('/api/profile', authenticateToken, async (req, res) => {
    try {
        const profileData = req.body;
        const userId = req.user.userId;

        const result = await dbService.updateUserProfile(userId, profileData);

        // Update leaderboard score based on profile completion
        if (result.success && result.profile.completionScore === 100) {
            await dbService.updateLeaderboardScore(
                userId,
                'profile_completion',
                100,
                {
                    organizationType: profileData.organizationType,
                    organizationName: profileData.organizationName,
                    country: profileData.country
                }
            );
        }

        res.json(result);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================
// ESG REPORTS ROUTES
// ================================

// Generate AI report
app.post('/api/reports/generate', authenticateToken, async (req, res) => {
    try {
        const { reportType, profile } = req.body;
        const userId = req.user.userId;

        // Validate report type
        const validReportTypes = [
            'impact_story', 'comparative_benchmark', 'scalability_analysis',
            'stakeholder_engagement', 'risk_adjusted_roi', 'cross_sector_collaboration',
            'policy_alignment', 'roi_metrics', 'cross_impact_opportunity',
            'innovation_pipeline', 'market_intelligence', 'competitive_landscape',
            'sustainability_roadmap', 'impact_measurement', 'strategic_recommendations'
        ];

        if (!validReportTypes.includes(reportType)) {
            return res.status(400).json({ error: 'Invalid report type' });
        }

        // Check if report is premium
        const freeReports = ['impact_story', 'comparative_benchmark'];
        const isPremium = !freeReports.includes(reportType);

        // Generate report using AI (mock implementation)
        const reportData = await generateAIReport(reportType, profile, isPremium);

        // Save report to database
        const result = await dbService.createESGReport({
            userId,
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
            isPremium,
            unlockPrice: isPremium ? getReportPrice(reportType) : 0,
            isUnlocked: !isPremium
        });

        // Track activity
        await dbService.trackUserActivity(userId, 'report_generated', {
            reportType,
            reportId: result.reportId,
            isPremium,
            generationTime: reportData.generationTime
        });

        res.json({
            success: true,
            reportId: result.reportId,
            report: reportData,
            isPremium,
            unlockPrice: isPremium ? getReportPrice(reportType) : 0
        });
    } catch (error) {
        console.error('Generate report error:', error);
        res.status(500).json({ error: 'Report generation failed' });
    }
});

// Get user reports
app.get('/api/reports/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Ensure user can only access their own reports
        if (req.user.userId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const reports = await dbService.getUserReports(userId);
        res.json({ success: true, reports });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Unlock premium report
app.post('/api/reports/:reportId/unlock', authenticateToken, async (req, res) => {
    try {
        const { reportId } = req.params;
        const { paymentToken } = req.body;

        // Verify payment (integrate with Paystack)
        const paymentVerified = await verifyPayment(paymentToken);
        
        if (!paymentVerified) {
            return res.status(400).json({ error: 'Payment verification failed' });
        }

        // Update report unlock status
        await dbService.unlockPremiumReport(reportId);

        // Track purchase
        await dbService.trackUserActivity(req.user.userId, 'report_purchased', {
            reportId,
            paymentToken
        });

        res.json({ success: true, message: 'Report unlocked successfully' });
    } catch (error) {
        console.error('Unlock report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================
// COLLABORATION ROUTES
// ================================

// Create new project
app.post('/api/projects', authenticateToken, async (req, res) => {
    try {
        const projectData = req.body;
        const foundationId = req.user.userId;

        const result = await dbService.createProject({
            ...projectData,
            foundationId
        });

        // Track activity
        await dbService.trackUserActivity(foundationId, 'project_created', {
            projectId: result.projectId,
            sdgFocus: projectData.sdgFocus
        });

        res.json(result);
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get projects by SDG focus
app.get('/api/projects/sdg/:sdgFocus', async (req, res) => {
    try {
        const { sdgFocus } = req.params;
        const projects = await dbService.getProjectsBySDG(sdgFocus);
        res.json({ success: true, projects });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create pledge
app.post('/api/pledges', authenticateToken, async (req, res) => {
    try {
        const pledgeData = req.body;
        const userId = req.user.userId;

        const result = await dbService.createPledge({
            ...pledgeData,
            userId
        });

        // Track activity
        await dbService.trackUserActivity(userId, 'pledge_created', {
            pledgeId: result.pledgeId,
            projectId: pledgeData.projectId,
            amount: pledgeData.amount,
            pledgeType: pledgeData.pledgeType
        });

        res.json(result);
    } catch (error) {
        console.error('Create pledge error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================
// LEADERBOARD ROUTES
// ================================

// Get leaderboard
app.get('/api/leaderboard/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const limit = parseInt(req.query.limit) || 100;

        const leaderboard = await dbService.getLeaderboard(category, limit);
        res.json({ success: true, leaderboard });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user ranking
app.get('/api/leaderboard/:category/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { category, userId } = req.params;

        // Ensure user can only access their own ranking
        if (req.user.userId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const ranking = await dbService.getUserRanking(userId, category);
        res.json({ success: true, ranking });
    } catch (error) {
        console.error('Get ranking error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================
// ANALYTICS ROUTES
// ================================

// Get system metrics
app.get('/api/analytics/metrics/:metricType', authenticateToken, async (req, res) => {
    try {
        const { metricType } = req.params;
        const timeframe = req.query.timeframe || '24h';

        const metrics = await dbService.getSystemMetrics(metricType, timeframe);
        res.json({ success: true, metrics });
    } catch (error) {
        console.error('Get metrics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Track user activity
app.post('/api/analytics/activity', authenticateToken, async (req, res) => {
    try {
        const { activity, metadata } = req.body;
        const userId = req.user.userId;

        await dbService.trackUserActivity(userId, activity, {
            ...metadata,
            timestamp: new Date().toISOString(),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Track activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================
// UTILITY FUNCTIONS
// ================================

async function generateAIReport(reportType, profile, isPremium) {
    // Mock AI report generation
    // In production, integrate with OpenAI GPT-4
    
    const startTime = Date.now();
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const generationTime = Date.now() - startTime;
    
    return {
        title: `${getReportTitle(reportType)} - ${profile.organizationName}`,
        executiveSummary: generateExecutiveSummary(reportType, profile),
        fullNarrative: generateFullNarrative(reportType, profile),
        keyMetrics: generateKeyMetrics(reportType, profile),
        visualizations: generateVisualizations(reportType),
        recommendedActions: generateRecommendedActions(reportType, profile),
        scrapedDataSources: generateDataSources(reportType),
        promptUsed: `Generate ${reportType} report for ${profile.organizationType}`,
        tokensUsed: Math.floor(Math.random() * 3000) + 1000,
        generationTime
    };
}

function getReportTitle(reportType) {
    const titles = {
        'impact_story': 'Impact Story Analysis',
        'comparative_benchmark': 'Comparative Benchmark Report',
        'scalability_analysis': 'Scalability & Growth Analysis',
        'stakeholder_engagement': 'Stakeholder Engagement Strategy',
        'risk_adjusted_roi': 'Risk-Adjusted ROI Analysis',
        'cross_sector_collaboration': 'Cross-Sector Collaboration Opportunities',
        'policy_alignment': 'Policy Alignment Assessment',
        'roi_metrics': 'ROI & Performance Metrics',
        'cross_impact_opportunity': 'Cross-Impact Opportunity Analysis',
        'innovation_pipeline': 'Innovation Pipeline Report',
        'market_intelligence': 'Market Intelligence Brief',
        'competitive_landscape': 'Competitive Landscape Analysis',
        'sustainability_roadmap': 'Sustainability Roadmap',
        'impact_measurement': 'Impact Measurement Framework',
        'strategic_recommendations': 'Strategic Recommendations Report'
    };
    return titles[reportType] || 'ESG Analysis Report';
}

function getReportPrice(reportType) {
    const prices = {
        'scalability_analysis': 399,
        'stakeholder_engagement': 349,
        'risk_adjusted_roi': 499,
        'cross_sector_collaboration': 449,
        'policy_alignment': 299,
        'roi_metrics': 399,
        'cross_impact_opportunity': 449,
        'innovation_pipeline': 349,
        'market_intelligence': 299,
        'competitive_landscape': 399,
        'sustainability_roadmap': 499,
        'impact_measurement': 349,
        'strategic_recommendations': 449
    };
    return prices[reportType] || 399;
}

function generateExecutiveSummary(reportType, profile) {
    return `This comprehensive ${reportType} analysis for ${profile.organizationName} reveals significant opportunities for enhanced ESG impact. Our AI-powered analysis indicates strong potential for ${Math.floor(Math.random() * 40) + 20}% improvement in key performance indicators through strategic implementation of recommended initiatives.`;
}

function generateFullNarrative(reportType, profile) {
    return `Based on our comprehensive analysis of ${profile.organizationName}'s current ESG positioning and market dynamics, we have identified several key areas for strategic focus. The organization's commitment to ${profile.focusAreas} aligns well with emerging market trends and regulatory requirements. Our analysis suggests that by implementing the recommended strategies, ${profile.organizationName} can achieve significant improvements in both impact metrics and financial performance.`;
}

function generateKeyMetrics(reportType, profile) {
    return {
        impactScore: Math.floor(Math.random() * 30) + 70,
        roiProjection: Math.floor(Math.random() * 25) + 15,
        riskAssessment: Math.floor(Math.random() * 20) + 10,
        marketOpportunity: Math.floor(Math.random() * 50) + 25,
        complianceScore: Math.floor(Math.random() * 20) + 80
    };
}

function generateVisualizations(reportType) {
    return {
        charts: ['impact_trend', 'roi_analysis', 'risk_matrix'],
        dashboards: ['performance_overview', 'competitive_positioning'],
        infographics: ['key_insights', 'recommendations_summary']
    };
}

function generateRecommendedActions(reportType, profile) {
    return [
        `Enhance ${profile.focusAreas} initiatives through strategic partnerships`,
        'Implement advanced impact measurement frameworks',
        'Develop comprehensive stakeholder engagement strategy',
        'Optimize resource allocation for maximum ROI',
        'Establish regular monitoring and evaluation processes'
    ];
}

function generateDataSources(reportType) {
    return [
        'UN Sustainable Development Goals Database',
        'World Bank ESG Indicators',
        'Industry-specific impact benchmarks',
        'Regulatory compliance frameworks',
        'Market intelligence reports'
    ];
}

async function verifyPayment(paymentToken) {
    // Mock payment verification
    // In production, integrate with Paystack API
    return paymentToken && paymentToken.length > 10;
}

// ================================
// HEALTH CHECK
// ================================

app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        message: 'Auxeira ESG Dashboard Backend is running!',
        timestamp: new Date().toISOString(),
        version: '2.0'
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
        console.log(`🚀 Auxeira ESG Dashboard Backend running on port ${port}`);
        console.log(`📊 Health check: http://localhost:${port}/health`);
        console.log(`🔗 API Base URL: http://localhost:${port}/api`);
    });
}

module.exports = app;
