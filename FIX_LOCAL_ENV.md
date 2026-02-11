# Fix Local Environment Variables

## The Problem

Your local `.env` file has `DATABASE_URL` in the **WRONG format**:

**Current (WRONG):**
```env
DATABASE_URL="prisma+mysql://accelerate.prisma-data.net/?api_key=..."
```

**Required (CORRECT):**
```env
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=..."
```

## Quick Fix

Run this command to automatically fix your `.env` file:

```bash
node fix-local-env.js
```

Or manually edit your `.env` file:

1. Open `.env` in your editor
2. Find the line with `DATABASE_URL`
3. Change `prisma+mysql://` to `prisma://` (keep the same API key)
4. Save the file

## Correct Format for Local Development

When using Prisma Accelerate locally, you need **TWO variables with DIFFERENT formats**:

### Variable 1: DATABASE_URL
```env
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
```
**Format:** `prisma://...` (NO `+mysql`)

### Variable 2: PRISMA_ACCELERATE_ENDPOINT
```env
PRISMA_ACCELERATE_ENDPOINT="prisma+mysql://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
```
**Format:** `prisma+mysql://...` (WITH `+mysql`)

## Why Different Formats?

- **DATABASE_URL**: Used by Prisma schema validation - expects `prisma://`
- **PRISMA_ACCELERATE_ENDPOINT**: Used by Accelerate extension - expects `prisma+mysql://` to know it's MySQL

Both are needed and both should have the **SAME API key**!

## Verification

After fixing, test your connection:

```bash
node test-db-connection-local.js
```

You should see:
- ✅ `DATABASE_URL format: prisma://...`
- ✅ `Using Prisma Accelerate protocol (correct)`
- ✅ `Query successful!`
- ✅ `Database connected!`

## Common Mistakes

❌ **WRONG:**
```env
DATABASE_URL="prisma+mysql://..."  # ❌ Should be prisma://
PRISMA_ACCELERATE_ENDPOINT="prisma+mysql://..."  # ✅ Correct
```

✅ **CORRECT:**
```env
DATABASE_URL="prisma://..."  # ✅ Correct!
PRISMA_ACCELERATE_ENDPOINT="prisma+mysql://..."  # ✅ Correct
```

## After Fixing

1. **Restart your development server** (if running)
2. **Test the connection**: `node test-db-connection-local.js`
3. **Start your app**: `npm run dev`

The error "URL must start with protocol mysql://" should be gone!






