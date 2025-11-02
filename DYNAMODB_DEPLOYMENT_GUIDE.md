# 🗄️ Auxeira ESG Platform - DynamoDB Central Database Guide

## Overview

This guide provides comprehensive instructions for deploying and managing the cost-effective DynamoDB central database for the Auxeira ESG platform.

## 🎯 **Why DynamoDB for Auxeira?**

### **Cost Advantages**
- **Pay-per-request pricing**: Only pay for actual usage
- **No server management**: Fully managed service
- **Auto-scaling**: Handles traffic spikes without manual intervention
- **Estimated monthly cost**: $15-50 for typical usage

### **Performance Benefits**
- **Single-digit millisecond latency**: Perfect for real-time dashboards
- **Global tables**: Multi-region replication for global users
- **Built-in security**: Encryption at rest and in transit
- **99.99% availability SLA**: Enterprise-grade reliability

### **Scalability Features**
- **Unlimited storage**: Grows with your data
- **Automatic partitioning**: Handles millions of requests
- **Backup and restore**: Point-in-time recovery
- **Streams integration**: Real-time data processing

## 📊 **Database Architecture**

### **Table Structure**

| Table Name | Purpose | Billing Mode | Est. Monthly Cost |
|------------|---------|--------------|-------------------|
| `auxeira-users` | User authentication | Pay-per-request | $5-10 |
| `auxeira-user-profiles` | ESG organization profiles | Pay-per-request | $8-15 |
| `auxeira-esg-reports` | AI-generated reports | Pay-per-request | $10-20 |
| `auxeira-projects` | Crowdfunding projects | Provisioned (5/2) | $3-5 |
| `auxeira-leaderboard` | Competitive intelligence | Provisioned (10/3) | $5-8 |
| `auxeira-user-activity` | Analytics tracking | Provisioned (2/5) | $2-4 |

**Total Estimated Cost: $33-62/month**

### **Key Features Supported**
- ✅ **User Authentication**: JWT-based with secure password hashing
- ✅ **Profile Management**: Mandatory completion with progress tracking
- ✅ **AI Report Generation**: 15 report types with premium monetization
- ✅ **Collaboration Platform**: Crowdfunding and expert matching
- ✅ **Competitive Intelligence**: Real-time leaderboards and benchmarking
- ✅ **Analytics Tracking**: User behavior and system performance monitoring

## 🚀 **Quick Start Deployment**

### **Prerequisites**
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region (us-east-1)

# Install Node.js dependencies
npm install aws-sdk express cors jsonwebtoken bcryptjs
```

### **1. Create DynamoDB Tables**
```bash
cd /workspaces/auxeira-backend

# Make setup script executable
chmod +x setup-dynamodb.js

# Create all tables with cost optimization
node setup-dynamodb.js setup
```

**Expected Output:**
```
🚀 Auxeira ESG Platform - DynamoDB Setup
==========================================

✅ AWS Credentials verified
   Account: 123456789012
   User: arn:aws:iam::123456789012:user/auxeira-admin

📋 Existing Auxeira Tables:
   No existing tables found

🔨 Creating DynamoDB Tables...

🔨 Creating table: auxeira-users
✅ Table auxeira-users created successfully
   Billing Mode: PAY_PER_REQUEST

🔨 Creating table: auxeira-user-profiles
✅ Table auxeira-user-profiles created successfully
   Billing Mode: PAY_PER_REQUEST

🔨 Creating table: auxeira-esg-reports
✅ Table auxeira-esg-reports created successfully
   Billing Mode: PAY_PER_REQUEST

🔨 Creating table: auxeira-projects
✅ Table auxeira-projects created successfully
   Billing Mode: PROVISIONED
   Read Capacity: 5
   Write Capacity: 2

🔨 Creating table: auxeira-leaderboard
✅ Table auxeira-leaderboard created successfully
   Billing Mode: PROVISIONED
   Read Capacity: 10
   Write Capacity: 3

⏳ Waiting for tables to become active...
✅ Table auxeira-users is now active
✅ Table auxeira-user-profiles is now active
✅ Table auxeira-esg-reports is now active
✅ Table auxeira-projects is now active
✅ Table auxeira-leaderboard is now active

🌱 Seeding initial data...
✅ Initial data seeded successfully

💰 Estimated Monthly Costs (USD):
   Pay-per-Request Tables:
     users: $2.50 (10000 reads, 1000 writes, 0.1GB)
     profiles: $4.13 (15000 reads, 2000 writes, 0.5GB)
     reports: $8.38 (25000 reads, 5000 writes, 2.0GB)
   Provisioned Tables:
     projects: $4.73 (5RCU, 2WCU, 0.2GB)
     leaderboard: $9.41 (10RCU, 3WCU, 0.1GB)
     activity: $5.53 (2RCU, 5WCU, 0.3GB)

   💵 Total Estimated Monthly Cost: $34.68
   📊 Cost Breakdown:
     - Compute: ~$24.28 (70%)
     - Storage: ~$10.40 (30%)

✅ DynamoDB Setup Complete!
```

### **2. Deploy Backend API**
```bash
# Set environment variables
export AWS_REGION=us-east-1
export JWT_SECRET=your-super-secure-jwt-secret-key
export NANOGPT5_API_KEY=your-openai-api-key
export THUNDERBIT_API_KEY=your-thunderbit-api-key

# Start the backend server
node esg-dashboard-backend.js
```

**Expected Output:**
```
🚀 Auxeira ESG Dashboard Backend running on port 3000
📊 Health check: http://localhost:3000/health
🔗 API Base URL: http://localhost:3000/api
```

### **3. Verify Deployment**
```bash
# Test health endpoint
curl http://localhost:3000/health

# Expected response:
{
  "success": true,
  "status": "healthy",
  "message": "Auxeira ESG Dashboard Backend is running!",
  "timestamp": "2025-10-17T10:30:00.000Z",
  "version": "2.0"
}

# Check table status
node setup-dynamodb.js status
```

## 🔧 **Backend Integration**

### **Environment Variables**
Create a `.env` file in your project root:
```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-token-secret

# AI Integration
NANOGPT5_API_KEY=sk-proj-your-openai-api-key
THUNDERBIT_API_KEY=your-thunderbit-api-key

# Payment Processing
PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key
PAYSTACK_SECRET_KEY=sk_live_YOUR_PAYSTACK_SECRET_KEY_paystack_secret_key

# Application
NODE_ENV=production
PORT=3000
```

### **Frontend Integration**
Update your ESG dashboard files to connect to the backend:

```javascript
// Add to your dashboard JavaScript
const API_BASE_URL = 'https://your-backend-domain.com/api';
// For local development: 'http://localhost:3000/api'

// Example: Save user profile
async function saveProfile(profileData) {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
    });
    
    const result = await response.json();
    return result;
}

// Example: Generate AI report
async function generateReport(reportType, profileData) {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}/reports/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            reportType,
            profile: profileData
        })
    });
    
    const result = await response.json();
    return result;
}
```

## 📈 **Monitoring and Analytics**

### **CloudWatch Metrics**
Monitor your DynamoDB tables in AWS CloudWatch:

```bash
# View table metrics
aws cloudwatch get-metric-statistics \
    --namespace AWS/DynamoDB \
    --metric-name ConsumedReadCapacityUnits \
    --dimensions Name=TableName,Value=auxeira-users \
    --start-time 2025-10-17T00:00:00Z \
    --end-time 2025-10-17T23:59:59Z \
    --period 3600 \
    --statistics Sum
```

### **Cost Monitoring**
```bash
# Check current month costs
aws ce get-cost-and-usage \
    --time-period Start=2025-10-01,End=2025-10-31 \
    --granularity MONTHLY \
    --metrics BlendedCost \
    --group-by Type=DIMENSION,Key=SERVICE
```

### **Performance Monitoring**
```bash
# Check table status and performance
node setup-dynamodb.js status
```

## 🔒 **Security Best Practices**

### **IAM Permissions**
Create a dedicated IAM user for Auxeira with minimal permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:BatchGetItem",
                "dynamodb:BatchWriteItem"
            ],
            "Resource": [
                "arn:aws:dynamodb:us-east-1:*:table/auxeira-*",
                "arn:aws:dynamodb:us-east-1:*:table/auxeira-*/index/*"
            ]
        }
    ]
}
```

### **Data Encryption**
- ✅ **Encryption at rest**: Enabled by default
- ✅ **Encryption in transit**: HTTPS/TLS for all API calls
- ✅ **JWT tokens**: Secure authentication with expiration
- ✅ **Password hashing**: bcrypt with salt rounds

### **Access Control**
- ✅ **CORS configuration**: Restricted to dashboard domains
- ✅ **Rate limiting**: Prevent abuse and DDoS attacks
- ✅ **Input validation**: Sanitize all user inputs
- ✅ **Error handling**: No sensitive data in error messages

## 💰 **Cost Optimization**

### **Current Optimization Strategies**
1. **Pay-per-request for variable workloads**: Users, profiles, reports
2. **Provisioned capacity for predictable workloads**: Projects, leaderboard
3. **TTL for automatic cleanup**: Old reports and activity logs
4. **Efficient indexing**: Only necessary global secondary indexes

### **Monthly Cost Breakdown**
```
Primary Tables (Pay-per-request):
- Users: $2.50/month (authentication, low volume)
- Profiles: $4.13/month (profile management, medium volume)
- Reports: $8.38/month (AI reports, high value content)

Secondary Tables (Provisioned):
- Projects: $4.73/month (crowdfunding, predictable usage)
- Leaderboard: $9.41/month (competitive intelligence, frequent reads)
- Activity: $5.53/month (analytics, high writes, low reads)

Total: $34.68/month
```

### **Scaling Cost Projections**
| Users | Monthly Cost | Features |
|-------|-------------|----------|
| 100 | $35 | Full platform |
| 1,000 | $85 | All features + analytics |
| 10,000 | $250 | Enterprise scale |
| 100,000 | $800 | Global deployment |

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Table Creation Fails**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify permissions
aws iam get-user

# Check region setting
echo $AWS_REGION
```

#### **2. High Costs**
```bash
# Check table usage
node setup-dynamodb.js status

# Review CloudWatch metrics
aws cloudwatch get-metric-statistics \
    --namespace AWS/DynamoDB \
    --metric-name ConsumedReadCapacityUnits \
    --dimensions Name=TableName,Value=auxeira-users \
    --start-time $(date -d '1 day ago' -u +%Y-%m-%dT%H:%M:%SZ) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
    --period 3600 \
    --statistics Sum
```

#### **3. Connection Issues**
```bash
# Test backend connectivity
curl -X GET http://localhost:3000/health

# Check DynamoDB connectivity
aws dynamodb list-tables --region us-east-1
```

#### **4. Performance Issues**
```bash
# Check table metrics
aws dynamodb describe-table --table-name auxeira-users

# Monitor throttling
aws logs filter-log-events \
    --log-group-name /aws/dynamodb/table \
    --filter-pattern "throttled"
```

## 🔄 **Backup and Recovery**

### **Automated Backups**
```bash
# Enable point-in-time recovery
aws dynamodb update-continuous-backups \
    --table-name auxeira-users \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

# Create on-demand backup
aws dynamodb create-backup \
    --table-name auxeira-users \
    --backup-name auxeira-users-backup-$(date +%Y%m%d)
```

### **Data Export**
```bash
# Export table data
aws dynamodb scan \
    --table-name auxeira-users \
    --output json > users-backup.json

# Import data (if needed)
aws dynamodb batch-write-item \
    --request-items file://users-backup.json
```

## 📋 **Maintenance Tasks**

### **Weekly Tasks**
- [ ] Review CloudWatch metrics for performance
- [ ] Check cost and usage reports
- [ ] Verify backup completion
- [ ] Monitor error logs

### **Monthly Tasks**
- [ ] Analyze cost optimization opportunities
- [ ] Review security audit logs
- [ ] Update capacity planning
- [ ] Performance tuning review

### **Quarterly Tasks**
- [ ] Security review and updates
- [ ] Disaster recovery testing
- [ ] Capacity planning review
- [ ] Cost optimization analysis

## 🎯 **Next Steps**

1. **Deploy to Production**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   
   # Deploy backend to AWS Lambda or EC2
   # Update frontend to use production API endpoints
   ```

2. **Enable Monitoring**
   ```bash
   # Set up CloudWatch alarms
   aws cloudwatch put-metric-alarm \
       --alarm-name "DynamoDB-HighReadThrottle" \
       --alarm-description "Alert when read throttling occurs" \
       --metric-name ReadThrottledEvents \
       --namespace AWS/DynamoDB \
       --statistic Sum \
       --period 300 \
       --threshold 0 \
       --comparison-operator GreaterThanThreshold
   ```

3. **Scale for Growth**
   - Monitor usage patterns
   - Adjust provisioned capacity
   - Consider global tables for international users
   - Implement caching layer (Redis/ElastiCache)

## ✅ **Success Metrics**

Your DynamoDB deployment is successful when:
- [ ] All 6 tables created and active
- [ ] Backend API responding to health checks
- [ ] User registration and authentication working
- [ ] Profile management functional
- [ ] AI report generation operational
- [ ] Leaderboard updates in real-time
- [ ] Monthly costs under $50
- [ ] Response times under 100ms
- [ ] 99.9%+ uptime achieved

**Your cost-effective, scalable DynamoDB central database is now ready to power the Auxeira ESG platform! 🚀**
