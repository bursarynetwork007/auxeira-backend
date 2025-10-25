/**
 * Angel Feature Adapters
 * Adapts the 6 VC features for angel investor context
 * Simplifies interfaces and adjusts for smaller portfolios and individual investors
 */

/**
 * Angel Investment Thesis Builder
 * Simplified version of Innovation Thesis Builder for angels
 */
class AngelThesisBuilder {
    constructor() {
        this.vcThesisBuilder = typeof thesisBuilder !== 'undefined' ? thesisBuilder : null;
    }

    initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Use VC thesis builder but with angel-specific customizations
        if (this.vcThesisBuilder) {
            this.vcThesisBuilder.initialize(containerId);
            this.customizeForAngels();
        } else {
            container.innerHTML = this.getAngelThesisHTML();
        }
    }

    customizeForAngels() {
        // Adjust check sizes for angels ($25K-$100K typical)
        // Simplify sector selection (3-5 sectors max)
        // Add personal investment criteria
        console.log('Customizing thesis builder for angel investors...');
    }

    getAngelThesisHTML() {
        return `
            <div class="angel-thesis-builder">
                <div class="glass-card p-4 mb-4">
                    <h3 class="mb-3">
                        <i class="fas fa-lightbulb me-2 text-warning"></i>
                        Angel Investment Thesis
                    </h3>
                    <p class="text-secondary">
                        Define your personal investment strategy and criteria for deal selection
                    </p>
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>Angel Tip:</strong> Focus on 2-3 sectors where you have domain expertise. 
                        Most successful angels invest $25K-$100K per deal across 10-15 companies.
                    </div>
                </div>
                <!-- Thesis builder content will be loaded from VC module -->
            </div>
        `;
    }
}

/**
 * Angel Portfolio Playbook
 * Lightweight version of Value Creation Playbook for angels
 */
class AngelPortfolioPlaybook {
    constructor() {
        this.vcPlaybook = typeof valuePlaybook !== 'undefined' ? valuePlaybook : null;
    }

    initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = this.getAngelPlaybookHTML();
        this.loadPlaybookData();
    }

    getAngelPlaybookHTML() {
        return `
            <div class="angel-portfolio-playbook">
                <div class="glass-card p-4 mb-4">
                    <h3 class="mb-3">
                        <i class="fas fa-tasks me-2 text-info"></i>
                        Portfolio Support Playbook
                    </h3>
                    <p class="text-secondary">
                        Track how you're adding value to your portfolio companies
                    </p>
                </div>

                <!-- Value-Add Tracker -->
                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="glass-card p-4 text-center">
                            <div class="display-4 text-primary mb-2">12</div>
                            <div class="text-muted">Intros Made</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="glass-card p-4 text-center">
                            <div class="display-4 text-success mb-2">8</div>
                            <div class="text-muted">Check-ins This Month</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="glass-card p-4 text-center">
                            <div class="display-4 text-warning mb-2">5</div>
                            <div class="text-muted">Active Mentorships</div>
                        </div>
                    </div>
                </div>

                <!-- Company-Specific Actions -->
                <div class="glass-card p-4">
                    <h5 class="mb-3">Your Value-Add Actions</h5>
                    <div id="angelValueAddActions">
                        <!-- Actions will be rendered here -->
                    </div>
                </div>
            </div>
        `;
    }

    loadPlaybookData() {
        const container = document.getElementById('angelValueAddActions');
        if (!container) return;

        const actions = [
            { company: 'CloudSecure', action: 'Introduced to enterprise customer', date: '2 days ago', impact: 'high' },
            { company: 'FinanceApp', action: 'Connected with potential co-founder', date: '1 week ago', impact: 'high' },
            { company: 'HealthTech', action: 'Provided regulatory guidance', date: '1 week ago', impact: 'medium' },
            { company: 'TechCo', action: 'Monthly check-in call', date: '3 days ago', impact: 'low' }
        ];

        container.innerHTML = actions.map(action => `
            <div class="d-flex justify-content-between align-items-center mb-3 p-3" 
                style="background: rgba(255,255,255,0.05); border-radius: 8px;">
                <div>
                    <strong>${action.company}</strong>
                    <div class="small text-muted">${action.action}</div>
                </div>
                <div class="text-end">
                    <span class="badge bg-${action.impact === 'high' ? 'success' : action.impact === 'medium' ? 'info' : 'secondary'}">
                        ${action.impact} impact
                    </span>
                    <div class="small text-muted mt-1">${action.date}</div>
                </div>
            </div>
        `).join('');
    }
}

/**
 * Angel Exit Simulator
 * Uses VC exit simulator with angel-specific scenarios
 */
class AngelExitSimulator {
    constructor() {
        this.vcSimulator = typeof exitSimulator !== 'undefined' ? exitSimulator : null;
    }

    initialize(containerId) {
        // Angels typically see exits through acquisition more than IPO
        // Adjust scenarios for smaller exit sizes ($10M-$100M typical)
        if (this.vcSimulator) {
            this.vcSimulator.initialize(containerId);
            this.adjustForAngels();
        }
    }

    adjustForAngels() {
        console.log('Adjusting exit simulator for angel investors...');
        // Modify exit scenarios to focus on:
        // - Acquisition (90% of angel exits)
        // - Secondary sales
        // - Smaller exit multiples (3-5x typical vs 10x+ for VCs)
    }
}

/**
 * Angel ESG Tracker
 * Simplified ESG tracking for angels
 */
class AngelESGTracker {
    constructor() {
        this.vcESGTracker = typeof esgTracker !== 'undefined' ? esgTracker : null;
    }

    initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = this.getAngelESGHTML();
    }

    getAngelESGHTML() {
        return `
            <div class="angel-esg-tracker">
                <div class="glass-card p-4 mb-4">
                    <h3 class="mb-3">
                        <i class="fas fa-leaf me-2 text-success"></i>
                        Impact & ESG Tracking
                    </h3>
                    <p class="text-secondary">
                        Track the social and environmental impact of your portfolio
                    </p>
                    <div class="alert alert-success">
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>Impact Matters:</strong> 72% of angels consider ESG factors. 
                        Companies with strong ESG scores have 20% better survival rates.
                    </div>
                </div>

                <!-- Simplified Impact Metrics -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="glass-card p-4 text-center">
                            <i class="fas fa-users fa-2x text-primary mb-2"></i>
                            <div class="h3 mb-0">450</div>
                            <div class="small text-muted">Jobs Created</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="glass-card p-4 text-center">
                            <i class="fas fa-leaf fa-2x text-success mb-2"></i>
                            <div class="h3 mb-0">1,200</div>
                            <div class="small text-muted">Tons CO2 Reduced</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="glass-card p-4 text-center">
                            <i class="fas fa-balance-scale fa-2x text-info mb-2"></i>
                            <div class="h3 mb-0">65%</div>
                            <div class="small text-muted">Diverse Teams</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="glass-card p-4 text-center">
                            <i class="fas fa-heart fa-2x text-danger mb-2"></i>
                            <div class="h3 mb-0">50K</div>
                            <div class="small text-muted">Lives Impacted</div>
                        </div>
                    </div>
                </div>

                <!-- Company ESG Scores -->
                <div class="glass-card p-4">
                    <h5 class="mb-3">Company ESG Scores</h5>
                    <div id="angelESGScores">
                        <!-- Scores will be rendered here -->
                    </div>
                </div>
            </div>
        `;
    }
}

/**
 * Angel Syndicate Builder
 * Adapted from Co-Investment Network Matcher for micro-syndicates
 */
class AngelSyndicateBuilder {
    constructor() {
        this.vcMatcher = typeof coinvestmentMatcher !== 'undefined' ? coinvestmentMatcher : null;
    }

    initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = this.getSyndicateHTML();
        this.loadSyndicateData();
    }

    getSyndicateHTML() {
        return `
            <div class="angel-syndicate-builder">
                <div class="glass-card p-4 mb-4">
                    <h3 class="mb-3">
                        <i class="fas fa-users me-2 text-purple"></i>
                        Micro-Syndicate Builder
                    </h3>
                    <p class="text-secondary">
                        Form syndicates with other angels to pool capital and expertise
                    </p>
                    <div class="alert alert-info">
                        <i class="fas fa-lightbulb me-2"></i>
                        <strong>Syndicate Benefits:</strong> 30% of angel deals are syndicated. 
                        Syndicates reduce risk, increase check sizes, and provide better terms.
                    </div>
                </div>

                <!-- Active Syndicates -->
                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="glass-card p-4 text-center">
                            <div class="display-4 text-primary mb-2">3</div>
                            <div class="text-muted">Active Syndicates</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="glass-card p-4 text-center">
                            <div class="display-4 text-success mb-2">$450K</div>
                            <div class="text-muted">Total Syndicated</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="glass-card p-4 text-center">
                            <div class="display-4 text-warning mb-2">12</div>
                            <div class="text-muted">Co-Investors</div>
                        </div>
                    </div>
                </div>

                <!-- Potential Syndicate Partners -->
                <div class="glass-card p-4">
                    <h5 class="mb-3">Recommended Syndicate Partners</h5>
                    <div id="syndicatePartners">
                        <!-- Partners will be rendered here -->
                    </div>
                </div>
            </div>
        `;
    }

    loadSyndicateData() {
        const container = document.getElementById('syndicatePartners');
        if (!container) return;

        const partners = [
            { name: 'Sarah Chen', match: 92, sectors: ['SaaS', 'Fintech'], deals: 8, checkSize: '$50K' },
            { name: 'David Kim', match: 88, sectors: ['HealthTech', 'AI'], deals: 12, checkSize: '$75K' },
            { name: 'Emily Rodriguez', match: 85, sectors: ['Fintech', 'Climate'], deals: 6, checkSize: '$40K' }
        ];

        container.innerHTML = partners.map(partner => `
            <div class="d-flex justify-content-between align-items-center mb-3 p-3" 
                style="background: rgba(255,255,255,0.05); border-radius: 8px;">
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center mb-2">
                        <i class="fas fa-user-circle fa-2x me-3 text-primary"></i>
                        <div>
                            <strong>${partner.name}</strong>
                            <div class="small text-muted">${partner.sectors.join(', ')}</div>
                        </div>
                    </div>
                    <div class="small">
                        <span class="badge bg-secondary me-1">${partner.deals} deals</span>
                        <span class="badge bg-info">${partner.checkSize} avg check</span>
                    </div>
                </div>
                <div class="text-end">
                    <div class="h4 text-success mb-0">${partner.match}%</div>
                    <small class="text-muted">Match</small>
                    <div class="mt-2">
                        <button class="btn btn-sm btn-primary">
                            <i class="fas fa-handshake me-1"></i>Connect
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

/**
 * Angel Report Generator
 * Simplified reporting for angels (personal tracking + syndicate updates)
 */
class AngelReportGenerator {
    constructor() {
        this.vcReportGen = typeof reportGenerator !== 'undefined' ? reportGenerator : null;
    }

    initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = this.getAngelReportHTML();
    }

    getAngelReportHTML() {
        return `
            <div class="angel-report-generator">
                <div class="glass-card p-4 mb-4">
                    <h3 class="mb-3">
                        <i class="fas fa-file-alt me-2 text-primary"></i>
                        Angel Reports
                    </h3>
                    <p class="text-secondary">
                        Generate reports for personal tracking, tax planning, and syndicate updates
                    </p>
                </div>

                <!-- Report Types for Angels -->
                <div class="row">
                    <div class="col-md-6 mb-4">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-chart-pie me-2"></i>
                                Portfolio Snapshot
                            </h5>
                            <p class="small text-muted mb-3">
                                1-page summary: ROI, IRR, top performers, risk flags
                            </p>
                            <button class="btn btn-primary w-100" onclick="angelReports.generate('portfolio')">
                                <i class="fas fa-download me-2"></i>Generate Report
                            </button>
                        </div>
                    </div>

                    <div class="col-md-6 mb-4">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-calculator me-2"></i>
                                Tax & Capital Gains
                            </h5>
                            <p class="small text-muted mb-3">
                                Cost basis, gains/losses, QSBS eligibility
                            </p>
                            <button class="btn btn-warning w-100" onclick="angelReports.generate('tax')">
                                <i class="fas fa-download me-2"></i>Generate Report ($29)
                            </button>
                        </div>
                    </div>

                    <div class="col-md-6 mb-4">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-handshake me-2"></i>
                                Syndicate Update
                            </h5>
                            <p class="small text-muted mb-3">
                                Deal progress, KPIs, co-investor updates
                            </p>
                            <button class="btn btn-success w-100" onclick="angelReports.generate('syndicate')">
                                <i class="fas fa-download me-2"></i>Generate Report ($29)
                            </button>
                        </div>
                    </div>

                    <div class="col-md-6 mb-4">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-lightbulb me-2"></i>
                                Deal Due Diligence
                            </h5>
                            <p class="small text-muted mb-3">
                                Founder bios, traction, market size, risks
                            </p>
                            <button class="btn btn-info w-100" onclick="angelReports.generate('dd')">
                                <i class="fas fa-download me-2"></i>Generate Report ($19)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generate(type) {
        alert(`Generating ${type} report... This will be implemented with the backend API.`);
    }
}

// Initialize global instances
const angelThesisBuilder = new AngelThesisBuilder();
const angelPlaybook = new AngelPortfolioPlaybook();
const angelExitSimulator = new AngelExitSimulator();
const angelESGTracker = new AngelESGTracker();
const angelSyndicateBuilder = new AngelSyndicateBuilder();
const angelReports = new AngelReportGenerator();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AngelThesisBuilder,
        AngelPortfolioPlaybook,
        AngelExitSimulator,
        AngelESGTracker,
        AngelSyndicateBuilder,
        AngelReportGenerator
    };
}

