/**
 * Auxeira Complete Platform - Enhanced DynamoDB Database Design
 * Supporting ALL dashboard types: ESG, VC, Angel Investor, Government, Impact Investor, Startup, Corporate Partner
 * 
 * Dashboard Categories:
 * 1. ESG Dashboards (17 SDG focus areas)
 * 2. VC Dashboard (Venture Capital firms)
 * 3. Angel Investor Dashboard (Individual investors)
 * 4. Government Agency Dashboard (Policy makers)
 * 5. Impact Investor Dashboard (Impact-focused funds)
 * 6. Startup Dashboard (Entrepreneurs and founders)
 * 7. Corporate Partner/Share Value Partner Dashboard (Corporate partnerships)
 */

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

// ================================
// ENHANCED TABLE DEFINITIONS
// ================================

const TABLES = {
    // Core user management
    USERS: 'auxeira-users',
    USER_PROFILES: 'auxeira-user-profiles',
    USER_SESSIONS: 'auxeira-user-sessions',
    
    // Dashboard-specific data
    DASHBOARD_CONFIGS: 'auxeira-dashboard-configs',
    DASHBOARD_ANALYTICS: 'auxeira-dashboard-analytics',
    
    // Investment and deal flow
    DEALS: 'auxeira-deals',
    INVESTMENTS: 'auxeira-investments',
    PORTFOLIOS: 'auxeira-portfolios',
    
    // Reports and AI content
    AI_REPORTS: 'auxeira-ai-reports',
    REPORT_TEMPLATES: 'auxeira-report-templates',
    AI_CACHE: 'auxeira-ai-cache',
    
    // Collaboration and networking
    PROJECTS: 'auxeira-projects',
    PLEDGES: 'auxeira-pledges',
    COLLABORATIONS: 'auxeira-collaborations',
    EXPERT_NETWORK: 'auxeira-expert-network',
    
    // Competitive intelligence
    LEADERBOARD: 'auxeira-leaderboard',
    BENCHMARKS: 'auxeira-benchmarks',
    MARKET_INTELLIGENCE: 'auxeira-market-intelligence',
    
    // System and analytics
    USER_ACTIVITY: 'auxeira-user-activity',
    SYSTEM_METRICS: 'auxeira-system-metrics',
    PAYMENT_TRANSACTIONS: 'auxeira-payments',
    
    // Dashboard-specific features
    STARTUP_PROFILES: 'auxeira-startup-profiles',
    VC_DEAL_FLOW: 'auxeira-vc-deal-flow',
    GOVERNMENT_POLICIES: 'auxeira-government-policies',
    CORPORATE_PARTNERSHIPS: 'auxeira-corporate-partnerships'
};

// ================================
// ENHANCED USER PROFILES SCHEMA
// ================================

const EnhancedUserProfilesSchema = {
    TableName: TABLES.USER_PROFILES,
    KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'dashboardType', AttributeType: 'S' },
        { AttributeName: 'organizationType', AttributeType: 'S' },
        { AttributeName: 'country', AttributeType: 'S' },
        { AttributeName: 'completionScore', AttributeType: 'N' },
        { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
        {
            IndexName: 'DashboardTypeIndex',
            KeySchema: [
                { AttributeName: 'dashboardType', KeyType: 'HASH' },
                { AttributeName: 'completionScore', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 3 }
        },
        {
            IndexName: 'OrganizationTypeIndex',
            KeySchema: [
                { AttributeName: 'organizationType', KeyType: 'HASH' },
                { AttributeName: 'createdAt', KeyType: 'RANGE' }
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

// ================================
// DEALS TABLE (VC, Angel, Impact Investor)
// ================================

const DealsTableSchema = {
    TableName: TABLES.DEALS,
    KeySchema: [
        { AttributeName: 'dealId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
        { AttributeName: 'dealId', AttributeType: 'S' },
        { AttributeName: 'startupId', AttributeType: 'S' },
        { AttributeName: 'investorId', AttributeType: 'S' },
        { AttributeName: 'dealStage', AttributeType: 'S' },
        { AttributeName: 'sector', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
        {
            IndexName: 'StartupDealsIndex',
            KeySchema: [
                { AttributeName: 'startupId', KeyType: 'HASH' },
                { AttributeName: 'createdAt', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 8, WriteCapacityUnits: 3 }
        },
        {
            IndexName: 'InvestorDealsIndex',
            KeySchema: [
                { AttributeName: 'investorId', KeyType: 'HASH' },
                { AttributeName: 'dealStage', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 3 }
        },
        {
            IndexName: 'SectorDealsIndex',
            KeySchema: [
                { AttributeName: 'sector', KeyType: 'HASH' },
                { AttributeName: 'createdAt', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 2 }
        }
    ],
    BillingMode: 'PAY_PER_REQUEST'
};

// ================================
// STARTUP PROFILES TABLE
// ================================

const StartupProfilesSchema = {
    TableName: TABLES.STARTUP_PROFILES,
    KeySchema: [
        { AttributeName: 'startupId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
        { AttributeName: 'startupId', AttributeType: 'S' },
        { AttributeName: 'sector', AttributeType: 'S' },
        { AttributeName: 'fundingStage', AttributeType: 'S' },
        { AttributeName: 'country', AttributeType: 'S' },
        { AttributeName: 'esgScore', AttributeType: 'N' }
    ],
    GlobalSecondaryIndexes: [
        {
            IndexName: 'SectorIndex',
            KeySchema: [
                { AttributeName: 'sector', KeyType: 'HASH' },
                { AttributeName: 'esgScore', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 8, WriteCapacityUnits: 2 }
        },
        {
            IndexName: 'FundingStageIndex',
            KeySchema: [
                { AttributeName: 'fundingStage', KeyType: 'HASH' },
                { AttributeName: 'esgScore', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 6, WriteCapacityUnits: 2 }
        }
    ],
    BillingMode: 'PAY_PER_REQUEST'
};

// ================================
// GOVERNMENT POLICIES TABLE
// ================================

const GovernmentPoliciesSchema = {
    TableName: TABLES.GOVERNMENT_POLICIES,
    KeySchema: [
        { AttributeName: 'policyId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
        { AttributeName: 'policyId', AttributeType: 'S' },
        { AttributeName: 'country', AttributeType: 'S' },
        { AttributeName: 'sdgAlignment', AttributeType: 'S' },
        { AttributeName: 'policyType', AttributeType: 'S' },
        { AttributeName: 'effectiveDate', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
        {
            IndexName: 'CountryPoliciesIndex',
            KeySchema: [
                { AttributeName: 'country', KeyType: 'HASH' },
                { AttributeName: 'effectiveDate', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 2 }
        },
        {
            IndexName: 'SDGPoliciesIndex',
            KeySchema: [
                { AttributeName: 'sdgAlignment', KeyType: 'HASH' },
                { AttributeName: 'policyType', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 3, WriteCapacityUnits: 1 }
        }
    ],
    BillingMode: 'PROVISIONED',
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 2 }
};

// ================================
// CORPORATE PARTNERSHIPS TABLE
// ================================

const CorporatePartnershipsSchema = {
    TableName: TABLES.CORPORATE_PARTNERSHIPS,
    KeySchema: [
        { AttributeName: 'partnershipId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
        { AttributeName: 'partnershipId', AttributeType: 'S' },
        { AttributeName: 'corporateId', AttributeType: 'S' },
        { AttributeName: 'partnerId', AttributeType: 'S' },
        { AttributeName: 'partnershipType', AttributeType: 'S' },
        { AttributeName: 'status', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
        {
            IndexName: 'CorporatePartnershipsIndex',
            KeySchema: [
                { AttributeName: 'corporateId', KeyType: 'HASH' },
                { AttributeName: 'status', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 2 }
        },
        {
            IndexName: 'PartnershipTypeIndex',
            KeySchema: [
                { AttributeName: 'partnershipType', KeyType: 'HASH' },
                { AttributeName: 'status', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: { ReadCapacityUnits: 3, WriteCapacityUnits: 1 }
        }
    ],
    BillingMode: 'PROVISIONED',
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 2 }
};

// ================================
// ENHANCED DATABASE SERVICE
// ================================

class CompleteDashboardService {
    constructor() {
        this.dynamodb = dynamodb;
        this.tables = TABLES;
    }

    // ================================
    // DASHBOARD-SPECIFIC OPERATIONS
    // ================================

    async createUserProfile(userId, profileData, dashboardType) {
        const profile = {
            userId,
            dashboardType, // 'esg', 'vc', 'angel', 'government', 'impact', 'startup', 'corporate'
            organizationName: profileData.organizationName,
            organizationType: profileData.organizationType,
            website: profileData.website,
            country: profileData.country,
            
            // Dashboard-specific fields
            ...(dashboardType === 'vc' && {
                fundSize: profileData.fundSize,
                investmentStage: profileData.investmentStage,
                sectorFocus: profileData.sectorFocus,
                checkSize: profileData.checkSize,
                portfolioSize: profileData.portfolioSize
            }),
            
            ...(dashboardType === 'angel' && {
                investmentCapacity: profileData.investmentCapacity,
                expertiseAreas: profileData.expertiseAreas,
                mentorshipInterest: profileData.mentorshipInterest,
                networkSize: profileData.networkSize
            }),
            
            ...(dashboardType === 'government' && {
                department: profileData.department,
                policyAreas: profileData.policyAreas,
                budget: profileData.budget,
                jurisdiction: profileData.jurisdiction,
                sdgPriorities: profileData.sdgPriorities
            }),
            
            ...(dashboardType === 'impact' && {
                impactThesis: profileData.impactThesis,
                measurementFramework: profileData.measurementFramework,
                blendedFinance: profileData.blendedFinance,
                impactGoals: profileData.impactGoals
            }),
            
            ...(dashboardType === 'startup' && {
                foundingYear: profileData.foundingYear,
                sector: profileData.sector,
                fundingStage: profileData.fundingStage,
                teamSize: profileData.teamSize,
                revenue: profileData.revenue,
                esgScore: profileData.esgScore || 0
            }),
            
            ...(dashboardType === 'corporate' && {
                industry: profileData.industry,
                marketCap: profileData.marketCap,
                esgRating: profileData.esgRating,
                partnershipBudget: profileData.partnershipBudget,
                strategicFocus: profileData.strategicFocus
            }),
            
            // Common ESG fields for all dashboards
            ...(dashboardType.startsWith('esg') && {
                focusAreas: profileData.focusAreas,
                sdgAlignment: profileData.sdgAlignment,
                annualSpend: profileData.annualSpend,
                impactGoals: profileData.impactGoals
            }),
            
            completionScore: this.calculateCompletionScore(profileData, dashboardType),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            profileVersion: '3.0'
        };

        const params = {
            TableName: this.tables.USER_PROFILES,
            Item: profile
        };

        await this.dynamodb.put(params).promise();
        return { success: true, profile };
    }

    // ================================
    // VC DASHBOARD OPERATIONS
    // ================================

    async createDeal(dealData) {
        const deal = {
            dealId: this.generateId('deal'),
            startupId: dealData.startupId,
            investorId: dealData.investorId,
            dealType: dealData.dealType, // 'equity', 'convertible', 'safe'
            dealStage: dealData.dealStage, // 'sourcing', 'diligence', 'negotiation', 'closed'
            sector: dealData.sector,
            fundingAmount: dealData.fundingAmount,
            valuation: dealData.valuation,
            leadInvestor: dealData.leadInvestor,
            coinvestors: JSON.stringify(dealData.coinvestors || []),
            termSheet: dealData.termSheet,
            dueDiligenceStatus: dealData.dueDiligenceStatus,
            esgScore: dealData.esgScore || 0,
            impactMetrics: JSON.stringify(dealData.impactMetrics || {}),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active'
        };

        const params = {
            TableName: this.tables.DEALS,
            Item: deal
        };

        await this.dynamodb.put(params).promise();
        return { success: true, dealId: deal.dealId };
    }

    async getVCDealFlow(investorId, filters = {}) {
        const params = {
            TableName: this.tables.DEALS,
            IndexName: 'InvestorDealsIndex',
            KeyConditionExpression: 'investorId = :investorId',
            ExpressionAttributeValues: { ':investorId': investorId }
        };

        if (filters.dealStage) {
            params.KeyConditionExpression += ' AND dealStage = :stage';
            params.ExpressionAttributeValues[':stage'] = filters.dealStage;
        }

        const result = await this.dynamodb.query(params).promise();
        return result.Items;
    }

    // ================================
    // STARTUP DASHBOARD OPERATIONS
    // ================================

    async createStartupProfile(startupData) {
        const startup = {
            startupId: this.generateId('startup'),
            companyName: startupData.companyName,
            founderId: startupData.founderId,
            sector: startupData.sector,
            fundingStage: startupData.fundingStage,
            country: startupData.country,
            foundingYear: startupData.foundingYear,
            teamSize: startupData.teamSize,
            revenue: startupData.revenue || 0,
            totalFunding: startupData.totalFunding || 0,
            lastFundingDate: startupData.lastFundingDate,
            businessModel: startupData.businessModel,
            esgScore: startupData.esgScore || 0,
            impactMetrics: JSON.stringify(startupData.impactMetrics || {}),
            pitchDeck: startupData.pitchDeck,
            financials: JSON.stringify(startupData.financials || {}),
            traction: JSON.stringify(startupData.traction || {}),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active'
        };

        const params = {
            TableName: this.tables.STARTUP_PROFILES,
            Item: startup
        };

        await this.dynamodb.put(params).promise();
        return { success: true, startupId: startup.startupId };
    }

    async getStartupsByFilter(filters = {}) {
        let params = {
            TableName: this.tables.STARTUP_PROFILES
        };

        if (filters.sector) {
            params = {
                ...params,
                IndexName: 'SectorIndex',
                KeyConditionExpression: 'sector = :sector',
                ExpressionAttributeValues: { ':sector': filters.sector }
            };
        } else if (filters.fundingStage) {
            params = {
                ...params,
                IndexName: 'FundingStageIndex',
                KeyConditionExpression: 'fundingStage = :stage',
                ExpressionAttributeValues: { ':stage': filters.fundingStage }
            };
        } else {
            // Full scan with filter
            params.FilterExpression = 'attribute_exists(startupId)';
        }

        const result = filters.sector || filters.fundingStage 
            ? await this.dynamodb.query(params).promise()
            : await this.dynamodb.scan(params).promise();
        
        return result.Items;
    }

    // ================================
    // GOVERNMENT DASHBOARD OPERATIONS
    // ================================

    async createPolicy(policyData) {
        const policy = {
            policyId: this.generateId('policy'),
            governmentId: policyData.governmentId,
            policyName: policyData.policyName,
            policyType: policyData.policyType, // 'regulation', 'incentive', 'framework'
            country: policyData.country,
            sdgAlignment: policyData.sdgAlignment,
            description: policyData.description,
            effectiveDate: policyData.effectiveDate,
            budget: policyData.budget,
            targetBeneficiaries: policyData.targetBeneficiaries,
            kpis: JSON.stringify(policyData.kpis || []),
            implementationStatus: policyData.implementationStatus || 'draft',
            stakeholders: JSON.stringify(policyData.stakeholders || []),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active'
        };

        const params = {
            TableName: this.tables.GOVERNMENT_POLICIES,
            Item: policy
        };

        await this.dynamodb.put(params).promise();
        return { success: true, policyId: policy.policyId };
    }

    async getPoliciesBySDG(sdgAlignment, country = null) {
        const params = {
            TableName: this.tables.GOVERNMENT_POLICIES,
            IndexName: 'SDGPoliciesIndex',
            KeyConditionExpression: 'sdgAlignment = :sdg',
            ExpressionAttributeValues: { ':sdg': sdgAlignment }
        };

        if (country) {
            params.FilterExpression = 'country = :country';
            params.ExpressionAttributeValues[':country'] = country;
        }

        const result = await this.dynamodb.query(params).promise();
        return result.Items;
    }

    // ================================
    // CORPORATE PARTNERSHIP OPERATIONS
    // ================================

    async createPartnership(partnershipData) {
        const partnership = {
            partnershipId: this.generateId('partnership'),
            corporateId: partnershipData.corporateId,
            partnerId: partnershipData.partnerId,
            partnershipType: partnershipData.partnershipType, // 'strategic', 'investment', 'procurement'
            title: partnershipData.title,
            description: partnershipData.description,
            value: partnershipData.value,
            duration: partnershipData.duration,
            sdgImpact: partnershipData.sdgImpact,
            kpis: JSON.stringify(partnershipData.kpis || []),
            status: partnershipData.status || 'proposed',
            startDate: partnershipData.startDate,
            endDate: partnershipData.endDate,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const params = {
            TableName: this.tables.CORPORATE_PARTNERSHIPS,
            Item: partnership
        };

        await this.dynamodb.put(params).promise();
        return { success: true, partnershipId: partnership.partnershipId };
    }

    async getCorporatePartnerships(corporateId, status = null) {
        const params = {
            TableName: this.tables.CORPORATE_PARTNERSHIPS,
            IndexName: 'CorporatePartnershipsIndex',
            KeyConditionExpression: 'corporateId = :corporateId',
            ExpressionAttributeValues: { ':corporateId': corporateId }
        };

        if (status) {
            params.KeyConditionExpression += ' AND #status = :status';
            params.ExpressionAttributeNames = { '#status': 'status' };
            params.ExpressionAttributeValues[':status'] = status;
        }

        const result = await this.dynamodb.query(params).promise();
        return result.Items;
    }

    // ================================
    // CROSS-DASHBOARD ANALYTICS
    // ================================

    async getDashboardAnalytics(dashboardType, timeframe = '30d') {
        const params = {
            TableName: this.tables.DASHBOARD_ANALYTICS,
            KeyConditionExpression: 'dashboardType = :type',
            ExpressionAttributeValues: { ':type': dashboardType },
            ScanIndexForward: false,
            Limit: this.getTimeframeLimits(timeframe)
        };

        const result = await this.dynamodb.query(params).promise();
        return result.Items;
    }

    async updateDashboardMetrics(dashboardType, metrics) {
        const analyticsRecord = {
            dashboardType,
            timestamp: new Date().toISOString(),
            metrics: JSON.stringify(metrics),
            activeUsers: metrics.activeUsers || 0,
            totalSessions: metrics.totalSessions || 0,
            avgSessionDuration: metrics.avgSessionDuration || 0,
            conversionRate: metrics.conversionRate || 0,
            revenue: metrics.revenue || 0
        };

        const params = {
            TableName: this.tables.DASHBOARD_ANALYTICS,
            Item: analyticsRecord
        };

        await this.dynamodb.put(params).promise();
        return { success: true };
    }

    // ================================
    // ENHANCED LEADERBOARD OPERATIONS
    // ================================

    async updateDashboardLeaderboard(userId, dashboardType, category, score, metadata = {}) {
        const leaderboardEntry = {
            category: `${dashboardType}_${category}`,
            score,
            userId,
            dashboardType,
            organizationType: metadata.organizationType,
            organizationName: metadata.organizationName,
            country: metadata.country,
            updatedAt: new Date().toISOString(),
            metrics: JSON.stringify(metadata.metrics || {}),
            rank: 0
        };

        const params = {
            TableName: this.tables.LEADERBOARD,
            Item: leaderboardEntry
        };

        await this.dynamodb.put(params).promise();
        return { success: true };
    }

    async getDashboardLeaderboard(dashboardType, category, limit = 100) {
        const params = {
            TableName: this.tables.LEADERBOARD,
            KeyConditionExpression: 'category = :category',
            ExpressionAttributeValues: { ':category': `${dashboardType}_${category}` },
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

    // ================================
    // UTILITY FUNCTIONS
    // ================================

    generateId(prefix) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}_${timestamp}_${random}`;
    }

    calculateCompletionScore(profileData, dashboardType) {
        const commonFields = ['organizationName', 'organizationType', 'website', 'country'];
        
        const dashboardSpecificFields = {
            'vc': ['fundSize', 'investmentStage', 'sectorFocus', 'checkSize'],
            'angel': ['investmentCapacity', 'expertiseAreas', 'mentorshipInterest'],
            'government': ['department', 'policyAreas', 'budget', 'jurisdiction'],
            'impact': ['impactThesis', 'measurementFramework', 'impactGoals'],
            'startup': ['foundingYear', 'sector', 'fundingStage', 'teamSize'],
            'corporate': ['industry', 'marketCap', 'esgRating', 'partnershipBudget'],
            'esg': ['focusAreas', 'sdgAlignment', 'annualSpend', 'impactGoals']
        };

        const requiredFields = [
            ...commonFields,
            ...(dashboardSpecificFields[dashboardType] || [])
        ];
        
        const completedFields = requiredFields.filter(field => 
            profileData[field] && profileData[field].toString().trim().length > 0
        );
        
        return Math.round((completedFields.length / requiredFields.length) * 100);
    }

    getTimeframeLimits(timeframe) {
        const limits = {
            '1h': 60,
            '24h': 24,
            '7d': 7,
            '30d': 30,
            '90d': 90
        };
        return limits[timeframe] || 30;
    }
}

// ================================
// TABLE CREATION CONFIGURATION
// ================================

const ALL_TABLE_SCHEMAS = [
    // Core tables
    require('./dynamodb-central-database').UsersTableSchema,
    EnhancedUserProfilesSchema,
    require('./dynamodb-central-database').ESGReportsTableSchema,
    
    // New dashboard-specific tables
    DealsTableSchema,
    StartupProfilesSchema,
    GovernmentPoliciesSchema,
    CorporatePartnershipsSchema,
    
    // Enhanced existing tables
    require('./dynamodb-central-database').ProjectsTableSchema,
    require('./dynamodb-central-database').LeaderboardTableSchema,
    
    // System tables
    {
        TableName: TABLES.DASHBOARD_ANALYTICS,
        KeySchema: [
            { AttributeName: 'dashboardType', KeyType: 'HASH' },
            { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'dashboardType', AttributeType: 'S' },
            { AttributeName: 'timestamp', AttributeType: 'S' }
        ],
        BillingMode: 'PROVISIONED',
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 3 }
    }
];

// ================================
// EXPORTS
// ================================

module.exports = {
    CompleteDashboardService,
    TABLES,
    ALL_TABLE_SCHEMAS,
    EnhancedUserProfilesSchema,
    DealsTableSchema,
    StartupProfilesSchema,
    GovernmentPoliciesSchema,
    CorporatePartnershipsSchema
};

// ================================
// USAGE EXAMPLES FOR ALL DASHBOARDS
// ================================

/*
const dbService = new CompleteDashboardService();

// VC Dashboard Example
const vcProfile = await dbService.createUserProfile('user_123', {
    organizationName: 'Sequoia Capital',
    organizationType: 'VC Fund',
    website: 'https://sequoiacap.com',
    country: 'United States',
    fundSize: 2000000000,
    investmentStage: 'Series A, Series B',
    sectorFocus: 'AI, Fintech, Healthcare',
    checkSize: '10M-50M'
}, 'vc');

// Angel Investor Dashboard Example
const angelProfile = await dbService.createUserProfile('user_456', {
    organizationName: 'Individual Investor',
    organizationType: 'Angel Investor',
    website: 'https://linkedin.com/in/investor',
    country: 'United Kingdom',
    investmentCapacity: 500000,
    expertiseAreas: 'EdTech, SaaS',
    mentorshipInterest: true,
    networkSize: 250
}, 'angel');

// Government Dashboard Example
const govProfile = await dbService.createUserProfile('user_789', {
    organizationName: 'Ministry of Education',
    organizationType: 'Government Agency',
    website: 'https://education.gov.ng',
    country: 'Nigeria',
    department: 'Education',
    policyAreas: 'Digital Education, Teacher Training',
    budget: 1000000000,
    jurisdiction: 'Federal',
    sdgPriorities: 'SDG 4, SDG 8'
}, 'government');

// Startup Dashboard Example
const startupProfile = await dbService.createUserProfile('user_101', {
    organizationName: 'EduTech Solutions',
    organizationType: 'Startup',
    website: 'https://edutech.com',
    country: 'Kenya',
    foundingYear: 2022,
    sector: 'EdTech',
    fundingStage: 'Seed',
    teamSize: 15,
    revenue: 250000,
    esgScore: 85
}, 'startup');

// Corporate Partner Dashboard Example
const corporateProfile = await dbService.createUserProfile('user_202', {
    organizationName: 'Microsoft',
    organizationType: 'Technology Corporation',
    website: 'https://microsoft.com',
    country: 'United States',
    industry: 'Technology',
    marketCap: 2800000000000,
    esgRating: 'AA',
    partnershipBudget: 100000000,
    strategicFocus: 'AI for Good, Digital Skills'
}, 'corporate');

// Create a VC deal
const deal = await dbService.createDeal({
    startupId: 'startup_123',
    investorId: 'user_123',
    dealType: 'equity',
    dealStage: 'diligence',
    sector: 'EdTech',
    fundingAmount: 5000000,
    valuation: 25000000,
    leadInvestor: true,
    esgScore: 90
});

// Create government policy
const policy = await dbService.createPolicy({
    governmentId: 'user_789',
    policyName: 'Digital Education Initiative',
    policyType: 'framework',
    country: 'Nigeria',
    sdgAlignment: 'SDG 4',
    description: 'National framework for digital education',
    effectiveDate: '2025-01-01',
    budget: 50000000,
    targetBeneficiaries: 1000000
});

// Create corporate partnership
const partnership = await dbService.createPartnership({
    corporateId: 'user_202',
    partnerId: 'startup_123',
    partnershipType: 'strategic',
    title: 'AI Education Platform Partnership',
    description: 'Joint development of AI-powered education tools',
    value: 2000000,
    duration: '24 months',
    sdgImpact: 'SDG 4, SDG 8',
    status: 'active'
});
*/
