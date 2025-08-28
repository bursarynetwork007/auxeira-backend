-- Auxeira SSE Platform Database Schema
-- Complete migration for all tables and relationships

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create custom types
CREATE TYPE user_role AS ENUM ('student', 'founder', 'investor', 'admin', 'super_admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium', 'enterprise');
CREATE TYPE organization_type AS ENUM ('startup', 'corporation', 'ngo', 'government', 'academic');
CREATE TYPE partnership_status AS ENUM ('pending', 'active', 'completed', 'cancelled');
CREATE TYPE mentorship_status AS ENUM ('active', 'paused', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('email', 'push', 'sms', 'in_app');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- =============================================================================
-- USERS AND AUTHENTICATION
-- =============================================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    status user_status NOT NULL DEFAULT 'pending_verification',
    subscription_tier subscription_tier NOT NULL DEFAULT 'free',

    -- Profile information
    profile_picture TEXT,
    phone_number VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(30),

    -- Location
    country VARCHAR(100),
    city VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',

    -- Organization association
    organization_id UUID,
    organization_role VARCHAR(100),

    -- Account verification
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,

    -- Security
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_active_at TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,

    -- Preferences (stored as JSONB for flexibility)
    preferences JSONB DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- User sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,

    -- Device information
    user_agent TEXT,
    ip_address INET,
    device_type VARCHAR(50),
    os VARCHAR(50),
    browser VARCHAR(50),
    location VARCHAR(100),

    -- Session status
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activities table (audit log)
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email verification tokens
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ORGANIZATIONS
-- =============================================================================

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    type organization_type NOT NULL,
    description TEXT,
    website VARCHAR(255),
    logo TEXT,

    -- Contact information
    email VARCHAR(255),
    phone VARCHAR(20),

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),

    -- Organization details
    founded_year INTEGER,
    employee_count INTEGER,
    industry VARCHAR(100),

    -- Settings
    settings JSONB DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- SSE SCORING SYSTEM
-- =============================================================================

-- SSE scores table (main scoring data)
CREATE TABLE sse_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),

    -- Overall scores
    overall_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    social_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    sustainability_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    economic_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,

    -- Score components (detailed breakdown)
    score_components JSONB DEFAULT '{}',

    -- Benchmarking
    industry_percentile DECIMAL(5,2),
    peer_percentile DECIMAL(5,2),

    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SSE metrics table (individual metric values)
CREATE TABLE sse_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),

    -- Metric identification
    metric_category VARCHAR(50) NOT NULL, -- 'social', 'sustainability', 'economic'
    metric_name VARCHAR(100) NOT NULL,
    metric_code VARCHAR(50) NOT NULL,

    -- Metric value
    value DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20),
    weight DECIMAL(5,4) DEFAULT 1.0000,

    -- Data source
    data_source VARCHAR(100),
    data_quality_score DECIMAL(3,2) DEFAULT 1.00,

    -- Metadata
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SSE benchmarks table
CREATE TABLE sse_benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    industry VARCHAR(100) NOT NULL,
    organization_size VARCHAR(50) NOT NULL,
    region VARCHAR(100) NOT NULL,

    -- Benchmark scores
    social_p25 DECIMAL(5,2),
    social_p50 DECIMAL(5,2),
    social_p75 DECIMAL(5,2),
    social_p90 DECIMAL(5,2),

    sustainability_p25 DECIMAL(5,2),
    sustainability_p50 DECIMAL(5,2),
    sustainability_p75 DECIMAL(5,2),
    sustainability_p90 DECIMAL(5,2),

    economic_p25 DECIMAL(5,2),
    economic_p50 DECIMAL(5,2),
    economic_p75 DECIMAL(5,2),
    economic_p90 DECIMAL(5,2),

    -- Sample size
    sample_size INTEGER NOT NULL,

    -- Metadata
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- BEHAVIORAL TRACKING
-- =============================================================================

-- User behaviors table
CREATE TABLE user_behaviors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Behavior details
    behavior_type VARCHAR(100) NOT NULL,
    behavior_category VARCHAR(50) NOT NULL,
    behavior_data JSONB DEFAULT '{}',

    -- Impact on SSE
    social_impact DECIMAL(5,4) DEFAULT 0.0000,
    sustainability_impact DECIMAL(5,4) DEFAULT 0.0000,
    economic_impact DECIMAL(5,4) DEFAULT 0.0000,

    -- Metadata
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily questions table
CREATE TABLE daily_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,

    -- Question options (for multiple choice)
    options JSONB,

    -- Scoring weights
    social_weight DECIMAL(5,4) DEFAULT 0.0000,
    sustainability_weight DECIMAL(5,4) DEFAULT 0.0000,
    economic_weight DECIMAL(5,4) DEFAULT 0.0000,

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User question responses table
CREATE TABLE user_question_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES daily_questions(id),

    -- Response data
    response_value TEXT NOT NULL,
    response_data JSONB DEFAULT '{}',

    -- Calculated impact
    social_impact DECIMAL(5,4) DEFAULT 0.0000,
    sustainability_impact DECIMAL(5,4) DEFAULT 0.0000,
    economic_impact DECIMAL(5,4) DEFAULT 0.0000,

    -- Metadata
    responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- AI MENTORSHIP
-- =============================================================================

-- AI mentorship sessions table
CREATE TABLE ai_mentorship_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Session details
    session_type VARCHAR(50) NOT NULL,
    topic VARCHAR(100),
    status mentorship_status DEFAULT 'active',

    -- AI configuration
    ai_model VARCHAR(50) DEFAULT 'gpt-4',
    ai_personality VARCHAR(50) DEFAULT 'supportive',

    -- Session metadata
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI mentorship messages table
CREATE TABLE ai_mentorship_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES ai_mentorship_sessions(id) ON DELETE CASCADE,

    -- Message details
    sender VARCHAR(20) NOT NULL, -- 'user' or 'ai'
    message_text TEXT NOT NULL,
    message_data JSONB DEFAULT '{}',

    -- AI response metadata
    ai_model VARCHAR(50),
    tokens_used INTEGER,
    response_time_ms INTEGER,

    -- Metadata
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PARTNERSHIPS
-- =============================================================================

-- Partnerships table
CREATE TABLE partnerships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id),
    partner_id UUID NOT NULL REFERENCES users(id),

    -- Partnership details
    partnership_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status partnership_status DEFAULT 'pending',

    -- Terms and conditions
    terms JSONB DEFAULT '{}',

    -- Timeline
    start_date DATE,
    end_date DATE,

    -- Metadata
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notification details
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',

    -- Delivery status
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PAYMENTS AND SUBSCRIPTIONS
-- =============================================================================

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Subscription details
    tier subscription_tier NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',

    -- Billing
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),

    -- Pricing
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_cycle VARCHAR(20) DEFAULT 'monthly',

    -- Timeline
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_end TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),

    -- Payment details
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status payment_status DEFAULT 'pending',

    -- Payment method
    payment_method VARCHAR(50),

    -- Metadata
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Mentorship Sessions
CREATE TABLE ai_mentorship_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('goal_setting', 'score_improvement', 'career_guidance', 'sustainability_advice', 'general_chat')),
    topic VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    ai_model VARCHAR(50) NOT NULL DEFAULT 'gpt-4',
    ai_personality VARCHAR(20) NOT NULL DEFAULT 'supportive' CHECK (ai_personality IN ('supportive', 'challenging', 'analytical', 'creative', 'professional')),
    user_context JSONB NOT NULL,
    session_goals JSONB DEFAULT '[]',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    message_count INTEGER DEFAULT 0,
    user_satisfaction_rating INTEGER CHECK (user_satisfaction_rating >= 1 AND user_satisfaction_rating <= 5),
    ai_response_quality DECIMAL(3,2),
    goal_achievement_progress DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- AI Mentorship Messages
CREATE TABLE ai_mentorship_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ai_mentorship_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
    message_text TEXT NOT NULL,
    message_data JSONB,
    ai_model VARCHAR(50),
    tokens_used INTEGER,
    response_time_ms INTEGER,
    confidence DECIMAL(3,2),
    context_used JSONB,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_feedback TEXT,
    was_helpful BOOLEAN,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Mentorship Goals
CREATE TABLE mentorship_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES ai_mentorship_sessions(id) ON DELETE SET NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('social', 'sustainability', 'economic', 'career', 'personal')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    target_value DECIMAL(10,2),
    current_value DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(20),
    target_date DATE,
    created_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused', 'cancelled')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    milestones JSONB DEFAULT '[]',
    ai_recommendations JSONB DEFAULT '[]',
    suggested_actions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Mentorship Insights
CREATE TABLE mentorship_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES ai_mentorship_sessions(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('pattern_recognition', 'improvement_opportunity', 'strength_identification', 'risk_warning', 'achievement_recognition')),
    category VARCHAR(20) NOT NULL CHECK (category IN ('social', 'sustainability', 'economic', 'behavioral', 'goal_progress')),
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    significance VARCHAR(10) NOT NULL CHECK (significance IN ('high', 'medium', 'low')),
    data_points JSONB DEFAULT '[]',
    confidence DECIMAL(3,2) NOT NULL,
    actionable_recommendations JSONB DEFAULT '[]',
    related_resources JSONB DEFAULT '[]',
    user_acknowledged BOOLEAN DEFAULT FALSE,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_notes TEXT,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_ai_mentorship_sessions_user_id ON ai_mentorship_sessions(user_id);
CREATE INDEX idx_ai_mentorship_sessions_status ON ai_mentorship_sessions(status);
CREATE INDEX idx_ai_mentorship_messages_session_id ON ai_mentorship_messages(session_id);
CREATE INDEX idx_ai_mentorship_messages_sent_at ON ai_mentorship_messages(sent_at);
CREATE INDEX idx_mentorship_goals_user_id ON mentorship_goals(user_id);
CREATE INDEX idx_mentorship_goals_status ON mentorship_goals(status);
CREATE INDEX idx_mentorship_insights_user_id ON mentorship_insights(user_id);
CREATE INDEX idx_mentorship_insights_generated_at ON mentorship_insights(generated_at);





-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_email_verified ON users(email_verified);

-- Sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- SSE scores indexes
CREATE INDEX idx_sse_scores_user_id ON sse_scores(user_id);
CREATE INDEX idx_sse_scores_organization_id ON sse_scores(organization_id);
CREATE INDEX idx_sse_scores_calculated_at ON sse_scores(calculated_at);
CREATE INDEX idx_sse_scores_overall_score ON sse_scores(overall_score);

-- SSE metrics indexes
CREATE INDEX idx_sse_metrics_user_id ON sse_metrics(user_id);
CREATE INDEX idx_sse_metrics_category ON sse_metrics(metric_category);
CREATE INDEX idx_sse_metrics_name ON sse_metrics(metric_name);
CREATE INDEX idx_sse_metrics_measured_at ON sse_metrics(measured_at);

-- Behaviors indexes
CREATE INDEX idx_user_behaviors_user_id ON user_behaviors(user_id);
CREATE INDEX idx_user_behaviors_type ON user_behaviors(behavior_type);
CREATE INDEX idx_user_behaviors_occurred_at ON user_behaviors(occurred_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Full-text search indexes
CREATE INDEX idx_users_search ON users USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || email));
CREATE INDEX idx_organizations_search ON organizations USING gin(to_tsvector('english', name || ' ' || description));

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_questions_updated_at BEFORE UPDATE ON daily_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_mentorship_sessions_updated_at BEFORE UPDATE ON ai_mentorship_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partnerships_updated_at BEFORE UPDATE ON partnerships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert default daily questions
INSERT INTO daily_questions (question_text, question_type, category, options, social_weight, sustainability_weight, economic_weight) VALUES
('How many hours did you volunteer or help others today?', 'numeric', 'social', '{"min": 0, "max": 24, "unit": "hours"}', 0.8000, 0.1000, 0.1000),
('Did you use public transportation, bike, or walk instead of driving today?', 'boolean', 'sustainability', '{"yes": "Yes", "no": "No"}', 0.2000, 0.7000, 0.1000),
('How much money did you save or invest today?', 'numeric', 'economic', '{"min": 0, "max": 10000, "unit": "dollars"}', 0.1000, 0.1000, 0.8000),
('Did you mentor or teach someone new skills today?', 'boolean', 'social', '{"yes": "Yes", "no": "No"}', 0.9000, 0.0500, 0.0500),
('How many single-use items did you avoid using today?', 'numeric', 'sustainability', '{"min": 0, "max": 50, "unit": "items"}', 0.1000, 0.8000, 0.1000);

-- Insert SSE benchmarks (sample data)
INSERT INTO sse_benchmarks (industry, organization_size, region, social_p25, social_p50, social_p75, social_p90, sustainability_p25, sustainability_p50, sustainability_p75, sustainability_p90, economic_p25, economic_p50, economic_p75, economic_p90, sample_size, period_start, period_end) VALUES
('technology', 'startup', 'north_america', 65.0, 75.0, 85.0, 92.0, 60.0, 70.0, 80.0, 90.0, 70.0, 80.0, 88.0, 95.0, 1000, '2024-01-01', '2024-12-31'),
('healthcare', 'small', 'europe', 70.0, 80.0, 88.0, 94.0, 75.0, 82.0, 90.0, 95.0, 65.0, 75.0, 85.0, 92.0, 500, '2024-01-01', '2024-12-31'),
('education', 'medium', 'global', 80.0, 88.0, 93.0, 97.0, 70.0, 78.0, 86.0, 93.0, 60.0, 70.0, 80.0, 88.0, 750, '2024-01-01', '2024-12-31');

COMMIT;
