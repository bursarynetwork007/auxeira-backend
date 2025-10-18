/**
 * Auxeira API Service Layer
 * Secure API management without exposing keys in frontend
 */

const EnvironmentConfig = require('../config/environment');

class APIService {
    constructor(environment = 'production') {
        this.config = new EnvironmentConfig(environment);
        this.baseUrl = this.config.get('api').baseUrl;
    }

    /**
     * Generate AI-powered reports
     */
    async generateReport(reportType, userProfile, data) {
        try {
            const response = await fetch(`${this.baseUrl}/api/reports/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    reportType,
                    userProfile,
                    data,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`Report generation failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Report generation error:', error);
            return this.getFallbackReport(reportType);
        }
    }

    /**
     * Get competitive leaderboard data
     */
    async getLeaderboard(category, userOrg) {
        try {
            const response = await fetch(`${this.baseUrl}/api/leaderboard/${category}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`Leaderboard fetch failed: ${response.statusText}`);
            }

            const data = await response.json();
            return this.processLeaderboardData(data, userOrg);
        } catch (error) {
            console.error('Leaderboard error:', error);
            return this.getFallbackLeaderboard(category);
        }
    }

    /**
     * Get startup profiles and metrics
     */
    async getStartupData(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`${this.baseUrl}/api/startups?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`Startup data fetch failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Startup data error:', error);
            return this.getFallbackStartupData();
        }
    }

    /**
     * Process payment for premium features
     */
    async processPayment(paymentData) {
        try {
            const response = await fetch(`${this.baseUrl}/api/payments/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    ...paymentData,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`Payment processing failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Payment processing error:', error);
            throw error; // Don't provide fallback for payments
        }
    }

    /**
     * Save user profile data
     */
    async saveUserProfile(profileData) {
        try {
            const response = await fetch(`${this.baseUrl}/api/profiles/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    ...profileData,
                    updatedAt: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`Profile save failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Profile save error:', error);
            // Fallback to localStorage for offline capability
            localStorage.setItem('auxeira_user_profile', JSON.stringify(profileData));
            return { success: true, offline: true };
        }
    }

    /**
     * Get user profile data
     */
    async getUserProfile(userId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/profiles/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`Profile fetch failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Profile fetch error:', error);
            // Fallback to localStorage
            const stored = localStorage.getItem('auxeira_user_profile');
            return stored ? JSON.parse(stored) : null;
        }
    }

    // Private helper methods
    getAuthToken() {
        return localStorage.getItem('auxeira_auth_token') || 'anonymous';
    }

    processLeaderboardData(data, userOrg) {
        // Add user's position highlighting
        return data.map(entry => ({
            ...entry,
            isCurrentUser: entry.organizationName === userOrg
        }));
    }

    getFallbackReport(reportType) {
        return {
            id: `fallback_${Date.now()}`,
            type: reportType,
            title: `${reportType} Report`,
            content: 'Report generation temporarily unavailable. Please try again later.',
            status: 'fallback',
            createdAt: new Date().toISOString()
        };
    }

    getFallbackLeaderboard(category) {
        return Array.from({ length: 10 }, (_, i) => ({
            rank: i + 1,
            organizationName: `Organization ${i + 1}`,
            score: Math.round((100 - i * 5) * 100) / 100,
            category: category,
            isCurrentUser: i === 4 // Highlight middle position
        }));
    }

    getFallbackStartupData() {
        return {
            startups: Array.from({ length: 20 }, (_, i) => ({
                id: `startup_${i + 1}`,
                name: `Startup ${i + 1}`,
                industry: ['FinTech', 'HealthTech', 'EdTech'][i % 3],
                stage: ['Seed', 'Series A', 'Series B'][i % 3],
                esgScore: Math.round((80 + Math.random() * 20) * 100) / 100,
                fundingAmount: Math.floor(Math.random() * 5000000) + 100000
            })),
            total: 20,
            status: 'fallback'
        };
    }
}

// Frontend integration helper
class DashboardAPI {
    constructor() {
        this.apiService = new APIService();
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async getCachedData(key, fetchFunction) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        const data = await fetchFunction();
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
    }

    // Dashboard-specific methods
    async loadDashboardData(dashboardType, userProfile) {
        const cacheKey = `dashboard_${dashboardType}_${userProfile.userId}`;
        return this.getCachedData(cacheKey, async () => {
            switch (dashboardType) {
                case 'esg':
                    return this.loadESGData(userProfile);
                case 'vc':
                    return this.loadVCData(userProfile);
                case 'startup':
                    return this.loadStartupData(userProfile);
                default:
                    return this.loadGenericData(dashboardType, userProfile);
            }
        });
    }

    async loadESGData(userProfile) {
        const [leaderboard, reports, startups] = await Promise.all([
            this.apiService.getLeaderboard('ESG Score', userProfile.organizationName),
            this.apiService.generateReport('ESG Assessment', userProfile, {}),
            this.apiService.getStartupData({ esgFocus: true })
        ]);

        return { leaderboard, reports, startups };
    }

    async loadVCData(userProfile) {
        const [deals, portfolio, market] = await Promise.all([
            this.apiService.getStartupData({ stage: 'Series A,Series B' }),
            this.apiService.getUserProfile(userProfile.userId),
            this.apiService.getLeaderboard('Deal Flow', userProfile.organizationName)
        ]);

        return { deals, portfolio, market };
    }

    async loadStartupData(userProfile) {
        const [opportunities, mentors, funding] = await Promise.all([
            this.apiService.getStartupData({ stage: 'Seed,Pre-Seed' }),
            this.apiService.getLeaderboard('Mentorship', userProfile.organizationName),
            this.apiService.generateReport('Funding Opportunities', userProfile, {})
        ]);

        return { opportunities, mentors, funding };
    }

    async loadGenericData(dashboardType, userProfile) {
        return {
            type: dashboardType,
            profile: userProfile,
            data: await this.apiService.getStartupData({}),
            timestamp: new Date().toISOString()
        };
    }
}

// Export for use in dashboards
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIService, DashboardAPI };
} else {
    // Browser environment
    window.AuxeiraAPI = { APIService, DashboardAPI };
}
