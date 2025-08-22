const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// reCAPTCHA verification
async function verifyRecaptcha(token) {
    try {
        const response = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            {
                params: {
                    secret: process.env.RECAPTCHA_SECRET_KEY,
                    response: token
                }
            }
        );
        
        return response.data.success && response.data.score >= 0.5;
    } catch (error) {
        console.error('reCAPTCHA verification error:', error);
        return false;
    }
}

// Login endpoint
router.post('/login', async (req, res) => {
    const { email, password, recaptcha_token } = req.body;
    
    // Verify reCAPTCHA
    const captchaValid = await verifyRecaptcha(recaptcha_token);
    if (!captchaValid) {
        return res.status(400).json({
            success: false,
            message: 'Security verification failed. Please try again.'
        });
    }
    
    // TODO: Implement database user lookup
    // For now, return mock successful response
    const token = jwt.sign(
        { userId: '123', email, role: 'startup' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );
    
    res.json({
        success: true,
        token,
        user: {
            email,
            role: 'startup',
            ssiScore: 76 // Sustainable Success Index score
        }
    });
});

// Signup endpoint
router.post('/signup', async (req, res) => {
    const { email, password, accountType, recaptcha_token } = req.body;
    
    // Verify reCAPTCHA
    const captchaValid = await verifyRecaptcha(recaptcha_token);
    if (!captchaValid) {
        return res.status(400).json({
            success: false,
            message: 'Security verification failed.'
        });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // TODO: Save to database
    
    res.json({
        success: true,
        message: 'Account created successfully! Welcome to Auxeira SSE.',
        accountType
    });
});

module.exports = router;