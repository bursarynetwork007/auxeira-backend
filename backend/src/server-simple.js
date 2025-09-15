const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Auxeira Backend is running!',
    platform: 'Good Business Rewards Platform',
    timestamp: new Date().toISOString()
  });
});

// API status
app.get('/api/status', (req, res) => {
  res.json({ 
    backend: 'operational',
    services: 'loaded',
    crypto: 'ready'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Auxeira Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Status: http://localhost:${PORT}/api/status`);
});

module.exports = app;
