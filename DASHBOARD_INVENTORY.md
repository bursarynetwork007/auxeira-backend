# Auxeira Dashboard Inventory

**Last Updated:** November 5, 2025  
**Total Dashboards:** 14

---

## 📊 Dashboard Status Overview

### ✅ Fully Integrated (2)
Dashboards with complete backend integration, authentication, and real-time data.

| Dashboard | Size | Status | Features |
|-----------|------|--------|----------|
| **Admin Dashboard** | 113KB | ✅ Production | Full admin analytics, user management, startup monitoring |
| **Startup Founder Dashboard** | 258KB | ✅ Production | Real-time metrics, Coach Gina AI, nudges, activities |

---

### ⚠️ Partially Integrated (2)
Dashboards with API connections but incomplete integration.

| Dashboard | Size | Status | Notes |
|-----------|------|--------|-------|
| **Startup Founder Live** | 245KB | ⚠️ Partial | Has API calls, needs auth integration |
| **Startup Founder with Coach Gina** | 11KB | ⚠️ Partial | Lightweight version, needs full integration |

---

### 🚧 Placeholder/Template (10)
Dashboards that need backend integration and functionality.

| Dashboard | Size | Purpose | Priority |
|-----------|------|---------|----------|
| **Share Value Partner Enhanced** | 51KB | Partner strategy intelligence | High |
| **ESG Education Dashboard** | 64KB | ESG learning and impact tracking | Medium |
| **Share Value Partner Onboarding** | 24KB | Partner onboarding flow | Medium |
| **Index** | 2.4KB | Dashboard selector/landing | Low |
| **Angel Investor** | 1.6KB | Angel investor view | Low |
| **Venture Capital** | 1.6KB | VC firm dashboard | Low |
| **Corporate Partner** | 1.6KB | Corporate partnership view | Low |
| **ESG Funder** | 1.1KB | ESG-focused funder view | Low |
| **Impact Investor** | 1.1KB | Impact investment tracking | Low |
| **Government** | 1.1KB | Government agency view | Low |

---

## 🎯 Fully Integrated Dashboard Details

### 1. Admin Dashboard (`admin.html`)

**URL:** https://dashboard.auxeira.com/admin.html

**Backend Integration:**
- Lambda: `auxeira-admin-dashboard-prod`
- Function URL: `https://4nfviaokncu6osk3imrlhr4uoe0koigh.lambda-url.us-east-1.on.aws/`
- Database Tables:
  - `auxeira-backend-users-prod`
  - `auxeira-startup-profiles-prod`
  - `auxeira-startup-activities-prod`
  - `auxeira-user-startup-mapping-prod`
  - `auxeira-subscriptions`
  - `auxeira-backend-sessions-prod`

**Features:**
- ✅ Real-time user analytics
- ✅ Startup monitoring
- ✅ Activity tracking
- ✅ System health metrics
- ✅ Revenue analytics
- ✅ User management
- ✅ Role-based access control (admin only)

**Authentication:**
- JWT token validation
- Admin role required
- Session management

---

### 2. Startup Founder Dashboard (`startup_founder.html`)

**URL:** https://dashboard.auxeira.com/startup_founder.html

**Backend Integration:**
- Dashboard Context Lambda: `auxeira-dashboard-context-prod`
  - URL: `https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/`
- Metrics Collection Lambda: `auxeira-metrics-collection-prod`
  - URL: `https://wc5gsqktvtd4a3bgevg3k677eq0rrfwp.lambda-url.us-east-1.on.aws/`
- Coach Gina API: `https://9t3nivd6wg.execute-api.us-east-1.amazonaws.com/prod/api/coach-gina`
- Nudges API: `https://qh56ng61eh.execute-api.us-east-1.amazonaws.com/prod/api/nudges`
- Urgent Actions API: `https://yyf8vfdvs6.execute-api.us-east-1.amazonaws.com/prod/api/urgent-actions/generate`

**Database Tables:**
- `auxeira-users-prod`
- `auxeira-startup-profiles-prod`
- `auxeira-user-startup-mapping-prod`
- `auxeira-startup-activities-prod`
- `auxeira-metrics-history` (NEW)

**Features:**
- ✅ Real-time startup metrics (MRR, users, growth)
- ✅ SSE Score tracking
- ✅ Coach Gina AI assistant
- ✅ Smart nudges and recommendations
- ✅ Activity tracking
- ✅ Milestone management
- ✅ Challenge identification
- ✅ Metrics submission (NEW)
- ✅ Historical metrics analysis (NEW)
- ✅ Growth rate calculations (NEW)

**API Client:**
```javascript
class StartupDashboardAPI {
  - getDashboardContext()
  - submitMetrics(metrics)
  - getMetricsHistory(period)
}
```

**Authentication:**
- JWT token validation
- Startup founder role
- Cross-domain token passing

---

## 🔧 Backend Infrastructure

### Lambda Functions

| Function | Purpose | Status | URL |
|----------|---------|--------|-----|
| `auxeira-dashboard-context-prod` | Startup dashboard data | ✅ Active | https://24ndip5xbbgahv4m5cvicrmzta0vgdho.lambda-url.us-east-1.on.aws/ |
| `auxeira-admin-dashboard-prod` | Admin analytics | ✅ Active | https://4nfviaokncu6osk3imrlhr4uoe0koigh.lambda-url.us-east-1.on.aws/ |
| `auxeira-metrics-collection-prod` | Metrics submission | ✅ Active | https://wc5gsqktvtd4a3bgevg3k677eq0rrfwp.lambda-url.us-east-1.on.aws/ |

### DynamoDB Tables

| Table | Purpose | Status |
|-------|---------|--------|
| `auxeira-backend-users-prod` | User accounts | ✅ Active |
| `auxeira-startup-profiles-prod` | Startup data | ✅ Active |
| `auxeira-startup-activities-prod` | Activity logs | ✅ Active |
| `auxeira-user-startup-mapping-prod` | User-startup relationships | ✅ Active |
| `auxeira-backend-sessions-prod` | Session management | ✅ Active |
| `auxeira-subscriptions` | Subscription data | ✅ Active |
| `auxeira-metrics-history` | Historical metrics | ✅ Active (NEW) |

---

## 📈 Integration Roadmap

### Phase 1: Core Dashboards ✅ COMPLETE
- [x] Admin Dashboard
- [x] Startup Founder Dashboard
- [x] Metrics Collection System
- [x] Central Database Integration

### Phase 2: Partner Dashboards (Next)
- [ ] Share Value Partner Enhanced
- [ ] ESG Education Dashboard
- [ ] Share Value Partner Onboarding

### Phase 3: Investor Dashboards
- [ ] Angel Investor Dashboard
- [ ] Venture Capital Dashboard
- [ ] Impact Investor Dashboard

### Phase 4: Stakeholder Dashboards
- [ ] Corporate Partner Dashboard
- [ ] ESG Funder Dashboard
- [ ] Government Dashboard

---

## 🎨 Dashboard Features Comparison

| Feature | Admin | Startup Founder | Others |
|---------|-------|-----------------|--------|
| Real-time Data | ✅ | ✅ | ❌ |
| Authentication | ✅ | ✅ | ❌ |
| Database Integration | ✅ | ✅ | ❌ |
| AI Assistant | ❌ | ✅ (Coach Gina) | ❌ |
| Metrics Submission | ❌ | ✅ | ❌ |
| Analytics | ✅ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ |
| Activity Tracking | ✅ | ✅ | ❌ |

---

## 🚀 Deployment Status

### Production URLs
- **Dashboard Portal:** https://dashboard.auxeira.com/
- **Admin Dashboard:** https://dashboard.auxeira.com/admin.html
- **Startup Founder:** https://dashboard.auxeira.com/startup_founder.html

### CloudFront Distribution
- **Distribution ID:** E1L1Q8VK3LAEFC
- **Domain:** dashboard.auxeira.com
- **SSL:** Enabled
- **Cache:** Configured

### S3 Bucket
- **Bucket:** dashboard.auxeira.com
- **Region:** us-east-1
- **Access:** CloudFront only

---

## 📊 Statistics

- **Total Dashboards:** 14
- **Fully Integrated:** 2 (14%)
- **Partially Integrated:** 2 (14%)
- **Placeholders:** 10 (72%)
- **Total Code:** ~800KB
- **Lambda Functions:** 3 active
- **DynamoDB Tables:** 7 active
- **API Endpoints:** 6 active

---

## 🎯 Next Steps

1. **Complete Partial Integrations**
   - Integrate `startup_founder_live.html`
   - Complete `startup_founder_with_coach_gina.html`

2. **Prioritize Partner Dashboards**
   - Share Value Partner Enhanced (51KB - substantial work done)
   - ESG Education Dashboard (64KB - substantial work done)

3. **Create Investor Dashboard Template**
   - Reusable template for Angel, VC, Impact investors
   - Common features: portfolio view, metrics, reports

4. **Stakeholder Dashboard Template**
   - Template for Corporate, ESG Funder, Government
   - Common features: impact tracking, reporting, analytics

---

## 📝 Notes

- All integrated dashboards use JWT authentication
- CORS is properly configured on all Lambda Function URLs
- Defensive null checks implemented to prevent UI crashes
- CloudFront cache invalidation automated for deployments
- Central database architecture ensures data consistency
- Metrics collection system supports historical analysis

---

**Maintained by:** Ona AI Assistant  
**Repository:** https://github.com/bursarynetwork007/auxeira-backend.git
