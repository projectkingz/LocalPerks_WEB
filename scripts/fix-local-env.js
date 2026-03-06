// Fix local .env file - ensure correct formats for Prisma Accelerate
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

console.log('\n🔧 Fixing local .env file...\n');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');
let changed = false;

// Fix both variables
const lines = envContent.split('\n');
const fixedLines = lines.map((line, index) => {
  // Fix DATABASE_URL: change prisma+mysql:// to prisma://
  if (line.match(/^DATABASE_URL\s*=\s*["']?prisma\+mysql:\/\//i)) {
    const fixedLine = line.replace(/prisma\+mysql:\/\//i, 'prisma://');
    console.log(`✅ Fixed DATABASE_URL (line ${index + 1}):`);
    console.log(`   Before: ${line.substring(0, 60)}...`);
    console.log(`   After:  ${fixedLine.substring(0, 60)}...`);
    changed = true;
    return fixedLine;
  }
  
  // Fix PRISMA_ACCELERATE_ENDPOINT: change prisma:// to prisma+mysql://
  if (line.match(/^PRISMA_ACCELERATE_ENDPOINT\s*=\s*["']?prisma:\/\/(?!.*\+mysql)/i)) {
    const fixedLine = line.replace(/prisma:\/\//i, 'prisma+mysql://');
    console.log(`✅ Fixed PRISMA_ACCELERATE_ENDPOINT (line ${index + 1}):`);
    console.log(`   Before: ${line.substring(0, 60)}...`);
    console.log(`   After:  ${fixedLine.substring(0, 60)}...`);
    changed = true;
    return fixedLine;
  }
  
  return line;
});

if (!changed) {
  console.log('✅ Environment variables are already in correct format:');
  console.log('   DATABASE_URL: prisma:// ✅');
  console.log('   PRISMA_ACCELERATE_ENDPOINT: prisma+mysql:// ✅');
  console.log('   No changes needed.\n');
  process.exit(0);
}

// Write back to file
fs.writeFileSync(envPath, fixedLines.join('\n'), 'utf8');

console.log('\n✅ .env file updated successfully!');
console.log('\n📋 Summary:');
if (changed) {
  console.log('   Fixed environment variable formats');
}
console.log('\n💡 Next steps:');
console.log('   1. Regenerate Prisma Client: npx prisma generate --accelerate');
console.log('   2. Test connection: node test-db-connection-local.js');
console.log('   3. Restart your development server');
console.log('   4. Verify connection works\n');

