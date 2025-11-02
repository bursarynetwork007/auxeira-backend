# Database Status - Business Structure Changes

## 📊 Overview

The database schema for business structure change tracking has been created and is ready for implementation.

## 🗄️ Database Schema

### Tables Created

#### 1. business_structure_changes
Tracks all business structure changes and payment requirements.

**Key Fields**:
- `id` - Unique identifier
- `user_id` - Reference to user
- `company_name` - Company name
- `old_structure` - Previous business structure
- `new_structure` - New business structure
- `payment_status` - PENDING, COMPLETED, FAILED
- `payment_amount` - Amount in kobo (default: 200,000 = ₦2,000)
- `paystack_reference` - Paystack transaction reference
- `change_detected_at` - When change was detected (timestamped)
- `is_synthetic` - Flag for test/simulated data

#### 2. payments
Records all payment transactions.

**Key Fields**:
- `id` - Unique identifier
- `structure_change_id` - Link to business structure change
- `user_id` - User who made payment
- `amount` - Payment amount
- `paystack_reference` - Paystack transaction reference
- `status` - Payment status
- `verified_at` - When payment was verified (timestamped)

#### 3. user_subscriptions
Tracks user subscription status and access control.

**Key Fields**:
- `user_id` - Unique user identifier
- `current_structure` - Current business structure
- `dashboard_access` - Boolean for access control
- `access_blocked_at` - When access was blocked (timestamped)
- `last_payment_date` - Last successful payment (timestamped)

## 📝 Simulated Test Cases

### Case Distribution (15 Total Cases)

#### Pending Payment (5 cases)
- **Status**: `pending_payment`
- **Payment Status**: `PENDING`
- **Date Range**: Last 7 days
- **Companies**:
  1. TechVenture Solutions (7 days ago)
  2. GreenEarth Innovations (6 days ago)
  3. HealthFirst Medical (5 days ago)
  4. EduTech Learning Platform (4 days ago)
  5. FinanceFlow Systems (3 days ago)

**Structure Changes**: SOLE_PROPRIETORSHIP → LLC

#### Completed Payment (5 cases)
- **Status**: `completed`
- **Payment Status**: `COMPLETED`
- **Date Range**: Last 30 days
- **Companies**:
  6. AgriGrow Enterprises
  7. CloudSync Technologies
  8. RetailPro Commerce
  9. LogiTrack Logistics
  10. EnergyWise Solutions

**Structure Changes**: PARTNERSHIP → CORPORATION

#### Failed Payment (5 cases)
- **Status**: `pending_payment`
- **Payment Status**: `FAILED`
- **Date Range**: Last 14 days
- **Companies**:
  11. FoodHub Delivery
  12. PropTech Realty
  13. MediaStream Productions
  14. CyberShield Security
  15. BioMed Research Labs

**Structure Changes**: SOLE_PROPRIETORSHIP → S_CORP

## 🔍 Database Files

### Schema Files
- `/prisma/schema-business-structure.prisma` - Prisma schema definition
- `/backend/src/database/migrations/007_business_structure_changes.sql` - SQL migration

### Seed Files
- `/prisma/seed-business-structure.js` - Node.js seed script with 15 timestamped cases

## 📈 Statistics

| Metric | Count |
|--------|-------|
| **Total Cases** | 15 |
| **Pending Payment** | 5 |
| **Completed Payment** | 5 |
| **Failed Payment** | 5 |
| **Unique Users** | 15 |
| **Date Range** | Last 30 days |

## 🚀 Implementation Status

### ✅ Completed
- [x] Database schema designed
- [x] Migration SQL created
- [x] Seed script with 15 timestamped cases
- [x] Prisma schema definition
- [x] Indexes for performance
- [x] Triggers for timestamps
- [x] Test data structure

### ⏳ Pending
- [ ] Run migration on production database
- [ ] Execute seed script to populate data
- [ ] Create API endpoints
- [ ] Connect frontend to backend
- [ ] Test end-to-end flow

## 🔧 How to Use

### 1. Run Migration (PostgreSQL)

```bash
# Connect to your PostgreSQL database
psql -U your_user -d auxeira_db

# Run the migration
\i backend/src/database/migrations/007_business_structure_changes.sql
```

### 2. Run Seed Script (Node.js)

```bash
# Install dependencies
npm install @prisma/client

# Generate Prisma client
npx prisma generate --schema=prisma/schema-business-structure.prisma

# Run seed script
node prisma/seed-business-structure.js
```

### 3. Verify Data

```sql
-- Count total cases
SELECT COUNT(*) as total_cases 
FROM business_structure_changes;

-- Count by status
SELECT payment_status, COUNT(*) as count 
FROM business_structure_changes 
GROUP BY payment_status;

-- View recent changes
SELECT 
    company_name, 
    old_structure, 
    new_structure, 
    payment_status, 
    change_detected_at
FROM business_structure_changes
ORDER BY change_detected_at DESC
LIMIT 10;

-- Check timestamped data
SELECT 
    DATE(change_detected_at) as date,
    COUNT(*) as cases
FROM business_structure_changes
GROUP BY DATE(change_detected_at)
ORDER BY date DESC;
```

## 📊 Expected Query Results

### Total Cases
```
total_cases
-----------
15
```

### By Payment Status
```
payment_status | count
---------------|------
PENDING        | 10
COMPLETED      | 5
FAILED         | 0
```

### Recent Changes
```
company_name              | old_structure        | new_structure | payment_status | change_detected_at
--------------------------|---------------------|---------------|----------------|-------------------
FinanceFlow Systems       | SOLE_PROPRIETORSHIP | LLC           | PENDING        | 2025-10-25
EduTech Learning Platform | SOLE_PROPRIETORSHIP | LLC           | PENDING        | 2025-10-24
HealthFirst Medical       | SOLE_PROPRIETORSHIP | LLC           | PENDING        | 2025-10-23
...
```

## 🔗 Integration with Payment Modal

### Frontend Connection

The payment modal on the dashboard will:

1. **Check for changes** via `GET /api/check-business-structure`
   - Query: `SELECT * FROM business_structure_changes WHERE user_id = ? AND payment_status = 'PENDING'`
   - Returns: Change details if payment required

2. **Verify payment** via `POST /api/verify-payment`
   - Update: `UPDATE business_structure_changes SET payment_status = 'COMPLETED', payment_date = NOW()`
   - Update: `UPDATE user_subscriptions SET dashboard_access = TRUE`

### Example API Response

```json
{
  "hasChanged": true,
  "oldStructure": "SOLE_PROPRIETORSHIP",
  "newStructure": "LLC",
  "changeDate": "2025-10-25T10:30:00Z",
  "requiresPayment": true,
  "paymentAmount": 200000,
  "paymentDueDate": "2025-11-04T10:30:00Z"
}
```

## 🎯 Business Structure Types

Supported structures:
- `SOLE_PROPRIETORSHIP` - Sole Proprietorship
- `PARTNERSHIP` - Partnership
- `LLC` - Limited Liability Company
- `CORPORATION` - Corporation
- `S_CORP` - S Corporation
- `C_CORP` - C Corporation
- `NONPROFIT` - Non-Profit Organization
- `COOPERATIVE` - Cooperative

## 💰 Payment Configuration

- **Default Amount**: ₦200,000 (200,000 kobo)
- **Currency**: NGN (Nigerian Naira)
- **Payment Gateway**: Paystack
- **Payment Type**: `business_structure_update`

## 🔐 Security Features

- Row-level security policies
- Encrypted payment data
- Audit trail with timestamps
- Synthetic data flagging
- User access control

## 📝 Notes

### Synthetic Data
All seed data is marked with `is_synthetic = TRUE` for easy identification and cleanup.

### Timestamps
All records include:
- `created_at` - When record was created
- `updated_at` - When record was last modified
- `change_detected_at` - When change was detected
- `payment_date` - When payment was completed

### Cleanup
To remove all synthetic data:
```sql
DELETE FROM payments WHERE is_synthetic = TRUE;
DELETE FROM business_structure_changes WHERE is_synthetic = TRUE;
```

## 🚨 Current Status

**Database Schema**: ✅ Created  
**Migration File**: ✅ Ready  
**Seed Script**: ✅ Ready  
**Test Cases**: ✅ 15 timestamped cases defined  
**Database Populated**: ⏳ Pending execution  

## 📞 Next Steps

1. **Run Migration**: Execute SQL migration on database
2. **Run Seed Script**: Populate with 15 test cases
3. **Verify Data**: Check that all 15 cases exist
4. **Create API Endpoints**: Implement backend endpoints
5. **Test Integration**: Connect frontend payment modal

---

**Last Updated**: October 28, 2025  
**Version**: 1.0.0  
**Status**: ✅ Schema Ready, ⏳ Data Pending
