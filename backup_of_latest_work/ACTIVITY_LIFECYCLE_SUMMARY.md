# Auxeira Startup Success Engine (SSE) Activity Lifecycle Summary

This document summarizes the systematic, end-to-end workflow and the associated User Interface (UI) components created for the Auxeira Smart Reward Algorithm. This process guides startups through activity completion, AI-based assessment, and token award calculation using the existing Token Calculator API.

## 1. The Systematic "Activity Lifecycle" Workflow

The entire process is broken down into four sequential, user-centric steps, ensuring a transparent and rewarding experience for the startup.

| Step | UI Component | Purpose | Backend Engine |
| :--- | :--- | :--- | :--- |
| **1. Nudge & Selection** | **Activity Feed** | Guides the startup to select a high-impact, stage-appropriate activity. | Fetches activity catalog from API. |
| **2. Submission** | **Submission Form** | Captures the activity details, key findings, and verifiable proof (attachments). | Stores proof files and submission metadata. |
| **3. Assessment** | **AI Assessment Dashboard** | AI Agent processes the submission, generates a quality score, and the system calculates the token reward. | AI Agent (Simulated) & **Token Calculator API** |
| **4. Award & Display** | **Token Wallet** | Finalizes the reward and updates the startup's token balance and history. | Central Database Update. |

## 2. User Interface (UI) Deliverables

Two primary HTML files were created to represent the core user-facing and admin-facing parts of this systematic process. Both adhere to the "Ferrari-level" Bloomberg Terminal aesthetic.

### 2.1. Activity Lifecycle UI (`activity-lifecycle.html`)

This is the **Startup-facing** interface, focusing on the Nudge, Selection, and Submission steps.

*   **File Location:** \`/frontend/activity-lifecycle.html\`
*   **Key Features:**
    *   **Progress Tracker:** Visual guide through the 4-step process.
    *   **Nudge/Guidance:** Displays best-practice tips for the selected activity to encourage high-quality submissions.
    *   **Proof Submission:** Includes a responsive form with a drag-and-drop file upload area.
    *   **Simulated Award:** Demonstrates the final token award with a detailed breakdown after a successful submission.

### 2.2. AI Assessment Dashboard (`ai-assessment-dashboard.html`)

This is the **Platform Admin/Moderator-facing** interface, focusing on the Assessment and Award steps.

*   **File Location:** \`/frontend/ai-assessment-dashboard.html\`
*   **Key Features:**
    *   **Assessment Queue:** A list of pending activities submitted by startups.
    *   **AI Quality Score:** Visualizes the AI Agent's simulated quality score with a progress bar and textual feedback.
    *   **Token Calculation Integration:** Simulates the call to the **Token Calculator API** to display the final token reward, including the application of the Stage Multiplier, Quality Bonus, and Consistency Bonus.
    *   **Action Buttons:** Dedicated buttons for "Approve & Award" and "Request Revision" to finalize the lifecycle.

## 3. Implementation Instructions (Coupling)

The two UI files and the Token Calculator API are designed to work together:

| Component | Responsibility | Integration Point |
| :--- | :--- | :--- |
| **`activity-lifecycle.html`** | Front-end data collection and submission. | After submission, the front-end would call the **AI Agent** (simulated in the current code) to assess the proof. |
| **AI Agent** (Simulated) | Generates the `quality_score` and `consistency_weeks`. | The AI Agent's output is then passed to the Token Calculator API. |
| **`token_calculator_api.py`** | Core business logic for token reward calculation. | Receives AI output and startup stage to calculate the final token amount. |
| **`ai-assessment-dashboard.html`** | Admin review and final award. | Displays the calculated token amount and quality score before the admin approves the final award. |

The next step in a live environment would be to replace the simulated AI assessment and API calls in the JavaScript of the HTML files with actual asynchronous API calls to the deployed `token_calculator_api.py` service.
