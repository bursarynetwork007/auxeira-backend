# API Endpoints Reference

## Overview
This document provides a comprehensive reference for all Auxeira Lambda function API endpoints.

## Existing Endpoints (Updated)

### 1. Coach Gina
**Function**: `auxeira-coach-gina-prod`  
**Endpoint**: TBD (API Gateway)  
**Method**: POST

**Request Body**:
```json
{
  "message": "How can I reduce my churn rate?",
  "context": {
    "stage": "Seed",
    "industry": "SaaS",
    "geography": "San Francisco",
    "teamSize": 5,
    "runway": 12,
    "metrics": {
      "mrr": 18500,
      "mrrGrowth": "+23%",
      "customers": 127,
      "cac": 127,
      "ltv": 1800,
      "churnRate": 8,
      "nps": 45
    },
    "recentMilestones": ["Reached $18K MRR"],
    "activeChallenges": ["High churn rate"]
  },
  "conversationHistory": []
}
```

**Response**:
```json
{
  "success": true,
  "response": "Your response text here (150-250 words)"
}
```

### 2. Nudges Generator
**Function**: `auxeira-nudges-generator-prod`  
**Endpoint**: TBD (API Gateway)  
**Method**: POST

**Request Body**:
```json
{
  "context": {
    "startupName": "MyStartup",
    "sseScore": 72,
    "stage": "Seed",
    "industry": "SaaS",
    "mrr": "18000",
    "mrrGrowth": "+23%",
    "users": "2847",
    "cac": "127",
    "churnRate": "2.3",
    "interviewsCompleted": 8,
    "projectionsAge": "30 days old"
  },
  "externalContext": "Optional: Recent blog post got 200 views..."
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "type": "growth",
      "goal": "Launch referral program leveraging X engagement",
      "description": "Your viral X thread shows demand—projected 25% CAC reduction",
      "buttonText": "Setup Referrals",
      "auxReward": 185,
      "difficulty": "Medium",
      "workflow_type": "Modal"
    },
    {
      "type": "validation",
      "goal": "Interview 5 Reddit commenters on pricing",
      "description": "Your Reddit thread shows pricing confusion—validate premium model",
      "buttonText": "Find Leads",
      "auxReward": 220,
      "difficulty": "High",
      "workflow_type": "Redirect"
    },
    {
      "type": "funding",
      "goal": "Update deck with TechCrunch mention",
      "description": "Your TechCrunch feature builds credibility—add to slide 3",
      "buttonText": "Edit Deck",
      "auxReward": 260,
      "difficulty": "Medium",
      "workflow_type": "Edit"
    }
  ]
}
```

### 3. Urgent Actions
**Function**: `auxeira-urgent-actions-prod`  
**Endpoint**: TBD (API Gateway)  
**Method**: POST

**Request Body**:
```json
{
  "context": {
    "startupName": "MyStartup",
    "sseScore": 72,
    "industry": "AI-blockchain",
    "mrr": "18000",
    "mrrGrowth": "+23%",
    "users": "2847",
    "interviewsCompleted": 7,
    "projectionsAge": "overdue 45 days",
    "stage": "pre-pilot"
  },
  "externalContext": "Optional: Recent activity..."
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "title": "Customer Interview #8 - Critical Validation Gap",
      "description": "Complete final interview to unlock Series A assessment. Leverage your 23% user growth momentum.",
      "button_text": "Start Now",
      "urgency_color": "red",
      "aux_reward": 150,
      "action_id": "customer_interview_8",
      "workflow_type": "Modal",
      "enhancement_tip": "Structure as buyer chat to probe implicit PMF signals"
    },
    {
      "title": "Financial Model Update - Projections Overdue",
      "description": "Your projections are 45 days old. Update with recent 23% MoM growth to reflect current trajectory.",
      "button_text": "Update Model",
      "urgency_color": "yellow",
      "aux_reward": 200,
      "action_id": "financial_model_update",
      "workflow_type": "Edit",
      "enhancement_tip": "Add behavioral churn benchmarks for accuracy"
    },
    {
      "title": "ESG Grant Opportunity - NEXUS Scaleup €2M",
      "description": "Climate tech deadline approaching. Your 85.7% success prediction makes you a strong candidate.",
      "button_text": "Apply Now",
      "urgency_color": "blue",
      "aux_reward": 450,
      "action_id": "esg_grant_nexus",
      "workflow_type": "Redirect",
      "enhancement_tip": "Highlight AI impact tools for ESG alignment"
    }
  ]
}
```

## New Endpoints (To Be Created)

### Growth Metrics Tab

#### 4. Growth Story
**Function**: `auxeira-growth-story-prod`  
**Method**: POST

**Request Body**:
```json
{
  "context": {
    "mrrGrowth": "Grown 40% in last 3 months",
    "nrr": "128%",
    "ltvCac": "14.9:1",
    "churn": "2.3%",
    "churnUpside": "50K"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "growthStory": {
      "tone": "Confident, narrative",
      "content": "Your metrics tell a compelling story..."
    },
    "keyInsight": {
      "tone": "Direct, analytical",
      "headline": "Scale Acquisition Now: Your Superpower Unlocked",
      "breakdown": "Your LTV:CAC of 14.9:1 is exceptional...",
      "actions": {
        "immediate": ["Run 5 exit surveys this week..."],
        "strategic": ["Build retention playbook..."]
      },
      "question": "What's your boldest acquisition bet this quarter?"
    }
  }
}
```

#### 5. Growth Levers
**Function**: `auxeira-growth-levers-prod`  
**Method**: POST

**Request Body**:
```json
{
  "context": {
    "mrrGrowth": "40% in last 3 months",
    "nrr": "128%",
    "ltvCac": "14.9:1",
    "churn": "2.3%",
    "other": "Healthy unit economics",
    "upsides": "Churn fix unlocks +$50K annual revenue"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "markdown": "## AI-Recommended Growth Levers\n\nBased on your metrics..."
  }
}
```

#### 6. Recommended Actions
**Function**: `auxeira-recommended-actions-prod`  
**Method**: POST

**Request Body**:
```json
{
  "context": {
    "churn": "2.3%",
    "churnUpside": "50K",
    "nrr": "128%"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sectionTitle": "Recommended Actions This Quarter",
    "sectionSubtitle": "Your 90-day execution plan for maximum traction.",
    "actions": [
      {
        "title": "Project Retention: Customer Success Initiative",
        "objective": "Reduce churn from 2.3% to 1.5%",
        "keyInitiatives": ["Implement weekly health-check calls..."],
        "successMetrics": ["Churn rate <1.8% by month 3..."],
        "resourceHint": "Requires CS lead + 5hrs/wk eng time"
      }
    ]
  }
}
```

### Funding Readiness Tab

#### 7. Investor Matching
**Function**: `auxeira-investor-matching-prod`  
**Method**: POST

**Request Body**:
```json
{
  "context": {
    "startupName": "MyStartup",
    "stage": "Seed",
    "sseScore": 72,
    "sector": "SaaS",
    "geography": "Global",
    "investorType": "VC Fund",
    "milestones": "Reached $18K MRR",
    "fundingGoal": "$1M-$3M"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "investors": [
      {
        "name": "Growth Stage VC",
        "type": "VC Fund",
        "focus": "B2B SaaS, High NRR",
        "checkSize": "$1M - $3M",
        "portfolioHighlights": ["Company A", "Company B"],
        "matchPercentage": 88,
        "matchReason": "Strong focus on SaaS with proven unit economics",
        "recentActivity": "Recently closed $200M Fund IV",
        "contactApproach": "Warm intro via portfolio founder"
      }
    ]
  }
}
```

#### 8. Funding Acceleration
**Function**: `auxeira-funding-acceleration-prod`  
**Method**: POST

**Request Body**:
```json
{
  "context": {
    "readinessScore": 72,
    "targetScore": 85,
    "checklistGaps": ["Incomplete validation", "Outdated projections"],
    "mrr": "18K",
    "mrrGrowth": "+23%",
    "ltvCac": "14.9:1",
    "nrr": "128%",
    "location": "San Francisco",
    "sector": "SaaS",
    "raiseTarget": "$1M-$3M"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "title": "Your 6-Week Series A Acceleration Plan",
    "subtitle": "Prioritized roadmap to boost readiness from 72 to 85+",
    "currentStatus": {
      "score": "72/100",
      "gapAnalysis": "Focus on completing validation interviews...",
      "quickWins": ["Complete remaining customer interviews..."]
    },
    "roadmap": [
      {
        "week": "Week 1-2",
        "theme": "Foundation & Quick Wins",
        "tasks": ["Complete 3 customer validation interviews..."],
        "pointsImpact": "+8-10 points",
        "cta": "Start Now"
      }
    ]
  }
}
```

#### 9. Funding Insights
**Function**: `auxeira-funding-insights-prod`  
**Method**: POST

**Request Body**:
```json
{
  "context": {
    "readinessScore": 72,
    "targetScore": 85,
    "keyGaps": ["Incomplete validation", "Outdated projections"],
    "mrr": "18K",
    "mrrGrowth": "+23%",
    "ltvCac": "14.9:1",
    "nrr": "128%",
    "churn": "2.3%",
    "sector": "SaaS",
    "geography": "Global",
    "stage": "Seed"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "title": "AI Insights & Recommendations",
    "gapAnalysis": "Your metrics are strong (128% NRR, 14.9:1 LTV:CAC)...",
    "investorUnlock": "Complete your validation interviews and update your financial model...",
    "matches": [
      {
        "firm": "Growth Stage VC",
        "match": "88%",
        "why": "Strong focus on SaaS companies with proven unit economics",
        "focusAreas": ["B2B SaaS", "High NRR", "Efficient Growth"],
        "recentActivity": "Recently closed $200M Fund IV targeting Series A"
      }
    ],
    "strategicRecommendations": [
      "Complete remaining validation interviews this week...",
      "Update financial model to reflect 23% MoM growth..."
    ]
  }
}
```

### Earn AUX Tab

#### 10. AUX Tasks
**Function**: `auxeira-aux-tasks-prod`  
**Method**: POST

**Request Body**:
```json
{
  "context": {
    "startupName": "MyStartup",
    "sseScore": 72,
    "targetSse": 85,
    "stage": "seed",
    "mrrTrend": "$18K (+23% MoM)",
    "milestones": "Reached $18K MRR",
    "pastTasks": "Completed 5 customer interviews"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "recommendedTasks": [
      {
        "title": "Customer Interview Series (5+ Interviews)",
        "description": "Conduct 5 in-depth customer interviews to validate PMF...",
        "dueInDays": 7,
        "impactType": "SSE",
        "impactValue": 15,
        "difficulty": "Medium",
        "auxReward": 450
      }
    ]
  }
}
```

#### 11. AUX Redeem
**Function**: `auxeira-aux-redeem-prod`  
**Method**: POST

**Request Body**:
```json
{
  "context": {
    "startupName": "MyStartup",
    "sseScore": 72,
    "stage": "seed",
    "auxBalance": 500,
    "milestones": "Reached $18K MRR",
    "upcomingGoals": "Fundraising"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "redemptionCatalog": [
      {
        "title": "Series A VC Mentor Session",
        "costAux": 500,
        "description": "1-hour 1-on-1 session with a Series A-experienced VC...",
        "category": "Mentorship",
        "urgencyBadge": "Limited",
        "deliveryTimeline": "1 week",
        "successMetrics": "Refined pitch strategy and 3-5 actionable tips",
        "stageRelevance": "Critical as you approach Series A readiness",
        "specialFeatures": "Post-session summary report with action items"
      }
    ]
  }
}
```

### Activity Rewards Tab

#### 12. Activity Rewards
**Function**: `auxeira-activity-rewards-prod`  
**Method**: POST

**Request Body**:
```json
{
  "context": {
    "stage": "seed",
    "teamSize": "1-10",
    "sector": "tech",
    "geography": "Global",
    "submissionFrequency": "weekly",
    "activityType": "customer_interviews",
    "descriptionLength": 250,
    "insightDensity": 0.8,
    "dataReferences": 5,
    "learningStatements": 3,
    "actionItems": 2,
    "executionQuality": 0.85,
    "consistencyPattern": 4
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "activityAssessment": {
      "qualityScore": 0.85,
      "qualityTier": "Gold",
      "baseReward": 150,
      "stageMultiplier": 1.0,
      "qualityPremium": 1.2,
      "consistencyBonus": 1.25,
      "totalReward": 225,
      "feedback": "Excellent submission! Your activity shows strong insight density...",
      "improvementTips": ["Consider adding quantitative metrics..."],
      "benchmarkComparison": "Your submission quality is in the top 20%..."
    },
    "ecosystemInsights": {
      "yourRank": "Top 20% of seed-stage startups",
      "commonPatterns": ["Successful startups conduct interviews weekly..."],
      "recommendedActivities": ["Customer validation interviews..."]
    }
  }
}
```

### Partner Rewards Tab

#### 13. Partner Rewards
**Function**: `auxeira-partner-rewards-prod`  
**Method**: POST

**Request Body**:
```json
{
  "context": {
    "stage": "seed",
    "activityHistory": "Regular customer interviews, product updates",
    "qualityMetrics": "High execution quality",
    "growthBlockers": "None identified",
    "fundingLevel": "$100K-$500K",
    "sector": "SaaS",
    "geography": "Global"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "partnerRecommendations": [
      {
        "name": "Founder Legal Package",
        "price": "$2,500",
        "problemSolved": "Comprehensive legal setup: incorporation, founder agreements...",
        "whyNow": "Legal mistakes in early days can cost 10x more to fix later...",
        "stageFit": ["pre-seed", "seed"],
        "triggerMetrics": ["Multiple founders", "No legal activities"],
        "successEvidence": "Startups with proper legal foundation avoid 80% of disputes",
        "category": "Legal",
        "urgency": "HIGH"
      }
    ]
  }
}
```

## Error Handling

All endpoints return a consistent error format:

```json
{
  "success": false,
  "error": "Error message here",
  "fallback": true,
  "data": { /* Fallback data if available */ }
}
```

## CORS Headers

All responses include:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Methods: POST, OPTIONS
```

## Rate Limiting

TBD - To be configured at API Gateway level

## Authentication

TBD - To be configured at API Gateway level

## Monitoring

All Lambda functions log to CloudWatch:
- Request/response payloads
- Execution time
- Error messages
- Fallback usage

## Next Steps

1. Create API Gateway endpoints for all 10 new functions
2. Configure CORS policies
3. Set up authentication/authorization
4. Configure rate limiting
5. Set up monitoring and alerts
6. Update frontend to call new endpoints
7. Test end-to-end integration
