# Migration: Make Mobile Required

This migration makes mobile numbers required for:
- Tenant (partner business accounts)
- Admin (admin accounts)

## Pre-requisites

**IMPORTANT**: Before running this migration, you must run the script to generate mobile numbers for existing users:

```bash
npx tsx scripts/generate-mobile-numbers.ts
```

This script has already generated mobile numbers for all existing tenants without mobile numbers.

## Migration Steps

1. Run the mobile number generation script (if not already done):
   ```bash
   npx tsx scripts/generate-mobile-numbers.ts
   ```

2. Apply the migration:
   ```bash
   npx prisma migrate deploy
   ```

   Or if using db push:
   ```bash
   npx prisma db push
   ```

## What Changed

- `Tenant.mobile` is now required (was optional)
- `Admin.mobile` is now required (was optional)
- `Customer.mobile` was already required

## Impact

- All new Tenant records must have a mobile number
- All new Admin records must have a mobile number
- Registration flows already validate mobile numbers
- Existing users have been updated with generated mobile numbers


