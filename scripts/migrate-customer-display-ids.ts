/**
 * Migration script to generate displayId for existing customers
 * Run with: npx tsx scripts/migrate-customer-display-ids.ts
 */

import { PrismaClient } from '@prisma/client';
import { generateUniqueDisplayId } from '../src/lib/customerId';

const prisma = new PrismaClient();

async function migrateCustomerDisplayIds() {
  try {
    console.log('🔄 Starting migration to add displayId for existing customers...\n');

    // Find all customers without displayId
    const customersWithoutDisplayId = await prisma.customer.findMany({
      where: {
        displayId: null
      },
      select: {
        id: true,
        email: true,
        displayId: true
      }
    });

    console.log(`📊 Found ${customersWithoutDisplayId.length} customers without displayId\n`);

    if (customersWithoutDisplayId.length === 0) {
      console.log('✅ All customers already have displayId. Migration complete!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Generate and assign displayId for each customer
    for (const customer of customersWithoutDisplayId) {
      try {
        // Generate unique display ID
        const displayId = await generateUniqueDisplayId(prisma);

        // Update customer with displayId
        await prisma.customer.update({
          where: { id: customer.id },
          data: { displayId }
        });

        console.log(`✅ Generated displayId ${displayId} for ${customer.email}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error generating displayId for ${customer.email}:`, error);
        errorCount++;
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`\n✅ Migration complete!`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateCustomerDisplayIds();

