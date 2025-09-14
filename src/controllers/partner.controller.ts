import { Request, Response } from 'express';
import { PartnerService } from '../services/partner.service';
import { ActuarialCalculationService } from '../services/actuarial-calculation.service';
import { logger } from '../utils/logger';
import { validatePartnerApplication, validatePartnerUpdate } from '../middleware/validation.middleware';

export class PartnerController {
    private partnerService: PartnerService;
    private actuarialService: ActuarialCalculationService;

    constructor() {
        this.partnerService = new PartnerService();
        this.actuarialService = new ActuarialCalculationService();
    }

    /**
     * Submit a new partner application
     * POST /api/partners/applications
     */
    async submitApplication(req: Request, res: Response): Promise<void> {
        try {
            const applicationData = req.body;

            // Validate application data
            const validation = validatePartnerApplication(applicationData);
            if (!validation.isValid) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid application data',
                    errors: validation.errors
                });
                return;
            }

            // Generate actuarial analysis
            const actuarialReport = await this.actuarialService.generatePartnerReport(applicationData);

            // Create partner application
            const application = await this.partnerService.createApplication({
                ...applicationData,
                actuarialReport,
                status: 'pending_actuarial_review'
            });

            // Send confirmation email (placeholder)
            await this.sendConfirmationEmail(applicationData.contactEmail, application.id);

            logger.info(`Partner application submitted: ${application.id}`, {
                companyName: applicationData.companyName,
                contactEmail: applicationData.contactEmail,
                productsCount: applicationData.products.length
            });

            res.status(201).json({
                success: true,
                applicationId: application.id,
                message: 'Application submitted for actuarial review',
                estimatedReviewTime: '2 business days',
                actuarialReport: actuarialReport
            });

        } catch (error) {
            logger.error('Error submitting partner application:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get application status
     * GET /api/partners/applications/:id
     */
    async getApplicationStatus(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const application = await this.partnerService.getApplicationById(id);

            if (!application) {
                res.status(404).json({
                    success: false,
                    message: 'Application not found'
                });
                return;
            }

            res.json({
                id: application.id,
                status: application.status,
                companyName: application.companyName,
                submittedAt: application.createdAt,
                estimatedCompletion: this.calculateEstimatedCompletion(application.createdAt),
                actuarialReport: application.actuarialReport
            });

        } catch (error) {
            logger.error('Error getting application status:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get actuarial report for approved partner
     * GET /api/partners/:id/actuarial-report
     */
    async getActuarialReport(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const partner = await this.partnerService.getPartnerById(id);

            if (!partner) {
                res.status(404).json({
                    success: false,
                    message: 'Partner not found'
                });
                return;
            }

            if (!partner.actuarialReport) {
                res.status(404).json({
                    success: false,
                    message: 'Actuarial report not available'
                });
                return;
            }

            res.json({
                partnerId: partner.id,
                generatedAt: partner.actuarialReport.generatedAt,
                portfolioMetrics: partner.actuarialReport.portfolioMetrics,
                productTierAnalysis: partner.actuarialReport.productTierAnalysis,
                recommendations: partner.actuarialReport.recommendations,
                riskAssessment: partner.actuarialReport.riskAssessment
            });

        } catch (error) {
            logger.error('Error getting actuarial report:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * List all partners with filtering
     * GET /api/partners
     */
    async listPartners(req: Request, res: Response): Promise<void> {
        try {
            const {
                page = 1,
                limit = 20,
                status,
                tier,
                industry,
                search
            } = req.query;

            const filters = {
                status: status as string,
                tier: tier as string,
                industry: industry as string,
                search: search as string
            };

            const result = await this.partnerService.listPartners(
                parseInt(page as string),
                parseInt(limit as string),
                filters
            );

            res.json({
                partners: result.partners.map(partner => ({
                    id: partner.id,
                    name: partner.name,
                    tier: partner.partnershipTier,
                    status: partner.status,
                    productsCount: partner.products?.length || 0,
                    activeStartups: partner.portfolioMetrics?.activeStartups || 0,
                    estimatedPipelineValue: partner.portfolioMetrics?.estimatedPipelineValue || 0,
                    joinedAt: partner.createdAt
                })),
                total: result.total,
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                totalPages: Math.ceil(result.total / parseInt(limit as string))
            });

        } catch (error) {
            logger.error('Error listing partners:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get partner details
     * GET /api/partners/:id
     */
    async getPartnerDetails(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const partner = await this.partnerService.getPartnerById(id);

            if (!partner) {
                res.status(404).json({
                    success: false,
                    message: 'Partner not found'
                });
                return;
            }

            // Get performance stats
            const performanceStats = await this.partnerService.getPartnerPerformanceStats(id);

            res.json({
                id: partner.id,
                name: partner.name,
                website: partner.website,
                industry: partner.industry,
                companySize: partner.companySize,
                contactName: partner.contactName,
                contactEmail: partner.contactEmail,
                partnershipTier: partner.partnershipTier,
                status: partner.status,
                products: partner.products,
                portfolioMetrics: partner.portfolioMetrics,
                performanceStats: performanceStats,
                createdAt: partner.createdAt,
                updatedAt: partner.updatedAt
            });

        } catch (error) {
            logger.error('Error getting partner details:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Update partner product details
     * PUT /api/partners/:id/products/:productId
     */
    async updatePartnerProduct(req: Request, res: Response): Promise<void> {
        try {
            const { id, productId } = req.params;
            const updateData = req.body;

            // Validate update data
            const validation = validatePartnerUpdate(updateData);
            if (!validation.isValid) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid update data',
                    errors: validation.errors
                });
                return;
            }

            const updatedProduct = await this.partnerService.updatePartnerProduct(id, productId, updateData);

            if (!updatedProduct) {
                res.status(404).json({
                    success: false,
                    message: 'Partner or product not found'
                });
                return;
            }

            // Recalculate actuarial metrics
            const partner = await this.partnerService.getPartnerById(id);
            if (partner) {
                const updatedReport = await this.actuarialService.generatePartnerReport({
                    products: partner.products,
                    companyName: partner.name,
                    industry: partner.industry
                });

                await this.partnerService.updatePartnerActuarialReport(id, updatedReport);
            }

            logger.info(`Partner product updated: ${id}/${productId}`, {
                partnerId: id,
                productId: productId,
                updateData
            });

            res.json({
                success: true,
                message: 'Product updated successfully',
                product: updatedProduct
            });

        } catch (error) {
            logger.error('Error updating partner product:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get partner dashboard metrics
     * GET /api/partners/:id/dashboard
     */
    async getPartnerDashboard(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { timeframe = '30d' } = req.query;

            const partner = await this.partnerService.getPartnerById(id);

            if (!partner) {
                res.status(404).json({
                    success: false,
                    message: 'Partner not found'
                });
                return;
            }

            // Get dashboard metrics
            const dashboardData = await this.partnerService.getPartnerDashboardMetrics(id, timeframe as string);

            res.json({
                partnerId: id,
                partnerName: partner.name,
                timeframe,
                metrics: {
                    activeStartups: dashboardData.activeStartups,
                    estimatedPipelineValue: dashboardData.estimatedPipelineValue,
                    monthlyDiscountExposure: dashboardData.monthlyDiscountExposure,
                    averageSSEScore: dashboardData.averageSSEScore,
                    conversionRate: dashboardData.conversionRate,
                    totalRedemptions: dashboardData.totalRedemptions
                },
                topPerformingStartups: dashboardData.topPerformingStartups,
                productPerformance: dashboardData.productPerformance,
                trends: dashboardData.trends,
                lastUpdated: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error getting partner dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get partner ROI analytics
     * GET /api/partners/:id/analytics/roi
     */
    async getPartnerROIAnalytics(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;

            const roiAnalytics = await this.partnerService.calculatePartnerROI(
                id,
                startDate as string,
                endDate as string
            );

            if (!roiAnalytics) {
                res.status(404).json({
                    success: false,
                    message: 'Partner not found or insufficient data'
                });
                return;
            }

            res.json({
                partnerId: id,
                period: {
                    startDate,
                    endDate
                },
                roi: {
                    totalInvestment: roiAnalytics.totalInvestment,
                    totalReturn: roiAnalytics.totalReturn,
                    netROI: roiAnalytics.netROI,
                    roiPercentage: roiAnalytics.roiPercentage
                },
                breakdown: {
                    discountValue: roiAnalytics.discountValue,
                    conversionValue: roiAnalytics.conversionValue,
                    pipelineValue: roiAnalytics.pipelineValue,
                    customerLifetimeValue: roiAnalytics.customerLifetimeValue
                },
                metrics: {
                    totalStartupsEngaged: roiAnalytics.totalStartupsEngaged,
                    conversions: roiAnalytics.conversions,
                    conversionRate: roiAnalytics.conversionRate,
                    averageContractValue: roiAnalytics.averageContractValue
                }
            });

        } catch (error) {
            logger.error('Error getting partner ROI analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Approve partner application (admin only)
     * POST /api/partners/applications/:id/approve
     */
    async approveApplication(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { partnershipTier = 'growth' } = req.body;

            const approvedPartner = await this.partnerService.approveApplication(id, partnershipTier);

            if (!approvedPartner) {
                res.status(404).json({
                    success: false,
                    message: 'Application not found'
                });
                return;
            }

            // Send approval email
            await this.sendApprovalEmail(approvedPartner.contactEmail, approvedPartner);

            logger.info(`Partner application approved: ${id}`, {
                partnerId: approvedPartner.id,
                companyName: approvedPartner.name,
                tier: partnershipTier
            });

            res.json({
                success: true,
                message: 'Application approved successfully',
                partner: {
                    id: approvedPartner.id,
                    name: approvedPartner.name,
                    tier: approvedPartner.partnershipTier,
                    status: approvedPartner.status
                }
            });

        } catch (error) {
            logger.error('Error approving partner application:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get partner discount eligibility for startup
     * GET /api/partners/discounts/eligibility
     */
    async getDiscountEligibility(req: Request, res: Response): Promise<void> {
        try {
            const { startupId, sseScore } = req.query;

            if (!startupId || !sseScore) {
                res.status(400).json({
                    success: false,
                    message: 'Startup ID and SSE score are required'
                });
                return;
            }

            const eligibleDiscounts = await this.partnerService.getEligibleDiscounts(
                startupId as string,
                parseFloat(sseScore as string)
            );

            res.json({
                startupId,
                sseScore: parseFloat(sseScore as string),
                eligibleDiscounts: eligibleDiscounts.map(discount => ({
                    partnerId: discount.partnerId,
                    partnerName: discount.partnerName,
                    productId: discount.productId,
                    productName: discount.productName,
                    category: discount.category,
                    tier: discount.tier,
                    discountPercentage: discount.discountPercentage,
                    estimatedValue: discount.estimatedValue,
                    requirements: discount.requirements
                })),
                totalValue: eligibleDiscounts.reduce((sum, d) => sum + d.estimatedValue, 0)
            });

        } catch (error) {
            logger.error('Error getting discount eligibility:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Private helper methods
    private calculateEstimatedCompletion(submittedAt: Date): string {
        const completion = new Date(submittedAt);
        completion.setDate(completion.getDate() + 2); // 2 business days
        return completion.toISOString();
    }

    private async sendConfirmationEmail(email: string, applicationId: string): Promise<void> {
        // Placeholder for email service integration
        logger.info(`Confirmation email sent to ${email} for application ${applicationId}`);
    }

    private async sendApprovalEmail(email: string, partner: any): Promise<void> {
        // Placeholder for email service integration
        logger.info(`Approval email sent to ${email} for partner ${partner.name}`);
    }
}
