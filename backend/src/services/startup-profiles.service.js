/**
 * Startup Profiles Service - DynamoDB Implementation
 * Provides access to 10,000 startup profiles with 365-day rolling feed
 */

// Use AWS SDK v3 which is available in Node.js 18+ Lambda runtime
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

const PROFILES_TABLE = 'auxeira-startup-profiles-prod';
const ACTIVITIES_TABLE = 'auxeira-startup-activities-prod';

class StartupProfilesService {
    /**
     * List startup profiles with pagination and filters
     */
    async listProfiles(params = {}) {
        const {
            page = 1,
            limit = 50,
            stage,
            industry,
            minSse,
            maxSse,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = params;

        try {
            const scanParams = {
                TableName: PROFILES_TABLE,
                Limit: Math.min(limit, 100)
            };

            // Add filter expressions
            const filterExpressions = [];
            const expressionAttributeValues = {};
            const expressionAttributeNames = {};

            if (stage) {
                filterExpressions.push('#stage = :stage');
                expressionAttributeNames['#stage'] = 'fundingStage';
                expressionAttributeValues[':stage'] = stage;
            }

            if (industry) {
                filterExpressions.push('#sector = :sector');
                expressionAttributeNames['#sector'] = 'sector';
                expressionAttributeValues[':sector'] = industry;
            }

            if (minSse) {
                filterExpressions.push('sseScore >= :minSse');
                expressionAttributeValues[':minSse'] = parseInt(minSse);
            }

            if (maxSse) {
                filterExpressions.push('sseScore <= :maxSse');
                expressionAttributeValues[':maxSse'] = parseInt(maxSse);
            }

            if (filterExpressions.length > 0) {
                scanParams.FilterExpression = filterExpressions.join(' AND ');
                scanParams.ExpressionAttributeValues = expressionAttributeValues;
                if (Object.keys(expressionAttributeNames).length > 0) {
                    scanParams.ExpressionAttributeNames = expressionAttributeNames;
                }
            }

            // Handle pagination
            if (page > 1 && params.lastEvaluatedKey) {
                scanParams.ExclusiveStartKey = JSON.parse(
                    Buffer.from(params.lastEvaluatedKey, 'base64').toString()
                );
            }

            const result = await dynamodb.send(new ScanCommand(scanParams));

            // Sort results (DynamoDB doesn't support sorting on scan)
            let profiles = result.Items || [];
            profiles.sort((a, b) => {
                const aVal = a[sortBy] || 0;
                const bVal = b[sortBy] || 0;
                return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
            });

            // Create pagination token
            const nextKey = result.LastEvaluatedKey
                ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
                : null;

            return {
                success: true,
                data: {
                    profiles: profiles.map(this.formatProfile),
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        hasNext: !!result.LastEvaluatedKey,
                        hasPrev: page > 1,
                        nextKey
                    }
                }
            };
        } catch (error) {
            console.error('Error listing profiles:', error);
            throw error;
        }
    }

    /**
     * Get single startup profile
     */
    async getProfile(profileId, options = {}) {
        try {
            const result = await dynamodb.send(new GetCommand({
                TableName: PROFILES_TABLE,
                Key: { startupId: profileId }
            }));

            if (!result.Item) {
                return {
                    success: false,
                    error: 'Profile not found'
                };
            }

            const profile = this.formatProfile(result.Item);

            // Include history if requested
            if (options.include_history) {
                profile.sseHistory = result.Item.sseHistory || [];
            }

            // Include metrics if requested
            if (options.include_metrics) {
                profile.metricsHistory = await this.getProfileMetrics(profileId, { days: 180 });
            }

            return {
                success: true,
                data: profile
            };
        } catch (error) {
            console.error('Error getting profile:', error);
            throw error;
        }
    }

    /**
     * Get activity feed with 365-day rolling window (default) or 5-year toggle
     */
    async getActivityFeed(params = {}) {
        const {
            days = 365,  // Default 365-day rolling feed
            page = 1,
            limit = 50,
            profileId,
            activityType,
            industry
        } = params;

        try {
            // Calculate date threshold
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - days);
            const thresholdTimestamp = dateThreshold.getTime();

            const scanParams = {
                TableName: ACTIVITIES_TABLE,
                Limit: Math.min(limit, 100)
            };

            // Build filter expression
            const filterExpressions = ['#timestamp >= :threshold'];
            const expressionAttributeValues = {
                ':threshold': thresholdTimestamp
            };
            const expressionAttributeNames = {
                '#timestamp': 'timestamp'
            };

            if (profileId) {
                filterExpressions.push('startupId = :profileId');
                expressionAttributeValues[':profileId'] = profileId;
            }

            if (activityType) {
                filterExpressions.push('activityType = :activityType');
                expressionAttributeValues[':activityType'] = activityType;
            }

            if (industry) {
                filterExpressions.push('industry = :industry');
                expressionAttributeValues[':industry'] = industry;
            }

            scanParams.FilterExpression = filterExpressions.join(' AND ');
            scanParams.ExpressionAttributeValues = expressionAttributeValues;
            scanParams.ExpressionAttributeNames = expressionAttributeNames;

            // Handle pagination
            if (page > 1 && params.lastEvaluatedKey) {
                scanParams.ExclusiveStartKey = JSON.parse(
                    Buffer.from(params.lastEvaluatedKey, 'base64').toString()
                );
            }

            const result = await dynamodb.send(new ScanCommand(scanParams));

            // Sort by timestamp descending
            let activities = result.Items || [];
            activities.sort((a, b) => b.timestamp - a.timestamp);

            // Create pagination token
            const nextKey = result.LastEvaluatedKey
                ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
                : null;

            return {
                success: true,
                data: {
                    activities: activities.map(this.formatActivity),
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: activities.length,
                        hasNext: !!result.LastEvaluatedKey,
                        hasPrev: page > 1,
                        nextKey
                    },
                    timeRange: {
                        days: parseInt(days),
                        isDefault: days === 365,
                        isFiveYear: days >= 1825
                    }
                }
            };
        } catch (error) {
            console.error('Error getting activity feed:', error);
            throw error;
        }
    }

    /**
     * Get activities for specific profile
     */
    async getProfileActivities(profileId, options = {}) {
        const { days = 365, limit = 50 } = options;

        try {
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - days);
            const thresholdTimestamp = dateThreshold.getTime();

            const result = await dynamodb.send(new QueryCommand({
                TableName: ACTIVITIES_TABLE,
                IndexName: 'startupId-timestamp-index',
                KeyConditionExpression: 'startupId = :profileId AND #timestamp >= :threshold',
                ExpressionAttributeNames: {
                    '#timestamp': 'timestamp'
                },
                ExpressionAttributeValues: {
                    ':profileId': profileId,
                    ':threshold': thresholdTimestamp
                },
                Limit: Math.min(limit, 100),
                ScanIndexForward: false  // Sort descending
            }));

            return {
                success: true,
                data: {
                    profileId,
                    activities: (result.Items || []).map(this.formatActivity),
                    count: result.Items?.length || 0,
                    timeRange: {
                        days: parseInt(days),
                        isDefault: days === 365,
                        isFiveYear: days >= 1825
                    }
                }
            };
        } catch (error) {
            console.error('Error getting profile activities:', error);
            throw error;
        }
    }

    /**
     * Get profile metrics history
     */
    async getProfileMetrics(profileId, options = {}) {
        const { days = 365, metricName, metricType } = options;

        try {
            const profile = await dynamodb.send(new GetCommand({
                TableName: PROFILES_TABLE,
                Key: { startupId: profileId }
            }));

            if (!profile.Item) {
                return {
                    success: false,
                    error: 'Profile not found'
                };
            }

            // Get metrics from profile history
            const metricsHistory = profile.Item.metricsHistory || [];
            
            // Filter by date
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - days);
            const thresholdTimestamp = dateThreshold.getTime();

            let filteredMetrics = metricsHistory.filter(m => 
                new Date(m.date).getTime() >= thresholdTimestamp
            );

            // Filter by metric name if specified
            if (metricName) {
                filteredMetrics = filteredMetrics.filter(m => m.name === metricName);
            }

            // Filter by metric type if specified
            if (metricType) {
                filteredMetrics = filteredMetrics.filter(m => m.type === metricType);
            }

            // Group by metric name
            const metricsByName = {};
            filteredMetrics.forEach(metric => {
                if (!metricsByName[metric.name]) {
                    metricsByName[metric.name] = [];
                }
                metricsByName[metric.name].push({
                    date: metric.date,
                    value: metric.value,
                    type: metric.type
                });
            });

            return {
                success: true,
                data: {
                    profileId,
                    metrics: filteredMetrics,
                    metricsByName,
                    count: filteredMetrics.length,
                    timeRange: {
                        days: parseInt(days),
                        isDefault: days === 365,
                        isFiveYear: days >= 1825
                    },
                    filters: {
                        metricName,
                        metricType
                    }
                }
            };
        } catch (error) {
            console.error('Error getting profile metrics:', error);
            throw error;
        }
    }

    /**
     * Get aggregate statistics
     */
    async getStats(options = {}) {
        const { days = 365 } = options;

        try {
            // Get all profiles
            const profilesResult = await dynamodb.send(new ScanCommand({
                TableName: PROFILES_TABLE
            }));

            const profiles = profilesResult.Items || [];

            // Calculate statistics
            const stats = {
                totalProfiles: profiles.length,
                avgSseScore: profiles.reduce((sum, p) => sum + (p.sseScore || 0), 0) / profiles.length,
                seedCount: profiles.filter(p => p.fundingStage === 'seed').length,
                earlyCount: profiles.filter(p => p.fundingStage === 'early').length,
                growthCount: profiles.filter(p => p.fundingStage === 'growth').length,
                scaleCount: profiles.filter(p => p.fundingStage === 'scale').length,
                totalMrr: profiles.reduce((sum, p) => sum + (p.mrr || 0), 0),
                totalArr: profiles.reduce((sum, p) => sum + (p.arr || 0), 0),
                totalEmployees: profiles.reduce((sum, p) => sum + (p.employees || 0), 0),
                totalCustomers: profiles.reduce((sum, p) => sum + (p.customers || 0), 0)
            };

            // Get activity statistics
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - days);
            const thresholdTimestamp = dateThreshold.getTime();

            const activitiesResult = await dynamodb.send(new ScanCommand({
                TableName: ACTIVITIES_TABLE,
                FilterExpression: '#timestamp >= :threshold',
                ExpressionAttributeNames: {
                    '#timestamp': 'timestamp'
                },
                ExpressionAttributeValues: {
                    ':threshold': thresholdTimestamp
                }
            }));

            const activities = activitiesResult.Items || [];
            const activityStats = {
                totalActivities: activities.length,
                activeProfiles: new Set(activities.map(a => a.startupId)).size,
                activityTypes: new Set(activities.map(a => a.activityType)).size
            };

            // Get top industries
            const industryCounts = {};
            profiles.forEach(p => {
                const industry = p.sector || 'Unknown';
                industryCounts[industry] = (industryCounts[industry] || 0) + 1;
            });

            const topIndustries = Object.entries(industryCounts)
                .map(([industry, count]) => ({ industry, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            return {
                success: true,
                data: {
                    profiles: stats,
                    activities: activityStats,
                    topIndustries,
                    timeRange: {
                        days: parseInt(days),
                        isDefault: days === 365
                    }
                }
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    }

    /**
     * Search startup profiles
     */
    async searchProfiles(query, limit = 20) {
        try {
            const result = await dynamodb.send(new ScanCommand({
                TableName: PROFILES_TABLE,
                FilterExpression: 'contains(#name, :query) OR contains(#sector, :query)',
                ExpressionAttributeNames: {
                    '#name': 'companyName',
                    '#sector': 'sector'
                },
                ExpressionAttributeValues: {
                    ':query': query
                },
                Limit: Math.min(limit, 50)
            }));

            const profiles = result.Items || [];
            
            // Sort by SSE score descending
            profiles.sort((a, b) => (b.sseScore || 0) - (a.sseScore || 0));

            return {
                success: true,
                data: {
                    query,
                    results: profiles.map(this.formatProfile),
                    count: profiles.length
                }
            };
        } catch (error) {
            console.error('Error searching profiles:', error);
            throw error;
        }
    }

    /**
     * Format profile for API response
     */
    formatProfile(item) {
        return {
            profile_id: item.startupId,
            company_name: item.companyName,
            founder_name: item.founderName,
            industry: item.sector,
            stage: item.fundingStage,
            sse_score: item.sseScore || 0,
            sse_percentile: item.ssePercentile || 0,
            mrr: item.mrr || 0,
            arr: item.arr || 0,
            revenue: item.revenue || 0,
            growth_rate: item.growthRate || 0,
            burn_rate: item.burnRate || 0,
            runway_months: item.runwayMonths || 0,
            funding_raised: item.fundingRaised || 0,
            valuation: item.valuation || 0,
            employees: item.employees || 0,
            customers: item.customers || 0,
            active_users: item.activeUsers || 0,
            created_at: item.createdAt,
            updated_at: item.updatedAt
        };
    }

    /**
     * Format activity for API response
     */
    formatActivity(item) {
        return {
            activity_id: item.activityId,
            profile_id: item.startupId,
            activity_date: new Date(item.timestamp).toISOString(),
            activity_type: item.activityType,
            activity_title: item.title,
            activity_description: item.description,
            impact_score: item.impactScore || 0,
            company_name: item.companyName,
            industry: item.industry,
            stage: item.stage,
            sse_score: item.sseScore
        };
    }
}

module.exports = new StartupProfilesService();
