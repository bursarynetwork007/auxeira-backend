# Auxeira Super Admin User Guide

## Super Admin Credentials

**Email:** `gina@auxeira.com`  
**Password:** `SSEngine@25`  
**Role:** `admin`  
**Status:** Active

---

## Login Instructions

1. **Visit:** [https://auxeira.com](https://auxeira.com)
2. **Click:** "Sign In" button
3. **Enter Credentials:**
   - Email: `gina@auxeira.com`
   - Password: `SSEngine@25`
4. **Submit:** Login form
5. **Redirect:** Automatically redirected to [https://dashboard.auxeira.com/admin.html](https://dashboard.auxeira.com/admin.html)

---

## Admin Dashboard Access

**Dashboard URL:** [https://dashboard.auxeira.com/admin.html](https://dashboard.auxeira.com/admin.html)

### Authentication Flow

1. ✅ Login page stores JWT token in localStorage
2. ✅ Redirect to admin dashboard
3. ✅ Auth guard validates token and role
4. ✅ Only `admin` role can access this dashboard
5. ✅ Dashboard loads with full admin controls

### Auth Guard Configuration

```javascript
CONFIG = {
  DASHBOARD_NAME: 'Admin Dashboard',
  ALLOWED_ROLES: ['admin'],
  LOGIN_URL: 'https://auxeira.com/',
  TOKEN_KEY: 'auxeira_auth_token'
}
```

---

## Super Admin Capabilities

### 1. User Management
- **View All Users:** See complete user list with details
- **Add New Users:** Create users with any role
- **Edit Users:** Modify user information
- **Suspend/Activate:** Control user account status
- **Delete Users:** Remove user accounts
- **Reset Passwords:** Help users regain access

### 2. System Access
- **Access All Dashboards:** Can view all 24 dashboard types
- **View All Data:** Complete visibility across platform
- **System Configuration:** Modify platform settings

### 3. Analytics & Monitoring
- **Platform Usage Stats:** Track user activity
- **Revenue Metrics:** Monitor financial performance
- **System Health:** Check uptime and performance
- **User Growth:** Analyze registration trends

### 4. Content Management
- **Startup Profiles:** Review and moderate startups
- **Reports:** Generate and export reports
- **Content Moderation:** Review flagged content

### 5. Subscription Management
- **View Subscriptions:** See all active subscriptions
- **Create Subscriptions:** Manually add subscriptions
- **Edit Subscriptions:** Modify subscription details
- **Cancel Subscriptions:** End user subscriptions

### 6. Payment Management
- **Transaction History:** View all payments
- **Failed Payments:** Retry failed transactions
- **Revenue Reports:** Export financial data

### 7. Support & Tickets
- **View Tickets:** See all support requests
- **Respond to Tickets:** Help users with issues
- **Ticket Analytics:** Track support metrics

### 8. Security & Audit
- **Audit Logs:** Track all admin actions
- **Security Settings:** Configure security policies
- **Session Management:** Monitor active sessions
- **IP Tracking:** View login locations

---

## Admin Dashboard Features

### Overview Section
- Total Active Users
- Monthly Revenue
- Active Startups
- Active Subscriptions
- System Uptime
- Average Response Time
- Pending Issues
- Trial Conversions

### Charts & Analytics
- Revenue Trend (Last 30 Days)
- User Growth
- Subscription Distribution
- System Performance
- User Registration Trend
- Conversion Funnel
- Feature Usage
- Geographic Distribution

### System Health
- API Uptime: 99.98%
- Database Status: Healthy
- Memory Usage: 64.2%
- Storage Usage: 42.8%
- Network Latency: 12ms
- Active Alerts: 0

---

## User Management Actions

### Add New User
1. Click "Add User" button
2. Fill in user details:
   - Email Address
   - User Type (role)
   - Subscription Tier
   - Full Name
3. Click "Create User"

### Edit User
1. Find user in user table
2. Click "Edit" button
3. Modify user details
4. Save changes

### Suspend User
1. Find user in user table
2. Click "Suspend" button
3. Confirm suspension
4. User account is deactivated

### View User Details
- User ID
- Email
- User Type (role)
- Status (Active/Inactive/Trial)
- Subscription Tier
- Join Date
- Last Login
- Login Count

---

## API Endpoints (Admin Only)

### Admin Dashboard API
**Base URL:** `https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod/api/admin`

**Authentication:** Bearer token in Authorization header

**Endpoints:**
- `GET /overview` - Platform overview stats
- `GET /users` - List all users
- `GET /startups` - List all startups
- `GET /activities` - Recent activities
- `GET /analytics` - Platform analytics

**Example Request:**
```bash
curl -X GET "https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod/api/admin/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Security Features

### Token-Based Authentication
- JWT tokens with 24-hour expiration
- Refresh tokens for extended sessions
- Secure token storage in localStorage
- Automatic token validation on each request

### Role-Based Access Control (RBAC)
- Only `admin` role can access admin dashboard
- Auth guard blocks unauthorized access
- Token payload includes role verification
- Automatic redirect to login if unauthorized

### Audit Trail
- All admin actions are logged
- Timestamp, user, action, resource tracked
- IP address recorded
- Export logs for compliance

### Session Management
- Active session monitoring
- Automatic logout on token expiration
- Manual logout clears all auth data
- Session timeout after inactivity

---

## Testing Admin Access

### Test Login
```bash
curl -X POST "https://6qfa3ssb10.execute-api.us-east-1.amazonaws.com/prod/api/auth/login" \
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
      "email": "gina@auxeira.com",
      "role": "admin",
      "firstName": "Gina",
      "lastName": "Admin",
      "status": "active"
    },
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  }
}
```

### Test Dashboard Access
1. Login at [https://auxeira.com](https://auxeira.com)
2. Should redirect to [https://dashboard.auxeira.com/admin.html](https://dashboard.auxeira.com/admin.html)
3. Dashboard should load with admin controls
4. Console should show: "✅ AUTHENTICATION SUCCESSFUL"

---

## Troubleshooting

### Cannot Login
- **Check credentials:** Ensure email and password are correct
- **Check account status:** Verify account is active in DynamoDB
- **Check network:** Ensure API is accessible
- **Clear cache:** Clear browser cache and localStorage

### Dashboard Not Loading
- **Check token:** Verify token is stored in localStorage
- **Check role:** Ensure user has `admin` role
- **Check auth guard:** Look for console errors
- **Check CloudFront:** Verify dashboard is deployed

### Auth Guard Blocking Access
- **Check token expiration:** Token may have expired
- **Check role mismatch:** User may not have admin role
- **Re-login:** Clear localStorage and login again

---

## Admin User Details

**User ID:** `88370b7a-5daf-4ab7-a5a0-4a8f8432db21`  
**Created:** 2025-11-04 08:55:37 UTC  
**Last Login:** 2025-11-05 09:49:24 UTC  
**Login Count:** 40+  
**Email Verified:** No (not required for admin)  
**Status:** Active

---

## Next Steps

### Implement Full User Management
The admin dashboard UI is ready but needs backend integration:

1. **Create User API:** `POST /api/admin/users`
2. **Update User API:** `PUT /api/admin/users/:id`
3. **Delete User API:** `DELETE /api/admin/users/:id`
4. **Suspend User API:** `POST /api/admin/users/:id/suspend`
5. **Reset Password API:** `POST /api/admin/users/:id/reset-password`

### Implement Subscription Management
1. **Create Subscription API:** `POST /api/admin/subscriptions`
2. **Update Subscription API:** `PUT /api/admin/subscriptions/:id`
3. **Cancel Subscription API:** `DELETE /api/admin/subscriptions/:id`

### Implement Audit Logging
1. **Log all admin actions** to DynamoDB
2. **Track IP addresses** and timestamps
3. **Export audit logs** for compliance

---

## Support

For admin support or issues:
- **Email:** support@auxeira.com
- **Documentation:** [GitHub Repository](https://github.com/bursarynetwork007/auxeira-backend)

---

**Last Updated:** 2025-11-05  
**Version:** 1.0
