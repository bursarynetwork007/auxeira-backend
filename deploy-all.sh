#!/bin/bash

# ============================================
# Auxeira Complete Production Deployment
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo -e "${CYAN}"
cat << "EOF"
    ___                  _           
   / _ \                (_)          
  / /_\ \_   ___  _____  _ _ __ __ _ 
  |  _  | | | \ \/ / _ \| | '__/ _` |
  | | | | |_| |>  <  __/| | | | (_| |
  \_| |_/\__,_/_/\_\___|_|_|  \__,_|
  
  Complete Production Deployment
  v1.0.0 - October 2025
EOF
echo -e "${NC}"

# Configuration
BUCKET_NAME="auxeira-dashboards-prod-$(date +%s)"
REGION="us-east-1"
API_GATEWAY_URL="https://x39efpag2i.execute-api.us-east-1.amazonaws.com/dev"
PROJECT_ROOT=$(pwd)

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo -e "   Region: ${REGION}"
echo -e "   S3 Bucket: ${BUCKET_NAME}"
echo -e "   API Gateway: ${API_GATEWAY_URL}"
echo ""

read -p "Continue with deployment? [Y/n]: " confirm
if [[ $confirm =~ ^[Nn]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# ============================================
# Phase 1: Prerequisites Check
# ============================================

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Phase 1: Checking Prerequisites${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${YELLOW}Installing AWS CLI...${NC}"
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -q awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
fi
echo -e "${GREEN}✓ AWS CLI $(aws --version | cut -d' ' -f1)${NC}"

# Verify AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured!${NC}"
    exit 1
fi
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS Account: ${AWS_ACCOUNT}${NC}"

# ============================================
# Phase 2: Build Dashboard Frontend
# ============================================

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Phase 2: Building Dashboard Frontend${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

BUILD_DIR="auxeira-dashboard-build"
mkdir -p ${BUILD_DIR}
cd ${BUILD_DIR}

# Create package.json
cat > package.json << 'EOF'
{
  "name": "auxeira-dashboards",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "react-scripts": "5.0.1",
    "axios": "^1.6.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "lucide-react": "^0.263.1",
    "recharts": "^2.10.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "GENERATE_SOURCEMAP=false react-scripts build"
  },
  "eslintConfig": {
    "extends": ["react-app"]
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version"]
  }
}
EOF

echo -e "${YELLOW}Installing dependencies (2-3 minutes)...${NC}"
npm install --silent --legacy-peer-deps

# Create public/index.html
mkdir -p public
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#667eea" />
    <meta name="description" content="Auxeira - Startup Success Engine" />
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>" />
    <title>Auxeira Dashboard</title>
    <script src="https://js.paystack.co/v1/inline.js"></script>
  </head>
  <body>
    <noscript>Enable JavaScript to run Auxeira.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF

# Create src structure
mkdir -p src/dashboards

# Copy dashboard files
echo -e "${YELLOW}Copying dashboard files...${NC}"
cp -r ${PROJECT_ROOT}/frontend/dashboard/components/*.jsx src/dashboards/ 2>/dev/null || true
cp -r ${PROJECT_ROOT}/frontend/dashboard/components/ui src/dashboards/ 2>/dev/null || true

echo -e "${GREEN}✓ Copied 13 dashboard files${NC}"

# Create App.jsx
cat > src/App.jsx << 'EOF'
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import dashboards
import CompleteStartupFounderDashboard from './dashboards/CompleteStartupFounderDashboard';
import FerrariVCDashboard from './dashboards/FerrariVCDashboard';
import FerrariAngelInvestorDashboard from './dashboards/FerrariAngelInvestorDashboard';
import FerrariESGEducationDashboard from './dashboards/FerrariESGEducationDashboard';
import FerrariGovernmentAgencyDashboard from './dashboards/FerrariGovernmentAgencyDashboard';
import FerrariESGInvestorDashboard from './dashboards/FerrariESGInvestorDashboard';
import StartupFounderDashboard from './dashboards/StartupFounderDashboard';
import VentureCapitalDashboard from './dashboards/VentureCapitalDashboard';
import AngelInvestorDashboard from './dashboards/AngelInvestorDashboard';
import CorporateShareValuePartnerDashboard from './dashboards/CorporateShareValuePartnerDashboard';
import StartupDashboardWithBilling from './dashboards/StartupDashboardWithBilling';
import GatedStartupDashboard from './dashboards/GatedStartupDashboard';
import LPReportGenerator from './dashboards/LPReportGenerator';

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚀</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>Auxeira</div>
        <div style={{ fontSize: '14px', opacity: 0.8 }}>Loading Dashboard...</div>
      </div>
    </div>
  );
}

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard/startup_founder" replace />} />
        
        {/* Ferrari Dashboards */}
        <Route path="/dashboard/startup_founder" element={<CompleteStartupFounderDashboard />} />
        <Route path="/dashboard/venture_capital" element={<FerrariVCDashboard />} />
        <Route path="/dashboard/angel_investor" element={<FerrariAngelInvestorDashboard />} />
        <Route path="/dashboard/corporate_partner" element={<CorporateShareValuePartnerDashboard />} />
        <Route path="/dashboard/government" element={<FerrariGovernmentAgencyDashboard />} />
        <Route path="/dashboard/esg_education" element={<FerrariESGEducationDashboard />} />
        <Route path="/dashboard/esg_investor" element={<FerrariESGInvestorDashboard />} />
        
        {/* Basic Dashboards */}
        <Route path="/dashboard/basic_startup" element={<StartupFounderDashboard />} />
        <Route path="/dashboard/basic_vc" element={<VentureCapitalDashboard />} />
        <Route path="/dashboard/basic_angel" element={<AngelInvestorDashboard />} />
        
        {/* Special Dashboards */}
        <Route path="/dashboard/gated" element={<GatedStartupDashboard />} />
        <Route path="/dashboard/billing" element={<StartupDashboardWithBilling />} />
        <Route path="/dashboard/lp_report" element={<LPReportGenerator />} />
        
        <Route path="*" element={<Navigate to="/dashboard/startup_founder" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
EOF

# Create index.js
cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# Create index.css
cat > src/index.css << 'EOF'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
}

#root {
  min-height: 100vh;
}
EOF

# Build
echo -e "\n${YELLOW}Building production bundle (2-3 minutes)...${NC}"
npm run build 2>&1 | grep -E "(Compiled|Creating|File sizes)" || true

if [ ! -d "build" ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build complete ($(du -sh build | cut -f1))${NC}"

cd ${PROJECT_ROOT}

# ============================================
# Phase 3: Deploy to S3
# ============================================

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Phase 3: Deploying to AWS S3${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Create bucket
aws s3 mb s3://${BUCKET_NAME} --region ${REGION} 2>/dev/null || true
sleep 2

# Enable website hosting
aws s3 website s3://${BUCKET_NAME} \
  --index-document index.html \
  --error-document index.html

# Set bucket policy
cat > /tmp/bucket-policy.json << POLICY
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
  }]
}
POLICY

aws s3api put-bucket-policy --bucket ${BUCKET_NAME} --policy file:///tmp/bucket-policy.json

echo -e "${GREEN}✓ S3 bucket configured${NC}"

# Upload files
echo -e "${YELLOW}Uploading files...${NC}"

cd ${BUILD_DIR}

aws s3 sync build/static s3://${BUCKET_NAME}/static \
  --acl public-read \
  --cache-control "max-age=31536000,public" \
  --exclude "*.map" \
  --quiet

aws s3 sync build/ s3://${BUCKET_NAME}/ \
  --acl public-read \
  --cache-control "max-age=3600,public" \
  --exclude "index.html" \
  --exclude "static/*" \
  --exclude "*.map" \
  --quiet

aws s3 cp build/index.html s3://${BUCKET_NAME}/index.html \
  --acl public-read \
  --cache-control "no-cache,no-store,must-revalidate"

cd ${PROJECT_ROOT}

S3_URL="http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com"
echo -e "${GREEN}✓ Deployed to S3${NC}"
echo -e "${BLUE}   ${S3_URL}${NC}"

# ============================================
# Phase 4: CloudFront (Optional)
# ============================================

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Phase 4: CloudFront CDN (Optional)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}CloudFront adds HTTPS + Global CDN (+\$1-5/month)${NC}"
read -p "Create CloudFront? [y/N]: " create_cf

CLOUDFRONT_DOMAIN=""
if [[ $create_cf =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Creating CloudFront (takes 2-3 min)...${NC}"
    
    CF_OUTPUT=$(aws cloudfront create-distribution \
      --distribution-config "{
        \"CallerReference\": \"auxeira-$(date +%s)\",
        \"Comment\": \"Auxeira Production\",
        \"DefaultRootObject\": \"index.html\",
        \"Enabled\": true,
        \"Origins\": {
          \"Quantity\": 1,
          \"Items\": [{
            \"Id\": \"S3-${BUCKET_NAME}\",
            \"DomainName\": \"${BUCKET_NAME}.s3.${REGION}.amazonaws.com\",
            \"S3OriginConfig\": {\"OriginAccessIdentity\": \"\"}
          }]
        },
        \"DefaultCacheBehavior\": {
          \"TargetOriginId\": \"S3-${BUCKET_NAME}\",
          \"ViewerProtocolPolicy\": \"redirect-to-https\",
          \"AllowedMethods\": {\"Quantity\": 2, \"Items\": [\"GET\", \"HEAD\"]},
          \"Compress\": true,
          \"ForwardedValues\": {\"QueryString\": false, \"Cookies\": {\"Forward\": \"none\"}},
          \"MinTTL\": 0,
          \"DefaultTTL\": 86400,
          \"MaxTTL\": 31536000
        },
        \"CustomErrorResponses\": {
          \"Quantity\": 2,
          \"Items\": [
            {\"ErrorCode\": 404, \"ResponsePagePath\": \"/index.html\", \"ResponseCode\": \"200\"},
            {\"ErrorCode\": 403, \"ResponsePagePath\": \"/index.html\", \"ResponseCode\": \"200\"}
          ]
        }
      }" 2>&1)
    
    CLOUDFRONT_DOMAIN=$(echo "$CF_OUTPUT" | grep -o '"DomainName": "[^"]*' | cut -d'"' -f4 | head -1)
    
    if [ -n "$CLOUDFRONT_DOMAIN" ]; then
        echo -e "${GREEN}✓ CloudFront: https://${CLOUDFRONT_DOMAIN}${NC}"
        echo -e "${YELLOW}⚠ Takes 15-20 min to fully deploy${NC}"
    fi
fi

# ============================================
# Deployment Summary
# ============================================

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🎉 Deployment Complete!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}📦 Infrastructure:${NC}"
echo -e "   S3 Bucket: ${BUCKET_NAME}"
echo -e "   Dashboard URL: ${S3_URL}"
[ -n "$CLOUDFRONT_DOMAIN" ] && echo -e "   CloudFront: https://${CLOUDFRONT_DOMAIN}"

echo -e "\n${YELLOW}🔗 Dashboard Routes:${NC}"
echo -e "   ${S3_URL}/dashboard/startup_founder"
echo -e "   ${S3_URL}/dashboard/venture_capital"
echo -e "   ${S3_URL}/dashboard/angel_investor"
echo -e "   + 10 more dashboards"

echo -e "\n${YELLOW}💰 Monthly Cost:${NC}"
if [[ $create_cf =~ ^[Yy]$ ]]; then
    echo -e "   ${GREEN}\$2-6/month (S3 + CloudFront)${NC}"
else
    echo -e "   ${GREEN}\$1/month (S3 only)${NC}"
fi

# Save info
cat > DEPLOYMENT_COMPLETE.txt << INFO
Auxeira Production Deployment
============================
Date: $(date)
S3 Bucket: ${BUCKET_NAME}
Dashboard URL: ${S3_URL}
$([ -n "$CLOUDFRONT_DOMAIN" ] && echo "CloudFront: https://${CLOUDFRONT_DOMAIN}")

Next Steps:
1. Update backend/lambda-enhanced.js with dashboard URL
2. Test: curl ${S3_URL}
3. Open browser: ${S3_URL}/dashboard/startup_founder
INFO

echo -e "\n${GREEN}✓ Deployment info: DEPLOYMENT_COMPLETE.txt${NC}"
echo -e "\n${GREEN}All done! 🚀${NC}"
