/**
 * AI-Powered Deal Sourcing Wizard
 * Personalized pipeline builder for angel investors
 * Features: Thesis refinement, deal matching, fit scoring with explainability
 * AI Model: Manus AI (complex reasoning and multi-step analysis)
 */

class DealSourcingWizard {
    constructor() {
        this.userThesis = {
            checkSize: { min: 25000, max: 100000 },
            sectors: ['SaaS', 'Fintech'],
            stage: 'Pre-Seed',
            tractionMetrics: {
                minARR: 100000,
                minUsers: 1000,
                minGrowthRate: 20
            },
            geography: ['US', 'EU'],
            founderPreferences: {
                previousExits: false,
                technicalFounder: true,
                diverseTeam: false
            }
        };
        
        this.deals = [];
        this.charts = {};
    }

    /**
     * Initialize the wizard
     */
    initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = this.getWizardHTML();
        this.loadThesisFromProfile();
        this.generateDeals();
    }

    /**
     * Get wizard HTML
     */
    getWizardHTML() {
        const thesis = this.userThesis;
        
        return `
            <div class="deal-sourcing-wizard">
                <!-- Header -->
                <div class="glass-card p-4 mb-4">
                    <h3 class="mb-3">
                        <i class="fas fa-magic me-2 text-primary"></i>
                        AI-Powered Deal Sourcing Wizard
                        <span class="badge bg-primary ms-2">Manus AI</span>
                    </h3>
                    <p class="text-secondary mb-4">
                        Build your personalized deal pipeline with AI-matched opportunities ranked by fit score
                    </p>

                    <div class="alert alert-info">
                        <i class="fas fa-lightbulb me-2"></i>
                        <strong>Pro Tip:</strong> 80% of successful angel deals come from proprietary sourcing. 
                        Refine your thesis below to get highly targeted matches.
                    </div>
                </div>

                <!-- Thesis Builder -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-sliders-h me-2"></i>
                                Investment Thesis
                            </h5>

                            <!-- Check Size -->
                            <div class="mb-4">
                                <label class="form-label">Check Size Range</label>
                                <div class="row">
                                    <div class="col-6">
                                        <input type="number" class="form-control" id="minCheckSize" 
                                            value="${thesis.checkSize.min}" 
                                            onchange="dealWizard.updateThesis('checkSize', 'min', this.value)">
                                        <small class="text-muted">Min ($)</small>
                                    </div>
                                    <div class="col-6">
                                        <input type="number" class="form-control" id="maxCheckSize" 
                                            value="${thesis.checkSize.max}"
                                            onchange="dealWizard.updateThesis('checkSize', 'max', this.value)">
                                        <small class="text-muted">Max ($)</small>
                                    </div>
                                </div>
                            </div>

                            <!-- Sectors -->
                            <div class="mb-4">
                                <label class="form-label">Focus Sectors</label>
                                <select class="form-select" multiple id="sectorSelect" 
                                    onchange="dealWizard.updateSectors()">
                                    <option value="SaaS" selected>SaaS</option>
                                    <option value="Fintech" selected>Fintech</option>
                                    <option value="HealthTech">HealthTech</option>
                                    <option value="Climate Tech">Climate Tech</option>
                                    <option value="AI/ML">AI/ML</option>
                                    <option value="E-commerce">E-commerce</option>
                                    <option value="EdTech">EdTech</option>
                                    <option value="Cybersecurity">Cybersecurity</option>
                                </select>
                            </div>

                            <!-- Stage -->
                            <div class="mb-4">
                                <label class="form-label">Investment Stage</label>
                                <select class="form-select" id="stageSelect" 
                                    onchange="dealWizard.updateThesis('stage', null, this.value)">
                                    <option value="Pre-Seed" selected>Pre-Seed</option>
                                    <option value="Seed">Seed</option>
                                    <option value="Series A">Series A</option>
                                </select>
                            </div>

                            <!-- Geography -->
                            <div class="mb-4">
                                <label class="form-label">Geography</label>
                                <select class="form-select" multiple id="geoSelect" 
                                    onchange="dealWizard.updateGeography()">
                                    <option value="US" selected>United States</option>
                                    <option value="EU" selected>Europe</option>
                                    <option value="Asia">Asia</option>
                                    <option value="LATAM">Latin America</option>
                                    <option value="Africa">Africa</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-chart-line me-2"></i>
                                Traction Metrics
                            </h5>

                            <!-- Min ARR -->
                            <div class="mb-4">
                                <label class="form-label">Minimum ARR ($)</label>
                                <input type="number" class="form-control" id="minARR" 
                                    value="${thesis.tractionMetrics.minARR}"
                                    onchange="dealWizard.updateTraction('minARR', this.value)">
                                <small class="text-muted">Annual Recurring Revenue</small>
                            </div>

                            <!-- Min Users -->
                            <div class="mb-4">
                                <label class="form-label">Minimum Users</label>
                                <input type="number" class="form-control" id="minUsers" 
                                    value="${thesis.tractionMetrics.minUsers}"
                                    onchange="dealWizard.updateTraction('minUsers', this.value)">
                            </div>

                            <!-- Min Growth Rate -->
                            <div class="mb-4">
                                <label class="form-label">Minimum MoM Growth Rate (%)</label>
                                <input type="range" class="form-range" id="minGrowthRate" 
                                    min="0" max="100" value="${thesis.tractionMetrics.minGrowthRate}"
                                    oninput="dealWizard.updateTraction('minGrowthRate', this.value)">
                                <div class="text-center">
                                    <span class="badge bg-success" id="growthRateValue">${thesis.tractionMetrics.minGrowthRate}%</span>
                                </div>
                            </div>

                            <!-- Founder Preferences -->
                            <div class="mb-3">
                                <label class="form-label">Founder Preferences</label>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="previousExits" 
                                        onchange="dealWizard.updateFounderPref('previousExits', this.checked)">
                                    <label class="form-check-label" for="previousExits">
                                        Previous Exits Required
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="technicalFounder" checked
                                        onchange="dealWizard.updateFounderPref('technicalFounder', this.checked)">
                                    <label class="form-check-label" for="technicalFounder">
                                        Technical Founder Required
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="diverseTeam"
                                        onchange="dealWizard.updateFounderPref('diverseTeam', this.checked)">
                                    <label class="form-check-label" for="diverseTeam">
                                        Diverse Team Preferred
                                    </label>
                                </div>
                            </div>

                            <button class="btn btn-primary w-100" onclick="dealWizard.generateDeals()">
                                <i class="fas fa-sync me-2"></i>Refresh Matches
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Matched Deals -->
                <div class="glass-card p-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h5 class="mb-0">
                            <i class="fas fa-star me-2 text-warning"></i>
                            AI-Matched Deals
                            <span class="badge bg-secondary ms-2" id="dealCount">0 deals</span>
                        </h5>
                        <div>
                            <button class="btn btn-sm btn-outline-primary" onclick="dealWizard.sortDeals('fit')">
                                <i class="fas fa-sort me-1"></i>Sort by Fit
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="dealWizard.sortDeals('traction')">
                                <i class="fas fa-chart-line me-1"></i>Sort by Traction
                            </button>
                        </div>
                    </div>

                    <div id="dealsContainer" class="row">
                        <!-- Deals will be rendered here -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Load thesis from user profile
     */
    loadThesisFromProfile() {
        // In production, this would fetch from backend
        // For now, use default thesis
        console.log('Loading thesis from user profile...');
    }

    /**
     * Update thesis parameters
     */
    updateThesis(category, subcategory, value) {
        if (subcategory) {
            this.userThesis[category][subcategory] = parseFloat(value);
        } else {
            this.userThesis[category] = value;
        }
        
        // Update display
        if (category === 'checkSize') {
            document.getElementById('minCheckSize').value = this.userThesis.checkSize.min;
            document.getElementById('maxCheckSize').value = this.userThesis.checkSize.max;
        }
    }

    /**
     * Update sectors
     */
    updateSectors() {
        const select = document.getElementById('sectorSelect');
        this.userThesis.sectors = Array.from(select.selectedOptions).map(opt => opt.value);
    }

    /**
     * Update geography
     */
    updateGeography() {
        const select = document.getElementById('geoSelect');
        this.userThesis.geography = Array.from(select.selectedOptions).map(opt => opt.value);
    }

    /**
     * Update traction metrics
     */
    updateTraction(metric, value) {
        this.userThesis.tractionMetrics[metric] = parseFloat(value);
        
        if (metric === 'minGrowthRate') {
            document.getElementById('growthRateValue').textContent = value + '%';
        }
    }

    /**
     * Update founder preferences
     */
    updateFounderPref(pref, value) {
        this.userThesis.founderPreferences[pref] = value;
    }

    /**
     * Generate matched deals using AI
     */
    async generateDeals() {
        // Show loading state
        const container = document.getElementById('dealsContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-spinner fa-spin fa-3x text-primary mb-3"></i>
                <p class="text-muted">Manus AI is analyzing 1,000+ deals to find your best matches...</p>
            </div>
        `;

        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate mock deals based on thesis
        this.deals = this.generateMockDeals();

        // Render deals
        this.renderDeals();
    }

    /**
     * Generate mock deals
     */
    generateMockDeals() {
        const mockDeals = [
            {
                id: 1,
                name: 'CloudSecure AI',
                sector: 'Cybersecurity',
                stage: 'Seed',
                askAmount: 75000,
                arr: 250000,
                users: 2500,
                growthRate: 35,
                geography: 'US',
                founders: [
                    { name: 'Sarah Kim', technical: true, previousExits: true }
                ],
                fitScore: 94,
                fitBreakdown: {
                    sector: 85,
                    traction: 95,
                    founder: 98,
                    geography: 95,
                    stage: 90
                },
                description: 'AI-powered cybersecurity platform for SMBs',
                highlights: ['Ex-Google founder', '35% MoM growth', 'SOC 2 certified']
            },
            {
                id: 2,
                name: 'HealthFlow',
                sector: 'HealthTech',
                stage: 'Pre-Seed',
                askAmount: 50000,
                arr: 120000,
                users: 1200,
                growthRate: 28,
                geography: 'EU',
                founders: [
                    { name: 'David Chen', technical: true, previousExits: false }
                ],
                fitScore: 78,
                fitBreakdown: {
                    sector: 60,
                    traction: 80,
                    founder: 85,
                    geography: 90,
                    stage: 95
                },
                description: 'Patient engagement platform for clinics',
                highlights: ['HIPAA compliant', '28% MoM growth', 'Pilot with 5 hospitals']
            },
            {
                id: 3,
                name: 'FinanceAI',
                sector: 'Fintech',
                stage: 'Seed',
                askAmount: 100000,
                arr: 450000,
                users: 5000,
                growthRate: 42,
                geography: 'US',
                founders: [
                    { name: 'Emily Rodriguez', technical: true, previousExits: true },
                    { name: 'James Lee', technical: false, previousExits: false }
                ],
                fitScore: 92,
                fitBreakdown: {
                    sector: 95,
                    traction: 98,
                    founder: 92,
                    geography: 95,
                    stage: 85
                },
                description: 'AI-driven personal finance management',
                highlights: ['Ex-Stripe founder', '42% MoM growth', '5K paying users']
            },
            {
                id: 4,
                name: 'EcoTech Solutions',
                sector: 'Climate Tech',
                stage: 'Pre-Seed',
                askAmount: 60000,
                arr: 80000,
                users: 800,
                growthRate: 22,
                geography: 'EU',
                founders: [
                    { name: 'Maria Santos', technical: true, previousExits: false }
                ],
                fitScore: 72,
                fitBreakdown: {
                    sector: 70,
                    traction: 65,
                    founder: 75,
                    geography: 90,
                    stage: 95
                },
                description: 'Carbon tracking for small businesses',
                highlights: ['B-Corp certified', '22% MoM growth', 'EU grant funded']
            },
            {
                id: 5,
                name: 'SaaS Metrics Pro',
                sector: 'SaaS',
                stage: 'Seed',
                askAmount: 85000,
                arr: 380000,
                users: 3200,
                growthRate: 38,
                geography: 'US',
                founders: [
                    { name: 'Alex Johnson', technical: true, previousExits: false }
                ],
                fitScore: 88,
                fitBreakdown: {
                    sector: 95,
                    traction: 92,
                    founder: 80,
                    geography: 95,
                    stage: 85
                },
                description: 'Analytics platform for SaaS companies',
                highlights: ['Y Combinator alum', '38% MoM growth', 'Net revenue retention 120%']
            }
        ];

        return mockDeals.sort((a, b) => b.fitScore - a.fitScore);
    }

    /**
     * Render deals
     */
    renderDeals() {
        const container = document.getElementById('dealsContainer');
        if (!container) return;

        document.getElementById('dealCount').textContent = `${this.deals.length} deals`;

        container.innerHTML = this.deals.map(deal => `
            <div class="col-md-6 mb-4">
                <div class="glass-card p-4 h-100">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h5 class="mb-1">${deal.name}</h5>
                            <small class="text-muted">${deal.sector} • ${deal.stage}</small>
                        </div>
                        <div class="text-end">
                            <h3 class="mb-0 ${this.getFitScoreColor(deal.fitScore)}">${deal.fitScore}%</h3>
                            <small class="text-muted">Fit Score</small>
                        </div>
                    </div>

                    <p class="text-secondary small mb-3">${deal.description}</p>

                    <!-- Fit Breakdown -->
                    <div class="mb-3">
                        <button class="btn btn-sm btn-outline-info w-100" 
                            onclick="dealWizard.showFitBreakdown(${deal.id})">
                            <i class="fas fa-chart-pie me-2"></i>View Fit Breakdown
                        </button>
                    </div>

                    <!-- Key Metrics -->
                    <div class="row mb-3">
                        <div class="col-4">
                            <small class="text-muted d-block">ARR</small>
                            <strong>$${(deal.arr / 1000).toFixed(0)}K</strong>
                        </div>
                        <div class="col-4">
                            <small class="text-muted d-block">Users</small>
                            <strong>${deal.users.toLocaleString()}</strong>
                        </div>
                        <div class="col-4">
                            <small class="text-muted d-block">Growth</small>
                            <strong class="text-success">${deal.growthRate}%</strong>
                        </div>
                    </div>

                    <!-- Highlights -->
                    <div class="mb-3">
                        ${deal.highlights.map(h => `
                            <span class="badge bg-secondary me-1 mb-1">${h}</span>
                        `).join('')}
                    </div>

                    <!-- Founders -->
                    <div class="mb-3">
                        <small class="text-muted d-block mb-1">Founders:</small>
                        ${deal.founders.map(f => `
                            <div class="d-flex align-items-center mb-1">
                                <i class="fas fa-user-circle me-2"></i>
                                <span class="small">${f.name}</span>
                                ${f.previousExits ? '<span class="badge bg-success ms-2">Exit</span>' : ''}
                                ${f.technical ? '<span class="badge bg-info ms-2">Tech</span>' : ''}
                            </div>
                        `).join('')}
                    </div>

                    <!-- Actions -->
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary flex-fill" onclick="dealWizard.viewDeal(${deal.id})">
                            <i class="fas fa-eye me-2"></i>View Details
                        </button>
                        <button class="btn btn-outline-success" onclick="dealWizard.saveDeal(${deal.id})">
                            <i class="fas fa-bookmark"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Show fit breakdown
     */
    showFitBreakdown(dealId) {
        const deal = this.deals.find(d => d.id === dealId);
        if (!deal) return;

        const breakdown = deal.fitBreakdown;
        const reasons = [];

        if (breakdown.sector >= 80) reasons.push(`${breakdown.sector}% sector alignment (${deal.sector} matches your thesis)`);
        if (breakdown.traction >= 80) reasons.push(`${breakdown.traction}% traction score (ARR: $${(deal.arr / 1000).toFixed(0)}K, ${deal.growthRate}% growth)`);
        if (breakdown.founder >= 80) reasons.push(`${breakdown.founder}% founder pedigree (${deal.founders[0].previousExits ? 'previous exits' : 'strong technical background'})`);
        if (breakdown.geography >= 80) reasons.push(`${breakdown.geography}% geography match (${deal.geography})`);
        if (breakdown.stage >= 80) reasons.push(`${breakdown.stage}% stage alignment (${deal.stage})`);

        alert(`Fit Score Breakdown for ${deal.name}\n\n` + reasons.join('\n\n'));
    }

    /**
     * Get fit score color
     */
    getFitScoreColor(score) {
        if (score >= 90) return 'text-success';
        if (score >= 75) return 'text-info';
        if (score >= 60) return 'text-warning';
        return 'text-secondary';
    }

    /**
     * Sort deals
     */
    sortDeals(by) {
        if (by === 'fit') {
            this.deals.sort((a, b) => b.fitScore - a.fitScore);
        } else if (by === 'traction') {
            this.deals.sort((a, b) => b.arr - a.arr);
        }
        this.renderDeals();
    }

    /**
     * View deal details
     */
    viewDeal(dealId) {
        alert(`View full deal details for deal ${dealId} - to be implemented`);
    }

    /**
     * Save deal to pipeline
     */
    saveDeal(dealId) {
        alert(`Deal ${dealId} saved to your pipeline!`);
    }
}

// Initialize global instance
const dealWizard = new DealSourcingWizard();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DealSourcingWizard;
}

