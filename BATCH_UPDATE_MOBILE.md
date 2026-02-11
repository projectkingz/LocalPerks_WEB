# Batch Update Mobile Numbers

## Quick Start

### Option 1: Update All to Same Number (Easiest)

```bash
npx tsx scripts/batch-update-mobile.ts --all "07402 611112"
```

This updates **all** mobile numbers in Customer, Tenant, and Admin tables to the same number.

### Option 2: Interactive Mode

```bash
npx tsx scripts/batch-update-mobile.ts
```

Then choose:
1. Update all to same number
2. Update from CSV file
3. View current mobile numbers

### Option 3: Update from CSV File

```bash
npx tsx scripts/batch-update-mobile.ts --csv scripts/mobile-numbers-template.csv
```

## CSV Format

Create a CSV file with this format:

```csv
type,id,email,name,newMobile
customer,clx1234567890,customer1@example.com,John Doe,07402 611112
customer,clx1234567891,customer2@example.com,Jane Smith,07402 611112
tenant,clx1234567892,,Business Name,07402 611112
admin,clx1234567893,,Admin Name,07402 611112
```

**Columns:**
- `type`: `customer`, `tenant`, or `admin`
- `id`: The record ID (required)
- `email`: Email address (optional, for reference)
- `name`: Name (optional, for reference)
- `newMobile`: New mobile number (will be normalized automatically)

**Note**: The script automatically normalizes phone numbers:
- `07402 611112` → `+447402611112`
- `7402611112` → `+447402611112`
- `+447402611112` → `+447402611112` (unchanged)

## Examples

### Example 1: Update All to Test Number

```bash
npx tsx scripts/batch-update-mobile.ts --all "07402 611112"
```

Output:
```
✅ Updated 25 customers
✅ Updated 5 tenants
✅ Updated 2 admins

✅ All mobile numbers updated to: +447402611112
```

### Example 2: Update Specific Records from CSV

1. Create CSV file `updates.csv`:
```csv
type,id,email,name,newMobile
customer,clx1234567890,john@example.com,John,07402 611112
customer,clx1234567891,jane@example.com,Jane,07402 611112
```

2. Run:
```bash
npx tsx scripts/batch-update-mobile.ts --csv updates.csv
```

Output:
```
✅ Customer john@example.com: +441234567890 → +447402611112
✅ Customer jane@example.com: +441234567891 → +447402611112

📊 Summary: 2 updated, 0 errors
```

### Example 3: View Current Numbers

```bash
npx tsx scripts/batch-update-mobile.ts
# Choose option 3
```

Shows first 10 customers, 10 tenants, and all admins with their current mobile numbers.

## Getting Record IDs

### From Prisma Studio

```bash
npx prisma studio
```

Then:
1. Open table (Customer, Tenant, or Admin)
2. Copy the `id` field for each record

### From Database Query

```sql
-- Get Customer IDs
SELECT id, email, mobile FROM Customer;

-- Get Tenant IDs
SELECT id, name, mobile FROM Tenant;

-- Get Admin IDs
SELECT id, name, mobile FROM Admin;
```

### Export to CSV

You can export current data to CSV and edit:

```sql
-- Export Customers
SELECT 'customer' as type, id, email, name, mobile as newMobile
FROM Customer
INTO OUTFILE 'customers.csv'
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n';
```

## Phone Number Normalization

The script automatically normalizes phone numbers to E.164 format:

| Input | Output |
|-------|--------|
| `07402 611112` | `+447402611112` |
| `7402611112` | `+447402611112` |
| `+447402611112` | `+447402611112` |
| `00447402611112` | `+447402611112` |

**UK numbers** (starting with 0 or no country code) are automatically converted to `+44`.

## Error Handling

The script will:
- ✅ Skip records that don't exist
- ✅ Show which records were updated successfully
- ✅ Show which records had errors
- ✅ Continue processing even if some records fail

## Verification

After updating, verify with:

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

## Troubleshooting

### "Database connection issue"

Make sure your `.env` or `.env.local` has correct `DATABASE_URL`:
```env
DATABASE_URL="mysql://user:password@localhost:3306/localperks"
```

### "Record not found"

- Check the ID is correct
- Verify the record exists in the database
- Use Prisma Studio to find correct IDs

### "CSV parsing error"

- Make sure CSV has header row: `type,id,email,name,newMobile`
- Check for proper commas (no extra commas in values)
- Wrap values with commas in quotes: `"Smith, John"`

## Template File

A template CSV file is available at:
```
scripts/mobile-numbers-template.csv
```

Copy and edit this file with your actual data.






