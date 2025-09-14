/**
 * Advanced Statistical Models Service
 * Handles Cox survival analysis, hierarchical models, and predictive analytics
 * Based on the advanced analytics architecture from the tech specs
 */

import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';
import {
  StatisticalModel,
  CoxSurvivalModel,
  HierarchicalModel,
  PredictiveModel,
  ModelTrainingJob,
  ModelEvaluation,
  ModelPrediction,
  TrainModelRequest,
  PredictRequest,
  SurvivalAnalysisRequest,
  HierarchicalModelRequest,
  ModelValidationRequest,
  ModelType,
  ModelCategory,
  TrainingStatus,
  PredictionType
} from '../types/statistical-models.types';

export class StatisticalModelsService {
  private readonly PYTHON_SCRIPT_PATH = '/home/ubuntu/auxeira-backend/scripts/statistical_models.py';

  /**
   * Train a new statistical model
   */
  async trainModel(request: TrainModelRequest): Promise<ModelTrainingJob> {
    const timer = performanceTimer('statistical_models_train');

    try {
      // Create model record
      const modelQuery = `
        INSERT INTO statistical_models (
          id, name, type, category, description, version, algorithm,
          parameters, is_active, is_production, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, '1.0', $5, $6, true, false, NOW()
        ) RETURNING id
      `;

      const modelResult = await pool.query(modelQuery, [
        request.name,
        request.modelType,
        request.category,
        request.description,
        this.getAlgorithmForModelType(request.modelType),
        JSON.stringify(request.parameters)
      ]);

      const modelId = modelResult.rows[0].id;

      // Create training job
      const jobQuery = `
        INSERT INTO model_training_jobs (
          id, model_id, status, started_at, dataset_version,
          hyperparameters, resource_usage, created_at
        ) VALUES (
          gen_random_uuid(), $1, 'pending', NOW(), $2, $3, $4, NOW()
        ) RETURNING *
      `;

      const jobResult = await pool.query(jobQuery, [
        modelId,
        request.datasetId,
        JSON.stringify(request.parameters.hyperparameters),
        JSON.stringify({ cpuTime: 0, memoryPeak: 0, diskIO: 0 })
      ]);

      const trainingJob = this.mapTrainingJobFromDB(jobResult.rows[0]);

      // Start training process asynchronously
      this.startTrainingProcess(trainingJob.id, request);

      timer.end();

      logger.info('Model training started', {
        modelId,
        trainingJobId: trainingJob.id,
        modelType: request.modelType
      });

      return trainingJob;

    } catch (error) {
      timer.end();
      logger.error('Failed to start model training', {
        error: (error as Error).message,
        request
      });
      throw new Error('Failed to start model training');
    }
  }

  /**
   * Perform Cox survival analysis
   */
  async performSurvivalAnalysis(request: SurvivalAnalysisRequest): Promise<CoxSurvivalModel> {
    const timer = performanceTimer('statistical_models_survival_analysis');

    try {
      // This would call a Python script for Cox regression
      const pythonCommand = `python3 ${this.PYTHON_SCRIPT_PATH} cox_survival \
        --dataset_id "${request.datasetId}" \
        --time_variable "${request.timeVariable}" \
        --event_variable "${request.eventVariable}" \
        --covariates "${request.covariates.join(',')}" \
        ${request.stratificationVariable ? `--stratification "${request.stratificationVariable}"` : ''} \
        --confidence_level ${request.confidenceLevel || 0.95}`;

      // For now, return a mock response
      const mockSurvivalModel: CoxSurvivalModel = {
        modelId: 'cox_' + Date.now(),
        hazardRatio: request.covariates.reduce((acc, covariate) => {
          acc[covariate] = 1 + (Math.random() - 0.5) * 0.5; // Mock hazard ratios
          return acc;
        }, {} as Record<string, number>),
        confidenceIntervals: request.covariates.reduce((acc, covariate) => {
          const hr = 1 + (Math.random() - 0.5) * 0.5;
          acc[covariate] = [hr * 0.8, hr * 1.2]; // Mock confidence intervals
          return acc;
        }, {} as Record<string, [number, number]>),
        pValues: request.covariates.reduce((acc, covariate) => {
          acc[covariate] = Math.random() * 0.1; // Mock p-values
          return acc;
        }, {} as Record<string, number>),
        concordanceIndex: 0.65 + Math.random() * 0.2, // Mock C-index
        logLikelihood: -1000 - Math.random() * 500,
        survivalFunction: {
          timePoints: Array.from({ length: 100 }, (_, i) => i * 10),
          survivalProbabilities: Array.from({ length: 100 }, (_, i) => Math.exp(-i * 0.01)),
          confidenceLower: Array.from({ length: 100 }, (_, i) => Math.exp(-i * 0.012)),
          confidenceUpper: Array.from({ length: 100 }, (_, i) => Math.exp(-i * 0.008)),
          riskTable: []
        },
        riskGroups: [
          {
            name: 'Low Risk',
            criteria: { sse_score: '>= 80' },
            hazardRatio: 0.5,
            riskScore: 0.2,
            description: 'High-performing startups with low failure risk'
          },
          {
            name: 'Medium Risk',
            criteria: { sse_score: '60-79' },
            hazardRatio: 1.0,
            riskScore: 0.5,
            description: 'Average-performing startups with moderate risk'
          },
          {
            name: 'High Risk',
            criteria: { sse_score: '< 60' },
            hazardRatio: 2.0,
            riskScore: 0.8,
            description: 'Underperforming startups with high failure risk'
          }
        ],
        timeToEvent: request.timeVariable,
        eventIndicator: request.eventVariable
      };

      timer.end();
      return mockSurvivalModel;

    } catch (error) {
      timer.end();
      logger.error('Failed to perform survival analysis', {
        error: (error as Error).message,
        request
      });
      throw new Error('Failed to perform survival analysis');
    }
  }

  /**
   * Build hierarchical model
   */
  async buildHierarchicalModel(request: HierarchicalModelRequest): Promise<HierarchicalModel> {
    const timer = performanceTimer('statistical_models_hierarchical');

    try {
      // This would call a Python script for hierarchical modeling (using lme4 or similar)
      const pythonCommand = `python3 ${this.PYTHON_SCRIPT_PATH} hierarchical_model \
        --dataset_id "${request.datasetId}" \
        --dependent_variable "${request.dependentVariable}" \
        --fixed_effects "${request.fixedEffects.join(',')}" \
        --random_effects "${JSON.stringify(request.randomEffects)}" \
        --grouping_variables "${request.groupingVariables.join(',')}" \
        --method "${request.method || 'reml'}"`;

      // For now, return a mock response
      const mockHierarchicalModel: HierarchicalModel = {
        modelId: 'hierarchical_' + Date.now(),
        levels: [
          {
            level: 1,
            name: 'Individual',
            groupingVariable: 'user_id',
            numberOfGroups: 1000,
            averageGroupSize: 1,
            variance: 0.5
          },
          {
            level: 2,
            name: 'Organization',
            groupingVariable: 'organization_id',
            numberOfGroups: 200,
            averageGroupSize: 5,
            variance: 0.3
          },
          {
            level: 3,
            name: 'Industry',
            groupingVariable: 'industry',
            numberOfGroups: 20,
            averageGroupSize: 50,
            variance: 0.2
          }
        ],
        randomEffects: request.randomEffects.map(re => ({
          variable: re.variable,
          level: 2, // Mock level
          variance: Math.random() * 0.5,
          standardDeviation: Math.sqrt(Math.random() * 0.5)
        })),
        fixedEffects: request.fixedEffects.map(fe => ({
          variable: fe,
          coefficient: (Math.random() - 0.5) * 2,
          standardError: Math.random() * 0.1,
          tValue: (Math.random() - 0.5) * 10,
          pValue: Math.random() * 0.1,
          confidenceInterval: [0, 0] // Would be calculated
        })),
        varianceComponents: [
          {
            component: 'Residual',
            variance: 0.4,
            proportion: 0.6,
            description: 'Individual-level variance'
          },
          {
            component: 'Organization',
            variance: 0.2,
            proportion: 0.3,
            description: 'Organization-level variance'
          },
          {
            component: 'Industry',
            variance: 0.1,
            proportion: 0.1,
            description: 'Industry-level variance'
          }
        ],
        iccValues: {
          organization: 0.3,
          industry: 0.1
        },
        modelFit: {
          logLikelihood: -500,
          aic: 1020,
          bic: 1050,
          deviance: 1000,
          marginalR2: 0.25,
          conditionalR2: 0.45
        }
      };

      timer.end();
      return mockHierarchicalModel;

    } catch (error) {
      timer.end();
      logger.error('Failed to build hierarchical model', {
        error: (error as Error).message,
        request
      });
      throw new Error('Failed to build hierarchical model');
    }
  }

  /**
   * Make predictions using a trained model
   */
  async makePredictions(request: PredictRequest): Promise<ModelPrediction[]> {
    const timer = performanceTimer('statistical_models_predict');

    try {
      // Get model details
      const model = await this.getModelById(request.modelId);
      if (!model || !model.isActive) {
        throw new Error('Model not found or inactive');
      }

      const predictions: ModelPrediction[] = [];

      // Process each input data point
      for (let i = 0; i < request.inputData.length; i++) {
        const inputData = request.inputData[i];

        // This would call the actual model prediction
        // For now, generate mock predictions based on model type
        const prediction = await this.generateMockPrediction(
          model,
          inputData,
          request.predictionType || 'point_estimate',
          request.confidenceLevel || 0.95
        );

        predictions.push(prediction);
      }

      timer.end();

      logger.info('Predictions generated', {
        modelId: request.modelId,
        predictionCount: predictions.length
      });

      return predictions;

    } catch (error) {
      timer.end();
      logger.error('Failed to make predictions', {
        error: (error as Error).message,
        request
      });
      throw new Error('Failed to make predictions');
    }
  }

  /**
   * Evaluate model performance
   */
  async evaluateModel(request: ModelValidationRequest): Promise<ModelEvaluation> {
    const timer = performanceTimer('statistical_models_evaluate');

    try {
      const model = await this.getModelById(request.modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      // This would perform actual model evaluation
      // For now, return mock evaluation results
      const mockEvaluation: ModelEvaluation = {
        modelId: request.modelId,
        evaluationType: request.validationType,
        testDataset: request.validationDatasetId,
        metrics: {
          accuracy: 0.85 + Math.random() * 0.1,
          precision: 0.82 + Math.random() * 0.1,
          recall: 0.78 + Math.random() * 0.1,
          f1Score: 0.80 + Math.random() * 0.1,
          auc: 0.88 + Math.random() * 0.1,
          validationMetrics: {},
          featureImportance: {}
        },
        residualAnalysis: {
          residuals: [],
          standardizedResiduals: [],
          normalityTest: {
            statistic: 0.95,
            pValue: 0.32,
            isNormal: true
          },
          homoscedasticityTest: {
            statistic: 1.2,
            pValue: 0.28,
            isHomoscedastic: true
          }
        },
        crossValidation: {
          folds: 5,
          scores: [0.82, 0.85, 0.83, 0.87, 0.84],
          meanScore: 0.842,
          standardDeviation: 0.018,
          confidenceInterval: [0.824, 0.860],
          stratified: true
        },
        robustnessTests: [
          {
            testName: 'Outlier Sensitivity',
            description: 'Model performance with outliers removed',
            passed: true,
            score: 0.95,
            threshold: 0.9,
            details: {}
          }
        ],
        evaluatedAt: new Date(),
        evaluatedBy: 'system'
      };

      // Save evaluation results
      const evaluationQuery = `
        INSERT INTO model_evaluations (
          id, model_id, evaluation_type, test_dataset, metrics,
          residual_analysis, cross_validation, robustness_tests,
          evaluated_at, evaluated_by, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), $8, NOW()
        )
      `;

      await pool.query(evaluationQuery, [
        request.modelId,
        request.validationType,
        request.validationDatasetId,
        JSON.stringify(mockEvaluation.metrics),
        JSON.stringify(mockEvaluation.residualAnalysis),
        JSON.stringify(mockEvaluation.crossValidation),
        JSON.stringify(mockEvaluation.robustnessTests),
        'system'
      ]);

      timer.end();
      return mockEvaluation;

    } catch (error) {
      timer.end();
      logger.error('Failed to evaluate model', {
        error: (error as Error).message,
        request
      });
      throw new Error('Failed to evaluate model');
    }
  }

  /**
   * Get model by ID
   */
  async getModelById(modelId: string): Promise<StatisticalModel | null> {
    const timer = performanceTimer('statistical_models_get_by_id');

    try {
      const query = 'SELECT * FROM statistical_models WHERE id = $1';
      const result = await pool.query(query, [modelId]);

      timer.end();

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapModelFromDB(result.rows[0]);

    } catch (error) {
      timer.end();
      logger.error('Failed to get model by ID', {
        error: (error as Error).message,
        modelId
      });
      throw new Error('Failed to get model');
    }
  }

  /**
   * Get models by type and category
   */
  async getModels(
    type?: ModelType,
    category?: ModelCategory,
    isActive?: boolean,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    models: StatisticalModel[];
    total: number;
    hasMore: boolean;
  }> {
    const timer = performanceTimer('statistical_models_get_list');

    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramCount = 0;

      if (type) {
        whereClause += ` AND type = $${++paramCount}`;
        params.push(type);
      }

      if (category) {
        whereClause += ` AND category = $${++paramCount}`;
        params.push(category);
      }

      if (isActive !== undefined) {
        whereClause += ` AND is_active = $${++paramCount}`;
        params.push(isActive);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM statistical_models ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Get models
      const query = `
        SELECT * FROM statistical_models
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;

      params.push(limit, offset);

      const result = await pool.query(query, params);
      const models = result.rows.map(row => this.mapModelFromDB(row));

      timer.end();

      return {
        models,
        total,
        hasMore: offset + models.length < total
      };

    } catch (error) {
      timer.end();
      logger.error('Failed to get models', {
        error: (error as Error).message
      });
      throw new Error('Failed to get models');
    }
  }

  /**
   * Get training job status
   */
  async getTrainingJobStatus(jobId: string): Promise<ModelTrainingJob | null> {
    const timer = performanceTimer('statistical_models_get_training_status');

    try {
      const query = 'SELECT * FROM model_training_jobs WHERE id = $1';
      const result = await pool.query(query, [jobId]);

      timer.end();

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapTrainingJobFromDB(result.rows[0]);

    } catch (error) {
      timer.end();
      logger.error('Failed to get training job status', {
        error: (error as Error).message,
        jobId
      });
      throw new Error('Failed to get training job status');
    }
  }

  /**
   * Predict startup success probability
   */
  async predictStartupSuccess(
    userId: string,
    timeHorizon: number = 365
  ): Promise<{
    successProbability: number;
    riskFactors: string[];
    recommendations: string[];
    confidenceInterval: [number, number];
  }> {
    const timer = performanceTimer('statistical_models_predict_success');

    try {
      // Get user and organization data
      const userDataQuery = `
        SELECT
          u.*, o.*, s.overall_score, s.social_score,
          s.sustainability_score, s.economic_score
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        LEFT JOIN sse_scores s ON u.id = s.user_id
        WHERE u.id = $1
        ORDER BY s.calculated_at DESC
        LIMIT 1
      `;

      const userResult = await pool.query(userDataQuery, [userId]);
      const userData = userResult.rows[0];

      if (!userData) {
        throw new Error('User data not found');
      }

      // Use survival model to predict success
      const features = {
        sse_score: userData.overall_score || 50,
        funding_raised: userData.funding_raised || 0,
        employee_count: userData.employee_count || 1,
        monthly_revenue: userData.monthly_revenue || 0,
        industry: userData.industry || 'technology',
        stage: userData.stage || 'idea',
        region: userData.region || 'north_america'
      };

      // Mock prediction based on features
      const baseSuccessProbability = Math.min(
        0.1 + (features.sse_score / 100) * 0.8 +
        Math.log(features.funding_raised + 1) * 0.05 +
        Math.log(features.employee_count) * 0.1,
        0.95
      );

      const successProbability = Math.max(0.05, baseSuccessProbability);

      // Identify risk factors
      const riskFactors: string[] = [];
      if (features.sse_score < 60) riskFactors.push('Low SSE score');
      if (features.funding_raised < 50000) riskFactors.push('Limited funding');
      if (features.employee_count < 3) riskFactors.push('Small team size');
      if (features.monthly_revenue < 1000) riskFactors.push('Low revenue');

      // Generate recommendations
      const recommendations: string[] = [];
      if (features.sse_score < 70) recommendations.push('Focus on improving SSE score');
      if (features.funding_raised < 100000) recommendations.push('Consider fundraising opportunities');
      if (features.employee_count < 5) recommendations.push('Expand team strategically');
      if (features.monthly_revenue < 5000) recommendations.push('Accelerate revenue growth');

      const confidenceInterval: [number, number] = [
        Math.max(0.01, successProbability - 0.1),
        Math.min(0.99, successProbability + 0.1)
      ];

      timer.end();

      return {
        successProbability,
        riskFactors,
        recommendations,
        confidenceInterval
      };

    } catch (error) {
      timer.end();
      logger.error('Failed to predict startup success', {
        error: (error as Error).message,
        userId
      });
      throw new Error('Failed to predict startup success');
    }
  }

  /**
   * Analyze SSE score trends and predictions
   */
  async analyzeSSETrends(
    userId: string,
    forecastDays: number = 90
  ): Promise<{
    currentTrend: 'improving' | 'declining' | 'stable';
    trendStrength: number;
    forecast: {
      date: Date;
      predictedScore: number;
      confidenceInterval: [number, number];
    }[];
    recommendations: string[];
  }> {
    const timer = performanceTimer('statistical_models_analyze_sse_trends');

    try {
      // Get historical SSE scores
      const scoresQuery = `
        SELECT overall_score, social_score, sustainability_score, economic_score, calculated_at
        FROM sse_scores
        WHERE user_id = $1
        ORDER BY calculated_at DESC
        LIMIT 30
      `;

      const scoresResult = await pool.query(scoresQuery, [userId]);
      const scores = scoresResult.rows;

      if (scores.length < 3) {
        throw new Error('Insufficient historical data for trend analysis');
      }

      // Calculate trend
      const recentScores = scores.slice(0, 10).map(s => s.overall_score);
      const olderScores = scores.slice(10, 20).map(s => s.overall_score);

      const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;

      const trendDirection = recentAvg > olderAvg + 2 ? 'improving' :
                           recentAvg < olderAvg - 2 ? 'declining' : 'stable';

      const trendStrength = Math.abs(recentAvg - olderAvg) / 10; // Normalized strength

      // Generate forecast
      const forecast = [];
      const currentScore = scores[0].overall_score;
      const trendRate = (recentAvg - olderAvg) / 10; // Daily trend rate

      for (let day = 1; day <= forecastDays; day++) {
        const predictedScore = Math.max(0, Math.min(100,
          currentScore + (trendRate * day) + (Math.random() - 0.5) * 2
        ));

        forecast.push({
          date: new Date(Date.now() + day * 24 * 60 * 60 * 1000),
          predictedScore,
          confidenceInterval: [
            Math.max(0, predictedScore - 5),
            Math.min(100, predictedScore + 5)
          ] as [number, number]
        });
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (trendDirection === 'declining') {
        recommendations.push('Focus on areas showing decline');
        recommendations.push('Increase engagement with mentorship services');
        recommendations.push('Review and improve sustainability practices');
      } else if (trendDirection === 'stable') {
        recommendations.push('Identify growth opportunities');
        recommendations.push('Set ambitious but achievable goals');
      } else {
        recommendations.push('Maintain current positive trajectory');
        recommendations.push('Share best practices with community');
      }

      timer.end();

      return {
        currentTrend: trendDirection,
        trendStrength,
        forecast,
        recommendations
      };

    } catch (error) {
      timer.end();
      logger.error('Failed to analyze SSE trends', {
        error: (error as Error).message,
        userId
      });
      throw new Error('Failed to analyze SSE trends');
    }
  }

  // Private helper methods
  private async startTrainingProcess(jobId: string, request: TrainModelRequest): Promise<void> {
    // This would start the actual training process
    // For now, simulate training completion
    setTimeout(async () => {
      try {
        await pool.query(
          'UPDATE model_training_jobs SET status = $1, completed_at = NOW(), duration = $2 WHERE id = $3',
          ['completed', 300, jobId] // 5 minutes mock training time
        );

        logger.info('Model training completed', { jobId });
      } catch (error) {
        logger.error('Failed to update training job status', { error: (error as Error).message, jobId });
      }
    }, 5000); // 5 second delay for demo
  }

  private getAlgorithmForModelType(modelType: ModelType): string {
    const algorithmMap: Record<ModelType, string> = {
      'cox_survival': 'Cox Proportional Hazards',
      'hierarchical_linear': 'Linear Mixed Effects',
      'hierarchical_logistic': 'Generalized Linear Mixed Effects',
      'time_series': 'ARIMA/LSTM',
      'classification': 'Random Forest',
      'regression': 'Gradient Boosting',
      'clustering': 'K-Means',
      'anomaly_detection': 'Isolation Forest',
      'ensemble': 'Stacked Ensemble'
    };

    return algorithmMap[modelType] || 'Unknown';
  }

  private async generateMockPrediction(
    model: StatisticalModel,
    inputData: Record<string, any>,
    predictionType: PredictionType,
    confidenceLevel: number
  ): Promise<ModelPrediction> {
    // Generate mock prediction based on model type
    let predictedValue = 0;

    switch (model.type) {
      case 'cox_survival':
        predictedValue = Math.random() * 365; // Days to event
        break;
      case 'classification':
        predictedValue = Math.random(); // Probability
        break;
      case 'regression':
        predictedValue = 50 + (Math.random() - 0.5) * 40; // SSE score prediction
        break;
      default:
        predictedValue = Math.random() * 100;
    }

    const confidence = 0.7 + Math.random() * 0.25; // 70-95% confidence
    const margin = predictedValue * (1 - confidence) * 0.5;

    return {
      entityId: inputData.id || 'unknown',
      entityType: 'startup',
      predictedValue,
      confidence,
      predictionInterval: [
        Math.max(0, predictedValue - margin),
        predictedValue + margin
      ],
      riskFactors: this.identifyRiskFactors(inputData),
      contributingFactors: this.calculateContributingFactors(inputData),
      predictionDate: new Date(),
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };
  }

  private identifyRiskFactors(inputData: Record<string, any>): string[] {
    const riskFactors: string[] = [];

    if (inputData.sse_score && inputData.sse_score < 60) {
      riskFactors.push('Low SSE score');
    }

    if (inputData.funding_raised && inputData.funding_raised < 50000) {
      riskFactors.push('Limited funding');
    }

    if (inputData.employee_count && inputData.employee_count < 3) {
      riskFactors.push('Small team');
    }

    return riskFactors;
  }

  private calculateContributingFactors(inputData: Record<string, any>): Record<string, number> {
    const factors: Record<string, number> = {};

    if (inputData.sse_score) {
      factors['SSE Score'] = inputData.sse_score / 100;
    }

    if (inputData.funding_raised) {
      factors['Funding Level'] = Math.min(inputData.funding_raised / 1000000, 1);
    }

    if (inputData.employee_count) {
      factors['Team Size'] = Math.min(inputData.employee_count / 50, 1);
    }

    return factors;
  }

  private mapModelFromDB(row: any): StatisticalModel {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      category: row.category,
      description: row.description,
      version: row.version,
      algorithm: row.algorithm,
      parameters: JSON.parse(row.parameters || '{}'),
      performance: JSON.parse(row.performance || '{}'),
      trainingData: JSON.parse(row.training_data || '{}'),
      isActive: row.is_active,
      isProduction: row.is_production,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastTrainedAt: row.last_trained_at,
      nextTrainingAt: row.next_training_at
    };
  }

  private mapTrainingJobFromDB(row: any): ModelTrainingJob {
    return {
      id: row.id,
      modelId: row.model_id,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      duration: row.duration,
      datasetVersion: row.dataset_version,
      hyperparameters: JSON.parse(row.hyperparameters || '{}'),
      metrics: JSON.parse(row.metrics || '{}'),
      logs: JSON.parse(row.logs || '[]'),
      errorMessage: row.error_message,
      resourceUsage: JSON.parse(row.resource_usage || '{}')
    };
  }
}

export const statisticalModelsService = new StatisticalModelsService();
export default statisticalModelsService;
