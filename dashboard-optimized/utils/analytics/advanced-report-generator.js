/**
 * Advanced Report Generator
 * 7 core report types for LP reporting with automation and custom branding
 * Features: Quarterly fund performance, portfolio updates, market intelligence, due diligence, LP narratives, exit forecasts, ESG reports
 */

class AdvancedReportGenerator {
    constructor() {
        this.reportTypes = this.getReportTypes();
        this.reportHistory = [];
    }

    /**
     * Get report types configuration
     */
    getReportTypes() {
        return {
            'quarterly_fund_performance': {
                name: 'Quarterly Fund Performance',
                description: 'IRR, MOIC, DPI, TVPI, NAV, capital calls, J-curve trends, peer benchmarks',
                frequency: 'Quarterly',
                audience: 'LPs',
                priority: 'Critical',
                icon: 'fa-chart-line',
                color: 'primary',
                estimatedTime: '15 min',
                sections: ['Executive Summary', 'Fund Metrics', 'J-Curve Analysis', 'Peer Benchmarks', 'Capital Calls', 'NAV Breakdown']
            },
            'portfolio_company_updates': {
                name: 'Portfolio Company Updates',
                description: 'Per-company KPIs (ARR/MRR growth, burn rate, churn, LTV:CAC), milestone progress',
                frequency: 'Monthly',
                audience: 'LPs & Internal',
                priority: 'High',
                icon: 'fa-building',
                color: 'success',
                estimatedTime: '10 min',
                sections: ['Company Overview', 'Financial Metrics', 'Growth KPIs', 'Milestones', 'Risks & Opportunities']
            },
            'market_sector_intelligence': {
                name: 'Market & Sector Intelligence',
                description: 'Deal trends, funding surges, competitive landscape, thesis validation',
                frequency: 'Quarterly',
                audience: 'Partners & LPs',
                priority: 'High',
                icon: 'fa-globe',
                color: 'info',
                estimatedTime: '12 min',
                sections: ['Market Overview', 'Sector Trends', 'Deal Flow Analysis', 'Competitive Landscape', 'Thesis Validation']
            },
            'due_diligence_summary': {
                name: 'Due Diligence Summary',
                description: 'Financials, market potential, team assessment, risks, term sheet outlines',
                frequency: 'Per Deal',
                audience: 'Investment Committee',
                priority: 'Critical',
                icon: 'fa-search',
                color: 'warning',
                estimatedTime: '20 min',
                sections: ['Executive Summary', 'Financial Analysis', 'Market Sizing', 'Team Assessment', 'Risk Analysis', 'Term Sheet']
            },
            'investor_relations_narrative': {
                name: 'Investor Relations (LP Narratives)',
                description: 'High-level story: Wins, challenges, asks, ESG/impact add-ons',
                frequency: 'Monthly',
                audience: 'LPs',
                priority: 'Medium',
                icon: 'fa-users',
                color: 'secondary',
                estimatedTime: '8 min',
                sections: ['Fund Highlights', 'Key Wins', 'Challenges & Learnings', 'Portfolio Spotlights', 'Asks from LPs']
            },
            'exit_liquidity_forecast': {
                name: 'Exit & Liquidity Forecasts',
                description: 'Scenario models, secondary volumes, acquisition/IPO probabilities, counterfactuals',
                frequency: 'Quarterly',
                audience: 'LPs & Partners',
                priority: 'High',
                icon: 'fa-rocket',
                color: 'danger',
                estimatedTime: '15 min',
                sections: ['Exit Pipeline', 'Scenario Analysis', 'Liquidity Forecast', 'Secondary Opportunities', 'Counterfactual Analysis']
            },
            'esg_impact_report': {
                name: 'ESG & Impact Report',
                description: 'ESG scores, carbon metrics, diversity KPIs, alignment with fund thesis',
                frequency: 'Quarterly',
                audience: 'LPs',
                priority: 'High',
                icon: 'fa-leaf',
                color: 'success',
                estimatedTime: '10 min',
                sections: ['ESG Overview', 'Environmental Metrics', 'Social Impact', 'Governance', 'Impact Forecast', 'Peer Benchmarks']
            }
        };
    }

    /**
     * Initialize the report generator
     */
    initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = this.getGeneratorHTML();
    }

    /**
     * Get generator HTML
     */
    getGeneratorHTML() {
        return `
            <div class="advanced-report-generator">
                <!-- Header -->
                <div class="glass-card p-4 mb-4">
                    <h3 class="mb-3">
                        <i class="fas fa-file-alt me-2 text-primary"></i>
                        Advanced Report Generator
                        <span class="badge bg-primary ms-2">7 Report Types</span>
                    </h3>
                    <p class="text-secondary mb-4">
                        Generate professional LP reports with AI-powered insights, custom branding, and automated delivery
                    </p>

                    <div class="row">
                        <div class="col-md-3">
                            <div class="text-center p-3 border-start border-primary border-3">
                                <h4 class="text-primary mb-0">${this.reportHistory.length}</h4>
                                <small class="text-muted">Reports Generated</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center p-3 border-start border-success border-3">
                                <h4 class="text-success mb-0">7</h4>
                                <small class="text-muted">Report Types</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center p-3 border-start border-warning border-3">
                                <h4 class="text-warning mb-0">Auto</h4>
                                <small class="text-muted">Scheduled Delivery</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center p-3 border-start border-info border-3">
                                <h4 class="text-info mb-0">PDF</h4>
                                <small class="text-muted">Export Format</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Report Types Grid -->
                <div class="row mb-4">
                    ${Object.entries(this.reportTypes).map(([key, report]) => `
                        <div class="col-md-6 mb-4">
                            <div class="glass-card p-4 h-100">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h5 class="mb-1">
                                            <i class="fas ${report.icon} me-2 text-${report.color}"></i>
                                            ${report.name}
                                        </h5>
                                        <small class="text-muted">${report.audience} • ${report.frequency}</small>
                                    </div>
                                    <span class="badge bg-${report.color}">${report.priority}</span>
                                </div>

                                <p class="text-secondary small mb-3">${report.description}</p>

                                <div class="mb-3">
                                    <small class="text-muted d-block mb-2">Key Sections:</small>
                                    <div class="d-flex flex-wrap gap-1">
                                        ${report.sections.slice(0, 4).map(section => `
                                            <span class="badge bg-secondary small">${section}</span>
                                        `).join('')}
                                        ${report.sections.length > 4 ? `
                                            <span class="badge bg-secondary small">+${report.sections.length - 4} more</span>
                                        ` : ''}
                                    </div>
                                </div>

                                <div class="d-flex align-items-center justify-content-between mb-3">
                                    <small class="text-muted">
                                        <i class="fas fa-clock me-1"></i>
                                        Est. ${report.estimatedTime}
                                    </small>
                                    <small class="text-muted">
                                        <i class="fas fa-file-pdf me-1"></i>
                                        PDF Export
                                    </small>
                                </div>

                                <div class="d-flex gap-2">
                                    <button class="btn btn-${report.color} flex-fill" 
                                        onclick="reportGenerator.generateReport('${key}')">
                                        <i class="fas fa-play me-2"></i>Generate
                                    </button>
                                    <button class="btn btn-outline-secondary" 
                                        onclick="reportGenerator.scheduleReport('${key}')">
                                        <i class="fas fa-calendar me-1"></i>Schedule
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Report Scheduler -->
                <div class="row">
                    <div class="col-12">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-calendar-alt me-2"></i>
                                Report Scheduler
                            </h5>
                            <p class="text-secondary mb-4">
                                Automate report generation and delivery to LPs on a recurring schedule
                            </p>

                            <div class="table-responsive">
                                <table class="table table-dark">
                                    <thead>
                                        <tr>
                                            <th>Report Type</th>
                                            <th>Frequency</th>
                                            <th>Next Run</th>
                                            <th>Recipients</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <i class="fas fa-chart-line me-2 text-primary"></i>
                                                Quarterly Fund Performance
                                            </td>
                                            <td>Quarterly</td>
                                            <td>2025-12-31</td>
                                            <td>15 LPs</td>
                                            <td><span class="badge bg-success">Active</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary">Edit</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <i class="fas fa-building me-2 text-success"></i>
                                                Portfolio Company Updates
                                            </td>
                                            <td>Monthly</td>
                                            <td>2025-11-01</td>
                                            <td>8 Partners</td>
                                            <td><span class="badge bg-success">Active</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary">Edit</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <i class="fas fa-leaf me-2 text-success"></i>
                                                ESG & Impact Report
                                            </td>
                                            <td>Quarterly</td>
                                            <td>2025-12-31</td>
                                            <td>12 LPs</td>
                                            <td><span class="badge bg-warning">Paused</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-success">Resume</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <button class="btn btn-primary mt-3" onclick="reportGenerator.addSchedule()">
                                <i class="fas fa-plus me-2"></i>Add Schedule
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Report History -->
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-history me-2"></i>
                                Recent Reports
                            </h5>
                            
                            ${this.reportHistory.length === 0 ? `
                                <div class="text-center py-5">
                                    <i class="fas fa-file-alt fa-3x text-muted mb-3"></i>
                                    <p class="text-muted">No reports generated yet</p>
                                    <button class="btn btn-primary" onclick="reportGenerator.generateReport('quarterly_fund_performance')">
                                        Generate Your First Report
                                    </button>
                                </div>
                            ` : `
                                <div class="table-responsive">
                                    <table class="table table-dark">
                                        <thead>
                                            <tr>
                                                <th>Report Name</th>
                                                <th>Generated</th>
                                                <th>Type</th>
                                                <th>Size</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${this.reportHistory.map(report => `
                                                <tr>
                                                    <td>${report.name}</td>
                                                    <td>${new Date(report.date).toLocaleDateString()}</td>
                                                    <td><span class="badge bg-${report.color}">${report.type}</span></td>
                                                    <td>${report.size}</td>
                                                    <td>
                                                        <button class="btn btn-sm btn-outline-primary">
                                                            <i class="fas fa-download"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-outline-secondary">
                                                            <i class="fas fa-share"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate report
     */
    async generateReport(reportType) {
        const report = this.reportTypes[reportType];
        if (!report) return;

        // Show loading state
        const loadingHTML = `
            <div class="modal fade show d-block" style="background: rgba(0,0,0,0.8);">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content bg-dark">
                        <div class="modal-body text-center py-5">
                            <i class="fas fa-spinner fa-spin fa-3x text-primary mb-3"></i>
                            <h5>Generating ${report.name}</h5>
                            <p class="text-muted">This will take approximately ${report.estimatedTime}...</p>
                            <div class="progress mt-3" style="height: 8px;">
                                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                                    style="width: 100%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', loadingHTML);

        // Simulate report generation
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Remove loading modal
        document.querySelector('.modal.show').remove();

        // Generate report content based on type
        const reportContent = await this.generateReportContent(reportType);

        // Add to history
        this.reportHistory.unshift({
            name: report.name,
            type: reportType,
            date: new Date().toISOString(),
            size: '2.4 MB',
            color: report.color
        });

        // Show success and download
        alert(`✅ ${report.name} Generated Successfully!\n\nThe report has been generated with ${report.sections.length} sections.\n\nClick OK to download the PDF.`);

        // In a real implementation, this would generate and download a PDF
        // using html2pdf.js or similar library
        this.downloadReportPDF(reportType, reportContent);
    }

    /**
     * Generate report content
     */
    async generateReportContent(reportType) {
        const report = this.reportTypes[reportType];
        
        // This would integrate with auxeiraAI to generate content
        // For now, return mock content structure
        return {
            title: report.name,
            date: new Date().toISOString(),
            sections: report.sections.map(section => ({
                title: section,
                content: `AI-generated content for ${section}...`,
                charts: [],
                tables: []
            }))
        };
    }

    /**
     * Download report PDF
     */
    downloadReportPDF(reportType, content) {
        console.log('Downloading PDF for:', reportType, content);
        // Implementation using html2pdf.js
        alert('PDF download would start here - integrate with html2pdf.js');
    }

    /**
     * Schedule report
     */
    scheduleReport(reportType) {
        const report = this.reportTypes[reportType];
        alert(`Schedule ${report.name}\n\nFrequency: ${report.frequency}\nRecipients: LPs\n\nScheduling interface to be implemented.`);
    }

    /**
     * Add schedule
     */
    addSchedule() {
        alert('Add new report schedule - modal to be implemented');
    }
}

// Initialize global instance
const reportGenerator = new AdvancedReportGenerator();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedReportGenerator;
}

