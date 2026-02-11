# Database Migration Instructions - Add platformReward Column

## Problem
The Prisma schema has been updated to include `platformReward`, but the database column doesn't exist yet, causing the error:
```
Unknown argument `platformReward`. Available options are marked with ?.
```

## Solution

### Step 1: Add the Column to Database

**Option A: Using PlanetScale Dashboard (Recommended)**
1. Log in to your PlanetScale account
2. Navigate to your database: `localperks-mysql`
3. Go to the `system_config` table
4. Click "Add column" or use the SQL editor
5. Run this SQL:
   ```sql
   ALTER TABLE `system_config` 
   ADD COLUMN `platformReward` FLOAT DEFAULT 0.007 AFTER `pointFaceValue`;
   ```

**Option B: Using MySQL CLI or Database Tool**
1. Connect to your database
2. Run:
   ```sql
   ALTER TABLE `system_config` 
   ADD COLUMN `platformReward` FLOAT DEFAULT 0.007 AFTER `pointFaceValue`;
   ```

**Option C: Using Prisma Studio (if available)**
1. Run: `npx prisma studio`
2. Navigate to `system_config` table
3. Manually add the column (not recommended, use SQL instead)

### Step 2: Regenerate Prisma Client

After adding the column, regenerate the Prisma client:

```bash
npx prisma generate
```

### Step 3: Update Existing Records (Optional)

If you have existing records, update them to have the default value:

```sql
UPDATE `system_config` 
SET `platformReward` = 0.007 
WHERE `platformReward` IS NULL;
```

## Verification

After completing the steps:
1. Restart your Next.js dev server
2. Try updating the system config again
3. The `platformReward` field should now work

## Quick SQL Command

Copy and paste this into your PlanetScale SQL editor:

```sql
ALTER TABLE `system_config` 
ADD COLUMN `platformReward` FLOAT DEFAULT 0.007 AFTER `pointFaceValue`;

UPDATE `system_config` 
SET `platformReward` = 0.007 
WHERE `platformReward` IS NULL;
```

Then run:
```bash
npx prisma generate
```

## Notes

- The column will be added with a default value of `0.007`
- Existing records will automatically get this default value
- After adding the column and regenerating Prisma client, the error should be resolved
