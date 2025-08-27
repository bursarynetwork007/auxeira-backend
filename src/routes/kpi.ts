import express from 'express';

const router = express.Router();

// Get real-time KPIs for dashboard
router.get('/dashboard/:startupId', async (req: express.Request, res: express.Response) => {
    const { startupId } = req.params;
    
    // Mock KPI data aligned with your SSE treatment factors
    const kpiData = {
        marketAccess: {
            ltv_cac: { value: 3.2, target: 3.0, trend: 'up' as const },
            nps: { value: 52, target: 50, trend: 'stable' as const },
            churnRate: { value: 4.8, target: 5.0, trend: 'down' as const },
            conversionRate: { value: 11.2, target: 10.0, trend: 'up' as const }
        },
        management: {
            boardScore: { value: 81, target: 80, trend: 'up' as const },
            retention: { value: 91, target: 90, trend: 'stable' as const },
            experienceIndex: { value: 77, target: 75, trend: 'up' as const }
        },
        funding: {
            runwayMonths: { value: 14, target: 12, trend: 'stable' as const },
            capitalEfficiency: { value: 1.6, target: 1.5, trend: 'up' as const },
            followOnProbability: { value: 52, target: 50, trend: 'up' as const }
        },
        operations: {
            efficiencyIndex: { value: 77, target: 80, trend: 'up' as const },
            complianceScore: { value: 100, target: 100, trend: 'stable' as const },
            esgScore: { value: 72, target: 75, trend: 'up' as const }
        }
    };
    
    res.json({
        success: true,
        startupId,
        timestamp: new Date().toISOString(),
        kpis: kpiData
    });
});

export default router;