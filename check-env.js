// Check environment configuration
const fs = require('fs');
const path = require('path');

console.log('=== CHECKING ENVIRONMENT CONFIGURATION ===\n');

// Check for .env files
const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
const foundFiles = [];

console.log('Looking for environment files:\n');
envFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    foundFiles.push(file);
    console.log(`✅ Found: ${file}`);
    
    // Read and display (hiding sensitive info)
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      console.log('   Contents:');
      lines.slice(0, 5).forEach(line => {
        if (line.includes('DATABASE_URL')) {
          console.log('   - DATABASE_URL=<found>');
        } else if (line.trim() && !line.startsWith('#')) {
          const key = line.split('=')[0];
          console.log(`   - ${key}=...`);
        }
      });
      console.log('');
    } catch (e) {
      console.log('   (Could not read file)');
    }
  } else {
    console.log(`❌ Not found: ${file}`);
  }
});

console.log('\n=== CURRENT ENVIRONMENT VARIABLES ===\n');

// Check current environment variables
const envVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName === 'DATABASE_URL') {
      console.log(`✅ ${varName}=${value.replace(/:[^:@]+@/, ':****@')}`);
    } else if (varName === 'NEXTAUTH_SECRET') {
      console.log(`✅ ${varName}=${value.substring(0, 10)}...`);
    } else {
      console.log(`✅ ${varName}=${value}`);
    }
  } else {
    console.log(`❌ ${varName}=<not set>`);
  }
});

if (foundFiles.length === 0) {
  console.log('\n=== ACTION NEEDED ===');
  console.log('No .env file found. You need to create one.');
  console.log('\nCreate a file named ".env" with this content:');
  console.log('');
  console.log('DATABASE_URL="postgresql://postgres:your_password@localhost:5432/your_database"');
  console.log('NEXTAUTH_SECRET="your-secret-key-here"');
  console.log('NEXTAUTH_URL="http://localhost:3000"');
  console.log('');
} else {
  console.log('\n✅ Environment files found. You can run the fix script.');
}

console.log('\n=== END CHECK ===');
