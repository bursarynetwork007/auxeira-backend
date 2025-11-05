/**
 * Dashboard Context Lambda Function
 * Returns lightweight context for AI agents and dashboard initialization
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'auxeira-users-prod';
const MAPPING_TABLE = 'auxeira-user-startup-mapping-prod';
const PROFILES_TABLE = 'auxeira-startup-profiles-prod';
const ACTIVITIES_TABLE = 'auxeira-startup-activities-prod';

/**
 * Extract userId from JWT token
 */
function extractUserIdFromToken(token) {
    try {
        // Simple JWT decode (payload is base64 encoded)
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        return payload.userId || payload.sub;
    } catch (error) {
        console.error('Error extracting userId from token:', error);
        return null;
    }
}

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
    const thresholdTimestamp = dateThreshold.toISOString(); // Use ISO string format
    
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
                ':threshold': thresholdTimestamp // Now a string
            },
            Limit: 10,
            ScanIndexForward: false
        }));
        
        return result.Items || [];
    } catch (error) {
        console.error('Error getting activities:', error);
        return [];
    }
}

/**
 * Build recent milestones
 */
function buildRecentMilestones(startup, activities) {
    const milestones = [];
    const mrr = startup.currentRevenue || startup.mrr || 0;
    const growthRate = startup.monthlyGrowthRate || startup.growthRate || 0;
    const customers = Math.floor((startup.currentUsers || 0) * 0.4);
    
    if (mrr > 10000) {
        milestones.push(`Achieved $${(mrr / 1000).toFixed(1)}K MRR`);
    }
    
    if (growthRate > 15) {
        milestones.push(`${growthRate}% monthly growth rate`);
    }
    
    if (customers > 1000) {
        milestones.push(`Reached ${customers.toLocaleString()} customers`);
    }
    
    if (activities.length > 5) {
        milestones.push(`Completed ${activities.length} activities this month`);
    }
    
    return milestones.slice(0, 3);
}

/**
 * Build active challenges
 */
function buildActiveChallenges(startup) {
    const challenges = [];
    const churnRate = 2.3; // Default
    const runwayMonths = startup.runwayMonths || 0;
    const growthRate = startup.monthlyGrowthRate || startup.growthRate || 0;
    const activitiesCompleted = startup.totalActivitiesCompleted || 0;
    
    if (churnRate > 2.0) {
        challenges.push(`Churn rate above SaaS benchmark (${churnRate}% vs 1-2%)`);
    }
    
    if (runwayMonths < 12) {
        challenges.push(`Limited runway (${runwayMonths} months remaining)`);
    }
    
    if (growthRate < 10) {
        challenges.push(`Growth rate below target (${growthRate}% vs 15%+ target)`);
    }
    
    if (activitiesCompleted < 10) {
        challenges.push('Need to complete more activities to improve SSE score');
    }
    
    return challenges.slice(0, 3);
}

/**
 * Lambda handler
 */
exports.handler = async (event) => {
    console.log('Dashboard Context Lambda invoked:', JSON.stringify(event, null, 2));
    
    // Don't set CORS headers - Lambda Function URL handles them
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
        // Extract userId from Authorization header or query params (for testing)
        let userId = null;
        
        // Try query params first (for testing)
        if (event.queryStringParameters?.userId) {
            userId = event.queryStringParameters.userId;
            console.log('Using userId from query params:', userId);
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
            userId = extractUserIdFromToken(token);
            
            if (!userId) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Invalid token'
                    })
                };
            }
        }
        
        console.log('Loading data for userId:', userId);
        
        // Get user profile
        const user = await getUserProfile(userId);
        
        // Get startup mapping
        const mapping = await getStartupMapping(userId);
        
        // Get startup profile
        const startup = await getStartupProfile(mapping.startupId);
        
        // Get recent activities
        const activities = await getRecentActivities(mapping.startupId, 30);
        
        // Build context
        const mrr = startup.currentRevenue || startup.mrr || 0;
        const growthRate = startup.monthlyGrowthRate || startup.growthRate || 0;
        const sseScore = startup.currentSSIScore || startup.currentESGScore || startup.sseScore || 0;
        const customers = Math.floor((startup.currentUsers || 0) * 0.4);
        
        const context = {
            startupName: startup.companyName,
            sseScore: sseScore,
            stage: startup.fundingStage,
            industry: startup.industry || startup.sector,
            geography: startup.region || 'United States',
            teamSize: startup.teamSize || 0,
            runway: startup.runwayMonths || 0,
            mrr: mrr,
            mrrGrowth: `+${growthRate}%`,
            users: startup.currentUsers || 0,
            customers: customers,
            cac: 127, // Default - should be calculated
            ltv: 1890, // Default - should be calculated
            churnRate: 2.3, // Default - should be calculated
            nps: startup.sentimentScore || 68,
            interviewsCompleted: activities.filter(a => 
                a.activityType === 'customer_interview'
            ).length,
            projectionsAge: '30 days old',
            recentMilestones: buildRecentMilestones(startup, activities),
            activeChallenges: buildActiveChallenges(startup)
        };
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: context
            })
        };
        
    } catch (error) {
        console.error('Error loading dashboard context:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to load dashboard context',
                message: error.message
            })
        };
    }
};
