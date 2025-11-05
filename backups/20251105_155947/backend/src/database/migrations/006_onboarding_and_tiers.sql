-- Migration: Onboarding and Subscription Tiers
-- Description: Add user profiles, tier tracking, and automatic tier recalculation

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Company Information
    startup_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    stage VARCHAR(50) NOT NULL,
    country VARCHAR(100) NOT NULL,
    
    -- Key Metrics for Tier Calculation
    funding_raised DECIMAL(15, 2) NOT NULL DEFAULT 0,
    mrr DECIMAL(15, 2) NOT NULL DEFAULT 0,
    team_size INTEGER NOT NULL DEFAULT 0,
    
    -- Subscription Tier
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'founder',
    subscription_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    
    -- Financial Metrics (optional, for dashboard calculations)
    arpa DECIMAL(10, 2),
    customer_lifetime_months INTEGER,
    monthly_marketing_spend DECIMAL(15, 2),
    new_customers_per_month INTEGER,
    total_cash DECIMAL(15, 2),
    monthly_burn_rate DECIMAL(15, 2),
    
    -- Calculated Metrics
    ltv DECIMAL(15, 2),
    cac DECIMAL(15, 2),
    ltv_cac_ratio DECIMAL(10, 2),
    runway DECIMAL(10, 2),
    
    -- Timestamps
    onboarding_completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT valid_tier CHECK (subscription_tier IN ('founder', 'startup', 'growth', 'scale'))
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_tier ON user_profiles(subscription_tier);

-- Tier History Table (track tier changes over time)
CREATE TABLE IF NOT EXISTS tier_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_tier_history CHECK (tier IN ('founder', 'startup', 'growth', 'scale'))
);

CREATE INDEX idx_tier_history_user_id ON tier_history(user_id);
CREATE INDEX idx_tier_history_created_at ON tier_history(created_at);

-- Metrics Tracking Table (for automatic tier recalculation)
CREATE TABLE IF NOT EXISTS metrics_snapshots (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    funding_raised DECIMAL(15, 2) NOT NULL,
    mrr DECIMAL(15, 2) NOT NULL,
    team_size INTEGER NOT NULL,
    tier VARCHAR(50) NOT NULL,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, snapshot_date)
);

CREATE INDEX idx_metrics_snapshots_user_id ON metrics_snapshots(user_id);
CREATE INDEX idx_metrics_snapshots_date ON metrics_snapshots(snapshot_date);

-- Function to automatically recalculate tier when metrics change
CREATE OR REPLACE FUNCTION recalculate_tier()
RETURNS TRIGGER AS $$
DECLARE
    new_tier VARCHAR(50);
    tier_price DECIMAL(10, 2);
BEGIN
    -- Calculate tier based on metrics
    IF NEW.funding_raised >= 5000000 OR NEW.mrr >= 100000 OR NEW.team_size >= 50 THEN
        new_tier := 'scale';
        tier_price := 999;
    ELSIF NEW.funding_raised >= 500000 OR NEW.mrr >= 25000 OR NEW.team_size >= 15 THEN
        new_tier := 'growth';
        tier_price := 499;
    ELSIF NEW.funding_raised >= 10000 OR NEW.mrr >= 5000 OR NEW.team_size >= 5 THEN
        new_tier := 'startup';
        tier_price := 149;
    ELSE
        new_tier := 'founder';
        tier_price := 0;
    END IF;
    
    -- Update tier if changed
    IF new_tier != OLD.subscription_tier THEN
        NEW.subscription_tier := new_tier;
        NEW.subscription_price := tier_price;
        NEW.updated_at := NOW();
        
        -- Log tier change
        INSERT INTO tier_history (user_id, tier, price, reason, created_at)
        VALUES (NEW.user_id, new_tier, tier_price, 'Automatic recalculation', NOW());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate tier on metrics update
CREATE TRIGGER trigger_recalculate_tier
BEFORE UPDATE OF funding_raised, mrr, team_size ON user_profiles
FOR EACH ROW
WHEN (OLD.funding_raised IS DISTINCT FROM NEW.funding_raised 
   OR OLD.mrr IS DISTINCT FROM NEW.mrr 
   OR OLD.team_size IS DISTINCT FROM NEW.team_size)
EXECUTE FUNCTION recalculate_tier();

-- Function to create daily metrics snapshot
CREATE OR REPLACE FUNCTION create_metrics_snapshot()
RETURNS void AS $$
BEGIN
    INSERT INTO metrics_snapshots (user_id, funding_raised, mrr, team_size, tier, snapshot_date)
    SELECT 
        user_id,
        funding_raised,
        mrr,
        team_size,
        subscription_tier,
        CURRENT_DATE
    FROM user_profiles
    WHERE onboarding_completed_at IS NOT NULL
    ON CONFLICT (user_id, snapshot_date) DO UPDATE SET
        funding_raised = EXCLUDED.funding_raised,
        mrr = EXCLUDED.mrr,
        team_size = EXCLUDED.team_size,
        tier = EXCLUDED.tier;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE user_profiles IS 'User startup profiles with metrics for tier calculation';
COMMENT ON TABLE tier_history IS 'Historical record of tier changes';
COMMENT ON TABLE metrics_snapshots IS 'Daily snapshots of metrics for trend analysis';
COMMENT ON FUNCTION recalculate_tier() IS 'Automatically recalculates subscription tier when metrics change';
COMMENT ON FUNCTION create_metrics_snapshot() IS 'Creates daily snapshot of all user metrics';
