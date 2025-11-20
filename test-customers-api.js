const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCustomersAPI() {
  try {
    console.log('🔍 Testing customers API logic step by step...\n');
    
    // Step 1: Get all customers
    const customers = await prisma.customer.findMany({
      include: {
        transactions: {
          where: {
            status: { in: ['APPROVED', 'VOID'] }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        redemptions: {
          include: {
            reward: {
              select: {
                id: true,
                name: true,
                points: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Step 1 - Raw customers from DB: ${customers.length}`);
    
    // Step 2: Add tenant information
    const customersWithTenants = await Promise.all(
      customers.map(async (customer) => {
        let tenant = null;
        try {
          tenant = await prisma.tenant.findUnique({
            where: { id: customer.tenantId },
            select: {
              id: true,
              name: true,
            }
          });
        } catch (error) {
          console.warn(`Could not find tenant for customer ${customer.id}:`, error);
        }

        return {
          ...customer,
          tenant
        };
      })
    );

    console.log(`Step 2 - Customers with tenants: ${customersWithTenants.length}`);
    
    // Step 3: Filter out admin/partner accounts
    const filteredCustomers = await Promise.all(
      customersWithTenants.map(async (customer) => {
        // Check if this email exists in the User table with ADMIN or PARTNER role
        const user = await prisma.user.findUnique({
          where: { email: customer.email },
          select: { role: true }
        });

        console.log(`Customer ${customer.email}: User role = ${user?.role || 'No user found'}`);

        // Only include if user doesn't exist or has CUSTOMER role
        if (!user || user.role === 'CUSTOMER') {
          return customer;
        }
        return null;
      })
    );

    // Remove null values (admin/partner accounts)
    const validCustomers = filteredCustomers.filter(customer => customer !== null);

    console.log(`Step 3 - After filtering admin/partner accounts: ${validCustomers.length}`);
    
    // Step 4: Calculate additional fields
    const customersWithCalculations = validCustomers.map(customer => {
      // Calculate total amount spent across all tenants
      const totalAmountSpent = customer.transactions
        .filter(t => t.type === 'EARNED' && t.status === 'APPROVED')
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate total points earned
      const totalPointsEarned = customer.transactions
        .filter(t => t.type === 'EARNED' && t.status === 'APPROVED')
        .reduce((sum, t) => sum + t.points, 0);

      // Calculate discount earned (assuming 1 point = £0.01 face value)
      const pointFaceValue = 0.01; // £0.01 per point
      const discountEarned = totalPointsEarned * pointFaceValue;

      return {
        ...customer,
        totalAmountSpent,
        totalPointsEarned,
        discountEarned
      };
    });

    console.log(`Step 4 - Final customers with calculations: ${customersWithCalculations.length}\n`);
    
    if (customersWithCalculations.length > 0) {
      console.log('👥 Final customer data:');
      customersWithCalculations.forEach((customer, index) => {
        console.log(`${index + 1}. ${customer.name} (${customer.email})`);
        console.log(`   - ID: ${customer.id}`);
        console.log(`   - Points: ${customer.points}`);
        console.log(`   - Total Amount Spent: £${customer.totalAmountSpent.toFixed(2)}`);
        console.log(`   - Total Points Earned: ${customer.totalPointsEarned}`);
        console.log(`   - Discount Earned: £${customer.discountEarned.toFixed(2)}`);
        console.log(`   - Transactions: ${customer.transactions.length}`);
        console.log(`   - Tenant: ${customer.tenant?.name || 'No tenant'}`);
        console.log('');
      });
    } else {
      console.log('❌ No customers in final result');
    }
    
  } catch (error) {
    console.error('❌ Error testing customers API:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testCustomersAPI();
