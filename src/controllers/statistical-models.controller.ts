/**
 * Statistical Models Controller
 * Handles all advanced statistical modeling API endpoints
 */

import { Request, Response } from 'express';
import { statisticalModelsService } from '../services/statistical-models.service';
import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';
import {
  TrainModelRequest,
  PredictRequest,
  SurvivalAnalysisRequest,
  HierarchicalModelRequest,
  ModelValidationRequest,
  ModelType,
  ModelCategory,
  PredictionType
} from '../types/statistical-models.types';

export class StatisticalModelsController {
  /**
   * Train a new statistical model
   * POST /api/models/train
   */
  async trainModel(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('statistical_models_controller_train');

    try {
      const request: TrainModelRequest = req.body;

      if (!request.modelType || !request.name || !request.parameters) {
        res.status(400).json({ error: 'Model type, name, and parameters are required' });
        return;
      }

      const trainingJob = await statisticalModelsService.trainModel(request);

      timer.end();

      res.status(201).json({
        success: true,
        data: {
          trainingJob,
          message: 'Model training started successfully'
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to start model training', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to start model training' });
    }
  }

  /**
   * Get models list
   * GET /api/models
   */
  async getModels(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('statistical_models_controller_get_models');

    try {
      const {
        type,
        category,
        isActive,
        limit,
        offset
      } = req.query;

      const result = await statisticalModelsService.getModels(
        type as ModelType,
        category as ModelCategory,
        isActive === 'true',
        limit ? Number(limit) : undefined,
        offset ? Number(offset) : undefined
      );

      timer.end();

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get models', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to get models' });
    }
  }

  /**
   * Get model by ID
   * GET /api/models/:modelId
   */
  async getModelById(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('statistical_models_controller_get_by_id');

    try {
      const { modelId } = req.params;

      if (!modelId) {
        res.status(400).json({ error: 'Model ID is required' });
        return;
      }

      const model = await statisticalModelsService.getModelById(modelId);

      if (!model) {
        res.status(404).json({ error: 'Model not found' });
        return;
      }

      timer.end();

      res.json({
        success: true,
        data: model
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get model by ID', {
        error: (error as Error).message,
        modelId: req.params.modelId
      });
      res.status(500).json({ error: 'Failed to get model' });
    }
  }

  /**
   * Make predictions using a model
   * POST /api/models/:modelId/predict
   */
  async makePredictions(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('statistical_models_controller_predict');

    try {
      const { modelId } = req.params;
      const {
        inputData,
        predictionType,
        confidenceLevel,
        includeUncertainty
      } = req.body;

      if (!modelId || !inputData) {
        res.status(400).json({ error: 'Model ID and input data are required' });
        return;
      }

      const request: PredictRequest = {
        modelId,
        inputData: Array.isArray(inputData) ? inputData : [inputData],
        predictionType: predictionType as PredictionType,
        confidenceLevel,
        includeUncertainty
      };

      const predictions = await statisticalModelsService.makePredictions(request);

      timer.end();

      res.json({
        success: true,
        data: {
          predictions,
          count: predictions.length,
          modelId
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to make predictions', {
        error: (error as Error).message,
        modelId: req.params.modelId
      });
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Perform Cox survival analysis
   * POST /api/models/survival-analysis
   */
  async performSurvivalAnalysis(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('statistical_models_controller_survival_analysis');

    try {
      const request: SurvivalAnalysisRequest = req.body;

      if (!request.datasetId || !request.timeVariable || !request.eventVariable) {
        res.status(400).json({
          error: 'Dataset ID, time variable, and event variable are required'
        });
        return;
      }

      const survivalModel = await statisticalModelsService.performSurvivalAnalysis(request);

      timer.end();

      res.json({
        success: true,
        data: {
          survivalModel,
          message: 'Survival analysis completed successfully'
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to perform survival analysis', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to perform survival analysis' });
    }
  }

  /**
   * Build hierarchical model
   * POST /api/models/hierarchical
   */
  async buildHierarchicalModel(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('statistical_models_controller_hierarchical');

    try {
      const request: HierarchicalModelRequest = req.body;

      if (!request.datasetId || !request.dependentVariable || !request.fixedEffects) {
        res.status(400).json({
          error: 'Dataset ID, dependent variable, and fixed effects are required'
        });
        return;
      }

      const hierarchicalModel = await statisticalModelsService.buildHierarchicalModel(request);

      timer.end();

      res.json({
        success: true,
        data: {
          hierarchicalModel,
          message: 'Hierarchical model built successfully'
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to build hierarchical model', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to build hierarchical model' });
    }
  }

  /**
   * Evaluate model performance
   * POST /api/models/:modelId/evaluate
   */
  async evaluateModel(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('statistical_models_controller_evaluate');

    try {
      const { modelId } = req.params;
      const {
        validationDatasetId,
        validationType,
        metrics
      } = req.body;

      if (!modelId || !validationDatasetId) {
        res.status(400).json({ error: 'Model ID and validation dataset ID are required' });
        return;
      }

      const request: ModelValidationRequest = {
        modelId,
        validationDatasetId,
        validationType: validationType || 'holdout',
        metrics: metrics || ['accuracy', 'precision', 'recall', 'f1Score']
      };

      const evaluation = await statisticalModelsService.evaluateModel(request);

      timer.end();

      res.json({
        success: true,
        data: evaluation
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to evaluate model', {
        error: (error as Error).message,
        modelId: req.params.modelId
      });
      res.status(500).json({ error: 'Failed to evaluate model' });
    }
  }

  /**
   * Get training job status
   * GET /api/models/training/:jobId
   */
  async getTrainingJobStatus(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('statistical_models_controller_get_training_status');

    try {
      const { jobId } = req.params;

      if (!jobId) {
        res.status(400).json({ error: 'Job ID is required' });
        return;
      }

      const trainingJob = await statisticalModelsService.getTrainingJobStatus(jobId);

      if (!trainingJob) {
        res.status(404).json({ error: 'Training job not found' });
        return;
      }

      timer.end();

      res.json({
        success: true,
        data: trainingJob
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get training job status', {
        error: (error as Error).message,
        jobId: req.params.jobId
      });
      res.status(500).json({ error: 'Failed to get training job status' });
    }
  }

  /**
   * Predict startup success probability
   * GET /api/models/predict/startup-success
   */
  async predictStartupSuccess(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('statistical_models_controller_predict_success');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { timeHorizon } = req.query;

      const prediction = await statisticalModelsService.predictStartupSuccess(
        userId,
        timeHorizon ? Number(timeHorizon) : undefined
      );

      timer.end();

      res.json({
        success: true,
        data: prediction
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to predict startup success', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Analyze SSE score trends
   * GET /api/models/analyze/sse-trends
   */
  async analyzeSSETrends(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('statistical_models_controller_analyze_sse_trends');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { forecastDays } = req.query;

      const analysis = await statisticalModelsService.analyzeSSETrends(
        userId,
        forecastDays ? Number(forecastDays) : undefined
      );

      timer.end();

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to analyze SSE trends', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get model performance comparison
   * POST /api/models/compare
   */
  async compareModels(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('statistical_models_controller_compare');

    try {
      const { modelIds, metric, testDatasetId } = req.body;

      if (!modelIds || !Array.isArray(modelIds) || modelIds.length < 2) {
        res.status(400).json({ error: 'At least 2 model IDs are required for comparison' });
        return;
      }

      // This would need to be implemented in the service
      const comparison = {
        models: modelIds.map((id: string, index: number) => ({
          modelId: id,
          name: `Model ${index + 1}`,
          performance: {
            [metric || 'accuracy']: 0.8 + Math.random() * 0.15
          },
          rank: index + 1
        })),
        bestModel: modelIds[0],
        comparisonMetric: metric || 'accuracy'
      };

      timer.end();

      res.json({
        success: true,
        data: comparison
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to compare models', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to compare models' });
    }
  }

  /**
   * Get feature importance for a model
   * GET /api/models/:modelId/feature-importance
   */
  async getFeatureImportance(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('statistical_models_controller_feature_importance');

    try {
      const { modelId } = req.params;
      const { method, topN } = req.query;

      if (!modelId) {
        res.status(400).json({ error: 'Model ID is required' });
        return;
      }

      // This would need to be implemented in the service
      const featureImportance = {
        modelId,
        method: method || 'built_in',
        features: [
          { name: 'sse_score', importance: 0.35, rank: 1, description: 'Overall SSE performance score' },
          { name: 'funding_raised', importance: 0.25, rank: 2, description: 'Total funding raised' },
          { name: 'employee_count', importance: 0.20, rank: 3, description: 'Number of employees' },
          { name: 'monthly_revenue', importance: 0.15, rank: 4, description: 'Monthly recurring revenue' },
          { name: 'industry', importance: 0.05, rank: 5, description: 'Industry sector' }
        ].slice(0, topN ? Number(topN) : 10),
        totalImportance: 1.0,
        generatedAt: new Date()
      };

      timer.end();

      res.json({
        success: true,
        data: featureImportance
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get feature importance', {
        error: (error as Error).message,
        modelId: req.params.modelId
      });
      res.status(500).json({ error: 'Failed to get feature importance' });
    }
  }

  /**
   * Get model predictions for user
   * GET /api/models/predictions/my
   */
  async getUserPredictions(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('statistical_models_controller_get_user_predictions');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { modelType, limit, offset } = req.query;

      // Get user's recent predictions
      let whereClause = 'WHERE entity_id = $1';
      const params: any[] = [userId];
      let paramCount = 1;

      if (modelType) {
        whereClause += ` AND m.type = $${++paramCount}`;
        params.push(modelType);
      }

      const query = `
        SELECT p.*, m.name as model_name, m.type as model_type
        FROM model_predictions p
        JOIN statistical_models m ON p.model_id = m.id
        ${whereClause}
        ORDER BY p.prediction_date DESC
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;

      params.push(limit ? Number(limit) : 20, offset ? Number(offset) : 0);

      const result = await pool.query(query, params);
      const predictions = result.rows.map(row => ({
        id: row.id,
        modelId: row.model_id,
        modelName: row.model_name,
        modelType: row.model_type,
        predictedValue: row.predicted_value,
        confidence: row.confidence,
        predictionInterval: JSON.parse(row.prediction_interval || '[]'),
        riskFactors: JSON.parse(row.risk_factors || '[]'),
        contributingFactors: JSON.parse(row.contributing_factors || '{}'),
        predictionDate: row.prediction_date,
        targetDate: row.target_date
      }));

      timer.end();

      res.json({
        success: true,
        data: {
          predictions,
          total: predictions.length,
          hasMore: predictions.length === (limit ? Number(limit) : 20)
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get user predictions', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to get predictions' });
    }
  }

  /**
   * Get startup success prediction for current user
   * GET /api/models/startup-success
   */
  async getStartupSuccessPrediction(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('statistical_models_controller_startup_success');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { timeHorizon } = req.query;

      const prediction = await statisticalModelsService.predictStartupSuccess(
        userId,
        timeHorizon ? Number(timeHorizon) : undefined
      );

      timer.end();

      res.json({
        success: true,
        data: prediction
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get startup success prediction', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get SSE trends analysis for current user
   * GET /api/models/sse-trends
   */
  async getSSETrendsAnalysis(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('statistical_models_controller_sse_trends');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { forecastDays } = req.query;

      const analysis = await statisticalModelsService.analyzeSSETrends(
        userId,
        forecastDays ? Number(forecastDays) : undefined
      );

      timer.end();

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get SSE trends analysis', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get model training jobs (Admin only)
   * GET /api/models/admin/training-jobs
   */
  async getTrainingJobs(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('statistical_models_controller_get_training_jobs');

    try {
      // TODO: Add admin authorization check
      const { status, modelType, limit, offset } = req.query;

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramCount = 0;

      if (status) {
        whereClause += ` AND j.status = $${++paramCount}`;
        params.push(status);
      }

      if (modelType) {
        whereClause += ` AND m.type = $${++paramCount}`;
        params.push(modelType);
      }

      const query = `
        SELECT j.*, m.name as model_name, m.type as model_type
        FROM model_training_jobs j
        JOIN statistical_models m ON j.model_id = m.id
        ${whereClause}
        ORDER BY j.started_at DESC
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;

      params.push(limit ? Number(limit) : 20, offset ? Number(offset) : 0);

      const result = await pool.query(query, params);
      const jobs = result.rows.map(row => ({
        ...this.mapTrainingJobFromDB(row),
        modelName: row.model_name,
        modelType: row.model_type
      }));

      timer.end();

      res.json({
        success: true,
        data: {
          jobs,
          total: jobs.length,
          hasMore: jobs.length === (limit ? Number(limit) : 20)
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get training jobs', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to get training jobs' });
    }
  }

  /**
   * Get model performance metrics (Admin only)
   * GET /api/models/admin/performance
   */
  async getModelPerformanceMetrics(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('statistical_models_controller_performance_metrics');

    try {
      // TODO: Add admin authorization check
      const { modelType, category, period } = req.query;

      // This would aggregate performance metrics across models
      const metrics = {
        totalModels: 0,
        activeModels: 0,
        trainingJobs: {
          total: 0,
          completed: 0,
          failed: 0,
          running: 0
        },
        averagePerformance: {
          accuracy: 0.85,
          precision: 0.82,
          recall: 0.78,
          f1Score: 0.80
        },
        modelsByType: {},
        modelsByCategory: {},
        recentActivity: []
      };

      timer.end();

      res.json({
        success: true,
        data: metrics
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get model performance metrics', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to get performance metrics' });
    }
  }

  // Private helper methods
  private mapTrainingJobFromDB(row: any): any {
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

export const statisticalModelsController = new StatisticalModelsController();
export default statisticalModelsController;
