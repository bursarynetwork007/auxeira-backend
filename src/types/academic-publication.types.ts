/**
 * Academic Publication Framework Types
 * Comprehensive type definitions for research publication and academic collaboration
 */

// =====================================================
// CORE PUBLICATION TYPES
// =====================================================

export interface ResearchPaper {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  authors: Author[];
  affiliations: Affiliation[];
  publication_type: PublicationType;
  research_category: ResearchCategory;
  methodology: ResearchMethodology;
  data_sources: DataSource[];
  statistical_methods: string[];
  findings: ResearchFinding[];
  conclusions: string[];
  limitations: string[];
  future_research: string[];
  ethical_considerations: string[];
  funding_sources: FundingSource[];
  conflicts_of_interest: string[];
  submission_status: SubmissionStatus;
  peer_review_status: PeerReviewStatus;
  publication_venue?: PublicationVenue;
  doi?: string;
  arxiv_id?: string;
  citation_count: number;
  download_count: number;
  altmetric_score?: number;
  impact_factor?: number;
  h_index_contribution?: number;
  open_access: boolean;
  license_type?: LicenseType;
  embargo_date?: Date;
  submission_date: Date;
  acceptance_date?: Date;
  publication_date?: Date;
  last_revision_date?: Date;
  version: string;
  file_attachments: FileAttachment[];
  supplementary_materials: SupplementaryMaterial[];
  code_repositories: CodeRepository[];
  data_availability: DataAvailability;
  reproducibility_score?: number;
  quality_metrics: QualityMetrics;
  collaboration_network: CollaborationNetwork;
  citation_network: CitationNetwork;
  social_media_metrics: SocialMediaMetrics;
  academic_impact: AcademicImpact;
  industry_impact: IndustryImpact;
  policy_impact: PolicyImpact;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface Author {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  orcid_id?: string;
  google_scholar_id?: string;
  researchgate_id?: string;
  linkedin_profile?: string;
  affiliation_ids: string[];
  author_order: number;
  contribution_type: ContributionType[];
  contribution_percentage: number;
  corresponding_author: boolean;
  biography?: string;
  expertise_areas: string[];
  h_index?: number;
  citation_count?: number;
  publication_count?: number;
  collaboration_score?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Affiliation {
  id: string;
  institution_name: string;
  department?: string;
  address: Address;
  institution_type: InstitutionType;
  country: string;
  website?: string;
  ror_id?: string; // Research Organization Registry ID
  grid_id?: string; // Global Research Identifier Database ID
  ranking?: InstitutionRanking;
  research_areas: string[];
  collaboration_agreements: string[];
  created_at: Date;
  updated_at: Date;
}

export interface PublicationVenue {
  id: string;
  name: string;
  venue_type: VenueType;
  publisher: string;
  issn?: string;
  isbn?: string;
  impact_factor?: number;
  h_index?: number;
  sjr_score?: number; // SCImago Journal Rank
  cite_score?: number;
  acceptance_rate?: number;
  review_time_days?: number;
  open_access_policy: OpenAccessPolicy;
  subject_areas: string[];
  indexing_databases: string[];
  peer_review_type: PeerReviewType;
  publication_frequency: string;
  website: string;
  submission_guidelines: string;
  created_at: Date;
  updated_at: Date;
}

// =====================================================
// RESEARCH METHODOLOGY TYPES
// =====================================================

export interface ResearchMethodology {
  study_design: StudyDesign;
  data_collection_methods: DataCollectionMethod[];
  sampling_strategy: SamplingStrategy;
  sample_size: number;
  sample_characteristics: SampleCharacteristics;
  variables: Variable[];
  instruments: ResearchInstrument[];
  procedures: ResearchProcedure[];
  quality_assurance: QualityAssurance;
  ethical_approval: EthicalApproval;
  statistical_analysis_plan: StatisticalAnalysisPlan;
  software_tools: SoftwareTool[];
  reproducibility_measures: ReproducibilityMeasure[];
}

export interface ResearchFinding {
  id: string;
  finding_type: FindingType;
  title: string;
  description: string;
  statistical_significance: boolean;
  p_value?: number;
  confidence_interval?: ConfidenceInterval;
  effect_size?: EffectSize;
  practical_significance: PracticalSignificance;
  supporting_evidence: Evidence[];
  visualizations: Visualization[];
  tables: DataTable[];
  implications: string[];
  limitations: string[];
  novelty_score: number;
  impact_score: number;
  replication_status?: ReplicationStatus;
}

export interface DataSource {
  id: string;
  name: string;
  source_type: DataSourceType;
  description: string;
  access_method: DataAccessMethod;
  data_format: DataFormat;
  temporal_coverage: TemporalCoverage;
  geographical_coverage: GeographicalCoverage;
  sample_size: number;
  data_quality_score: number;
  completeness_percentage: number;
  accuracy_metrics: AccuracyMetrics;
  bias_assessment: BiasAssessment;
  ethical_considerations: string[];
  access_restrictions: AccessRestriction[];
  cost: DataCost;
  update_frequency: UpdateFrequency;
  version: string;
  documentation_quality: DocumentationQuality;
  interoperability_score: number;
  citation_requirements: string[];
}

// =====================================================
// PEER REVIEW TYPES
// =====================================================

export interface PeerReview {
  id: string;
  paper_id: string;
  reviewer_id: string;
  review_round: number;
  review_type: ReviewType;
  review_status: ReviewStatus;
  overall_recommendation: ReviewRecommendation;
  confidence_level: ConfidenceLevel;
  expertise_level: ExpertiseLevel;
  review_criteria: ReviewCriteria;
  scores: ReviewScores;
  comments: ReviewComment[];
  suggestions: ReviewSuggestion[];
  questions: ReviewQuestion[];
  strengths: string[];
  weaknesses: string[];
  novelty_assessment: NoveltyAssessment;
  methodology_assessment: MethodologyAssessment;
  significance_assessment: SignificanceAssessment;
  clarity_assessment: ClarityAssessment;
  reproducibility_assessment: ReproducibilityAssessment;
  ethical_assessment: EthicalAssessment;
  time_spent_hours: number;
  review_quality_score?: number;
  reviewer_agreement_score?: number;
  submitted_at: Date;
  due_date: Date;
  reminder_sent: boolean;
  anonymized: boolean;
  conflicts_declared: string[];
  created_at: Date;
  updated_at: Date;
}

export interface ReviewComment {
  id: string;
  section: string;
  line_number?: number;
  comment_type: CommentType;
  severity: CommentSeverity;
  comment_text: string;
  suggested_revision?: string;
  author_response?: string;
  resolved: boolean;
  created_at: Date;
}

export interface EditorialDecision {
  id: string;
  paper_id: string;
  editor_id: string;
  decision_type: EditorialDecisionType;
  decision_rationale: string;
  review_summary: string;
  required_revisions: RequiredRevision[];
  deadline_for_revision?: Date;
  appeal_allowed: boolean;
  decision_date: Date;
  communicated_to_authors: boolean;
  final_decision: boolean;
  created_at: Date;
}

// =====================================================
// COLLABORATION TYPES
// =====================================================

export interface ResearchCollaboration {
  id: string;
  collaboration_name: string;
  collaboration_type: CollaborationType;
  description: string;
  objectives: string[];
  participants: CollaborationParticipant[];
  institutions: string[];
  funding_sources: FundingSource[];
  start_date: Date;
  end_date?: Date;
  status: CollaborationStatus;
  deliverables: Deliverable[];
  milestones: CollaborationMilestone[];
  communication_channels: CommunicationChannel[];
  data_sharing_agreement: DataSharingAgreement;
  intellectual_property_agreement: IPAgreement;
  publication_agreement: PublicationAgreement;
  success_metrics: SuccessMetric[];
  challenges: Challenge[];
  lessons_learned: string[];
  impact_assessment: CollaborationImpact;
  sustainability_plan: SustainabilityPlan;
  created_at: Date;
  updated_at: Date;
}

export interface CollaborationParticipant {
  id: string;
  user_id: string;
  role: CollaborationRole;
  responsibilities: string[];
  time_commitment_percentage: number;
  expertise_contribution: string[];
  resource_contribution: ResourceContribution;
  decision_making_authority: DecisionMakingLevel;
  communication_preferences: CommunicationPreference[];
  availability_schedule: AvailabilitySchedule;
  performance_metrics: ParticipantMetrics;
  joined_date: Date;
  left_date?: Date;
  active: boolean;
}

// =====================================================
// IMPACT MEASUREMENT TYPES
// =====================================================

export interface AcademicImpact {
  citation_metrics: CitationMetrics;
  altmetrics: Altmetrics;
  download_metrics: DownloadMetrics;
  social_media_metrics: SocialMediaMetrics;
  media_coverage: MediaCoverage;
  conference_presentations: ConferencePresentation[];
  awards_recognition: Award[];
  follow_up_research: FollowUpResearch[];
  replication_studies: ReplicationStudy[];
  meta_analyses_inclusion: MetaAnalysisInclusion[];
  textbook_citations: TextbookCitation[];
  course_adoptions: CourseAdoption[];
  h_index_contribution: number;
  field_impact_score: number;
  interdisciplinary_impact: InterdisciplinaryImpact;
}

export interface IndustryImpact {
  patent_citations: PatentCitation[];
  industry_adoptions: IndustryAdoption[];
  startup_formations: StartupFormation[];
  product_developments: ProductDevelopment[];
  process_improvements: ProcessImprovement[];
  cost_savings: CostSaving[];
  revenue_generation: RevenueGeneration[];
  job_creation: JobCreation[];
  market_disruption: MarketDisruption[];
  technology_transfer: TechnologyTransfer[];
  consulting_opportunities: ConsultingOpportunity[];
  licensing_agreements: LicensingAgreement[];
  industry_partnerships: IndustryPartnership[];
  commercialization_potential: CommercializationPotential;
}

export interface PolicyImpact {
  policy_citations: PolicyCitation[];
  regulatory_changes: RegulatoryChange[];
  government_adoptions: GovernmentAdoption[];
  think_tank_references: ThinkTankReference[];
  expert_testimonies: ExpertTestimony[];
  policy_briefs: PolicyBrief[];
  white_papers: WhitePaper[];
  legislative_hearings: LegislativeHearing[];
  regulatory_consultations: RegulatoryConsultation[];
  international_agreements: InternationalAgreement[];
  ngo_adoptions: NGOAdoption[];
  advocacy_campaigns: AdvocacyCampaign[];
  social_movements: SocialMovement[];
  public_discourse_influence: PublicDiscourseInfluence;
}

// =====================================================
// ENUMS
// =====================================================

export enum PublicationType {
  JOURNAL_ARTICLE = 'journal_article',
  CONFERENCE_PAPER = 'conference_paper',
  BOOK_CHAPTER = 'book_chapter',
  BOOK = 'book',
  THESIS = 'thesis',
  DISSERTATION = 'dissertation',
  TECHNICAL_REPORT = 'technical_report',
  WHITE_PAPER = 'white_paper',
  WORKING_PAPER = 'working_paper',
  PREPRINT = 'preprint',
  REVIEW_ARTICLE = 'review_article',
  EDITORIAL = 'editorial',
  LETTER = 'letter',
  CASE_STUDY = 'case_study',
  DATASET_PAPER = 'dataset_paper',
  SOFTWARE_PAPER = 'software_paper'
}

export enum ResearchCategory {
  STARTUP_EVALUATION = 'startup_evaluation',
  ENTREPRENEURSHIP = 'entrepreneurship',
  VENTURE_CAPITAL = 'venture_capital',
  INNOVATION_MANAGEMENT = 'innovation_management',
  BUSINESS_ANALYTICS = 'business_analytics',
  MACHINE_LEARNING = 'machine_learning',
  STATISTICAL_MODELING = 'statistical_modeling',
  BEHAVIORAL_ECONOMICS = 'behavioral_economics',
  ORGANIZATIONAL_BEHAVIOR = 'organizational_behavior',
  TECHNOLOGY_ADOPTION = 'technology_adoption',
  MARKET_ANALYSIS = 'market_analysis',
  FINANCIAL_MODELING = 'financial_modeling',
  RISK_ASSESSMENT = 'risk_assessment',
  PERFORMANCE_MEASUREMENT = 'performance_measurement',
  DECISION_SCIENCE = 'decision_science'
}

export enum SubmissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  REVISION_REQUESTED = 'revision_requested',
  REVISED_SUBMITTED = 'revised_submitted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  PUBLISHED = 'published'
}

export enum PeerReviewStatus {
  NOT_STARTED = 'not_started',
  REVIEWERS_ASSIGNED = 'reviewers_assigned',
  REVIEWS_IN_PROGRESS = 'reviews_in_progress',
  REVIEWS_COMPLETED = 'reviews_completed',
  EDITOR_DECISION_PENDING = 'editor_decision_pending',
  DECISION_COMMUNICATED = 'decision_communicated'
}

export enum ContributionType {
  CONCEPTUALIZATION = 'conceptualization',
  METHODOLOGY = 'methodology',
  SOFTWARE = 'software',
  VALIDATION = 'validation',
  FORMAL_ANALYSIS = 'formal_analysis',
  INVESTIGATION = 'investigation',
  RESOURCES = 'resources',
  DATA_CURATION = 'data_curation',
  WRITING_ORIGINAL_DRAFT = 'writing_original_draft',
  WRITING_REVIEW_EDITING = 'writing_review_editing',
  VISUALIZATION = 'visualization',
  SUPERVISION = 'supervision',
  PROJECT_ADMINISTRATION = 'project_administration',
  FUNDING_ACQUISITION = 'funding_acquisition'
}

export enum VenueType {
  JOURNAL = 'journal',
  CONFERENCE = 'conference',
  WORKSHOP = 'workshop',
  SYMPOSIUM = 'symposium',
  BOOK_PUBLISHER = 'book_publisher',
  PREPRINT_SERVER = 'preprint_server',
  REPOSITORY = 'repository'
}

export enum ReviewRecommendation {
  ACCEPT = 'accept',
  MINOR_REVISION = 'minor_revision',
  MAJOR_REVISION = 'major_revision',
  REJECT_RESUBMIT = 'reject_resubmit',
  REJECT = 'reject'
}

export enum CollaborationType {
  RESEARCH_PROJECT = 'research_project',
  MULTI_INSTITUTIONAL = 'multi_institutional',
  INTERNATIONAL = 'international',
  INDUSTRY_ACADEMIA = 'industry_academia',
  INTERDISCIPLINARY = 'interdisciplinary',
  LONGITUDINAL_STUDY = 'longitudinal_study',
  META_ANALYSIS = 'meta_analysis',
  REPLICATION_STUDY = 'replication_study'
}

export enum CollaborationStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXTENDED = 'extended'
}

// =====================================================
// REQUEST/RESPONSE INTERFACES
// =====================================================

export interface CreateResearchPaperRequest {
  title: string;
  abstract: string;
  keywords: string[];
  authors: Omit<Author, 'id' | 'created_at' | 'updated_at'>[];
  publication_type: PublicationType;
  research_category: ResearchCategory;
  methodology: ResearchMethodology;
  data_sources: Omit<DataSource, 'id'>[];
  ethical_considerations: string[];
  funding_sources: FundingSource[];
}

export interface SubmitForReviewRequest {
  paper_id: string;
  target_venue_id: string;
  cover_letter: string;
  suggested_reviewers: SuggestedReviewer[];
  competing_interests: string[];
  author_contributions: AuthorContribution[];
}

export interface PeerReviewRequest {
  paper_id: string;
  reviewer_id: string;
  due_date: Date;
  review_guidelines: string;
  conflict_check_required: boolean;
  anonymized: boolean;
}

export interface CollaborationInviteRequest {
  collaboration_id: string;
  invitee_email: string;
  proposed_role: CollaborationRole;
  invitation_message: string;
  responsibilities: string[];
  time_commitment_percentage: number;
}

export interface ResearchPaperResponse {
  paper: ResearchPaper;
  authors: Author[];
  venue?: PublicationVenue;
  reviews?: PeerReview[];
  editorial_decisions?: EditorialDecision[];
  collaboration?: ResearchCollaboration;
  impact_metrics: AcademicImpact;
  download_url?: string;
  citation_formats: CitationFormat[];
}

export interface PublicationAnalyticsResponse {
  total_publications: number;
  publications_by_type: Record<PublicationType, number>;
  publications_by_category: Record<ResearchCategory, number>;
  citation_metrics: CitationMetrics;
  h_index: number;
  impact_trends: ImpactTrend[];
  collaboration_network: CollaborationNetwork;
  top_venues: PublicationVenue[];
  recent_publications: ResearchPaper[];
  upcoming_deadlines: SubmissionDeadline[];
}

export interface ResearchCollaborationResponse {
  collaboration: ResearchCollaboration;
  participants: CollaborationParticipant[];
  publications: ResearchPaper[];
  milestones: CollaborationMilestone[];
  communication_history: CommunicationHistory[];
  resource_utilization: ResourceUtilization;
  success_metrics: SuccessMetric[];
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface FundingSource {
  id: string;
  funder_name: string;
  grant_number?: string;
  amount?: number;
  currency?: string;
  funding_type: FundingType;
  acknowledgment_text: string;
}

export interface FileAttachment {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  file_path: string;
  description?: string;
  version: string;
  uploaded_at: Date;
}

export interface CitationMetrics {
  total_citations: number;
  h_index: number;
  i10_index: number;
  citations_per_year: Record<number, number>;
  self_citations: number;
  co_author_citations: number;
  independent_citations: number;
  average_citations_per_paper: number;
  median_citations_per_paper: number;
  most_cited_paper: string;
  recent_citation_trend: number;
}

export interface QualityMetrics {
  methodology_score: number;
  reproducibility_score: number;
  novelty_score: number;
  significance_score: number;
  clarity_score: number;
  ethical_compliance_score: number;
  data_quality_score: number;
  statistical_rigor_score: number;
  overall_quality_score: number;
  peer_review_score?: number;
  editor_assessment_score?: number;
}

export type FundingType = 'government' | 'private' | 'foundation' | 'industry' | 'internal' | 'crowdfunding';
export type LicenseType = 'cc_by' | 'cc_by_sa' | 'cc_by_nc' | 'cc_by_nc_sa' | 'cc_by_nd' | 'cc_by_nc_nd' | 'mit' | 'apache' | 'gpl' | 'proprietary';
export type InstitutionType = 'university' | 'research_institute' | 'government_agency' | 'private_company' | 'non_profit' | 'hospital' | 'think_tank';
export type DataSourceType = 'primary' | 'secondary' | 'administrative' | 'survey' | 'experimental' | 'observational' | 'simulation' | 'meta_analysis';
export type StudyDesign = 'experimental' | 'quasi_experimental' | 'observational' | 'cross_sectional' | 'longitudinal' | 'case_study' | 'survey' | 'meta_analysis' | 'systematic_review';
export type FindingType = 'primary' | 'secondary' | 'exploratory' | 'confirmatory' | 'null' | 'unexpected' | 'replication';
export type ReviewType = 'single_blind' | 'double_blind' | 'open' | 'post_publication' | 'collaborative';
export type CollaborationRole = 'principal_investigator' | 'co_investigator' | 'research_associate' | 'graduate_student' | 'postdoc' | 'consultant' | 'industry_partner' | 'data_provider';
