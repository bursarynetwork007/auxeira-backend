/**
 * Enhanced Access Control Middleware for Auxeira Platform
 * Implements tiered investor access system and performance-driven visibility
 */

import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { loggers } from '../utils/logger';

// Extend the existing AuthenticatedRequest interface
export interface EnhancedAuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    investorTier?: 'tier1' | 'tier2';
    subscriptionStatus?: 'active' | 'inactive' | 'trial';
    sseScore?: number;
    startupVisibilityLevel?: 'private' | 'portfolio_only' | 'qualified_investors' | 'public';
  };
}

/**
 * Enhanced authentication middleware that includes tier and performance data
 */
export const enhancedAuthenticateToken = async (
  req: EnhancedAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // First run the existing authentication
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
        error: 'UNAUTHORIZED',
        code: 'MISSING_TOKEN',
      });
      return;
    }

    // Verify token (assuming you have authService.verifyToken)
    const decoded = authService.verifyToken(token);
    if (!decoded) {
      res.status(403).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'FORBIDDEN',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    // Enhanced user data retrieval based on role
    let enhancedUserData: any = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    // If user is an investor, get their tier and subscription info
    if (decoded.role === 'investor') {
      const investorQuery = `
        SELECT
          ip.investor_tier,
          ip.subscription_status,
          ip.tier2_access_expires_at,
          ip.deal_flow_access_enabled
        FROM investor_profiles ip
        WHERE ip.user_id = $1
      `;
      const investorResult = await pool.query(investorQuery, [decoded.userId]);

      if (investorResult.rows.length > 0) {
        const investorData = investorResult.rows[0];
        enhancedUserData.investorTier = investorData.investor_tier;
        enhancedUserData.subscriptionStatus = investorData.subscription_status;

        // Check if Tier 2 access is still valid
        if (investorData.tier2_access_expires_at && new Date() > investorData.tier2_access_expires_at) {
          enhancedUserData.investorTier = 'tier1'; // Downgrade expired Tier 2 access
        }
      }
    }

    // If user is a startup founder, get their SSE score and visibility settings
    if (decoded.role === 'founder') {
      const startupQuery = `
        SELECT
          sp.current_sse_score,
          sp.visibility_level,
          sp.investor_visibility_enabled,
          sp.performance_threshold_met
        FROM startup_profiles sp
        WHERE sp.user_id = $1
      `;
      const startupResult = await pool.query(startupQuery, [decoded.userId]);

      if (startupResult.rows.length > 0) {
        const startupData = startupResult.rows[0];
        enhancedUserData.sseScore = startupData.current_sse_score;
        enhancedUserData.startupVisibilityLevel = startupData.visibility_level;
      }
    }

    req.user = enhancedUserData;
    next();

  } catch (error) {
    loggers.errorWithContext(error as Error, 'ENHANCED_AUTH_MIDDLEWARE', {
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
    });

    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: 'INTERNAL_ERROR',
      code: 'AUTH_ERROR',
    });
  }
};

/**
 * Middleware to require Tier 2 investor access for deal flow discovery
 */
export const requireTier2Access = (req: EnhancedAuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED',
        code: 'NOT_AUTHENTICATED',
      });
      return;
    }

    if (req.user.role !== 'investor') {
      res.status(403).json({
        success: false,
        message: 'Investor access required',
        error: 'FORBIDDEN',
        code: 'INVESTOR_ACCESS_REQUIRED',
      });
      return;
    }

    if (req.user.investorTier !== 'tier2') {
      res.status(403).json({
        success: false,
        message: 'Tier 2 access required for deal flow discovery. Upgrade your subscription to access this feature.',
        error: 'FORBIDDEN',
        code: 'TIER2_ACCESS_REQUIRED',
        upgradeInfo: {
          currentTier: req.user.investorTier || 'tier1',
          requiredTier: 'tier2',
          upgradeUrl: '/api/investor/upgrade-tier2'
        }
      });
      return;
    }

    if (req.user.subscriptionStatus !== 'active') {
      res.status(403).json({
        success: false,
        message: 'Active subscription required',
        error: 'FORBIDDEN',
        code: 'SUBSCRIPTION_INACTIVE',
      });
      return;
    }

    next();
  } catch (error) {
    loggers.errorWithContext(error as Error, 'TIER2_ACCESS_MIDDLEWARE', {
      endpoint: req.path,
      method: req.method,
      userId: req.user?.userId,
    });

    res.status(500).json({
      success: false,
      message: 'Access control error',
      error: 'INTERNAL_ERROR',
      code: 'TIER_CHECK_ERROR',
    });
  }
};

/**
 * Middleware to filter startups based on performance and visibility settings
 */
export const applyStartupVisibilityFilter = async (
  req: EnhancedAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'investor') {
      next();
      return;
    }

    // Add visibility filter to the request for use in controllers
    req.visibilityFilter = {
      investorId: req.user.userId,
      investorTier: req.user.investorTier,
      canAccessDealFlow: req.user.investorTier === 'tier2'
    };

    next();
  } catch (error) {
    loggers.errorWithContext(error as Error, 'VISIBILITY_FILTER_MIDDLEWARE');
    next(); // Don't block the request, just log the error
  }
};

/**
 * Middleware to check if startup can opt-in to investor visibility
 */
export const checkStartupVisibilityEligibility = async (
  req: EnhancedAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'founder') {
      next();
      return;
    }

    const sseScore = req.user.sseScore || 0;
    const isEligibleForInvestorVisibility = sseScore >= 70;

    req.startupEligibility = {
      sseScore,
      isEligibleForInvestorVisibility,
      currentVisibilityLevel: req.user.startupVisibilityLevel || 'private',
      canUpgradeVisibility: isEligibleForInvestorVisibility
    };

    next();
  } catch (error) {
    loggers.errorWithContext(error as Error, 'STARTUP_ELIGIBILITY_MIDDLEWARE');
    next();
  }
};

/**
 * Utility function to get startup visibility query based on investor access level
 */
export const getStartupVisibilityQuery = (investorId: string, investorTier: 'tier1' | 'tier2'): {
  whereClause: string;
  params: any[];
} => {
  if (investorTier === 'tier1') {
    // Tier 1: Only portfolio companies
    return {
      whereClause: `
        AND EXISTS (
          SELECT 1 FROM investments i
          WHERE i.investor_id = $1
          AND i.startup_id = s.id
          AND i.status = 'active'
        )
      `,
      params: [investorId]
    };
  } else {
    // Tier 2: Portfolio companies + high-performing startups that opted in
    return {
      whereClause: `
        AND (
          EXISTS (
            SELECT 1 FROM investments i
            WHERE i.investor_id = $1
            AND i.startup_id = s.id
            AND i.status = 'active'
          )
          OR (
            sp.current_sse_score >= 70
            AND sp.investor_visibility_enabled = true
            AND sp.visibility_level IN ('qualified_investors', 'public')
          )
        )
      `,
      params: [investorId]
    };
  }
};

/**
 * Database schema updates needed (run these migrations)
 */
export const requiredDatabaseMigrations = `
-- Add investor tier and subscription tracking
ALTER TABLE investor_profiles ADD COLUMN IF NOT EXISTS investor_tier VARCHAR(10) DEFAULT 'tier1';
ALTER TABLE investor_profiles ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'inactive';
ALTER TABLE investor_profiles ADD COLUMN IF NOT EXISTS tier2_access_expires_at TIMESTAMP;
ALTER TABLE investor_profiles ADD COLUMN IF NOT EXISTS deal_flow_access_enabled BOOLEAN DEFAULT false;

-- Add startup visibility controls
ALTER TABLE startup_profiles ADD COLUMN IF NOT EXISTS current_sse_score DECIMAL(5,2) DEFAULT 0;
ALTER TABLE startup_profiles ADD COLUMN IF NOT EXISTS visibility_level VARCHAR(30) DEFAULT 'private';
ALTER TABLE startup_profiles ADD COLUMN IF NOT EXISTS investor_visibility_enabled BOOLEAN DEFAULT false;
ALTER TABLE startup_profiles ADD COLUMN IF NOT EXISTS performance_threshold_met BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_investor_profiles_tier ON investor_profiles(investor_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_visibility ON startup_profiles(current_sse_score, visibility_level, investor_visibility_enabled);
CREATE INDEX IF NOT EXISTS idx_investments_active ON investments(investor_id, startup_id, status);

-- Create subscription tracking table
CREATE TABLE IF NOT EXISTS investor_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID REFERENCES investor_profiles(id),
  tier VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
`;

// Export the enhanced types for use in other files
export interface VisibilityFilter {
  investorId: string;
  investorTier: 'tier1' | 'tier2';
  canAccessDealFlow: boolean;
}

export interface StartupEligibility {
  sseScore: number;
  isEligibleForInvestorVisibility: boolean;
  currentVisibilityLevel: string;
  canUpgradeVisibility: boolean;
}

// Extend the Request interface
declare global {
  namespace Express {
    interface Request {
      visibilityFilter?: VisibilityFilter;
      startupEligibility?: StartupEligibility;
    }
  }
}
