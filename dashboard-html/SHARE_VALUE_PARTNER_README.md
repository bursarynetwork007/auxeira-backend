# Share Value Partners Dashboard - Dashboard-HTML Directory

## File Structure

### Main Files

1. **`corporate_partner.html`** (ENHANCED VERSION)
   - **Purpose**: Main Share Value Partners dashboard
   - **Features**: AI-powered insights, what-if scenarios, premium UI
   - **Replaces**: Old basic corporate partner dashboard
   - **Access**: Requires authentication via onboarding form

2. **`share_value_partner_onboarding.html`**
   - **Purpose**: Partner onboarding and payment form
   - **Features**: Multi-step form, tier selection, Paystack integration
   - **Flow**: Form → Payment → Dashboard access

3. **`share_value_partner_enhanced.html`**
   - **Purpose**: Standalone version of enhanced dashboard (same as corporate_partner.html)
   - **Use**: For direct access or alternative naming

### Backup Files

- **`corporate_partner.html.backup`**: Original basic dashboard (backed up before replacement)

## Access Flow

```
User → share_value_partner_onboarding.html
       ↓ (Complete form + payment)
       ↓
     corporate_partner.html (Enhanced Dashboard)
```

## File Paths

All internal links have been updated to use `/dashboard-html/` paths:

- Dashboard redirects to: `/dashboard-html/share_value_partner_onboarding.html`
- Onboarding redirects to: `/dashboard-html/corporate_partner.html`
- Logout redirects to: `/frontend/index.html`

## Quick Start

### Local Testing

```bash
cd auxeira-backend
python3 -m http.server 8080

# Access onboarding form:
# http://localhost:8080/dashboard-html/share_value_partner_onboarding.html

# Or bypass authentication and go directly to dashboard:
# http://localhost:8080/dashboard-html/corporate_partner.html
```

### Bypass Authentication (Testing Only)

Open browser console and run:

```javascript
localStorage.setItem('auxeira_partner_authenticated', 'true');
localStorage.setItem('auxeira_payment_verified', 'true');
localStorage.setItem('auxeira_partner_tier', 'gold');
localStorage.setItem('auxeira_partner_company', 'Test Company');

// Then navigate to dashboard
window.location.href = '/dashboard-html/corporate_partner.html';
```

## Configuration

### API Keys Required

1. **OpenAI API Key** (for AI insights)
   - Edit `corporate_partner.html` line ~745
   - Or use environment variable

2. **Paystack Public Key** (for payments)
   - Edit `share_value_partner_onboarding.html` line ~420
   - Test: `pk_test_...`
   - Production: `pk_live_...`

## Features

### Enhanced Dashboard (`corporate_partner.html`)

- **Overview Tab**: AI-powered strategic insights
- **Partnership Tab**: What-if scenario modeling
- **Analytics Tab**: Placeholder for future features
- **Reports Tab**: Placeholder for future features

### Onboarding Form (`share_value_partner_onboarding.html`)

- **Company Info**: Name, email, contact person
- **Rewards**: Discount, cashback, tokens selection
- **Tier Selection**: Silver ($49), Gold ($99), Platinum ($199)
- **Payment**: Paystack integration

## Documentation

For complete setup and deployment instructions, see:

- `../SHARE_VALUE_PARTNER_IMPLEMENTATION_GUIDE.md` - Full setup guide
- `../DASHBOARD_ENHANCEMENT_DESIGN.md` - Design specifications
- `../ENHANCEMENT_SUMMARY.md` - Project summary

## Migration Notes

### What Changed

**Old Version** (`corporate_partner.html.backup`):
- Basic dashboard with placeholder content
- No authentication
- No payment integration
- Simple Bootstrap UI

**New Version** (`corporate_partner.html`):
- AI-powered strategic insights
- Interactive what-if scenarios
- Payment-gated access
- Ferrari-level premium UI

### Rollback

If you need to rollback to the old version:

```bash
cd dashboard-html
mv corporate_partner.html corporate_partner_enhanced.html
mv corporate_partner.html.backup corporate_partner.html
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] Replace placeholder API keys
- [ ] Configure Paystack webhook
- [ ] Set up backend payment verification
- [ ] Implement JWT authentication
- [ ] Test payment flow end-to-end
- [ ] Verify mobile responsiveness
- [ ] Security audit

### Environment Variables

```bash
OPENAI_API_KEY=your_api_key
PAYSTACK_PUBLIC_KEY=pk_live_xxx
PAYSTACK_SECRET_KEY=sk_live_xxx
```

## Support

For questions or issues:
1. Review the implementation guide
2. Check the design document
3. Contact the development team

---

**Last Updated**: October 16, 2025  
**Version**: 1.0  
**Status**: Ready for Production (after API configuration)

