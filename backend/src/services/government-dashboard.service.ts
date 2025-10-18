/**
 * Government Dashboard Types
 * Comprehensive type definitions for government policy, regulatory compliance, and public sector engagement
 */

// =====================================================
// CORE GOVERNMENT TYPES
// =====================================================

export interface GovernmentProfile {
  id: string;
  startup_id: string;
  government_level: GovernmentLevel;
  jurisdiction: string;
  regulatory_status: RegulatoryStatus;
  compliance_score: number;
  policy_alignment_score: number;
  government_engagement_score: number;
  public_sector_readiness: PublicSectorReadiness;
  security_clearance_level: SecurityClearanceLevel;
  data_classification_level: DataClassificationLevel;
  procurement_eligibility: ProcurementEligibility;
  grant_funding_status: GrantFundingStatus;
  policy_influence_score: number;
  regulatory_risk_score: number;
  compliance_history: ComplianceHistory[];
  government_contracts: GovernmentContract[];
  policy_engagements: PolicyEngagement[];
  regulatory_submissions: RegulatorySubmission[];
  government_partnerships: GovernmentPartnership[];
  public_consultations: PublicConsultation[];
  lobbying_activities: LobbyingActivity[];
  advocacy_campaigns: AdvocacyCampaign[];
  regulatory_monitoring: RegulatoryMonitoring;
  policy_tracking: PolicyTracking;
  compliance_calendar: ComplianceCalendar[];
  government_relations: GovernmentRelations;
  public_affairs: PublicAffairs;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface RegulatoryCompliance {
  id: string;
  startup_id: string;
  regulation_id: string;
  regulation_name: string;
  regulatory_body: string;
  jurisdiction: string;
  regulation_type: RegulationType;
  compliance_status: ComplianceStatus;
  compliance_percentage: number;
  last_assessment_date: Date;
  next_assessment_date: Date;
  compliance_officer: string;
  compliance_requirements: ComplianceRequirement[];
  compliance_evidence: ComplianceEvidence[];
  compliance_gaps: ComplianceGap[];
  remediation_plan: RemediationPlan;
  compliance_costs: ComplianceCost[];
  compliance_timeline: ComplianceTimeline;
  risk_assessment: ComplianceRiskAssessment;
  impact_assessment: ComplianceImpactAssessment;
  stakeholder_communication: StakeholderCommunication;
  training_requirements: TrainingRequirement[];
  audit_history: ComplianceAudit[];
  violation_history: ComplianceViolation[];
  exemptions_waivers: ExemptionWaiver[];
  compliance_monitoring: ComplianceMonitoring;
  reporting_obligations: ReportingObligation[];
  certification_requirements: CertificationRequirement[];
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface PolicyEngagement {
  id: string;
  startup_id: string;
  policy_area: PolicyArea;
  policy_title: string;
  policy_stage: PolicyStage;
  government_level: GovernmentLevel;
  responsible_agency: string;
  engagement_type: EngagementType;
  engagement_level: EngagementLevel;
  position_statement: PositionStatement;
  key_messages: string[];
  target_outcomes: string[];
  engagement_strategy: EngagementStrategy;
  stakeholder_mapping: StakeholderMapping;
  coalition_building: CoalitionBuilding;
  advocacy_tactics: AdvocacyTactic[];
  communication_plan: CommunicationPlan;
  timeline: EngagementTimeline;
  budget: EngagementBudget;
  success_metrics: SuccessMetric[];
  risk_mitigation: RiskMitigation;
  monitoring_evaluation: MonitoringEvaluation;
  engagement_history: EngagementHistory[];
  outcomes_achieved: OutcomeAchieved[];
  lessons_learned: LessonLearned[];
  follow_up_actions: FollowUpAction[];
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface GovernmentContract {
  id: string;
  startup_id: string;
  contract_number: string;
  contract_title: string;
  contracting_agency: string;
  contract_type: ContractType;
  contract_vehicle: ContractVehicle;
  contract_value: number;
  contract_currency: string;
  contract_duration: ContractDuration;
  start_date: Date;
  end_date: Date;
  option_periods: OptionPeriod[];
  contract_status: ContractStatus;
  performance_rating: PerformanceRating;
  security_requirements: SecurityRequirement[];
  clearance_requirements: ClearanceRequirement[];
  compliance_requirements: ContractComplianceRequirement[];
  deliverables: ContractDeliverable[];
  milestones: ContractMilestone[];
  payment_schedule: PaymentSchedule;
  performance_metrics: ContractPerformanceMetric[];
  risk_factors: ContractRiskFactor[];
  subcontracting: SubcontractingPlan;
  small_business_goals: SmallBusinessGoal[];
  socioeconomic_goals: SocioeconomicGoal[];
  contract_modifications: ContractModification[];
  performance_evaluations: PerformanceEvaluation[];
  invoice_history: InvoiceHistory[];
  dispute_resolution: DisputeResolution[];
  contract_closeout: ContractCloseout;
  lessons_learned: ContractLessonLearned[];
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

// =====================================================
// POLICY AND REGULATORY TYPES
// =====================================================

export interface PolicyTracking {
  id: string;
  startup_id: string;
  policy_id: string;
  policy_title: string;
  policy_description: string;
  policy_area: PolicyArea;
  policy_type: PolicyType;
  policy_stage: PolicyStage;
  government_level: GovernmentLevel;
  jurisdiction: string;
  responsible_agency: string;
  policy_sponsor: string;
  introduction_date: Date;
  expected_enactment_date?: Date;
  actual_enactment_date?: Date;
  effective_date?: Date;
  sunset_date?: Date;
  policy_priority: PolicyPriority;
  impact_assessment: PolicyImpactAssessment;
  stakeholder_analysis: PolicyStakeholderAnalysis;
  business_impact: BusinessImpact;
  compliance_implications: ComplianceImplication[];
  cost_benefit_analysis: CostBenefitAnalysis;
  implementation_timeline: ImplementationTimeline;
  monitoring_requirements: MonitoringRequirement[];
  reporting_requirements: PolicyReportingRequirement[];
  enforcement_mechanisms: EnforcementMechanism[];
  penalty_structure: PenaltyStructure;
  appeal_process: AppealProcess;
  related_policies: RelatedPolicy[];
  international_alignment: InternationalAlignment[];
  public_consultation_history: PublicConsultationHistory[];
  amendment_history: AmendmentHistory[];
  implementation_guidance: ImplementationGuidance[];
  best_practices: PolicyBestPractice[];
  case_studies: PolicyCaseStudy[];
  expert_opinions: ExpertOpinion[];
  industry_feedback: IndustryFeedback[];
  tracking_status: TrackingStatus;
  alert_settings: AlertSetting[];
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface RegulatorySubmission {
  id: string;
  startup_id: string;
  submission_type: SubmissionType;
  regulatory_body: string;
  submission_title: string;
  submission_description: string;
  submission_date: Date;
  due_date: Date;
  submission_status: SubmissionStatus;
  submission_method: SubmissionMethod;
  submission_format: SubmissionFormat;
  required_documents: RequiredDocument[];
  submitted_documents: SubmittedDocument[];
  supporting_evidence: SupportingEvidence[];
  technical_specifications: TechnicalSpecification[];
  compliance_certifications: ComplianceCertification[];
  third_party_validations: ThirdPartyValidation[];
  public_comment_period: PublicCommentPeriod;
  stakeholder_notifications: StakeholderNotification[];
  review_process: ReviewProcess;
  review_timeline: ReviewTimeline;
  reviewer_assignments: ReviewerAssignment[];
  review_criteria: ReviewCriteria[];
  decision_factors: DecisionFactor[];
  approval_conditions: ApprovalCondition[];
  rejection_reasons: RejectionReason[];
  appeal_options: AppealOption[];
  post_approval_obligations: PostApprovalObligation[];
  monitoring_requirements: SubmissionMonitoringRequirement[];
  reporting_obligations: SubmissionReportingObligation[];
  modification_procedures: ModificationProcedure[];
  renewal_requirements: RenewalRequirement[];
  fee_structure: FeeStructure;
  payment_history: PaymentHistory[];
  communication_log: CommunicationLog[];
  milestone_tracking: MilestoneTracking[];
  risk_assessment: SubmissionRiskAssessment;
  contingency_planning: ContingencyPlanning;
  lessons_learned: SubmissionLessonLearned[];
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

// =====================================================
// PROCUREMENT AND CONTRACTING TYPES
// =====================================================

export interface ProcurementOpportunity {
  id: string;
  opportunity_number: string;
  opportunity_title: string;
  contracting_agency: string;
  agency_contact: AgencyContact;
  opportunity_type: OpportunityType;
  contract_vehicle: ContractVehicle;
  set_aside_type: SetAsideType;
  naics_codes: string[];
  estimated_value: number;
  contract_duration: ContractDuration;
  place_of_performance: PlaceOfPerformance;
  security_clearance_required: boolean;
  clearance_level: SecurityClearanceLevel;
  solicitation_number: string;
  release_date: Date;
  response_due_date: Date;
  questions_due_date?: Date;
  pre_proposal_conference?: PreProposalConference;
  site_visit?: SiteVisit;
  opportunity_description: string;
  scope_of_work: ScopeOfWork;
  technical_requirements: TechnicalRequirement[];
  evaluation_criteria: EvaluationCriteria[];
  submission_requirements: SubmissionRequirement[];
  contract_terms: ContractTerm[];
  special_provisions: SpecialProvision[];
  socioeconomic_requirements: SocioeconomicRequirement[];
  small_business_considerations: SmallBusinessConsideration[];
  past_performance_requirements: PastPerformanceRequirement[];
  financial_requirements: FinancialRequirement[];
  bonding_requirements: BondingRequirement[];
  insurance_requirements: InsuranceRequirement[];
  intellectual_property: IntellectualProperty;
  data_rights: DataRights;
  security_requirements: OpportunitySecurityRequirement[];
  environmental_considerations: EnvironmentalConsideration[];
  labor_standards: LaborStandard[];
  buy_american_requirements: BuyAmericanRequirement[];
  trade_agreement_considerations: TradeAgreementConsideration[];
  amendment_history: OpportunityAmendmentHistory[];
  q_and_a_history: QAndAHistory[];
  bidder_list: BidderList[];
  award_history: AwardHistory[];
  protest_history: ProtestHistory[];
  opportunity_status: OpportunityStatus;
  tracking_status: OpportunityTrackingStatus;
  bid_decision: BidDecision;
  bid_preparation: BidPreparation;
  teaming_opportunities: TeamingOpportunity[];
  competitive_intelligence: CompetitiveIntelligence;
  win_probability: WinProbability;
  strategic_value: StrategicValue;
  resource_requirements: ResourceRequirement[];
  risk_assessment: OpportunityRiskAssessment;
  go_no_go_decision: GoNoGoDecision;
  lessons_learned: OpportunityLessonLearned[];
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface GrantFunding {
  id: string;
  startup_id: string;
  grant_program: string;
  funding_agency: string;
  grant_title: string;
  grant_number?: string;
  grant_type: GrantType;
  funding_mechanism: FundingMechanism;
  research_area: ResearchArea[];
  technology_area: TechnologyArea[];
  application_deadline: Date;
  project_start_date?: Date;
  project_end_date?: Date;
  total_funding_amount: number;
  funding_currency: string;
  funding_phases: FundingPhase[];
  matching_requirements: MatchingRequirement[];
  cost_sharing: CostSharing[];
  indirect_cost_rate: number;
  budget_categories: BudgetCategory[];
  allowable_costs: AllowableCost[];
  unallowable_costs: UnallowableCost[];
  financial_reporting: FinancialReporting[];
  technical_reporting: TechnicalReporting[];
  milestone_reporting: MilestoneReporting[];
  performance_metrics: GrantPerformanceMetric[];
  deliverables: GrantDeliverable[];
  intellectual_property_policy: IntellectualPropertyPolicy;
  data_management_plan: DataManagementPlan;
  commercialization_plan: CommercializationPlan;
  technology_transfer: TechnologyTransfer;
  collaboration_requirements: CollaborationRequirement[];
  personnel_requirements: PersonnelRequirement[];
  facility_requirements: FacilityRequirement[];
  equipment_requirements: EquipmentRequirement[];
  travel_requirements: TravelRequirement[];
  publication_requirements: PublicationRequirement[];
  dissemination_requirements: DisseminationRequirement[];
  evaluation_criteria: GrantEvaluationCriteria[];
  review_process: GrantReviewProcess;
  award_process: AwardProcess;
  post_award_administration: PostAwardAdministration;
  compliance_monitoring: GrantComplianceMonitoring;
  audit_requirements: AuditRequirement[];
  closeout_procedures: CloseoutProcedure[];
  grant_status: GrantStatus;
  application_status: ApplicationStatus;
  funding_history: FundingHistory[];
  modification_history: GrantModificationHistory[];
  performance_evaluations: GrantPerformanceEvaluation[];
  success_stories: SuccessStory[];
  lessons_learned: GrantLessonLearned[];
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

// =====================================================
// SECURITY AND CLEARANCE TYPES
// =====================================================

export interface SecurityClearance {
  id: string;
  startup_id: string;
  clearance_type: ClearanceType;
  clearance_level: SecurityClearanceLevel;
  granting_agency: string;
  clearance_number: string;
  issue_date: Date;
  expiration_date: Date;
  renewal_date?: Date;
  clearance_status: ClearanceStatus;
  investigation_type: InvestigationType;
  adjudication_date: Date;
  adjudicating_agency: string;
  security_officer: SecurityOfficer;
  facility_clearance: FacilityClearance;
  personnel_clearances: PersonnelClearance[];
  access_authorizations: AccessAuthorization[];
  special_access_programs: SpecialAccessProgram[];
  compartmented_information: CompartmentedInformation[];
  foreign_disclosure: ForeignDisclosure[];
  security_violations: SecurityViolation[];
  security_incidents: SecurityIncident[];
  security_training: SecurityTraining[];
  security_briefings: SecurityBriefing[];
  security_debriefings: SecurityDebriefing[];
  continuous_monitoring: ContinuousMonitoring;
  periodic_reinvestigation: PeriodicReinvestigation;
  reciprocity_agreements: ReciprocityAgreement[];
  security_controls: SecurityControl[];
  physical_security: PhysicalSecurity;
  information_security: InformationSecurity;
  personnel_security: PersonnelSecurity;
  industrial_security: IndustrialSecurity;
  security_plan: SecurityPlan;
  security_procedures: SecurityProcedure[];
  security_awareness: SecurityAwareness;
  insider_threat_program: InsiderThreatProgram;
  security_metrics: SecurityMetric[];
  security_assessments: SecurityAssessment[];
  vulnerability_assessments: VulnerabilityAssessment[];
  penetration_testing: PenetrationTesting[];
  security_audits: SecurityAudit[];
  compliance_monitoring: SecurityComplianceMonitoring;
  incident_response: IncidentResponse;
  business_continuity: BusinessContinuity;
  disaster_recovery: DisasterRecovery;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

// =====================================================
// ANALYTICS AND REPORTING TYPES
// =====================================================

export interface GovernmentAnalytics {
  startup_id: string;
  analysis_period: AnalysisPeriod;
  compliance_analytics: ComplianceAnalytics;
  policy_analytics: PolicyAnalytics;
  contract_analytics: ContractAnalytics;
  procurement_analytics: ProcurementAnalytics;
  grant_analytics: GrantAnalytics;
  regulatory_analytics: RegulatoryAnalytics;
  security_analytics: SecurityAnalytics;
  engagement_analytics: EngagementAnalytics;
  performance_analytics: GovernmentPerformanceAnalytics;
  risk_analytics: GovernmentRiskAnalytics;
  opportunity_analytics: OpportunityAnalytics;
  competitive_analytics: CompetitiveAnalytics;
  market_analytics: GovernmentMarketAnalytics;
  trend_analysis: GovernmentTrendAnalysis;
  predictive_analytics: GovernmentPredictiveAnalytics;
  benchmarking: GovernmentBenchmarking;
  roi_analysis: GovernmentROIAnalysis;
  cost_benefit_analysis: GovernmentCostBenefitAnalysis;
  scenario_analysis: GovernmentScenarioAnalysis;
  sensitivity_analysis: GovernmentSensitivityAnalysis;
  monte_carlo_simulation: GovernmentMonteCarloSimulation;
  machine_learning_insights: GovernmentMLInsights[];
  natural_language_processing: GovernmentNLPInsights[];
  social_network_analysis: SocialNetworkAnalysis;
  influence_mapping: InfluenceMapping;
  stakeholder_analysis: GovernmentStakeholderAnalysis;
  policy_impact_modeling: PolicyImpactModeling;
  regulatory_impact_assessment: RegulatoryImpactAssessment;
  compliance_cost_modeling: ComplianceCostModeling;
  contract_performance_modeling: ContractPerformanceModeling;
  procurement_success_modeling: ProcurementSuccessModeling;
  grant_success_modeling: GrantSuccessModeling;
  security_risk_modeling: SecurityRiskModeling;
  reputation_analysis: ReputationAnalysis;
  media_sentiment_analysis: MediaSentimentAnalysis;
  public_opinion_analysis: PublicOpinionAnalysis;
  political_risk_analysis: PoliticalRiskAnalysis;
  regulatory_change_prediction: RegulatoryChangePrediction;
  policy_outcome_prediction: PolicyOutcomePrediction;
  contract_award_prediction: ContractAwardPrediction;
  grant_award_prediction: GrantAwardPrediction;
  compliance_violation_prediction: ComplianceViolationPrediction;
  security_threat_prediction: SecurityThreatPrediction;
  generated_at: Date;
  analysis_confidence: number;
  data_completeness: number;
  methodology: GovernmentAnalysisMethodology;
  limitations: string[];
  recommendations: GovernmentRecommendation[];
  next_analysis_date: Date;
  metadata: Record<string, any>;
}

export interface GovernmentDashboard {
  startup_id: string;
  dashboard_type: DashboardType;
  compliance_overview: ComplianceOverview;
  policy_overview: PolicyOverview;
  contract_overview: ContractOverview;
  procurement_overview: ProcurementOverview;
  grant_overview: GrantOverview;
  security_overview: SecurityOverview;
  engagement_overview: EngagementOverview;
  performance_overview: GovernmentPerformanceOverview;
  risk_overview: GovernmentRiskOverview;
  opportunity_overview: OpportunityOverview;
  key_metrics: GovernmentKeyMetric[];
  performance_indicators: GovernmentPerformanceIndicator[];
  alerts_notifications: GovernmentAlert[];
  upcoming_deadlines: GovernmentDeadline[];
  recent_activities: GovernmentActivity[];
  trending_topics: TrendingTopic[];
  regulatory_updates: RegulatoryUpdate[];
  policy_updates: PolicyUpdate[];
  market_intelligence: MarketIntelligence[];
  competitive_intelligence: GovernmentCompetitiveIntelligence[];
  stakeholder_updates: StakeholderUpdate[];
  relationship_mapping: RelationshipMapping;
  influence_network: InfluenceNetwork;
  decision_makers: DecisionMaker[];
  key_contacts: KeyContact[];
  engagement_calendar: EngagementCalendar[];
  compliance_calendar: GovernmentComplianceCalendar[];
  reporting_calendar: GovernmentReportingCalendar[];
  action_items: GovernmentActionItem[];
  recommendations: GovernmentDashboardRecommendation[];
  insights: GovernmentInsight[];
  success_stories: GovernmentSuccessStory[];
  lessons_learned: GovernmentDashboardLessonLearned[];
  best_practices: GovernmentBestPractice[];
  resources: GovernmentResource[];
  training_opportunities: TrainingOpportunity[];
  networking_events: NetworkingEvent[];
  conferences_events: ConferenceEvent[];
  webinars_workshops: WebinarWorkshop[];
  publications: GovernmentPublication[];
  research_reports: ResearchReport[];
  white_papers: GovernmentWhitePaper[];
  case_studies: GovernmentCaseStudy[];
  templates_tools: TemplateTools[];
  generated_at: Date;
  last_updated: Date;
  refresh_frequency: RefreshFrequency;
  data_sources: GovernmentDataSource[];
  customization_settings: CustomizationSettings;
  user_preferences: UserPreferences;
  access_permissions: GovernmentAccessPermission[];
  sharing_settings: SharingSettings;
  export_options: ExportOption[];
  integration_settings: IntegrationSettings;
  metadata: Record<string, any>;
}

// =====================================================
// ENUMS
// =====================================================

export enum GovernmentLevel {
  FEDERAL = 'federal',
  STATE = 'state',
  LOCAL = 'local',
  INTERNATIONAL = 'international',
  TRIBAL = 'tribal',
  TERRITORIAL = 'territorial'
}

export enum RegulatoryStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PARTIALLY_COMPLIANT = 'partially_compliant',
  UNDER_REVIEW = 'under_review',
  PENDING_APPROVAL = 'pending_approval',
  EXEMPT = 'exempt',
  NOT_APPLICABLE = 'not_applicable'
}

export enum PublicSectorReadiness {
  NOT_READY = 'not_ready',
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum SecurityClearanceLevel {
  NONE = 'none',
  PUBLIC_TRUST = 'public_trust',
  CONFIDENTIAL = 'confidential',
  SECRET = 'secret',
  TOP_SECRET = 'top_secret',
  TOP_SECRET_SCI = 'top_secret_sci'
}

export enum DataClassificationLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
  TOP_SECRET = 'top_secret'
}

export enum ProcurementEligibility {
  ELIGIBLE = 'eligible',
  CONDITIONALLY_ELIGIBLE = 'conditionally_eligible',
  INELIGIBLE = 'ineligible',
  SUSPENDED = 'suspended',
  DEBARRED = 'debarred',
  UNDER_REVIEW = 'under_review'
}

export enum GrantFundingStatus {
  NOT_APPLIED = 'not_applied',
  APPLICATION_SUBMITTED = 'application_submitted',
  UNDER_REVIEW = 'under_review',
  AWARDED = 'awarded',
  DECLINED = 'declined',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  TERMINATED = 'terminated'
}

export enum RegulationType {
  STATUTE = 'statute',
  REGULATION = 'regulation',
  GUIDANCE = 'guidance',
  STANDARD = 'standard',
  DIRECTIVE = 'directive',
  POLICY = 'policy',
  PROCEDURE = 'procedure',
  BEST_PRACTICE = 'best_practice'
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PARTIALLY_COMPLIANT = 'partially_compliant',
  UNDER_ASSESSMENT = 'under_assessment',
  REMEDIATION_IN_PROGRESS = 'remediation_in_progress',
  WAIVER_GRANTED = 'waiver_granted',
  EXEMPTION_GRANTED = 'exemption_granted'
}

export enum PolicyArea {
  TECHNOLOGY = 'technology',
  HEALTHCARE = 'healthcare',
  ENVIRONMENT = 'environment',
  ENERGY = 'energy',
  TRANSPORTATION = 'transportation',
  EDUCATION = 'education',
  DEFENSE = 'defense',
  CYBERSECURITY = 'cybersecurity',
  DATA_PRIVACY = 'data_privacy',
  FINANCIAL_SERVICES = 'financial_services',
  TELECOMMUNICATIONS = 'telecommunications',
  AGRICULTURE = 'agriculture',
  MANUFACTURING = 'manufacturing',
  TRADE = 'trade',
  IMMIGRATION = 'immigration',
  LABOR = 'labor',
  TAX = 'tax',
  INTELLECTUAL_PROPERTY = 'intellectual_property',
  ANTITRUST = 'antitrust',
  CONSUMER_PROTECTION = 'consumer_protection'
}

export enum PolicyStage {
  CONCEPT = 'concept',
  DEVELOPMENT = 'development',
  CONSULTATION = 'consultation',
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVAL = 'approval',
  IMPLEMENTATION = 'implementation',
  ENFORCEMENT = 'enforcement',
  EVALUATION = 'evaluation',
  REVISION = 'revision',
  SUNSET = 'sunset'
}

export enum EngagementType {
  FORMAL_CONSULTATION = 'formal_consultation',
  INFORMAL_CONSULTATION = 'informal_consultation',
  PUBLIC_HEARING = 'public_hearing',
  STAKEHOLDER_MEETING = 'stakeholder_meeting',
  WRITTEN_SUBMISSION = 'written_submission',
  ORAL_PRESENTATION = 'oral_presentation',
  ROUNDTABLE_DISCUSSION = 'roundtable_discussion',
  WORKSHOP = 'workshop',
  CONFERENCE = 'conference',
  BRIEFING = 'briefing',
  LOBBYING = 'lobbying',
  ADVOCACY = 'advocacy'
}

export enum EngagementLevel {
  INFORM = 'inform',
  CONSULT = 'consult',
  INVOLVE = 'involve',
  COLLABORATE = 'collaborate',
  EMPOWER = 'empower'
}

export enum ContractType {
  FIXED_PRICE = 'fixed_price',
  COST_REIMBURSEMENT = 'cost_reimbursement',
  TIME_AND_MATERIALS = 'time_and_materials',
  LABOR_HOUR = 'labor_hour',
  INDEFINITE_DELIVERY = 'indefinite_delivery',
  REQUIREMENTS = 'requirements',
  BASIC_ORDERING_AGREEMENT = 'basic_ordering_agreement',
  BLANKET_PURCHASE_AGREEMENT = 'blanket_purchase_agreement'
}

export enum ContractVehicle {
  FULL_AND_OPEN = 'full_and_open',
  SMALL_BUSINESS_SET_ASIDE = 'small_business_set_aside',
  SOLE_SOURCE = 'sole_source',
  LIMITED_COMPETITION = 'limited_competition',
  GSA_SCHEDULE = 'gsa_schedule',
  GWAC = 'gwac',
  CIO_SP3 = 'cio_sp3',
  SEWP = 'sewp',
  OASIS = 'oasis',
  CUSTOM = 'custom'
}

export enum ContractStatus {
  SOLICITATION = 'solicitation',
  AWARDED = 'awarded',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  TERMINATED = 'terminated',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled'
}

export enum GrantType {
  RESEARCH_GRANT = 'research_grant',
  DEVELOPMENT_GRANT = 'development_grant',
  DEMONSTRATION_GRANT = 'demonstration_grant',
  DEPLOYMENT_GRANT = 'deployment_grant',
  TRAINING_GRANT = 'training_grant',
  CAPACITY_BUILDING = 'capacity_building',
  INFRASTRUCTURE = 'infrastructure',
  EQUIPMENT = 'equipment',
  FELLOWSHIP = 'fellowship',
  SCHOLARSHIP = 'scholarship'
}

export enum FundingMechanism {
  GRANT = 'grant',
  COOPERATIVE_AGREEMENT = 'cooperative_agreement',
  CONTRACT = 'contract',
  LOAN = 'loan',
  LOAN_GUARANTEE = 'loan_guarantee',
  TAX_CREDIT = 'tax_credit',
  TAX_INCENTIVE = 'tax_incentive',
  PRIZE = 'prize',
  CHALLENGE = 'challenge'
}

export enum ClearanceType {
  PERSONNEL = 'personnel',
  FACILITY = 'facility',
  VISIT = 'visit',
  STORAGE = 'storage',
  INTERIM = 'interim',
  FINAL = 'final'
}

export enum ClearanceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
  PENDING = 'pending',
  DENIED = 'denied'
}

export enum SubmissionType {
  APPLICATION = 'application',
  PROPOSAL = 'proposal',
  REPORT = 'report',
  NOTIFICATION = 'notification',
  REQUEST = 'request',
  RESPONSE = 'response',
  AMENDMENT = 'amendment',
  MODIFICATION = 'modification',
  RENEWAL = 'renewal',
  TERMINATION = 'termination'
}

export enum SubmissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  CONDITIONALLY_APPROVED = 'conditionally_approved',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired'
}

export enum OpportunityType {
  SOLICITATION = 'solicitation',
  SOURCES_SOUGHT = 'sources_sought',
  PRESOLICITATION = 'presolicitation',
  COMBINED_SYNOPSIS = 'combined_synopsis',
  MODIFICATION = 'modification',
  AWARD_NOTICE = 'award_notice',
  INTENT_TO_BUNDLE = 'intent_to_bundle',
  FAIR_OPPORTUNITY = 'fair_opportunity'
}

export enum SetAsideType {
  NONE = 'none',
  SMALL_BUSINESS = 'small_business',
  WOMEN_OWNED = 'women_owned',
  VETERAN_OWNED = 'veteran_owned',
  SERVICE_DISABLED_VETERAN = 'service_disabled_veteran',
  HUBZONE = 'hubzone',
  EIGHT_A = 'eight_a',
  HISTORICALLY_BLACK_COLLEGE = 'historically_black_college',
  MINORITY_INSTITUTION = 'minority_institution'
}

export enum OpportunityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  AWARDED = 'awarded',
  ARCHIVED = 'archived'
}

export enum DashboardType {
  EXECUTIVE = 'executive',
  OPERATIONAL = 'operational',
  COMPLIANCE = 'compliance',
  STRATEGIC = 'strategic',
  TACTICAL = 'tactical',
  ANALYTICAL = 'analytical'
}

export enum RefreshFrequency {
  REAL_TIME = 'real_time',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ON_DEMAND = 'on_demand'
}

// =====================================================
// REQUEST/RESPONSE INTERFACES
// =====================================================

export interface CreateGovernmentProfileRequest {
  startup_id: string;
  government_level: GovernmentLevel;
  jurisdiction: string;
  target_agencies: string[];
  business_objectives: string[];
  compliance_priorities: string[];
  security_requirements: string[];
}

export interface UpdateComplianceRequest {
  regulation_id: string;
  compliance_status: ComplianceStatus;
  compliance_percentage: number;
  compliance_evidence: ComplianceEvidence[];
  remediation_plan?: RemediationPlan;
  next_assessment_date: Date;
}

export interface CreatePolicyEngagementRequest {
  policy_area: PolicyArea;
  policy_title: string;
  government_level: GovernmentLevel;
  responsible_agency: string;
  engagement_type: EngagementType;
  position_statement: PositionStatement;
  key_messages: string[];
  target_outcomes: string[];
}

export interface SubmitProposalRequest {
  opportunity_id: string;
  proposal_title: string;
  technical_approach: string;
  management_approach: string;
  past_performance: string;
  pricing: PricingStructure;
  team_composition: TeamComposition;
  subcontracting_plan?: SubcontractingPlan;
  small_business_utilization?: SmallBusinessUtilization;
}

export interface ApplyForGrantRequest {
  grant_program: string;
  project_title: string;
  project_description: string;
  research_objectives: string[];
  methodology: string;
  timeline: ProjectTimeline;
  budget: GrantBudget;
  team: GrantTeam;
  facilities: GrantFacilities;
  commercialization_plan: CommercializationPlan;
}

export interface GovernmentProfileResponse {
  government_profile: GovernmentProfile;
  regulatory_compliance: RegulatoryCompliance[];
  policy_engagements: PolicyEngagement[];
  government_contracts: GovernmentContract[];
  procurement_opportunities: ProcurementOpportunity[];
  grant_funding: GrantFunding[];
  security_clearances: SecurityClearance[];
  analytics: GovernmentAnalytics;
  dashboard: GovernmentDashboard;
  recommendations: GovernmentRecommendation[];
  alerts: GovernmentAlert[];
}

export interface GovernmentDashboardResponse {
  compliance_score: number;
  policy_alignment_score: number;
  government_engagement_score: number;
  active_contracts_count: number;
  total_contract_value: number;
  active_grants_count: number;
  total_grant_funding: number;
  compliance_violations: number;
  upcoming_deadlines: GovernmentDeadline[];
  recent_activities: GovernmentActivity[];
  key_metrics: GovernmentKeyMetric[];
  performance_trends: GovernmentPerformanceTrend[];
  risk_alerts: GovernmentRiskAlert[];
  opportunities: GovernmentOpportunity[];
  recommendations: GovernmentDashboardRecommendation[];
  stakeholder_map: StakeholderMap;
  policy_tracker: PolicyTracker[];
  regulatory_calendar: RegulatoryCalendar[];
  engagement_calendar: EngagementCalendar[];
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface ComplianceRequirement {
  id: string;
  requirement_title: string;
  requirement_description: string;
  compliance_method: string;
  evidence_required: string[];
  responsible_party: string;
  due_date: Date;
  status: ComplianceStatus;
  priority: Priority;
  cost_estimate: number;
  effort_estimate: number;
}

export interface PolicyImpactAssessment {
  economic_impact: EconomicImpact;
  operational_impact: OperationalImpact;
  competitive_impact: CompetitiveImpact;
  compliance_impact: ComplianceImpact;
  strategic_impact: StrategicImpact;
  risk_impact: RiskImpact;
  opportunity_impact: OpportunityImpact;
  timeline_impact: TimelineImpact;
  resource_impact: ResourceImpact;
  stakeholder_impact: StakeholderImpact;
}

export interface ContractPerformanceMetric {
  metric_name: string;
  metric_description: string;
  target_value: number;
  actual_value: number;
  unit_of_measure: string;
  measurement_frequency: MeasurementFrequency;
  performance_threshold: PerformanceThreshold;
  incentive_structure: IncentiveStructure;
  penalty_structure: ContractPenaltyStructure;
  reporting_requirements: MetricReportingRequirement[];
}

export interface SecurityRequirement {
  requirement_type: SecurityRequirementType;
  requirement_description: string;
  classification_level: DataClassificationLevel;
  handling_instructions: string[];
  access_controls: AccessControl[];
  storage_requirements: StorageRequirement[];
  transmission_requirements: TransmissionRequirement[];
  disposal_requirements: DisposalRequirement[];
  training_requirements: SecurityTrainingRequirement[];
  monitoring_requirements: SecurityMonitoringRequirement[];
}

export interface StakeholderMapping {
  stakeholder_groups: StakeholderGroup[];
  influence_matrix: InfluenceMatrix;
  interest_matrix: InterestMatrix;
  power_matrix: PowerMatrix;
  coalition_opportunities: CoalitionOpportunity[];
  opposition_analysis: OppositionAnalysis;
  neutral_parties: NeutralParty[];
  decision_makers: DecisionMaker[];
  influencers: Influencer[];
  gatekeepers: Gatekeeper[];
  champions: Champion[];
  blockers: Blocker[];
}

export interface EngagementStrategy {
  strategic_objectives: StrategicObjective[];
  tactical_approaches: TacticalApproach[];
  messaging_framework: MessagingFramework;
  communication_channels: CommunicationChannel[];
  timing_strategy: TimingStrategy;
  resource_allocation: ResourceAllocation;
  risk_mitigation: EngagementRiskMitigation;
  success_metrics: EngagementSuccessMetric[];
  contingency_plans: ContingencyPlan[];
  evaluation_framework: EvaluationFramework;
}

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type MeasurementFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'event_driven';
export type SecurityRequirementType = 'physical' | 'personnel' | 'information' | 'industrial' | 'operations';
export type TrackingStatus = 'active' | 'inactive' | 'completed' | 'cancelled' | 'on_hold';
export type PolicyPriority = 'critical' | 'high' | 'medium' | 'low';
export type PolicyType = 'legislation' | 'regulation' | 'guidance' | 'standard' | 'directive' | 'policy';
export type SubmissionMethod = 'electronic' | 'paper' | 'hybrid' | 'oral' | 'demonstration';
export type SubmissionFormat = 'pdf' | 'word' | 'excel' | 'powerpoint' | 'video' | 'audio' | 'interactive';
export type InvestigationType = 'tier_1' | 'tier_2' | 'tier_3' | 'tier_4' | 'tier_5' | 'periodic_reinvestigation';
