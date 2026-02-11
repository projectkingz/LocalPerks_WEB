# Update Mobile Numbers - Quick Guide

## Target Number
**+447402611112** (normalized from `07402 611112`)

## Quick SQL (Copy & Run)

Run these SQL statements in your database:

```sql
-- Update Customer mobile numbers
UPDATE Customer 
SET mobile = '+447402611112'
WHERE mobile IS NOT NULL;

-- Update Tenant (Partner) mobile numbers
UPDATE Tenant 
SET mobile = '+447402611112'
WHERE mobile IS NOT NULL;

-- Update Admin mobile numbers
UPDATE Admin 
SET mobile = '+447402611112'
WHERE mobile IS NOT NULL;
```

## How to Run SQL

### Option 1: Prisma Studio (Easiest - GUI)

```bash
npx prisma studio
```

Then:
1. Open http://localhost:5555
2. Click on `Customer` table
3. Edit mobile numbers manually
4. Repeat for `Tenant` and `Admin` tables

### Option 2: MySQL Command Line

```bash
# Connect to MySQL
mysql -h localhost -u root -p localperks

# Then paste and run the UPDATE statements
```

### Option 3: Database GUI Tool

1. Open MySQL Workbench, DBeaver, or phpMyAdmin
2. Connect to your database
3. Open SQL editor
4. Paste and run the UPDATE statements

### Option 4: PlanetScale Dashboard

1. Go to https://app.planetscale.com
2. Select your database
3. Open SQL editor
4. Paste and run the UPDATE statements

### Option 5: Vercel Database Dashboard

If using PlanetScale via Vercel:
1. Go to Vercel Dashboard
2. Your Project → Settings → Database
3. Open SQL editor
4. Run the UPDATE statements

## Verify Updates

After running, verify with:

```sql
SELECT 
    'Customer' as table_name,
    COUNT(*) as total,
    COUNT(CASE WHEN mobile = '+447402611112' THEN 1 END) as updated
FROM Customer

UNION ALL

SELECT 
    'Tenant' as table_name,
    COUNT(*) as total,
    COUNT(CASE WHEN mobile = '+447402611112' THEN 1 END) as updated
FROM Tenant

UNION ALL

SELECT 
    'Admin' as table_name,
    COUNT(*) as total,
    COUNT(CASE WHEN mobile = '+447402611112' THEN 1 END) as updated
FROM Admin;
```

## What Gets Updated

- ✅ **Customer** table: All `mobile` fields → `+447402611112`
- ✅ **Tenant** table: All `mobile` fields → `+447402611112`
- ✅ **Admin** table: All `mobile` fields → `+447402611112`

**Note**: Only rows where `mobile IS NOT NULL` are updated. Empty/null values are not changed.

## After Update

All users will now receive 2FA codes at `+447402611112`:
- Customer registrations → SMS/WhatsApp to this number
- Partner registrations → SMS/WhatsApp to this number
- Login 2FA → SMS/WhatsApp to this number

Make sure this number:
- ✅ Is added to Twilio WhatsApp sandbox (for testing)
- ✅ Or use SMS fallback (works immediately)






