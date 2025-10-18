const { Keypair } = require('@solana/web3.js');

exports.handler = async (event) => {
  try {
    const { founder } = event.pathParameters;
    const { kpi_type } = event.queryStringParameters || {};
    
    // Mock KPI validation for testing
    const mockRewards = {
      1: 100, // NPS reward
      2: 150, // LTV:CAC reward  
      3: 75,  // Burn rate reward
    };
    
    const amount = mockRewards[kpi_type] || 50;
    const timestamp = Math.floor(Date.now() / 1000);
    
    // In production, implement actual KPI validation here
    // For now, return mock successful validation
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        founder,
        kpi_type: parseInt(kpi_type),
        amount,
        timestamp,
        isValid: true,
        message: 'KPI validation successful'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Validation failed',
        message: error.message
      })
    };
  }
};
