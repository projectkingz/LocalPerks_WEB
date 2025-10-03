const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testTinaLogin() {
  try {
    console.log('🔍 Testing Tina Allen login...');
    
    // Test 1: Check if Tina Allen exists
    const customer = await prisma.customer.findUnique({
      where: { email: 'tina.allen900@example.com' },
      include: {
        tenant: { select: { name: true } }
      }
    });
    
    console.log('\n📧 Customer Check:');
    if (customer) {
      console.log(`✅ Found: ${customer.name} - ${customer.email} - ${customer.tenant?.name} - ${customer.points} points`);
    } else {
      console.log('❌ Customer not found');
      return;
    }
    
    // Test 2: Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: 'tina.allen900@example.com' },
      include: {
        tenant: { select: { name: true } }
      }
    });
    
    console.log('\n👤 User Check:');
    if (user) {
      console.log(`✅ Found: ${user.name} - ${user.email} - ${user.tenant?.name} - Role: ${user.role}`);
    } else {
      console.log('❌ User not found');
      return;
    }
    
    // Test 3: Test password verification
    const plainPassword = 'password123';
    const isPasswordValid = await bcrypt.compare(plainPassword, user.password);
    
    console.log('\n🔐 Password Check:');
    console.log(`Plain password: ${plainPassword}`);
    console.log(`Password valid: ${isPasswordValid ? '✅ Yes' : '❌ No'}`);
    
    // Test 4: Test JWT creation (simulate login)
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('\n🎫 JWT Token Test:');
    console.log(`Token created: ${token ? '✅ Yes' : '❌ No'}`);
    console.log(`Token length: ${token ? token.length : 0} characters`);
    
    // Test 5: Check database connection info
    console.log('\n🗄️ Database Connection:');
    console.log(`Database URL configured: ${process.env.DATABASE_URL ? '✅ Yes' : '❌ No'}`);
    if (process.env.DATABASE_URL) {
      const dbUrl = process.env.DATABASE_URL;
      const isPlanetScale = dbUrl.includes('planetscale.com');
      console.log(`PlanetScale connection: ${isPlanetScale ? '✅ Yes' : '❌ No'}`);
      console.log(`Database URL starts with: ${dbUrl.substring(0, 20)}...`);
    }
    
    // Test 6: Check recent transactions for Tina
    const transactions = await prisma.transaction.findMany({
      where: {
        customerId: customer.id
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { name: true } }
      }
    });
    
    console.log('\n💰 Recent Transactions:');
    if (transactions.length > 0) {
      transactions.forEach((tx, index) => {
        console.log(`  ${index + 1}. £${tx.amount.toFixed(2)} - ${tx.points} pts - ${tx.tenant?.name} - ${tx.createdAt.toISOString().split('T')[0]}`);
      });
    } else {
      console.log('  No transactions found');
    }
    
    console.log('\n🎉 Tina Allen login test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing Tina Allen login:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTinaLogin();
