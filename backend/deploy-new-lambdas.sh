#!/bin/bash

# Deployment script for new Lambda functions
# This script creates and deploys the 10 new Lambda functions to AWS

set -e

REGION="us-east-1"
RUNTIME="nodejs18.x"
ROLE_ARN="arn:aws:iam::615608124862:role/auxeira-nudges-generator-prod-us-east-1-lambdaRole"
TIMEOUT=30
MEMORY=512

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment of new Lambda functions...${NC}\n"

# Function to create and deploy a Lambda function
deploy_lambda() {
    local FUNCTION_NAME=$1
    local FILE_NAME=$2
    local DESCRIPTION=$3
    
    echo -e "${YELLOW}Deploying ${FUNCTION_NAME}...${NC}"
    
    # Create zip file
    zip -q ${FILE_NAME}.zip ${FILE_NAME}.js
    
    # Check if function exists
    if aws lambda get-function --function-name ${FUNCTION_NAME} --region ${REGION} &>/dev/null; then
        echo "  Function exists, updating code..."
        aws lambda update-function-code \
            --function-name ${FUNCTION_NAME} \
            --zip-file fileb://${FILE_NAME}.zip \
            --region ${REGION} \
            --query 'FunctionName' \
            --output text
    else
        echo "  Creating new function..."
        aws lambda create-function \
            --function-name ${FUNCTION_NAME} \
            --runtime ${RUNTIME} \
            --role ${ROLE_ARN} \
            --handler ${FILE_NAME}.handler \
            --zip-file fileb://${FILE_NAME}.zip \
            --description "${DESCRIPTION}" \
            --timeout ${TIMEOUT} \
            --memory-size ${MEMORY} \
            --region ${REGION} \
            --environment "Variables={CLAUDE_API_KEY=${CLAUDE_API_KEY},NODE_ENV=production}" \
            --query 'FunctionName' \
            --output text
    fi
    
    # Clean up zip file
    rm ${FILE_NAME}.zip
    
    echo -e "${GREEN}  ✓ ${FUNCTION_NAME} deployed successfully${NC}\n"
}

# Check if CLAUDE_API_KEY is set
if [ -z "$CLAUDE_API_KEY" ]; then
    echo -e "${RED}Error: CLAUDE_API_KEY environment variable not set${NC}"
    echo "Please set it with: export CLAUDE_API_KEY=your-api-key"
    exit 1
fi

# Deploy Growth Metrics tab functions
echo -e "${YELLOW}=== Growth Metrics Tab ===${NC}"
deploy_lambda "auxeira-growth-story-prod" "lambda-growth-story" "Generates Your Growth Story & Key Insight section"
deploy_lambda "auxeira-growth-levers-prod" "lambda-growth-levers" "Generates AI-Recommended Growth Levers section"
deploy_lambda "auxeira-recommended-actions-prod" "lambda-recommended-actions" "Generates Recommended Actions This Quarter section"

# Deploy Funding Readiness tab functions
echo -e "${YELLOW}=== Funding Readiness Tab ===${NC}"
deploy_lambda "auxeira-investor-matching-prod" "lambda-investor-matching" "Generates investor matches for Highly Aligned Investors section"
deploy_lambda "auxeira-funding-acceleration-prod" "lambda-funding-acceleration" "Generates 6-week Series A preparation roadmap"
deploy_lambda "auxeira-funding-insights-prod" "lambda-funding-insights" "Generates AI Insights & Recommendations section"

# Deploy Earn AUX tab functions
echo -e "${YELLOW}=== Earn AUX Tab ===${NC}"
deploy_lambda "auxeira-aux-tasks-prod" "lambda-aux-tasks" "Generates AI-Recommended Tasks for You section"
deploy_lambda "auxeira-aux-redeem-prod" "lambda-aux-redeem" "Generates Redeem Your AUX Tokens catalog"

# Deploy Activity Rewards tab function
echo -e "${YELLOW}=== Activity Rewards Tab ===${NC}"
deploy_lambda "auxeira-activity-rewards-prod" "lambda-activity-rewards" "Generates activity rewards assessment"

# Deploy Partner Rewards tab function
echo -e "${YELLOW}=== Partner Rewards Tab ===${NC}"
deploy_lambda "auxeira-partner-rewards-prod" "lambda-partner-rewards" "Generates partner recommendations"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All Lambda functions deployed successfully!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo "Next steps:"
echo "1. Configure API Gateway endpoints for new functions"
echo "2. Set up CORS policies"
echo "3. Test each endpoint with sample data"
echo "4. Update frontend to call new endpoints"
echo ""
echo "Lambda functions deployed:"
echo "  - auxeira-growth-story-prod"
echo "  - auxeira-growth-levers-prod"
echo "  - auxeira-recommended-actions-prod"
echo "  - auxeira-investor-matching-prod"
echo "  - auxeira-funding-acceleration-prod"
echo "  - auxeira-funding-insights-prod"
echo "  - auxeira-aux-tasks-prod"
echo "  - auxeira-aux-redeem-prod"
echo "  - auxeira-activity-rewards-prod"
echo "  - auxeira-partner-rewards-prod"
