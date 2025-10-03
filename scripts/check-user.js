const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'joe@joescoffee.test' }
    });

    if (user) {
      console.log('User found:');
      console.log('- ID:', user.id);
      console.log('- Email:', user.email);
      console.log('- Name:', user.name);
      console.log('- Role:', user.role);
      console.log('- Tenant ID:', user.tenantId);
    } else {
      console.log('User with email joe@joescoffee.test not found');
      
      // Show some existing partner users
      const partners = await prisma.user.findMany({
        where: { role: 'PARTNER' },
        take: 5,
        select: { email: true, name: true, role: true }
      });
      
      console.log('\nExisting partner users:');
      partners.forEach(partner => {
        console.log(`- ${partner.email} (${partner.name})`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser(); 