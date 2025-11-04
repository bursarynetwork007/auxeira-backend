# Auxeira Admin Credentials

**Created:** November 4, 2025  
**Status:** ✅ Active

---

## Admin User Details

**Email:** `gina@auxeira.com`  
**Password:** `SSEngine@25`  
**Role:** `admin`  
**User ID:** `88370b7a-5daf-4ab7-a5a0-4a8f8432db21`  
**Status:** `active`  
**Created:** `2025-11-04T08:55:37.959Z`

---

## Access

### Admin Dashboard
**URL:** [https://dashboard.auxeira.com/admin.html](https://dashboard.auxeira.com/admin.html)

### Login Page
**URL:** [https://auxeira.com](https://auxeira.com)

---

## Quick Login Test

```bash
curl -X POST https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gina@auxeira.com",
    "password": "SSEngine@25"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "88370b7a-5daf-4ab7-a5a0-4a8f8432db21",
      "email": "gina@auxeira.com",
      "firstName": "Gina",
      "lastName": "Admin",
      "role": "admin",
      "status": "active"
    },
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  }
}
```

---

## Admin Dashboard Features

### Overview Statistics
- Total users count
- Active users (last 30 days)
- User growth percentage
- Total startups
- New startups this month
- System health metrics

### User Management
- View all users
- User details (email, role, status, login history)
- User type distribution
- Search and filter (coming soon)

### Startup Management
- View all startups
- Startup metrics (SSE score, revenue, customers)
- Industry and stage distribution
- Geography tracking

### Analytics
- User registration trends
- Revenue trends
- User type distribution charts
- System performance metrics

### Activity Monitoring
- Recent activities
- Activity types and descriptions
- Timestamp tracking
- Status indicators

---

## Database Access

The admin user is stored in:
- **Table:** `auxeira-backend-users-prod`
- **Primary Key:** `email` = "gina@auxeira.com"
- **Region:** us-east-1

**Query User:**
```bash
aws dynamodb get-item \
  --table-name auxeira-backend-users-prod \
  --key '{"email":{"S":"gina@auxeira.com"}}' \
  --region us-east-1
```

---

## Security Notes

1. **Password:** Strong password with special characters (SSEngine@25)
2. **Role:** Explicitly set to "admin" for full access
3. **JWT Token:** Required for all admin API calls
4. **Auth Protection:** Dashboard redirects to login if no token found
5. **Access Control:** Lambda enforces role-based access

### Allowed Roles for Admin Dashboard
- `admin` (primary)
- `founder` (for testing)
- `startup_founder` (for testing)

**Note:** For production, you should restrict access to `admin` role only by updating the Lambda function.

---

## Password Reset

If you need to reset the password:

```bash
# Option 1: Delete and recreate user
aws dynamodb delete-item \
  --table-name auxeira-backend-users-prod \
  --key '{"email":{"S":"gina@auxeira.com"}}' \
  --region us-east-1

# Then register again with new password
curl -X POST https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gina@auxeira.com",
    "password": "NEW_PASSWORD_HERE",
    "firstName": "Gina",
    "lastName": "Admin",
    "role": "admin"
  }'
```

**Option 2:** Implement a password reset endpoint (recommended for production)

---

## Troubleshooting

### Cannot Login
1. Verify email and password are correct
2. Check user status is "active"
3. Verify user exists in database
4. Check Lambda logs for errors

### Cannot Access Admin Dashboard
1. Verify you're logged in (check localStorage for token)
2. Check token is valid (not expired)
3. Verify role is "admin", "founder", or "startup_founder"
4. Check browser console for errors

### Token Expired
- Tokens expire after 24 hours
- Simply login again to get a new token
- Refresh tokens are valid for 7 days

---

## Additional Admin Users

To create more admin users:

```bash
curl -X POST https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@auxeira.com",
    "password": "SecurePassword123!",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'
```

---

## Related Documentation

- [ADMIN_DASHBOARD_DEPLOYMENT.md](./ADMIN_DASHBOARD_DEPLOYMENT.md) - Full deployment guide
- [AUTHENTICATION_ANALYSIS.md](./AUTHENTICATION_ANALYSIS.md) - Auth system overview
- [DEPLOYMENT_SPEC.md](./DEPLOYMENT_SPEC.md) - General deployment info

---

**⚠️ IMPORTANT:** Keep these credentials secure. Do not commit this file to public repositories.

**Status:** ✅ Active and Tested  
**Last Verified:** November 4, 2025
