/**
 * Auxeira ESG Platform - Central DynamoDB Database Design
 * Cost-effective, scalable database architecture for ESG dashboards
 * 
 * Features:
 * - User profiles and authentication
 * - AI report generation and storage
 * - Collaboration and crowdfunding
 * - Leaderboard and competitive intelligence
 * - Real-time analytics and monitoring
 */

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

// ================================
// TABLE DEFINITIONS
// ================================

const TABLES = {
    // Primary user management
    USERS: 'auxeira-users',
    USER_PROFILES: 'auxeira-user-profiles',
    USER_SESSIONS: 'auxeira-user-sessions',
    
    // ESG Reports and AI
    ESG_REPORTS: 'auxeira-esg-reports',
    AI_REPORT_CACHE: 'auxeira-ai-cache',
    REPORT_ANALYTICS: 'auxeira-report-analytics',
    
    // Collaboration and Crowdfunding
    PROJECTS: 'auxeira-projects',
    PLEDGES: 'auxeira-pledges',
    COLLABORATIONS: 'auxeira-collaborations',
    
    // Competitive Intelligence
    LEADERBOARD: 'auxeira-leaderboard',
    BENCHMARKS: 'auxeira-benchmarks',
    
    // System and Analytics
    SYSTEM_METRICS: 'auxeira-system-metrics',
    USER_ACTIVITY: 'auxeira-user-activity',
    PAYMENT_TRANSACTIONS: 'auxeira-payments'
};

// ================================
// TABLE SCHEMAS
// ================================

/**
 * 1. USERS TABLE
 * Primary authentication and basic user data
 */
const UsersTableSchema = {
    TableName: TABLES.USERS,
    KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
        {
            IndexName: 'EmailIndex',
            KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        },
        {
            IndexName: 'CreatedAtIndex',
            KeySchema: [{ AttributeName: 'createdAt', KeyType: 'HASH' }],
            Projection: { ProjectionType: 'KEYS_ONLY' },
            ProvisionedThroughput: { ReadCapacityUnits: 2, WriteCapacityUnits: 2 }
        }
    ],
    BillingMode: 'PAY_PER_REQUEST'
};

/**
 * 2. USER PROFILES TABLE
 * Comprehensive ESG organization profiles
 */
const UserProfilesTableSchema = {
    TableName: TABLES.USER_PROFILES,
    KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'organizationType', AttributeType: 'S' },
        { AttributeName: 'country', AttributeType: 'S' },
        { AttributeName: 'completionScore', AttributeType: 'N' }
    ],
    GlobalSecondaryIndexes: [
        {
            IndexName: 'OrganizationTypeIndex',
            KeySchema: [
                { AttributeName: 'organizationType', KeyType: 'HASH' },
                { AttributeName: 'completionScore', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 2 }
        },
        {
            IndexName: 'CountryIndex',
            KeySchema: [{ AttributeName: 'country', KeyType: 'HASH' }],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 3, WriteCapacityUnits: 2 }
        }
    ],
    BillingMode: 'PAY_PER_REQUEST'
};

/**
 * 3. ESG REPORTS TABLE
 * AI-generated reports with metadata
 */
const ESGReportsTableSchema = {
    TableName: TABLES.ESG_REPORTS,
    KeySchema: [
        { AttributeName: 'reportId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
        { AttributeName: 'reportId', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'reportType', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' },
        { AttributeName: 'isPremium', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
        {
            IndexName: 'UserReportsIndex',
            KeySchema: [
                { AttributeName: 'userId', KeyType: 'HASH' },
                { AttributeName: 'createdAt', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 5 }
        },
        {
            IndexName: 'ReportTypeIndex',
            KeySchema: [
                { AttributeName: 'reportType', KeyType: 'HASH' },
                { AttributeName: 'createdAt', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 2 }
        },
        {
            IndexName: 'PremiumReportsIndex',
            KeySchema: [
                { AttributeName: 'isPremium', KeyType: 'HASH' },
                { AttributeName: 'createdAt', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 3, WriteCapacityUnits: 2 }
        }
    ],
    BillingMode: 'PAY_PER_REQUEST'
};

/**
 * 4. PROJECTS TABLE
 * Crowdfunding and collaboration projects
 */
const ProjectsTableSchema = {
    TableName: TABLES.PROJECTS,
    KeySchema: [
        { AttributeName: 'projectId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
        { AttributeName: 'projectId', AttributeType: 'S' },
        { AttributeName: 'foundationId', AttributeType: 'S' },
        { AttributeName: 'sdgFocus', AttributeType: 'S' },
        { AttributeName: 'status', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
        {
            IndexName: 'FoundationProjectsIndex',
            KeySchema: [
                { AttributeName: 'foundationId', KeyType: 'HASH' },
                { AttributeName: 'createdAt', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 3 }
        },
        {
            IndexName: 'SDGProjectsIndex',
            KeySchema: [
                { AttributeName: 'sdgFocus', KeyType: 'HASH' },
                { AttributeName: 'status', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 8, WriteCapacityUnits: 3 }
        }
    ],
    BillingMode: 'PAY_PER_REQUEST'
};

/**
 * 5. LEADERBOARD TABLE
 * Competitive intelligence and rankings
 */
const LeaderboardTableSchema = {
    TableName: TABLES.LEADERBOARD,
    KeySchema: [
        { AttributeName: 'category', KeyType: 'HASH' },
        { AttributeName: 'score', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
        { AttributeName: 'category', AttributeType: 'S' },
        { AttributeName: 'score', AttributeType: 'N' },
        { AttributeName: 'organizationType', AttributeType: 'S' },
        { AttributeName: 'country', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
        {
            IndexName: 'OrganizationLeaderboardIndex',
            KeySchema: [
                { AttributeName: 'organizationType', KeyType: 'HASH' },
                { AttributeName: 'score', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 2 }
        },
        {
            IndexName: 'CountryLeaderboardIndex',
            KeySchema: [
                { AttributeName: 'country', KeyType: 'HASH' },
                { AttributeName: 'score', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 3, WriteCapacityUnits: 2 }
        }
    ],
    BillingMode: 'PAY_PER_REQUEST'
};

// ================================
// DATABASE OPERATIONS
// ================================

class AuxeiraDynamoDBService {
    constructor() {
        this.dynamodb = dynamodb;
        this.tables = TABLES;
    }

    // ================================
    // USER MANAGEMENT
    // ================================

    async createUser(userData) {
        const user = {
            userId: this.generateId('user'),
            email: userData.email,
            passwordHash: userData.passwordHash,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role || 'user',
            emailVerified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            loginCount: 0,
            lastLoginAt: null,
            subscriptionTier: 'free'
        };

        const params = {
            TableName: this.tables.USERS,
            Item: user,
            ConditionExpression: 'attribute_not_exists(email)'
        };

        try {
            await this.dynamodb.put(params).promise();
            return { success: true, user: this.sanitizeUser(user) };
        } catch (error) {
            if (error.code === 'ConditionalCheckFailedException') {
                return { success: false, error: 'User already exists' };
            }
            throw error;
        }
    }

    async getUserByEmail(email) {
        const params = {
            TableName: this.tables.USERS,
            IndexName: 'EmailIndex',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': email }
        };

        const result = await this.dynamodb.query(params).promise();
        return result.Items[0] || null;
    }

    async updateUserProfile(userId, profileData) {
        const profile = {
            userId,
            organizationName: profileData.organizationName,
            organizationType: profileData.organizationType,
            website: profileData.website,
            country: profileData.country,
            focusAreas: profileData.focusAreas,
            sdgAlignment: profileData.sdgAlignment,
            annualSpend: profileData.annualSpend,
            impactGoals: profileData.impactGoals,
            completionScore: this.calculateCompletionScore(profileData),
            updatedAt: new Date().toISOString(),
            profileVersion: '2.0'
        };

        const params = {
            TableName: this.tables.USER_PROFILES,
            Item: profile
        };

        await this.dynamodb.put(params).promise();
        return { success: true, profile };
    }

    // ================================
    // ESG REPORTS MANAGEMENT
    // ================================

    async createESGReport(reportData) {
        const report = {
            reportId: this.generateId('report'),
            userId: reportData.userId,
            reportType: reportData.reportType,
            title: reportData.title,
            executiveSummary: reportData.executiveSummary,
            fullNarrative: reportData.fullNarrative,
            keyMetrics: JSON.stringify(reportData.keyMetrics),
            visualizations: JSON.stringify(reportData.visualizations),
            recommendedActions: reportData.recommendedActions,
            scrapedDataSources: JSON.stringify(reportData.scrapedDataSources),
            promptUsed: reportData.promptUsed,
            tokensUsed: reportData.tokensUsed,
            generationTime: reportData.generationTime,
            isPremium: reportData.isPremium ? 'true' : 'false',
            unlockPrice: reportData.unlockPrice,
            isUnlocked: reportData.isUnlocked || false,
            createdAt: new Date().toISOString(),
            aiModel: 'gpt-4-turbo',
            version: '2.0'
        };

        const params = {
            TableName: this.tables.ESG_REPORTS,
            Item: report
        };

        await this.dynamodb.put(params).promise();
        return { success: true, reportId: report.reportId };
    }

    async getUserReports(userId, limit = 20) {
        const params = {
            TableName: this.tables.ESG_REPORTS,
            IndexName: 'UserReportsIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: { ':userId': userId },
            ScanIndexForward: false,
            Limit: limit
        };

        const result = await this.dynamodb.query(params).promise();
        return result.Items;
    }

    async getReportsByType(reportType, limit = 50) {
        const params = {
            TableName: this.tables.ESG_REPORTS,
            IndexName: 'ReportTypeIndex',
            KeyConditionExpression: 'reportType = :reportType',
            ExpressionAttributeValues: { ':reportType': reportType },
            ScanIndexForward: false,
            Limit: limit
        };

        const result = await this.dynamodb.query(params).promise();
        return result.Items;
    }

    // ================================
    // COLLABORATION & CROWDFUNDING
    // ================================

    async createProject(projectData) {
        const project = {
            projectId: this.generateId('project'),
            foundationId: projectData.foundationId,
            title: projectData.title,
            description: projectData.description,
            sdgFocus: projectData.sdgFocus,
            targetAmount: projectData.targetAmount,
            currentAmount: 0,
            currency: projectData.currency || 'USD',
            status: 'active',
            requiredRoles: JSON.stringify(projectData.requiredRoles || []),
            timeline: projectData.timeline,
            location: projectData.location,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            pledgeCount: 0,
            collaboratorCount: 0
        };

        const params = {
            TableName: this.tables.PROJECTS,
            Item: project
        };

        await this.dynamodb.put(params).promise();
        return { success: true, projectId: project.projectId };
    }

    async createPledge(pledgeData) {
        const pledge = {
            pledgeId: this.generateId('pledge'),
            projectId: pledgeData.projectId,
            userId: pledgeData.userId,
            amount: pledgeData.amount,
            currency: pledgeData.currency || 'USD',
            pledgeType: pledgeData.pledgeType, // 'funding' or 'role'
            roleType: pledgeData.roleType, // if pledgeType is 'role'
            status: 'pending',
            createdAt: new Date().toISOString(),
            paymentMethod: pledgeData.paymentMethod,
            message: pledgeData.message
        };

        const params = {
            TableName: this.tables.PLEDGES,
            Item: pledge
        };

        await this.dynamodb.put(params).promise();
        
        // Update project totals
        await this.updateProjectPledgeTotal(pledgeData.projectId, pledgeData.amount);
        
        return { success: true, pledgeId: pledge.pledgeId };
    }

    // ================================
    // LEADERBOARD & COMPETITIVE INTELLIGENCE
    // ================================

    async updateLeaderboardScore(userId, category, score, metadata = {}) {
        const leaderboardEntry = {
            category,
            score,
            userId,
            organizationType: metadata.organizationType,
            organizationName: metadata.organizationName,
            country: metadata.country,
            updatedAt: new Date().toISOString(),
            metrics: JSON.stringify(metadata.metrics || {}),
            rank: 0 // Will be calculated during retrieval
        };

        const params = {
            TableName: this.tables.LEADERBOARD,
            Item: leaderboardEntry
        };

        await this.dynamodb.put(params).promise();
        return { success: true };
    }

    async getLeaderboard(category, limit = 100) {
        const params = {
            TableName: this.tables.LEADERBOARD,
            KeyConditionExpression: 'category = :category',
            ExpressionAttributeValues: { ':category': category },
            ScanIndexForward: false,
            Limit: limit
        };

        const result = await this.dynamodb.query(params).promise();
        
        // Add ranking
        result.Items.forEach((item, index) => {
            item.rank = index + 1;
        });

        return result.Items;
    }

    async getUserRanking(userId, category) {
        const leaderboard = await this.getLeaderboard(category, 1000);
        const userEntry = leaderboard.find(entry => entry.userId === userId);
        
        if (!userEntry) {
            return { rank: null, totalParticipants: leaderboard.length };
        }

        return {
            rank: userEntry.rank,
            score: userEntry.score,
            totalParticipants: leaderboard.length,
            percentile: Math.round((1 - (userEntry.rank / leaderboard.length)) * 100)
        };
    }

    // ================================
    // ANALYTICS & MONITORING
    // ================================

    async trackUserActivity(userId, activity, metadata = {}) {
        const activityRecord = {
            activityId: this.generateId('activity'),
            userId,
            activityType: activity,
            timestamp: new Date().toISOString(),
            metadata: JSON.stringify(metadata),
            sessionId: metadata.sessionId,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent
        };

        const params = {
            TableName: this.tables.USER_ACTIVITY,
            Item: activityRecord
        };

        await this.dynamodb.put(params).promise();
        return { success: true };
    }

    async getSystemMetrics(metricType, timeframe = '24h') {
        const params = {
            TableName: this.tables.SYSTEM_METRICS,
            KeyConditionExpression: 'metricType = :metricType',
            ExpressionAttributeValues: { ':metricType': metricType },
            ScanIndexForward: false,
            Limit: this.getTimeframeLimits(timeframe)
        };

        const result = await this.dynamodb.query(params).promise();
        return result.Items;
    }

    // ================================
    // UTILITY FUNCTIONS
    // ================================

    generateId(prefix) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}_${timestamp}_${random}`;
    }

    calculateCompletionScore(profileData) {
        const requiredFields = [
            'organizationName', 'organizationType', 'website', 
            'country', 'focusAreas', 'sdgAlignment', 
            'annualSpend', 'impactGoals'
        ];
        
        const completedFields = requiredFields.filter(field => 
            profileData[field] && profileData[field].toString().trim().length > 0
        );
        
        return Math.round((completedFields.length / requiredFields.length) * 100);
    }

    sanitizeUser(user) {
        const { passwordHash, ...sanitized } = user;
        return sanitized;
    }

    getTimeframeLimits(timeframe) {
        const limits = {
            '1h': 60,
            '24h': 24,
            '7d': 7,
            '30d': 30
        };
        return limits[timeframe] || 24;
    }

    async updateProjectPledgeTotal(projectId, amount) {
        const params = {
            TableName: this.tables.PROJECTS,
            Key: { projectId },
            UpdateExpression: 'ADD currentAmount :amount, pledgeCount :one',
            ExpressionAttributeValues: {
                ':amount': amount,
                ':one': 1
            }
        };

        await this.dynamodb.update(params).promise();
    }

    // ================================
    // BATCH OPERATIONS
    // ================================

    async batchGetUsers(userIds) {
        const params = {
            RequestItems: {
                [this.tables.USERS]: {
                    Keys: userIds.map(userId => ({ userId }))
                }
            }
        };

        const result = await this.dynamodb.batchGet(params).promise();
        return result.Responses[this.tables.USERS] || [];
    }

    async batchUpdateLeaderboard(updates) {
        const requests = updates.map(update => ({
            PutRequest: {
                Item: {
                    category: update.category,
                    score: update.score,
                    userId: update.userId,
                    organizationType: update.organizationType,
                    organizationName: update.organizationName,
                    country: update.country,
                    updatedAt: new Date().toISOString()
                }
            }
        }));

        // DynamoDB batch write limit is 25 items
        const chunks = this.chunkArray(requests, 25);
        
        for (const chunk of chunks) {
            const params = {
                RequestItems: {
                    [this.tables.LEADERBOARD]: chunk
                }
            };
            await this.dynamodb.batchWrite(params).promise();
        }

        return { success: true, updated: updates.length };
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}

// ================================
// TABLE CREATION SCRIPTS
// ================================

const createTables = async () => {
    const dynamodbAdmin = new AWS.DynamoDB();
    
    const tables = [
        UsersTableSchema,
        UserProfilesTableSchema,
        ESGReportsTableSchema,
        ProjectsTableSchema,
        LeaderboardTableSchema
    ];

    for (const tableSchema of tables) {
        try {
            console.log(`Creating table: ${tableSchema.TableName}`);
            await dynamodbAdmin.createTable(tableSchema).promise();
            console.log(`✅ Table ${tableSchema.TableName} created successfully`);
        } catch (error) {
            if (error.code === 'ResourceInUseException') {
                console.log(`⚠️  Table ${tableSchema.TableName} already exists`);
            } else {
                console.error(`❌ Error creating table ${tableSchema.TableName}:`, error);
            }
        }
    }
};

// ================================
// EXPORTS
// ================================

module.exports = {
    AuxeiraDynamoDBService,
    TABLES,
    createTables,
    UsersTableSchema,
    UserProfilesTableSchema,
    ESGReportsTableSchema,
    ProjectsTableSchema,
    LeaderboardTableSchema
};

// ================================
// USAGE EXAMPLES
// ================================

/*
// Initialize the service
const dbService = new AuxeiraDynamoDBService();

// Create a user
const newUser = await dbService.createUser({
    email: 'user@blackrock.com',
    passwordHash: 'hashed_password',
    firstName: 'Sarah',
    lastName: 'Chen',
    role: 'esg_analyst'
});

// Update user profile
const profile = await dbService.updateUserProfile(newUser.user.userId, {
    organizationName: 'BlackRock Impact Fund',
    organizationType: 'ESG Fund',
    website: 'https://blackrock.com',
    country: 'United States',
    focusAreas: 'Education, Climate',
    sdgAlignment: 'SDG 4, SDG 13',
    annualSpend: 50000000,
    impactGoals: 'Maximize education outcomes in emerging markets'
});

// Create an ESG report
const report = await dbService.createESGReport({
    userId: newUser.user.userId,
    reportType: 'impact_story',
    title: 'Education Impact Analysis',
    executiveSummary: 'Comprehensive analysis...',
    fullNarrative: 'Detailed narrative...',
    keyMetrics: { studentsReached: 10000, roiPercentage: 25 },
    isPremium: false,
    tokensUsed: 2500,
    generationTime: 45
});

// Update leaderboard
await dbService.updateLeaderboardScore(
    newUser.user.userId,
    'esg_impact_score',
    95,
    {
        organizationType: 'ESG Fund',
        organizationName: 'BlackRock Impact Fund',
        country: 'United States',
        metrics: { portfolioSize: 500000000, impactScore: 95 }
    }
);

// Get user ranking
const ranking = await dbService.getUserRanking(newUser.user.userId, 'esg_impact_score');
console.log(`User ranks #${ranking.rank} out of ${ranking.totalParticipants} (${ranking.percentile}th percentile)`);
*/
