const express = require('express');
const jwt = require('jsonwebtoken');
const { getKPIStatusHandler } = require('./api/kpi/status');
const { verifyKPIHandler } = require('./api/verification/verifyKPI');

const app = express();
app.use(express.json());

// Auth endpoint
app.post('/api/auth/login', (req, res) => {
  const { publicKey } = req.body;
  if (!publicKey) {
    return res.status(400).json({ error: 'Public key required' });
  }

  const token = jwt.sign(
    { founder: publicKey, iat: Math.floor(Date.now() / 1000) },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '24h' }
  );

  res.json({ token, founder: publicKey });
});

// KPI status endpoint
app.get('/api/kpis/status', getKPIStatusHandler);

// Reward verification endpoint
app.post('/api/verify/:founder', verifyKPIHandler);

// Simple test endpoint without auth
app.get('/api/test-reward/:kpiType', async (req, res) => {
  try {
    const { kpiType } = req.params;
    const founder = 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS';

    const { validateFounderKPI } = require('./services/kpiValidators');
    const validation = await validateFounderKPI(founder, parseInt(kpiType));

    if (!validation.isValid) {
      return res.json({
        success: false,
        message: 'KPI not achieved',
        details: validation.details
      });
    }

    res.json({
      success: true,
      message: 'Reward approved!',
      founder,
      kpi_type: parseInt(kpiType),
      amount: validation.rewardAmount,
      signature: 'demo_signature_' + Date.now(),
      timestamp: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Auxeira SSE Backend API is running!', timestamp: new Date().toISOString() });
});

// Serve static files
app.use(express.static('public'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Auxeira SSE API running on port ${PORT}`);
});