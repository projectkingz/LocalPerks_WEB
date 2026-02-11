# Quick Mobile Number Update

## The Issue

The batch script needs a database connection. You have two options:

## Option 1: Use SQL Directly (Fastest - No Script Needed)

Run this SQL in your database (Prisma Studio, MySQL Workbench, or any SQL client):

```sql
UPDATE Customer SET mobile = '+447402611112' WHERE mobile IS NOT NULL;
UPDATE Tenant SET mobile = '+447402611112' WHERE mobile IS NOT NULL;
UPDATE Admin SET mobile = '+447402611112' WHERE mobile IS NOT NULL;
```

### How to Run SQL:

**Easiest: Prisma Studio**
```bash
npx prisma studio
```
Then click on each table and edit mobile numbers, OR use the SQL editor if available.

**MySQL Command Line:**
```bash
mysql -h localhost -u root -p localperks
# Then paste the UPDATE statements
```

**Database GUI:**
- MySQL Workbench
- DBeaver
- phpMyAdmin
- PlanetScale Dashboard

## Option 2: Fix Database Connection for Script

### Step 1: Create .env.local

```bash
# Copy template
cp .env.local.example .env.local
```

### Step 2: Edit .env.local

Add your local MySQL connection:

```env
DATABASE_URL="mysql://root:password@localhost:3306/localperks"
```

### Step 3: Run Script

```bash
npm run mobile:update:all "+447402 611112"
```

## Quick SQL (Copy & Paste)

```sql
-- Update all mobile numbers to +447402611112
UPDATE Customer SET mobile = '+447402611112' WHERE mobile IS NOT NULL;
UPDATE Tenant SET mobile = '+447402611112' WHERE mobile IS NOT NULL;
UPDATE Admin SET mobile = '+447402611112' WHERE mobile IS NOT NULL;

-- Verify updates
SELECT 'Customer' as table_name, COUNT(*) as total, 
       COUNT(CASE WHEN mobile = '+447402611112' THEN 1 END) as updated
FROM Customer
UNION ALL
SELECT 'Tenant', COUNT(*), COUNT(CASE WHEN mobile = '+447402611112' THEN 1 END)
FROM Tenant
UNION ALL
SELECT 'Admin', COUNT(*), COUNT(CASE WHEN mobile = '+447402611112' THEN 1 END)
FROM Admin;
```

## Recommendation

**Use Option 1 (SQL directly)** - It's faster and doesn't require fixing database connections.

Just run:
```bash
npx prisma studio
```

Then use the SQL editor or manually update the tables.






