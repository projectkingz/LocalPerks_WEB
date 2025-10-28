import fetch from 'node-fetch';

async function testAdminUsersApi() {
  try {
    console.log('🧪 Testing /api/admin/users endpoint...\n');
    
    const response = await fetch('http://localhost:3000/api/admin/users');
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Total users returned:', data.length);
    
    const customers = data.filter(u => u.role === 'CUSTOMER');
    console.log('Customers found:', customers.length);
    
    if (customers.length > 0) {
      console.log('\n👥 Customer details:');
      customers.forEach((c, index) => {
        console.log(`${index + 1}. ${c.name} (${c.email})`);
        console.log(`   - ID: ${c.id}`);
        console.log(`   - Role: ${c.role}`);
        console.log(`   - Points: ${c.points}`);
        console.log(`   - Tenant: ${c.businessName || 'N/A'}`);
        console.log(`   - Created: ${new Date(c.createdAt).toISOString()}`);
        console.log('');
      });
    }
    
    const otherUsers = data.filter(u => u.role !== 'CUSTOMER');
    console.log(`Other users (${otherUsers.length}):`);
    otherUsers.forEach(u => console.log(`- ${u.role}: ${u.name || u.email}`));
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testAdminUsersApi();
