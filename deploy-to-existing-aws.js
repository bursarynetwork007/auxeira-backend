#!/usr/bin/env node

/**
 * Deploy Auxeira Complete Platform Database to Existing AWS Account
 * Account: 615608124862
 * Region: us-east-1
 */

const AWS = require('aws-sdk');

// Configure AWS for your account
AWS.config.update({
    region: 'us-east-1'
});

const dynamodb = new AWS.DynamoDB();

// Enhanced table schemas for your existing infrastructure
const AUXEIRA_TABLES = [
    {
        TableName: 'auxeira-esg-profiles-prod',
        KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'userId', AttributeType: 'S' },
            { AttributeName: 'dashboardType', AttributeType: 'S' },
            { AttributeName: 'organizationType', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'DashboardTypeIndex',
                KeySchema: [{ AttributeName: 'dashboardType', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' }
            },
            {
                IndexName: 'OrganizationTypeIndex',
                KeySchema: [{ AttributeName: 'organizationType', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },
    
    {
        TableName: 'auxeira-esg-reports-prod',
        KeySchema: [
            { AttributeName: 'reportId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'reportId', AttributeType: 'S' },
            { AttributeName: 'userId', AttributeType: 'S' },
            { AttributeName: 'dashboardType', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'userId-index',
                KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' }
            },
            {
                IndexName: 'dashboardType-index',
                KeySchema: [{ AttributeName: 'dashboardType', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },

    {
        TableName: 'auxeira-vc-deals-prod',
        KeySchema: [
            { AttributeName: 'dealId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'dealId', AttributeType: 'S' },
            { AttributeName: 'investorId', AttributeType: 'S' },
            { AttributeName: 'startupId', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'investorId-index',
                KeySchema: [{ AttributeName: 'investorId', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' }
            },
            {
                IndexName: 'startupId-index',
                KeySchema: [{ AttributeName: 'startupId', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },

    {
        TableName: 'auxeira-startup-profiles-prod',
        KeySchema: [
            { AttributeName: 'startupId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'startupId', AttributeType: 'S' },
            { AttributeName: 'sector', AttributeType: 'S' },
            { AttributeName: 'fundingStage', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'sector-index',
                KeySchema: [{ AttributeName: 'sector', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' }
            },
            {
                IndexName: 'fundingStage-index',
                KeySchema: [{ AttributeName: 'fundingStage', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },

    {
        TableName: 'auxeira-government-policies-prod',
        KeySchema: [
            { AttributeName: 'policyId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'policyId', AttributeType: 'S' },
            { AttributeName: 'country', AttributeType: 'S' },
            { AttributeName: 'sdgAlignment', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'country-index',
                KeySchema: [{ AttributeName: 'country', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' }
            },
            {
                IndexName: 'sdgAlignment-index',
                KeySchema: [{ AttributeName: 'sdgAlignment', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },

    {
        TableName: 'auxeira-corporate-partnerships-prod',
        KeySchema: [
            { AttributeName: 'partnershipId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'partnershipId', AttributeType: 'S' },
            { AttributeName: 'corporateId', AttributeType: 'S' },
            { AttributeName: 'partnershipType', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'corporateId-index',
                KeySchema: [{ AttributeName: 'corporateId', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' }
            },
            {
                IndexName: 'partnershipType-index',
                KeySchema: [{ AttributeName: 'partnershipType', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },

    {
        TableName: 'auxeira-projects-prod',
        KeySchema: [
            { AttributeName: 'projectId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'projectId', AttributeType: 'S' },
            { AttributeName: 'foundationId', AttributeType: 'S' },
            { AttributeName: 'sdgFocus', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'foundationId-index',
                KeySchema: [{ AttributeName: 'foundationId', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' }
            },
            {
                IndexName: 'sdgFocus-index',
                KeySchema: [{ AttributeName: 'sdgFocus', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },

    {
        TableName: 'auxeira-leaderboard-prod',
        KeySchema: [
            { AttributeName: 'category', KeyType: 'HASH' },
            { AttributeName: 'score', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'category', AttributeType: 'S' },
            { AttributeName: 'score', AttributeType: 'N' },
            { AttributeName: 'userId', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'userId-index',
                KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },

    {
        TableName: 'auxeira-market-intelligence-prod',
        KeySchema: [
            { AttributeName: 'sector', KeyType: 'HASH' },
            { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'sector', AttributeType: 'S' },
            { AttributeName: 'timestamp', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST',
        TimeToLiveSpecification: {
            AttributeName: 'ttl',
            Enabled: true
        }
    }
];

async function createTable(tableSchema) {
    try {
        console.log(`🔨 Creating table: ${tableSchema.TableName}`);
        
        const result = await dynamodb.createTable(tableSchema).promise();
        console.log(`✅ Table ${tableSchema.TableName} created successfully`);
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

async function deployTables() {
    console.log('🚀 Deploying Auxeira Complete Platform Database');
    console.log('Account: 615608124862');
    console.log('Region: us-east-1');
    console.log('===============================================\n');

    let successCount = 0;
    
    for (const tableSchema of AUXEIRA_TABLES) {
        const success = await createTable(tableSchema);
        if (success) successCount++;
        
        // Wait a bit between table creations
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n📊 Deployment Summary:`);
    console.log(`   ✅ Successfully created/verified: ${successCount}/${AUXEIRA_TABLES.length} tables`);
    console.log(`\n🎯 Tables supporting complete dashboard ecosystem:`);
    console.log(`   - ESG Profiles & Reports (17 SDG focus areas)`);
    console.log(`   - VC Deals & Portfolio Management`);
    console.log(`   - Startup Profiles & Funding Opportunities`);
    console.log(`   - Government Policies & Impact Analysis`);
    console.log(`   - Corporate Partnerships & Share Value`);
    console.log(`   - Cross-platform Projects & Collaboration`);
    console.log(`   - Competitive Leaderboards & Benchmarking`);
    console.log(`   - Market Intelligence & Analytics`);

    console.log(`\n💰 Estimated Monthly Cost: $35-60 (Pay-per-request)`);
    console.log(`\n🔗 Integration with existing infrastructure:`);
    console.log(`   - API Gateway: https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod`);
    console.log(`   - Lambda Function: auxeira-backend-prod-api`);
    console.log(`   - S3 Bucket: dashboard.auxeira.com`);
    console.log(`   - CloudFront: d2nwfm8dh1kp59.cloudfront.net`);
}

deployTables().catch(console.error);
