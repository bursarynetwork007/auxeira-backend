/**
 * ESG/Impact Dashboard Types
 * Comprehensive type definitions for Environmental, Social, and Governance impact tracking
 */

// =====================================================
// CORE ESG TYPES
// =====================================================

export interface ESGProfile {
  id: string;
  startup_id: string;
  overall_esg_score: number;
  environmental_score: number;
  social_score: number;
  governance_score: number;
  impact_score: number;
  sustainability_rating: SustainabilityRating;
  certification_level: CertificationLevel;
  reporting_framework: ReportingFramework[];
  assessment_date: Date;
  next_assessment_date: Date;
  assessment_frequency: AssessmentFrequency;
  verified: boolean;
  verified_by?: string;
  verification_date?: Date;
  verification_standard: VerificationStandard;
  public_disclosure: boolean;
  stakeholder_engagement: StakeholderEngagement;
  materiality_assessment: MaterialityAssessment;
  risk_assessment: ESGRiskAssessment;
  opportunity_assessment: ESGOpportunityAssessment;
  performance_trends: PerformanceTrend[];
  benchmark_comparisons: BenchmarkComparison[];
  improvement_targets: ImprovementTarget[];
  action_plans: ActionPlan[];
  reporting_history: ReportingHistory[];
  certifications: Certification[];
  awards_recognition: Award[];
  media_coverage: MediaCoverage[];
  investor_interest: InvestorInterest[];
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface EnvironmentalMetrics {
  id: string;
  startup_id: string;
  carbon_footprint: CarbonFootprint;
  energy_consumption: EnergyConsumption;
  water_usage: WaterUsage;
  waste_management: WasteManagement;
  biodiversity_impact: BiodiversityImpact;
  circular_economy: CircularEconomy;
  climate_resilience: ClimateResilience;
  environmental_compliance: EnvironmentalCompliance;
  green_innovation: GreenInnovation;
  supply_chain_environmental: SupplyChainEnvironmental;
  environmental_investments: EnvironmentalInvestment[];
  environmental_initiatives: EnvironmentalInitiative[];
  environmental_partnerships: EnvironmentalPartnership[];
  environmental_certifications: EnvironmentalCertification[];
  environmental_risks: EnvironmentalRisk[];
  environmental_opportunities: EnvironmentalOpportunity[];
  reporting_period: ReportingPeriod;
  data_quality: DataQuality;
  verification_status: VerificationStatus;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface SocialMetrics {
  id: string;
  startup_id: string;
  employee_wellbeing: EmployeeWellbeing;
  diversity_inclusion: DiversityInclusion;
  community_impact: CommunityImpact;
  customer_welfare: CustomerWelfare;
  human_rights: HumanRights;
  labor_practices: LaborPractices;
  product_responsibility: ProductResponsibility;
  social_innovation: SocialInnovation;
  stakeholder_relations: StakeholderRelations;
  supply_chain_social: SupplyChainSocial;
  social_investments: SocialInvestment[];
  social_initiatives: SocialInitiative[];
  social_partnerships: SocialPartnership[];
  social_certifications: SocialCertification[];
  social_risks: SocialRisk[];
  social_opportunities: SocialOpportunity[];
  reporting_period: ReportingPeriod;
  data_quality: DataQuality;
  verification_status: VerificationStatus;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface GovernanceMetrics {
  id: string;
  startup_id: string;
  board_composition: BoardComposition;
  executive_compensation: ExecutiveCompensation;
  audit_compliance: AuditCompliance;
  risk_management: RiskManagement;
  ethics_integrity: EthicsIntegrity;
  transparency_disclosure: TransparencyDisclosure;
  stakeholder_rights: StakeholderRights;
  cybersecurity: Cybersecurity;
  data_privacy: DataPrivacy;
  regulatory_compliance: RegulatoryCompliance;
  governance_policies: GovernancePolicy[];
  governance_training: GovernanceTraining[];
  governance_assessments: GovernanceAssessment[];
  governance_incidents: GovernanceIncident[];
  governance_improvements: GovernanceImprovement[];
  reporting_period: ReportingPeriod;
  data_quality: DataQuality;
  verification_status: VerificationStatus;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

// =====================================================
// IMPACT MEASUREMENT TYPES
// =====================================================

export interface ImpactMeasurement {
  id: string;
  startup_id: string;
  impact_framework: ImpactFramework;
  theory_of_change: TheoryOfChange;
  impact_objectives: ImpactObjective[];
  outcome_metrics: OutcomeMetric[];
  output_metrics: OutputMetric[];
  impact_indicators: ImpactIndicator[];
  beneficiary_analysis: BeneficiaryAnalysis;
  geographic_impact: GeographicImpact;
  temporal_impact: TemporalImpact;
  impact_attribution: ImpactAttribution;
  impact_verification: ImpactVerification;
  impact_monetization: ImpactMonetization;
  impact_scaling: ImpactScaling;
  impact_sustainability: ImpactSustainability;
  impact_partnerships: ImpactPartnership[];
  impact_investments: ImpactInvestment[];
  impact_innovations: ImpactInnovation[];
  impact_challenges: ImpactChallenge[];
  impact_opportunities: ImpactOpportunity[];
  impact_stories: ImpactStory[];
  impact_evidence: ImpactEvidence[];
  reporting_period: ReportingPeriod;
  measurement_methodology: MeasurementMethodology;
  data_collection: DataCollection;
  quality_assurance: QualityAssurance;
  external_validation: ExternalValidation;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface SDGAlignment {
  id: string;
  startup_id: string;
  aligned_sdgs: SDGTarget[];
  primary_sdgs: number[];
  secondary_sdgs: number[];
  sdg_contributions: SDGContribution[];
  sdg_indicators: SDGIndicator[];
  sdg_targets: SDGTargetAlignment[];
  sdg_impact_measurement: SDGImpactMeasurement;
  sdg_reporting: SDGReporting;
  sdg_partnerships: SDGPartnership[];
  sdg_innovations: SDGInnovation[];
  sdg_challenges: SDGChallenge[];
  sdg_opportunities: SDGOpportunity[];
  sdg_progress_tracking: SDGProgressTracking;
  sdg_verification: SDGVerification;
  sdg_communication: SDGCommunication;
  reporting_period: ReportingPeriod;
  alignment_methodology: AlignmentMethodology;
  impact_quantification: ImpactQuantification;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

// =====================================================
// ENVIRONMENTAL DETAILED TYPES
// =====================================================

export interface CarbonFootprint {
  scope_1_emissions: number; // Direct emissions (tCO2e)
  scope_2_emissions: number; // Indirect emissions from energy (tCO2e)
  scope_3_emissions: number; // Other indirect emissions (tCO2e)
  total_emissions: number; // Total carbon footprint (tCO2e)
  emissions_intensity: number; // Emissions per unit of revenue/output
  carbon_neutral_target_date?: Date;
  net_zero_target_date?: Date;
  carbon_offset_credits: number;
  renewable_energy_percentage: number;
  energy_efficiency_improvements: number;
  carbon_reduction_initiatives: CarbonReductionInitiative[];
  carbon_pricing: CarbonPricing;
  carbon_reporting_standard: CarbonReportingStandard;
  verification_body?: string;
  last_verification_date?: Date;
  next_verification_date?: Date;
  improvement_targets: CarbonTarget[];
  historical_data: CarbonHistoricalData[];
  forecasting: CarbonForecasting;
  benchmarking: CarbonBenchmarking;
}

export interface EnergyConsumption {
  total_energy_consumption: number; // MWh
  renewable_energy_consumption: number; // MWh
  non_renewable_energy_consumption: number; // MWh
  renewable_energy_percentage: number;
  energy_intensity: number; // Energy per unit of output
  energy_efficiency_rating: EnergyEfficiencyRating;
  energy_management_system: EnergyManagementSystem;
  energy_audits: EnergyAudit[];
  energy_efficiency_projects: EnergyEfficiencyProject[];
  renewable_energy_projects: RenewableEnergyProject[];
  energy_procurement_strategy: EnergyProcurementStrategy;
  energy_storage_systems: EnergyStorageSystem[];
  smart_grid_integration: SmartGridIntegration;
  energy_monitoring: EnergyMonitoring;
  energy_targets: EnergyTarget[];
  energy_performance_indicators: EnergyKPI[];
}

export interface WaterUsage {
  total_water_consumption: number; // m³
  freshwater_consumption: number; // m³
  recycled_water_usage: number; // m³
  water_intensity: number; // Water per unit of output
  water_stress_assessment: WaterStressAssessment;
  water_management_system: WaterManagementSystem;
  water_efficiency_projects: WaterEfficiencyProject[];
  water_recycling_systems: WaterRecyclingSystem[];
  wastewater_treatment: WastewaterTreatment;
  water_quality_monitoring: WaterQualityMonitoring;
  water_conservation_initiatives: WaterConservationInitiative[];
  water_risk_assessment: WaterRiskAssessment;
  water_targets: WaterTarget[];
  water_performance_indicators: WaterKPI[];
}

// =====================================================
// SOCIAL DETAILED TYPES
// =====================================================

export interface EmployeeWellbeing {
  employee_satisfaction_score: number;
  employee_engagement_score: number;
  work_life_balance_rating: number;
  mental_health_support: MentalHealthSupport;
  physical_health_programs: PhysicalHealthProgram[];
  professional_development: ProfessionalDevelopment;
  career_advancement_opportunities: CareerAdvancement;
  compensation_benefits: CompensationBenefits;
  workplace_safety: WorkplaceSafety;
  employee_turnover_rate: number;
  absenteeism_rate: number;
  employee_feedback_systems: EmployeeFeedbackSystem[];
  wellness_initiatives: WellnessInitiative[];
  employee_recognition_programs: RecognitionProgram[];
  flexible_work_arrangements: FlexibleWorkArrangement[];
}

export interface DiversityInclusion {
  gender_diversity: GenderDiversity;
  ethnic_diversity: EthnicDiversity;
  age_diversity: AgeDiversity;
  disability_inclusion: DisabilityInclusion;
  lgbtq_inclusion: LGBTQInclusion;
  leadership_diversity: LeadershipDiversity;
  pay_equity: PayEquity;
  inclusive_culture_score: number;
  diversity_training_programs: DiversityTrainingProgram[];
  inclusion_initiatives: InclusionInitiative[];
  diversity_metrics: DiversityMetric[];
  bias_mitigation_strategies: BiasMitigationStrategy[];
  diverse_supplier_program: DiverseSupplierProgram;
  diversity_partnerships: DiversityPartnership[];
  diversity_goals: DiversityGoal[];
}

export interface CommunityImpact {
  community_investment_amount: number;
  volunteer_hours: number;
  local_employment_percentage: number;
  local_procurement_percentage: number;
  community_programs: CommunityProgram[];
  educational_initiatives: EducationalInitiative[];
  healthcare_initiatives: HealthcareInitiative[];
  infrastructure_development: InfrastructureDevelopment[];
  economic_development: EconomicDevelopment[];
  social_enterprises_supported: SocialEnterpriseSupport[];
  community_partnerships: CommunityPartnership[];
  community_feedback: CommunityFeedback[];
  community_impact_measurement: CommunityImpactMeasurement;
  community_grievance_mechanism: GrievanceMechanism;
}

// =====================================================
// GOVERNANCE DETAILED TYPES
// =====================================================

export interface BoardComposition {
  total_board_members: number;
  independent_directors: number;
  independent_director_percentage: number;
  gender_diversity_board: GenderDiversityBoard;
  ethnic_diversity_board: EthnicDiversityBoard;
  age_diversity_board: AgeDiversityBoard;
  board_expertise: BoardExpertise[];
  board_committees: BoardCommittee[];
  board_meeting_frequency: number;
  board_attendance_rate: number;
  board_evaluation_process: BoardEvaluationProcess;
  director_training_programs: DirectorTrainingProgram[];
  board_succession_planning: BoardSuccessionPlanning;
  board_compensation: BoardCompensation;
  board_charter: BoardCharter;
}

export interface EthicsIntegrity {
  code_of_conduct: CodeOfConduct;
  ethics_training_completion_rate: number;
  whistleblower_policy: WhistleblowerPolicy;
  conflict_of_interest_policy: ConflictOfInterestPolicy;
  anti_corruption_policy: AntiCorruptionPolicy;
  ethics_hotline: EthicsHotline;
  ethics_violations_reported: number;
  ethics_violations_resolved: number;
  ethics_committee: EthicsCommittee;
  ethics_audits: EthicsAudit[];
  integrity_assessments: IntegrityAssessment[];
  ethics_culture_survey: EthicsCultureSurvey;
  ethics_performance_indicators: EthicsKPI[];
}

// =====================================================
// REPORTING AND ANALYTICS TYPES
// =====================================================

export interface ESGReport {
  id: string;
  startup_id: string;
  report_type: ESGReportType;
  reporting_framework: ReportingFramework;
  reporting_period: ReportingPeriod;
  report_title: string;
  executive_summary: string;
  materiality_matrix: MaterialityMatrix;
  stakeholder_engagement_summary: StakeholderEngagementSummary;
  environmental_section: EnvironmentalReportSection;
  social_section: SocialReportSection;
  governance_section: GovernanceReportSection;
  impact_section: ImpactReportSection;
  performance_highlights: PerformanceHighlight[];
  key_achievements: KeyAchievement[];
  challenges_lessons_learned: ChallengeLessonLearned[];
  future_commitments: FutureCommitment[];
  targets_progress: TargetProgress[];
  data_methodology: DataMethodology;
  assurance_statement?: AssuranceStatement;
  third_party_verification?: ThirdPartyVerification;
  stakeholder_feedback_summary: StakeholderFeedbackSummary;
  report_distribution: ReportDistribution;
  report_accessibility: ReportAccessibility;
  report_format: ReportFormat[];
  publication_date: Date;
  next_report_date: Date;
  report_url?: string;
  report_file_path?: string;
  download_count: number;
  stakeholder_engagement_metrics: StakeholderEngagementMetrics;
  report_quality_score: number;
  transparency_score: number;
  completeness_score: number;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface ESGAnalytics {
  startup_id: string;
  analysis_period: AnalysisPeriod;
  overall_performance: OverallESGPerformance;
  environmental_analytics: EnvironmentalAnalytics;
  social_analytics: SocialAnalytics;
  governance_analytics: GovernanceAnalytics;
  impact_analytics: ImpactAnalytics;
  trend_analysis: TrendAnalysis;
  peer_benchmarking: PeerBenchmarking;
  industry_comparison: IndustryComparison;
  risk_opportunity_analysis: RiskOpportunityAnalysis;
  materiality_analysis: MaterialityAnalysis;
  stakeholder_sentiment_analysis: StakeholderSentimentAnalysis;
  performance_drivers: PerformanceDriver[];
  improvement_recommendations: ImprovementRecommendation[];
  investment_implications: InvestmentImplication[];
  regulatory_compliance_status: RegulatoryComplianceStatus;
  certification_readiness: CertificationReadiness;
  reporting_quality_assessment: ReportingQualityAssessment;
  data_quality_assessment: DataQualityAssessment;
  predictive_insights: PredictiveInsight[];
  scenario_analysis: ScenarioAnalysis[];
  sensitivity_analysis: SensitivityAnalysis[];
  monte_carlo_simulation: MonteCarloSimulation;
  machine_learning_insights: MachineLearningInsight[];
  natural_language_processing: NLPInsight[];
  generated_at: Date;
  analysis_confidence: number;
  data_completeness: number;
  methodology: AnalysisMethodology;
  limitations: string[];
  recommendations: AnalyticsRecommendation[];
  next_analysis_date: Date;
  metadata: Record<string, any>;
}

// =====================================================
// ENUMS
// =====================================================

export enum SustainabilityRating {
  AAA = 'AAA',
  AA = 'AA',
  A = 'A',
  BBB = 'BBB',
  BB = 'BB',
  B = 'B',
  CCC = 'CCC',
  CC = 'CC',
  C = 'C',
  D = 'D'
}

export enum CertificationLevel {
  NONE = 'none',
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond'
}

export enum ReportingFramework {
  GRI = 'gri',
  SASB = 'sasb',
  TCFD = 'tcfd',
  IIRC = 'iirc',
  CDP = 'cdp',
  UNGC = 'ungc',
  SDG = 'sdg',
  EU_TAXONOMY = 'eu_taxonomy',
  CSRD = 'csrd',
  SEC_CLIMATE = 'sec_climate',
  CUSTOM = 'custom'
}

export enum AssessmentFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUALLY = 'semi_annually',
  ANNUALLY = 'annually',
  BIANNUALLY = 'biannually'
}

export enum VerificationStandard {
  ISAE_3000 = 'isae_3000',
  AA1000AS = 'aa1000as',
  GRI_STANDARDS = 'gri_standards',
  ISO_14064 = 'iso_14064',
  PAS_2060 = 'pas_2060',
  CUSTOM = 'custom',
  NONE = 'none'
}

export enum ESGReportType {
  ANNUAL_SUSTAINABILITY = 'annual_sustainability',
  INTEGRATED_REPORT = 'integrated_report',
  CLIMATE_DISCLOSURE = 'climate_disclosure',
  IMPACT_REPORT = 'impact_report',
  ESG_FACTSHEET = 'esg_factsheet',
  REGULATORY_FILING = 'regulatory_filing',
  INVESTOR_UPDATE = 'investor_update',
  STAKEHOLDER_REPORT = 'stakeholder_report'
}

export enum ImpactFramework {
  THEORY_OF_CHANGE = 'theory_of_change',
  LOGIC_MODEL = 'logic_model',
  IMPACT_MANAGEMENT_PROJECT = 'impact_management_project',
  IRIS_PLUS = 'iris_plus',
  GIIN_COMPASS = 'giin_compass',
  B_IMPACT_ASSESSMENT = 'b_impact_assessment',
  SOCIAL_VALUE_UK = 'social_value_uk',
  SROI = 'sroi',
  CUSTOM = 'custom'
}

export enum DataQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  INSUFFICIENT = 'insufficient'
}

export enum VerificationStatus {
  VERIFIED = 'verified',
  PARTIALLY_VERIFIED = 'partially_verified',
  SELF_REPORTED = 'self_reported',
  UNVERIFIED = 'unverified',
  DISPUTED = 'disputed'
}

export enum EnergyEfficiencyRating {
  A_PLUS_PLUS_PLUS = 'A+++',
  A_PLUS_PLUS = 'A++',
  A_PLUS = 'A+',
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G'
}

export enum CarbonReportingStandard {
  GHG_PROTOCOL = 'ghg_protocol',
  ISO_14064 = 'iso_14064',
  PAS_2050 = 'pas_2050',
  CARBON_TRUST = 'carbon_trust',
  CDP = 'cdp',
  SBTi = 'sbti',
  CUSTOM = 'custom'
}

// =====================================================
// REQUEST/RESPONSE INTERFACES
// =====================================================

export interface CreateESGProfileRequest {
  startup_id: string;
  reporting_framework: ReportingFramework[];
  assessment_frequency: AssessmentFrequency;
  public_disclosure: boolean;
  target_certification_level: CertificationLevel;
  materiality_topics: string[];
  stakeholder_groups: string[];
}

export interface UpdateESGMetricsRequest {
  environmental_metrics?: Partial<EnvironmentalMetrics>;
  social_metrics?: Partial<SocialMetrics>;
  governance_metrics?: Partial<GovernanceMetrics>;
  impact_measurement?: Partial<ImpactMeasurement>;
  sdg_alignment?: Partial<SDGAlignment>;
  reporting_period: ReportingPeriod;
  data_quality: DataQuality;
  verification_status: VerificationStatus;
}

export interface GenerateESGReportRequest {
  startup_id: string;
  report_type: ESGReportType;
  reporting_framework: ReportingFramework;
  reporting_period: ReportingPeriod;
  include_third_party_verification: boolean;
  target_audience: string[];
  distribution_channels: string[];
  report_format: ReportFormat[];
}

export interface ESGBenchmarkingRequest {
  startup_id: string;
  benchmark_type: BenchmarkType;
  peer_group: string[];
  industry_sector: string;
  company_size: CompanySize;
  geographic_region: string;
  metrics_to_compare: string[];
}

export interface ESGProfileResponse {
  esg_profile: ESGProfile;
  environmental_metrics: EnvironmentalMetrics;
  social_metrics: SocialMetrics;
  governance_metrics: GovernanceMetrics;
  impact_measurement: ImpactMeasurement;
  sdg_alignment: SDGAlignment;
  recent_reports: ESGReport[];
  analytics: ESGAnalytics;
  benchmarking: BenchmarkingResult[];
  recommendations: ImprovementRecommendation[];
  certification_status: CertificationStatus;
  compliance_status: ComplianceStatus;
}

export interface ESGDashboardResponse {
  overall_scores: OverallScores;
  performance_trends: PerformanceTrend[];
  key_metrics: KeyMetric[];
  recent_achievements: Achievement[];
  upcoming_deadlines: Deadline[];
  risk_alerts: RiskAlert[];
  improvement_opportunities: ImprovementOpportunity[];
  stakeholder_feedback: StakeholderFeedback[];
  industry_benchmarks: IndustryBenchmark[];
  regulatory_updates: RegulatoryUpdate[];
  best_practices: BestPractice[];
  action_items: ActionItem[];
  reporting_calendar: ReportingCalendar[];
  certification_progress: CertificationProgress[];
  investor_interest: InvestorInterest[];
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface ReportingPeriod {
  start_date: Date;
  end_date: Date;
  period_type: PeriodType;
  fiscal_year: number;
  quarter?: number;
  month?: number;
}

export interface MaterialityAssessment {
  material_topics: MaterialTopic[];
  stakeholder_input: StakeholderInput[];
  business_impact_assessment: BusinessImpactAssessment;
  materiality_matrix: MaterialityMatrix;
  prioritization_methodology: PrioritizationMethodology;
  review_frequency: ReviewFrequency;
  last_review_date: Date;
  next_review_date: Date;
}

export interface StakeholderEngagement {
  stakeholder_groups: StakeholderGroup[];
  engagement_methods: EngagementMethod[];
  engagement_frequency: EngagementFrequency[];
  feedback_mechanisms: FeedbackMechanism[];
  engagement_outcomes: EngagementOutcome[];
  stakeholder_satisfaction: StakeholderSatisfaction[];
  engagement_calendar: EngagementCalendar[];
  engagement_budget: EngagementBudget;
  engagement_effectiveness: EngagementEffectiveness;
}

export interface ImpactObjective {
  id: string;
  title: string;
  description: string;
  target_beneficiaries: TargetBeneficiary[];
  geographic_scope: GeographicScope;
  time_horizon: TimeHorizon;
  success_metrics: SuccessMetric[];
  baseline_data: BaselineData;
  target_outcomes: TargetOutcome[];
  theory_of_change: TheoryOfChange;
  assumptions: Assumption[];
  risks: Risk[];
  dependencies: Dependency[];
  resources_required: ResourceRequirement[];
  monitoring_plan: MonitoringPlan;
  evaluation_plan: EvaluationPlan;
}

export interface SDGContribution {
  sdg_number: number;
  sdg_title: string;
  contribution_type: ContributionType;
  contribution_level: ContributionLevel;
  target_alignment: TargetAlignment[];
  indicator_alignment: IndicatorAlignment[];
  impact_measurement: ImpactMeasurement;
  progress_tracking: ProgressTracking;
  reporting_frequency: ReportingFrequency;
  verification_method: VerificationMethod;
  challenges: Challenge[];
  opportunities: Opportunity[];
  partnerships: Partnership[];
  innovations: Innovation[];
}

export type PeriodType = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom';
export type BenchmarkType = 'industry' | 'peer_group' | 'size_based' | 'geographic' | 'best_in_class';
export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
export type ContributionType = 'direct' | 'indirect' | 'enabling' | 'systemic';
export type ContributionLevel = 'high' | 'medium' | 'low' | 'minimal';
export type ReportFormat = 'pdf' | 'html' | 'interactive' | 'infographic' | 'video' | 'presentation';
export type ReviewFrequency = 'annual' | 'biannual' | 'triennial' | 'as_needed';
export type TimeHorizon = 'short_term' | 'medium_term' | 'long_term' | 'perpetual';
export type ReportingFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'ad_hoc';
