const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

/**
 * Script to generate persistent QR codes for all existing customers
 * Run this after adding the qrCode field to the Customer model
 */
async function generateQRCodes() {
  try {
    console.log('🔍 Finding customers without QR codes...');
    
    // Find all customers without QR codes
    const customersWithoutQR = await prisma.customer.findMany({
      where: {
        qrCode: null
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    console.log(`📊 Found ${customersWithoutQR.length} customers without QR codes`);

    if (customersWithoutQR.length === 0) {
      console.log('✅ All customers already have QR codes!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const customer of customersWithoutQR) {
      try {
        // Generate a unique QR code identifier
        let qrCode;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        // Ensure QR code is unique
        while (!isUnique && attempts < maxAttempts) {
          const shortUuid = uuidv4().split('-')[0];
          qrCode = `customer-${customer.id}-${shortUuid}`;
          
          // Check if this QR code already exists
          const existing = await prisma.customer.findUnique({
            where: { qrCode }
          });
          
          if (!existing) {
            isUnique = true;
          }
          attempts++;
        }

        if (!isUnique) {
          console.error(`❌ Failed to generate unique QR code for ${customer.email}`);
          errorCount++;
          continue;
        }

        // Update customer with QR code
        await prisma.customer.update({
          where: { id: customer.id },
          data: { qrCode }
        });

        console.log(`✅ Generated QR code for ${customer.name} (${customer.email}): ${qrCode}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error generating QR code for ${customer.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Successfully generated: ${successCount} QR codes`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total processed: ${customersWithoutQR.length}`);

  } catch (error) {
    console.error('❌ Error generating QR codes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateQRCodes()
  .then(() => {
    console.log('\n🎉 QR code generation completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 QR code generation failed:', error);
    process.exit(1);
  });









