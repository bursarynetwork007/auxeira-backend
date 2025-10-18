# Auxeira Backend Deployment Guide

## Overview
This guide covers the deployment of the updated Auxeira backend with DynamoDB integration and full authentication capabilities.

## Changes Made

### 1. Backend Refactoring
- **New Lambda Function**: `backend/lambda-enhanced.js` - Complete authentication system
- **DynamoDB Service**: `backend/src/services/auth-dynamodb.service.js` - Database operations
- **Updated Configuration**: `backend/serverless.yml` - DynamoDB resources and IAM permissions

### 2. Frontend Updates
- **API Configuration**: `frontend/js/api-config.js` - Centralized API endpoints
- **Fixed URLs**: Updated all API calls to use correct backend URL
- **Script Loading**: Added proper script loading order in `index.html`

### 3. Infrastructure
- **DynamoDB Tables**: Users and Sessions tables with GSI
- **IAM Permissions**: Proper DynamoDB access permissions
- **CORS Configuration**: Updated to support CloudFront and S3 domains

## Deployment Steps

### Prerequisites
1. AWS CLI configured with appropriate permissions
2. Serverless Framework installed (`npm install -g serverless`)
3. Node.js 18.x or later

### Backend Deployment

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set environment variables** (optional, defaults provided):
   ```bash
   export JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   export JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
   ```

4. **Deploy to AWS**:
   ```bash
   serverless deploy
   ```

5. **Note the API Gateway URL** from the deployment output.

### Frontend Deployment

1. **Update API URL** in `frontend/js/api-config.js`:
   ```javascript
   BASE_URL: 'YOUR_NEW_API_GATEWAY_URL'
   ```

2. **Deploy frontend** to your S3 bucket/CloudFront distribution.

### Post-Deployment Verification

1. **Test health endpoint**:
   ```bash
   curl https://YOUR_API_URL/health
   ```

2. **Test registration**:
   ```bash
   curl -X POST https://YOUR_API_URL/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "TestPassword123",
       "firstName": "Test",
       "lastName": "User",
       "role": "founder"
     }'
   ```

3. **Verify DynamoDB tables** are created in AWS Console.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for access tokens | Auto-generated |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Auto-generated |
| `USERS_TABLE` | DynamoDB users table name | `auxeira-backend-users-dev` |
| `SESSIONS_TABLE` | DynamoDB sessions table name | `auxeira-backend-sessions-dev` |

## DynamoDB Schema

### Users Table
- **Primary Key**: `email` (String)
- **GSI**: `UserIdIndex` on `id` field
- **Attributes**: id, email, password, firstName, lastName, role, emailVerified, createdAt, updatedAt, lastLoginAt, loginCount, status

### Sessions Table
- **Primary Key**: `sessionId` (String)
- **GSI**: `UserIdIndex` on `userId` field
- **TTL**: `expiresAt` field for automatic cleanup
- **Attributes**: sessionId, userId, refreshToken, createdAt, expiresAt, isActive

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/signup` - User registration (alias)
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Token verification
- `GET /api/auth/profile` - Get user profile

### System
- `GET /health` - Health check
- `GET /api/status` - API status
- `GET /api/solana/test` - Solana integration test

### CAPTCHA
- `GET /api/captcha/generate` - Generate CAPTCHA
- `POST /api/captcha/verify` - Verify CAPTCHA

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your frontend domain is included in the CORS configuration
2. **DynamoDB Permissions**: Verify IAM role has proper DynamoDB permissions
3. **Token Issues**: Check JWT secrets are properly set
4. **Rate Limiting**: API has rate limiting enabled (5 auth requests per 15 minutes)

### Logs
Check CloudWatch logs for the Lambda function:
```bash
serverless logs -f api --tail
```

## Security Considerations

1. **Change JWT Secrets**: Use strong, unique secrets in production
2. **HTTPS Only**: Ensure all communication uses HTTPS
3. **Rate Limiting**: Built-in rate limiting protects against abuse
4. **Input Validation**: All inputs are validated and sanitized
5. **Password Hashing**: Passwords are hashed with bcrypt (12 rounds)

## Monitoring

- **CloudWatch Metrics**: Monitor Lambda performance and errors
- **DynamoDB Metrics**: Track read/write capacity and throttling
- **API Gateway Logs**: Monitor request patterns and errors

## Backup Strategy

- **DynamoDB**: Enable point-in-time recovery
- **Code**: Repository backup branch created: `backup-before-fixes-20250919-112654`
