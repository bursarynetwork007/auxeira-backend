#!/bin/bash

echo "=========================================="
echo "CloudFront Distribution Test Suite"
echo "=========================================="
echo ""

if [ -z "$1" ]; then
  echo "Usage: ./test-distribution.sh <cloudfront-domain>"
  echo "Example: ./test-distribution.sh d1234567890.cloudfront.net"
  exit 1
fi

DOMAIN=$1
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Testing: https://$DOMAIN"
echo ""

# Test 1: File Size
echo "Test 1: File Size"
echo "----------------------------------------"
SIZE=$(curl -s -I "https://$DOMAIN/startup_founder.html" | grep -i content-length | awk '{print $2}' | tr -d '\r')
if [ "$SIZE" -gt 230000 ]; then
  echo -e "${GREEN}✓ PASS${NC} - File size: $SIZE bytes (expected ~239KB)"
else
  echo -e "${RED}✗ FAIL${NC} - File size: $SIZE bytes (expected ~239KB)"
fi
echo ""

# Test 2: Cache Headers
echo "Test 2: Cache Headers"
echo "----------------------------------------"
CACHE=$(curl -s -I "https://$DOMAIN/startup_founder.html" | grep -i cache-control | tr -d '\r')
if echo "$CACHE" | grep -q "max-age=60"; then
  echo -e "${GREEN}✓ PASS${NC} - $CACHE"
else
  echo -e "${YELLOW}⚠ WARNING${NC} - $CACHE"
  echo "  Expected: cache-control: public, max-age=60, must-revalidate"
fi
echo ""

# Test 3: Compression
echo "Test 3: Compression"
echo "----------------------------------------"
ENCODING=$(curl -s -I "https://$DOMAIN/startup_founder.html" | grep -i content-encoding | tr -d '\r')
if [ -n "$ENCODING" ]; then
  echo -e "${GREEN}✓ PASS${NC} - $ENCODING"
else
  echo -e "${YELLOW}⚠ WARNING${NC} - No compression detected"
fi
echo ""

# Test 4: Profile Modal
echo "Test 4: Profile Modal Exists"
echo "----------------------------------------"
MODAL_COUNT=$(curl -s "https://$DOMAIN/startup_founder.html" | grep -c "profileModal")
if [ "$MODAL_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ PASS${NC} - Profile modal found ($MODAL_COUNT occurrences)"
else
  echo -e "${RED}✗ FAIL${NC} - Profile modal NOT found"
fi
echo ""

# Test 5: Activities Count
echo "Test 5: Activities Count"
echo "----------------------------------------"
ACTIVITIES=$(curl -s "https://$DOMAIN/startup_founder.html" | grep -o "id:" | wc -l)
if [ "$ACTIVITIES" -gt 30 ]; then
  echo -e "${GREEN}✓ PASS${NC} - Found $ACTIVITIES activity entries (expected ~37)"
else
  echo -e "${RED}✗ FAIL${NC} - Found only $ACTIVITIES activity entries (expected ~37)"
fi
echo ""

# Test 6: HTTP/2
echo "Test 6: HTTP/2 Support"
echo "----------------------------------------"
HTTP_VERSION=$(curl -s -I "https://$DOMAIN/startup_founder.html" | head -1 | awk '{print $1}')
if echo "$HTTP_VERSION" | grep -q "HTTP/2"; then
  echo -e "${GREEN}✓ PASS${NC} - $HTTP_VERSION"
else
  echo -e "${YELLOW}⚠ WARNING${NC} - $HTTP_VERSION (expected HTTP/2)"
fi
echo ""

# Test 7: SSL Certificate
echo "Test 7: SSL Certificate"
echo "----------------------------------------"
SSL_INFO=$(echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | grep "subject=")
if [ -n "$SSL_INFO" ]; then
  echo -e "${GREEN}✓ PASS${NC} - SSL certificate valid"
  echo "  $SSL_INFO"
else
  echo -e "${RED}✗ FAIL${NC} - SSL certificate issue"
fi
echo ""

# Test 8: Response Time
echo "Test 8: Response Time"
echo "----------------------------------------"
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "https://$DOMAIN/startup_founder.html")
echo "Response time: ${RESPONSE_TIME}s"
if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
  echo -e "${GREEN}✓ PASS${NC} - Fast response (<2s)"
elif (( $(echo "$RESPONSE_TIME < 5.0" | bc -l) )); then
  echo -e "${YELLOW}⚠ WARNING${NC} - Acceptable response (2-5s)"
else
  echo -e "${RED}✗ FAIL${NC} - Slow response (>5s)"
fi
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo "Distribution: $DOMAIN"
echo "All critical tests should pass before DNS update"
echo ""
echo "Next steps:"
echo "1. If all tests pass, update DNS to point to this distribution"
echo "2. Wait for DNS propagation (5-15 minutes)"
echo "3. Run this test again with: dashboard.auxeira.com"
echo "4. Monitor for 24 hours before deleting old distribution"
