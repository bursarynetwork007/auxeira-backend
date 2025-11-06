# Auxeira Platform - Current Database Structure Analysis

**Date:** November 6, 2025  
**Analysis Scope:** Production DynamoDB database + Dashboard features  
**Purpose:** Document existing structure and identify optimization opportunities for go-live

---

## Executive Summary

The Auxeira platform currently operates on a **4-table DynamoDB architecture** with **1,018 total records**. The system supports **6 user types** and **23 dashboards** (6 main + 17 SDG). While the core infrastructure is functional, significant opportunities exist to enhance data collection through chatbot integration, document uploads, and user engagement tracking to optimize the user experience before going live.

---

## Current Database Architecture

### Table 1: auxeira-users-prod (11 records)

**Purpose:** User authentication and profile management

**Schema:**
```
PK: USER#{user_id}
SK: PROFILE | SETTINGS | SUBSCRIPTION
```

**Current Data Fields:**
- email (unique identifier)
- password_hash (bcrypt)
- full_name
- user_type (startup_founder, angel_investor, vc, corporate_partner, government, admin)
- created_at
- last_login
- status (active, inactive, suspended)

**Missing Critical Fields:**
- phone_number
- company_name
- job_title
- linkedin_url
- twitter_handle
- profile_photo_url
- timezone
- language_preference
- email_verified (boolean)
- phone_verified (boolean)
- onboarding_completed (boolean)
- onboarding_step (current step in flow)
- referral_source
- utm_parameters (marketing attribution)

---

### Table 2: auxeira-user-startup-mapping-prod (1 record)

**Purpose:** Links users to their startup profiles

**Schema:**
```
PK: USER#{user_id}
SK: STARTUP#{startup_id}
```

**Current Data Fields:**
- user_id
- startup_id
- role (founder, co-founder, employee, advisor)
- created_at

**Missing Critical Fields:**
- equity_percentage
- start_date
- end_date (for former team members)
- is_primary (boolean - primary startup for user)
- permissions (array of permission strings)
- access_level (admin, editor, viewer)

---

### Table 3: auxeira-startup-profiles-prod (1,000 records)

**Purpose:** Core startup company information

**Schema:**
```
PK: STARTUP#{startup_id}
SK: PROFILE | METRICS | ACTIVITIES
```

**Current Data Fields (from API response):**
- startup_id
- company_name
- industry (FinTech 19.4%, HealthTech 14.8%, EdTech 11%)
- stage (Pre-Seed, Seed, Series A, B, C+)
- sse_score (0-100)
- mrr (Monthly Recurring Revenue)
- growth_rate (percentage)
- total_customers
- team_size
- created_at
- updated_at

**Missing Critical Fields:**

**Company Details:**
- legal_name
- incorporation_country
- incorporation_date
- company_registration_number
- tax_id
- headquarters_address
- website_url
- logo_url
- tagline
- elevator_pitch (short description)
- detailed_description
- founded_date
- business_model (B2B, B2C, B2B2C, Marketplace, etc.)

**Financial Metrics:**
- total_funding_raised
- last_funding_round
- last_funding_date
- last_funding_amount
- valuation
- arr (Annual Recurring Revenue)
- revenue_last_month
- revenue_last_quarter
- revenue_last_year
- gross_margin
- net_margin
- ebitda
- cash_balance
- monthly_burn_rate
- runway_months
- cac (Customer Acquisition Cost)
- ltv (Lifetime Value)
- ltv_cac_ratio
- churn_rate
- nrr (Net Revenue Retention)
- arr_growth_rate
- payback_period

**Product & Market:**
- product_description
- target_market
- market_size_tam
- market_size_sam
- market_size_som
- competitive_advantages
- key_competitors (array)
- unique_value_proposition
- technology_stack (array)
- ip_patents (array)

**Team & Operations:**
- founder_names (array)
- founder_backgrounds (array)
- key_team_members (array)
- advisors (array)
- board_members (array)
- total_employees
- engineering_team_size
- sales_team_size
- marketing_team_size
- customer_success_team_size
- remote_policy (fully_remote, hybrid, office)

**Traction & Metrics:**
- total_users
- active_users_monthly
- active_users_daily
- user_growth_rate
- customer_retention_rate
- nps_score (Net Promoter Score)
- customer_satisfaction_score
- product_market_fit_score

**Funding & Investors:**
- total_funding_rounds
- investors (array of investor names)
- lead_investors (array)
- angel_investors (array)
- vc_firms (array)
- funding_history (array of objects with date, amount, round, investors)

**ESG/SSE Metrics:**
- sdg_alignment (array of SDG numbers 1-17)
- environmental_impact_score
- social_impact_score
- governance_score
- carbon_footprint
- diversity_metrics
- community_impact_metrics

**Subscription & Platform:**
- subscription_tier (Growth, Scale, Enterprise)
- subscription_status (active, trial, cancelled, expired)
- subscription_start_date
- subscription_end_date
- subscription_mrr
- aux_token_balance
- aux_tokens_earned_total
- aux_tokens_spent_total
- partner_tier (Bronze, Silver, Gold, Platinum)
- partner_tier_progress

---

### Table 4: auxeira-startup-activities-prod (6 records)

**Purpose:** Track user actions and engagement

**Schema:**
```
PK: STARTUP#{startup_id}
SK: ACTIVITY#{timestamp}
```

**Current Data Fields:**
- startup_id
- activity_type
- timestamp
- description

**Missing Critical Fields:**

**Activity Tracking:**
- user_id (who performed the activity)
- activity_category (metric_update, document_upload, milestone_completed, etc.)
- activity_subcategory
- activity_value (numeric value if applicable)
- activity_metadata (JSON object with additional details)
- ip_address
- user_agent
- device_type (desktop, mobile, tablet)
- browser
- location (city, country)
- session_id
- aux_tokens_earned (if applicable)
- aux_tokens_spent (if applicable)

**Engagement Metrics:**
- page_views
- time_on_page
- tab_switches
- feature_usage
- button_clicks
- form_submissions
- search_queries
- filter_applications
- chart_interactions
- export_actions
- share_actions

**AI Coach Interactions:**
- coach_messages_sent
- coach_messages_received
- nudge_views
- nudge_clicks
- nudge_completions
- coach_satisfaction_rating

**Document Uploads:**
- document_type (pitch_deck, financial_statement, business_plan, etc.)
- document_name
- document_size
- document_url (S3 path)
- document_upload_date
- document_status (pending_review, approved, rejected)
- document_reviewer_id
- document_review_date
- document_review_notes

---

## Missing Database Tables

### Table 5: auxeira-activities-catalog (NEEDED)

**Purpose:** Define available activities for the reward system

**Schema:**
```
PK: ACTIVITY#{activity_id}
SK: VERSION#{version}
```

**Fields:**
- activity_id
- activity_name
- activity_description
- activity_category (bronze, silver, gold)
- aux_tokens_reward
- proof_requirements (array of required proof types)
- validation_criteria
- is_active (boolean)
- created_at
- updated_at

---

### Table 6: auxeira-activity-submissions (NEEDED)

**Purpose:** Track activity submissions and proof

**Schema:**
```
PK: SUBMISSION#{submission_id}
SK: STARTUP#{startup_id}
```

**Fields:**
- submission_id
- startup_id
- user_id
- activity_id
- submission_date
- proof_documents (array of S3 URLs)
- proof_description
- submission_status (pending, under_review, approved, rejected)
- reviewer_id
- review_date
- review_notes
- aux_tokens_awarded
- quality_score (0-100)

---

### Table 7: auxeira-peer-assessments (NEEDED)

**Purpose:** Track peer review of activity submissions

**Schema:**
```
PK: ASSESSMENT#{assessment_id}
SK: SUBMISSION#{submission_id}
```

**Fields:**
- assessment_id
- submission_id
- assessor_startup_id
- assessor_user_id
- assessment_date
- quality_score (0-100)
- feedback_text
- is_valid (boolean)
- aux_tokens_earned_by_assessor

---

### Table 8: auxeira-events (NEEDED)

**Purpose:** Industry events and partner offerings

**Schema:**
```
PK: EVENT#{event_id}
SK: DATE#{event_date}
```

**Fields:**
- event_id
- event_name
- event_description
- event_type (funding, technology, networking, partner)
- event_format (in_person, virtual, hybrid)
- event_date_start
- event_date_end
- event_location_city
- event_location_country
- event_location_venue
- event_url
- registration_url
- auxeira_discount_code
- auxeira_discount_percentage
- partner_id
- max_attendees
- current_registrations
- is_featured (boolean)
- created_at

---

### Table 9: auxeira-event-registrations (NEEDED)

**Purpose:** Track event registrations

**Schema:**
```
PK: REGISTRATION#{registration_id}
SK: EVENT#{event_id}
```

**Fields:**
- registration_id
- event_id
- startup_id
- user_id
- registration_date
- registration_status (registered, attended, cancelled, no_show)
- discount_used (boolean)
- discount_amount
- attendance_confirmed (boolean)
- attendance_date
- feedback_rating (1-5)
- feedback_text

---

### Table 10: auxeira-partners (NEEDED)

**Purpose:** Partner companies and their offerings

**Schema:**
```
PK: PARTNER#{partner_id}
SK: OFFERING#{offering_id}
```

**Fields:**
- partner_id
- partner_name
- partner_description
- partner_logo_url
- partner_website
- partner_category (cloud, legal, marketing, hr, finance, etc.)
- partner_tier_requirement (bronze, silver, gold, platinum)
- discount_type (percentage, fixed_amount, free_trial, credits)
- discount_value
- discount_description
- terms_and_conditions
- activation_url
- is_active (boolean)

---

### Table 11: auxeira-partner-activations (NEEDED)

**Purpose:** Track partner benefit usage

**Schema:**
```
PK: ACTIVATION#{activation_id}
SK: STARTUP#{startup_id}
```

**Fields:**
- activation_id
- startup_id
- user_id
- partner_id
- offering_id
- activation_date
- discount_claimed
- savings_amount
- status (active, expired, cancelled)
- expiry_date
- usage_notes

---

### Table 12: auxeira-investor-matches (NEEDED)

**Purpose:** Track investor-startup matching

**Schema:**
```
PK: MATCH#{match_id}
SK: STARTUP#{startup_id}
```

**Fields:**
- match_id
- startup_id
- investor_name
- investor_type (angel, vc, corporate)
- investor_focus (series_a, series_b, etc.)
- investor_industry_focus
- match_score (0-100)
- match_reasons (array)
- introduction_status (pending, introduced, meeting_scheduled, passed)
- introduction_date
- introduction_by (user_id)
- meeting_date
- outcome (invested, passed, ongoing)
- investment_amount (if applicable)

---

### Table 13: auxeira-funding-readiness-checklist (NEEDED)

**Purpose:** Track Series A readiness milestones

**Schema:**
```
PK: STARTUP#{startup_id}
SK: MILESTONE#{milestone_id}
```

**Fields:**
- startup_id
- milestone_id
- milestone_name
- milestone_category (product, financial, team, legal, traction)
- milestone_description
- completion_status (not_started, in_progress, complete)
- completion_date
- proof_document_url
- reviewer_notes
- weight (importance for funding readiness score)

---

### Table 14: auxeira-chatbot-conversations (NEEDED)

**Purpose:** Store chatbot interactions for AI learning and support

**Schema:**
```
PK: CONVERSATION#{conversation_id}
SK: MESSAGE#{timestamp}
```

**Fields:**
- conversation_id
- startup_id
- user_id
- message_timestamp
- message_sender (user, ai, system)
- message_text
- message_intent (detected by AI)
- message_entities (extracted data)
- message_sentiment (positive, neutral, negative)
- ai_response
- ai_confidence_score
- user_satisfaction (thumbs up/down)
- aux_tokens_awarded (if applicable)
- follow_up_required (boolean)
- escalated_to_human (boolean)

---

### Table 15: auxeira-documents (NEEDED)

**Purpose:** Track all uploaded documents

**Schema:**
```
PK: DOCUMENT#{document_id}
SK: STARTUP#{startup_id}
```

**Fields:**
- document_id
- startup_id
- user_id (uploader)
- document_type (pitch_deck, financial_statement, business_plan, legal, contract, etc.)
- document_name
- document_description
- file_size_bytes
- file_format (pdf, docx, xlsx, pptx, etc.)
- s3_bucket
- s3_key
- upload_date
- last_modified_date
- version_number
- is_latest_version (boolean)
- access_level (private, team, investors, public)
- download_count
- view_count
- shared_with (array of user_ids)
- tags (array)
- ai_extracted_data (JSON object with extracted metrics/insights)

---

### Table 16: auxeira-notifications (NEEDED)

**Purpose:** User notifications and alerts

**Schema:**
```
PK: USER#{user_id}
SK: NOTIFICATION#{timestamp}
```

**Fields:**
- notification_id
- user_id
- notification_type (nudge, milestone, reward, system, partner, event)
- notification_title
- notification_message
- notification_priority (low, medium, high, urgent)
- notification_status (unread, read, dismissed, actioned)
- created_at
- read_at
- action_url
- action_label
- aux_tokens_reward (if applicable)
- expires_at

---

### Table 17: auxeira-user-sessions (NEEDED)

**Purpose:** Track user sessions for analytics

**Schema:**
```
PK: SESSION#{session_id}
SK: USER#{user_id}
```

**Fields:**
- session_id
- user_id
- startup_id
- session_start
- session_end
- session_duration_seconds
- pages_viewed (array)
- features_used (array)
- device_type
- browser
- os
- ip_address
- location_city
- location_country
- referrer_url
- utm_source
- utm_medium
- utm_campaign

---

## Data Collection Enhancement Opportunities

### 1. Onboarding Flow Enhancement

**Current State:** Basic user registration with minimal data collection

**Proposed Enhancement:**
- Multi-step onboarding wizard
- Progressive disclosure of features
- Contextual data collection
- AI-powered company data enrichment
- Integration with LinkedIn/Crunchbase for auto-fill

**Data to Collect:**
- Founder background and experience
- Company formation details
- Current challenges and goals
- Funding needs and timeline
- Product/market fit stage
- Key metrics baseline

---

### 2. Chatbot Integration for Data Collection

**Purpose:** Conversational data gathering that feels natural

**Implementation:**
- Daily check-in prompts ("How's your MRR this month?")
- Milestone celebration and data capture
- Problem-solving conversations that reveal pain points
- Guided metric updates through conversation
- Document upload requests via chat
- Feedback collection through dialogue

**Data to Collect:**
- Real-time metric updates
- Qualitative feedback and insights
- Feature requests and pain points
- Success stories and case studies
- Competitive intelligence
- Market trends and observations

---

### 3. Document Upload & Analysis

**Purpose:** Extract structured data from unstructured documents

**Implementation:**
- Drag-and-drop document upload
- AI-powered document parsing
- Automatic metric extraction
- Version control and history
- Secure sharing with investors

**Documents to Collect:**
- Pitch decks → extract traction, team, market size
- Financial statements → extract revenue, expenses, burn rate
- Business plans → extract strategy, goals, milestones
- Customer interview notes → extract feedback, pain points
- Market research → extract TAM, SAM, SOM
- Legal documents → extract cap table, equity structure
- Product roadmaps → extract features, timeline

---

### 4. Activity Tracking & Behavioral Analytics

**Purpose:** Understand user engagement and optimize UX

**Implementation:**
- Event tracking on all user actions
- Heatmaps and session recordings
- Feature usage analytics
- A/B testing framework
- Cohort analysis

**Data to Collect:**
- Page views and time on page
- Button clicks and form submissions
- Tab navigation patterns
- Feature adoption rates
- Drop-off points in flows
- Search queries and filters used
- Export and share actions
- Mobile vs desktop usage

---

### 5. Integration with External Data Sources

**Purpose:** Enrich startup profiles with third-party data

**Proposed Integrations:**
- **Stripe/PayPal:** Automatic MRR tracking
- **Google Analytics:** User and traffic metrics
- **HubSpot/Salesforce:** CRM data sync
- **QuickBooks/Xero:** Financial data sync
- **GitHub:** Engineering activity metrics
- **LinkedIn:** Team and hiring data
- **Crunchbase:** Funding and competitor data
- **PitchBook:** Valuation and market data

---

### 6. Peer Benchmarking Data Collection

**Purpose:** Enable comparative analytics

**Implementation:**
- Anonymous aggregated benchmarks by industry/stage
- Opt-in data sharing for enhanced insights
- Competitive positioning analysis
- Industry trend reports

**Data to Collect:**
- Anonymized metrics from similar startups
- Industry averages and percentiles
- Growth rate comparisons
- Funding timeline benchmarks
- Team size evolution patterns

---

## Database Optimization Recommendations

### 1. Implement Data Validation Layer

**Current Issue:** No validation on data entry

**Recommendation:**
- Add schema validation using AWS Lambda
- Implement business logic validation
- Add data quality scores
- Flag incomplete or inconsistent data

---

### 2. Add Data Versioning

**Current Issue:** No historical tracking of changes

**Recommendation:**
- Implement event sourcing pattern
- Store all metric changes with timestamps
- Enable time-travel queries
- Support rollback and audit trails

---

### 3. Implement Caching Strategy

**Current Issue:** Direct DynamoDB queries for every request

**Recommendation:**
- Add ElastiCache (Redis) layer
- Cache frequently accessed data
- Implement cache invalidation strategy
- Reduce DynamoDB read costs

---

### 4. Add Full-Text Search

**Current Issue:** Limited search capabilities

**Recommendation:**
- Integrate Amazon OpenSearch
- Index startup profiles, documents, activities
- Enable fuzzy search and filters
- Support advanced queries

---

### 5. Implement Data Pipeline

**Current Issue:** No automated data processing

**Recommendation:**
- Use AWS Glue for ETL
- Schedule daily metric calculations
- Generate automated insights
- Create data warehouse for analytics

---

## Go-Live Readiness Assessment

### Critical Gaps to Address Before Launch

| Gap | Impact | Priority | Effort |
|-----|--------|----------|--------|
| Missing activity submission tracking | High - Core feature incomplete | P0 | Medium |
| No document storage system | High - Can't collect key data | P0 | Medium |
| Missing chatbot conversation storage | High - Can't learn from users | P0 | Low |
| No event registration tracking | Medium - Partner value unclear | P1 | Low |
| Missing peer assessment system | Medium - Gamification incomplete | P1 | Medium |
| No investor matching data | Medium - Key value prop missing | P1 | Medium |
| Limited user profile fields | Medium - Incomplete personalization | P1 | Low |
| No session tracking | Low - Analytics limited | P2 | Low |
| Missing notification system | Low - Engagement suboptimal | P2 | Medium |

### Recommended Launch Timeline

**Phase 1 (Pre-Launch - 2 weeks):**
- Implement activity submissions table
- Add document storage system
- Create chatbot conversation logging
- Enhance user profile fields
- Add basic session tracking

**Phase 2 (Launch - Week 1):**
- Launch with core features
- Monitor data collection
- Gather user feedback
- Fix critical bugs

**Phase 3 (Post-Launch - Weeks 2-4):**
- Add event registration tracking
- Implement peer assessment system
- Build investor matching
- Add notification system
- Integrate external data sources

**Phase 4 (Optimization - Months 2-3):**
- Implement caching layer
- Add full-text search
- Build data pipeline
- Create analytics dashboard
- Launch benchmarking features

---

## Conclusion

The current Auxeira database provides a solid foundation with 1,018 records across 4 tables supporting 6 user types and 23 dashboards. However, to maximize data collection and optimize user experience for go-live, we need to:

1. **Add 13 new tables** to support activity tracking, document management, and engagement analytics
2. **Enhance existing tables** with 100+ additional fields for comprehensive data capture
3. **Implement chatbot integration** for conversational data collection
4. **Build document upload system** with AI-powered extraction
5. **Add behavioral tracking** to understand user engagement
6. **Integrate external data sources** to enrich profiles automatically

By implementing these enhancements, Auxeira will be able to collect rich, actionable data that enables personalized experiences, predictive insights, and data-driven decision-making for both startups and the platform itself.

---

**Next Steps:**
1. Review and approve database design
2. Create technical implementation plan
3. Develop AI chatbot prompt for data collection
4. Build data migration scripts
5. Implement new tables and fields
6. Test data collection flows
7. Launch beta program
8. Monitor and optimize

