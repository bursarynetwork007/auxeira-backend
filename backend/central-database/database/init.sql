-- Auxeira Central Database Initialization Script
-- This script creates the complete database schema with timestamping functionality

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create custom types
CREATE TYPE user_type_enum AS ENUM (
    'startup_founder', 
    'venture_capital', 
    'angel_investor', 
    'corporate_partner', 
    'government', 
    'esg_funder', 
    'impact_investor'
);

CREATE TYPE organization_type_enum AS ENUM (
    'startup',
    'venture_capital',
    'angel_investor',
    'corporate',
    'government',
    'non_profit'
);

CREATE TYPE integration_status_enum AS ENUM (
    'connected',
    'disconnected',
    'error',
    'pending'
);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to get current user ID (for RLS)
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        current_setting('app.current_user_id', true)::UUID,
        '00000000-0000-0000-0000-000000000000'::UUID
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- CORE TABLES
-- =============================================

-- Users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type user_type_enum NOT NULL,
    profile JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Organizations table
CREATE TABLE organizations (
    org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    org_type organization_type_enum NOT NULL,
    description TEXT,
    website VARCHAR(255),
    industry VARCHAR(100),
    region VARCHAR(100),
    size_category VARCHAR(50),
    logo_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT website_format CHECK (website IS NULL OR website ~* '^https?://.*')
);

-- User-Organization relationships
CREATE TABLE user_organizations (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    permissions JSONB DEFAULT '{}',
    is_primary BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    
    PRIMARY KEY (user_id, org_id)
);

-- =============================================
-- SSE SCORING SYSTEM
-- =============================================

-- SSE Scores table with versioning
CREATE TABLE sse_scores (
    score_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    startup_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
    component_scores JSONB NOT NULL DEFAULT '{}',
    responses JSONB NOT NULL DEFAULT '{}',
    percentile INTEGER CHECK (percentile >= 0 AND percentile <= 100),
    success_probability DECIMAL(5,4) CHECK (success_probability >= 0 AND success_probability <= 1),
    causal_metrics JSONB DEFAULT '{}',
    
    -- Synthetic data tracking
    is_synthetic BOOLEAN DEFAULT FALSE,
    synthetic_seed VARCHAR(100),
    synthetic_algorithm VARCHAR(100),
    synthetic_parameters JSONB DEFAULT '{}',
    
    -- Metadata
    calculation_method VARCHAR(50) DEFAULT 'standard',
    data_quality_score DECIMAL(3,2) DEFAULT 1.0,
    confidence_level DECIMAL(3,2) DEFAULT 1.0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id),
    
    -- Constraints
    UNIQUE(startup_id, version)
);

-- SSE Score change history
CREATE TABLE sse_score_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    startup_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    score_id UUID REFERENCES sse_scores(score_id) ON DELETE CASCADE,
    change_type VARCHAR(50) NOT NULL,
    old_values JSONB DEFAULT '{}',
    new_values JSONB DEFAULT '{}',
    change_delta JSONB DEFAULT '{}',
    changed_by UUID REFERENCES users(user_id),
    change_reason TEXT,
    impact_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- DATA INTEGRATIONS
-- =============================================

-- Integration configurations
CREATE TABLE integrations (
    integration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    startup_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    status integration_status_enum DEFAULT 'disconnected',
    
    -- Connection details (encrypted)
    credentials JSONB DEFAULT '{}',
    configuration JSONB DEFAULT '{}',
    
    -- Sync management
    last_sync TIMESTAMP WITH TIME ZONE,
    next_sync TIMESTAMP WITH TIME ZONE,
    sync_frequency INTERVAL DEFAULT '1 hour',
    sync_enabled BOOLEAN DEFAULT TRUE,
    
    -- Error handling
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    last_error_at TIMESTAMP WITH TIME ZONE,
    
    -- Synthetic data
    is_synthetic BOOLEAN DEFAULT FALSE,
    synthetic_pattern VARCHAR(100),
    synthetic_config JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(startup_id, service_name)
);

-- Integration data storage
CREATE TABLE integration_data (
    data_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES integrations(integration_id) ON DELETE CASCADE,
    data_type VARCHAR(100) NOT NULL,
    data_payload JSONB NOT NULL DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    
    -- Timing
    sync_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    data_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Synthetic data tracking
    is_synthetic BOOLEAN DEFAULT FALSE,
    synthetic_pattern VARCHAR(100),
    synthetic_variance DECIMAL(5,4) DEFAULT 0.1,
    
    -- Data quality
    quality_score DECIMAL(3,2) DEFAULT 1.0,
    validation_status VARCHAR(50) DEFAULT 'pending',
    validation_errors JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- GAMIFICATION SYSTEM
-- =============================================

-- User actions and rewards
CREATE TABLE actions (
    action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    startup_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    
    -- Action details
    action_type VARCHAR(100) NOT NULL,
    domain VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- Token calculation
    base_tokens INTEGER NOT NULL DEFAULT 0,
    actual_tokens INTEGER NOT NULL DEFAULT 0,
    multipliers JSONB DEFAULT '{}',
    
    -- Verification
    verification_level VARCHAR(50) DEFAULT 'self',
    verification_data JSONB DEFAULT '{}',
    verification_status VARCHAR(50) DEFAULT 'pending',
    verified_by UUID REFERENCES users(user_id),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Status and metadata
    status VARCHAR(50) DEFAULT 'completed',
    metadata JSONB DEFAULT '{}',
    
    -- Synthetic data
    is_synthetic BOOLEAN DEFAULT FALSE,
    synthetic_probability DECIMAL(3,2) DEFAULT 0.8,
    
    -- Timestamps
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gamification profiles
CREATE TABLE gamification_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE UNIQUE,
    startup_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    
    -- Token tracking
    total_tokens INTEGER DEFAULT 0,
    lifetime_tokens INTEGER DEFAULT 0,
    tokens_spent INTEGER DEFAULT 0,
    
    -- Streak tracking
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    streak_start_date DATE,
    last_action_date DATE,
    
    -- Weekly tracking
    week_number INTEGER DEFAULT 1,
    actions_this_week INTEGER DEFAULT 0,
    tokens_this_week INTEGER DEFAULT 0,
    
    -- Achievements and milestones
    achievements JSONB DEFAULT '[]',
    milestones JSONB DEFAULT '[]',
    commitments JSONB DEFAULT '[]',
    
    -- Activity tracking
    last_active_date DATE,
    activity_score DECIMAL(5,2) DEFAULT 0.0,
    
    -- Synthetic data
    is_synthetic BOOLEAN DEFAULT FALSE,
    synthetic_behavior_pattern VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INVESTMENT AND PARTNERSHIP DATA
-- =============================================

-- Investment tracking
CREATE TABLE investments (
    investment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    startup_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    
    -- Investment details
    investment_type VARCHAR(50) NOT NULL,
    round_name VARCHAR(100),
    amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',
    valuation DECIMAL(15,2),
    equity_percentage DECIMAL(5,4),
    
    -- Dates
    investment_date DATE,
    due_diligence_start DATE,
    due_diligence_end DATE,
    
    -- Status and terms
    status VARCHAR(50) DEFAULT 'active',
    terms JSONB DEFAULT '{}',
    documents JSONB DEFAULT '[]',
    
    -- Synthetic data
    is_synthetic BOOLEAN DEFAULT FALSE,
    synthetic_market_conditions JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partnership management
CREATE TABLE partnerships (
    partnership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    startup_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    
    -- Partnership details
    partnership_type VARCHAR(50) NOT NULL,
    partnership_name VARCHAR(255),
    description TEXT,
    
    -- Status and lifecycle
    status VARCHAR(50) DEFAULT 'active',
    priority VARCHAR(20) DEFAULT 'medium',
    
    -- Benefits and terms
    benefits JSONB DEFAULT '{}',
    terms JSONB DEFAULT '{}',
    kpis JSONB DEFAULT '{}',
    
    -- Dates
    start_date DATE,
    end_date DATE,
    renewal_date DATE,
    
    -- Synthetic data
    is_synthetic BOOLEAN DEFAULT FALSE,
    synthetic_performance JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ANALYTICS AND METRICS
-- =============================================

-- Dashboard metrics storage
CREATE TABLE dashboard_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    
    -- Metric identification
    dashboard_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_category VARCHAR(50),
    
    -- Metric data
    metric_value JSONB NOT NULL DEFAULT '{}',
    metric_unit VARCHAR(20),
    
    -- Timing
    metric_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    aggregation_period VARCHAR(50),
    
    -- Data quality
    data_sources JSONB DEFAULT '[]',
    confidence_score DECIMAL(3,2) DEFAULT 1.0,
    
    -- Synthetic data
    is_synthetic BOOLEAN DEFAULT FALSE,
    synthetic_algorithm VARCHAR(100),
    synthetic_trend VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SYNTHETIC DATA MANAGEMENT
-- =============================================

-- Templates for synthetic data generation
CREATE TABLE synthetic_data_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(100) NOT NULL,
    user_type user_type_enum NOT NULL,
    
    -- Schema and rules
    data_schema JSONB NOT NULL DEFAULT '{}',
    generation_rules JSONB NOT NULL DEFAULT '{}',
    validation_rules JSONB DEFAULT '{}',
    
    -- Sample and defaults
    sample_data JSONB DEFAULT '{}',
    default_parameters JSONB DEFAULT '{}',
    
    -- Metadata
    description TEXT,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Synthetic data generation sessions
CREATE TABLE synthetic_data_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    template_id UUID REFERENCES synthetic_data_templates(template_id),
    
    -- Session details
    session_name VARCHAR(255),
    description TEXT,
    parameters JSONB DEFAULT '{}',
    
    -- Status and lifecycle
    status VARCHAR(50) DEFAULT 'active',
    generation_count INTEGER DEFAULT 0,
    
    -- Expiry and cleanup
    expiry_date TIMESTAMP WITH TIME ZONE,
    auto_cleanup BOOLEAN DEFAULT TRUE,
    
    -- Results tracking
    success_rate DECIMAL(5,4) DEFAULT 1.0,
    error_log JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_generated TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =============================================

-- Update timestamp triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gamification_profiles_updated_at BEFORE UPDATE ON gamification_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partnerships_updated_at BEFORE UPDATE ON partnerships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_synthetic_data_templates_updated_at BEFORE UPDATE ON synthetic_data_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_synthetic_data_sessions_updated_at BEFORE UPDATE ON synthetic_data_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_created ON users(created_at);
CREATE INDEX idx_users_active ON users(is_active, created_at);

-- Organization indexes
CREATE INDEX idx_organizations_type ON organizations(org_type);
CREATE INDEX idx_organizations_industry ON organizations(industry);
CREATE INDEX idx_organizations_region ON organizations(region);

-- SSE Score indexes
CREATE INDEX idx_sse_scores_startup ON sse_scores(startup_id);
CREATE INDEX idx_sse_scores_created ON sse_scores(created_at DESC);
CREATE INDEX idx_sse_scores_synthetic ON sse_scores(is_synthetic, created_at);
CREATE INDEX idx_sse_scores_startup_version ON sse_scores(startup_id, version DESC);

-- Integration indexes
CREATE INDEX idx_integration_data_integration ON integration_data(integration_id);
CREATE INDEX idx_integration_data_timestamp ON integration_data(sync_timestamp DESC);
CREATE INDEX idx_integration_data_synthetic ON integration_data(is_synthetic, created_at);
CREATE INDEX idx_integration_data_type_timestamp ON integration_data(data_type, sync_timestamp DESC);

-- Action indexes
CREATE INDEX idx_actions_user ON actions(user_id);
CREATE INDEX idx_actions_startup ON actions(startup_id);
CREATE INDEX idx_actions_completed ON actions(completed_at DESC);
CREATE INDEX idx_actions_synthetic ON actions(is_synthetic, completed_at);
CREATE INDEX idx_actions_user_domain ON actions(user_id, domain, completed_at DESC);

-- Dashboard metrics indexes
CREATE INDEX idx_dashboard_metrics_user ON dashboard_metrics(user_id);
CREATE INDEX idx_dashboard_metrics_org ON dashboard_metrics(org_id);
CREATE INDEX idx_dashboard_metrics_timestamp ON dashboard_metrics(metric_timestamp DESC);
CREATE INDEX idx_dashboard_metrics_synthetic ON dashboard_metrics(is_synthetic, metric_timestamp);
CREATE INDEX idx_dashboard_metrics_composite ON dashboard_metrics(user_id, dashboard_type, metric_timestamp DESC);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on sensitive tables
ALTER TABLE sse_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY user_own_sse_scores ON sse_scores
    FOR ALL TO authenticated_users
    USING (startup_id IN (
        SELECT org_id FROM user_organizations 
        WHERE user_id = current_user_id()
    ));

CREATE POLICY user_own_metrics ON dashboard_metrics
    FOR ALL TO authenticated_users
    USING (user_id = current_user_id() OR org_id IN (
        SELECT org_id FROM user_organizations 
        WHERE user_id = current_user_id()
    ));

CREATE POLICY user_own_actions ON actions
    FOR ALL TO authenticated_users
    USING (user_id = current_user_id());

-- =============================================
-- INITIAL DATA AND CONFIGURATION
-- =============================================

-- Insert default synthetic data templates
INSERT INTO synthetic_data_templates (template_name, template_type, user_type, data_schema, generation_rules) VALUES
('Startup Founder Metrics', 'dashboard_metrics', 'startup_founder', 
 '{"sse_score": "integer", "revenue": "decimal", "customers": "integer", "team_size": "integer"}',
 '{"sse_score": {"min": 45, "max": 95, "trend": "improving"}, "revenue": {"growth_rate": 0.15, "variance": 0.3}}'),
 
('VC Portfolio Data', 'portfolio_metrics', 'venture_capital',
 '{"portfolio_size": "integer", "total_aum": "decimal", "active_deals": "integer"}',
 '{"portfolio_size": {"min": 10, "max": 50}, "total_aum": {"min": 10000000, "max": 500000000}}'),
 
('Angel Investment Tracking', 'investment_metrics', 'angel_investor',
 '{"investments_count": "integer", "total_invested": "decimal", "exits": "integer"}',
 '{"investments_count": {"min": 5, "max": 25}, "total_invested": {"min": 100000, "max": 2000000}}');

-- Create default admin user (for testing)
INSERT INTO users (email, password_hash, user_type, profile) VALUES
('admin@auxeira.com', crypt('admin123', gen_salt('bf')), 'startup_founder', 
 '{"firstName": "Admin", "lastName": "User", "role": "System Administrator"}');

-- Success message
SELECT 'Auxeira Central Database initialized successfully!' as status;
