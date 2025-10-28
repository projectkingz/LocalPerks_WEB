# Recent Data Addition Scripts

This directory contains scripts to add recent data to your LocalPerks database.

## 📋 Overview

The recent data addition includes:
- **1 partner per month** for the last 3 months
- **2 customers per month** for the last 3 months  
- **Transactions** where each customer interacts with each partner once per month
- **Average purchase amount** of £127 per transaction

## 🚀 Usage

### 1. Add Recent Data
```bash
# Using npm script
npm run add:recent-data

# Or directly with ts-node
npx ts-node prisma/add-recent-data.ts
```

### 2. Test Recent Data
```bash
# Using npm script
npm run test:recent-data

# Or directly with ts-node
npx ts-node prisma/test-recent-data.ts
```

### 3. Run Comprehensive Seed (if needed)
```bash
# Using npm script
npm run seed:comprehensive

# Or directly with ts-node
npx ts-node prisma/seed-comprehensive.ts
```

## 📊 Expected Results

After running the recent data script, you should have:

### Partners
- **3 new partners** (1 per month for 3 months)
- Each with realistic business names and partner details
- All set to `ACTIVE` approval status
- Random subscription tiers (Basic, Professional, Enterprise)

### Customers  
- **6 new customers** (2 per month for 3 months)
- Each with realistic names, emails, and phone numbers
- Randomly assigned to existing tenants

### Transactions
- **18 total transactions** (6 customers × 3 partners)
- Each customer interacts with each partner exactly once
- Average transaction amount: £127
- Amount range: £10-£300 (normal distribution around £127)

## 🧪 Testing

The test script verifies:
- ✅ Correct number of recent partners (3)
- ✅ Correct number of recent customers (6)  
- ✅ Correct number of transactions (18)
- ✅ Average transaction amount within £10 of £127
- ✅ All customers have transactions
- ✅ All partner-customer pairs are represented

## 📈 Data Distribution

### Transaction Amounts
- **Mean**: £127
- **Standard Deviation**: £30
- **Range**: £10-£300
- **Distribution**: Normal (bell curve)

### Time Distribution
- **Partners**: 1 per month for last 3 months
- **Customers**: 2 per month for last 3 months
- **Transactions**: Distributed throughout each month

## 🔧 Technical Details

### Files Created
- `add-recent-data.ts` - Main script to add recent data
- `test-recent-data.ts` - Test script to verify data integrity
- `README-RECENT-DATA.md` - This documentation

### Dependencies
- `@prisma/client` - Database client
- `bcryptjs` - Password hashing
- `ts-node` - TypeScript execution

### Database Tables Affected
- `User` - New partner users
- `Tenant` - New business tenants
- `Customer` - New customer records
- `Transaction` - New transaction records

## ⚠️ Important Notes

1. **Existing Data**: The script does NOT delete existing data
2. **Email Uniqueness**: Uses high-numbered suffixes to avoid conflicts
3. **Password**: All new users have password `password123`
4. **Relationships**: All foreign key relationships are properly maintained
5. **Performance**: Uses batch operations where possible

## 🐛 Troubleshooting

### Common Issues

1. **Email Conflicts**: If you get email uniqueness errors, the script uses high-numbered suffixes to avoid conflicts
2. **Database Connection**: Ensure your `DATABASE_URL` is correctly set in `.env`
3. **Permissions**: Ensure your database user has INSERT permissions

### Debug Mode
Add console.log statements to the script to debug specific issues:
```typescript
console.log('Debug: Creating partner', { name, email, businessName });
```

## 📞 Support

If you encounter issues:
1. Check the test script output for specific failures
2. Verify database connectivity
3. Check Prisma schema compatibility
4. Review console logs for error messages
