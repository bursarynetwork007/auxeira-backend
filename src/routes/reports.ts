import { Router } from 'express';
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../.env') });

import { PrismaClient } from '@prisma/client';
import { esgReportGenerator } from '../services/esg-report-generator';

const router = Router();
const prisma = new PrismaClient();

/**
 * Save/Update User Profile
 * POST /api/profile
 */
router.post('/profile', async (req, res) => {
  try {
    const {
      userId,
      organizationName,
      websiteUrl,
      sectorType,
      country,
      focusAreas,
      sdgAlignment,
      goalStatement,
      annualEducationSpend,
      kpisOfInterest,
      relevantPolicies,
    } = req.body;

    const profile = await prisma.eSGUserProfile.upsert({
      where: { userId },
      update: {
        organizationName,
        websiteUrl,
        sectorType,
        country,
        educationFocusAreas: JSON.stringify(focusAreas || []),
        sdgAlignment: JSON.stringify(sdgAlignment || []),
        goalStatement,
        annualEducationSpend: annualEducationSpend ? parseFloat(annualEducationSpend) : null,
        kpisOfInterest: JSON.stringify(kpisOfInterest || []),
        relevantPolicies: JSON.stringify(relevantPolicies || []),
      },
      create: {
        userId,
        organizationName,
        websiteUrl,
        sectorType,
        country,
        educationFocusAreas: JSON.stringify(focusAreas || []),
        sdgAlignment: JSON.stringify(sdgAlignment || []),
        goalStatement,
        annualEducationSpend: annualEducationSpend ? parseFloat(annualEducationSpend) : null,
        kpisOfInterest: JSON.stringify(kpisOfInterest || []),
        relevantPolicies: JSON.stringify(relevantPolicies || []),
      },
    });

    res.json({
      success: true,
      profileId: profile.id,
      message: 'Profile saved successfully',
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save profile',
    });
  }
});

/**
 * Get User Profile
 * GET /api/profile/:userId
 */
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await prisma.eSGUserProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
    }

    res.json({
      success: true,
      profile: {
        ...profile,
        educationFocusAreas: JSON.parse(profile.educationFocusAreas),
        sdgAlignment: JSON.parse(profile.sdgAlignment),
        kpisOfInterest: JSON.parse(profile.kpisOfInterest),
        relevantPolicies: JSON.parse(profile.relevantPolicies),
        projectPartners: JSON.parse(profile.projectPartners),
      },
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load profile',
    });
  }
});

/**
 * Generate AI Report
 * POST /api/reports/generate
 */
router.post('/reports/generate', async (req, res) => {
  try {
    const { profile, reportType } = req.body;

    if (!profile || !reportType) {
      return res.status(400).json({
        success: false,
        error: 'profile and reportType are required',
      });
    }

    console.log(`📊 Generating ${reportType} for ${profile.organizationName}...`);

    // Create/update user profile in database
    const userId = profile.organizationName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    
    const dbProfile = await prisma.eSGUserProfile.upsert({
      where: { userId },
      update: {
        organizationName: profile.organizationName,
        websiteUrl: profile.websiteUrl,
        sectorType: profile.sectorType,
        country: profile.country,
        educationFocusAreas: JSON.stringify(profile.focusAreas ? profile.focusAreas.split(',').map(s => s.trim()) : []),
        sdgAlignment: JSON.stringify(profile.sdgAlignment ? profile.sdgAlignment.split(',').map(n => parseInt(n.trim())) : []),
        goalStatement: profile.goalStatement,
        annualEducationSpend: profile.annualSpend ? parseFloat(profile.annualSpend) : null,
        kpisOfInterest: JSON.stringify([]),
        relevantPolicies: JSON.stringify([]),
      },
      create: {
        userId,
        organizationName: profile.organizationName,
        websiteUrl: profile.websiteUrl,
        sectorType: profile.sectorType,
        country: profile.country,
        educationFocusAreas: JSON.stringify(profile.focusAreas ? profile.focusAreas.split(',').map(s => s.trim()) : []),
        sdgAlignment: JSON.stringify(profile.sdgAlignment ? profile.sdgAlignment.split(',').map(n => parseInt(n.trim())) : []),
        goalStatement: profile.goalStatement,
        annualEducationSpend: profile.annualSpend ? parseFloat(profile.annualSpend) : null,
        kpisOfInterest: JSON.stringify([]),
        relevantPolicies: JSON.stringify([]),
      },
    });

    const report = await esgReportGenerator.generateDynamicReport(
      dbProfile.id,
      reportType
    );

    // Parse JSON fields
    const keyMetrics = JSON.parse(report.keyMetrics || '[]');
    const visualizations = JSON.parse(report.visualizations || '[]');
    const recommendedActions = JSON.parse(report.recommendedActions || '[]');
    
    res.json({
      success: true,
      reportId: report.reportId,
      title: report.title,
      executive_summary: report.executiveSummary,
      executiveSummary: report.executiveSummary,
      full_narrative: report.fullNarrative,
      fullNarrative: report.fullNarrative,
      key_metrics: keyMetrics,
      keyMetrics: keyMetrics,
      visualizations: visualizations,
      visuals: visualizations,
      recommended_actions: recommendedActions,
      recommendedActions: recommendedActions,
      isPremium: report.isPremium,
      unlockPrice: report.unlockPrice,
      isUnlocked: report.isUnlocked,
      generatedAt: report.createdAt,
      tokensUsed: report.tokensUsed,
      generationTime: report.generationTime,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate report',
    });
  }
});

/**
 * Get Report Details
 * GET /api/reports/:reportId
 */
router.get('/reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await prisma.dynamicESGReport.findUnique({
      where: { reportId },
      include: {
        userProfile: true,
      },
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }

    if (report.isPremium && !report.isUnlocked) {
      return res.json({
        success: true,
        report: {
          reportId: report.reportId,
          title: report.title,
          executiveSummary: report.executiveSummary,
          isPremium: true,
          unlockPrice: report.unlockPrice,
          isUnlocked: false,
        },
      });
    }

    res.json({
      success: true,
      report: {
        ...report,
        keyMetrics: JSON.parse(report.keyMetrics),
        visualizations: JSON.parse(report.visualizations),
        recommendedActions: JSON.parse(report.recommendedActions),
        scrapedDataSources: JSON.parse(report.scrapedDataSources),
      },
    });
  } catch (error) {
    console.error('Error loading report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load report',
    });
  }
});

/**
 * List User Reports
 * GET /api/reports/user/:userId
 */
router.get('/reports/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await prisma.eSGUserProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.json({
        success: true,
        reports: [],
      });
    }

    const reports = await prisma.dynamicESGReport.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      reports: reports.map(r => ({
        reportId: r.reportId,
        title: r.title,
        reportType: r.reportType,
        executiveSummary: r.executiveSummary.substring(0, 200) + '...',
        isPremium: r.isPremium,
        isUnlocked: r.isUnlocked,
        unlockPrice: r.unlockPrice,
        generatedAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error listing reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list reports',
    });
  }
});

export default router;
