# Update All Mobile Numbers to +447402611112

## Quick SQL Script

Since the Prisma connection has API key issues, use this SQL script directly in your database:

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

## How to Run

### Option 1: Using MySQL CLI
```bash
mysql -h your-host -u your-user -p your-database < scripts/update-all-mobile-numbers.sql
```

### Option 2: Using Database GUI Tool
1. Open your database management tool (MySQL Workbench, phpMyAdmin, DBeaver, etc.)
2. Connect to your database
3. Open `scripts/update-all-mobile-numbers.sql`
4. Execute the SQL statements

### Option 3: Using Prisma Studio (if connection works)
1. Run `npx prisma studio`
2. Navigate to Customer, Tenant, and Admin tables
3. Manually update mobile numbers

### Option 4: Using Vercel Database Dashboard
1. Go to your database provider's dashboard
2. Open SQL editor
3. Paste and run the SQL statements

## Verification Query

After running the update, verify with:

```sql
SELECT 
    'Customer' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN mobile = '+447402611112' THEN 1 END) as updated_count
FROM Customer

UNION ALL

SELECT 
    'Tenant' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN mobile = '+447402611112' THEN 1 END) as updated_count
FROM Tenant

UNION ALL

SELECT 
    'Admin' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN mobile = '+447402611112' THEN 1 END) as updated_count
FROM Admin;
```

## What Gets Updated

- ✅ **Customer** table: All `mobile` fields → `+447402611112`
- ✅ **Tenant** table: All `mobile` fields → `+447402611112`
- ✅ **Admin** table: All `mobile` fields → `+447402611112`

## Phone Number Format

- **Input**: `07402 611112`
- **Normalized**: `+447402611112` (E.164 format)
- **Country**: UK (+44)
- **Format**: Removed spaces, added country code

## Notes

- The SQL script only updates rows where `mobile IS NOT NULL`
- Empty/null mobile numbers are not changed
- All existing mobile numbers will be replaced with the test number
- This is useful for testing WhatsApp/SMS functionality

## After Update

Once updated, all users will receive 2FA codes at `+447402611112`:
- Customer registrations → SMS/WhatsApp to this number
- Partner registrations → SMS/WhatsApp to this number
- Login 2FA → SMS/WhatsApp to this number

Make sure this number is:
- ✅ Added to Twilio WhatsApp sandbox (for testing)
- ✅ Or use SMS fallback (works immediately)






