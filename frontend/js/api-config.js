// Unified API Configuration for Auxeira Frontend
// This file centralizes all API endpoint configurations

const AuxeiraAPI = {
    // Base URL for all API calls
    BASE_URL: 'https://brhzyl9cj2.execute-api.us-east-1.amazonaws.com/dev',
    
    // API Endpoints
    ENDPOINTS: {
        // Health and Status
        HEALTH: '/health',
        STATUS: '/api/status',
        SOLANA_TEST: '/api/solana/test',
        
        // Authentication
        AUTH: {
            REGISTER: '/api/auth/register',
            SIGNUP: '/api/auth/signup', // Alias for register
            LOGIN: '/api/auth/login',
            VERIFY: '/api/auth/verify',
            PROFILE: '/api/auth/profile',
            LOGOUT: '/api/auth/logout'
        },
        
        // CAPTCHA
        CAPTCHA: {
            GENERATE: '/api/captcha/generate',
            VERIFY: '/api/captcha/verify'
        }
    },
    
    // Helper method to build full URLs
    getURL: function(endpoint) {
        return this.BASE_URL + endpoint;
    },
    
    // Common request configuration
    getRequestConfig: function(method = 'GET', data = null, includeAuth = false) {
        const config = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        // Add authorization header if token exists and auth is required
        if (includeAuth) {
            const token = localStorage.getItem('auxeira_token');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        // Add body for POST/PUT requests
        if (data && (method === 'POST' || method === 'PUT')) {
            config.body = JSON.stringify(data);
        }
        
        return config;
    },
    
    // Generic API request method
    async request(endpoint, method = 'GET', data = null, includeAuth = false) {
        try {
            const url = this.getURL(endpoint);
            const config = this.getRequestConfig(method, data, includeAuth);
            
            console.log(`API Request: ${method} ${url}`);
            
            const response = await fetch(url, config);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }
            
            return result;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    },
    
    // Convenience methods for common operations
    async get(endpoint, includeAuth = false) {
        return this.request(endpoint, 'GET', null, includeAuth);
    },
    
    async post(endpoint, data, includeAuth = false) {
        return this.request(endpoint, 'POST', data, includeAuth);
    },
    
    async put(endpoint, data, includeAuth = false) {
        return this.request(endpoint, 'PUT', data, includeAuth);
    },
    
    async delete(endpoint, includeAuth = false) {
        return this.request(endpoint, 'DELETE', null, includeAuth);
    }
};

// Make it globally available
window.AuxeiraAPI = AuxeiraAPI;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuxeiraAPI;
}
