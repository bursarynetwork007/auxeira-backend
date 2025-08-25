initconst express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration for your S3 frontend
app.use(cors({
    origin: [
        'https://auxeira.com',
        'https://www.auxeira.com',
        process.env.FRONTEND_URL,
        'http://localhost:3000' // for testing
    ],
    credentials: true
}));

app.use(express.json());

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later.'
});

// Basic health check
app.get('/', (req, res) => {
    res.json({ 
        message: 'Auxeira SSE Backend Running',
        version: '1.0.0',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Import routes
const authRoutes = require('./routes/auth');
const sseRoutes = require('./routes/sse');
const kpiRoutes = require('./routes/kpi');

// Use routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/sse', sseRoutes);
app.use('/api/kpi', kpiRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Auxeira SSE Backend running on port ${PORT}`);
    console.log(`📊 Monitoring ${process.env.NODE_ENV || 'development'} environment`);
});