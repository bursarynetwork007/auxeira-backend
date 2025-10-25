# Auxeira Smart Reward Algorithm: Token Calculator API Functional Specification and Implementation Brief

**Date:** October 24, 2025
**Author:** Manus AI
**Target Audience:** Developer, Business Analyst

## 1. Functional Specification (For Business Analyst)

### 1.1. Project Scope

This project implements a core business logic service for the Auxeira platform: the **Smart Reward Algorithm Token Calculator API**. This API is responsible for quantifying and rewarding verifiable, success-correlated activities performed by a startup on the platform.

The primary function is to calculate a final token reward for a batch of completed activities, applying a crucial **fairness mechanism** that adjusts the reward based on the startup's current funding stage (size).

### 1.2. Key Business Rules

1.  **Activity Tiers:** Activities are categorized into Bronze, Silver, and Gold tiers, each with a defined base token value.
2.  **Quality Bonus:** A bonus multiplier (up to **1.5x**) is applied based on the quality of the submitted proof (e.g., depth of interview notes, clarity of financial reports).
3.  **Consistency Bonus:** A bonus multiplier (up to **2.0x**) is applied to reward sustained effort and process adherence over time (e.g., 12-week streaks of metric review).
4.  **Stage-Based Fairness Mechanism (Startup Size Control):**
    *   A **Stage Multiplier** is applied to the reward to ensure it is more impactful for earlier-stage companies.
    *   The multiplier is highest for **Pre-Seed (1.5x)** and lowest for **Late-Stage (0.6x)**. This ensures the reward is meaningful relative to the startup's resources and maturity.
5.  **Output:** The API returns the final total token count and a detailed breakdown per activity, which is essential for audit trails and user transparency.

### 1.3. API Contract Summary

| Endpoint | Method | Description | Request Body | Response Body |
| :--- | :--- | :--- | :--- | :--- |
| \`/api/v1/calculate-tokens\` | POST | Calculates token reward based on activities and startup stage. | \`startup_stage\` (string), \`activities\` (array of objects) | \`total_tokens\` (integer), \`breakdown\` (array of objects), \`stage_multiplier\` (float) |
| \`/api/v1/activities\` | GET | Retrieves the full catalog of rewarded activities. | None | List of activities with ID, tier, and base tokens. |
| \`/api/v1/stages\` | GET | Retrieves the list of startup stages and their multipliers. | None | List of stages and their corresponding multipliers. |

---

## 2. Implementation Instruction (For Developer)

### 2.1. Code Location

*   **API Service File:** \`/utils/token_calculator_api.py\`
*   **API Documentation:** \`/utils/TOKEN_CALCULATOR_API_DOCS.md\`

### 2.2. Implementation Brief: Coupling the Documents

The core implementation is already complete in the provided Python file. The immediate task is to ensure the service is integrated into the platform's deployment and that all consumers of the API (e.g., the front-end dashboard, the Solana-based verification service) are aware of the contract.

1.  **Deployment:**
    *   The service is a standalone **FastAPI** application.
    *   It should be deployed as a microservice (e.g., via AWS Lambda/API Gateway, a dedicated container, or a simple EC2 instance).
    *   Ensure the required Python dependencies (`fastapi`, `uvicorn`, `pydantic`) are met in the deployment environment.

2.  **Integration:**
    *   Any service that needs to reward a startup (e.g., after a successful audit of submitted proof) must make a **POST** request to the \`/api/v1/calculate-tokens\` endpoint.
    *   The consuming service **MUST** correctly supply the `startup_stage` and the array of `activities` in the request body.

3.  **Testing and Validation:**
    *   The developer **MUST** use the example in the \`TOKEN_CALCULATOR_API_DOCS.md\` to perform a sanity check on the deployed endpoint.
    *   **Test Case:** Verify that a **Seed** stage startup completing Activity 17 (First Revenue, Gold tier) receives a final token reward of approximately **585 tokens** (Base 300 * Quality 1.5x * Stage 1.3x).

4.  **Code Review Focus:**
    *   Review the \`STAGE_MULTIPLIERS\` and \`ACTIVITY_CATALOG\` dictionaries in \`token_calculator_api.py\` to ensure they match the latest business requirements.
    *   Verify the mathematical implementation of the token calculation formula:
        **Final Tokens = Base Tokens * Quality Bonus * Stage Multiplier * Consistency Bonus**

This brief serves as the final instruction set for deploying and integrating the Token Calculator API into the Auxeira ecosystem.
