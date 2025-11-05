/**
 * Auxeira Metrics Collection Lambda
 * Handles submission and retrieval of startup metrics
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Table names
const METRICS_TABLE = 'auxeira-metrics-history';
const PROFILES_TABLE = 'auxeira-startup-profiles-prod';
const ACTIVITIES_TABLE = 'auxeira-startup-activities-prod';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
    console.log('Metrics Collection API Request:', JSON.stringify(event, null, 2));

    // Headers - NO CORS headers (Lambda Function URL handles CORS)
    const headers = {
        'Content-Type': 'application/json'
    };

    const method = event.requestContext?.http?.method || event.httpMethod;

    try {
        // Verify authentication
        const user = await verifyToken(event);
        if (!user) {
            return response(401, { success: false, error: 'Unauthorized' }, headers);
        }

        console.log('Authenticated user:', user.email, 'Role:', user.role);

        if (method === 'POST') {
            return await submitMetrics(event, user, headers);
        } else if (method === 'GET') {
            return await getMetricsHistory(event, user, headers);
        }

        return response(405, { success: false, error: 'Method not allowed' }, headers);

    } catch (error) {
        console.error('Metrics API Error:', error);
        return response(500, {
            success: false,
            error: 'Internal server error',
            message: error.message
        }, headers);
    }
};

/**
 * Submit metrics
 */
async function submitMetrics(event, user, headers) {
    const body = JSON.parse(event.body || '{}');

    const {
        startupId,
        
        // Financial metrics
        revenue,
        mrr,
        arr,
        expenses,
        burnRate,
        cashBalance,
        runway,
        
        // User metrics
        totalUsers,
        activeUsers,
        newUsers,
        churnedUsers,
        
        // Customer metrics
        customers,
        newCustomers,
        churnRate,
        
        // Engagement metrics
        dailyActiveUsers,
        weeklyActiveUsers,
        monthlyActiveUsers,
        avgSessionDuration,
        
        // Marketing metrics
        marketingSpend,
        salesSpend,
        cac,
        ltv,
        
        // Product metrics
        featureAdoption,
        bugReports,
        
        // Notes
        notes
        
    } = body;

    // Validation
    if (!startupId) {
        return response(400, { success: false, error: 'startupId is required' }, headers);
    }

    const timestamp = new Date().toISOString();
    const metricId = crypto.randomUUID();

    // Calculate derived metrics
    const profit = (revenue || 0) - (expenses || 0);
    const ltvCacRatio = (ltv && cac && cac > 0) ? (ltv / cac).toFixed(2) : null;

    // Store in metrics history table
    await docClient.send(new PutCommand({
        TableName: METRICS_TABLE,
        Item: {
            metricId,
            startupId,
            timestamp,
            recordType: 'monthly',
            source: 'manual_submission',
            
            // Financial
            revenue: revenue || 0,
            mrr: mrr || revenue || 0,
            arr: arr || (mrr * 12) || 0,
            expenses: expenses || 0,
            profit,
            burnRate: burnRate || expenses || 0,
            cashBalance: cashBalance || 0,
            runway: runway || 0,
            
            // Users
            totalUsers: totalUsers || 0,
            activeUsers: activeUsers || 0,
            newUsers: newUsers || 0,
            churnedUsers: churnedUsers || 0,
            
            // Customers
            customers: customers || 0,
            newCustomers: newCustomers || 0,
            churnRate: churnRate || 0,
            
            // Engagement
            dailyActiveUsers: dailyActiveUsers || 0,
            weeklyActiveUsers: weeklyActiveUsers || 0,
            monthlyActiveUsers: monthlyActiveUsers || 0,
            avgSessionDuration: avgSessionDuration || 0,
            
            // Marketing
            marketingSpend: marketingSpend || 0,
            salesSpend: salesSpend || 0,
            cac: cac || 0,
            ltv: ltv || 0,
            ltvCacRatio,
            
            // Product
            featureAdoption: featureAdoption || {},
            bugReports: bugReports || 0,
            
            // Metadata
            submittedBy: user.userId,
            submittedAt: timestamp,
            notes: notes || null,
            
            // TTL: 2 years
            ttl: Math.floor(Date.now() / 1000) + (2 * 365 * 24 * 60 * 60)
        }
    }));

    // Update startup profile with latest values
    await docClient.send(new UpdateCommand({
        TableName: PROFILES_TABLE,
        Key: { startupId },
        UpdateExpression: `
            SET currentRevenue = :revenue,
                mrr = :mrr,
                currentUsers = :users,
                cashBalance = :cash,
                monthlyBurnRate = :burn,
                runwayMonths = :runway,
                lastMetricsUpdate = :timestamp
        `,
        ExpressionAttributeValues: {
            ':revenue': mrr || revenue || 0,
            ':mrr': mrr || revenue || 0,
            ':users': totalUsers || 0,
            ':cash': cashBalance || 0,
            ':burn': burnRate || expenses || 0,
            ':runway': runway || 0,
            ':timestamp': timestamp
        }
    }));

    // Log activity
    await docClient.send(new PutCommand({
        TableName: ACTIVITIES_TABLE,
        Item: {
            activityId: crypto.randomUUID(),
            startupId,
            userId: user.userId,
            activityType: 'metrics_submitted',
            timestamp,
            metadata: {
                mrr,
                users: totalUsers,
                customers
            }
        }
    }));

    console.log('✅ Metrics submitted:', metricId);

    return response(201, {
        success: true,
        metricId,
        message: 'Metrics submitted successfully'
    }, headers);
}

/**
 * Get metrics history
 */
async function getMetricsHistory(event, user, headers) {
    const params = event.queryStringParameters || {};
    const startupId = params.startupId;
    const period = params.period || '6m';

    if (!startupId) {
        return response(400, { success: false, error: 'startupId is required' }, headers);
    }

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (period) {
        case '1m':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '3m':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case '6m':
            startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
            break;
        case '1y':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date('2020-01-01');
    }

    // Query metrics history
    const result = await docClient.send(new QueryCommand({
        TableName: METRICS_TABLE,
        KeyConditionExpression: 'startupId = :startupId AND #ts >= :startDate',
        ExpressionAttributeNames: {
            '#ts': 'timestamp'
        },
        ExpressionAttributeValues: {
            ':startupId': startupId,
            ':startDate': startDate.toISOString()
        },
        ScanIndexForward: true
    }));

    const metrics = result.Items || [];

    // Calculate growth rates
    const metricsWithGrowth = metrics.map((metric, index) => {
        if (index === 0) return { ...metric, revenueGrowth: 0, userGrowth: 0 };

        const prev = metrics[index - 1];

        const revenueGrowth = prev.mrr > 0 
            ? ((metric.mrr - prev.mrr) / prev.mrr * 100).toFixed(2)
            : 0;

        const userGrowth = prev.totalUsers > 0
            ? ((metric.totalUsers - prev.totalUsers) / prev.totalUsers * 100).toFixed(2)
            : 0;

        return {
            ...metric,
            revenueGrowth: parseFloat(revenueGrowth),
            userGrowth: parseFloat(userGrowth)
        };
    });

    return response(200, {
        success: true,
        startupId,
        period,
        count: metrics.length,
        metrics: metricsWithGrowth
    }, headers);
}

/**
 * Verify JWT token
 */
async function verifyToken(event) {
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    
    if (!authHeader) {
        console.log('No Authorization header');
        return null;
    }

    const token = authHeader.replace('Bearer ', '').trim();

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return null;
    }
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
