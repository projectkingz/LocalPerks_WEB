/**
 * Test Redis Connection Script
 * Run this to diagnose Redis connection issues
 * Usage: node test-redis-connection.js
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Redis } = require('@upstash/redis');

async function testRedisConnection() {
  console.log('🔍 Testing Redis Connection...\n');

  // Check if environment variables are set
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error('❌ Redis environment variables not found!');
    console.log('\nPlease set in your .env file:');
    console.log('UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io');
    console.log('UPSTASH_REDIS_REST_TOKEN=your-redis-token');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log(`   URL: ${url.substring(0, 30)}...`);
  console.log(`   Token: ${token.substring(0, 20)}...\n`);

  // Validate URL format
  if (!url.startsWith('https://')) {
    console.error('❌ Invalid URL format!');
    console.log('   Redis URL should start with https://');
    console.log(`   Current: ${url}`);
    process.exit(1);
  }

  // Validate token format (Upstash tokens are usually base64-like strings)
  if (token.length < 20) {
    console.warn('⚠️  Token seems too short. Upstash tokens are usually longer.');
  }

  try {
    console.log('🔄 Attempting to connect to Redis...');
    const redis = new Redis({
      url: url,
      token: token,
    });

    // Test connection with ping
    console.log('📡 Sending PING command...');
    const startTime = Date.now();
    const result = await redis.ping();
    const latency = Date.now() - startTime;

    console.log(`✅ Connection successful!`);
    console.log(`   Response: ${result}`);
    console.log(`   Latency: ${latency}ms\n`);

    // Test write/read
    console.log('🔄 Testing write/read operations...');
    const testKey = 'test:connection';
    const testValue = `test-${Date.now()}`;

    await redis.set(testKey, testValue, { ex: 60 });
    console.log(`   ✅ Write successful`);

    const readValue = await redis.get(testKey);
    if (readValue === testValue) {
      console.log(`   ✅ Read successful`);
      console.log(`   ✅ Value matches: ${readValue}`);
    } else {
      console.error(`   ❌ Read failed - value mismatch`);
      console.error(`      Expected: ${testValue}`);
      console.error(`      Got: ${readValue}`);
    }

    // Cleanup
    await redis.del(testKey);
    console.log(`   ✅ Cleanup successful\n`);

    console.log('🎉 All Redis tests passed! Your Redis connection is working correctly.\n');

  } catch (error) {
    console.error('\n❌ Redis connection failed!\n');
    console.error('Error details:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    
    if (error.cause) {
      console.error(`   Cause: ${error.cause.message || error.cause}`);
    }

    console.error('\n🔧 Troubleshooting steps:');
    console.error('1. Verify your Upstash Redis instance is active:');
    console.error('   - Go to https://console.upstash.com/');
    console.error('   - Check if your Redis database is running');
    console.error('   - Make sure it\'s not paused or deleted\n');

    console.error('2. Verify your credentials:');
    console.error('   - Copy the REST URL from Upstash console');
    console.error('   - Copy the REST TOKEN from Upstash console');
    console.error('   - Make sure there are no extra spaces or quotes\n');

    console.error('3. Check network connectivity:');
    console.error('   - Ensure your firewall allows HTTPS connections');
    console.error('   - Try accessing the Redis URL in a browser (should show Upstash page)\n');

    console.error('4. Verify environment file:');
    console.error('   - Make sure .env or .env.local exists');
    console.error('   - Restart your dev server after changing .env\n');

    process.exit(1);
  }
}

testRedisConnection();

