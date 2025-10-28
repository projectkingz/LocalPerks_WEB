const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migratePartnersToBasicTier() {
  try {
    console.log('Starting migration of partners to Basic tier...');

    // First, ensure the Basic tier exists
    const basicTier = await prisma.subscriptionTier.upsert({
      where: { name: 'BASIC' },
      update: {},
      create: {
        name: 'BASIC',
        displayName: 'Basic',
        price: 19,
        isActive: true,
      },
    });

    console.log('Basic tier ensured:', basicTier);

    // Get all tenants (partners)
    const tenants = await prisma.tenant.findMany({
      include: {
        partnerUser: true,
      },
    });

    console.log(`Found ${tenants.length} tenants to migrate`);

    // Update each tenant to Basic tier
    for (const tenant of tenants) {
      const nextBillingDate = new Date(tenant.createdAt);
      nextBillingDate.setDate(nextBillingDate.getDate() + 28); // 28 days from creation

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          subscriptionTier: 'BASIC',
          subscriptionStatus: 'ACTIVE',
          nextBillingDate: nextBillingDate,
        },
      });

      // Create a subscription record for this tenant
      await prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          tierId: basicTier.id,
          status: 'ACTIVE',
          currentPeriodStart: tenant.createdAt,
          currentPeriodEnd: nextBillingDate,
          nextBillingDate: nextBillingDate,
          amount: basicTier.price,
        },
      });

      console.log(`Migrated tenant: ${tenant.name} (${tenant.partnerUser.email})`);
    }

    console.log('Migration completed successfully!');
    console.log(`Migrated ${tenants.length} partners to Basic tier`);

  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migratePartnersToBasicTier()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });




