/**
 * Statistical Models Routes
 * Defines all advanced statistical modeling API endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { statisticalModelsController } from '../controllers/statistical-models.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { body, query, param, validationResult } from 'express-validator';

const router = Router();

// Simple validation middleware
const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }
  next();
};

// Validation schemas
const trainModelValidation = [
  body('modelType').isIn(['cox_survival', 'hierarchical_linear', 'hierarchical_logistic', 'time_series', 'classification', 'regression', 'clustering', 'anomaly_detection', 'ensemble']).withMessage('Valid model type is required'),
  body('category').isIn(['sse_prediction', 'churn_prediction', 'growth_forecasting', 'risk_assessment', 'performance_optimization', 'market_analysis', 'user_behavior', 'financial_modeling']).withMessage('Valid category is required'),
  body('name').isLength({ min: 3, max: 200 }).withMessage('Name must be between 3 and 200 characters'),
  body('description').isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('parameters').isObject().withMessage('Parameters object is required'),
  body('datasetId').isUUID().withMessage('Valid dataset ID is required'),
  body('evaluationConfig').isObject().withMessage('Evaluation config is required')
];

const predictValidation = [
  body('inputData').isArray().withMessage('Input data must be an array'),
  body('predictionType').optional().isIn(['point_estimate', 'interval_estimate', 'probability_distribution', 'survival_curve', 'hazard_function']).withMessage('Invalid prediction type'),
  body('confidenceLevel').optional().isFloat({ min: 0.5, max: 0.99 }).withMessage('Confidence level must be between 0.5 and 0.99'),
  body('includeUncertainty').optional().isBoolean().withMessage('Include uncertainty must be a boolean')
];

const survivalAnalysisValidation = [
  body('datasetId').isUUID().withMessage('Valid dataset ID is required'),
  body('timeVariable').isLength({ min: 1, max: 100 }).withMessage('Time variable is required'),
  body('eventVariable').isLength({ min: 1, max: 100 }).withMessage('Event variable is required'),
  body('covariates').isArray().withMessage('Covariates must be an array'),
  body('stratificationVariable').optional().isString().withMessage('Stratification variable must be a string'),
  body('confidenceLevel').optional().isFloat({ min: 0.5, max: 0.99 }).withMessage('Confidence level must be between 0.5 and 0.99')
];

const hierarchicalModelValidation = [
  body('datasetId').isUUID().withMessage('Valid dataset ID is required'),
  body('dependentVariable').isLength({ min: 1, max: 100 }).withMessage('Dependent variable is required'),
  body('fixedEffects').isArray().withMessage('Fixed effects must be an array'),
  body('randomEffects').isArray().withMessage('Random effects must be an array'),
  body('groupingVariables').isArray().withMessage('Grouping variables must be an array'),
  body('method').optional().isIn(['ml', 'reml']).withMessage('Method must be ml or reml')
];

const evaluateModelValidation = [
  body('validationDatasetId').isUUID().withMessage('Valid validation dataset ID is required'),
  body('validationType').optional().isIn(['holdout', 'cross_validation', 'time_series_split', 'bootstrap', 'monte_carlo']).withMessage('Invalid validation type'),
  body('metrics').optional().isArray().withMessage('Metrics must be an array')
];

const compareModelsValidation = [
  body('modelIds').isArray({ min: 2 }).withMessage('At least 2 model IDs are required'),
  body('modelIds.*').isUUID().withMessage('All model IDs must be valid UUIDs'),
  body('metric').isLength({ min: 1, max: 50 }).withMessage('Metric is required'),
  body('testDatasetId').optional().isUUID().withMessage('Test dataset ID must be a valid UUID')
];

const modelsQueryValidation = [
  query('type').optional().isIn(['cox_survival', 'hierarchical_linear', 'hierarchical_logistic', 'time_series', 'classification', 'regression', 'clustering', 'anomaly_detection', 'ensemble']).withMessage('Invalid model type'),
  query('category').optional().isIn(['sse_prediction', 'churn_prediction', 'growth_forecasting', 'risk_assessment', 'performance_optimization', 'market_analysis', 'user_behavior', 'financial_modeling']).withMessage('Invalid category'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
];

const featureImportanceQueryValidation = [
  query('method').optional().isIn(['permutation', 'shap', 'lime', 'built_in']).withMessage('Invalid method'),
  query('topN').optional().isInt({ min: 1, max: 50 }).withMessage('TopN must be between 1 and 50')
];

const predictionQueryValidation = [
  query('timeHorizon').optional().isInt({ min: 1, max: 1095 }).withMessage('Time horizon must be between 1 and 1095 days'),
  query('forecastDays').optional().isInt({ min: 1, max: 365 }).withMessage('Forecast days must be between 1 and 365'),
  query('modelType').optional().isIn(['cox_survival', 'hierarchical_linear', 'hierarchical_logistic', 'time_series', 'classification', 'regression', 'clustering', 'anomaly_detection', 'ensemble']).withMessage('Invalid model type'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
];

// Protected routes (authentication required)

/**
 * @route GET /api/models
 * @desc Get list of statistical models
 * @access Private
 */
router.get(
  '/',
  authenticateToken,
  modelsQueryValidation,
  validateRequest,
  statisticalModelsController.getModels
);

/**
 * @route GET /api/models/:modelId
 * @desc Get model by ID
 * @access Private
 */
router.get(
  '/:modelId',
  authenticateToken,
  [param('modelId').isUUID().withMessage('Valid model ID is required')],
  validateRequest,
  statisticalModelsController.getModelById
);

/**
 * @route POST /api/models/:modelId/predict
 * @desc Make predictions using a model
 * @access Private
 */
router.post(
  '/:modelId/predict',
  authenticateToken,
  [
    param('modelId').isUUID().withMessage('Valid model ID is required'),
    ...predictValidation
  ],
  validateRequest,
  statisticalModelsController.makePredictions
);

/**
 * @route GET /api/models/:modelId/feature-importance
 * @desc Get feature importance for a model
 * @access Private
 */
router.get(
  '/:modelId/feature-importance',
  authenticateToken,
  [
    param('modelId').isUUID().withMessage('Valid model ID is required'),
    ...featureImportanceQueryValidation
  ],
  validateRequest,
  statisticalModelsController.getFeatureImportance
);

/**
 * @route POST /api/models/:modelId/evaluate
 * @desc Evaluate model performance
 * @access Private
 */
router.post(
  '/:modelId/evaluate',
  authenticateToken,
  [
    param('modelId').isUUID().withMessage('Valid model ID is required'),
    ...evaluateModelValidation
  ],
  validateRequest,
  statisticalModelsController.evaluateModel
);

/**
 * @route GET /api/models/predictions/my
 * @desc Get user's predictions
 * @access Private
 */
router.get(
  '/predictions/my',
  authenticateToken,
  predictionQueryValidation,
  validateRequest,
  statisticalModelsController.getUserPredictions
);

/**
 * @route GET /api/models/startup-success
 * @desc Get startup success prediction for current user
 * @access Private
 */
router.get(
  '/startup-success',
  authenticateToken,
  [query('timeHorizon').optional().isInt({ min: 1, max: 1095 }).withMessage('Time horizon must be between 1 and 1095 days')],
  validateRequest,
  statisticalModelsController.getStartupSuccessPrediction
);

/**
 * @route GET /api/models/sse-trends
 * @desc Get SSE trends analysis for current user
 * @access Private
 */
router.get(
  '/sse-trends',
  authenticateToken,
  [query('forecastDays').optional().isInt({ min: 1, max: 365 }).withMessage('Forecast days must be between 1 and 365')],
  validateRequest,
  statisticalModelsController.getSSETrendsAnalysis
);

/**
 * @route GET /api/models/training/:jobId
 * @desc Get training job status
 * @access Private
 */
router.get(
  '/training/:jobId',
  authenticateToken,
  [param('jobId').isUUID().withMessage('Valid job ID is required')],
  validateRequest,
  statisticalModelsController.getTrainingJobStatus
);

// Admin routes (additional authorization would be needed)

/**
 * @route POST /api/models/train
 * @desc Train a new statistical model (admin only)
 * @access Admin
 */
router.post(
  '/train',
  authenticateToken,
  // TODO: Add admin authorization middleware
  trainModelValidation,
  validateRequest,
  statisticalModelsController.trainModel
);

/**
 * @route POST /api/models/survival-analysis
 * @desc Perform Cox survival analysis (admin only)
 * @access Admin
 */
router.post(
  '/survival-analysis',
  authenticateToken,
  // TODO: Add admin authorization middleware
  survivalAnalysisValidation,
  validateRequest,
  statisticalModelsController.performSurvivalAnalysis
);

/**
 * @route POST /api/models/hierarchical
 * @desc Build hierarchical model (admin only)
 * @access Admin
 */
router.post(
  '/hierarchical',
  authenticateToken,
  // TODO: Add admin authorization middleware
  hierarchicalModelValidation,
  validateRequest,
  statisticalModelsController.buildHierarchicalModel
);

/**
 * @route POST /api/models/compare
 * @desc Compare model performance (admin only)
 * @access Admin
 */
router.post(
  '/compare',
  authenticateToken,
  // TODO: Add admin authorization middleware
  compareModelsValidation,
  validateRequest,
  statisticalModelsController.compareModels
);

/**
 * @route GET /api/models/admin/training-jobs
 * @desc Get model training jobs (admin only)
 * @access Admin
 */
router.get(
  '/admin/training-jobs',
  authenticateToken,
  // TODO: Add admin authorization middleware
  [
    query('status').optional().isIn(['pending', 'running', 'completed', 'failed', 'cancelled', 'paused']).withMessage('Invalid status'),
    query('modelType').optional().isIn(['cox_survival', 'hierarchical_linear', 'hierarchical_logistic', 'time_series', 'classification', 'regression', 'clustering', 'anomaly_detection', 'ensemble']).withMessage('Invalid model type'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
  ],
  validateRequest,
  statisticalModelsController.getTrainingJobs
);

/**
 * @route GET /api/models/admin/performance
 * @desc Get model performance metrics (admin only)
 * @access Admin
 */
router.get(
  '/admin/performance',
  authenticateToken,
  // TODO: Add admin authorization middleware
  [
    query('modelType').optional().isIn(['cox_survival', 'hierarchical_linear', 'hierarchical_logistic', 'time_series', 'classification', 'regression', 'clustering', 'anomaly_detection', 'ensemble']).withMessage('Invalid model type'),
    query('category').optional().isIn(['sse_prediction', 'churn_prediction', 'growth_forecasting', 'risk_assessment', 'performance_optimization', 'market_analysis', 'user_behavior', 'financial_modeling']).withMessage('Invalid category'),
    query('period').optional().matches(/^\d{4}-\d{2}$/).withMessage('Period must be in YYYY-MM format')
  ],
  validateRequest,
  statisticalModelsController.getModelPerformanceMetrics
);

/**
 * @route POST /api/models/admin/retrain
 * @desc Retrain existing model (admin only)
 * @access Admin
 */
router.post(
  '/admin/retrain/:modelId',
  authenticateToken,
  // TODO: Add admin authorization middleware
  [
    param('modelId').isUUID().withMessage('Valid model ID is required'),
    body('datasetId').optional().isUUID().withMessage('Dataset ID must be a valid UUID'),
    body('hyperparameters').optional().isObject().withMessage('Hyperparameters must be an object'),
    body('forceRetrain').optional().isBoolean().withMessage('Force retrain must be a boolean')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    // TODO: Implement model retraining endpoint
    res.json({
      success: true,
      data: {
        message: 'Model retraining endpoint not implemented yet',
        modelId: req.params.modelId
      }
    });
  }
);

/**
 * @route DELETE /api/models/admin/:modelId
 * @desc Delete/deactivate model (admin only)
 * @access Admin
 */
router.delete(
  '/admin/:modelId',
  authenticateToken,
  // TODO: Add admin authorization middleware
  [param('modelId').isUUID().withMessage('Valid model ID is required')],
  validateRequest,
  async (req: Request, res: Response) => {
    // TODO: Implement model deletion endpoint
    res.json({
      success: true,
      data: {
        message: 'Model deletion endpoint not implemented yet',
        modelId: req.params.modelId
      }
    });
  }
);

/**
 * @route POST /api/models/admin/deploy/:modelId
 * @desc Deploy model to production (admin only)
 * @access Admin
 */
router.post(
  '/admin/deploy/:modelId',
  authenticateToken,
  // TODO: Add admin authorization middleware
  [
    param('modelId').isUUID().withMessage('Valid model ID is required'),
    body('environment').isIn(['staging', 'production']).withMessage('Environment must be staging or production'),
    body('scalingPolicy').optional().isObject().withMessage('Scaling policy must be an object'),
    body('monitoringConfig').optional().isObject().withMessage('Monitoring config must be an object')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    // TODO: Implement model deployment endpoint
    res.json({
      success: true,
      data: {
        message: 'Model deployment endpoint not implemented yet',
        modelId: req.params.modelId,
        environment: req.body.environment
      }
    });
  }
);

/**
 * @route GET /api/models/admin/pipelines
 * @desc Get model pipelines (admin only)
 * @access Admin
 */
router.get(
  '/admin/pipelines',
  authenticateToken,
  // TODO: Add admin authorization middleware
  [
    query('status').optional().isIn(['active', 'inactive', 'running', 'failed', 'maintenance']).withMessage('Invalid status'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    // TODO: Implement pipeline management endpoint
    res.json({
      success: true,
      data: {
        pipelines: [],
        total: 0,
        hasMore: false
      }
    });
  }
);

export default router;