/**
 * Test Vonage WhatsApp 2FA Script
 *
 * Usage:
 *   node test-vonage-whatsapp.js <phone_number>
 *
 * Example (UK):
 *   node test-vonage-whatsapp.js +447700900000
 *
 * Notes:
 * - Tries to send a 4-digit verification code via WhatsApp using the
 *   Vonage Messages API.
 * - Uses JWT auth if VONAGE_APPLICATION_ID and VONAGE_PRIVATE_KEY are set.
 * - Falls back to Basic auth (API key/secret) if JWT is not configured.
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { tokenGenerate } = require('@vonage/jwt');

async function main() {
  console.log('\n🔍 Testing Vonage WhatsApp 2FA...\n');

  const phone = process.argv[2];
  if (!phone) {
    console.error('❌ Missing phone number.\n');
    console.log('Usage:');
    console.log('  node test-vonage-whatsapp.js <phone_number>');
    console.log('\nExample:');
    console.log('  node test-vonage-whatsapp.js +447700900000\n');
    process.exit(1);
  }

  const apiKey = (process.env.VONAGE_API_KEY || '').trim();
  const apiSecret = (process.env.VONAGE_API_SECRET || '').trim();
  const applicationId = (process.env.VONAGE_APPLICATION_ID || '').trim();
  const privateKey = (process.env.VONAGE_PRIVATE_KEY || '').trim().replace(/\\n/g, '\n');
  const whatsappNumber = (process.env.VONAGE_WHATSAPP_NUMBER || '').trim();
  const sandbox = process.env.VONAGE_MESSAGES_SANDBOX === 'true';

  const messagesApiUrl = sandbox
    ? 'https://messages-sandbox.nexmo.com/v1/messages'
    : 'https://api.nexmo.com/v1/messages';

  // Basic validation
  if (!apiKey || !apiSecret) {
    console.error('❌ VONAGE_API_KEY or VONAGE_API_SECRET not set.');
    console.log('   Please configure these in your .env.local file.\n');
    process.exit(1);
  }

  if (!whatsappNumber) {
    console.error('❌ VONAGE_WHATSAPP_NUMBER not set.');
    console.log('   Set this to your WhatsApp-enabled Vonage number (e.g. sandbox number).\n');
    process.exit(1);
  }

  console.log('✅ Environment variables:');
  console.log(`   VONAGE_API_KEY: ${apiKey.substring(0, 4)}***`);
  console.log(`   VONAGE_API_SECRET: ***${apiSecret.slice(-4)}`);
  console.log(`   VONAGE_APPLICATION_ID: ${applicationId ? applicationId : '(not set)'}`);
  console.log(`   VONAGE_WHATSAPP_NUMBER: ${whatsappNumber}`);
  console.log(`   VONAGE_MESSAGES_SANDBOX: ${sandbox}\n`);

  // Build auth header (JWT preferred)
  let authHeader = null;
  if (applicationId && privateKey) {
    try {
      const jwt = tokenGenerate(applicationId, privateKey);
      authHeader = `Bearer ${jwt}`;
      console.log('🔐 Using JWT authentication for Messages API.\n');
    } catch (err) {
      console.warn('⚠️  Failed to generate JWT, falling back to Basic auth:', err.message || err);
    }
  }

  if (!authHeader) {
    const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    authHeader = `Basic ${basic}`;
    console.log('🔐 Using Basic authentication for Messages API.\n');
  }

  // Generate a 4-digit test code
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  console.log(`🔑 Test verification code: ${code}\n`);

  // Normalise phone: Vonage expects digits only in "to"
  const to = phone.replace(/\\D/g, '');
  const from = whatsappNumber.replace(/\\D/g, '');

  const body = {
    from,
    to,
    channel: 'whatsapp',
    message_type: 'text',
    text: {
      body: `Your LocalPerks verification code is: ${code}. Valid for 10 minutes.`,
    },
  };

  console.log('📤 Sending WhatsApp message via Vonage Messages API...');
  console.log(`   Endpoint: ${messagesApiUrl}`);
  console.log(`   To: ${to}`);
  console.log(`   From: ${from}\n`);

  try {
    const response = await fetch(messagesApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    console.log('🔎 Raw API response:');
    console.log(JSON.stringify(data, null, 2), '\n');

    if (response.ok && data.message_uuid) {
      console.log('✅ WhatsApp 2FA test message sent successfully!');
      console.log(`   message_uuid: ${data.message_uuid}\n`);
      console.log('📱 Check your WhatsApp for the verification code above.');
      process.exit(0);
    }

    console.error('❌ WhatsApp 2FA test failed.');
    const errorMsg =
      data.detail ||
      (Array.isArray(data.invalid_parameters) && data.invalid_parameters[0]?.message) ||
      data['error-text'] ||
      data['error-code-label'] ||
      JSON.stringify(data);
    console.error('   Error:', errorMsg, '\n');

    console.log('Troubleshooting:');
    console.log('  1. Ensure your WhatsApp number is linked to the Vonage application.');
    console.log('  2. If using sandbox, set VONAGE_MESSAGES_SANDBOX=true and join the sandbox.');
    console.log('  3. Verify VONAGE_APPLICATION_ID and VONAGE_PRIVATE_KEY are correct.');
    console.log('  4. Check Vonage dashboard > Logs for more details.\n');
    process.exit(1);
  } catch (err) {
    console.error('❌ Request error:', err.message || err);
    process.exit(1);
  }
}

main();

