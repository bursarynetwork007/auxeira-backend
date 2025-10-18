#!/bin/bash

# Auxeira Complete Platform Database Deployment Script
# This script sets up AWS credentials and deploys the DynamoDB database

set -e  # Exit on any error

echo "🚀 Auxeira Complete Platform Database Deployment"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "setup-complete-platform.js" ]; then
    print_error "setup-complete-platform.js not found. Please run this script from the auxeira-backend directory."
    exit 1
fi

# Set AWS credentials from environment or prompt for them
setup_aws_credentials() {
    print_status "Setting up AWS credentials..."
    
    # Check if AWS credentials are already configured
    if aws sts get-caller-identity >/dev/null 2>&1; then
        print_success "AWS credentials already configured"
        aws sts get-caller-identity
        return 0
    fi
    
    # Try to use environment variables from .env files
    if [ -f "backend/.env" ]; then
        print_status "Loading AWS credentials from backend/.env"
        export $(grep -E '^AWS_' backend/.env | xargs)
    elif [ -f ".env" ]; then
        print_status "Loading AWS credentials from .env"
        export $(grep -E '^AWS_' .env | xargs)
    fi
    
    # Set default region if not set
    export AWS_DEFAULT_REGION=${AWS_REGION:-us-east-1}
    
    # Check if we have the required credentials
    if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        print_warning "AWS credentials not found in environment files"
        print_status "Please provide your AWS credentials:"
        
        read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
        read -s -p "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
        echo
        read -p "AWS Region [us-east-1]: " AWS_REGION
        AWS_REGION=${AWS_REGION:-us-east-1}
        
        export AWS_ACCESS_KEY_ID
        export AWS_SECRET_ACCESS_KEY
        export AWS_DEFAULT_REGION=$AWS_REGION
    fi
    
    # Verify credentials
    print_status "Verifying AWS credentials..."
    if aws sts get-caller-identity >/dev/null 2>&1; then
        print_success "AWS credentials verified successfully"
        aws sts get-caller-identity
    else
        print_error "AWS credential verification failed"
        exit 1
    fi
}

# Install dependencies if needed
install_dependencies() {
    print_status "Checking Node.js dependencies..."
    
    if [ ! -d "node_modules" ]; then
        print_status "Installing Node.js dependencies..."
        npm install
    else
        print_success "Node.js dependencies already installed"
    fi
}

# Deploy the database
deploy_database() {
    print_status "Deploying Auxeira Complete Platform Database..."
    
    # Run the database setup script
    node setup-complete-platform.js setup
    
    if [ $? -eq 0 ]; then
        print_success "Database deployment completed successfully!"
    else
        print_error "Database deployment failed"
        exit 1
    fi
}

# Verify deployment
verify_deployment() {
    print_status "Verifying database deployment..."
    
    node setup-complete-platform.js status
    
    if [ $? -eq 0 ]; then
        print_success "Database verification completed"
    else
        print_warning "Database verification had issues, but deployment may still be successful"
    fi
}

# Show cost estimates
show_costs() {
    print_status "Calculating estimated costs..."
    
    node setup-complete-platform.js costs
}

# Main deployment process
main() {
    print_status "Starting Auxeira Complete Platform Database Deployment"
    
    # Step 1: Setup AWS credentials
    setup_aws_credentials
    
    # Step 2: Install dependencies
    install_dependencies
    
    # Step 3: Deploy database
    deploy_database
    
    # Step 4: Verify deployment
    verify_deployment
    
    # Step 5: Show cost estimates
    show_costs
    
    print_success "🎉 Auxeira Complete Platform Database Deployment Complete!"
    echo
    echo "📊 Your database now supports:"
    echo "   - 17 ESG Dashboards (SDG focus areas)"
    echo "   - VC Dashboard (Venture capital intelligence)"
    echo "   - Angel Dashboard (Individual investor tools)"
    echo "   - Government Dashboard (Policy maker interface)"
    echo "   - Impact Dashboard (Impact investment platform)"
    echo "   - Startup Dashboard (Entrepreneur tools)"
    echo "   - Corporate Dashboard (Partnership management)"
    echo
    echo "🚀 Next steps:"
    echo "   1. Start the backend API: npm start"
    echo "   2. Configure your frontend to use the API endpoints"
    echo "   3. Test the dashboard integrations"
    echo
    echo "📚 Documentation:"
    echo "   - API endpoints: Check complete-platform-backend.js"
    echo "   - Database schema: Check complete-dashboard-database.js"
    echo "   - Deployment guide: Check DYNAMODB_DEPLOYMENT_GUIDE.md"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "credentials")
        setup_aws_credentials
        ;;
    "status")
        setup_aws_credentials
        node setup-complete-platform.js status
        ;;
    "costs")
        setup_aws_credentials
        node setup-complete-platform.js costs
        ;;
    "cleanup")
        print_warning "This will delete ALL database tables!"
        read -p "Are you sure? Type 'DELETE' to confirm: " confirm
        if [ "$confirm" = "DELETE" ]; then
            setup_aws_credentials
            node setup-complete-platform.js cleanup
        else
            print_status "Cleanup cancelled"
        fi
        ;;
    *)
        echo "Usage: $0 [deploy|credentials|status|costs|cleanup]"
        echo "  deploy      - Full database deployment (default)"
        echo "  credentials - Setup AWS credentials only"
        echo "  status      - Check database status"
        echo "  costs       - Show cost estimates"
        echo "  cleanup     - Delete all tables (DANGER!)"
        exit 1
        ;;
esac
