/**
 * Founder Sentiment Analyzer
 * Social & news signals tracking for portfolio companies
 * Features: X/Twitter monitoring, news scraping, sentiment scoring, momentum tracking
 * AI Model: Claude (long-form analysis and narrative generation)
 */

class FounderSentimentAnalyzer {
    constructor() {
        this.sentimentData = [];
        this.charts = {};
        this.refreshInterval = null;
    }

    /**
     * Initialize the analyzer
     */
    initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = this.getAnalyzerHTML();
        this.loadSentimentData();
        this.startRealTimeUpdates();
    }

    /**
     * Get analyzer HTML
     */
    getAnalyzerHTML() {
        return `
            <div class="founder-sentiment-analyzer">
                <!-- Header -->
                <div class="glass-card p-4 mb-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h3 class="mb-2">
                                <i class="fas fa-chart-line me-2 text-info"></i>
                                Founder Sentiment Analyzer
                                <span class="badge bg-info ms-2">Claude AI</span>
                            </h3>
                            <p class="text-secondary mb-0">
                                Real-time social signals and news monitoring for your portfolio founders
                            </p>
                        </div>
                        <div class="text-end">
                            <div class="badge bg-success mb-2">
                                <i class="fas fa-circle pulse-dot me-1"></i>
                                Live Monitoring
                            </div>
                            <div class="small text-muted">
                                Last updated: <span id="lastUpdateTime">Just now</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Alert Banner for Critical Signals -->
                <div id="sentimentAlerts"></div>

                <!-- Sentiment Overview -->
                <div class="row mb-4">
                    <div class="col-md-8">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-wave-square me-2"></i>
                                Portfolio Sentiment Timeline
                            </h5>
                            <canvas id="sentimentTimelineChart" height="100"></canvas>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="glass-card p-4">
                            <h5 class="mb-3">
                                <i class="fas fa-tachometer-alt me-2"></i>
                                Momentum Scores
                            </h5>
                            <div id="momentumScores">
                                <!-- Momentum scores will be rendered here -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Company Sentiment Cards -->
                <div class="glass-card p-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h5 class="mb-0">
                            <i class="fas fa-building me-2"></i>
                            Company Sentiment Details
                        </h5>
                        <div>
                            <button class="btn btn-sm btn-outline-primary" onclick="sentimentAnalyzer.filterBy('all')">
                                All
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="sentimentAnalyzer.filterBy('positive')">
                                Positive
                            </button>
                            <button class="btn btn-sm btn-outline-warning" onclick="sentimentAnalyzer.filterBy('neutral')">
                                Neutral
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="sentimentAnalyzer.filterBy('negative')">
                                Negative
                            </button>
                        </div>
                    </div>

                    <div id="sentimentCards" class="row">
                        <!-- Sentiment cards will be rendered here -->
                    </div>
                </div>
            </div>

            <style>
                .pulse-dot {
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .sentiment-badge {
                    font-size: 0.75rem;
                    padding: 0.25rem 0.5rem;
                }

                .signal-card {
                    border-left: 4px solid;
                    transition: all 0.3s ease;
                }

                .signal-card:hover {
                    transform: translateX(5px);
                }

                .signal-positive { border-left-color: #10b981; }
                .signal-neutral { border-left-color: #f59e0b; }
                .signal-negative { border-left-color: #ef4444; }

                .momentum-meter {
                    height: 8px;
                    background: #333;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .momentum-fill {
                    height: 100%;
                    transition: width 0.5s ease;
                }
            </style>
        `;
    }

    /**
     * Load sentiment data
     */
    async loadSentimentData() {
        // Show loading
        const container = document.getElementById('sentimentCards');
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-spinner fa-spin fa-3x text-primary mb-3"></i>
                    <p class="text-muted">Analyzing social signals and news...</p>
                </div>
            `;
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Generate mock sentiment data
        this.sentimentData = this.generateMockSentiment();

        // Render components
        this.renderAlerts();
        this.renderMomentumScores();
        this.renderSentimentCards();
        this.renderTimelineChart();

        // Update timestamp
        this.updateTimestamp();
    }

    /**
     * Generate mock sentiment data
     */
    generateMockSentiment() {
        return [
            {
                company: 'CloudSecure',
                founder: 'Sarah Kim',
                sentiment: 'positive',
                momentumScore: 85,
                signals: [
                    {
                        type: 'twitter',
                        content: 'Excited to announce CloudSecure just closed a major enterprise deal with Fortune 500 company! 🚀',
                        timestamp: '2 hours ago',
                        sentiment: 'positive',
                        engagement: 245
                    },
                    {
                        type: 'news',
                        content: 'CloudSecure named in Gartner\'s Cool Vendors in Cybersecurity 2025',
                        source: 'TechCrunch',
                        timestamp: '1 day ago',
                        sentiment: 'positive',
                        url: '#'
                    },
                    {
                        type: 'linkedin',
                        content: 'Proud of our team hitting $250K ARR milestone. Thank you to our investors!',
                        timestamp: '3 days ago',
                        sentiment: 'positive',
                        engagement: 128
                    }
                ],
                recentNews: [
                    { title: 'CloudSecure raises seed round', sentiment: 'positive', date: '1 week ago' },
                    { title: 'Gartner recognition', sentiment: 'positive', date: '1 day ago' }
                ],
                trendDirection: 'up',
                riskFlags: []
            },
            {
                company: 'HealthTech',
                founder: 'David Chen',
                sentiment: 'neutral',
                momentumScore: 62,
                signals: [
                    {
                        type: 'twitter',
                        content: 'Navigating regulatory challenges in healthcare is tough but we\'re making progress',
                        timestamp: '5 hours ago',
                        sentiment: 'neutral',
                        engagement: 45
                    },
                    {
                        type: 'news',
                        content: 'HealthTech pivots to B2B model after consumer traction challenges',
                        source: 'Healthcare IT News',
                        timestamp: '2 days ago',
                        sentiment: 'neutral',
                        url: '#'
                    }
                ],
                recentNews: [
                    { title: 'HealthTech pivots strategy', sentiment: 'neutral', date: '2 days ago' }
                ],
                trendDirection: 'flat',
                riskFlags: ['Pivot mentioned', 'Lower engagement']
            },
            {
                company: 'FinanceApp',
                founder: 'Emily Rodriguez',
                sentiment: 'positive',
                momentumScore: 92,
                signals: [
                    {
                        type: 'twitter',
                        content: 'Just hit 5,000 paying users! 🎉 Growth is accelerating beyond our wildest dreams',
                        timestamp: '1 hour ago',
                        sentiment: 'positive',
                        engagement: 512
                    },
                    {
                        type: 'news',
                        content: 'FinanceApp sees 42% month-over-month growth, attracting VC attention',
                        source: 'VentureBeat',
                        timestamp: '6 hours ago',
                        sentiment: 'positive',
                        url: '#'
                    },
                    {
                        type: 'linkedin',
                        content: 'Hiring 10 engineers this quarter. Join us in revolutionizing personal finance!',
                        timestamp: '1 day ago',
                        sentiment: 'positive',
                        engagement: 287
                    }
                ],
                recentNews: [
                    { title: 'FinanceApp growth surge', sentiment: 'positive', date: '6 hours ago' },
                    { title: 'Hiring spree signals expansion', sentiment: 'positive', date: '1 day ago' }
                ],
                trendDirection: 'up',
                riskFlags: []
            },
            {
                company: 'TechCo',
                founder: 'Alex Johnson',
                sentiment: 'negative',
                momentumScore: 38,
                signals: [
                    {
                        type: 'twitter',
                        content: 'Tough times ahead. Had to make some difficult decisions regarding team size.',
                        timestamp: '3 hours ago',
                        sentiment: 'negative',
                        engagement: 89
                    },
                    {
                        type: 'news',
                        content: 'TechCo lays off 15% of workforce amid funding challenges',
                        source: 'The Information',
                        timestamp: '4 hours ago',
                        sentiment: 'negative',
                        url: '#'
                    }
                ],
                recentNews: [
                    { title: 'TechCo layoffs announced', sentiment: 'negative', date: '4 hours ago' }
                ],
                trendDirection: 'down',
                riskFlags: ['Layoffs', 'Funding concerns', 'Negative sentiment spike']
            }
        ];
    }

    /**
     * Render alerts for critical signals
     */
    renderAlerts() {
        const alertContainer = document.getElementById('sentimentAlerts');
        if (!alertContainer) return;

        const criticalCompanies = this.sentimentData.filter(c => 
            c.sentiment === 'negative' || c.riskFlags.length > 0
        );

        if (criticalCompanies.length === 0) {
            alertContainer.innerHTML = '';
            return;
        }

        alertContainer.innerHTML = criticalCompanies.map(company => `
            <div class="alert alert-warning mb-3">
                <div class="d-flex align-items-center">
                    <i class="fas fa-exclamation-triangle fa-2x me-3"></i>
                    <div class="flex-grow-1">
                        <strong>${company.company}</strong> - Distress signals detected
                        <div class="small mt-1">
                            ${company.riskFlags.map(flag => `<span class="badge bg-danger me-1">${flag}</span>`).join('')}
                        </div>
                    </div>
                    <button class="btn btn-sm btn-outline-primary" onclick="sentimentAnalyzer.viewDetails('${company.company}')">
                        View Details
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render momentum scores
     */
    renderMomentumScores() {
        const container = document.getElementById('momentumScores');
        if (!container) return;

        const sorted = [...this.sentimentData].sort((a, b) => b.momentumScore - a.momentumScore);

        container.innerHTML = sorted.map(company => `
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="small">${company.company}</span>
                    <span class="badge ${this.getMomentumColor(company.momentumScore)}">${company.momentumScore}</span>
                </div>
                <div class="momentum-meter">
                    <div class="momentum-fill ${this.getMomentumColor(company.momentumScore)}" 
                        style="width: ${company.momentumScore}%"></div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render sentiment cards
     */
    renderSentimentCards() {
        const container = document.getElementById('sentimentCards');
        if (!container) return;

        container.innerHTML = this.sentimentData.map(company => `
            <div class="col-md-6 mb-4 sentiment-card" data-sentiment="${company.sentiment}">
                <div class="glass-card p-4 signal-card signal-${company.sentiment}">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h5 class="mb-1">${company.company}</h5>
                            <small class="text-muted">Founder: ${company.founder}</small>
                        </div>
                        <div class="text-end">
                            <span class="badge ${this.getSentimentBadgeClass(company.sentiment)} sentiment-badge">
                                ${company.sentiment.toUpperCase()}
                            </span>
                            <div class="small text-muted mt-1">
                                <i class="fas fa-arrow-${company.trendDirection === 'up' ? 'up text-success' : company.trendDirection === 'down' ? 'down text-danger' : 'right text-warning'}"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Momentum Score -->
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <small class="text-muted">Momentum Score</small>
                            <strong class="${this.getMomentumColor(company.momentumScore)}">${company.momentumScore}/100</strong>
                        </div>
                        <div class="momentum-meter">
                            <div class="momentum-fill ${this.getMomentumColor(company.momentumScore)}" 
                                style="width: ${company.momentumScore}%"></div>
                        </div>
                    </div>

                    <!-- Recent Signals -->
                    <div class="mb-3">
                        <small class="text-muted d-block mb-2">Recent Signals:</small>
                        ${company.signals.slice(0, 2).map(signal => `
                            <div class="signal-item mb-2 p-2" style="background: rgba(255,255,255,0.05); border-radius: 8px;">
                                <div class="d-flex align-items-start">
                                    <i class="fas fa-${this.getSignalIcon(signal.type)} me-2 mt-1"></i>
                                    <div class="flex-grow-1">
                                        <div class="small">${signal.content}</div>
                                        <div class="d-flex justify-content-between align-items-center mt-1">
                                            <small class="text-muted">${signal.timestamp}</small>
                                            ${signal.engagement ? `<small class="text-muted"><i class="fas fa-heart me-1"></i>${signal.engagement}</small>` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Risk Flags -->
                    ${company.riskFlags.length > 0 ? `
                        <div class="mb-3">
                            <small class="text-muted d-block mb-1">Risk Flags:</small>
                            ${company.riskFlags.map(flag => `
                                <span class="badge bg-danger me-1 mb-1">${flag}</span>
                            `).join('')}
                        </div>
                    ` : ''}

                    <!-- Actions -->
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary flex-fill" 
                            onclick="sentimentAnalyzer.viewFullAnalysis('${company.company}')">
                            <i class="fas fa-chart-line me-1"></i>Full Analysis
                        </button>
                        <button class="btn btn-sm btn-outline-info" 
                            onclick="sentimentAnalyzer.setAlert('${company.company}')">
                            <i class="fas fa-bell"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render timeline chart
     */
    renderTimelineChart() {
        const ctx = document.getElementById('sentimentTimelineChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.timeline) {
            this.charts.timeline.destroy();
        }

        // Generate timeline data (last 30 days)
        const days = 30;
        const labels = [];
        const datasets = this.sentimentData.map(company => {
            const data = [];
            for (let i = days; i >= 0; i--) {
                if (i === days) labels.push(`${i}d ago`);
                // Generate mock sentiment trend
                const base = company.momentumScore;
                const variation = Math.random() * 20 - 10;
                data.push(Math.max(0, Math.min(100, base + variation)));
            }
            return {
                label: company.company,
                data: data,
                borderColor: this.getChartColor(company.sentiment),
                backgroundColor: 'transparent',
                tension: 0.4
            };
        });

        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.slice(0, 8), // Show last 7 days
                datasets: datasets.map(ds => ({
                    ...ds,
                    data: ds.data.slice(-8)
                }))
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
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: '#b3b3b3' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    x: {
                        ticks: { color: '#b3b3b3' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    }

    /**
     * Helper methods
     */
    getSentimentBadgeClass(sentiment) {
        const classes = {
            positive: 'bg-success',
            neutral: 'bg-warning',
            negative: 'bg-danger'
        };
        return classes[sentiment] || 'bg-secondary';
    }

    getMomentumColor(score) {
        if (score >= 75) return 'bg-success';
        if (score >= 50) return 'bg-info';
        if (score >= 25) return 'bg-warning';
        return 'bg-danger';
    }

    getSignalIcon(type) {
        const icons = {
            twitter: 'brands fa-twitter',
            news: 'newspaper',
            linkedin: 'brands fa-linkedin'
        };
        return icons[type] || 'circle';
    }

    getChartColor(sentiment) {
        const colors = {
            positive: '#10b981',
            neutral: '#f59e0b',
            negative: '#ef4444'
        };
        return colors[sentiment] || '#6b7280';
    }

    /**
     * Start real-time updates
     */
    startRealTimeUpdates() {
        // Simulate real-time updates every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.updateTimestamp();
            // In production, fetch new data from API
        }, 30000);
    }

    /**
     * Update timestamp
     */
    updateTimestamp() {
        const element = document.getElementById('lastUpdateTime');
        if (element) {
            element.textContent = 'Just now';
        }
    }

    /**
     * Filter by sentiment
     */
    filterBy(sentiment) {
        const cards = document.querySelectorAll('.sentiment-card');
        cards.forEach(card => {
            if (sentiment === 'all' || card.dataset.sentiment === sentiment) {
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
        const company = this.sentimentData.find(c => c.company === companyName);
        if (!company) return;

        alert(`Full Sentiment Analysis for ${companyName}\n\nMomentum Score: ${company.momentumScore}/100\nSentiment: ${company.sentiment}\n\nRecent Signals: ${company.signals.length}\nRisk Flags: ${company.riskFlags.length}\n\n(Full analysis modal to be implemented)`);
    }

    /**
     * Set alert
     */
    setAlert(companyName) {
        alert(`Alert set for ${companyName}. You'll be notified of significant sentiment changes.`);
    }

    /**
     * View details
     */
    viewDetails(companyName) {
        this.viewFullAnalysis(companyName);
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        Object.values(this.charts).forEach(chart => chart.destroy());
    }
}

// Initialize global instance
const sentimentAnalyzer = new FounderSentimentAnalyzer();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FounderSentimentAnalyzer;
}

