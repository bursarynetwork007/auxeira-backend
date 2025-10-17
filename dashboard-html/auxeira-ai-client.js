/**
 * Auxeira AI Client Library
 * Frontend integration for AI-powered personalized content generation
 * Ferrari-level user experience with seamless AI integration
 */

class AuxeiraAIClient {
    constructor(config = {}) {
        this.apiBaseUrl = config.apiBaseUrl || 'http://localhost:3000';
        this.userProfile = null;
        this.cache = new Map();
        this.cacheTTL = config.cacheTTL || 30 * 60 * 1000; // 30 minutes
        this.retryAttempts = config.retryAttempts || 3;
        this.retryDelay = config.retryDelay || 1000;
    }

    /**
     * Initialize client and load user profile
     */
    async init() {
        try {
            await this.loadUserProfile();
            console.log('Auxeira AI Client initialized', this.userProfile);
            return true;
        } catch (error) {
            console.error('Failed to initialize AI Client:', error);
            return false;
        }
    }

    /**
     * Load user profile from API or localStorage
     */
    async loadUserProfile() {
        // Try localStorage first
        const cached = localStorage.getItem('auxeira_user_profile');
        if (cached) {
            try {
                this.userProfile = JSON.parse(cached);
                return this.userProfile;
            } catch (e) {
                console.warn('Invalid cached profile');
            }
        }

        // Fetch from API
        try {
            const response = await fetch(`${this.apiBaseUrl}/user-profile`);
            if (response.ok) {
                this.userProfile = await response.json();
                localStorage.setItem('auxeira_user_profile', JSON.stringify(this.userProfile));
                return this.userProfile;
            }
        } catch (error) {
            console.error('Failed to load user profile:', error);
        }

        // Fallback to default profile
        this.userProfile = {
            type: 'VC',
            name: 'User',
            preferences: {},
            subscriptionTier: 'free'
        };
        return this.userProfile;
    }

    /**
     * Generate content for a specific dashboard section
     */
    async generateContent(dashboard, tab, data, options = {}) {
        const cacheKey = `${dashboard}-${tab}-${JSON.stringify(data)}`;
        
        // Check cache
        if (!options.skipCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTTL) {
                console.log('Using cached content for', tab);
                return cached.content;
            }
        }

        // Generate new content
        try {
            const content = await this._generateWithRetry(dashboard, tab, data);
            
            // Cache the result
            this.cache.set(cacheKey, {
                content: content,
                timestamp: Date.now()
            });
            
            return content;
        } catch (error) {
            console.error('Content generation failed:', error);
            return this._getFallbackContent(dashboard, tab);
        }
    }

    /**
     * Generate content with retry logic
     */
    async _generateWithRetry(dashboard, tab, data, attempt = 1) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/generate-content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dashboard: dashboard,
                    tab: tab,
                    profile: this.userProfile,
                    data: data
                })
            });

            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            const result = await response.json();
            return result.html;
        } catch (error) {
            if (attempt < this.retryAttempts) {
                console.warn(`Retry attempt ${attempt} for ${tab}`);
                await this._delay(this.retryDelay * attempt);
                return this._generateWithRetry(dashboard, tab, data, attempt + 1);
            }
            throw error;
        }
    }

    /**
     * Generate causal inference narrative
     */
    async generateCausalNarrative(companyName, baselineMetrics, sseMetrics) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/generate-causal-narrative`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    companyName: companyName,
                    baselineMetrics: baselineMetrics,
                    sseMetrics: sseMetrics,
                    userProfile: this.userProfile
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate causal narrative');
            }

            const result = await response.json();
            return result.html;
        } catch (error) {
            console.error('Causal narrative generation failed:', error);
            return this._getCausalFallback(companyName);
        }
    }

    /**
     * Load and render content into a DOM element
     */
    async loadSection(dashboard, tab, elementId, data) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Element ${elementId} not found`);
            return;
        }

        // Show loading state
        element.innerHTML = this._getLoadingHTML();

        try {
            const content = await this.generateContent(dashboard, tab, data);
            element.innerHTML = content;
            
            // Execute any inline scripts
            this._executeScripts(element);
            
            // Trigger custom event
            element.dispatchEvent(new CustomEvent('auxeira:content-loaded', {
                detail: { dashboard, tab, data }
            }));
        } catch (error) {
            console.error('Failed to load section:', error);
            element.innerHTML = this._getErrorHTML();
        }
    }

    /**
     * Refresh content for a section
     */
    async refreshSection(dashboard, tab, elementId, data) {
        return this.loadSection(dashboard, tab, elementId, data);
    }

    /**
     * Execute scripts in loaded content
     */
    _executeScripts(container) {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            if (script.src) {
                newScript.src = script.src;
            } else {
                newScript.textContent = script.textContent;
            }
            script.parentNode.replaceChild(newScript, script);
        });
    }

    /**
     * Get loading HTML
     */
    _getLoadingHTML() {
        return `
            <div class="glass-card p-4 text-center">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="text-secondary">Generating personalized insights...</p>
            </div>
        `;
    }

    /**
     * Get error HTML
     */
    _getErrorHTML() {
        return `
            <div class="glass-card p-4 text-center">
                <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size: 2rem;"></i>
                <p class="text-secondary">Unable to load content. Please try again.</p>
                <button class="btn btn-primary btn-sm mt-2" onclick="location.reload()">
                    <i class="fas fa-refresh me-2"></i>Refresh
                </button>
            </div>
        `;
    }

    /**
     * Get fallback content for specific sections
     */
    _getFallbackContent(dashboard, tab) {
        const fallbacks = {
            overview: `
                <div class="glass-card p-4">
                    <h4 class="mb-3">Portfolio Overview</h4>
                    <p class="text-secondary">Your personalized insights are being prepared. Please check back shortly.</p>
                </div>
            `,
            analytics: `
                <div class="glass-card p-4">
                    <h4 class="mb-3">Analytics</h4>
                    <p class="text-secondary">Analytics data is currently unavailable.</p>
                </div>
            `,
            dealflow: `
                <div class="glass-card p-4">
                    <h4 class="mb-3">Deal Flow</h4>
                    <p class="text-secondary">No deals available at this time.</p>
                </div>
            `
        };

        return fallbacks[tab] || `
            <div class="glass-card p-4">
                <p class="text-secondary">Content temporarily unavailable.</p>
            </div>
        `;
    }

    /**
     * Get causal narrative fallback
     */
    _getCausalFallback(companyName) {
        return `
            <div class="causal-impact">
                <h5><i class="fas fa-chart-line me-2"></i>SSE Impact: ${companyName}</h5>
                <p class="text-secondary">Causal impact analysis is being generated. Please check back shortly.</p>
            </div>
        `;
    }

    /**
     * Delay helper
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('Cache cleared');
    }

    /**
     * Update user profile
     */
    updateProfile(newProfile) {
        this.userProfile = { ...this.userProfile, ...newProfile };
        localStorage.setItem('auxeira_user_profile', JSON.stringify(this.userProfile));
        this.clearCache(); // Clear cache when profile changes
    }

    /**
     * Check if premium features are available
     */
    isPremium() {
        return this.userProfile?.subscriptionTier === 'premium';
    }

    /**
     * Show premium upgrade prompt
     */
    showPremiumPrompt(feature) {
        return `
            <div class="glass-card p-4 text-center">
                <i class="fas fa-lock text-warning mb-3" style="font-size: 2rem;"></i>
                <h5>Premium Feature</h5>
                <p class="text-secondary">${feature} is available for premium subscribers.</p>
                <button class="btn btn-gradient mt-3" onclick="window.location.href='/upgrade'">
                    <i class="fas fa-crown me-2"></i>Upgrade to Premium
                </button>
            </div>
        `;
    }
}

// Initialize global instance
const auxeiraAI = new AuxeiraAIClient({
    apiBaseUrl: window.AUXEIRA_API_URL || 'http://localhost:3000'
});

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => auxeiraAI.init());
} else {
    auxeiraAI.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuxeiraAIClient;
}

