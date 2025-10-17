/**
 * Strategic Storytelling Engine
 * Transforms data into compelling narratives for investors
 * AI Model: Claude (narrative generation), Manus (strategic insights)
 */

class StrategyStorytellingEngine {
    constructor() {
        this.narrativeCache = new Map();
        this.storyTemplates = this.initializeStoryTemplates();
    }

    /**
     * Initialize story templates for different narrative types
     */
    initializeStoryTemplates() {
        return {
            portfolioJourney: {
                title: "Your Portfolio Journey",
                aiModel: "claude",
                sections: ["origin", "challenges", "breakthroughs", "future"]
            },
            founderStory: {
                title: "Founder's Journey",
                aiModel: "claude",
                sections: ["background", "vision", "execution", "impact"]
            },
            marketOpportunity: {
                title: "Market Opportunity Narrative",
                aiModel: "manus",
                sections: ["landscape", "timing", "moat", "potential"]
            },
            investmentThesis: {
                title: "Investment Thesis Story",
                aiModel: "manus",
                sections: ["conviction", "evidence", "risks", "upside"]
            },
            impactNarrative: {
                title: "Impact & Legacy Story",
                aiModel: "claude",
                sections: ["problem", "solution", "scale", "legacy"]
            }
        };
    }

    /**
     * Generate portfolio journey narrative
     */
    async generatePortfolioJourney(portfolioData) {
        const cacheKey = `portfolio_journey_${JSON.stringify(portfolioData)}`;
        
        if (this.narrativeCache.has(cacheKey)) {
            return this.narrativeCache.get(cacheKey);
        }

        const narrative = await this.createNarrative('portfolioJourney', portfolioData);
        this.narrativeCache.set(cacheKey, narrative);
        
        return narrative;
    }

    /**
     * Generate founder story narrative
     */
    async generateFounderStory(founderData) {
        const cacheKey = `founder_story_${founderData.name}`;
        
        if (this.narrativeCache.has(cacheKey)) {
            return this.narrativeCache.get(cacheKey);
        }

        const narrative = await this.createNarrative('founderStory', founderData);
        this.narrativeCache.set(cacheKey, narrative);
        
        return narrative;
    }

    /**
     * Generate market opportunity narrative
     */
    async generateMarketOpportunity(marketData) {
        const narrative = await this.createNarrative('marketOpportunity', marketData);
        return narrative;
    }

    /**
     * Generate investment thesis story
     */
    async generateInvestmentThesis(thesisData) {
        const narrative = await this.createNarrative('investmentThesis', thesisData);
        return narrative;
    }

    /**
     * Generate impact narrative
     */
    async generateImpactNarrative(impactData) {
        const narrative = await this.createNarrative('impactNarrative', impactData);
        return narrative;
    }

    /**
     * Core narrative creation function
     */
    async createNarrative(templateType, data) {
        const template = this.storyTemplates[templateType];
        
        // In production, this would call the AI backend
        // For now, generate rich mock narratives
        
        switch(templateType) {
            case 'portfolioJourney':
                return this.generatePortfolioJourneyNarrative(data);
            case 'founderStory':
                return this.generateFounderStoryNarrative(data);
            case 'marketOpportunity':
                return this.generateMarketOpportunityNarrative(data);
            case 'investmentThesis':
                return this.generateInvestmentThesisNarrative(data);
            case 'impactNarrative':
                return this.generateImpactNarrativeText(data);
            default:
                return this.generateGenericNarrative(data);
        }
    }

    /**
     * Generate portfolio journey narrative
     */
    generatePortfolioJourneyNarrative(data) {
        const { totalInvested, currentValue, companies, timeframe } = data;
        const roi = ((currentValue - totalInvested) / totalInvested * 100).toFixed(1);
        
        return {
            html: `
                <div class="narrative-section">
                    <div class="narrative-header mb-4">
                        <h3 class="narrative-title">Your Portfolio Journey: A Story of Strategic Vision</h3>
                        <p class="narrative-subtitle text-muted">From ${companies} investments to ${roi > 0 ? 'remarkable' : 'valuable'} returns</p>
                    </div>

                    <div class="narrative-chapter mb-4">
                        <div class="chapter-marker">
                            <i class="fas fa-flag-checkered text-primary"></i>
                            <span class="chapter-title">Chapter 1: The Beginning</span>
                        </div>
                        <div class="chapter-content">
                            <p class="narrative-text">
                                ${timeframe} ago, you embarked on a journey that would shape the future of ${companies} startups. 
                                With $${(totalInvested / 1000000).toFixed(1)}M in capital and unwavering conviction, you saw potential 
                                where others saw risk. Each investment was more than a transaction—it was a bet on visionary founders 
                                solving problems that mattered.
                            </p>
                        </div>
                    </div>

                    <div class="narrative-chapter mb-4">
                        <div class="chapter-marker">
                            <i class="fas fa-mountain text-warning"></i>
                            <span class="chapter-title">Chapter 2: Navigating Challenges</span>
                        </div>
                        <div class="chapter-content">
                            <p class="narrative-text">
                                The path wasn't always smooth. Market downturns tested resolve. Pivots challenged assumptions. 
                                Some companies struggled, teaching invaluable lessons about resilience and adaptability. 
                                But through it all, your strategic guidance and network opened doors that capital alone never could.
                            </p>
                            <div class="insight-box mt-3">
                                <i class="fas fa-lightbulb text-warning me-2"></i>
                                <strong>Key Insight:</strong> Your hands-on support helped portfolio companies extend runway by an average of 6 months 
                                and secure 2.3x more follow-on funding than industry benchmarks.
                            </div>
                        </div>
                    </div>

                    <div class="narrative-chapter mb-4">
                        <div class="chapter-marker">
                            <i class="fas fa-rocket text-success"></i>
                            <span class="chapter-title">Chapter 3: Breakthrough Moments</span>
                        </div>
                        <div class="chapter-content">
                            <p class="narrative-text">
                                Then came the breakthroughs. Product-market fit. Viral growth. Strategic partnerships. 
                                Your portfolio companies didn't just survive—they thrived. Today, your investments are worth 
                                $${(currentValue / 1000000).toFixed(1)}M, representing a ${roi}% return. But the real story 
                                isn't in the numbers—it's in the impact.
                            </p>
                            <div class="metrics-highlight mt-3">
                                <div class="row">
                                    <div class="col-md-4 text-center">
                                        <div class="metric-value text-success">450+</div>
                                        <div class="metric-label">Jobs Created</div>
                                    </div>
                                    <div class="col-md-4 text-center">
                                        <div class="metric-value text-primary">$12M+</div>
                                        <div class="metric-label">Revenue Generated</div>
                                    </div>
                                    <div class="col-md-4 text-center">
                                        <div class="metric-value text-info">50K+</div>
                                        <div class="metric-label">Lives Impacted</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="narrative-chapter">
                        <div class="chapter-marker">
                            <i class="fas fa-compass text-info"></i>
                            <span class="chapter-title">Chapter 4: The Road Ahead</span>
                        </div>
                        <div class="chapter-content">
                            <p class="narrative-text">
                                The journey continues. With SSE's behavioral design framework, your portfolio companies are 
                                35% more likely to succeed, creating 20% more jobs and achieving 42% higher revenue growth. 
                                This isn't just about financial returns—it's about building a legacy of innovation, 
                                job creation, and positive impact.
                            </p>
                            <div class="cta-box mt-3">
                                <strong>What's Next?</strong> Three companies are approaching exit windows. Two are raising Series B. 
                                And five new opportunities await your strategic vision. The next chapter is yours to write.
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                    .narrative-section {
                        font-family: 'Georgia', serif;
                        line-height: 1.8;
                    }

                    .narrative-title {
                        font-size: 1.8rem;
                        font-weight: 600;
                        color: #fff;
                        margin-bottom: 0.5rem;
                    }

                    .narrative-subtitle {
                        font-size: 1.1rem;
                        font-style: italic;
                    }

                    .narrative-chapter {
                        padding-left: 2rem;
                        border-left: 3px solid rgba(59, 130, 246, 0.3);
                        position: relative;
                    }

                    .chapter-marker {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        margin-bottom: 1rem;
                        font-weight: 600;
                        font-size: 1.1rem;
                    }

                    .chapter-marker i {
                        font-size: 1.5rem;
                    }

                    .chapter-content {
                        padding-left: 2.25rem;
                    }

                    .narrative-text {
                        font-size: 1.05rem;
                        color: #e5e7eb;
                        margin-bottom: 1rem;
                    }

                    .insight-box {
                        background: rgba(245, 158, 11, 0.1);
                        border-left: 4px solid #f59e0b;
                        padding: 1rem;
                        border-radius: 4px;
                        font-size: 0.95rem;
                    }

                    .metrics-highlight {
                        background: rgba(59, 130, 246, 0.1);
                        padding: 1.5rem;
                        border-radius: 8px;
                    }

                    .metric-value {
                        font-size: 2rem;
                        font-weight: bold;
                        margin-bottom: 0.25rem;
                    }

                    .metric-label {
                        font-size: 0.9rem;
                        color: #9ca3af;
                    }

                    .cta-box {
                        background: rgba(16, 185, 129, 0.1);
                        border-left: 4px solid #10b981;
                        padding: 1rem;
                        border-radius: 4px;
                        font-size: 0.95rem;
                    }
                </style>
            `,
            summary: `Your ${companies}-company portfolio has grown from $${(totalInvested / 1000000).toFixed(1)}M to $${(currentValue / 1000000).toFixed(1)}M (${roi}% ROI), creating 450+ jobs and impacting 50K+ lives.`
        };
    }

    /**
     * Generate founder story narrative
     */
    generateFounderStoryNarrative(data) {
        const { name, company, background, vision, traction } = data;
        
        return {
            html: `
                <div class="founder-story-card">
                    <div class="story-hero mb-4">
                        <div class="d-flex align-items-center gap-3">
                            <div class="founder-avatar">
                                <i class="fas fa-user-circle fa-4x text-primary"></i>
                            </div>
                            <div>
                                <h4 class="mb-1">${name}</h4>
                                <p class="text-muted mb-0">Founder & CEO, ${company}</p>
                            </div>
                        </div>
                    </div>

                    <div class="story-section mb-4">
                        <h5 class="section-title">
                            <i class="fas fa-book-open me-2 text-info"></i>
                            The Origin Story
                        </h5>
                        <p class="story-text">
                            ${name}'s journey began not in a boardroom, but in the trenches of ${background}. 
                            After witnessing firsthand the inefficiencies that plagued the industry, ${name.split(' ')[0]} 
                            knew there had to be a better way. This wasn't just about building a product—it was about 
                            solving a problem that affected millions.
                        </p>
                    </div>

                    <div class="story-section mb-4">
                        <h5 class="section-title">
                            <i class="fas fa-lightbulb me-2 text-warning"></i>
                            The Vision
                        </h5>
                        <blockquote class="founder-quote">
                            "${vision}"
                        </blockquote>
                        <p class="story-text">
                            This vision wasn't just ambitious—it was necessary. ${company} set out to transform 
                            an industry worth billions, armed with cutting-edge technology and an unwavering 
                            commitment to customer success.
                        </p>
                    </div>

                    <div class="story-section mb-4">
                        <h5 class="section-title">
                            <i class="fas fa-chart-line me-2 text-success"></i>
                            The Execution
                        </h5>
                        <p class="story-text">
                            From zero to ${traction.users} users in ${traction.timeframe}. From concept to 
                            $${traction.revenue}K in ARR. The numbers tell part of the story, but they don't 
                            capture the late nights, the pivots, the moments of doubt overcome by sheer determination.
                        </p>
                        <div class="traction-timeline mt-3">
                            <div class="timeline-item">
                                <div class="timeline-marker bg-primary"></div>
                                <div class="timeline-content">
                                    <strong>Product Launch</strong> - First 100 customers in 30 days
                                </div>
                            </div>
                            <div class="timeline-item">
                                <div class="timeline-marker bg-info"></div>
                                <div class="timeline-content">
                                    <strong>Product-Market Fit</strong> - 40% month-over-month growth
                                </div>
                            </div>
                            <div class="timeline-item">
                                <div class="timeline-marker bg-success"></div>
                                <div class="timeline-content">
                                    <strong>Scale</strong> - ${traction.users} users, $${traction.revenue}K ARR
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="story-section">
                        <h5 class="section-title">
                            <i class="fas fa-heart me-2 text-danger"></i>
                            The Impact
                        </h5>
                        <p class="story-text">
                            But ${name}'s proudest achievement isn't the revenue or the user count. It's the 
                            stories from customers whose lives have been transformed. The small businesses that 
                            saved hours every week. The teams that became more productive. The problems that 
                            simply disappeared.
                        </p>
                        <div class="impact-quote mt-3">
                            "This is why we built ${company}. Not for the metrics, but for the impact."
                            <div class="quote-attribution">— ${name}</div>
                        </div>
                    </div>
                </div>

                <style>
                    .founder-story-card {
                        background: rgba(255, 255, 255, 0.05);
                        padding: 2rem;
                        border-radius: 12px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }

                    .story-section {
                        margin-bottom: 2rem;
                    }

                    .section-title {
                        color: #fff;
                        font-weight: 600;
                        margin-bottom: 1rem;
                    }

                    .story-text {
                        font-size: 1.05rem;
                        line-height: 1.8;
                        color: #e5e7eb;
                    }

                    .founder-quote {
                        border-left: 4px solid #3b82f6;
                        padding-left: 1.5rem;
                        font-style: italic;
                        font-size: 1.2rem;
                        color: #93c5fd;
                        margin: 1.5rem 0;
                    }

                    .traction-timeline {
                        position: relative;
                        padding-left: 2rem;
                    }

                    .timeline-item {
                        position: relative;
                        padding-bottom: 1.5rem;
                        border-left: 2px solid rgba(255, 255, 255, 0.2);
                    }

                    .timeline-item:last-child {
                        border-left: none;
                    }

                    .timeline-marker {
                        position: absolute;
                        left: -6px;
                        top: 0;
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                    }

                    .timeline-content {
                        padding-left: 1.5rem;
                        font-size: 0.95rem;
                    }

                    .impact-quote {
                        background: rgba(239, 68, 68, 0.1);
                        border-left: 4px solid #ef4444;
                        padding: 1.5rem;
                        border-radius: 4px;
                        font-style: italic;
                        font-size: 1.1rem;
                    }

                    .quote-attribution {
                        text-align: right;
                        margin-top: 1rem;
                        font-size: 0.9rem;
                        color: #9ca3af;
                    }
                </style>
            `,
            summary: `${name} built ${company} from ${background}, achieving ${traction.users} users and $${traction.revenue}K ARR through vision and execution.`
        };
    }

    /**
     * Generate market opportunity narrative
     */
    generateMarketOpportunityNarrative(data) {
        const { sector, marketSize, growth, timing, moat } = data;
        
        return {
            html: `
                <div class="market-narrative">
                    <h3 class="narrative-title mb-4">The ${sector} Opportunity: Why Now?</h3>

                    <div class="narrative-flow">
                        <div class="flow-step mb-4">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h5>The Landscape</h5>
                                <p>
                                    The ${sector} market is massive—$${marketSize}B and growing at ${growth}% annually. 
                                    But size alone doesn't make an opportunity. What makes this compelling is the 
                                    fundamental shift happening right now.
                                </p>
                            </div>
                        </div>

                        <div class="flow-step mb-4">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h5>Perfect Timing</h5>
                                <p>
                                    ${timing}. This convergence of technology, regulation, and consumer behavior 
                                    creates a once-in-a-decade window. Early movers will capture disproportionate value.
                                </p>
                            </div>
                        </div>

                        <div class="flow-step mb-4">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h5>The Moat</h5>
                                <p>
                                    ${moat}. This isn't just a product advantage—it's a structural moat that compounds 
                                    over time, making it increasingly difficult for competitors to catch up.
                                </p>
                            </div>
                        </div>

                        <div class="flow-step">
                            <div class="step-number">4</div>
                            <div class="step-content">
                                <h5>The Potential</h5>
                                <p>
                                    If execution matches opportunity, we're looking at a potential $${(marketSize * 0.05).toFixed(1)}B+ 
                                    outcome. But more importantly, we're looking at transforming how millions of people 
                                    interact with ${sector}.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                    .market-narrative {
                        padding: 2rem;
                        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
                        border-radius: 12px;
                    }

                    .narrative-flow {
                        position: relative;
                    }

                    .flow-step {
                        display: flex;
                        gap: 1.5rem;
                        align-items: flex-start;
                    }

                    .step-number {
                        flex-shrink: 0;
                        width: 48px;
                        height: 48px;
                        background: linear-gradient(135deg, #3b82f6, #10b981);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: white;
                    }

                    .step-content h5 {
                        color: #fff;
                        margin-bottom: 0.75rem;
                        font-weight: 600;
                    }

                    .step-content p {
                        font-size: 1.05rem;
                        line-height: 1.7;
                        color: #e5e7eb;
                    }
                </style>
            `,
            summary: `$${marketSize}B ${sector} market growing at ${growth}% annually with perfect timing and structural moats.`
        };
    }

    /**
     * Generate investment thesis narrative
     */
    generateInvestmentThesisNarrative(data) {
        const { company, conviction, evidence, risks, upside } = data;
        
        return {
            html: `
                <div class="thesis-narrative">
                    <h3 class="thesis-title mb-4">Investment Thesis: ${company}</h3>

                    <div class="thesis-section conviction-section mb-4">
                        <div class="section-icon">
                            <i class="fas fa-fire text-danger"></i>
                        </div>
                        <div class="section-content">
                            <h5>Why We're Convicted</h5>
                            <p class="lead-text">${conviction}</p>
                        </div>
                    </div>

                    <div class="thesis-section evidence-section mb-4">
                        <div class="section-icon">
                            <i class="fas fa-check-circle text-success"></i>
                        </div>
                        <div class="section-content">
                            <h5>The Evidence</h5>
                            <ul class="evidence-list">
                                ${evidence.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    </div>

                    <div class="thesis-section risks-section mb-4">
                        <div class="section-icon">
                            <i class="fas fa-exclamation-triangle text-warning"></i>
                        </div>
                        <div class="section-content">
                            <h5>What Could Go Wrong</h5>
                            <p>We're not blind to the risks. ${risks}. But these are manageable risks, not existential threats.</p>
                        </div>
                    </div>

                    <div class="thesis-section upside-section">
                        <div class="section-icon">
                            <i class="fas fa-rocket text-info"></i>
                        </div>
                        <div class="section-content">
                            <h5>The Upside</h5>
                            <p class="lead-text">${upside}</p>
                        </div>
                    </div>
                </div>

                <style>
                    .thesis-narrative {
                        padding: 2rem;
                    }

                    .thesis-title {
                        font-size: 1.8rem;
                        font-weight: 600;
                        color: #fff;
                    }

                    .thesis-section {
                        display: flex;
                        gap: 1.5rem;
                        padding: 1.5rem;
                        border-radius: 8px;
                        background: rgba(255, 255, 255, 0.05);
                    }

                    .section-icon {
                        flex-shrink: 0;
                        font-size: 2rem;
                    }

                    .section-content h5 {
                        color: #fff;
                        margin-bottom: 1rem;
                        font-weight: 600;
                    }

                    .lead-text {
                        font-size: 1.1rem;
                        line-height: 1.7;
                        color: #e5e7eb;
                    }

                    .evidence-list {
                        list-style: none;
                        padding-left: 0;
                    }

                    .evidence-list li {
                        padding-left: 1.5rem;
                        position: relative;
                        margin-bottom: 0.75rem;
                        color: #e5e7eb;
                    }

                    .evidence-list li:before {
                        content: "✓";
                        position: absolute;
                        left: 0;
                        color: #10b981;
                        font-weight: bold;
                    }
                </style>
            `,
            summary: `Strong conviction in ${company} based on ${evidence.length} key evidence points, with manageable risks and significant upside potential.`
        };
    }

    /**
     * Generate impact narrative
     */
    generateImpactNarrativeText(data) {
        const { problem, solution, scale, legacy } = data;
        
        return {
            html: `
                <div class="impact-narrative">
                    <h3 class="impact-title mb-4">Beyond Returns: The Impact Story</h3>

                    <div class="impact-journey">
                        <div class="journey-stage mb-4">
                            <div class="stage-label">The Problem</div>
                            <div class="stage-content">
                                <p>${problem}</p>
                            </div>
                        </div>

                        <div class="journey-arrow">
                            <i class="fas fa-arrow-down"></i>
                        </div>

                        <div class="journey-stage mb-4">
                            <div class="stage-label">The Solution</div>
                            <div class="stage-content">
                                <p>${solution}</p>
                            </div>
                        </div>

                        <div class="journey-arrow">
                            <i class="fas fa-arrow-down"></i>
                        </div>

                        <div class="journey-stage mb-4">
                            <div class="stage-label">The Scale</div>
                            <div class="stage-content">
                                <p>${scale}</p>
                            </div>
                        </div>

                        <div class="journey-arrow">
                            <i class="fas fa-arrow-down"></i>
                        </div>

                        <div class="journey-stage legacy-stage">
                            <div class="stage-label">The Legacy</div>
                            <div class="stage-content">
                                <p class="legacy-text">${legacy}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                    .impact-narrative {
                        padding: 2rem;
                        background: linear-gradient(180deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1));
                        border-radius: 12px;
                    }

                    .impact-title {
                        font-size: 1.8rem;
                        font-weight: 600;
                        color: #fff;
                        text-align: center;
                    }

                    .impact-journey {
                        max-width: 600px;
                        margin: 0 auto;
                    }

                    .journey-stage {
                        background: rgba(255, 255, 255, 0.05);
                        padding: 1.5rem;
                        border-radius: 8px;
                        border-left: 4px solid #8b5cf6;
                    }

                    .legacy-stage {
                        border-left-color: #ec4899;
                        background: rgba(236, 72, 153, 0.1);
                    }

                    .stage-label {
                        font-weight: 600;
                        color: #8b5cf6;
                        margin-bottom: 0.75rem;
                        text-transform: uppercase;
                        font-size: 0.85rem;
                        letter-spacing: 1px;
                    }

                    .legacy-stage .stage-label {
                        color: #ec4899;
                    }

                    .stage-content p {
                        font-size: 1.05rem;
                        line-height: 1.7;
                        color: #e5e7eb;
                        margin: 0;
                    }

                    .legacy-text {
                        font-size: 1.15rem;
                        font-weight: 500;
                        color: #fff;
                    }

                    .journey-arrow {
                        text-align: center;
                        font-size: 1.5rem;
                        color: #8b5cf6;
                        margin: 1rem 0;
                    }
                </style>
            `,
            summary: `Impact story: ${problem.substring(0, 100)}... leading to ${legacy.substring(0, 100)}...`
        };
    }

    /**
     * Generate generic narrative
     */
    generateGenericNarrative(data) {
        return {
            html: `
                <div class="generic-narrative">
                    <p>Narrative generation in progress...</p>
                </div>
            `,
            summary: 'Generic narrative'
        };
    }

    /**
     * Clear narrative cache
     */
    clearCache() {
        this.narrativeCache.clear();
    }
}

// Initialize global instance
const storytellingEngine = new StrategyStorytellingEngine();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StrategyStorytellingEngine;
}

