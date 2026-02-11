# Fix "URL must contain a valid API key" Error

## The Error

```
Error validating datasource `db`: the URL must contain a valid API key
Code: P6001
```

## Possible Causes

1. **API key is expired** - Prisma Accelerate API keys can expire
2. **API key is incomplete** - Copied incorrectly, missing characters
3. **API keys don't match** - `DATABASE_URL` and `PRISMA_ACCELERATE_ENDPOINT` have different keys
4. **API key format is wrong** - Extra quotes, spaces, or special characters

## How to Fix

### Step 1: Verify Your API Keys

Run the verification script:

```bash
node verify-api-keys.js
```

This will check:
- ✅ API key lengths
- ✅ If keys match between variables
- ✅ If keys look like valid JWTs

### Step 2: Get Fresh API Keys from Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project** → **Settings** → **Environment Variables**
3. **Find `DATABASE_URL`**:
   - Click **Edit** (pencil icon)
   - Copy the **ENTIRE** value (including `prisma://` and full API key)
   - The API key should be a long JWT token (starts with `eyJ...`)
4. **Find `PRISMA_ACCELERATE_ENDPOINT`**:
   - Click **Edit** (pencil icon)
   - Copy the **ENTIRE** value (including `prisma+mysql://` and full API key)
   - Should have the **SAME** API key as `DATABASE_URL`

### Step 3: Update Your Local .env File

1. **Open `.env`** in your editor
2. **Update `DATABASE_URL`**:
   ```env
   DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_COMPLETE_API_KEY_HERE"
   ```
   - Format: `prisma://...` (NO `+mysql`)
   - Include the FULL API key

3. **Update `PRISMA_ACCELERATE_ENDPOINT`**:
   ```env
   PRISMA_ACCELERATE_ENDPOINT="prisma+mysql://accelerate.prisma-data.net/?api_key=YOUR_COMPLETE_API_KEY_HERE"
   ```
   - Format: `prisma+mysql://...` (WITH `+mysql`)
   - Use the **SAME** API key as `DATABASE_URL`

### Step 4: Verify No Extra Characters

Make sure:
- ✅ No extra quotes around the value (or use consistent quotes)
- ✅ No trailing spaces
- ✅ No line breaks in the middle of the URL
- ✅ API key is complete (typically 300-500 characters)

### Step 5: Regenerate Prisma Client

```bash
npx prisma generate --schema=./prisma/schema.prisma --accelerate
```

### Step 6: Test Connection

```bash
node test-db-connection-local.js
```

## If API Key is Expired

If your API key has expired:

1. **Go to Prisma Dashboard**: https://console.prisma.io/
2. **Select your project**
3. **Go to Accelerate settings**
4. **Regenerate API key**
5. **Copy the new key** to both Vercel environment variables
6. **Update your local `.env`** with the new key
7. **Redeploy** your Vercel project

## Quick Check Script

Run this to verify your setup:

```bash
node verify-api-keys.js
```

Expected output:
- ✅ API keys match
- ✅ Both are valid JWT format
- ✅ Both have reasonable length (300-500 chars)

## Alternative: Use Direct MySQL Connection

If Accelerate continues to cause issues, you can use a direct MySQL connection for local development:

See `ALTERNATIVE_DIRECT_CONNECTION.md` for instructions.

## Summary

**The error means:**
- Your API key format is wrong, OR
- Your API key is expired/invalid, OR
- Your API key is incomplete

**The fix:**
1. Get fresh API keys from Vercel
2. Ensure both variables use the SAME complete API key
3. Regenerate Prisma Client
4. Test connection






