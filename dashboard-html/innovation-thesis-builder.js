/**
 * Innovation Thesis Builder - AI-Powered Strategy Tool
 * Allows VCs to define and simulate custom investment theses
 * Features: Drag-and-drop sector mapping, risk scoring, projected returns
 */

class InnovationThesisBuilder {
    constructor() {
        this.currentThesis = {
            name: '',
            sectors: [],
            riskProfile: 'medium',
            targetIRR: 25,
            timeHorizon: 5,
            geographies: [],
            stages: [],
            thesisStatement: ''
        };
        
        this.sectorData = {
            'AI & Machine Learning': { growth: 42, risk: 'high', avgIRR: 35, dealCount: 1240 },
            'Climate Tech': { growth: 38, risk: 'medium', avgIRR: 28, dealCount: 890 },
            'Defense Tech': { growth: 34, risk: 'low', avgIRR: 22, dealCount: 450 },
            'Biotech': { growth: 31, risk: 'high', avgIRR: 40, dealCount: 670 },
            'Fintech': { growth: 25, risk: 'medium', avgIRR: 30, dealCount: 1560 },
            'Cybersecurity': { growth: 29, risk: 'medium', avgIRR: 32, dealCount: 780 },
            'Quantum Computing': { growth: 55, risk: 'very-high', avgIRR: 45, dealCount: 120 },
            'Space Tech': { growth: 48, risk: 'high', avgIRR: 38, dealCount: 230 },
            'HealthTech': { growth: 27, risk: 'medium', avgIRR: 26, dealCount: 980 },
            'EdTech': { growth: 18, risk: 'low', avgIRR: 20, dealCount: 560 }
        };
        
        this.charts = {};
    }

    /**
     * Initialize the Thesis Builder UI
     */
    initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = this.getBuilderHTML();
        this.attachEventListeners();
        this.renderThesisVisualization();
    }

    /**
     * Get HTML for the builder interface
     */
    getBuilderHTML() {
        return `
            <div class="innovation-thesis-builder">
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="glass-card p-4">
                            <h3 class="mb-3">
                                <i class="fas fa-lightbulb me-2 text-warning"></i>
                                Innovation Thesis Builder
                                <span class="badge bg-primary ms-2">AI-Powered</span>
                            </h3>
                            <p class="text-secondary mb-4">
                                Define and simulate custom investment theses with AI-driven insights and predictive analytics
                            </p>

                            <!-- Thesis Name -->
                            <div class="mb-4">
                                <label class="form-label">Thesis Name</label>
                                <input type="text" class="form-control" id="thesisName" 
                                    placeholder="e.g., AI in Climate Tech 2025" 
                                    value="${this.currentThesis.name}">
                            </div>

                            <!-- Thesis Statement -->
                            <div class="mb-4">
                                <label class="form-label">Thesis Statement</label>
                                <textarea class="form-control" id="thesisStatement" rows="3" 
                                    placeholder="Describe your investment thesis...">${this.currentThesis.thesisStatement}</textarea>
                                <button class="btn btn-sm btn-outline-primary mt-2" onclick="thesisBuilder.generateAIThesis()">
                                    <i class="fas fa-magic me-2"></i>Generate with AI
                                </button>
                            </div>

                            <!-- Sector Selection -->
                            <div class="mb-4">
                                <label class="form-label">Target Sectors (Drag to prioritize)</label>
                                <div id="sectorDragDrop" class="sector-drag-container">
                                    ${this.getSectorChipsHTML()}
                                </div>
                                <div id="selectedSectors" class="selected-sectors-container mt-3">
                                    <p class="text-muted small">Drag sectors here to build your thesis</p>
                                </div>
                            </div>

                            <!-- Investment Parameters -->
                            <div class="row mb-4">
                                <div class="col-md-4">
                                    <label class="form-label">Target IRR (%)</label>
                                    <input type="range" class="form-range" id="targetIRR" 
                                        min="15" max="50" value="${this.currentThesis.targetIRR}" 
                                        oninput="thesisBuilder.updateParameter('targetIRR', this.value)">
                                    <div class="text-center">
                                        <span class="badge bg-success" id="targetIRRValue">${this.currentThesis.targetIRR}%</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Time Horizon (years)</label>
                                    <input type="range" class="form-range" id="timeHorizon" 
                                        min="3" max="10" value="${this.currentThesis.timeHorizon}" 
                                        oninput="thesisBuilder.updateParameter('timeHorizon', this.value)">
                                    <div class="text-center">
                                        <span class="badge bg-info" id="timeHorizonValue">${this.currentThesis.timeHorizon} years</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Risk Profile</label>
                                    <select class="form-select" id="riskProfile" 
                                        onchange="thesisBuilder.updateParameter('riskProfile', this.value)">
                                        <option value="low">Conservative</option>
                                        <option value="medium" selected>Balanced</option>
                                        <option value="high">Aggressive</option>
                                        <option value="very-high">Very Aggressive</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Stage and Geography -->
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <label class="form-label">Investment Stages</label>
                                    <div class="btn-group-vertical w-100" role="group">
                                        <input type="checkbox" class="btn-check" id="stageSeed" value="Seed">
                                        <label class="btn btn-outline-primary" for="stageSeed">Seed</label>
                                        
                                        <input type="checkbox" class="btn-check" id="stageSeriesA" value="Series A">
                                        <label class="btn btn-outline-primary" for="stageSeriesA">Series A</label>
                                        
                                        <input type="checkbox" class="btn-check" id="stageSeriesB" value="Series B">
                                        <label class="btn btn-outline-primary" for="stageSeriesB">Series B+</label>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Target Geographies</label>
                                    <div class="btn-group-vertical w-100" role="group">
                                        <input type="checkbox" class="btn-check" id="geoUS" value="US">
                                        <label class="btn btn-outline-primary" for="geoUS">United States</label>
                                        
                                        <input type="checkbox" class="btn-check" id="geoEU" value="EU">
                                        <label class="btn btn-outline-primary" for="geoEU">Europe</label>
                                        
                                        <input type="checkbox" class="btn-check" id="geoAsia" value="Asia">
                                        <label class="btn btn-outline-primary" for="geoAsia">Asia Pacific</label>
                                    </div>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="d-flex gap-2">
                                <button class="btn btn-primary" onclick="thesisBuilder.simulateThesis()">
                                    <i class="fas fa-play me-2"></i>Simulate Thesis
                                </button>
                                <button class="btn btn-outline-success" onclick="thesisBuilder.getAIRecommendations()">
                                    <i class="fas fa-robot me-2"></i>Get AI Recommendations
                                </button>
                                <button class="btn btn-outline-secondary" onclick="thesisBuilder.exportThesis()">
                                    <i class="fas fa-download me-2"></i>Export PDF
                                </button>
                                <button class="btn btn-outline-danger" onclick="thesisBuilder.resetThesis()">
                                    <i class="fas fa-redo me-2"></i>Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Visualization Section -->
                <div class="row">
                    <div class="col-md-6 mb-4">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-chart-radar me-2"></i>Thesis Visualization
                            </h5>
                            <canvas id="thesisRadarChart" height="300"></canvas>
                        </div>
                    </div>
                    <div class="col-md-6 mb-4">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-chart-line me-2"></i>Projected Returns
                            </h5>
                            <canvas id="thesisReturnsChart" height="300"></canvas>
                        </div>
                    </div>
                </div>

                <!-- AI Recommendations -->
                <div class="row" id="aiRecommendationsSection" style="display: none;">
                    <div class="col-12">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-magic me-2 text-warning"></i>AI Recommendations
                            </h5>
                            <div id="aiRecommendationsContent"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get HTML for sector chips
     */
    getSectorChipsHTML() {
        return Object.keys(this.sectorData).map(sector => `
            <div class="sector-chip" draggable="true" data-sector="${sector}">
                <i class="fas fa-grip-vertical me-2"></i>
                ${sector}
                <span class="badge bg-secondary ms-2">${this.sectorData[sector].growth}% growth</span>
            </div>
        `).join('');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Drag and drop for sectors
        this.initializeDragDrop();
        
        // Input listeners
        document.getElementById('thesisName')?.addEventListener('input', (e) => {
            this.currentThesis.name = e.target.value;
        });
        
        document.getElementById('thesisStatement')?.addEventListener('input', (e) => {
            this.currentThesis.thesisStatement = e.target.value;
        });
    }

    /**
     * Initialize drag and drop functionality
     */
    initializeDragDrop() {
        const chips = document.querySelectorAll('.sector-chip');
        const dropZone = document.getElementById('selectedSectors');

        chips.forEach(chip => {
            chip.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.sector);
                e.target.style.opacity = '0.5';
            });

            chip.addEventListener('dragend', (e) => {
                e.target.style.opacity = '1';
            });
        });

        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                
                const sector = e.dataTransfer.getData('text/plain');
                this.addSectorToThesis(sector);
            });
        }
    }

    /**
     * Add sector to thesis
     */
    addSectorToThesis(sector) {
        if (!this.currentThesis.sectors.includes(sector)) {
            this.currentThesis.sectors.push(sector);
            this.renderSelectedSectors();
            this.renderThesisVisualization();
        }
    }

    /**
     * Remove sector from thesis
     */
    removeSectorFromThesis(sector) {
        this.currentThesis.sectors = this.currentThesis.sectors.filter(s => s !== sector);
        this.renderSelectedSectors();
        this.renderThesisVisualization();
    }

    /**
     * Render selected sectors
     */
    renderSelectedSectors() {
        const container = document.getElementById('selectedSectors');
        if (!container) return;

        if (this.currentThesis.sectors.length === 0) {
            container.innerHTML = '<p class="text-muted small">Drag sectors here to build your thesis</p>';
            return;
        }

        container.innerHTML = this.currentThesis.sectors.map((sector, index) => `
            <div class="selected-sector-item">
                <span class="badge bg-primary">${index + 1}</span>
                ${sector}
                <span class="badge bg-success ms-2">${this.sectorData[sector].avgIRR}% IRR</span>
                <button class="btn btn-sm btn-link text-danger" onclick="thesisBuilder.removeSectorFromThesis('${sector}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    /**
     * Update parameter
     */
    updateParameter(param, value) {
        this.currentThesis[param] = param === 'targetIRR' || param === 'timeHorizon' ? parseInt(value) : value;
        
        // Update display
        if (param === 'targetIRR') {
            document.getElementById('targetIRRValue').textContent = value + '%';
        } else if (param === 'timeHorizon') {
            document.getElementById('timeHorizonValue').textContent = value + ' years';
        }
        
        this.renderThesisVisualization();
    }

    /**
     * Render thesis visualization
     */
    renderThesisVisualization() {
        this.renderRadarChart();
        this.renderReturnsChart();
    }

    /**
     * Render radar chart
     */
    renderRadarChart() {
        const ctx = document.getElementById('thesisRadarChart');
        if (!ctx) return;

        if (this.charts.radar) {
            this.charts.radar.destroy();
        }

        const sectors = this.currentThesis.sectors.length > 0 
            ? this.currentThesis.sectors 
            : Object.keys(this.sectorData).slice(0, 5);

        this.charts.radar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Growth', 'IRR Potential', 'Deal Flow', 'Risk-Adjusted', 'Market Size'],
                datasets: sectors.map((sector, index) => ({
                    label: sector,
                    data: [
                        this.sectorData[sector].growth,
                        this.sectorData[sector].avgIRR,
                        this.sectorData[sector].dealCount / 20,
                        this.calculateRiskAdjusted(sector),
                        Math.random() * 50 + 50
                    ],
                    borderColor: this.getColorForIndex(index),
                    backgroundColor: this.getColorForIndex(index, 0.2)
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: { color: '#b3b3b3' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: { color: '#ffffff' }
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
     * Render returns chart
     */
    renderReturnsChart() {
        const ctx = document.getElementById('thesisReturnsChart');
        if (!ctx) return;

        if (this.charts.returns) {
            this.charts.returns.destroy();
        }

        const years = Array.from({length: this.currentThesis.timeHorizon}, (_, i) => i + 1);
        const baselineReturns = this.calculateProjectedReturns('baseline');
        const optimisticReturns = this.calculateProjectedReturns('optimistic');
        const pessimisticReturns = this.calculateProjectedReturns('pessimistic');

        this.charts.returns = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years.map(y => `Year ${y}`),
                datasets: [
                    {
                        label: 'Baseline Scenario',
                        data: baselineReturns,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Optimistic Scenario',
                        data: optimisticReturns,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Pessimistic Scenario',
                        data: pessimisticReturns,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { 
                            color: '#b3b3b3',
                            callback: (value) => value + 'x'
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
                    }
                }
            }
        });
    }

    /**
     * Calculate projected returns
     */
    calculateProjectedReturns(scenario) {
        const baseIRR = this.currentThesis.targetIRR / 100;
        const multiplier = scenario === 'optimistic' ? 1.3 : scenario === 'pessimistic' ? 0.7 : 1.0;
        
        return Array.from({length: this.currentThesis.timeHorizon}, (_, i) => {
            return Math.pow(1 + (baseIRR * multiplier), i + 1);
        });
    }

    /**
     * Calculate risk-adjusted score
     */
    calculateRiskAdjusted(sector) {
        const riskMultipliers = { 'low': 0.9, 'medium': 0.75, 'high': 0.6, 'very-high': 0.5 };
        const risk = this.sectorData[sector].risk;
        return this.sectorData[sector].avgIRR * (riskMultipliers[risk] || 0.75);
    }

    /**
     * Get color for chart index
     */
    getColorForIndex(index, alpha = 1) {
        const colors = [
            `rgba(59, 130, 246, ${alpha})`,
            `rgba(139, 92, 246, ${alpha})`,
            `rgba(16, 185, 129, ${alpha})`,
            `rgba(245, 158, 11, ${alpha})`,
            `rgba(239, 68, 68, ${alpha})`
        ];
        return colors[index % colors.length];
    }

    /**
     * Generate AI thesis statement
     */
    async generateAIThesis() {
        if (!auxeiraAI) {
            alert('AI client not initialized');
            return;
        }

        const data = {
            sectors: this.currentThesis.sectors,
            targetIRR: this.currentThesis.targetIRR,
            riskProfile: this.currentThesis.riskProfile
        };

        try {
            const content = await auxeiraAI.generateContent('VC', 'thesis', data);
            document.getElementById('thesisStatement').value = content;
            this.currentThesis.thesisStatement = content;
        } catch (error) {
            console.error('Failed to generate AI thesis:', error);
        }
    }

    /**
     * Simulate thesis
     */
    simulateThesis() {
        if (this.currentThesis.sectors.length === 0) {
            alert('Please select at least one sector');
            return;
        }

        // Show simulation results
        alert(`Thesis Simulation:\n\nProjected IRR: ${this.currentThesis.targetIRR}%\nTime Horizon: ${this.currentThesis.timeHorizon} years\nSectors: ${this.currentThesis.sectors.join(', ')}\n\nSimulation complete! Check the charts for detailed projections.`);
    }

    /**
     * Get AI recommendations
     */
    async getAIRecommendations() {
        const section = document.getElementById('aiRecommendationsSection');
        const content = document.getElementById('aiRecommendationsContent');
        
        if (!section || !content) return;

        section.style.display = 'block';
        content.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-2">Generating AI recommendations...</p></div>';

        // Simulate AI recommendations
        setTimeout(() => {
            content.innerHTML = `
                <div class="alert alert-success">
                    <h6><i class="fas fa-check-circle me-2"></i>Recommended Adjustments</h6>
                    <ul>
                        <li>Consider adding <strong>Defense Tech</strong> - funding surged 34% in H1 2025</li>
                        <li>Your target IRR of ${this.currentThesis.targetIRR}% aligns with top-quartile VCs</li>
                        <li>Reduce exposure to ${this.currentThesis.sectors[0] || 'high-risk sectors'} by 15% to optimize risk-adjusted returns</li>
                        <li>Expand to Asia Pacific geography - 42% growth in deal flow</li>
                    </ul>
                </div>
                <div class="alert alert-info">
                    <h6><i class="fas fa-lightbulb me-2"></i>Market Insights</h6>
                    <p>Based on PitchBook data, theses similar to yours achieved an average MOIC of 3.2x over 5 years.</p>
                </div>
            `;
        }, 2000);
    }

    /**
     * Export thesis as PDF
     */
    exportThesis() {
        // Implementation using html2pdf.js
        alert('PDF export feature - integrate with html2pdf.js');
    }

    /**
     * Reset thesis
     */
    resetThesis() {
        if (confirm('Are you sure you want to reset your thesis?')) {
            this.currentThesis = {
                name: '',
                sectors: [],
                riskProfile: 'medium',
                targetIRR: 25,
                timeHorizon: 5,
                geographies: [],
                stages: [],
                thesisStatement: ''
            };
            
            this.initialize('innovation-thesis-container');
        }
    }
}

// Initialize global instance
const thesisBuilder = new InnovationThesisBuilder();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InnovationThesisBuilder;
}

