import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


// Security middleware
app.use(helmet());

// CORS configuration for your S3 frontend
app.use(cors({
    origin: [
        'https://auxeira.com',
        'https://www.auxeira.com',
        process.env.FRONTEND_URL || '',
        'http://localhost:3000' // for testing
    ]
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
    return res.json({
        message: 'Auxeira SSE Backend Running',
        version: '1.0.0',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});


// Import routes

// To:
import authRoutes from './routes/auth';
import sseRoutes from './routes/sse';
import kpiRoutes from './routes/kpi';





// Use routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/sse', sseRoutes);
app.use('/api/kpi', kpiRoutes);

// Add this to your server.ts before the other routes
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});






app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Auxeira SSE Backend running on port ${PORT}`);
    console.log(`📊 Monitoring ${process.env.NODE_ENV || 'development'} environment`);
});