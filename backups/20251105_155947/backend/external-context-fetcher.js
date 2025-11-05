/**
 * External Context Fetcher (MVP Version)
 * Fetches and formats external context from website, social media, and web mentions
 * 
 * MVP Approach:
 * - Manual input via API (users provide context during onboarding)
 * - Simple caching in memory
 * - Future: Automated fetching with web scraping and X API
 */

class ExternalContextFetcher {
    constructor() {
        this.cache = new Map();
        this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    }

    /**
     * Fetch all external context for a user (MVP: from manual input)
     * 
     * @param {string} userId - User ID
     * @param {Object} config - Configuration with URLs and handles
     * @param {string} config.websiteUrl - Website URL
     * @param {string} config.xHandle - X/Twitter handle
     * @param {string} config.startupName - Startup name for web search
     * @param {Object} config.manualContext - Manually provided context (MVP)
     * @returns {Promise<Object>} External context object
     */
    async fetchContext(userId, config) {
        // Check cache
        if (this.cache.has(userId)) {
            const cached = this.cache.get(userId);
            if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
                console.log('Using cached external context for user:', userId);
                return cached.data;
            }
        }

        const context = {
            website: null,
            social: null,
            webMentions: null,
            source: 'manual' // MVP: manual input
        };

        try {
            // MVP: Use manually provided context if available
            if (config.manualContext) {
                context.website = config.manualContext.website || null;
                context.social = config.manualContext.social || null;
                context.webMentions = config.manualContext.webMentions || null;
                context.source = 'manual';
            } else {
                // Future: Automated fetching
                // context.website = await this.fetchWebsiteData(config.websiteUrl);
                // context.social = await this.fetchSocialData(config.xHandle, config.startupName);
                // context.webMentions = await this.fetchWebMentions(config.startupName);
                console.log('No manual context provided. Automated fetching not yet implemented.');
            }

            // Cache the result
            this.cache.set(userId, {
                data: context,
                timestamp: Date.now()
            });

            return context;
        } catch (error) {
            console.error('Error fetching external context:', error);
            return context; // Return partial data
        }
    }

    /**
     * Fetch website data (Future implementation)
     * 
     * @param {string} url - Website URL
     * @returns {Promise<Object>} Website data
     */
    async fetchWebsiteData(url) {
        // TODO: Implement web scraping or browse_page tool
        // For now, return placeholder
        return {
            recentUpdates: 'Recent blog post on growth strategies',
            trafficSignals: '500 views, 20 shares',
            keyThemes: 'User acquisition, product-market fit'
        };
    }

    /**
     * Fetch X/Twitter data (Future implementation)
     * 
     * @param {string} handle - X/Twitter handle
     * @param {string} startupName - Startup name
     * @returns {Promise<Object>} Social data
     */
    async fetchSocialData(handle, startupName) {
        // TODO: Implement X API or x_semantic_search tool
        // For now, return placeholder
        return {
            recentPosts: [
                { text: 'Excited to announce our latest milestone!', engagement: 45 }
            ],
            engagement: { likes: 45, retweets: 12, replies: 8 },
            communityFeedback: ['Great product!', 'Love the UX']
        };
    }

    /**
     * Fetch web mentions (Future implementation)
     * 
     * @param {string} startupName - Startup name
     * @returns {Promise<Object>} Web mentions data
     */
    async fetchWebMentions(startupName) {
        // TODO: Implement web_search tool or Google Custom Search API
        // For now, return placeholder
        return {
            pressCoverage: [
                { source: 'TechCabal', snippet: 'Featured in African AI startups roundup' }
            ],
            industryMentions: [],
            socialProof: []
        };
    }

    /**
     * Format context for prompt injection
     * 
     * @param {Object} context - External context object
     * @returns {string} Formatted context string
     */
    formatForPrompt(context) {
        const parts = [];

        if (context.website) {
            if (typeof context.website === 'string') {
                parts.push(`Website: ${context.website}`);
            } else {
                const websiteParts = [];
                if (context.website.recentUpdates) websiteParts.push(context.website.recentUpdates);
                if (context.website.trafficSignals) websiteParts.push(`(${context.website.trafficSignals})`);
                if (websiteParts.length > 0) {
                    parts.push(`Website: ${websiteParts.join(' ')}`);
                }
            }
        }

        if (context.social) {
            if (typeof context.social === 'string') {
                parts.push(`X: ${context.social}`);
            } else {
                const socialParts = [];
                if (context.social.recentPosts && context.social.recentPosts.length > 0) {
                    const post = context.social.recentPosts[0];
                    socialParts.push(post.text);
                    if (post.engagement) socialParts.push(`(${post.engagement} engagements)`);
                }
                if (socialParts.length > 0) {
                    parts.push(`X: ${socialParts.join(' ')}`);
                }
            }
        }

        if (context.webMentions) {
            if (typeof context.webMentions === 'string') {
                parts.push(`Web: ${context.webMentions}`);
            } else {
                const webParts = [];
                if (context.webMentions.pressCoverage && context.webMentions.pressCoverage.length > 0) {
                    const mention = context.webMentions.pressCoverage[0];
                    webParts.push(`${mention.source}: ${mention.snippet}`);
                }
                if (webParts.length > 0) {
                    parts.push(`Web: ${webParts.join('; ')}`);
                }
            }
        }

        return parts.length > 0 ? parts.join('; ') : null;
    }

    /**
     * Clear cache for a specific user
     * 
     * @param {string} userId - User ID
     */
    clearCache(userId) {
        if (userId) {
            this.cache.delete(userId);
            console.log('Cleared cache for user:', userId);
        } else {
            this.cache.clear();
            console.log('Cleared all cache');
        }
    }

    /**
     * Get cache statistics
     * 
     * @returns {Object} Cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}

// Export for use in Lambda functions
module.exports = ExternalContextFetcher;

// Example usage:
/*
const fetcher = new ExternalContextFetcher();

// MVP: Manual input
const context = await fetcher.fetchContext('user123', {
    startupName: 'Auxeira',
    websiteUrl: 'https://auxeira.com',
    xHandle: '@auxeira',
    manualContext: {
        website: 'Recent blog on funding journey (500 views, 20 shares)',
        social: 'Post on traction got 45 engagements',
        webMentions: 'Mentioned in TechCabal article on African AI startups'
    }
});

const formatted = fetcher.formatForPrompt(context);
console.log(formatted);
// Output: "Website: Recent blog on funding journey (500 views, 20 shares); X: Post on traction got 45 engagements; Web: Mentioned in TechCabal article on African AI startups"
*/
