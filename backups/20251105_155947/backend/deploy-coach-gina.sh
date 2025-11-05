#!/bin/bash

# Deploy Coach Gina Lambda Function
# This script deploys the Coach Gina AI mentor to AWS Lambda

set -e

echo "🚀 Deploying Coach Gina Lambda Function..."

# Check if Claude API key is set
if [ -z "$CLAUDE_API_KEY" ]; then
    echo "❌ Error: CLAUDE_API_KEY environment variable is not set"
    echo "Please set it with: export CLAUDE_API_KEY=your-api-key"
    exit 1
fi

# Navigate to backend directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Deploy using serverless
echo "📤 Deploying to AWS Lambda..."
npx serverless deploy --config serverless-coach-gina.yml --stage prod

echo "✅ Coach Gina deployed successfully!"
echo ""
echo "API Endpoint will be shown above"
echo "Test with:"
echo 'curl -X POST https://YOUR-API-ENDPOINT/api/coach-gina \\'
echo '  -H "Content-Type: application/json" \\'
echo '  -d '"'"'{"message": "I need help with my startup metrics", "context": {"stage": "Early traction", "industry": "FinTech"}}'"'"''
