const jwt = require('jsonwebtoken');
const ed25519 = require('@noble/ed25519');
const { keccak_256 } = require('@noble/hashes/sha3');
const { PublicKey } = require('@solana/web3.js');
const { validateFounderKPI } = require('../../services/kpiValidators');

async function verifyKPIHandler(req, res) {
  try {
    const { founder, kpi_type } = req.query;

    // Debug: log all headers
    console.log('Headers received:', req.headers);

    // Try multiple header formats
    const authToken = req.headers['auth_token'] || req.headers['auth-token'] ||
                     (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));

    console.log('Auth token found:', authToken ? 'YES' : 'NO');

    if (!authToken) {
      return res.status(401).json({
        error: 'Missing auth token',
        debug: 'Available headers: ' + Object.keys(req.headers).join(', ')
      });
    }

    // Verify JWT
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'dev-secret');
    if (decoded.founder !== founder) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate KPI achievement
    const validation = await validateFounderKPI(founder, parseInt(kpi_type));

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'KPI not achieved',
        details: validation.details
      });
    }

    // Generate reward data
    const timestamp = Math.floor(Date.now() / 1000);
    const rewardData = {
      founder,
      kpi_type: parseInt(kpi_type),
      amount: validation.rewardAmount,
      timestamp
    };

    // Create mock signature for demo
    const signature = 'demo_signature_' + Math.random().toString(36);

    console.log(`Reward approved: ${founder} - KPI ${kpi_type} - ${validation.rewardAmount} AUX`);

    res.json({
      ...rewardData,
      signature,
      expires_at: timestamp + 300,
      status: 'success'
    });

  } catch (error) {
    console.error('Verification failed:', error);
    res.status(500).json({ error: 'Validation failed', details: error.message });
  }
}

module.exports = { verifyKPIHandler };