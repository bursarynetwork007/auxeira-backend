# Auxeira V2 - Marketing Site

## Overview
Clean, static marketing pages with NO authentication logic.

## Files
- `index.html` - Landing page with hero, features, stats, and demo request form
- `about.html` - About page
- `privacy.html` - Privacy policy
- `terms.html` - Terms of service
- `css/` - Styling (preserved from v1)
- `images/` - Assets (preserved from v1)

## What Was Removed
- ❌ All authentication modals
- ❌ Login/signup forms
- ❌ Service worker (sw.js)
- ❌ External JavaScript files (script.js, api-integration.js, etc.)
- ❌ localStorage logic
- ❌ Session management
- ❌ reCAPTCHA (for now)

## What Was Kept
- ✅ HTML structure and content
- ✅ CSS styling
- ✅ Images and assets
- ✅ SEO meta tags
- ✅ Responsive design

## Features
- Simple demo request form (no auth required)
- Clean, fast loading
- No JavaScript dependencies
- Mobile responsive
- SEO optimized

## Form Handling
The demo form currently logs to console. Next step: Connect to Lambda function.

```javascript
// TODO: Replace with actual Lambda endpoint
fetch('https://api.auxeira.com/demo-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
});
```

## Testing Locally
```bash
cd v2/marketing
python3 -m http.server 8000
# Open http://localhost:8000
```

## Deployment
```bash
# Create S3 bucket
aws s3 mb s3://auxeira-v2-marketing

# Upload files
aws s3 sync . s3://auxeira-v2-marketing/ --exclude "README.md"

# Create CloudFront distribution
# Point to S3 bucket
```

## Next Steps
1. Test all pages locally
2. Deploy to S3 staging
3. Set up CloudFront
4. Connect demo form to Lambda
5. Add Google Analytics (optional)

## Notes
- No authentication on marketing site
- Auth will be handled separately in v2/auth/
- Dashboard will be separate in v2/dashboard/
- This is ONLY the public-facing marketing site
