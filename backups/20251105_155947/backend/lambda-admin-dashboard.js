/**
 * Auxeira Admin Dashboard API
 * Provides aggregated data for admin monitoring and management
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const jwt = require('jsonwebtoken');

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Table names
const USERS_TABLE = 'auxeira-backend-users-prod';
const STARTUP_PROFILES_TABLE = 'auxeira-startup-profiles-prod';
const STARTUP_ACTIVITIES_TABLE = 'auxeira-startup-activities-prod';
const USER_STARTUP_MAPPING_TABLE = 'auxeira-user-startup-mapping-prod';
const SUBSCRIPTIONS_TABLE = 'auxeira-subscriptions';
const SESSIONS_TABLE = 'auxeira-backend-sessions-prod';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
    console.log('Admin Dashboard API Request:', JSON.stringify(event, null, 2));

    // Headers - NO CORS headers (Lambda Function URL handles CORS automatically)
    const headers = {
        'Content-Type': 'application/json'
    };

    // Lambda Function URL handles OPTIONS preflight automatically
    // No need to handle it manually

    try {
        // Verify admin authentication
        const authHeader = event.headers?.authorization || event.headers?.Authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return response(401, { error: 'Unauthorized - No token provided' }, headers);
        }

        const token = authHeader.substring(7);
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            console.error('JWT verification failed:', err);
            return response(401, { error: 'Unauthorized - Invalid token' }, headers);
        }

        // Check if user is admin
        if (decoded.role !== 'admin' && decoded.role !== 'founder' && decoded.role !== 'startup_founder') {
            console.error('Unauthorized access attempt by non-admin user:', decoded.email, 'Role:', decoded.role);
            return response(403, { error: 'Forbidden - Admin access required' }, headers);
        }
        
        // Log admin access
        console.log('Admin dashboard accessed by:', decoded.email, 'Role:', decoded.role);

        // Get query parameters
        const queryParams = event.queryStringParameters || {};
        const action = queryParams.action || 'overview';

        // Route to appropriate handler
        let data;
        switch (action) {
            case 'overview':
                data = await getOverviewData();
                break;
            case 'users':
                data = await getUsersData(queryParams);
                break;
            case 'startups':
                data = await getStartupsData(queryParams);
                break;
            case 'activities':
                data = await getActivitiesData(queryParams);
                break;
            case 'analytics':
                data = await getAnalyticsData();
                break;
            default:
                return response(400, { error: 'Invalid action parameter' }, headers);
        }

        return response(200, {
            success: true,
            data,
            timestamp: new Date().toISOString()
        }, headers);

    } catch (error) {
        console.error('Admin Dashboard API Error:', error);
        return response(500, {
            success: false,
            error: 'Internal server error',
            message: error.message
        }, headers);
    }
};

/**
 * Get overview statistics
 */
async function getOverviewData() {
    console.log('Fetching overview data...');

    // Fetch data from multiple tables in parallel
    const [usersResult, startupsResult, activitiesResult, sessionsResult] = await Promise.all([
        docClient.send(new ScanCommand({ TableName: USERS_TABLE, Select: 'COUNT' })),
        docClient.send(new ScanCommand({ TableName: STARTUP_PROFILES_TABLE, Select: 'COUNT' })),
        docClient.send(new ScanCommand({ TableName: STARTUP_ACTIVITIES_TABLE, Select: 'COUNT' })),
        docClient.send(new ScanCommand({ TableName: SESSIONS_TABLE, Select: 'COUNT' }))
    ]);

    // Get detailed user data for active users calculation
    const usersData = await docClient.send(new ScanCommand({
        TableName: USERS_TABLE,
        ProjectionExpression: 'email, #status, lastLoginAt, createdAt, #role',
        ExpressionAttributeNames: {
            '#status': 'status',
            '#role': 'role'
        }
    }));

    // Calculate active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = usersData.Items.filter(user => {
        if (!user.lastLoginAt) return false;
        const lastLogin = new Date(user.lastLoginAt);
        return lastLogin > thirtyDaysAgo;
    }).length;

    // Calculate user growth (users created in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersThisWeek = usersData.Items.filter(user => {
        if (!user.createdAt) return false;
        const created = new Date(user.createdAt);
        return created > sevenDaysAgo;
    }).length;

    // Calculate growth percentage
    const totalUsers = usersData.Items.length;
    const userGrowthPercent = totalUsers > 0 ? ((newUsersThisWeek / totalUsers) * 100).toFixed(1) : 0;

    // Get startup data for additional metrics
    const startupsData = await docClient.send(new ScanCommand({
        TableName: STARTUP_PROFILES_TABLE,
        ProjectionExpression: 'startupId, startupName, createdAt, stage, revenue'
    }));

    // Calculate startups created this month
    const thirtyDaysAgoDate = new Date();
    thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
    const newStartupsThisMonth = startupsData.Items.filter(startup => {
        if (!startup.createdAt) return false;
        const created = new Date(startup.createdAt);
        return created > thirtyDaysAgoDate;
    }).length;

    // Calculate total revenue (mock for now - would come from subscriptions table)
    const totalRevenue = startupsData.Items.reduce((sum, startup) => {
        return sum + (startup.revenue || 0);
    }, 0);

    // User type distribution
    const userTypeDistribution = {};
    usersData.Items.forEach(user => {
        const role = user.role || 'unknown';
        userTypeDistribution[role] = (userTypeDistribution[role] || 0) + 1;
    });

    return {
        overview: {
            totalUsers: totalUsers,
            activeUsers: activeUsers,
            newUsersThisWeek: newUsersThisWeek,
            userGrowthPercent: `+${userGrowthPercent}%`,
            totalStartups: startupsResult.Count,
            newStartupsThisMonth: newStartupsThisMonth,
            totalActivities: activitiesResult.Count,
            activeSessions: sessionsResult.Count,
            totalRevenue: totalRevenue,
            monthlyRevenue: (totalRevenue / 12).toFixed(2), // Mock MRR
            systemUptime: '99.97%', // Mock - would come from CloudWatch
            avgResponseTime: '245ms', // Mock - would come from CloudWatch
            pendingIssues: 0, // Mock - would come from support ticket system
            trialConversions: '34.2%' // Mock - would need subscription data
        },
        userTypeDistribution,
        timestamp: new Date().toISOString()
    };
}

/**
 * Get users data with pagination
 */
async function getUsersData(params) {
    console.log('Fetching users data...');

    const limit = parseInt(params.limit) || 50;
    const lastKey = params.lastKey ? JSON.parse(decodeURIComponent(params.lastKey)) : undefined;

    const scanParams = {
        TableName: USERS_TABLE,
        Limit: limit
    };

    if (lastKey) {
        scanParams.ExclusiveStartKey = lastKey;
    }

    const result = await docClient.send(new ScanCommand(scanParams));

    // Remove sensitive data
    const users = result.Items.map(user => ({
        id: user.id || user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        loginCount: user.loginCount || 0
    }));

    return {
        users,
        count: users.length,
        lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null
    };
}

/**
 * Get startups data with pagination
 */
async function getStartupsData(params) {
    console.log('Fetching startups data...');

    const limit = parseInt(params.limit) || 50;
    const lastKey = params.lastKey ? JSON.parse(decodeURIComponent(params.lastKey)) : undefined;

    const scanParams = {
        TableName: STARTUP_PROFILES_TABLE,
        Limit: limit
    };

    if (lastKey) {
        scanParams.ExclusiveStartKey = lastKey;
    }

    const result = await docClient.send(new ScanCommand(scanParams));

    const startups = result.Items.map(startup => ({
        startupId: startup.startupId,
        startupName: startup.startupName,
        industry: startup.industry,
        stage: startup.stage,
        sseScore: startup.sseScore,
        revenue: startup.revenue,
        mrr: startup.mrr,
        customers: startup.customers,
        teamSize: startup.teamSize,
        createdAt: startup.createdAt,
        geography: startup.geography
    }));

    return {
        startups,
        count: startups.length,
        lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null
    };
}

/**
 * Get recent activities
 */
async function getActivitiesData(params) {
    console.log('Fetching activities data...');

    const limit = parseInt(params.limit) || 20;

    const result = await docClient.send(new ScanCommand({
        TableName: STARTUP_ACTIVITIES_TABLE,
        Limit: limit
    }));

    const activities = result.Items.map(activity => ({
        activityId: activity.activityId,
        startupId: activity.startupId,
        activityType: activity.activityType,
        description: activity.description,
        timestamp: activity.timestamp,
        status: activity.status,
        metadata: activity.metadata
    }));

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
        activities,
        count: activities.length
    };
}

/**
 * Get analytics data for charts
 */
async function getAnalyticsData() {
    console.log('Fetching analytics data...');

    // Get all users for time-series analysis
    const usersData = await docClient.send(new ScanCommand({
        TableName: USERS_TABLE,
        ProjectionExpression: 'email, createdAt, lastLoginAt, #role',
        ExpressionAttributeNames: {
            '#role': 'role'
        }
    }));

    // Get all startups for time-series analysis
    const startupsData = await docClient.send(new ScanCommand({
        TableName: STARTUP_PROFILES_TABLE,
        ProjectionExpression: 'startupId, createdAt, revenue, stage'
    }));

    // Generate time-series data for last 30 days
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last30Days.push(date.toISOString().split('T')[0]);
    }

    // User registration trend
    const userRegistrationTrend = last30Days.map(date => {
        const count = usersData.Items.filter(user => {
            if (!user.createdAt) return false;
            return user.createdAt.startsWith(date);
        }).length;
        return { date, count };
    });

    // Revenue trend (mock - would come from actual transaction data)
    const revenueTrend = last30Days.map(date => {
        const revenue = Math.floor(Math.random() * 20000) + 10000; // Mock data
        return { date, revenue };
    });

    // User type distribution
    const userTypeDistribution = {};
    usersData.Items.forEach(user => {
        const role = user.role || 'unknown';
        userTypeDistribution[role] = (userTypeDistribution[role] || 0) + 1;
    });

    // Startup stage distribution
    const stageDistribution = {};
    startupsData.Items.forEach(startup => {
        const stage = startup.stage || 'unknown';
        stageDistribution[stage] = (stageDistribution[stage] || 0) + 1;
    });

    return {
        userRegistrationTrend,
        revenueTrend,
        userTypeDistribution,
        stageDistribution,
        totalUsers: usersData.Items.length,
        totalStartups: startupsData.Items.length
    };
}

/**
 * Helper function to create response
 */
function response(statusCode, body, headers) {
    return {
        statusCode,
        headers,
        body: JSON.stringify(body)
    };
}
