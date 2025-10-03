const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTransactions() {
  try {
    console.log('🔍 Checking transaction data...');
    
    const transactionCount = await prisma.transaction.count();
    const voucherCount = await prisma.voucher.count();
    
    console.log(`📊 Transaction count: ${transactionCount}`);
    console.log(`🎫 Voucher count: ${voucherCount}`);
    
    if (transactionCount === 0) {
      console.log('❌ No transactions found - need to seed transactions');
    } else {
      console.log('✅ Transactions exist');
    }
    
    if (voucherCount === 0) {
      console.log('❌ No vouchers found - need to seed vouchers');
    } else {
      console.log('✅ Vouchers exist');
    }
    
  } catch (error) {
    console.error('❌ Error checking data:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactions();
