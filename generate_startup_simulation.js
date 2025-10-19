const fs = require('fs');

// Generate 1000 realistic startup profiles
function generateStartupSimulation() {
    const sectors = ['Fintech', 'HealthTech', 'EdTech', 'CleanTech', 'AgriTech', 'AI/ML', 'Cybersecurity', 'E-commerce', 'SaaS', 'Biotech'];
    const stages = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C'];
    const countries = ['Nigeria', 'South Africa', 'Kenya', 'Ghana', 'Egypt', 'Morocco', 'Tanzania', 'Uganda', 'Rwanda', 'Senegal'];
    
    const startups = [];
    const now = new Date();
    
    for (let i = 1; i <= 1000; i++) {
        // Generate random date within last 365 days
        const daysAgo = Math.floor(Math.random() * 365);
        const timestamp = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        
        const sector = sectors[Math.floor(Math.random() * sectors.length)];
        const stage = stages[Math.floor(Math.random() * stages.length)];
        const country = countries[Math.floor(Math.random() * countries.length)];
        
        // Generate realistic metrics based on stage
        const stageMultipliers = {
            'Pre-Seed': { funding: 50000, employees: 3, mrr: 5000, sse: 45 },
            'Seed': { funding: 500000, employees: 8, mrr: 25000, sse: 60 },
            'Series A': { funding: 3000000, employees: 25, mrr: 150000, sse: 75 },
            'Series B': { funding: 15000000, employees: 75, mrr: 800000, sse: 85 },
            'Series C': { funding: 50000000, employees: 200, mrr: 2500000, sse: 90 }
        };
        
        const base = stageMultipliers[stage];
        const variance = 0.3; // 30% variance
        
        const startup = {
            startup_id: `startup_${i.toString().padStart(4, '0')}`,
            company_name: `${sector}Corp ${i}`,
            founder: `Founder ${i}`,
            sector: sector,
            country: country,
            funding_stage: stage,
            funding_raised: Math.round(base.funding * (1 + (Math.random() - 0.5) * variance)),
            employees: Math.round(base.employees * (1 + (Math.random() - 0.5) * variance)),
            mrr: Math.round(base.mrr * (1 + (Math.random() - 0.5) * variance)),
            runway_months: Math.round(12 + Math.random() * 24), // 12-36 months
            sse_score: Math.round(base.sse + (Math.random() - 0.5) * 20),
            growth_rate: (Math.random() * 50 + 10).toFixed(1), // 10-60% growth
            churn_rate: (Math.random() * 5).toFixed(1), // 0-5% churn
            last_updated: timestamp.toISOString(),
            created_at: timestamp.toISOString(),
            valuation: Math.round(base.funding * (2 + Math.random() * 3)), // 2-5x funding
            revenue_12m: Math.round(base.mrr * 12 * (1 + Math.random())),
            jobs_created: Math.round(base.employees * (1.5 + Math.random())),
            impact_score: Math.round(50 + Math.random() * 50)
        };
        
        startups.push(startup);
    }
    
    return {
        total_startups: 1000,
        generated_at: now.toISOString(),
        data_range_days: 365,
        startups: startups
    };
}

// Generate and save the data
console.log('🚀 Generating 1000 startup simulation profiles...');
const simulationData = generateStartupSimulation();

// Save to dashboard-html directory
fs.writeFileSync('./dashboard-html/sim-data.json', JSON.stringify(simulationData, null, 2));
console.log('✅ Generated 1000 startup profiles with rolling 365-day timestamps');
console.log(`📊 File size: ${(fs.statSync('./dashboard-html/sim-data.json').size / 1024 / 1024).toFixed(2)} MB`);
console.log('📍 Saved to: ./dashboard-html/sim-data.json');

// Show sample data
console.log('\n📋 Sample startup profile:');
console.log(JSON.stringify(simulationData.startups[0], null, 2));
