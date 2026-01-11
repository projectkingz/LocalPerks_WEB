# DATABASE_URL Configuration Fix

## Issue

You've set `PRISMA_ACCELERATE_ENDPOINT` correctly, but the build is failing because `DATABASE_URL` is also required and must be set to the Prisma Accelerate URL format.

## Error

```
InvalidDatasourceError: Error validating datasource `db`: the URL must start with the protocol `prisma://` or `prisma+postgres://`
```

## Solution

**You need to set `DATABASE_URL` in Vercel to the same value as `PRISMA_ACCELERATE_ENDPOINT`.**

### Why Both Variables?

- **`DATABASE_URL`**: Used by Prisma schema datasource (defined in `prisma/schema.prisma`). Required during build-time when Prisma validates the datasource.
- **`PRISMA_ACCELERATE_ENDPOINT`**: Used by Prisma Client extension at runtime (in `src/lib/prisma.ts`). Used for query routing through Accelerate Data Proxy.

When using `prisma generate --accelerate`, both variables need to be set to the same Prisma Accelerate URL.

### Steps to Fix

1. **Get your Prisma Accelerate URL**
   - You already have this value (it's what you set in `PRISMA_ACCELERATE_ENDPOINT`)
   - Format: `prisma+mysql://accelerate.prisma-data.net/?api_key=YOUR_API_KEY`

2. **Set `DATABASE_URL` in Vercel**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Click "Add New" or edit existing `DATABASE_URL`
   - Set the value to the **same Prisma Accelerate URL** you're using for `PRISMA_ACCELERATE_ENDPOINT`
   - Select **Production** environment (and Preview if needed)
   - Click Save

3. **Verify Both Variables Are Set**
   - `DATABASE_URL` = `prisma+mysql://accelerate.prisma-data.net/?api_key=...`
   - `PRISMA_ACCELERATE_ENDPOINT` = `prisma+mysql://accelerate.prisma-data.net/?api_key=...` (same value)

4. **Redeploy**
   - After setting `DATABASE_URL`, redeploy your application
   - The build should now succeed

### Format Requirements

Your Prisma Accelerate URL must:
- ✅ Start with `prisma+mysql://` (for MySQL/PlanetScale databases)
- ✅ Include `accelerate.prisma-data.net`
- ✅ Include your API key: `?api_key=YOUR_API_KEY`

Common mistakes:
- ❌ `prisma://accelerate...` (missing `+mysql`)
- ❌ `prisma+postgres://...` (wrong database type)
- ❌ Missing `?api_key=...`

## Testing

After setting `DATABASE_URL` and redeploying:

1. **Check Build Logs**
   - Should no longer see `InvalidDatasourceError`
   - Build should complete successfully

2. **Test Database Connection**
   - Visit: `https://your-app.vercel.app/api/test-accelerate`
   - Should return success response

3. **Test Application**
   - Try logging in
   - Test API endpoints that use database

## Summary

**Action Required:** Set `DATABASE_URL` in Vercel to the same Prisma Accelerate URL value you're already using for `PRISMA_ACCELERATE_ENDPOINT`.

Both variables need the same value when using Prisma Accelerate with the `--accelerate` flag.

