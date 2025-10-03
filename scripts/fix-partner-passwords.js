// Script to check and fix partner user passwords
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const { hash, compare } = require('bcryptjs');

const prisma = new PrismaClient();

async function fixPartnerPasswords() {
  console.log('=== FIXING PARTNER PASSWORDS ===\n');
  
  try {
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
      take: 10, // Show first 10 partners
    });
    
    console.log(`Found ${partners.length} partner users:\n`);
    
    for (const partner of partners) {
      console.log(`Partner: ${partner.name} (${partner.email})`);
      console.log(`  - ID: ${partner.id}`);
      console.log(`  - Tenant ID: ${partner.tenantId}`);
      console.log(`  - Status: ${partner.approvalStatus || 'N/A'}`);
      console.log(`  - Suspended: ${partner.suspended}`);
      console.log(`  - Has Password: ${!!partner.password}`);
      
      if (partner.password) {
        // Test if password is 'password123'
        const testPassword = 'password123';
        const isValid = await compare(testPassword, partner.password);
        console.log(`  - Password '${testPassword}' works: ${isValid ? '✅ YES' : '❌ NO'}`);
        
        if (!isValid) {
          console.log(`  - Password hash: ${partner.password.substring(0, 30)}...`);
        }
      }
      console.log('');
    }
    
    // Ask if we should fix passwords
    console.log('\n=== FIXING PASSWORDS ===');
    console.log('Updating all partner passwords to: password123\n');
    
    const newPassword = 'password123';
    const hashedPassword = await hash(newPassword, 12);
    
    const updateResult = await prisma.user.updateMany({
      where: { role: 'PARTNER' },
      data: { password: hashedPassword },
    });
    
    console.log(`✅ Updated ${updateResult.count} partner passwords`);
    
    // Also ensure all partners have ACTIVE approval status
    const statusUpdateResult = await prisma.user.updateMany({
      where: { 
        role: 'PARTNER',
        approvalStatus: { not: 'ACTIVE' }
      },
      data: { approvalStatus: 'ACTIVE' },
    });
    
    console.log(`✅ Updated ${statusUpdateResult.count} partner approval statuses to ACTIVE`);
    
    // Verify the fix
    console.log('\n=== VERIFYING FIX ===\n');
    
    const testPartner = await prisma.user.findFirst({
      where: { role: 'PARTNER' },
      select: { email: true, password: true, name: true },
    });
    
    if (testPartner && testPartner.password) {
      const isValid = await compare(newPassword, testPartner.password);
      console.log(`Test partner: ${testPartner.name} (${testPartner.email})`);
      console.log(`Password verification: ${isValid ? '✅ SUCCESS' : '❌ FAILED'}`);
    }
    
    console.log('\n=== PARTNER LOGIN CREDENTIALS ===');
    console.log('Email: sarah.johnson@business.com');
    console.log('Password: password123');
    console.log('\nAll partner users now have this password.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n=== FIX COMPLETE ===');
}

fixPartnerPasswords();
