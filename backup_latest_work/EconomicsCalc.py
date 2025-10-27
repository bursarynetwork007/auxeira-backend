"""
Auxeira Smart Reward Algorithm - Token Calculator API
======================================================

This module implements a dedicated REST API endpoint for calculating token rewards
based on startup activities and startup stage/size. The algorithm ensures meaningful
and fair reward distribution by controlling for startup size.

Author: Emmanuel Luthuli
Date: 2025-10-24
Version: 1.0.0
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional
from enum import Enum
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# ENUMS & CONSTANTS
# ============================================================================

class StartupStage(str, Enum):
    """Enum for startup funding stages."""
    PRE_SEED = "pre-seed"
    SEED = "seed"
    SERIES_A = "series-a"
    SERIES_B = "series-b"
    SERIES_C = "series-c"
    GROWTH = "growth"
    LATE_STAGE = "late-stage"


class ActivityTier(str, Enum):
    """Enum for activity reward tiers."""
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"


# Activity definitions with base token rewards and tier classification
ACTIVITY_CATALOG = {
    1: {
        "name": "Customer Interviews Conducted",
        "tier": ActivityTier.BRONZE,
        "base_tokens": 20,
        "description": "Conduct 5 qualified customer interviews",
        "category": "Customer Discovery & Validation"
    },
    2: {
        "name": "Customer Feedback Loops Implemented",
        "tier": ActivityTier.BRONZE,
        "base_tokens": 25,
        "description": "Establish recurring feedback mechanisms",
        "category": "Customer Discovery & Validation"
    },
    3: {
        "name": "Problem-Solution Interviews",
        "tier": ActivityTier.BRONZE,
        "base_tokens": 20,
        "description": "Conduct interviews with quality scoring",
        "category": "Customer Discovery & Validation"
    },
    4: {
        "name": "MVP Launches & Iterations",
        "tier": ActivityTier.SILVER,
        "base_tokens": 75,
        "description": "Launch or iterate on MVP",
        "category": "Product Iteration & Development"
    },
    5: {
        "name": "Short Release Cycles",
        "tier": ActivityTier.BRONZE,
        "base_tokens": 20,
        "description": "Maintain 1-2 week sprint cycles",
        "category": "Product Iteration & Development"
    },
    6: {
        "name": "User Testing Sessions",
        "tier": ActivityTier.BRONZE,
        "base_tokens": 25,
        "description": "Conduct documented user testing",
        "category": "Product Iteration & Development"
    },
    7: {
        "name": "Pivot Execution",
        "tier": ActivityTier.SILVER,
        "base_tokens": 100,
        "description": "Execute data-driven pivot",
        "category": "Product Iteration & Development"
    },
    8: {
        "name": "KPI Dashboard Establishment",
        "tier": ActivityTier.SILVER,
        "base_tokens": 50,
        "description": "Set up tracking infrastructure",
        "category": "Metrics Tracking & Data-Driven Decisions"
    },
    9: {
        "name": "Regular Metric Reviews",
        "tier": ActivityTier.BRONZE,
        "base_tokens": 15,
        "description": "Conduct monthly metric review",
        "category": "Metrics Tracking & Data-Driven Decisions"
    },
    10: {
        "name": "Data-Driven Decision Documentation",
        "tier": ActivityTier.BRONZE,
        "base_tokens": 20,
        "description": "Document major decision with data",
        "category": "Metrics Tracking & Data-Driven Decisions"
    },
    11: {
        "name": "Co-founder Agreements & Equity Splits",
        "tier": ActivityTier.SILVER,
        "base_tokens": 75,
        "description": "Formalize founder agreements",
        "category": "Team Building & Organizational Health"
    },
    12: {
        "name": "Regular Team Retrospectives",
        "tier": ActivityTier.BRONZE,
        "base_tokens": 20,
        "description": "Conduct bi-weekly retrospectives",
        "category": "Team Building & Organizational Health"
    },
    13: {
        "name": "Key Hire Documentation",
        "tier": ActivityTier.SILVER,
        "base_tokens": 75,
        "description": "Document strategic hire",
        "category": "Team Building & Organizational Health"
    },
    14: {
        "name": "Monthly Financial Reviews",
        "tier": ActivityTier.BRONZE,
        "base_tokens": 20,
        "description": "Prepare financial statements",
        "category": "Financial Discipline & Planning"
    },
    15: {
        "name": "Runway Extension Activities",
        "tier": ActivityTier.SILVER,
        "base_tokens": 75,
        "description": "Achieve 6+ month runway",
        "category": "Financial Discipline & Planning"
    },
    16: {
        "name": "Unit Economics Documentation",
        "tier": ActivityTier.BRONZE,
        "base_tokens": 25,
        "description": "Calculate and improve unit economics",
        "category": "Financial Discipline & Planning"
    },
    17: {
        "name": "First Revenue Achievement",
        "tier": ActivityTier.GOLD,
        "base_tokens": 300,
        "description": "Achieve first paying customer",
        "category": "Market Validation & Traction"
    },
    18: {
        "name": "Customer Retention Actions",
        "tier": ActivityTier.SILVER,
        "base_tokens": 75,
        "description": "Implement retention programs",
        "category": "Market Validation & Traction"
    },
    19: {
        "name": "Market Research Execution",
        "tier": ActivityTier.SILVER,
        "base_tokens": 75,
        "description": "Conduct TAM/SAM/SOM analysis",
        "category": "Market Validation & Traction"
    },
    20: {
        "name": "Post-Mortem Documentation",
        "tier": ActivityTier.BRONZE,
        "base_tokens": 20,
        "description": "Document learnings from failures",
        "category": "Learning & Adaptation"
    },
    21: {
        "name": "Competitive Intelligence Gathering",
        "tier": ActivityTier.BRONZE,
        "base_tokens": 20,
        "description": "Conduct competitive analysis",
        "category": "Learning & Adaptation"
    },
    22: {
        "name": "Industry Event Participation",
        "tier": ActivityTier.BRONZE,
        "base_tokens": 25,
        "description": "Attend conferences or demo days",
        "category": "Learning & Adaptation"
    },
    23: {
        "name": "Pitch Deck Development",
        "tier": ActivityTier.SILVER,
        "base_tokens": 75,
        "description": "Create professional pitch deck",
        "category": "Investor Readiness"
    },
    24: {
        "name": "Investor Meeting Documentation",
        "tier": ActivityTier.BRONZE,
        "base_tokens": 20,
        "description": "Document investor conversation",
        "category": "Investor Readiness"
    },
    25: {
        "name": "Due Diligence Preparation",
        "tier": ActivityTier.GOLD,
        "base_tokens": 250,
        "description": "Complete data room preparation",
        "category": "Investor Readiness"
    },
}

# Startup stage multipliers - controls for startup size
# Ensures rewards are meaningful relative to startup maturity
STAGE_MULTIPLIERS = {
    StartupStage.PRE_SEED: 1.5,      # Highest multiplier - earliest stage needs most encouragement
    StartupStage.SEED: 1.3,          # High multiplier - still early
    StartupStage.SERIES_A: 1.1,      # Moderate multiplier - established traction
    StartupStage.SERIES_B: 0.9,      # Lower multiplier - more mature
    StartupStage.SERIES_C: 0.8,      # Lower multiplier - advanced stage
    StartupStage.GROWTH: 0.7,        # Lower multiplier - scaling phase
    StartupStage.LATE_STAGE: 0.6,    # Lowest multiplier - mature company
}

# Consistency bonus - rewards sustained effort
CONSISTENCY_BONUSES = {
    4: 1.0,     # No bonus for 4 weeks
    8: 1.1,     # 10% bonus for 8 weeks
    12: 1.25,   # 25% bonus for 12 weeks (3 months)
    24: 1.5,    # 50% bonus for 24 weeks (6 months)
    52: 2.0,    # 100% bonus for 52 weeks (1 year)
}

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ActivitySubmission(BaseModel):
    """Model for a single activity submission."""
    activity_id: int = Field(..., ge=1, le=25, description="Activity ID from 1-25")
    quality_score: float = Field(default=1.0, ge=0.0, le=1.0, description="Quality score from 0.0 to 1.0")
    consistency_weeks: Optional[int] = Field(default=0, ge=0, description="Number of weeks of consistency")
    
    @validator('activity_id')
    def validate_activity_id(cls, v):
        if v not in ACTIVITY_CATALOG:
            raise ValueError(f"Activity ID {v} not found in catalog")
        return v


class TokenCalculationRequest(BaseModel):
    """Model for token calculation request."""
    startup_stage: StartupStage = Field(..., description="Current startup funding stage")
    activities: List[ActivitySubmission] = Field(..., min_items=1, description="List of completed activities")
    startup_id: Optional[str] = Field(default=None, description="Optional startup identifier for logging")
    
    class Config:
        schema_extra = {
            "example": {
                "startup_stage": "seed",
                "startup_id": "startup_001",
                "activities": [
                    {
                        "activity_id": 1,
                        "quality_score": 0.9,
                        "consistency_weeks": 4
                    },
                    {
                        "activity_id": 4,
                        "quality_score": 0.95,
                        "consistency_weeks": 0
                    }
                ]
            }
        }


class ActivityBreakdown(BaseModel):
    """Model for detailed breakdown of token calculation per activity."""
    activity_id: int
    activity_name: str
    base_tokens: int
    quality_bonus: float
    stage_multiplier: float
    consistency_bonus: float
    final_tokens: int


class TokenCalculationResponse(BaseModel):
    """Model for token calculation response."""
    total_tokens: int
    startup_stage: str
    stage_multiplier: float
    breakdown: List[ActivityBreakdown]
    calculation_timestamp: str
    summary: Dict[str, any]


# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

app = FastAPI(
    title="Auxeira Token Calculator API",
    description="REST API for calculating token rewards based on startup activities and stage",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# CORE CALCULATION LOGIC
# ============================================================================

def calculate_quality_bonus(quality_score: float) -> float:
    """
    Calculate quality bonus multiplier based on quality score.
    
    Args:
        quality_score: Score from 0.0 to 1.0
        
    Returns:
        Multiplier from 1.0 to 1.5
    """
    if quality_score < 0.7:
        return 1.0
    elif quality_score < 0.85:
        return 1.2
    else:
        return 1.5


def calculate_consistency_bonus(weeks: int) -> float:
    """
    Calculate consistency bonus based on weeks of continuous activity.
    
    Args:
        weeks: Number of weeks of consistency
        
    Returns:
        Multiplier based on consistency
    """
    if weeks == 0:
        return 1.0
    
    # Find the applicable bonus tier
    applicable_weeks = [w for w in sorted(CONSISTENCY_BONUSES.keys()) if w <= weeks]
    if not applicable_weeks:
        return 1.0
    
    return CONSISTENCY_BONUSES[max(applicable_weeks)]


def calculate_tokens(request: TokenCalculationRequest) -> TokenCalculationResponse:
    """
    Calculate total tokens for a startup based on activities and stage.
    
    This is the core algorithm that:
    1. Calculates base tokens for each activity
    2. Applies quality bonus (0.0-1.0 quality score)
    3. Applies stage multiplier (controls for startup size)
    4. Applies consistency bonus (rewards sustained effort)
    
    Args:
        request: TokenCalculationRequest with activities and startup stage
        
    Returns:
        TokenCalculationResponse with detailed breakdown
    """
    stage_multiplier = STAGE_MULTIPLIERS[request.startup_stage]
    breakdown = []
    total_tokens = 0
    
    for activity in request.activities:
        activity_info = ACTIVITY_CATALOG[activity.activity_id]
        
        # Calculate bonuses
        quality_bonus = calculate_quality_bonus(activity.quality_score)
        consistency_bonus = calculate_consistency_bonus(activity.consistency_weeks)
        
        # Calculate final tokens
        # Formula: base_tokens * quality_bonus * stage_multiplier * consistency_bonus
        final_tokens = int(
            activity_info["base_tokens"] 
            * quality_bonus 
            * stage_multiplier 
            * consistency_bonus
        )
        
        breakdown.append(
            ActivityBreakdown(
                activity_id=activity.activity_id,
                activity_name=activity_info["name"],
                base_tokens=activity_info["base_tokens"],
                quality_bonus=round(quality_bonus, 2),
                stage_multiplier=round(stage_multiplier, 2),
                consistency_bonus=round(consistency_bonus, 2),
                final_tokens=final_tokens
            )
        )
        
        total_tokens += final_tokens
    
    # Create summary statistics
    summary = {
        "total_activities": len(request.activities),
        "bronze_activities": sum(1 for a in request.activities if ACTIVITY_CATALOG[a.activity_id]["tier"] == ActivityTier.BRONZE),
        "silver_activities": sum(1 for a in request.activities if ACTIVITY_CATALOG[a.activity_id]["tier"] == ActivityTier.SILVER),
        "gold_activities": sum(1 for a in request.activities if ACTIVITY_CATALOG[a.activity_id]["tier"] == ActivityTier.GOLD),
        "average_quality_score": round(sum(a.quality_score for a in request.activities) / len(request.activities), 2),
    }
    
    response = TokenCalculationResponse(
        total_tokens=total_tokens,
        startup_stage=request.startup_stage.value,
        stage_multiplier=round(stage_multiplier, 2),
        breakdown=breakdown,
        calculation_timestamp=datetime.utcnow().isoformat(),
        summary=summary
    )
    
    # Log the calculation
    logger.info(
        f"Token calculation completed for startup {request.startup_id}: "
        f"{total_tokens} tokens (stage: {request.startup_stage.value})"
    )
    
    return response


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.post(
    "/api/v1/calculate-tokens",
    response_model=TokenCalculationResponse,
    summary="Calculate Token Rewards",
    description="Calculate token rewards for a startup based on completed activities and startup stage"
)
async def calculate_tokens_endpoint(request: TokenCalculationRequest) -> TokenCalculationResponse:
    """
    Calculate token rewards for startup activities.
    
    This endpoint receives a list of activities completed by a startup and calculates
    the total token reward, accounting for:
    - Activity tier (Bronze, Silver, Gold)
    - Quality of execution (0.0-1.0)
    - Startup stage/size (Pre-Seed to Late-Stage)
    - Consistency of effort (weeks of continuous activity)
    
    The algorithm ensures meaningful rewards that scale appropriately with startup maturity.
    """
    try:
        response = calculate_tokens(request)
        return response
    except Exception as e:
        logger.error(f"Error calculating tokens: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")


@app.get(
    "/api/v1/activities",
    summary="Get Activity Catalog",
    description="Retrieve the complete catalog of rewarded activities"
)
async def get_activities():
    """
    Get the complete activity catalog with descriptions and base token values.
    """
    return {
        "total_activities": len(ACTIVITY_CATALOG),
        "activities": [
            {
                "id": activity_id,
                **activity_info
            }
            for activity_id, activity_info in ACTIVITY_CATALOG.items()
        ]
    }


@app.get(
    "/api/v1/stages",
    summary="Get Startup Stages",
    description="Retrieve available startup funding stages and their multipliers"
)
async def get_stages():
    """
    Get all available startup stages and their reward multipliers.
    """
    return {
        "stages": [
            {
                "stage": stage.value,
                "multiplier": multiplier,
                "description": f"Startup at {stage.value} stage"
            }
            for stage, multiplier in STAGE_MULTIPLIERS.items()
        ]
    }


@app.get(
    "/api/v1/health",
    summary="Health Check",
    description="Check API health status"
)
async def health_check():
    """
    Health check endpoint to verify API is running.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


# ============================================================================
# ROOT ENDPOINT
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Auxeira Token Calculator API",
        "version": "1.0.0",
        "description": "REST API for calculating token rewards based on startup activities and stage",
        "endpoints": {
            "calculate_tokens": "/api/v1/calculate-tokens",
            "activities": "/api/v1/activities",
            "stages": "/api/v1/stages",
            "health": "/api/v1/health",
            "docs": "/api/docs",
            "redoc": "/api/redoc"
        }
    }


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )

