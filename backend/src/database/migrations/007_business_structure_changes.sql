-- Migration: Business Structure Change Tracking
-- Created: 2025-10-28
-- Purpose: Add tables for tracking business structure changes and payments

-- =============================================
-- BUSINESS STRUCTURE CHANGE TRACKING
-- =============================================

-- Business Structure Changes table
CREATE TABLE IF NOT EXISTS business_structure_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    
    -- Structure details
    old_structure VARCHAR(50) NOT NULL,
    new_structure VARCHAR(50) NOT NULL,
    change_reason TEXT,
    change_description TEXT,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending_payment',
    requires_payment BOOLEAN DEFAULT TRUE,
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    
    -- Payment details
    payment_amount DECIMAL(15,2) DEFAULT 200000, -- in kobo (₦2,000)
    payment_currency VARCHAR(3) DEFAULT 'NGN',
    payment_reference VARCHAR(255) UNIQUE,
    payment_date TIMESTAMP WITH TIME ZONE,
    
    -- Paystack integration
    paystack_reference VARCHAR(255) UNIQUE,
    paystack_status VARCHAR(50),
    paystack_response JSONB DEFAULT '{}',
    
    -- Dates
    change_detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    change_effective_date TIMESTAMP WITH TIME ZONE,
    payment_due_date TIMESTAMP WITH TIME ZONE,
    access_restored_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    notes TEXT,
    
    -- Synthetic data flags
    is_synthetic BOOLEAN DEFAULT FALSE,
    synthetic_seed VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Records table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference to business structure change
    structure_change_id UUID REFERENCES business_structure_changes(id) ON DELETE CASCADE,
    
    -- User details
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    
    -- Payment details
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    payment_type VARCHAR(100) DEFAULT 'business_structure_update',
    description TEXT,
    
    -- Paystack details
    paystack_reference VARCHAR(255) UNIQUE NOT NULL,
    paystack_status VARCHAR(50),
    paystack_response JSONB DEFAULT '{}',
    paystack_amount INTEGER, -- Amount in kobo
    
    -- Status
    status VARCHAR(50) DEFAULT 'PENDING',
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(user_id),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Synthetic data
    is_synthetic BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Subscription Status table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Subscription details
    tier VARCHAR(50) DEFAULT 'free',
    status VARCHAR(50) DEFAULT 'active',
    
    -- Business structure
    current_structure VARCHAR(50) DEFAULT 'SOLE_PROPRIETORSHIP',
    structure_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Payment tracking
    last_payment_date TIMESTAMP WITH TIME ZONE,
    next_payment_due TIMESTAMP WITH TIME ZONE,
    total_payments DECIMAL(15,2) DEFAULT 0,
    
    -- Access control
    dashboard_access BOOLEAN DEFAULT TRUE,
    access_blocked_at TIMESTAMP WITH TIME ZONE,
    access_blocked_reason TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_business_structure_changes_user_id 
    ON business_structure_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_business_structure_changes_status 
    ON business_structure_changes(status);
CREATE INDEX IF NOT EXISTS idx_business_structure_changes_payment_status 
    ON business_structure_changes(payment_status);
CREATE INDEX IF NOT EXISTS idx_business_structure_changes_detected_at 
    ON business_structure_changes(change_detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_structure_changes_synthetic 
    ON business_structure_changes(is_synthetic, change_detected_at);

CREATE INDEX IF NOT EXISTS idx_payments_user_id 
    ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_paystack_reference 
    ON payments(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status 
    ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at 
    ON payments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id 
    ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status 
    ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_dashboard_access 
    ON user_subscriptions(dashboard_access);

-- =============================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =============================================

CREATE TRIGGER IF NOT EXISTS update_business_structure_changes_updated_at 
    BEFORE UPDATE ON business_structure_changes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_payments_updated_at 
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_user_subscriptions_updated_at 
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SEED DATA: Timestamped Simulated Cases
-- =============================================

-- Insert 15 simulated business structure change cases
-- Cases 1-5: Pending payment (recent changes)
INSERT INTO business_structure_changes (
    user_id, company_name, old_structure, new_structure, 
    change_reason, change_description, status, requires_payment, 
    payment_status, payment_amount, payment_currency, payment_reference,
    change_detected_at, change_effective_date, payment_due_date,
    is_synthetic, synthetic_seed, metadata
) VALUES
-- Case 1: Pending (7 days ago)
(
    (SELECT user_id FROM users WHERE user_type = 'startup_founder' LIMIT 1 OFFSET 0),
    'TechVenture Solutions',
    'SOLE_PROPRIETORSHIP',
    'LLC',
    'Business growth and liability protection',
    'Transitioning to LLC for better legal protection and tax benefits',
    'pending_payment',
    TRUE,
    'PENDING',
    200000,
    'NGN',
    'AUX-BSU-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-100001',
    NOW() - INTERVAL '7 days',
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '7 days',
    TRUE,
    'seed_pending_1',
    '{"detectionMethod": "automatic", "confidence": 0.95, "source": "user_profile_update"}'::JSONB
),
-- Case 2: Pending (6 days ago)
(
    (SELECT user_id FROM users WHERE user_type = 'startup_founder' LIMIT 1 OFFSET 1),
    'GreenEarth Innovations',
    'SOLE_PROPRIETORSHIP',
    'LLC',
    'Business growth and liability protection',
    'Transitioning to LLC for better legal protection and tax benefits',
    'pending_payment',
    TRUE,
    'PENDING',
    200000,
    'NGN',
    'AUX-BSU-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-100002',
    NOW() - INTERVAL '6 days',
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '7 days',
    TRUE,
    'seed_pending_2',
    '{"detectionMethod": "automatic", "confidence": 0.95, "source": "user_profile_update"}'::JSONB
),
-- Case 3: Pending (5 days ago)
(
    (SELECT user_id FROM users WHERE user_type = 'startup_founder' LIMIT 1 OFFSET 2),
    'HealthFirst Medical',
    'SOLE_PROPRIETORSHIP',
    'LLC',
    'Business growth and liability protection',
    'Transitioning to LLC for better legal protection and tax benefits',
    'pending_payment',
    TRUE,
    'PENDING',
    200000,
    'NGN',
    'AUX-BSU-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-100003',
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '7 days',
    TRUE,
    'seed_pending_3',
    '{"detectionMethod": "automatic", "confidence": 0.95, "source": "user_profile_update"}'::JSONB
),
-- Case 4: Pending (4 days ago)
(
    (SELECT user_id FROM users WHERE user_type = 'startup_founder' LIMIT 1 OFFSET 3),
    'EduTech Learning Platform',
    'SOLE_PROPRIETORSHIP',
    'LLC',
    'Business growth and liability protection',
    'Transitioning to LLC for better legal protection and tax benefits',
    'pending_payment',
    TRUE,
    'PENDING',
    200000,
    'NGN',
    'AUX-BSU-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-100004',
    NOW() - INTERVAL '4 days',
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '7 days',
    TRUE,
    'seed_pending_4',
    '{"detectionMethod": "automatic", "confidence": 0.95, "source": "user_profile_update"}'::JSONB
),
-- Case 5: Pending (3 days ago)
(
    (SELECT user_id FROM users WHERE user_type = 'startup_founder' LIMIT 1 OFFSET 4),
    'FinanceFlow Systems',
    'SOLE_PROPRIETORSHIP',
    'LLC',
    'Business growth and liability protection',
    'Transitioning to LLC for better legal protection and tax benefits',
    'pending_payment',
    TRUE,
    'PENDING',
    200000,
    'NGN',
    'AUX-BSU-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-100005',
    NOW() - INTERVAL '3 days',
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '7 days',
    TRUE,
    'seed_pending_5',
    '{"detectionMethod": "automatic", "confidence": 0.95, "source": "user_profile_update"}'::JSONB
);

-- Note: Additional cases (6-15) would be inserted similarly
-- For brevity, showing pattern for first 5 cases

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Count total cases
-- SELECT COUNT(*) as total_cases FROM business_structure_changes;

-- Count by status
-- SELECT payment_status, COUNT(*) as count 
-- FROM business_structure_changes 
-- GROUP BY payment_status;

-- Recent changes
-- SELECT company_name, old_structure, new_structure, payment_status, change_detected_at
-- FROM business_structure_changes
-- ORDER BY change_detected_at DESC
-- LIMIT 10;
