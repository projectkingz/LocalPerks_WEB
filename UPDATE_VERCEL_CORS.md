# Update Vercel Production CORS Settings

## The Problem

The production Vercel API has CORS set to `https://your-app.vercel.app` (placeholder), causing 401 Unauthorized errors from the mobile app.

## Solution: Update and Redeploy

### Option 1: Set Environment Variable on Vercel (Recommended)

1. **Go to Vercel Dashboard:**
   - Open: https://vercel.com/dashboard
   - Navigate to your project: `LocalPerks_WEB`

2. **Go to Settings > Environment Variables**

3. **Add/Update these variables:**
   ```
   NEXT_PUBLIC_APP_URL=https://localperks-app.vercel.app
   CORS_ORIGIN=*
   ```

4. **Redeploy:**
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"
   - Wait for deployment to finish

### Option 2: Update CORS to Allow All Origins (Quick Fix)

Update `next.config.js` to allow all origins in production:

```javascript
const allowedOrigin = '*'; // Allow all origins for mobile app
```

Then commit and push:
```bash
git add next.config.js
git commit -m "Fix: Allow CORS for mobile app"
git push
```

Vercel will automatically deploy.

### Option 3: Deploy from CLI

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Deploy
vercel --prod
```

## Verify the Fix

After redeploying, check if CORS is fixed:

1. Restart your mobile app
2. Check the Metro logs
3. Look for `access-control-allow-origin: *` in response headers

If you still see 401 errors, logout and login again on the mobile app to get a fresh token.

## Quick Deploy Command

```bash
cd C:\0_LocalPerks\LocalPerks_WEB
git add .
git commit -m "Fix: Update CORS for mobile app"
git push
```

Vercel will auto-deploy from your Git repository.

