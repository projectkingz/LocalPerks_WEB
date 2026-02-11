// Verify API keys in environment variables
require('dotenv').config({ path: '.env' });

console.log('\n🔍 Verifying API Keys...\n');

const dbUrl = process.env.DATABASE_URL;
const accelEndpoint = process.env.PRISMA_ACCELERATE_ENDPOINT;

if (!dbUrl || !accelEndpoint) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

// Remove quotes if present
const cleanDbUrl = dbUrl.replace(/^["']|["']$/g, '');
const cleanAccelEndpoint = accelEndpoint.replace(/^["']|["']$/g, '');

// Extract API keys - JWT tokens can contain dots, dashes, underscores
const dbUrlMatch = cleanDbUrl.match(/api_key=([^&\s"']+)/);
const accelMatch = cleanAccelEndpoint.match(/api_key=([^&\s"']+)/);

if (!dbUrlMatch || !accelMatch) {
  console.error('❌ Could not extract API keys from URLs');
  console.error('DATABASE_URL preview:', cleanDbUrl.substring(0, 80));
  console.error('ACCELERATE_ENDPOINT preview:', cleanAccelEndpoint.substring(0, 80));
  process.exit(1);
}

const dbApiKey = dbUrlMatch[1];
const accelApiKey = accelMatch[1];

console.log('1. API Key Lengths:');
console.log(`   DATABASE_URL API key: ${dbApiKey.length} characters`);
console.log(`   PRISMA_ACCELERATE_ENDPOINT API key: ${accelApiKey.length} characters`);

console.log('\n2. API Key Preview (first 50 chars):');
console.log(`   DATABASE_URL: ${dbApiKey.substring(0, 50)}...`);
console.log(`   ACCELERATE_ENDPOINT: ${accelApiKey.substring(0, 50)}...`);

console.log('\n3. API Key Match:');
if (dbApiKey === accelApiKey) {
  console.log('   ✅ API keys MATCH');
} else {
  console.log('   ❌ API keys DO NOT MATCH!');
  console.log('   ⚠️  They should be identical');
}

console.log('\n4. API Key Format Check:');
// JWT tokens typically start with eyJ and have 3 parts separated by dots
const jwtPattern = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
if (jwtPattern.test(dbApiKey)) {
  console.log('   ✅ DATABASE_URL API key looks like a valid JWT');
  const parts = dbApiKey.split('.');
  console.log(`   ✅ Has ${parts.length} parts (should be 3)`);
} else {
  console.log('   ⚠️  DATABASE_URL API key does not look like a JWT');
}

if (jwtPattern.test(accelApiKey)) {
  console.log('   ✅ PRISMA_ACCELERATE_ENDPOINT API key looks like a valid JWT');
  const parts = accelApiKey.split('.');
  console.log(`   ✅ Has ${parts.length} parts (should be 3)`);
} else {
  console.log('   ⚠️  PRISMA_ACCELERATE_ENDPOINT API key does not look like a JWT');
}

console.log('\n5. Recommendations:');
if (dbApiKey !== accelApiKey) {
  console.log('   ❌ Fix: Make sure both variables use the SAME API key');
}
if (dbApiKey.length < 100) {
  console.log('   ⚠️  API key seems short - might be incomplete');
  console.log('   💡 Get the FULL API key from Vercel Dashboard');
}
if (dbApiKey.length > 500) {
  console.log('   ⚠️  API key seems very long - might include extra characters');
}

console.log('\n💡 If API keys are correct but connection fails:');
console.log('   1. Check if API key is expired in Prisma Dashboard');
console.log('   2. Regenerate API key in Prisma Dashboard');
console.log('   3. Copy the COMPLETE new API key to both variables');
console.log('   4. Make sure no quotes or extra spaces are included\n');

