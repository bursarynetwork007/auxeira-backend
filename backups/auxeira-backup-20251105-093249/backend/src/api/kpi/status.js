const jwt = require('jsonwebtoken');
const { validateFounderKPI, VALIDATION_RULES } = require('../../services/kpiValidators');

const KPI_DEFINITIONS = Object.entries(VALIDATION_RULES).map(([type, rule]) => ({
  type: parseInt(type),
  name: rule.name,
  target: rule.target,
  reward: rule.reward,
  category: getKPICategory(parseInt(type))
}));

function getKPICategory(kpiType) {
  const categories = {
    1: 'market', 2: 'funding', 3: 'operations',
    4: 'market', 5: 'funding', 6: 'operations'
  };
  return categories[kpiType] || 'general';
}

async function getKPIStatusHandler(req, res) {
  try {
    const { founder } = req.query;
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');

    if (decoded.founder !== founder) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Get current status for all KPIs
    const kpis = await Promise.all(
      KPI_DEFINITIONS.map(async (definition) => {
        const result = await validateFounderKPI(founder, definition.type);
        return {
          ...definition,
          current: parseFloat(result.details.current),
          achieved: result.isValid,
          lastUpdated: new Date().toISOString()
        };
      })
    );

    const summary = {
      totalKPIs: kpis.length,
      achievedKPIs: kpis.filter(kpi => kpi.achieved).length,
      totalRewardsAvailable: kpis.filter(kpi => kpi.achieved).reduce((sum, kpi) => sum + kpi.reward, 0)
    };

    res.json({ founder, kpis, summary });
  } catch (error) {
    console.error('KPI status error:', error);
    res.status(500).json({ error: 'Failed to fetch KPI data' });
  }
}

module.exports = { getKPIStatusHandler };
