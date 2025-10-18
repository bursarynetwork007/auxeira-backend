/**
 * Auxeira AI Dashboard Administrator
 * Comprehensive AI-powered content generation system for all 17 SDG dashboards
 * Integrates Claude, Grok, Manus, and NanoGPT-5 for dynamic personalization
 */

class AuxeiraAIAdministrator {
    constructor() {
        this.apiEndpoints = {
            claude: '/api/ai/claude',
            grok: '/api/ai/grok', 
            manus: '/api/ai/manus',
            nanoGPT5: '/api/ai/nanogpt5'
        };
        this.userProfile = this.loadUserProfile();
        this.dashboardData = {};
        this.init();
    }

    init() {
        this.setupAIEndpoints();
        this.initializeDashboardData();
        this.startDynamicContentGeneration();
        this.setupRealTimeUpdates();
    }

    // ===========================================
    // AI ENDPOINT CONFIGURATION
    // ===========================================

    setupAIEndpoints() {
        // Configure AI API endpoints with authentication
        this.aiConfig = {
            claude: {
                model: 'claude-3-sonnet',
                maxTokens: 4000,
                temperature: 0.7,
                systemPrompt: 'You are an AI administrator for Auxeira.com ESG dashboards, specializing in SDG-aligned narratives and impact storytelling.'
            },
            grok: {
                model: 'grok-beta',
                maxTokens: 3000,
                temperature: 0.8,
                systemPrompt: 'You are a predictive analytics AI for Auxeira.com, specializing in causal inference and impact forecasting for ESG investments.'
            },
            manus: {
                model: 'manus-ai',
                maxTokens: 5000,
                temperature: 0.6,
                systemPrompt: 'You are a comprehensive report generation AI for Auxeira.com, creating premium ESG investment reports with detailed analysis.'
            },
            nanoGPT5: {
                model: 'nano-gpt-5',
                maxTokens: 2000,
                temperature: 0.5,
                systemPrompt: 'You are a data aggregation and synthesis AI for Auxeira.com, combining multiple AI outputs into coherent reports.'
            }
        };
    }

    // ===========================================
    // DYNAMIC CONTENT GENERATION BY SECTION
    // ===========================================

    async generateOverviewSection(sdgNumber, userProfile, dashboardData) {
        const prompt = `You are an AI administrator for Auxeira.com's ESG Dashboard. Generate a personalized overview for an ESG user with profile ${JSON.stringify(userProfile)}. Use data: ${JSON.stringify(dashboardData)}. Create a narrative hero section (150 words) with teaser tiles, emphasizing impact stories for SDG ${sdgNumber}. Output in HTML for glass-card, with dynamic SDG dropdown and zoom-in tags.`;

        try {
            const response = await this.callAI('claude', prompt);
            return this.processOverviewResponse(response, sdgNumber);
        } catch (error) {
            console.error('Error generating overview:', error);
            return this.getFallbackOverview(sdgNumber);
        }
    }

    async generateAnalyticsSection(sdgNumber, userProfile, dashboardData) {
        const prompt = `Administer the Analytics tab for Auxeira.com's ESG Dashboard. For an ESG user with profile ${JSON.stringify(userProfile)}, simulate causal inference using data: ${JSON.stringify(dashboardData)}. Generate a narrative (150 words) on counterfactuals for SDG ${sdgNumber} (e.g., "With Auxeira rewards, ESG impact 25% higher"). Include HTML for Chart.js doughnut chart and JS for dynamic updates.`;

        try {
            const response = await this.callAI('grok', prompt);
            return this.processAnalyticsResponse(response, sdgNumber);
        } catch (error) {
            console.error('Error generating analytics:', error);
            return this.getFallbackAnalytics(sdgNumber);
        }
    }

    async generateReportsSection(sdgNumber, userProfile, dashboardData) {
        const prompt = `Generate a premium report for Auxeira.com's ESG Dashboard. For an ESG user with profile ${JSON.stringify(userProfile)}, use data: ${JSON.stringify(dashboardData)}. Create a narrative structure for SDG ${sdgNumber}: Executive Summary, SDG Impact Stories, Causal Analysis (Auxeira uplift). Output HTML for html2pdf.js, personalized for hybrid SDG tiles.`;

        try {
            // Use dual AI approach: Manus + NanoGPT-5
            const manusResponse = await this.callAI('manus', prompt);
            const nanoResponse = await this.callAI('nanoGPT5', `Aggregate and enhance this report: ${manusResponse}`);
            return this.processReportsResponse(nanoResponse, sdgNumber);
        } catch (error) {
            console.error('Error generating reports:', error);
            return this.getFallbackReports(sdgNumber);
        }
    }

    // ===========================================
    // SDG-SPECIFIC CONTENT GENERATORS
    // ===========================================

    async generateSDGSpecificContent(sdgNumber) {
        const sdgConfigs = {
            1: { // No Poverty
                focusAreas: ['microfinance', 'economic-inclusion', 'job-creation'],
                keyMetrics: ['poverty-reduction', 'income-increase', 'employment-rate'],
                aiPromptContext: 'poverty alleviation and economic empowerment'
            },
            2: { // Zero Hunger
                focusAreas: ['food-security', 'sustainable-agriculture', 'nutrition'],
                keyMetrics: ['food-access', 'crop-yield', 'malnutrition-reduction'],
                aiPromptContext: 'food security and sustainable agriculture'
            },
            3: { // Good Health
                focusAreas: ['healthcare-access', 'disease-prevention', 'medical-innovation'],
                keyMetrics: ['health-outcomes', 'treatment-success', 'healthcare-coverage'],
                aiPromptContext: 'healthcare access and medical innovation'
            },
            4: { // Quality Education
                focusAreas: ['education-access', 'learning-outcomes', 'skills-development'],
                keyMetrics: ['literacy-rate', 'school-enrollment', 'graduation-rate'],
                aiPromptContext: 'educational access and learning outcomes'
            },
            5: { // Gender Equality
                focusAreas: ['womens-empowerment', 'gender-parity', 'leadership'],
                keyMetrics: ['gender-gap', 'women-leadership', 'economic-participation'],
                aiPromptContext: 'gender equality and women\'s empowerment'
            },
            6: { // Clean Water
                focusAreas: ['water-access', 'sanitation', 'water-quality'],
                keyMetrics: ['water-coverage', 'sanitation-access', 'water-safety'],
                aiPromptContext: 'clean water access and sanitation'
            },
            7: { // Clean Energy
                focusAreas: ['renewable-energy', 'energy-access', 'energy-efficiency'],
                keyMetrics: ['renewable-capacity', 'energy-access-rate', 'carbon-reduction'],
                aiPromptContext: 'clean energy and renewable power'
            },
            8: { // Decent Work
                focusAreas: ['employment', 'economic-growth', 'labor-rights'],
                keyMetrics: ['employment-rate', 'wage-growth', 'job-quality'],
                aiPromptContext: 'decent work and economic growth'
            },
            9: { // Innovation
                focusAreas: ['infrastructure', 'innovation', 'industrialization'],
                keyMetrics: ['rd-investment', 'patent-applications', 'tech-adoption'],
                aiPromptContext: 'innovation and infrastructure development'
            },
            10: { // Reduced Inequalities
                focusAreas: ['social-inclusion', 'income-equality', 'equal-opportunities'],
                keyMetrics: ['gini-coefficient', 'social-mobility', 'inclusion-index'],
                aiPromptContext: 'reducing inequalities and social inclusion'
            },
            11: { // Sustainable Cities
                focusAreas: ['urban-planning', 'sustainable-transport', 'green-buildings'],
                keyMetrics: ['urban-sustainability', 'transport-efficiency', 'green-space'],
                aiPromptContext: 'sustainable cities and urban development'
            },
            12: { // Responsible Consumption
                focusAreas: ['circular-economy', 'waste-reduction', 'sustainable-production'],
                keyMetrics: ['waste-recycling', 'resource-efficiency', 'circular-index'],
                aiPromptContext: 'responsible consumption and circular economy'
            },
            13: { // Climate Action
                focusAreas: ['climate-mitigation', 'adaptation', 'carbon-reduction'],
                keyMetrics: ['carbon-footprint', 'climate-resilience', 'emission-reduction'],
                aiPromptContext: 'climate action and environmental protection'
            },
            14: { // Life Below Water
                focusAreas: ['marine-conservation', 'ocean-health', 'sustainable-fisheries'],
                keyMetrics: ['marine-biodiversity', 'ocean-quality', 'fish-stocks'],
                aiPromptContext: 'marine conservation and ocean health'
            },
            15: { // Life on Land
                focusAreas: ['biodiversity', 'forest-conservation', 'ecosystem-restoration'],
                keyMetrics: ['forest-cover', 'species-protection', 'ecosystem-health'],
                aiPromptContext: 'terrestrial biodiversity and ecosystem protection'
            },
            16: { // Peace & Justice
                focusAreas: ['governance', 'rule-of-law', 'institutional-development'],
                keyMetrics: ['governance-index', 'corruption-perception', 'justice-access'],
                aiPromptContext: 'peace, justice and strong institutions'
            },
            17: { // Partnerships
                focusAreas: ['global-cooperation', 'multi-stakeholder', 'knowledge-sharing'],
                keyMetrics: ['partnership-effectiveness', 'cooperation-index', 'knowledge-transfer'],
                aiPromptContext: 'partnerships for sustainable development'
            }
        };

        return sdgConfigs[sdgNumber] || sdgConfigs[1];
    }

    // ===========================================
    // AI API INTEGRATION
    // ===========================================

    async callAI(aiProvider, prompt, additionalConfig = {}) {
        const config = { ...this.aiConfig[aiProvider], ...additionalConfig };
        
        const requestBody = {
            model: config.model,
            messages: [
                {
                    role: 'system',
                    content: config.systemPrompt
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: config.maxTokens,
            temperature: config.temperature
        };

        try {
            const response = await fetch(this.apiEndpoints[aiProvider], {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAPIKey(aiProvider)}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`AI API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error(`Error calling ${aiProvider}:`, error);
            throw error;
        }
    }

    getAPIKey(provider) {
        // In production, these would come from environment variables
        const apiKeys = {
            claude: process.env.CLAUDE_API_KEY || 'claude_key_placeholder',
            grok: process.env.GROK_API_KEY || 'grok_key_placeholder',
            manus: process.env.MANUS_API_KEY || 'manus_key_placeholder',
            nanoGPT5: process.env.NANOGPT5_API_KEY || 'nanogpt5_key_placeholder'
        };
        return apiKeys[provider];
    }

    // ===========================================
    // RESPONSE PROCESSING
    // ===========================================

    processOverviewResponse(aiResponse, sdgNumber) {
        // Parse AI response and create structured overview content
        const sdgConfig = this.generateSDGSpecificContent(sdgNumber);
        
        return {
            heroNarrative: this.extractHeroNarrative(aiResponse),
            teaserTiles: this.generateTeaserTiles(aiResponse, sdgConfig),
            dynamicDropdown: this.createSDGDropdown(sdgNumber),
            zoomTags: this.generateZoomTags(aiResponse),
            html: this.formatOverviewHTML(aiResponse, sdgNumber)
        };
    }

    processAnalyticsResponse(aiResponse, sdgNumber) {
        return {
            narrative: this.extractAnalyticsNarrative(aiResponse),
            chartConfig: this.generateChartConfig(aiResponse),
            counterfactuals: this.extractCounterfactuals(aiResponse),
            dynamicUpdates: this.generateUpdateScript(aiResponse),
            html: this.formatAnalyticsHTML(aiResponse, sdgNumber)
        };
    }

    processReportsResponse(aiResponse, sdgNumber) {
        return {
            executiveSummary: this.extractExecutiveSummary(aiResponse),
            impactStories: this.extractImpactStories(aiResponse),
            causalAnalysis: this.extractCausalAnalysis(aiResponse),
            pdfHTML: this.formatReportHTML(aiResponse, sdgNumber),
            downloadConfig: this.generatePDFConfig(aiResponse)
        };
    }

    // ===========================================
    // CONTENT EXTRACTION UTILITIES
    // ===========================================

    extractHeroNarrative(response) {
        // Extract the main narrative from AI response
        const narrativeMatch = response.match(/<div class="hero-narrative">(.*?)<\/div>/s);
        return narrativeMatch ? narrativeMatch[1] : this.generateDefaultNarrative();
    }

    generateTeaserTiles(response, sdgConfig) {
        // Generate interactive teaser tiles based on AI response
        const tiles = [];
        sdgConfig.focusAreas.forEach((area, index) => {
            tiles.push({
                title: this.formatAreaTitle(area),
                metric: this.extractMetricForArea(response, area),
                trend: this.calculateTrend(area),
                action: `exploreFocusArea('${area}')`
            });
        });
        return tiles;
    }

    createSDGDropdown(currentSDG) {
        const sdgList = [];
        for (let i = 1; i <= 17; i++) {
            sdgList.push({
                number: i,
                title: this.getSDGTitle(i),
                active: i === currentSDG,
                url: `esg_${this.getSDGSlug(i)}_enhanced.html`
            });
        }
        return sdgList;
    }

    generateZoomTags(response) {
        // Extract key terms and create zoom-in tags
        const keyTerms = this.extractKeyTerms(response);
        return keyTerms.map(term => ({
            text: term,
            action: `zoomIntoTopic('${term}')`,
            relevance: this.calculateRelevance(term)
        }));
    }

    // ===========================================
    // FALLBACK CONTENT GENERATORS
    // ===========================================

    getFallbackOverview(sdgNumber) {
        const sdgTitles = {
            1: 'No Poverty', 2: 'Zero Hunger', 3: 'Good Health', 4: 'Quality Education',
            5: 'Gender Equality', 6: 'Clean Water', 7: 'Clean Energy', 8: 'Decent Work',
            9: 'Innovation', 10: 'Reduced Inequalities', 11: 'Sustainable Cities',
            12: 'Responsible Consumption', 13: 'Climate Action', 14: 'Life Below Water',
            15: 'Life on Land', 16: 'Peace & Justice', 17: 'Partnerships'
        };

        return {
            heroNarrative: `Comprehensive ${sdgTitles[sdgNumber]} impact dashboard providing real-time insights into sustainable development progress. Track investment performance, measure social impact, and drive positive change through data-driven decision making.`,
            teaserTiles: this.generateDefaultTiles(sdgNumber),
            html: this.generateDefaultOverviewHTML(sdgNumber)
        };
    }

    getFallbackAnalytics(sdgNumber) {
        return {
            narrative: `Advanced analytics reveal significant impact potential through strategic investments in SDG ${sdgNumber}. Predictive models indicate 25% higher impact rates with optimized portfolio allocation.`,
            chartConfig: this.generateDefaultChartConfig(sdgNumber),
            html: this.generateDefaultAnalyticsHTML(sdgNumber)
        };
    }

    getFallbackReports(sdgNumber) {
        return {
            executiveSummary: `Quarterly impact assessment for SDG ${sdgNumber} investments shows strong performance across key metrics with measurable social and environmental benefits.`,
            html: this.generateDefaultReportHTML(sdgNumber)
        };
    }

    // ===========================================
    // HTML FORMATTING FUNCTIONS
    // ===========================================

    formatOverviewHTML(content, sdgNumber) {
        const sdgConfig = this.generateSDGSpecificContent(sdgNumber);
        
        return `
        <div class="ai-generated-overview" data-sdg="${sdgNumber}">
            <div class="hero-section glass-card ai-powered">
                <div class="sdg-dropdown-container">
                    <select class="sdg-selector" onchange="navigateToSDG(this.value)">
                        ${this.generateSDGDropdownOptions(sdgNumber)}
                    </select>
                </div>
                
                <div class="hero-narrative">
                    ${this.extractHeroNarrative(content)}
                </div>
                
                <div class="teaser-tiles-grid">
                    ${this.generateTeaserTilesHTML(content, sdgConfig)}
                </div>
                
                <div class="zoom-tags">
                    ${this.generateZoomTagsHTML(content)}
                </div>
            </div>
            
            <div class="dynamic-metrics-container">
                ${this.generateDynamicMetricsHTML(content, sdgNumber)}
            </div>
        </div>`;
    }

    formatAnalyticsHTML(content, sdgNumber) {
        return `
        <div class="ai-analytics-section" data-sdg="${sdgNumber}">
            <div class="analytics-narrative glass-card ai-powered">
                <h4><i class="fas fa-brain me-2"></i>AI-Powered Causal Analysis</h4>
                <div class="narrative-content">
                    ${this.extractAnalyticsNarrative(content)}
                </div>
            </div>
            
            <div class="predictive-charts-container">
                <div class="row">
                    <div class="col-md-6">
                        <div class="glass-card">
                            <h5>Counterfactual Analysis</h5>
                            <div class="chart-container">
                                <canvas id="counterfactualChart${sdgNumber}"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="glass-card">
                            <h5>Impact Forecasting</h5>
                            <div class="chart-container">
                                <canvas id="forecastChart${sdgNumber}"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                ${this.generateAnalyticsScript(content, sdgNumber)}
            </script>
        </div>`;
    }

    formatReportHTML(content, sdgNumber) {
        return `
        <div class="ai-report-section" data-sdg="${sdgNumber}">
            <div class="report-header">
                <h3>AI-Generated Premium Report - SDG ${sdgNumber}</h3>
                <button class="btn-download-pdf" onclick="generatePDFReport(${sdgNumber})">
                    <i class="fas fa-download me-2"></i>Download PDF
                </button>
            </div>
            
            <div class="report-content" id="reportContent${sdgNumber}">
                <div class="executive-summary">
                    <h4>Executive Summary</h4>
                    ${this.extractExecutiveSummary(content)}
                </div>
                
                <div class="impact-stories">
                    <h4>SDG Impact Stories</h4>
                    ${this.extractImpactStories(content)}
                </div>
                
                <div class="causal-analysis">
                    <h4>Causal Analysis - Auxeira Uplift</h4>
                    ${this.extractCausalAnalysis(content)}
                </div>
            </div>
            
            <script>
                ${this.generateReportScript(content, sdgNumber)}
            </script>
        </div>`;
    }

    // ===========================================
    // DASHBOARD INITIALIZATION
    // ===========================================

    async initializeAllDashboards() {
        const dashboards = [];
        
        for (let sdgNumber = 1; sdgNumber <= 17; sdgNumber++) {
            try {
                const dashboardContent = await this.generateCompleteDashboard(sdgNumber);
                dashboards.push({
                    sdg: sdgNumber,
                    content: dashboardContent,
                    status: 'success'
                });
            } catch (error) {
                console.error(`Error initializing SDG ${sdgNumber} dashboard:`, error);
                dashboards.push({
                    sdg: sdgNumber,
                    content: this.getFallbackDashboard(sdgNumber),
                    status: 'fallback'
                });
            }
        }
        
        return dashboards;
    }

    async generateCompleteDashboard(sdgNumber) {
        const userProfile = this.userProfile;
        const dashboardData = await this.getDashboardData(sdgNumber);
        
        const [overview, analytics, reports] = await Promise.all([
            this.generateOverviewSection(sdgNumber, userProfile, dashboardData),
            this.generateAnalyticsSection(sdgNumber, userProfile, dashboardData),
            this.generateReportsSection(sdgNumber, userProfile, dashboardData)
        ]);
        
        return {
            overview,
            analytics,
            reports,
            metadata: {
                sdg: sdgNumber,
                generated: new Date().toISOString(),
                aiProviders: ['claude', 'grok', 'manus', 'nanoGPT5']
            }
        };
    }

    // ===========================================
    // REAL-TIME UPDATES
    // ===========================================

    startDynamicContentGeneration() {
        // Initialize real-time content updates
        setInterval(() => {
            this.updateDynamicContent();
        }, 300000); // Update every 5 minutes
        
        // Listen for user interaction events
        document.addEventListener('userProfileUpdate', (event) => {
            this.handleProfileUpdate(event.detail);
        });
        
        // Monitor dashboard engagement
        this.trackUserEngagement();
    }

    async updateDynamicContent() {
        const currentSDG = this.getCurrentSDG();
        if (currentSDG) {
            try {
                const updatedContent = await this.generateCompleteDashboard(currentSDG);
                this.updateDashboardContent(updatedContent);
            } catch (error) {
                console.error('Error updating dynamic content:', error);
            }
        }
    }

    // ===========================================
    // UTILITY FUNCTIONS
    // ===========================================

    loadUserProfile() {
        const profile = localStorage.getItem('auxeira_profile');
        return profile ? JSON.parse(profile) : this.getDefaultProfile();
    }

    getDefaultProfile() {
        return {
            organizationName: 'BlackRock',
            organizationType: 'asset-manager',
            userRole: 'fund-manager',
            focusAreas: [1, 3, 7, 13],
            investmentSize: '100m-1b',
            complianceFrameworks: ['sfdr', 'csrd', 'tcfd'],
            preferences: {
                aiPersonalization: true,
                dynamicUpdates: true,
                premiumReports: true
            }
        };
    }

    getCurrentSDG() {
        const path = window.location.pathname;
        const match = path.match(/esg_(\w+)_enhanced\.html/);
        if (match) {
            return this.getSDGNumberFromSlug(match[1]);
        }
        return 1; // Default to SDG 1
    }

    getSDGNumberFromSlug(slug) {
        const slugMap = {
            'poverty': 1, 'hunger': 2, 'health': 3, 'education': 4, 'gender': 5,
            'water': 6, 'energy': 7, 'work': 8, 'innovation': 9, 'inequalities': 10,
            'cities': 11, 'consumption': 12, 'climate': 13, 'ocean': 14,
            'land': 15, 'justice': 16, 'partnerships': 17
        };
        return slugMap[slug] || 1;
    }

    getSDGSlug(number) {
        const numberMap = {
            1: 'poverty', 2: 'hunger', 3: 'health', 4: 'education', 5: 'gender',
            6: 'water', 7: 'energy', 8: 'work', 9: 'innovation', 10: 'inequalities',
            11: 'cities', 12: 'consumption', 13: 'climate', 14: 'ocean',
            15: 'land', 16: 'justice', 17: 'partnerships'
        };
        return numberMap[number] || 'poverty';
    }

    getSDGTitle(number) {
        const titles = {
            1: 'No Poverty', 2: 'Zero Hunger', 3: 'Good Health', 4: 'Quality Education',
            5: 'Gender Equality', 6: 'Clean Water', 7: 'Clean Energy', 8: 'Decent Work',
            9: 'Innovation', 10: 'Reduced Inequalities', 11: 'Sustainable Cities',
            12: 'Responsible Consumption', 13: 'Climate Action', 14: 'Life Below Water',
            15: 'Life on Land', 16: 'Peace & Justice', 17: 'Partnerships'
        };
        return titles[number] || 'Sustainable Development';
    }
}

// ===========================================
// GLOBAL FUNCTIONS FOR DASHBOARD INTERACTION
// ===========================================

// Initialize AI Administrator
let auxeiraAI;
document.addEventListener('DOMContentLoaded', function() {
    auxeiraAI = new AuxeiraAIAdministrator();
});

// Navigation functions
function navigateToSDG(sdgNumber) {
    const slug = auxeiraAI.getSDGSlug(parseInt(sdgNumber));
    window.location.href = `esg_${slug}_enhanced.html`;
}

function exploreFocusArea(area) {
    // Zoom into specific focus area with AI-generated content
    auxeiraAI.generateFocusAreaContent(area).then(content => {
        displayFocusAreaModal(content);
    });
}

function zoomIntoTopic(topic) {
    // Generate detailed topic analysis
    auxeiraAI.generateTopicAnalysis(topic).then(analysis => {
        displayTopicAnalysis(analysis);
    });
}

// PDF Report Generation
function generatePDFReport(sdgNumber) {
    const reportContent = document.getElementById(`reportContent${sdgNumber}`);
    const opt = {
        margin: 1,
        filename: `auxeira-sdg-${sdgNumber}-report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(reportContent).save();
}

// Real-time content updates
function updateDashboardSection(section, content) {
    const sectionElement = document.querySelector(`[data-section="${section}"]`);
    if (sectionElement) {
        sectionElement.innerHTML = content;
        // Reinitialize any charts or interactive elements
        if (section === 'analytics') {
            initializeAnalyticsCharts();
        }
    }
}

// Export the AI Administrator for global access
window.AuxeiraAI = AuxeiraAIAdministrator;
