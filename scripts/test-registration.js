const fetch = require('node-fetch');

async function testPartnerRegistration() {
  console.log('🧪 Testing Partner Registration...\n');

  try {
    const testData = {
      businessName: 'Test Coffee Shop',
      name: 'John Test Partner',
      email: 'testpartner' + Date.now() + '@example.com',
      password: 'testpassword123'
    };

    console.log('1. Attempting partner registration...');
    console.log(`   Email: ${testData.email}`);
    console.log(`   Business: ${testData.businessName}`);

    const response = await fetch('http://localhost:3000/api/auth/register/tenant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Registration successful!');
      console.log('   Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Registration failed!');
      console.log('   Status:', response.status);
      console.log('   Error:', result);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPartnerRegistration(); 