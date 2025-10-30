# External Context Integration Plan

## Overview
Enhance the AI nudges system with external context from web, social media (X/Twitter), and website analytics to provide hyper-personalized, data-driven recommendations.

## Key Requirements

### 1. External Context Sources
- **Website**: Recent updates, traffic signals, blog themes, user engagement
- **X/Twitter**: Recent posts, engagement metrics, community feedback
- **Web Mentions**: Press coverage, industry mentions, social proof

### 2. Integration Points
- Funding Nudge: Social proof from X/web for pitch improvements
- Growth Nudge: Website analytics/social virality for scaling ideas
- Validation Nudge: Social/web feedback for assumption tests

### 3. Privacy & Cost
- **Opt-in only**: Users provide URLs during onboarding
- **Cache in database**: Refresh daily via cron
- **Cost**: ~$0.05/user (tools + Claude)
- **Privacy**: Anonymous aggregate for benchmarks

## Implementation Phases

### Phase 1: Update Prompts with External Context Placeholder
Add `[EXTERNAL_CONTEXT]` placeholder to all three nudge prompts:
- Funding Nudge
- Growth/Strategy Nudge
- Validation Nudge

### Phase 2: Create External Context Fetcher Module
Build a reusable module that:
- Fetches website data (browse_page or web scraping)
- Fetches X/Twitter data (API or semantic search)
- Fetches web mentions (web_search)
- Formats data for prompt injection

### Phase 3: Update Lambda Functions
Modify existing Lambda functions to:
- Accept external context in request
- Pass context to prompt generation
- Handle missing/optional context gracefully

### Phase 4: Database Schema for Context Caching
Add tables for:
- User external URLs (website, X handle, etc.)
- Cached external context (with timestamps)
- Refresh schedule

### Phase 5: Cron Job for Daily Refresh
Create scheduled job to:
- Fetch fresh external context for all users
- Update cache in database
- Log errors and retry failures

## Updated Prompt Templates

### 1. Funding Nudge (with External Context)

```
You are AuxCoach Funding Guide: A razor-sharp advisor fusing Elon Musk's first-principles bold asks, Sheryl Sandberg's resilient network-building, and Naval Ravikant's leverage-without-burnout wisdom.

**CRITICAL: DO NOT use section headers or name-drop thinkers in your response. Embody their principles naturally.**

Style: Concise, empowering, no hype—focus on verifiable traction to unlock capital. Always reference external signals (website/social/web) for tailored proof.

**Input Context:**
- Founder Profile: {stage}, {industry}, {geography}, {metrics}
- Challenge: {userQuestion}
- External Context: {externalContext}
  Example: "Website: Recent blog on funding journey (500 views, 20 shares); X: Post on traction got 45 engagements; Web: Mentioned in TechCabal article on African AI startups."

**Output Format (150-200 words, NO section headers):**

Start with a quick founder story (40 words) that mirrors their situation using external signals.

Provide one strategic insight that ties to their external context (e.g., "Your X traction screams social proof—use it").

Give 1-2 specific actions with behavioral nudges (e.g., "Audit deck: Swap fluff for data from your TechCabal mention. Email 1 warm lead today").

Add economic tie-in showing compound effects (e.g., "Weekly traction logs build investor trust—small deposits, big returns").

End with one provocative question (e.g., "What's one metric you'd bet your raise on?").

Close with: "Fund it. Next step yours."
```

### 2. Growth/Strategy Nudge (with External Context)

```
You are AuxCoach Growth Strategist: Blend Steve Jobs' user-obsessed simplicity, Paul Ingram's alliance tactics, and Elon Musk's audacious scaling.

**CRITICAL: DO NOT use section headers or name-drop thinkers in your response. Embody their principles naturally.**

Style: Strategic, no fluff—turn habits into momentum via compounding. Integrate external context for real-world hooks.

**Input Context:**
- Founder Profile: {stage}, {industry}, {geography}, {metrics}
- Challenge: {userQuestion}
- External Context: {externalContext}
  Example: "Website: User onboarding page (high bounce, 40% drop-off); X: Thread on farm pilots (80 likes, 15 replies); Web: Featured in AgriTech Africa newsletter."

**Output Format (150-200 words, NO section headers):**

Start with a raw founder example (40 words) that echoes their external signals.

Provide strategic insight tied to their context (e.g., "Fix that site bounce first—delight one user perfectly, then scale").

Give 1-2 specific actions with habit loops (e.g., "Map 3 alliances: DM a peer today. Track NPS post-interview").

Add economic tie-in about leverage (e.g., "One strategic bet compounds 10x—avoid scatter, like your site's referral goldmine").

End with one provocative question (e.g., "What's your next 10x move?").

Close with: "Scale smart. Execute now."
```

### 3. Validation Nudge (with External Context)

```
You are AuxCoach Validation Scout: Channel Naval Ravikant's calm experimentation, Sheryl Sandberg's empathetic probing, and Steve Jobs' assumption-killing focus.

**CRITICAL: DO NOT use section headers or name-drop thinkers in your response. Embody their principles naturally.**

Style: Curious, low-risk—gamify tests to kill bad ideas fast. Weave in external context for grounded tests.

**Input Context:**
- Founder Profile: {stage}, {industry}, {geography}, {metrics}
- Challenge: {userQuestion}
- External Context: {externalContext}
  Example: "Website: Beta sign-up form (30% conversion); X: Feedback thread (10 comments on pricing pain); Web: Reddit r/fintech mention (upvoted for UX)."

**Output Format (150-200 words, NO section headers):**

Start with a founder tale (40 words) inspired by their external feedback.

Provide insight tied to their context (e.g., "Your X comments flag pricing friction—test cheap, learn deep").

Give 1-2 specific micro-tests (e.g., "Poll 5 drop-offs tomorrow. Score: >70% pivot?").

Add economic tie-in about validation (e.g., "Validate early—sunk costs compound regrets, turning web feedback into fuel").

End with one provocative question (e.g., "Which assumption scares you most to test?").

Close with: "Validate or pivot. Your call."
```

## External Context Fetcher Module

### API Structure

```javascript
/**
 * External Context Fetcher
 * Fetches and formats external context from multiple sources
 */

class ExternalContextFetcher {
    constructor() {
        this.cache = new Map();
        this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    }

    /**
     * Fetch all external context for a user
     */
    async fetchContext(userId, config) {
        const cacheKey = `${userId}_${Date.now()}`;
        
        // Check cache
        if (this.cache.has(userId)) {
            const cached = this.cache.get(userId);
            if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
                return cached.data;
            }
        }

        const context = {
            website: null,
            social: null,
            webMentions: null
        };

        try {
            // Fetch website data
            if (config.websiteUrl) {
                context.website = await this.fetchWebsiteData(config.websiteUrl);
            }

            // Fetch X/Twitter data
            if (config.xHandle) {
                context.social = await this.fetchSocialData(config.xHandle, config.startupName);
            }

            // Fetch web mentions
            if (config.startupName) {
                context.webMentions = await this.fetchWebMentions(config.startupName);
            }

            // Cache the result
            this.cache.set(userId, {
                data: context,
                timestamp: Date.now()
            });

            return context;
        } catch (error) {
            console.error('Error fetching external context:', error);
            return context; // Return partial data
        }
    }

    /**
     * Fetch website data
     */
    async fetchWebsiteData(url) {
        // MVP: Use simple HTTP request to fetch page
        // Future: Use browse_page tool or web scraping service
        try {
            const response = await fetch(url);
            const html = await response.text();
            
            // Extract key metrics (simplified)
            return {
                recentUpdates: this.extractRecentUpdates(html),
                trafficSignals: this.extractTrafficSignals(html),
                keyThemes: this.extractKeyThemes(html)
            };
        } catch (error) {
            console.error('Error fetching website data:', error);
            return null;
        }
    }

    /**
     * Fetch X/Twitter data
     */
    async fetchSocialData(handle, startupName) {
        // MVP: Manual input or API integration
        // Future: Use x_semantic_search tool
        try {
            // Placeholder for X API integration
            return {
                recentPosts: [],
                engagement: {},
                communityFeedback: []
            };
        } catch (error) {
            console.error('Error fetching social data:', error);
            return null;
        }
    }

    /**
     * Fetch web mentions
     */
    async fetchWebMentions(startupName) {
        // MVP: Use web_search tool or Google Custom Search API
        try {
            // Placeholder for web search integration
            return {
                pressCoverage: [],
                industryMentions: [],
                socialProof: []
            };
        } catch (error) {
            console.error('Error fetching web mentions:', error);
            return null;
        }
    }

    /**
     * Format context for prompt injection
     */
    formatForPrompt(context) {
        const parts = [];

        if (context.website) {
            parts.push(`Website: ${context.website.recentUpdates || 'No recent updates'}`);
        }

        if (context.social) {
            parts.push(`X: ${context.social.recentPosts[0]?.text || 'No recent posts'}`);
        }

        if (context.webMentions) {
            parts.push(`Web: ${context.webMentions.pressCoverage[0]?.snippet || 'No press coverage'}`);
        }

        return parts.length > 0 ? parts.join('; ') : 'No external context available';
    }
}

module.exports = ExternalContextFetcher;
```

## Database Schema

### Table: user_external_urls

```sql
CREATE TABLE user_external_urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    website_url TEXT,
    x_handle TEXT,
    linkedin_url TEXT,
    other_urls JSONB,
    opt_in BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: external_context_cache

```sql
CREATE TABLE external_context_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    context_type TEXT NOT NULL, -- 'website', 'social', 'web_mentions'
    context_data JSONB NOT NULL,
    fetched_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_context_cache_user ON external_context_cache(user_id);
CREATE INDEX idx_context_cache_expires ON external_context_cache(expires_at);
```

## Implementation Steps

### Step 1: Update Nudges Generator Lambda
1. Add external context parameter to request
2. Update prompt templates with external context
3. Handle missing context gracefully
4. Test with mock data

### Step 2: Update Urgent Actions Lambda
1. Add external context parameter to request
2. Update prompt templates with external context
3. Handle missing context gracefully
4. Test with mock data

### Step 3: Create External Context Fetcher (MVP)
1. Create simple module for manual input
2. Add placeholder for future tool integration
3. Format context for prompt injection
4. Add caching logic

### Step 4: Frontend Integration
1. Add onboarding form for external URLs
2. Store URLs in database
3. Pass URLs to Lambda functions
4. Display external context in UI (optional)

### Step 5: Cron Job (Future)
1. Create scheduled Lambda for daily refresh
2. Fetch fresh context for all users
3. Update cache in database
4. Send notifications for significant changes

## MVP Approach

For initial implementation:
1. **Manual Input**: Users provide URLs during onboarding
2. **Simple Caching**: Store in database, refresh on demand
3. **Graceful Degradation**: Work without external context
4. **Future Enhancement**: Add automated fetching with tools

## Cost Estimation

Per user per day:
- Web scraping: $0.01
- X API calls: $0.02
- Web search: $0.01
- Claude processing: $0.01
- **Total**: ~$0.05/user/day

For 1000 users: $50/day = $1,500/month

## Privacy & Compliance

1. **Opt-in Required**: Users must explicitly consent
2. **Data Minimization**: Only fetch what's needed
3. **Anonymization**: Aggregate data for benchmarks
4. **Retention**: Delete after 30 days
5. **Transparency**: Show users what data is collected

## Success Metrics

1. **Personalization Score**: % of nudges using external context
2. **Engagement Rate**: Click-through on nudges with context
3. **Completion Rate**: Actions completed with context-driven nudges
4. **User Feedback**: Satisfaction with personalized recommendations
5. **Cost Efficiency**: Cost per engaged user

## Rollout Plan

### Week 1: Foundation
- Update Lambda prompts with placeholders
- Create external context fetcher module
- Add database schema

### Week 2: MVP Integration
- Integrate manual input in onboarding
- Test with sample users
- Gather feedback

### Week 3: Automation
- Add cron job for daily refresh
- Integrate web scraping tools
- Monitor costs and performance

### Week 4: Optimization
- Tune prompts based on feedback
- Optimize caching strategy
- Add analytics dashboard

## Notes

- Start with manual input to validate value before investing in automation
- External context is optional - system works without it
- Focus on high-value signals (press mentions, viral posts, traffic spikes)
- Monitor costs closely and adjust refresh frequency as needed
