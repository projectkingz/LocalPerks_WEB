/**
 * Test Vonage Verify Connection Script
 * Run this to verify Vonage API credentials and Verify API connectivity
 * Usage: node test-vonage-verify.js [phone_number]
 * 
 * Without phone_number: Tests credential validity only (no SMS sent)
 * With phone_number: Tests full Verify flow - sends SMS (e.g. +447700900000 for UK)
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function testVonageConnection() {
  console.log('\n🔍 Testing Vonage Verify Connection...\n');

  // Get credentials (trim any whitespace from env)
  const apiKey = (process.env.VONAGE_API_KEY || '').trim();
  const apiSecret = (process.env.VONAGE_API_SECRET || '').trim();

  // Validate environment variables
  if (!apiKey || !apiSecret) {
    console.error('❌ Vonage environment variables not found!');
    console.log('\nPlease set in your .env or .env.local file:');
    console.log('VONAGE_API_KEY=your_api_key');
    console.log('VONAGE_API_SECRET=your_api_secret');
    console.log('\nGet credentials from: https://dashboard.nexmo.com/');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log(`   API Key: ${apiKey.substring(0, 4)}***`);
  console.log(`   API Secret: ***${apiSecret.slice(-4)}\n`);

  // Step 1: Test credential validity via Vonage Account API (no SMS, no cost)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Step 1: Validating API credentials...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const balanceUrl = `https://rest.nexmo.com/account/get-balance?api_key=${encodeURIComponent(apiKey)}&api_secret=${encodeURIComponent(apiSecret)}`;
    const balanceRes = await fetch(balanceUrl);
    const balanceData = await balanceRes.json();

    if (balanceData.value !== undefined) {
      console.log('✅ Vonage API credentials are valid!');
      console.log(`   Account balance: €${balanceData.value}`);
      console.log(`   Auto-reload: ${balanceData.auto_reload ? 'Enabled' : 'Disabled'}\n`);
    } else if (balanceData['error-code']) {
      throw new Error(`${balanceData['error-code-label'] || balanceData['error-code']}`);
    } else {
      throw new Error(JSON.stringify(balanceData));
    }
  } catch (error) {
    console.error('❌ Vonage API credential check failed!\n');
    console.error('Error:', error.message || error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify VONAGE_API_KEY and VONAGE_API_SECRET in .env.local');
    console.log('2. Remove any spaces around = (use VONAGE_API_KEY=value not VONAGE_API_KEY = value)');
    console.log('3. Get credentials from https://dashboard.nexmo.com/');
    console.log('4. Ensure your Vonage account is active\n');
    process.exit(1);
  }

  // Step 2: Test Verify API (optional - only if phone number provided)
  const phoneNumber = process.argv[2];
  if (phoneNumber) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 2: Testing Verify API (sending verification request)...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      const verifyUrl = 'https://api.nexmo.com/verify/json';
      const verifyBody = new URLSearchParams({
        api_key: apiKey,
        api_secret: apiSecret,
        number: phoneNumber.replace(/\s/g, ''),
        brand: 'LocalPerks',
      });

      const verifyRes = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: verifyBody.toString(),
      });

      const verifyData = await verifyRes.json();

      if (verifyData.status === '0' || verifyData.request_id) {
        console.log('✅ Verify API request successful!');
        console.log(`   Request ID: ${verifyData.request_id}`);
        console.log(`   Status: ${verifyData.status}`);
        console.log(`   Cost: ${verifyData.estimated_price_messages || 'N/A'}`);
        console.log('\n📱 An SMS with a verification code was sent to:', phoneNumber);
        console.log('   Use request_id with Verify Check API to validate the code.\n');
      } else {
        throw new Error(verifyData['error-text'] || JSON.stringify(verifyData));
      }
    } catch (error) {
      console.error('❌ Verify API request failed!\n');
      console.error('Error:', error.message || error);
      console.log('\n🔧 Note: Use E.164 format (e.g. +447700900000 for UK)');
      process.exit(1);
    }
  } else {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 2: Skipped (no phone number provided)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 To test the full Verify flow (sends real SMS), run:');
    console.log('   node test-vonage-verify.js +44YOUR_PHONE_NUMBER\n');
  }

  console.log('🎉 Vonage Verify connection test passed!\n');
}

testVonageConnection();
