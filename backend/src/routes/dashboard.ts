/**
 * Dashboard Routes
 * Provides comprehensive data for dashboard views
 */

import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import startupProfilesService from '../services/startup-profiles.service';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const router = express.Router();
const client = new DynamoDBClient({ region: 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

const USERS_TABLE = 'auxeira-users-prod';
const MAPPING_TABLE = 'auxeira-user-startup-mapping-prod';
const PROFILES_TABLE = 'auxeira-startup-profiles-prod';
const ACTIVITIES_TABLE = 'auxeira-startup-activities-prod';
const TOKENS_TABLE = 'auxeira-token-transactions-prod';

/**
 * Helper: Get user profile
 */
async function getUserProfile(userId: string) {
    const result = await dynamodb.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId }
    }));
    
    if (!result.Item) {
        throw new Error('User not found');
    }
    
    return {
        userId: result.Item.userId,
        email: result.Item.email,
        firstName: result.Item.firstName,
        lastName: result.Item.lastName,
        role: result.Item.role,
        profileType: result.Item.profileType,
        companyName: result.Item.companyName
    };
}

/**
 * Helper: Get startup mapping
 */
async function getStartupMapping(userId: string) {
    const result = await dynamodb.send(new GetCommand({
        TableName: MAPPING_TABLE,
        Key: { userId }
    }));
    
    if (!result.Item) {
        throw new Error('Startup mapping not found');
    }
    
    return {
        startupId: result.Item.startupId,
        createdAt: result.Item.createdAt
    };
}

/**
 * Helper: Get startup profile
 */
async function getStartupProfile(startupId: string) {
    const result = await dynamodb.send(new GetCommand({
        TableName: PROFILES_TABLE,
        Key: { startupId }
    }));
    
    if (!result.Item) {
        throw new Error('Startup profile not found');
    }
    
    const item = result.Item;
    
    return {
        startupId: item.startupId,
        companyName: item.companyName,
        industry: item.industry || item.sector,
        fundingStage: item.fundingStage,
        region: item.region,
        
        // SSE & Success Metrics
        sseScore: item.currentSSIScore || item.currentESGScore || item.sseScore || 0,
        successProbability: item.successProbability || 0,
        
        // Financial Metrics
        mrr: item.currentRevenue || item.mrr || 0,
        arr: (item.currentRevenue || item.mrr || 0) * 12,
        growthRate: item.monthlyGrowthRate || item.growthRate || 0,
        burnRate: item.burnRate || 0,
        runwayMonths: item.runwayMonths || 0,
        totalFunding: item.totalFunding || 0,
        
        // Team Metrics
        teamSize: item.teamSize || 0,
        founderExperience: item.founderExperience || 0,
        
        // Customer Metrics
        customers: Math.floor((item.currentUsers || 0) * 0.4), // Estimate 40% conversion
        activeUsers: item.currentUsers || 0,
        churnRate: 2.3, // Default - should be calculated
        
        // Unit Economics
        cac: 127, // Default - should be calculated
        ltv: 1890, // Default - should be calculated
        ltvCacRatio: 14.9, // Default - should be calculated
        nps: item.sentimentScore || 68,
        
        // Activity Metrics
        totalActivitiesCompleted: item.totalActivitiesCompleted || 0,
        lastActivityDate: item.lastActivityDate,
        
        // Token Balance
        tokenBalance: item.tokenBalance || 0,
        
        // Timestamps
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
    };
}

/**
 * Helper: Get recent activities
 */
async function getRecentActivities(startupId: string, days: number = 30) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const thresholdTimestamp = dateThreshold.getTime();
    
    try {
        const result = await dynamodb.send(new QueryCommand({
            TableName: ACTIVITIES_TABLE,
            IndexName: 'startupId-timestamp-index',
            KeyConditionExpression: 'startupId = :startupId AND #timestamp >= :threshold',
            ExpressionAttributeNames: {
                '#timestamp': 'timestamp'
            },
            ExpressionAttributeValues: {
                ':startupId': startupId,
                ':threshold': thresholdTimestamp
            },
            Limit: 10,
            ScanIndexForward: false
        }));
        
        return result.Items || [];
    } catch (error) {
        console.error('Error getting activities:', error);
        return [];
    }
}

/**
 * Helper: Get token transactions
 */
async function getTokenTransactions(userId: string, limit: number = 10) {
    try {
        const result = await dynamodb.send(new QueryCommand({
            TableName: TOKENS_TABLE,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            Limit: limit,
            ScanIndexForward: false
        }));
        
        return result.Items || [];
    } catch (error) {
        console.error('Error getting token transactions:', error);
        return [];
    }
}

/**
 * Helper: Build overview metrics
 */
function buildOverviewMetrics(startup: any) {
    return {
        sseScore: startup.sseScore,
        mrr: startup.mrr,
        mrrGrowth: `+${startup.growthRate}%`,
        arr: startup.arr,
        runway: startup.runwayMonths,
        teamSize: startup.teamSize,
        customers: startup.customers,
        activeUsers: startup.activeUsers
    };
}

/**
 * Helper: Build growth metrics
 */
function buildGrowthMetrics(startup: any) {
    return {
        mrr: startup.mrr,
        arr: startup.arr,
        growthRate: startup.growthRate,
        cac: startup.cac,
        ltv: startup.ltv,
        ltvCacRatio: startup.ltvCacRatio,
        churnRate: startup.churnRate,
        nps: startup.nps,
        customers: startup.customers,
        activeUsers: startup.activeUsers
    };
}

/**
 * Helper: Build funding metrics
 */
function buildFundingMetrics(startup: any) {
    return {
        fundingStage: startup.fundingStage,
        totalFunding: startup.totalFunding,
        burnRate: startup.burnRate,
        runwayMonths: startup.runwayMonths,
        readinessScore: Math.min(100, startup.sseScore + 10), // Estimate
        projectionsAge: '30 days old' // Default - should be tracked
    };
}

/**
 * Helper: Build recent milestones
 */
function buildRecentMilestones(startup: any, activities: any[]) {
    const milestones = [];
    
    if (startup.mrr > 10000) {
        milestones.push(`Achieved $${(startup.mrr / 1000).toFixed(1)}K MRR`);
    }
    
    if (startup.growthRate > 15) {
        milestones.push(`${startup.growthRate}% monthly growth rate`);
    }
    
    if (startup.customers > 1000) {
        milestones.push(`Reached ${startup.customers.toLocaleString()} customers`);
    }
    
    if (activities.length > 5) {
        milestones.push(`Completed ${activities.length} activities this month`);
    }
    
    return milestones.slice(0, 3);
}

/**
 * Helper: Build active challenges
 */
function buildActiveChallenges(startup: any) {
    const challenges = [];
    
    if (startup.churnRate > 2.0) {
        challenges.push(`Churn rate above SaaS benchmark (${startup.churnRate}% vs 1-2%)`);
    }
    
    if (startup.runwayMonths < 12) {
        challenges.push(`Limited runway (${startup.runwayMonths} months remaining)`);
    }
    
    if (startup.growthRate < 10) {
        challenges.push(`Growth rate below target (${startup.growthRate}% vs 15%+ target)`);
    }
    
    if (startup.totalActivitiesCompleted < 10) {
        challenges.push('Need to complete more activities to improve SSE score');
    }
    
    return challenges.slice(0, 3);
}

/**
 * @route   GET /api/dashboard/startup-founder
 * @desc    Get comprehensive dashboard data for startup founder
 * @access  Private
 */
router.get('/startup-founder', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        
        // Get user profile
        const user = await getUserProfile(userId);
        
        // Get startup mapping
        const mapping = await getStartupMapping(userId);
        
        // Get startup profile
        const startup = await getStartupProfile(mapping.startupId);
        
        // Get recent activities
        const activities = await getRecentActivities(mapping.startupId, 30);
        
        // Get token transactions
        const tokenTransactions = await getTokenTransactions(userId, 10);
        
        // Build milestones and challenges
        const recentMilestones = buildRecentMilestones(startup, activities);
        const activeChallenges = buildActiveChallenges(startup);
        
        // Build response
        res.json({
            success: true,
            data: {
                profile: {
                    user,
                    startup
                },
                metrics: {
                    overview: buildOverviewMetrics(startup),
                    growth: buildGrowthMetrics(startup),
                    funding: buildFundingMetrics(startup),
                    activities: {
                        recent: activities.slice(0, 5),
                        total: startup.totalActivitiesCompleted,
                        lastDate: startup.lastActivityDate
                    },
                    tokens: {
                        balance: startup.tokenBalance,
                        recentTransactions: tokenTransactions.slice(0, 5)
                    },
                    recentMilestones,
                    activeChallenges
                },
                history: {
                    // TODO: Implement historical data tracking
                    sseHistory: [],
                    mrrHistory: [],
                    growthHistory: []
                }
            }
        });
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load dashboard data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * @route   GET /api/dashboard/context
 * @desc    Get founder context for AI agents (lightweight)
 * @access  Private
 */
router.get('/context', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        
        // Get user profile
        const user = await getUserProfile(userId);
        
        // Get startup mapping
        const mapping = await getStartupMapping(userId);
        
        // Get startup profile
        const startup = await getStartupProfile(mapping.startupId);
        
        // Get recent activities
        const activities = await getRecentActivities(mapping.startupId, 30);
        
        // Build lightweight context for AI
        const context = {
            startupName: startup.companyName,
            sseScore: startup.sseScore,
            stage: startup.fundingStage,
            industry: startup.industry,
            geography: startup.region || 'United States',
            teamSize: startup.teamSize,
            runway: startup.runwayMonths,
            mrr: startup.mrr,
            mrrGrowth: `+${startup.growthRate}%`,
            users: startup.activeUsers,
            customers: startup.customers,
            cac: startup.cac,
            ltv: startup.ltv,
            churnRate: startup.churnRate,
            nps: startup.nps,
            interviewsCompleted: activities.filter((a: any) => 
                a.activityType === 'customer_interview'
            ).length,
            projectionsAge: '30 days old',
            recentMilestones: buildRecentMilestones(startup, activities),
            activeChallenges: buildActiveChallenges(startup)
        };
        
        res.json({
            success: true,
            data: context
        });
    } catch (error) {
        console.error('Error loading context:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load context',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
