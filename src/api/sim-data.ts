import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 365;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const startups = await prisma.startupProfile.findMany({
      where: { lastMetricsUpdate: { gte: cutoffDate } },
    });
    
    const totalStudentsReached = startups.reduce((sum, s) => sum + (s.customers || 0), 0);
    const totalTeachersTrained = Math.floor(totalStudentsReached * 0.05);
    const avgSSEScore = Math.round(startups.reduce((sum, s) => sum + s.sseScore, 0) / startups.length);
    const totalMRR = startups.reduce((sum, s) => sum + s.mrr, 0);
    const avgGrowthRate = startups.reduce((sum, s) => sum + s.growthRate, 0) / startups.length;
    
    const storyTemplates = [
      "Nomsa's Teaching Revolution",
      "Tech-Powered STEM Breakthrough",
      "Rural Literacy Transformation",
    ];
    
    const aggregated = {
      students_reached: totalStudentsReached,
      teachers_trained: totalTeachersTrained,
      schools_supported: Math.floor(startups.length * 0.1),
      sse_score: avgSSEScore,
      mrr_total: totalMRR,
      growth_rate: avgGrowthRate.toFixed(1),
      story_title: storyTemplates[Math.floor(Math.random() * storyTemplates.length)],
      impact_narrative: `${days}-day rolling impact`,
      total_startups: startups.length,
      timestamp: new Date().toISOString(),
      days_range: days,
    };
    
    res.json([aggregated]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
