/**
 * Auxeira User-Centric AI System
 * Complete architecture with CRM integration, caching, security, and monetization
 */

const express = require('express');
const redis = require('redis');
const firebase = require('firebase-admin');
const axios = require('axios');
const DOMPurify = require('isomorphic-dompurify');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

class UserCentricAISystem {
    constructor() {
        this.app = express();
        this.redisClient = null;
        this.firebaseApp = null;
        this.crmIntegrations = {
            hubspot: null,
            salesforce: null
        };
        
        this.aiProviders = {
            nanoGPT5: { endpoint: '/api/ai/nanogpt5', strength: 'code/HTML generation' },
            grok: { endpoint: '/api/ai/grok', strength: 'reasoning/creativity' },
            manus: { endpoint: '/api/ai/manus', strength: 'data scraping' },
            claude: { endpoint: '/api/ai/claude', strength: 'narratives' }
        };

        this.subscriptionTiers = {
            free: { features: ['basic-narratives', 'static-charts'], aiCallsPerDay: 10 },
            premium: { features: ['advanced-narratives', 'interactive-charts', 'basic-reports'], aiCallsPerDay: 100 },
            enterprise: { features: ['all-features', 'custom-ai', 'white-label'], aiCallsPerDay: 1000 }
        };

        this.init();
    }

    async init() {
        await this.setupMiddleware();
        await this.initializeDatabase();
        await this.setupCRMIntegrations();
        await this.setupCaching();
        await this.setupRoutes();
        this.startServer();
    }

    // ===========================================
    // MIDDLEWARE & SECURITY SETUP
    // ===========================================

    async setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://js.paystack.co"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "https://api.paystack.co", "https://api.auxeira.com"]
                }
            }
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
            credentials: true
        }));

        // Rate limiting
        const apiLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: async (req) => {
                const user = await this.getUserFromToken(req.headers.authorization);
                if (!user) return 20; // Anonymous users
                
                const subscription = await this.getUserSubscription(user.id);
                return this.subscriptionTiers[subscription.tier]?.aiCallsPerDay || 10;
            },
            message: 'AI API rate limit exceeded. Upgrade your subscription for higher limits.',
            standardHeaders: true,
            legacyHeaders: false
        });

        this.app.use('/api/ai', apiLimiter);
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    // ===========================================
    // DATABASE & CRM INTEGRATION
    // ===========================================

    async initializeDatabase() {
        try {
            // Initialize Firebase
            if (!firebase.apps.length) {
                this.firebaseApp = firebase.initializeApp({
                    credential: firebase.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
                    }),
                    databaseURL: process.env.FIREBASE_DATABASE_URL
                });
            }

            this.db = firebase.firestore();
            console.log('✅ Firebase initialized successfully');

        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            throw error;
        }
    }

    async setupCRMIntegrations() {
        // HubSpot Integration
        if (process.env.HUBSPOT_API_KEY) {
            this.crmIntegrations.hubspot = {
                apiKey: process.env.HUBSPOT_API_KEY,
                baseURL: 'https://api.hubapi.com',
                headers: {
                    'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            };
            console.log('✅ HubSpot integration configured');
        }

        // Salesforce Integration
        if (process.env.SALESFORCE_CLIENT_ID) {
            this.crmIntegrations.salesforce = {
                clientId: process.env.SALESFORCE_CLIENT_ID,
                clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
                loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com',
                accessToken: null
            };
            
            await this.authenticateSalesforce();
            console.log('✅ Salesforce integration configured');
        }
    }

    async setupCaching() {
        try {
            this.redisClient = redis.createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            });

            this.redisClient.on('error', (err) => {
                console.error('Redis Client Error:', err);
            });

            await this.redisClient.connect();
            console.log('✅ Redis cache connected');

        } catch (error) {
            console.error('❌ Redis connection failed:', error);
            // Fallback to in-memory cache
            this.memoryCache = new Map();
            console.log('⚠️ Using in-memory cache as fallback');
        }
    }

    // ===========================================
    // USER PROFILE MANAGEMENT
    // ===========================================

    async fetchUserProfile(userId, crmSource = 'firebase') {
        try {
            const cacheKey = `profile:${userId}:${crmSource}`;
            
            // Check cache first
            const cachedProfile = await this.getFromCache(cacheKey);
            if (cachedProfile) {
                return JSON.parse(cachedProfile);
            }

            let profile;
            switch (crmSource) {
                case 'hubspot':
                    profile = await this.fetchFromHubSpot(userId);
                    break;
                case 'salesforce':
                    profile = await this.fetchFromSalesforce(userId);
                    break;
                default:
                    profile = await this.fetchFromFirebase(userId);
            }

            // Enhance profile with AI preferences
            profile = await this.enhanceProfileWithAI(profile);

            // Cache for 24 hours
            await this.setCache(cacheKey, JSON.stringify(profile), 86400);

            return profile;

        } catch (error) {
            console.error(`Error fetching user profile for ${userId}:`, error);
            return this.getDefaultProfile(userId);
        }
    }

    async fetchFromHubSpot(contactId) {
        if (!this.crmIntegrations.hubspot) {
            throw new Error('HubSpot integration not configured');
        }

        const response = await axios.get(
            `${this.crmIntegrations.hubspot.baseURL}/crm/v3/objects/contacts/${contactId}`,
            {
                headers: this.crmIntegrations.hubspot.headers,
                params: {
                    properties: 'firstname,lastname,email,company,jobtitle,industry,hs_lead_status,website,phone,country'
                }
            }
        );

        const contact = response.data;
        return this.mapHubSpotToProfile(contact);
    }

    async fetchFromSalesforce(contactId) {
        if (!this.crmIntegrations.salesforce?.accessToken) {
            await this.authenticateSalesforce();
        }

        const response = await axios.get(
            `${this.crmIntegrations.salesforce.instanceUrl}/services/data/v58.0/sobjects/Contact/${contactId}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.crmIntegrations.salesforce.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return this.mapSalesforceToProfile(response.data);
    }

    async fetchFromFirebase(userId) {
        const doc = await this.db.collection('users').doc(userId).get();
        if (!doc.exists) {
            throw new Error('User not found in Firebase');
        }
        return doc.data();
    }

    mapHubSpotToProfile(contact) {
        const props = contact.properties;
        return {
            id: contact.id,
            name: `${props.firstname || ''} ${props.lastname || ''}`.trim(),
            email: props.email,
            organizationName: props.company,
            userRole: props.jobtitle,
            organizationType: this.mapIndustryToType(props.industry),
            organizationWebsite: props.website,
            country: props.country,
            phone: props.phone,
            leadStatus: props.hs_lead_status,
            source: 'hubspot',
            lastUpdated: new Date().toISOString(),
            preferences: this.inferPreferencesFromRole(props.jobtitle, props.industry),
            subscriptionTier: 'free' // Default, will be updated based on actual subscription
        };
    }

    mapSalesforceToProfile(contact) {
        return {
            id: contact.Id,
            name: `${contact.FirstName || ''} ${contact.LastName || ''}`.trim(),
            email: contact.Email,
            organizationName: contact.Account?.Name,
            userRole: contact.Title,
            organizationType: this.mapIndustryToType(contact.Account?.Industry),
            organizationWebsite: contact.Account?.Website,
            country: contact.MailingCountry,
            phone: contact.Phone,
            source: 'salesforce',
            lastUpdated: new Date().toISOString(),
            preferences: this.inferPreferencesFromRole(contact.Title, contact.Account?.Industry),
            subscriptionTier: 'free'
        };
    }

    async enhanceProfileWithAI(profile) {
        // Use AI to infer additional preferences based on organization website
        if (profile.organizationWebsite) {
            try {
                const websiteAnalysis = await this.analyzeOrganizationWebsite(profile.organizationWebsite);
                profile.aiEnhancedData = websiteAnalysis;
                profile.focusAreas = websiteAnalysis.inferredSDGs || [];
                profile.investmentThesis = websiteAnalysis.investmentThesis;
                profile.esgCommitment = websiteAnalysis.esgCommitment;
            } catch (error) {
                console.error('Error enhancing profile with AI:', error);
            }
        }

        return profile;
    }

    // ===========================================
    // AI CONTENT GENERATION WITH SECURITY
    // ===========================================

    async generatePersonalizedContent(dashboardType, section, userId, options = {}) {
        try {
            // Fetch user profile
            const userProfile = await this.fetchUserProfile(userId, options.crmSource);
            
            // Check subscription limits
            const canAccess = await this.checkFeatureAccess(userProfile, section);
            if (!canAccess.allowed) {
                return {
                    error: 'Feature not available in your subscription tier',
                    upgradeRequired: true,
                    suggestedTier: canAccess.suggestedTier,
                    content: canAccess.limitedContent
                };
            }

            // Generate cache key
            const cacheKey = `ai:${dashboardType}:${section}:${userId}:${this.hashObject(userProfile)}`;
            
            // Check cache
            const cachedContent = await this.getFromCache(cacheKey);
            if (cachedContent && !options.forceRefresh) {
                return JSON.parse(cachedContent);
            }

            // Select appropriate AI based on section requirements
            const aiProvider = this.selectOptimalAI(section);
            
            // Generate enhanced prompt
            const promptData = await this.generateEnhancedPrompt(
                dashboardType, 
                section, 
                userProfile, 
                options
            );

            // Call AI API with retry logic
            const aiResponse = await this.callAIWithRetry(
                aiProvider, 
                promptData.prompt, 
                { maxRetries: 3, timeout: 30000 }
            );

            // Sanitize AI output for security
            const sanitizedContent = this.sanitizeAIOutput(aiResponse);

            // Structure the response
            const result = {
                content: sanitizedContent,
                aiProvider,
                userProfile: {
                    name: userProfile.name,
                    organizationName: userProfile.organizationName,
                    tier: userProfile.subscriptionTier
                },
                metadata: {
                    generated: new Date().toISOString(),
                    cacheKey,
                    promptTokens: promptData.estimatedTokens,
                    responseTokens: this.estimateTokens(sanitizedContent)
                }
            };

            // Cache for 24 hours
            await this.setCache(cacheKey, JSON.stringify(result), 86400);

            // Track usage for billing
            await this.trackAIUsage(userId, aiProvider, result.metadata);

            return result;

        } catch (error) {
            console.error('Error generating personalized content:', error);
            return this.getFallbackContent(dashboardType, section, userId);
        }
    }

    selectOptimalAI(section) {
        const sectionAIMapping = {
            'overview': 'claude',          // Best for narratives
            'analytics': 'grok',           // Best for reasoning
            'reports': 'manus',            // Best for comprehensive data
            'charts': 'nanoGPT5',         // Best for code generation
            'story-studio': 'claude',      // Best for storytelling
            'deal-flow': 'manus',          // Best for data scraping
            'portfolio': 'grok'            // Best for analysis
        };

        return sectionAIMapping[section] || 'claude';
    }

    async callAIWithRetry(provider, prompt, options = {}) {
        const { maxRetries = 3, timeout = 30000 } = options;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await axios.post(
                    `${process.env.API_BASE_URL}${this.aiProviders[provider].endpoint}`,
                    {
                        messages: [
                            {
                                role: 'system',
                                content: this.getSystemPrompt(provider)
                            },
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        max_tokens: this.getMaxTokens(provider),
                        temperature: this.getTemperature(provider)
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${this.getAIApiKey(provider)}`,
                            'Content-Type': 'application/json'
                        },
                        timeout
                    }
                );

                return response.data.choices[0].message.content;

            } catch (error) {
                console.error(`AI API attempt ${attempt} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    throw new Error(`AI API failed after ${maxRetries} attempts: ${error.message}`);
                }
                
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }

    sanitizeAIOutput(content) {
        // Remove potentially dangerous HTML/JS
        const sanitized = DOMPurify.sanitize(content, {
            ALLOWED_TAGS: ['p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'ul', 'ol', 'li', 'br'],
            ALLOWED_ATTR: ['class', 'id', 'data-*'],
            FORBID_SCRIPTS: true,
            FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style', 'img', 'video', 'audio']
        });

        // Additional validation
        if (this.containsSuspiciousContent(sanitized)) {
            throw new Error('AI output contains suspicious content');
        }

        return sanitized;
    }

    containsSuspiciousContent(content) {
        const suspiciousPatterns = [
            /javascript:/i,
            /vbscript:/i,
            /onload=/i,
            /onerror=/i,
            /onclick=/i,
            /<script/i,
            /eval\(/i,
            /document\.cookie/i
        ];

        return suspiciousPatterns.some(pattern => pattern.test(content));
    }

    // ===========================================
    // SUBSCRIPTION & MONETIZATION
    // ===========================================

    async checkFeatureAccess(userProfile, feature) {
        const subscription = await this.getUserSubscription(userProfile.id);
        const tier = subscription.tier || 'free';
        const tierFeatures = this.subscriptionTiers[tier].features;

        const featureMapping = {
            'overview': 'basic-narratives',
            'analytics': 'interactive-charts',
            'reports': 'basic-reports',
            'advanced-analytics': 'advanced-narratives',
            'custom-ai': 'custom-ai',
            'white-label': 'white-label'
        };

        const requiredFeature = featureMapping[feature] || 'basic-narratives';
        const hasAccess = tierFeatures.includes(requiredFeature) || tierFeatures.includes('all-features');

        if (hasAccess) {
            return { allowed: true };
        }

        // Provide limited content for free users
        const limitedContent = await this.generateLimitedContent(feature, userProfile);
        
        return {
            allowed: false,
            suggestedTier: this.getSuggestedTier(requiredFeature),
            limitedContent,
            upgradeUrl: `${process.env.FRONTEND_URL}/upgrade?feature=${feature}`
        };
    }

    async generateLimitedContent(feature, userProfile) {
        // Generate basic content for free tier users
        return {
            title: `${feature.charAt(0).toUpperCase() + feature.slice(1)} Preview`,
            content: `This is a preview of our ${feature} feature. Upgrade to access full personalized content for ${userProfile.organizationName}.`,
            cta: 'Upgrade Now',
            features: this.getFeaturePreview(feature)
        };
    }

    getSuggestedTier(requiredFeature) {
        if (['custom-ai', 'white-label'].includes(requiredFeature)) {
            return 'enterprise';
        } else if (['advanced-narratives', 'interactive-charts'].includes(requiredFeature)) {
            return 'premium';
        }
        return 'premium';
    }

    async trackAIUsage(userId, provider, metadata) {
        const usage = {
            userId,
            provider,
            timestamp: new Date().toISOString(),
            tokens: metadata.promptTokens + metadata.responseTokens,
            cost: this.calculateAICost(provider, metadata.promptTokens + metadata.responseTokens)
        };

        // Store in Firebase for billing
        await this.db.collection('ai_usage').add(usage);

        // Update daily usage counter in Redis
        const dailyKey = `usage:${userId}:${new Date().toISOString().split('T')[0]}`;
        await this.redisClient?.incr(dailyKey);
        await this.redisClient?.expire(dailyKey, 86400); // 24 hours
    }

    // ===========================================
    // API ROUTES
    // ===========================================

    setupRoutes() {
        // User Profile Routes
        this.app.get('/api/profile/:userId', async (req, res) => {
            try {
                const profile = await this.fetchUserProfile(req.params.userId, req.query.source);
                res.json({ success: true, profile });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.put('/api/profile/:userId', async (req, res) => {
            try {
                await this.updateUserProfile(req.params.userId, req.body);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // AI Content Generation Routes
        this.app.post('/api/ai/generate/:dashboardType/:section', async (req, res) => {
            try {
                const { dashboardType, section } = req.params;
                const { userId, options = {} } = req.body;

                const content = await this.generatePersonalizedContent(
                    dashboardType,
                    section,
                    userId,
                    options
                );

                res.json({ success: true, ...content });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Subscription Management Routes
        this.app.get('/api/subscription/:userId', async (req, res) => {
            try {
                const subscription = await this.getUserSubscription(req.params.userId);
                res.json({ success: true, subscription });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/subscription/upgrade', async (req, res) => {
            try {
                const { userId, tier, paymentReference } = req.body;
                
                // Verify payment with Paystack
                const paymentVerified = await this.verifyPaystackPayment(paymentReference);
                
                if (paymentVerified) {
                    await this.upgradeSubscription(userId, tier);
                    res.json({ success: true, message: 'Subscription upgraded successfully' });
                } else {
                    res.status(400).json({ error: 'Payment verification failed' });
                }
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Story Studio Routes (with Interact.js support)
        this.app.post('/api/story-studio/create', async (req, res) => {
            try {
                const { userId, storyData } = req.body;
                const story = await this.createStoryStudio(userId, storyData);
                res.json({ success: true, story });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Health Check
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: {
                    redis: !!this.redisClient?.isReady,
                    firebase: !!this.firebaseApp,
                    hubspot: !!this.crmIntegrations.hubspot,
                    salesforce: !!this.crmIntegrations.salesforce
                }
            });
        });
    }

    // ===========================================
    // CACHING UTILITIES
    // ===========================================

    async getFromCache(key) {
        try {
            if (this.redisClient?.isReady) {
                return await this.redisClient.get(key);
            } else if (this.memoryCache) {
                const cached = this.memoryCache.get(key);
                if (cached && cached.expires > Date.now()) {
                    return cached.value;
                }
            }
            return null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    async setCache(key, value, ttl = 3600) {
        try {
            if (this.redisClient?.isReady) {
                await this.redisClient.setEx(key, ttl, value);
            } else if (this.memoryCache) {
                this.memoryCache.set(key, {
                    value,
                    expires: Date.now() + (ttl * 1000)
                });
            }
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    // ===========================================
    // UTILITY METHODS
    // ===========================================

    hashObject(obj) {
        return require('crypto')
            .createHash('md5')
            .update(JSON.stringify(obj))
            .digest('hex');
    }

    estimateTokens(text) {
        // Rough estimation: 1 token ≈ 4 characters
        return Math.ceil(text.length / 4);
    }

    calculateAICost(provider, tokens) {
        const costs = {
            claude: 0.000015 * tokens,      // $0.015 per 1K tokens
            grok: 0.000010 * tokens,        // $0.010 per 1K tokens
            manus: 0.000020 * tokens,       // $0.020 per 1K tokens
            nanoGPT5: 0.000005 * tokens     // $0.005 per 1K tokens
        };
        return costs[provider] || 0;
    }

    startServer() {
        const PORT = process.env.PORT || 3001;
        this.app.listen(PORT, () => {
            console.log(`🚀 Auxeira User-Centric AI System running on port ${PORT}`);
            console.log(`📊 Dashboard AI with CRM integration ready`);
            console.log(`🔒 Security, caching, and monetization active`);
        });
    }
}

// Initialize and export
const userCentricSystem = new UserCentricAISystem();
module.exports = userCentricSystem;
