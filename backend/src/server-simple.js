const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const serverless = require('serverless-http');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());

// CORS Configuration - THIS IS THE FIX
app.use(cors({
    origin: ['https://auxeira.com', 'https://www.auxeira.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key', 'X-Amz-Date', 'X-Amz-Security-Token', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Auxeira Backend API',
    status: 'running',
    platform: 'Good Business Rewards Platform',
    timestamp: new Date().toISOString()
  });
});

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

// Test Solana integration
app.get('/api/solana/test', (req, res) => {
  try {
    const { Connection } = require('@solana/web3.js');
    res.json({
      solana: 'available',
      message: 'Solana Web3.js loaded successfully'
    });
  } catch (error) {
    res.status(500).json({
      solana: 'error',
      message: error.message
    });
  }
});

// Export Lambda handler
module.exports.handler = serverless(app);
// Export app for testing
module.exports.app = app;
