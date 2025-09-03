/**
 * Goal Setting and Milestone Tracking Types
 * Comprehensive type definitions for goal management and progress tracking
 */

// =====================================================
// CORE GOAL TYPES
// =====================================================

export interface Goal {
  id: string;
  user_id: string;
  startup_id?: string;
  title: string;
  description: string;
  goal_type: GoalType;
  goal_category: GoalCategory;
  priority: GoalPriority;
  status: GoalStatus;
  progress_percentage: number;
  target_value?: number;
  current_value?: number;
  unit_of_measurement?: string;
  start_date: Date;
  target_date: Date;
  completion_date?: Date;
  extended_date?: Date;
  parent_goal_id?: string; // For hierarchical goals
  dependencies: GoalDependency[];
  success_criteria: SuccessCriteria[];
  key_results: KeyResult[];
  milestones: Milestone[];
  action_items: ActionItem[];
  resources_required: Resource[];
  stakeholders: Stakeholder[];
  risks: Risk[];
  metrics: GoalMetric[];
  tags: string[];
  visibility: GoalVisibility;
  collaboration_settings: CollaborationSettings;
  reminder_settings: ReminderSettings;
  automation_rules: AutomationRule[];
  progress_tracking: ProgressTracking;
  performance_indicators: PerformanceIndicator[];
  impact_assessment: ImpactAssessment;
  lessons_learned: string[];
  next_steps: string[];
  created_at: Date;
  updated_at: Date;
  archived_at?: Date;
  metadata: Record<string, any>;
}

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  description: string;
  milestone_type: MilestoneType;
  sequence_order: number;
  status: MilestoneStatus;
  progress_percentage: number;
  target_date: Date;
  completion_date?: Date;
  estimated_effort_hours: number;
  actual_effort_hours?: number;
  dependencies: MilestoneDependency[];
  deliverables: Deliverable[];
  acceptance_criteria: AcceptanceCriteria[];
  assigned_to: string[];
  reviewers: string[];
  approval_required: boolean;
  approved_by?: string;
  approved_at?: Date;
  blockers: Blocker[];
  resources_allocated: ResourceAllocation[];
  budget_allocated?: number;
  budget_spent?: number;
  quality_metrics: QualityMetric[];
  risk_assessment: RiskAssessment;
  impact_on_goal: ImpactLevel;
  celebration_plan?: CelebrationPlan;
  retrospective_notes?: string;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface KeyResult {
  id: string;
  goal_id: string;
  title: string;
  description: string;
  metric_type: MetricType;
  target_value: number;
  current_value: number;
  unit: string;
  measurement_frequency: MeasurementFrequency;
  data_source: DataSource;
  calculation_method: string;
  baseline_value?: number;
  threshold_values: ThresholdValues;
  progress_percentage: number;
  status: KeyResultStatus;
  confidence_level: ConfidenceLevel;
  last_updated: Date;
  update_history: ValueUpdate[];
  trend_analysis: TrendAnalysis;
  forecasting: Forecasting;
  benchmarks: Benchmark[];
  owner: string;
  contributors: string[];
  automated_tracking: boolean;
  manual_updates_allowed: boolean;
  validation_rules: ValidationRule[];
  alert_settings: AlertSettings;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface ActionItem {
  id: string;
  goal_id?: string;
  milestone_id?: string;
  title: string;
  description: string;
  action_type: ActionType;
  priority: ActionPriority;
  status: ActionStatus;
  assigned_to: string;
  created_by: string;
  due_date: Date;
  estimated_duration_hours: number;
  actual_duration_hours?: number;
  completion_date?: Date;
  dependencies: ActionDependency[];
  prerequisites: string[];
  deliverables: string[];
  resources_needed: string[];
  skills_required: string[];
  effort_level: EffortLevel;
  complexity_level: ComplexityLevel;
  impact_level: ImpactLevel;
  urgency_level: UrgencyLevel;
  progress_notes: ProgressNote[];
  blockers: Blocker[];
  sub_tasks: SubTask[];
  time_tracking: TimeTracking[];
  quality_checklist: QualityCheckItem[];
  approval_workflow: ApprovalWorkflow;
  collaboration_notes: CollaborationNote[];
  attachments: Attachment[];
  tags: string[];
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

// =====================================================
// PROGRESS TRACKING TYPES
// =====================================================

export interface ProgressUpdate {
  id: string;
  goal_id?: string;
  milestone_id?: string;
  action_item_id?: string;
  update_type: UpdateType;
  progress_percentage: number;
  previous_percentage: number;
  progress_delta: number;
  value_update?: ValueUpdate;
  status_change?: StatusChange;
  description: string;
  achievements: string[];
  challenges: string[];
  next_steps: string[];
  resource_utilization: ResourceUtilization;
  time_spent_hours: number;
  quality_assessment: QualityAssessment;
  risk_updates: RiskUpdate[];
  stakeholder_feedback: StakeholderFeedback[];
  evidence: Evidence[];
  photos: string[];
  documents: string[];
  metrics_snapshot: MetricsSnapshot;
  confidence_level: ConfidenceLevel;
  updated_by: string;
  update_source: UpdateSource;
  automated: boolean;
  verified: boolean;
  verified_by?: string;
  verified_at?: Date;
  created_at: Date;
  metadata: Record<string, any>;
}

export interface ProgressTracking {
  tracking_method: TrackingMethod;
  update_frequency: UpdateFrequency;
  automated_sources: AutomatedSource[];
  manual_checkpoints: ManualCheckpoint[];
  progress_indicators: ProgressIndicator[];
  measurement_criteria: MeasurementCriteria[];
  data_collection_methods: DataCollectionMethod[];
  validation_process: ValidationProcess;
  reporting_schedule: ReportingSchedule;
  dashboard_configuration: DashboardConfiguration;
  notification_settings: NotificationSettings;
  escalation_rules: EscalationRule[];
  performance_thresholds: PerformanceThreshold[];
  trend_analysis_settings: TrendAnalysisSettings;
  forecasting_models: ForecastingModel[];
  benchmark_comparisons: BenchmarkComparison[];
}

export interface PerformanceIndicator {
  id: string;
  name: string;
  indicator_type: IndicatorType;
  calculation_formula: string;
  target_value: number;
  current_value: number;
  threshold_green: number;
  threshold_yellow: number;
  threshold_red: number;
  unit: string;
  frequency: MeasurementFrequency;
  data_sources: string[];
  historical_data: HistoricalDataPoint[];
  trend: TrendDirection;
  variance: number;
  confidence_interval: ConfidenceInterval;
  benchmark_value?: number;
  industry_average?: number;
  best_practice_value?: number;
  improvement_potential: number;
  action_triggers: ActionTrigger[];
  alert_conditions: AlertCondition[];
  visualization_type: VisualizationType;
  dashboard_position: DashboardPosition;
  access_permissions: AccessPermission[];
  last_calculated: Date;
  next_calculation: Date;
  calculation_status: CalculationStatus;
  data_quality_score: number;
  reliability_score: number;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

// =====================================================
// COLLABORATION TYPES
// =====================================================

export interface TeamGoal {
  id: string;
  team_id: string;
  goal: Goal;
  team_members: TeamMember[];
  role_assignments: RoleAssignment[];
  collaboration_model: CollaborationModel;
  decision_making_process: DecisionMakingProcess;
  communication_plan: CommunicationPlan;
  meeting_schedule: MeetingSchedule;
  shared_resources: SharedResource[];
  collective_metrics: CollectiveMetric[];
  team_dynamics: TeamDynamics;
  conflict_resolution: ConflictResolution;
  knowledge_sharing: KnowledgeSharing;
  peer_feedback: PeerFeedback[];
  team_retrospectives: TeamRetrospective[];
  success_celebrations: SuccessCelebration[];
  learning_outcomes: LearningOutcome[];
  team_performance: TeamPerformance;
  synergy_metrics: SynergyMetric[];
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface TeamMember {
  user_id: string;
  role: TeamRole;
  responsibilities: string[];
  time_commitment_percentage: number;
  expertise_areas: string[];
  contribution_type: ContributionType[];
  performance_metrics: MemberPerformanceMetric[];
  availability_schedule: AvailabilitySchedule;
  communication_preferences: CommunicationPreference[];
  motivation_factors: MotivationFactor[];
  skill_development_goals: SkillDevelopmentGoal[];
  feedback_received: FeedbackReceived[];
  feedback_given: FeedbackGiven[];
  recognition_received: Recognition[];
  challenges_faced: Challenge[];
  support_needed: SupportNeeded[];
  joined_date: Date;
  active: boolean;
  performance_rating: number;
  satisfaction_score: number;
  engagement_level: EngagementLevel;
  created_at: Date;
  updated_at: Date;
}

// =====================================================
// ANALYTICS TYPES
// =====================================================

export interface GoalAnalytics {
  goal_id: string;
  performance_summary: PerformanceSummary;
  progress_trends: ProgressTrend[];
  velocity_metrics: VelocityMetric[];
  predictive_analytics: PredictiveAnalytics;
  comparative_analysis: ComparativeAnalysis;
  risk_analysis: RiskAnalysis;
  resource_efficiency: ResourceEfficiency;
  stakeholder_satisfaction: StakeholderSatisfaction;
  impact_measurement: ImpactMeasurement;
  success_factors: SuccessFactor[];
  failure_factors: FailureFactor[];
  lessons_learned_analysis: LessonsLearnedAnalysis;
  recommendation_engine: RecommendationEngine;
  optimization_opportunities: OptimizationOpportunity[];
  benchmark_analysis: BenchmarkAnalysis;
  roi_analysis: ROIAnalysis;
  time_analysis: TimeAnalysis;
  quality_analysis: QualityAnalysis;
  collaboration_effectiveness: CollaborationEffectiveness;
  generated_at: Date;
  analysis_confidence: number;
  data_completeness: number;
  methodology: AnalysisMethodology;
  limitations: string[];
  recommendations: Recommendation[];
  next_analysis_date: Date;
  metadata: Record<string, any>;
}

export interface GoalRecommendation {
  id: string;
  goal_id: string;
  recommendation_type: RecommendationType;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string;
  expected_impact: ExpectedImpact;
  implementation_effort: ImplementationEffort;
  implementation_timeline: ImplementationTimeline;
  required_resources: RequiredResource[];
  success_probability: number;
  risk_level: RiskLevel;
  dependencies: RecommendationDependency[];
  alternatives: Alternative[];
  evidence: RecommendationEvidence[];
  similar_cases: SimilarCase[];
  expert_opinions: ExpertOpinion[];
  data_sources: RecommendationDataSource[];
  confidence_score: number;
  relevance_score: number;
  urgency_score: number;
  feasibility_score: number;
  impact_score: number;
  overall_score: number;
  status: RecommendationStatus;
  feedback: RecommendationFeedback[];
  implementation_progress: ImplementationProgress;
  results_tracking: ResultsTracking;
  generated_by: string;
  generated_at: Date;
  expires_at?: Date;
  accepted: boolean;
  accepted_by?: string;
  accepted_at?: Date;
  implemented: boolean;
  implementation_notes?: string;
  results_achieved?: ResultsAchieved;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

// =====================================================
// ENUMS
// =====================================================

export enum GoalType {
  OBJECTIVE = 'objective',
  KEY_RESULT = 'key_result',
  MILESTONE = 'milestone',
  TASK = 'task',
  HABIT = 'habit',
  PROJECT = 'project',
  INITIATIVE = 'initiative',
  OUTCOME = 'outcome',
  OUTPUT = 'output',
  IMPACT = 'impact'
}

export enum GoalCategory {
  BUSINESS_GROWTH = 'business_growth',
  REVENUE = 'revenue',
  CUSTOMER_ACQUISITION = 'customer_acquisition',
  PRODUCT_DEVELOPMENT = 'product_development',
  TEAM_BUILDING = 'team_building',
  FUNDING = 'funding',
  MARKET_EXPANSION = 'market_expansion',
  OPERATIONAL_EFFICIENCY = 'operational_efficiency',
  TECHNOLOGY = 'technology',
  COMPLIANCE = 'compliance',
  SUSTAINABILITY = 'sustainability',
  INNOVATION = 'innovation',
  PARTNERSHIPS = 'partnerships',
  BRAND_BUILDING = 'brand_building',
  PERSONAL_DEVELOPMENT = 'personal_development'
}

export enum GoalPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NICE_TO_HAVE = 'nice_to_have'
}

export enum GoalStatus {
  DRAFT = 'draft',
  PLANNED = 'planned',
  ACTIVE = 'active',
  ON_TRACK = 'on_track',
  AT_RISK = 'at_risk',
  BEHIND = 'behind',
  BLOCKED = 'blocked',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived'
}

export enum MilestoneType {
  CHECKPOINT = 'checkpoint',
  DELIVERABLE = 'deliverable',
  DECISION_POINT = 'decision_point',
  REVIEW = 'review',
  APPROVAL = 'approval',
  LAUNCH = 'launch',
  COMPLETION = 'completion',
  VALIDATION = 'validation',
  INTEGRATION = 'integration',
  TESTING = 'testing'
}

export enum MilestoneStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  UNDER_REVIEW = 'under_review',
  PENDING_APPROVAL = 'pending_approval',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DEFERRED = 'deferred'
}

export enum ActionType {
  RESEARCH = 'research',
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  COMMUNICATION = 'communication',
  MEETING = 'meeting',
  DOCUMENTATION = 'documentation',
  ANALYSIS = 'analysis',
  IMPLEMENTATION = 'implementation',
  REVIEW = 'review',
  APPROVAL = 'approval',
  TRAINING = 'training',
  COORDINATION = 'coordination'
}

export enum ActionStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  UNDER_REVIEW = 'under_review',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DEFERRED = 'deferred'
}

export enum ActionPriority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum UpdateType {
  PROGRESS = 'progress',
  STATUS_CHANGE = 'status_change',
  VALUE_UPDATE = 'value_update',
  MILESTONE_COMPLETION = 'milestone_completion',
  BLOCKER_IDENTIFIED = 'blocker_identified',
  BLOCKER_RESOLVED = 'blocker_resolved',
  RESOURCE_ALLOCATION = 'resource_allocation',
  TIMELINE_ADJUSTMENT = 'timeline_adjustment',
  SCOPE_CHANGE = 'scope_change',
  RISK_UPDATE = 'risk_update'
}

export enum TrackingMethod {
  MANUAL = 'manual',
  AUTOMATED = 'automated',
  HYBRID = 'hybrid',
  CONTINUOUS = 'continuous',
  PERIODIC = 'periodic',
  EVENT_DRIVEN = 'event_driven'
}

export enum UpdateFrequency {
  REAL_TIME = 'real_time',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ON_DEMAND = 'on_demand'
}

export enum MetricType {
  COUNT = 'count',
  PERCENTAGE = 'percentage',
  RATIO = 'ratio',
  CURRENCY = 'currency',
  DURATION = 'duration',
  SCORE = 'score',
  BINARY = 'binary',
  CATEGORICAL = 'categorical'
}

export enum IndicatorType {
  LEADING = 'leading',
  LAGGING = 'lagging',
  CONCURRENT = 'concurrent',
  PREDICTIVE = 'predictive',
  DIAGNOSTIC = 'diagnostic'
}

export enum TrendDirection {
  IMPROVING = 'improving',
  DECLINING = 'declining',
  STABLE = 'stable',
  VOLATILE = 'volatile',
  UNKNOWN = 'unknown'
}

export enum RecommendationType {
  PROCESS_IMPROVEMENT = 'process_improvement',
  RESOURCE_OPTIMIZATION = 'resource_optimization',
  TIMELINE_ADJUSTMENT = 'timeline_adjustment',
  SCOPE_MODIFICATION = 'scope_modification',
  RISK_MITIGATION = 'risk_mitigation',
  COLLABORATION_ENHANCEMENT = 'collaboration_enhancement',
  SKILL_DEVELOPMENT = 'skill_development',
  TOOL_ADOPTION = 'tool_adoption',
  METHODOLOGY_CHANGE = 'methodology_change',
  STAKEHOLDER_ENGAGEMENT = 'stakeholder_engagement'
}

export enum GoalVisibility {
  PRIVATE = 'private',
  TEAM = 'team',
  ORGANIZATION = 'organization',
  PUBLIC = 'public'
}

export enum ConfidenceLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export enum ImpactLevel {
  MINIMAL = 'minimal',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum EffortLevel {
  MINIMAL = 'minimal',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EXTENSIVE = 'extensive'
}

export enum ComplexityLevel {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  VERY_COMPLEX = 'very_complex'
}

export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// =====================================================
// REQUEST/RESPONSE INTERFACES
// =====================================================

export interface CreateGoalRequest {
  title: string;
  description: string;
  goal_type: GoalType;
  goal_category: GoalCategory;
  priority: GoalPriority;
  target_date: Date;
  target_value?: number;
  unit_of_measurement?: string;
  success_criteria: SuccessCriteria[];
  key_results?: Omit<KeyResult, 'id' | 'goal_id' | 'created_at' | 'updated_at'>[];
  milestones?: Omit<Milestone, 'id' | 'goal_id' | 'created_at' | 'updated_at'>[];
  stakeholders?: Stakeholder[];
  resources_required?: Resource[];
  tags?: string[];
  visibility: GoalVisibility;
  parent_goal_id?: string;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  priority?: GoalPriority;
  status?: GoalStatus;
  target_date?: Date;
  target_value?: number;
  progress_percentage?: number;
  current_value?: number;
  tags?: string[];
}

export interface CreateMilestoneRequest {
  goal_id: string;
  title: string;
  description: string;
  milestone_type: MilestoneType;
  target_date: Date;
  estimated_effort_hours: number;
  assigned_to: string[];
  deliverables: Deliverable[];
  acceptance_criteria: AcceptanceCriteria[];
  dependencies?: MilestoneDependency[];
}

export interface CreateActionItemRequest {
  goal_id?: string;
  milestone_id?: string;
  title: string;
  description: string;
  action_type: ActionType;
  priority: ActionPriority;
  assigned_to: string;
  due_date: Date;
  estimated_duration_hours: number;
  resources_needed?: string[];
  skills_required?: string[];
}

export interface ProgressUpdateRequest {
  goal_id?: string;
  milestone_id?: string;
  action_item_id?: string;
  progress_percentage: number;
  description: string;
  achievements?: string[];
  challenges?: string[];
  next_steps?: string[];
  time_spent_hours?: number;
  evidence?: Evidence[];
}

export interface GoalResponse {
  goal: Goal;
  milestones: Milestone[];
  key_results: KeyResult[];
  action_items: ActionItem[];
  progress_updates: ProgressUpdate[];
  analytics: GoalAnalytics;
  recommendations: GoalRecommendation[];
  team_members?: TeamMember[];
}

export interface GoalDashboardResponse {
  active_goals: Goal[];
  completed_goals_count: number;
  overdue_goals_count: number;
  at_risk_goals_count: number;
  overall_progress: number;
  upcoming_milestones: Milestone[];
  recent_achievements: Achievement[];
  performance_trends: PerformanceTrend[];
  team_performance: TeamPerformance;
  recommendations: GoalRecommendation[];
  insights: Insight[];
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface SuccessCriteria {
  id: string;
  description: string;
  measurement_method: string;
  target_value?: number;
  unit?: string;
  priority: number;
  achieved: boolean;
  achieved_date?: Date;
  evidence?: string[];
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  quantity: number;
  unit: string;
  cost?: number;
  availability: ResourceAvailability;
  allocated: boolean;
  allocation_date?: Date;
  utilization_percentage?: number;
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  influence_level: InfluenceLevel;
  interest_level: InterestLevel;
  communication_frequency: CommunicationFrequency;
  preferred_communication_method: CommunicationMethod;
  expectations: string[];
  concerns: string[];
  support_level: SupportLevel;
}

export interface Risk {
  id: string;
  description: string;
  category: RiskCategory;
  probability: number;
  impact: ImpactLevel;
  risk_score: number;
  mitigation_strategy: string;
  contingency_plan: string;
  owner: string;
  status: RiskStatus;
  identified_date: Date;
  review_date: Date;
}

export interface Blocker {
  id: string;
  title: string;
  description: string;
  blocker_type: BlockerType;
  severity: BlockerSeverity;
  identified_by: string;
  identified_date: Date;
  resolution_strategy: string;
  assigned_to?: string;
  estimated_resolution_date?: Date;
  actual_resolution_date?: Date;
  status: BlockerStatus;
  impact_description: string;
  workaround?: string;
}

export interface Evidence {
  id: string;
  type: EvidenceType;
  title: string;
  description: string;
  file_path?: string;
  url?: string;
  data_points?: DataPoint[];
  verification_status: VerificationStatus;
  verified_by?: string;
  verified_date?: Date;
  credibility_score: number;
}

export type ResourceType = 'human' | 'financial' | 'equipment' | 'software' | 'facility' | 'material' | 'information';
export type ResourceAvailability = 'available' | 'limited' | 'unavailable' | 'pending';
export type InfluenceLevel = 'low' | 'medium' | 'high' | 'very_high';
export type InterestLevel = 'low' | 'medium' | 'high' | 'very_high';
export type SupportLevel = 'opposed' | 'neutral' | 'supportive' | 'champion';
export type CommunicationFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'as_needed';
export type CommunicationMethod = 'email' | 'meeting' | 'chat' | 'phone' | 'dashboard' | 'report';
export type RiskCategory = 'technical' | 'resource' | 'timeline' | 'scope' | 'external' | 'organizational' | 'financial';
export type RiskStatus = 'identified' | 'assessed' | 'mitigated' | 'accepted' | 'transferred' | 'avoided' | 'occurred';
export type BlockerType = 'dependency' | 'resource' | 'approval' | 'technical' | 'external' | 'policy' | 'skill';
export type BlockerSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BlockerStatus = 'open' | 'in_progress' | 'resolved' | 'escalated' | 'accepted';
export type EvidenceType = 'document' | 'screenshot' | 'data' | 'testimony' | 'measurement' | 'observation' | 'artifact';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'disputed' | 'invalid';
