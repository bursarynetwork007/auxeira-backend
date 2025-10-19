/**
 * Auxeira Central Database Generator
 * Generates 1,000 realistic startup cases with rolling 365-day data
 * Simulates real outcomes, metrics, and performance indicators
 */

const fs = require('fs');
const path = require('path');

// Configuration
const NUM_STARTUPS = 1000;
const DAYS_HISTORY = 365;
const TODAY = new Date();

// Industry sectors
const INDUSTRIES = [
    'FinTech', 'HealthTech', 'EdTech', 'CleanTech', 'AgriTech',
    'E-commerce', 'SaaS', 'AI/ML', 'Blockchain', 'IoT',
    'Cybersecurity', 'BioTech', 'PropTech', 'FoodTech', 'Logistics'
];

// Funding stages
const STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C'];

// Countries
const COUNTRIES = [
    'USA', 'UK', 'Germany', 'France', 'Singapore', 'India', 'Nigeria',
    'Kenya', 'South Africa', 'Brazil', 'Canada', 'Australia', 'UAE'
];

// Helper: Random number in range
const random = (min, max) => Math.random() * (max - min) + min;
const randomInt = (min, max) => Math.floor(random(min, max));

// Helper: Random item from array
const randomItem = (arr) => arr[randomInt(0, arr.length)];

// Helper: Generate date in past N days
const pastDate = (daysAgo) => {
    const date = new Date(TODAY);
    date.setDate(date.getDate() - daysAgo);
    return date;
};

// Helper: Normal distribution (Box-Muller transform)
const normalRandom = (mean, stdDev) => {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
};

// Generate startup profile
function generateStartup(id) {
    const industry = randomItem(INDUSTRIES);
    const stage = randomItem(STAGES);
    const country = randomItem(COUNTRIES);
    const foundedDaysAgo = randomInt(180, 1825); // 6 months to 5 years
    const foundedDate = pastDate(foundedDaysAgo);
    
    // Stage-based metrics
    const stageMultipliers = {
        'Pre-seed': { funding: 0.1, valuation: 1, team: 3, customers: 10 },
        'Seed': { funding: 0.5, valuation: 3, team: 8, customers: 100 },
        'Series A': { funding: 5, valuation: 15, team: 25, customers: 1000 },
        'Series B': { funding: 20, valuation: 50, team: 75, customers: 10000 },
        'Series C': { funding: 50, valuation: 150, team: 200, customers: 50000 }
    };
    
    const multiplier = stageMultipliers[stage];
    
    // Financial metrics
    const totalFunding = random(multiplier.funding * 0.5, multiplier.funding * 2) * 1000000;
    const valuation = random(multiplier.valuation * 0.7, multiplier.valuation * 1.5) * 1000000;
    const mrr = random(multiplier.funding * 10000, multiplier.funding * 50000);
    const arr = mrr * 12;
    const burnRate = random(multiplier.funding * 5000, multiplier.funding * 20000);
    const runway = (totalFunding * 0.6) / burnRate; // months
    
    // Customer metrics
    const totalCustomers = randomInt(multiplier.customers * 0.5, multiplier.customers * 2);
    const activeCustomers = Math.floor(totalCustomers * random(0.6, 0.9));
    const churnRate = random(2, 15); // % monthly
    
    // Unit economics
    const cac = random(50, 500);
    const ltv = cac * random(2, 8);
    const ltvCacRatio = ltv / cac;
    
    // Team metrics
    const teamSize = randomInt(multiplier.team * 0.7, multiplier.team * 1.5);
    const engineersPercent = random(30, 60);
    
    // Performance scores
    const marketScore = normalRandom(65, 15);
    const managementScore = normalRandom(70, 12);
    const fundingScore = normalRandom(60, 18);
    const operationalScore = normalRandom(68, 14);
    
    // SSE Score (weighted average)
    const sseScore = Math.round(
        marketScore * 0.25 +
        managementScore * 0.30 +
        fundingScore * 0.25 +
        operationalScore * 0.20
    );
    
    // Success probability based on metrics
    const successFactors = [
        ltvCacRatio > 3 ? 1 : 0.5,
        runway > 12 ? 1 : 0.6,
        churnRate < 5 ? 1 : 0.7,
        sseScore > 75 ? 1 : 0.8
    ];
    const successProbability = successFactors.reduce((a, b) => a * b, 0.7) * 100;
    
    return {
        id: `STR-${String(id).padStart(4, '0')}`,
        name: `${randomItem(['Tech', 'Smart', 'Next', 'Future', 'Bright', 'Rapid', 'Swift', 'Peak'])} ${industry.replace('Tech', '')} ${randomItem(['Solutions', 'Platform', 'Systems', 'Labs', 'Ventures'])}`,
        industry,
        stage,
        country,
        foundedDate: foundedDate.toISOString(),
        foundedDaysAgo,
        
        // Financial
        totalFunding,
        valuation,
        mrr,
        arr,
        burnRate,
        runway,
        
        // Customers
        totalCustomers,
        activeCustomers,
        churnRate,
        
        // Unit Economics
        cac,
        ltv,
        ltvCacRatio,
        
        // Team
        teamSize,
        engineersPercent,
        
        // Scores
        marketScore: Math.round(marketScore),
        managementScore: Math.round(managementScore),
        fundingScore: Math.round(fundingScore),
        operationalScore: Math.round(operationalScore),
        sseScore,
        
        // Predictions
        successProbability: Math.round(successProbability),
        riskLevel: successProbability > 70 ? 'Low' : successProbability > 50 ? 'Medium' : 'High',
        
        // Metadata
        createdAt: foundedDate.toISOString(),
        updatedAt: new Date().toISOString()
    };
}

// Generate time series data for a startup
function generateTimeSeries(startup) {
    const timeSeries = [];
    const growthRate = random(0.02, 0.15); // 2-15% monthly growth
    const volatility = random(0.05, 0.2);
    
    for (let day = DAYS_HISTORY; day >= 0; day--) {
        const date = pastDate(day);
        const monthProgress = day / 30;
        const growth = Math.pow(1 + growthRate, -monthProgress);
        const noise = 1 + normalRandom(0, volatility);
        
        timeSeries.push({
            date: date.toISOString().split('T')[0],
            mrr: Math.round(startup.mrr * growth * noise),
            customers: Math.round(startup.totalCustomers * growth * noise),
            activeUsers: Math.round(startup.activeCustomers * growth * noise),
            revenue: Math.round(startup.mrr * growth * noise * random(0.8, 1.2)),
            expenses: Math.round(startup.burnRate * growth * noise),
            sseScore: Math.round(startup.sseScore * (0.9 + growth * 0.1) * (1 + normalRandom(0, 0.05)))
        });
    }
    
    return timeSeries;
}

// Generate investor portfolio data
function generateInvestorPortfolio(startups) {
    const investors = [];
    const investorNames = [
        'Sequoia Capital', 'Andreessen Horowitz', 'Y Combinator', 'Accel Partners',
        'Kleiner Perkins', 'Benchmark Capital', 'Greylock Partners', 'Index Ventures',
        'Lightspeed Venture', 'First Round Capital', 'Tiger Global', 'SoftBank Vision',
        'Insight Partners', 'General Catalyst', 'NEA', 'Bessemer Venture'
    ];
    
    investorNames.forEach((name, idx) => {
        const portfolioSize = randomInt(20, 80);
        const portfolio = [];
        const investorStartups = [];
        
        for (let i = 0; i < portfolioSize; i++) {
            const startup = randomItem(startups);
            const investmentAmount = random(0.1, 0.3) * startup.totalFunding;
            const equity = random(5, 25);
            const currentValue = (startup.valuation * equity) / 100;
            const multiple = currentValue / investmentAmount;
            
            investorStartups.push(startup.id);
            portfolio.push({
                startupId: startup.id,
                startupName: startup.name,
                investmentAmount,
                equity,
                currentValue,
                multiple,
                stage: startup.stage,
                investmentDate: pastDate(randomInt(30, startup.foundedDaysAgo)).toISOString()
            });
        }
        
        const totalInvested = portfolio.reduce((sum, p) => sum + p.investmentAmount, 0);
        const totalValue = portfolio.reduce((sum, p) => sum + p.currentValue, 0);
        const avgMultiple = totalValue / totalInvested;
        
        investors.push({
            id: `INV-${String(idx + 1).padStart(3, '0')}`,
            name,
            type: randomItem(['VC', 'Angel', 'Corporate']),
            portfolioSize,
            totalInvested,
            totalValue,
            avgMultiple,
            portfolio,
            startups: investorStartups
        });
    });
    
    return investors;
}

// Generate ESG impact data
function generateESGData(startups) {
    const sdgs = [
        'No Poverty', 'Zero Hunger', 'Good Health', 'Quality Education',
        'Gender Equality', 'Clean Water', 'Affordable Energy', 'Decent Work',
        'Innovation', 'Reduced Inequalities', 'Sustainable Cities',
        'Responsible Consumption', 'Climate Action', 'Life Below Water',
        'Life on Land', 'Peace & Justice', 'Partnerships'
    ];
    
    return startups.map(startup => {
        const primarySDG = randomItem(sdgs);
        const impactScore = normalRandom(65, 15);
        const beneficiaries = randomInt(1000, 1000000);
        const carbonReduction = random(0, 10000); // tons CO2
        
        return {
            startupId: startup.id,
            primarySDG,
            impactScore: Math.round(Math.max(0, Math.min(100, impactScore))),
            beneficiaries,
            carbonReduction,
            socialImpact: Math.round(random(50, 95)),
            environmentalImpact: Math.round(random(40, 90)),
            governanceScore: Math.round(random(60, 95))
        };
    });
}

// Main generation function
function generateDatabase() {
    console.log('🚀 Generating Auxeira Central Database...\n');
    
    // Generate startups
    console.log('📊 Generating 1,000 startup cases...');
    const startups = [];
    for (let i = 1; i <= NUM_STARTUPS; i++) {
        startups.push(generateStartup(i));
        if (i % 100 === 0) console.log(`   Generated ${i} startups...`);
    }
    
    // Generate time series
    console.log('\n📈 Generating 365-day time series data...');
    const timeSeriesData = {};
    startups.forEach((startup, idx) => {
        timeSeriesData[startup.id] = generateTimeSeries(startup);
        if ((idx + 1) % 100 === 0) console.log(`   Generated time series for ${idx + 1} startups...`);
    });
    
    // Generate investor data
    console.log('\n💼 Generating investor portfolio data...');
    const investors = generateInvestorPortfolio(startups);
    
    // Generate ESG data
    console.log('\n🌍 Generating ESG impact data...');
    const esgData = generateESGData(startups);
    
    // Calculate aggregate statistics
    const stats = {
        totalStartups: startups.length,
        totalFunding: startups.reduce((sum, s) => sum + s.totalFunding, 0),
        avgValuation: startups.reduce((sum, s) => sum + s.valuation, 0) / startups.length,
        avgSSEScore: startups.reduce((sum, s) => sum + s.sseScore, 0) / startups.length,
        byStage: {},
        byIndustry: {},
        byCountry: {},
        generatedAt: new Date().toISOString()
    };
    
    STAGES.forEach(stage => {
        const stageStartups = startups.filter(s => s.stage === stage);
        stats.byStage[stage] = {
            count: stageStartups.length,
            avgValuation: stageStartups.reduce((sum, s) => sum + s.valuation, 0) / stageStartups.length,
            avgSSE: stageStartups.reduce((sum, s) => sum + s.sseScore, 0) / stageStartups.length
        };
    });
    
    INDUSTRIES.forEach(industry => {
        const industryStartups = startups.filter(s => s.industry === industry);
        stats.byIndustry[industry] = industryStartups.length;
    });
    
    COUNTRIES.forEach(country => {
        const countryStartups = startups.filter(s => s.country === country);
        stats.byCountry[country] = countryStartups.length;
    });
    
    // Create database object
    const database = {
        metadata: {
            version: '1.0.0',
            generatedAt: new Date().toISOString(),
            totalStartups: NUM_STARTUPS,
            daysHistory: DAYS_HISTORY,
            description: 'Auxeira Central Database - 1,000 realistic startup cases with 365-day rolling data'
        },
        startups,
        timeSeries: timeSeriesData,
        investors,
        esgData,
        stats
    };
    
    // Save to file
    const dbPath = path.join(__dirname, 'database.json');
    console.log('\n💾 Saving database to file...');
    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
    
    console.log('\n✅ Database generated successfully!');
    console.log(`\n📁 Location: ${dbPath}`);
    console.log(`📊 Size: ${(fs.statSync(dbPath).size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`\n📈 Statistics:`);
    console.log(`   - Total Startups: ${stats.totalStartups}`);
    console.log(`   - Total Funding: $${(stats.totalFunding / 1e9).toFixed(2)}B`);
    console.log(`   - Avg Valuation: $${(stats.avgValuation / 1e6).toFixed(2)}M`);
    console.log(`   - Avg SSE Score: ${stats.avgSSEScore.toFixed(1)}`);
    console.log(`   - Investors: ${investors.length}`);
    console.log(`   - Time Series Records: ${Object.keys(timeSeriesData).length * DAYS_HISTORY}`);
    
    return database;
}

// Run if executed directly
if (require.main === module) {
    generateDatabase();
}

module.exports = { generateDatabase };

