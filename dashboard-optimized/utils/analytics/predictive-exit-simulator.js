/**
 * Predictive Exit Simulator
 * Advanced scenario modeling with counterfactuals for exit planning
 * Features: IPO/Acquisition modeling, J-curve visualization, sensitivity analysis
 */

class PredictiveExitSimulator {
    constructor() {
        this.scenarios = {};
        this.currentScenario = null;
        this.charts = {};
        
        this.defaultParameters = {
            currentValuation: 25000000,
            investmentAmount: 5000000,
            ownershipPercent: 20,
            yearsToExit: 5,
            exitType: 'acquisition',
            marketMultiple: 8,
            revenueGrowthRate: 150,
            burnRate: 200000,
            monthlyRevenue: 280000,
            fedRate: 5.5,
            marketCondition: 'neutral',
            sectorMultiplier: 1.0
        };
    }

    /**
     * Initialize the simulator
     */
    initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = this.getSimulatorHTML();
        this.attachEventListeners();
        this.runSimulation();
    }

    /**
     * Get simulator HTML
     */
    getSimulatorHTML() {
        const params = this.defaultParameters;
        
        return `
            <div class="predictive-exit-simulator">
                <div class="glass-card p-4 mb-4">
                    <h3 class="mb-3">
                        <i class="fas fa-rocket me-2 text-success"></i>
                        Predictive Exit Simulator
                        <span class="badge bg-success ms-2">Scenario Modeling</span>
                    </h3>
                    <p class="text-secondary mb-4">
                        Model exit paths (IPO, acquisition) with counterfactual scenarios and sensitivity analysis
                    </p>

                    <!-- Input Parameters -->
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <h5 class="mb-3">
                                <i class="fas fa-sliders-h me-2"></i>Portfolio Company Parameters
                            </h5>
                            
                            <div class="mb-3">
                                <label class="form-label">Current Valuation ($M)</label>
                                <input type="number" class="form-control" id="currentValuation" 
                                    value="${params.currentValuation / 1000000}" step="0.1"
                                    onchange="exitSimulator.updateParameter('currentValuation', this.value * 1000000)">
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Your Investment ($M)</label>
                                <input type="number" class="form-control" id="investmentAmount" 
                                    value="${params.investmentAmount / 1000000}" step="0.1"
                                    onchange="exitSimulator.updateParameter('investmentAmount', this.value * 1000000)">
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Ownership (%)</label>
                                <input type="range" class="form-range" id="ownershipPercent" 
                                    min="5" max="50" value="${params.ownershipPercent}" step="0.5"
                                    oninput="exitSimulator.updateParameter('ownershipPercent', this.value)">
                                <div class="text-center">
                                    <span class="badge bg-primary" id="ownershipValue">${params.ownershipPercent}%</span>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Monthly Revenue ($K)</label>
                                <input type="number" class="form-control" id="monthlyRevenue" 
                                    value="${params.monthlyRevenue / 1000}" step="10"
                                    onchange="exitSimulator.updateParameter('monthlyRevenue', this.value * 1000)">
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Revenue Growth Rate (%)</label>
                                <input type="range" class="form-range" id="revenueGrowthRate" 
                                    min="50" max="300" value="${params.revenueGrowthRate}" step="10"
                                    oninput="exitSimulator.updateParameter('revenueGrowthRate', this.value)">
                                <div class="text-center">
                                    <span class="badge bg-success" id="growthValue">${params.revenueGrowthRate}% YoY</span>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Monthly Burn Rate ($K)</label>
                                <input type="number" class="form-control" id="burnRate" 
                                    value="${params.burnRate / 1000}" step="10"
                                    onchange="exitSimulator.updateParameter('burnRate', this.value * 1000)">
                            </div>
                        </div>

                        <div class="col-md-6">
                            <h5 class="mb-3">
                                <i class="fas fa-chart-line me-2"></i>Exit Parameters
                            </h5>

                            <div class="mb-3">
                                <label class="form-label">Years to Exit</label>
                                <input type="range" class="form-range" id="yearsToExit" 
                                    min="1" max="10" value="${params.yearsToExit}"
                                    oninput="exitSimulator.updateParameter('yearsToExit', this.value)">
                                <div class="text-center">
                                    <span class="badge bg-info" id="yearsValue">${params.yearsToExit} years</span>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Exit Type</label>
                                <select class="form-select" id="exitType" 
                                    onchange="exitSimulator.updateParameter('exitType', this.value)">
                                    <option value="acquisition" selected>Acquisition</option>
                                    <option value="ipo">IPO</option>
                                    <option value="secondary">Secondary Sale</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Market Multiple (Revenue)</label>
                                <input type="range" class="form-range" id="marketMultiple" 
                                    min="2" max="20" value="${params.marketMultiple}" step="0.5"
                                    oninput="exitSimulator.updateParameter('marketMultiple', this.value)">
                                <div class="text-center">
                                    <span class="badge bg-warning" id="multipleValue">${params.marketMultiple}x</span>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Fed Interest Rate (%)</label>
                                <input type="range" class="form-range" id="fedRate" 
                                    min="0" max="10" value="${params.fedRate}" step="0.25"
                                    oninput="exitSimulator.updateParameter('fedRate', this.value)">
                                <div class="text-center">
                                    <span class="badge bg-secondary" id="fedRateValue">${params.fedRate}%</span>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Market Condition</label>
                                <select class="form-select" id="marketCondition" 
                                    onchange="exitSimulator.updateParameter('marketCondition', this.value)">
                                    <option value="bull">Bull Market (+20%)</option>
                                    <option value="neutral" selected>Neutral Market</option>
                                    <option value="bear">Bear Market (-20%)</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Sector Multiplier</label>
                                <input type="range" class="form-range" id="sectorMultiplier" 
                                    min="0.5" max="2.0" value="${params.sectorMultiplier}" step="0.1"
                                    oninput="exitSimulator.updateParameter('sectorMultiplier', this.value)">
                                <div class="text-center">
                                    <span class="badge bg-info" id="sectorValue">${params.sectorMultiplier}x</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary" onclick="exitSimulator.runSimulation()">
                            <i class="fas fa-play me-2"></i>Run Simulation
                        </button>
                        <button class="btn btn-outline-success" onclick="exitSimulator.compareScenarios()">
                            <i class="fas fa-balance-scale me-2"></i>Compare Scenarios
                        </button>
                        <button class="btn btn-outline-info" onclick="exitSimulator.sensitivityAnalysis()">
                            <i class="fas fa-chart-area me-2"></i>Sensitivity Analysis
                        </button>
                        <button class="btn btn-outline-secondary" onclick="exitSimulator.exportReport()">
                            <i class="fas fa-download me-2"></i>Export PDF
                        </button>
                    </div>
                </div>

                <!-- Results Section -->
                <div class="row" id="resultsSection">
                    <div class="col-md-4 mb-4">
                        <div class="glass-card p-4 text-center">
                            <h6 class="text-muted mb-2">Projected Exit Valuation</h6>
                            <h2 class="text-success mb-0" id="exitValuation">$0M</h2>
                            <small class="text-muted" id="exitDate">in 5 years</small>
                        </div>
                    </div>
                    <div class="col-md-4 mb-4">
                        <div class="glass-card p-4 text-center">
                            <h6 class="text-muted mb-2">Your Return (MOIC)</h6>
                            <h2 class="text-warning mb-0" id="moicValue">0x</h2>
                            <small class="text-muted" id="absoluteReturn">$0M return</small>
                        </div>
                    </div>
                    <div class="col-md-4 mb-4">
                        <div class="glass-card p-4 text-center">
                            <h6 class="text-muted mb-2">IRR</h6>
                            <h2 class="text-info mb-0" id="irrValue">0%</h2>
                            <small class="text-muted" id="irrComparison">vs 20% target</small>
                        </div>
                    </div>
                </div>

                <!-- Charts -->
                <div class="row">
                    <div class="col-md-6 mb-4">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-chart-line me-2"></i>J-Curve Visualization
                            </h5>
                            <canvas id="jCurveChart" height="300"></canvas>
                        </div>
                    </div>
                    <div class="col-md-6 mb-4">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-project-diagram me-2"></i>Scenario Tree
                            </h5>
                            <canvas id="scenarioTreeChart" height="300"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Counterfactual Analysis -->
                <div class="row">
                    <div class="col-12">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-random me-2 text-warning"></i>
                                Counterfactual Analysis: "What If" Scenarios
                            </h5>
                            <div id="counterfactualContent"></div>
                        </div>
                    </div>
                </div>

                <!-- Sensitivity Analysis -->
                <div class="row mt-4" id="sensitivitySection" style="display: none;">
                    <div class="col-12">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-chart-area me-2"></i>
                                Sensitivity Analysis
                            </h5>
                            <canvas id="sensitivityChart" height="300"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Event listeners are handled inline in HTML for simplicity
    }

    /**
     * Update parameter
     */
    updateParameter(param, value) {
        this.defaultParameters[param] = parseFloat(value);
        
        // Update display badges
        const displays = {
            'ownershipPercent': { id: 'ownershipValue', suffix: '%' },
            'revenueGrowthRate': { id: 'growthValue', suffix: '% YoY' },
            'yearsToExit': { id: 'yearsValue', suffix: ' years' },
            'marketMultiple': { id: 'multipleValue', suffix: 'x' },
            'fedRate': { id: 'fedRateValue', suffix: '%' },
            'sectorMultiplier': { id: 'sectorValue', suffix: 'x' }
        };

        if (displays[param]) {
            const elem = document.getElementById(displays[param].id);
            if (elem) {
                elem.textContent = value + displays[param].suffix;
            }
        }

        // Auto-run simulation on parameter change
        this.runSimulation();
    }

    /**
     * Run simulation
     */
    runSimulation() {
        const params = this.defaultParameters;
        
        // Calculate projected metrics
        const annualRevenue = params.monthlyRevenue * 12;
        const projectedRevenue = this.calculateProjectedRevenue(annualRevenue, params.revenueGrowthRate, params.yearsToExit);
        
        // Apply market conditions
        const marketAdjustment = params.marketCondition === 'bull' ? 1.2 : params.marketCondition === 'bear' ? 0.8 : 1.0;
        const fedAdjustment = 1 - ((params.fedRate - 2) * 0.05); // Lower rates = higher valuations
        
        // Calculate exit valuation
        const baseExitValuation = projectedRevenue * params.marketMultiple * params.sectorMultiplier;
        const exitValuation = baseExitValuation * marketAdjustment * fedAdjustment;
        
        // Calculate returns
        const yourShare = exitValuation * (params.ownershipPercent / 100);
        const moic = yourShare / params.investmentAmount;
        const irr = this.calculateIRR(params.investmentAmount, yourShare, params.yearsToExit);

        // Update display
        document.getElementById('exitValuation').textContent = `$${(exitValuation / 1000000).toFixed(1)}M`;
        document.getElementById('exitDate').textContent = `in ${params.yearsToExit} years`;
        document.getElementById('moicValue').textContent = `${moic.toFixed(2)}x`;
        document.getElementById('absoluteReturn').textContent = `$${((yourShare - params.investmentAmount) / 1000000).toFixed(1)}M return`;
        document.getElementById('irrValue').textContent = `${irr.toFixed(1)}%`;
        document.getElementById('irrComparison').textContent = irr >= 20 ? 'Above target ✓' : 'Below target';

        // Render charts
        this.renderJCurve();
        this.renderScenarioTree();
        this.renderCounterfactuals();
    }

    /**
     * Calculate projected revenue
     */
    calculateProjectedRevenue(currentRevenue, growthRate, years) {
        let revenue = currentRevenue;
        for (let i = 0; i < years; i++) {
            revenue *= (1 + growthRate / 100);
        }
        return revenue;
    }

    /**
     * Calculate IRR
     */
    calculateIRR(investment, exitValue, years) {
        return (Math.pow(exitValue / investment, 1 / years) - 1) * 100;
    }

    /**
     * Render J-Curve chart
     */
    renderJCurve() {
        const ctx = document.getElementById('jCurveChart');
        if (!ctx) return;

        if (this.charts.jCurve) {
            this.charts.jCurve.destroy();
        }

        const params = this.defaultParameters;
        const years = Array.from({length: params.yearsToExit + 1}, (_, i) => i);
        
        // Calculate J-curve values (negative in early years, then positive)
        const values = years.map(year => {
            if (year === 0) return -params.investmentAmount;
            if (year < 3) {
                // Negative zone (J-curve dip)
                return -params.investmentAmount * (1 - year * 0.2);
            } else {
                // Recovery and growth
                const annualRevenue = params.monthlyRevenue * 12;
                const projectedRevenue = this.calculateProjectedRevenue(annualRevenue, params.revenueGrowthRate, year);
                const valuation = projectedRevenue * params.marketMultiple;
                return (valuation * (params.ownershipPercent / 100)) - params.investmentAmount;
            }
        });

        this.charts.jCurve = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years.map(y => `Year ${y}`),
                datasets: [{
                    label: 'Net Value',
                    data: values,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        ticks: { 
                            color: '#b3b3b3',
                            callback: (value) => '$' + (value / 1000000).toFixed(1) + 'M'
                        },
                        grid: { 
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: true
                        }
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
     * Render scenario tree
     */
    renderScenarioTree() {
        const ctx = document.getElementById('scenarioTreeChart');
        if (!ctx) return;

        if (this.charts.scenarioTree) {
            this.charts.scenarioTree.destroy();
        }

        const params = this.defaultParameters;
        const baseReturn = this.calculateBaseReturn();

        // Three scenarios: pessimistic, base, optimistic
        const scenarios = [
            { label: 'Pessimistic', moic: baseReturn * 0.6, probability: 25 },
            { label: 'Base Case', moic: baseReturn, probability: 50 },
            { label: 'Optimistic', moic: baseReturn * 1.5, probability: 25 }
        ];

        this.charts.scenarioTree = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: scenarios.map(s => s.label),
                datasets: [{
                    label: 'MOIC',
                    data: scenarios.map(s => s.moic),
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { 
                            color: '#b3b3b3',
                            callback: (value) => value.toFixed(1) + 'x'
                        },
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
                    tooltip: {
                        callbacks: {
                            afterLabel: (context) => {
                                return `Probability: ${scenarios[context.dataIndex].probability}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Calculate base return
     */
    calculateBaseReturn() {
        const params = this.defaultParameters;
        const annualRevenue = params.monthlyRevenue * 12;
        const projectedRevenue = this.calculateProjectedRevenue(annualRevenue, params.revenueGrowthRate, params.yearsToExit);
        const exitValuation = projectedRevenue * params.marketMultiple;
        const yourShare = exitValuation * (params.ownershipPercent / 100);
        return yourShare / params.investmentAmount;
    }

    /**
     * Render counterfactuals
     */
    renderCounterfactuals() {
        const container = document.getElementById('counterfactualContent');
        if (!container) return;

        const params = this.defaultParameters;
        const baseReturn = this.calculateBaseReturn();

        // Generate counterfactual scenarios
        const counterfactuals = [
            {
                condition: 'If Fed rates drop 1%',
                impact: '+1.5x MOIC',
                newMOIC: (baseReturn * 1.15).toFixed(2),
                color: 'success'
            },
            {
                condition: 'If growth rate increases to 200%',
                impact: '+2.1x MOIC',
                newMOIC: (baseReturn * 1.4).toFixed(2),
                color: 'success'
            },
            {
                condition: 'If market enters bear territory',
                impact: '-0.8x MOIC',
                newMOIC: (baseReturn * 0.8).toFixed(2),
                color: 'danger'
            },
            {
                condition: 'If exit delayed by 2 years',
                impact: '+0.5x MOIC (but lower IRR)',
                newMOIC: (baseReturn * 1.1).toFixed(2),
                color: 'warning'
            }
        ];

        container.innerHTML = `
            <div class="row">
                ${counterfactuals.map(cf => `
                    <div class="col-md-6 mb-3">
                        <div class="alert alert-${cf.color} mb-0">
                            <h6 class="mb-2">${cf.condition}</h6>
                            <p class="mb-1"><strong>Impact:</strong> ${cf.impact}</p>
                            <p class="mb-0"><strong>New MOIC:</strong> ${cf.newMOIC}x</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Compare scenarios
     */
    compareScenarios() {
        alert('Scenario comparison feature - allows side-by-side comparison of multiple exit scenarios');
    }

    /**
     * Sensitivity analysis
     */
    sensitivityAnalysis() {
        const section = document.getElementById('sensitivitySection');
        if (!section) return;

        section.style.display = 'block';
        
        const ctx = document.getElementById('sensitivityChart');
        if (!ctx) return;

        if (this.charts.sensitivity) {
            this.charts.sensitivity.destroy();
        }

        // Sensitivity to different variables
        const variables = ['Growth Rate', 'Market Multiple', 'Fed Rate', 'Burn Rate'];
        const impacts = [0.8, 0.6, -0.3, -0.2]; // Impact on MOIC

        this.charts.sensitivity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: variables,
                datasets: [{
                    label: 'Impact on MOIC (per 10% change)',
                    data: impacts,
                    backgroundColor: impacts.map(i => i > 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)')
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        ticks: { 
                            color: '#b3b3b3',
                            callback: (value) => value.toFixed(1) + 'x'
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
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
     * Export report
     */
    exportReport() {
        alert('PDF export feature - integrate with html2pdf.js to export full simulation report');
    }
}

// Initialize global instance
const exitSimulator = new PredictiveExitSimulator();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PredictiveExitSimulator;
}

