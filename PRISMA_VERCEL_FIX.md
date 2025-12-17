# Prisma Engine Not Found on Vercel - Fix Instructions

## Problem
Prisma Client cannot locate the Query Engine for runtime "rhel-openssl-3.0.x" on Vercel serverless functions.

## Solution
You need to manually set the `PRISMA_QUERY_ENGINE_LIBRARY` environment variable in Vercel.

### Steps:
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add a new environment variable:
   - **Name**: `PRISMA_QUERY_ENGINE_LIBRARY`
   - **Value**: `/var/task/node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node`
   - **Environment**: Production, Preview, Development (all)
4. Save and redeploy

### Alternative: Use Prisma Data Proxy
If the above doesn't work, consider using Prisma Data Proxy (requires Prisma Cloud account):
- Set `PRISMA_ACCELERATE_ENDPOINT` environment variable
- The code already supports this - it will use Accelerate if the endpoint is configured

## What We've Already Configured:
✅ Added `binaryTargets = ["native", "rhel-openssl-3.0.x"]` to schema.prisma
✅ Added `postinstall` script to run `prisma generate`
✅ Moved `prisma` from devDependencies to dependencies
✅ Added `vercel.json` with build command
✅ Configured webpack to exclude Prisma from bundling

## Next Steps:
After setting the environment variable, trigger a new deployment in Vercel.

