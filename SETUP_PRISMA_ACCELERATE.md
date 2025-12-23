# How to Set Up Prisma Accelerate for Vercel

## Why Accelerate is Required

Vercel's serverless environment doesn't support Prisma's Query Engine binaries. Prisma Accelerate uses a Data Proxy that doesn't require engine binaries, making it perfect for serverless deployments.

## Step-by-Step Setup

### 1. Create Prisma Accelerate Account

1. Go to https://console.prisma.io/
2. Sign in (or create account)
3. Create a new project or select existing project
4. Navigate to **Accelerate** section

### 2. Get Your Accelerate Connection String

1. In Accelerate section, click **"Create Accelerate Connection"**
2. Select your database (should be MySQL/PlanetScale)
3. Copy the connection string
4. It should look like:
   ```
   prisma+mysql://accelerate.prisma-data.net/?api_key=YOUR_API_KEY
   ```

### 3. Set in Vercel

1. Go to Vercel Dashboard → Your Project
2. **Settings** → **Environment Variables**
3. Click **"Add New"**
4. Set:
   - **Key**: `PRISMA_ACCELERATE_ENDPOINT`
   - **Value**: Your Accelerate connection string (the `prisma+mysql://...` URL)
   - **Environment**: Select **Production** (and **Preview** if you want)
5. Click **Save**

### 4. Verify Format

The endpoint MUST:
- ✅ Start with `prisma+mysql://` (for MySQL databases)
- ✅ Include `accelerate.prisma-data.net`
- ✅ Include your API key

Common mistakes:
- ❌ `prisma://accelerate...` (missing `+mysql`)
- ❌ `prisma+postgres://...` (wrong database type)
- ❌ Missing `?api_key=...`

### 5. Test Configuration

After setting the variable and redeploying:

1. Visit: `https://localperks-app.vercel.app/api/test-accelerate`
2. Should show:
   ```json
   {
     "test": {
       "status": "success",
       "message": "Database connection successful! Found X users."
     }
   }
   ```

### 6. Try Login Again

Once Accelerate is configured:
- Mobile login should work
- No more Query Engine errors
- Database queries will route through Accelerate Data Proxy

## Troubleshooting

### Still Getting Query Engine Errors?

1. **Check Vercel Environment Variables:**
   - Go to Vercel → Settings → Environment Variables
   - Verify `PRISMA_ACCELERATE_ENDPOINT` is set
   - Check it starts with `prisma+mysql://`

2. **Check Vercel Function Logs:**
   - Go to Deployments → Latest → Functions
   - Look for `[Prisma]` logs
   - Should see: `[Prisma] ✓ Successfully initialized with Accelerate`

3. **Test Accelerate Endpoint:**
   - Visit `/api/test-accelerate`
   - Check the JSON response for errors

### Accelerate Endpoint Format Issues?

If you see errors about protocol mismatch:
- Ensure it's `prisma+mysql://` (not `prisma://` or `prisma+postgres://`)
- Your database is MySQL (PlanetScale), so it must be `+mysql`

## Cost

Prisma Accelerate has a free tier that should be sufficient for development and small projects. Check https://www.prisma.io/pricing for details.

