// Script to fix partner status stuck at PENDING_EMAIL_VERIFICATION
// Usage: npx tsx scripts/fix-partner-status.ts <email>

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPartnerStatus(email: string) {
  try {
    console.log(`\n🔍 Looking up partner: ${email}\n`);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return;
    }

    console.log(`📋 Current Status:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Approval Status: ${user.approvalStatus}`);
    console.log(`   Suspended: ${user.suspended}`);
    console.log(`   Email Verified: ${user.emailVerified ? user.emailVerified.toISOString() : 'Not verified'}`);
    console.log(`   Tenant: ${user.tenant?.name || 'N/A'}`);

    if (user.role !== 'PARTNER') {
      console.error(`❌ User is not a PARTNER, they are: ${user.role}`);
      return;
    }

    if (user.approvalStatus === 'PENDING_EMAIL_VERIFICATION') {
      console.log(`\n🔧 Fixing status: PENDING_EMAIL_VERIFICATION → PENDING_MOBILE_VERIFICATION\n`);
      
      // Mark email as verified and move to mobile verification
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          approvalStatus: 'PENDING_MOBILE_VERIFICATION',
          // Keep suspended until mobile is verified
        },
      });

      console.log(`✅ Updated:`);
      console.log(`   Approval Status: ${updated.approvalStatus}`);
      console.log(`   Email Verified: ${updated.emailVerified?.toISOString()}`);
      console.log(`\n💡 Next step: Partner needs to verify mobile number`);
      console.log(`   After mobile verification, status will be: PENDING_ADMIN_APPROVAL (awaiting admin approval)`);
      
    } else if (user.approvalStatus === 'PENDING_MOBILE_VERIFICATION') {
      console.log(`\n🔧 Fixing status: PENDING_MOBILE_VERIFICATION → PENDING_ADMIN_APPROVAL\n`);
      
      // Skip mobile verification and move to pending admin approval
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          approvalStatus: 'PENDING_ADMIN_APPROVAL',
          suspended: true, // Keep suspended until admin approval
        },
      });

      console.log(`✅ Updated:`);
      console.log(`   Approval Status: ${updated.approvalStatus}`);
      console.log(`   Suspended: ${updated.suspended}`);
      console.log(`\n💡 Next step: Admin needs to approve the partner`);
      console.log(`   After admin approval, status will be: ACTIVE`);
      
    } else if (user.approvalStatus === 'PENDING_ADMIN_APPROVAL') {
      console.log(`\n✅ Partner is already at PENDING_ADMIN_APPROVAL status (awaiting admin approval)`);
      console.log(`   Admin can approve them from the admin panel`);
      
    } else if (user.approvalStatus === 'ACTIVE') {
      console.log(`\n✅ Partner is already ACTIVE - no action needed`);
      
    } else {
      console.log(`\n⚠️  Partner has unexpected status: ${user.approvalStatus}`);
      console.log(`   Would you like to set them to PENDING_ADMIN_APPROVAL? (uncomment the code below)`);
      
      // Uncomment to force set to PENDING_ADMIN_APPROVAL:
      // const updated = await prisma.user.update({
      //   where: { id: user.id },
      //   data: {
      //     approvalStatus: 'PENDING_ADMIN_APPROVAL',
      //     suspended: true,
      //   },
      // });
      // console.log(`✅ Set to PENDING_ADMIN_APPROVAL`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: npx tsx scripts/fix-partner-status.ts <email>');
  console.log('Example: npx tsx scripts/fix-partner-status.ts sim3@partner.com');
  process.exit(1);
}

fixPartnerStatus(email);

