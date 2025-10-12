#!/bin/bash

echo "🚀 Starting Auxeira Development Environment..."
echo ""

# Start API server
echo "📡 Starting API server on port 3000..."
npm run dev &

# Open dashboard
echo "🌐 Dashboard: https://dashboard.auxeira.com/esg_education.html"
echo ""
echo "📊 API Endpoints:"
echo "   POST /api/profile - Save user profile"
echo "   GET  /api/profile/:userId - Get profile"
echo "   POST /api/reports/generate - Generate AI report"
echo "   GET  /api/reports/:reportId - Get report details"
echo "   GET  /api/reports/user/:userId - List user reports"
echo ""
echo "✨ Ready for development!"
