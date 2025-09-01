-- =====================================================
-- AUXEIRA ADVANCED STATISTICAL MODELS MIGRATION
-- =====================================================
-- Database migration for advanced statistical modeling system
-- Migration: 003_advanced_statistical_models
-- Created: 2025-08-31
-- =====================================================

-- =====================================================
-- STATISTICAL MODEL DEFINITIONS
-- =====================================================

-- Statistical models table
CREATE TABLE statistical_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) NOT NULL UNIQUE,
    model_type VARCHAR(30) NOT NULL CHECK (model_type IN (
        'cox_survival', 'hierarchical_bayesian', 'time_series', 'ensemble',
        'neural_network', 'random_forest', 'gradient_boosting', 'linear_regression',
        'logistic_regression', 'svm', 'clustering', 'anomaly_detection'
    )),
    model_category VARCHAR(30) NOT NULL CHECK (model_category IN (
        'survival_analysis', 'predictive_modeling', 'risk_assessment',
        'time_series_forecasting', 'classification', 'clustering', 'anomaly_detection'
    )),
    description TEXT NOT NULL,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    algorithm_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    hyperparameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    feature_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    target_variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    performance_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    training_data_requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
    model_file_path TEXT, -- Path to serialized model file
    model_size_bytes BIGINT,
    training_duration_seconds INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_production_ready BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_trained_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for statistical models
CREATE INDEX idx_statistical_models_type ON statistical_models(model_type);
CREATE INDEX idx_statistical_models_category ON statistical_models(model_category);
CREATE INDEX idx_statistical_models_active ON statistical_models(is_active) WHERE is_active = true;
CREATE INDEX idx_statistical_models_production ON statistical_models(is_production_ready) WHERE is_production_ready = true;
CREATE INDEX idx_statistical_models_created_by ON statistical_models(created_by);
CREATE INDEX idx_statistical_models_last_trained ON statistical_models(last_trained_at DESC);

-- =====================================================
-- MODEL TRAINING AND EVALUATION
-- =====================================================

-- Model training sessions table
CREATE TABLE model_training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES statistical_models(id) ON DELETE CASCADE,
    session_name VARCHAR(100) NOT NULL,
    training_type VARCHAR(30) NOT NULL CHECK (training_type IN (
        'initial_training', 'retraining', 'fine_tuning', 'hyperparameter_optimization',
        'cross_validation', 'ensemble_training', 'transfer_learning'
    )),
    dataset_id UUID, -- Reference to training dataset
    training_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    hyperparameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    feature_selection JSONB NOT NULL DEFAULT '[]'::jsonb,
    data_preprocessing JSONB NOT NULL DEFAULT '{}'::jsonb,
    validation_strategy VARCHAR(30) NOT NULL DEFAULT 'holdout' CHECK (validation_strategy IN (
        'holdout', 'k_fold', 'stratified_k_fold', 'time_series_split', 'leave_one_out'
    )),
    training_samples INTEGER NOT NULL,
    validation_samples INTEGER NOT NULL,
    test_samples INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'completed', 'failed', 'cancelled'
    )),
    progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    current_epoch INTEGER,
    total_epochs INTEGER,
    training_loss DECIMAL(10,6),
    validation_loss DECIMAL(10,6),
    best_score DECIMAL(10,6),
    early_stopping_triggered BOOLEAN NOT NULL DEFAULT false,
    training_logs TEXT,
    error_message TEXT,
    resource_usage JSONB DEFAULT '{}'::jsonb, -- CPU, memory, GPU usage
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for model training sessions
CREATE INDEX idx_model_training_sessions_model_id ON model_training_sessions(model_id);
CREATE INDEX idx_model_training_sessions_status ON model_training_sessions(status);
CREATE INDEX idx_model_training_sessions_training_type ON model_training_sessions(training_type);
CREATE INDEX idx_model_training_sessions_started_at ON model_training_sessions(started_at DESC);
CREATE INDEX idx_model_training_sessions_best_score ON model_training_sessions(best_score DESC);

-- Model evaluation results table
CREATE TABLE model_evaluation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES statistical_models(id) ON DELETE CASCADE,
    training_session_id UUID REFERENCES model_training_sessions(id) ON DELETE SET NULL,
    evaluation_type VARCHAR(30) NOT NULL CHECK (evaluation_type IN (
        'training', 'validation', 'test', 'cross_validation', 'production_monitoring'
    )),
    dataset_description TEXT,
    sample_size INTEGER NOT NULL,
    evaluation_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    confusion_matrix JSONB, -- For classification models
    feature_importance JSONB, -- Feature importance scores
    prediction_intervals JSONB, -- For regression models
    survival_curves JSONB, -- For survival analysis
    residual_analysis JSONB, -- Residual statistics
    model_diagnostics JSONB, -- Model-specific diagnostics
    performance_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    benchmark_comparison JSONB, -- Comparison with baseline models
    statistical_significance JSONB, -- Statistical test results
    confidence_intervals JSONB, -- Confidence intervals for metrics
    evaluation_duration_seconds INTEGER,
    evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    evaluated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for model evaluation results
CREATE INDEX idx_model_evaluation_results_model_id ON model_evaluation_results(model_id);
CREATE INDEX idx_model_evaluation_results_training_session_id ON model_evaluation_results(training_session_id);
CREATE INDEX idx_model_evaluation_results_evaluation_type ON model_evaluation_results(evaluation_type);
CREATE INDEX idx_model_evaluation_results_evaluated_at ON model_evaluation_results(evaluated_at DESC);
CREATE INDEX idx_model_evaluation_results_sample_size ON model_evaluation_results(sample_size DESC);

-- =====================================================
-- COX SURVIVAL ANALYSIS
-- =====================================================

-- Cox survival models table
CREATE TABLE cox_survival_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES statistical_models(id) ON DELETE CASCADE,
    baseline_hazard JSONB NOT NULL DEFAULT '{}'::jsonb, -- Baseline hazard function
    coefficients JSONB NOT NULL DEFAULT '{}'::jsonb, -- Regression coefficients
    covariate_names TEXT[] NOT NULL, -- Names of covariates
    hazard_ratios JSONB NOT NULL DEFAULT '{}'::jsonb, -- Hazard ratios for each covariate
    confidence_intervals JSONB NOT NULL DEFAULT '{}'::jsonb, -- CI for hazard ratios
    p_values JSONB NOT NULL DEFAULT '{}'::jsonb, -- P-values for coefficients
    concordance_index DECIMAL(6,4), -- C-index for model performance
    log_likelihood DECIMAL(15,6), -- Log-likelihood of the model
    aic DECIMAL(15,6), -- Akaike Information Criterion
    bic DECIMAL(15,6), -- Bayesian Information Criterion
    partial_likelihood_ratio_test JSONB, -- Likelihood ratio test results
    proportional_hazards_test JSONB, -- Test for proportional hazards assumption
    schoenfeld_residuals JSONB, -- Schoenfeld residuals for diagnostics
    martingale_residuals JSONB, -- Martingale residuals
    deviance_residuals JSONB, -- Deviance residuals
    survival_function JSONB, -- Estimated survival function
    median_survival_time DECIMAL(10,2), -- Median survival time
    survival_probabilities JSONB, -- Survival probabilities at different time points
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for Cox survival models
CREATE INDEX idx_cox_survival_models_model_id ON cox_survival_models(model_id);
CREATE INDEX idx_cox_survival_models_concordance_index ON cox_survival_models(concordance_index DESC);
CREATE INDEX idx_cox_survival_models_median_survival ON cox_survival_models(median_survival_time DESC);

-- Survival predictions table
CREATE TABLE survival_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cox_model_id UUID NOT NULL REFERENCES cox_survival_models(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
    prediction_type VARCHAR(30) NOT NULL CHECK (prediction_type IN (
        'startup_success', 'funding_timeline', 'market_survival', 'product_lifecycle'
    )),
    input_features JSONB NOT NULL DEFAULT '{}'::jsonb,
    risk_score DECIMAL(6,4) NOT NULL, -- Risk score (0-1)
    hazard_ratio DECIMAL(10,4) NOT NULL, -- Individual hazard ratio
    survival_probability_6m DECIMAL(6,4), -- 6-month survival probability
    survival_probability_1y DECIMAL(6,4), -- 1-year survival probability
    survival_probability_2y DECIMAL(6,4), -- 2-year survival probability
    survival_probability_5y DECIMAL(6,4), -- 5-year survival probability
    median_survival_estimate DECIMAL(10,2), -- Estimated median survival time
    confidence_interval_lower DECIMAL(6,4), -- Lower CI for survival probability
    confidence_interval_upper DECIMAL(6,4), -- Upper CI for survival probability
    risk_factors JSONB DEFAULT '[]'::jsonb, -- Identified risk factors
    protective_factors JSONB DEFAULT '[]'::jsonb, -- Identified protective factors
    recommendations JSONB DEFAULT '[]'::jsonb, -- Actionable recommendations
    prediction_confidence DECIMAL(4,3) NOT NULL DEFAULT 0.85,
    model_version VARCHAR(20) NOT NULL,
    predicted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- When prediction becomes stale
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for survival predictions
CREATE INDEX idx_survival_predictions_cox_model_id ON survival_predictions(cox_model_id);
CREATE INDEX idx_survival_predictions_user_id ON survival_predictions(user_id);
CREATE INDEX idx_survival_predictions_startup_id ON survival_predictions(startup_id);
CREATE INDEX idx_survival_predictions_prediction_type ON survival_predictions(prediction_type);
CREATE INDEX idx_survival_predictions_risk_score ON survival_predictions(risk_score DESC);
CREATE INDEX idx_survival_predictions_predicted_at ON survival_predictions(predicted_at DESC);

-- =====================================================
-- HIERARCHICAL BAYESIAN MODELS
-- =====================================================

-- Hierarchical models table
CREATE TABLE hierarchical_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES statistical_models(id) ON DELETE CASCADE,
    hierarchy_structure JSONB NOT NULL DEFAULT '{}'::jsonb, -- Model hierarchy definition
    prior_distributions JSONB NOT NULL DEFAULT '{}'::jsonb, -- Prior distributions for parameters
    posterior_distributions JSONB NOT NULL DEFAULT '{}'::jsonb, -- Posterior distributions
    hyperpriors JSONB NOT NULL DEFAULT '{}'::jsonb, -- Hyperprior specifications
    mcmc_chains INTEGER NOT NULL DEFAULT 4, -- Number of MCMC chains
    mcmc_iterations INTEGER NOT NULL DEFAULT 2000, -- MCMC iterations per chain
    warmup_iterations INTEGER NOT NULL DEFAULT 1000, -- Warmup iterations
    convergence_diagnostics JSONB NOT NULL DEFAULT '{}'::jsonb, -- R-hat, ESS, etc.
    posterior_samples JSONB, -- Posterior samples (may be large)
    parameter_estimates JSONB NOT NULL DEFAULT '{}'::jsonb, -- Point estimates
    credible_intervals JSONB NOT NULL DEFAULT '{}'::jsonb, -- Credible intervals
    model_comparison JSONB, -- WAIC, LOO-CV, etc.
    posterior_predictive_checks JSONB, -- Model validation results
    trace_plots_path TEXT, -- Path to trace plot files
    diagnostic_plots_path TEXT, -- Path to diagnostic plot files
    sampling_duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for hierarchical models
CREATE INDEX idx_hierarchical_models_model_id ON hierarchical_models(model_id);
CREATE INDEX idx_hierarchical_models_mcmc_chains ON hierarchical_models(mcmc_chains);
CREATE INDEX idx_hierarchical_models_mcmc_iterations ON hierarchical_models(mcmc_iterations);

-- =====================================================
-- TIME SERIES ANALYSIS
-- =====================================================

-- Time series models table
CREATE TABLE time_series_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES statistical_models(id) ON DELETE CASCADE,
    series_type VARCHAR(30) NOT NULL CHECK (series_type IN (
        'univariate', 'multivariate', 'panel', 'hierarchical_ts'
    )),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN (
        'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'hourly', 'irregular'
    )),
    seasonality_components JSONB DEFAULT '{}'::jsonb, -- Seasonal patterns
    trend_components JSONB DEFAULT '{}'::jsonb, -- Trend analysis
    decomposition_results JSONB DEFAULT '{}'::jsonb, -- Time series decomposition
    stationarity_tests JSONB DEFAULT '{}'::jsonb, -- ADF, KPSS test results
    autocorrelation_function JSONB DEFAULT '{}'::jsonb, -- ACF values
    partial_autocorrelation JSONB DEFAULT '{}'::jsonb, -- PACF values
    model_order JSONB DEFAULT '{}'::jsonb, -- ARIMA(p,d,q) or similar orders
    coefficients JSONB DEFAULT '{}'::jsonb, -- Model coefficients
    residual_diagnostics JSONB DEFAULT '{}'::jsonb, -- Residual analysis
    forecast_accuracy JSONB DEFAULT '{}'::jsonb, -- MAE, RMSE, MAPE, etc.
    information_criteria JSONB DEFAULT '{}'::jsonb, -- AIC, BIC, HQC
    ljung_box_test JSONB, -- Ljung-Box test for residuals
    arch_test JSONB, -- ARCH test for heteroscedasticity
    jarque_bera_test JSONB, -- Normality test for residuals
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for time series models
CREATE INDEX idx_time_series_models_model_id ON time_series_models(model_id);
CREATE INDEX idx_time_series_models_series_type ON time_series_models(series_type);
CREATE INDEX idx_time_series_models_frequency ON time_series_models(frequency);

-- Time series forecasts table
CREATE TABLE time_series_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ts_model_id UUID NOT NULL REFERENCES time_series_models(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
    forecast_type VARCHAR(30) NOT NULL CHECK (forecast_type IN (
        'sse_score_trend', 'revenue_forecast', 'user_growth', 'market_share',
        'funding_timeline', 'risk_evolution', 'performance_metrics'
    )),
    forecast_horizon INTEGER NOT NULL, -- Number of periods to forecast
    forecast_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    forecast_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    point_forecasts JSONB NOT NULL DEFAULT '[]'::jsonb, -- Point forecast values
    prediction_intervals JSONB NOT NULL DEFAULT '{}'::jsonb, -- Confidence/prediction intervals
    forecast_confidence DECIMAL(4,3) NOT NULL DEFAULT 0.95,
    seasonal_adjustments JSONB DEFAULT '{}'::jsonb, -- Seasonal adjustment factors
    trend_analysis JSONB DEFAULT '{}'::jsonb, -- Trend direction and strength
    anomaly_detection JSONB DEFAULT '[]'::jsonb, -- Detected anomalies
    forecast_accuracy_metrics JSONB DEFAULT '{}'::jsonb, -- Accuracy measures
    model_uncertainty JSONB DEFAULT '{}'::jsonb, -- Model uncertainty quantification
    external_factors JSONB DEFAULT '[]'::jsonb, -- External factors considered
    scenario_analysis JSONB DEFAULT '{}'::jsonb, -- Different forecast scenarios
    forecast_version VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- When forecast becomes stale
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for time series forecasts
CREATE INDEX idx_time_series_forecasts_ts_model_id ON time_series_forecasts(ts_model_id);
CREATE INDEX idx_time_series_forecasts_user_id ON time_series_forecasts(user_id);
CREATE INDEX idx_time_series_forecasts_startup_id ON time_series_forecasts(startup_id);
CREATE INDEX idx_time_series_forecasts_forecast_type ON time_series_forecasts(forecast_type);
CREATE INDEX idx_time_series_forecasts_forecast_start ON time_series_forecasts(forecast_start_date);
CREATE INDEX idx_time_series_forecasts_created_at ON time_series_forecasts(created_at DESC);

-- =====================================================
-- FEATURE ENGINEERING AND SELECTION
-- =====================================================

-- Feature definitions table
CREATE TABLE feature_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_name VARCHAR(100) NOT NULL UNIQUE,
    feature_type VARCHAR(30) NOT NULL CHECK (feature_type IN (
        'numerical', 'categorical', 'binary', 'ordinal', 'text', 'datetime', 'derived'
    )),
    data_source VARCHAR(50) NOT NULL, -- Source table or API
    calculation_method TEXT, -- How the feature is calculated
    transformation_pipeline JSONB DEFAULT '[]'::jsonb, -- Data transformation steps
    feature_category VARCHAR(50) NOT NULL, -- Business category
    description TEXT NOT NULL,
    business_meaning TEXT, -- Business interpretation
    expected_range JSONB, -- Expected value range
    missing_value_strategy VARCHAR(30) DEFAULT 'median' CHECK (missing_value_strategy IN (
        'drop', 'median', 'mean', 'mode', 'forward_fill', 'backward_fill', 'interpolate', 'constant'
    )),
    outlier_detection_method VARCHAR(30), -- Outlier detection strategy
    encoding_method VARCHAR(30), -- For categorical features
    scaling_method VARCHAR(30), -- Feature scaling method
    importance_score DECIMAL(6,4), -- Feature importance (0-1)
    correlation_threshold DECIMAL(4,3) DEFAULT 0.95, -- Correlation threshold for removal
    variance_threshold DECIMAL(10,6) DEFAULT 0.01, -- Variance threshold for removal
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for feature definitions
CREATE INDEX idx_feature_definitions_feature_name ON feature_definitions(feature_name);
CREATE INDEX idx_feature_definitions_feature_type ON feature_definitions(feature_type);
CREATE INDEX idx_feature_definitions_data_source ON feature_definitions(data_source);
CREATE INDEX idx_feature_definitions_feature_category ON feature_definitions(feature_category);
CREATE INDEX idx_feature_definitions_importance_score ON feature_definitions(importance_score DESC);
CREATE INDEX idx_feature_definitions_active ON feature_definitions(is_active) WHERE is_active = true;

-- Feature importance analysis table
CREATE TABLE feature_importance_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES statistical_models(id) ON DELETE CASCADE,
    analysis_type VARCHAR(30) NOT NULL CHECK (analysis_type IN (
        'permutation', 'shap', 'lime', 'coefficient_based', 'tree_based', 'correlation_based'
    )),
    feature_importance_scores JSONB NOT NULL DEFAULT '{}'::jsonb, -- Feature -> importance score
    feature_rankings JSONB NOT NULL DEFAULT '[]'::jsonb, -- Ranked list of features
    shap_values JSONB, -- SHAP values for explainability
    lime_explanations JSONB, -- LIME explanations
    interaction_effects JSONB, -- Feature interaction analysis
    stability_analysis JSONB, -- Importance stability across samples
    confidence_intervals JSONB, -- CI for importance scores
    statistical_significance JSONB, -- P-values for importance
    feature_selection_recommendations JSONB DEFAULT '[]'::jsonb, -- Recommended features to keep/remove
    dimensionality_reduction_suggestions JSONB, -- PCA, t-SNE suggestions
    analysis_parameters JSONB DEFAULT '{}'::jsonb, -- Analysis configuration
    computation_time_seconds INTEGER,
    analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    analyzed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for feature importance analysis
CREATE INDEX idx_feature_importance_analysis_model_id ON feature_importance_analysis(model_id);
CREATE INDEX idx_feature_importance_analysis_analysis_type ON feature_importance_analysis(analysis_type);
CREATE INDEX idx_feature_importance_analysis_analyzed_at ON feature_importance_analysis(analyzed_at DESC);

-- =====================================================
-- MODEL PREDICTIONS AND INFERENCE
-- =====================================================

-- Model predictions table
CREATE TABLE model_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES statistical_models(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
    prediction_type VARCHAR(50) NOT NULL,
    input_features JSONB NOT NULL DEFAULT '{}'::jsonb,
    prediction_output JSONB NOT NULL DEFAULT '{}'::jsonb,
    confidence_score DECIMAL(4,3) NOT NULL DEFAULT 0.85,
    prediction_intervals JSONB, -- Confidence/prediction intervals
    feature_contributions JSONB, -- Individual feature contributions
    explanation JSONB, -- Model explanation (SHAP, LIME, etc.)
    uncertainty_quantification JSONB, -- Uncertainty measures
    model_version VARCHAR(20) NOT NULL,
    prediction_latency_ms INTEGER, -- Prediction time in milliseconds
    batch_id UUID, -- For batch predictions
    is_batch_prediction BOOLEAN NOT NULL DEFAULT false,
    feedback_score DECIMAL(3,2), -- User feedback on prediction quality
    actual_outcome JSONB, -- Actual outcome for evaluation
    prediction_error DECIMAL(10,6), -- Error when actual outcome is known
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- When prediction becomes stale
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for model predictions
CREATE INDEX idx_model_predictions_model_id ON model_predictions(model_id);
CREATE INDEX idx_model_predictions_user_id ON model_predictions(user_id);
CREATE INDEX idx_model_predictions_startup_id ON model_predictions(startup_id);
CREATE INDEX idx_model_predictions_prediction_type ON model_predictions(prediction_type);
CREATE INDEX idx_model_predictions_confidence_score ON model_predictions(confidence_score DESC);
CREATE INDEX idx_model_predictions_created_at ON model_predictions(created_at DESC);
CREATE INDEX idx_model_predictions_batch_id ON model_predictions(batch_id);

-- =====================================================
-- MODEL MONITORING AND DRIFT DETECTION
-- =====================================================

-- Model monitoring metrics table
CREATE TABLE model_monitoring_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES statistical_models(id) ON DELETE CASCADE,
    monitoring_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    monitoring_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_predictions INTEGER NOT NULL DEFAULT 0,
    average_confidence DECIMAL(4,3),
    prediction_latency_p50 INTEGER, -- 50th percentile latency
    prediction_latency_p95 INTEGER, -- 95th percentile latency
    prediction_latency_p99 INTEGER, -- 99th percentile latency
    error_rate DECIMAL(6,4), -- Prediction error rate
    data_drift_score DECIMAL(6,4), -- Data drift detection score
    concept_drift_score DECIMAL(6,4), -- Concept drift detection score
    feature_drift_analysis JSONB DEFAULT '{}'::jsonb, -- Per-feature drift analysis
    performance_degradation DECIMAL(6,4), -- Performance degradation measure
    accuracy_metrics JSONB DEFAULT '{}'::jsonb, -- Current accuracy metrics
    baseline_comparison JSONB DEFAULT '{}'::jsonb, -- Comparison with baseline
    alert_triggers JSONB DEFAULT '[]'::jsonb, -- Triggered alerts
    recommendations JSONB DEFAULT '[]'::jsonb, -- Recommended actions
    monitoring_status VARCHAR(20) NOT NULL DEFAULT 'healthy' CHECK (monitoring_status IN (
        'healthy', 'warning', 'critical', 'degraded'
    )),
    next_retraining_recommended TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for model monitoring metrics
CREATE INDEX idx_model_monitoring_metrics_model_id ON model_monitoring_metrics(model_id);
CREATE INDEX idx_model_monitoring_metrics_period_start ON model_monitoring_metrics(monitoring_period_start DESC);
CREATE INDEX idx_model_monitoring_metrics_monitoring_status ON model_monitoring_metrics(monitoring_status);
CREATE INDEX idx_model_monitoring_metrics_data_drift_score ON model_monitoring_metrics(data_drift_score DESC);
CREATE INDEX idx_model_monitoring_metrics_performance_degradation ON model_monitoring_metrics(performance_degradation DESC);

-- =====================================================
-- CAUSAL INFERENCE AND INSTRUMENTAL VARIABLES
-- =====================================================

-- Causal inference studies table
CREATE TABLE causal_inference_studies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_name VARCHAR(100) NOT NULL,
    study_type VARCHAR(30) NOT NULL CHECK (study_type IN (
        'randomized_experiment', 'natural_experiment', 'instrumental_variables',
        'regression_discontinuity', 'difference_in_differences', 'propensity_score_matching'
    )),
    treatment_variable VARCHAR(100) NOT NULL,
    outcome_variable VARCHAR(100) NOT NULL,
    confounding_variables JSONB DEFAULT '[]'::jsonb,
    instrumental_variables JSONB DEFAULT '[]'::jsonb,
    identification_strategy TEXT NOT NULL,
    causal_assumptions JSONB DEFAULT '[]'::jsonb,
    study_design JSONB NOT NULL DEFAULT '{}'::jsonb,
    sample_selection_criteria JSONB DEFAULT '{}'::jsonb,
    data_sources JSONB DEFAULT '[]'::jsonb,
    treatment_effect_estimate DECIMAL(10,6),
    standard_error DECIMAL(10,6),
    confidence_interval_lower DECIMAL(10,6),
    confidence_interval_upper DECIMAL(10,6),
    p_value DECIMAL(10,8),
    effect_size VARCHAR(20), -- small, medium, large
    statistical_power DECIMAL(4,3),
    robustness_checks JSONB DEFAULT '[]'::jsonb,
    sensitivity_analysis JSONB DEFAULT '{}'::jsonb,
    heterogeneous_effects JSONB DEFAULT '{}'::jsonb,
    mechanism_analysis JSONB DEFAULT '{}'::jsonb,
    external_validity JSONB DEFAULT '{}'::jsonb,
    policy_implications TEXT,
    limitations TEXT,
    study_status VARCHAR(20) NOT NULL DEFAULT 'planning' CHECK (study_status IN (
        'planning', 'data_collection', 'analysis', 'completed', 'published'
    )),
    conducted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for causal inference studies
CREATE INDEX idx_causal_inference_studies_study_type ON causal_inference_studies(study_type);
CREATE INDEX idx_causal_inference_studies_treatment_variable ON causal_inference_studies(treatment_variable);
CREATE INDEX idx_causal_inference_studies_outcome_variable ON causal_inference_studies(outcome_variable);
CREATE INDEX idx_causal_inference_studies_study_status ON causal_inference_studies(study_status);
CREATE INDEX idx_causal_inference_studies_conducted_by ON causal_inference_studies(conducted_by);
CREATE INDEX idx_causal_inference_studies_created_at ON causal_inference_studies(created_at DESC);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Apply timestamp triggers to statistical models tables
CREATE TRIGGER update_statistical_models_timestamp
    BEFORE UPDATE ON statistical_models
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_cox_survival_models_timestamp
    BEFORE UPDATE ON cox_survival_models
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_hierarchical_models_timestamp
    BEFORE UPDATE ON hierarchical_models
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_time_series_models_timestamp
    BEFORE UPDATE ON time_series_models
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_feature_definitions_timestamp
    BEFORE UPDATE ON feature_definitions
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_causal_inference_studies_timestamp
    BEFORE UPDATE ON causal_inference_studies
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- =====================================================
-- INITIAL DATA FOR STATISTICAL MODELS
-- =====================================================

-- Insert default statistical models
INSERT INTO statistical_models (model_name, model_type, model_category, description, algorithm_details, hyperparameters, feature_requirements, target_variables, is_active) VALUES
('SSE Survival Analysis', 'cox_survival', 'survival_analysis', 'Cox proportional hazards model for startup survival analysis',
 '{"algorithm": "cox_ph", "implementation": "lifelines", "regularization": "elastic_net"}'::jsonb,
 '{"alpha": 0.1, "l1_ratio": 0.5, "max_iter": 1000}'::jsonb,
 '["sse_score", "funding_amount", "team_size", "industry", "stage", "location"]'::jsonb,
 '["time_to_event", "event_occurred"]'::jsonb, true),

('SSE Score Prediction', 'ensemble', 'predictive_modeling', 'Ensemble model for predicting SSE scores',
 '{"base_models": ["random_forest", "gradient_boosting", "neural_network"], "meta_learner": "linear_regression"}'::jsonb,
 '{"n_estimators": 100, "max_depth": 10, "learning_rate": 0.1}'::jsonb,
 '["company_metrics", "team_metrics", "market_metrics", "financial_metrics"]'::jsonb,
 '["sse_score"]'::jsonb, true),

('Revenue Forecasting', 'time_series', 'time_series_forecasting', 'ARIMA-based revenue forecasting model',
 '{"model_type": "SARIMAX", "seasonal": true, "exogenous_variables": true}'::jsonb,
 '{"order": [2, 1, 2], "seasonal_order": [1, 1, 1, 12]}'::jsonb,
 '["historical_revenue", "market_indicators", "seasonal_factors"]'::jsonb,
 '["future_revenue"]'::jsonb, true),

('Risk Assessment', 'hierarchical_bayesian', 'risk_assessment', 'Hierarchical Bayesian model for startup risk assessment',
 '{"hierarchy_levels": ["industry", "stage", "location"], "prior_type": "weakly_informative"}'::jsonb,
 '{"chains": 4, "iterations": 2000, "warmup": 1000}'::jsonb,
 '["financial_health", "market_position", "team_quality", "product_readiness"]'::jsonb,
 '["risk_score", "risk_category"]'::jsonb, true);

-- Insert default feature definitions
INSERT INTO feature_definitions (feature_name, feature_type, data_source, calculation_method, feature_category, description, business_meaning, is_active) VALUES
('sse_score', 'numerical', 'sse_scores', 'current_score', 'performance', 'Current SSE score', 'Overall startup evaluation score', true),
('funding_amount', 'numerical', 'startups', 'funding_raised', 'financial', 'Total funding raised', 'Financial resources available', true),
('team_size', 'numerical', 'startups', 'team_size', 'team', 'Number of team members', 'Human capital and organizational capacity', true),
('company_age_days', 'numerical', 'startups', 'EXTRACT(EPOCH FROM (CURRENT_DATE - founded_date))/86400', 'temporal', 'Company age in days', 'Maturity and experience level', true),
('industry_category', 'categorical', 'startups', 'industry', 'market', 'Industry classification', 'Market sector and competitive landscape', true),
('stage_ordinal', 'ordinal', 'startups', 'CASE stage WHEN ''idea'' THEN 1 WHEN ''prototype'' THEN 2 WHEN ''mvp'' THEN 3 WHEN ''early_revenue'' THEN 4 WHEN ''growth'' THEN 5 WHEN ''scale'' THEN 6 END', 'development', 'Development stage as ordinal', 'Business development maturity', true),
('revenue_growth_rate', 'numerical', 'derived', 'calculated from revenue history', 'financial', 'Monthly revenue growth rate', 'Business momentum and scalability', true),
('user_engagement_score', 'numerical', 'derived', 'calculated from user activity', 'product', 'User engagement metrics', 'Product-market fit indicator', true);

-- Record migration
INSERT INTO schema_migrations (version, description) VALUES
('003_advanced_statistical_models', 'Advanced statistical modeling system with Cox survival analysis, hierarchical models, and causal inference');
