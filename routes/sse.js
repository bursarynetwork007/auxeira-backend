const express = require('express');
const router = express.Router();

// Get SSI (Sustainable Success Index) score
router.get('/ssi-score/:startupId', async (req, res) => {
    const { startupId } = req.params;
    
    // Mock SSI calculation based on your 4 domains
    const ssiScore = {
        overall: 76,
        domains: {
            marketAccess: {
                score: 82,
                kpis: {
                    ltv_cac: 3.2,
                    nps: 52,
                    churnRate: 4.8
                }
            },
            managementExcellence: {
                score: 78,
                kpis: {
                    boardEffectiveness: 81,
                    retention: 91,
                    strategicAdaptation: 72
                }
            },
            fundingOptimization: {
                score: 71,
                kpis: {
                    runway: 14, // months
                    capitalEfficiency: 1.6,
                    milestoneAchievement: 78
                }
            },
            operationalEfficiency: {
                score: 73,
                kpis: {
                    efficiency: 77,
                    compliance: 100,
                    esgScore: 72
                }
            }
        },
        recommendations: [
            "Increase customer interview frequency to improve market validation",
            "Optimize burn rate to extend runway beyond 18 months",
            "Implement weekly financial reviews for better tracking"
        ]
    };
    
    res.json(ssiScore);
});

// Submit behavioral data
router.post('/behavior', async (req, res) => {
    const { startupId, behaviorType, data } = req.body;
    
    // Calculate AUX token rewards based on behavior
    const rewards = {
        customer_interview: 50,
        financial_review: 75,
        team_one_on_one: 40,
        esg_report: 100
    };
    
    const auxReward = rewards[behaviorType] || 25;
    
    res.json({
        success: true,
        message: `Behavior recorded: ${behaviorType}`,
        auxTokensEarned: auxReward,
        totalAuxBalance: 1250 // Mock total
    });
});

module.exports = router;