/**
 * ESG Leaderboard System
 * Competitive intelligence and benchmarking for ESG organizations
 */

class ESGLeaderboardSystem {
    constructor() {
        this.currentUser = null;
        this.leaderboardData = null;
        this.benchmarkMetrics = [
            'impact_score',
            'esg_rating',
            'carbon_reduction',
            'social_impact',
            'governance_score',
            'roi_performance',
            'sustainability_index',
            'innovation_score'
        ];
        
        this.organizationTypes = {
            'ESG Fund': 'ESG Funds',
            'Asset Manager': 'Asset Managers', 
            'Pension Fund': 'Pension Funds',
            'Sovereign Wealth Fund': 'Sovereign Wealth Funds',
            'Impact Investor': 'Impact Investors',
            'Corporate Foundation': 'Corporate Foundations',
            'NGO': 'NGOs',
            'Government Agency': 'Government Agencies',
            'Development Bank': 'Development Banks',
            'Family Office': 'Family Offices'
        };

        this.init();
    }

    async init() {
        await this.loadUserProfile();
        await this.loadLeaderboardData();
        this.setupLeaderboardTab();
    }

    // ===========================================
    // DATA LOADING & PROCESSING
    // ===========================================

    async loadUserProfile() {
        try {
            const token = localStorage.getItem('auxeira_token');
            if (!token) {
                this.currentUser = this.getDefaultProfile();
                return;
            }

            const response = await fetch('/api/profile/current', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.currentUser = await response.json();
            } else {
                this.currentUser = this.getDefaultProfile();
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.currentUser = this.getDefaultProfile();
        }
    }

    getDefaultProfile() {
        return {
            id: 'demo_org',
            org_name: 'Your Organization',
            org_type: 'ESG Fund',
            primary_geography: 'Global',
            aum: 2500000000, // $2.5B
            employees: 150,
            founded_year: 2018,
            esg_focus_areas: ['Climate Action', 'Social Impact'],
            current_metrics: {
                impact_score: 85,
                esg_rating: 'A',
                carbon_reduction: 32,
                social_impact: 78,
                governance_score: 92,
                roi_performance: 15.8,
                sustainability_index: 88,
                innovation_score: 76
            }
        };
    }

    async loadLeaderboardData() {
        try {
            // Try to fetch real data from API
            const response = await fetch('/api/leaderboard/data', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auxeira_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.leaderboardData = await response.json();
            } else {
                // Use mock data for demonstration
                this.leaderboardData = this.generateMockLeaderboardData();
            }
        } catch (error) {
            console.error('Error loading leaderboard data:', error);
            this.leaderboardData = this.generateMockLeaderboardData();
        }
    }

    generateMockLeaderboardData() {
        const organizations = [
            // ESG Funds
            { name: 'BlackRock Sustainable Energy Fund', type: 'ESG Fund', aum: 15000000000, region: 'Global', impact_score: 94, esg_rating: 'A+', carbon_reduction: 45, social_impact: 89, governance_score: 96, roi_performance: 18.2, sustainability_index: 95, innovation_score: 87 },
            { name: 'Vanguard ESG International', type: 'ESG Fund', aum: 12500000000, region: 'Global', impact_score: 91, esg_rating: 'A+', carbon_reduction: 42, social_impact: 85, governance_score: 94, roi_performance: 16.8, sustainability_index: 92, innovation_score: 83 },
            { name: 'Your Organization', type: 'ESG Fund', aum: 2500000000, region: 'Global', impact_score: 85, esg_rating: 'A', carbon_reduction: 32, social_impact: 78, governance_score: 92, roi_performance: 15.8, sustainability_index: 88, innovation_score: 76 },
            { name: 'Fidelity Sustainable Future Fund', type: 'ESG Fund', aum: 8900000000, region: 'North America', impact_score: 88, esg_rating: 'A', carbon_reduction: 38, social_impact: 82, governance_score: 91, roi_performance: 17.1, sustainability_index: 90, innovation_score: 79 },
            { name: 'Schroders Global Sustainable Growth', type: 'ESG Fund', aum: 6700000000, region: 'Europe', impact_score: 86, esg_rating: 'A', carbon_reduction: 35, social_impact: 80, governance_score: 89, roi_performance: 16.3, sustainability_index: 87, innovation_score: 81 },
            { name: 'Aberdeen Standard ESG Equity', type: 'ESG Fund', aum: 4200000000, region: 'Europe', impact_score: 83, esg_rating: 'A-', carbon_reduction: 29, social_impact: 75, governance_score: 88, roi_performance: 14.9, sustainability_index: 85, innovation_score: 73 },
            { name: 'MSCI KLD 400 Social Index Fund', type: 'ESG Fund', aum: 3800000000, region: 'North America', impact_score: 82, esg_rating: 'A-', carbon_reduction: 28, social_impact: 74, governance_score: 87, roi_performance: 14.2, sustainability_index: 84, innovation_score: 72 },
            { name: 'Calvert Equity Portfolio', type: 'ESG Fund', aum: 2100000000, region: 'North America', impact_score: 80, esg_rating: 'A-', carbon_reduction: 26, social_impact: 72, governance_score: 85, roi_performance: 13.8, sustainability_index: 82, innovation_score: 70 },

            // Impact Investors
            { name: 'TPG Rise Funds', type: 'Impact Investor', aum: 7500000000, region: 'Global', impact_score: 96, esg_rating: 'A+', carbon_reduction: 48, social_impact: 94, governance_score: 93, roi_performance: 22.1, sustainability_index: 97, innovation_score: 91 },
            { name: 'Bain Capital Double Impact', type: 'Impact Investor', aum: 5200000000, region: 'Global', impact_score: 93, esg_rating: 'A+', carbon_reduction: 44, social_impact: 91, governance_score: 91, roi_performance: 20.3, sustainability_index: 94, innovation_score: 88 },
            { name: 'Blue Haven Initiative', type: 'Impact Investor', aum: 1800000000, region: 'Global', impact_score: 89, esg_rating: 'A', carbon_reduction: 39, social_impact: 87, governance_score: 88, roi_performance: 18.7, sustainability_index: 91, innovation_score: 84 },

            // Corporate Foundations
            { name: 'Gates Foundation', type: 'Corporate Foundation', aum: 65000000000, region: 'Global', impact_score: 98, esg_rating: 'A+', carbon_reduction: 52, social_impact: 98, governance_score: 97, roi_performance: 12.4, sustainability_index: 99, innovation_score: 95 },
            { name: 'Ford Foundation', type: 'Corporate Foundation', aum: 16000000000, region: 'Global', impact_score: 95, esg_rating: 'A+', carbon_reduction: 46, social_impact: 95, governance_score: 94, roi_performance: 11.8, sustainability_index: 96, innovation_score: 89 },
            { name: 'Mastercard Foundation', type: 'Corporate Foundation', aum: 9000000000, region: 'Africa', impact_score: 92, esg_rating: 'A+', carbon_reduction: 41, social_impact: 93, governance_score: 90, roi_performance: 13.2, sustainability_index: 94, innovation_score: 86 },

            // Development Banks
            { name: 'World Bank IFC', type: 'Development Bank', aum: 125000000000, region: 'Global', impact_score: 97, esg_rating: 'A+', carbon_reduction: 50, social_impact: 96, governance_score: 95, roi_performance: 8.9, sustainability_index: 98, innovation_score: 92 },
            { name: 'African Development Bank', type: 'Development Bank', aum: 45000000000, region: 'Africa', impact_score: 94, esg_rating: 'A+', carbon_reduction: 47, social_impact: 94, governance_score: 92, roi_performance: 9.8, sustainability_index: 95, innovation_score: 88 },

            // Government Agencies
            { name: 'Norway Government Pension Fund', type: 'Government Agency', aum: 1400000000000, region: 'Europe', impact_score: 90, esg_rating: 'A+', carbon_reduction: 43, social_impact: 86, governance_score: 98, roi_performance: 7.2, sustainability_index: 93, innovation_score: 82 },
            { name: 'CalPERS', type: 'Government Agency', aum: 450000000000, region: 'North America', impact_score: 87, esg_rating: 'A', carbon_reduction: 37, social_impact: 83, governance_score: 95, roi_performance: 8.1, sustainability_index: 89, innovation_score: 78 }
        ];

        return {
            organizations: organizations,
            last_updated: new Date().toISOString(),
            total_organizations: organizations.length,
            user_rank: this.calculateUserRank(organizations)
        };
    }

    calculateUserRank(organizations) {
        const userOrg = organizations.find(org => org.name === 'Your Organization');
        if (!userOrg) return null;

        const sameTypeOrgs = organizations.filter(org => org.type === userOrg.type);
        sameTypeOrgs.sort((a, b) => b.impact_score - a.impact_score);
        
        return {
            overall: organizations.findIndex(org => org.name === 'Your Organization') + 1,
            category: sameTypeOrgs.findIndex(org => org.name === 'Your Organization') + 1,
            category_total: sameTypeOrgs.length
        };
    }

    // ===========================================
    // LEADERBOARD TAB SETUP
    // ===========================================

    setupLeaderboardTab() {
        this.addLeaderboardTab();
        this.renderLeaderboardContent();
    }

    addLeaderboardTab() {
        // Add leaderboard tab to existing navigation
        const tabsList = document.querySelector('#mainTabs');
        if (!tabsList) return;

        const leaderboardTab = document.createElement('li');
        leaderboardTab.className = 'nav-item';
        leaderboardTab.setAttribute('role', 'presentation');
        leaderboardTab.innerHTML = `
            <button class="nav-link" id="leaderboard-tab" data-bs-toggle="tab" data-bs-target="#leaderboard" type="button" role="tab">
                <i class="fas fa-trophy me-2"></i>Leaderboard
            </button>
        `;
        
        tabsList.appendChild(leaderboardTab);

        // Add leaderboard tab content
        const tabContent = document.querySelector('#mainTabContent');
        if (!tabContent) return;

        const leaderboardContent = document.createElement('div');
        leaderboardContent.className = 'tab-pane fade';
        leaderboardContent.id = 'leaderboard';
        leaderboardContent.setAttribute('role', 'tabpanel');
        leaderboardContent.innerHTML = `
            <div id="leaderboard-content">
                <!-- Leaderboard content will be rendered here -->
            </div>
        `;
        
        tabContent.appendChild(leaderboardContent);
    }

    renderLeaderboardContent() {
        const container = document.getElementById('leaderboard-content');
        if (!container) return;

        const userRank = this.leaderboardData.user_rank;
        const userOrg = this.leaderboardData.organizations.find(org => org.name === 'Your Organization');

        container.innerHTML = `
            <h3 class="text-success mb-4">
                <i class="fas fa-trophy me-2"></i>ESG Performance Leaderboard
            </h3>

            <!-- User Position Summary -->
            <div class="row mb-4">
                <div class="col-lg-12">
                    <div class="glass-card position-summary">
                        <div class="row align-items-center">
                            <div class="col-md-3 text-center">
                                <div class="rank-display">
                                    <div class="rank-number">#${userRank?.category || 'N/A'}</div>
                                    <div class="rank-label">Your Rank in ${this.organizationTypes[this.currentUser.org_type] || 'Category'}</div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h4 class="org-name">${this.currentUser.org_name}</h4>
                                <div class="performance-badges">
                                    <span class="badge bg-success">Impact Score: ${userOrg?.impact_score || 85}</span>
                                    <span class="badge bg-primary">ESG Rating: ${userOrg?.esg_rating || 'A'}</span>
                                    <span class="badge bg-warning">ROI: ${userOrg?.roi_performance || 15.8}%</span>
                                </div>
                                <div class="improvement-insights mt-2">
                                    <small class="text-muted">
                                        <i class="fas fa-lightbulb text-warning me-1"></i>
                                        Improve carbon reduction by 8% to reach top 3 in your category
                                    </small>
                                </div>
                            </div>
                            <div class="col-md-3 text-center">
                                <div class="percentile-display">
                                    <div class="percentile-number">${this.calculatePercentile(userRank?.category, userRank?.category_total)}%</div>
                                    <div class="percentile-label">Top Percentile</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Filter Controls -->
            <div class="row mb-4">
                <div class="col-lg-12">
                    <div class="glass-card filter-controls">
                        <div class="row align-items-center">
                            <div class="col-md-3">
                                <label class="form-label">Organization Type</label>
                                <select class="form-select" id="typeFilter" onchange="leaderboardSystem.filterLeaderboard()">
                                    <option value="all">All Types</option>
                                    ${Object.entries(this.organizationTypes).map(([key, value]) => 
                                        `<option value="${key}" ${key === this.currentUser.org_type ? 'selected' : ''}>${value}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Region</label>
                                <select class="form-select" id="regionFilter" onchange="leaderboardSystem.filterLeaderboard()">
                                    <option value="all">All Regions</option>
                                    <option value="Global">Global</option>
                                    <option value="North America">North America</option>
                                    <option value="Europe">Europe</option>
                                    <option value="Asia Pacific">Asia Pacific</option>
                                    <option value="Africa">Africa</option>
                                    <option value="Latin America">Latin America</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Sort By</label>
                                <select class="form-select" id="sortMetric" onchange="leaderboardSystem.sortLeaderboard()">
                                    <option value="impact_score">Impact Score</option>
                                    <option value="esg_rating">ESG Rating</option>
                                    <option value="carbon_reduction">Carbon Reduction</option>
                                    <option value="social_impact">Social Impact</option>
                                    <option value="roi_performance">ROI Performance</option>
                                    <option value="aum">Assets Under Management</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">View</label>
                                <div class="btn-group w-100" role="group">
                                    <button type="button" class="btn btn-outline-primary active" onclick="leaderboardSystem.switchView('table')">
                                        <i class="fas fa-table"></i>
                                    </button>
                                    <button type="button" class="btn btn-outline-primary" onclick="leaderboardSystem.switchView('chart')">
                                        <i class="fas fa-chart-bar"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Leaderboard Table -->
            <div id="leaderboard-table-view">
                ${this.renderLeaderboardTable()}
            </div>

            <!-- Leaderboard Chart -->
            <div id="leaderboard-chart-view" style="display: none;">
                ${this.renderLeaderboardChart()}
            </div>

            <!-- Competitive Analysis -->
            <div class="row mt-4">
                <div class="col-lg-6">
                    <div class="glass-card">
                        <h5 class="text-success mb-3">
                            <i class="fas fa-users me-2"></i>Peer Comparison
                        </h5>
                        <div id="peer-comparison-chart">
                            <canvas id="peerComparisonChart" height="300"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="glass-card">
                        <h5 class="text-success mb-3">
                            <i class="fas fa-chart-line me-2"></i>Performance Trends
                        </h5>
                        <div id="performance-trends-chart">
                            <canvas id="performanceTrendsChart" height="300"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Benchmarking Insights -->
            <div class="row mt-4">
                <div class="col-lg-12">
                    <div class="glass-card">
                        <h5 class="text-success mb-3">
                            <i class="fas fa-lightbulb me-2"></i>AI-Powered Benchmarking Insights
                        </h5>
                        <div class="insights-grid">
                            ${this.generateBenchmarkingInsights()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialize charts after rendering
        setTimeout(() => {
            this.initializePeerComparisonChart();
            this.initializePerformanceTrendsChart();
        }, 500);
    }

    renderLeaderboardTable() {
        const organizations = this.getFilteredOrganizations();
        
        return `
            <div class="glass-card">
                <div class="table-responsive">
                    <table class="table table-dark table-hover leaderboard-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Organization</th>
                                <th>Type</th>
                                <th>Region</th>
                                <th>Impact Score</th>
                                <th>ESG Rating</th>
                                <th>Carbon Reduction</th>
                                <th>Social Impact</th>
                                <th>ROI</th>
                                <th>AUM</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${organizations.map((org, index) => `
                                <tr class="${org.name === 'Your Organization' ? 'user-row' : ''}">
                                    <td>
                                        <span class="rank-badge ${this.getRankBadgeClass(index + 1)}">
                                            ${index + 1}
                                            ${index === 0 ? '<i class="fas fa-crown ms-1"></i>' : ''}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="org-info">
                                            <strong>${org.name}</strong>
                                            ${org.name === 'Your Organization' ? '<span class="badge bg-primary ms-2">You</span>' : ''}
                                        </div>
                                    </td>
                                    <td><span class="type-badge">${org.type}</span></td>
                                    <td>${org.region}</td>
                                    <td>
                                        <div class="score-display">
                                            <span class="score-value">${org.impact_score}</span>
                                            <div class="score-bar">
                                                <div class="score-fill" style="width: ${org.impact_score}%"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span class="esg-rating ${this.getESGRatingClass(org.esg_rating)}">${org.esg_rating}</span></td>
                                    <td>${org.carbon_reduction}%</td>
                                    <td>${org.social_impact}</td>
                                    <td>${org.roi_performance}%</td>
                                    <td>${this.formatAUM(org.aum)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderLeaderboardChart() {
        return `
            <div class="glass-card">
                <canvas id="leaderboardChart" height="400"></canvas>
            </div>
        `;
    }

    generateBenchmarkingInsights() {
        const userOrg = this.leaderboardData.organizations.find(org => org.name === 'Your Organization');
        const peers = this.getPeerOrganizations();
        const topPerformer = this.getTopPerformer();

        const insights = [
            {
                icon: 'fas fa-arrow-up',
                color: 'success',
                title: 'Carbon Reduction Opportunity',
                description: `Increase carbon reduction by ${topPerformer.carbon_reduction - userOrg.carbon_reduction}% to match ${topPerformer.name}'s performance`,
                action: 'View Carbon Strategy Report'
            },
            {
                icon: 'fas fa-users',
                color: 'info',
                title: 'Social Impact Gap',
                description: `Your social impact score is ${this.calculateAverageGap(peers, userOrg, 'social_impact')} points below peer average`,
                action: 'Explore Social Programs'
            },
            {
                icon: 'fas fa-chart-line',
                color: 'warning',
                title: 'ROI Benchmark',
                description: `Your ROI of ${userOrg.roi_performance}% is ${this.calculateROIPosition(peers, userOrg)}`,
                action: 'Optimize Portfolio'
            },
            {
                icon: 'fas fa-lightbulb',
                color: 'purple',
                title: 'Innovation Score',
                description: `Rank #${this.calculateInnovationRank(userOrg)} in innovation - focus on emerging technologies`,
                action: 'Innovation Roadmap'
            }
        ];

        return insights.map(insight => `
            <div class="insight-card">
                <div class="insight-icon">
                    <i class="${insight.icon} text-${insight.color}"></i>
                </div>
                <div class="insight-content">
                    <h6 class="insight-title">${insight.title}</h6>
                    <p class="insight-description">${insight.description}</p>
                    <button class="btn btn-outline-${insight.color} btn-sm">${insight.action}</button>
                </div>
            </div>
        `).join('');
    }

    // ===========================================
    // CHART INITIALIZATION
    // ===========================================

    initializePeerComparisonChart() {
        const ctx = document.getElementById('peerComparisonChart');
        if (!ctx) return;

        const userOrg = this.leaderboardData.organizations.find(org => org.name === 'Your Organization');
        const peers = this.getPeerOrganizations().slice(0, 5);
        
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Impact Score', 'ESG Rating', 'Carbon Reduction', 'Social Impact', 'Governance', 'ROI'],
                datasets: [{
                    label: 'Your Organization',
                    data: [
                        userOrg.impact_score,
                        this.convertESGRatingToNumber(userOrg.esg_rating),
                        userOrg.carbon_reduction * 2, // Scale for visibility
                        userOrg.social_impact,
                        userOrg.governance_score,
                        userOrg.roi_performance * 5 // Scale for visibility
                    ],
                    borderColor: 'var(--terminal-green)',
                    backgroundColor: 'rgba(0, 255, 65, 0.2)',
                    pointBackgroundColor: 'var(--terminal-green)'
                }, {
                    label: 'Peer Average',
                    data: [
                        this.calculatePeerAverage(peers, 'impact_score'),
                        this.calculatePeerAverage(peers, 'esg_rating', true),
                        this.calculatePeerAverage(peers, 'carbon_reduction') * 2,
                        this.calculatePeerAverage(peers, 'social_impact'),
                        this.calculatePeerAverage(peers, 'governance_score'),
                        this.calculatePeerAverage(peers, 'roi_performance') * 5
                    ],
                    borderColor: 'var(--terminal-yellow)',
                    backgroundColor: 'rgba(255, 255, 0, 0.1)',
                    pointBackgroundColor: 'var(--terminal-yellow)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Performance vs Peer Average',
                        color: 'var(--terminal-white)'
                    },
                    legend: {
                        labels: { color: 'var(--terminal-white)' }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: 'var(--terminal-white)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: { color: 'var(--terminal-white)' }
                    }
                }
            }
        });
    }

    initializePerformanceTrendsChart() {
        const ctx = document.getElementById('performanceTrendsChart');
        if (!ctx) return;

        // Mock historical data - in production this would come from API
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
        const userTrend = [78, 80, 82, 81, 83, 84, 85, 85, 84, 85];
        const peerAverage = [82, 83, 83, 84, 84, 85, 85, 86, 86, 87];

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Your Impact Score',
                    data: userTrend,
                    borderColor: 'var(--terminal-green)',
                    backgroundColor: 'rgba(0, 255, 65, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Peer Average',
                    data: peerAverage,
                    borderColor: 'var(--terminal-yellow)',
                    backgroundColor: 'rgba(255, 255, 0, 0.1)',
                    tension: 0.4,
                    fill: false,
                    borderDash: [5, 5]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Impact Score Trends (10 Months)',
                        color: 'var(--terminal-white)'
                    },
                    legend: {
                        labels: { color: 'var(--terminal-white)' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 70,
                        max: 95,
                        ticks: { color: 'var(--terminal-white)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: 'var(--terminal-white)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    // ===========================================
    // UTILITY METHODS
    // ===========================================

    getFilteredOrganizations() {
        let filtered = [...this.leaderboardData.organizations];
        
        const typeFilter = document.getElementById('typeFilter')?.value;
        const regionFilter = document.getElementById('regionFilter')?.value;
        
        if (typeFilter && typeFilter !== 'all') {
            filtered = filtered.filter(org => org.type === typeFilter);
        }
        
        if (regionFilter && regionFilter !== 'all') {
            filtered = filtered.filter(org => org.region === regionFilter);
        }
        
        // Sort by current metric
        const sortMetric = document.getElementById('sortMetric')?.value || 'impact_score';
        filtered.sort((a, b) => {
            if (sortMetric === 'esg_rating') {
                return this.convertESGRatingToNumber(b.esg_rating) - this.convertESGRatingToNumber(a.esg_rating);
            }
            return b[sortMetric] - a[sortMetric];
        });
        
        return filtered;
    }

    getPeerOrganizations() {
        return this.leaderboardData.organizations.filter(org => 
            org.type === this.currentUser.org_type && org.name !== 'Your Organization'
        );
    }

    getTopPerformer() {
        return this.leaderboardData.organizations
            .filter(org => org.type === this.currentUser.org_type)
            .sort((a, b) => b.impact_score - a.impact_score)[0];
    }

    calculatePercentile(rank, total) {
        if (!rank || !total) return 0;
        return Math.round(((total - rank + 1) / total) * 100);
    }

    calculateAverageGap(peers, userOrg, metric) {
        const average = peers.reduce((sum, peer) => sum + peer[metric], 0) / peers.length;
        return Math.round(average - userOrg[metric]);
    }

    calculateROIPosition(peers, userOrg) {
        const betterCount = peers.filter(peer => peer.roi_performance > userOrg.roi_performance).length;
        if (betterCount === 0) return 'leading the category';
        if (betterCount <= peers.length * 0.25) return 'in the top quartile';
        if (betterCount <= peers.length * 0.5) return 'above average';
        return 'below average - opportunity for improvement';
    }

    calculateInnovationRank(userOrg) {
        const sameType = this.leaderboardData.organizations.filter(org => org.type === userOrg.type);
        sameType.sort((a, b) => b.innovation_score - a.innovation_score);
        return sameType.findIndex(org => org.name === userOrg.name) + 1;
    }

    calculatePeerAverage(peers, metric, isESGRating = false) {
        if (isESGRating) {
            const sum = peers.reduce((acc, peer) => acc + this.convertESGRatingToNumber(peer[metric]), 0);
            return sum / peers.length;
        }
        return peers.reduce((sum, peer) => sum + peer[metric], 0) / peers.length;
    }

    convertESGRatingToNumber(rating) {
        const ratingMap = { 'A+': 95, 'A': 85, 'A-': 75, 'B+': 65, 'B': 55, 'B-': 45, 'C': 35 };
        return ratingMap[rating] || 50;
    }

    getRankBadgeClass(rank) {
        if (rank === 1) return 'rank-gold';
        if (rank === 2) return 'rank-silver';
        if (rank === 3) return 'rank-bronze';
        return 'rank-default';
    }

    getESGRatingClass(rating) {
        if (rating.includes('A')) return 'esg-excellent';
        if (rating.includes('B')) return 'esg-good';
        return 'esg-average';
    }

    formatAUM(aum) {
        if (aum >= 1000000000000) return `$${(aum / 1000000000000).toFixed(1)}T`;
        if (aum >= 1000000000) return `$${(aum / 1000000000).toFixed(1)}B`;
        if (aum >= 1000000) return `$${(aum / 1000000).toFixed(1)}M`;
        return `$${aum.toLocaleString()}`;
    }

    // ===========================================
    // INTERACTIVE METHODS
    // ===========================================

    filterLeaderboard() {
        const tableView = document.getElementById('leaderboard-table-view');
        if (tableView) {
            tableView.innerHTML = this.renderLeaderboardTable();
        }
    }

    sortLeaderboard() {
        this.filterLeaderboard(); // Re-render with new sort
    }

    switchView(viewType) {
        const tableView = document.getElementById('leaderboard-table-view');
        const chartView = document.getElementById('leaderboard-chart-view');
        const buttons = document.querySelectorAll('.btn-group .btn');
        
        buttons.forEach(btn => btn.classList.remove('active'));
        
        if (viewType === 'table') {
            tableView.style.display = 'block';
            chartView.style.display = 'none';
            buttons[0].classList.add('active');
        } else {
            tableView.style.display = 'none';
            chartView.style.display = 'block';
            buttons[1].classList.add('active');
            
            // Initialize leaderboard chart
            setTimeout(() => this.initializeLeaderboardChart(), 100);
        }
    }

    initializeLeaderboardChart() {
        const ctx = document.getElementById('leaderboardChart');
        if (!ctx) return;

        const organizations = this.getFilteredOrganizations().slice(0, 10);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: organizations.map(org => org.name.length > 20 ? org.name.substring(0, 20) + '...' : org.name),
                datasets: [{
                    label: 'Impact Score',
                    data: organizations.map(org => org.impact_score),
                    backgroundColor: organizations.map(org => 
                        org.name === 'Your Organization' ? 'var(--terminal-green)' : 'var(--terminal-blue)'
                    ),
                    borderColor: 'var(--terminal-white)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Top 10 Organizations by Impact Score',
                        color: 'var(--terminal-white)'
                    },
                    legend: {
                        labels: { color: 'var(--terminal-white)' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: 'var(--terminal-white)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { 
                            color: 'var(--terminal-white)',
                            maxRotation: 45
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }
}

// Initialize leaderboard system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.leaderboardSystem = new ESGLeaderboardSystem();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ESGLeaderboardSystem;
}
