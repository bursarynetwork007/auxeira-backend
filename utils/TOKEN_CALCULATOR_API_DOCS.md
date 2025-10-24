# Auxeira Smart Reward Algorithm - Token Calculator API

The Token Calculator API is a critical backend service for the Auxeira platform, responsible for calculating token rewards for startups based on verifiable activities. The algorithm implements a fairness mechanism by adjusting rewards based on the startup's funding stage, ensuring that rewards are **meaningful and proportional** to the resources and challenges faced by the startup.

## 1. Setup and Installation

The API is built using **FastAPI** and **Python 3.11+**.

### Prerequisites

1.  **Install Python Dependencies:**
    \`\`\`bash
    pip3 install fastapi uvicorn pydantic
    \`\`\`

2.  **Save the Code:**
    The API code is saved in the file: \`/home/ubuntu/auxeira-backend/backend/token_calculator_api.py\`

### Running the API

To start the server, navigate to the directory and run:

\`\`\`bash
uvicorn token_calculator_api:app --host 0.0.0.0 --port 8000
\`\`\`

The API will be available at \`http://localhost:8000\`.

## 2. Core Endpoint: Calculate Tokens

This is the main endpoint used to calculate the token reward for a batch of completed activities.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | \`/api/v1/calculate-tokens\` | Calculates the final token reward for a list of activities. |

### Request Body (`application/json`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| \`startup_stage\` | String (Enum) | Yes | The current funding stage of the startup. Must be one of: \`pre-seed\`, \`seed\`, \`series-a\`, \`series-b\`, \`series-c\`, \`growth\`, \`late-stage\`. |
| \`activities\` | Array of Objects | Yes | List of completed activities to be rewarded. |
| \`activities[].activity_id\` | Integer | Yes | ID of the rewarded activity (1-25). |
| \`activities[].quality_score\` | Float | No (Default: 1.0) | Score from 0.0 to 1.0 to apply a quality bonus. |
| \`activities[].consistency_weeks\` | Integer | No (Default: 0) | Number of consecutive weeks the activity has been performed for a consistency bonus. |

### Response Body (`application/json`)

| Field | Type | Description |
| :--- | :--- | :--- |
| \`total_tokens\` | Integer | The final sum of all calculated tokens. |
| \`startup_stage\` | String | The stage used for calculation. |
| \`stage_multiplier\` | Float | The multiplier applied based on the startup stage. |
| \`breakdown\` | Array of Objects | Detailed breakdown of token calculation per activity. |
| \`calculation_timestamp\` | String | UTC timestamp of the calculation. |
| \`summary\` | Object | Summary statistics (e.g., activity counts by tier). |

## 3. Startup Stage Multipliers (Fairness Mechanism)

The core fairness mechanism is the **Stage Multiplier**, which adjusts the reward to be more impactful for earlier-stage companies.

| Startup Stage | Multiplier | Rationale |
| :--- | :--- | :--- |
| \`pre-seed\` | **1.5x** | Highest multiplier: Maximize incentive for early, resource-constrained efforts. |
| \`seed\` | **1.3x** | High multiplier: Significant challenges remain, high incentive needed. |
| \`series-a\` | **1.1x** | Moderate multiplier: Established traction, but still building. |
| \`series-b\` | **0.9x** | Lower multiplier: More mature, greater internal resources. |
| \`series-c\` | **0.8x** | Lower multiplier: Advanced stage, scaling phase. |
| \`growth\` | **0.7x** | Lower multiplier: Scaling phase, rewards are less critical for motivation. |
| \`late-stage\` | **0.6x** | Lowest multiplier: Mature company, rewards are primarily for sustained process quality. |

## 4. Working Example

The following example demonstrates a **Seed-stage** startup completing three key activities:

*   **Activity 1 (Bronze):** Customer Interviews Conducted (Base: 20 tokens)
*   **Activity 4 (Silver):** MVP Launches & Iterations (Base: 75 tokens)
*   **Activity 17 (Gold):** First Revenue Achievement (Base: 300 tokens)

### Example Request

\`\`\`json
{
    "startup_stage": "seed",
    "startup_id": "STP-789",
    "activities": [
        {
            "activity_id": 1,
            "quality_score": 0.9,
            "consistency_weeks": 12
        },
        {
            "activity_id": 4,
            "quality_score": 0.8,
            "consistency_weeks": 0
        },
        {
            "activity_id": 17,
            "quality_score": 1.0,
            "consistency_weeks": 0
        }
    ]
}
\`\`\`

### Expected Calculation Breakdown

| Activity | Base Tokens | Quality Bonus | Consistency Bonus | Stage Multiplier (Seed: 1.3x) | Final Tokens |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Interviews** | 20 | 1.5x (score 0.9) | 1.25x (12 weeks) | 1.3x | **48** |
| **4. MVP Launch** | 75 | 1.2x (score 0.8) | 1.0x (0 weeks) | 1.3x | **117** |
| **17. First Revenue** | 300 | 1.5x (score 1.0) | 1.0x (0 weeks) | 1.3x | **585** |
| **TOTAL** | | | | | **750** |

*(Note: Final tokens are rounded down to the nearest integer.)*

### Example cURL Command

You can test the endpoint using the following cURL command (assuming the API is running locally on port 8000):

\`\`\`bash
curl -X POST "http://localhost:8000/api/v1/calculate-tokens" \
-H "Content-Type: application/json" \
-d '{
    "startup_stage": "seed",
    "startup_id": "STP-789",
    "activities": [
        {"activity_id": 1, "quality_score": 0.9, "consistency_weeks": 12},
        {"activity_id": 4, "quality_score": 0.8, "consistency_weeks": 0},
        {"activity_id": 17, "quality_score": 1.0, "consistency_weeks": 0}
    ]
}'
\`\`\`
