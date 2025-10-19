#!/bin/bash
echo "🚀 Auxeira Quick Start"
echo "====================="
echo ""
echo "Step 1: Configure environment"
cd backend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file - Please edit with your API keys"
    echo "   nano backend/.env"
else
    echo "✅ .env file already exists"
fi
echo ""
echo "Step 2: Install dependencies"
npm install
echo ""
echo "Step 3: Start server"
echo "   npm run server"
echo ""
echo "Step 4: Visit application"
echo "   Main site: http://localhost:3000"
echo "   Dashboard: http://localhost:3000/dashboard/startup/"
echo ""
