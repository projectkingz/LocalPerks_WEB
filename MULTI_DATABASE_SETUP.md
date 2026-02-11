# Managing Local and Production Databases

## Overview

You have:
- **Local Database**: MySQL (for development)
- **Production Database**: PlanetScale (via Prisma Accelerate on Vercel)

## Best Approach: Environment-Based Configuration

Use different `.env` files for different environments:

### File Structure
```
.env.local          # Local development (direct MySQL)
.env.production     # Production (PlanetScale via Accelerate)
.env                # Default (can be local or production)
```

## Setup

### 1. Local Development (.env.local)

```env
# Local MySQL Database (Direct Connection)
DATABASE_URL="mysql://user:password@localhost:3306/localperks?sslaccept=strict"

# No Accelerate needed for local
# PRISMA_ACCELERATE_ENDPOINT=  # Leave empty or comment out

# Other local configs
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
```

### 2. Production (.env.production or Vercel)

```env
# PlanetScale via Prisma Accelerate
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
PRISMA_ACCELERATE_ENDPOINT="prisma+mysql://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"

# Production configs
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.vercel.app
```

## Prisma Configuration

Your `prisma/schema.prisma` already supports both:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")  // Reads from environment
}
```

## Switching Between Databases

### Option 1: Use .env.local (Recommended)

Next.js automatically loads `.env.local` in development:

```bash
# Development - uses .env.local (local MySQL)
npm run dev

# Production build - uses .env.production (PlanetScale)
npm run build
```

### Option 2: Use Environment Variables

```bash
# Local development
DATABASE_URL="mysql://..." npm run dev

# Production
DATABASE_URL="prisma://..." npm run build
```

### Option 3: Use dotenv-cli

```bash
# Install
npm install -D dotenv-cli

# Use specific env file
dotenv -e .env.local -- npm run dev
dotenv -e .env.production -- npm run build
```

## Prisma Commands

### Generate Prisma Client

```bash
# Local (direct MySQL)
npx prisma generate

# Production (with Accelerate)
npx prisma generate --accelerate
```

### Migrations

**Important**: PlanetScale uses **branching** instead of traditional migrations.

#### For Local Database (Traditional Migrations)
```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migration
npx prisma migrate deploy
```

#### For PlanetScale (Schema Push)
```bash
# Push schema changes (non-destructive)
npx prisma db push

# Or use PlanetScale CLI
pscale branch create my-branch
pscale deploy-requests create my-branch
```

## Recommended Workflow

### 1. Development Workflow

```bash
# 1. Work locally with .env.local
cp .env.local .env  # Or use .env.local directly

# 2. Make schema changes in prisma/schema.prisma

# 3. Apply to local database
npx prisma migrate dev --name add_new_field

# 4. Generate Prisma Client
npx prisma generate

# 5. Test locally
npm run dev
```

### 2. Production Deployment Workflow

```bash
# 1. Push schema to PlanetScale
npx prisma db push

# 2. Generate Prisma Client with Accelerate
npx prisma generate --accelerate

# 3. Deploy to Vercel (uses .env.production or Vercel env vars)
vercel deploy --prod
```

## Helper Scripts

Create these scripts in `package.json`:

```json
{
  "scripts": {
    "db:local": "dotenv -e .env.local -- prisma",
    "db:prod": "dotenv -e .env.production -- prisma",
    "db:generate:local": "dotenv -e .env.local -- prisma generate",
    "db:generate:prod": "dotenv -e .env.production -- prisma generate --accelerate",
    "db:push:local": "dotenv -e .env.local -- prisma db push",
    "db:push:prod": "dotenv -e .env.production -- prisma db push",
    "db:studio:local": "dotenv -e .env.local -- prisma studio",
    "db:studio:prod": "dotenv -e .env.production -- prisma studio"
  }
}
```

## Database Connection Detection

Update `src/lib/prisma.ts` to detect environment:

```typescript
const dbUrl = process.env.DATABASE_URL || '';
const isUsingAccelerate = dbUrl.startsWith('prisma://');
const isLocal = process.env.NODE_ENV === 'development' && !isUsingAccelerate;

if (isLocal) {
  console.log('[Prisma] Using local MySQL database');
} else if (isUsingAccelerate) {
  console.log('[Prisma] Using PlanetScale via Accelerate');
}
```

## Best Practices

### ✅ DO

1. **Keep schemas in sync** - Use same `schema.prisma` for both
2. **Use migrations locally** - Test migrations on local DB first
3. **Use db push for PlanetScale** - PlanetScale prefers schema push
4. **Separate .env files** - Keep local and production configs separate
5. **Test locally first** - Always test schema changes locally before production

### ❌ DON'T

1. **Don't mix environments** - Don't use production DB in development
2. **Don't skip testing** - Always test migrations locally first
3. **Don't use migrate deploy on PlanetScale** - Use `db push` instead
4. **Don't commit .env files** - Keep secrets out of git
5. **Don't use production data locally** - Use seed data instead

## Troubleshooting

### Local Database Connection Issues

```bash
# Test local connection
npx prisma db pull --schema=./prisma/schema.prisma

# Reset local database (WARNING: deletes all data)
npx prisma migrate reset
```

### PlanetScale Connection Issues

```bash
# Test PlanetScale connection
npx prisma db pull --schema=./prisma/schema.prisma

# Verify Accelerate endpoint
echo $PRISMA_ACCELERATE_ENDPOINT
```

### Schema Sync Issues

```bash
# Pull schema from database (if schema.prisma is out of sync)
npx prisma db pull

# Push schema to database (if database is out of sync)
npx prisma db push
```

## Quick Reference

| Task | Local | Production |
|------|-------|------------|
| **Connection** | `mysql://...` | `prisma://...` |
| **Generate** | `prisma generate` | `prisma generate --accelerate` |
| **Migrations** | `prisma migrate dev` | `prisma db push` |
| **Studio** | `prisma studio` | `prisma studio` (with prod URL) |
| **Reset** | `prisma migrate reset` | ❌ Don't reset production! |

## Next Steps

1. Create `.env.local` with your local MySQL connection
2. Keep `.env.production` or use Vercel environment variables
3. Use the helper scripts for easy switching
4. Test all schema changes locally first
5. Deploy to PlanetScale using `db push`






