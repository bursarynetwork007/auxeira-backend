-- =====================================================
-- AUXEIRA ACTIVITY REWARDS SYSTEM MIGRATION
-- =====================================================
-- Database schema for Activity Rewards functionality
-- Migration: 005_activity_rewards
-- Created: 2025-10-27
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ACTIVITIES CATALOG
-- =====================================================

-- Activities table - catalog of all rewarded activities
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold')),
    base_tokens INTEGER NOT NULL CHECK (base_tokens > 0),
    nudges JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for activities
CREATE INDEX idx_activities_category ON activities(category);
CREATE INDEX idx_activities_tier ON activities(tier);
CREATE INDEX idx_activities_active ON activities(is_active) WHERE is_active = true;

-- =====================================================
-- ACTIVITY SUBMISSIONS
-- =====================================================

-- Activity submissions table - tracks user activity submissions
CREATE TABLE IF NOT EXISTS activity_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE RESTRICT,
    proof_text TEXT NOT NULL,
    proof_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'rejected')),
    quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
    consistency_weeks INTEGER DEFAULT 0 CHECK (consistency_weeks >= 0),
    tokens_awarded INTEGER DEFAULT 0 CHECK (tokens_awarded >= 0),
    ai_feedback TEXT,
    assessed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for activity submissions
CREATE INDEX idx_activity_submissions_user_id ON activity_submissions(user_id);
CREATE INDEX idx_activity_submissions_startup_id ON activity_submissions(startup_id);
CREATE INDEX idx_activity_submissions_activity_id ON activity_submissions(activity_id);
CREATE INDEX idx_activity_submissions_status ON activity_submissions(status);
CREATE INDEX idx_activity_submissions_created_at ON activity_submissions(created_at DESC);

-- =====================================================
-- TOKEN TRANSACTIONS
-- =====================================================

-- Token transactions table - tracks all token movements
CREATE TABLE IF NOT EXISTS token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'transfer', 'bonus', 'penalty')),
    source_type VARCHAR(50) NOT NULL,
    source_id UUID,
    description TEXT,
    balance_after INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for token transactions
CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_startup_id ON token_transactions(startup_id);
CREATE INDEX idx_token_transactions_type ON token_transactions(transaction_type);
CREATE INDEX idx_token_transactions_created_at ON token_transactions(created_at DESC);
CREATE INDEX idx_token_transactions_source ON token_transactions(source_type, source_id);

-- =====================================================
-- TOKEN BALANCES
-- =====================================================

-- Token balances table - current token balance for each user/startup
CREATE TABLE IF NOT EXISTS token_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    lifetime_earned INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0),
    lifetime_spent INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_spent >= 0),
    last_transaction_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, startup_id)
);

-- Indexes for token balances
CREATE INDEX idx_token_balances_user_id ON token_balances(user_id);
CREATE INDEX idx_token_balances_startup_id ON token_balances(startup_id);
CREATE INDEX idx_token_balances_balance ON token_balances(balance DESC);

-- =====================================================
-- SEED DATA - ACTIVITY CATALOG
-- =====================================================

-- Insert the 25 activities from the token calculator
INSERT INTO activities (id, name, description, category, tier, base_tokens, nudges) VALUES
(1, 'Customer Interviews Conducted', 'Conduct 5 qualified customer interviews', 'Customer Discovery & Validation', 'bronze', 20, 
 '["Prepare a structured interview guide with 5-7 key questions", "Record or take detailed notes during the interview", "Focus on understanding pain points, not pitching your solution", "Follow up with interviewees within 24 hours"]'::jsonb),

(2, 'Customer Feedback Loops Implemented', 'Establish recurring feedback mechanisms', 'Customer Discovery & Validation', 'bronze', 25,
 '["Set up automated feedback collection (e.g., NPS surveys)", "Create a feedback tracking system", "Schedule regular customer check-ins", "Document and act on feedback received"]'::jsonb),

(3, 'Problem-Solution Interviews', 'Conduct interviews with quality scoring', 'Customer Discovery & Validation', 'bronze', 20,
 '["Validate the problem before pitching the solution", "Use open-ended questions to understand pain points", "Document insights and patterns", "Test solution hypotheses with customers"]'::jsonb),

(4, 'MVP Launches & Iterations', 'Launch or iterate on MVP', 'Product Iteration & Development', 'silver', 75,
 '["Ensure MVP has core functionality only (no nice-to-haves)", "Set a clear success metric (e.g., 100 signups in 2 weeks)", "Document the iteration process and learnings", "Share launch metrics and user feedback"]'::jsonb),

(5, 'Short Release Cycles', 'Maintain 1-2 week sprint cycles', 'Product Iteration & Development', 'bronze', 20,
 '["Use agile methodology with clear sprint goals", "Ship small, incremental improvements", "Gather user feedback after each release", "Document what worked and what didn''t"]'::jsonb),

(6, 'User Testing Sessions', 'Conduct documented user testing', 'Product Iteration & Development', 'bronze', 25,
 '["Recruit 5-10 users for testing sessions", "Prepare specific tasks for users to complete", "Record sessions and take detailed notes", "Implement at least 3 improvements based on feedback"]'::jsonb),

(7, 'Pivot Execution', 'Execute data-driven pivot', 'Product Iteration & Development', 'silver', 100,
 '["Document the reasons for pivoting with data", "Create a clear pivot plan with milestones", "Communicate the pivot to stakeholders", "Track metrics before and after the pivot"]'::jsonb),

(8, 'KPI Dashboard Establishment', 'Set up tracking infrastructure', 'Metrics Tracking & Data-Driven Decisions', 'silver', 50,
 '["Track at least 5 key metrics: CAC, LTV, Churn, MRR, Burn Rate", "Use a tool like Google Sheets, Mixpanel, or Amplitude", "Update metrics weekly and document trends", "Share monthly metric review with your team"]'::jsonb),

(9, 'Regular Metric Reviews', 'Conduct monthly metric review', 'Metrics Tracking & Data-Driven Decisions', 'bronze', 15,
 '["Review all key metrics monthly", "Identify trends and anomalies", "Document insights and action items", "Share findings with the team"]'::jsonb),

(10, 'Data-Driven Decision Documentation', 'Document major decision with data', 'Metrics Tracking & Data-Driven Decisions', 'bronze', 20,
 '["Use data to support major decisions", "Document the decision-making process", "Track outcomes of data-driven decisions", "Share learnings with the team"]'::jsonb),

(11, 'Co-founder Agreements & Equity Splits', 'Formalize founder agreements', 'Team Building & Organizational Health', 'silver', 75,
 '["Create a written co-founder agreement", "Define equity splits and vesting schedules", "Clarify roles and responsibilities", "Include exit and dispute resolution clauses"]'::jsonb),

(12, 'Regular Team Retrospectives', 'Conduct bi-weekly retrospectives', 'Team Building & Organizational Health', 'bronze', 20,
 '["Hold retrospectives every 2 weeks", "Use a structured format (Start, Stop, Continue)", "Document action items and follow up", "Create a safe space for honest feedback"]'::jsonb),

(13, 'Key Hire Documentation', 'Document strategic hire', 'Team Building & Organizational Health', 'silver', 75,
 '["Define the role and requirements clearly", "Document the hiring process and criteria", "Onboard new hires with a structured plan", "Track the impact of the hire on team performance"]'::jsonb),

(14, 'Monthly Financial Reviews', 'Prepare financial statements', 'Financial Discipline & Planning', 'bronze', 20,
 '["Prepare P&L, balance sheet, and cash flow statements", "Review burn rate and runway", "Identify cost-saving opportunities", "Share financial updates with stakeholders"]'::jsonb),

(15, 'Runway Extension Activities', 'Achieve 6+ month runway', 'Financial Discipline & Planning', 'silver', 75,
 '["Calculate current runway and burn rate", "Identify revenue opportunities or cost cuts", "Secure additional funding if needed", "Document the plan to extend runway"]'::jsonb),

(16, 'Unit Economics Documentation', 'Calculate and improve unit economics', 'Financial Discipline & Planning', 'bronze', 25,
 '["Calculate CAC, LTV, and LTV:CAC ratio", "Identify ways to improve unit economics", "Track improvements over time", "Share unit economics with investors"]'::jsonb),

(17, 'First Revenue Achievement', 'Achieve first paying customer', 'Market Validation & Traction', 'gold', 300,
 '["Celebrate the first paying customer milestone", "Document the customer acquisition process", "Gather feedback from the first customer", "Use learnings to acquire more customers"]'::jsonb),

(18, 'Customer Retention Actions', 'Implement retention programs', 'Market Validation & Traction', 'silver', 75,
 '["Identify reasons for customer churn", "Implement retention strategies (e.g., onboarding, support)", "Track retention metrics over time", "Celebrate retention wins with the team"]'::jsonb),

(19, 'Market Research Execution', 'Conduct TAM/SAM/SOM analysis', 'Market Validation & Traction', 'silver', 75,
 '["Research total addressable market (TAM)", "Define serviceable addressable market (SAM)", "Calculate serviceable obtainable market (SOM)", "Document market size and growth potential"]'::jsonb),

(20, 'Post-Mortem Documentation', 'Document learnings from failures', 'Learning & Adaptation', 'bronze', 20,
 '["Conduct post-mortems after failures or setbacks", "Document what went wrong and why", "Identify lessons learned and action items", "Share learnings with the team"]'::jsonb),

(21, 'Competitive Intelligence Gathering', 'Conduct competitive analysis', 'Learning & Adaptation', 'bronze', 20,
 '["Identify top 5 competitors", "Analyze their strengths and weaknesses", "Document your competitive advantages", "Update competitive analysis quarterly"]'::jsonb),

(22, 'Industry Event Participation', 'Attend conferences or demo days', 'Learning & Adaptation', 'bronze', 25,
 '["Attend relevant industry events", "Network with other founders and investors", "Document key learnings and connections", "Follow up with new contacts within 48 hours"]'::jsonb),

(23, 'Pitch Deck Development', 'Create professional pitch deck', 'Investor Readiness', 'silver', 75,
 '["Create a 10-15 slide pitch deck", "Include problem, solution, market, traction, team, and ask", "Get feedback from mentors or advisors", "Practice your pitch multiple times"]'::jsonb),

(24, 'Investor Meeting Documentation', 'Document investor conversation', 'Investor Readiness', 'bronze', 20,
 '["Document each investor meeting", "Track investor feedback and questions", "Follow up within 24 hours", "Maintain a CRM for investor relationships"]'::jsonb),

(25, 'Due Diligence Preparation', 'Complete data room preparation', 'Investor Readiness', 'gold', 250,
 '["Organize all legal, financial, and operational documents", "Create a virtual data room", "Prepare answers to common due diligence questions", "Review data room with legal counsel"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence to continue from 26
SELECT setval('activities_id_seq', 25, true);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_submissions_updated_at BEFORE UPDATE ON activity_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_balances_updated_at BEFORE UPDATE ON token_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update token balance after transaction
CREATE OR REPLACE FUNCTION update_token_balance()
RETURNS TRIGGER AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    -- Get or create token balance record
    INSERT INTO token_balances (user_id, startup_id, balance, lifetime_earned, lifetime_spent)
    VALUES (NEW.user_id, NEW.startup_id, 0, 0, 0)
    ON CONFLICT (user_id, startup_id) DO NOTHING;

    -- Update balance based on transaction type
    IF NEW.transaction_type IN ('earn', 'bonus') THEN
        UPDATE token_balances
        SET 
            balance = balance + NEW.amount,
            lifetime_earned = lifetime_earned + NEW.amount,
            last_transaction_at = NEW.created_at
        WHERE user_id = NEW.user_id AND (startup_id = NEW.startup_id OR (startup_id IS NULL AND NEW.startup_id IS NULL))
        RETURNING balance INTO current_balance;
    ELSIF NEW.transaction_type IN ('spend', 'penalty') THEN
        UPDATE token_balances
        SET 
            balance = balance - NEW.amount,
            lifetime_spent = lifetime_spent + NEW.amount,
            last_transaction_at = NEW.created_at
        WHERE user_id = NEW.user_id AND (startup_id = NEW.startup_id OR (startup_id IS NULL AND NEW.startup_id IS NULL))
        RETURNING balance INTO current_balance;
    END IF;

    -- Update the transaction with balance_after
    NEW.balance_after = current_balance;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update balance after token transaction
CREATE TRIGGER update_balance_after_transaction
    BEFORE INSERT ON token_transactions
    FOR EACH ROW EXECUTE FUNCTION update_token_balance();

-- =====================================================
-- VIEWS
-- =====================================================

-- View for activity leaderboard
CREATE OR REPLACE VIEW activity_leaderboard AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.company_name,
    COUNT(s.id) as total_activities,
    SUM(s.tokens_awarded) as total_tokens,
    AVG(s.quality_score) as avg_quality_score,
    MAX(s.created_at) as last_activity_date
FROM users u
LEFT JOIN activity_submissions s ON u.id = s.user_id AND s.status = 'approved'
GROUP BY u.id, u.first_name, u.last_name, u.company_name
ORDER BY total_tokens DESC NULLS LAST;

-- View for activity statistics by category
CREATE OR REPLACE VIEW activity_stats_by_category AS
SELECT 
    a.category,
    a.tier,
    COUNT(s.id) as submission_count,
    AVG(s.quality_score) as avg_quality_score,
    SUM(s.tokens_awarded) as total_tokens_awarded
FROM activities a
LEFT JOIN activity_submissions s ON a.id = s.activity_id AND s.status = 'approved'
GROUP BY a.category, a.tier
ORDER BY total_tokens_awarded DESC NULLS LAST;

-- =====================================================
-- GRANTS (adjust based on your user roles)
-- =====================================================

-- Grant permissions to application user (adjust username as needed)
-- GRANT SELECT, INSERT, UPDATE ON activities TO auxeira_app;
-- GRANT SELECT, INSERT, UPDATE ON activity_submissions TO auxeira_app;
-- GRANT SELECT, INSERT ON token_transactions TO auxeira_app;
-- GRANT SELECT, UPDATE ON token_balances TO auxeira_app;
-- GRANT SELECT ON activity_leaderboard TO auxeira_app;
-- GRANT SELECT ON activity_stats_by_category TO auxeira_app;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE activities IS 'Catalog of all rewarded activities with base token values';
COMMENT ON TABLE activity_submissions IS 'User submissions of completed activities for assessment';
COMMENT ON TABLE token_transactions IS 'All token movements (earn, spend, transfer, etc.)';
COMMENT ON TABLE token_balances IS 'Current token balance for each user/startup';
COMMENT ON VIEW activity_leaderboard IS 'Leaderboard showing top performers by tokens earned';
COMMENT ON VIEW activity_stats_by_category IS 'Statistics on activities grouped by category and tier';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
