const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function createJoeCoffee() {
  try {
    const plainPassword = 'password123';
    const hashedPassword = await hash(plainPassword, 12);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'joe@joescoffee.test' }
    });

    if (existingUser) {
      console.log('User joe@joescoffee.test already exists');
      console.log('- ID:', existingUser.id);
      console.log('- Role:', existingUser.role);
      console.log('- Name:', existingUser.name);
      return;
    }

    // Create the partner user
    const partnerUser = await prisma.user.create({
      data: {
        name: 'Joe Smith',
        email: 'joe@joescoffee.test',
        password: hashedPassword,
        role: 'PARTNER',
        emailVerified: new Date(),
      },
    });

    // Create the tenant (Joe's Coffee)
    const tenant = await prisma.tenant.create({
      data: {
        name: "Joe's Coffee",
        partnerUserId: partnerUser.id,
      },
    });

    // Update partner user to have tenantId
    const updatedUser = await prisma.user.update({
      where: { id: partnerUser.id },
      data: { tenantId: tenant.id },
    });

    // Create tenant points configuration
    await prisma.tenantPointsConfig.create({
      data: {
        tenantId: tenant.id,
        config: JSON.stringify({
          pointsPerPound: 10,
          minimumPurchase: 5,
          bonusMultiplier: 2,
          expiryDays: 365
        }),
      },
    });

    console.log('Joe\'s Coffee partner account created successfully!');
    console.log('- User ID:', updatedUser.id);
    console.log('- Tenant ID:', tenant.id);
    console.log('- Email: joe@joescoffee.test');
    console.log('- Password: password123');
    console.log('- Role: PARTNER');
    console.log('- Business Name: Joe\'s Coffee');

  } catch (error) {
    console.error('Error creating Joe\'s Coffee account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createJoeCoffee(); 