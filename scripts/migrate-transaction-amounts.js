/**
 * Migration Script: Add Face Value Amounts to Existing SPENT Transactions
 * 
 * This script updates all SPENT transactions that currently have amount = 0
 * to show their face value based on the points and tenant configuration.
 * 
 * Usage: node scripts/migrate-transaction-amounts.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Default config in case tenant doesn't have custom config
const DEFAULT_POINT_FACE_VALUE = 0.01;

async function getTenantConfig(tenantId) {
  try {
    const config = await prisma.tenantPointsConfig.findFirst({
      where: { tenantId },
    });

    if (config && config.config) {
      const parsedConfig = JSON.parse(config.config);
      return parsedConfig.pointFaceValue || DEFAULT_POINT_FACE_VALUE;
    }
  } catch (error) {
    console.error(`Error fetching config for tenant ${tenantId}:`, error.message);
  }

  return DEFAULT_POINT_FACE_VALUE;
}

async function migrateTransactionAmounts() {
  console.log('🔍 Starting transaction amount migration...\n');

  try {
    // Find all SPENT and VOID transactions with amount = 0 or negative amounts
    const spentTransactionsWithZeroAmount = await prisma.transaction.findMany({
      where: {
        OR: [
          {
            type: 'SPENT',
            OR: [
              { amount: 0 },
              { amount: { lt: 0 } }
            ]
          },
          {
            status: 'VOID',
            OR: [
              { amount: 0 },
              { amount: { lt: 0 } }
            ]
          }
        ]
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Found ${spentTransactionsWithZeroAmount.length} SPENT/VOID transactions with amount = 0 or negative\n`);

    if (spentTransactionsWithZeroAmount.length === 0) {
      console.log('✅ No transactions to migrate. All SPENT/VOID transactions already have amounts set.\n');
      return;
    }

    // Group by tenant to minimize config fetches
    const transactionsByTenant = {};
    spentTransactionsWithZeroAmount.forEach(transaction => {
      if (!transactionsByTenant[transaction.tenantId]) {
        transactionsByTenant[transaction.tenantId] = [];
      }
      transactionsByTenant[transaction.tenantId].push(transaction);
    });

    console.log(`🏢 Processing ${Object.keys(transactionsByTenant).length} tenants...\n`);

    let totalUpdated = 0;
    let errors = 0;

    // Process each tenant's transactions
    for (const [tenantId, transactions] of Object.entries(transactionsByTenant)) {
      const tenantName = transactions[0].tenant?.name || 'Unknown';
      console.log(`\n🏪 Processing ${transactions.length} transactions for: ${tenantName}`);
      
      // Get tenant's point face value configuration
      const pointFaceValue = await getTenantConfig(tenantId);
      console.log(`   💰 Point face value: £${pointFaceValue.toFixed(4)} per point`);

      // Update each transaction
      for (const transaction of transactions) {
        try {
          // Use absolute value of points to calculate face value (points might be stored as negative)
          const absolutePoints = Math.abs(transaction.points);
          const faceValueAmount = absolutePoints * pointFaceValue;
          
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { amount: faceValueAmount }
          });

          const txType = transaction.status === 'VOID' ? 'VOID' : transaction.type;
          console.log(`   ✅ Updated transaction ${transaction.id.substring(0, 8)}... | ${txType} | ${absolutePoints} pts → £${faceValueAmount.toFixed(2)} | Customer: ${transaction.customer?.name || 'Unknown'}`);
          totalUpdated++;
        } catch (error) {
          console.error(`   ❌ Failed to update transaction ${transaction.id}:`, error.message);
          errors++;
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n✨ Migration Complete!`);
    console.log(`   📊 Total transactions processed: ${spentTransactionsWithZeroAmount.length}`);
    console.log(`   ✅ Successfully updated: ${totalUpdated}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('\n' + '='.repeat(80) + '\n');

    // Show sample of updated transactions
    console.log('📋 Sample of updated transactions:');
    const sampleTransactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { type: 'SPENT', amount: { gt: 0 } },
          { status: 'VOID', amount: { gt: 0 } }
        ]
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      take: 5,
      orderBy: {
        updatedAt: 'desc'
      }
    });

    sampleTransactions.forEach(t => {
      console.log(`   • ${t.customer?.name || 'Unknown'} | ${t.points} pts | £${t.amount.toFixed(2)} | ${new Date(t.createdAt).toLocaleDateString()}`);
    });

    console.log('\n✅ Migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateTransactionAmounts()
  .then(() => {
    console.log('👍 Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

