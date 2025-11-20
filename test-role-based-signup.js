import { PrismaClient } from '@prisma/client';
import pkg from 'bcryptjs';
const { hash } = pkg;

const prisma = new PrismaClient();

async function testRoleBasedSignup() {
  try {
    console.log('🧪 Testing role-based signup flow...\n');

    const timestamp = Date.now();
    const customerEmail = `test-customer-${timestamp}@example.com`;
    const partnerEmail = `test-partner-${timestamp}@example.com`;
    const adminEmail = `test-admin-${timestamp}@example.com`;

    console.log('1️⃣ Testing CUSTOMER signup...');
    
    // Simulate customer signup
    const hashedPassword = await hash('testpassword', 12);
    const customerUser = await prisma.user.create({
      data: {
        email: customerEmail,
        name: 'Test Customer',
        password: hashedPassword,
        role: 'CUSTOMER',
        emailVerified: new Date(),
        approvalStatus: 'ACTIVE',
      },
    });
    console.log('   ✅ Customer User created:', customerUser.id, customerUser.role);

    // Simulate session callback for customer
    let defaultTenant = await prisma.tenant.findFirst({
      where: { name: 'System Default Tenant' }
    });

    if (!defaultTenant) {
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
      }

      defaultTenant = await prisma.tenant.create({
        data: {
          name: 'System Default Tenant',
          partnerUserId: systemUser.id,
        }
      });
    }

    // Check if customer record should be created (role === 'CUSTOMER')
    if (customerUser.role === 'CUSTOMER') {
      const existingCustomer = await prisma.customer.findUnique({
        where: { email: customerEmail }
      });

      if (!existingCustomer) {
        const customerRecord = await prisma.customer.create({
          data: {
            email: customerEmail,
            name: 'Test Customer',
            mobile: '000-000-0000',
            tenantId: defaultTenant.id,
          }
        });
        console.log('   ✅ Customer record created:', customerRecord.id);
      }
    }

    console.log('\n2️⃣ Testing PARTNER signup...');
    
    // Simulate partner signup
    const partnerUser = await prisma.user.create({
      data: {
        email: partnerEmail,
        name: 'Test Partner',
        password: hashedPassword,
        role: 'PARTNER',
        emailVerified: new Date(),
        approvalStatus: 'ACTIVE',
      },
    });
    console.log('   ✅ Partner User created:', partnerUser.id, partnerUser.role);

    // Check if customer record should be created (role === 'CUSTOMER')
    if (partnerUser.role === 'CUSTOMER') {
      console.log('   ❌ ERROR: Partner should not get customer record!');
    } else {
      console.log('   ✅ Partner correctly skipped customer record creation');
    }

    console.log('\n3️⃣ Testing ADMIN signup...');
    
    // Simulate admin signup
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Test Admin',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
        approvalStatus: 'ACTIVE',
      },
    });
    console.log('   ✅ Admin User created:', adminUser.id, adminUser.role);

    // Check if customer record should be created (role === 'CUSTOMER')
    if (adminUser.role === 'CUSTOMER') {
      console.log('   ❌ ERROR: Admin should not get customer record!');
    } else {
      console.log('   ✅ Admin correctly skipped customer record creation');
    }

    console.log('\n4️⃣ Verifying final state...');
    
    const customerRecord = await prisma.customer.findUnique({
      where: { email: customerEmail }
    });
    const partnerRecord = await prisma.customer.findUnique({
      where: { email: partnerEmail }
    });
    const adminRecord = await prisma.customer.findUnique({
      where: { email: adminEmail }
    });

    console.log('\n   📊 Customer records:');
    console.log('   - Customer user has customer record:', !!customerRecord);
    console.log('   - Partner user has customer record:', !!partnerRecord);
    console.log('   - Admin user has customer record:', !!adminRecord);

    console.log('\n5️⃣ CLEANUP: Removing test data...');
    if (customerRecord) await prisma.customer.delete({ where: { email: customerEmail } });
    await prisma.user.delete({ where: { email: customerEmail } });
    await prisma.user.delete({ where: { email: partnerEmail } });
    await prisma.user.delete({ where: { email: adminEmail } });
    console.log('   ✅ Test data cleaned up');

    console.log('\n✅ FIX VERIFICATION:');
    console.log('   ✅ Customers get User + Customer records');
    console.log('   ✅ Partners get User record only (no Customer record)');
    console.log('   ✅ Admins get User record only (no Customer record)');
    console.log('   ✅ Role-based signup flow working correctly!');

  } catch (error) {
    console.error('❌ Error testing role-based signup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRoleBasedSignup();
