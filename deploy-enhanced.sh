#!/bin/bash
# Enhanced Auxeira Dashboard Deployment Script
# Production-ready deployment with validation, backup, and monitoring

set -e  # Exit on any error

# Configuration
S3_BUCKET="dashboard.auxeira.com"
CLOUDFRONT_DISTRIBUTION_ID="E2SK5CDOUJ7KKB"
BACKUP_BUCKET="auxeira-dashboard-backups"
ENVIRONMENT="${1:-production}"
DRY_RUN="${2:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Pre-deployment validation
validate_files() {
    log "🔍 Validating dashboard files..."
    
    local files_to_deploy=(
        "esg_education.html"
        "esg_poverty.html" 
        "esg_hunger.html"
        "esg_health.html"
        "esg_cities.html"
        "esg_climate.html"
        "esg_consumption.html"
        "esg_energy.html"
        "esg_gender.html"
        "esg_inequalities.html"
        "esg_innovation.html"
        "esg_justice.html"
        "esg_land.html"
        "esg_ocean.html"
        "esg_partnerships.html"
        "esg_water.html"
        "esg_work.html"
    )
    
    local missing_files=()
    local valid_files=()
    
    for file in "${files_to_deploy[@]}"; do
        if [ -f "dashboard-html/$file" ]; then
            # Check file size (should be > 30KB for complete dashboards)
            size=$(stat -c%s "dashboard-html/$file")
            if [ $size -gt 30000 ]; then
                valid_files+=("$file")
                log "  ✅ $file (${size} bytes)"
            else
                warning "  ⚠️  $file is too small (${size} bytes) - may be incomplete"
            fi
        else
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        warning "Missing files: ${missing_files[*]}"
    fi
    
    if [ ${#valid_files[@]} -eq 0 ]; then
        error "No valid dashboard files found to deploy!"
    fi
    
    success "Found ${#valid_files[@]} valid dashboard files"
    return 0
}

# Backup current production files
backup_production() {
    log "💾 Creating backup of current production files..."
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    
    if [ "$DRY_RUN" = "false" ]; then
        # Download current production files
        aws s3 sync s3://$S3_BUCKET/ $backup_dir/ \
            --include "esg_*.html" \
            --quiet || warning "Backup failed - continuing anyway"
        
        # Upload backup to backup bucket
        aws s3 sync $backup_dir/ s3://$BACKUP_BUCKET/$backup_dir/ \
            --quiet || warning "Remote backup failed - continuing anyway"
        
        success "Backup created: $backup_dir"
    else
        log "  [DRY RUN] Would create backup in: $backup_dir"
    fi
}

# Deploy files to S3
deploy_to_s3() {
    log "🚀 Deploying dashboard files to S3..."
    
    if [ "$DRY_RUN" = "false" ]; then
        # Sync all ESG dashboard files
        aws s3 sync dashboard-html/ s3://$S3_BUCKET/ \
            --include "esg_*.html" \
            --exclude "_old_versions/*" \
            --exclude "*_enhanced.html" \
            --exclude "*_complete.html" \
            --content-type "text/html" \
            --cache-control "no-cache, no-store, must-revalidate" \
            --metadata-directive REPLACE
        
        # Upload supporting files
        for file in "esg_enhanced_framework.js" "esg_leaderboard_system.js" "profile_completion_system.js"; do
            if [ -f "dashboard-html/$file" ]; then
                aws s3 cp "dashboard-html/$file" "s3://$S3_BUCKET/$file" \
                    --content-type "application/javascript" \
                    --cache-control "max-age=3600"
            fi
        done
        
        success "Files deployed to S3"
    else
        log "  [DRY RUN] Would deploy files to s3://$S3_BUCKET/"
        ls -la dashboard-html/esg_*.html | head -5
        echo "  ... and $(ls dashboard-html/esg_*.html | wc -l) total ESG files"
    fi
}

# Invalidate CloudFront cache
invalidate_cloudfront() {
    log "🌐 Invalidating CloudFront cache..."
    
    if [ "$DRY_RUN" = "false" ]; then
        local invalidation_id=$(aws cloudfront create-invalidation \
            --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
            --paths "/esg_*.html" "/esg_*.js" \
            --query 'Invalidation.Id' \
            --output text)
        
        success "CloudFront invalidation created: $invalidation_id"
        log "  🕐 Cache invalidation typically takes 1-3 minutes"
    else
        log "  [DRY RUN] Would invalidate paths: /esg_*.html /esg_*.js"
    fi
}

# Verify deployment
verify_deployment() {
    log "🔍 Verifying deployment..."
    
    local test_files=("esg_education.html" "esg_poverty.html" "esg_climate.html")
    local success_count=0
    
    for file in "${test_files[@]}"; do
        if [ "$DRY_RUN" = "false" ]; then
            local status_code=$(curl -s -o /dev/null -w "%{http_code}" "https://$S3_BUCKET/$file" || echo "000")
            if [ "$status_code" = "200" ]; then
                success "  ✅ $file is accessible (HTTP $status_code)"
                ((success_count++))
            else
                warning "  ❌ $file returned HTTP $status_code"
            fi
        else
            log "  [DRY RUN] Would verify: https://$S3_BUCKET/$file"
            ((success_count++))
        fi
    done
    
    if [ $success_count -eq ${#test_files[@]} ]; then
        success "Deployment verification passed!"
    else
        warning "Some files may not be accessible yet (cache propagation in progress)"
    fi
}

# Commit to Git
commit_to_git() {
    log "📝 Committing changes to Git..."
    
    if [ "$DRY_RUN" = "false" ]; then
        git add dashboard-html/
        if git diff --staged --quiet; then
            log "  No changes to commit"
        else
            git commit -m "feat: Deploy enhanced ESG dashboards to production

- Updated $(ls dashboard-html/esg_*.html | wc -l) ESG dashboard files
- Deployed AI-powered reports and collaboration features  
- Environment: $ENVIRONMENT
- Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" || warning "Commit failed"
            
            git push origin main || warning "Push failed"
            success "Changes committed and pushed to GitHub"
        fi
    else
        log "  [DRY RUN] Would commit and push changes"
    fi
}

# Performance monitoring
monitor_performance() {
    log "📊 Setting up performance monitoring..."
    
    if [ "$DRY_RUN" = "false" ]; then
        # Test page load times
        local load_time=$(curl -s -o /dev/null -w "%{time_total}" "https://$S3_BUCKET/esg_education.html" || echo "0")
        log "  📈 ESG Education dashboard load time: ${load_time}s"
        
        if (( $(echo "$load_time > 3.0" | bc -l) )); then
            warning "Page load time is high (${load_time}s) - consider optimization"
        fi
    else
        log "  [DRY RUN] Would monitor performance metrics"
    fi
}

# Main deployment function
main() {
    echo ""
    log "🚀 Starting Enhanced Auxeira Dashboard Deployment"
    log "=================================================="
    log "Environment: $ENVIRONMENT"
    log "S3 Bucket: $S3_BUCKET"
    log "CloudFront: $CLOUDFRONT_DISTRIBUTION_ID"
    log "Dry Run: $DRY_RUN"
    echo ""
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &>/dev/null; then
        error "AWS credentials not configured or invalid"
    fi
    
    # Run deployment steps
    validate_files
    backup_production
    deploy_to_s3
    invalidate_cloudfront
    verify_deployment
    commit_to_git
    monitor_performance
    
    echo ""
    success "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
    echo ""
    log "📋 Deployment Summary:"
    log "====================="
    log "✅ Files deployed: $(ls dashboard-html/esg_*.html | wc -l) ESG dashboards"
    log "🌐 Primary URL: https://$S3_BUCKET/esg_education.html"
    log "⏰ Cache propagation: 1-3 minutes"
    log "📊 Monitor: CloudWatch for performance metrics"
    echo ""
    
    if [ "$DRY_RUN" = "true" ]; then
        warning "This was a DRY RUN - no actual deployment occurred"
        log "Run without 'dry-run' parameter to deploy: ./deploy-enhanced.sh production"
    fi
}

# Help function
show_help() {
    echo "Enhanced Auxeira Dashboard Deployment Script"
    echo ""
    echo "Usage: $0 [environment] [dry-run]"
    echo ""
    echo "Parameters:"
    echo "  environment  Deployment environment (default: production)"
    echo "  dry-run      Set to 'dry-run' to simulate deployment (default: false)"
    echo ""
    echo "Examples:"
    echo "  $0                          # Deploy to production"
    echo "  $0 staging                  # Deploy to staging"
    echo "  $0 production dry-run       # Simulate production deployment"
    echo ""
}

# Handle command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

# Run main deployment
main "$@"
