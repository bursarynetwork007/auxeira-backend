const express = require('express');
const router = express.Router();

// Get real-time KPIs for dashboard
router.get('/dashboard/:startupId', async (req, res) => {
    const { startupId } = req.params;
    
    // Mock KPI data aligned with your SSE treatment factors
    const kpiData = {
        marketAccess: {
            ltv_cac: { value: 3.2, target: 3.0, trend: 'up' },
            nps: { value: 52, target: 50, trend: 'stable' },
            churnRate: { value: 4.8, target: 5.0, trend: 'down' },
            conversionRate: { value: 11.2, target: 10.0, trend: 'up' }
        },
        management: {
            boardScore: { value: 81, target: 80, trend: 'up' },
            retention: { value: 91, target: 90, trend: 'stable' },
            experienceIndex: { value: 77, target: 75, trend: 'up' }
        },
        funding: {
            runwayMonths: { value: 14, target: 12, trend: 'stable' },
            capitalEfficiency: { value: 1.6, target: 1.5, trend: 'up' },
            followOnProbability: { value: 52, target: 50, trend: 'up' }
        },
        operations: {
            efficiencyIndex: { value: 77, target: 80, trend: 'up' },
            complianceScore: { value: 100, target: 100, trend: 'stable' },
            esgScore: { value: 72, target: 75, trend: 'up' }
        }
    };
    
    res.json({
        success: true,
        startupId,
        timestamp: new Date().toISOString(),
        kpis: kpiData
    });
});

module.exports = router;