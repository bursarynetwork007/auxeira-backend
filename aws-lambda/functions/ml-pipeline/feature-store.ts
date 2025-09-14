/**
 * Feature Store for ML Pipeline
 * Manages real-time and batch features for startup success prediction models
 */

import { Pool } from 'pg';
import { createClient } from 'redis';
import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';

export interface Feature {
  featureId: string;
  featureName: string;
  featureType: FeatureType;
  dataType: DataType;
  description: string;
  category: FeatureCategory;
  source: string;
  updateFrequency: UpdateFrequency;
  version: string;
  isActive: boolean;
  validationRules: ValidationRule[];
  transformations: FeatureTransformation[];
  metadata: FeatureMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export type FeatureType = 'real_time' | 'batch' | 'streaming' | 'derived' | 'aggregated';
export type DataType = 'numeric' | 'categorical' | 'boolean' | 'text' | 'timestamp' | 'json';
export type FeatureCategory =
  | 'sse_components'
  | 'behavioral'
  | 'performance'
  | 'financial'
  | 'market'
  | 'risk'
  | 'engagement'
  | 'external'
  | 'demographic'
  | 'temporal';

export type UpdateFrequency = 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'on_demand';

export interface FeatureValue {
  userId: string;
  featureId: string;
  value: any;
  timestamp: Date;
  version: string;
  confidence?: number;
  source: string;
  metadata?: Record<string, any>;
}

export interface FeatureVector {
  userId: string;
  timestamp: Date;
  features: Record<string, any>;
  version: string;
  completeness: number; // Percentage of features present
  freshness: Record<string, Date>; // Last update time for each feature
}

export interface ValidationRule {
  ruleType: 'range' | 'enum' | 'regex' | 'custom';
  parameters: Record<string, any>;
  errorMessage: string;
}

export interface FeatureTransformation {
  transformationType: 'normalize' | 'standardize' | 'log' | 'polynomial' | 'binning' | 'encoding';
  parameters: Record<string, any>;
  outputFeatureName?: string;
}

export interface FeatureMetadata {
  importance: number; // 0-1 scale
  correlations: Record<string, number>;
  statistics: FeatureStatistics;
  qualityMetrics: FeatureQualityMetrics;
  businessContext: {
    owner: string;
    stakeholders: string[];
    businessLogic: string;
    impactDescription: string;
  };
}

export interface FeatureStatistics {
  count: number;
  nullCount: number;
  uniqueCount: number;
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  percentiles?: Record<string, number>;
  distribution?: Record<string, number>;
  lastUpdated: Date;
}

export interface FeatureQualityMetrics {
  completeness: number; // % non-null values
  consistency: number; // % values passing validation
  timeliness: number; // % values updated within SLA
  accuracy: number; // % values matching ground truth
  uniqueness: number; // % unique values (for categorical)
  validity: number; // % values passing business rules
  lastAssessed: Date;
}

export interface FeatureGroup {
  groupId: string;
  groupName: string;
  description: string;
  features: string[]; // Feature IDs
  owner: string;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureLineage {
  featureId: string;
  sourceFeatures: string[];
  derivedFeatures: string[];
  transformationPipeline: string[];
  dataSource: string;
  lastUpdated: Date;
}

export class FeatureStore {
  private pgPool: Pool;
  private redis: Redis;
  private featureRegistry: Map<string, Feature> = new Map();
  private featureGroups: Map<string, FeatureGroup> = new Map();

  constructor() {
    this.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_FEATURE_DB || '2'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });
  }

  /**
   * Initialize feature store with predefined features
   */
  async initialize(): Promise<void> {
    const timer = performanceTimer('feature_store_init');

    try {
      await this.redis.connect();
      await this.createFeatureTables();
      await this.registerCoreFeatures();
      await this.createFeatureGroups();

      timer.end();

      logger.info('Feature Store initialized successfully', {
        featuresRegistered: this.featureRegistry.size,
        groupsCreated: this.featureGroups.size
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to initialize Feature Store', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Register a new feature
   */
  async registerFeature(feature: Omit<Feature, 'featureId' | 'createdAt' | 'updatedAt'>): Promise<Feature> {
    const timer = performanceTimer('feature_store_register');

    try {
      const featureId = this.generateFeatureId(feature.featureName, feature.category);

      const newFeature: Feature = {
        ...feature,
        featureId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store in database
      const query = `
        INSERT INTO features (
          feature_id, feature_name, feature_type, data_type, description,
          category, source, update_frequency, version, is_active,
          validation_rules, transformations, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      await this.pgPool.query(query, [
        newFeature.featureId,
        newFeature.featureName,
        newFeature.featureType,
        newFeature.dataType,
        newFeature.description,
        newFeature.category,
        newFeature.source,
        newFeature.updateFrequency,
        newFeature.version,
        newFeature.isActive,
        JSON.stringify(newFeature.validationRules),
        JSON.stringify(newFeature.transformations),
        JSON.stringify(newFeature.metadata),
        newFeature.createdAt,
        newFeature.updatedAt
      ]);

      // Cache in memory
      this.featureRegistry.set(featureId, newFeature);

      timer.end();

      logger.info('Feature registered successfully', {
        featureId,
        featureName: feature.featureName,
        category: feature.category
      });

      return newFeature;

    } catch (error) {
      timer.end();
      logger.error('Failed to register feature', {
        error: (error as Error).message,
        featureName: feature.featureName
      });
      throw error;
    }
  }

  /**
   * Store feature value (real-time)
   */
  async storeFeatureValue(featureValue: FeatureValue): Promise<void> {
    const timer = performanceTimer('feature_store_store_value');

    try {
      // Validate feature exists
      const feature = this.featureRegistry.get(featureValue.featureId);
      if (!feature) {
        throw new Error(`Feature not found: ${featureValue.featureId}`);
      }

      // Validate value
      await this.validateFeatureValue(feature, featureValue.value);

      // Store in Redis for real-time access
      const redisKey = `feature:${featureValue.userId}:${featureValue.featureId}`;
      const redisValue = JSON.stringify({
        value: featureValue.value,
        timestamp: featureValue.timestamp.toISOString(),
        version: featureValue.version,
        confidence: featureValue.confidence,
        source: featureValue.source,
        metadata: featureValue.metadata
      });

      await this.redis.setex(redisKey, 86400, redisValue); // 24-hour TTL

      // Store in PostgreSQL for historical data
      const query = `
        INSERT INTO feature_values (
          user_id, feature_id, value, timestamp, version, confidence, source, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (user_id, feature_id, timestamp)
        DO UPDATE SET
          value = EXCLUDED.value,
          confidence = EXCLUDED.confidence,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
      `;

      await this.pgPool.query(query, [
        featureValue.userId,
        featureValue.featureId,
        JSON.stringify(featureValue.value),
        featureValue.timestamp,
        featureValue.version,
        featureValue.confidence,
        featureValue.source,
        JSON.stringify(featureValue.metadata)
      ]);

      timer.end();

    } catch (error) {
      timer.end();
      logger.error('Failed to store feature value', {
        error: (error as Error).message,
        userId: featureValue.userId,
        featureId: featureValue.featureId
      });
      throw error;
    }
  }

  /**
   * Store multiple feature values in batch
   */
  async storeBatchFeatureValues(featureValues: FeatureValue[]): Promise<void> {
    const timer = performanceTimer('feature_store_batch_store');

    try {
      // Group by user for efficient processing
      const userGroups = this.groupFeatureValuesByUser(featureValues);

      // Process each user's features
      const promises = Object.entries(userGroups).map(async ([userId, values]) => {
        // Store in Redis pipeline
        const pipeline = this.redis.pipeline();

        values.forEach(fv => {
          const redisKey = `feature:${fv.userId}:${fv.featureId}`;
          const redisValue = JSON.stringify({
            value: fv.value,
            timestamp: fv.timestamp.toISOString(),
            version: fv.version,
            confidence: fv.confidence,
            source: fv.source,
            metadata: fv.metadata
          });
          pipeline.setex(redisKey, 86400, redisValue);
        });

        await pipeline.exec();

        // Batch insert to PostgreSQL
        await this.batchInsertFeatureValues(values);
      });

      await Promise.all(promises);

      timer.end();

      logger.info('Batch feature values stored successfully', {
        totalValues: featureValues.length,
        uniqueUsers: Object.keys(userGroups).length
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to store batch feature values', {
        error: (error as Error).message,
        valueCount: featureValues.length
      });
      throw error;
    }
  }

  /**
   * Get feature vector for a user
   */
  async getFeatureVector(
    userId: string,
    featureIds?: string[],
    timestamp?: Date
  ): Promise<FeatureVector> {
    const timer = performanceTimer('feature_store_get_vector');

    try {
      const targetFeatures = featureIds || Array.from(this.featureRegistry.keys());
      const features: Record<string, any> = {};
      const freshness: Record<string, Date> = {};
      let presentFeatures = 0;

      // Get features from Redis (real-time) first
      const pipeline = this.redis.pipeline();
      targetFeatures.forEach(featureId => {
        pipeline.get(`feature:${userId}:${featureId}`);
      });

      const redisResults = await pipeline.exec();

      // Process Redis results
      for (let i = 0; i < targetFeatures.length; i++) {
        const featureId = targetFeatures[i];
        const result = redisResults?.[i];

        if (result && result[1] && featureId) {
          try {
            const featureData = JSON.parse(result[1] as string);
            features[featureId] = featureData.value;
            freshness[featureId] = new Date(featureData.timestamp);
            presentFeatures++;
          } catch (parseError) {
            logger.warn('Failed to parse Redis feature data', {
              userId,
              featureId,
              error: (parseError as Error).message
            });
          }
        }
      }

      // Fill missing features from PostgreSQL
      const missingFeatures = targetFeatures.filter(id => !(id in features));

      if (missingFeatures.length > 0) {
        const historicalFeatures = await this.getHistoricalFeatures(
          userId,
          missingFeatures,
          timestamp
        );

        Object.assign(features, historicalFeatures.features);
        Object.assign(freshness, historicalFeatures.freshness);
        presentFeatures += Object.keys(historicalFeatures.features).length;
      }

      const completeness = (presentFeatures / targetFeatures.length) * 100;

      const featureVector: FeatureVector = {
        userId,
        timestamp: timestamp || new Date(),
        features,
        version: '1.0',
        completeness,
        freshness
      };

      timer.end();

      return featureVector;

    } catch (error) {
      timer.end();
      logger.error('Failed to get feature vector', {
        error: (error as Error).message,
        userId,
        featureCount: featureIds?.length || 'all'
      });
      throw error;
    }
  }

  /**
   * Get feature vectors for multiple users
   */
  async getBatchFeatureVectors(
    userIds: string[],
    featureIds?: string[]
  ): Promise<FeatureVector[]> {
    const timer = performanceTimer('feature_store_batch_get_vectors');

    try {
      const promises = userIds.map(userId =>
        this.getFeatureVector(userId, featureIds)
      );

      const vectors = await Promise.all(promises);

      timer.end();

      logger.info('Batch feature vectors retrieved', {
        userCount: userIds.length,
        featureCount: featureIds?.length || 'all'
      });

      return vectors;

    } catch (error) {
      timer.end();
      logger.error('Failed to get batch feature vectors', {
        error: (error as Error).message,
        userCount: userIds.length
      });
      throw error;
    }
  }

  /**
   * Get feature statistics
   */
  async getFeatureStatistics(featureId: string): Promise<FeatureStatistics> {
    const timer = performanceTimer('feature_store_get_statistics');

    try {
      const query = `
        SELECT
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE value IS NULL) as null_count,
          COUNT(DISTINCT value) as unique_count,
          AVG(CASE WHEN jsonb_typeof(value) = 'number' THEN (value)::numeric END) as mean,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY CASE WHEN jsonb_typeof(value) = 'number' THEN (value)::numeric END) as median,
          STDDEV(CASE WHEN jsonb_typeof(value) = 'number' THEN (value)::numeric END) as std,
          MIN(CASE WHEN jsonb_typeof(value) = 'number' THEN (value)::numeric END) as min,
          MAX(CASE WHEN jsonb_typeof(value) = 'number' THEN (value)::numeric END) as max
        FROM feature_values
        WHERE feature_id = $1
        AND timestamp >= NOW() - INTERVAL '30 days'
      `;

      const result = await this.pgPool.query(query, [featureId]);
      const row = result.rows[0];

      const statistics: FeatureStatistics = {
        count: parseInt(row.count),
        nullCount: parseInt(row.null_count),
        uniqueCount: parseInt(row.unique_count),
        mean: row.mean ? parseFloat(row.mean) : undefined,
        median: row.median ? parseFloat(row.median) : undefined,
        std: row.std ? parseFloat(row.std) : undefined,
        min: row.min ? parseFloat(row.min) : undefined,
        max: row.max ? parseFloat(row.max) : undefined,
        lastUpdated: new Date()
      };

      // Calculate percentiles for numeric features
      if (statistics.mean !== undefined) {
        const percentilesQuery = `
          SELECT
            PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY (value)::numeric) as p25,
            PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (value)::numeric) as p75,
            PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY (value)::numeric) as p90,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (value)::numeric) as p95,
            PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY (value)::numeric) as p99
          FROM feature_values
          WHERE feature_id = $1
          AND jsonb_typeof(value) = 'number'
          AND timestamp >= NOW() - INTERVAL '30 days'
        `;

        const percResult = await this.pgPool.query(percentilesQuery, [featureId]);
        const percRow = percResult.rows[0];

        statistics.percentiles = {
          p25: parseFloat(percRow.p25),
          p75: parseFloat(percRow.p75),
          p90: parseFloat(percRow.p90),
          p95: parseFloat(percRow.p95),
          p99: parseFloat(percRow.p99)
        };
      }

      timer.end();

      return statistics;

    } catch (error) {
      timer.end();
      logger.error('Failed to get feature statistics', {
        error: (error as Error).message,
        featureId
      });
      throw error;
    }
  }

  /**
   * Calculate feature quality metrics
   */
  async calculateFeatureQuality(featureId: string): Promise<FeatureQualityMetrics> {
    const timer = performanceTimer('feature_store_quality_metrics');

    try {
      const feature = this.featureRegistry.get(featureId);
      if (!feature) {
        throw new Error(`Feature not found: ${featureId}`);
      }

      const query = `
        SELECT
          COUNT(*) as total_count,
          COUNT(*) FILTER (WHERE value IS NOT NULL) as non_null_count,
          COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '1 day') as recent_count,
          COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '1 hour') as very_recent_count
        FROM feature_values
        WHERE feature_id = $1
        AND timestamp >= NOW() - INTERVAL '30 days'
      `;

      const result = await this.pgPool.query(query, [featureId]);
      const row = result.rows[0];

      const totalCount = parseInt(row.total_count);
      const nonNullCount = parseInt(row.non_null_count);
      const recentCount = parseInt(row.recent_count);

      // Calculate quality metrics
      const completeness = totalCount > 0 ? (nonNullCount / totalCount) * 100 : 0;
      const timeliness = this.calculateTimeliness(feature.updateFrequency, recentCount, totalCount);

      // Validate values against rules
      const consistency = await this.calculateConsistency(featureId, feature.validationRules);

      const qualityMetrics: FeatureQualityMetrics = {
        completeness,
        consistency,
        timeliness,
        accuracy: 95, // Would be calculated based on ground truth comparison
        uniqueness: totalCount > 0 ? (parseInt(row.unique_count || '0') / totalCount) * 100 : 0,
        validity: consistency, // For now, same as consistency
        lastAssessed: new Date()
      };

      timer.end();

      return qualityMetrics;

    } catch (error) {
      timer.end();
      logger.error('Failed to calculate feature quality', {
        error: (error as Error).message,
        featureId
      });
      throw error;
    }
  }

  /**
   * Create feature group
   */
  async createFeatureGroup(group: Omit<FeatureGroup, 'groupId' | 'createdAt' | 'updatedAt'>): Promise<FeatureGroup> {
    const timer = performanceTimer('feature_store_create_group');

    try {
      const groupId = this.generateGroupId(group.groupName);

      const newGroup: FeatureGroup = {
        ...group,
        groupId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const query = `
        INSERT INTO feature_groups (
          group_id, group_name, description, features, owner, tags, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      await this.pgPool.query(query, [
        newGroup.groupId,
        newGroup.groupName,
        newGroup.description,
        JSON.stringify(newGroup.features),
        newGroup.owner,
        JSON.stringify(newGroup.tags),
        newGroup.isActive,
        newGroup.createdAt,
        newGroup.updatedAt
      ]);

      this.featureGroups.set(groupId, newGroup);

      timer.end();

      logger.info('Feature group created successfully', {
        groupId,
        groupName: group.groupName,
        featureCount: group.features.length
      });

      return newGroup;

    } catch (error) {
      timer.end();
      logger.error('Failed to create feature group', {
        error: (error as Error).message,
        groupName: group.groupName
      });
      throw error;
    }
  }

  /**
   * Get features by group
   */
  async getFeaturesByGroup(groupId: string): Promise<Feature[]> {
    const group = this.featureGroups.get(groupId);
    if (!group) {
      throw new Error(`Feature group not found: ${groupId}`);
    }

    return group.features
      .map(featureId => this.featureRegistry.get(featureId))
      .filter((feature): feature is Feature => feature !== undefined);
  }

  // Private helper methods

  private async createFeatureTables(): Promise<void> {
    const createFeaturesTable = `
      CREATE TABLE IF NOT EXISTS features (
        feature_id VARCHAR(255) PRIMARY KEY,
        feature_name VARCHAR(255) NOT NULL,
        feature_type VARCHAR(50) NOT NULL,
        data_type VARCHAR(50) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        source VARCHAR(255) NOT NULL,
        update_frequency VARCHAR(50) NOT NULL,
        version VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        validation_rules JSONB DEFAULT '[]'::jsonb,
        transformations JSONB DEFAULT '[]'::jsonb,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    const createFeatureValuesTable = `
      CREATE TABLE IF NOT EXISTS feature_values (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        feature_id VARCHAR(255) NOT NULL REFERENCES features(feature_id),
        value JSONB NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        version VARCHAR(50) NOT NULL,
        confidence DECIMAL(5,4),
        source VARCHAR(255) NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, feature_id, timestamp)
      )
    `;

    const createFeatureGroupsTable = `
      CREATE TABLE IF NOT EXISTS feature_groups (
        group_id VARCHAR(255) PRIMARY KEY,
        group_name VARCHAR(255) NOT NULL,
        description TEXT,
        features JSONB NOT NULL DEFAULT '[]'::jsonb,
        owner VARCHAR(255) NOT NULL,
        tags JSONB DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_feature_values_user_id ON feature_values(user_id);
      CREATE INDEX IF NOT EXISTS idx_feature_values_feature_id ON feature_values(feature_id);
      CREATE INDEX IF NOT EXISTS idx_feature_values_timestamp ON feature_values(timestamp);
      CREATE INDEX IF NOT EXISTS idx_feature_values_user_feature ON feature_values(user_id, feature_id);
      CREATE INDEX IF NOT EXISTS idx_features_category ON features(category);
      CREATE INDEX IF NOT EXISTS idx_features_type ON features(feature_type);
    `;

    await this.pgPool.query(createFeaturesTable);
    await this.pgPool.query(createFeatureValuesTable);
    await this.pgPool.query(createFeatureGroupsTable);
    await this.pgPool.query(createIndexes);
  }

  private async registerCoreFeatures(): Promise<void> {
    const coreFeatures = this.getCoreFeatureDefinitions();

    for (const featureDef of coreFeatures) {
      try {
        await this.registerFeature(featureDef);
      } catch (error) {
        logger.warn('Failed to register core feature', {
          featureName: featureDef.featureName,
          error: (error as Error).message
        });
      }
    }
  }

  private getCoreFeatureDefinitions(): Omit<Feature, 'featureId' | 'createdAt' | 'updatedAt'>[] {
    return [
      // SSE Component Features
      {
        featureName: 'sse_score_current',
        featureType: 'real_time',
        dataType: 'numeric',
        description: 'Current SSE score (0-100)',
        category: 'sse_components',
        source: 'sse-scoring-service',
        updateFrequency: 'real_time',
        version: '1.0',
        isActive: true,
        validationRules: [
          { ruleType: 'range', parameters: { min: 0, max: 100 }, errorMessage: 'SSE score must be between 0 and 100' }
        ],
        transformations: [],
        metadata: {
          importance: 1.0,
          correlations: {},
          statistics: {} as FeatureStatistics,
          qualityMetrics: {} as FeatureQualityMetrics,
          businessContext: {
            owner: 'data-science-team',
            stakeholders: ['product', 'engineering', 'business'],
            businessLogic: 'Primary success indicator for startups',
            impactDescription: 'Core metric for all ML models and business decisions'
          }
        }
      },
      // Add more core features...
      {
        featureName: 'engagement_score_7d',
        featureType: 'streaming',
        dataType: 'numeric',
        description: '7-day rolling engagement score',
        category: 'behavioral',
        source: 'behavior-tracking',
        updateFrequency: 'hourly',
        version: '1.0',
        isActive: true,
        validationRules: [
          { ruleType: 'range', parameters: { min: 0, max: 100 }, errorMessage: 'Engagement score must be between 0 and 100' }
        ],
        transformations: [
          { transformationType: 'normalize', parameters: { method: 'min-max' } }
        ],
        metadata: {
          importance: 0.8,
          correlations: {},
          statistics: {} as FeatureStatistics,
          qualityMetrics: {} as FeatureQualityMetrics,
          businessContext: {
            owner: 'product-team',
            stakeholders: ['product', 'marketing'],
            businessLogic: 'Measures user engagement with platform',
            impactDescription: 'Key indicator of user retention and success'
          }
        }
      }
    ];
  }

  private async createFeatureGroups(): Promise<void> {
    const groups = [
      {
        groupName: 'SSE Components',
        description: 'Core SSE score components and related metrics',
        features: ['sse_score_current', 'financial_score', 'operational_score', 'market_score'],
        owner: 'data-science-team',
        tags: ['core', 'sse', 'scoring'],
        isActive: true
      },
      {
        groupName: 'Behavioral Features',
        description: 'User behavior and engagement metrics',
        features: ['engagement_score_7d', 'session_frequency', 'action_diversity'],
        owner: 'product-team',
        tags: ['behavior', 'engagement', 'user'],
        isActive: true
      }
    ];

    for (const group of groups) {
      try {
        await this.createFeatureGroup(group);
      } catch (error) {
        logger.warn('Failed to create feature group', {
          groupName: group.groupName,
          error: (error as Error).message
        });
      }
    }
  }

  private generateFeatureId(featureName: string, category: string): string {
    const timestamp = Date.now();
    const hash = this.simpleHash(featureName + category);
    return `${category}_${featureName}_${hash}_${timestamp}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }

  private generateGroupId(groupName: string): string {
    const timestamp = Date.now();
    const hash = this.simpleHash(groupName);
    return `group_${hash}_${timestamp}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private async validateFeatureValue(feature: Feature, value: any): Promise<void> {
    for (const rule of feature.validationRules) {
      switch (rule.ruleType) {
        case 'range':
          if (typeof value === 'number') {
            if (value < rule.parameters.min || value > rule.parameters.max) {
              throw new Error(rule.errorMessage);
            }
          }
          break;
        case 'enum':
          if (!rule.parameters.values.includes(value)) {
            throw new Error(rule.errorMessage);
          }
          break;
        // Add more validation rules as needed
      }
    }
  }

  private groupFeatureValuesByUser(featureValues: FeatureValue[]): Record<string, FeatureValue[]> {
    return featureValues.reduce((groups, fv) => {
      if (!groups[fv.userId]) {
        groups[fv.userId] = [];
      }
      groups[fv.userId]?.push(fv);
      return groups;
    }, {} as Record<string, FeatureValue[]>);
  }

  private async batchInsertFeatureValues(values: FeatureValue[]): Promise<void> {
    if (values.length === 0) return;

    const query = `
      INSERT INTO feature_values (
        user_id, feature_id, value, timestamp, version, confidence, source, metadata
      ) VALUES ${values.map((_, i) => `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8})`).join(', ')}
      ON CONFLICT (user_id, feature_id, timestamp)
      DO UPDATE SET
        value = EXCLUDED.value,
        confidence = EXCLUDED.confidence,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    `;

    const params = values.flatMap(fv => [
      fv.userId,
      fv.featureId,
      JSON.stringify(fv.value),
      fv.timestamp,
      fv.version,
      fv.confidence,
      fv.source,
      JSON.stringify(fv.metadata)
    ]);

    await this.pgPool.query(query, params);
  }

  private async getHistoricalFeatures(
    userId: string,
    featureIds: string[],
    timestamp?: Date
  ): Promise<{ features: Record<string, any>; freshness: Record<string, Date> }> {
    const query = `
      SELECT DISTINCT ON (feature_id)
        feature_id, value, timestamp
      FROM feature_values
      WHERE user_id = $1
      AND feature_id = ANY($2)
      ${timestamp ? 'AND timestamp <= $3' : ''}
      ORDER BY feature_id, timestamp DESC
    `;

    const params = [userId, featureIds];
    if (timestamp) {
      params.push(timestamp.toISOString());
    }

    const result = await this.pgPool.query(query, params);

    const features: Record<string, any> = {};
    const freshness: Record<string, Date> = {};

    result.rows.forEach(row => {
      try {
        features[row.feature_id] = JSON.parse(row.value);
        freshness[row.feature_id] = new Date(row.timestamp);
      } catch (error) {
        logger.warn('Failed to parse historical feature value', {
          userId,
          featureId: row.feature_id,
          error: (error as Error).message
        });
      }
    });

    return { features, freshness };
  }

  private calculateTimeliness(updateFrequency: UpdateFrequency, recentCount: number, totalCount: number): number {
    const expectedRatio = this.getExpectedRecentRatio(updateFrequency);
    const actualRatio = totalCount > 0 ? recentCount / totalCount : 0;
    return Math.min(actualRatio / expectedRatio, 1) * 100;
  }

  private getExpectedRecentRatio(updateFrequency: UpdateFrequency): number {
    switch (updateFrequency) {
      case 'real_time': return 0.8;
      case 'hourly': return 0.6;
      case 'daily': return 0.4;
      case 'weekly': return 0.2;
      case 'monthly': return 0.1;
      default: return 0.5;
    }
  }

  private async calculateConsistency(featureId: string, validationRules: ValidationRule[]): Promise<number> {
    // Implementation would validate recent values against rules
    // For now, return a placeholder
    return 95;
  }

  /**
   * Health check for feature store
   */
  async healthCheck(): Promise<{
    status: string;
    featuresRegistered: number;
    redisConnected: boolean;
    postgresConnected: boolean;
    lastFeatureUpdate: Date | null;
  }> {
    try {
      // Check Redis connection
      const redisStatus = await this.redis.ping();
      const redisConnected = redisStatus === 'PONG';

      // Check PostgreSQL connection
      const pgResult = await this.pgPool.query('SELECT 1');
      const postgresConnected = pgResult.rows.length > 0;

      // Get last feature update
      const lastUpdateQuery = `
        SELECT MAX(timestamp) as last_update
        FROM feature_values
        WHERE timestamp >= NOW() - INTERVAL '1 hour'
      `;
      const lastUpdateResult = await this.pgPool.query(lastUpdateQuery);
      const lastFeatureUpdate = lastUpdateResult.rows[0]?.last_update || null;

      return {
        status: redisConnected && postgresConnected ? 'healthy' : 'degraded',
        featuresRegistered: this.featureRegistry.size,
        redisConnected,
        postgresConnected,
        lastFeatureUpdate
      };

    } catch (error) {
      logger.error('Feature store health check failed', {
        error: (error as Error).message
      });

      return {
        status: 'unhealthy',
        featuresRegistered: this.featureRegistry.size,
        redisConnected: false,
        postgresConnected: false,
        lastFeatureUpdate: null
      };
    }
  }
}

export const featureStore = new FeatureStore();
export default featureStore;