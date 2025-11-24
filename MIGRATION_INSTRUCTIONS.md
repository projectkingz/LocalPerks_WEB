# Migration Instructions for Display ID Feature

## Option 1: Using `prisma db push` (Recommended for Development)

This method doesn't require shadow database permissions and is simpler for development:

```bash
cd C:\0_LocalPerks\LocalPerks_WEB

# Push schema changes to database
npx prisma db push

# Regenerate Prisma client
npx prisma generate

# Run migration script to generate displayIds for existing customers
npx tsx scripts/migrate-customer-display-ids.ts
```

## Option 2: Using Prisma Migrate (If you have database permissions)

If you need to create a proper migration file, you can disable shadow database:

1. Add this to your `schema.prisma` datasource:
```prisma
datasource db {
  provider     = "mysql"
  url          = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")  // Optional: provide a shadow DB URL
  relationMode = "prisma"
}
```

2. Or set an environment variable to disable shadow database check:
```bash
PRISMA_MIGRATE_SKIP_GENERATE=1 npx prisma migrate dev --name add_display_id_to_customer --create-only
```

Then manually edit the migration SQL if needed.

## What Changed

The schema now includes a `displayId` field on the Customer model:
- 6-digit case-insensitive alphanumeric code (0-9, A-Z)
- Unique and indexed
- Auto-generated for new customers
- Can be migrated for existing customers using the script

## After Migration

1. All new customers will automatically get a displayId
2. Existing customers need to run the migration script
3. Digital cards in both APP and WEB will show the 6-digit ID instead of the long database ID

