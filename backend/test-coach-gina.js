/**
 * Test Coach Gina Lambda Function Locally
 */

// Set environment variable
process.env.CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || 'your-claude-api-key-here';

const handler = require('./lambda-coach-gina').handler;

// Test scenarios
const testScenarios = [
    {
        name: 'Early Stage Founder - Churn Problem',
        event: {
            httpMethod: 'POST',
            body: JSON.stringify({
                message: "We're getting signups but everyone leaves after a week. I don't know what's broken.",
                context: {
                    stage: 'Early traction',
                    industry: 'EdTech',
                    geography: 'Johannesburg',
                    teamSize: 2,
                    runway: 8,
                    metrics: {
                        mrr: 0,
                        customers: 50,
                        churnRate: 12,
                        nps: 42
                    }
                },
                conversationHistory: []
            })
        }
    },
    {
        name: 'Series A Founder - Funding Advice',
        event: {
            httpMethod: 'POST',
            body: JSON.stringify({
                message: "I'm preparing for Series A. What should I focus on to improve my chances?",
                context: {
                    stage: 'Series A',
                    industry: 'FinTech',
                    geography: 'Austin',
                    teamSize: 15,
                    runway: 12,
                    metrics: {
                        mrr: 50000,
                        customers: 200,
                        cac: 500,
                        ltv: 2000,
                        churnRate: 3,
                        nps: 68
                    }
                },
                conversationHistory: []
            })
        }
    },
    {
        name: 'Pre-seed Founder - Runway Stress',
        event: {
            httpMethod: 'POST',
            body: JSON.stringify({
                message: "Investors keep saying 'it's too early' but we need cash to survive. What am I missing?",
                context: {
                    stage: 'Pre-seed',
                    industry: 'FinTech',
                    geography: 'Lagos',
                    teamSize: 3,
                    runway: 5,
                    metrics: {
                        mrr: 3000,
                        customers: 15
                    }
                },
                conversationHistory: []
            })
        }
    }
];

async function runTests() {
    console.log('🧪 Testing Coach Gina Lambda Function\n');
    console.log('=' .repeat(80));
    
    for (const scenario of testScenarios) {
        console.log(`\n📋 Test: ${scenario.name}`);
        console.log('-'.repeat(80));
        
        try {
            const startTime = Date.now();
            const response = await handler(scenario.event);
            const duration = Date.now() - startTime;
            
            console.log(`✅ Status: ${response.statusCode}`);
            console.log(`⏱️  Duration: ${duration}ms`);
            
            if (response.statusCode === 200) {
                const body = JSON.parse(response.body);
                console.log(`\n💬 Coach Gina's Response:\n`);
                console.log(body.response);
                console.log(`\n📊 Token Usage: Input=${body.usage.inputTokens}, Output=${body.usage.outputTokens}`);
            } else {
                console.log(`❌ Error: ${response.body}`);
            }
        } catch (error) {
            console.log(`❌ Test Failed: ${error.message}`);
            console.error(error);
        }
        
        console.log('\n' + '='.repeat(80));
        
        // Wait a bit between tests to avoid rate limits
        if (testScenarios.indexOf(scenario) < testScenarios.length - 1) {
            console.log('\n⏳ Waiting 2 seconds before next test...\n');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('\n✅ All tests completed!\n');
}

// Run tests
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
