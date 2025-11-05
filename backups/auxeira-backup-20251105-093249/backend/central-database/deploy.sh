#!/bin/bash

# Auxeira Central Database Deployment Script
# Deploys the central database system to AWS using Serverless Framework

set -e

echo "🚀 Starting Auxeira Central Database Deployment"

# Configuration
STAGE=${1:-prod}
REGION=${2:-us-east-1}
AWS_PROFILE=${3:-default}

echo "📋 Deployment Configuration:"
echo "  Stage: $STAGE"
echo "  Region: $REGION"
echo "  AWS Profile: $AWS_PROFILE"

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Serverless Framework is installed
if ! command -v serverless &> /dev/null; then
    echo "❌ Serverless Framework is not installed. Installing..."
    npm install -g serverless
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it first."
    exit 1
fi

# Check if Python 3.11 is available
if ! command -v python3.11 &> /dev/null; then
    echo "⚠️  Python 3.11 not found, using default Python 3"
    PYTHON_CMD=python3
else
    PYTHON_CMD=python3.11
fi

# Verify AWS credentials
echo "🔐 Verifying AWS credentials..."
if ! aws sts get-caller-identity --profile $AWS_PROFILE &> /dev/null; then
    echo "❌ AWS credentials not configured for profile: $AWS_PROFILE"
    echo "Please run: aws configure --profile $AWS_PROFILE"
    exit 1
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
if [ ! -f package.json ]; then
    cat > package.json << EOF
{
  "name": "auxeira-central-database",
  "version": "1.0.0",
  "description": "Central database for Auxeira SSE platform",
  "main": "wsgi_handler.js",
  "scripts": {
    "deploy": "serverless deploy",
    "remove": "serverless remove"
  },
  "devDependencies": {
    "serverless": "^3.38.0",
    "serverless-python-requirements": "^6.0.0",
    "serverless-wsgi": "^3.0.3",
    "serverless-offline": "^13.3.0"
  }
}
EOF
fi

npm install

# Create Python virtual environment
echo "🐍 Setting up Python environment..."
if [ ! -d "venv" ]; then
    $PYTHON_CMD -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Set up AWS Parameter Store values (if not exists)
echo "⚙️  Setting up AWS Parameter Store..."

# Check if database password exists
if ! aws ssm get-parameter --name "/auxeira/database/password" --profile $AWS_PROFILE &> /dev/null; then
    echo "🔑 Creating database password in Parameter Store..."
    DB_PASSWORD=$(openssl rand -base64 32)
    aws ssm put-parameter \
        --name "/auxeira/database/password" \
        --value "$DB_PASSWORD" \
        --type "SecureString" \
        --description "Database password for Auxeira Central DB" \
        --profile $AWS_PROFILE
fi

# Check if API secret key exists
if ! aws ssm get-parameter --name "/auxeira/api/secret-key" --profile $AWS_PROFILE &> /dev/null; then
    echo "🔑 Creating API secret key in Parameter Store..."
    API_SECRET=$(openssl rand -base64 64)
    aws ssm put-parameter \
        --name "/auxeira/api/secret-key" \
        --value "$API_SECRET" \
        --type "SecureString" \
        --description "Secret key for Auxeira API JWT tokens" \
        --profile $AWS_PROFILE
fi

# Validate serverless.yml
echo "✅ Validating Serverless configuration..."
serverless print --stage $STAGE --aws-profile $AWS_PROFILE > /dev/null

# Deploy infrastructure
echo "🏗️  Deploying infrastructure..."
serverless deploy --stage $STAGE --aws-profile $AWS_PROFILE --verbose

# Get deployment outputs
echo "📊 Getting deployment information..."
OUTPUTS=$(serverless info --stage $STAGE --aws-profile $AWS_PROFILE)
echo "$OUTPUTS"

# Initialize database schema
echo "🗄️  Initializing database schema..."
FUNCTION_NAME="auxeira-central-database-$STAGE-initDatabase"

aws lambda invoke \
    --function-name $FUNCTION_NAME \
    --payload '{"action": "initialize"}' \
    --profile $AWS_PROFILE \
    /tmp/init-response.json

if [ $? -eq 0 ]; then
    echo "✅ Database schema initialized successfully"
    cat /tmp/init-response.json
else
    echo "❌ Database initialization failed"
    exit 1
fi

# Test health endpoint
echo "🏥 Testing health endpoint..."
API_ENDPOINT=$(echo "$OUTPUTS" | grep -o 'https://[^/]*/[^/]*' | head -1)

if [ ! -z "$API_ENDPOINT" ]; then
    echo "Testing: $API_ENDPOINT/health"
    
    HEALTH_RESPONSE=$(curl -s -w "%{http_code}" "$API_ENDPOINT/health")
    HTTP_CODE="${HEALTH_RESPONSE: -3}"
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Health check passed"
    else
        echo "⚠️  Health check returned HTTP $HTTP_CODE"
    fi
else
    echo "⚠️  Could not determine API endpoint"
fi

# Generate sample synthetic data
echo "🎲 Generating initial synthetic data..."
SYNTHETIC_FUNCTION_NAME="auxeira-central-database-$STAGE-generateSyntheticData"

aws lambda invoke \
    --function-name $SYNTHETIC_FUNCTION_NAME \
    --payload '{"userType": "startup_founder", "count": 10}' \
    --profile $AWS_PROFILE \
    /tmp/synthetic-response.json

if [ $? -eq 0 ]; then
    echo "✅ Initial synthetic data generated"
else
    echo "⚠️  Synthetic data generation failed (this is optional)"
fi

# Create deployment summary
echo "📋 Creating deployment summary..."
cat > deployment-summary.json << EOF
{
  "deployment": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "stage": "$STAGE",
    "region": "$REGION",
    "profile": "$AWS_PROFILE",
    "status": "completed"
  },
  "endpoints": {
    "api": "$API_ENDPOINT",
    "health": "$API_ENDPOINT/health"
  },
  "functions": {
    "api": "$FUNCTION_NAME",
    "initDatabase": "auxeira-central-database-$STAGE-initDatabase",
    "generateSyntheticData": "auxeira-central-database-$STAGE-generateSyntheticData",
    "cleanupOldData": "auxeira-central-database-$STAGE-cleanupOldData",
    "healthCheck": "auxeira-central-database-$STAGE-healthCheck"
  }
}
EOF

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Summary:"
echo "  API Endpoint: $API_ENDPOINT"
echo "  Health Check: $API_ENDPOINT/health"
echo "  Stage: $STAGE"
echo "  Region: $REGION"
echo ""
echo "📁 Deployment details saved to: deployment-summary.json"
echo ""
echo "🔧 Next steps:"
echo "  1. Update your dashboard configurations to use the new API endpoint"
echo "  2. Test the API endpoints with your dashboard applications"
echo "  3. Monitor CloudWatch logs for any issues"
echo "  4. Set up CloudWatch alarms for production monitoring"
echo ""
echo "📚 Useful commands:"
echo "  View logs: serverless logs -f api --stage $STAGE"
echo "  Remove deployment: serverless remove --stage $STAGE"
echo "  Update deployment: ./deploy.sh $STAGE"

deactivate
