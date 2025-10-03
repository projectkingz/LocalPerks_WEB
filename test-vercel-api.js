const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testVercelAPI() {
  try {
    console.log('🔍 Testing Vercel API endpoints...');
    
    const baseUrl = 'https://localperks-1yaix5qyl-projectkingzs-projects.vercel.app/api';
    
    // Test 1: Health check
    console.log('\n🏥 Testing health endpoint...');
    try {
      const healthResponse = await fetch(`${baseUrl}/health`);
      console.log(`Health status: ${healthResponse.status}`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('Health response:', healthData);
      } else {
        console.log('Health check failed');
      }
    } catch (error) {
      console.log('Health check error:', error.message);
    }
    
    // Test 2: Test connection endpoint
    console.log('\n🔗 Testing connection endpoint...');
    try {
      const testResponse = await fetch(`${baseUrl}/test-connection`);
      console.log(`Test connection status: ${testResponse.status}`);
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('Test connection response:', testData);
      } else {
        console.log('Test connection failed');
      }
    } catch (error) {
      console.log('Test connection error:', error.message);
    }
    
    // Test 3: Try to login with Tina Allen
    console.log('\n🔐 Testing Tina Allen login...');
    try {
      const loginResponse = await fetch(`${baseUrl}/auth/mobile-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'tina.allen900@example.com',
          password: 'password123'
        })
      });
      
      console.log(`Login status: ${loginResponse.status}`);
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✅ Login successful!');
        console.log('User:', loginData.user?.name);
        console.log('Role:', loginData.user?.role);
        console.log('Token length:', loginData.token ? loginData.token.length : 0);
      } else {
        const errorData = await loginResponse.json().catch(() => ({}));
        console.log('❌ Login failed:', errorData.message || errorData.error || 'Unknown error');
        console.log('Response status:', loginResponse.status);
      }
    } catch (error) {
      console.log('Login test error:', error.message);
    }
    
    // Test 4: Check if we can reach the main app
    console.log('\n🌐 Testing main app...');
    try {
      const mainResponse = await fetch('https://localperks-1yaix5qyl-projectkingzs-projects.vercel.app/');
      console.log(`Main app status: ${mainResponse.status}`);
      if (mainResponse.ok) {
        console.log('✅ Main app is accessible');
      } else {
        console.log('❌ Main app not accessible');
      }
    } catch (error) {
      console.log('Main app error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing Vercel API:', error);
  }
}

testVercelAPI();
