/**
 * Auxeira Authentication Guard
 * Protects dashboard pages from unauthorized access
 * Redirects to main site (auxeira.com) if not authenticated
 */

class AuthGuard {
    constructor() {
        this.mainSiteURL = 'https://auxeira.com';
        this.tokenKey = 'auxeira_auth_token';
        this.userKey = 'auxeira_user_data';
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        const token = this.getToken();
        const userData = this.getUserData();
        
        if (!token || !userData) {
            return false;
        }

        // Check if token is expired
        if (this.isTokenExpired(token)) {
            this.clearAuth();
            return false;
        }

        return true;
    }

    /**
     * Get authentication token from storage
     * @returns {string|null}
     */
    getToken() {
        return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
    }

    /**
     * Get user data from storage
     * @returns {object|null}
     */
    getUserData() {
        const userDataStr = localStorage.getItem(this.userKey) || sessionStorage.getItem(this.userKey);
        if (!userDataStr) return null;
        
        try {
            return JSON.parse(userDataStr);
        } catch (e) {
            console.error('Failed to parse user data:', e);
            return null;
        }
    }

    /**
     * Check if token is expired
     * @param {string} token
     * @returns {boolean}
     */
    isTokenExpired(token) {
        try {
            // Decode JWT token (simple base64 decode for demo)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiryTime = payload.exp * 1000; // Convert to milliseconds
            return Date.now() >= expiryTime;
        } catch (e) {
            // If we can't decode, assume it's expired
            return true;
        }
    }

    /**
     * Clear authentication data
     */
    clearAuth() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        sessionStorage.removeItem(this.tokenKey);
        sessionStorage.removeItem(this.userKey);
    }

    /**
     * Protect current page - redirect if not authenticated
     * @param {string} requiredUserType - Optional: specific user type required
     */
    protect(requiredUserType = null) {
        if (!this.isAuthenticated()) {
            this.redirectToLogin();
            return false;
        }

        // Check user type if specified
        if (requiredUserType) {
            const userData = this.getUserData();
            if (userData.userType !== requiredUserType) {
                this.redirectToDashboard(userData.userType);
                return false;
            }
        }

        return true;
    }

    /**
     * Redirect to login page
     */
    redirectToLogin() {
        // Save current page for redirect after login
        sessionStorage.setItem('auxeira_redirect_after_login', window.location.href);
        
        // Redirect to main site
        window.location.href = this.mainSiteURL + '?action=signin';
    }

    /**
     * Redirect to appropriate dashboard based on user type
     * @param {string} userType
     */
    redirectToDashboard(userType) {
        const dashboardMap = {
            'startup_founder': '/dashboards/startup/index.html',
            'venture_capital': '/dashboards/vc/index.html',
            'angel_investor': '/dashboards/angel/index.html',
            'corporate_partner': '/dashboards/corporate/index.html',
            'government': '/dashboards/government/index.html',
            'esg_funder': '/dashboards/esg/index.html',
            'impact_investor': '/dashboards/impact/index.html'
        };

        const dashboardURL = dashboardMap[userType] || '/dashboards/startup/index.html';
        window.location.href = dashboardURL;
    }

    /**
     * Set authentication data (called after successful login)
     * @param {string} token
     * @param {object} userData
     * @param {boolean} rememberMe
     */
    setAuth(token, userData, rememberMe = false) {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(this.tokenKey, token);
        storage.setItem(this.userKey, JSON.stringify(userData));
    }

    /**
     * Logout user
     */
    logout() {
        this.clearAuth();
        this.redirectToLogin();
    }

    /**
     * Get current user info
     * @returns {object|null}
     */
    getCurrentUser() {
        return this.getUserData();
    }

    /**
     * Check if user has specific role/permission
     * @param {string} permission
     * @returns {boolean}
     */
    hasPermission(permission) {
        const userData = this.getUserData();
        if (!userData || !userData.permissions) return false;
        return userData.permissions.includes(permission);
    }
}

// Create singleton instance
const authGuard = new AuthGuard();

// Auto-protect dashboard pages on load
// This runs automatically when the script is loaded
if (window.location.pathname.includes('/dashboards/')) {
    document.addEventListener('DOMContentLoaded', () => {
        // For demo/testing: Allow access without auth if in development
        const isDevelopment = window.location.hostname === 'localhost' || 
                            window.location.hostname.includes('manusvm.computer');
        
        if (!isDevelopment) {
            authGuard.protect();
        } else {
            console.warn('🔓 Development mode: Authentication bypassed');
            // Create mock user data for development
            if (!authGuard.getUserData()) {
                const mockUser = {
                    userId: 'demo_user_123',
                    email: 'demo@auxeira.com',
                    name: 'Demo User',
                    userType: 'startup_founder',
                    permissions: ['read', 'write'],
                    createdAt: new Date().toISOString()
                };
                sessionStorage.setItem(authGuard.userKey, JSON.stringify(mockUser));
            }
        }
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = authGuard;
}

