/**
 * Auxeira API Client
 * Fetches real data from backend database
 * Replaces all mock/placeholder data
 */

class AuxeiraAPI {
    constructor(baseURL = '') {
        this.baseURL = baseURL || window.location.origin;
    }

    async fetch(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, options);
            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Fetch Error:', error);
            throw error;
        }
    }

    // Get startup dashboard data
    async getStartupDashboard() {
        const response = await this.fetch('/api/dashboard/startup');
        return response.data;
    }

    // Get VC dashboard data
    async getVCDashboard() {
        const response = await this.fetch('/api/dashboard/vc');
        return response.data;
    }

    // Get ESG dashboard data
    async getESGDashboard(sdg = null) {
        const endpoint = sdg ? `/api/dashboard/esg/${sdg}` : '/api/dashboard/esg';
        const response = await this.fetch(endpoint);
        return response.data;
    }

    // Get all startups
    async getStartups(page = 1, limit = 50) {
        const response = await this.fetch(`/api/startups?page=${page}&limit=${limit}`);
        return response.data;
    }

    // Get single startup
    async getStartup(id) {
        const response = await this.fetch(`/api/startups/${id}`);
        return response.data;
    }

    // Get time series data
    async getTimeSeries(id, days = 365) {
        const response = await this.fetch(`/api/startups/${id}/timeseries?days=${days}`);
        return response.data;
    }

    // Search startups
    async searchStartups(query, filters = {}) {
        const params = new URLSearchParams({ q: query, ...filters });
        const response = await this.fetch(`/api/search?${params}`);
        return response.data;
    }

    // Get statistics
    async getStats() {
        const response = await this.fetch('/api/stats');
        return response.data;
    }

    // Get Paystack public key
    async getPaystackKey() {
        const response = await this.fetch('/api/config/paystack-public-key');
        return response.data.publicKey;
    }
}

// Create global instance
window.auxeiraAPI = new AuxeiraAPI();

// Helper functions for dashboard integration

/**
 * Load startup dashboard data and update UI
 */
async function loadStartupDashboard() {
    try {
        const data = await window.auxeiraAPI.getStartupDashboard();
        
        // Update SSE Score
        updateElement('#sse-score', data.metrics.sseScore);
        updateElement('.sse-score-value', data.metrics.sseScore);
        
        // Update key metrics
        updateElement('#valuation', formatCurrency(data.metrics.valuation));
        updateElement('#mrr', formatCurrency(data.metrics.mrr));
        updateElement('#mrr-growth', `${data.metrics.mrrGrowth.toFixed(1)}%`);
        updateElement('#arr', formatCurrency(data.metrics.arr));
        updateElement('#customers', formatNumber(data.metrics.customers));
        updateElement('#customer-growth', `${data.metrics.customerGrowth.toFixed(1)}%`);
        updateElement('#cac', formatCurrency(data.metrics.cac));
        updateElement('#ltv', formatCurrency(data.metrics.ltv));
        updateElement('#ltv-cac-ratio', data.metrics.ltvCacRatio.toFixed(2));
        updateElement('#burn-rate', formatCurrency(data.metrics.burnRate));
        updateElement('#runway', `${data.metrics.runway.toFixed(1)} months`);
        updateElement('#team-size', data.metrics.teamSize);
        
        // Update startup info
        updateElement('#startup-name', data.startup.name);
        updateElement('#industry', data.startup.industry);
        updateElement('#stage', data.startup.stage);
        updateElement('#country', data.startup.country);
        
        // Update charts
        if (typeof updateMRRChart === 'function') {
            updateMRRChart(data.fullTimeSeries);
        }
        if (typeof updateCustomerChart === 'function') {
            updateCustomerChart(data.fullTimeSeries);
        }
        if (typeof updateSSEChart === 'function') {
            updateSSEChart(data.fullTimeSeries);
        }
        
        return data;
    } catch (error) {
        console.error('Error loading startup dashboard:', error);
        showError('Failed to load dashboard data');
    }
}

/**
 * Load VC dashboard data and update UI
 */
async function loadVCDashboard() {
    try {
        const data = await window.auxeiraAPI.getVCDashboard();
        
        // Update investor info
        updateElement('#investor-name', data.investor.name);
        updateElement('#investor-type', data.investor.type);
        updateElement('#portfolio-size', data.metrics.portfolioSize);
        updateElement('#total-invested', formatCurrency(data.metrics.totalInvested));
        updateElement('#total-value', formatCurrency(data.metrics.totalValue));
        updateElement('#avg-multiple', `${data.metrics.avgMultiple.toFixed(2)}x`);
        
        // Update portfolio table
        if (typeof updatePortfolioTable === 'function') {
            updatePortfolioTable(data.portfolio);
        }
        
        return data;
    } catch (error) {
        console.error('Error loading VC dashboard:', error);
        showError('Failed to load dashboard data');
    }
}

/**
 * Load ESG dashboard data and update UI
 */
async function loadESGDashboard(sdg = null) {
    try {
        const data = await window.auxeiraAPI.getESGDashboard(sdg);
        
        // Update metrics
        updateElement('#total-startups', formatNumber(data.metrics.totalStartups));
        updateElement('#total-beneficiaries', formatNumber(data.metrics.totalBeneficiaries));
        updateElement('#carbon-reduction', `${formatNumber(data.metrics.totalCarbonReduction)} tons`);
        updateElement('#avg-impact-score', data.metrics.avgImpactScore.toFixed(1));
        
        // Update startups list
        if (typeof updateESGStartupsList === 'function') {
            updateESGStartupsList(data.startups);
        }
        
        return data;
    } catch (error) {
        console.error('Error loading ESG dashboard:', error);
        showError('Failed to load dashboard data');
    }
}

// Helper functions

function updateElement(selector, value) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        if (el) el.textContent = value;
    });
}

function formatCurrency(value) {
    if (value >= 1e9) {
        return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
        return `$${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
        return `$${(value / 1e3).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
}

function formatNumber(value) {
    if (value >= 1e9) {
        return `${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
        return `${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
        return `${(value / 1e3).toFixed(2)}K`;
    }
    return value.toLocaleString();
}

function showError(message) {
    console.error(message);
    // Could show toast notification here
}

// Auto-load dashboard data on page load
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    if (path.includes('/startup')) {
        loadStartupDashboard();
    } else if (path.includes('/vc')) {
        loadVCDashboard();
    } else if (path.includes('/esg')) {
        const sdgMatch = path.match(/esg-(\w+)/);
        const sdg = sdgMatch ? sdgMatch[1] : null;
        loadESGDashboard(sdg);
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuxeiraAPI, loadStartupDashboard, loadVCDashboard, loadESGDashboard };
}

