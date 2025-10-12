#!/bin/bash
# CloudFront Invalidation Script for Auxeira Dashboards

DIST_ID="${1:-E2SK5CDOUJ7KKB}"
PATHS="${2:-/*}"

echo "🔄 Invalidating CloudFront..."
echo "   Distribution: $DIST_ID"
echo "   Paths: $PATHS"
echo ""

INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id $DIST_ID \
    --paths "$PATHS" \
    --query 'Invalidation.Id' \
    --output text)

echo "✅ Invalidation created: $INVALIDATION_ID"
echo ""
echo "⏳ Checking status..."

# Wait a moment
sleep 5

STATUS=$(aws cloudfront get-invalidation \
    --distribution-id $DIST_ID \
    --id $INVALIDATION_ID \
    --query 'Invalidation.Status' \
    --output text)

echo "📊 Status: $STATUS"

if [ "$STATUS" = "Completed" ]; then
    echo "✅ Cache cleared immediately!"
else
    echo "⏰ Invalidation in progress (1-3 minutes)"
fi

echo ""
echo "🌐 Updated URLs:"
echo "   https://dashboard.auxeira.com/esg_education.html"
echo ""
