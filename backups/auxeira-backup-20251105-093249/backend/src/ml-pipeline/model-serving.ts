/**
 * Model Serving for ML Pipeline
 * Handles real-time model inference, A/B testing, and model management
 */

import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';
import { FeatureVector } from './feature-store';

export interface MLModel {
  modelId: string;
  modelName: string;
  modelType: ModelType;
  version: string;
  framework: MLFramework;
  status: ModelStatus;
  metadata: ModelMetadata;
  performance: ModelPerformance;
  deployment: ModelDeployment;
  createdAt: Date;
  updatedAt: Date;
}

export type ModelType =
  | 'sse_prediction'
  | 'success_probability'
  | 'risk_assessment'
  | 'engagement_prediction'
  | 'churn_prediction'
  | 'funding_readiness'
  | 'market_timing'
  | 'investor_matching'
  | 'recommendation'
  | 'anomaly_detection';

export type MLFramework = 'tensorflow' | 'pytorch' | 'scikit_learn' | 'xgboost' | 'lightgbm' | 'catboost' | 'onnx';
export type ModelStatus = 'training' | 'validating' | 'staging' | 'production' | 'deprecated' | 'failed';

export interface ModelMetadata {
  description: string;
  author: string;
  tags: string[];
  features: string[];
  targetVariable: string;
  trainingDataset: string;
  hyperparameters: Record<string, any>;
  preprocessing: PreprocessingConfig[];
  postprocessing: PostprocessingConfig[];
  businessLogic: string;
  interpretability: InterpretabilityConfig;
}

export interface ModelPerformance {
  trainingMetrics: Record<string, number>;
  validationMetrics: Record<string, number>;
  testMetrics: Record<string, number>;
  productionMetrics: Record<string, number>;
  benchmarkComparison: Record<string, number>;
  lastEvaluated: Date;
  performanceTrend: 'improving' | 'stable' | 'degrading';
}

export interface ModelDeployment {
  environment: 'staging' | 'production';
  endpoint: string;
  replicas: number;
  resources: ResourceConfig;
  autoscaling: AutoscalingConfig;
  trafficSplit: number; // Percentage of traffic (for A/B testing)
  deployedAt: Date;
  lastHealthCheck: Date;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}

export interface ResourceConfig {
  cpu: string;
  memory: string;
  gpu?: string;
  storage: string;
}

export interface AutoscalingConfig {
  enabled: boolean;
  minReplicas: number;
  maxReplicas: number;
  targetCPU: number;
  targetMemory: number;
  scaleUpCooldown: number;
  scaleDownCooldown: number;
}

export interface PreprocessingConfig {
  step: string;
  parameters: Record<string, any>;
  order: number;
}

export interface PostprocessingConfig {
  step: string;
  parameters: Record<string, any>;
  order: number;
}

export interface InterpretabilityConfig {
  method: 'shap' | 'lime' | 'permutation' | 'feature_importance';
  enabled: boolean;
  parameters: Record<string, any>;
}

export interface PredictionRequest {
  requestId: string;
  userId: string;
  modelType: ModelType;
  features: FeatureVector;
  options?: PredictionOptions;
  timestamp: Date;
}

export interface PredictionOptions {
  includeExplanation?: boolean;
  includeConfidence?: boolean;
  includeAlternatives?: boolean;
  customThreshold?: number;
  ensembleMethod?: 'voting' | 'averaging' | 'stacking';
}

export interface PredictionResponse {
  requestId: string;
  userId: string;
  modelId: string;
  modelVersion: string;
  prediction: any;
  confidence: number;
  explanation?: ModelExplanation;
  alternatives?: AlternativePrediction[];
  metadata: PredictionMetadata;
  timestamp: Date;
  latency: number;
}

export interface ModelExplanation {
  method: string;
  featureImportance: Record<string, number>;
  localExplanation: Record<string, number>;
  globalExplanation: Record<string, number>;
  textExplanation: string;
  visualizations?: string[];
}

export interface AlternativePrediction {
  prediction: any;
  confidence: number;
  modelId: string;
  scenario: string;
}

export interface PredictionMetadata {
  processingTime: number;
  featureCount: number;
  featureCompleteness: number;
  modelLoad: number;
  cacheHit: boolean;
  experimentId?: string;
  abTestGroup?: string;
}

export interface ModelExperiment {
  experimentId: string;
  experimentName: string;
  description: string;
  status: ExperimentStatus;
  models: ModelVariant[];
  trafficSplit: Record<string, number>;
  metrics: ExperimentMetrics;
  startDate: Date;
  endDate?: Date;
  winner?: string;
}

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';

export interface ModelVariant {
  variantId: string;
  modelId: string;
  trafficPercentage: number;
  isControl: boolean;
  configuration: Record<string, any>;
}

export interface ExperimentMetrics {
  conversionRate: Record<string, number>;
  accuracy: Record<string, number>;
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1Score: Record<string, number>;
  auc: Record<string, number>;
  businessMetrics: Record<string, number>;
  statisticalSignificance: Record<string, number>;
}

export class ModelServingEngine {
  private models: Map<string, MLModel> = new Map();
  private modelCache: Map<string, any> = new Map();
  private experiments: Map<string, ModelExperiment> = new Map();
  private predictionHistory: Map<string, PredictionResponse[]> = new Map();

  constructor() {
    this.initializeModels();
  }

  /**
   * Initialize model serving engine
   */
  async initialize(): Promise<void> {
    const timer = performanceTimer('model_serving_init');

    try {
      await this.loadProductionModels();
      await this.initializeExperiments();
      await this.startHealthChecks();

      timer.end();

      logger.info('Model Serving Engine initialized successfully', {
        modelsLoaded: this.models.size,
        experimentsActive: this.experiments.size
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to initialize Model Serving Engine', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Make prediction using appropriate model
   */
  async predict(request: PredictionRequest): Promise<PredictionResponse> {
    const timer = performanceTimer('model_prediction');
    const startTime = Date.now();

    try {
      // Select model based on experiment or default
      const selectedModel = await this.selectModel(request.modelType, request.userId);

      // Validate and preprocess features
      const processedFeatures = await this.preprocessFeatures(selectedModel, request.features);

      // Check cache for recent predictions
      const cacheKey = this.generateCacheKey(selectedModel.modelId, processedFeatures);
      const cachedPrediction = this.modelCache.get(cacheKey);

      if (cachedPrediction && this.isCacheValid(cachedPrediction)) {
        timer.end();
        return this.createCachedResponse(request, cachedPrediction, Date.now() - startTime);
      }

      // Make prediction
      const rawPrediction = await this.invokeModel(selectedModel, processedFeatures);

      // Postprocess prediction
      const processedPrediction = await this.postprocessPrediction(selectedModel, rawPrediction);

      // Calculate confidence
      const confidence = await this.calculateConfidence(selectedModel, processedFeatures, processedPrediction);

      // Generate explanation if requested
      let explanation: ModelExplanation | undefined;
      if (request.options?.includeExplanation) {
        explanation = await this.generateExplanation(selectedModel, processedFeatures, processedPrediction);
      }

      // Get alternatives if requested
      let alternatives: AlternativePrediction[] | undefined;
      if (request.options?.includeAlternatives) {
        alternatives = await this.generateAlternatives(request.modelType, processedFeatures);
      }

      const response: PredictionResponse = {
        requestId: request.requestId,
        userId: request.userId,
        modelId: selectedModel.modelId,
        modelVersion: selectedModel.version,
        prediction: processedPrediction,
        confidence,
        explanation,
        alternatives,
        metadata: {
          processingTime: Date.now() - startTime,
          featureCount: Object.keys(processedFeatures.features).length,
          featureCompleteness: processedFeatures.completeness,
          modelLoad: await this.getModelLoad(selectedModel.modelId),
          cacheHit: false,
          experimentId: await this.getExperimentId(request.modelType),
          abTestGroup: await this.getABTestGroup(request.userId, request.modelType)
        },
        timestamp: new Date(),
        latency: Date.now() - startTime
      };

      // Cache prediction
      this.modelCache.set(cacheKey, {
        prediction: processedPrediction,
        confidence,
        timestamp: new Date(),
        ttl: 300000 // 5 minutes
      });

      // Store prediction history
      this.storePredictionHistory(response);

      // Log prediction metrics
      await this.logPredictionMetrics(response);

      timer.end();

      return response;

    } catch (error) {
      timer.end();
      logger.error('Prediction failed', {
        error: (error as Error).message,
        requestId: request.requestId,
        userId: request.userId,
        modelType: request.modelType
      });
      throw error;
    }
  }

  /**
   * Batch prediction for multiple requests
   */
  async batchPredict(requests: PredictionRequest[]): Promise<PredictionResponse[]> {
    const timer = performanceTimer('model_batch_prediction');

    try {
      // Group requests by model type for efficient processing
      const requestGroups = this.groupRequestsByModelType(requests);

      const allResponses: PredictionResponse[] = [];

      // Process each group
      for (const [modelType, groupRequests] of Object.entries(requestGroups)) {
        const model = await this.selectModel(modelType as ModelType, 'batch');

        // Batch process features
        const processedFeatures = await Promise.all(
          groupRequests.map(req => this.preprocessFeatures(model, req.features))
        );

        // Batch invoke model
        const predictions = await this.batchInvokeModel(model, processedFeatures);

        // Create responses
        const responses = await Promise.all(
          groupRequests.map(async (req, index) => {
            const prediction = predictions[index];
            const confidence = await this.calculateConfidence(model, processedFeatures[index] || {} as any, prediction);

            return {
              requestId: req.requestId,
              userId: req.userId,
              modelId: model.modelId,
              modelVersion: model.version,
              prediction,
              confidence,
              metadata: {
                processingTime: 0, // Will be updated
                featureCount: Object.keys(processedFeatures[index].features).length,
                featureCompleteness: processedFeatures[index].completeness,
                modelLoad: await this.getModelLoad(model.modelId),
                cacheHit: false
              },
              timestamp: new Date(),
              latency: 0 // Will be updated
            } as PredictionResponse;
          })
        );

        allResponses.push(...responses);
      }

      timer.end();

      logger.info('Batch prediction completed', {
        requestCount: requests.length,
        responseCount: allResponses.length
      });

      return allResponses;

    } catch (error) {
      timer.end();
      logger.error('Batch prediction failed', {
        error: (error as Error).message,
        requestCount: requests.length
      });
      throw error;
    }
  }

  /**
   * Deploy new model
   */
  async deployModel(model: Omit<MLModel, 'modelId' | 'createdAt' | 'updatedAt'>): Promise<MLModel> {
    const timer = performanceTimer('model_deployment');

    try {
      const modelId = this.generateModelId(model.modelName, model.version);

      const newModel: MLModel = {
        ...model,
        modelId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate model
      await this.validateModel(newModel);

      // Deploy to staging first
      await this.deployToStaging(newModel);

      // Run validation tests
      await this.runValidationTests(newModel);

      // Store model metadata
      this.models.set(modelId, newModel);

      timer.end();

      logger.info('Model deployed successfully', {
        modelId,
        modelName: model.modelName,
        version: model.version,
        environment: model.deployment.environment
      });

      return newModel;

    } catch (error) {
      timer.end();
      logger.error('Model deployment failed', {
        error: (error as Error).message,
        modelName: model.modelName,
        version: model.version
      });
      throw error;
    }
  }

  /**
   * Start A/B test experiment
   */
  async startExperiment(experiment: Omit<ModelExperiment, 'experimentId'>): Promise<ModelExperiment> {
    const timer = performanceTimer('experiment_start');

    try {
      const experimentId = this.generateExperimentId(experiment.experimentName);

      const newExperiment: ModelExperiment = {
        ...experiment,
        experimentId,
        status: 'running'
      };

      // Validate experiment configuration
      await this.validateExperiment(newExperiment);

      // Configure traffic splitting
      await this.configureTrafficSplit(newExperiment);

      // Store experiment
      this.experiments.set(experimentId, newExperiment);

      timer.end();

      logger.info('Experiment started successfully', {
        experimentId,
        experimentName: experiment.experimentName,
        models: experiment.models.length
      });

      return newExperiment;

    } catch (error) {
      timer.end();
      logger.error('Failed to start experiment', {
        error: (error as Error).message,
        experimentName: experiment.experimentName
      });
      throw error;
    }
  }

  /**
   * Get model performance metrics
   */
  async getModelMetrics(modelId: string, timeRange?: { start: Date; end: Date }): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    auc: number;
    latency: {
      p50: number;
      p95: number;
      p99: number;
    };
    throughput: number;
    errorRate: number;
    predictionCount: number;
  }> {
    const timer = performanceTimer('model_metrics');

    try {
      const model = this.models.get(modelId);
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }

      // Get predictions in time range
      const predictions = this.getPredictionsInRange(modelId, timeRange);

      // Calculate metrics
      const metrics = await this.calculateModelMetrics(predictions);

      timer.end();

      return metrics;

    } catch (error) {
      timer.end();
      logger.error('Failed to get model metrics', {
        error: (error as Error).message,
        modelId
      });
      throw error;
    }
  }

  /**
   * Get experiment results
   */
  async getExperimentResults(experimentId: string): Promise<{
    experiment: ModelExperiment;
    results: ExperimentMetrics;
    recommendation: {
      winner: string;
      confidence: number;
      reasoning: string;
    };
  }> {
    const timer = performanceTimer('experiment_results');

    try {
      const experiment = this.experiments.get(experimentId);
      if (!experiment) {
        throw new Error(`Experiment not found: ${experimentId}`);
      }

      // Calculate results for each variant
      const results = await this.calculateExperimentResults(experiment);

      // Determine winner
      const recommendation = await this.determineExperimentWinner(experiment, results);

      timer.end();

      return {
        experiment,
        results,
        recommendation
      };

    } catch (error) {
      timer.end();
      logger.error('Failed to get experiment results', {
        error: (error as Error).message,
        experimentId
      });
      throw error;
    }
  }

  // Private helper methods

  private async initializeModels(): Promise<void> {
    // Initialize with core models
    const coreModels = this.getCoreModelDefinitions();

    for (const modelDef of coreModels) {
      const modelId = this.generateModelId(modelDef.modelName, modelDef.version);
      const model: MLModel = {
        ...modelDef,
        modelId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.models.set(modelId, model);
    }
  }

  private getCoreModelDefinitions(): Omit<MLModel, 'modelId' | 'createdAt' | 'updatedAt'>[] {
    return [
      {
        modelName: 'sse_predictor_v1',
        modelType: 'sse_prediction',
        version: '1.0.0',
        framework: 'xgboost',
        status: 'production',
        metadata: {
          description: 'Predicts SSE score trajectory based on current features',
          author: 'data-science-team',
          tags: ['sse', 'prediction', 'core'],
          features: ['engagement_score', 'milestone_completion', 'financial_metrics'],
          targetVariable: 'sse_score_30d',
          trainingDataset: 'sse_training_v1',
          hyperparameters: {
            n_estimators: 100,
            max_depth: 6,
            learning_rate: 0.1
          },
          preprocessing: [
            { step: 'normalize', parameters: { method: 'standard' }, order: 1 },
            { step: 'impute', parameters: { strategy: 'median' }, order: 2 }
          ],
          postprocessing: [
            { step: 'clip', parameters: { min: 0, max: 100 }, order: 1 }
          ],
          businessLogic: 'Predicts SSE score changes to help startups improve',
          interpretability: {
            method: 'shap',
            enabled: true,
            parameters: { explainer_type: 'tree' }
          }
        },
        performance: {
          trainingMetrics: { accuracy: 0.85, mae: 5.2 },
          validationMetrics: { accuracy: 0.82, mae: 5.8 },
          testMetrics: { accuracy: 0.81, mae: 6.1 },
          productionMetrics: { accuracy: 0.79, mae: 6.5 },
          benchmarkComparison: { baseline: 0.65 },
          lastEvaluated: new Date(),
          performanceTrend: 'stable'
        },
        deployment: {
          environment: 'production',
          endpoint: '/api/models/sse-predictor/predict',
          replicas: 3,
          resources: {
            cpu: '500m',
            memory: '1Gi',
            storage: '10Gi'
          },
          autoscaling: {
            enabled: true,
            minReplicas: 2,
            maxReplicas: 10,
            targetCPU: 70,
            targetMemory: 80,
            scaleUpCooldown: 300,
            scaleDownCooldown: 600
          },
          trafficSplit: 100,
          deployedAt: new Date(),
          lastHealthCheck: new Date(),
          healthStatus: 'healthy'
        }
      },
      {
        modelName: 'success_probability_v1',
        modelType: 'success_probability',
        version: '1.0.0',
        framework: 'tensorflow',
        status: 'production',
        metadata: {
          description: 'Predicts startup success probability using ensemble methods',
          author: 'data-science-team',
          tags: ['success', 'probability', 'ensemble'],
          features: ['sse_score', 'market_metrics', 'team_metrics', 'financial_metrics'],
          targetVariable: 'success_probability',
          trainingDataset: 'success_training_v1',
          hyperparameters: {
            layers: [128, 64, 32],
            dropout: 0.3,
            learning_rate: 0.001
          },
          preprocessing: [
            { step: 'normalize', parameters: { method: 'min-max' }, order: 1 },
            { step: 'feature_selection', parameters: { method: 'mutual_info', k: 50 }, order: 2 }
          ],
          postprocessing: [
            { step: 'sigmoid', parameters: {}, order: 1 }
          ],
          businessLogic: 'Provides success probability for investment decisions',
          interpretability: {
            method: 'lime',
            enabled: true,
            parameters: { num_features: 10 }
          }
        },
        performance: {
          trainingMetrics: { auc: 0.92, precision: 0.85, recall: 0.78 },
          validationMetrics: { auc: 0.89, precision: 0.82, recall: 0.75 },
          testMetrics: { auc: 0.87, precision: 0.80, recall: 0.73 },
          productionMetrics: { auc: 0.85, precision: 0.78, recall: 0.71 },
          benchmarkComparison: { random_forest: 0.82, logistic_regression: 0.75 },
          lastEvaluated: new Date(),
          performanceTrend: 'stable'
        },
        deployment: {
          environment: 'production',
          endpoint: '/api/models/success-probability/predict',
          replicas: 2,
          resources: {
            cpu: '1000m',
            memory: '2Gi',
            gpu: '1',
            storage: '20Gi'
          },
          autoscaling: {
            enabled: true,
            minReplicas: 1,
            maxReplicas: 5,
            targetCPU: 80,
            targetMemory: 85,
            scaleUpCooldown: 300,
            scaleDownCooldown: 600
          },
          trafficSplit: 100,
          deployedAt: new Date(),
          lastHealthCheck: new Date(),
          healthStatus: 'healthy'
        }
      }
    ];
  }

  private async loadProductionModels(): Promise<void> {
    // Load models from model registry/storage
    logger.info('Loading production models');
  }

  private async initializeExperiments(): Promise<void> {
    // Initialize any running experiments
    logger.info('Initializing experiments');
  }

  private async startHealthChecks(): Promise<void> {
    // Start periodic health checks for all models
    setInterval(async () => {
      await this.performHealthChecks();
    }, 60000); // Every minute
  }

  private async selectModel(modelType: ModelType, userId: string): Promise<MLModel> {
    // Find models of the requested type
    const candidateModels = Array.from(this.models.values())
      .filter(model => model.modelType === modelType && model.status === 'production');

    if (candidateModels.length === 0) {
      throw new Error(`No production models found for type: ${modelType}`);
    }

    // Check for active experiments
    const experiment = this.getActiveExperiment(modelType);
    if (experiment) {
      return this.selectModelFromExperiment(experiment, userId);
    }

    // Return the default model (highest version)
    return candidateModels.sort((a, b) => b.version.localeCompare(a.version))[0];
  }

  private async preprocessFeatures(model: MLModel, features: FeatureVector): Promise<FeatureVector> {
    let processedFeatures = { ...features };

    // Apply preprocessing steps in order
    for (const step of model.metadata.preprocessing.sort((a, b) => a.order - b.order)) {
      processedFeatures = await this.applyPreprocessingStep(step, processedFeatures);
    }

    return processedFeatures;
  }

  private async invokeModel(model: MLModel, features: FeatureVector): Promise<any> {
    // This would invoke the actual model endpoint
    // For now, return a mock prediction based on model type
    switch (model.modelType) {
      case 'sse_prediction':
        return this.mockSSEPrediction(features);
      case 'success_probability':
        return this.mockSuccessProbability(features);
      case 'risk_assessment':
        return this.mockRiskAssessment(features);
      default:
        return { prediction: 0.5, confidence: 0.8 };
    }
  }

  private async batchInvokeModel(model: MLModel, featuresArray: FeatureVector[]): Promise<any[]> {
    // Batch invoke model for efficiency
    return Promise.all(featuresArray.map(features => this.invokeModel(model, features)));
  }

  private async postprocessPrediction(model: MLModel, prediction: any): Promise<any> {
    let processedPrediction = prediction;

    // Apply postprocessing steps in order
    for (const step of model.metadata.postprocessing.sort((a, b) => a.order - b.order)) {
      processedPrediction = await this.applyPostprocessingStep(step, processedPrediction);
    }

    return processedPrediction;
  }

  private async calculateConfidence(model: MLModel, features: FeatureVector, prediction: any): Promise<number> {
    // Calculate prediction confidence based on model uncertainty
    const featureCompleteness = features.completeness / 100;
    const modelPerformance = model.performance.productionMetrics.accuracy || 0.8;

    // Simple confidence calculation (would be more sophisticated in practice)
    return Math.min(featureCompleteness * modelPerformance * 0.9 + 0.1, 1.0);
  }

  private async generateExplanation(
    model: MLModel,
    features: FeatureVector,
    prediction: any
  ): Promise<ModelExplanation> {
    // Generate model explanation using configured method
    const method = model.metadata.interpretability.method;

    // Mock explanation (would use actual SHAP/LIME in practice)
    return {
      method,
      featureImportance: this.mockFeatureImportance(features),
      localExplanation: this.mockLocalExplanation(features),
      globalExplanation: this.mockGlobalExplanation(),
      textExplanation: this.generateTextExplanation(prediction, features)
    };
  }

  private async generateAlternatives(
    modelType: ModelType,
    features: FeatureVector
  ): Promise<AlternativePrediction[]> {
    // Generate alternative predictions using different models or scenarios
    return [
      {
        prediction: 0.75,
        confidence: 0.85,
        modelId: 'alternative_model_1',
        scenario: 'optimistic'
      },
      {
        prediction: 0.45,
        confidence: 0.80,
        modelId: 'alternative_model_2',
        scenario: 'conservative'
      }
    ];
  }

  // Mock prediction methods (would be replaced with actual model calls)
  private mockSSEPrediction(features: FeatureVector): any {
    const currentSSE = features.features.sse_score_current || 50;
    const trend = Math.random() * 20 - 10; // -10 to +10
    return {
      predicted_sse_30d: Math.max(0, Math.min(100, currentSSE + trend)),
      trend_direction: trend > 0 ? 'improving' : 'declining',
      confidence_interval: [currentSSE + trend - 5, currentSSE + trend + 5]
    };
  }

  private mockSuccessProbability(features: FeatureVector): any {
    const sseScore = features.features.sse_score_current || 50;
    const baseProbability = sseScore / 100;
    const adjustedProbability = Math.max(0, Math.min(1, baseProbability + (Math.random() * 0.2 - 0.1)));

    return {
      success_probability: adjustedProbability,
      risk_factors: ['market_competition', 'funding_gap'],
      success_factors: ['strong_team', 'product_market_fit']
    };
  }

  private mockRiskAssessment(features: FeatureVector): any {
    const sseScore = features.features.sse_score_current || 50;
    const riskScore = 1 - (sseScore / 100);

    return {
      risk_score: riskScore,
      risk_level: riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low',
      risk_factors: ['cash_flow', 'market_volatility'],
      mitigation_strategies: ['diversify_revenue', 'reduce_costs']
    };
  }

  // Helper methods for explanations
  private mockFeatureImportance(features: FeatureVector): Record<string, number> {
    const importance: Record<string, number> = {};
    const featureNames = Object.keys(features.features);

    featureNames.forEach(name => {
      importance[name] = Math.random();
    });

    return importance;
  }

  private mockLocalExplanation(features: FeatureVector): Record<string, number> {
    return this.mockFeatureImportance(features);
  }

  private mockGlobalExplanation(): Record<string, number> {
    return {
      sse_score: 0.35,
      engagement_metrics: 0.25,
      financial_health: 0.20,
      market_position: 0.15,
      team_strength: 0.05
    };
  }

  private generateTextExplanation(prediction: any, features: FeatureVector): string {
    return `Based on the current features, the model predicts ${JSON.stringify(prediction)}. Key factors influencing this prediction include the SSE score and engagement metrics.`;
  }

  // Utility methods
  private generateModelId(modelName: string, version: string): string {
    return `${modelName}_${version}_${Date.now()}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }

  private generateExperimentId(experimentName: string): string {
    return `exp_${experimentName}_${Date.now()}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }

  private generateCacheKey(modelId: string, features: FeatureVector): string {
    const featureHash = this.hashFeatures(features);
    return `${modelId}_${featureHash}`;
  }

  private hashFeatures(features: FeatureVector): string {
    const featureString = JSON.stringify(features.features);
    let hash = 0;
    for (let i = 0; i < featureString.length; i++) {
      const char = featureString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private isCacheValid(cachedItem: any): boolean {
    const now = Date.now();
    const cacheTime = new Date(cachedItem.timestamp).getTime();
    return (now - cacheTime) < cachedItem.ttl;
  }

  private createCachedResponse(
    request: PredictionRequest,
    cachedItem: any,
    latency: number
  ): PredictionResponse {
    return {
      requestId: request.requestId,
      userId: request.userId,
      modelId: 'cached',
      modelVersion: '1.0',
      prediction: cachedItem.prediction,
      confidence: cachedItem.confidence,
      metadata: {
        processingTime: latency,
        featureCount: Object.keys(request.features.features).length,
        featureCompleteness: request.features.completeness,
        modelLoad: 0,
        cacheHit: true
      },
      timestamp: new Date(),
      latency
    };
  }

  private storePredictionHistory(response: PredictionResponse): void {
    if (!this.predictionHistory.has(response.userId)) {
      this.predictionHistory.set(response.userId, []);
    }

    const userHistory = this.predictionHistory.get(response.userId)!;
    userHistory.push(response);

    // Keep only last 100 predictions per user
    if (userHistory.length > 100) {
      userHistory.shift();
    }
  }

  private async logPredictionMetrics(response: PredictionResponse): Promise<void> {
    logger.info('Prediction completed', {
      modelId: response.modelId,
      userId: response.userId,
      latency: response.latency,
      confidence: response.confidence,
      featureCompleteness: response.metadata.featureCompleteness
    });
  }

  private groupRequestsByModelType(requests: PredictionRequest[]): Record<string, PredictionRequest[]> {
    return requests.reduce((groups, request) => {
      const modelType = request.modelType;
      if (!groups[modelType]) {
        groups[modelType] = [];
      }
      groups[modelType].push(request);
      return groups;
    }, {} as Record<string, PredictionRequest[]>);
  }

  private getActiveExperiment(modelType: ModelType): ModelExperiment | undefined {
    return Array.from(this.experiments.values())
      .find(exp => exp.status === 'running' &&
        exp.models.some(variant => {
          const model = this.models.get(variant.modelId);
          return model?.modelType === modelType;
        })
      );
  }

  private selectModelFromExperiment(experiment: ModelExperiment, userId: string): MLModel {
    // Simple hash-based assignment for consistent user experience
    const userHash = this.hashString(userId);
    const totalPercentage = experiment.models.reduce((sum, variant) => sum + variant.trafficPercentage, 0);
    const normalizedHash = userHash % totalPercentage;

    let cumulativePercentage = 0;
    for (const variant of experiment.models) {
      cumulativePercentage += variant.trafficPercentage;
      if (normalizedHash < cumulativePercentage) {
        const model = this.models.get(variant.modelId);
        if (model) return model;
      }
    }

    // Fallback to control group
    const controlVariant = experiment.models.find(v => v.isControl);
    if (controlVariant) {
      const model = this.models.get(controlVariant.modelId);
      if (model) return model;
    }

    throw new Error('No valid model found in experiment');
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private async getModelLoad(modelId: string): Promise<number> {
    // Return current model load (0-1)
    return Math.random() * 0.8; // Mock load
  }

  private async getExperimentId(modelType: ModelType): Promise<string | undefined> {
    const experiment = this.getActiveExperiment(modelType);
    return experiment?.experimentId;
  }

  private async getABTestGroup(userId: string, modelType: ModelType): Promise<string | undefined> {
    const experiment = this.getActiveExperiment(modelType);
    if (!experiment) return undefined;

    const selectedModel = this.selectModelFromExperiment(experiment, userId);
    const variant = experiment.models.find(v => v.modelId === selectedModel.modelId);
    return variant?.variantId;
  }

  private getPredictionsInRange(
    modelId: string,
    timeRange?: { start: Date; end: Date }
  ): PredictionResponse[] {
    // Get predictions for metrics calculation
    const allPredictions = Array.from(this.predictionHistory.values()).flat();
    return allPredictions.filter(pred => {
      if (pred.modelId !== modelId) return false;
      if (!timeRange) return true;
      return pred.timestamp >= timeRange.start && pred.timestamp <= timeRange.end;
    });
  }

  private async calculateModelMetrics(predictions: PredictionResponse[]): Promise<any> {
    // Calculate comprehensive model metrics
    const latencies = predictions.map(p => p.latency);

    return {
      accuracy: 0.85, // Would calculate from ground truth
      precision: 0.82,
      recall: 0.78,
      f1Score: 0.80,
      auc: 0.87,
      latency: {
        p50: this.percentile(latencies, 0.5),
        p95: this.percentile(latencies, 0.95),
        p99: this.percentile(latencies, 0.99)
      },
      throughput: predictions.length / 3600, // predictions per hour
      errorRate: 0.02,
      predictionCount: predictions.length
    };
  }

  private percentile(values: number[], p: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index] || 0;
  }

  // Placeholder methods for complex operations
  private async validateModel(model: MLModel): Promise<void> {
    logger.info('Validating model', { modelId: model.modelId });
  }

  private async deployToStaging(model: MLModel): Promise<void> {
    logger.info('Deploying to staging', { modelId: model.modelId });
  }

  private async runValidationTests(model: MLModel): Promise<void> {
    logger.info('Running validation tests', { modelId: model.modelId });
  }

  private async validateExperiment(experiment: ModelExperiment): Promise<void> {
    logger.info('Validating experiment', { experimentId: experiment.experimentId });
  }

  private async configureTrafficSplit(experiment: ModelExperiment): Promise<void> {
    logger.info('Configuring traffic split', { experimentId: experiment.experimentId });
  }

  private async calculateExperimentResults(experiment: ModelExperiment): Promise<ExperimentMetrics> {
    // Calculate experiment results
    return {
      conversionRate: {},
      accuracy: {},
      precision: {},
      recall: {},
      f1Score: {},
      auc: {},
      businessMetrics: {},
      statisticalSignificance: {}
    };
  }

  private async determineExperimentWinner(
    experiment: ModelExperiment,
    results: ExperimentMetrics
  ): Promise<{ winner: string; confidence: number; reasoning: string }> {
    return {
      winner: experiment.models[0].variantId,
      confidence: 0.95,
      reasoning: 'Variant A shows statistically significant improvement in accuracy'
    };
  }

  private async applyPreprocessingStep(step: PreprocessingConfig, features: FeatureVector): Promise<FeatureVector> {
    // Apply preprocessing step
    return features;
  }

  private async applyPostprocessingStep(step: PostprocessingConfig, prediction: any): Promise<any> {
    // Apply postprocessing step
    return prediction;
  }

  private async performHealthChecks(): Promise<void> {
    // Perform health checks on all models
    for (const model of this.models.values()) {
      try {
        // Check model health
        const isHealthy = await this.checkModelHealth(model);
        model.deployment.healthStatus = isHealthy ? 'healthy' : 'unhealthy';
        model.deployment.lastHealthCheck = new Date();
      } catch (error) {
        logger.error('Health check failed', {
          modelId: model.modelId,
          error: (error as Error).message
        });
        model.deployment.healthStatus = 'unhealthy';
      }
    }
  }

  private async checkModelHealth(model: MLModel): Promise<boolean> {
    // Check if model endpoint is responsive
    return true; // Mock health check
  }

  /**
   * Health check for model serving engine
   */
  async healthCheck(): Promise<{
    status: string;
    modelsLoaded: number;
    healthyModels: number;
    activeExperiments: number;
    averageLatency: number;
    errorRate: number;
  }> {
    try {
      const healthyModels = Array.from(this.models.values())
        .filter(model => model.deployment.healthStatus === 'healthy').length;

      const activeExperiments = Array.from(this.experiments.values())
        .filter(exp => exp.status === 'running').length;

      // Calculate average latency from recent predictions
      const recentPredictions = Array.from(this.predictionHistory.values())
        .flat()
        .filter(pred => pred.timestamp > new Date(Date.now() - 3600000)); // Last hour

      const averageLatency = recentPredictions.length > 0
        ? recentPredictions.reduce((sum, pred) => sum + pred.latency, 0) / recentPredictions.length
        : 0;

      return {
        status: healthyModels === this.models.size ? 'healthy' : 'degraded',
        modelsLoaded: this.models.size,
        healthyModels,
        activeExperiments,
        averageLatency,
        errorRate: 0.02 // Would calculate from actual errors
      };

    } catch (error) {
      logger.error('Model serving health check failed', {
        error: (error as Error).message
      });

      return {
        status: 'unhealthy',
        modelsLoaded: this.models.size,
        healthyModels: 0,
        activeExperiments: 0,
        averageLatency: 0,
        errorRate: 1.0
      };
    }
  }
}

export const modelServingEngine = new ModelServingEngine();
export default modelServingEngine;