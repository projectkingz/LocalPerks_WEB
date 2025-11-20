# QR Code Migration Guide

This guide explains how to migrate to the new persistent QR code system.

## Overview

The QR code system has been updated to store persistent, unique QR codes in the database instead of generating them dynamically each time. This ensures:

- ✅ QR codes remain consistent across sessions
- ✅ Customers can be reliably identified by their QR code
- ✅ Better performance (no regeneration needed)
- ✅ Unique identifier stored in database

## Changes Made

### 1. Database Schema
- Added `qrCode` field to `Customer` model (unique, indexed)
- Format: `customer-{customerId}-{shortUuid}`

### 2. API Endpoints

#### New/Updated Endpoints:
- `GET /api/customer/qr` - Get QR code for authenticated customer (generates if missing)
- `GET /api/customers/qr/[email]` - Get QR code by email (generates if missing)
- `GET /api/customers/qr/lookup?qrCode={qrCode}` - Lookup customer by QR code
- `POST /api/customers/qr/lookup` - Lookup customer by QR code (POST)
- `PUT /api/customers/qr` - Validate scanned QR code

### 3. Updated Code
- `src/lib/pointsUtil.ts` - Updated to use new lookup endpoint
- `src/app/(authenticated)/tenant/scan/page.tsx` - Updated QR code scanning

## Migration Steps

### Step 1: Run Database Migration

```bash
# Generate Prisma migration
npx prisma migrate dev --name add_qr_code_to_customer

# Or if using production database
npx prisma migrate deploy
```

### Step 2: Generate QR Codes for Existing Customers

Run the migration script to generate QR codes for all existing customers:

```bash
node scripts/generate-qr-codes.js
```

This script will:
- Find all customers without QR codes
- Generate unique QR codes for each
- Store them in the database

### Step 3: Verify Migration

Check that QR codes were generated:

```bash
# Using Prisma Studio
npx prisma studio

# Or using a test script
node check-tina.js
```

### Step 4: Test QR Code Functionality

1. **Customer Profile Page**: Visit `/customer/profile` and verify QR code displays
2. **QR Code Scanning**: Test scanning QR codes in the tenant scan page
3. **API Endpoints**: Test the lookup endpoints

## QR Code Format

QR codes follow this format:
```
customer-{customerId}-{shortUuid}
```

Example:
```
customer-clx123abc456-7f3a2b1c
```

## API Usage Examples

### Get Customer QR Code
```javascript
// For authenticated customer
const response = await fetch('/api/customer/qr');
const { qrCode, customerId } = await response.json();

// By email
const response = await fetch('/api/customers/qr/tina.allen900@example.com');
const { qrCode, customerId, email, name } = await response.json();
```

### Lookup Customer by QR Code
```javascript
// GET request
const response = await fetch(`/api/customers/qr/lookup?qrCode=${encodeURIComponent(qrCode)}`);
const { success, customer } = await response.json();

// POST request
const response = await fetch('/api/customers/qr/lookup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ qrCode })
});
const { success, customer } = await response.json();
```

### Validate Scanned QR Code
```javascript
const response = await fetch('/api/customers/qr', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: scannedQRCode })
});
const { success, customer } = await response.json();
```

## Troubleshooting

### Issue: QR codes not generating
- Check database connection
- Verify Prisma migration ran successfully
- Check for unique constraint violations

### Issue: QR code lookup fails
- Verify QR code format matches: `customer-{id}-{uuid}`
- Check that customer exists in database
- Verify QR code was generated (not null)

### Issue: Duplicate QR codes
- The system includes collision detection
- If collision occurs, script will retry up to 10 times
- Check database for actual duplicates

## Rollback

If you need to rollback:

1. Remove the `qrCode` field from the schema
2. Run migration to remove the column
3. Revert code changes

```bash
# Remove field from schema.prisma
# Then run:
npx prisma migrate dev --name remove_qr_code_from_customer
```

## Notes

- QR codes are generated automatically when first requested
- Once generated, QR codes remain constant for the customer
- QR codes are unique across all customers
- The system handles edge cases (collisions, missing customers, etc.)

---

**Migration Date**: November 7, 2025  
**Status**: Ready for deployment



