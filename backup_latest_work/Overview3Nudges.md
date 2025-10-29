#### Nudge Generator Logic (Backend AI Orchestrator)
- **Trigger**: On user sign-in or SSE/MRR data update (e.g., cron every 24h).
- **Core Prompt Template** (For Gina AI, per section):
  ```
  As Coach Gina, generate a single high-impact nudge for [Section: Growth/Validation/Funding] to boost [User Startup]'s SSE from [Current SSE] toward [Next Threshold, e.g., Series A at 85]. Context: [MRR Trend Summary], [Past Actions, e.g., 'Completed 3 interviews last month'], [User Stage, e.g., Seed]. Output JSON:
  - goal: Concise action title (<10 words, e.g., "Launch referral program for 25% CAC cut").
  - description: 1-sentence explainer with projected impact (e.g., "Projected 25% CAC reduction").
  - button_text: Action-oriented CTA (e.g., "Launch Now").
  - aux_reward: Integer (50-300, formula: base 75 + difficulty [low=1x/medium=1.5x/high=2x] based on est. effort: low<1h, med 1-3h, high>3h).
  - difficulty: "Low/Medium/High" (for internal logging).
  - workflow_type: "Modal/Redirect/Edit" (maps to UI flow).
  Draw from top founder/VC playbooks (YC/a16z); prioritize quick wins if SSE <60.
  ```
- **Personalization Hooks**: Infuse user signals (e.g., if CAC >$200, bias toward referrals). Rotate 2-3 variants per section quarterly via A/B.
- **Fallbacks**: If AI gen fails, default to safe templates (e.g., +100 AUX generic goal).
- **Metrics**: Track AUX redemption rate; tune difficulty if >80% completions feel "too easy."

---

#### 1. Growth Nudge Section
| Field              | Dynamic AI Output Examples (From Generator) |
|--------------------|---------------------------------------------|
| **Section Label**  | Growth (Fixed)                              |
| **Goal**           | "Optimize pricing tiers for 15% MRR uplift" (Alt: "Launch referral program for 25% CAC cut") |
| **Description**    | "Test dynamic pricing based on your $18K MRR—projected 15% uplift in 30 days." |
| **Button Text**    | "Test Pricing" (Alt: "Launch Referrals")    |
| **AUX Reward**     | +120 (Medium difficulty: 2h setup + A/B test) |
| **Expected Button Action** | Open dedicated Modal/Page for the generated task (e.g., Pricing Experiment Setup). |
| **Workflow Details** | - **UI Flow**: Modal loads AI plan (e.g., 3 pricing variants pre-filled). Resources: Editable template, checklist. "Mark Complete" unlocks AUX/SSE (+8 pts).<br>- **Per-Task AI Prompt** (On click): Extend generator with specifics, e.g., `Tailor a pricing test plan for [Goal] using [User Data]...`<br>- **Edge/Metrics**: Auto-A/B via Stripe integration; track uplift vs. projection. |

#### 2. Validation Nudge Section
| Field              | Dynamic AI Output Examples (From Generator) |
|--------------------|---------------------------------------------|
| **Section Label**  | Validation (Fixed)                          |
| **Goal**           | "Run 3 user surveys for PMF signals" (Alt: "Schedule 2 founder interviews") |
| **Description**    | "Need 3 more surveys to hit validation threshold—uncover pains in your fintech niche." |
| **Button Text**    | "Launch Survey" (Alt: "Book Interviews")    |
| **AUX Reward**     | +180 (High difficulty: Outreach + analysis, est. 4h) |
| **Expected Button Action** | Redirect to Integrated Tool (e.g., Typeform embed for surveys). |
| **Workflow Details** | - **UI Flow**: Pre-pop email/script with AI questions. Track via webhook/manual log; 3rd completion → AUX/SSE (+12 pts).<br>- **Per-Task AI Prompt** (On click): `Generate survey template for [Goal], probing [User ICP]...`<br>- **Edge/Metrics**: Theme extraction on responses (NLP via Gina); velocity to threshold. |

#### 3. Funding Nudge Section
| Field              | Dynamic AI Output Examples (From Generator) |
|--------------------|---------------------------------------------|
| **Section Label**  | Funding (Fixed)                             |
| **Goal**           | "Refine cap table for investor diligence" (Alt: "Update 18-month projections") |
| **Description**    | "Align cap table with recent $50K raise—prep for Series A term sheet reviews." |
| **Button Text**    | "Edit Cap Table" (Alt: "Forecast Revenue")  |
| **AUX Reward**     | +220 (High difficulty: Legal/financial tweaks, est. 5h) |
| **Expected Button Action** | Open Submission/Editing Interface (e.g., Carta-like uploader). |
| **Workflow Details** | - **UI Flow**: AI-flagged edits (e.g., "Focus: Dilution risks"). Upload/edit → Backend validate → AUX/SSE (+18 pts).<br>- **Per-Task AI Prompt** (On click): `Audit [Goal] for [User Trajectory], flag 3 risks...`<br>- **Edge/Metrics**: Parse success rate; anon benchmark sharing. |

---

### Why This Dynamic Approach Levels Up Founder Success
- **AI Magic**: Generator ensures nudges evolve (e.g., post-referral success → "Scale with affiliate partnerships? +140 AUX"). AUX feels fair—low-bar for momentum, high-reward for stretch goals.
- **Dashboard Polish**: Sections stay clean; AI outputs slot in seamlessly (e.g., goal as bold subheader). If multiple variants, carousel or "Swap Nudge" button.
- **Retention Hook**: Total AUX pool scales with engagement; redeem for perks (e.g., 500 AUX = VC intro call).
- **Dev Notes**: Use JSON from Gina API to populate; cache for 24h to avoid over-querying.
