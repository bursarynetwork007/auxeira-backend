/**
 * Enhanced Customer-Centric AI Prompts System for Auxeira Dashboards
 * Leverages each AI's strengths with website data integration and cron scheduling
 */

const cron = require('node-cron');
const axios = require('axios');
const cheerio = require('cheerio');

class EnhancedAIPromptsSystem {
    constructor() {
        this.aiStrengths = {
            nanoGPT5: 'code/HTML generation, technical implementation',
            grok: 'reasoning/creativity, causal inference, predictions',
            manus: 'data scraping, web analysis, comprehensive research',
            claude: 'narratives, storytelling, impact communication'
        };
        
        this.userProfileCache = new Map();
        this.websiteDataCache = new Map();
        this.dailyResetScheduled = false;
        
        this.init();
    }

    init() {
        this.setupDailyReset();
        this.initializeWebsiteDataScraping();
    }

    // ===========================================
    // ENHANCED AI PROMPTS BY DASHBOARD & SECTION
    // ===========================================

    /**
     * ESG EDUCATION DASHBOARD PROMPTS
     */
    getESGEducationPrompts(userProfile, websiteData) {
        return {
            // Overview Section - Claude (Narratives)
            overview: {
                ai: 'claude',
                prompt: `You are Auxeira's Chief Narrative Officer. Create a compelling ESG education overview for ${userProfile.organizationName} (${userProfile.organizationType}).

CONTEXT ANALYSIS:
- User Type: [${userProfile.userRole}] at [${userProfile.organizationType}]
- Focus Areas: [${userProfile.focusAreas.join(', ')}]
- Investment Size: [${userProfile.investmentSize}]
- Geographic Focus: [${userProfile.geographicFocus || 'Global'}]
- Website Analysis: [${websiteData.missionStatement}]
- Current ESG Initiatives: [${websiteData.esgInitiatives}]
- Compliance Requirements: [${userProfile.complianceFrameworks.join(', ')}]

PERSONALIZATION REQUIREMENTS:
1. Address ${userProfile.organizationName} by name in hero narrative
2. Reference their actual ESG initiatives from website: ${websiteData.esgInitiatives}
3. Align with their stated mission: "${websiteData.missionStatement}"
4. Focus on their preferred SDGs: ${userProfile.focusAreas}
5. Match their investment scale: ${userProfile.investmentSize}

DELIVERABLE:
Create a 200-word hero narrative that:
- Opens with "${userProfile.organizationName}'s commitment to [specific ESG area from website]"
- Includes 3 impact stories relevant to their focus areas
- References their actual geographic presence: ${websiteData.operatingRegions}
- Ends with a call-to-action aligned with their investment thesis
- Uses their brand language tone: ${websiteData.brandTone}

OUTPUT FORMAT: HTML with glass-card styling, dynamic SDG tiles, and personalized CTAs.`,

                fallback: `Generate ESG education overview for ${userProfile.organizationName} focusing on ${userProfile.focusAreas[0]} with ${userProfile.investmentSize} investment scale.`
            },

            // Analytics Section - Grok (Reasoning/Creativity)
            analytics: {
                ai: 'grok',
                prompt: `You are Auxeira's Chief Analytics Officer. Generate predictive ESG analytics for ${userProfile.organizationName}.

ANALYTICAL CONTEXT:
- Organization: [${userProfile.organizationName}] - [${userProfile.organizationType}]
- Decision Maker: [${userProfile.userRole}] with [${userProfile.experienceLevel}] experience
- Investment Thesis: [${websiteData.investmentThesis}]
- Risk Tolerance: [${userProfile.riskTolerance}]
- Performance Benchmarks: [${websiteData.performanceTargets}]
- Current Portfolio: [${websiteData.currentHoldings}]

REASONING REQUIREMENTS:
1. Analyze their current ESG performance vs industry benchmarks
2. Predict impact of increasing ESG allocation by 25%, 50%, 75%
3. Model counterfactual scenarios: "What if ${userProfile.organizationName} had invested in [specific ESG area] 3 years ago?"
4. Calculate ROI projections based on their risk profile: ${userProfile.riskTolerance}
5. Identify optimization opportunities in their current strategy

CAUSAL INFERENCE ANALYSIS:
- Base Case: Current ESG allocation and performance
- Auxeira Uplift: Projected improvement with platform optimization
- Counterfactual: Performance without ESG focus
- Predictive Model: 3-year impact projections

DELIVERABLE:
Generate analytical narrative (180 words) with:
- Personalized counterfactual analysis
- 3 scenario models with probability weightings
- Chart.js configuration for interactive visualizations
- Dynamic sliders for real-time scenario adjustment
- Risk-adjusted return projections

OUTPUT FORMAT: HTML with Chart.js integration, interactive controls, and personalized insights.`,

                fallback: `Generate ESG analytics for ${userProfile.organizationName} with counterfactual analysis and predictive modeling.`
            },

            // Reports Section - Manus + NanoGPT-5 (Data + Code)
            reports: {
                ai: 'manus',
                prompt: `You are Auxeira's Chief Research Officer. Generate a premium ESG education report for ${userProfile.organizationName}.

RESEARCH PARAMETERS:
- Client: [${userProfile.organizationName}] - [${userProfile.organizationType}]
- Report Tier: [${userProfile.subscriptionTier}] ($${userProfile.reportBudget})
- Stakeholders: [${userProfile.reportAudience}]
- Compliance Needs: [${userProfile.complianceFrameworks.join(', ')}]
- Website Intelligence: [${websiteData.competitorAnalysis}]
- Industry Context: [${websiteData.industryTrends}]

COMPREHENSIVE RESEARCH SCOPE:
1. Executive Summary tailored to ${userProfile.userRole} decision-making needs
2. Industry benchmarking against ${websiteData.competitors}
3. Regulatory compliance analysis for ${userProfile.complianceFrameworks}
4. Peer comparison with organizations of similar size: ${userProfile.organizationSize}
5. Implementation roadmap aligned with their strategic timeline: ${websiteData.strategicTimeline}

DATA INTEGRATION REQUIREMENTS:
- Pull latest ESG ratings for their industry sector
- Analyze regulatory changes affecting their compliance frameworks
- Research best practices from their geographic markets: ${websiteData.operatingRegions}
- Benchmark against their stated sustainability targets: ${websiteData.sustainabilityTargets}

DELIVERABLE STRUCTURE:
1. Executive Summary (300 words) - Strategic recommendations for ${userProfile.userRole}
2. Market Analysis (400 words) - Industry trends and competitive positioning
3. Implementation Guide (350 words) - Actionable steps with timeline
4. ROI Projections (250 words) - Financial impact analysis
5. Compliance Roadmap (200 words) - Regulatory requirements and deadlines

OUTPUT FORMAT: Professional report HTML ready for html2pdf.js conversion, with branded styling matching ${websiteData.brandColors}.`,

                enhancementPrompt: `You are Auxeira's Chief Technology Officer. Enhance the above research report with technical implementation details.

TECHNICAL ENHANCEMENT SCOPE:
- Convert narrative to responsive HTML with ${websiteData.brandColors} color scheme
- Add interactive elements: charts, calculators, scenario builders
- Implement download functionality with branded PDF generation
- Create shareable executive summary cards
- Add progress tracking for implementation milestones

OUTPUT FORMAT: Complete HTML/CSS/JS implementation with Auxeira branding.`,

                fallback: `Generate comprehensive ESG education report for ${userProfile.organizationName} with executive summary, market analysis, and implementation guide.`
            }
        };
    }

    /**
     * GOVERNMENT AGENCY DASHBOARD PROMPTS
     */
    getGovernmentAgencyPrompts(userProfile, websiteData) {
        return {
            // Policy Opportunities - Claude (Vision Narratives)
            policyOpportunities: {
                ai: 'claude',
                prompt: `You are Auxeira's Director of Policy Intelligence. Create compelling policy opportunity narratives for ${userProfile.organizationName}.

POLICY CONTEXT:
- Agency: [${userProfile.organizationName}] - [${userProfile.agencyType}]
- Policy Maker: [${userProfile.userRole}] in [${userProfile.department}]
- Jurisdiction: [${userProfile.jurisdiction}]
- Policy Priorities: [${userProfile.policyPriorities.join(', ')}]
- Budget Authority: [${userProfile.budgetAuthority}]
- Website Mission: [${websiteData.agencyMission}]
- Current Initiatives: [${websiteData.currentPolicies}]
- Stakeholder Groups: [${websiteData.stakeholderGroups}]

POLICY OPPORTUNITY ANALYSIS:
1. Identify 2 high-impact policy opportunities aligned with ${userProfile.policyPriorities}
2. Reference successful implementations in similar jurisdictions: ${websiteData.peerJurisdictions}
3. Calculate potential citizen impact and economic benefits
4. Address compliance with existing frameworks: ${userProfile.regulatoryFrameworks}
5. Consider political feasibility and stakeholder support

NARRATIVE REQUIREMENTS:
- Open with "${userProfile.organizationName}'s mandate to [specific mission from website]"
- Include evidence from peer jurisdictions with similar demographics
- Reference their current policy successes: ${websiteData.policyAchievements}
- Quantify potential impact: jobs created, citizens served, economic benefits
- Include implementation timeline aligned with political cycles

DELIVERABLE:
Create 2 policy opportunity jumbotrons (150 words each):
1. High-priority opportunity with 90%+ political feasibility
2. Transformational opportunity with measurable citizen impact

OUTPUT FORMAT: HTML jumbotrons with embedded policy brief videos and stakeholder impact metrics.`,

                fallback: `Generate policy opportunities for ${userProfile.organizationName} focusing on ${userProfile.policyPriorities[0]} with citizen impact analysis.`
            },

            // Analytics Counterfactuals - Grok (Inference)
            analyticsCounterfactuals: {
                ai: 'grok',
                prompt: `You are Auxeira's Chief Policy Analyst. Generate counterfactual analysis for ${userProfile.organizationName}'s policy decisions.

COUNTERFACTUAL FRAMEWORK:
- Agency: [${userProfile.organizationName}] - [${userProfile.agencyType}]
- Analysis Focus: [${userProfile.analyticsPreferences}]
- Baseline Data: [${websiteData.currentPerformanceMetrics}]
- Comparison Jurisdictions: [${websiteData.peerJurisdictions}]
- Policy Intervention Timeline: [${userProfile.policyTimeline}]

CAUSAL INFERENCE REQUIREMENTS:
1. Baseline Scenario: Current policy performance without Auxeira insights
2. Auxeira Uplift: Projected improvement with data-driven policy optimization
3. Counterfactual Analysis: "What if ${userProfile.organizationName} had implemented [specific policy] 2 years ago?"
4. Peer Comparison: Performance vs similar agencies using traditional approaches
5. Predictive Modeling: 5-year impact projections with confidence intervals

ANALYTICAL DEPTH:
- Economic Impact: GDP contribution, job creation, tax revenue
- Social Outcomes: Citizen satisfaction, service delivery improvements
- Environmental Benefits: Emissions reduction, resource efficiency
- Governance Metrics: Transparency scores, corruption reduction
- Innovation Index: Technology adoption, digital transformation

DELIVERABLE:
Generate analytical narrative (150 words) demonstrating:
- Quantified Auxeira uplift: "With Auxeira insights, ${userProfile.organizationName} could achieve X% better outcomes"
- Evidence-based counterfactuals with statistical significance
- Interactive Chart.js visualizations with scenario sliders
- Risk-adjusted policy recommendations
- Implementation probability assessments

OUTPUT FORMAT: HTML with Chart.js bar charts, interactive sliders, and policy scenario builder.`,

                fallback: `Generate counterfactual analysis for ${userProfile.organizationName} showing policy impact improvements with Auxeira insights.`
            }
        };
    }

    /**
     * VENTURE CAPITAL DASHBOARD PROMPTS
     */
    getVCDashboardPrompts(userProfile, websiteData) {
        return {
            // Deal Flow Intelligence - Manus (Data Scraping)
            dealFlow: {
                ai: 'manus',
                prompt: `You are Auxeira's Chief Deal Intelligence Officer. Generate comprehensive deal flow analysis for ${userProfile.organizationName}.

DEAL FLOW CONTEXT:
- Fund: [${userProfile.organizationName}] - [${userProfile.fundType}]
- Investment Partner: [${userProfile.userRole}] with [${userProfile.investmentExperience}]
- Fund Size: [${userProfile.fundSize}]
- Investment Thesis: [${websiteData.investmentThesis}]
- Sector Focus: [${userProfile.sectorFocus.join(', ')}]
- Stage Preference: [${userProfile.stagePreference}]
- Geographic Coverage: [${websiteData.geographicCoverage}]
- Portfolio Companies: [${websiteData.portfolioCompanies}]

COMPREHENSIVE DEAL RESEARCH:
1. Scrape and analyze 50+ startups matching their investment criteria
2. Cross-reference with their existing portfolio for strategic fit
3. Identify market trends in their focus sectors: ${userProfile.sectorFocus}
4. Analyze competitor fund activity in similar deals
5. Research founder backgrounds and team composition
6. Evaluate ESG alignment with their sustainability mandate: ${websiteData.esgCommitment}

DEAL SCORING METHODOLOGY:
- Market Opportunity (25%): TAM, growth rate, competitive landscape
- Team Quality (25%): Founder experience, team completeness, advisory board
- Product-Market Fit (20%): Traction metrics, customer validation, revenue growth
- ESG Alignment (15%): Sustainability impact, governance structure, social benefit
- Strategic Fit (15%): Synergy with portfolio, value-add potential, exit strategy

DELIVERABLE:
Generate deal flow intelligence report with:
- Top 10 qualified deals with 85%+ match scores
- Detailed founder profiles and team analysis
- Market opportunity assessment with competitive mapping
- ESG impact scoring aligned with ${websiteData.esgCommitment}
- Strategic fit analysis with current portfolio
- Recommended due diligence priorities

OUTPUT FORMAT: Interactive deal cards with filtering, sorting, and detailed company profiles.`,

                fallback: `Generate deal flow analysis for ${userProfile.organizationName} with startup matching and ESG scoring.`
            },

            // Portfolio Analytics - Grok (Reasoning)
            portfolioAnalytics: {
                ai: 'grok',
                prompt: `You are Auxeira's Chief Portfolio Strategist. Generate advanced portfolio analytics for ${userProfile.organizationName}.

PORTFOLIO CONTEXT:
- Fund: [${userProfile.organizationName}] - [${userProfile.fundType}]
- Portfolio Size: [${websiteData.portfolioSize}] companies
- Total AUM: [${userProfile.fundSize}]
- Investment Vintage: [${websiteData.fundVintage}]
- Target Returns: [${userProfile.targetReturns}]
- Current Performance: [${websiteData.currentPerformance}]
- Market Conditions: [${websiteData.marketEnvironment}]

ADVANCED ANALYTICS REQUIREMENTS:
1. Portfolio health scoring across all investments
2. Correlation analysis between ESG metrics and financial performance
3. Predictive modeling for exit opportunities and timing
4. Risk concentration analysis by sector, geography, stage
5. Benchmark comparison with peer funds of similar vintage and size
6. Scenario modeling for different market conditions

REASONING FRAMEWORK:
- Performance Attribution: Which factors drive outperformance?
- Risk Assessment: Concentration risks and mitigation strategies
- Optimization Opportunities: Rebalancing recommendations
- Exit Strategy: Optimal timing and method for each investment
- Future Allocation: Sector and stage recommendations for new investments

DELIVERABLE:
Generate portfolio intelligence report (200 words) with:
- Overall portfolio health score with trend analysis
- Top 5 performing investments with success factor analysis
- Risk concentration alerts and mitigation recommendations
- Predictive exit timeline with probability assessments
- Strategic allocation recommendations for future investments
- Benchmark comparison with peer fund performance

OUTPUT FORMAT: Interactive dashboard with portfolio heatmaps, performance charts, and scenario analysis tools.`,

                fallback: `Generate portfolio analytics for ${userProfile.organizationName} with performance attribution and risk analysis.`
            },

            // Investment Reports - Claude + NanoGPT-5 (Narrative + Code)
            investmentReports: {
                ai: 'claude',
                prompt: `You are Auxeira's Chief Investment Storyteller. Create compelling investment reports for ${userProfile.organizationName}.

INVESTMENT NARRATIVE CONTEXT:
- Fund: [${userProfile.organizationName}] - [${userProfile.fundType}]
- Audience: [${userProfile.reportAudience}] (LPs, Board, Internal Team)
- Report Type: [${userProfile.reportType}] (Quarterly, Annual, Special Situation)
- Performance Period: [${userProfile.reportingPeriod}]
- Fund Performance: [${websiteData.fundPerformance}]
- Market Context: [${websiteData.marketConditions}]

STORYTELLING REQUIREMENTS:
1. Executive Summary that captures fund performance narrative
2. Investment highlights with compelling success stories
3. Market analysis with forward-looking insights
4. Portfolio company spotlights with impact metrics
5. ESG integration and sustainability outcomes
6. Risk management and mitigation strategies

NARRATIVE STRUCTURE:
- Opening: Fund performance in context of market conditions
- Success Stories: Top 3 portfolio company achievements with metrics
- Challenges: How the fund navigated market volatility
- ESG Impact: Quantified sustainability and social outcomes
- Future Outlook: Investment thesis validation and pipeline opportunities
- LP Communication: Transparent performance attribution and outlook

DELIVERABLE:
Create investment report narrative (400 words) with:
- Compelling opening that contextualizes performance
- Data-driven success stories with specific metrics
- Honest assessment of challenges and lessons learned
- ESG impact quantification aligned with LP expectations
- Forward-looking investment thesis and pipeline preview
- Professional tone matching ${websiteData.communicationStyle}

OUTPUT FORMAT: Professional report layout with embedded charts, portfolio company highlights, and executive summary.`,

                enhancementPrompt: `You are Auxeira's Chief Technology Officer. Transform the above investment narrative into an interactive digital report.

TECHNICAL IMPLEMENTATION:
- Responsive HTML design with ${websiteData.brandGuidelines}
- Interactive charts showing portfolio performance over time
- Clickable portfolio company cards with detailed profiles
- PDF export functionality for LP distribution
- Mobile-optimized layout for tablet presentation
- Embedded video messages from fund partners

OUTPUT FORMAT: Complete HTML/CSS/JS implementation with interactive elements and professional styling.`,

                fallback: `Generate investment report for ${userProfile.organizationName} with performance narrative and portfolio highlights.`
            }
        };
    }

    // ===========================================
    // WEBSITE DATA INTEGRATION
    // ===========================================

    async scrapeWebsiteData(websiteUrl, organizationType) {
        try {
            const cacheKey = `${websiteUrl}_${organizationType}`;
            
            // Check cache first
            if (this.websiteDataCache.has(cacheKey)) {
                const cached = this.websiteDataCache.get(cacheKey);
                if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24 hour cache
                    return cached.data;
                }
            }

            const response = await axios.get(websiteUrl, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Auxeira-AI-Bot/1.0 (ESG Dashboard Data Collection)'
                }
            });

            const $ = cheerio.load(response.data);
            
            const websiteData = await this.extractWebsiteIntelligence($, organizationType, websiteUrl);
            
            // Cache the results
            this.websiteDataCache.set(cacheKey, {
                data: websiteData,
                timestamp: Date.now()
            });

            return websiteData;

        } catch (error) {
            console.error(`Error scraping website ${websiteUrl}:`, error.message);
            return this.getFallbackWebsiteData(organizationType);
        }
    }

    async extractWebsiteIntelligence($, organizationType, websiteUrl) {
        const baseData = {
            url: websiteUrl,
            scrapedAt: new Date().toISOString(),
            organizationType
        };

        switch (organizationType) {
            case 'asset-manager':
            case 'pension-fund':
            case 'insurance':
                return {
                    ...baseData,
                    missionStatement: this.extractMissionStatement($),
                    investmentThesis: this.extractInvestmentThesis($),
                    esgInitiatives: this.extractESGInitiatives($),
                    performanceTargets: this.extractPerformanceTargets($),
                    currentHoldings: this.extractCurrentHoldings($),
                    operatingRegions: this.extractOperatingRegions($),
                    brandTone: this.extractBrandTone($),
                    brandColors: this.extractBrandColors($),
                    sustainabilityTargets: this.extractSustainabilityTargets($),
                    competitorAnalysis: await this.getCompetitorAnalysis(organizationType),
                    industryTrends: await this.getIndustryTrends(organizationType)
                };

            case 'government':
            case 'public-agency':
                return {
                    ...baseData,
                    agencyMission: this.extractAgencyMission($),
                    currentPolicies: this.extractCurrentPolicies($),
                    policyAchievements: this.extractPolicyAchievements($),
                    stakeholderGroups: this.extractStakeholderGroups($),
                    peerJurisdictions: this.extractPeerJurisdictions($),
                    currentPerformanceMetrics: this.extractPerformanceMetrics($),
                    citizenServices: this.extractCitizenServices($),
                    budgetInformation: this.extractBudgetInformation($)
                };

            case 'venture-capital':
            case 'private-equity':
                return {
                    ...baseData,
                    investmentThesis: this.extractInvestmentThesis($),
                    portfolioCompanies: this.extractPortfolioCompanies($),
                    fundSize: this.extractFundSize($),
                    geographicCoverage: this.extractGeographicCoverage($),
                    esgCommitment: this.extractESGCommitment($),
                    fundPerformance: this.extractFundPerformance($),
                    teamProfiles: this.extractTeamProfiles($),
                    investmentCriteria: this.extractInvestmentCriteria($),
                    portfolioSize: this.extractPortfolioSize($),
                    fundVintage: this.extractFundVintage($),
                    communicationStyle: this.extractCommunicationStyle($),
                    brandGuidelines: this.extractBrandGuidelines($)
                };

            default:
                return {
                    ...baseData,
                    missionStatement: this.extractMissionStatement($),
                    organizationSize: this.extractOrganizationSize($),
                    keyInitiatives: this.extractKeyInitiatives($),
                    brandTone: this.extractBrandTone($),
                    contactInformation: this.extractContactInformation($)
                };
        }
    }

    // ===========================================
    // WEBSITE DATA EXTRACTION METHODS
    // ===========================================

    extractMissionStatement($) {
        const selectors = [
            'meta[name="description"]',
            '.mission, .about-mission, .company-mission',
            'h1 + p, h2 + p',
            '.hero-text, .intro-text',
            'p:contains("mission"), p:contains("purpose"), p:contains("vision")'
        ];

        for (const selector of selectors) {
            const element = $(selector).first();
            if (element.length) {
                const text = element.attr('content') || element.text().trim();
                if (text.length > 50 && text.length < 300) {
                    return text;
                }
            }
        }
        return 'Mission statement not found';
    }

    extractInvestmentThesis($) {
        const keywords = ['investment thesis', 'investment approach', 'investment strategy', 'investment philosophy'];
        let thesis = '';

        keywords.forEach(keyword => {
            const elements = $(`p:contains("${keyword}"), div:contains("${keyword}"), section:contains("${keyword}")`);
            elements.each((i, el) => {
                const text = $(el).text().trim();
                if (text.length > thesis.length && text.length < 500) {
                    thesis = text;
                }
            });
        });

        return thesis || 'Investment thesis not specified';
    }

    extractESGInitiatives($) {
        const esgKeywords = ['ESG', 'sustainability', 'responsible investing', 'impact investing', 'sustainable development'];
        const initiatives = [];

        esgKeywords.forEach(keyword => {
            $(`*:contains("${keyword}")`).each((i, el) => {
                const text = $(el).text().trim();
                if (text.length > 100 && text.length < 300) {
                    initiatives.push(text);
                }
            });
        });

        return initiatives.slice(0, 3); // Top 3 initiatives
    }

    extractPortfolioCompanies($) {
        const companies = [];
        
        // Look for portfolio sections
        $('.portfolio, .investments, .companies').find('a, .company-name, .portfolio-item').each((i, el) => {
            const name = $(el).text().trim();
            const link = $(el).attr('href');
            if (name && name.length < 50) {
                companies.push({ name, link });
            }
        });

        return companies.slice(0, 10); // Top 10 companies
    }

    extractBrandTone($) {
        const content = $('body').text().toLowerCase();
        
        // Analyze language patterns
        const formalWords = ['pursuant', 'hereby', 'aforementioned', 'notwithstanding'];
        const casualWords = ['awesome', 'amazing', 'cool', 'hey', 'folks'];
        const technicalWords = ['algorithm', 'optimization', 'methodology', 'framework'];
        
        let formalCount = 0, casualCount = 0, technicalCount = 0;
        
        formalWords.forEach(word => {
            if (content.includes(word)) formalCount++;
        });
        
        casualWords.forEach(word => {
            if (content.includes(word)) casualCount++;
        });
        
        technicalWords.forEach(word => {
            if (content.includes(word)) technicalCount++;
        });

        if (formalCount > casualCount && formalCount > technicalCount) {
            return 'formal';
        } else if (technicalCount > casualCount) {
            return 'technical';
        } else {
            return 'conversational';
        }
    }

    extractBrandColors($) {
        const colors = [];
        
        // Extract CSS color values
        $('style, link[rel="stylesheet"]').each((i, el) => {
            const css = $(el).html() || '';
            const colorMatches = css.match(/#[0-9a-fA-F]{6}|rgb\([^)]+\)/g);
            if (colorMatches) {
                colors.push(...colorMatches);
            }
        });

        // Extract inline styles
        $('[style*="color"], [style*="background"]').each((i, el) => {
            const style = $(el).attr('style');
            const colorMatches = style.match(/#[0-9a-fA-F]{6}|rgb\([^)]+\)/g);
            if (colorMatches) {
                colors.push(...colorMatches);
            }
        });

        return [...new Set(colors)].slice(0, 5); // Unique colors, top 5
    }

    // ===========================================
    // CRON SCHEDULING FOR DAILY RESETS
    // ===========================================

    setupDailyReset() {
        if (this.dailyResetScheduled) return;

        // Schedule daily reset at 2 AM UTC
        cron.schedule('0 2 * * *', () => {
            this.performDailyReset();
        });

        // Schedule weekly deep refresh on Sundays at 3 AM UTC
        cron.schedule('0 3 * * 0', () => {
            this.performWeeklyDeepRefresh();
        });

        this.dailyResetScheduled = true;
        console.log('📅 Cron jobs scheduled: Daily reset (2 AM UTC), Weekly refresh (Sunday 3 AM UTC)');
    }

    async performDailyReset() {
        console.log('🔄 Starting daily reset...');
        
        try {
            // Clear caches older than 24 hours
            this.clearExpiredCaches();
            
            // Refresh website data for active users
            await this.refreshActiveUserWebsiteData();
            
            // Update AI prompt templates with latest market data
            await this.updatePromptTemplates();
            
            // Generate fresh content for high-engagement dashboards
            await this.preGeneratePopularContent();
            
            console.log('✅ Daily reset completed successfully');
            
        } catch (error) {
            console.error('❌ Daily reset failed:', error);
        }
    }

    async performWeeklyDeepRefresh() {
        console.log('🔄 Starting weekly deep refresh...');
        
        try {
            // Full cache clear
            this.websiteDataCache.clear();
            this.userProfileCache.clear();
            
            // Update competitor analysis
            await this.updateCompetitorAnalysis();
            
            // Refresh industry trends
            await this.updateIndustryTrends();
            
            // Optimize AI prompt performance based on user feedback
            await this.optimizePromptPerformance();
            
            console.log('✅ Weekly deep refresh completed successfully');
            
        } catch (error) {
            console.error('❌ Weekly deep refresh failed:', error);
        }
    }

    clearExpiredCaches() {
        const now = Date.now();
        const expiredThreshold = 24 * 60 * 60 * 1000; // 24 hours
        
        for (const [key, value] of this.websiteDataCache.entries()) {
            if (now - value.timestamp > expiredThreshold) {
                this.websiteDataCache.delete(key);
            }
        }
        
        for (const [key, value] of this.userProfileCache.entries()) {
            if (now - value.timestamp > expiredThreshold) {
                this.userProfileCache.delete(key);
            }
        }
        
        console.log('🧹 Expired caches cleared');
    }

    async refreshActiveUserWebsiteData() {
        // Get list of active users from the last 7 days
        const activeUsers = await this.getActiveUsers();
        
        for (const user of activeUsers) {
            if (user.organizationWebsite) {
                try {
                    await this.scrapeWebsiteData(user.organizationWebsite, user.organizationType);
                    console.log(`📊 Refreshed website data for ${user.organizationName}`);
                } catch (error) {
                    console.error(`Failed to refresh ${user.organizationName}:`, error.message);
                }
            }
        }
    }

    // ===========================================
    // ENHANCED PROMPT GENERATION
    // ===========================================

    async generateEnhancedPrompt(dashboardType, section, userProfile) {
        try {
            // Get fresh website data
            const websiteData = userProfile.organizationWebsite 
                ? await this.scrapeWebsiteData(userProfile.organizationWebsite, userProfile.organizationType)
                : this.getFallbackWebsiteData(userProfile.organizationType);

            // Get appropriate prompts for dashboard type
            let prompts;
            switch (dashboardType) {
                case 'esg-education':
                    prompts = this.getESGEducationPrompts(userProfile, websiteData);
                    break;
                case 'government-agency':
                    prompts = this.getGovernmentAgencyPrompts(userProfile, websiteData);
                    break;
                case 'venture-capital':
                    prompts = this.getVCDashboardPrompts(userProfile, websiteData);
                    break;
                default:
                    prompts = this.getESGEducationPrompts(userProfile, websiteData);
            }

            const sectionPrompt = prompts[section];
            if (!sectionPrompt) {
                throw new Error(`Section ${section} not found for dashboard ${dashboardType}`);
            }

            return {
                ai: sectionPrompt.ai,
                prompt: sectionPrompt.prompt,
                enhancementPrompt: sectionPrompt.enhancementPrompt,
                fallback: sectionPrompt.fallback,
                websiteData,
                userProfile,
                generated: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error generating enhanced prompt:', error);
            return this.getFallbackPrompt(dashboardType, section, userProfile);
        }
    }

    getFallbackWebsiteData(organizationType) {
        return {
            missionStatement: 'Organization mission not available',
            organizationType,
            brandTone: 'professional',
            brandColors: ['#1f2937', '#3b82f6', '#10b981'],
            scrapedAt: new Date().toISOString(),
            fallback: true
        };
    }

    getFallbackPrompt(dashboardType, section, userProfile) {
        return {
            ai: 'claude',
            prompt: `Generate ${section} content for ${userProfile.organizationName} ${dashboardType} dashboard with focus on ${userProfile.focusAreas?.[0] || 'ESG investing'}.`,
            fallback: true,
            generated: new Date().toISOString()
        };
    }

    // ===========================================
    // UTILITY METHODS
    // ===========================================

    async getActiveUsers() {
        // This would typically query your user database
        // For now, return mock data
        return [
            {
                organizationName: 'BlackRock',
                organizationType: 'asset-manager',
                organizationWebsite: 'https://www.blackrock.com',
                lastActive: new Date()
            }
        ];
    }

    async updateCompetitorAnalysis() {
        console.log('🔍 Updating competitor analysis...');
        // Implementation would scrape competitor websites and update analysis
    }

    async updateIndustryTrends() {
        console.log('📈 Updating industry trends...');
        // Implementation would gather latest industry reports and trends
    }

    async optimizePromptPerformance() {
        console.log('🎯 Optimizing prompt performance...');
        // Implementation would analyze user feedback and optimize prompts
    }
}

// Export the enhanced system
module.exports = EnhancedAIPromptsSystem;

// Global instance for use in other modules
global.auxeiraEnhancedAI = new EnhancedAIPromptsSystem();
