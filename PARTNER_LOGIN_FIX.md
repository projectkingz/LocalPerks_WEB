# Partner Login Fix Guide

## Problem
Partner and business users are unable to log into the React Native mobile app due to password validation failures.

## Root Causes Identified
1. **Password mismatch** - The passwords in the database may not match 'password123'
2. **Approval status issue** - Partners might not have 'ACTIVE' approval status
3. **Seed data not run** - The seed data with correct passwords may not have been executed

## Solution Steps

### Step 1: Fix Partner Passwords in Database
Run the password fix script to ensure all partner users have the correct password:

```bash
cd "C:\Users\drtha\OneDrive\Desktop\LocalPerks_WEB"
node scripts/fix-partner-passwords.js
```

This script will:
- Check all partner users in the database
- Verify their current passwords
- Update all partner passwords to 'password123'
- Set all partner approval statuses to 'ACTIVE'
- Verify the fix worked

### Step 2: Test Partner Login
After running the fix script, test with these credentials:

**Partner Login Credentials:**
- Email: `sarah.johnson@business.com`
- Password: `password123`
- Business: Starbucks Coffee

**Alternative Partner Accounts:**
- `michael.chen@business.com` (Costa Coffee)
- `emma.williams@business.com` (Pret A Manger)
- `david.rodriguez@business.com` (Greggs)
- All use password: `password123`

### Step 3: Verify Mobile App Configuration
Ensure the mobile app is connecting to the correct API:

1. Check `LocalPerks_APP/src/config/api.ts`
2. Verify `API_BASE_URL` is set to your computer's IP: `http://192.168.5.213:3000/api`
3. Make sure the web backend is running on port 3000

### Step 4: Check Web Backend Logs
When attempting login, check the backend logs for debugging information:

```bash
cd "C:\Users\drtha\OneDrive\Desktop\LocalPerks_WEB"
npm run dev
```

Look for these log messages:
- "Mobile login attempt for: [email]"
- "User found: {...}"
- "Comparing password: ..."
- "Password comparison result: ..."

## Common Issues and Solutions

### Issue 1: "Invalid password" Error
**Solution:** Run the password fix script (Step 1 above)

### Issue 2: "Partner account pending approval" Error
**Solution:** The fix script also sets approval status to 'ACTIVE'

### Issue 3: "User not found" Error
**Solution:** The user doesn't exist. Re-run seed data:
```bash
cd "C:\Users\drtha\OneDrive\Desktop\LocalPerks_WEB"
npx prisma db seed
```

### Issue 4: Network Connection Error
**Solution:** 
1. Check if the backend is running (`npm run dev`)
2. Verify the IP address in the mobile app's `api.ts`
3. Ensure your phone/emulator is on the same network as your computer

## Manual Password Reset (if needed)

If you need to manually reset a specific partner's password:

```javascript
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  const hashedPassword = await hash('password123', 12);
  
  await prisma.user.update({
    where: { email: 'sarah.johnson@business.com' },
    data: { 
      password: hashedPassword,
      approvalStatus: 'ACTIVE',
      suspended: false
    }
  });
  
  console.log('Password reset complete');
  await prisma.$disconnect();
}

resetPassword();
```

## Verification Checklist

- [ ] Password fix script completed successfully
- [ ] Test login with `sarah.johnson@business.com` / `password123`
- [ ] Partner can access dashboard in mobile app
- [ ] Partner can scan QR codes
- [ ] Partner can view transactions
- [ ] Partner can logout successfully

## API Endpoints Used

- **Login:** `POST /api/auth/mobile-login`
- **Dashboard Stats:** `GET /api/dashboard-stats` (requires Bearer token)
- **Transactions:** `GET /api/transactions` (requires Bearer token)
- **Profile:** `GET /api/tenants/profile` (requires Bearer token)

## Need More Help?

If the issue persists:
1. Check the server logs for detailed error messages
2. Run the check script: `node check-user-password.js`
3. Verify the database has partner users: Check pgAdmin or run `npx prisma studio`
4. Ensure bcryptjs is installed: `npm list bcryptjs`

## Success!
After completing these steps, all partner users should be able to log into the mobile app with:
- Email: [partner email from database]
- Password: `password123`

