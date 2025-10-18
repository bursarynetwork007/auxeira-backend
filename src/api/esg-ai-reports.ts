import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { aiReportGenerator } from '../services/ai-report-generator';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/esg-profile
 * Get investor profile
 */
router.get('/esg-profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const profile = await prisma.eSGInvestorProfile.findUnique({
      where: { userId },
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/ai-reports
 * Get all AI-generated reports for user
 */
router.get('/ai-reports', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const profile = await prisma.eSGInvestorProfile.findUnique({
      where: { userId },
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const reports = await prisma.aIGeneratedReport.findMany({
      where: { investorId: profile.id },
      orderBy: { generatedAt: 'desc' },
      take: 20,
    });
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/ai-reports/generate
 * Generate new AI report
 */
router.post('/ai-reports/generate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { reportType } = req.body;
    
    const profile = await prisma.eSGInvestorProfile.findUnique({
      where: { userId },
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Generate report
    const report = await aiReportGenerator.generateReport({
      investorId: profile.id,
      reportType,
      createTeaser: profile.tier === 'free',
    });
    
    res.json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/ai-reports/:reportId/view
 * Track report view
 */
router.post('/ai-reports/:reportId/view', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;
    
    const profile = await prisma.eSGInvestorProfile.findUnique({
      where: { userId },
    });
    
    // Increment view count
    await prisma.aIGeneratedReport.update({
      where: { reportId },
      data: { viewCount: { increment: 1 } },
    });
    
    // Log access
    await prisma.reportAccessLog.create({
      data: {
        investorId: profile.id,
        reportId,
        action: 'viewed_teaser',
      },
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/profile-nudges
 * Get active profile nudges
 */
router.get('/profile-nudges', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const profile = await prisma.eSGInvestorProfile.findUnique({
      where: { userId },
    });
    
    const nudges = await prisma.profileNudge.findMany({
      where: {
        investorId: profile.id,
        dismissed: false,
      },
      orderBy: { priority: 'desc' },
      take: 3,
    });
    
    res.json(nudges);
  } catch (error) {
    console.error('Error fetching nudges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/unlock-report
 * Unlock paid report
 */
router.post('/unlock-report', authenticateToken, async (req, res) => {
  try {
    const { reportId, paymentReference } = req.body;
    const userId = req.user.id;
    
    // TODO: Verify payment with Stripe/payment processor
    
    const profile = await prisma.eSGInvestorProfile.findUnique({
      where: { userId },
    });
    
    // Log unlock
    await prisma.reportAccessLog.create({
      data: {
        investorId: profile.id,
        reportId,
        action: 'unlocked',
      },
    });
    
    // Return full report
    const report = await prisma.aIGeneratedReport.findUnique({
      where: { reportId },
    });
    
    res.json(report);
  } catch (error) {
    console.error('Error unlocking report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
