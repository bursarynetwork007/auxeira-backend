/**
 * Auxeira Central Database Client
 * JavaScript library for integrating dashboards with the central database
 */

class AuxeiraCentralClient {
    constructor(config = {}) {
        this.apiEndpoint = config.apiEndpoint || 'https://api-central.auxeira.com';
        this.token = config.token || localStorage.getItem('auxeira_token');
        this.userType = config.userType || localStorage.getItem('auxeira_user_type');
        this.userId = config.userId || localStorage.getItem('auxeira_user_id');
        this.debug = config.debug || false;
        
        // Default headers
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (this.token) {
            this.headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        this.log('Auxeira Central Client initialized', { apiEndpoint: this.apiEndpoint, userType: this.userType });
    }
    
    log(message, data = null) {
        if (this.debug) {
            console.log(`[AuxeiraCentral] ${message}`, data);
        }
    }
    
    error(message, error = null) {
        console.error(`[AuxeiraCentral] ${message}`, error);
    }
    
    /**
     * Set authentication token
     */
    setToken(token, userType = null, userId = null) {
        this.token = token;
        this.headers['Authorization'] = `Bearer ${token}`;
        
        if (userType) {
            this.userType = userType;
            localStorage.setItem('auxeira_user_type', userType);
        }
        
        if (userId) {
            this.userId = userId;
            localStorage.setItem('auxeira_user_id', userId);
        }
        
        localStorage.setItem('auxeira_token', token);
        this.log('Token updated');
    }
    
    /**
     * Make HTTP request to API
     */
    async request(method, endpoint, data = null) {
        const url = `${this.apiEndpoint}${endpoint}`;
        
        const options = {
            method: method.toUpperCase(),
            headers: { ...this.headers },
            mode: 'cors'
        };
        
        if (data && (method.toLowerCase() === 'post' || method.toLowerCase() === 'put')) {
            options.body = JSON.stringify(data);
        }
        
        this.log(`${method.toUpperCase()} ${url}`, data);
        
        try {
            const response = await fetch(url, options);
            const responseData = await response.json();
            
            if (!response.ok) {
                throw new Error(responseData.error || `HTTP ${response.status}`);
            }
            
            this.log('Response received', responseData);
            return responseData;
            
        } catch (error) {
            this.error(`Request failed: ${method.toUpperCase()} ${url}`, error);
            throw error;
        }
    }
    
    /**
     * Authentication methods
     */
    async login(email, password) {
        try {
            const response = await this.request('POST', '/api/auth/login', {
                email,
                password
            });
            
            if (response.success) {
                this.setToken(
                    response.data.token,
                    response.data.userType,
                    response.data.userId
                );
                
                return response.data;
            }
            
            throw new Error('Login failed');
            
        } catch (error) {
            this.error('Login failed', error);
            throw error;
        }
    }
    
    async register(userData) {
        try {
            const response = await this.request('POST', '/api/auth/register', userData);
            
            if (response.success) {
                this.setToken(
                    response.data.token,
                    userData.userType,
                    response.data.userId
                );
                
                return response.data;
            }
            
            throw new Error('Registration failed');
            
        } catch (error) {
            this.error('Registration failed', error);
            throw error;
        }
    }
    
    /**
     * Dashboard data methods
     */
    async getDashboardMetrics(options = {}) {
        const params = new URLSearchParams({
            type: options.type || this.userType,
            days: options.days || 30,
            includeSynthetic: options.includeSynthetic !== false ? 'true' : 'false'
        });
        
        try {
            const response = await this.request('GET', `/api/dashboard/metrics?${params}`);
            return response.data;
        } catch (error) {
            this.error('Failed to get dashboard metrics', error);
            throw error;
        }
    }
    
    async createDashboardMetrics(metrics) {
        try {
            const response = await this.request('POST', '/api/dashboard/metrics', {
                metrics
            });
            return response;
        } catch (error) {
            this.error('Failed to create dashboard metrics', error);
            throw error;
        }
    }
    
    /**
     * Synthetic data methods
     */
    async generateSyntheticData(config = {}) {
        const defaultConfig = {
            userType: this.userType,
            dataType: 'metrics',
            count: 30,
            timeRangeDays: 30,
            variance: 0.2,
            trend: 'stable'
        };
        
        const finalConfig = { ...defaultConfig, ...config };
        
        try {
            const response = await this.request('POST', '/api/synthetic/generate', finalConfig);
            return response.data;
        } catch (error) {
            this.error('Failed to generate synthetic data', error);
            throw error;
        }
    }
    
    async getSyntheticTemplates() {
        try {
            const response = await this.request('GET', '/api/synthetic/templates');
            return response.data;
        } catch (error) {
            this.error('Failed to get synthetic templates', error);
            throw error;
        }
    }
    
    /**
     * SSE scoring methods
     */
    async calculateSSEScore(startupId, responses, isSynthetic = false) {
        try {
            const response = await this.request('POST', '/api/sse/calculate', {
                startupId,
                responses,
                isSynthetic
            });
            return response.data;
        } catch (error) {
            this.error('Failed to calculate SSE score', error);
            throw error;
        }
    }
    
    async getSSEScore(startupId) {
        try {
            const response = await this.request('GET', `/api/sse/score/${startupId}`);
            return response.data;
        } catch (error) {
            this.error('Failed to get SSE score', error);
            throw error;
        }
    }
    
    /**
     * Gamification methods
     */
    async completeAction(actionData) {
        try {
            const response = await this.request('POST', '/api/gamification/action', actionData);
            return response.data;
        } catch (error) {
            this.error('Failed to complete action', error);
            throw error;
        }
    }
    
    async getGamificationProfile() {
        try {
            const response = await this.request('GET', '/api/gamification/profile');
            return response.data;
        } catch (error) {
            this.error('Failed to get gamification profile', error);
            throw error;
        }
    }
    
    /**
     * Health check
     */
    async healthCheck() {
        try {
            const response = await this.request('GET', '/api/health');
            return response;
        } catch (error) {
            this.error('Health check failed', error);
            throw error;
        }
    }
    
    /**
     * Utility methods
     */
    isAuthenticated() {
        return !!this.token;
    }
    
    logout() {
        this.token = null;
        this.userType = null;
        this.userId = null;
        delete this.headers['Authorization'];
        
        localStorage.removeItem('auxeira_token');
        localStorage.removeItem('auxeira_user_type');
        localStorage.removeItem('auxeira_user_id');
        
        this.log('User logged out');
    }
    
    /**
     * Dashboard integration helpers
     */
    async initializeDashboard(dashboardType = null) {
        const type = dashboardType || this.userType;
        
        try {
            // Get initial metrics
            const metrics = await this.getDashboardMetrics({ type });
            
            // Get gamification profile if applicable
            let gamification = null;
            if (['startup_founder'].includes(type)) {
                try {
                    gamification = await this.getGamificationProfile();
                } catch (e) {
                    this.log('Gamification profile not available');
                }
            }
            
            return {
                metrics,
                gamification,
                userType: type,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            this.error('Dashboard initialization failed', error);
            throw error;
        }
    }
    
    /**
     * Real-time data updates
     */
    startPeriodicUpdates(callback, interval = 300000) { // 5 minutes default
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(async () => {
            try {
                const data = await this.initializeDashboard();
                callback(data);
            } catch (error) {
                this.error('Periodic update failed', error);
            }
        }, interval);
        
        this.log(`Started periodic updates every ${interval}ms`);
    }
    
    stopPeriodicUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            this.log('Stopped periodic updates');
        }
    }
    
    /**
     * Data transformation helpers
     */
    transformMetricsForChart(metrics, metricName) {
        return metrics
            .filter(m => m.metric_value && m.metric_value[metricName] !== undefined)
            .map(m => ({
                x: new Date(m.metric_timestamp),
                y: m.metric_value[metricName]
            }))
            .sort((a, b) => a.x - b.x);
    }
    
    getLatestMetricValue(metrics, metricName) {
        const filtered = metrics
            .filter(m => m.metric_value && m.metric_value[metricName] !== undefined)
            .sort((a, b) => new Date(b.metric_timestamp) - new Date(a.metric_timestamp));
        
        return filtered.length > 0 ? filtered[0].metric_value[metricName] : null;
    }
    
    calculateMetricTrend(metrics, metricName, periods = 2) {
        const values = metrics
            .filter(m => m.metric_value && m.metric_value[metricName] !== undefined)
            .sort((a, b) => new Date(b.metric_timestamp) - new Date(a.metric_timestamp))
            .slice(0, periods)
            .map(m => m.metric_value[metricName]);
        
        if (values.length < 2) return 0;
        
        const latest = values[0];
        const previous = values[1];
        
        return ((latest - previous) / previous) * 100;
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuxeiraCentralClient;
} else if (typeof define === 'function' && define.amd) {
    define([], function() {
        return AuxeiraCentralClient;
    });
} else {
    window.AuxeiraCentralClient = AuxeiraCentralClient;
}

// Usage example:
/*
// Initialize client
const auxeiraClient = new AuxeiraCentralClient({
    apiEndpoint: 'https://api-central.auxeira.com',
    debug: true
});

// Login
await auxeiraClient.login('user@example.com', 'password');

// Get dashboard data
const dashboardData = await auxeiraClient.initializeDashboard();

// Generate synthetic data
await auxeiraClient.generateSyntheticData({
    count: 50,
    trend: 'improving'
});

// Start real-time updates
auxeiraClient.startPeriodicUpdates((data) => {
    console.log('Dashboard updated:', data);
    updateDashboardUI(data);
});
*/
