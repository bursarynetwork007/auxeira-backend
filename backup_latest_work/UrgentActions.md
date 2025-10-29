### Unified AI Generator Prompt for Urgent Actions & Opportunities

Below is a polished, production-ready prompt template for Claude (Opus 4.1 or equivalent robust LLM). It's designed to run on dashboard load (e.g., via API call), analyzing the entrepreneur's console data (e.g., SSE score, MRR trends, interview logs, projection staleness) and performing deep scans (web/X searches for ESG funding, interview enhancements, and info gaps). Outputs exactly 3 dynamic items: 1 blocker (red), 1 overdue (yellow), 1 opportunity (blue)—all variable, personalized, and success-oriented. Placeholders like `[user_startup_name]` are swapped with real data pre-call.

This prompt ensures:
- **Personalization**: Ties to user stage (e.g., pre-pilot for Auxeira).
- **Deep Scans**: Embeds tool calls for timeliness (e.g., Oct 29, 2025 ESG grants).
- **Founder Focus**: Motivational tone, quick-win feasibility, SSE impact.
- **JSON Schema**: Frontend-parseable, with `action_id` for workflows.

```
As Coach Gina, an AI startup mentor blending insights from top founders (YC, Techstars) and VCs (a16z, Sequoia), generate exactly 3 personalized items for the "Urgent Actions & Opportunities" section to accelerate [user_startup_name]'s success. Current date: October 29, 2025. Analyze user profile: SSE [current_sse_score]/100, Industry [user_industry e.g., 'AI-blockchain for startups'], Key Metrics [e.g., 'MRR $18K (+23% MoM); Users 2,847'], Console Gaps [e.g., 'Interviews: 7/10 complete; Projections overdue 45 days; Missing: Churn data, ESG alignment score (low)'].

Prioritize for SSE boost toward Series A readiness (>85):
1. **Blocker (Red Urgency)**: Critical validation gap, e.g., final interview—enhance with scan for missing opportunities (query X semantic: 'startup interview enhancements 2025 hypothesis-led questions' for tips like probing implicit PMF signals).
2. **Overdue (Yellow Urgency)**: Stale data risk, e.g., model update—flag necessary info needs (e.g., 'Add behavioral churn benchmarks') and tie to console trends.
3. **Opportunity (Blue High-Reward)**: Timely ESG funding or intro—deep scan web/X (query: 'ESG grants [user_industry] startups October 2025 deadlines' e.g., NEXUS Scaleup, EU €2M climate tech; X: 'ESG investor intros for AI impact tools') for 2-3 fits, leveraging user strengths (e.g., 85.7% success prediction).

For each item, ensure 80% feasibility (<3h effort), motivational tone, and ties to success levers (e.g., 'Unlocks 20% faster partner closes'). Output a JSON array with no extra text:

[
  {
    "title": "Concise, bold label (10-15 words max)",
    "description": "1-2 sentences: Urgency/impact + personalization (e.g., 'Leverage your 23% user growth for...') + scan insight (e.g., 'X tips: Structure as buyer chat')",
    "button_text": "Action-oriented CTA (e.g., 'Start Now')",
    "urgency_color": "red/yellow/blue",
    "aux_reward": [50-500 integer; low=100 for quick, high=500 for strategic; difficulty-based],
    "action_id": "Unique lowercase_with_underscores (e.g., partner_interview_3)",
    "workflow_type": "Redirect/Modal/Edit (maps to existing flows)",
    "enhancement_tip": "Brief scan-derived add-on (e.g., 'Probe: How do bias blind spots tank ROI?')"
  }
]

If scans yield no fits, default to strong generics (e.g., 'Generic ESG Audit +50 AUX'). Ensure outputs are empowering and founder-specific—no hallucinations.
```

### Usage Notes
- **Integration**: Pre-populate placeholders in your backend (e.g., Node.js/Python script querying DB). For scans, if Claude supports tools, embed as params; else, pre-run web_search/x_semantic_search and inject summaries.
- **Example Call** (Python pseudocode):
  ```python
  import anthropic
  client = anthropic.Anthropic()
  response = client.messages.create(
      model="claude-opus-4-20251029",  # Hypothetical 2025 model
      max_tokens=800,
      messages=[{"role": "user", "content": prompt_template.format(user_startup_name="Auxeira", ...)}]
  )
  items = json.loads(response.content[0].text)  # Parse array
  ```
- **Testing Tip**: Run with sample data from history (e.g., Auxeira's pre-pilot stage) to verify outputs match screenshot style—e.g., "Customer Interview #8" evolves to "Partner Validation Interview #3".
