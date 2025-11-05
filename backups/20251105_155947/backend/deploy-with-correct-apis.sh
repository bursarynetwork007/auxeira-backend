#!/bin/bash

set -e

REGION="us-east-1"
CLAUDE_KEY="YOUR_ANTHROPIC_API_KEY"
MANUS_KEY="sk-IZSj-L-fQt2gbvZFZ0nKrCPay1c3Tqyt_-huNom5MFzVodoRwmivegKAoheM1BjDzGh4FU2_wRF24AYMdhbEJz3_KhFf"

echo "🚀 Deploying Lambda functions with correct AI agents..."
echo ""

deploy() {
    local FUNC=$1
    local FILE=$2
    local API_TYPE=$3
    
    echo "📦 Deploying ${FUNC}..."
    zip -q ${FILE}.zip ${FILE}.js
    
    if [ "$API_TYPE" = "HYBRID" ]; then
        aws lambda update-function-code --function-name ${FUNC} --zip-file fileb://${FILE}.zip --region ${REGION} --query 'FunctionName' --output text
        aws lambda update-function-configuration --function-name ${FUNC} --environment "Variables={CLAUDE_API_KEY=${CLAUDE_KEY},MANUS_API_KEY=${MANUS_KEY},NODE_ENV=production}" --region ${REGION} --query 'FunctionName' --output text
    elif [ "$API_TYPE" = "MANUS" ]; then
        aws lambda update-function-code --function-name ${FUNC} --zip-file fileb://${FILE}.zip --region ${REGION} --query 'FunctionName' --output text
        aws lambda update-function-configuration --function-name ${FUNC} --environment "Variables={MANUS_API_KEY=${MANUS_KEY},NODE_ENV=production}" --region ${REGION} --query 'FunctionName' --output text
    else
        aws lambda update-function-code --function-name ${FUNC} --zip-file fileb://${FILE}.zip --region ${REGION} --query 'FunctionName' --output text
        aws lambda update-function-configuration --function-name ${FUNC} --environment "Variables={CLAUDE_API_KEY=${CLAUDE_KEY},NODE_ENV=production}" --region ${REGION} --query 'FunctionName' --output text
    fi
    
    rm ${FILE}.zip
    echo "  ✅ ${FUNC} deployed with ${API_TYPE}"
    echo ""
}

# Overview Tab - Claude + Hybrid
echo "=== Overview Tab (Claude + Hybrid) ==="
deploy "auxeira-coach-gina-prod" "lambda-coach-gina" "HYBRID"
deploy "auxeira-nudges-generator-prod" "lambda-nudges-generator" "CLAUDE"
deploy "auxeira-urgent-actions-prod" "lambda-urgent-actions" "CLAUDE"

# Growth Metrics Tab - Claude
echo "=== Growth Metrics Tab (Claude) ==="
deploy "auxeira-growth-story-prod" "lambda-growth-story" "CLAUDE"
deploy "auxeira-growth-levers-prod" "lambda-growth-levers" "CLAUDE"
deploy "auxeira-recommended-actions-prod" "lambda-recommended-actions" "CLAUDE"

# Funding Readiness Tab - Manus
echo "=== Funding Readiness Tab (Manus) ==="
deploy "auxeira-investor-matching-prod" "lambda-investor-matching" "MANUS"
deploy "auxeira-funding-acceleration-prod" "lambda-funding-acceleration" "MANUS"
deploy "auxeira-funding-insights-prod" "lambda-funding-insights" "MANUS"

# Earn AUX Tab - Claude
echo "=== Earn AUX Tab (Claude) ==="
deploy "auxeira-aux-tasks-prod" "lambda-aux-tasks" "CLAUDE"
deploy "auxeira-aux-redeem-prod" "lambda-aux-redeem" "CLAUDE"

# Activity Rewards Tab - Manus
echo "=== Activity Rewards Tab (Manus) ==="
deploy "auxeira-activity-rewards-prod" "lambda-activity-rewards" "MANUS"

# Partner Rewards Tab - Claude
echo "=== Partner Rewards Tab (Claude) ==="
deploy "auxeira-partner-rewards-prod" "lambda-partner-rewards" "CLAUDE"

echo "=========================================="
echo "✅ All Lambda functions deployed with correct AI agents!"
echo "=========================================="
echo ""
echo "AI Agent Configuration:"
echo "  Overview Tab:"
echo "    • Coach Gina: Claude (Brain) + Manus (Hands)"
echo "    • Nudges: Claude"
echo "    • Urgent Actions: Claude"
echo ""
echo "  Growth Metrics Tab: Claude"
echo "    • Growth Story"
echo "    • Growth Levers"
echo "    • Recommended Actions"
echo ""
echo "  Funding Readiness Tab: Manus"
echo "    • Investor Matching"
echo "    • Funding Acceleration"
echo "    • Funding Insights"
echo ""
echo "  Earn AUX Tab: Claude"
echo "    • AUX Tasks"
echo "    • AUX Redeem"
echo ""
echo "  Activity Rewards Tab: Manus"
echo ""
echo "  Partner Rewards Tab: Claude"
