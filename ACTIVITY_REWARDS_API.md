# Activity Rewards API Documentation

## Overview

The Activity Rewards System implements a complete workflow for startups to submit activities, receive AI assessments, and earn tokens based on quality and consistency.

## Workflow

```
1. Nudge/Selection → GET /api/activities
2. Submission → POST /api/activities/submit
3. Assessment → AI Agent processes submission (async)
4. Calculation → POST /api/activities/calculate-tokens
5. Award/Display → GET /api/activities/history
```

## API Endpoints

### 1. Get Activities Catalog

**Endpoint:** `GET /api/activities`

**Description:** Fetch list of available activities, optionally filtered by startup stage, category, or tier.

**Query Parameters:**
- `stage` (optional): `pre-seed`, `seed`, `series-a`, `series-b`, `series-c`, `growth`, `late-stage`
- `category` (optional): Activity category string
- `tier` (optional): `bronze`, `silver`, `gold`

**Response:**
```json
{
  "success": true,
  "message": "Activities fetched successfully",
  "data": {
    "total": 25,
    "activities": [
      {
        "id": 1,
        "name": "Customer Interviews Conducted",
        "description": "Conduct 5 qualified customer interviews",
        "category": "Customer Discovery & Validation",
        "tier": "bronze",
        "base_tokens": 20,
        "nudges": [
          "Prepare a structured interview guide with 5-7 key questions",
          "Record or take detailed notes during the interview",
          "Focus on understanding pain points, not pitching your solution",
          "Follow up with interviewees within 24 hours"
        ],
        "created_at": "2025-10-27T10:00:00Z",
        "updated_at": "2025-10-27T10:00:00Z"
      }
    ]
  }
}
```

### 2. Get Activity Details

**Endpoint:** `GET /api/activities/:id`

**Description:** Get details of a specific activity.

**Parameters:**
- `id` (path): Activity ID (integer)

**Response:**
```json
{
  "success": true,
  "message": "Activity fetched successfully",
  "data": {
    "id": 1,
    "name": "Customer Interviews Conducted",
    "description": "Conduct 5 qualified customer interviews",
    "category": "Customer Discovery & Validation",
    "tier": "bronze",
    "base_tokens": 20,
    "nudges": ["..."],
    "created_at": "2025-10-27T10:00:00Z",
    "updated_at": "2025-10-27T10:00:00Z"
  }
}
```

### 3. Submit Activity

**Endpoint:** `POST /api/activities/submit`

**Description:** Submit an activity for AI assessment.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "activity_id": 1,
  "proof_text": "Conducted 5 customer interviews with detailed notes. Key insights: customers struggle with X, Y, and Z. Documented pain points and validated our solution hypothesis.",
  "proof_urls": [
    "https://example.com/interview-notes.pdf",
    "https://example.com/recording-1.mp4"
  ],
  "metadata": {
    "interview_count": 5,
    "avg_duration_minutes": 45
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Activity submitted successfully",
  "data": {
    "submission_id": "550e8400-e29b-41d4-a716-446655440000",
    "activity_id": 1,
    "activity_name": "Customer Interviews Conducted",
    "status": "pending",
    "created_at": "2025-10-27T11:00:00Z",
    "next_step": "AI assessment in progress"
  }
}
```

### 4. Get User Submissions

**Endpoint:** `GET /api/activities/submissions`

**Description:** Get user's activity submissions with optional filtering.

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (optional): `pending`, `processing`, `approved`, `rejected`
- `limit` (optional): Number of results (1-100, default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "message": "Submissions fetched successfully",
  "data": {
    "total": 15,
    "limit": 20,
    "offset": 0,
    "submissions": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "activity_id": 1,
        "activity_name": "Customer Interviews Conducted",
        "tier": "bronze",
        "proof_text": "...",
        "proof_urls": ["..."],
        "status": "approved",
        "quality_score": 0.9,
        "consistency_weeks": 4,
        "tokens_awarded": 36,
        "ai_feedback": "Excellent documentation of customer insights...",
        "created_at": "2025-10-27T11:00:00Z",
        "assessed_at": "2025-10-27T11:15:00Z"
      }
    ]
  }
}
```

### 5. Get Submission Details

**Endpoint:** `GET /api/activities/submissions/:id`

**Description:** Get details of a specific submission.

**Headers:**
- `Authorization: Bearer <token>`

**Parameters:**
- `id` (path): Submission UUID

**Response:**
```json
{
  "success": true,
  "message": "Submission fetched successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "activity_id": 1,
    "activity_name": "Customer Interviews Conducted",
    "activity_description": "Conduct 5 qualified customer interviews",
    "tier": "bronze",
    "base_tokens": 20,
    "proof_text": "...",
    "proof_urls": ["..."],
    "status": "approved",
    "quality_score": 0.9,
    "consistency_weeks": 4,
    "tokens_awarded": 36,
    "ai_feedback": "...",
    "metadata": {},
    "created_at": "2025-10-27T11:00:00Z",
    "assessed_at": "2025-10-27T11:15:00Z"
  }
}
```

### 6. Calculate Tokens

**Endpoint:** `POST /api/activities/calculate-tokens`

**Description:** Calculate tokens for an activity submission after AI assessment.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "submission_id": "550e8400-e29b-41d4-a716-446655440000",
  "quality_score": 0.9,
  "consistency_weeks": 4
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tokens calculated and awarded successfully",
  "data": {
    "submission_id": "550e8400-e29b-41d4-a716-446655440000",
    "tokens_awarded": 36,
    "quality_score": 0.9,
    "consistency_weeks": 4,
    "breakdown": {
      "base_tokens": 20,
      "quality_bonus": 1.5,
      "stage_multiplier": 1.2,
      "consistency_bonus": 1.0
    }
  }
}
```

### 7. Get Activity History

**Endpoint:** `GET /api/activities/history`

**Description:** Get user's complete activity history with token totals.

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `start_date` (optional): ISO 8601 date string
- `end_date` (optional): ISO 8601 date string

**Response:**
```json
{
  "success": true,
  "message": "Activity history fetched successfully",
  "data": {
    "totals": {
      "total_activities": 15,
      "total_tokens": 1250,
      "approved": 12,
      "pending": 3,
      "by_tier": {
        "bronze": 8,
        "silver": 5,
        "gold": 2
      }
    },
    "activities": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "activity_id": 1,
        "activity_name": "Customer Interviews Conducted",
        "category": "Customer Discovery & Validation",
        "tier": "bronze",
        "tokens_awarded": 36,
        "quality_score": 0.9,
        "status": "approved",
        "created_at": "2025-10-27T11:00:00Z",
        "assessed_at": "2025-10-27T11:15:00Z"
      }
    ]
  }
}
```

## Token Calculation Algorithm

The token calculation follows the Auxeira Smart Reward Algorithm:

```
final_tokens = base_tokens × quality_bonus × stage_multiplier × consistency_bonus
```

### Quality Bonus
- `quality_score < 0.7`: 1.0x (no bonus)
- `0.7 ≤ quality_score < 0.85`: 1.2x
- `quality_score ≥ 0.85`: 1.5x

### Stage Multiplier
- Pre-Seed: 1.5x
- Seed: 1.3x
- Series A: 1.1x
- Series B: 0.9x
- Series C: 0.8x
- Growth: 0.7x
- Late-Stage: 0.6x

### Consistency Bonus
- 4 weeks: 1.0x (no bonus)
- 8 weeks: 1.1x
- 12 weeks: 1.25x
- 24 weeks: 1.5x
- 52 weeks: 2.0x

## Database Schema

### Tables

1. **activities** - Catalog of all rewarded activities
2. **activity_submissions** - User submissions for assessment
3. **token_transactions** - All token movements
4. **token_balances** - Current token balance per user/startup

### Migration

Run the migration to create tables:

```bash
node run-migration.js
```

Or manually execute:

```bash
psql -U postgres -d auxeira_central -f src/database/migrations/005_activity_rewards.sql
```

## Integration with Frontend

### Example: Fetch Activities

```javascript
const fetchActivities = async () => {
  const response = await fetch('https://api.auxeira.com/api/activities', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.data.activities;
};
```

### Example: Submit Activity

```javascript
const submitActivity = async (activityId, proofText, proofUrls) => {
  const response = await fetch('https://api.auxeira.com/api/activities/submit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      activity_id: activityId,
      proof_text: proofText,
      proof_urls: proofUrls
    })
  });
  const data = await response.json();
  return data.data;
};
```

### Example: Get Activity History

```javascript
const getActivityHistory = async () => {
  const response = await fetch('https://api.auxeira.com/api/activities/history', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.data;
};
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "details": []
}
```

Common error codes:
- `VALIDATION_ERROR` - Invalid request parameters
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Missing or invalid authentication
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_SERVER_ERROR` - Server error

## Rate Limiting

- 100 requests per 15 minutes per IP address
- Applies to all Activity Rewards endpoints

## Authentication

All endpoints (except health checks) require JWT authentication:

```
Authorization: Bearer <jwt_token>
```

Obtain token from `/api/auth/login` endpoint.

## Next Steps

1. **Run Migration**: Execute `005_activity_rewards.sql` to create database tables
2. **Start Server**: Run `npm start` to start the backend server
3. **Test Endpoints**: Use Postman or curl to test API endpoints
4. **Integrate Frontend**: Update dashboard to call Activity Rewards API
5. **Implement AI Assessment**: Add AI service to process submissions and generate quality scores

## Support

For questions or issues, contact the Auxeira development team.
