/**
 * ESG & Impact Innovation Tracker
 * Sustainability scoring and impact forecasting for portfolio companies
 * Features: ESG metrics, carbon footprint, diversity benchmarks, impact forecasts
 */

class ESGImpactTracker {
    constructor() {
        this.portfolioESG = {};
        this.charts = {};
        
        this.esgFramework = {
            environmental: {
                carbonFootprint: { weight: 0.3, unit: 'tons CO2e' },
                energyEfficiency: { weight: 0.2, unit: 'kWh/revenue' },
                wasteReduction: { weight: 0.15, unit: '% recycled' },
                waterUsage: { weight: 0.15, unit: 'L/employee' },
                greenInnovation: { weight: 0.2, unit: 'score' }
            },
            social: {
                diversityRatio: { weight: 0.25, unit: '% underrepresented' },
                employeeSatisfaction: { weight: 0.2, unit: 'NPS' },
                communityImpact: { weight: 0.2, unit: 'beneficiaries' },
                laborPractices: { weight: 0.2, unit: 'score' },
                dataPrivacy: { weight: 0.15, unit: 'compliance %' }
            },
            governance: {
                boardDiversity: { weight: 0.3, unit: '% diverse' },
                ethicsCompliance: { weight: 0.25, unit: 'score' },
                transparency: { weight: 0.2, unit: 'disclosure %' },
                riskManagement: { weight: 0.15, unit: 'score' },
                stakeholderEngagement: { weight: 0.1, unit: 'score' }
            }
        };

        this.impactMetrics = {
            jobsCreated: { baseline: 0, withSSE: 0, unit: 'jobs' },
            carbonReduced: { baseline: 0, withSSE: 0, unit: 'tons CO2e' },
            livesImpacted: { baseline: 0, withSSE: 0, unit: 'people' },
            economicValue: { baseline: 0, withSSE: 0, unit: '$' }
        };
    }

    /**
     * Initialize the tracker
     */
    initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Generate sample portfolio data
        this.generateSampleData();

        container.innerHTML = this.getTrackerHTML();
        this.renderCharts();
    }

    /**
     * Generate sample portfolio data
     */
    generateSampleData() {
        this.portfolioESG = {
            'TechCo AI': {
                sector: 'AI & Machine Learning',
                esgScore: 72,
                environmental: {
                    carbonFootprint: { value: 450, benchmark: 600, target: 300 },
                    energyEfficiency: { value: 85, benchmark: 70, target: 90 },
                    wasteReduction: { value: 65, benchmark: 50, target: 80 },
                    waterUsage: { value: 120, benchmark: 150, target: 100 },
                    greenInnovation: { value: 80, benchmark: 60, target: 90 }
                },
                social: {
                    diversityRatio: { value: 42, benchmark: 35, target: 50 },
                    employeeSatisfaction: { value: 68, benchmark: 60, target: 75 },
                    communityImpact: { value: 5000, benchmark: 3000, target: 10000 },
                    laborPractices: { value: 85, benchmark: 75, target: 90 },
                    dataPrivacy: { value: 95, benchmark: 85, target: 100 }
                },
                governance: {
                    boardDiversity: { value: 38, benchmark: 30, target: 50 },
                    ethicsCompliance: { value: 92, benchmark: 80, target: 95 },
                    transparency: { value: 78, benchmark: 70, target: 90 },
                    riskManagement: { value: 82, benchmark: 75, target: 90 },
                    stakeholderEngagement: { value: 70, benchmark: 65, target: 85 }
                },
                impactForecast: {
                    jobsCreated: { current: 45, projected: 120, withSSE: 162 },
                    carbonReduced: { current: 200, projected: 500, withSSE: 750 },
                    livesImpacted: { current: 5000, projected: 15000, withSSE: 22500 },
                    economicValue: { current: 2000000, projected: 8000000, withSSE: 11360000 }
                }
            },
            'GreenTech Solutions': {
                sector: 'Climate Tech',
                esgScore: 88,
                environmental: {
                    carbonFootprint: { value: 200, benchmark: 600, target: 150 },
                    energyEfficiency: { value: 95, benchmark: 70, target: 98 },
                    wasteReduction: { value: 85, benchmark: 50, target: 90 },
                    waterUsage: { value: 80, benchmark: 150, target: 70 },
                    greenInnovation: { value: 95, benchmark: 60, target: 98 }
                },
                social: {
                    diversityRatio: { value: 48, benchmark: 35, target: 55 },
                    employeeSatisfaction: { value: 75, benchmark: 60, target: 80 },
                    communityImpact: { value: 12000, benchmark: 3000, target: 20000 },
                    laborPractices: { value: 90, benchmark: 75, target: 95 },
                    dataPrivacy: { value: 88, benchmark: 85, target: 95 }
                },
                governance: {
                    boardDiversity: { value: 45, benchmark: 30, target: 55 },
                    ethicsCompliance: { value: 95, benchmark: 80, target: 98 },
                    transparency: { value: 85, benchmark: 70, target: 95 },
                    riskManagement: { value: 88, benchmark: 75, target: 95 },
                    stakeholderEngagement: { value: 82, benchmark: 65, target: 90 }
                },
                impactForecast: {
                    jobsCreated: { current: 32, projected: 90, withSSE: 121 },
                    carbonReduced: { current: 1500, projected: 5000, withSSE: 7500 },
                    livesImpacted: { current: 12000, projected: 40000, withSSE: 60000 },
                    economicValue: { current: 1500000, projected: 6000000, withSSE: 8520000 }
                }
            }
        };
    }

    /**
     * Get tracker HTML
     */
    getTrackerHTML() {
        return `
            <div class="esg-impact-tracker">
                <!-- Header -->
                <div class="glass-card p-4 mb-4">
                    <h3 class="mb-3">
                        <i class="fas fa-leaf me-2 text-success"></i>
                        ESG & Impact Innovation Tracker
                        <span class="badge bg-success ms-2">Sustainability Scoring</span>
                    </h3>
                    <p class="text-secondary mb-4">
                        Auto-score portfolio companies on ESG metrics with impact forecasts linked to fund performance
                    </p>

                    <div class="row">
                        <div class="col-md-3">
                            <div class="text-center p-3 border-start border-success border-3">
                                <h4 class="text-success mb-0">${this.calculatePortfolioESGScore()}</h4>
                                <small class="text-muted">Portfolio ESG Score</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center p-3 border-start border-info border-3">
                                <h4 class="text-info mb-0">${this.calculateTotalImpact('jobsCreated')}</h4>
                                <small class="text-muted">Jobs Created (Projected)</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center p-3 border-start border-warning border-3">
                                <h4 class="text-warning mb-0">${this.calculateTotalImpact('carbonReduced')}t</h4>
                                <small class="text-muted">CO2 Reduced (Projected)</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center p-3 border-start border-primary border-3">
                                <h4 class="text-primary mb-0">${this.calculateTotalImpact('livesImpacted').toLocaleString()}</h4>
                                <small class="text-muted">Lives Impacted</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tabs -->
                <ul class="nav nav-tabs mb-4" role="tablist">
                    <li class="nav-item">
                        <a class="nav-link active" data-bs-toggle="tab" href="#esg-overview-tab">
                            <i class="fas fa-chart-pie me-2"></i>Overview
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#esg-companies-tab">
                            <i class="fas fa-building me-2"></i>By Company
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#impact-forecast-tab">
                            <i class="fas fa-chart-line me-2"></i>Impact Forecast
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#benchmarks-tab">
                            <i class="fas fa-trophy me-2"></i>Benchmarks
                        </a>
                    </li>
                </ul>

                <!-- Tab Content -->
                <div class="tab-content">
                    <!-- Overview Tab -->
                    <div class="tab-pane fade show active" id="esg-overview-tab">
                        ${this.getOverviewHTML()}
                    </div>

                    <!-- By Company Tab -->
                    <div class="tab-pane fade" id="esg-companies-tab">
                        ${this.getCompanieHTML()}
                    </div>

                    <!-- Impact Forecast Tab -->
                    <div class="tab-pane fade" id="impact-forecast-tab">
                        ${this.getImpactForecastHTML()}
                    </div>

                    <!-- Benchmarks Tab -->
                    <div class="tab-pane fade" id="benchmarks-tab">
                        ${this.getBenchmarksHTML()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get overview HTML
     */
    getOverviewHTML() {
        return `
            <div class="row">
                <div class="col-md-6 mb-4">
                    <div class="glass-card p-4">
                        <h5 class="mb-3">
                            <i class="fas fa-chart-pie me-2"></i>Portfolio ESG Breakdown
                        </h5>
                        <canvas id="esgBreakdownChart" height="300"></canvas>
                    </div>
                </div>
                <div class="col-md-6 mb-4">
                    <div class="glass-card p-4">
                        <h5 class="mb-3">
                            <i class="fas fa-chart-bar me-2"></i>ESG Scores by Category
                        </h5>
                        <canvas id="esgCategoryChart" height="300"></canvas>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <div class="glass-card p-4">
                        <h5 class="mb-3">
                            <i class="fas fa-star me-2 text-warning"></i>
                            Impact Leaders
                        </h5>
                        ${this.getImpactLeadersHTML()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get companies HTML
     */
    getCompanieHTML() {
        return `
            <div class="row">
                ${Object.entries(this.portfolioESG).map(([company, data]) => `
                    <div class="col-md-6 mb-4">
                        <div class="glass-card p-4">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h5 class="mb-1">${company}</h5>
                                    <small class="text-muted">${data.sector}</small>
                                </div>
                                <div class="text-end">
                                    <h4 class="mb-0 ${this.getESGScoreColor(data.esgScore)}">${data.esgScore}</h4>
                                    <small class="text-muted">ESG Score</small>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1">
                                    <span class="small">Environmental</span>
                                    <span class="small">${this.calculateCategoryScore(data.environmental)}/100</span>
                                </div>
                                <div class="progress" style="height: 6px;">
                                    <div class="progress-bar bg-success" style="width: ${this.calculateCategoryScore(data.environmental)}%"></div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1">
                                    <span class="small">Social</span>
                                    <span class="small">${this.calculateCategoryScore(data.social)}/100</span>
                                </div>
                                <div class="progress" style="height: 6px;">
                                    <div class="progress-bar bg-info" style="width: ${this.calculateCategoryScore(data.social)}%"></div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1">
                                    <span class="small">Governance</span>
                                    <span class="small">${this.calculateCategoryScore(data.governance)}/100</span>
                                </div>
                                <div class="progress" style="height: 6px;">
                                    <div class="progress-bar bg-warning" style="width: ${this.calculateCategoryScore(data.governance)}%"></div>
                                </div>
                            </div>

                            <button class="btn btn-sm btn-outline-primary w-100" onclick="esgTracker.viewCompanyDetails('${company}')">
                                <i class="fas fa-eye me-2"></i>View Details
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Get impact forecast HTML
     */
    getImpactForecastHTML() {
        return `
            <div class="row mb-4">
                <div class="col-12">
                    <div class="glass-card p-4">
                        <h5 class="mb-3">
                            <i class="fas fa-chart-line me-2"></i>
                            Impact Forecast: With vs Without SSE
                        </h5>
                        <canvas id="impactForecastChart" height="200"></canvas>
                    </div>
                </div>
            </div>

            <div class="row">
                ${Object.entries(this.portfolioESG).map(([company, data]) => `
                    <div class="col-md-6 mb-4">
                        <div class="glass-card p-4">
                            <h6 class="mb-3">${company}</h6>
                            
                            ${Object.entries(data.impactForecast).map(([metric, values]) => {
                                const sseUplift = ((values.withSSE - values.projected) / values.projected * 100).toFixed(0);
                                return `
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between mb-2">
                                            <span class="text-capitalize">${metric.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <span class="badge bg-success">+${sseUplift}% with SSE</span>
                                        </div>
                                        <div class="d-flex gap-2 align-items-center">
                                            <div class="flex-fill">
                                                <small class="text-muted d-block">Current</small>
                                                <strong>${values.current.toLocaleString()}</strong>
                                            </div>
                                            <i class="fas fa-arrow-right text-muted"></i>
                                            <div class="flex-fill">
                                                <small class="text-muted d-block">Projected</small>
                                                <strong>${values.projected.toLocaleString()}</strong>
                                            </div>
                                            <i class="fas fa-arrow-right text-success"></i>
                                            <div class="flex-fill">
                                                <small class="text-success d-block">With SSE</small>
                                                <strong class="text-success">${values.withSSE.toLocaleString()}</strong>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Get benchmarks HTML
     */
    getBenchmarksHTML() {
        return `
            <div class="row">
                <div class="col-12">
                    <div class="glass-card p-4">
                        <h5 class="mb-3">
                            <i class="fas fa-trophy me-2"></i>
                            Industry Benchmarks
                        </h5>
                        <div class="alert alert-info">
                            <strong>LP Demand for ESG:</strong> 70% of LPs now require ESG reporting. 
                            Funds with strong ESG performance raise 15-20% more capital.
                        </div>
                        <div class="alert alert-success">
                            <strong>Your Portfolio:</strong> With an average ESG score of ${this.calculatePortfolioESGScore()}, 
                            you're in the top quartile of VC funds (benchmark: 65).
                        </div>
                        <div class="alert alert-warning">
                            <strong>Improvement Opportunity:</strong> Implementing SSE across all portfolio companies 
                            could increase your ESG score to ${(this.calculatePortfolioESGScore() * 1.15).toFixed(0)}, 
                            putting you in the top 10%.
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-12">
                    <div class="glass-card p-4">
                        <h5 class="mb-3">
                            <i class="fas fa-chart-bar me-2"></i>
                            ESG Performance vs Peers
                        </h5>
                        <canvas id="esgBenchmarkChart" height="200"></canvas>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get impact leaders HTML
     */
    getImpactLeadersHTML() {
        const leaders = Object.entries(this.portfolioESG)
            .sort((a, b) => b[1].esgScore - a[1].esgScore)
            .slice(0, 3);

        return `
            <div class="row">
                ${leaders.map(([company, data], index) => `
                    <div class="col-md-4">
                        <div class="text-center p-3">
                            <div class="mb-2">
                                ${index === 0 ? '<i class="fas fa-trophy fa-2x text-warning"></i>' : 
                                  index === 1 ? '<i class="fas fa-medal fa-2x" style="color: silver;"></i>' : 
                                  '<i class="fas fa-award fa-2x" style="color: #cd7f32;"></i>'}
                            </div>
                            <h5 class="mb-1">${company}</h5>
                            <p class="text-muted small mb-2">${data.sector}</p>
                            <h3 class="${this.getESGScoreColor(data.esgScore)}">${data.esgScore}</h3>
                            <small class="text-muted">ESG Score</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render charts
     */
    renderCharts() {
        this.renderESGBreakdownChart();
        this.renderESGCategoryChart();
        this.renderImpactForecastChart();
        this.renderESGBenchmarkChart();
    }

    /**
     * Render ESG breakdown chart
     */
    renderESGBreakdownChart() {
        const ctx = document.getElementById('esgBreakdownChart');
        if (!ctx) return;

        const avgScores = this.calculateAverageCategoryScores();

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Environmental', 'Social', 'Governance'],
                datasets: [{
                    data: [avgScores.environmental, avgScores.social, avgScores.governance],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                }
            }
        });
    }

    /**
     * Render ESG category chart
     */
    renderESGCategoryChart() {
        const ctx = document.getElementById('esgCategoryChart');
        if (!ctx) return;

        const avgScores = this.calculateAverageCategoryScores();

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Environmental', 'Social', 'Governance'],
                datasets: [{
                    label: 'Portfolio Average',
                    data: [avgScores.environmental, avgScores.social, avgScores.governance],
                    backgroundColor: 'rgba(59, 130, 246, 0.8)'
                }, {
                    label: 'Industry Benchmark',
                    data: [65, 60, 70],
                    backgroundColor: 'rgba(139, 92, 246, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: '#b3b3b3' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#b3b3b3' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                }
            }
        });
    }

    /**
     * Render impact forecast chart
     */
    renderImpactForecastChart() {
        const ctx = document.getElementById('impactForecastChart');
        if (!ctx) return;

        const metrics = ['jobsCreated', 'carbonReduced', 'livesImpacted'];
        const companies = Object.keys(this.portfolioESG);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: companies,
                datasets: metrics.map((metric, index) => ({
                    label: metric.replace(/([A-Z])/g, ' $1').trim(),
                    data: companies.map(company => {
                        const uplift = this.portfolioESG[company].impactForecast[metric].withSSE - 
                                      this.portfolioESG[company].impactForecast[metric].projected;
                        return uplift;
                    }),
                    backgroundColor: this.getColorForIndex(index, 0.8)
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#b3b3b3' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#b3b3b3' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    },
                    title: {
                        display: true,
                        text: 'SSE Impact Uplift by Metric',
                        color: '#ffffff'
                    }
                }
            }
        });
    }

    /**
     * Render ESG benchmark chart
     */
    renderESGBenchmarkChart() {
        const ctx = document.getElementById('esgBenchmarkChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Your Portfolio', 'Peer Average', 'Top Quartile', 'Top 10%'],
                datasets: [{
                    label: 'ESG Score',
                    data: [this.calculatePortfolioESGScore(), 65, 75, 85],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: '#b3b3b3' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        ticks: { color: '#b3b3b3' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    /**
     * Calculate portfolio ESG score
     */
    calculatePortfolioESGScore() {
        const scores = Object.values(this.portfolioESG).map(data => data.esgScore);
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    /**
     * Calculate category score
     */
    calculateCategoryScore(category) {
        const values = Object.values(category).map(metric => metric.value);
        return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }

    /**
     * Calculate average category scores
     */
    calculateAverageCategoryScores() {
        const companies = Object.values(this.portfolioESG);
        return {
            environmental: Math.round(companies.reduce((sum, c) => sum + this.calculateCategoryScore(c.environmental), 0) / companies.length),
            social: Math.round(companies.reduce((sum, c) => sum + this.calculateCategoryScore(c.social), 0) / companies.length),
            governance: Math.round(companies.reduce((sum, c) => sum + this.calculateCategoryScore(c.governance), 0) / companies.length)
        };
    }

    /**
     * Calculate total impact
     */
    calculateTotalImpact(metric) {
        return Object.values(this.portfolioESG).reduce((sum, company) => {
            return sum + company.impactForecast[metric].withSSE;
        }, 0);
    }

    /**
     * Get ESG score color
     */
    getESGScoreColor(score) {
        if (score >= 80) return 'text-success';
        if (score >= 60) return 'text-info';
        if (score >= 40) return 'text-warning';
        return 'text-danger';
    }

    /**
     * Get color for index
     */
    getColorForIndex(index, alpha = 1) {
        const colors = [
            `rgba(16, 185, 129, ${alpha})`,
            `rgba(59, 130, 246, ${alpha})`,
            `rgba(245, 158, 11, ${alpha})`
        ];
        return colors[index % colors.length];
    }

    /**
     * View company details
     */
    viewCompanyDetails(company) {
        alert(`View detailed ESG metrics for ${company} - to be implemented`);
    }
}

// Initialize global instance
const esgTracker = new ESGImpactTracker();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ESGImpactTracker;
}

