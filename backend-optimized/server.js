require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Load database
let database = null;
const dbPath = path.join(__dirname, 'database.json');

function loadDatabase() {
    try {
        console.log('📊 Loading database...');
        const dbContent = fs.readFileSync(dbPath, 'utf8');
        database = JSON.parse(dbContent);
        console.log(`✅ Database loaded: ${database.startups.length} startups`);
        return true;
    } catch (error) {
        console.error('❌ Error loading database:', error.message);
        return false;
    }
}

// Load database on startup
loadDatabase();

// Middleware
app.use(helmet({
    contentSecurityPolicy: false // Allow inline scripts for dashboards
}));
app.use(compression());
app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true
}));
// Security middleware
// Disable CSP in development for easier testing
if (process.env.NODE_ENV === 'production') {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://js.paystack.co", "https://www.google.com", "https://www.gstatic.com"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https://api.paystack.co", "https://*.manusvm.computer"],
                fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
                frameSrc: ["'self'", "https://js.paystack.co", "https://www.google.com"]
            }
        }
    }));
} else {
    // Development: minimal security for testing
    app.use(helmet({
        contentSecurityPolicy: false
    }));
}

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
};
app.use(cors(corsOptions));

// Compression
app.use(compression());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// Serve static files
app.use(express.static(path.join(__dirname, '../')));

// ============================================
// API ENDPOINTS - Real Data
// ============================================

// Health check
// Static files - serve from src directory
app.use(express.static(path.join(__dirname, 'src')));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: database ? 'loaded' : 'not loaded',
        startups: database ? database.startups.length : 0,
        version: '1.0.0'
    });
});

// Get all startups (with pagination)
app.get('/api/startups', (req, res) => {
    if (!database) {
        return res.status(503).json({ error: 'Database not loaded' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    const startups = database.startups.slice(offset, offset + limit);
    
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

// Get single startup by ID
app.get('/api/startups/:id', (req, res) => {
    if (!database) {
        return res.status(503).json({ error: 'Database not loaded' });
    }
    
    const startup = database.startups.find(s => s.id === req.params.id);
    if (!startup) {
        return res.status(404).json({ error: 'Startup not found' });
    }
    
    const timeSeries = database.timeSeries[startup.id] || [];
    const esg = database.esgData.find(e => e.startupId === startup.id);
    
    res.json({
        data: {
            ...startup,
            timeSeries,
            esg
        }
    });
});

// Get time series data for a startup
app.get('/api/startups/:id/timeseries', (req, res) => {
    if (!database) {
        return res.status(503).json({ error: 'Database not loaded' });
    }
    
    const timeSeries = database.timeSeries[req.params.id];
    if (!timeSeries) {
        return res.status(404).json({ error: 'Time series not found' });
    }
    
    const days = parseInt(req.query.days) || 365;
    const data = timeSeries.slice(-days);
    
    res.json({ data });
});

// Get dashboard data for startup founder
app.get('/api/dashboard/startup', (req, res) => {
    if (!database) {
        return res.status(503).json({ error: 'Database not loaded' });
    }
    
    // Get a random startup for demo (in production, use authenticated user's startup)
    const startup = database.startups[Math.floor(Math.random() * database.startups.length)];
    const timeSeries = database.timeSeries[startup.id];
    const recent = timeSeries.slice(-30); // Last 30 days
    
    // Calculate real metrics
    const currentMRR = recent[recent.length - 1].mrr;
    const previousMRR = recent[0].mrr;
    const mrrGrowth = ((currentMRR - previousMRR) / previousMRR) * 100;
    
    const currentCustomers = recent[recent.length - 1].customers;
    const previousCustomers = recent[0].customers;
    const customerGrowth = ((currentCustomers - previousCustomers) / previousCustomers) * 100;
    
    res.json({
        data: {
            startup,
            metrics: {
                sseScore: startup.sseScore,
                valuation: startup.valuation,
                mrr: currentMRR,
                mrrGrowth,
                arr: currentMRR * 12,
                customers: currentCustomers,
                customerGrowth,
                cac: startup.cac,
                ltv: startup.ltv,
                ltvCacRatio: startup.ltvCacRatio,
                burnRate: startup.burnRate,
                runway: startup.runway,
                teamSize: startup.teamSize
            },
            timeSeries: recent,
            fullTimeSeries: timeSeries
        }
    });
});

// Get dashboard data for VC
app.get('/api/dashboard/vc', (req, res) => {
    if (!database) {
        return res.status(503).json({ error: 'Database not loaded' });
    }
    
    // Get a random investor for demo
    const investor = database.investors[Math.floor(Math.random() * database.investors.length)];
    
    // Get portfolio startups
    const portfolioStartups = investor.portfolio.map(p => {
        const startup = database.startups.find(s => s.id === p.startupId);
        return {
            ...p,
            startup
        };
    });
    
    res.json({
        data: {
            investor,
            portfolio: portfolioStartups,
            metrics: {
                totalInvested: investor.totalInvested,
                totalValue: investor.totalValue,
                avgMultiple: investor.avgMultiple,
                portfolioSize: investor.portfolioSize
            }
        }
    });
});

// Get ESG dashboard data
app.get('/api/dashboard/esg/:sdg?', (req, res) => {
    if (!database) {
        return res.status(503).json({ error: 'Database not loaded' });
    }
    
    const sdgFilter = req.params.sdg;
    let esgStartups = database.esgData;
    
    if (sdgFilter) {
        esgStartups = esgStartups.filter(e => 
            e.primarySDG.toLowerCase().includes(sdgFilter.toLowerCase())
        );
    }
    
    // Aggregate metrics
    const totalBeneficiaries = esgStartups.reduce((sum, e) => sum + e.beneficiaries, 0);
    const totalCarbonReduction = esgStartups.reduce((sum, e) => sum + e.carbonReduction, 0);
    const avgImpactScore = esgStartups.reduce((sum, e) => sum + e.impactScore, 0) / esgStartups.length;
    
    res.json({
        data: {
            startups: esgStartups.map(e => {
                const startup = database.startups.find(s => s.id === e.startupId);
                return { ...e, startup };
            }),
            metrics: {
                totalStartups: esgStartups.length,
                totalBeneficiaries,
                totalCarbonReduction,
                avgImpactScore
            }
        }
    });
});

// Get statistics
app.get('/api/stats', (req, res) => {
    if (!database) {
        return res.status(503).json({ error: 'Database not loaded' });
    }
    
    res.json({ data: database.stats });
});

// Search startups
app.get('/api/search', (req, res) => {
    if (!database) {
        return res.status(503).json({ error: 'Database not loaded' });
    }
    
    const query = req.query.q?.toLowerCase() || '';
    const industry = req.query.industry;
    const stage = req.query.stage;
    const country = req.query.country;
    
    let results = database.startups;
    
    if (query) {
        results = results.filter(s => 
            s.name.toLowerCase().includes(query) ||
            s.industry.toLowerCase().includes(query)
        );
    }
    
    if (industry) {
        results = results.filter(s => s.industry === industry);
    }
    
    if (stage) {
        results = results.filter(s => s.stage === stage);
    }
    
    if (country) {
        results = results.filter(s => s.country === country);
    }
    
    res.json({ data: results.slice(0, 100) }); // Limit to 100 results
});

// ============================================
// Configuration Endpoints (Secure)
// ============================================

app.get('/api/config/public', (req, res) => {
    res.json({
        data: {
            environment: process.env.NODE_ENV || 'development',
            features: {
                ai: process.env.ENABLE_AI_FEATURES === 'true',
                blockchain: process.env.ENABLE_BLOCKCHAIN === 'true',
                analytics: process.env.ENABLE_ANALYTICS === 'true'
            }
        }
    });
});

app.get('/api/config/paystack-public-key', (req, res) => {
    res.json({
        data: {
            publicKey: process.env.PAYSTACK_PUBLIC_KEY || ''
        }
    });
});

// ============================================
// Payment Endpoints (Proxy)
// ============================================

app.post('/api/payment/initialize', async (req, res) => {
    try {
        const { amount, email } = req.body;
        
        // In production, make actual Paystack API call
        // For now, return mock response
        res.json({
            data: {
                authorization_url: 'https://checkout.paystack.com/mock',
                access_code: 'mock_access_code',
                reference: `ref_${Date.now()}`
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// AI Endpoints
// ============================================

app.post('/api/ai/generate', async (req, res) => {
    if (process.env.ENABLE_AI_FEATURES !== 'true') {
        return res.status(403).json({ error: 'AI features not enabled' });
    }
    
    try {
        const { prompt, type } = req.body;
        
        // In production, call OpenAI API
        // For now, return mock response
        res.json({
            data: {
                content: `AI-generated content for: ${prompt}`,
                type
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Serve Frontend
// ============================================

// Main landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Dashboard routes
app.get('/dashboard/:type', (req, res) => {
    const dashboardPath = path.join(__dirname, `../dashboard-optimized/${req.params.type}/index.html`);
    if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
    } else {
        res.status(404).send('Dashboard not found');
    }
});

// ============================================
// Error Handling
// ============================================

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
    console.log(`\n🚀 Auxeira Backend Server`);
    console.log(`================================`);
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Database: ${database ? 'Loaded' : 'Not loaded'}`);
    console.log(`🔐 CORS Origins: ${process.env.CORS_ORIGINS || '*'}`);
    console.log(`\n📍 Endpoints:`);
    console.log(`   Main site: http://localhost:${PORT}/`);
    console.log(`   API Health: http://localhost:${PORT}/api/health`);
    console.log(`   Startups: http://localhost:${PORT}/api/startups`);
    console.log(`   Dashboard: http://localhost:${PORT}/dashboard/startup`);
    console.log(`================================\n`);
        environment: process.env.NODE_ENV || 'development'
    });
});

// Public configuration endpoint
app.get('/api/config/public', (req, res) => {
    res.json({
        success: true,
        data: {
            environment: process.env.NODE_ENV || 'development',
            features: {
                ai: process.env.ENABLE_AI_FEATURES === 'true',
                blockchain: process.env.ENABLE_BLOCKCHAIN === 'true',
                analytics: process.env.ENABLE_ANALYTICS === 'true'
            }
        }
    });
});

// Paystack public key endpoint (secure)
app.get('/api/config/paystack-public-key', (req, res) => {
    const publicKey = process.env.PAYSTACK_PUBLIC_KEY;
    
    if (!publicKey) {
        return res.status(500).json({
            success: false,
            error: 'Payment system not configured'
        });
    }
    
    res.json({
        success: true,
        data: {
            publicKey: publicKey
        }
    });
});

// User profile endpoint (mock for now)
app.get('/api/user/profile', (req, res) => {
    // In production, this would verify JWT token and fetch from database
    res.json({
        success: true,
        data: {
            userId: 'demo_user_123',
            email: 'demo@auxeira.com',
            name: 'Demo User',
            userType: 'startup_founder',
            sseScore: 78,
            auxTokens: 1247
        }
    });
});

// Dashboard data endpoint
app.get('/api/dashboard/:type', (req, res) => {
    const { type } = req.params;
    
    // Mock dashboard data
    res.json({
        success: true,
        data: {
            type: type,
            metrics: {
                mrr: 45000,
                customers: 342,
                burnRate: 35000,
                nps: 68
            },
            sseScore: 78,
            auxTokens: 1247
        }
    });
});

// AI generation endpoint
app.post('/api/ai/generate', async (req, res) => {
    const { prompt, context } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({
            success: false,
            error: 'AI service not configured'
        });
    }
    
    // In production, this would call OpenAI API
    res.json({
        success: true,
        data: {
            response: 'AI-generated content would appear here',
            model: 'gpt-4',
            timestamp: new Date().toISOString()
        }
    });
});

// Payment initialization endpoint
app.post('/api/payment/initialize', async (req, res) => {
    const { email, amount, planId } = req.body;
    
    if (!process.env.PAYSTACK_SECRET_KEY) {
        return res.status(500).json({
            success: false,
            error: 'Payment system not configured'
        });
    }
    
    // In production, this would call Paystack API with secret key
    res.json({
        success: true,
        data: {
            reference: 'AUX_' + Date.now(),
            authorizationUrl: 'https://checkout.paystack.com/...',
            accessCode: 'demo_access_code'
        }
    });
});

// Serve main landing page at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// Serve dashboard pages
app.get('/dashboards/*', (req, res) => {
    const requestedPath = path.join(__dirname, 'src', req.path);
    res.sendFile(requestedPath);
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Auxeira Backend Server                              ║
║                                                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}                                ║
║   Port: ${PORT}                                               ║
║   URL: http://localhost:${PORT}                                 ║
║                                                           ║
║   Features:                                               ║
║   - AI: ${process.env.ENABLE_AI_FEATURES === 'true' ? '✓' : '✗'}                                                  ║
║   - Blockchain: ${process.env.ENABLE_BLOCKCHAIN === 'true' ? '✓' : '✗'}                                          ║
║   - Analytics: ${process.env.ENABLE_ANALYTICS === 'true' ? '✓' : '✗'}                                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;

