import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCustomerTenants() {
  try {
    console.log('🔍 Checking customers with null tenantId...\n');

    // Find all customers
    const allCustomers = await prisma.customer.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        tenantId: true
      }
    });

    // Find all valid tenant IDs
    const validTenantIds = await prisma.tenant.findMany({
      select: { id: true }
    });
    const validTenantIdSet = new Set(validTenantIds.map(t => t.id));

    // Find customers with invalid tenant IDs
    const customersWithInvalidTenant = allCustomers.filter(customer => 
      !validTenantIdSet.has(customer.tenantId)
    );

    console.log(`Found ${customersWithInvalidTenant.length} customers with invalid tenantId:`);
    customersWithInvalidTenant.forEach(customer => {
      console.log(`- ${customer.name} (${customer.email}) - Tenant ID: ${customer.tenantId}`);
    });

    if (customersWithInvalidTenant.length > 0) {
      console.log('\n🔧 Fixing customers with null tenantId...');
      
      // Find or create default tenant
      let defaultTenant = await prisma.tenant.findFirst({
        where: { name: 'System Default Tenant' }
      });

      if (!defaultTenant) {
        console.log('Creating System Default Tenant...');
        
        // Find or create system user
        let systemUser = await prisma.user.findUnique({
          where: { email: 'system@default.com' }
        });

        if (!systemUser) {
          systemUser = await prisma.user.create({
            data: {
              email: 'system@default.com',
              name: 'System User',
              role: 'ADMIN',
              suspended: false,
            }
          });
          console.log('Created system user:', systemUser.id);
        }

        defaultTenant = await prisma.tenant.create({
          data: {
            name: 'System Default Tenant',
            partnerUserId: systemUser.id,
          }
        });
        console.log('Created default tenant:', defaultTenant.id);
      } else {
        console.log('Using existing default tenant:', defaultTenant.id);
      }

      // Update customers with invalid tenant IDs
      const updateResult = await prisma.customer.updateMany({
        where: {
          id: {
            in: customersWithInvalidTenant.map(c => c.id)
          }
        },
        data: {
          tenantId: defaultTenant.id
        }
      });

      console.log(`✅ Updated ${updateResult.count} customers with default tenant`);

      // Verify the fix
      const remainingInvalidTenants = await prisma.customer.findMany({
        select: { id: true, tenantId: true }
      });
      const stillInvalid = remainingInvalidTenants.filter(c => 
        !validTenantIdSet.has(c.tenantId)
      );
      console.log(`Remaining customers with invalid tenantId: ${stillInvalid.length}`);
    } else {
      console.log('✅ No customers with null tenantId found');
    }

  } catch (error) {
    console.error('❌ Error fixing customer tenants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCustomerTenants();
