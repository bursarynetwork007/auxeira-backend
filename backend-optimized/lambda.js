/**
 * AWS Lambda Handler for Auxeira Backend API
 * Wraps Express.js server for serverless deployment
 */

const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
    origin: [
        'https://dashboard.auxeira.com',
        'https://auxeira.com',
        'http://localhost:3000',
        'http://localhost:8080'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Load database
let database = { startups: [], timeSeries: [] };
try {
    const dbPath = path.join(__dirname, 'database.json');
    if (fs.existsSync(dbPath)) {
        const dbContent = fs.readFileSync(dbPath, 'utf8');
        database = JSON.parse(dbContent);
        console.log(`Loaded ${database.startups.length} startups from database`);
    }
} catch (error) {
    console.error('Error loading database:', error);
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: {
            startups: database.startups.length,
            timeSeries: database.timeSeries.length
        }
    });
});

// API Routes

// Get all startups (paginated)
app.get('/api/startups', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const startups = database.startups.slice(skip, skip + limit);
    
    res.json({
        data: startups,
        pagination: {
            page,
            limit,
            total: database.startups.length,
            pages: Math.ceil(database.startups.length / limit)
        }
    });
});

// Get single startup
app.get('/api/startups/:id', (req, res) => {
    const startup = database.startups.find(s => s.id === req.params.id);
    
    if (!startup) {
        return res.status(404).json({ error: 'Startup not found' });
    }
    
    res.json(startup);
});

// Get startup time series data
app.get('/api/startups/:id/timeseries', (req, res) => {
    const timeSeries = database.timeSeries.filter(ts => ts.startupId === req.params.id);
    
    if (timeSeries.length === 0) {
        return res.status(404).json({ error: 'Time series data not found' });
    }
    
    res.json(timeSeries);
});

// Get startup dashboard data
app.get('/api/dashboard/startup', (req, res) => {
    const startupId = req.query.id || database.startups[0]?.id;
    const startup = database.startups.find(s => s.id === startupId);
    
    if (!startup) {
        return res.status(404).json({ error: 'Startup not found' });
    }
    
    const timeSeries = database.timeSeries.filter(ts => ts.startupId === startupId);
    
    res.json({
        startup,
        timeSeries,
        metrics: {
            sseScore: startup.sseScore,
            valuation: startup.valuation,
            mrr: startup.mrr,
            arr: startup.arr,
            burnRate: startup.burnRate,
            runway: startup.runway,
            ltvCacRatio: startup.ltvCacRatio,
            totalCustomers: startup.totalCustomers,
            activeCustomers: startup.activeCustomers,
            churnRate: startup.churnRate
        }
    });
});

// Get VC dashboard data
app.get('/api/dashboard/vc', (req, res) => {
    const vcId = req.query.id || 'vc-001';
    const portfolioStartups = database.startups.filter(s => s.investors.includes(vcId));
    
    const totalInvested = portfolioStartups.reduce((sum, s) => sum + s.totalFunding, 0);
    const totalValuation = portfolioStartups.reduce((sum, s) => sum + s.valuation, 0);
    const avgSSE = portfolioStartups.reduce((sum, s) => sum + s.sseScore, 0) / portfolioStartups.length;
    
    res.json({
        portfolioSize: portfolioStartups.length,
        totalInvested,
        totalValuation,
        averageSSE: Math.round(avgSSE),
        startups: portfolioStartups,
        performance: {
            topPerformers: portfolioStartups.filter(s => s.sseScore >= 75).length,
            atRisk: portfolioStartups.filter(s => s.sseScore < 50).length
        }
    });
});

// Get ESG dashboard data
app.get('/api/dashboard/esg/:sdg', (req, res) => {
    const sdg = req.params.sdg;
    const esgStartups = database.startups.filter(s => 
        s.esgMetrics && s.esgMetrics.primarySDG === sdg
    );
    
    const totalImpact = esgStartups.reduce((sum, s) => 
        sum + (s.esgMetrics?.beneficiaries || 0), 0
    );
    
    res.json({
        sdg,
        startupsCount: esgStartups.length,
        totalBeneficiaries: totalImpact,
        startups: esgStartups,
        topImpact: esgStartups.sort((a, b) => 
            (b.esgMetrics?.impactScore || 0) - (a.esgMetrics?.impactScore || 0)
        ).slice(0, 10)
    });
});

// Search startups
app.get('/api/search', (req, res) => {
    const query = req.query.q?.toLowerCase() || '';
    
    const results = database.startups.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.industry.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
    );
    
    res.json({
        query,
        count: results.length,
        results
    });
});

// Get aggregate statistics
app.get('/api/stats', (req, res) => {
    const stats = {
        totalStartups: database.startups.length,
        totalValuation: database.startups.reduce((sum, s) => sum + s.valuation, 0),
        totalFunding: database.startups.reduce((sum, s) => sum + s.totalFunding, 0),
        averageSSE: database.startups.reduce((sum, s) => sum + s.sseScore, 0) / database.startups.length,
        byIndustry: {},
        byStage: {},
        byCountry: {}
    };
    
    database.startups.forEach(s => {
        stats.byIndustry[s.industry] = (stats.byIndustry[s.industry] || 0) + 1;
        stats.byStage[s.stage] = (stats.byStage[s.stage] || 0) + 1;
        stats.byCountry[s.country] = (stats.byCountry[s.country] || 0) + 1;
    });
    
    res.json(stats);
});

// Configuration endpoints (secure)
app.get('/api/config/paystack-public-key', (req, res) => {
    res.json({
        publicKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder'
    });
});

// Authentication endpoints (placeholder - implement with JWT)
app.post('/auth/login', (req, res) => {
    // TODO: Implement actual authentication
    res.json({
        success: true,
        token: 'placeholder-jwt-token',
        user: {
            id: 'user-001',
            email: req.body.email,
            type: 'startup'
        }
    });
});

app.post('/auth/signup', (req, res) => {
    // TODO: Implement actual signup
    res.json({
        success: true,
        message: 'Account created successfully'
    });
});

app.get('/auth/verify', (req, res) => {
    // TODO: Implement token verification
    res.json({
        valid: true,
        user: { id: 'user-001', email: 'test@example.com' }
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path
    });
});

// Export Lambda handler
module.exports.handler = serverless(app);

// Export health check separately
module.exports.health = async (event) => {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: {
                startups: database.startups.length
            }
        })
    };
};

