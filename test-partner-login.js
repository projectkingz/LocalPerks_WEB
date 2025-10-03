// Test script to verify partner login works after fixing the Tenant field issue
const API_BASE_URL = "http://localhost:3000/api";

async function testPartnerLogin() {
  console.log('=== TESTING PARTNER LOGIN AFTER FIX ===');
  console.log('API Base URL:', API_BASE_URL);
  
  // Test with a known partner email from the seed data
  const partnerEmail = 'sarah.johnson@business.com';
  const password = 'password123';
  
  console.log('Testing login for:', partnerEmail);
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/mobile-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: partnerEmail,
        password: password
      })
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('User role:', data.user?.role);
      console.log('User tenantId:', data.user?.tenantId);
      console.log('Tenant data:', data.user?.tenant);
    } else {
      console.log('❌ Login failed:', data.error);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
  
  console.log('=== END TEST ===');
}

testPartnerLogin();
