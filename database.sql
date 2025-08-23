-- Auxeira SSE Database Schema

-- Users table (for login/signup)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Startups table
CREATE TABLE startups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    stage VARCHAR(50),
    region VARCHAR(100),
    ssi_score INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KPI tracking table
CREATE TABLE kpis (
    id SERIAL PRIMARY KEY,
    startup_id INTEGER REFERENCES startups(id),
    ltv_cac DECIMAL(5,2),
    nps INTEGER,
    churn_rate DECIMAL(5,2),
    runway_months INTEGER,
    board_score INTEGER,
    retention_rate INTEGER,
    esg_score INTEGER,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Behavioral tracking table
CREATE TABLE behaviors (
    id SERIAL PRIMARY KEY,
    startup_id INTEGER REFERENCES startups(id),
    behavior_type VARCHAR(100),
    data JSONB,
    aux_tokens_earned INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AUX token balance table
CREATE TABLE aux_balances (
    id SERIAL PRIMARY KEY,
    startup_id INTEGER REFERENCES startups(id),
    balance INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);