# Payment Modal - Quick Reference Card

## 🚀 Quick Start

### Test the Modal Right Now

1. Open: [https://dashboard.auxeira.com/startup_founder.html](https://dashboard.auxeira.com/startup_founder.html)
2. Press `F12` to open console
3. Type: `testPaymentModal()`
4. Press Enter

**The payment modal will appear!**

---

## 🔑 Paystack Keys

### Frontend (Public Key)
```
pk_live_3473b2fa2c821a928aebf9833bec3e936f7feee7
```

### Backend (Secret Key) - NEVER expose in frontend
```
sk_live_YOUR_PAYSTACK_SECRET_KEY
```

---

## 💰 Pricing

| Item | Amount |
|------|--------|
| Update Fee | ₦50,000 |
| Service (1 month) | ₦150,000 |
| **Total** | **₦200,000** |

**Paystack Amount**: 20,000,000 kobo

---

## 🧪 Test Cards

### Success
- Card: `4084084084084081`
- CVV: `408`
- PIN: `0000`
- OTP: `123456`

### Decline
- Card: `5060666666666666666`
- CVV: `123`

---

## 🔧 Backend Endpoints Needed

### 1. Check Business Structure
```
GET /api/check-business-structure
```

**Response**:
```json
{
  "hasChanged": true,
  "oldStructure": "Sole Proprietorship",
  "newStructure": "LLC",
  "requiresPayment": true
}
```

### 2. Verify Payment
```
POST /api/verify-payment
```

**Request**:
```json
{
  "reference": "AUX-BSU-1730123456-789012",
  "paymentType": "business_structure_update"
}
```

**Verify with Paystack**:
```bash
curl https://api.paystack.co/transaction/verify/{reference} \
  -H "Authorization: Bearer sk_live_YOUR_PAYSTACK_SECRET_KEY"
```

**Response**:
```json
{
  "success": true,
  "accessGranted": true
}
```

---

## 📝 Quick Commands

### Deploy Updated File
```bash
aws s3 cp startup_founder.html \
  s3://auxeira-dashboards-jsx-1759943238/startup_founder.html \
  --cache-control "public, max-age=60, must-revalidate"
```

### Invalidate Cache
```bash
aws cloudfront create-invalidation \
  --distribution-id E1L1Q8VK3LAEFC \
  --paths "/startup_founder.html"
```

### Check Deployment
```bash
curl -sI https://dashboard.auxeira.com/startup_founder.html | grep content-length
# Should show: 268600
```

### Test Modal Present
```bash
curl -s https://dashboard.auxeira.com/startup_founder.html | grep -c "payment-modal"
# Should show: 18
```

---

## 🎯 Key Functions

### Show Modal (JavaScript)
```javascript
testPaymentModal()
```

### Close Modal
```javascript
closePaymentModal()
```

### Initiate Payment
```javascript
initiatePayment()
```

### Check Payment State
```javascript
console.log(window.paymentState)
```

---

## 🐛 Troubleshooting

### Modal Not Showing
```javascript
// Check if Paystack loaded
typeof PaystackPop

// Check payment state
window.paymentState

// Force show modal
testPaymentModal()
```

### Payment Not Working
```javascript
// Check public key
console.log(PAYSTACK_PUBLIC_KEY)

// Check amount (should be in kobo)
console.log(window.paymentState.amount)

// Check user email
console.log(getUserEmail())
```

---

## 📊 File Info

- **URL**: https://dashboard.auxeira.com/startup_founder.html
- **Size**: 268,600 bytes (268 KB)
- **Lines**: 6,454
- **Distribution**: E1L1Q8VK3LAEFC
- **Bucket**: auxeira-dashboards-jsx-1759943238

---

## ✅ Deployment Status

- [x] Paystack script added
- [x] Payment modal UI added
- [x] Payment logic implemented
- [x] Deployed to S3
- [x] CloudFront cache cleared
- [x] Test function available
- [ ] Backend endpoints (pending)
- [ ] End-to-end testing (pending)

---

## 📚 Full Documentation

- **Technical Docs**: `PAYMENT_MODAL_README.md`
- **Deployment Guide**: `PAYMENT_MODAL_DEPLOYMENT.md`
- **This Card**: `PAYMENT_QUICK_REFERENCE.md`

---

## 🆘 Quick Help

**Modal won't close?**
- It's locked if payment required
- Use Cancel button (shows warning)

**Payment failed?**
- Check test card details
- Verify Paystack keys
- Check network tab

**Need to rollback?**
```bash
aws s3 cp \
  s3://auxeira-dashboards-jsx-1759943238/startup_founder_backup_20251028_123553.html \
  s3://auxeira-dashboards-jsx-1759943238/startup_founder.html
```

---

**Last Updated**: October 28, 2025  
**Status**: ✅ Live in Production  
**Version**: 1.0.0
