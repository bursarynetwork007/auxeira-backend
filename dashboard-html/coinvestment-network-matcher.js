/**
 * Co-Investment Network Matcher
 * AI-driven matching for co-investors based on thesis overlap and synergies
 * Features: Relationship graph, warmth scores, intro suggestions
 */

class CoInvestmentNetworkMatcher {
    constructor() {
        this.network = {};
        this.matches = [];
        this.charts = {};
        
        // Sample network data
        this.initializeNetwork();
    }

    /**
     * Initialize network data
     */
    initializeNetwork() {
        this.network = {
            'Sequoia Capital': {
                type: 'VC Firm',
                focus: ['AI', 'Enterprise SaaS', 'Fintech'],
                stage: ['Series A', 'Series B', 'Series C'],
                geography: ['US', 'Asia'],
                avgCheckSize: 15000000,
                portfolioOverlap: 3,
                pastSynergies: 5,
                warmthScore: 85,
                mutualConnections: ['John Doe (Partner)', 'Jane Smith (LP)'],
                recentDeals: ['OpenAI', 'Stripe', 'Databricks']
            },
            'Andreessen Horowitz (a16z)': {
                type: 'VC Firm',
                focus: ['AI', 'Crypto', 'Bio', 'Defense Tech'],
                stage: ['Seed', 'Series A', 'Series B'],
                geography: ['US', 'EU'],
                avgCheckSize: 20000000,
                portfolioOverlap: 2,
                pastSynergies: 8,
                warmthScore: 92,
                mutualConnections: ['Marc Andreessen (GP)', 'Ben Horowitz (GP)', 'Sarah Lee (Analyst)'],
                recentDeals: ['Coinbase', 'Instacart', 'Anduril']
            },
            'Accel Partners': {
                type: 'VC Firm',
                focus: ['Enterprise SaaS', 'Cybersecurity', 'Cloud'],
                stage: ['Series A', 'Series B'],
                geography: ['US', 'EU', 'India'],
                avgCheckSize: 12000000,
                portfolioOverlap: 4,
                pastSynergies: 6,
                warmthScore: 78,
                mutualConnections: ['Alice Johnson (Partner)'],
                recentDeals: ['Slack', 'Atlassian', 'UiPath']
            },
            'Founders Fund': {
                type: 'VC Firm',
                focus: ['Deep Tech', 'Space', 'Defense', 'Bio'],
                stage: ['Seed', 'Series A', 'Series B'],
                geography: ['US'],
                avgCheckSize: 10000000,
                portfolioOverlap: 1,
                pastSynergies: 3,
                warmthScore: 65,
                mutualConnections: ['Peter Thiel (Founder)'],
                recentDeals: ['SpaceX', 'Palantir', 'Anduril']
            },
            'Lightspeed Venture Partners': {
                type: 'VC Firm',
                focus: ['Consumer', 'Enterprise', 'Health'],
                stage: ['Seed', 'Series A'],
                geography: ['US', 'India', 'China'],
                avgCheckSize: 8000000,
                portfolioOverlap: 2,
                pastSynergies: 4,
                warmthScore: 72,
                mutualConnections: ['Bob Chen (Partner)', 'Emily Wang (Associate)'],
                recentDeals: ['Snap', 'Affirm', 'Guardant Health']
            },
            'Tiger Global': {
                type: 'Growth Equity',
                focus: ['Internet', 'Software', 'Consumer'],
                stage: ['Series B', 'Series C', 'Growth'],
                geography: ['Global'],
                avgCheckSize: 50000000,
                portfolioOverlap: 1,
                pastSynergies: 2,
                warmthScore: 58,
                mutualConnections: [],
                recentDeals: ['Stripe', 'Chime', 'Databricks']
            }
        };
    }

    /**
     * Initialize the matcher
     */
    initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = this.getMatcherHTML();
        this.renderNetworkGraph();
        this.findMatches();
    }

    /**
     * Get matcher HTML
     */
    getMatcherHTML() {
        return `
            <div class="coinvestment-network-matcher">
                <!-- Header -->
                <div class="glass-card p-4 mb-4">
                    <h3 class="mb-3">
                        <i class="fas fa-network-wired me-2 text-primary"></i>
                        Co-Investment Network Matcher
                        <span class="badge bg-primary ms-2">Relationship AI</span>
                    </h3>
                    <p class="text-secondary mb-4">
                        AI-driven matching for co-investors based on thesis overlap, past synergies, and relationship warmth
                    </p>

                    <!-- Search and Filter -->
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="input-group">
                                <span class="input-group-text"><i class="fas fa-search"></i></span>
                                <input type="text" class="form-control" id="investorSearch" 
                                    placeholder="Search investors or focus areas..." 
                                    oninput="coinvestmentMatcher.filterMatches(this.value)">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="focusFilter" 
                                onchange="coinvestmentMatcher.filterByFocus(this.value)">
                                <option value="">All Focus Areas</option>
                                <option value="AI">AI & Machine Learning</option>
                                <option value="Defense Tech">Defense Tech</option>
                                <option value="Climate Tech">Climate Tech</option>
                                <option value="Fintech">Fintech</option>
                                <option value="Enterprise SaaS">Enterprise SaaS</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="stageFilter" 
                                onchange="coinvestmentMatcher.filterByStage(this.value)">
                                <option value="">All Stages</option>
                                <option value="Seed">Seed</option>
                                <option value="Series A">Series A</option>
                                <option value="Series B">Series B+</option>
                            </select>
                        </div>
                    </div>

                    <!-- Quick Stats -->
                    <div class="row">
                        <div class="col-md-3">
                            <div class="text-center p-3 border-start border-primary border-3">
                                <h4 class="text-primary mb-0">${Object.keys(this.network).length}</h4>
                                <small class="text-muted">Network Investors</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center p-3 border-start border-success border-3">
                                <h4 class="text-success mb-0">${this.countHighWarmth()}</h4>
                                <small class="text-muted">High Warmth (>80)</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center p-3 border-start border-warning border-3">
                                <h4 class="text-warning mb-0">${this.countPortfolioOverlap()}</h4>
                                <small class="text-muted">Portfolio Overlaps</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center p-3 border-start border-info border-3">
                                <h4 class="text-info mb-0">${this.countMutualConnections()}</h4>
                                <small class="text-muted">Mutual Connections</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tabs -->
                <ul class="nav nav-tabs mb-4" role="tablist">
                    <li class="nav-item">
                        <a class="nav-link active" data-bs-toggle="tab" href="#matches-tab">
                            <i class="fas fa-star me-2"></i>Top Matches
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#network-graph-tab">
                            <i class="fas fa-project-diagram me-2"></i>Network Graph
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#intro-requests-tab">
                            <i class="fas fa-handshake me-2"></i>Intro Requests
                        </a>
                    </li>
                </ul>

                <!-- Tab Content -->
                <div class="tab-content">
                    <!-- Top Matches Tab -->
                    <div class="tab-pane fade show active" id="matches-tab">
                        ${this.getMatchesHTML()}
                    </div>

                    <!-- Network Graph Tab -->
                    <div class="tab-pane fade" id="network-graph-tab">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-project-diagram me-2"></i>
                                Investment Network Visualization
                            </h5>
                            <canvas id="networkGraphChart" height="400"></canvas>
                            <div class="mt-3 text-center">
                                <span class="badge bg-success me-2">● High Warmth (>80)</span>
                                <span class="badge bg-warning me-2">● Medium Warmth (60-80)</span>
                                <span class="badge bg-secondary">● Low Warmth (<60)</span>
                            </div>
                        </div>
                    </div>

                    <!-- Intro Requests Tab -->
                    <div class="tab-pane fade" id="intro-requests-tab">
                        ${this.getIntroRequestsHTML()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get matches HTML
     */
    getMatchesHTML() {
        const matches = this.getSortedMatches();

        return `
            <div class="row">
                ${matches.map((match, index) => {
                    const investor = match.name;
                    const data = match.data;
                    const matchScore = this.calculateMatchScore(data);
                    
                    return `
                        <div class="col-md-6 mb-4">
                            <div class="glass-card p-4">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h5 class="mb-1">
                                            ${index < 3 ? `<i class="fas fa-medal text-warning me-2"></i>` : ''}
                                            ${investor}
                                        </h5>
                                        <small class="text-muted">${data.type}</small>
                                    </div>
                                    <div class="text-end">
                                        <h4 class="mb-0 ${this.getWarmthColor(data.warmthScore)}">${data.warmthScore}</h4>
                                        <small class="text-muted">Warmth Score</small>
                                    </div>
                                </div>

                                <!-- Match Score -->
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <span class="small">Match Score</span>
                                        <span class="small">${matchScore}/100</span>
                                    </div>
                                    <div class="progress" style="height: 8px;">
                                        <div class="progress-bar ${this.getMatchScoreColor(matchScore)}" 
                                            style="width: ${matchScore}%"></div>
                                    </div>
                                </div>

                                <!-- Focus Areas -->
                                <div class="mb-3">
                                    <small class="text-muted d-block mb-1">Focus Areas:</small>
                                    <div>
                                        ${data.focus.slice(0, 3).map(f => `
                                            <span class="badge bg-primary me-1">${f}</span>
                                        `).join('')}
                                    </div>
                                </div>

                                <!-- Key Metrics -->
                                <div class="row mb-3">
                                    <div class="col-6">
                                        <small class="text-muted d-block">Avg Check Size</small>
                                        <strong>$${(data.avgCheckSize / 1000000).toFixed(1)}M</strong>
                                    </div>
                                    <div class="col-6">
                                        <small class="text-muted d-block">Portfolio Overlap</small>
                                        <strong>${data.portfolioOverlap} companies</strong>
                                    </div>
                                </div>

                                <!-- Mutual Connections -->
                                ${data.mutualConnections.length > 0 ? `
                                    <div class="mb-3">
                                        <small class="text-muted d-block mb-1">
                                            <i class="fas fa-users me-1"></i>
                                            Mutual Connections (${data.mutualConnections.length}):
                                        </small>
                                        <div class="small">
                                            ${data.mutualConnections.slice(0, 2).map(c => `
                                                <div class="text-success">
                                                    <i class="fas fa-check-circle me-1"></i>${c}
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : `
                                    <div class="mb-3">
                                        <small class="text-warning">
                                            <i class="fas fa-exclamation-triangle me-1"></i>
                                            No direct mutual connections
                                        </small>
                                    </div>
                                `}

                                <!-- Recent Deals -->
                                <div class="mb-3">
                                    <small class="text-muted d-block mb-1">Recent Deals:</small>
                                    <div class="small">
                                        ${data.recentDeals.slice(0, 3).join(', ')}
                                    </div>
                                </div>

                                <!-- Actions -->
                                <div class="d-flex gap-2">
                                    <button class="btn btn-sm btn-primary flex-fill" 
                                        onclick="coinvestmentMatcher.requestIntro('${investor}')">
                                        <i class="fas fa-handshake me-1"></i>Request Intro
                                    </button>
                                    <button class="btn btn-sm btn-outline-secondary" 
                                        onclick="coinvestmentMatcher.viewProfile('${investor}')">
                                        <i class="fas fa-eye me-1"></i>View Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Get intro requests HTML
     */
    getIntroRequestsHTML() {
        return `
            <div class="glass-card p-4">
                <h5 class="mb-3">
                    <i class="fas fa-paper-plane me-2"></i>
                    Pending Introduction Requests
                </h5>
                
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Use your mutual connections to request warm introductions. 
                    Warm intros have 3x higher success rate than cold outreach.
                </div>

                <div class="table-responsive">
                    <table class="table table-dark">
                        <thead>
                            <tr>
                                <th>Investor</th>
                                <th>Via Connection</th>
                                <th>Warmth Score</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Andreessen Horowitz (a16z)</td>
                                <td>Marc Andreessen</td>
                                <td><span class="badge bg-success">92</span></td>
                                <td><span class="badge bg-warning">Pending</span></td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary">Follow Up</button>
                                </td>
                            </tr>
                            <tr>
                                <td>Sequoia Capital</td>
                                <td>Jane Smith</td>
                                <td><span class="badge bg-success">85</span></td>
                                <td><span class="badge bg-success">Accepted</span></td>
                                <td>
                                    <button class="btn btn-sm btn-success">Schedule Call</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="mt-4">
                    <h6 class="mb-3">AI-Powered Intro Message Template</h6>
                    <div class="form-group">
                        <textarea class="form-control" rows="6" readonly>
Hi [Mutual Connection],

Hope you're doing well! I'm reaching out because I noticed you're connected with [Target Investor] at [Firm Name].

We're currently working with [Portfolio Company] in the [Sector] space, and I think there could be strong synergies given [Firm Name]'s focus on [Focus Areas] and their recent investments in [Recent Deal].

Would you be open to making an introduction? Happy to provide more context on the opportunity.

Best regards,
[Your Name]
                        </textarea>
                    </div>
                    <button class="btn btn-outline-primary mt-2">
                        <i class="fas fa-copy me-2"></i>Copy Template
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render network graph
     */
    renderNetworkGraph() {
        const ctx = document.getElementById('networkGraphChart');
        if (!ctx) return;

        if (this.charts.network) {
            this.charts.network.destroy();
        }

        // Create scatter plot representing network
        const investors = Object.entries(this.network);
        
        this.charts.network = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: investors.map(([name, data]) => ({
                    label: name,
                    data: [{
                        x: Math.random() * 100,
                        y: Math.random() * 100,
                        r: data.avgCheckSize / 2000000 // Size based on check size
                    }],
                    backgroundColor: this.getWarmthColorRGBA(data.warmthScore),
                    borderColor: this.getWarmthColorRGBA(data.warmthScore, 1),
                    borderWidth: 2
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        display: false,
                        min: 0,
                        max: 100
                    },
                    y: {
                        display: false,
                        min: 0,
                        max: 100
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: '#ffffff', font: { size: 10 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const investor = investors[context.datasetIndex];
                                return [
                                    investor[0],
                                    `Warmth: ${investor[1].warmthScore}`,
                                    `Check: $${(investor[1].avgCheckSize / 1000000).toFixed(1)}M`,
                                    `Focus: ${investor[1].focus.join(', ')}`
                                ];
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Find matches
     */
    findMatches() {
        // Matches are already in this.network
        // This would typically call an AI API to find best matches
    }

    /**
     * Get sorted matches
     */
    getSortedMatches() {
        return Object.entries(this.network)
            .map(([name, data]) => ({ name, data, score: this.calculateMatchScore(data) }))
            .sort((a, b) => b.score - a.score)
            .map(({ name, data }) => ({ name, data }));
    }

    /**
     * Calculate match score
     */
    calculateMatchScore(data) {
        const warmthWeight = 0.4;
        const overlapWeight = 0.3;
        const synergyWeight = 0.3;

        const warmthScore = data.warmthScore;
        const overlapScore = Math.min(data.portfolioOverlap * 20, 100);
        const synergyScore = Math.min(data.pastSynergies * 15, 100);

        return Math.round(
            warmthScore * warmthWeight +
            overlapScore * overlapWeight +
            synergyScore * synergyWeight
        );
    }

    /**
     * Helper methods
     */
    countHighWarmth() {
        return Object.values(this.network).filter(d => d.warmthScore > 80).length;
    }

    countPortfolioOverlap() {
        return Object.values(this.network).reduce((sum, d) => sum + d.portfolioOverlap, 0);
    }

    countMutualConnections() {
        return Object.values(this.network).reduce((sum, d) => sum + d.mutualConnections.length, 0);
    }

    getWarmthColor(score) {
        if (score >= 80) return 'text-success';
        if (score >= 60) return 'text-warning';
        return 'text-secondary';
    }

    getWarmthColorRGBA(score, alpha = 0.7) {
        if (score >= 80) return `rgba(16, 185, 129, ${alpha})`;
        if (score >= 60) return `rgba(245, 158, 11, ${alpha})`;
        return `rgba(107, 114, 128, ${alpha})`;
    }

    getMatchScoreColor(score) {
        if (score >= 80) return 'bg-success';
        if (score >= 60) return 'bg-warning';
        return 'bg-secondary';
    }

    /**
     * User actions
     */
    filterMatches(query) {
        console.log('Filtering matches:', query);
        // Implementation for search filtering
    }

    filterByFocus(focus) {
        console.log('Filtering by focus:', focus);
        // Implementation for focus filtering
    }

    filterByStage(stage) {
        console.log('Filtering by stage:', stage);
        // Implementation for stage filtering
    }

    requestIntro(investor) {
        alert(`Requesting introduction to ${investor}\n\nThis will send a request to your mutual connections for a warm intro.`);
    }

    viewProfile(investor) {
        alert(`View detailed profile for ${investor} - to be implemented`);
    }
}

// Initialize global instance
const coinvestmentMatcher = new CoInvestmentNetworkMatcher();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CoInvestmentNetworkMatcher();
}

