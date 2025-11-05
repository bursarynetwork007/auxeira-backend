-- =============================================
-- STARTUP PROFILES - 10,000 SIMULATED CASES
-- =============================================
-- This schema supports 10,000 timestamped startup profiles
-- with 365-day rolling feed and 5-year historical data

-- Startup Profiles Table
CREATE TABLE IF NOT EXISTS startup_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    
    -- Basic Information
    company_name VARCHAR(255) NOT NULL,
    founder_name VARCHAR(255),
    industry VARCHAR(100),
    sector VARCHAR(100),
    stage VARCHAR(50), -- seed, early, growth, scale
    founded_date DATE,
    
    -- SSE Score Data
    sse_score INTEGER CHECK (sse_score >= 0 AND sse_score <= 100),
    sse_percentile INTEGER CHECK (sse_percentile >= 0 AND sse_percentile <= 100),
    sse_score_history JSONB DEFAULT '[]',
    last_sse_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Financial Metrics
    mrr DECIMAL(15,2) DEFAULT 0,
    arr DECIMAL(15,2) DEFAULT 0,
    revenue DECIMAL(15,2) DEFAULT 0,
    growth_rate DECIMAL(5,2) DEFAULT 0,
    burn_rate DECIMAL(15,2) DEFAULT 0,
    runway_months INTEGER DEFAULT 0,
    funding_raised DECIMAL(15,2) DEFAULT 0,
    valuation DECIMAL(15,2),
    
    -- Team Metrics
    employees INTEGER DEFAULT 0,
    founders_count INTEGER DEFAULT 1,
    advisors_count INTEGER DEFAULT 0,
    
    -- Market Metrics
    customers INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    market_size DECIMAL(15,2),
    market_share DECIMAL(5,4),
    
    -- Activity Metrics
    activities_completed INTEGER DEFAULT 0,
    activities_pending INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    
    -- Location
    country VARCHAR(100),
    city VARCHAR(100),
    region VARCHAR(100),
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Synthetic Data Flags
    is_synthetic BOOLEAN DEFAULT TRUE,
    synthetic_seed VARCHAR(100),
    synthetic_algorithm VARCHAR(100) DEFAULT 'monte_carlo',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT unique_company_name UNIQUE(company_name)
);

-- Activity Feed Table (Rolling 365-day + 5-year toggle)
CREATE TABLE IF NOT EXISTS activity_feed (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES startup_profiles(profile_id) ON DELETE CASCADE,
    
    -- Activity Details
    activity_type VARCHAR(100) NOT NULL,
    activity_category VARCHAR(100),
    activity_title VARCHAR(255) NOT NULL,
    activity_description TEXT,
    
    -- Metrics
    tokens_earned INTEGER DEFAULT 0,
    impact_score DECIMAL(5,2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'completed',
    verification_level VARCHAR(50) DEFAULT 'self',
    
    -- Timestamps
    activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Synthetic Data
    is_synthetic BOOLEAN DEFAULT TRUE,
    synthetic_pattern VARCHAR(100)
);

-- Metrics History Table (Time-series data)
CREATE TABLE IF NOT EXISTS metrics_history (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES startup_profiles(profile_id) ON DELETE CASCADE,
    
    -- Metric Type
    metric_name VARCHAR(100) NOT NULL,
    metric_category VARCHAR(50),
    
    -- Values
    metric_value DECIMAL(15,2),
    metric_delta DECIMAL(15,2),
    metric_percentage_change DECIMAL(5,2),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    metric_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Synthetic Data
    is_synthetic BOOLEAN DEFAULT TRUE
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Startup Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_startup_profiles_user_id ON startup_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_org_id ON startup_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_industry ON startup_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_stage ON startup_profiles(stage);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_sse_score ON startup_profiles(sse_score DESC);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_created_at ON startup_profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_synthetic ON startup_profiles(is_synthetic, created_at);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_status ON startup_profiles(status, created_at);

-- Activity Feed Indexes (Optimized for rolling feed)
CREATE INDEX IF NOT EXISTS idx_activity_feed_profile_id ON activity_feed(profile_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_activity_date ON activity_feed(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_365_days ON activity_feed(activity_date DESC) 
    WHERE activity_date >= NOW() - INTERVAL '365 days';
CREATE INDEX IF NOT EXISTS idx_activity_feed_5_years ON activity_feed(activity_date DESC) 
    WHERE activity_date >= NOW() - INTERVAL '5 years';

-- Metrics History Indexes
CREATE INDEX IF NOT EXISTS idx_metrics_history_profile_id ON metrics_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_metrics_history_metric_name ON metrics_history(metric_name, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_history_date ON metrics_history(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_history_365_days ON metrics_history(metric_date DESC) 
    WHERE metric_date >= NOW() - INTERVAL '365 days';

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_startup_profiles_updated_at 
    BEFORE UPDATE ON startup_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VIEWS FOR DATA ACCESS
-- =============================================

-- View: Recent Activity Feed (365 days)
CREATE OR REPLACE VIEW activity_feed_365_days AS
SELECT 
    af.*,
    sp.company_name,
    sp.industry,
    sp.stage
FROM activity_feed af
JOIN startup_profiles sp ON af.profile_id = sp.profile_id
WHERE af.activity_date >= NOW() - INTERVAL '365 days'
ORDER BY af.activity_date DESC;

-- View: Extended Activity Feed (5 years)
CREATE OR REPLACE VIEW activity_feed_5_years AS
SELECT 
    af.*,
    sp.company_name,
    sp.industry,
    sp.stage
FROM activity_feed af
JOIN startup_profiles sp ON af.profile_id = sp.profile_id
WHERE af.activity_date >= NOW() - INTERVAL '5 years'
ORDER BY af.activity_date DESC;

-- View: Startup Profiles Summary
CREATE OR REPLACE VIEW startup_profiles_summary AS
SELECT 
    sp.profile_id,
    sp.company_name,
    sp.industry,
    sp.stage,
    sp.sse_score,
    sp.sse_percentile,
    sp.mrr,
    sp.arr,
    sp.growth_rate,
    sp.employees,
    sp.customers,
    sp.activities_completed,
    sp.total_tokens,
    sp.created_at,
    sp.last_activity_at,
    COUNT(DISTINCT af.activity_id) as recent_activities_count,
    MAX(af.activity_date) as last_activity_date
FROM startup_profiles sp
LEFT JOIN activity_feed af ON sp.profile_id = af.profile_id 
    AND af.activity_date >= NOW() - INTERVAL '365 days'
GROUP BY sp.profile_id
ORDER BY sp.sse_score DESC;

-- =============================================
-- FUNCTIONS FOR DATA RETRIEVAL
-- =============================================

-- Function: Get Activity Feed with Date Range
CREATE OR REPLACE FUNCTION get_activity_feed(
    p_profile_id UUID DEFAULT NULL,
    p_days INTEGER DEFAULT 365,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    activity_id UUID,
    profile_id UUID,
    company_name VARCHAR,
    activity_type VARCHAR,
    activity_title VARCHAR,
    activity_description TEXT,
    tokens_earned INTEGER,
    activity_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        af.activity_id,
        af.profile_id,
        sp.company_name,
        af.activity_type,
        af.activity_title,
        af.activity_description,
        af.tokens_earned,
        af.activity_date
    FROM activity_feed af
    JOIN startup_profiles sp ON af.profile_id = sp.profile_id
    WHERE 
        (p_profile_id IS NULL OR af.profile_id = p_profile_id)
        AND af.activity_date >= NOW() - (p_days || ' days')::INTERVAL
    ORDER BY af.activity_date DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Metrics History
CREATE OR REPLACE FUNCTION get_metrics_history(
    p_profile_id UUID,
    p_metric_name VARCHAR DEFAULT NULL,
    p_days INTEGER DEFAULT 365
)
RETURNS TABLE (
    metric_id UUID,
    metric_name VARCHAR,
    metric_value DECIMAL,
    metric_delta DECIMAL,
    metric_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mh.metric_id,
        mh.metric_name,
        mh.metric_value,
        mh.metric_delta,
        mh.metric_date
    FROM metrics_history mh
    WHERE 
        mh.profile_id = p_profile_id
        AND (p_metric_name IS NULL OR mh.metric_name = p_metric_name)
        AND mh.metric_date >= NOW() - (p_days || ' days')::INTERVAL
    ORDER BY mh.metric_date DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE startup_profiles IS 'Stores 10,000 simulated startup profiles with comprehensive metrics';
COMMENT ON TABLE activity_feed IS 'Rolling activity feed with 365-day default and 5-year toggle support';
COMMENT ON TABLE metrics_history IS 'Time-series metrics data for trend analysis';
COMMENT ON VIEW activity_feed_365_days IS 'Default view showing last 365 days of activities';
COMMENT ON VIEW activity_feed_5_years IS 'Extended view showing last 5 years of activities';
COMMENT ON FUNCTION get_activity_feed IS 'Retrieve activity feed with flexible date range filtering';
COMMENT ON FUNCTION get_metrics_history IS 'Retrieve metrics history for a specific profile';
