// routes/auth.js - Proper Backend Authentication Routes
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// reCAPTCHA Configuration
const RECAPTCHA_CONFIG = {
    secretKey: process.env.RECAPTCHA_SECRET_KEY,
    verifyUrl: 'https://www.google.com/recaptcha/api/siteverify',
    minScore: parseFloat(process.env.RECAPTCHA_MIN_SCORE) || 0.5,
    timeout: parseInt(process.env.RECAPTCHA_TIMEOUT) || 5000
};

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Validation middleware
const validateInput = (req, res, next) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address'
        });
    }
    
    // Password validation
    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters long'
        });
    }
    
    next();
};

// reCAPTCHA verification function
async function verifyRecaptcha(token, remoteIP) {
    if (!token || typeof token !== 'string' || token.length < 20) {
        return {
            success: false,
            error: 'Invalid token format',
            code: 'INVALID_TOKEN'
        };
    }

    if (!RECAPTCHA_CONFIG.secretKey) {
        console.error('reCAPTCHA secret key not configured');
        return {
            success: false,
            error: 'Server configuration error',
            code: 'CONFIG_ERROR'
        };
    }

    try {
        const startTime = Date.now();
        
        const response = await axios.post(
            RECAPTCHA_CONFIG.verifyUrl,
            null,
            {
                params: {
                    secret: RECAPTCHA_CONFIG.secretKey,
                    response: token,
                    remoteip: remoteIP
                },
                timeout: RECAPTCHA_CONFIG.timeout,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const responseTime = Date.now() - startTime;
        const data = response.data;

        console.log(`reCAPTCHA verification - IP: ${remoteIP}, Score: ${data.score || 'N/A'}, Time: ${responseTime}ms`);

        if (!data.success) {
            const errorCodes = data['error-codes'] || [];
            console.warn(`reCAPTCHA verification failed - Errors: ${errorCodes.join(', ')}`);
            
            return {
                success: false,
                score: data.score || 0,
                errors: errorCodes,
                code: 'VERIFICATION_FAILED'
            };
        }

        if (data.score !== undefined && data.score < RECAPTCHA_CONFIG.minScore) {
            console.warn(`reCAPTCHA score too low - Score: ${data.score}, Required: ${RECAPTCHA_CONFIG.minScore}`);
            
            return {
                success: false,
                score: data.score,
                code: 'LOW_SCORE'
            };
        }

        return {
            success: true,
            score: data.score,
            hostname: data.hostname,
            challenge_ts: data.challenge_ts,
            responseTime
        };

    } catch (error) {
        console.error('reCAPTCHA verification error:', {
            message: error.message,
            code: error.code,
            response: error.response?.data
        });

        if (error.code === 'ECONNABORTED') {
            return {
                success: false,
                error: 'Verification timeout',
                code: 'TIMEOUT'
            };
        }

        return {
            success: false,
            error: 'Verification failed',
            code: 'NETWORK_ERROR'
        };
    }
}

// Get client IP helper
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip ||
           'unknown';
}

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email,
            account_type: user.account_type 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );
}

// JWT verification middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        req.user = user;
        next();
    });
};

// Routes

// User Registration
router.post('/signup', authLimiter, validateInput, async (req, res) => {
    try {
        const { email, password, firstName, lastName, accountType, recaptcha_token } = req.body;
        const clientIP = getClientIP(req);

        // Verify reCAPTCHA
        const captchaResult = await verifyRecaptcha(recaptcha_token, clientIP);
        
        if (!captchaResult.success) {
            return res.status(400).json({
                success: false,
                message: 'reCAPTCHA verification failed. Please try again.',
                code: captchaResult.code
            });
        }

        console.log(`Signup attempt - Email: ${email}, reCAPTCHA Score: ${captchaResult.score}`);

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const newUser = await pool.query(
            `INSERT INTO users (email, password_hash, account_type, created_at, updated_at) 
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
             RETURNING id, email, account_type, created_at`,
            [email.toLowerCase(), hashedPassword, accountType || 'user']
        );

        const user = newUser.rows[0];
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: {
                id: user.id,
                email: user.email,
                account_type: user.account_type,
                created_at: user.created_at
            },
            token
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
});

// User Login
router.post('/login', authLimiter, validateInput, async (req, res) => {
    try {
        const { email, password, recaptcha_token } = req.body;
        const clientIP = getClientIP(req);

        // Verify reCAPTCHA
        const captchaResult = await verifyRecaptcha(recaptcha_token, clientIP);
        
        if (!captchaResult.success) {
            return res.status(400).json({
                success: false,
                message: 'reCAPTCHA verification failed. Please try again.',
                code: captchaResult.code
            });
        }

        console.log(`Login attempt - Email: ${email}, reCAPTCHA Score: ${captchaResult.score}`);

        // Find user
        const userResult = await pool.query(
            'SELECT id, email, password_hash, account_type, created_at FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = userResult.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login timestamp
        await pool.query(
            'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                account_type: user.account_type,
                created_at: user.created_at
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
});

// Get User Profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userResult = await pool.query(
            'SELECT id, email, account_type, created_at, updated_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.rows[0];

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                account_type: user.account_type,
                created_at: user.created_at,
                updated_at: user.updated_at
            }
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Logout (client-side token removal, but we can log it)
router.post('/logout', authenticateToken, (req, res) => {
    console.log(`User ${req.user.email} logged out`);
    
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Verify Token
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user.id,
            email: req.user.email,
            account_type: req.user.account_type
        }
    });
});

module.exports = router;
