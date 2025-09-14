/**
 * Advanced Statistical Models Type Definitions
 * Comprehensive types for Cox survival analysis, hierarchical models, and predictive analytics
 */

export interface StatisticalModel {
  id: string;
  name: string;
  type: ModelType;
  category: ModelCategory;
  description: string;
  version: string;
  algorithm: string;
  parameters: ModelParameters;
  performance: ModelPerformance;
  trainingData: TrainingDataInfo;
  isActive: boolean;
  isProduction: boolean;
  createdAt: Date;
  updatedAt?: Date;
  lastTrainedAt?: Date;
  nextTrainingAt?: Date;
}

export interface ModelParameters {
  hyperparameters: Record<string, any>;
  features: ModelFeature[];
  targetVariable: string;
  validationSplit: number;
  crossValidationFolds?: number;
  regularization?: RegularizationConfig;
  optimization?: OptimizationConfig;
}

export interface ModelFeature {
  name: string;
  type: FeatureType;
  importance?: number;
  transformation?: string;
  encoding?: string;
  isRequired: boolean;
  description: string;
}

export interface ModelPerformance {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  auc?: number;
  rmse?: number;
  mae?: number;
  r2Score?: number;
  concordanceIndex?: number; // For survival models
  logLikelihood?: number;
  aic?: number; // Akaike Information Criterion
  bic?: number; // Bayesian Information Criterion
  crossValidationScore?: number;
  validationMetrics: Record<string, number>;
  confusionMatrix?: number[][];
  featureImportance?: Record<string, number>;
}

export interface TrainingDataInfo {
  datasetSize: number;
  trainingSize: number;
  validationSize: number;
  testSize: number;
  features: string[];
  dataQuality: DataQualityMetrics;
  lastUpdated: Date;
  dataSource: string;
}

export interface DataQualityMetrics {
  completeness: number; // Percentage of non-null values
  consistency: number; // Data consistency score
  accuracy: number; // Data accuracy score
  outliers: number; // Number of outliers detected
  duplicates: number; // Number of duplicate records
  missingValues: Record<string, number>;
}

export interface CoxSurvivalModel {
  modelId: string;
  hazardRatio: Record<string, number>;
  confidenceIntervals: Record<string, [number, number]>;
  pValues: Record<string, number>;
  concordanceIndex: number;
  logLikelihood: number;
  survivalFunction: SurvivalFunction;
  riskGroups: RiskGroup[];
  timeToEvent: string; // Target variable name
  eventIndicator: string; // Censoring indicator
}

export interface SurvivalFunction {
  timePoints: number[];
  survivalProbabilities: number[];
  confidenceLower: number[];
  confidenceUpper: number[];
  riskTable: RiskTableEntry[];
}

export interface RiskTableEntry {
  time: number;
  atRisk: number;
  events: number;
  censored: number;
}

export interface RiskGroup {
  name: string;
  criteria: Record<string, any>;
  medianSurvivalTime?: number;
  hazardRatio: number;
  riskScore: number;
  description: string;
}

export interface HierarchicalModel {
  modelId: string;
  levels: HierarchicalLevel[];
  randomEffects: RandomEffect[];
  fixedEffects: FixedEffect[];
  varianceComponents: VarianceComponent[];
  iccValues: Record<string, number>; // Intraclass correlation coefficients
  modelFit: HierarchicalModelFit;
}

export interface HierarchicalLevel {
  level: number;
  name: string;
  groupingVariable: string;
  numberOfGroups: number;
  averageGroupSize: number;
  variance: number;
}

export interface RandomEffect {
  variable: string;
  level: number;
  variance: number;
  standardDeviation: number;
  correlation?: Record<string, number>;
}

export interface FixedEffect {
  variable: string;
  coefficient: number;
  standardError: number;
  tValue: number;
  pValue: number;
  confidenceInterval: [number, number];
}

export interface VarianceComponent {
  component: string;
  variance: number;
  proportion: number;
  description: string;
}

export interface HierarchicalModelFit {
  logLikelihood: number;
  aic: number;
  bic: number;
  deviance: number;
  marginalR2: number;
  conditionalR2: number;
}

export interface PredictiveModel {
  modelId: string;
  predictionType: PredictionType;
  timeHorizon: number; // in days
  features: PredictiveFeature[];
  predictions: ModelPrediction[];
  calibration: CalibrationMetrics;
  uncertainty: UncertaintyMetrics;
}

export interface PredictiveFeature {
  name: string;
  coefficient: number;
  importance: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality?: SeasonalityPattern;
}

export interface ModelPrediction {
  entityId: string;
  entityType: string;
  predictedValue: number;
  confidence: number;
  predictionInterval: [number, number];
  riskFactors: string[];
  contributingFactors: Record<string, number>;
  predictionDate: Date;
  targetDate: Date;
}

export interface CalibrationMetrics {
  calibrationSlope: number;
  calibrationIntercept: number;
  hosmerLemeshowTest: {
    statistic: number;
    pValue: number;
    degreesOfFreedom: number;
  };
  calibrationPlot: {
    predicted: number[];
    observed: number[];
  };
}

export interface UncertaintyMetrics {
  epistemic: number; // Model uncertainty
  aleatoric: number; // Data uncertainty
  total: number;
  confidenceLevel: number;
  predictionIntervals: {
    level: number;
    lower: number;
    upper: number;
  }[];
}

export interface SeasonalityPattern {
  period: number; // in days
  amplitude: number;
  phase: number;
  trend: number;
  significance: number;
}

export interface ModelEvaluation {
  modelId: string;
  evaluationType: EvaluationType;
  testDataset: string;
  metrics: ModelPerformance;
  residualAnalysis: ResidualAnalysis;
  crossValidation: CrossValidationResults;
  robustnessTests: RobustnessTest[];
  evaluatedAt: Date;
  evaluatedBy: string;
}

export interface ResidualAnalysis {
  residuals: number[];
  standardizedResiduals: number[];
  normalityTest: {
    statistic: number;
    pValue: number;
    isNormal: boolean;
  };
  homoscedasticityTest: {
    statistic: number;
    pValue: number;
    isHomoscedastic: boolean;
  };
  autocorrelationTest?: {
    statistic: number;
    pValue: number;
    hasAutocorrelation: boolean;
  };
}

export interface CrossValidationResults {
  folds: number;
  scores: number[];
  meanScore: number;
  standardDeviation: number;
  confidenceInterval: [number, number];
  stratified: boolean;
}

export interface RobustnessTest {
  testName: string;
  description: string;
  passed: boolean;
  score: number;
  threshold: number;
  details: Record<string, any>;
}

export interface ModelTrainingJob {
  id: string;
  modelId: string;
  status: TrainingStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // in seconds
  datasetVersion: string;
  hyperparameters: Record<string, any>;
  metrics: ModelPerformance;
  logs: TrainingLog[];
  errorMessage?: string;
  resourceUsage: ResourceUsage;
}

export interface TrainingLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  epoch?: number;
  metrics?: Record<string, number>;
}

export interface ResourceUsage {
  cpuTime: number; // in seconds
  memoryPeak: number; // in MB
  gpuTime?: number; // in seconds
  diskIO: number; // in MB
}

export interface FeatureEngineering {
  id: string;
  name: string;
  description: string;
  inputFeatures: string[];
  outputFeatures: string[];
  transformation: FeatureTransformation;
  validation: FeatureValidation;
  isActive: boolean;
  createdAt: Date;
}

export interface FeatureTransformation {
  type: TransformationType;
  parameters: Record<string, any>;
  code?: string; // For custom transformations
  dependencies?: string[];
}

export interface FeatureValidation {
  dataType: string;
  constraints: FeatureConstraint[];
  qualityChecks: QualityCheck[];
  distributionTests: DistributionTest[];
}

export interface FeatureConstraint {
  type: 'range' | 'enum' | 'pattern' | 'custom';
  value: any;
  description: string;
}

export interface QualityCheck {
  name: string;
  passed: boolean;
  score: number;
  threshold: number;
  message: string;
}

export interface DistributionTest {
  testName: string;
  statistic: number;
  pValue: number;
  distribution: string;
  parameters: Record<string, number>;
}

export interface ModelPipeline {
  id: string;
  name: string;
  description: string;
  stages: PipelineStage[];
  schedule: PipelineSchedule;
  status: PipelineStatus;
  lastRun: PipelineRun;
  configuration: PipelineConfiguration;
  isActive: boolean;
  createdAt: Date;
}

export interface PipelineStage {
  id: string;
  name: string;
  type: StageType;
  dependencies: string[];
  configuration: Record<string, any>;
  timeout: number; // in minutes
  retryPolicy: RetryPolicy;
}

export interface PipelineSchedule {
  type: 'cron' | 'interval' | 'trigger';
  expression?: string; // Cron expression
  interval?: number; // in minutes
  triggers?: string[]; // Event triggers
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  status: RunStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  stageResults: StageResult[];
  errorMessage?: string;
  triggeredBy: string;
}

export interface StageResult {
  stageId: string;
  status: RunStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  output?: Record<string, any>;
  errorMessage?: string;
  metrics?: Record<string, number>;
}

export interface PipelineConfiguration {
  dataSource: DataSourceConfig;
  preprocessing: PreprocessingConfig;
  modeling: ModelingConfig;
  evaluation: EvaluationConfig;
  deployment: DeploymentConfig;
}

export interface DataSourceConfig {
  type: 'database' | 'api' | 'file' | 'stream';
  connection: Record<string, any>;
  query?: string;
  refreshInterval?: number;
  validation: DataValidationConfig;
}

export interface DataValidationConfig {
  schema: Record<string, any>;
  qualityThresholds: Record<string, number>;
  anomalyDetection: boolean;
  alertOnFailure: boolean;
}

export interface PreprocessingConfig {
  steps: PreprocessingStep[];
  outputFormat: string;
  caching: boolean;
}

export interface PreprocessingStep {
  name: string;
  type: string;
  parameters: Record<string, any>;
  order: number;
}

export interface ModelingConfig {
  algorithm: string;
  hyperparameters: Record<string, any>;
  ensembleMethods?: string[];
  featureSelection: boolean;
  autoML: boolean;
}

export interface EvaluationConfig {
  metrics: string[];
  validationStrategy: string;
  testSize: number;
  crossValidation: boolean;
  benchmarkModels?: string[];
}

export interface DeploymentConfig {
  environment: 'staging' | 'production';
  scalingPolicy: ScalingPolicy;
  monitoring: MonitoringConfig;
  rollbackPolicy: RollbackPolicy;
}

export interface ScalingPolicy {
  minInstances: number;
  maxInstances: number;
  targetCPU: number;
  targetMemory: number;
}

export interface MonitoringConfig {
  metrics: string[];
  alertThresholds: Record<string, number>;
  dashboardUrl?: string;
  logLevel: string;
}

export interface RollbackPolicy {
  enabled: boolean;
  conditions: RollbackCondition[];
  automaticRollback: boolean;
}

export interface RollbackCondition {
  metric: string;
  threshold: number;
  duration: number; // in minutes
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential';
  baseDelay: number; // in seconds
  maxDelay: number; // in seconds
}

// Enums and Union Types
export type ModelType =
  | 'cox_survival'
  | 'hierarchical_linear'
  | 'hierarchical_logistic'
  | 'time_series'
  | 'classification'
  | 'regression'
  | 'clustering'
  | 'anomaly_detection'
  | 'ensemble';

export type ModelCategory =
  | 'sse_prediction'
  | 'churn_prediction'
  | 'growth_forecasting'
  | 'risk_assessment'
  | 'performance_optimization'
  | 'market_analysis'
  | 'user_behavior'
  | 'financial_modeling';

export type FeatureType =
  | 'numerical'
  | 'categorical'
  | 'ordinal'
  | 'binary'
  | 'text'
  | 'datetime'
  | 'geospatial';

export type TransformationType =
  | 'standardization'
  | 'normalization'
  | 'log_transform'
  | 'box_cox'
  | 'polynomial'
  | 'interaction'
  | 'binning'
  | 'encoding'
  | 'imputation'
  | 'outlier_removal';

export type TrainingStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

export type PipelineStatus =
  | 'active'
  | 'inactive'
  | 'running'
  | 'failed'
  | 'maintenance';

export type RunStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'skipped';

export type StageType =
  | 'data_extraction'
  | 'data_validation'
  | 'preprocessing'
  | 'feature_engineering'
  | 'model_training'
  | 'model_evaluation'
  | 'model_deployment'
  | 'monitoring';

export type PredictionType =
  | 'point_estimate'
  | 'interval_estimate'
  | 'probability_distribution'
  | 'survival_curve'
  | 'hazard_function';

export type EvaluationType =
  | 'holdout'
  | 'cross_validation'
  | 'time_series_split'
  | 'bootstrap'
  | 'monte_carlo';

// Request/Response Interfaces
export interface TrainModelRequest {
  modelType: ModelType;
  category: ModelCategory;
  name: string;
  description: string;
  parameters: ModelParameters;
  datasetId: string;
  evaluationConfig: EvaluationConfig;
}

export interface PredictRequest {
  modelId: string;
  inputData: Record<string, any>[];
  predictionType?: PredictionType;
  confidenceLevel?: number;
  includeUncertainty?: boolean;
}

export interface ModelComparisonRequest {
  modelIds: string[];
  metric: string;
  testDatasetId?: string;
}

export interface FeatureImportanceRequest {
  modelId: string;
  method?: 'permutation' | 'shap' | 'lime' | 'built_in';
  topN?: number;
}

export interface SurvivalAnalysisRequest {
  datasetId: string;
  timeVariable: string;
  eventVariable: string;
  covariates: string[];
  stratificationVariable?: string;
  confidenceLevel?: number;
}

export interface HierarchicalModelRequest {
  datasetId: string;
  dependentVariable: string;
  fixedEffects: string[];
  randomEffects: HierarchicalRandomEffect[];
  groupingVariables: string[];
  method?: 'ml' | 'reml';
}

export interface HierarchicalRandomEffect {
  variable: string;
  groupingVariable: string;
  type: 'intercept' | 'slope' | 'both';
}

export interface ModelValidationRequest {
  modelId: string;
  validationDatasetId: string;
  validationType: EvaluationType;
  metrics: string[];
}

export interface PredictionResponse {
  modelId: string;
  predictions: ModelPrediction[];
  metadata: {
    modelVersion: string;
    predictionDate: Date;
    confidence: number;
    uncertainty?: UncertaintyMetrics;
  };
}

export interface ModelComparisonResponse {
  models: {
    modelId: string;
    name: string;
    performance: Record<string, number>;
    rank: number;
  }[];
  bestModel: string;
  comparisonMetric: string;
  statisticalSignificance?: {
    test: string;
    pValue: number;
    significant: boolean;
  };
}

export interface FeatureImportanceResponse {
  modelId: string;
  method: string;
  features: {
    name: string;
    importance: number;
    rank: number;
    description?: string;
  }[];
  totalImportance: number;
  generatedAt: Date;
}

export interface SurvivalAnalysisResponse {
  modelId: string;
  survivalModel: CoxSurvivalModel;
  kaplanMeierCurves: {
    group?: string;
    survivalFunction: SurvivalFunction;
  }[];
  logRankTest?: {
    statistic: number;
    pValue: number;
    degreesOfFreedom: number;
  };
  medianSurvivalTimes: Record<string, number>;
}

export interface HierarchicalModelResponse {
  modelId: string;
  hierarchicalModel: HierarchicalModel;
  convergence: {
    converged: boolean;
    iterations: number;
    tolerance: number;
  };
  diagnostics: {
    residualPlots: string[];
    qqPlots: string[];
    leveragePlots: string[];
  };
}

// Database Schema Interfaces
export interface StatisticalModelDB {
  id: string;
  name: string;
  type: ModelType;
  category: ModelCategory;
  description: string;
  version: string;
  algorithm: string;
  parameters: string; // JSON string
  performance: string; // JSON string
  training_data: string; // JSON string
  is_active: boolean;
  is_production: boolean;
  created_at: Date;
  updated_at?: Date;
  last_trained_at?: Date;
  next_training_at?: Date;
}

export interface ModelTrainingJobDB {
  id: string;
  model_id: string;
  status: TrainingStatus;
  started_at: Date;
  completed_at?: Date;
  duration?: number;
  dataset_version: string;
  hyperparameters: string; // JSON string
  metrics: string; // JSON string
  logs: string; // JSON string
  error_message?: string;
  resource_usage: string; // JSON string
}

export interface ModelPredictionDB {
  id: string;
  model_id: string;
  entity_id: string;
  entity_type: string;
  predicted_value: number;
  confidence: number;
  prediction_interval: string; // JSON string
  risk_factors: string; // JSON string
  contributing_factors: string; // JSON string
  prediction_date: Date;
  target_date: Date;
  created_at: Date;
}

export interface FeatureEngineeringDB {
  id: string;
  name: string;
  description: string;
  input_features: string; // JSON string
  output_features: string; // JSON string
  transformation: string; // JSON string
  validation: string; // JSON string
  is_active: boolean;
  created_at: Date;
}

export interface ModelPipelineDB {
  id: string;
  name: string;
  description: string;
  stages: string; // JSON string
  schedule: string; // JSON string
  status: PipelineStatus;
  configuration: string; // JSON string
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
}

// Configuration Interfaces
export interface RegularizationConfig {
  type: 'l1' | 'l2' | 'elastic_net';
  alpha: number;
  l1Ratio?: number; // For elastic net
}

export interface OptimizationConfig {
  algorithm: 'adam' | 'sgd' | 'rmsprop' | 'adagrad';
  learningRate: number;
  momentum?: number;
  decay?: number;
  epsilon?: number;
}
