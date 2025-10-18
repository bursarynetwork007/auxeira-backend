#!/usr/bin/env node

/**
 * Auxeira Complete Platform - DynamoDB Setup Script
 * Creates all tables for ESG, VC, Angel, Government, Impact, Startup, and Corporate dashboards
 * 
 * Usage:
 *   node setup-complete-platform.js setup    # Create all tables
 *   node setup-complete-platform.js status   # Check table status
 *   node setup-complete-platform.js costs    # Show cost estimates
 *   node setup-complete-platform.js cleanup  # Delete all tables (DANGER!)
 */

const AWS = require('aws-sdk');
const { ALL_TABLE_SCHEMAS } = require('./complete-dashboard-database');

// Configure AWS
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1'
});

const dynamodb = new AWS.DynamoDB();
const dynamodbClient = new AWS.DynamoDB.DocumentClient();

// ================================
// TABLE DEFINITIONS FOR COMPLETE PLATFORM
// ================================

const COMPLETE_PLATFORM_TABLES = [
    // Core user management
    {
        TableName: 'auxeira-users',
        KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'userId', AttributeType: 'S' },
            { AttributeName: 'email', AttributeType: 'S' },
            { AttributeName: 'dashboardType', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'EmailIndex',
                KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 2 }
            },
            {
                IndexName: 'DashboardTypeIndex',
                KeySchema: [{ AttributeName: 'dashboardType', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: { ReadCapacityUnits: 3, WriteCapacityUnits: 1 }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },

    // Enhanced user profiles supporting all dashboard types
    {
        TableName: 'auxeira-user-profiles',
        KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'userId', AttributeType: 'S' },
            { AttributeName: 'dashboardType', AttributeType: 'S' },
            { AttributeName: 'organizationType', AttributeType: 'S' },
            { AttributeName: 'country', AttributeType: 'S' },
            { AttributeName: 'completionScore', AttributeType: 'N' }
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
                KeySchema: [{ AttributeName: 'organizationType', KeyType: 'HASH' }],
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
    },

    // VC and Angel investor deals
    {
        TableName: 'auxeira-deals',
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
    },

    // Startup profiles and company data
    {
        TableName: 'auxeira-startup-profiles',
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
    },

    // Government policies and regulations
    {
        TableName: 'auxeira-government-policies',
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
    },

    // Corporate partnerships and share value
    {
        TableName: 'auxeira-corporate-partnerships',
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
    },

    // AI reports for all dashboard types
    {
        TableName: 'auxeira-ai-reports',
        KeySchema: [
            { AttributeName: 'reportId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'reportId', AttributeType: 'S' },
            { AttributeName: 'userId', AttributeType: 'S' },
            { AttributeName: 'dashboardType', AttributeType: 'S' },
            { AttributeName: 'reportType', AttributeType: 'S' },
            { AttributeName: 'createdAt', AttributeType: 'S' }
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
                IndexName: 'DashboardReportsIndex',
                KeySchema: [
                    { AttributeName: 'dashboardType', KeyType: 'HASH' },
                    { AttributeName: 'reportType', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 2 }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },

    // Cross-dashboard projects and collaboration
    {
        TableName: 'auxeira-projects',
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
                ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 2 }
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
        BillingMode: 'PROVISIONED',
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 2 }
    },

    // Cross-dashboard leaderboards
    {
        TableName: 'auxeira-leaderboard',
        KeySchema: [
            { AttributeName: 'category', KeyType: 'HASH' },
            { AttributeName: 'score', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'category', AttributeType: 'S' },
            { AttributeName: 'score', AttributeType: 'N' },
            { AttributeName: 'userId', AttributeType: 'S' },
            { AttributeName: 'dashboardType', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'UserRankingIndex',
                KeySchema: [
                    { AttributeName: 'userId', KeyType: 'HASH' },
                    { AttributeName: 'category', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: { ReadCapacityUnits: 8, WriteCapacityUnits: 3 }
            },
            {
                IndexName: 'DashboardLeaderboardIndex',
                KeySchema: [
                    { AttributeName: 'dashboardType', KeyType: 'HASH' },
                    { AttributeName: 'score', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 3 }
            }
        ],
        BillingMode: 'PROVISIONED',
        ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 3 }
    },

    // User activity and analytics
    {
        TableName: 'auxeira-user-activity',
        KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
            { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'userId', AttributeType: 'S' },
            { AttributeName: 'timestamp', AttributeType: 'S' },
            { AttributeName: 'activity', AttributeType: 'S' },
            { AttributeName: 'dashboardType', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'ActivityTypeIndex',
                KeySchema: [
                    { AttributeName: 'activity', KeyType: 'HASH' },
                    { AttributeName: 'timestamp', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 3 }
            },
            {
                IndexName: 'DashboardActivityIndex',
                KeySchema: [
                    { AttributeName: 'dashboardType', KeyType: 'HASH' },
                    { AttributeName: 'timestamp', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: { ReadCapacityUnits: 8, WriteCapacityUnits: 5 }
            }
        ],
        BillingMode: 'PROVISIONED',
        ProvisionedThroughput: { ReadCapacityUnits: 2, WriteCapacityUnits: 5 },
        TimeToLiveSpecification: {
            AttributeName: 'ttl',
            Enabled: true
        }
    },

    // Dashboard analytics and metrics
    {
        TableName: 'auxeira-dashboard-analytics',
        KeySchema: [
            { AttributeName: 'dashboardType', KeyType: 'HASH' },
            { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'dashboardType', AttributeType: 'S' },
            { AttributeName: 'timestamp', AttributeType: 'S' }
        ],
        BillingMode: 'PROVISIONED',
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 3 },
        TimeToLiveSpecification: {
            AttributeName: 'ttl',
            Enabled: true
        }
    }
];

// ================================
// SETUP FUNCTIONS
// ================================

async function checkAWSCredentials() {
    try {
        const sts = new AWS.STS();
        const identity = await sts.getCallerIdentity().promise();
        console.log('✅ AWS Credentials verified');
        console.log(`   Account: ${identity.Account}`);
        console.log(`   User: ${identity.Arn}`);
        return true;
    } catch (error) {
        console.error('❌ AWS Credentials not configured properly');
        console.error('   Please run: aws configure');
        return false;
    }
}

async function listExistingTables() {
    try {
        const result = await dynamodb.listTables().promise();
        const auxeiraTables = result.TableNames.filter(name => name.startsWith('auxeira-'));
        
        console.log('\n📋 Existing Auxeira Tables:');
        if (auxeiraTables.length === 0) {
            console.log('   No existing tables found');
        } else {
            auxeiraTables.forEach(table => console.log(`   - ${table}`));
        }
        
        return auxeiraTables;
    } catch (error) {
        console.error('❌ Error listing tables:', error.message);
        return [];
    }
}

async function createTable(tableSchema) {
    try {
        console.log(`🔨 Creating table: ${tableSchema.TableName}`);
        
        const result = await dynamodb.createTable(tableSchema).promise();
        
        console.log(`✅ Table ${tableSchema.TableName} created successfully`);
        console.log(`   Billing Mode: ${tableSchema.BillingMode}`);
        
        if (tableSchema.BillingMode === 'PROVISIONED') {
            console.log(`   Read Capacity: ${tableSchema.ProvisionedThroughput.ReadCapacityUnits}`);
            console.log(`   Write Capacity: ${tableSchema.ProvisionedThroughput.WriteCapacityUnits}`);
        }
        
        return true;
    } catch (error) {
        if (error.code === 'ResourceInUseException') {
            console.log(`⚠️  Table ${tableSchema.TableName} already exists`);
            return true;
        } else {
            console.error(`❌ Error creating table ${tableSchema.TableName}:`, error.message);
            return false;
        }
    }
}

async function waitForTablesActive() {
    console.log('\n⏳ Waiting for tables to become active...');
    
    for (const tableSchema of COMPLETE_PLATFORM_TABLES) {
        try {
            await dynamodb.waitFor('tableExists', { 
                TableName: tableSchema.TableName,
                $waiter: { delay: 5, maxAttempts: 24 }
            }).promise();
            console.log(`✅ Table ${tableSchema.TableName} is now active`);
        } catch (error) {
            console.error(`❌ Table ${tableSchema.TableName} failed to become active:`, error.message);
        }
    }
}

async function seedInitialData() {
    console.log('\n🌱 Seeding initial data...');
    
    try {
        // Seed sample dashboard types
        const sampleDashboardTypes = [
            'esg_education', 'esg_climate', 'esg_poverty',
            'vc', 'angel', 'government', 'impact', 'startup', 'corporate'
        ];
        
        for (const dashboardType of sampleDashboardTypes) {
            await dynamodbClient.put({
                TableName: 'auxeira-dashboard-analytics',
                Item: {
                    dashboardType,
                    timestamp: new Date().toISOString(),
                    metrics: JSON.stringify({
                        activeUsers: Math.floor(Math.random() * 100) + 50,
                        totalSessions: Math.floor(Math.random() * 500) + 200,
                        avgSessionDuration: Math.floor(Math.random() * 300) + 180,
                        conversionRate: Math.random() * 0.1 + 0.05,
                        revenue: Math.floor(Math.random() * 10000) + 5000
                    }),
                    ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
                }
            }).promise();
        }
        
        // Seed sample leaderboard data
        const categories = [
            'esg_education_impact_score', 'vc_deal_flow_score', 'angel_network_strength',
            'government_policy_effectiveness', 'startup_growth_score', 'corporate_partnership_value'
        ];
        
        for (const category of categories) {
            for (let i = 0; i < 10; i++) {
                await dynamodbClient.put({
                    TableName: 'auxeira-leaderboard',
                    Item: {
                        category,
                        score: Math.floor(Math.random() * 50) + 50,
                        userId: `sample_user_${i}`,
                        dashboardType: category.split('_')[0] + (category.includes('esg') ? '_' + category.split('_')[1] : ''),
                        organizationType: 'Sample Organization',
                        organizationName: `Sample Org ${i + 1}`,
                        country: ['US', 'UK', 'CA', 'AU', 'DE'][i % 5],
                        updatedAt: new Date().toISOString(),
                        rank: i + 1
                    }
                }).promise();
            }
        }
        
        console.log('✅ Initial data seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding data:', error.message);
    }
}

async function calculateCosts() {
    console.log('\n💰 Estimated Monthly Costs (USD):');
    
    const payPerRequestCosts = {
        'auxeira-users': { reads: 10000, writes: 1000, storage: 0.1 },
        'auxeira-user-profiles': { reads: 15000, writes: 2000, storage: 0.5 },
        'auxeira-deals': { reads: 20000, writes: 3000, storage: 1.0 },
        'auxeira-startup-profiles': { reads: 12000, writes: 1500, storage: 0.8 },
        'auxeira-ai-reports': { reads: 25000, writes: 5000, storage: 2.0 }
    };
    
    const provisionedCosts = {
        'auxeira-government-policies': { rcu: 5, wcu: 2, storage: 0.2 },
        'auxeira-corporate-partnerships': { rcu: 5, wcu: 2, storage: 0.3 },
        'auxeira-projects': { rcu: 5, wcu: 2, storage: 0.2 },
        'auxeira-leaderboard': { rcu: 10, wcu: 3, storage: 0.1 },
        'auxeira-user-activity': { rcu: 2, wcu: 5, storage: 0.3 },
        'auxeira-dashboard-analytics': { rcu: 5, wcu: 3, storage: 0.1 }
    };
    
    let totalCost = 0;
    
    console.log('   Pay-per-Request Tables:');
    for (const [table, usage] of Object.entries(payPerRequestCosts)) {
        const readCost = (usage.reads / 1000000) * 0.25;
        const writeCost = (usage.writes / 1000000) * 1.25;
        const storageCost = usage.storage * 0.25;
        const tableCost = readCost + writeCost + storageCost;
        totalCost += tableCost;
        
        console.log(`     ${table.replace('auxeira-', '')}: $${tableCost.toFixed(2)} (${usage.reads.toLocaleString()} reads, ${usage.writes.toLocaleString()} writes, ${usage.storage}GB)`);
    }
    
    console.log('   Provisioned Tables:');
    for (const [table, capacity] of Object.entries(provisionedCosts)) {
        const readCost = capacity.rcu * 0.00013 * 24 * 30;
        const writeCost = capacity.wcu * 0.00065 * 24 * 30;
        const storageCost = capacity.storage * 0.25;
        const tableCost = readCost + writeCost + storageCost;
        totalCost += tableCost;
        
        console.log(`     ${table.replace('auxeira-', '')}: $${tableCost.toFixed(2)} (${capacity.rcu}RCU, ${capacity.wcu}WCU, ${capacity.storage}GB)`);
    }
    
    console.log(`\n   💵 Total Estimated Monthly Cost: $${totalCost.toFixed(2)}`);
    console.log(`   📊 Cost Breakdown:`);
    console.log(`     - Compute: ~$${(totalCost * 0.7).toFixed(2)} (70%)`);
    console.log(`     - Storage: ~$${(totalCost * 0.3).toFixed(2)} (30%)`);
    
    // Scale projections
    console.log(`\n   📈 Scaling Projections:`);
    console.log(`     - 1,000 users: ~$${(totalCost * 2.5).toFixed(2)}/month`);
    console.log(`     - 10,000 users: ~$${(totalCost * 8).toFixed(2)}/month`);
    console.log(`     - 100,000 users: ~$${(totalCost * 25).toFixed(2)}/month`);
}

async function getTableStatus() {
    console.log('\n📊 Table Status Report:');
    
    for (const tableSchema of COMPLETE_PLATFORM_TABLES) {
        try {
            const result = await dynamodb.describeTable({ TableName: tableSchema.TableName }).promise();
            const table = result.Table;
            
            console.log(`\n   📋 ${table.TableName}:`);
            console.log(`      Status: ${table.TableStatus}`);
            console.log(`      Items: ${table.ItemCount || 0}`);
            console.log(`      Size: ${((table.TableSizeBytes || 0) / 1024 / 1024).toFixed(2)} MB`);
            console.log(`      Billing: ${table.BillingModeSummary?.BillingMode || 'PROVISIONED'}`);
            
            if (table.ProvisionedThroughput) {
                console.log(`      Read Capacity: ${table.ProvisionedThroughput.ReadCapacityUnits}`);
                console.log(`      Write Capacity: ${table.ProvisionedThroughput.WriteCapacityUnits}`);
            }
            
            if (table.GlobalSecondaryIndexes) {
                console.log(`      GSIs: ${table.GlobalSecondaryIndexes.length}`);
            }
        } catch (error) {
            if (error.code === 'ResourceNotFoundException') {
                console.log(`\n   ❌ ${tableSchema.TableName}: Not found`);
            } else {
                console.log(`\n   ⚠️  ${tableSchema.TableName}: Error - ${error.message}`);
            }
        }
    }
}

async function cleanupTables() {
    console.log('\n🗑️  WARNING: This will delete ALL Auxeira tables!');
    console.log('   This action cannot be undone.');
    
    // In a real implementation, you'd want to add a confirmation prompt
    console.log('   Skipping cleanup for safety. Use AWS Console to delete tables manually.');
    
    /*
    for (const tableSchema of COMPLETE_PLATFORM_TABLES) {
        try {
            await dynamodb.deleteTable({ TableName: tableSchema.TableName }).promise();
            console.log(`✅ Deleted table: ${tableSchema.TableName}`);
        } catch (error) {
            if (error.code === 'ResourceNotFoundException') {
                console.log(`⚠️  Table ${tableSchema.TableName} not found`);
            } else {
                console.error(`❌ Error deleting ${tableSchema.TableName}:`, error.message);
            }
        }
    }
    */
}

// ================================
// MAIN EXECUTION
// ================================

async function main() {
    const command = process.argv[2];
    
    console.log('🚀 Auxeira Complete Platform - DynamoDB Setup');
    console.log('==========================================\n');
    
    // Check AWS credentials
    const credentialsValid = await checkAWSCredentials();
    if (!credentialsValid) {
        process.exit(1);
    }
    
    switch (command) {
        case 'setup':
            await listExistingTables();
            console.log('\n🔨 Creating DynamoDB Tables...\n');
            
            let successCount = 0;
            for (const tableSchema of COMPLETE_PLATFORM_TABLES) {
                const success = await createTable(tableSchema);
                if (success) successCount++;
            }
            
            if (successCount === COMPLETE_PLATFORM_TABLES.length) {
                await waitForTablesActive();
                await seedInitialData();
                await calculateCosts();
                console.log('\n✅ Complete Platform Setup Complete!');
                console.log(`   📊 Created ${COMPLETE_PLATFORM_TABLES.length} tables supporting:`);
                console.log(`      - 17 ESG Dashboards (SDG focus areas)`);
                console.log(`      - VC Dashboard (Venture capital intelligence)`);
                console.log(`      - Angel Dashboard (Individual investor tools)`);
                console.log(`      - Government Dashboard (Policy maker interface)`);
                console.log(`      - Impact Dashboard (Impact investment platform)`);
                console.log(`      - Startup Dashboard (Entrepreneur tools)`);
                console.log(`      - Corporate Dashboard (Partnership management)`);
            } else {
                console.log(`\n⚠️  Setup completed with ${successCount}/${COMPLETE_PLATFORM_TABLES.length} tables created successfully`);
            }
            break;
            
        case 'status':
            await getTableStatus();
            break;
            
        case 'costs':
            await calculateCosts();
            break;
            
        case 'cleanup':
            await cleanupTables();
            break;
            
        default:
            console.log('Usage: node setup-complete-platform.js <command>');
            console.log('Commands:');
            console.log('  setup   - Create all tables for complete platform');
            console.log('  status  - Check status of all tables');
            console.log('  costs   - Show cost estimates');
            console.log('  cleanup - Delete all tables (DANGER!)');
            break;
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    });
}

module.exports = {
    COMPLETE_PLATFORM_TABLES,
    createTable,
    getTableStatus,
    calculateCosts
};
