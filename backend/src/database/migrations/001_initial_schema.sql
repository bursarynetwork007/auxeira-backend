-- =====================================================
-- AUXEIRA INITIAL SCHEMA MIGRATION
-- =====================================================
-- Initial database schema for core platform functionality
-- Migration: 001_initial_schema
-- Created: 2025-08-31
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE USER MANAGEMENT
-- =====================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(200),
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'investor', 'partner')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_company ON users(company_name);

-- User sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Indexes for user sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;

-- =====================================================
-- STARTUP MANAGEMENT
-- =====================================================

-- Startups table
CREATE TABLE startups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(200) NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    stage VARCHAR(50) CHECK (stage IN ('idea', 'prototype', 'mvp', 'early_revenue', 'growth', 'scale')),
    founded_date DATE,
    website VARCHAR(255),
    location VARCHAR(200),
    team_size INTEGER,
    funding_raised DECIMAL(15,2) DEFAULT 0,
    valuation DECIMAL(15,2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for startups
CREATE INDEX idx_startups_user_id ON startups(user_id);
CREATE INDEX idx_startups_industry ON startups(industry);
CREATE INDEX idx_startups_stage ON startups(stage);
CREATE INDEX idx_startups_active ON startups(is_active) WHERE is_active = true;
CREATE INDEX idx_startups_company_name ON startups(company_name);

-- =====================================================
-- SSE SCORING SYSTEM
-- =====================================================

-- SSE scores table
CREATE TABLE sse_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
    current_score INTEGER NOT NULL CHECK (current_score >= 0 AND current_score <= 100),
    previous_score INTEGER,
    score_change INTEGER GENERATED ALWAYS AS (current_score - COALESCE(previous_score, current_score)) STORED,
    components JSONB NOT NULL DEFAULT '{}'::jsonb,
    calculation_method VARCHAR(50) NOT NULL DEFAULT 'standard',
    confidence_level DECIMAL(4,3) NOT NULL DEFAULT 0.85,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for SSE scores
CREATE INDEX idx_sse_scores_user_id ON sse_scores(user_id);
CREATE INDEX idx_sse_scores_startup_id ON sse_scores(startup_id);
CREATE INDEX idx_sse_scores_current_score ON sse_scores(current_score DESC);
CREATE INDEX idx_sse_scores_created_at ON sse_scores(created_at DESC);
CREATE INDEX idx_sse_scores_score_change ON sse_scores(score_change DESC);

-- SSE components table
CREATE TABLE sse_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    score_id UUID NOT NULL REFERENCES sse_scores(id) ON DELETE CASCADE,
    component_name VARCHAR(50) NOT NULL,
    component_score INTEGER NOT NULL CHECK (component_score >= 0 AND component_score <= 100),
    weight DECIMAL(4,3) NOT NULL,
    sub_components JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for SSE components
CREATE INDEX idx_sse_components_score_id ON sse_components(score_id);
CREATE INDEX idx_sse_components_name ON sse_components(component_name);
CREATE INDEX idx_sse_components_score ON sse_components(component_score DESC);

-- =====================================================
-- SUBSCRIPTION MANAGEMENT
-- =====================================================

-- Subscription plans table
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    billing_interval VARCHAR(20) NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    limits JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User subscriptions table
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_end TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for subscriptions
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = true;
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_stripe_id ON user_subscriptions(stripe_subscription_id);

-- =====================================================
-- SCHEMA MIGRATIONS TRACKING
-- =====================================================

-- Schema migrations table
CREATE TABLE schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INTEGER,
    checksum VARCHAR(64)
);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_startups_timestamp
    BEFORE UPDATE ON startups
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_subscription_plans_timestamp
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_user_subscriptions_timestamp
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, base_price, billing_interval, features, limits) VALUES
('Founder', 'Free tier for early-stage founders', 0.00, 'monthly',
 '["Basic SSE scoring", "Limited AI mentorship", "Community access"]'::jsonb,
 '{"sse_calculations": 10, "ai_sessions": 5, "api_calls": 100}'::jsonb),
('Startup', 'For growing startups', 99.00, 'monthly',
 '["Advanced SSE scoring", "Unlimited AI mentorship", "Partnership access", "Basic analytics"]'::jsonb,
 '{"sse_calculations": 100, "ai_sessions": -1, "api_calls": 1000}'::jsonb),
('Growth', 'For scaling companies', 299.00, 'monthly',
 '["Premium SSE scoring", "Priority AI mentorship", "Investor introductions", "Advanced analytics"]'::jsonb,
 '{"sse_calculations": 500, "ai_sessions": -1, "api_calls": 5000}'::jsonb),
('Scale', 'For established companies', 699.00, 'monthly',
 '["Enterprise SSE scoring", "Dedicated support", "Custom integrations", "White-label options"]'::jsonb,
 '{"sse_calculations": -1, "ai_sessions": -1, "api_calls": 25000}'::jsonb),
('Enterprise', 'Custom enterprise solutions', 1999.00, 'monthly',
 '["Custom SSE models", "Dedicated account manager", "API access", "Custom reporting"]'::jsonb,
 '{"sse_calculations": -1, "ai_sessions": -1, "api_calls": -1}'::jsonb);

-- Record migration
INSERT INTO schema_migrations (version, description) VALUES
('001_initial_schema', 'Initial database schema with core functionality');
