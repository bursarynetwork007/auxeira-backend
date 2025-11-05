#!/bin/bash

# Simplified deployment script for new Lambda functions
set -e

REGION="us-east-1"
RUNTIME="nodejs18.x"
ROLE_ARN="arn:aws:iam::615608124862:role/auxeira-nudges-generator-prod-us-east-1-lambdaRole"
TIMEOUT=30
MEMORY=512
API_KEY="YOUR_ANTHROPIC_API_KEY"

echo "🚀 Deploying new Lambda functions to AWS..."
echo ""

# Function to create Lambda
create_lambda() {
    local FUNC_NAME=$1
    local FILE_NAME=$2
    local DESC=$3
    
    echo "📦 Creating ${FUNC_NAME}..."
    
    # Create zip
    zip -q ${FILE_NAME}.zip ${FILE_NAME}.js
    
    # Check if exists
    if aws lambda get-function --function-name ${FUNC_NAME} --region ${REGION} &>/dev/null; then
        echo "  ⚠️  Function exists, updating code..."
        aws lambda update-function-code \
            --function-name ${FUNC_NAME} \
            --zip-file fileb://${FILE_NAME}.zip \
            --region ${REGION} \
            --query 'FunctionName' \
            --output text
    else
        echo "  ✨ Creating new function..."
        aws lambda create-function \
            --function-name ${FUNC_NAME} \
            --runtime ${RUNTIME} \
            --role ${ROLE_ARN} \
            --handler ${FILE_NAME}.handler \
            --zip-file fileb://${FILE_NAME}.zip \
            --description "${DESC}" \
            --timeout ${TIMEOUT} \
            --memory-size ${MEMORY} \
            --region ${REGION} \
            --environment "Variables={CLAUDE_API_KEY=${API_KEY},NODE_ENV=production}" \
            --query 'FunctionName' \
            --output text
    fi
    
    rm ${FILE_NAME}.zip
    echo "  ✅ ${FUNC_NAME} deployed"
    echo ""
}

# Deploy all new functions
create_lambda "auxeira-growth-story-prod" "lambda-growth-story" "Generates Your Growth Story & Key Insight"
create_lambda "auxeira-growth-levers-prod" "lambda-growth-levers" "Generates AI-Recommended Growth Levers"
create_lambda "auxeira-recommended-actions-prod" "lambda-recommended-actions" "Generates Recommended Actions This Quarter"
create_lambda "auxeira-investor-matching-prod" "lambda-investor-matching" "Generates investor matches"
create_lambda "auxeira-funding-acceleration-prod" "lambda-funding-acceleration" "Generates 6-week Series A roadmap"
create_lambda "auxeira-funding-insights-prod" "lambda-funding-insights" "Generates AI Insights & Recommendations"
create_lambda "auxeira-aux-tasks-prod" "lambda-aux-tasks" "Generates AI-Recommended Tasks"
create_lambda "auxeira-aux-redeem-prod" "lambda-aux-redeem" "Generates redemption catalog"
create_lambda "auxeira-activity-rewards-prod" "lambda-activity-rewards" "Generates activity rewards assessment"
create_lambda "auxeira-partner-rewards-prod" "lambda-partner-rewards" "Generates partner recommendations"

echo "=========================================="
echo "✅ All 10 new Lambda functions deployed!"
echo "=========================================="
echo ""
echo "Deployed functions:"
echo "  • auxeira-growth-story-prod"
echo "  • auxeira-growth-levers-prod"
echo "  • auxeira-recommended-actions-prod"
echo "  • auxeira-investor-matching-prod"
echo "  • auxeira-funding-acceleration-prod"
echo "  • auxeira-funding-insights-prod"
echo "  • auxeira-aux-tasks-prod"
echo "  • auxeira-aux-redeem-prod"
echo "  • auxeira-activity-rewards-prod"
echo "  • auxeira-partner-rewards-prod"
