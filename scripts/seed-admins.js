const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function seedAdmins() {
  try {
    const plainPassword = 'password123';
    const hashedPassword = await hash(plainPassword, 12);

    // SUPER_ADMIN
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@example.com' },
      update: {},
      create: {
        name: 'Super Admin',
        email: 'superadmin@example.com',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        emailVerified: new Date(),
        suspended: false,
      },
    });
    console.log('Seeded SUPER_ADMIN:', superAdmin.email);

    // ADMIN
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
        suspended: false,
      },
    });
    console.log('Seeded ADMIN:', admin.email);

    console.log('\nLogin credentials:');
    console.log('SUPER_ADMIN: superadmin@example.com / password123');
    console.log('ADMIN: admin@example.com / password123');
  } catch (error) {
    console.error('Error seeding admins:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmins(); 