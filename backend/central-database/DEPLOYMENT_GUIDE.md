# Auxeira Central Database - AWS Deployment Guide

## 🎯 Deployment Overview

This guide provides step-by-step instructions for deploying the Auxeira Central Database system to your existing AWS infrastructure, integrating with your current production environment.

## 📋 Pre-Deployment Checklist

### AWS Infrastructure Requirements

✅ **Existing Resources (from your specification):**
- AWS Account with appropriate permissions
- VPC with public/private subnets
- Security groups configured
- Route 53 hosted zone (for custom domain)
- ACM certificate for HTTPS

✅ **New Resources (will be created):**
- Aurora PostgreSQL cluster
- ElastiCache Redis cluster
- Lambda functions
- API Gateway
- CloudWatch dashboards

### Prerequisites Verification

```bash
# 1. Verify AWS CLI access
aws sts get-caller-identity

# 2. Check existing infrastructure
aws ec2 describe-vpcs
aws rds describe-db-clusters
aws apigateway get-rest-apis

# 3. Verify domain and certificate
aws route53 list-hosted-zones
aws acm list-certificates --region us-east-1
```

## 🚀 Step-by-Step Deployment

### Step 1: Environment Setup

1. **Clone the central database repository:**
```bash
cd /path/to/your/projects
git clone <central-db-repository>
cd auxeira-central-db
```

2. **Install dependencies:**
```bash
# Node.js dependencies
npm install

# Python dependencies
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 2: Configuration

1. **Update `serverless.yml` with your AWS resources:**

```yaml
# Update these values in serverless.yml
custom:
  rdsEndpoint:
    prod: your-existing-rds-endpoint.amazonaws.com  # If you have one
    
  securityGroupId:
    prod: sg-your-security-group-id
    
  subnetIds:
    prod:
      subnet1: subnet-your-private-subnet-1
      subnet2: subnet-your-private-subnet-2
```

2. **Set up Parameter Store values:**
```bash
# Database credentials
aws ssm put-parameter \
  --name "/auxeira/database/username" \
  --value "auxeira_admin" \
  --type "String" \
  --description "Database username for Auxeira Central DB"

aws ssm put-parameter \
  --name "/auxeira/database/password" \
  --value "$(openssl rand -base64 32)" \
  --type "SecureString" \
  --description "Database password for Auxeira Central DB"

# API secret key
aws ssm put-parameter \
  --name "/auxeira/api/secret-key" \
  --value "$(openssl rand -base64 64)" \
  --type "SecureString" \
  --description "JWT secret key for Auxeira API"
```

### Step 3: Deploy Infrastructure

1. **Deploy to production:**
```bash
./deploy.sh prod us-east-1 default
```

2. **Monitor deployment progress:**
```bash
# Watch CloudFormation stack
aws cloudformation describe-stacks \
  --stack-name auxeira-central-database-prod \
  --query 'Stacks[0].StackStatus'

# Check Lambda functions
aws lambda list-functions \
  --query 'Functions[?contains(FunctionName, `auxeira-central-database-prod`)]'
```

### Step 4: Database Initialization

1. **Initialize database schema:**
```bash
aws lambda invoke \
  --function-name auxeira-central-database-prod-initDatabase \
  --payload '{"action": "initialize"}' \
  response.json

cat response.json
```

2. **Verify database tables:**
```bash
# Connect to database and verify
psql -h your-rds-endpoint -U auxeira_admin -d auxeira_central_prod -c "\dt"
```

### Step 5: Integration with Existing Dashboards

1. **Update your existing dashboard HTML files:**

Add the central database client library:
```html
<!-- Add before closing </body> tag -->
<script src="https://your-cdn/auxeira-central-client.js"></script>
<script src="https://your-cdn/startup-founder-integration.js"></script>
```

2. **Update API endpoints in your dashboards:**

Replace existing API calls with central database calls:
```javascript
// Old approach (direct synthetic data)
const syntheticData = generateLocalData();

// New approach (central database)
const auxeiraClient = new AuxeiraCentralClient({
    apiEndpoint: 'https://your-api-gateway-url/prod'
});
const realData = await auxeiraClient.initializeDashboard();
```

### Step 6: DNS and Domain Setup

1. **Create custom domain for API:**
```bash
# Create custom domain in API Gateway
aws apigateway create-domain-name \
  --domain-name api-central.auxeira.com \
  --certificate-arn arn:aws:acm:us-east-1:your-account:certificate/your-cert-id

# Create Route 53 record
aws route53 change-resource-record-sets \
  --hosted-zone-id your-hosted-zone-id \
  --change-batch file://dns-change.json
```

2. **Update CORS settings for your frontend domain:**
```yaml
# In serverless.yml, update CORS settings
cors:
  origin: 
    - https://auxeira.com
    - https://www.auxeira.com
    - http://auxeira-com-frontend-prod.s3-website-us-east-1.amazonaws.com
```

## 🔧 Integration with Existing Architecture

### Current Architecture Integration

Your existing setup:
```
Frontend (S3) → API Gateway → Lambda → DynamoDB
```

New integrated architecture:
```
Frontend (S3) → API Gateway → Lambda → PostgreSQL (Central DB)
                     ↓
                DynamoDB (Legacy data)
```

### Migration Strategy

1. **Phase 1: Parallel Operation**
   - Deploy central database alongside existing DynamoDB
   - Update dashboards to use central database for new data
   - Keep existing DynamoDB for historical data

2. **Phase 2: Data Migration** (Optional)
   - Migrate critical data from DynamoDB to PostgreSQL
   - Update all dashboards to use central database
   - Keep DynamoDB as backup

3. **Phase 3: Full Migration** (Future)
   - Deprecate DynamoDB tables
   - Use only central database

### Code Changes Required

1. **Update your existing Lambda functions:**

```javascript
// Add to your existing Lambda functions
const { DatabaseManager } = require('./utils/database-manager');

exports.handler = async (event, context) => {
    const dbManager = new DatabaseManager({
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });
    
    // Your existing logic here
    // Replace DynamoDB calls with PostgreSQL calls
};
```

2. **Update dashboard JavaScript:**

```javascript
// Replace existing data fetching
// Old:
const data = await fetch('/api/dashboard-data');

// New:
const auxeiraClient = new AuxeiraCentralClient({
    apiEndpoint: process.env.CENTRAL_API_ENDPOINT
});
const data = await auxeiraClient.getDashboardMetrics();
```

## 📊 Monitoring and Verification

### Health Checks

1. **API Health:**
```bash
curl https://api-central.auxeira.com/health
```

2. **Database Health:**
```bash
aws lambda invoke \
  --function-name auxeira-central-database-prod-healthCheck \
  response.json
```

3. **Synthetic Data Generation:**
```bash
aws lambda invoke \
  --function-name auxeira-central-database-prod-generateSyntheticData \
  --payload '{"userType": "startup_founder", "count": 10}' \
  response.json
```

### CloudWatch Monitoring

Set up CloudWatch alarms:
```bash
# API Gateway errors
aws cloudwatch put-metric-alarm \
  --alarm-name "Auxeira-API-Errors" \
  --alarm-description "API Gateway 5xx errors" \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold

# Database connections
aws cloudwatch put-metric-alarm \
  --alarm-name "Auxeira-DB-Connections" \
  --alarm-description "Database connection count" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

## 🔒 Security Configuration

### VPC Security Groups

Update your security groups to allow:

```bash
# Database access from Lambda functions
aws ec2 authorize-security-group-ingress \
  --group-id sg-your-db-security-group \
  --protocol tcp \
  --port 5432 \
  --source-group sg-your-lambda-security-group

# Redis access from Lambda functions  
aws ec2 authorize-security-group-ingress \
  --group-id sg-your-redis-security-group \
  --protocol tcp \
  --port 6379 \
  --source-group sg-your-lambda-security-group
```

### IAM Permissions

Ensure your Lambda execution role has:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "rds:DescribeDBInstances",
                "rds:DescribeDBClusters",
                "elasticache:DescribeCacheClusters",
                "ssm:GetParameter",
                "ssm:GetParameters"
            ],
            "Resource": "*"
        }
    ]
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Timeout:**
```bash
# Check VPC configuration
aws ec2 describe-security-groups --group-ids sg-your-db-security-group
aws ec2 describe-subnets --subnet-ids subnet-your-subnet-id
```

2. **Lambda Function Errors:**
```bash
# Check function logs
aws logs tail /aws/lambda/auxeira-central-database-prod-api --follow
```

3. **API Gateway Issues:**
```bash
# Check API Gateway logs
aws logs describe-log-groups --log-group-name-prefix "API-Gateway-Execution-Logs"
```

### Recovery Procedures

1. **Rollback Deployment:**
```bash
serverless remove --stage prod
# Redeploy previous version
```

2. **Database Recovery:**
```bash
# Restore from automated backup
aws rds restore-db-cluster-from-snapshot \
  --db-cluster-identifier auxeira-central-db-prod-restored \
  --snapshot-identifier your-snapshot-id
```

## 📈 Performance Optimization

### Database Optimization

1. **Connection Pooling:**
```python
# Already implemented in DatabaseManager
pool = ThreadedConnectionPool(1, 20, **connection_params)
```

2. **Query Optimization:**
```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_dashboard_metrics_user_timestamp 
ON dashboard_metrics(user_id, metric_timestamp DESC);
```

3. **Read Replicas:**
```yaml
# Add to serverless.yml
AuxeiraRDSReadReplica:
  Type: AWS::RDS::DBInstance
  Properties:
    SourceDBInstanceIdentifier: !Ref AuxeiraRDSInstance
    DBInstanceClass: db.r6g.large
```

### Caching Strategy

1. **Redis Configuration:**
```python
# Implement caching in API endpoints
import redis
cache = redis.Redis(host=os.environ['REDIS_HOST'])

# Cache dashboard metrics for 5 minutes
cache.setex(f"metrics:{user_id}", 300, json.dumps(metrics))
```

## 🎯 Next Steps

### Immediate Actions (Week 1)

1. ✅ Deploy central database to production
2. ✅ Initialize database schema
3. ✅ Test all API endpoints
4. ✅ Update one dashboard (startup founder) as pilot
5. ✅ Monitor performance and errors

### Short-term Goals (Month 1)

1. 🔄 Integrate all 7 dashboard types
2. 🔄 Migrate critical data from DynamoDB
3. 🔄 Set up comprehensive monitoring
4. 🔄 Implement automated backups
5. 🔄 Performance optimization

### Long-term Goals (Quarter 1)

1. 🎯 Complete migration from DynamoDB
2. 🎯 Implement advanced analytics
3. 🎯 Add real-time notifications
4. 🎯 Scale for increased load
5. 🎯 Add machine learning features

## 📞 Support and Maintenance

### Monitoring Checklist

- [ ] CloudWatch alarms configured
- [ ] Log aggregation set up
- [ ] Performance baselines established
- [ ] Backup verification automated
- [ ] Security scanning enabled

### Maintenance Schedule

- **Daily**: Health checks, error monitoring
- **Weekly**: Performance review, capacity planning
- **Monthly**: Security updates, backup testing
- **Quarterly**: Architecture review, optimization

---

**🎉 Congratulations! Your Auxeira Central Database is now ready for production use.**

For additional support, refer to the main README.md or contact the development team.
