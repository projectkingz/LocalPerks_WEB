# System Configuration Update

**Date:** January 20, 2026  
**Changes:** Updated customer reward and added platform reward configuration

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)
- **Updated `pointFaceValue` default:** Changed from `0.01` to `0.008` (Customer Reward)
- **Added new field `platformReward`:** Default value `0.007` (Platform Reward)
- **Kept existing fields unchanged:**
  - `systemFixedCharge`: `0.001` (unchanged)
  - `systemVariableCharge`: `0.06` (unchanged)

### 2. System Config Library (`src/lib/systemConfig.ts`)
- Added `platformReward` to `SystemConfig` interface
- Updated default values to match new configuration
- Added fallback handling for `platformReward` in existing configs

### 3. API Endpoint (`src/app/api/admin/system-config/route.ts`)
- Added `platformReward` to validation logic
- Updated create/update operations to include `platformReward`
- Set default value of `0.007` if not provided

### 4. Admin UI (`src/app/admin/system-config/page.tsx`)
- Updated default state to include `platformReward: 0.007`
- Added new input field for "Platform Reward" in the configuration form
- Updated "Point Face Value" label to "Customer Reward - Point Face Value"
- Added visual distinction (purple color) for platform reward field

## Configuration Values

| Field | Old Value | New Value | Description |
|-------|-----------|-----------|-------------|
| `pointFaceValue` | £0.01 | **£0.008** | Customer Reward (editable) |
| `platformReward` | N/A | **£0.007** | Platform Reward (new field) |
| `systemFixedCharge` | £0.001 | £0.001 | System Fixed Charge (unchanged) |
| `systemVariableCharge` | 6% | 6% | System Variable Charge (unchanged) |

## Next Steps

### 1. Update Database Schema
Run one of the following commands to apply the schema changes:

```bash
# Option 1: Push changes directly (for development)
npx prisma db push

# Option 2: Create a migration (for production)
npx prisma migrate dev --name add_platform_reward
```

### 2. Regenerate Prisma Client
After updating the schema:

```bash
npx prisma generate
```

### 3. Update Existing Records (if needed)
If you have existing SystemConfig records, you may need to update them:

```sql
UPDATE system_config 
SET platformReward = 0.007, pointFaceValue = 0.008 
WHERE platformReward IS NULL;
```

Or update via the admin UI at `/admin/system-config`

## Usage

The new `platformReward` field can be used in calculations for platform fees. The existing fixed and variable charges remain unchanged and continue to work as before.

## Notes

- **Customer Reward (`pointFaceValue`)**: £0.008 per point - This is the value customers receive per point (editable)
- **Platform Reward (`platformReward`)**: £0.007 per point - This is the platform's reward per point
- **System Fixed Charge**: £0.001 per point - Unchanged
- **System Variable Charge**: 6% margin - Unchanged

All changes maintain backward compatibility. Existing configurations will work, and the new `platformReward` field will default to `0.007` if not set.
