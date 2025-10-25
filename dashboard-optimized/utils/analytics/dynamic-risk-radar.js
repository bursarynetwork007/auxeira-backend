/**
 * Dynamic Risk Radar
 * Real-time portfolio risk monitoring with predictive alerts
 * Features: Multi-factor risk scoring, failure probability, mitigation suggestions
 * AI Model: Manus AI (complex risk analysis and scenario modeling)
 */

class DynamicRiskRadar {
    constructor() {
        this.riskData = [];
        this.charts = {};
        this.alertThresholds = {
            runway: 12, // months
            churn: 5, // percentage
            burnMultiple: 2.0,
            sentimentScore: 40
        };
        this.updateInterval = null;
    }

    /**
     * Initialize the risk radar
     */
    initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = this.getRadarHTML();
        this.loadRiskData();
        this.startLiveMonitoring();
    }

    /**
     * Get radar HTML
     */
    getRadarHTML() {
        return `
            <div class="dynamic-risk-radar">
                <!-- Header -->
                <div class="glass-card p-4 mb-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h3 class="mb-2">
                                <i class="fas fa-radar me-2 text-danger"></i>
                                Dynamic Risk Radar
                                <span class="badge bg-danger ms-2">Manus AI</span>
                                <span class="badge bg-success ms-2">
                                    <i class="fas fa-circle pulse-dot me-1"></i>Live
                                </span>
                            </h3>
                            <p class="text-secondary mb-0">
                                Predictive risk monitoring with AI-powered mitigation strategies
                            </p>
                        </div>
                        <div class="text-end">
                            <button class="btn btn-sm btn-outline-primary" onclick="riskRadar.configure()">
                                <i class="fas fa-cog me-1"></i>Configure Alerts
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Critical Alerts -->
                <div id="criticalAlerts"></div>

                <!-- Risk Overview -->
                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="glass-card p-4 text-center">
                            <div class="display-4 text-danger mb-2" id="highRiskCount">0</div>
                            <div class="text-muted">High Risk Companies</div>
                            <div class="small text-danger mt-2">Immediate action needed</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="glass-card p-4 text-center">
                            <div class="display-4 text-warning mb-2" id="mediumRiskCount">0</div>
                            <div class="text-muted">Medium Risk Companies</div>
                            <div class="small text-warning mt-2">Monitor closely</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="glass-card p-4 text-center">
                            <div class="display-4 text-success mb-2" id="lowRiskCount">0</div>
                            <div class="text-muted">Low Risk Companies</div>
                            <div class="small text-success mt-2">Healthy trajectory</div>
                        </div>
                    </div>
                </div>

                <!-- Risk Radar Chart -->
                <div class="row mb-4">
                    <div class="col-md-8">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-chart-radar me-2"></i>
                                Multi-Factor Risk Analysis
                            </h5>
                            <canvas id="riskRadarChart" height="350"></canvas>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                Top Risk Factors
                            </h5>
                            <div id="topRiskFactors">
                                <!-- Risk factors will be rendered here -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Company Risk Cards -->
                <div class="glass-card p-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h5 class="mb-0">
                            <i class="fas fa-building me-2"></i>
                            Company Risk Profiles
                        </h5>
                        <div>
                            <button class="btn btn-sm btn-outline-danger" onclick="riskRadar.filterBy('high')">
                                High Risk
                            </button>
                            <button class="btn btn-sm btn-outline-warning" onclick="riskRadar.filterBy('medium')">
                                Medium Risk
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="riskRadar.filterBy('low')">
                                Low Risk
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="riskRadar.filterBy('all')">
                                All
                            </button>
                        </div>
                    </div>

                    <div id="riskCards" class="row">
                        <!-- Risk cards will be rendered here -->
                    </div>
                </div>
            </div>

            <style>
                .pulse-dot {
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }

                .risk-meter {
                    height: 10px;
                    background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);
                    border-radius: 5px;
                    position: relative;
                    overflow: hidden;
                }

                .risk-indicator {
                    position: absolute;
                    top: -5px;
                    width: 20px;
                    height: 20px;
                    background: white;
                    border-radius: 50%;
                    border: 3px solid #333;
                    transition: left 0.5s ease;
                }

                .risk-card {
                    border-left: 4px solid;
                    transition: all 0.3s ease;
                }

                .risk-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }

                .risk-high { border-left-color: #ef4444; }
                .risk-medium { border-left-color: #f59e0b; }
                .risk-low { border-left-color: #10b981; }

                .mitigation-action {
                    background: rgba(59, 130, 246, 0.1);
                    border-left: 3px solid #3b82f6;
                    padding: 0.75rem;
                    border-radius: 4px;
                    margin-bottom: 0.5rem;
                }

                .failure-probability {
                    font-size: 2rem;
                    font-weight: bold;
                }
            </style>
        `;
    }

    /**
     * Load risk data
     */
    async loadRiskData() {
        // Show loading
        const container = document.getElementById('riskCards');
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-spinner fa-spin fa-3x text-primary mb-3"></i>
                    <p class="text-muted">Analyzing portfolio risk factors...</p>
                </div>
            `;
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Generate mock risk data
        this.riskData = this.generateMockRiskData();

        // Render components
        this.renderCriticalAlerts();
        this.renderRiskCounts();
        this.renderTopRiskFactors();
        this.renderRiskCards();
        this.renderRiskRadarChart();
    }

    /**
     * Generate mock risk data
     */
    generateMockRiskData() {
        return [
            {
                company: 'CloudSecure',
                riskLevel: 'low',
                failureProbability: 15,
                riskFactors: {
                    runway: 22, // months
                    churn: 2.1, // %
                    burnMultiple: 1.2,
                    sentiment: 85,
                    marketRisk: 20,
                    competitionRisk: 30
                },
                alerts: [],
                mitigationActions: [],
                trend: 'improving'
            },
            {
                company: 'HealthTech',
                riskLevel: 'medium',
                failureProbability: 45,
                riskFactors: {
                    runway: 14,
                    churn: 3.8,
                    burnMultiple: 1.8,
                    sentiment: 62,
                    marketRisk: 45,
                    competitionRisk: 50
                },
                alerts: [
                    { type: 'warning', message: 'Runway below 18 months', priority: 'medium' },
                    { type: 'info', message: 'Pivot mentioned in founder posts', priority: 'low' }
                ],
                mitigationActions: [
                    { action: 'Consider bridge financing round', impact: 'high', effort: 'medium' },
                    { action: 'Introduce to strategic healthcare partners', impact: 'medium', effort: 'low' }
                ],
                trend: 'stable'
            },
            {
                company: 'FinanceApp',
                riskLevel: 'low',
                failureProbability: 12,
                riskFactors: {
                    runway: 24,
                    churn: 1.5,
                    burnMultiple: 0.9,
                    sentiment: 92,
                    marketRisk: 15,
                    competitionRisk: 25
                },
                alerts: [],
                mitigationActions: [],
                trend: 'improving'
            },
            {
                company: 'TechCo',
                riskLevel: 'high',
                failureProbability: 72,
                riskFactors: {
                    runway: 6,
                    churn: 8.2,
                    burnMultiple: 3.5,
                    sentiment: 38,
                    marketRisk: 70,
                    competitionRisk: 65
                },
                alerts: [
                    { type: 'critical', message: 'Runway < 8 months - URGENT', priority: 'critical' },
                    { type: 'critical', message: 'Churn rate exceeds 5%', priority: 'critical' },
                    { type: 'warning', message: 'Burn multiple > 2x', priority: 'high' },
                    { type: 'warning', message: 'Negative sentiment detected', priority: 'high' }
                ],
                mitigationActions: [
                    { action: 'Emergency bridge financing or pivot', impact: 'critical', effort: 'high' },
                    { action: 'Reduce burn rate by 40%', impact: 'critical', effort: 'high' },
                    { action: 'Address customer churn immediately', impact: 'high', effort: 'medium' },
                    { action: 'Consider acqui-hire options', impact: 'medium', effort: 'medium' }
                ],
                trend: 'declining'
            }
        ];
    }

    /**
     * Render critical alerts
     */
    renderCriticalAlerts() {
        const alertContainer = document.getElementById('criticalAlerts');
        if (!alertContainer) return;

        const criticalCompanies = this.riskData.filter(c => 
            c.alerts.some(a => a.priority === 'critical')
        );

        if (criticalCompanies.length === 0) {
            alertContainer.innerHTML = '';
            return;
        }

        alertContainer.innerHTML = criticalCompanies.map(company => `
            <div class="alert alert-danger mb-3 border-danger" style="border-left: 5px solid #ef4444;">
                <div class="d-flex align-items-start">
                    <i class="fas fa-exclamation-circle fa-2x me-3"></i>
                    <div class="flex-grow-1">
                        <h5 class="alert-heading mb-2">
                            <strong>${company.company}</strong> - Critical Risk Alert
                        </h5>
                        <div class="mb-2">
                            <span class="badge bg-danger me-2">Failure Probability: ${company.failureProbability}%</span>
                            ${company.alerts.filter(a => a.priority === 'critical').map(alert => `
                                <span class="badge bg-dark me-1">${alert.message}</span>
                            `).join('')}
                        </div>
                        <div class="mt-3">
                            <strong>Recommended Actions:</strong>
                            <ul class="mb-0 mt-2">
                                ${company.mitigationActions.slice(0, 2).map(action => `
                                    <li>${action.action}</li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-outline-light" onclick="riskRadar.viewMitigationPlan('${company.company}')">
                        <i class="fas fa-shield-alt me-1"></i>View Plan
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render risk counts
     */
    renderRiskCounts() {
        const high = this.riskData.filter(c => c.riskLevel === 'high').length;
        const medium = this.riskData.filter(c => c.riskLevel === 'medium').length;
        const low = this.riskData.filter(c => c.riskLevel === 'low').length;

        document.getElementById('highRiskCount').textContent = high;
        document.getElementById('mediumRiskCount').textContent = medium;
        document.getElementById('lowRiskCount').textContent = low;
    }

    /**
     * Render top risk factors
     */
    renderTopRiskFactors() {
        const container = document.getElementById('topRiskFactors');
        if (!container) return;

        // Aggregate risk factors across portfolio
        const factorCounts = {
            'Low Runway': this.riskData.filter(c => c.riskFactors.runway < this.alertThresholds.runway).length,
            'High Churn': this.riskData.filter(c => c.riskFactors.churn > this.alertThresholds.churn).length,
            'High Burn': this.riskData.filter(c => c.riskFactors.burnMultiple > this.alertThresholds.burnMultiple).length,
            'Negative Sentiment': this.riskData.filter(c => c.riskFactors.sentiment < this.alertThresholds.sentimentScore).length,
            'Market Risk': this.riskData.filter(c => c.riskFactors.marketRisk > 50).length
        };

        const sorted = Object.entries(factorCounts)
            .filter(([_, count]) => count > 0)
            .sort((a, b) => b[1] - a[1]);

        container.innerHTML = sorted.length > 0 ? sorted.map(([factor, count]) => `
            <div class="d-flex justify-content-between align-items-center mb-3 p-2" 
                style="background: rgba(255,255,255,0.05); border-radius: 6px;">
                <span>${factor}</span>
                <span class="badge bg-danger">${count} ${count === 1 ? 'company' : 'companies'}</span>
            </div>
        `).join('') : '<p class="text-muted">No significant risk factors detected</p>';
    }

    /**
     * Render risk cards
     */
    renderRiskCards() {
        const container = document.getElementById('riskCards');
        if (!container) return;

        const sorted = [...this.riskData].sort((a, b) => b.failureProbability - a.failureProbability);

        container.innerHTML = sorted.map(company => `
            <div class="col-md-6 mb-4 risk-company-card" data-risk="${company.riskLevel}">
                <div class="glass-card p-4 risk-card risk-${company.riskLevel}">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h5 class="mb-1">${company.company}</h5>
                            <span class="badge ${this.getRiskBadgeClass(company.riskLevel)}">${company.riskLevel.toUpperCase()} RISK</span>
                        </div>
                        <div class="text-end">
                            <div class="failure-probability ${this.getFailureProbabilityColor(company.failureProbability)}">
                                ${company.failureProbability}%
                            </div>
                            <small class="text-muted">Failure Risk</small>
                        </div>
                    </div>

                    <!-- Risk Meter -->
                    <div class="risk-meter mb-3">
                        <div class="risk-indicator" style="left: ${company.failureProbability}%"></div>
                    </div>

                    <!-- Risk Factors -->
                    <div class="mb-3">
                        <small class="text-muted d-block mb-2">Risk Factors:</small>
                        <div class="row small">
                            <div class="col-6 mb-2">
                                <i class="fas fa-clock me-1 ${company.riskFactors.runway < 12 ? 'text-danger' : 'text-success'}"></i>
                                Runway: ${company.riskFactors.runway}mo
                            </div>
                            <div class="col-6 mb-2">
                                <i class="fas fa-users me-1 ${company.riskFactors.churn > 5 ? 'text-danger' : 'text-success'}"></i>
                                Churn: ${company.riskFactors.churn}%
                            </div>
                            <div class="col-6 mb-2">
                                <i class="fas fa-fire me-1 ${company.riskFactors.burnMultiple > 2 ? 'text-danger' : 'text-success'}"></i>
                                Burn: ${company.riskFactors.burnMultiple}x
                            </div>
                            <div class="col-6 mb-2">
                                <i class="fas fa-smile me-1 ${company.riskFactors.sentiment < 50 ? 'text-danger' : 'text-success'}"></i>
                                Sentiment: ${company.riskFactors.sentiment}
                            </div>
                        </div>
                    </div>

                    <!-- Alerts -->
                    ${company.alerts.length > 0 ? `
                        <div class="mb-3">
                            <small class="text-warning d-block mb-2">
                                <i class="fas fa-bell me-1"></i>Active Alerts (${company.alerts.length}):
                            </small>
                            ${company.alerts.slice(0, 2).map(alert => `
                                <div class="alert alert-${alert.priority === 'critical' ? 'danger' : 'warning'} py-2 px-3 mb-2 small">
                                    ${alert.message}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    <!-- Mitigation Actions -->
                    ${company.mitigationActions.length > 0 ? `
                        <div class="mb-3">
                            <small class="text-info d-block mb-2">
                                <i class="fas fa-shield-alt me-1"></i>AI-Suggested Actions:
                            </small>
                            ${company.mitigationActions.slice(0, 2).map(action => `
                                <div class="mitigation-action small">
                                    <i class="fas fa-arrow-right me-2"></i>${action.action}
                                    <div class="mt-1">
                                        <span class="badge bg-primary me-1">Impact: ${action.impact}</span>
                                        <span class="badge bg-secondary">Effort: ${action.effort}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    <!-- Trend -->
                    <div class="mb-3">
                        <small class="text-muted">
                            Trend: 
                            <i class="fas fa-arrow-${company.trend === 'improving' ? 'up text-success' : company.trend === 'declining' ? 'down text-danger' : 'right text-warning'} ms-1"></i>
                            <span class="${company.trend === 'improving' ? 'text-success' : company.trend === 'declining' ? 'text-danger' : 'text-warning'}">
                                ${company.trend}
                            </span>
                        </small>
                    </div>

                    <!-- Actions -->
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary flex-fill" 
                            onclick="riskRadar.viewFullAnalysis('${company.company}')">
                            <i class="fas fa-chart-line me-1"></i>Full Analysis
                        </button>
                        <button class="btn btn-sm btn-outline-success" 
                            onclick="riskRadar.viewMitigationPlan('${company.company}')">
                            <i class="fas fa-shield-alt me-1"></i>Mitigation
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render risk radar chart
     */
    renderRiskRadarChart() {
        const ctx = document.getElementById('riskRadarChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.radar) {
            this.charts.radar.destroy();
        }

        // Prepare data for each company
        const datasets = this.riskData.map(company => ({
            label: company.company,
            data: [
                100 - (company.riskFactors.runway / 24 * 100), // Invert so higher = more risk
                company.riskFactors.churn * 10,
                company.riskFactors.burnMultiple * 30,
                100 - company.riskFactors.sentiment,
                company.riskFactors.marketRisk,
                company.riskFactors.competitionRisk
            ],
            borderColor: this.getRiskColor(company.riskLevel),
            backgroundColor: this.getRiskColor(company.riskLevel, 0.2),
            borderWidth: 2
        }));

        this.charts.radar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Runway Risk', 'Churn Risk', 'Burn Risk', 'Sentiment Risk', 'Market Risk', 'Competition Risk'],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#b3b3b3' }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: '#b3b3b3', backdropColor: 'transparent' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        pointLabels: { color: '#b3b3b3' }
                    }
                }
            }
        });
    }

    /**
     * Helper methods
     */
    getRiskBadgeClass(level) {
        const classes = {
            high: 'bg-danger',
            medium: 'bg-warning',
            low: 'bg-success'
        };
        return classes[level] || 'bg-secondary';
    }

    getFailureProbabilityColor(prob) {
        if (prob >= 60) return 'text-danger';
        if (prob >= 30) return 'text-warning';
        return 'text-success';
    }

    getRiskColor(level, alpha = 1) {
        const colors = {
            high: `rgba(239, 68, 68, ${alpha})`,
            medium: `rgba(245, 158, 11, ${alpha})`,
            low: `rgba(16, 185, 129, ${alpha})`
        };
        return colors[level] || `rgba(107, 114, 128, ${alpha})`;
    }

    /**
     * Start live monitoring
     */
    startLiveMonitoring() {
        // Simulate live updates every 60 seconds
        this.updateInterval = setInterval(() => {
            console.log('Risk radar live update...');
            // In production, fetch new data from API
        }, 60000);
    }

    /**
     * Filter by risk level
     */
    filterBy(level) {
        const cards = document.querySelectorAll('.risk-company-card');
        cards.forEach(card => {
            if (level === 'all' || card.dataset.risk === level) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    /**
     * View full analysis
     */
    viewFullAnalysis(companyName) {
        const company = this.riskData.find(c => c.company === companyName);
        if (!company) return;

        alert(`Full Risk Analysis for ${companyName}\n\nFailure Probability: ${company.failureProbability}%\nRisk Level: ${company.riskLevel}\n\nKey Factors:\n- Runway: ${company.riskFactors.runway} months\n- Churn: ${company.riskFactors.churn}%\n- Burn Multiple: ${company.riskFactors.burnMultiple}x\n\n(Full analysis modal to be implemented)`);
    }

    /**
     * View mitigation plan
     */
    viewMitigationPlan(companyName) {
        const company = this.riskData.find(c => c.company === companyName);
        if (!company) return;

        const actions = company.mitigationActions.map((a, i) => 
            `${i + 1}. ${a.action} (Impact: ${a.impact}, Effort: ${a.effort})`
        ).join('\n');

        alert(`Mitigation Plan for ${companyName}\n\n${actions || 'No actions needed - company is healthy!'}`);
    }

    /**
     * Configure alerts
     */
    configure() {
        alert('Alert configuration panel - to be implemented\n\nCurrent thresholds:\n- Runway: < 12 months\n- Churn: > 5%\n- Burn Multiple: > 2.0x\n- Sentiment: < 40');
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        Object.values(this.charts).forEach(chart => chart.destroy());
    }
}

// Initialize global instance
const riskRadar = new DynamicRiskRadar();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicRiskRadar;
}

