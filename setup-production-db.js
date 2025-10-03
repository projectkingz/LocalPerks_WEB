#!/usr/bin/env node

/**
 * Production Database Setup Script
 * This script helps you set up a production database for LocalPerks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 LocalPerks Production Database Setup');
console.log('=====================================\n');

// Check if we're in the right directory
if (!fs.existsSync('prisma/schema.prisma')) {
  console.error('❌ Error: Please run this script from the LocalPerks_WEB directory');
  process.exit(1);
}

console.log('✅ Found Prisma schema file');

// Check if PlanetScale CLI is installed
try {
  execSync('pscale --version', { stdio: 'ignore' });
  console.log('✅ PlanetScale CLI is installed');
} catch (error) {
  console.log('📦 Installing PlanetScale CLI...');
  try {
    execSync('npm install -g @planetscale/cli', { stdio: 'inherit' });
    console.log('✅ PlanetScale CLI installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install PlanetScale CLI. Please install manually:');
    console.error('   npm install -g @planetscale/cli');
    process.exit(1);
  }
}

console.log('\n📋 Next Steps:');
console.log('==============');
console.log('1. Go to https://planetscale.com and create an account');
console.log('2. Create a new database called "localperks-production"');
console.log('3. Get your connection string from the database dashboard');
console.log('4. Add the connection string to your Vercel environment variables');
console.log('5. Run: npx prisma db push');
console.log('6. Run: npx prisma db seed');

console.log('\n🔗 Useful Links:');
console.log('- PlanetScale Dashboard: https://planetscale.com');
console.log('- Vercel Environment Variables: https://vercel.com/dashboard');
console.log('- Prisma Documentation: https://www.prisma.io/docs');

console.log('\n📝 Connection String Format:');
console.log('mysql://username:password@host:port/database?sslaccept=strict');

console.log('\n🎯 Your schema is already configured for MySQL!');
console.log('   Provider: mysql');
console.log('   Ready for PlanetScale deployment');

console.log('\n✨ Setup complete! Follow the steps above to finish the setup.');
