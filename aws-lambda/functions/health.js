exports.handler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      solana: {
        programId: process.env.PROGRAM_ID,
        network: process.env.SOLANA_NETWORK
      },
      version: '1.0.0'
    })
  };
};
