// Verify environment values match expected format
require('dotenv').config({ path: '.env' });

console.log('\n🔍 Verifying Environment Variables...\n');

const dbUrl = process.env.DATABASE_URL;
const accelEndpoint = process.env.PRISMA_ACCELERATE_ENDPOINT;

console.log('DATABASE_URL:');
if (dbUrl) {
  console.log(`  Length: ${dbUrl.length} characters`);
  console.log(`  Starts with: ${dbUrl.substring(0, 30)}...`);
  console.log(`  Format: ${dbUrl.startsWith('prisma://') ? '✅ Correct (prisma://)' : '❌ Wrong'}`);
  if (dbUrl.includes('api_key=')) {
    const keyMatch = dbUrl.match(/api_key=([^&"]+)/);
    if (keyMatch) {
      console.log(`  API Key length: ${keyMatch[1].length} characters`);
      console.log(`  API Key starts with: ${keyMatch[1].substring(0, 20)}...`);
    }
  }
} else {
  console.log('  ❌ Not set!');
}

console.log('\nPRISMA_ACCELERATE_ENDPOINT:');
if (accelEndpoint) {
  console.log(`  Length: ${accelEndpoint.length} characters`);
  console.log(`  Starts with: ${accelEndpoint.substring(0, 40)}...`);
  console.log(`  Format: ${accelEndpoint.startsWith('prisma+mysql://') ? '✅ Correct (prisma+mysql://)' : '❌ Wrong'}`);
  if (accelEndpoint.includes('api_key=')) {
    const keyMatch = accelEndpoint.match(/api_key=([^&"]+)/);
    if (keyMatch) {
      console.log(`  API Key length: ${keyMatch[1].length} characters`);
      console.log(`  API Key starts with: ${keyMatch[1].substring(0, 20)}...`);
    }
  }
} else {
  console.log('  ❌ Not set!');
}

// Check if API keys match
if (dbUrl && accelEndpoint) {
  const dbKey = dbUrl.match(/api_key=([^&"]+)/)?.[1];
  const accelKey = accelEndpoint.match(/api_key=([^&"]+)/)?.[1];
  
  console.log('\nAPI Key Comparison:');
  if (dbKey && accelKey) {
    if (dbKey === accelKey) {
      console.log('  ✅ API keys match');
    } else {
      console.log('  ⚠️  API keys are DIFFERENT');
      console.log('  ⚠️  They should be the same!');
    }
  }
}

console.log('\n📋 Next Steps:');
console.log('1. Compare these values with Vercel Dashboard');
console.log('2. If different, copy COMPLETE values from Vercel');
console.log('3. Update .env file');
console.log('4. Run: node test-db-connection-local.js\n');

