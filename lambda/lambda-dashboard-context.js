/**
 * Dashboard Context Lambda Function
 * Returns lightweight context for AI agents and dashboard initialization
 * Now includes admin endpoints for user management
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
 * Extract userId and userType from JWT token
 */
function extractUserDataFromToken(token) {
    try {
        // Simple JWT decode (payload is base64 encoded)
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
    const churnRate = 2.3;
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
 * ========================================
 * ADMIN ENDPOINTS
 * ========================================
 */

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
 * Get admin statistics
 */
async function getAdminStats() {
    try {
        // Get all users
        const users = await getAllUsers();
        
        // Calculate statistics
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.status === 'active' || !u.status).length;
        const usersByType = users.reduce((acc, user) => {
            const type = user.userType || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
        
        // Get startup profiles count
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
                total_revenue: 2500000, // Placeholder
                system_health: 98.5, // Placeholder
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
 * Get single user details (admin only)
 */
async function getUserDetails(userId) {
    try {
        const user = await getUserProfile(userId);
        
        // Try to get startup mapping if exists
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
        
        // Build update expression
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

/**
 * Lambda handler
 */
exports.handler = async (event) => {
    console.log('Dashboard Context Lambda invoked:', JSON.stringify(event, null, 2));
    
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
        // Extract path
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
        
        // ========================================
        // ADMIN ROUTES
        // ========================================
        
        if (path.startsWith('/admin')) {
            // Verify admin access
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
            
            // GET /admin/stats - Get admin statistics
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
            
            // GET /admin/users - Get all users
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
            
            // GET /admin/users/{userId} - Get user details
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
            
            // PUT /admin/users/{userId} - Update user
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
            
            // DELETE /admin/users/{userId} - Delete user
            if (path.match(/^\/admin\/users\/[^/]+$/) && method === 'DELETE') {
                const targetUserId = path.split('/').pop();
                const result = await deleteUser(targetUserId);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(result)
                };
            }
            
            // Unknown admin route
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
        // DASHBOARD CONTEXT (Original functionality)
        // ========================================
        
        console.log('Loading dashboard context for userId:', userId);
        
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
            cac: 127,
            ltv: 1890,
            churnRate: 2.3,
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
