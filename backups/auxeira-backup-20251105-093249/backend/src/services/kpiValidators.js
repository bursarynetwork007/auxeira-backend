const VALIDATION_RULES = {
  1: { reward: 100, target: 50, name: "Net Promoter Score" },
  2: { reward: 150, target: 3.0, name: "LTV:CAC Ratio" },
  3: { reward: 75, target: 20, name: "Burn Rate %" },
  4: { reward: 50, target: 100, name: "Customer Acquisition Cost" },
  5: { reward: 200, target: 20, name: "MRR Growth %" },
  6: { reward: 125, target: 5, name: "Churn Rate %" }
};

async function validateFounderKPI(founder, kpiType) {
  const rule = VALIDATION_RULES[kpiType];
  if (!rule) throw new Error('Invalid KPI type');

  // Mock data for testing - replace with real integrations later
  const mockValue = Math.random() * rule.target * 1.5;
  const achieved = kpiType <= 2 ? mockValue >= rule.target : mockValue <= rule.target;

  return {
    isValid: achieved,
    rewardAmount: achieved ? rule.reward : 0,
    details: { current: mockValue.toFixed(1), target: rule.target, achieved }
  };
}

module.exports = { validateFounderKPI, VALIDATION_RULES };