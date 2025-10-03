const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Test the connection
    await prisma.$connect();
    console.log('Successfully connected to the database');

    // Print the current database URL (with password redacted)
    const url = process.env.DATABASE_URL || 'Not set';
    console.log('Database URL:', url.replace(/:.*@/, ':****@'));
  } catch (error) {
    console.error('Error connecting to the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 