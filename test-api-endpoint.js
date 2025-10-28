// Test the actual API endpoint
const fetch = require('node-fetch');

async function testAPIEndpoint() {
  try {
    console.log('🔍 Testing admin customers API endpoint...\n');
    
    // Test the API endpoint directly
    const response = await fetch('http://localhost:3000/api/admin/customers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log(`\n📊 API Response:`);
      console.log(`Number of customers: ${data.length}`);
      
      if (data.length > 0) {
        console.log('\n👥 Customer data from API:');
        data.forEach((customer, index) => {
          console.log(`${index + 1}. ${customer.name} (${customer.email})`);
          console.log(`   - ID: ${customer.id}`);
          console.log(`   - Points: ${customer.points}`);
          console.log(`   - Tenant: ${customer.tenant?.name || 'No tenant'}`);
          console.log(`   - Transactions: ${customer.transactions?.length || 0}`);
          console.log(`   - Redemptions: ${customer.redemptions?.length || 0}`);
          console.log('');
        });
      } else {
        console.log('❌ No customers returned from API');
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ API Error: ${response.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing API endpoint:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testAPIEndpoint();
