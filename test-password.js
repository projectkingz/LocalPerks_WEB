// Test script to verify password hashing and comparison
const { hash, compare } = require('bcryptjs');

async function testPasswordHashing() {
  console.log('=== TESTING PASSWORD HASHING ===');
  
  const plainPassword = 'password123';
  console.log('Plain password:', plainPassword);
  
  try {
    // Hash the password (same as in seed data)
    const hashedPassword = await hash(plainPassword, 12);
    console.log('Hashed password:', hashedPassword);
    
    // Test comparison
    const isValid = await compare(plainPassword, hashedPassword);
    console.log('Password comparison result:', isValid);
    
    // Test with wrong password
    const isInvalid = await compare('wrongpassword', hashedPassword);
    console.log('Wrong password comparison result:', isInvalid);
    
    console.log('✅ Password hashing test completed');
    
  } catch (error) {
    console.log('❌ Password hashing test failed:', error);
  }
  
  console.log('=== END TEST ===');
}

testPasswordHashing();
