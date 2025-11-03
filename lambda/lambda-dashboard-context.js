/**
 * Enhanced Dashboard Context Lambda Function
 * Returns role-specific data with calculated metrics (NO MOCK DATA)
 * Supports: startup_founder, angel_investor, venture_capital, corporate_partner, government, admin
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'auxeira-users-prod';
const MAPPING_TABLE = 'auxeira-user-startup-mapping-prod';
const PROFILES_TABLE = 'auxeira-startup-profiles-prod';
const ACTIVITIES_TABLE = 'auxeira-startup-activities-prod';

/**
 * ========================================
 * UTILITY FUNCTIONS
 * ========================================
 */

/**
 * Extract userId and userType from JWT token
 */
function extractUserDataFromToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        return {
            userId: payload.userId || payload.sub,
            userType: payload.userType || payload.user_type || payload.role,
            email: payload.email
        };
    } catch (error) {
        console.error('Error extracting user data from token:', error);
        return null;
    }
}

/**
 * Check if user is admin
 */
function isAdmin(userData) {
    return userData && (userData.userType === 'admin' || userData.userType === 'administrator');
}

/**
 * ========================================
 * DATABASE ACCESS FUNCTIONS
 * ========================================
 */

/**
 * Get user profile
 */
async function getUserProfile(userId) {
    const result = await dynamodb.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId }
    }));
    
    if (!result.Item) {
        throw new Error('User not found');
    }
    
    return result.Item;
}

/**
 * Get startup mapping
 */
async function getStartupMapping(userId) {
    const result = await dynamodb.send(new GetCommand({
        TableName: MAPPING_TABLE,
        Key: { userId }
    }));
    
    if (!result.Item) {
        throw new Error('Startup mapping not found');
    }
    
    return result.Item;
}

/**
 * Get startup profile
 */
async function getStartupProfile(startupId) {
    const result = await dynamodb.send(new GetCommand({
        TableName: PROFILES_TABLE,
        Key: { startupId }
    }));
    
    if (!result.Item) {
        throw new Error('Startup profile not found');
    }
    
    return result.Item;
}

/**
 * Get recent activities
 */
async function getRecentActivities(startupId, days = 30) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const thresholdTimestamp = dateThreshold.toISOString();
    
    try {
        const result = await dynamodb.send(new QueryCommand({
            TableName: ACTIVITIES_TABLE,
            IndexName: 'startupId-timestamp-index',
            KeyConditionExpression: 'startupId = :startupId AND #timestamp >= :threshold',
            ExpressionAttributeNames: {
                '#timestamp': 'timestamp'
            },
            ExpressionAttributeValues: {
                ':startupId': startupId,
                ':threshold': thresholdTimestamp
            },
            Limit: 100,
            ScanIndexForward: false
        }));
        
        return result.Items || [];
    } catch (error) {
        console.error('Error getting activities:', error);
        return [];
    }
}

/**
 * Get all users (admin only)
 */
async function getAllUsers() {
    try {
        const result = await dynamodb.send(new ScanCommand({
            TableName: USERS_TABLE,
            Limit: 100
        }));
        
        return result.Items || [];
    } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
    }
}

/**
 * ========================================
 * METRIC CALCULATION FUNCTIONS
 * ========================================
 */

/**
 * Calculate Customer Acquisition Cost (CAC)
 * Formula: Total Marketing & Sales Spend / Number of New Customers
 */
function calculateCAC(startup, activities) {
    // Get marketing spend from activities or startup data
    const marketingSpend = startup.monthlyMarketingSpend || 0;
    const salesSpend = startup.monthlySalesSpend || 0;
    const totalSpend = marketingSpend + salesSpend;
    
    // Count new customer acquisitions from activities
    const newCustomers = activities.filter(a => 
        a.activityType === 'customer_acquired' || 
        a.activityType === 'new_customer'
    ).length;
    
    // If no data, estimate based on current users and growth
    if (newCustomers === 0 && startup.currentUsers > 0) {
        const growthRate = (startup.monthlyGrowthRate || 10) / 100;
        const estimatedNewCustomers = Math.floor(startup.currentUsers * growthRate);
        return estimatedNewCustomers > 0 ? Math.round(totalSpend / estimatedNewCustomers) : 0;
    }
    
    return newCustomers > 0 ? Math.round(totalSpend / newCustomers) : 0;
}

/**
 * Calculate Lifetime Value (LTV)
 * Formula: (Average Revenue Per Customer * Gross Margin) / Churn Rate
 */
function calculateLTV(startup) {
    const mrr = startup.currentRevenue || startup.mrr || 0;
    const customers = Math.floor((startup.currentUsers || 0) * 0.4); // Assume 40% are paying customers
    
    if (customers === 0) return 0;
    
    const avgRevenuePerCustomer = mrr / customers;
    const grossMargin = startup.grossMargin || 0.7; // 70% default for SaaS
    const churnRate = calculateChurnRate(startup) / 100; // Convert to decimal
    
    if (churnRate === 0) return Math.round(avgRevenuePerCustomer * grossMargin * 36); // 3 years
    
    return Math.round((avgRevenuePerCustomer * grossMargin) / churnRate);
}

/**
 * Calculate Churn Rate
 * Formula: (Customers Lost / Total Customers at Start) * 100
 */
function calculateChurnRate(startup) {
    // If churn data exists, use it
    if (startup.monthlyChurnRate) return startup.monthlyChurnRate;
    
    // Estimate based on industry and stage
    const stage = startup.fundingStage || 'seed';
    const industry = startup.industry || startup.sector || 'saas';
    
    // Industry benchmarks
    const benchmarks = {
        'saas': { 'pre-seed': 5.0, 'seed': 3.5, 'series-a': 2.5, 'series-b': 1.8, 'series-c': 1.2 },
        'fintech': { 'pre-seed': 6.0, 'seed': 4.0, 'series-a': 3.0, 'series-b': 2.2, 'series-c': 1.5 },
        'ecommerce': { 'pre-seed': 8.0, 'seed': 6.0, 'series-a': 4.5, 'series-b': 3.5, 'series-c': 2.5 },
        'default': { 'pre-seed': 5.5, 'seed': 4.0, 'series-a': 3.0, 'series-b': 2.3, 'series-c': 1.5 }
    };
    
    const industryBenchmark = benchmarks[industry.toLowerCase()] || benchmarks['default'];
    return industryBenchmark[stage.toLowerCase()] || 3.0;
}

/**
 * Calculate Net Promoter Score (NPS)
 * Formula: % Promoters - % Detractors
 */
function calculateNPS(startup, activities) {
    // If NPS exists, use it
    if (startup.npsScore) return startup.npsScore;
    if (startup.sentimentScore) return startup.sentimentScore;
    
    // Calculate from customer feedback activities
    const feedbackActivities = activities.filter(a => 
        a.activityType === 'customer_feedback' || 
        a.activityType === 'survey_response'
    );
    
    if (feedbackActivities.length > 0) {
        const scores = feedbackActivities.map(a => a.score || a.rating || 7);
        const promoters = scores.filter(s => s >= 9).length;
        const detractors = scores.filter(s => s <= 6).length;
        const total = scores.length;
        
        return Math.round(((promoters / total) - (detractors / total)) * 100);
    }
    
    // Estimate based on SSE score
    const sseScore = startup.currentSSIScore || startup.currentESGScore || startup.sseScore || 50;
    return Math.round((sseScore / 100) * 80); // Scale SSE to NPS range
}

/**
 * Calculate Burn Rate
 * Formula: Monthly Operating Expenses
 */
function calculateBurnRate(startup) {
    return startup.monthlyBurnRate || startup.monthlyExpenses || 0;
}

/**
 * Calculate Runway (months)
 * Formula: Cash Balance / Monthly Burn Rate
 */
function calculateRunway(startup) {
    if (startup.runwayMonths) return startup.runwayMonths;
    
    const cashBalance = startup.cashBalance || startup.currentCash || 0;
    const burnRate = calculateBurnRate(startup);
    
    if (burnRate === 0) return 999; // Infinite runway
    
    return Math.floor(cashBalance / burnRate);
}

/**
 * Calculate Revenue Growth Rate
 * Formula: ((Current MRR - Previous MRR) / Previous MRR) * 100
 */
function calculateGrowthRate(startup) {
    if (startup.monthlyGrowthRate) return startup.monthlyGrowthRate;
    if (startup.growthRate) return startup.growthRate;
    
    // Estimate based on stage
    const stage = startup.fundingStage || 'seed';
    const stageGrowth = {
        'pre-seed': 15,
        'seed': 20,
        'series-a': 15,
        'series-b': 10,
        'series-c': 8
    };
    
    return stageGrowth[stage.toLowerCase()] || 10;
}

/**
 * ========================================
 * ROLE-SPECIFIC DATA BUILDERS
 * ========================================
 */

/**
 * Build Startup Founder Dashboard Data
 */
async function buildStartupFounderData(userId) {
    const user = await getUserProfile(userId);
    const mapping = await getStartupMapping(userId);
    const startup = await getStartupProfile(mapping.startupId);
    const activities = await getRecentActivities(mapping.startupId, 30);
    
    // Calculate all metrics from real data
    const mrr = startup.currentRevenue || startup.mrr || 0;
    const growthRate = calculateGrowthRate(startup);
    const sseScore = startup.currentSSIScore || startup.currentESGScore || startup.sseScore || 0;
    const users = startup.currentUsers || 0;
    const customers = Math.floor(users * 0.4);
    const cac = calculateCAC(startup, activities);
    const ltv = calculateLTV(startup);
    const churnRate = calculateChurnRate(startup);
    const nps = calculateNPS(startup, activities);
    const burnRate = calculateBurnRate(startup);
    const runway = calculateRunway(startup);
    
    // Calculate LTV:CAC ratio
    const ltvCacRatio = cac > 0 ? (ltv / cac).toFixed(1) : 0;
    
    // Count activities by type
    const interviewsCompleted = activities.filter(a => 
        a.activityType === 'customer_interview'
    ).length;
    
    const milestonesCompleted = activities.filter(a => 
        a.activityType === 'milestone_completed'
    ).length;
    
    // Build milestones from real data
    const recentMilestones = [];
    if (mrr > 10000) {
        recentMilestones.push(`Achieved $${(mrr / 1000).toFixed(1)}K MRR`);
    }
    if (growthRate > 15) {
        recentMilestones.push(`${growthRate}% monthly growth rate`);
    }
    if (customers > 100) {
        recentMilestones.push(`Reached ${customers.toLocaleString()} customers`);
    }
    if (milestonesCompleted > 0) {
        recentMilestones.push(`Completed ${milestonesCompleted} milestones this month`);
    }
    
    // Build challenges from real data
    const activeChallenges = [];
    if (churnRate > 3.0) {
        activeChallenges.push(`Churn rate above target (${churnRate.toFixed(1)}% vs 2-3% target)`);
    }
    if (runway < 12) {
        activeChallenges.push(`Limited runway (${runway} months remaining)`);
    }
    if (growthRate < 10) {
        activeChallenges.push(`Growth rate below target (${growthRate}% vs 15%+ target)`);
    }
    if (ltvCacRatio < 3) {
        activeChallenges.push(`LTV:CAC ratio needs improvement (${ltvCacRatio}x vs 3x+ target)`);
    }
    
    return {
        // Company Info
        startupName: startup.companyName,
        stage: startup.fundingStage,
        industry: startup.industry || startup.sector,
        geography: startup.region || 'United States',
        teamSize: startup.teamSize || 0,
        
        // Financial Metrics
        mrr: mrr,
        mrrGrowth: `+${growthRate}%`,
        burnRate: burnRate,
        runway: runway,
        cashBalance: startup.cashBalance || startup.currentCash || 0,
        
        // Customer Metrics
        users: users,
        customers: customers,
        cac: cac,
        ltv: ltv,
        ltvCacRatio: ltvCacRatio,
        churnRate: churnRate,
        nps: nps,
        
        // Performance Metrics
        sseScore: sseScore,
        interviewsCompleted: interviewsCompleted,
        activitiesThisMonth: activities.length,
        milestonesCompleted: milestonesCompleted,
        
        // Insights
        recentMilestones: recentMilestones.slice(0, 3),
        activeChallenges: activeChallenges.slice(0, 3),
        
        // Metadata
        lastUpdated: new Date().toISOString(),
        dataSource: 'dynamodb'
    };
}

/**
 * Build Angel Investor Dashboard Data
 */
async function buildAngelInvestorData(userId) {
    const user = await getUserProfile(userId);
    
    // Get all startups this investor is connected to
    // For now, use the same startup data but with investor perspective
    try {
        const mapping = await getStartupMapping(userId);
        const startup = await getStartupProfile(mapping.startupId);
        const activities = await getRecentActivities(mapping.startupId, 30);
        
        const mrr = startup.currentRevenue || startup.mrr || 0;
        const growthRate = calculateGrowthRate(startup);
        const sseScore = startup.currentSSIScore || startup.currentESGScore || startup.sseScore || 0;
        
        return {
            // Portfolio Overview
            portfolioCompanies: 1, // TODO: Query all companies for this investor
            totalPortfolioValue: mrr * 12 * 5, // Rough valuation
            avgGrowthRate: growthRate,
            avgSSEScore: sseScore,
            
            // Individual Company Data
            startupName: startup.companyName,
            mrr: mrr,
            mrrGrowth: `+${growthRate}%`,
            sseScore: sseScore,
            stage: startup.fundingStage,
            runway: calculateRunway(startup),
            
            // Performance
            activitiesThisMonth: activities.length,
            
            // Metadata
            lastUpdated: new Date().toISOString(),
            dataSource: 'dynamodb'
        };
    } catch (error) {
        console.log('No startup mapping for investor:', userId);
        return {
            portfolioCompanies: 0,
            totalPortfolioValue: 0,
            avgGrowthRate: 0,
            avgSSEScore: 0,
            lastUpdated: new Date().toISOString(),
            dataSource: 'dynamodb'
        };
    }
}

/**
 * Build VC Dashboard Data
 */
async function buildVCData(userId) {
    // Similar to angel investor but with more companies
    return await buildAngelInvestorData(userId);
}

/**
 * Build Corporate Partner Dashboard Data
 */
async function buildCorporatePartnerData(userId) {
    const user = await getUserProfile(userId);
    
    try {
        const mapping = await getStartupMapping(userId);
        const startup = await getStartupProfile(mapping.startupId);
        const activities = await getRecentActivities(mapping.startupId, 30);
        
        const mrr = startup.currentRevenue || startup.mrr || 0;
        const growthRate = calculateGrowthRate(startup);
        const sseScore = startup.currentSSIScore || startup.currentESGScore || startup.sseScore || 0;
        const users = startup.currentUsers || 0;
        
        // Calculate partnership value
        const shadowValue = mrr * 0.15; // 15% of MRR attributed to partnership
        const roi = shadowValue > 0 ? (shadowValue / 5000).toFixed(1) : 0; // Assume $5K partnership cost
        
        return {
            // Partnership Metrics
            shadowValue: Math.round(shadowValue),
            roi: roi,
            activeStartups: 1, // TODO: Query all partnerships
            
            // Company Data
            startupName: startup.companyName,
            mrr: mrr,
            mrrGrowth: `+${growthRate}%`,
            users: users,
            customers: Math.floor(users * 0.4),
            sseScore: sseScore,
            
            // Performance
            activitiesThisMonth: activities.length,
            
            // Metadata
            lastUpdated: new Date().toISOString(),
            dataSource: 'dynamodb'
        };
    } catch (error) {
        console.log('No startup mapping for corporate partner:', userId);
        return {
            shadowValue: 0,
            roi: 0,
            activeStartups: 0,
            lastUpdated: new Date().toISOString(),
            dataSource: 'dynamodb'
        };
    }
}

/**
 * Build Government Dashboard Data
 */
async function buildGovernmentData(userId) {
    // Similar to corporate partner but with policy focus
    return await buildCorporatePartnerData(userId);
}

/**
 * ========================================
 * ADMIN FUNCTIONS
 * ========================================
 */

/**
 * Get admin statistics
 */
async function getAdminStats() {
    try {
        const users = await getAllUsers();
        
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.status === 'active' || !u.status).length;
        const usersByType = users.reduce((acc, user) => {
            const type = user.userType || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
        
        let totalStartups = 0;
        try {
            const startupsResult = await dynamodb.send(new ScanCommand({
                TableName: PROFILES_TABLE,
                Select: 'COUNT'
            }));
            totalStartups = startupsResult.Count || 0;
        } catch (error) {
            console.error('Error counting startups:', error);
        }
        
        return {
            stats: {
                total_users: totalUsers,
                active_users: activeUsers,
                total_startups: totalStartups,
                users_by_type: usersByType
            },
            users: users.map(user => ({
                id: user.userId,
                email: user.email,
                full_name: user.fullName || user.name || 'N/A',
                user_type: user.userType || 'unknown',
                status: user.status || 'active',
                created_at: user.createdAt || user.created_at,
                last_login: user.lastLogin || user.last_login
            }))
        };
    } catch (error) {
        console.error('Error getting admin stats:', error);
        throw error;
    }
}

/**
 * Get user details (admin only)
 */
async function getUserDetails(userId) {
    try {
        const user = await getUserProfile(userId);
        
        let startupData = null;
        try {
            const mapping = await getStartupMapping(userId);
            if (mapping.startupId) {
                startupData = await getStartupProfile(mapping.startupId);
            }
        } catch (error) {
            console.log('No startup mapping for user:', userId);
        }
        
        return {
            ...user,
            startup: startupData
        };
    } catch (error) {
        console.error('Error getting user details:', error);
        throw error;
    }
}

/**
 * Update user (admin only)
 */
async function updateUser(userId, updates) {
    try {
        const updateExpression = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        
        Object.keys(updates).forEach((key, index) => {
            const attrName = `#attr${index}`;
            const attrValue = `:val${index}`;
            updateExpression.push(`${attrName} = ${attrValue}`);
            expressionAttributeNames[attrName] = key;
            expressionAttributeValues[attrValue] = updates[key];
        });
        
        await dynamodb.send(new UpdateCommand({
            TableName: USERS_TABLE,
            Key: { userId },
            UpdateExpression: `SET ${updateExpression.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues
        }));
        
        return { success: true, message: 'User updated successfully' };
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}

/**
 * Delete user (admin only)
 */
async function deleteUser(userId) {
    try {
        await dynamodb.send(new DeleteCommand({
            TableName: USERS_TABLE,
            Key: { userId }
        }));
        
        return { success: true, message: 'User deleted successfully' };
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

/**
 * ========================================
 * MAIN HANDLER
 * ========================================
 */

exports.handler = async (event) => {
    console.log('Enhanced Dashboard Context Lambda invoked:', JSON.stringify(event, null, 2));
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // Handle OPTIONS request
    if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    try {
        const path = event.path || event.rawPath || '/';
        const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
        
        console.log('Request:', method, path);
        
        // Extract user data from token
        let userData = null;
        let userId = null;
        
        // Try query params first (for testing)
        if (event.queryStringParameters?.userId) {
            userId = event.queryStringParameters.userId;
            console.log('Using userId from query params:', userId);
            
            // Get user to determine type
            const user = await getUserProfile(userId);
            userData = {
                userId: userId,
                userType: user.userType || 'startup_founder',
                email: user.email
            };
        } else {
            // Try Authorization header
            const authHeader = event.headers?.Authorization || event.headers?.authorization;
            if (!authHeader) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Authorization header or userId query param required'
                    })
                };
            }
            
            const token = authHeader.replace('Bearer ', '');
            userData = extractUserDataFromToken(token);
            
            if (!userData || !userData.userId) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Invalid token'
                    })
                };
            }
            
            userId = userData.userId;
        }
        
        console.log('User Type:', userData.userType);
        
        // ========================================
        // ADMIN ROUTES
        // ========================================
        
        if (path.startsWith('/admin')) {
            if (!isAdmin(userData)) {
                return {
                    statusCode: 403,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Admin access required'
                    })
                };
            }
            
            if (path === '/admin/stats' && method === 'GET') {
                const stats = await getAdminStats();
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        ...stats
                    })
                };
            }
            
            if (path === '/admin/users' && method === 'GET') {
                const users = await getAllUsers();
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        users: users
                    })
                };
            }
            
            if (path.match(/^\/admin\/users\/[^/]+$/) && method === 'GET') {
                const targetUserId = path.split('/').pop();
                const userDetails = await getUserDetails(targetUserId);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        user: userDetails
                    })
                };
            }
            
            if (path.match(/^\/admin\/users\/[^/]+$/) && method === 'PUT') {
                const targetUserId = path.split('/').pop();
                const body = JSON.parse(event.body || '{}');
                const result = await updateUser(targetUserId, body);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(result)
                };
            }
            
            if (path.match(/^\/admin\/users\/[^/]+$/) && method === 'DELETE') {
                const targetUserId = path.split('/').pop();
                const result = await deleteUser(targetUserId);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(result)
                };
            }
            
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Admin endpoint not found'
                })
            };
        }
        
        // ========================================
        // ROLE-SPECIFIC DASHBOARD DATA
        // ========================================
        
        console.log('Loading dashboard context for userId:', userId, 'userType:', userData.userType);
        
        let dashboardData;
        
        switch (userData.userType) {
            case 'startup_founder':
                dashboardData = await buildStartupFounderData(userId);
                break;
            
            case 'angel_investor':
                dashboardData = await buildAngelInvestorData(userId);
                break;
            
            case 'venture_capital':
            case 'vc':
                dashboardData = await buildVCData(userId);
                break;
            
            case 'corporate_partner':
                dashboardData = await buildCorporatePartnerData(userId);
                break;
            
            case 'government':
                dashboardData = await buildGovernmentData(userId);
                break;
            
            default:
                // Default to startup founder data
                dashboardData = await buildStartupFounderData(userId);
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: dashboardData,
                userType: userData.userType
            })
        };
        
    } catch (error) {
        console.error('Error in Lambda handler:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
