/**
 * Partnership Controller
 * Handles all partnership-related API endpoints
 */

import { Request, Response } from 'express';
import { partnershipService } from '../services/partnership.service';
import { logger } from '../utils/logger';
import { performanceTimer } from '../utils/performance';
import {
  CreatePartnershipRequest,
  UpdatePartnershipRequest,
  ApplyPartnershipRequest,
  ReviewApplicationRequest,
  RedeemBenefitRequest,
  GetPartnershipsRequest,
  GetApplicationsRequest,
  PartnershipType,
  PartnershipCategory,
  ApplicationStatus,
  StartupStage
} from '../types/partnership.types';

export class PartnershipController {
  /**
   * Get all partnerships with filtering
   * GET /api/partnerships
   */
  async getPartnerships(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('partnership_controller_get_partnerships');

    try {
      const {
        type,
        category,
        region,
        industry,
        stage,
        minSSEScore,
        maxSSEScore,
        featured,
        isActive,
        search,
        limit,
        offset,
        sortBy,
        sortOrder
      } = req.query;

      const request: GetPartnershipsRequest = {
        type: type as PartnershipType,
        category: category as PartnershipCategory,
        region: region as string,
        industry: industry as string,
        stage: stage as StartupStage,
        minSSEScore: minSSEScore ? Number(minSSEScore) : undefined,
        maxSSEScore: maxSSEScore ? Number(maxSSEScore) : undefined,
        featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search: search as string,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any
      };

      const result = await partnershipService.getPartnerships(request);

      timer.end();

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get partnerships', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to get partnerships' });
    }
  }

  /**
   * Get partnership by ID
   * GET /api/partnerships/:id
   */
  async getPartnershipById(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('partnership_controller_get_by_id');

    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: 'Partnership ID is required' });
        return;
      }

      const partnership = await partnershipService.getPartnershipById(id);

      if (!partnership) {
        res.status(404).json({ error: 'Partnership not found' });
        return;
      }

      timer.end();

      res.json({
        success: true,
        data: partnership
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get partnership by ID', {
        error: (error as Error).message,
        partnershipId: req.params.id
      });
      res.status(500).json({ error: 'Failed to get partnership' });
    }
  }

  /**
   * Create new partnership (Admin only)
   * POST /api/partnerships
   */
  async createPartnership(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('partnership_controller_create');

    try {
      // TODO: Add admin authorization check
      const request: CreatePartnershipRequest = req.body;

      // Validate required fields
      if (!request.name || !request.type || !request.category || !request.description) {
        res.status(400).json({ error: 'Name, type, category, and description are required' });
        return;
      }

      const partnership = await partnershipService.createPartnership(request);

      timer.end();

      res.status(201).json({
        success: true,
        data: partnership
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to create partnership', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to create partnership' });
    }
  }

  /**
   * Update partnership (Admin only)
   * PUT /api/partnerships/:id
   */
  async updatePartnership(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('partnership_controller_update');

    try {
      // TODO: Add admin authorization check
      const { id } = req.params;
      const request: UpdatePartnershipRequest = req.body;

      if (!id) {
        res.status(400).json({ error: 'Partnership ID is required' });
        return;
      }

      const partnership = await partnershipService.updatePartnership(id, request);

      timer.end();

      res.json({
        success: true,
        data: partnership
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to update partnership', {
        error: (error as Error).message,
        partnershipId: req.params.id
      });
      res.status(500).json({ error: 'Failed to update partnership' });
    }
  }

  /**
   * Apply for partnership
   * POST /api/partnerships/apply
   */
  async applyForPartnership(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('partnership_controller_apply');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const request: ApplyPartnershipRequest = req.body;

      if (!request.partnershipId || !request.applicationData) {
        res.status(400).json({ error: 'Partnership ID and application data are required' });
        return;
      }

      const application = await partnershipService.applyForPartnership(userId, request);

      timer.end();

      res.status(201).json({
        success: true,
        data: application
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to apply for partnership', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Review partnership application (Admin only)
   * POST /api/partnerships/applications/:id/review
   */
  async reviewApplication(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('partnership_controller_review');

    try {
      // TODO: Add admin authorization check
      const reviewerId = req.user?.id;
      if (!reviewerId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const { status, reviewNotes } = req.body;

      if (!id || !status) {
        res.status(400).json({ error: 'Application ID and status are required' });
        return;
      }

      if (!['approved', 'rejected'].includes(status)) {
        res.status(400).json({ error: 'Status must be approved or rejected' });
        return;
      }

      const request: ReviewApplicationRequest = {
        applicationId: id,
        status,
        reviewNotes
      };

      const application = await partnershipService.reviewApplication(reviewerId, request);

      timer.end();

      res.json({
        success: true,
        data: application
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to review application', {
        error: (error as Error).message,
        applicationId: req.params.id,
        reviewerId: req.user?.id
      });
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Redeem partnership benefit
   * POST /api/partnerships/benefits/redeem
   */
  async redeemBenefit(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('partnership_controller_redeem_benefit');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const request: RedeemBenefitRequest = req.body;

      if (!request.applicationId || !request.benefitId) {
        res.status(400).json({ error: 'Application ID and benefit ID are required' });
        return;
      }

      const redemption = await partnershipService.redeemBenefit(userId, request);

      timer.end();

      res.json({
        success: true,
        data: redemption
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to redeem benefit', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Get partnership recommendations for user
   * GET /api/partnerships/recommendations
   */
  async getRecommendations(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('partnership_controller_get_recommendations');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const recommendations = await partnershipService.getPartnershipRecommendations(userId);

      timer.end();

      res.json({
        success: true,
        data: recommendations
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get partnership recommendations', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to get recommendations' });
    }
  }

  /**
   * Get user's partnership applications
   * GET /api/partnerships/applications
   */
  async getUserApplications(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('partnership_controller_get_user_applications');

    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const {
        status,
        partnershipId,
        limit,
        offset,
        sortBy,
        sortOrder
      } = req.query;

      const request: GetApplicationsRequest = {
        status: status as ApplicationStatus,
        partnershipId: partnershipId as string,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any
      };

      const result = await partnershipService.getUserApplications(userId, request);

      timer.end();

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get user applications', {
        error: (error as Error).message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Failed to get applications' });
    }
  }

  /**
   * Get all applications (Admin only)
   * GET /api/partnerships/admin/applications
   */
  async getAllApplications(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('partnership_controller_get_all_applications');

    try {
      // TODO: Add admin authorization check
      const {
        status,
        partnershipId,
        userId,
        limit,
        offset,
        sortBy,
        sortOrder
      } = req.query;

      const request: GetApplicationsRequest = {
        status: status as ApplicationStatus,
        partnershipId: partnershipId as string,
        userId: userId as string,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any
      };

      // This would need a different service method for admin access
      // const result = await partnershipService.getAllApplications(request);

      timer.end();

      res.json({
        success: true,
        data: {
          applications: [],
          total: 0,
          hasMore: false,
          message: 'Admin applications endpoint not fully implemented'
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get all applications', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to get applications' });
    }
  }

  /**
   * Get partnership analytics (Admin only)
   * GET /api/partnerships/:id/analytics
   */
  async getPartnershipAnalytics(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('partnership_controller_get_analytics');

    try {
      // TODO: Add admin authorization check
      const { id } = req.params;
      const { period } = req.query;

      if (!id) {
        res.status(400).json({ error: 'Partnership ID is required' });
        return;
      }

      const analytics = await partnershipService.getPartnershipAnalytics(
        id,
        period as string
      );

      timer.end();

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get partnership analytics', {
        error: (error as Error).message,
        partnershipId: req.params.id
      });
      res.status(500).json({ error: 'Failed to get analytics' });
    }
  }

  /**
   * Get partnership directory with filters
   * GET /api/partnerships/directory
   */
  async getPartnershipDirectory(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('partnership_controller_get_directory');

    try {
      const {
        type,
        category,
        region,
        industry,
        stage,
        search,
        featured,
        limit,
        offset
      } = req.query;

      const request: GetPartnershipsRequest = {
        type: type as PartnershipType,
        category: category as PartnershipCategory,
        region: region as string,
        industry: industry as string,
        stage: stage as StartupStage,
        search: search as string,
        featured: featured === 'true' ? true : undefined,
        isActive: true, // Only show active partnerships in directory
        limit: limit ? Number(limit) : 20,
        offset: offset ? Number(offset) : 0,
        sortBy: 'featured',
        sortOrder: 'desc'
      };

      const result = await partnershipService.getPartnerships(request);

      // Get available filter options
      const filters = {
        types: Object.values(['technology', 'service', 'funding', 'mentorship', 'market_access', 'infrastructure', 'legal', 'marketing', 'talent', 'education']),
        categories: Object.values(['software_tools', 'cloud_services', 'financial_services', 'legal_services', 'marketing_tools', 'hr_tools', 'development_tools', 'analytics', 'communication', 'productivity', 'security', 'compliance', 'consulting', 'education', 'networking']),
        regions: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Africa', 'Middle East'],
        industries: ['Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 'Manufacturing', 'Real Estate', 'Food & Beverage', 'Energy', 'Transportation'],
        stages: ['idea', 'pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'growth', 'mature']
      };

      timer.end();

      res.json({
        success: true,
        data: {
          partnerships: result.partnerships,
          total: result.total,
          hasMore: result.hasMore,
          filters
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get partnership directory', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to get partnership directory' });
    }
  }

  /**
   * Get partnership statistics
   * GET /api/partnerships/stats
   */
  async getPartnershipStats(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('partnership_controller_get_stats');

    try {
      // This would aggregate statistics across all partnerships
      const stats = {
        totalPartnerships: 0,
        activePartnerships: 0,
        totalApplications: 0,
        approvedApplications: 0,
        totalValueRedeemed: 0,
        topCategories: [],
        recentActivity: []
      };

      // TODO: Implement actual statistics queries

      timer.end();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to get partnership statistics', {
        error: (error as Error).message
      });
      res.status(500).json({ error: 'Failed to get statistics' });
    }
  }

  /**
   * Search partnerships
   * GET /api/partnerships/search
   */
  async searchPartnerships(req: Request, res: Response): Promise<void> {
    const timer = performanceTimer('partnership_controller_search');

    try {
      const { q, limit, offset } = req.query;

      if (!q) {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      const request: GetPartnershipsRequest = {
        search: q as string,
        isActive: true,
        limit: limit ? Number(limit) : 20,
        offset: offset ? Number(offset) : 0,
        sortBy: 'name',
        sortOrder: 'asc'
      };

      const result = await partnershipService.getPartnerships(request);

      timer.end();

      res.json({
        success: true,
        data: {
          query: q,
          results: result.partnerships,
          total: result.total,
          hasMore: result.hasMore
        }
      });

    } catch (error) {
      timer.end();
      logger.error('Failed to search partnerships', {
        error: (error as Error).message,
        query: req.query.q
      });
      res.status(500).json({ error: 'Failed to search partnerships' });
    }
  }
}

export const partnershipController = new PartnershipController();
export default partnershipController;
