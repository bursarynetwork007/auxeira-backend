-- =====================================================
-- ESG/IMPACT DASHBOARD AND GOVERNMENT DASHBOARD MIGRATIONS
-- Migration: 004_esg_government_systems.sql
-- =====================================================

-- ESG/Impact Dashboard Tables
-- =====================================================

-- ESG Profiles
CREATE TABLE IF NOT EXISTS esg_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  overall_esg_score DECIMAL(5,2) DEFAULT 0 CHECK (overall_esg_score >= 0 AND overall_esg_score <= 100),
  environmental_score DECIMAL(5,2) DEFAULT 0 CHECK (environmental_score >= 0 AND environmental_score <= 100),
  social_score DECIMAL(5,2) DEFAULT 0 CHECK (social_score >= 0 AND social_score <= 100),
  governance_score DECIMAL(5,2) DEFAULT 0 CHECK (governance_score >= 0 AND governance_score <= 100),
  impact_score DECIMAL(5,2) DEFAULT 0 CHECK (impact_score >= 0 AND impact_score <= 100),
  sustainability_rating VARCHAR(10) DEFAULT 'D' CHECK (sustainability_rating IN ('AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C', 'D')),
  certification_level VARCHAR(20) DEFAULT 'none' CHECK (certification_level IN ('none', 'bronze', 'silver', 'gold', 'platinum', 'diamond')),
  reporting_framework JSONB DEFAULT '[]'::jsonb,
  assessment_frequency VARCHAR(20) DEFAULT 'annually' CHECK (assessment_frequency IN ('monthly', 'quarterly', 'semi_annually', 'annually', 'biannually')),
  verified BOOLEAN DEFAULT FALSE,
  verified_by VARCHAR(200),
  verification_date TIMESTAMP WITH TIME ZONE,
  verification_standard VARCHAR(50) DEFAULT 'none' CHECK (verification_standard IN ('isae_3000', 'aa1000as', 'gri_standards', 'iso_14064', 'pas_2060', 'custom', 'none')),
  public_disclosure BOOLEAN DEFAULT FALSE,
  stakeholder_engagement JSONB DEFAULT '{}'::jsonb,
  materiality_assessment JSONB DEFAULT '{}'::jsonb,
  risk_assessment JSONB DEFAULT '{}'::jsonb,
  opportunity_assessment JSONB DEFAULT '{}'::jsonb,
  performance_trends JSONB DEFAULT '[]'::jsonb,
  benchmark_comparisons JSONB DEFAULT '[]'::jsonb,
  improvement_targets JSONB DEFAULT '[]'::jsonb,
  action_plans JSONB DEFAULT '[]'::jsonb,
  reporting_history JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  awards_recognition JSONB DEFAULT '[]'::jsonb,
  media_coverage JSONB DEFAULT '[]'::jsonb,
  investor_interest JSONB DEFAULT '[]'::jsonb,
  assessment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  next_assessment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Environmental Metrics
CREATE TABLE IF NOT EXISTS environmental_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  carbon_footprint JSONB DEFAULT '{}'::jsonb,
  energy_consumption JSONB DEFAULT '{}'::jsonb,
  water_usage JSONB DEFAULT '{}'::jsonb,
  waste_management JSONB DEFAULT '{}'::jsonb,
  biodiversity_impact JSONB DEFAULT '{}'::jsonb,
  circular_economy JSONB DEFAULT '{}'::jsonb,
  climate_resilience JSONB DEFAULT '{}'::jsonb,
  environmental_compliance JSONB DEFAULT '{}'::jsonb,
  green_innovation JSONB DEFAULT '{}'::jsonb,
  supply_chain_environmental JSONB DEFAULT '{}'::jsonb,
  environmental_investments JSONB DEFAULT '[]'::jsonb,
  environmental_initiatives JSONB DEFAULT '[]'::jsonb,
  environmental_partnerships JSONB DEFAULT '[]'::jsonb,
  environmental_certifications JSONB DEFAULT '[]'::jsonb,
  environmental_risks JSONB DEFAULT '[]'::jsonb,
  environmental_opportunities JSONB DEFAULT '[]'::jsonb,
  reporting_period JSONB NOT NULL,
  data_quality VARCHAR(20) DEFAULT 'insufficient' CHECK (data_quality IN ('excellent', 'good', 'fair', 'poor', 'insufficient')),
  verification_status VARCHAR(30) DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'partially_verified', 'self_reported', 'unverified', 'disputed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Social Metrics
CREATE TABLE IF NOT EXISTS social_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  employee_wellbeing JSONB DEFAULT '{}'::jsonb,
  diversity_inclusion JSONB DEFAULT '{}'::jsonb,
  community_impact JSONB DEFAULT '{}'::jsonb,
  customer_welfare JSONB DEFAULT '{}'::jsonb,
  human_rights JSONB DEFAULT '{}'::jsonb,
  labor_practices JSONB DEFAULT '{}'::jsonb,
  product_responsibility JSONB DEFAULT '{}'::jsonb,
  social_innovation JSONB DEFAULT '{}'::jsonb,
  stakeholder_relations JSONB DEFAULT '{}'::jsonb,
  supply_chain_social JSONB DEFAULT '{}'::jsonb,
  social_investments JSONB DEFAULT '[]'::jsonb,
  social_initiatives JSONB DEFAULT '[]'::jsonb,
  social_partnerships JSONB DEFAULT '[]'::jsonb,
  social_certifications JSONB DEFAULT '[]'::jsonb,
  social_risks JSONB DEFAULT '[]'::jsonb,
  social_opportunities JSONB DEFAULT '[]'::jsonb,
  reporting_period JSONB NOT NULL,
  data_quality VARCHAR(20) DEFAULT 'insufficient' CHECK (data_quality IN ('excellent', 'good', 'fair', 'poor', 'insufficient')),
  verification_status VARCHAR(30) DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'partially_verified', 'self_reported', 'unverified', 'disputed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Governance Metrics
CREATE TABLE IF NOT EXISTS governance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  board_composition JSONB DEFAULT '{}'::jsonb,
  executive_compensation JSONB DEFAULT '{}'::jsonb,
  audit_compliance JSONB DEFAULT '{}'::jsonb,
  risk_management JSONB DEFAULT '{}'::jsonb,
  ethics_integrity JSONB DEFAULT '{}'::jsonb,
  transparency_disclosure JSONB DEFAULT '{}'::jsonb,
  stakeholder_rights JSONB DEFAULT '{}'::jsonb,
  cybersecurity JSONB DEFAULT '{}'::jsonb,
  data_privacy JSONB DEFAULT '{}'::jsonb,
  regulatory_compliance JSONB DEFAULT '{}'::jsonb,
  governance_policies JSONB DEFAULT '[]'::jsonb,
  governance_training JSONB DEFAULT '[]'::jsonb,
  governance_assessments JSONB DEFAULT '[]'::jsonb,
  governance_incidents JSONB DEFAULT '[]'::jsonb,
  governance_improvements JSONB DEFAULT '[]'::jsonb,
  reporting_period JSONB NOT NULL,
  data_quality VARCHAR(20) DEFAULT 'insufficient' CHECK (data_quality IN ('excellent', 'good', 'fair', 'poor', 'insufficient')),
  verification_status VARCHAR(30) DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'partially_verified', 'self_reported', 'unverified', 'disputed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Impact Measurements
CREATE TABLE IF NOT EXISTS impact_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  impact_framework VARCHAR(50) DEFAULT 'theory_of_change' CHECK (impact_framework IN ('theory_of_change', 'logic_model', 'impact_management_project', 'iris_plus', 'giin_compass', 'b_impact_assessment', 'social_value_uk', 'sroi', 'custom')),
  theory_of_change JSONB DEFAULT '{}'::jsonb,
  impact_objectives JSONB DEFAULT '[]'::jsonb,
  outcome_metrics JSONB DEFAULT '[]'::jsonb,
  output_metrics JSONB DEFAULT '[]'::jsonb,
  impact_indicators JSONB DEFAULT '[]'::jsonb,
  beneficiary_analysis JSONB DEFAULT '{}'::jsonb,
  geographic_impact JSONB DEFAULT '{}'::jsonb,
  temporal_impact JSONB DEFAULT '{}'::jsonb,
  impact_attribution JSONB DEFAULT '{}'::jsonb,
  impact_verification JSONB DEFAULT '{}'::jsonb,
  impact_monetization JSONB DEFAULT '{}'::jsonb,
  impact_scaling JSONB DEFAULT '{}'::jsonb,
  impact_sustainability JSONB DEFAULT '{}'::jsonb,
  impact_partnerships JSONB DEFAULT '[]'::jsonb,
  impact_investments JSONB DEFAULT '[]'::jsonb,
  impact_innovations JSONB DEFAULT '[]'::jsonb,
  impact_challenges JSONB DEFAULT '[]'::jsonb,
  impact_opportunities JSONB DEFAULT '[]'::jsonb,
  impact_stories JSONB DEFAULT '[]'::jsonb,
  impact_evidence JSONB DEFAULT '[]'::jsonb,
  reporting_period JSONB NOT NULL,
  measurement_methodology JSONB DEFAULT '{}'::jsonb,
  data_collection JSONB DEFAULT '{}'::jsonb,
  quality_assurance JSONB DEFAULT '{}'::jsonb,
  external_validation JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- SDG Alignments
CREATE TABLE IF NOT EXISTS sdg_alignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  aligned_sdgs JSONB DEFAULT '[]'::jsonb,
  primary_sdgs JSONB DEFAULT '[]'::jsonb,
  secondary_sdgs JSONB DEFAULT '[]'::jsonb,
  sdg_contributions JSONB DEFAULT '[]'::jsonb,
  sdg_indicators JSONB DEFAULT '[]'::jsonb,
  sdg_targets JSONB DEFAULT '[]'::jsonb,
  sdg_impact_measurement JSONB DEFAULT '{}'::jsonb,
  sdg_reporting JSONB DEFAULT '{}'::jsonb,
  sdg_partnerships JSONB DEFAULT '[]'::jsonb,
  sdg_innovations JSONB DEFAULT '[]'::jsonb,
  sdg_challenges JSONB DEFAULT '[]'::jsonb,
  sdg_opportunities JSONB DEFAULT '[]'::jsonb,
  sdg_progress_tracking JSONB DEFAULT '{}'::jsonb,
  sdg_verification JSONB DEFAULT '{}'::jsonb,
  sdg_communication JSONB DEFAULT '{}'::jsonb,
  reporting_period JSONB NOT NULL,
  alignment_methodology JSONB DEFAULT '{}'::jsonb,
  impact_quantification JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ESG Reports
CREATE TABLE IF NOT EXISTS esg_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('annual_sustainability', 'integrated_report', 'climate_disclosure', 'impact_report', 'esg_factsheet', 'regulatory_filing', 'investor_update', 'stakeholder_report')),
  reporting_framework VARCHAR(50) NOT NULL CHECK (reporting_framework IN ('gri', 'sasb', 'tcfd', 'iirc', 'cdp', 'ungc', 'sdg', 'eu_taxonomy', 'csrd', 'sec_climate', 'custom')),
  reporting_period JSONB NOT NULL,
  report_title VARCHAR(500) NOT NULL,
  executive_summary TEXT,
  materiality_matrix JSONB DEFAULT '{}'::jsonb,
  stakeholder_engagement_summary JSONB DEFAULT '{}'::jsonb,
  environmental_section JSONB DEFAULT '{}'::jsonb,
  social_section JSONB DEFAULT '{}'::jsonb,
  governance_section JSONB DEFAULT '{}'::jsonb,
  impact_section JSONB DEFAULT '{}'::jsonb,
  performance_highlights JSONB DEFAULT '[]'::jsonb,
  key_achievements JSONB DEFAULT '[]'::jsonb,
  challenges_lessons_learned JSONB DEFAULT '[]'::jsonb,
  future_commitments JSONB DEFAULT '[]'::jsonb,
  targets_progress JSONB DEFAULT '[]'::jsonb,
  data_methodology JSONB DEFAULT '{}'::jsonb,
  assurance_statement JSONB,
  third_party_verification JSONB,
  stakeholder_feedback_summary JSONB DEFAULT '{}'::jsonb,
  report_distribution JSONB DEFAULT '{}'::jsonb,
  report_accessibility JSONB DEFAULT '{}'::jsonb,
  report_format JSONB DEFAULT '[]'::jsonb,
  publication_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  next_report_date TIMESTAMP WITH TIME ZONE,
  report_url VARCHAR(1000),
  report_file_path VARCHAR(1000),
  download_count INTEGER DEFAULT 0,
  stakeholder_engagement_metrics JSONB DEFAULT '{}'::jsonb,
  report_quality_score DECIMAL(5,2) DEFAULT 0 CHECK (report_quality_score >= 0 AND report_quality_score <= 100),
  transparency_score DECIMAL(5,2) DEFAULT 0 CHECK (transparency_score >= 0 AND transparency_score <= 100),
  completeness_score DECIMAL(5,2) DEFAULT 0 CHECK (completeness_score >= 0 AND completeness_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ESG Analytics
CREATE TABLE IF NOT EXISTS esg_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  analysis_period JSONB NOT NULL,
  overall_performance JSONB DEFAULT '{}'::jsonb,
  environmental_analytics JSONB DEFAULT '{}'::jsonb,
  social_analytics JSONB DEFAULT '{}'::jsonb,
  governance_analytics JSONB DEFAULT '{}'::jsonb,
  impact_analytics JSONB DEFAULT '{}'::jsonb,
  trend_analysis JSONB DEFAULT '{}'::jsonb,
  peer_benchmarking JSONB DEFAULT '{}'::jsonb,
  industry_comparison JSONB DEFAULT '{}'::jsonb,
  risk_opportunity_analysis JSONB DEFAULT '{}'::jsonb,
  materiality_analysis JSONB DEFAULT '{}'::jsonb,
  stakeholder_sentiment_analysis JSONB DEFAULT '{}'::jsonb,
  performance_drivers JSONB DEFAULT '[]'::jsonb,
  improvement_recommendations JSONB DEFAULT '[]'::jsonb,
  investment_implications JSONB DEFAULT '[]'::jsonb,
  regulatory_compliance_status JSONB DEFAULT '{}'::jsonb,
  certification_readiness JSONB DEFAULT '{}'::jsonb,
  reporting_quality_assessment JSONB DEFAULT '{}'::jsonb,
  data_quality_assessment JSONB DEFAULT '{}'::jsonb,
  predictive_insights JSONB DEFAULT '[]'::jsonb,
  scenario_analysis JSONB DEFAULT '[]'::jsonb,
  sensitivity_analysis JSONB DEFAULT '[]'::jsonb,
  monte_carlo_simulation JSONB DEFAULT '{}'::jsonb,
  machine_learning_insights JSONB DEFAULT '[]'::jsonb,
  natural_language_processing JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  analysis_confidence DECIMAL(5,2) DEFAULT 0 CHECK (analysis_confidence >= 0 AND analysis_confidence <= 1),
  data_completeness DECIMAL(5,2) DEFAULT 0 CHECK (data_completeness >= 0 AND data_completeness <= 1),
  methodology JSONB DEFAULT '{}'::jsonb,
  limitations TEXT[],
  recommendations JSONB DEFAULT '[]'::jsonb,
  next_analysis_date TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Government Dashboard Tables
-- =====================================================

-- Government Profiles
CREATE TABLE IF NOT EXISTS government_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  government_level VARCHAR(20) NOT NULL CHECK (government_level IN ('federal', 'state', 'local', 'international', 'tribal', 'territorial')),
  jurisdiction VARCHAR(200) NOT NULL,
  regulatory_status VARCHAR(30) DEFAULT 'under_review' CHECK (regulatory_status IN ('compliant', 'non_compliant', 'partially_compliant', 'under_review', 'pending_approval', 'exempt', 'not_applicable')),
  compliance_score DECIMAL(5,2) DEFAULT 0 CHECK (compliance_score >= 0 AND compliance_score <= 100),
  policy_alignment_score DECIMAL(5,2) DEFAULT 0 CHECK (policy_alignment_score >= 0 AND policy_alignment_score <= 100),
  government_engagement_score DECIMAL(5,2) DEFAULT 0 CHECK (government_engagement_score >= 0 AND government_engagement_score <= 100),
  public_sector_readiness VARCHAR(20) DEFAULT 'not_ready' CHECK (public_sector_readiness IN ('not_ready', 'basic', 'intermediate', 'advanced', 'expert')),
  security_clearance_level VARCHAR(20) DEFAULT 'none' CHECK (security_clearance_level IN ('none', 'public_trust', 'confidential', 'secret', 'top_secret', 'top_secret_sci')),
  data_classification_level VARCHAR(20) DEFAULT 'public' CHECK (data_classification_level IN ('public', 'internal', 'confidential', 'restricted', 'top_secret')),
  procurement_eligibility VARCHAR(30) DEFAULT 'under_review' CHECK (procurement_eligibility IN ('eligible', 'conditionally_eligible', 'ineligible', 'suspended', 'debarred', 'under_review')),
  grant_funding_status VARCHAR(30) DEFAULT 'not_applied' CHECK (grant_funding_status IN ('not_applied', 'application_submitted', 'under_review', 'awarded', 'declined', 'active', 'completed', 'terminated')),
  policy_influence_score DECIMAL(5,2) DEFAULT 0 CHECK (policy_influence_score >= 0 AND policy_influence_score <= 100),
  regulatory_risk_score DECIMAL(5,2) DEFAULT 50 CHECK (regulatory_risk_score >= 0 AND regulatory_risk_score <= 100),
  compliance_history JSONB DEFAULT '[]'::jsonb,
  government_contracts JSONB DEFAULT '[]'::jsonb,
  policy_engagements JSONB DEFAULT '[]'::jsonb,
  regulatory_submissions JSONB DEFAULT '[]'::jsonb,
  government_partnerships JSONB DEFAULT '[]'::jsonb,
  public_consultations JSONB DEFAULT '[]'::jsonb,
  lobbying_activities JSONB DEFAULT '[]'::jsonb,
  advocacy_campaigns JSONB DEFAULT '[]'::jsonb,
  regulatory_monitoring JSONB DEFAULT '{}'::jsonb,
  policy_tracking JSONB DEFAULT '{}'::jsonb,
  compliance_calendar JSONB DEFAULT '[]'::jsonb,
  government_relations JSONB DEFAULT '{}'::jsonb,
  public_affairs JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Regulatory Compliance
CREATE TABLE IF NOT EXISTS regulatory_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  regulation_id VARCHAR(100) NOT NULL,
  regulation_name VARCHAR(500) NOT NULL,
  regulatory_body VARCHAR(200) NOT NULL,
  jurisdiction VARCHAR(200) NOT NULL,
  regulation_type VARCHAR(30) NOT NULL CHECK (regulation_type IN ('statute', 'regulation', 'guidance', 'standard', 'directive', 'policy', 'procedure', 'best_practice')),
  compliance_status VARCHAR(30) DEFAULT 'under_assessment' CHECK (compliance_status IN ('compliant', 'non_compliant', 'partially_compliant', 'under_assessment', 'remediation_in_progress', 'waiver_granted', 'exemption_granted')),
  compliance_percentage DECIMAL(5,2) DEFAULT 0 CHECK (compliance_percentage >= 0 AND compliance_percentage <= 100),
  last_assessment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  next_assessment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  compliance_officer VARCHAR(200),
  compliance_requirements JSONB DEFAULT '[]'::jsonb,
  compliance_evidence JSONB DEFAULT '[]'::jsonb,
  compliance_gaps JSONB DEFAULT '[]'::jsonb,
  remediation_plan JSONB DEFAULT '{}'::jsonb,
  compliance_costs JSONB DEFAULT '[]'::jsonb,
  compliance_timeline JSONB DEFAULT '{}'::jsonb,
  risk_assessment JSONB DEFAULT '{}'::jsonb,
  impact_assessment JSONB DEFAULT '{}'::jsonb,
  stakeholder_communication JSONB DEFAULT '{}'::jsonb,
  training_requirements JSONB DEFAULT '[]'::jsonb,
  audit_history JSONB DEFAULT '[]'::jsonb,
  violation_history JSONB DEFAULT '[]'::jsonb,
  exemptions_waivers JSONB DEFAULT '[]'::jsonb,
  compliance_monitoring JSONB DEFAULT '{}'::jsonb,
  reporting_obligations JSONB DEFAULT '[]'::jsonb,
  certification_requirements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Policy Engagements
CREATE TABLE IF NOT EXISTS policy_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  policy_area VARCHAR(50) NOT NULL CHECK (policy_area IN ('technology', 'healthcare', 'environment', 'energy', 'transportation', 'education', 'defense', 'cybersecurity', 'data_privacy', 'financial_services', 'telecommunications', 'agriculture', 'manufacturing', 'trade', 'immigration', 'labor', 'tax', 'intellectual_property', 'antitrust', 'consumer_protection')),
  policy_title VARCHAR(500) NOT NULL,
  policy_stage VARCHAR(20) DEFAULT 'development' CHECK (policy_stage IN ('concept', 'development', 'consultation', 'draft', 'review', 'approval', 'implementation', 'enforcement', 'evaluation', 'revision', 'sunset')),
  government_level VARCHAR(20) NOT NULL CHECK (government_level IN ('federal', 'state', 'local', 'international', 'tribal', 'territorial')),
  responsible_agency VARCHAR(200) NOT NULL,
  engagement_type VARCHAR(30) NOT NULL CHECK (engagement_type IN ('formal_consultation', 'informal_consultation', 'public_hearing', 'stakeholder_meeting', 'written_submission', 'oral_presentation', 'roundtable_discussion', 'workshop', 'conference', 'briefing', 'lobbying', 'advocacy')),
  engagement_level VARCHAR(20) DEFAULT 'consult' CHECK (engagement_level IN ('inform', 'consult', 'involve', 'collaborate', 'empower')),
  position_statement JSONB DEFAULT '{}'::jsonb,
  key_messages JSONB DEFAULT '[]'::jsonb,
  target_outcomes JSONB DEFAULT '[]'::jsonb,
  engagement_strategy JSONB DEFAULT '{}'::jsonb,
  stakeholder_mapping JSONB DEFAULT '{}'::jsonb,
  coalition_building JSONB DEFAULT '{}'::jsonb,
  advocacy_tactics JSONB DEFAULT '[]'::jsonb,
  communication_plan JSONB DEFAULT '{}'::jsonb,
  timeline JSONB DEFAULT '{}'::jsonb,
  budget JSONB DEFAULT '{}'::jsonb,
  success_metrics JSONB DEFAULT '[]'::jsonb,
  risk_mitigation JSONB DEFAULT '{}'::jsonb,
  monitoring_evaluation JSONB DEFAULT '{}'::jsonb,
  engagement_history JSONB DEFAULT '[]'::jsonb,
  outcomes_achieved JSONB DEFAULT '[]'::jsonb,
  lessons_learned JSONB DEFAULT '[]'::jsonb,
  follow_up_actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Government Contracts
CREATE TABLE IF NOT EXISTS government_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  contract_number VARCHAR(100) UNIQUE NOT NULL,
  contract_title VARCHAR(500) NOT NULL,
  contracting_agency VARCHAR(200) NOT NULL,
  contract_type VARCHAR(30) NOT NULL CHECK (contract_type IN ('fixed_price', 'cost_reimbursement', 'time_and_materials', 'labor_hour', 'indefinite_delivery', 'requirements', 'basic_ordering_agreement', 'blanket_purchase_agreement')),
  contract_vehicle VARCHAR(50) NOT NULL CHECK (contract_vehicle IN ('full_and_open', 'small_business_set_aside', 'sole_source', 'limited_competition', 'gsa_schedule', 'gwac', 'cio_sp3', 'sewp', 'oasis', 'custom')),
  contract_value DECIMAL(15,2) NOT NULL,
  contract_currency VARCHAR(3) DEFAULT 'USD',
  contract_duration JSONB NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  option_periods JSONB DEFAULT '[]'::jsonb,
  contract_status VARCHAR(20) DEFAULT 'awarded' CHECK (contract_status IN ('solicitation', 'awarded', 'active', 'completed', 'terminated', 'suspended', 'cancelled')),
  performance_rating JSONB DEFAULT '{}'::jsonb,
  security_requirements JSONB DEFAULT '[]'::jsonb,
  clearance_requirements JSONB DEFAULT '[]'::jsonb,
  compliance_requirements JSONB DEFAULT '[]'::jsonb,
  deliverables JSONB DEFAULT '[]'::jsonb,
  milestones JSONB DEFAULT '[]'::jsonb,
  payment_schedule JSONB DEFAULT '{}'::jsonb,
  performance_metrics JSONB DEFAULT '[]'::jsonb,
  risk_factors JSONB DEFAULT '[]'::jsonb,
  subcontracting JSONB DEFAULT '{}'::jsonb,
  small_business_goals JSONB DEFAULT '[]'::jsonb,
  socioeconomic_goals JSONB DEFAULT '[]'::jsonb,
  contract_modifications JSONB DEFAULT '[]'::jsonb,
  performance_evaluations JSONB DEFAULT '[]'::jsonb,
  invoice_history JSONB DEFAULT '[]'::jsonb,
  dispute_resolution JSONB DEFAULT '[]'::jsonb,
  contract_closeout JSONB DEFAULT '{}'::jsonb,
  lessons_learned JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Procurement Opportunities
CREATE TABLE IF NOT EXISTS procurement_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_number VARCHAR(100) UNIQUE NOT NULL,
  opportunity_title VARCHAR(500) NOT NULL,
  contracting_agency VARCHAR(200) NOT NULL,
  agency_contact JSONB DEFAULT '{}'::jsonb,
  opportunity_type VARCHAR(30) NOT NULL CHECK (opportunity_type IN ('solicitation', 'sources_sought', 'presolicitation', 'combined_synopsis', 'modification', 'award_notice', 'intent_to_bundle', 'fair_opportunity')),
  contract_vehicle VARCHAR(50) NOT NULL CHECK (contract_vehicle IN ('full_and_open', 'small_business_set_aside', 'sole_source', 'limited_competition', 'gsa_schedule', 'gwac', 'cio_sp3', 'sewp', 'oasis', 'custom')),
  set_aside_type VARCHAR(30) DEFAULT 'none' CHECK (set_aside_type IN ('none', 'small_business', 'women_owned', 'veteran_owned', 'service_disabled_veteran', 'hubzone', 'eight_a', 'historically_black_college', 'minority_institution')),
  naics_codes JSONB DEFAULT '[]'::jsonb,
  estimated_value DECIMAL(15,2),
  contract_duration JSONB DEFAULT '{}'::jsonb,
  place_of_performance JSONB DEFAULT '{}'::jsonb,
  security_clearance_required BOOLEAN DEFAULT FALSE,
  clearance_level VARCHAR(20) DEFAULT 'none' CHECK (clearance_level IN ('none', 'public_trust', 'confidential', 'secret', 'top_secret', 'top_secret_sci')),
  solicitation_number VARCHAR(100),
  release_date TIMESTAMP WITH TIME ZONE NOT NULL,
  response_due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  questions_due_date TIMESTAMP WITH TIME ZONE,
  pre_proposal_conference JSONB,
  site_visit JSONB,
  opportunity_description TEXT NOT NULL,
  scope_of_work JSONB DEFAULT '{}'::jsonb,
  technical_requirements JSONB DEFAULT '[]'::jsonb,
  evaluation_criteria JSONB DEFAULT '[]'::jsonb,
  submission_requirements JSONB DEFAULT '[]'::jsonb,
  contract_terms JSONB DEFAULT '[]'::jsonb,
  special_provisions JSONB DEFAULT '[]'::jsonb,
  socioeconomic_requirements JSONB DEFAULT '[]'::jsonb,
  small_business_considerations JSONB DEFAULT '[]'::jsonb,
  past_performance_requirements JSONB DEFAULT '[]'::jsonb,
  financial_requirements JSONB DEFAULT '[]'::jsonb,
  bonding_requirements JSONB DEFAULT '[]'::jsonb,
  insurance_requirements JSONB DEFAULT '[]'::jsonb,
  intellectual_property JSONB DEFAULT '{}'::jsonb,
  data_rights JSONB DEFAULT '{}'::jsonb,
  security_requirements JSONB DEFAULT '[]'::jsonb,
  environmental_considerations JSONB DEFAULT '[]'::jsonb,
  labor_standards JSONB DEFAULT '[]'::jsonb,
  buy_american_requirements JSONB DEFAULT '[]'::jsonb,
  trade_agreement_considerations JSONB DEFAULT '[]'::jsonb,
  amendment_history JSONB DEFAULT '[]'::jsonb,
  q_and_a_history JSONB DEFAULT '[]'::jsonb,
  bidder_list JSONB DEFAULT '[]'::jsonb,
  award_history JSONB DEFAULT '[]'::jsonb,
  protest_history JSONB DEFAULT '[]'::jsonb,
  opportunity_status VARCHAR(20) DEFAULT 'active' CHECK (opportunity_status IN ('active', 'inactive', 'cancelled', 'awarded', 'archived')),
  tracking_status JSONB DEFAULT '{}'::jsonb,
  bid_decision JSONB DEFAULT '{}'::jsonb,
  bid_preparation JSONB DEFAULT '{}'::jsonb,
  teaming_opportunities JSONB DEFAULT '[]'::jsonb,
  competitive_intelligence JSONB DEFAULT '{}'::jsonb,
  win_probability JSONB DEFAULT '{}'::jsonb,
  strategic_value JSONB DEFAULT '{}'::jsonb,
  resource_requirements JSONB DEFAULT '[]'::jsonb,
  risk_assessment JSONB DEFAULT '{}'::jsonb,
  go_no_go_decision JSONB DEFAULT '{}'::jsonb,
  lessons_learned JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Grant Funding
CREATE TABLE IF NOT EXISTS grant_funding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  grant_program VARCHAR(200) NOT NULL,
  funding_agency VARCHAR(200) NOT NULL,
  grant_title VARCHAR(500) NOT NULL,
  grant_number VARCHAR(100),
  grant_type VARCHAR(30) NOT NULL CHECK (grant_type IN ('research_grant', 'development_grant', 'demonstration_grant', 'deployment_grant', 'training_grant', 'capacity_building', 'infrastructure', 'equipment', 'fellowship', 'scholarship')),
  funding_mechanism VARCHAR(30) NOT NULL CHECK (funding_mechanism IN ('grant', 'cooperative_agreement', 'contract', 'loan', 'loan_guarantee', 'tax_credit', 'tax_incentive', 'prize', 'challenge')),
  research_area JSONB DEFAULT '[]'::jsonb,
  technology_area JSONB DEFAULT '[]'::jsonb,
  application_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  project_start_date TIMESTAMP WITH TIME ZONE,
  project_end_date TIMESTAMP WITH TIME ZONE,
  total_funding_amount DECIMAL(15,2) NOT NULL,
  funding_currency VARCHAR(3) DEFAULT 'USD',
  funding_phases JSONB DEFAULT '[]'::jsonb,
  matching_requirements JSONB DEFAULT '[]'::jsonb,
  cost_sharing JSONB DEFAULT '[]'::jsonb,
  indirect_cost_rate DECIMAL(5,2) DEFAULT 0,
  budget_categories JSONB DEFAULT '[]'::jsonb,
  allowable_costs JSONB DEFAULT '[]'::jsonb,
  unallowable_costs JSONB DEFAULT '[]'::jsonb,
  financial_reporting JSONB DEFAULT '[]'::jsonb,
  technical_reporting JSONB DEFAULT '[]'::jsonb,
  milestone_reporting JSONB DEFAULT '[]'::jsonb,
  performance_metrics JSONB DEFAULT '[]'::jsonb,
  deliverables JSONB DEFAULT '[]'::jsonb,
  intellectual_property_policy JSONB DEFAULT '{}'::jsonb,
  data_management_plan JSONB DEFAULT '{}'::jsonb,
  commercialization_plan JSONB DEFAULT '{}'::jsonb,
  technology_transfer JSONB DEFAULT '{}'::jsonb,
  collaboration_requirements JSONB DEFAULT '[]'::jsonb,
  personnel_requirements JSONB DEFAULT '[]'::jsonb,
  facility_requirements JSONB DEFAULT '[]'::jsonb,
  equipment_requirements JSONB DEFAULT '[]'::jsonb,
  travel_requirements JSONB DEFAULT '[]'::jsonb,
  publication_requirements JSONB DEFAULT '[]'::jsonb,
  dissemination_requirements JSONB DEFAULT '[]'::jsonb,
  evaluation_criteria JSONB DEFAULT '[]'::jsonb,
  review_process JSONB DEFAULT '{}'::jsonb,
  award_process JSONB DEFAULT '{}'::jsonb,
  post_award_administration JSONB DEFAULT '{}'::jsonb,
  compliance_monitoring JSONB DEFAULT '{}'::jsonb,
  audit_requirements JSONB DEFAULT '[]'::jsonb,
  closeout_procedures JSONB DEFAULT '{}'::jsonb,
  grant_status VARCHAR(30) DEFAULT 'application_submitted' CHECK (grant_status IN ('not_applied', 'application_submitted', 'under_review', 'awarded', 'declined', 'active', 'completed', 'terminated')),
  application_status VARCHAR(30) DEFAULT 'submitted',
  funding_history JSONB DEFAULT '[]'::jsonb,
  modification_history JSONB DEFAULT '[]'::jsonb,
  performance_evaluations JSONB DEFAULT '[]'::jsonb,
  success_stories JSONB DEFAULT '[]'::jsonb,
  lessons_learned JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Security Clearances
CREATE TABLE IF NOT EXISTS security_clearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  clearance_type VARCHAR(20) NOT NULL CHECK (clearance_type IN ('personnel', 'facility', 'visit', 'storage', 'interim', 'final')),
  clearance_level VARCHAR(20) NOT NULL CHECK (clearance_level IN ('none', 'public_trust', 'confidential', 'secret', 'top_secret', 'top_secret_sci')),
  granting_agency VARCHAR(200) NOT NULL,
  clearance_number VARCHAR(100) UNIQUE NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
  renewal_date TIMESTAMP WITH TIME ZONE,
  clearance_status VARCHAR(20) DEFAULT 'active' CHECK (clearance_status IN ('active', 'inactive', 'suspended', 'revoked', 'expired', 'pending', 'denied')),
  investigation_type VARCHAR(30) NOT NULL CHECK (investigation_type IN ('tier_1', 'tier_2', 'tier_3', 'tier_4', 'tier_5', 'periodic_reinvestigation')),
  adjudication_date TIMESTAMP WITH TIME ZONE NOT NULL,
  adjudicating_agency VARCHAR(200) NOT NULL,
  security_officer JSONB DEFAULT '{}'::jsonb,
  facility_clearance JSONB DEFAULT '{}'::jsonb,
  personnel_clearances JSONB DEFAULT '[]'::jsonb,
  access_authorizations JSONB DEFAULT '[]'::jsonb,
  special_access_programs JSONB DEFAULT '[]'::jsonb,
  compartmented_information JSONB DEFAULT '[]'::jsonb,
  foreign_disclosure JSONB DEFAULT '[]'::jsonb,
  security_violations JSONB DEFAULT '[]'::jsonb,
  security_incidents JSONB DEFAULT '[]'::jsonb,
  security_training JSONB DEFAULT '[]'::jsonb,
  security_briefings JSONB DEFAULT '[]'::jsonb,
  security_debriefings JSONB DEFAULT '[]'::jsonb,
  continuous_monitoring JSONB DEFAULT '{}'::jsonb,
  periodic_reinvestigation JSONB DEFAULT '{}'::jsonb,
  reciprocity_agreements JSONB DEFAULT '[]'::jsonb,
  security_controls JSONB DEFAULT '[]'::jsonb,
  physical_security JSONB DEFAULT '{}'::jsonb,
  information_security JSONB DEFAULT '{}'::jsonb,
  personnel_security JSONB DEFAULT '{}'::jsonb,
  industrial_security JSONB DEFAULT '{}'::jsonb,
  security_plan JSONB DEFAULT '{}'::jsonb,
  security_procedures JSONB DEFAULT '[]'::jsonb,
  security_awareness JSONB DEFAULT '{}'::jsonb,
  insider_threat_program JSONB DEFAULT '{}'::jsonb,
  security_metrics JSONB DEFAULT '[]'::jsonb,
  security_assessments JSONB DEFAULT '[]'::jsonb,
  vulnerability_assessments JSONB DEFAULT '[]'::jsonb,
  penetration_testing JSONB DEFAULT '[]'::jsonb,
  security_audits JSONB DEFAULT '[]'::jsonb,
  compliance_monitoring JSONB DEFAULT '{}'::jsonb,
  incident_response JSONB DEFAULT '{}'::jsonb,
  business_continuity JSONB DEFAULT '{}'::jsonb,
  disaster_recovery JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Government Analytics
CREATE TABLE IF NOT EXISTS government_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  analysis_period JSONB NOT NULL,
  compliance_analytics JSONB DEFAULT '{}'::jsonb,
  policy_analytics JSONB DEFAULT '{}'::jsonb,
  contract_analytics JSONB DEFAULT '{}'::jsonb,
  procurement_analytics JSONB DEFAULT '{}'::jsonb,
  grant_analytics JSONB DEFAULT '{}'::jsonb,
  regulatory_analytics JSONB DEFAULT '{}'::jsonb,
  security_analytics JSONB DEFAULT '{}'::jsonb,
  engagement_analytics JSONB DEFAULT '{}'::jsonb,
  performance_analytics JSONB DEFAULT '{}'::jsonb,
  risk_analytics JSONB DEFAULT '{}'::jsonb,
  opportunity_analytics JSONB DEFAULT '{}'::jsonb,
  competitive_analytics JSONB DEFAULT '{}'::jsonb,
  market_analytics JSONB DEFAULT '{}'::jsonb,
  trend_analysis JSONB DEFAULT '{}'::jsonb,
  predictive_analytics JSONB DEFAULT '{}'::jsonb,
  benchmarking JSONB DEFAULT '{}'::jsonb,
  roi_analysis JSONB DEFAULT '{}'::jsonb,
  cost_benefit_analysis JSONB DEFAULT '{}'::jsonb,
  scenario_analysis JSONB DEFAULT '{}'::jsonb,
  sensitivity_analysis JSONB DEFAULT '{}'::jsonb,
  monte_carlo_simulation JSONB DEFAULT '{}'::jsonb,
  machine_learning_insights JSONB DEFAULT '[]'::jsonb,
  natural_language_processing JSONB DEFAULT '[]'::jsonb,
  social_network_analysis JSONB DEFAULT '{}'::jsonb,
  influence_mapping JSONB DEFAULT '{}'::jsonb,
  stakeholder_analysis JSONB DEFAULT '{}'::jsonb,
  policy_impact_modeling JSONB DEFAULT '{}'::jsonb,
  regulatory_impact_assessment JSONB DEFAULT '{}'::jsonb,
  compliance_cost_modeling JSONB DEFAULT '{}'::jsonb,
  contract_performance_modeling JSONB DEFAULT '{}'::jsonb,
  procurement_success_modeling JSONB DEFAULT '{}'::jsonb,
  grant_success_modeling JSONB DEFAULT '{}'::jsonb,
  security_risk_modeling JSONB DEFAULT '{}'::jsonb,
  reputation_analysis JSONB DEFAULT '{}'::jsonb,
  media_sentiment_analysis JSONB DEFAULT '{}'::jsonb,
  public_opinion_analysis JSONB DEFAULT '{}'::jsonb,
  political_risk_analysis JSONB DEFAULT '{}'::jsonb,
  regulatory_change_prediction JSONB DEFAULT '{}'::jsonb,
  policy_outcome_prediction JSONB DEFAULT '{}'::jsonb,
  contract_award_prediction JSONB DEFAULT '{}'::jsonb,
  grant_award_prediction JSONB DEFAULT '{}'::jsonb,
  compliance_violation_prediction JSONB DEFAULT '{}'::jsonb,
  security_threat_prediction JSONB DEFAULT '{}'::jsonb,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  analysis_confidence DECIMAL(5,2) DEFAULT 0.5 CHECK (analysis_confidence >= 0 AND analysis_confidence <= 1),
  data_completeness DECIMAL(5,2) DEFAULT 0 CHECK (data_completeness >= 0 AND data_completeness <= 1),
  methodology JSONB DEFAULT '{}'::jsonb,
  limitations TEXT[],
  recommendations JSONB DEFAULT '[]'::jsonb,
  next_analysis_date TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Government Dashboards
CREATE TABLE IF NOT EXISTS government_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  dashboard_type VARCHAR(20) DEFAULT 'operational' CHECK (dashboard_type IN ('executive', 'operational', 'compliance', 'strategic', 'tactical', 'analytical')),
  compliance_overview JSONB DEFAULT '{}'::jsonb,
  policy_overview JSONB DEFAULT '{}'::jsonb,
  contract_overview JSONB DEFAULT '{}'::jsonb,
  procurement_overview JSONB DEFAULT '{}'::jsonb,
  grant_overview JSONB DEFAULT '{}'::jsonb,
  security_overview JSONB DEFAULT '{}'::jsonb,
  engagement_overview JSONB DEFAULT '{}'::jsonb,
  performance_overview JSONB DEFAULT '{}'::jsonb,
  risk_overview JSONB DEFAULT '{}'::jsonb,
  opportunity_overview JSONB DEFAULT '{}'::jsonb,
  key_metrics JSONB DEFAULT '[]'::jsonb,
  performance_indicators JSONB DEFAULT '[]'::jsonb,
  alerts_notifications JSONB DEFAULT '[]'::jsonb,
  upcoming_deadlines JSONB DEFAULT '[]'::jsonb,
  recent_activities JSONB DEFAULT '[]'::jsonb,
  trending_topics JSONB DEFAULT '[]'::jsonb,
  regulatory_updates JSONB DEFAULT '[]'::jsonb,
  policy_updates JSONB DEFAULT '[]'::jsonb,
  market_intelligence JSONB DEFAULT '[]'::jsonb,
  competitive_intelligence JSONB DEFAULT '[]'::jsonb,
  stakeholder_updates JSONB DEFAULT '[]'::jsonb,
  relationship_mapping JSONB DEFAULT '{}'::jsonb,
  influence_network JSONB DEFAULT '{}'::jsonb,
  decision_makers JSONB DEFAULT '[]'::jsonb,
  key_contacts JSONB DEFAULT '[]'::jsonb,
  engagement_calendar JSONB DEFAULT '[]'::jsonb,
  compliance_calendar JSONB DEFAULT '[]'::jsonb,
  reporting_calendar JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  insights JSONB DEFAULT '[]'::jsonb,
  success_stories JSONB DEFAULT '[]'::jsonb,
  lessons_learned JSONB DEFAULT '[]'::jsonb,
  best_practices JSONB DEFAULT '[]'::jsonb,
  resources JSONB DEFAULT '[]'::jsonb,
  training_opportunities JSONB DEFAULT '[]'::jsonb,
  networking_events JSONB DEFAULT '[]'::jsonb,
  conferences_events JSONB DEFAULT '[]'::jsonb,
  webinars_workshops JSONB DEFAULT '[]'::jsonb,
  publications JSONB DEFAULT '[]'::jsonb,
  research_reports JSONB DEFAULT '[]'::jsonb,
  white_papers JSONB DEFAULT '[]'::jsonb,
  case_studies JSONB DEFAULT '[]'::jsonb,
  templates_tools JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  refresh_frequency VARCHAR(20) DEFAULT 'daily' CHECK (refresh_frequency IN ('real_time', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'on_demand')),
  data_sources JSONB DEFAULT '[]'::jsonb,
  customization_settings JSONB DEFAULT '{}'::jsonb,
  user_preferences JSONB DEFAULT '{}'::jsonb,
  access_permissions JSONB DEFAULT '[]'::jsonb,
  sharing_settings JSONB DEFAULT '{}'::jsonb,
  export_options JSONB DEFAULT '[]'::jsonb,
  integration_settings JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Additional Supporting Tables
-- =====================================================

-- Proposal Submissions (for procurement tracking)
CREATE TABLE IF NOT EXISTS proposal_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES procurement_opportunities(id) ON DELETE CASCADE,
  proposal_title VARCHAR(500) NOT NULL,
  technical_approach TEXT NOT NULL,
  management_approach TEXT NOT NULL,
  past_performance TEXT NOT NULL,
  pricing JSONB NOT NULL,
  team_composition JSONB NOT NULL,
  subcontracting_plan JSONB,
  small_business_utilization JSONB,
  submission_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  submission_status VARCHAR(20) DEFAULT 'submitted' CHECK (submission_status IN ('draft', 'submitted', 'under_review', 'awarded', 'not_awarded', 'withdrawn')),
  evaluation_score DECIMAL(5,2) DEFAULT 0 CHECK (evaluation_score >= 0 AND evaluation_score <= 100),
  award_probability DECIMAL(5,2) DEFAULT 0 CHECK (award_probability >= 0 AND award_probability <= 100),
  competitive_position JSONB DEFAULT '{}'::jsonb,
  lessons_learned JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ESG Certifications
CREATE TABLE IF NOT EXISTS esg_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  certification_name VARCHAR(200) NOT NULL,
  certification_body VARCHAR(200) NOT NULL,
  certification_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expiration_date TIMESTAMP WITH TIME ZONE,
  certification_level VARCHAR(50),
  certification_scope TEXT,
  certification_status VARCHAR(20) DEFAULT 'active' CHECK (certification_status IN ('active', 'expired', 'suspended', 'revoked', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ESG Awards
CREATE TABLE IF NOT EXISTS esg_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  award_name VARCHAR(200) NOT NULL,
  awarding_body VARCHAR(200) NOT NULL,
  award_date TIMESTAMP WITH TIME ZONE NOT NULL,
  award_category VARCHAR(100),
  award_description TEXT,
  award_significance VARCHAR(20) DEFAULT 'medium' CHECK (award_significance IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Policy Tracking
CREATE TABLE IF NOT EXISTS policy_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  policy_areas JSONB DEFAULT '[]'::jsonb,
  tracking_preferences JSONB DEFAULT '{}'::jsonb,
  alert_settings JSONB DEFAULT '[]'::jsonb,
  monitoring_frequency VARCHAR(20) DEFAULT 'weekly' CHECK (monitoring_frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
  stakeholder_notifications JSONB DEFAULT '[]'::jsonb,
  impact_assessment JSONB DEFAULT '{}'::jsonb,
  engagement_opportunities JSONB DEFAULT '[]'::jsonb,
  advocacy_priorities JSONB DEFAULT '[]'::jsonb,
  coalition_memberships JSONB DEFAULT '[]'::jsonb,
  policy_positions JSONB DEFAULT '[]'::jsonb,
  research_priorities JSONB DEFAULT '[]'::jsonb,
  communication_strategy JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for Performance Optimization
-- =====================================================

-- ESG Profile Indexes
CREATE INDEX IF NOT EXISTS idx_esg_profiles_startup_id ON esg_profiles(startup_id);
CREATE INDEX IF NOT EXISTS idx_esg_profiles_overall_score ON esg_profiles(overall_esg_score DESC);
CREATE INDEX IF NOT EXISTS idx_esg_profiles_sustainability_rating ON esg_profiles(sustainability_rating);
CREATE INDEX IF NOT EXISTS idx_esg_profiles_certification_level ON esg_profiles(certification_level);
CREATE INDEX IF NOT EXISTS idx_esg_profiles_assessment_date ON esg_profiles(assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_esg_profiles_next_assessment ON esg_profiles(next_assessment_date);

-- Environmental Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_environmental_metrics_startup_id ON environmental_metrics(startup_id);
CREATE INDEX IF NOT EXISTS idx_environmental_metrics_data_quality ON environmental_metrics(data_quality);
CREATE INDEX IF NOT EXISTS idx_environmental_metrics_verification ON environmental_metrics(verification_status);

-- Social Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_social_metrics_startup_id ON social_metrics(startup_id);
CREATE INDEX IF NOT EXISTS idx_social_metrics_data_quality ON social_metrics(data_quality);
CREATE INDEX IF NOT EXISTS idx_social_metrics_verification ON social_metrics(verification_status);

-- Governance Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_governance_metrics_startup_id ON governance_metrics(startup_id);
CREATE INDEX IF NOT EXISTS idx_governance_metrics_data_quality ON governance_metrics(data_quality);
CREATE INDEX IF NOT EXISTS idx_governance_metrics_verification ON governance_metrics(verification_status);

-- Impact Measurements Indexes
CREATE INDEX IF NOT EXISTS idx_impact_measurements_startup_id ON impact_measurements(startup_id);
CREATE INDEX IF NOT EXISTS idx_impact_measurements_framework ON impact_measurements(impact_framework);

-- SDG Alignments Indexes
CREATE INDEX IF NOT EXISTS idx_sdg_alignments_startup_id ON sdg_alignments(startup_id);

-- ESG Reports Indexes
CREATE INDEX IF NOT EXISTS idx_esg_reports_startup_id ON esg_reports(startup_id);
CREATE INDEX IF NOT EXISTS idx_esg_reports_type ON esg_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_esg_reports_framework ON esg_reports(reporting_framework);
CREATE INDEX IF NOT EXISTS idx_esg_reports_publication_date ON esg_reports(publication_date DESC);

-- ESG Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_esg_analytics_startup_id ON esg_analytics(startup_id);
CREATE INDEX IF NOT EXISTS idx_esg_analytics_generated_at ON esg_analytics(generated_at DESC);

-- Government Profile Indexes
CREATE INDEX IF NOT EXISTS idx_government_profiles_startup_id ON government_profiles(startup_id);
CREATE INDEX IF NOT EXISTS idx_government_profiles_government_level ON government_profiles(government_level);
CREATE INDEX IF NOT EXISTS idx_government_profiles_jurisdiction ON government_profiles(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_government_profiles_regulatory_status ON government_profiles(regulatory_status);
CREATE INDEX IF NOT EXISTS idx_government_profiles_compliance_score ON government_profiles(compliance_score DESC);
CREATE INDEX IF NOT EXISTS idx_government_profiles_public_sector_readiness ON government_profiles(public_sector_readiness);
CREATE INDEX IF NOT EXISTS idx_government_profiles_security_clearance ON government_profiles(security_clearance_level);
CREATE INDEX IF NOT EXISTS idx_government_profiles_procurement_eligibility ON government_profiles(procurement_eligibility);

-- Regulatory Compliance Indexes
CREATE INDEX IF NOT EXISTS idx_regulatory_compliance_startup_id ON regulatory_compliance(startup_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_compliance_regulation_id ON regulatory_compliance(regulation_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_compliance_status ON regulatory_compliance(compliance_status);
CREATE INDEX IF NOT EXISTS idx_regulatory_compliance_percentage ON regulatory_compliance(compliance_percentage);
CREATE INDEX IF NOT EXISTS idx_regulatory_compliance_next_assessment ON regulatory_compliance(next_assessment_date);
CREATE INDEX IF NOT EXISTS idx_regulatory_compliance_regulatory_body ON regulatory_compliance(regulatory_body);
CREATE INDEX IF NOT EXISTS idx_regulatory_compliance_jurisdiction ON regulatory_compliance(jurisdiction);

-- Policy Engagements Indexes
CREATE INDEX IF NOT EXISTS idx_policy_engagements_startup_id ON policy_engagements(startup_id);
CREATE INDEX IF NOT EXISTS idx_policy_engagements_policy_area ON policy_engagements(policy_area);
CREATE INDEX IF NOT EXISTS idx_policy_engagements_policy_stage ON policy_engagements(policy_stage);
CREATE INDEX IF NOT EXISTS idx_policy_engagements_government_level ON policy_engagements(government_level);
CREATE INDEX IF NOT EXISTS idx_policy_engagements_engagement_type ON policy_engagements(engagement_type);
CREATE INDEX IF NOT EXISTS idx_policy_engagements_created_at ON policy_engagements(created_at DESC);

-- Government Contracts Indexes
CREATE INDEX IF NOT EXISTS idx_government_contracts_startup_id ON government_contracts(startup_id);
CREATE INDEX IF NOT EXISTS idx_government_contracts_contract_number ON government_contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_government_contracts_contracting_agency ON government_contracts(contracting_agency);
CREATE INDEX IF NOT EXISTS idx_government_contracts_contract_type ON government_contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_government_contracts_contract_status ON government_contracts(contract_status);
CREATE INDEX IF NOT EXISTS idx_government_contracts_start_date ON government_contracts(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_government_contracts_end_date ON government_contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_government_contracts_value ON government_contracts(contract_value DESC);

-- Procurement Opportunities Indexes
CREATE INDEX IF NOT EXISTS idx_procurement_opportunities_opportunity_number ON procurement_opportunities(opportunity_number);
CREATE INDEX IF NOT EXISTS idx_procurement_opportunities_contracting_agency ON procurement_opportunities(contracting_agency);
CREATE INDEX IF NOT EXISTS idx_procurement_opportunities_opportunity_type ON procurement_opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_procurement_opportunities_set_aside_type ON procurement_opportunities(set_aside_type);
CREATE INDEX IF NOT EXISTS idx_procurement_opportunities_response_due_date ON procurement_opportunities(response_due_date);
CREATE INDEX IF NOT EXISTS idx_procurement_opportunities_estimated_value ON procurement_opportunities(estimated_value DESC);
CREATE INDEX IF NOT EXISTS idx_procurement_opportunities_security_clearance ON procurement_opportunities(security_clearance_required);
CREATE INDEX IF NOT EXISTS idx_procurement_opportunities_status ON procurement_opportunities(opportunity_status);

-- Grant Funding Indexes
CREATE INDEX IF NOT EXISTS idx_grant_funding_startup_id ON grant_funding(startup_id);
CREATE INDEX IF NOT EXISTS idx_grant_funding_grant_program ON grant_funding(grant_program);
CREATE INDEX IF NOT EXISTS idx_grant_funding_funding_agency ON grant_funding(funding_agency);
CREATE INDEX IF NOT EXISTS idx_grant_funding_grant_type ON grant_funding(grant_type);
CREATE INDEX IF NOT EXISTS idx_grant_funding_funding_mechanism ON grant_funding(funding_mechanism);
CREATE INDEX IF NOT EXISTS idx_grant_funding_application_deadline ON grant_funding(application_deadline);
CREATE INDEX IF NOT EXISTS idx_grant_funding_total_amount ON grant_funding(total_funding_amount DESC);
CREATE INDEX IF NOT EXISTS idx_grant_funding_grant_status ON grant_funding(grant_status);
CREATE INDEX IF NOT EXISTS idx_grant_funding_application_status ON grant_funding(application_status);

-- Security Clearances Indexes
CREATE INDEX IF NOT EXISTS idx_security_clearances_startup_id ON security_clearances(startup_id);
CREATE INDEX IF NOT EXISTS idx_security_clearances_clearance_number ON security_clearances(clearance_number);
CREATE INDEX IF NOT EXISTS idx_security_clearances_clearance_type ON security_clearances(clearance_type);
CREATE INDEX IF NOT EXISTS idx_security_clearances_clearance_level ON security_clearances(clearance_level);
CREATE INDEX IF NOT EXISTS idx_security_clearances_granting_agency ON security_clearances(granting_agency);
CREATE INDEX IF NOT EXISTS idx_security_clearances_clearance_status ON security_clearances(clearance_status);
CREATE INDEX IF NOT EXISTS idx_security_clearances_issue_date ON security_clearances(issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_security_clearances_expiration_date ON security_clearances(expiration_date);

-- Government Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_government_analytics_startup_id ON government_analytics(startup_id);
CREATE INDEX IF NOT EXISTS idx_government_analytics_generated_at ON government_analytics(generated_at DESC);

-- Government Dashboards Indexes
CREATE INDEX IF NOT EXISTS idx_government_dashboards_startup_id ON government_dashboards(startup_id);
CREATE INDEX IF NOT EXISTS idx_government_dashboards_dashboard_type ON government_dashboards(dashboard_type);
CREATE INDEX IF NOT EXISTS idx_government_dashboards_generated_at ON government_dashboards(generated_at DESC);

-- Proposal Submissions Indexes
CREATE INDEX IF NOT EXISTS idx_proposal_submissions_startup_id ON proposal_submissions(startup_id);
CREATE INDEX IF NOT EXISTS idx_proposal_submissions_opportunity_id ON proposal_submissions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_proposal_submissions_submission_status ON proposal_submissions(submission_status);
CREATE INDEX IF NOT EXISTS idx_proposal_submissions_submission_date ON proposal_submissions(submission_date DESC);

-- ESG Certifications Indexes
CREATE INDEX IF NOT EXISTS idx_esg_certifications_startup_id ON esg_certifications(startup_id);
CREATE INDEX IF NOT EXISTS idx_esg_certifications_certification_date ON esg_certifications(certification_date DESC);
CREATE INDEX IF NOT EXISTS idx_esg_certifications_status ON esg_certifications(certification_status);

-- ESG Awards Indexes
CREATE INDEX IF NOT EXISTS idx_esg_awards_startup_id ON esg_awards(startup_id);
CREATE INDEX IF NOT EXISTS idx_esg_awards_award_date ON esg_awards(award_date DESC);

-- Policy Tracking Indexes
CREATE INDEX IF NOT EXISTS idx_policy_tracking_startup_id ON policy_tracking(startup_id);

-- Composite Indexes for Complex Queries
CREATE INDEX IF NOT EXISTS idx_esg_profiles_startup_score_rating ON esg_profiles(startup_id, overall_esg_score DESC, sustainability_rating);
CREATE INDEX IF NOT EXISTS idx_government_profiles_startup_compliance_readiness ON government_profiles(startup_id, compliance_score DESC, public_sector_readiness);
CREATE INDEX IF NOT EXISTS idx_regulatory_compliance_startup_status_date ON regulatory_compliance(startup_id, compliance_status, next_assessment_date);
CREATE INDEX IF NOT EXISTS idx_procurement_opportunities_agency_type_due_date ON procurement_opportunities(contracting_agency, opportunity_type, response_due_date);
CREATE INDEX IF NOT EXISTS idx_grant_funding_startup_status_deadline ON grant_funding(startup_id, grant_status, application_deadline);

-- Partial Indexes for Active Records
CREATE INDEX IF NOT EXISTS idx_esg_profiles_active_verified ON esg_profiles(startup_id, overall_esg_score DESC) WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_government_contracts_active ON government_contracts(startup_id, contract_value DESC) WHERE contract_status = 'active';
CREATE INDEX IF NOT EXISTS idx_procurement_opportunities_active_open ON procurement_opportunities(response_due_date) WHERE opportunity_status = 'active' AND response_due_date > NOW();
CREATE INDEX IF NOT EXISTS idx_grant_funding_active_awarded ON grant_funding(startup_id, total_funding_amount DESC) WHERE grant_status IN ('active', 'awarded');
CREATE INDEX IF NOT EXISTS idx_security_clearances_active ON security_clearances(startup_id, clearance_level) WHERE clearance_status = 'active';

-- GIN Indexes for JSONB Columns (for complex JSON queries)
CREATE INDEX IF NOT EXISTS idx_esg_profiles_reporting_framework_gin ON esg_profiles USING GIN (reporting_framework);
CREATE INDEX IF NOT EXISTS idx_esg_profiles_performance_trends_gin ON esg_profiles USING GIN (performance_trends);
CREATE INDEX IF NOT EXISTS idx_environmental_metrics_carbon_footprint_gin ON environmental_metrics USING GIN (carbon_footprint);
CREATE INDEX IF NOT EXISTS idx_social_metrics_diversity_inclusion_gin ON social_metrics USING GIN (diversity_inclusion);
CREATE INDEX IF NOT EXISTS idx_governance_metrics_board_composition_gin ON governance_metrics USING GIN (board_composition);
CREATE INDEX IF NOT EXISTS idx_impact_measurements_impact_objectives_gin ON impact_measurements USING GIN (impact_objectives);
CREATE INDEX IF NOT EXISTS idx_sdg_alignments_aligned_sdgs_gin ON sdg_alignments USING GIN (aligned_sdgs);
CREATE INDEX IF NOT EXISTS idx_government_profiles_compliance_history_gin ON government_profiles USING GIN (compliance_history);
CREATE INDEX IF NOT EXISTS idx_regulatory_compliance_requirements_gin ON regulatory_compliance USING GIN (compliance_requirements);
CREATE INDEX IF NOT EXISTS idx_policy_engagements_key_messages_gin ON policy_engagements USING GIN (key_messages);
CREATE INDEX IF NOT EXISTS idx_procurement_opportunities_naics_codes_gin ON procurement_opportunities USING GIN (naics_codes);
CREATE INDEX IF NOT EXISTS idx_grant_funding_research_area_gin ON grant_funding USING GIN (research_area);

-- Triggers for Automatic Timestamp Updates
-- =====================================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at columns
CREATE TRIGGER update_esg_profiles_updated_at BEFORE UPDATE ON esg_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_environmental_metrics_updated_at BEFORE UPDATE ON environmental_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_metrics_updated_at BEFORE UPDATE ON social_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_governance_metrics_updated_at BEFORE UPDATE ON governance_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_impact_measurements_updated_at BEFORE UPDATE ON impact_measurements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sdg_alignments_updated_at BEFORE UPDATE ON sdg_alignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_esg_reports_updated_at BEFORE UPDATE ON esg_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_government_profiles_updated_at BEFORE UPDATE ON government_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_regulatory_compliance_updated_at BEFORE UPDATE ON regulatory_compliance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_policy_engagements_updated_at BEFORE UPDATE ON policy_engagements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_government_contracts_updated_at BEFORE UPDATE ON government_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_procurement_opportunities_updated_at BEFORE UPDATE ON procurement_opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grant_funding_updated_at BEFORE UPDATE ON grant_funding FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_security_clearances_updated_at BEFORE UPDATE ON security_clearances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposal_submissions_updated_at BEFORE UPDATE ON proposal_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_esg_certifications_updated_at BEFORE UPDATE ON esg_certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_esg_awards_updated_at BEFORE UPDATE ON esg_awards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_policy_tracking_updated_at BEFORE UPDATE ON policy_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE esg_profiles IS 'Core ESG profiles for startups with overall scoring and certification tracking';
COMMENT ON TABLE environmental_metrics IS 'Detailed environmental performance metrics including carbon footprint, energy, water, and waste';
COMMENT ON TABLE social_metrics IS 'Social impact metrics including employee wellbeing, diversity, community impact, and human rights';
COMMENT ON TABLE governance_metrics IS 'Governance metrics including board composition, ethics, risk management, and transparency';
COMMENT ON TABLE impact_measurements IS 'Impact measurement framework with theory of change, beneficiary analysis, and outcome tracking';
COMMENT ON TABLE sdg_alignments IS 'UN Sustainable Development Goals alignment and contribution tracking';
COMMENT ON TABLE esg_reports IS 'ESG reporting with multiple framework support and stakeholder engagement';
COMMENT ON TABLE esg_analytics IS 'Advanced ESG analytics with predictive insights and benchmarking';

COMMENT ON TABLE government_profiles IS 'Government relations profiles with compliance, policy alignment, and engagement tracking';
COMMENT ON TABLE regulatory_compliance IS 'Multi-jurisdiction regulatory compliance tracking with risk assessment';
COMMENT ON TABLE policy_engagements IS 'Policy engagement activities with stakeholder mapping and advocacy tracking';
COMMENT ON TABLE government_contracts IS 'Government contract management with performance tracking and compliance';
COMMENT ON TABLE procurement_opportunities IS 'Procurement opportunity tracking with competitive intelligence';
COMMENT ON TABLE grant_funding IS 'Grant funding lifecycle management from application to closeout';
COMMENT ON TABLE security_clearances IS 'Security clearance management with continuous monitoring';
COMMENT ON TABLE government_analytics IS 'Government relations analytics with predictive modeling';
COMMENT ON TABLE government_dashboards IS 'Comprehensive government dashboard with stakeholder mapping';

COMMENT ON TABLE proposal_submissions IS 'Procurement proposal submissions with evaluation tracking';
COMMENT ON TABLE esg_certifications IS 'ESG certifications and awards tracking';
COMMENT ON TABLE esg_awards IS 'ESG awards and recognition tracking';
COMMENT ON TABLE policy_tracking IS 'Policy tracking preferences and monitoring configuration';

-- Initial Data Inserts
-- =====================================================

-- Insert default ESG reporting frameworks
INSERT INTO esg_profiles (startup_id, reporting_framework, assessment_frequency, public_disclosure, sustainability_rating, certification_level, verified, verification_standard, assessment_date, next_assessment_date)
SELECT
  id,
  '["gri", "sasb"]'::jsonb,
  'annually',
  false,
  'D',
  'none',
  false,
  'none',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '1 year'
FROM startups
WHERE NOT EXISTS (SELECT 1 FROM esg_profiles WHERE esg_profiles.startup_id = startups.id)
ON CONFLICT DO NOTHING;

-- Insert default government profiles for existing startups
INSERT INTO government_profiles (startup_id, government_level, jurisdiction, regulatory_status, compliance_score, policy_alignment_score, government_engagement_score, public_sector_readiness, security_clearance_level, data_classification_level, procurement_eligibility, grant_funding_status, policy_influence_score, regulatory_risk_score)
SELECT
  id,
  'federal',
  'United States',
  'under_review',
  0,
  0,
  0,
  'not_ready',
  'none',
  'public',
  'under_review',
  'not_applied',
  0,
  50
FROM startups
WHERE NOT EXISTS (SELECT 1 FROM government_profiles WHERE government_profiles.startup_id = startups.id)
ON CONFLICT DO NOTHING;
