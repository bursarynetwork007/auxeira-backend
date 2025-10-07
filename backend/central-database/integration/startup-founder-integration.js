/**
 * Startup Founder Dashboard Integration Example
 * Shows how to integrate the existing dashboard with the central database
 */

// Initialize the central database client
const auxeiraClient = new AuxeiraCentralClient({
    apiEndpoint: 'https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod',
    debug: true
});

// Dashboard state management
let dashboardState = {
    metrics: [],
    gamification: null,
    lastUpdate: null,
    isLoading: false
};

/**
 * Initialize dashboard with central database integration
 */
async function initializeCentralDashboard() {
    try {
        dashboardState.isLoading = true;
        updateLoadingState(true);
        
        // Check if user is authenticated
        if (!auxeiraClient.isAuthenticated()) {
            // Try to authenticate with existing session or redirect to login
            const token = localStorage.getItem('auxeira_token');
            if (token) {
                auxeiraClient.setToken(token);
            } else {
                showLoginModal();
                return;
            }
        }
        
        // Initialize dashboard data
        const data = await auxeiraClient.initializeDashboard('startup_founder');
        
        dashboardState.metrics = data.metrics;
        dashboardState.gamification = data.gamification;
        dashboardState.lastUpdate = new Date();
        
        // Update UI with real data
        updateDashboardUI(data);
        
        // Start periodic updates
        auxeiraClient.startPeriodicUpdates(handleDataUpdate, 300000); // 5 minutes
        
        console.log('Dashboard initialized with central database');
        
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        showErrorMessage('Failed to load dashboard data. Using synthetic data.');
        
        // Fallback to synthetic data generation
        await generateFallbackData();
        
    } finally {
        dashboardState.isLoading = false;
        updateLoadingState(false);
    }
}

/**
 * Handle periodic data updates
 */
function handleDataUpdate(data) {
    dashboardState.metrics = data.metrics;
    dashboardState.gamification = data.gamification;
    dashboardState.lastUpdate = new Date();
    
    updateDashboardUI(data);
    console.log('Dashboard data updated');
}

/**
 * Update dashboard UI with new data
 */
function updateDashboardUI(data) {
    // Update SSE score
    updateSSEScore(data.metrics);
    
    // Update metrics cards
    updateMetricsCards(data.metrics);
    
    // Update charts
    updateCharts(data.metrics);
    
    // Update gamification elements
    if (data.gamification) {
        updateGamificationUI(data.gamification);
    }
    
    // Update timestamp
    updateLastRefreshTime();
}

/**
 * Update SSE score display
 */
function updateSSEScore(metrics) {
    const latestSSE = auxeiraClient.getLatestMetricValue(metrics, 'sse_score');
    
    if (latestSSE !== null) {
        const scoreElement = document.getElementById('marketScore');
        if (scoreElement) {
            // Animate score change
            animateValue(scoreElement, parseInt(scoreElement.textContent), latestSSE, 1000);
        }
        
        // Update percentile
        const percentile = Math.min(95, Math.max(5, Math.round(latestSSE * 1.2)));
        const percentileElement = document.querySelector('.text-success');
        if (percentileElement) {
            percentileElement.innerHTML = `<i class="fas fa-arrow-up me-1"></i>Top ${100 - percentile}%`;
        }
    }
}

/**
 * Update metrics cards
 */
function updateMetricsCards(metrics) {
    const metricMappings = {
        'revenue': { selector: '#currentRevenue', format: 'currency' },
        'customers': { selector: '#customerCount', format: 'number' },
        'team_size': { selector: '#teamSize', format: 'number' },
        'burn_rate': { selector: '#burnRate', format: 'currency' },
        'runway_months': { selector: '#runwayMonths', format: 'number' }
    };
    
    Object.entries(metricMappings).forEach(([metricName, config]) => {
        const value = auxeiraClient.getLatestMetricValue(metrics, metricName);
        const element = document.querySelector(config.selector);
        
        if (value !== null && element) {
            const formattedValue = formatValue(value, config.format);
            element.textContent = formattedValue;
            
            // Add trend indicator
            const trend = auxeiraClient.calculateMetricTrend(metrics, metricName);
            updateTrendIndicator(element, trend);
        }
    });
}

/**
 * Update charts with real data
 */
function updateCharts(metrics) {
    // Update revenue chart
    updateRevenueChart(metrics);
    
    // Update customer growth chart
    updateCustomerChart(metrics);
    
    // Update SSE trend chart
    updateSSETrendChart(metrics);
}

/**
 * Update revenue chart
 */
function updateRevenueChart(metrics) {
    const revenueData = auxeiraClient.transformMetricsForChart(metrics, 'revenue');
    
    if (revenueData.length > 0 && window.revenueChart) {
        window.revenueChart.data.datasets[0].data = revenueData;
        window.revenueChart.update('none');
    }
}

/**
 * Update customer growth chart
 */
function updateCustomerChart(metrics) {
    const customerData = auxeiraClient.transformMetricsForChart(metrics, 'customers');
    
    if (customerData.length > 0 && window.customerChart) {
        window.customerChart.data.datasets[0].data = customerData;
        window.customerChart.update('none');
    }
}

/**
 * Update SSE trend chart
 */
function updateSSETrendChart(metrics) {
    const sseData = auxeiraClient.transformMetricsForChart(metrics, 'sse_score');
    
    if (sseData.length > 0 && window.sseChart) {
        window.sseChart.data.datasets[0].data = sseData;
        window.sseChart.update('none');
    }
}

/**
 * Update gamification UI elements
 */
function updateGamificationUI(gamification) {
    // Update token count
    const tokenElement = document.querySelector('.status-badge.bg-success');
    if (tokenElement && gamification.total_tokens) {
        tokenElement.textContent = `${gamification.total_tokens.toLocaleString()} AUX`;
    }
    
    // Update streak
    const streakElement = document.querySelector('.week-number');
    if (streakElement && gamification.current_streak) {
        streakElement.textContent = gamification.current_streak;
    }
    
    // Update weekly actions
    const actionsElement = document.querySelector('#actionsThisWeek');
    if (actionsElement && gamification.actions_this_week) {
        actionsElement.textContent = gamification.actions_this_week;
    }
}

/**
 * Handle action completion
 */
async function completeAction(actionType, domain, baseTokens, metadata = {}) {
    try {
        const result = await auxeiraClient.completeAction({
            actionType,
            domain,
            baseTokens,
            metadata,
            isSynthetic: false
        });
        
        // Update gamification display
        const updatedProfile = await auxeiraClient.getGamificationProfile();
        updateGamificationUI(updatedProfile);
        
        // Show success notification
        showSuccessMessage(`Action completed! Earned ${result.tokensAwarded} AUX tokens.`);
        
        return result;
        
    } catch (error) {
        console.error('Failed to complete action:', error);
        showErrorMessage('Failed to record action. Please try again.');
        throw error;
    }
}

/**
 * Generate synthetic data for testing
 */
async function generateSyntheticData() {
    try {
        const result = await auxeiraClient.generateSyntheticData({
            userType: 'startup_founder',
            count: 30,
            timeRangeDays: 30,
            trend: 'improving',
            variance: 0.2
        });
        
        // Refresh dashboard
        const data = await auxeiraClient.initializeDashboard();
        updateDashboardUI(data);
        
        showSuccessMessage(`Generated ${result.generated} synthetic data points.`);
        
    } catch (error) {
        console.error('Failed to generate synthetic data:', error);
        showErrorMessage('Failed to generate synthetic data.');
    }
}

/**
 * Generate fallback data when central database is unavailable
 */
async function generateFallbackData() {
    // Use existing synthetic data generation logic from the original dashboard
    const fallbackData = {
        metrics: generateLocalSyntheticMetrics(),
        gamification: generateLocalGamificationData()
    };
    
    updateDashboardUI(fallbackData);
}

/**
 * Utility functions
 */
function formatValue(value, format) {
    switch (format) {
        case 'currency':
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
        case 'number':
            return new Intl.NumberFormat('en-US').format(value);
        default:
            return value.toString();
    }
}

function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.round(start + (end - start) * progress);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

function updateTrendIndicator(element, trend) {
    const parent = element.parentElement;
    let indicator = parent.querySelector('.trend-indicator');
    
    if (!indicator) {
        indicator = document.createElement('span');
        indicator.className = 'trend-indicator ms-2';
        parent.appendChild(indicator);
    }
    
    if (trend > 0) {
        indicator.innerHTML = `<i class="fas fa-arrow-up text-success"></i> ${trend.toFixed(1)}%`;
    } else if (trend < 0) {
        indicator.innerHTML = `<i class="fas fa-arrow-down text-danger"></i> ${Math.abs(trend).toFixed(1)}%`;
    } else {
        indicator.innerHTML = `<i class="fas fa-minus text-muted"></i> 0%`;
    }
}

function updateLoadingState(isLoading) {
    const loadingElements = document.querySelectorAll('.loading-indicator');
    loadingElements.forEach(el => {
        el.style.display = isLoading ? 'block' : 'none';
    });
}

function updateLastRefreshTime() {
    const timeElement = document.querySelector('#lastRefresh');
    if (timeElement) {
        timeElement.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }
}

function showSuccessMessage(message) {
    // Implementation depends on your notification system
    console.log('Success:', message);
    // You could use toast notifications, modals, etc.
}

function showErrorMessage(message) {
    // Implementation depends on your notification system
    console.error('Error:', message);
    // You could use toast notifications, modals, etc.
}

function showLoginModal() {
    // Implementation depends on your authentication system
    console.log('Please login to continue');
    // You could redirect to login page or show login modal
}

// Event listeners for dashboard actions
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initializeCentralDashboard();
    
    // Add event listeners for action buttons
    document.querySelectorAll('.btn-behavioral').forEach(button => {
        button.addEventListener('click', async function(e) {
            const actionType = this.dataset.action || 'generic_action';
            const domain = this.dataset.domain || 'general';
            const baseTokens = parseInt(this.dataset.tokens) || 50;
            
            try {
                await completeAction(actionType, domain, baseTokens);
            } catch (error) {
                console.error('Action completion failed:', error);
            }
        });
    });
    
    // Add refresh button
    const refreshButton = document.querySelector('#refreshData');
    if (refreshButton) {
        refreshButton.addEventListener('click', async function() {
            try {
                const data = await auxeiraClient.initializeDashboard();
                updateDashboardUI(data);
                showSuccessMessage('Dashboard refreshed successfully');
            } catch (error) {
                showErrorMessage('Failed to refresh dashboard');
            }
        });
    }
    
    // Add synthetic data generation button (for testing)
    const generateButton = document.querySelector('#generateSynthetic');
    if (generateButton) {
        generateButton.addEventListener('click', generateSyntheticData);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (auxeiraClient) {
        auxeiraClient.stopPeriodicUpdates();
    }
});

// Export for use in other scripts
window.dashboardIntegration = {
    initializeCentralDashboard,
    completeAction,
    generateSyntheticData,
    updateDashboardUI
};
