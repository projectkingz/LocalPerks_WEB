// Simple script to fix partner passwords
// This script will prompt for the database URL if not found in environment

const { hash, compare } = require('bcryptjs');

// Try to load .env file if it exists
try {
  require('dotenv').config();
} catch (e) {
  console.log('Note: dotenv not available, will use process.env directly');
}

// Get DATABASE_URL from environment or use default for local PostgreSQL
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/localperks';

console.log('=== PARTNER PASSWORD FIX ===\n');
console.log('Database URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Hide password in output
console.log('');

// Dynamic import of Prisma Client
async function run() {
  // Set the DATABASE_URL for this process
  process.env.DATABASE_URL = DATABASE_URL;
  
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    console.log('Connecting to database...\n');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to database\n');
    
    // Get all partner users
    const partners = await prisma.user.findMany({
      where: { role: 'PARTNER' },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        tenantId: true,
        approvalStatus: true,
        suspended: true,
      },
      take: 10,
    });
    
    console.log(`Found ${partners.length} partner users:\n`);
    
    // Show first few partners
    for (let i = 0; i < Math.min(3, partners.length); i++) {
      const partner = partners[i];
      console.log(`${i + 1}. ${partner.name} (${partner.email})`);
      console.log(`   Status: ${partner.approvalStatus || 'N/A'}, Suspended: ${partner.suspended}`);
      
      if (partner.password) {
        const isValid = await compare('password123', partner.password);
        console.log(`   Password 'password123' works: ${isValid ? '✅ YES' : '❌ NO'}`);
      }
      console.log('');
    }
    
    // Update all partner passwords
    console.log('Updating all partner passwords to: password123\n');
    const newPassword = 'password123';
    const hashedPassword = await hash(newPassword, 12);
    
    const updateResult = await prisma.user.updateMany({
      where: { role: 'PARTNER' },
      data: { 
        password: hashedPassword,
      },
    });
    
    console.log(`✅ Updated ${updateResult.count} partner passwords\n`);
    
    // Update approval statuses
    const statusResult = await prisma.user.updateMany({
      where: { 
        role: 'PARTNER',
        OR: [
          { approvalStatus: null },
          { approvalStatus: { not: 'ACTIVE' } }
        ]
      },
      data: { 
        approvalStatus: 'ACTIVE',
        suspended: false,
      },
    });
    
    console.log(`✅ Updated ${statusResult.count} partner approval statuses\n`);
    
    // Verify the fix
    const testPartner = await prisma.user.findFirst({
      where: { role: 'PARTNER' },
      select: { email: true, password: true, name: true },
    });
    
    if (testPartner && testPartner.password) {
      const isValid = await compare(newPassword, testPartner.password);
      console.log('=== VERIFICATION ===');
      console.log(`Test: ${testPartner.name} (${testPartner.email})`);
      console.log(`Result: ${isValid ? '✅ SUCCESS' : '❌ FAILED'}\n`);
    }
    
    console.log('=== LOGIN CREDENTIALS ===');
    console.log('Email: sarah.johnson@business.com');
    console.log('Password: password123');
    console.log('\n✅ All partner users can now login with password: password123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('DATABASE_URL')) {
      console.log('\n💡 Solution: Make sure your .env file exists with DATABASE_URL');
      console.log('Example: DATABASE_URL="postgresql://postgres:password@localhost:5432/localperks"');
    }
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n=== COMPLETE ===');
}

run();
