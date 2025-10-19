require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// Static files - serve from src directory
app.use(express.static(path.join(__dirname, 'src')));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
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

