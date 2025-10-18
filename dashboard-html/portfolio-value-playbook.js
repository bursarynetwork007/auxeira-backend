/**
 * Portfolio Value Creation Playbook
 * Dynamic playbook per portfolio company with milestones, OKRs, and AI recommendations
 * Features: Milestone tracking, peer benchmarking, intervention suggestions
 */

class PortfolioValuePlaybook {
    constructor() {
        this.playbooks = {};
        this.okrTemplates = this.getOKRTemplates();
        this.interventionLibrary = this.getInterventionLibrary();
        this.currentCompany = null;
    }

    /**
     * Initialize the playbook for a company
     */
    initialize(containerId, companyId = 'demo-company') {
        this.currentCompany = companyId;
        
        if (!this.playbooks[companyId]) {
            this.playbooks[companyId] = this.createDefaultPlaybook(companyId);
        }

        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = this.getPlaybookHTML();
        this.renderMilestoneTimeline();
        this.renderBenchmarkChart();
    }

    /**
     * Create default playbook structure
     */
    createDefaultPlaybook(companyId) {
        return {
            companyId: companyId,
            companyName: 'TechCo AI',
            sector: 'AI & Machine Learning',
            stage: 'Series A',
            investmentDate: '2024-01-15',
            currentValuation: 25000000,
            objectives: [
                {
                    id: 'obj1',
                    title: 'Achieve Product-Market Fit',
                    keyResults: [
                        { id: 'kr1', description: 'Reach 1000 active users', target: 1000, current: 650, unit: 'users' },
                        { id: 'kr2', description: 'NPS Score above 50', target: 50, current: 42, unit: 'score' },
                        { id: 'kr3', description: 'Churn rate below 5%', target: 5, current: 7.2, unit: '%' }
                    ],
                    status: 'in-progress',
                    dueDate: '2025-06-30'
                },
                {
                    id: 'obj2',
                    title: 'Scale Revenue to $5M ARR',
                    keyResults: [
                        { id: 'kr4', description: 'Monthly recurring revenue', target: 416667, current: 280000, unit: '$' },
                        { id: 'kr5', description: 'Customer acquisition cost', target: 500, current: 720, unit: '$' },
                        { id: 'kr6', description: 'LTV:CAC ratio', target: 3, current: 2.1, unit: 'x' }
                    ],
                    status: 'in-progress',
                    dueDate: '2025-12-31'
                }
            ],
            milestones: [
                { id: 'm1', title: 'Seed Round Closed', date: '2024-01-15', status: 'completed', type: 'funding' },
                { id: 'm2', title: 'Product Launch', date: '2024-03-20', status: 'completed', type: 'product' },
                { id: 'm3', title: 'First 100 Customers', date: '2024-06-10', status: 'completed', type: 'growth' },
                { id: 'm4', title: 'Series A Fundraise', date: '2025-01-30', status: 'completed', type: 'funding' },
                { id: 'm5', title: 'Expand to EU Market', date: '2025-04-15', status: 'in-progress', type: 'expansion' },
                { id: 'm6', title: 'Break-even Revenue', date: '2025-09-01', status: 'upcoming', type: 'financial' },
                { id: 'm7', title: 'Series B Preparation', date: '2026-01-01', status: 'upcoming', type: 'funding' }
            ],
            interventions: [],
            benchmarks: {
                irr: { current: 18, peer: 22, topQuartile: 30 },
                growthRate: { current: 120, peer: 150, topQuartile: 200 },
                burnMultiple: { current: 1.8, peer: 1.5, topQuartile: 1.2 },
                ltvcac: { current: 2.1, peer: 3.0, topQuartile: 4.0 }
            },
            comments: []
        };
    }

    /**
     * Get playbook HTML
     */
    getPlaybookHTML() {
        const playbook = this.playbooks[this.currentCompany];
        
        return `
            <div class="portfolio-value-playbook">
                <!-- Company Header -->
                <div class="glass-card p-4 mb-4">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h3 class="mb-2">
                                <i class="fas fa-building me-2"></i>
                                ${playbook.companyName}
                                <span class="badge bg-primary ms-2">${playbook.stage}</span>
                            </h3>
                            <p class="text-secondary mb-0">
                                ${playbook.sector} • Invested ${new Date(playbook.investmentDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div class="text-end">
                            <h4 class="text-success mb-0">$${(playbook.currentValuation / 1000000).toFixed(1)}M</h4>
                            <small class="text-muted">Current Valuation</small>
                        </div>
                    </div>
                </div>

                <!-- Tabs -->
                <ul class="nav nav-tabs mb-4" role="tablist">
                    <li class="nav-item">
                        <a class="nav-link active" data-bs-toggle="tab" href="#okrs-tab">
                            <i class="fas fa-bullseye me-2"></i>OKRs
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#milestones-tab">
                            <i class="fas fa-flag-checkered me-2"></i>Milestones
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#interventions-tab">
                            <i class="fas fa-hands-helping me-2"></i>Interventions
                            <span class="badge bg-warning ms-1">${playbook.interventions.length}</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#benchmarks-tab">
                            <i class="fas fa-chart-bar me-2"></i>Benchmarks
                        </a>
                    </li>
                </ul>

                <!-- Tab Content -->
                <div class="tab-content">
                    <!-- OKRs Tab -->
                    <div class="tab-pane fade show active" id="okrs-tab">
                        ${this.getOKRsHTML(playbook)}
                    </div>

                    <!-- Milestones Tab -->
                    <div class="tab-pane fade" id="milestones-tab">
                        ${this.getMilestonesHTML(playbook)}
                    </div>

                    <!-- Interventions Tab -->
                    <div class="tab-pane fade" id="interventions-tab">
                        ${this.getInterventionsHTML(playbook)}
                    </div>

                    <!-- Benchmarks Tab -->
                    <div class="tab-pane fade" id="benchmarks-tab">
                        ${this.getBenchmarksHTML(playbook)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get OKRs HTML
     */
    getOKRsHTML(playbook) {
        return `
            <div class="row">
                <div class="col-12 mb-3">
                    <button class="btn btn-primary" onclick="playbookManager.addObjective()">
                        <i class="fas fa-plus me-2"></i>Add Objective
                    </button>
                    <button class="btn btn-outline-secondary" onclick="playbookManager.loadOKRTemplate()">
                        <i class="fas fa-file-import me-2"></i>Load Template
                    </button>
                    <button class="btn btn-outline-success" onclick="playbookManager.getAIOKRSuggestions()">
                        <i class="fas fa-robot me-2"></i>AI Suggestions
                    </button>
                </div>
            </div>

            ${playbook.objectives.map((obj, index) => `
                <div class="glass-card p-4 mb-3">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h5 class="mb-1">
                                <span class="badge bg-secondary me-2">O${index + 1}</span>
                                ${obj.title}
                            </h5>
                            <small class="text-muted">Due: ${new Date(obj.dueDate).toLocaleDateString()}</small>
                        </div>
                        <span class="badge ${this.getStatusBadgeClass(obj.status)}">${obj.status}</span>
                    </div>

                    <div class="key-results">
                        ${obj.keyResults.map((kr, krIndex) => {
                            const progress = (kr.current / kr.target) * 100;
                            const isOnTrack = progress >= 70;
                            
                            return `
                                <div class="key-result-item mb-3">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <span class="fw-bold">
                                            <span class="badge bg-info me-2">KR${krIndex + 1}</span>
                                            ${kr.description}
                                        </span>
                                        <span class="text-${isOnTrack ? 'success' : 'warning'}">
                                            ${kr.current.toLocaleString()} / ${kr.target.toLocaleString()} ${kr.unit}
                                        </span>
                                    </div>
                                    <div class="progress" style="height: 8px;">
                                        <div class="progress-bar ${isOnTrack ? 'bg-success' : 'bg-warning'}" 
                                            style="width: ${Math.min(progress, 100)}%"></div>
                                    </div>
                                    <small class="text-muted">${progress.toFixed(1)}% complete</small>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div class="mt-3">
                        <button class="btn btn-sm btn-outline-primary" onclick="playbookManager.editObjective('${obj.id}')">
                            <i class="fas fa-edit me-1"></i>Edit
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="playbookManager.addKeyResult('${obj.id}')">
                            <i class="fas fa-plus me-1"></i>Add Key Result
                        </button>
                    </div>
                </div>
            `).join('')}
        `;
    }

    /**
     * Get Milestones HTML
     */
    getMilestonesHTML(playbook) {
        return `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-primary" onclick="playbookManager.addMilestone()">
                        <i class="fas fa-plus me-2"></i>Add Milestone
                    </button>
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <div class="glass-card p-4">
                        <h5 class="mb-4">
                            <i class="fas fa-timeline me-2"></i>Milestone Timeline
                        </h5>
                        <canvas id="milestoneTimelineChart" height="150"></canvas>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                ${['completed', 'in-progress', 'upcoming'].map(status => `
                    <div class="col-md-4">
                        <div class="glass-card p-3">
                            <h6 class="text-capitalize mb-3">
                                <span class="badge ${this.getStatusBadgeClass(status)} me-2">${status}</span>
                            </h6>
                            ${playbook.milestones
                                .filter(m => m.status === status)
                                .map(m => `
                                    <div class="milestone-item mb-2 p-2 border-start border-3 ${this.getMilestoneBorderClass(m.type)}">
                                        <div class="d-flex justify-content-between">
                                            <strong>${m.title}</strong>
                                            <small class="text-muted">${new Date(m.date).toLocaleDateString()}</small>
                                        </div>
                                        <small class="text-muted text-capitalize">
                                            <i class="fas fa-tag me-1"></i>${m.type}
                                        </small>
                                    </div>
                                `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Get Interventions HTML
     */
    getInterventionsHTML(playbook) {
        return `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-primary" onclick="playbookManager.generateAIInterventions()">
                        <i class="fas fa-robot me-2"></i>Generate AI Recommendations
                    </button>
                    <button class="btn btn-outline-secondary" onclick="playbookManager.addCustomIntervention()">
                        <i class="fas fa-plus me-2"></i>Add Custom Intervention
                    </button>
                </div>
            </div>

            <div id="interventionsContainer">
                ${playbook.interventions.length === 0 ? `
                    <div class="glass-card p-4 text-center">
                        <i class="fas fa-lightbulb fa-3x text-warning mb-3"></i>
                        <h5>No interventions yet</h5>
                        <p class="text-muted">Click "Generate AI Recommendations" to get started</p>
                    </div>
                ` : playbook.interventions.map(intervention => `
                    <div class="glass-card p-4 mb-3">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-2">
                                    <span class="badge ${this.getInterventionTypeBadge(intervention.type)} me-2">
                                        ${intervention.type}
                                    </span>
                                    ${intervention.title}
                                </h6>
                                <p class="mb-2">${intervention.description}</p>
                                <small class="text-muted">
                                    <i class="fas fa-calendar me-1"></i>Suggested: ${new Date(intervention.date).toLocaleDateString()}
                                </small>
                            </div>
                            <div>
                                <span class="badge ${intervention.priority === 'high' ? 'bg-danger' : intervention.priority === 'medium' ? 'bg-warning' : 'bg-info'}">
                                    ${intervention.priority} priority
                                </span>
                            </div>
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-sm btn-success" onclick="playbookManager.implementIntervention('${intervention.id}')">
                                <i class="fas fa-check me-1"></i>Implement
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="playbookManager.dismissIntervention('${intervention.id}')">
                                <i class="fas fa-times me-1"></i>Dismiss
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Get Benchmarks HTML
     */
    getBenchmarksHTML(playbook) {
        return `
            <div class="row">
                <div class="col-md-6 mb-4">
                    <div class="glass-card p-4">
                        <h5 class="mb-3">
                            <i class="fas fa-chart-bar me-2"></i>Performance vs Peers
                        </h5>
                        <canvas id="benchmarkChart" height="300"></canvas>
                    </div>
                </div>
                <div class="col-md-6 mb-4">
                    <div class="glass-card p-4">
                        <h5 class="mb-3">
                            <i class="fas fa-trophy me-2"></i>Key Metrics
                        </h5>
                        ${Object.entries(playbook.benchmarks).map(([metric, values]) => {
                            const gap = values.peer - values.current;
                            const gapPercent = ((gap / values.peer) * 100).toFixed(1);
                            
                            return `
                                <div class="mb-4">
                                    <div class="d-flex justify-content-between mb-2">
                                        <span class="text-capitalize">${metric.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span class="${values.current >= values.peer ? 'text-success' : 'text-warning'}">
                                            ${values.current}${metric.includes('Rate') || metric.includes('irr') ? '%' : 'x'}
                                        </span>
                                    </div>
                                    <div class="d-flex gap-2 mb-1">
                                        <div class="flex-fill">
                                            <small class="text-muted">Your Company</small>
                                            <div class="progress" style="height: 6px;">
                                                <div class="progress-bar bg-primary" style="width: ${(values.current / values.topQuartile) * 100}%"></div>
                                            </div>
                                        </div>
                                        <div class="flex-fill">
                                            <small class="text-muted">Peer Average</small>
                                            <div class="progress" style="height: 6px;">
                                                <div class="progress-bar bg-info" style="width: ${(values.peer / values.topQuartile) * 100}%"></div>
                                            </div>
                                        </div>
                                        <div class="flex-fill">
                                            <small class="text-muted">Top Quartile</small>
                                            <div class="progress" style="height: 6px;">
                                                <div class="progress-bar bg-success" style="width: 100%"></div>
                                            </div>
                                        </div>
                                    </div>
                                    ${values.current < values.peer ? `
                                        <small class="text-warning">
                                            <i class="fas fa-arrow-down me-1"></i>
                                            ${Math.abs(gapPercent)}% below peer average
                                        </small>
                                    ` : `
                                        <small class="text-success">
                                            <i class="fas fa-arrow-up me-1"></i>
                                            ${gapPercent}% above peer average
                                        </small>
                                    `}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <div class="glass-card p-4">
                        <h5 class="mb-3">
                            <i class="fas fa-lightbulb me-2 text-warning"></i>
                            AI-Powered Insights
                        </h5>
                        <div class="alert alert-info">
                            <strong>Growth Rate:</strong> Your ${playbook.benchmarks.growthRate.current}% growth lags peer average by ${(playbook.benchmarks.growthRate.peer - playbook.benchmarks.growthRate.current)}%. 
                            Consider implementing SSE rewards to accelerate growth.
                        </div>
                        <div class="alert alert-warning">
                            <strong>LTV:CAC Ratio:</strong> At ${playbook.benchmarks.ltvcac.current}x, you're below the ${playbook.benchmarks.ltvcac.peer}x peer benchmark. 
                            Recommended intervention: Optimize customer acquisition channels and improve retention strategies.
                        </div>
                        <div class="alert alert-success">
                            <strong>Burn Multiple:</strong> Your ${playbook.benchmarks.burnMultiple.current}x is competitive. 
                            Maintain capital efficiency while scaling revenue.
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render milestone timeline chart
     */
    renderMilestoneTimeline() {
        const ctx = document.getElementById('milestoneTimelineChart');
        if (!ctx) return;

        const playbook = this.playbooks[this.currentCompany];
        const milestones = playbook.milestones.sort((a, b) => new Date(a.date) - new Date(b.date));

        new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Milestones',
                    data: milestones.map((m, i) => ({
                        x: new Date(m.date).getTime(),
                        y: 1,
                        milestone: m
                    })),
                    backgroundColor: milestones.map(m => 
                        m.status === 'completed' ? '#10b981' : 
                        m.status === 'in-progress' ? '#f59e0b' : '#6b7280'
                    ),
                    pointRadius: 8,
                    pointHoverRadius: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: { unit: 'month' },
                        ticks: { color: '#b3b3b3' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        display: false,
                        min: 0,
                        max: 2
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const m = context.raw.milestone;
                                return `${m.title} (${m.type})`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Render benchmark chart
     */
    renderBenchmarkChart() {
        const ctx = document.getElementById('benchmarkChart');
        if (!ctx) return;

        const playbook = this.playbooks[this.currentCompany];
        const metrics = Object.keys(playbook.benchmarks);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: metrics.map(m => m.replace(/([A-Z])/g, ' $1').trim()),
                datasets: [
                    {
                        label: 'Your Company',
                        data: metrics.map(m => playbook.benchmarks[m].current),
                        backgroundColor: 'rgba(59, 130, 246, 0.8)'
                    },
                    {
                        label: 'Peer Average',
                        data: metrics.map(m => playbook.benchmarks[m].peer),
                        backgroundColor: 'rgba(139, 92, 246, 0.8)'
                    },
                    {
                        label: 'Top Quartile',
                        data: metrics.map(m => playbook.benchmarks[m].topQuartile),
                        backgroundColor: 'rgba(16, 185, 129, 0.8)'
                    }
                ]
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
                    }
                }
            }
        });
    }

    /**
     * Generate AI interventions
     */
    async generateAIInterventions() {
        const playbook = this.playbooks[this.currentCompany];
        
        // Sample AI-generated interventions
        const interventions = [
            {
                id: 'int1',
                type: 'Introduction',
                title: 'Introduce to a16z for Hard Tech Co-Investment',
                description: 'Based on thesis alignment and portfolio synergies, a16z would be an ideal co-investor for your Series B round.',
                priority: 'high',
                date: new Date().toISOString()
            },
            {
                id: 'int2',
                type: 'Operational',
                title: 'Implement SSE Rewards Program',
                description: 'SSE rewards can accelerate growth by 42% and improve retention by 28%. Recommended for immediate implementation.',
                priority: 'high',
                date: new Date().toISOString()
            },
            {
                id: 'int3',
                type: 'Strategic',
                title: 'Optimize Customer Acquisition Strategy',
                description: 'Current CAC of $720 is 44% above target. Recommend shifting 30% of budget to content marketing.',
                priority: 'medium',
                date: new Date().toISOString()
            }
        ];

        playbook.interventions = interventions;
        this.initialize('playbook-container', this.currentCompany);
    }

    /**
     * Get OKR templates
     */
    getOKRTemplates() {
        return {
            'Product-Market Fit': [
                { description: 'Reach target active users', target: 1000, unit: 'users' },
                { description: 'Achieve NPS score', target: 50, unit: 'score' },
                { description: 'Reduce churn rate', target: 5, unit: '%' }
            ],
            'Revenue Growth': [
                { description: 'Monthly recurring revenue', target: 500000, unit: '$' },
                { description: 'Customer acquisition cost', target: 500, unit: '$' },
                { description: 'LTV:CAC ratio', target: 3, unit: 'x' }
            ]
        };
    }

    /**
     * Get intervention library
     */
    getInterventionLibrary() {
        return [
            { type: 'Introduction', examples: ['Co-investor intro', 'Customer intro', 'Advisor intro'] },
            { type: 'Operational', examples: ['Process optimization', 'Team expansion', 'Tool implementation'] },
            { type: 'Strategic', examples: ['Market expansion', 'Product pivot', 'Pricing strategy'] },
            { type: 'Financial', examples: ['Fundraising support', 'Cost reduction', 'Revenue optimization'] }
        ];
    }

    /**
     * Helper methods for styling
     */
    getStatusBadgeClass(status) {
        const classes = {
            'completed': 'bg-success',
            'in-progress': 'bg-warning',
            'upcoming': 'bg-secondary',
            'at-risk': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }

    getMilestoneBorderClass(type) {
        const classes = {
            'funding': 'border-success',
            'product': 'border-primary',
            'growth': 'border-info',
            'expansion': 'border-warning',
            'financial': 'border-danger'
        };
        return classes[type] || 'border-secondary';
    }

    getInterventionTypeBadge(type) {
        const classes = {
            'Introduction': 'bg-primary',
            'Operational': 'bg-info',
            'Strategic': 'bg-warning',
            'Financial': 'bg-success'
        };
        return classes[type] || 'bg-secondary';
    }

    // Placeholder methods for user actions
    addObjective() { alert('Add Objective modal - to be implemented'); }
    loadOKRTemplate() { alert('Load OKR Template modal - to be implemented'); }
    getAIOKRSuggestions() { alert('AI OKR Suggestions - to be implemented'); }
    editObjective(id) { alert(`Edit Objective ${id} - to be implemented`); }
    addKeyResult(objId) { alert(`Add Key Result to ${objId} - to be implemented`); }
    addMilestone() { alert('Add Milestone modal - to be implemented'); }
    addCustomIntervention() { alert('Add Custom Intervention - to be implemented'); }
    implementIntervention(id) { alert(`Implement Intervention ${id} - to be implemented`); }
    dismissIntervention(id) { alert(`Dismiss Intervention ${id} - to be implemented`); }
}

// Initialize global instance
const playbookManager = new PortfolioValuePlaybook();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioValuePlaybook;
}

