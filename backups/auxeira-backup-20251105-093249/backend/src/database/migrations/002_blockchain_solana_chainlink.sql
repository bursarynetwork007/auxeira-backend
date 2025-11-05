-- =====================================================
-- AUXEIRA BLOCKCHAIN MIGRATIONS - SOLANA + CHAINLINK
-- =====================================================
-- Database migrations for Solana and Chainlink integration
-- Focused implementation for immediate deployment
-- Created: 2025-08-31
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SOLANA WALLET MANAGEMENT
-- =====================================================

-- Solana wallets table
CREATE TABLE solana_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    public_key VARCHAR(44) NOT NULL UNIQUE, -- Base58 encoded public key
    wallet_type VARCHAR(20) NOT NULL DEFAULT 'custodial' CHECK (wallet_type IN ('custodial', 'non_custodial')),
    balance BIGINT NOT NULL DEFAULT 0, -- SOL balance in lamports
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for Solana wallets
CREATE INDEX idx_solana_wallets_user_id ON solana_wallets(user_id);
CREATE INDEX idx_solana_wallets_public_key ON solana_wallets(public_key);
CREATE INDEX idx_solana_wallets_active ON solana_wallets(is_active) WHERE is_active = true;
CREATE INDEX idx_solana_wallets_last_used ON solana_wallets(last_used_at DESC);

-- Solana token accounts table
CREATE TABLE solana_token_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES solana_wallets(id) ON DELETE CASCADE,
    mint_address VARCHAR(44) NOT NULL, -- Token mint address
    account_address VARCHAR(44) NOT NULL UNIQUE, -- Token account address
    balance BIGINT NOT NULL DEFAULT 0, -- Token balance in smallest unit
    decimals INTEGER NOT NULL DEFAULT 9,
    symbol VARCHAR(20),
    name VARCHAR(100),
    logo_uri TEXT,
    is_native BOOLEAN NOT NULL DEFAULT false,
    is_frozen BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for Solana token accounts
CREATE INDEX idx_solana_token_accounts_wallet_id ON solana_token_accounts(wallet_id);
CREATE INDEX idx_solana_token_accounts_mint ON solana_token_accounts(mint_address);
CREATE INDEX idx_solana_token_accounts_symbol ON solana_token_accounts(symbol);
CREATE INDEX idx_solana_token_accounts_balance ON solana_token_accounts(balance DESC) WHERE balance > 0;

-- Solana transactions table
CREATE TABLE solana_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES solana_wallets(id) ON DELETE SET NULL,
    signature VARCHAR(88) NOT NULL UNIQUE, -- Base58 encoded signature
    slot BIGINT NOT NULL,
    block_time TIMESTAMP WITH TIME ZONE NOT NULL,
    from_address VARCHAR(44),
    to_address VARCHAR(44),
    amount BIGINT, -- Amount in lamports or token smallest unit
    token_mint VARCHAR(44), -- NULL for SOL transactions
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN (
        'transfer', 'token_transfer', 'stake', 'unstake', 'vote', 'create_account',
        'close_account', 'mint_token', 'burn_token', 'program_interaction', 'other'
    )),
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'failed')),
    fee BIGINT NOT NULL DEFAULT 0, -- Transaction fee in lamports
    compute_units_consumed INTEGER,
    instructions JSONB DEFAULT '[]'::jsonb, -- Array of instruction details
    logs JSONB DEFAULT '[]'::jsonb, -- Transaction logs
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for Solana transactions
CREATE INDEX idx_solana_transactions_user_id ON solana_transactions(user_id);
CREATE INDEX idx_solana_transactions_wallet_id ON solana_transactions(wallet_id);
CREATE INDEX idx_solana_transactions_signature ON solana_transactions(signature);
CREATE INDEX idx_solana_transactions_slot ON solana_transactions(slot DESC);
CREATE INDEX idx_solana_transactions_type ON solana_transactions(transaction_type);
CREATE INDEX idx_solana_transactions_status ON solana_transactions(status);
CREATE INDEX idx_solana_transactions_block_time ON solana_transactions(block_time DESC);
CREATE INDEX idx_solana_transactions_from_to ON solana_transactions(from_address, to_address);

-- =====================================================
-- SOLANA STAKING SYSTEM
-- =====================================================

-- Solana staking pools table
CREATE TABLE solana_staking_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pool_address VARCHAR(44) NOT NULL UNIQUE,
    validator_address VARCHAR(44) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    commission_rate DECIMAL(5,4) NOT NULL, -- e.g., 0.0500 for 5%
    apy DECIMAL(8,4) NOT NULL DEFAULT 0, -- Annual percentage yield
    total_staked BIGINT NOT NULL DEFAULT 0, -- Total SOL staked in lamports
    total_rewards BIGINT NOT NULL DEFAULT 0, -- Total rewards distributed
    staker_count INTEGER NOT NULL DEFAULT 0,
    minimum_stake BIGINT NOT NULL DEFAULT 1000000000, -- 1 SOL minimum
    maximum_stake BIGINT, -- NULL for no limit
    lockup_period INTEGER NOT NULL DEFAULT 0, -- Lockup period in epochs
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for Solana staking pools
CREATE INDEX idx_solana_staking_pools_validator ON solana_staking_pools(validator_address);
CREATE INDEX idx_solana_staking_pools_active ON solana_staking_pools(is_active) WHERE is_active = true;
CREATE INDEX idx_solana_staking_pools_apy ON solana_staking_pools(apy DESC);
CREATE INDEX idx_solana_staking_pools_total_staked ON solana_staking_pools(total_staked DESC);

-- Solana staking positions table
CREATE TABLE solana_staking_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES solana_wallets(id) ON DELETE CASCADE,
    pool_id UUID NOT NULL REFERENCES solana_staking_pools(id) ON DELETE CASCADE,
    stake_account_address VARCHAR(44) NOT NULL UNIQUE,
    staked_amount BIGINT NOT NULL, -- Staked amount in lamports
    reward_amount BIGINT NOT NULL DEFAULT 0, -- Accumulated rewards
    activation_epoch BIGINT NOT NULL,
    deactivation_epoch BIGINT, -- NULL if still active
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deactivating', 'withdrawing')),
    multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00, -- Performance multiplier based on SSE score
    last_reward_calculation TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for Solana staking positions
CREATE INDEX idx_solana_staking_positions_user_id ON solana_staking_positions(user_id);
CREATE INDEX idx_solana_staking_positions_wallet_id ON solana_staking_positions(wallet_id);
CREATE INDEX idx_solana_staking_positions_pool_id ON solana_staking_positions(pool_id);
CREATE INDEX idx_solana_staking_positions_status ON solana_staking_positions(status);
CREATE INDEX idx_solana_staking_positions_activation ON solana_staking_positions(activation_epoch DESC);

-- Solana staking rewards table
CREATE TABLE solana_staking_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID NOT NULL REFERENCES solana_staking_positions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    epoch BIGINT NOT NULL,
    reward_amount BIGINT NOT NULL, -- Reward amount in lamports
    commission_amount BIGINT NOT NULL DEFAULT 0, -- Commission paid to validator
    apy_at_epoch DECIMAL(8,4) NOT NULL,
    multiplier_applied DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    is_claimed BOOLEAN NOT NULL DEFAULT false,
    claimed_at TIMESTAMP WITH TIME ZONE,
    claim_transaction VARCHAR(88), -- Claim transaction signature
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for Solana staking rewards
CREATE INDEX idx_solana_staking_rewards_position_id ON solana_staking_rewards(position_id);
CREATE INDEX idx_solana_staking_rewards_user_id ON solana_staking_rewards(user_id);
CREATE INDEX idx_solana_staking_rewards_epoch ON solana_staking_rewards(epoch DESC);
CREATE INDEX idx_solana_staking_rewards_unclaimed ON solana_staking_rewards(is_claimed) WHERE is_claimed = false;
CREATE INDEX idx_solana_staking_rewards_earned_at ON solana_staking_rewards(earned_at DESC);

-- =====================================================
-- SOLANA GOVERNANCE SYSTEM
-- =====================================================

-- Solana governance proposals table
CREATE TABLE solana_governance_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_address VARCHAR(44) NOT NULL UNIQUE,
    governance_address VARCHAR(44) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    proposer VARCHAR(44) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN (
        'parameter_change', 'treasury', 'upgrade', 'partnership', 'token_economics', 'other'
    )),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'voting', 'succeeded', 'defeated', 'cancelled', 'executed'
    )),
    voting_power_total BIGINT NOT NULL DEFAULT 0,
    voting_power_yes BIGINT NOT NULL DEFAULT 0,
    voting_power_no BIGINT NOT NULL DEFAULT 0,
    quorum_required BIGINT NOT NULL,
    voting_start_slot BIGINT,
    voting_end_slot BIGINT,
    execution_slot BIGINT,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for Solana governance proposals
CREATE INDEX idx_solana_governance_proposals_governance ON solana_governance_proposals(governance_address);
CREATE INDEX idx_solana_governance_proposals_proposer ON solana_governance_proposals(proposer);
CREATE INDEX idx_solana_governance_proposals_status ON solana_governance_proposals(status);
CREATE INDEX idx_solana_governance_proposals_category ON solana_governance_proposals(category);
CREATE INDEX idx_solana_governance_proposals_voting_period ON solana_governance_proposals(voting_start_slot, voting_end_slot);

-- Solana governance votes table
CREATE TABLE solana_governance_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES solana_governance_proposals(id) ON DELETE CASCADE,
    voter_address VARCHAR(44) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    vote VARCHAR(10) NOT NULL CHECK (vote IN ('yes', 'no', 'abstain')),
    voting_power BIGINT NOT NULL,
    reason TEXT,
    vote_transaction VARCHAR(88) NOT NULL, -- Transaction signature
    voted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(proposal_id, voter_address)
);

-- Indexes for Solana governance votes
CREATE INDEX idx_solana_governance_votes_proposal_id ON solana_governance_votes(proposal_id);
CREATE INDEX idx_solana_governance_votes_voter ON solana_governance_votes(voter_address);
CREATE INDEX idx_solana_governance_votes_user_id ON solana_governance_votes(user_id);
CREATE INDEX idx_solana_governance_votes_vote ON solana_governance_votes(vote);
CREATE INDEX idx_solana_governance_votes_voted_at ON solana_governance_votes(voted_at DESC);

-- Solana governance delegates table
CREATE TABLE solana_governance_delegates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delegator_address VARCHAR(44) NOT NULL,
    delegate_address VARCHAR(44) NOT NULL,
    delegator_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    delegate_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    voting_power BIGINT NOT NULL,
    delegation_transaction VARCHAR(88) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    delegated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoke_transaction VARCHAR(88),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(delegator_address, delegate_address, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes for Solana governance delegates
CREATE INDEX idx_solana_governance_delegates_delegator ON solana_governance_delegates(delegator_address);
CREATE INDEX idx_solana_governance_delegates_delegate ON solana_governance_delegates(delegate_address);
CREATE INDEX idx_solana_governance_delegates_active ON solana_governance_delegates(is_active) WHERE is_active = true;
CREATE INDEX idx_solana_governance_delegates_voting_power ON solana_governance_delegates(voting_power DESC);

-- =====================================================
-- AUX TOKEN MANAGEMENT (SOLANA SPL)
-- =====================================================

-- AUX token configuration table
CREATE TABLE aux_token_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mint_address VARCHAR(44) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL DEFAULT 'Auxeira Token',
    symbol VARCHAR(10) NOT NULL DEFAULT 'AUX',
    decimals INTEGER NOT NULL DEFAULT 9,
    total_supply BIGINT NOT NULL,
    circulating_supply BIGINT NOT NULL DEFAULT 0,
    mint_authority VARCHAR(44),
    freeze_authority VARCHAR(44),
    is_mutable BOOLEAN NOT NULL DEFAULT true,
    logo_uri TEXT,
    description TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- AUX token transactions table
CREATE TABLE aux_token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN (
        'earn', 'spend', 'transfer_in', 'transfer_out', 'stake_reward', 'referral_bonus',
        'achievement_reward', 'challenge_reward', 'partnership_bonus', 'admin_award'
    )),
    amount BIGINT NOT NULL, -- Amount in smallest token unit
    balance_before BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    source_type VARCHAR(30) NOT NULL CHECK (source_type IN (
        'sse_improvement', 'daily_login', 'profile_completion', 'referral', 'staking',
        'governance_participation', 'achievement', 'challenge', 'partnership', 'admin'
    )),
    source_id VARCHAR(100), -- Reference to source record (achievement_id, challenge_id, etc.)
    multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    description TEXT,
    solana_transaction VARCHAR(88), -- Solana transaction signature if on-chain
    is_on_chain BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for AUX token transactions
CREATE INDEX idx_aux_token_transactions_user_id ON aux_token_transactions(user_id);
CREATE INDEX idx_aux_token_transactions_type ON aux_token_transactions(transaction_type);
CREATE INDEX idx_aux_token_transactions_source ON aux_token_transactions(source_type, source_id);
CREATE INDEX idx_aux_token_transactions_created_at ON aux_token_transactions(created_at DESC);
CREATE INDEX idx_aux_token_transactions_amount ON aux_token_transactions(amount DESC);
CREATE INDEX idx_aux_token_transactions_on_chain ON aux_token_transactions(is_on_chain) WHERE is_on_chain = true;

-- AUX token earning rules table
CREATE TABLE aux_token_earning_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(50) NOT NULL UNIQUE,
    source_type VARCHAR(30) NOT NULL,
    base_amount BIGINT NOT NULL, -- Base earning amount
    multiplier_formula TEXT, -- Formula for calculating multipliers
    max_daily_earnings BIGINT, -- NULL for no limit
    max_total_earnings BIGINT, -- NULL for no limit
    cooldown_period INTEGER DEFAULT 0, -- Cooldown in seconds
    requires_verification BOOLEAN NOT NULL DEFAULT false,
    sse_score_threshold INTEGER, -- Minimum SSE score required
    user_tier_requirement VARCHAR(20), -- Required subscription tier
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for AUX token earning rules
CREATE INDEX idx_aux_token_earning_rules_source_type ON aux_token_earning_rules(source_type);
CREATE INDEX idx_aux_token_earning_rules_active ON aux_token_earning_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_aux_token_earning_rules_sse_threshold ON aux_token_earning_rules(sse_score_threshold);

-- =====================================================
-- CHAINLINK ORACLE INTEGRATION
-- =====================================================

-- Chainlink price feeds table
CREATE TABLE chainlink_price_feeds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feed_address VARCHAR(42) NOT NULL UNIQUE, -- Ethereum address
    pair VARCHAR(20) NOT NULL UNIQUE, -- e.g., 'ETH/USD', 'AUX/USD'
    network VARCHAR(20) NOT NULL DEFAULT 'ethereum',
    decimals INTEGER NOT NULL,
    description TEXT,
    heartbeat INTEGER NOT NULL, -- Update frequency in seconds
    deviation_threshold DECIMAL(6,4) NOT NULL, -- Price deviation threshold
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for Chainlink price feeds
CREATE INDEX idx_chainlink_price_feeds_pair ON chainlink_price_feeds(pair);
CREATE INDEX idx_chainlink_price_feeds_network ON chainlink_price_feeds(network);
CREATE INDEX idx_chainlink_price_feeds_active ON chainlink_price_feeds(is_active) WHERE is_active = true;

-- Chainlink price data table
CREATE TABLE chainlink_price_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feed_id UUID NOT NULL REFERENCES chainlink_price_feeds(id) ON DELETE CASCADE,
    round_id BIGINT NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    confidence DECIMAL(4,3) NOT NULL DEFAULT 0.95,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    block_number BIGINT NOT NULL,
    transaction_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(feed_id, round_id)
);

-- Indexes for Chainlink price data
CREATE INDEX idx_chainlink_price_data_feed_id ON chainlink_price_data(feed_id);
CREATE INDEX idx_chainlink_price_data_updated_at ON chainlink_price_data(updated_at DESC);
CREATE INDEX idx_chainlink_price_data_round_id ON chainlink_price_data(round_id DESC);
CREATE INDEX idx_chainlink_price_data_price ON chainlink_price_data(price);

-- Chainlink VRF requests table
CREATE TABLE chainlink_vrf_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id VARCHAR(66) NOT NULL UNIQUE, -- Ethereum transaction hash
    requester_address VARCHAR(42) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    num_words INTEGER NOT NULL,
    callback_gas_limit INTEGER NOT NULL,
    request_confirmations INTEGER NOT NULL,
    key_hash VARCHAR(66) NOT NULL,
    subscription_id VARCHAR(20) NOT NULL,
    random_words BIGINT[], -- Array of random numbers
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'failed')),
    request_transaction VARCHAR(66) NOT NULL,
    fulfillment_transaction VARCHAR(66),
    gas_used INTEGER,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    purpose VARCHAR(50), -- What the randomness is used for
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for Chainlink VRF requests
CREATE INDEX idx_chainlink_vrf_requests_requester ON chainlink_vrf_requests(requester_address);
CREATE INDEX idx_chainlink_vrf_requests_user_id ON chainlink_vrf_requests(user_id);
CREATE INDEX idx_chainlink_vrf_requests_status ON chainlink_vrf_requests(status);
CREATE INDEX idx_chainlink_vrf_requests_requested_at ON chainlink_vrf_requests(requested_at DESC);
CREATE INDEX idx_chainlink_vrf_requests_purpose ON chainlink_vrf_requests(purpose);

-- Chainlink Functions requests table
CREATE TABLE chainlink_function_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id VARCHAR(66) NOT NULL UNIQUE,
    requester_address VARCHAR(42) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    source_code TEXT NOT NULL, -- JavaScript source code
    args TEXT[], -- Function arguments
    secrets_reference VARCHAR(100), -- Reference to encrypted secrets
    subscription_id VARCHAR(20) NOT NULL,
    don_id VARCHAR(50) NOT NULL,
    gas_limit INTEGER NOT NULL,
    result TEXT, -- Function execution result
    error_message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'failed')),
    request_transaction VARCHAR(66) NOT NULL,
    fulfillment_transaction VARCHAR(66),
    gas_used INTEGER,
    execution_time_ms INTEGER,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    purpose VARCHAR(50), -- What the function is used for
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for Chainlink Functions requests
CREATE INDEX idx_chainlink_function_requests_requester ON chainlink_function_requests(requester_address);
CREATE INDEX idx_chainlink_function_requests_user_id ON chainlink_function_requests(user_id);
CREATE INDEX idx_chainlink_function_requests_status ON chainlink_function_requests(status);
CREATE INDEX idx_chainlink_function_requests_requested_at ON chainlink_function_requests(requested_at DESC);
CREATE INDEX idx_chainlink_function_requests_purpose ON chainlink_function_requests(purpose);

-- =====================================================
-- EXTERNAL DATA VALIDATION (CHAINLINK POWERED)
-- =====================================================

-- External data validation requests table
CREATE TABLE external_data_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    validation_type VARCHAR(30) NOT NULL CHECK (validation_type IN (
        'company_verification', 'website_analysis', 'social_sentiment', 'market_analysis',
        'funding_verification', 'team_verification', 'regulatory_compliance'
    )),
    target_entity VARCHAR(200) NOT NULL, -- Company name, website, etc.
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
    chainlink_request_id UUID REFERENCES chainlink_function_requests(id) ON DELETE SET NULL,
    validation_score DECIMAL(5,2), -- 0-100 score
    confidence DECIMAL(4,3), -- 0-1 confidence level
    validation_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    risk_factors TEXT[],
    recommendations TEXT[],
    external_sources TEXT[],
    cost_usd DECIMAL(10,2),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE, -- When validation data expires
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for external data validations
CREATE INDEX idx_external_data_validations_type ON external_data_validations(validation_type);
CREATE INDEX idx_external_data_validations_target ON external_data_validations(target_entity);
CREATE INDEX idx_external_data_validations_user_id ON external_data_validations(user_id);
CREATE INDEX idx_external_data_validations_startup_id ON external_data_validations(startup_id);
CREATE INDEX idx_external_data_validations_status ON external_data_validations(status);
CREATE INDEX idx_external_data_validations_score ON external_data_validations(validation_score DESC);
CREATE INDEX idx_external_data_validations_requested_at ON external_data_validations(requested_at DESC);

-- External data sources table
CREATE TABLE external_data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name VARCHAR(50) NOT NULL UNIQUE,
    source_type VARCHAR(30) NOT NULL CHECK (source_type IN (
        'company_database', 'website_analyzer', 'social_media', 'financial_data',
        'market_research', 'regulatory_database', 'news_aggregator'
    )),
    api_endpoint TEXT NOT NULL,
    authentication_type VARCHAR(20) NOT NULL CHECK (authentication_type IN ('api_key', 'oauth', 'basic', 'none')),
    cost_per_request DECIMAL(8,4) NOT NULL DEFAULT 0,
    rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
    reliability_score DECIMAL(4,3) NOT NULL DEFAULT 0.95,
    average_response_time_ms INTEGER NOT NULL DEFAULT 1000,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for external data sources
CREATE INDEX idx_external_data_sources_type ON external_data_sources(source_type);
CREATE INDEX idx_external_data_sources_active ON external_data_sources(is_active) WHERE is_active = true;
CREATE INDEX idx_external_data_sources_reliability ON external_data_sources(reliability_score DESC);

-- =====================================================
-- BLOCKCHAIN ANALYTICS & MONITORING
-- =====================================================

-- Blockchain network status table
CREATE TABLE blockchain_network_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    network VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
    block_height BIGINT NOT NULL,
    block_time_ms INTEGER NOT NULL,
    tps DECIMAL(8,2) NOT NULL DEFAULT 0, -- Transactions per second
    congestion_level VARCHAR(10) NOT NULL CHECK (congestion_level IN ('low', 'medium', 'high')),
    gas_price_gwei DECIMAL(12,4), -- For Ethereum-based networks
    sol_price_lamports BIGINT, -- For Solana
    last_block_hash VARCHAR(88),
    validator_count INTEGER,
    stake_ratio DECIMAL(4,3), -- Percentage of tokens staked
    issues TEXT[],
    checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for blockchain network status
CREATE INDEX idx_blockchain_network_status_network ON blockchain_network_status(network);
CREATE INDEX idx_blockchain_network_status_checked_at ON blockchain_network_status(checked_at DESC);
CREATE INDEX idx_blockchain_network_status_status ON blockchain_network_status(status);

-- Blockchain transaction metrics table
CREATE TABLE blockchain_transaction_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    network VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    transaction_count INTEGER NOT NULL DEFAULT 0,
    successful_transactions INTEGER NOT NULL DEFAULT 0,
    failed_transactions INTEGER NOT NULL DEFAULT 0,
    total_fees_lamports BIGINT NOT NULL DEFAULT 0, -- For Solana
    total_fees_wei DECIMAL(30,0) DEFAULT 0, -- For Ethereum
    average_gas_used INTEGER,
    unique_users INTEGER NOT NULL DEFAULT 0,
    token_transfers INTEGER NOT NULL DEFAULT 0,
    program_interactions INTEGER NOT NULL DEFAULT 0, -- Solana programs
    contract_interactions INTEGER NOT NULL DEFAULT 0, -- Ethereum contracts
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(network, date, hour)
);

-- Indexes for blockchain transaction metrics
CREATE INDEX idx_blockchain_transaction_metrics_network_date ON blockchain_transaction_metrics(network, date DESC);
CREATE INDEX idx_blockchain_transaction_metrics_date_hour ON blockchain_transaction_metrics(date DESC, hour DESC);
CREATE INDEX idx_blockchain_transaction_metrics_transaction_count ON blockchain_transaction_metrics(transaction_count DESC);

-- =====================================================
-- USER BLOCKCHAIN PROFILES
-- =====================================================

-- User blockchain profiles table
CREATE TABLE user_blockchain_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    total_aux_tokens BIGINT NOT NULL DEFAULT 0,
    total_sol_balance BIGINT NOT NULL DEFAULT 0,
    total_usd_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    staking_positions_count INTEGER NOT NULL DEFAULT 0,
    total_staked_amount BIGINT NOT NULL DEFAULT 0,
    total_staking_rewards BIGINT NOT NULL DEFAULT 0,
    governance_participation_count INTEGER NOT NULL DEFAULT 0,
    governance_voting_power BIGINT NOT NULL DEFAULT 0,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    last_transaction_at TIMESTAMP WITH TIME ZONE,
    risk_score DECIMAL(5,2) NOT NULL DEFAULT 50.00, -- 0-100 risk score
    reputation_score DECIMAL(5,2) NOT NULL DEFAULT 50.00, -- 0-100 reputation score
    verification_level VARCHAR(20) NOT NULL DEFAULT 'basic' CHECK (verification_level IN ('basic', 'verified', 'premium', 'institutional')),
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected', 'expired')),
    kyc_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for user blockchain profiles
CREATE INDEX idx_user_blockchain_profiles_user_id ON user_blockchain_profiles(user_id);
CREATE INDEX idx_user_blockchain_profiles_total_usd_value ON user_blockchain_profiles(total_usd_value DESC);
CREATE INDEX idx_user_blockchain_profiles_risk_score ON user_blockchain_profiles(risk_score);
CREATE INDEX idx_user_blockchain_profiles_reputation_score ON user_blockchain_profiles(reputation_score DESC);
CREATE INDEX idx_user_blockchain_profiles_verification_level ON user_blockchain_profiles(verification_level);
CREATE INDEX idx_user_blockchain_profiles_kyc_status ON user_blockchain_profiles(kyc_status);

-- =====================================================
-- BLOCKCHAIN EVENTS & WEBHOOKS
-- =====================================================

-- Blockchain events table
CREATE TABLE blockchain_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    network VARCHAR(20) NOT NULL,
    contract_address VARCHAR(44), -- Solana program or Ethereum contract
    transaction_signature VARCHAR(88) NOT NULL, -- Solana signature or Ethereum hash
    block_number BIGINT NOT NULL,
    log_index INTEGER, -- For Ethereum events
    instruction_index INTEGER, -- For Solana events
    event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    decoded_data JSONB DEFAULT '{}'::jsonb,
    affected_users UUID[], -- Array of affected user IDs
    processed BOOLEAN NOT NULL DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_error TEXT,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for blockchain events
CREATE INDEX idx_blockchain_events_type ON blockchain_events(event_type);
CREATE INDEX idx_blockchain_events_network ON blockchain_events(network);
CREATE INDEX idx_blockchain_events_contract ON blockchain_events(contract_address);
CREATE INDEX idx_blockchain_events_transaction ON blockchain_events(transaction_signature);
CREATE INDEX idx_blockchain_events_block_number ON blockchain_events(block_number DESC);
CREATE INDEX idx_blockchain_events_processed ON blockchain_events(processed) WHERE processed = false;
CREATE INDEX idx_blockchain_events_occurred_at ON blockchain_events(occurred_at DESC);
CREATE INDEX idx_blockchain_events_affected_users ON blockchain_events USING GIN(affected_users);

-- Event subscriptions table
CREATE TABLE blockchain_event_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    network VARCHAR(20) NOT NULL,
    contract_address VARCHAR(44), -- Filter by specific contract/program
    filters JSONB DEFAULT '{}'::jsonb, -- Additional event filters
    webhook_url TEXT, -- Optional webhook for real-time notifications
    notification_preferences JSONB NOT NULL DEFAULT '{
        "email": true,
        "push": true,
        "websocket": true,
        "webhook": false
    }'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for event subscriptions
CREATE INDEX idx_blockchain_event_subscriptions_user_id ON blockchain_event_subscriptions(user_id);
CREATE INDEX idx_blockchain_event_subscriptions_event_type ON blockchain_event_subscriptions(event_type);
CREATE INDEX idx_blockchain_event_subscriptions_network ON blockchain_event_subscriptions(network);
CREATE INDEX idx_blockchain_event_subscriptions_active ON blockchain_event_subscriptions(is_active) WHERE is_active = true;

-- =====================================================
-- BLOCKCHAIN SECURITY & RISK MANAGEMENT
-- =====================================================

-- Security alerts table
CREATE TABLE blockchain_security_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN (
        'suspicious_transaction', 'unusual_activity', 'large_transfer', 'new_address',
        'smart_contract_risk', 'phishing_attempt', 'rug_pull_warning', 'oracle_manipulation'
    )),
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    network VARCHAR(20) NOT NULL,
    affected_address VARCHAR(44) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    transaction_signature VARCHAR(88),
    description TEXT NOT NULL,
    risk_indicators TEXT[],
    recommended_actions TEXT[],
    auto_blocked BOOLEAN NOT NULL DEFAULT false,
    acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for security alerts
CREATE INDEX idx_blockchain_security_alerts_type ON blockchain_security_alerts(alert_type);
CREATE INDEX idx_blockchain_security_alerts_severity ON blockchain_security_alerts(severity);
CREATE INDEX idx_blockchain_security_alerts_network ON blockchain_security_alerts(network);
CREATE INDEX idx_blockchain_security_alerts_affected_address ON blockchain_security_alerts(affected_address);
CREATE INDEX idx_blockchain_security_alerts_user_id ON blockchain_security_alerts(user_id);
CREATE INDEX idx_blockchain_security_alerts_unresolved ON blockchain_security_alerts(resolved) WHERE resolved = false;
CREATE INDEX idx_blockchain_security_alerts_created_at ON blockchain_security_alerts(created_at DESC);

-- Address risk assessments table
CREATE TABLE address_risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address VARCHAR(44) NOT NULL,
    network VARCHAR(20) NOT NULL,
    risk_score DECIMAL(5,2) NOT NULL, -- 0-100 risk score
    risk_level VARCHAR(10) NOT NULL CHECK (risk_level IN ('very_low', 'low', 'medium', 'high', 'very_high')),
    risk_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    assessment_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    confidence DECIMAL(4,3) NOT NULL DEFAULT 0.8,
    data_sources TEXT[],
    last_transaction_check TIMESTAMP WITH TIME ZONE,
    assessment_version VARCHAR(10) NOT NULL DEFAULT '1.0',
    assessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(address, network, assessment_version)
);

-- Indexes for address risk assessments
CREATE INDEX idx_address_risk_assessments_address ON address_risk_assessments(address);
CREATE INDEX idx_address_risk_assessments_network ON address_risk_assessments(network);
CREATE INDEX idx_address_risk_assessments_risk_score ON address_risk_assessments(risk_score DESC);
CREATE INDEX idx_address_risk_assessments_risk_level ON address_risk_assessments(risk_level);
CREATE INDEX idx_address_risk_assessments_assessed_at ON address_risk_assessments(assessed_at DESC);
CREATE INDEX idx_address_risk_assessments_expires_at ON address_risk_assessments(expires_at);

-- =====================================================
-- BLOCKCHAIN CONFIGURATION & SETTINGS
-- =====================================================

-- Blockchain configuration table
CREATE TABLE blockchain_configuration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN NOT NULL DEFAULT false,
    environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for blockchain configuration
CREATE INDEX idx_blockchain_configuration_key ON blockchain_configuration(config_key);
CREATE INDEX idx_blockchain_configuration_environment ON blockchain_configuration(environment);
CREATE INDEX idx_blockchain_configuration_sensitive ON blockchain_configuration(is_sensitive);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_blockchain_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to all blockchain tables
CREATE TRIGGER update_solana_wallets_timestamp
    BEFORE UPDATE ON solana_wallets
    FOR EACH ROW EXECUTE FUNCTION update_blockchain_timestamp();

CREATE TRIGGER update_solana_token_accounts_timestamp
    BEFORE UPDATE ON solana_token_accounts
    FOR EACH ROW EXECUTE FUNCTION update_blockchain_timestamp();

CREATE TRIGGER update_solana_staking_pools_timestamp
    BEFORE UPDATE ON solana_staking_pools
    FOR EACH ROW EXECUTE FUNCTION update_blockchain_timestamp();

CREATE TRIGGER update_solana_staking_positions_timestamp
    BEFORE UPDATE ON solana_staking_positions
    FOR EACH ROW EXECUTE FUNCTION update_blockchain_timestamp();

CREATE TRIGGER update_chainlink_price_feeds_timestamp
    BEFORE UPDATE ON chainlink_price_feeds
    FOR EACH ROW EXECUTE FUNCTION update_blockchain_timestamp();

CREATE TRIGGER update_aux_token_config_timestamp
    BEFORE UPDATE ON aux_token_config
    FOR EACH ROW EXECUTE FUNCTION update_blockchain_timestamp();

CREATE TRIGGER update_external_data_sources_timestamp
    BEFORE UPDATE ON external_data_sources
    FOR EACH ROW EXECUTE FUNCTION update_blockchain_timestamp();

CREATE TRIGGER update_user_blockchain_profiles_timestamp
    BEFORE UPDATE ON user_blockchain_profiles
    FOR EACH ROW EXECUTE FUNCTION update_blockchain_timestamp();

CREATE TRIGGER update_blockchain_configuration_timestamp
    BEFORE UPDATE ON blockchain_configuration
    FOR EACH ROW EXECUTE FUNCTION update_blockchain_timestamp();

-- =====================================================
-- INITIAL CONFIGURATION DATA
-- =====================================================

-- Insert default AUX token configuration
INSERT INTO aux_token_config (
    mint_address,
    name,
    symbol,
    decimals,
    total_supply,
    circulating_supply,
    description,
    website,
    metadata
) VALUES (
    'AUXTokenMintAddressWillBeGeneratedOnDeploy123', -- Placeholder
    'Auxeira Token',
    'AUX',
    9,
    1000000000000000000, -- 1 billion AUX tokens
    0, -- No tokens in circulation initially
    'The native utility token of the Auxeira startup evaluation platform',
    'https://auxeira.com',
    '{
        "tokenomics": {
            "team": 20,
            "investors": 15,
            "treasury": 25,
            "community": 30,
            "ecosystem": 10
        },
        "vesting": {
            "team_cliff_months": 12,
            "team_vesting_months": 48,
            "investor_cliff_months": 6,
            "investor_vesting_months": 24
        }
    }'::jsonb
);

-- Insert default AUX token earning rules
INSERT INTO aux_token_earning_rules (rule_name, source_type, base_amount, multiplier_formula, max_daily_earnings, cooldown_period, sse_score_threshold, is_active) VALUES
('SSE Score Improvement', 'sse_improvement', 1000000000, 'base_amount * (score_improvement / 10)', 10000000000, 3600, 0, true), -- 1 AUX per point improvement
('Daily Login Streak', 'daily_login', 100000000, 'base_amount * min(streak_days / 7, 4)', 1000000000, 86400, 0, true), -- 0.1 AUX base, up to 4x multiplier
('Profile Completion', 'profile_completion', 5000000000, 'base_amount * (completion_percentage / 100)', NULL, 0, 0, true), -- 5 AUX for 100% completion
('Referral Success', 'referral', 10000000000, 'base_amount * referee_sse_score / 100', NULL, 0, 70, true), -- 10 AUX base, multiplied by referee SSE
('Governance Participation', 'governance_participation', 2000000000, 'base_amount * voting_power_percentage', 20000000000, 0, 60, true), -- 2 AUX base
('Achievement Unlock', 'achievement', 500000000, 'base_amount * achievement_rarity_multiplier', NULL, 0, 0, true), -- 0.5 AUX base
('Challenge Completion', 'challenge', 3000000000, 'base_amount * challenge_difficulty_multiplier', NULL, 0, 0, true), -- 3 AUX base
('Partnership Engagement', 'partnership', 1500000000, 'base_amount * partnership_tier_multiplier', 15000000000, 0, 50, true), -- 1.5 AUX base
('Staking Rewards', 'staking', 0, 'staked_amount * apy / 365 / 24', NULL, 0, 0, true), -- Hourly staking rewards
('Admin Award', 'admin', 0, 'admin_specified_amount', NULL, 0, 0, true); -- Admin discretionary awards

-- Insert default Chainlink price feeds
INSERT INTO chainlink_price_feeds (feed_address, pair, network, decimals, description, heartbeat, deviation_threshold, is_active) VALUES
('0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', 'ETH/USD', 'ethereum', 8, 'Ethereum to USD price feed', 3600, 0.0050, true),
('0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c', 'BTC/USD', 'ethereum', 8, 'Bitcoin to USD price feed', 3600, 0.0050, true),
('0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6', 'USDC/USD', 'ethereum', 8, 'USD Coin to USD price feed', 86400, 0.0025, true),
('0x547a514d5e3769680Ce22B2361c10Ea13619e8a9', 'SOL/USD', 'ethereum', 8, 'Solana to USD price feed', 3600, 0.0100, true);

-- Insert default external data sources
INSERT INTO external_data_sources (source_name, source_type, api_endpoint, authentication_type, cost_per_request, rate_limit_per_minute, reliability_score, average_response_time_ms, is_active) VALUES
('Clearbit Company API', 'company_database', 'https://company.clearbit.com/v2/companies/find', 'api_key', 0.50, 600, 0.95, 800, true),
('Website Analyzer Pro', 'website_analyzer', 'https://api.websiteanalyzer.com/v1/analyze', 'api_key', 0.25, 120, 0.90, 1200, true),
('Social Sentiment API', 'social_media', 'https://api.socialmention.com/search', 'api_key', 0.10, 300, 0.85, 1500, true),
('Financial Data Provider', 'financial_data', 'https://api.financialdata.com/v1/company', 'oauth', 1.00, 60, 0.98, 600, true),
('Market Research API', 'market_research', 'https://api.marketresearch.com/v2/industry', 'api_key', 2.00, 30, 0.92, 2000, true),
('Regulatory Database', 'regulatory_database', 'https://api.regdb.com/v1/compliance', 'api_key', 1.50, 60, 0.88, 1800, true),
('News Aggregator API', 'news_aggregator', 'https://api.newsapi.org/v2/everything', 'api_key', 0.05, 1000, 0.80, 500, true);

-- Insert default blockchain configuration
INSERT INTO blockchain_configuration (config_key, config_value, description, is_sensitive, environment) VALUES
('solana_rpc_endpoint', '"https://api.mainnet-beta.solana.com"', 'Primary Solana RPC endpoint', false, 'production'),
('solana_ws_endpoint', '"wss://api.mainnet-beta.solana.com"', 'Solana WebSocket endpoint', false, 'production'),
('solana_commitment_level', '"confirmed"', 'Solana transaction commitment level', false, 'production'),
('chainlink_ethereum_rpc', '"https://mainnet.infura.io/v3/YOUR_PROJECT_ID"', 'Ethereum RPC for Chainlink', true, 'production'),
('chainlink_vrf_subscription_id', '"0"', 'Chainlink VRF subscription ID', true, 'production'),
('chainlink_functions_subscription_id', '"0"', 'Chainlink Functions subscription ID', true, 'production'),
('aux_token_mint_authority', '""', 'AUX token mint authority address', true, 'production'),
('staking_pool_authority', '""', 'Staking pool program authority', true, 'production'),
('governance_program_id', '""', 'Governance program ID', false, 'production'),
('oracle_update_frequency', '300', 'Oracle data update frequency in seconds', false, 'production'),
('risk_assessment_threshold', '0.75', 'Risk assessment alert threshold', false, 'production'),
('transaction_monitoring_enabled', 'true', 'Enable transaction monitoring', false, 'production');

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- User blockchain summary view
CREATE VIEW user_blockchain_summary AS
SELECT
    u.id as user_id,
    u.email,
    u.company_name,
    ubp.total_aux_tokens,
    ubp.total_sol_balance,
    ubp.total_usd_value,
    ubp.staking_positions_count,
    ubp.total_staked_amount,
    ubp.total_staking_rewards,
    ubp.governance_participation_count,
    ubp.risk_score,
    ubp.reputation_score,
    ubp.verification_level,
    sw.public_key as solana_wallet_address,
    sw.balance as solana_wallet_balance,
    COUNT(sta.id) as token_accounts_count,
    COUNT(ssp.id) as active_staking_positions,
    COALESCE(SUM(ssp.staked_amount), 0) as total_currently_staked,
    ubp.last_transaction_at,
    ubp.updated_at
FROM users u
LEFT JOIN user_blockchain_profiles ubp ON u.id = ubp.user_id
LEFT JOIN solana_wallets sw ON u.id = sw.user_id AND sw.is_active = true
LEFT JOIN solana_token_accounts sta ON sw.id = sta.wallet_id
LEFT JOIN solana_staking_positions ssp ON sw.id = ssp.wallet_id AND ssp.status = 'active'
GROUP BY u.id, u.email, u.company_name, ubp.total_aux_tokens, ubp.total_sol_balance,
         ubp.total_usd_value, ubp.staking_positions_count, ubp.total_staked_amount,
         ubp.total_staking_rewards, ubp.governance_participation_count, ubp.risk_score,
         ubp.reputation_score, ubp.verification_level, sw.public_key, sw.balance,
         ubp.last_transaction_at, ubp.updated_at;

-- Staking pool performance view
CREATE VIEW staking_pool_performance AS
SELECT
    ssp_pool.id as pool_id,
    ssp_pool.name as pool_name,
    ssp_pool.validator_address,
    ssp_pool.commission_rate,
    ssp_pool.apy,
    ssp_pool.total_staked,
    ssp_pool.staker_count,
    COUNT(ssp_pos.id) as active_positions,
    COALESCE(SUM(ssp_pos.staked_amount), 0) as actual_staked_amount,
    COALESCE(SUM(ssp_pos.reward_amount), 0) as total_rewards_distributed,
    COALESCE(AVG(ssp_pos.multiplier), 1.0) as average_multiplier,
    COUNT(DISTINCT ssp_pos.user_id) as unique_stakers,
    ssp_pool.created_at,
    ssp_pool.updated_at
FROM solana_staking_pools ssp_pool
LEFT JOIN solana_staking_positions ssp_pos ON ssp_pool.id = ssp_pos.pool_id AND ssp_pos.status = 'active'
WHERE ssp_pool.is_active = true
GROUP BY ssp_pool.id, ssp_pool.name, ssp_pool.validator_address, ssp_pool.commission_rate,
         ssp_pool.apy, ssp_pool.total_staked, ssp_pool.staker_count, ssp_pool.created_at, ssp_pool.updated_at;

-- Chainlink oracle status view
CREATE VIEW chainlink_oracle_status AS
SELECT
    cpf.id as feed_id,
    cpf.pair,
    cpf.feed_address,
    cpf.network,
    cpf.decimals,
    cpf.heartbeat,
    cpf.is_active,
    cpd_latest.price as latest_price,
    cpd_latest.confidence as latest_confidence,
    cpd_latest.updated_at as last_price_update,
    cpd_latest.round_id as latest_round_id,
    COUNT(cpd_24h.id) as updates_24h,
    AVG(cpd_24h.price) as avg_price_24h,
    STDDEV(cpd_24h.price) as price_volatility_24h,
    cpf.created_at
FROM chainlink_price_feeds cpf
LEFT JOIN LATERAL (
    SELECT * FROM chainlink_price_data
    WHERE feed_id = cpf.id
    ORDER BY updated_at DESC
    LIMIT 1
) cpd_latest ON true
LEFT JOIN chainlink_price_data cpd_24h ON cpf.id = cpd_24h.feed_id
    AND cpd_24h.updated_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
WHERE cpf.is_active = true
GROUP BY cpf.id, cpf.pair, cpf.feed_address, cpf.network, cpf.decimals, cpf.heartbeat,
         cpf.is_active, cpd_latest.price, cpd_latest.confidence, cpd_latest.updated_at,
         cpd_latest.round_id, cpf.created_at;

-- =====================================================
-- FUNCTIONS FOR BLOCKCHAIN OPERATIONS
-- =====================================================

-- Function to update user blockchain profile
CREATE OR REPLACE FUNCTION update_user_blockchain_profile(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_aux_balance BIGINT;
    v_sol_balance BIGINT;
    v_staking_count INTEGER;
    v_staked_amount BIGINT;
    v_staking_rewards BIGINT;
    v_governance_count INTEGER;
    v_transaction_count INTEGER;
    v_last_transaction TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate AUX token balance
    SELECT COALESCE(SUM(CASE WHEN transaction_type IN ('earn', 'transfer_in', 'stake_reward', 'referral_bonus', 'achievement_reward', 'challenge_reward', 'partnership_bonus', 'admin_award')
                              THEN amount
                              ELSE -amount END), 0)
    INTO v_aux_balance
    FROM aux_token_transactions
    WHERE user_id = p_user_id;

    -- Calculate SOL balance
    SELECT COALESCE(SUM(sw.balance), 0)
    INTO v_sol_balance
    FROM solana_wallets sw
    WHERE sw.user_id = p_user_id AND sw.is_active = true;

    -- Calculate staking metrics
    SELECT
        COUNT(*),
        COALESCE(SUM(staked_amount), 0),
        COALESCE(SUM(reward_amount), 0)
    INTO v_staking_count, v_staked_amount, v_staking_rewards
    FROM solana_staking_positions ssp
    WHERE ssp.user_id = p_user_id AND ssp.status = 'active';

    -- Calculate governance participation
    SELECT COUNT(*)
    INTO v_governance_count
    FROM solana_governance_votes sgv
    WHERE sgv.user_id = p_user_id;

    -- Calculate transaction metrics
    SELECT
        COUNT(*),
        MAX(block_time)
    INTO v_transaction_count, v_last_transaction
    FROM solana_transactions st
    WHERE st.user_id = p_user_id;

    -- Update or insert blockchain profile
    INSERT INTO user_blockchain_profiles (
        user_id,
        total_aux_tokens,
        total_sol_balance,
        total_usd_value,
        staking_positions_count,
        total_staked_amount,
        total_staking_rewards,
        governance_participation_count,
        transaction_count,
        last_transaction_at
    ) VALUES (
        p_user_id,
        v_aux_balance,
        v_sol_balance,
        (v_aux_balance::DECIMAL / 1000000000 * 0.50) + (v_sol_balance::DECIMAL / 1000000000 * 100), -- Mock USD calculation
        v_staking_count,
        v_staked_amount,
        v_staking_rewards,
        v_governance_count,
        v_transaction_count,
        v_last_transaction
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_aux_tokens = EXCLUDED.total_aux_tokens,
        total_sol_balance = EXCLUDED.total_sol_balance,
        total_usd_value = EXCLUDED.total_usd_value,
        staking_positions_count = EXCLUDED.staking_positions_count,
        total_staked_amount = EXCLUDED.total_staked_amount,
        total_staking_rewards = EXCLUDED.total_staking_rewards,
        governance_participation_count = EXCLUDED.governance_participation_count,
        transaction_count = EXCLUDED.transaction_count,
        last_transaction_at = EXCLUDED.last_transaction_at,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate AUX token earnings
CREATE OR REPLACE FUNCTION calculate_aux_earnings(
    p_user_id UUID,
    p_source_type VARCHAR(30),
    p_source_id VARCHAR(100),
    p_base_parameters JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT AS $$
DECLARE
    v_rule RECORD;
    v_base_amount BIGINT;
    v_multiplier DECIMAL(4,2) := 1.00;
    v_final_amount BIGINT;
    v_user_sse_score INTEGER;
    v_daily_earned BIGINT;
    v_total_earned BIGINT;
BEGIN
    -- Get earning rule
    SELECT * INTO v_rule
    FROM aux_token_earning_rules
    WHERE source_type = p_source_type AND is_active = true;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Get user's current SSE score
    SELECT current_score INTO v_user_sse_score
    FROM sse_scores
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- Check SSE score threshold
    IF v_rule.sse_score_threshold IS NOT NULL AND (v_user_sse_score IS NULL OR v_user_sse_score < v_rule.sse_score_threshold) THEN
        RETURN 0;
    END IF;

    -- Calculate base amount and multiplier based on rule formula
    v_base_amount := v_rule.base_amount;

    -- Apply multiplier formula (simplified implementation)
    IF v_rule.multiplier_formula IS NOT NULL THEN
        -- This would be a more sophisticated formula parser in production
        IF p_source_type = 'sse_improvement' THEN
            v_multiplier := GREATEST(1.0, (p_base_parameters->>'score_improvement')::DECIMAL / 10);
        ELSIF p_source_type = 'daily_login' THEN
            v_multiplier := LEAST(4.0, (p_base_parameters->>'streak_days')::DECIMAL / 7);
        ELSIF p_source_type = 'referral' THEN
            v_multiplier := (p_base_parameters->>'referee_sse_score')::DECIMAL / 100;
        END IF;
    END IF;

    -- Calculate final amount
    v_final_amount := (v_base_amount * v_multiplier)::BIGINT;

    -- Check daily limits
    IF v_rule.max_daily_earnings IS NOT NULL THEN
        SELECT COALESCE(SUM(amount), 0) INTO v_daily_earned
        FROM aux_token_transactions
        WHERE user_id = p_user_id
          AND source_type = p_source_type
          AND created_at > CURRENT_DATE;

        IF v_daily_earned + v_final_amount > v_rule.max_daily_earnings THEN
            v_final_amount := GREATEST(0, v_rule.max_daily_earnings - v_daily_earned);
        END IF;
    END IF;

    -- Check total limits
    IF v_rule.max_total_earnings IS NOT NULL THEN
        SELECT COALESCE(SUM(amount), 0) INTO v_total_earned
        FROM aux_token_transactions
        WHERE user_id = p_user_id AND source_type = p_source_type;

        IF v_total_earned + v_final_amount > v_rule.max_total_earnings THEN
            v_final_amount := GREATEST(0, v_rule.max_total_earnings - v_total_earned);
        END IF;
    END IF;

    RETURN v_final_amount;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERFORMANCE OPTIMIZATION
-- =====================================================

-- Partial indexes for better performance
CREATE INDEX idx_solana_transactions_recent_user
    ON solana_transactions(user_id, block_time DESC)
    WHERE block_time > CURRENT_TIMESTAMP - INTERVAL '30 days';

CREATE INDEX idx_aux_token_transactions_recent_user
    ON aux_token_transactions(user_id, created_at DESC)
    WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days';

CREATE INDEX idx_chainlink_price_data_recent
    ON chainlink_price_data(feed_id, updated_at DESC)
    WHERE updated_at > CURRENT_TIMESTAMP - INTERVAL '7 days';

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE solana_wallets IS 'Solana wallet management for users with SPL token support';
COMMENT ON TABLE solana_token_accounts IS 'SPL token accounts associated with Solana wallets';
COMMENT ON TABLE solana_transactions IS 'Complete Solana transaction history with instruction details';
COMMENT ON TABLE solana_staking_pools IS 'Available Solana staking pools with validator information';
COMMENT ON TABLE solana_staking_positions IS 'User staking positions with performance multipliers';
COMMENT ON TABLE solana_staking_rewards IS 'Staking reward distribution and claiming history';
COMMENT ON TABLE solana_governance_proposals IS 'Governance proposals for platform decisions';
COMMENT ON TABLE solana_governance_votes IS 'User votes on governance proposals';
COMMENT ON TABLE solana_governance_delegates IS 'Governance delegation relationships';
COMMENT ON TABLE aux_token_config IS 'AUX token configuration and tokenomics';
COMMENT ON TABLE aux_token_transactions IS 'AUX token earning, spending, and transfer history';
COMMENT ON TABLE aux_token_earning_rules IS 'Rules for earning AUX tokens through platform activities';
COMMENT ON TABLE chainlink_price_feeds IS 'Chainlink price feed configurations';
COMMENT ON TABLE chainlink_price_data IS 'Historical price data from Chainlink oracles';
COMMENT ON TABLE chainlink_vrf_requests IS 'Chainlink VRF randomness requests for gamification';
COMMENT ON TABLE chainlink_function_requests IS 'Chainlink Functions requests for external data validation';
COMMENT ON TABLE external_data_validations IS 'External data validation results using Chainlink oracles';
COMMENT ON TABLE external_data_sources IS 'Configuration for external data sources';
COMMENT ON TABLE blockchain_events IS 'Blockchain events monitoring and processing';
COMMENT ON TABLE blockchain_event_subscriptions IS 'User subscriptions to blockchain events';
COMMENT ON TABLE blockchain_security_alerts IS 'Security alerts and risk monitoring';
COMMENT ON TABLE address_risk_assessments IS 'Risk assessments for blockchain addresses';
COMMENT ON TABLE user_blockchain_profiles IS 'Comprehensive blockchain profile for each user';
COMMENT ON TABLE blockchain_configuration IS 'System configuration for blockchain integrations';

-- =====================================================
-- MIGRATION COMPLETION
-- =====================================================

-- Insert migration record
INSERT INTO schema_migrations (version, description, executed_at) VALUES
('20250831_blockchain_solana_chainlink', 'Solana and Chainlink blockchain integration', CURRENT_TIMESTAMP);

-- Log successful migration
DO $$
BEGIN
    RAISE NOTICE 'Blockchain migration completed successfully';
    RAISE NOTICE 'Created % tables for Solana and Chainlink integration',
        (SELECT COUNT(*) FROM information_schema.tables
         WHERE table_schema = 'public'
         AND table_name LIKE '%solana%' OR table_name LIKE '%chainlink%' OR table_name LIKE '%aux_token%' OR table_name LIKE '%blockchain%');
    RAISE NOTICE 'Migration timestamp: %', CURRENT_TIMESTAMP;
END $$;
