#!/usr/bin/env node

/**
 * Auxeira ESG Platform - DynamoDB Setup and Configuration
 * Cost-effective database deployment for production use
 */

const AWS = require('aws-sdk');
const { createTables, TABLES } = require('./dynamodb-central-database');

// Configure AWS
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();
const dynamodbClient = new AWS.DynamoDB.DocumentClient();

// ================================
// COST OPTIMIZATION CONFIGURATIONS
// ================================

const COST_OPTIMIZED_TABLES = {
    // Primary tables with higher usage
    [TABLES.USERS]: {
        BillingMode: 'PAY_PER_REQUEST', // Most cost-effective for variable usage
        StreamSpecification: {
            StreamEnabled: true,
            StreamViewType: 'NEW_AND_OLD_IMAGES'
        }
    },
    
    [TABLES.USER_PROFILES]: {
        BillingMode: 'PAY_PER_REQUEST',
        StreamSpecification: {
            StreamEnabled: true,
            StreamViewType: 'NEW_AND_OLD_IMAGES'
        }
    },
    
    [TABLES.ESG_REPORTS]: {
        BillingMode: 'PAY_PER_REQUEST',
        StreamSpecification: {
            StreamEnabled: true,
            StreamViewType: 'NEW_AND_OLD_IMAGES'
        },
        TimeToLiveSpecification: {
            AttributeName: 'ttl',
            Enabled: true // Auto-delete old reports to save costs
        }
    },
    
    // Secondary tables with lower usage
    [TABLES.PROJECTS]: {
        BillingMode: 'PROVISIONED',
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 2
        }
    },
    
    [TABLES.LEADERBOARD]: {
        BillingMode: 'PROVISIONED',
        ProvisionedThroughput: {
            ReadCapacityUnits: 10, // Higher reads for leaderboard queries
            WriteCapacityUnits: 3
        }
    },
    
    // Analytics tables with minimal usage
    [TABLES.USER_ACTIVITY]: {
        BillingMode: 'PROVISIONED',
        ProvisionedThroughput: {
            ReadCapacityUnits: 2,
            WriteCapacityUnits: 5
        },
        TimeToLiveSpecification: {
            AttributeName: 'ttl',
            Enabled: true // Auto-delete old activity logs
        }
    }
};

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
        const auxeiraTables = result.TableNames.filter(name => 
            name.startsWith('auxeira-')
        );
        
        console.log('\n📋 Existing Auxeira Tables:');
        if (auxeiraTables.length === 0) {
            console.log('   No existing tables found');
        } else {
            auxeiraTables.forEach(table => {
                console.log(`   ✓ ${table}`);
            });
        }
        
        return auxeiraTables;
    } catch (error) {
        console.error('❌ Error listing tables:', error.message);
        return [];
    }
}

async function createOptimizedTable(tableName, schema) {
    try {
        console.log(`\n🔨 Creating table: ${tableName}`);
        
        // Apply cost optimizations
        const optimizedSchema = {
            ...schema,
            ...COST_OPTIMIZED_TABLES[tableName]
        };
        
        const result = await dynamodb.createTable(optimizedSchema).promise();
        
        console.log(`✅ Table ${tableName} created successfully`);
        console.log(`   Billing Mode: ${optimizedSchema.BillingMode}`);
        
        if (optimizedSchema.BillingMode === 'PROVISIONED') {
            console.log(`   Read Capacity: ${optimizedSchema.ProvisionedThroughput.ReadCapacityUnits}`);
            console.log(`   Write Capacity: ${optimizedSchema.ProvisionedThroughput.WriteCapacityUnits}`);
        }
        
        return result;
    } catch (error) {
        if (error.code === 'ResourceInUseException') {
            console.log(`⚠️  Table ${tableName} already exists`);
            return null;
        } else {
            console.error(`❌ Error creating table ${tableName}:`, error.message);
            throw error;
        }
    }
}

async function waitForTableActive(tableName) {
    console.log(`⏳ Waiting for table ${tableName} to become active...`);
    
    try {
        await dynamodb.waitFor('tableExists', {
            TableName: tableName,
            $waiter: {
                delay: 5,
                maxAttempts: 20
            }
        }).promise();
        
        console.log(`✅ Table ${tableName} is now active`);
        return true;
    } catch (error) {
        console.error(`❌ Table ${tableName} failed to become active:`, error.message);
        return false;
    }
}

async function seedInitialData() {
    console.log('\n🌱 Seeding initial data...');
    
    try {
        // Create system metrics entry
        await dynamodbClient.put({
            TableName: TABLES.SYSTEM_METRICS,
            Item: {
                metricType: 'system_health',
                timestamp: new Date().toISOString(),
                value: 100,
                metadata: JSON.stringify({
                    version: '2.0',
                    deployment: 'production',
                    region: process.env.AWS_REGION || 'us-east-1'
                })
            }
        }).promise();
        
        // Create initial leaderboard categories
        const categories = [
            'esg_impact_score',
            'carbon_reduction',
            'social_impact',
            'governance_score',
            'roi_performance'
        ];
        
        for (const category of categories) {
            await dynamodbClient.put({
                TableName: TABLES.LEADERBOARD,
                Item: {
                    category,
                    score: 0,
                    userId: 'system',
                    organizationType: 'System',
                    organizationName: 'Auxeira Platform',
                    country: 'Global',
                    updatedAt: new Date().toISOString()
                }
            }).promise();
        }
        
        console.log('✅ Initial data seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding initial data:', error.message);
    }
}

async function calculateMonthlyCosts() {
    console.log('\n💰 Estimated Monthly Costs (USD):');
    
    const costs = {
        // Pay-per-request tables (primary usage)
        users: { reads: 10000, writes: 1000, storage: 0.1 },
        profiles: { reads: 15000, writes: 2000, storage: 0.5 },
        reports: { reads: 25000, writes: 5000, storage: 2.0 },
        
        // Provisioned tables (secondary usage)
        projects: { readCapacity: 5, writeCapacity: 2, storage: 0.2 },
        leaderboard: { readCapacity: 10, writeCapacity: 3, storage: 0.1 },
        activity: { readCapacity: 2, writeCapacity: 5, storage: 0.3 }
    };
    
    let totalCost = 0;
    
    // Pay-per-request pricing (us-east-1)
    const payPerRequestReadCost = 0.25 / 1000000; // $0.25 per million reads
    const payPerRequestWriteCost = 1.25 / 1000000; // $1.25 per million writes
    const storageCost = 0.25; // $0.25 per GB per month
    
    // Provisioned pricing (us-east-1)
    const provisionedReadCost = 0.00013 * 24 * 30; // $0.00013 per hour per RCU
    const provisionedWriteCost = 0.00065 * 24 * 30; // $0.00065 per hour per WCU
    
    console.log('   Pay-per-Request Tables:');
    ['users', 'profiles', 'reports'].forEach(table => {
        const cost = costs[table];
        const readCost = cost.reads * payPerRequestReadCost;
        const writeCost = cost.writes * payPerRequestWriteCost;
        const storeCost = cost.storage * storageCost;
        const tableCost = readCost + writeCost + storeCost;
        
        console.log(`     ${table}: $${tableCost.toFixed(2)} (${cost.reads} reads, ${cost.writes} writes, ${cost.storage}GB)`);
        totalCost += tableCost;
    });
    
    console.log('   Provisioned Tables:');
    ['projects', 'leaderboard', 'activity'].forEach(table => {
        const cost = costs[table];
        const readCost = cost.readCapacity * provisionedReadCost;
        const writeCost = cost.writeCapacity * provisionedWriteCost;
        const storeCost = cost.storage * storageCost;
        const tableCost = readCost + writeCost + storeCost;
        
        console.log(`     ${table}: $${tableCost.toFixed(2)} (${cost.readCapacity}RCU, ${cost.writeCapacity}WCU, ${cost.storage}GB)`);
        totalCost += tableCost;
    });
    
    console.log(`\n   💵 Total Estimated Monthly Cost: $${totalCost.toFixed(2)}`);
    console.log('   📊 Cost Breakdown:');
    console.log(`     - Compute: ~${((totalCost * 0.7).toFixed(2))} (70%)`);
    console.log(`     - Storage: ~${((totalCost * 0.3).toFixed(2))} (30%)`);
    console.log('\n   💡 Cost Optimization Tips:');
    console.log('     - Use TTL to auto-delete old reports and activity logs');
    console.log('     - Monitor usage and adjust provisioned capacity');
    console.log('     - Consider DynamoDB On-Demand for unpredictable workloads');
}

async function setupDynamoDB() {
    console.log('🚀 Auxeira ESG Platform - DynamoDB Setup');
    console.log('==========================================\n');
    
    // Check credentials
    const credentialsValid = await checkAWSCredentials();
    if (!credentialsValid) {
        process.exit(1);
    }
    
    // List existing tables
    const existingTables = await listExistingTables();
    
    // Create tables
    console.log('\n🔨 Creating DynamoDB Tables...');
    
    const tableSchemas = [
        { name: TABLES.USERS, schema: require('./dynamodb-central-database').UsersTableSchema },
        { name: TABLES.USER_PROFILES, schema: require('./dynamodb-central-database').UserProfilesTableSchema },
        { name: TABLES.ESG_REPORTS, schema: require('./dynamodb-central-database').ESGReportsTableSchema },
        { name: TABLES.PROJECTS, schema: require('./dynamodb-central-database').ProjectsTableSchema },
        { name: TABLES.LEADERBOARD, schema: require('./dynamodb-central-database').LeaderboardTableSchema }
    ];
    
    const createdTables = [];
    
    for (const { name, schema } of tableSchemas) {
        if (!existingTables.includes(name)) {
            const result = await createOptimizedTable(name, schema);
            if (result) {
                createdTables.push(name);
            }
        }
    }
    
    // Wait for tables to become active
    if (createdTables.length > 0) {
        console.log('\n⏳ Waiting for tables to become active...');
        for (const tableName of createdTables) {
            await waitForTableActive(tableName);
        }
    }
    
    // Seed initial data
    if (createdTables.length > 0) {
        await seedInitialData();
    }
    
    // Calculate costs
    await calculateMonthlyCosts();
    
    console.log('\n✅ DynamoDB Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Update your backend environment variables:');
    console.log('      - AWS_REGION=us-east-1');
    console.log('      - AWS_ACCESS_KEY_ID=your_key');
    console.log('      - AWS_SECRET_ACCESS_KEY=your_secret');
    console.log('   2. Test the database connection');
    console.log('   3. Deploy your backend with DynamoDB integration');
    console.log('   4. Monitor costs in AWS CloudWatch');
}

// ================================
// CLI COMMANDS
// ================================

async function deleteAllTables() {
    console.log('🗑️  Deleting all Auxeira tables...');
    
    const existingTables = await listExistingTables();
    
    for (const tableName of existingTables) {
        try {
            await dynamodb.deleteTable({ TableName: tableName }).promise();
            console.log(`✅ Deleted table: ${tableName}`);
        } catch (error) {
            console.error(`❌ Error deleting table ${tableName}:`, error.message);
        }
    }
}

async function showTableStatus() {
    console.log('📊 Table Status Report:');
    
    const existingTables = await listExistingTables();
    
    for (const tableName of existingTables) {
        try {
            const result = await dynamodb.describeTable({ TableName: tableName }).promise();
            const table = result.Table;
            
            console.log(`\n   📋 ${tableName}:`);
            console.log(`      Status: ${table.TableStatus}`);
            console.log(`      Items: ${table.ItemCount || 0}`);
            console.log(`      Size: ${((table.TableSizeBytes || 0) / 1024 / 1024).toFixed(2)} MB`);
            console.log(`      Billing: ${table.BillingModeSummary?.BillingMode || 'PROVISIONED'}`);
            
            if (table.ProvisionedThroughput) {
                console.log(`      Read Capacity: ${table.ProvisionedThroughput.ReadCapacityUnits}`);
                console.log(`      Write Capacity: ${table.ProvisionedThroughput.WriteCapacityUnits}`);
            }
        } catch (error) {
            console.error(`❌ Error describing table ${tableName}:`, error.message);
        }
    }
}

// ================================
// MAIN EXECUTION
// ================================

if (require.main === module) {
    const command = process.argv[2];
    
    switch (command) {
        case 'setup':
            setupDynamoDB().catch(console.error);
            break;
        case 'delete':
            deleteAllTables().catch(console.error);
            break;
        case 'status':
            showTableStatus().catch(console.error);
            break;
        case 'costs':
            calculateMonthlyCosts().catch(console.error);
            break;
        default:
            console.log('Usage: node setup-dynamodb.js [command]');
            console.log('Commands:');
            console.log('  setup  - Create all DynamoDB tables');
            console.log('  delete - Delete all Auxeira tables');
            console.log('  status - Show table status and statistics');
            console.log('  costs  - Calculate estimated monthly costs');
    }
}

module.exports = {
    setupDynamoDB,
    deleteAllTables,
    showTableStatus,
    calculateMonthlyCosts
};
