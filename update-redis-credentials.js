/**
 * Update Redis Credentials Script
 * Usage: node update-redis-credentials.js <url> <token>
 * Example: node update-redis-credentials.js https://new-instance.upstash.io AxxxTokenHere
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('❌ Missing arguments!');
  console.log('\nUsage:');
  console.log('  node update-redis-credentials.js <url> <token>');
  console.log('\nExample:');
  console.log('  node update-redis-credentials.js https://new-instance.upstash.io AxxxTokenHere');
  process.exit(1);
}

const [url, token] = args;

// Validate URL
if (!url.startsWith('https://')) {
  console.error('❌ Invalid URL! Must start with https://');
  process.exit(1);
}

if (!url.includes('.upstash.io')) {
  console.warn('⚠️  Warning: URL should contain .upstash.io');
}

// Validate token
if (token.length < 10) {
  console.warn('⚠️  Warning: Token seems too short');
}

const envFiles = ['.env.local', '.env'];

for (const envFile of envFiles) {
  const envPath = path.join(process.cwd(), envFile);
  
  if (!fs.existsSync(envPath)) {
    continue;
  }

  console.log(`\n📝 Updating ${envFile}...`);
  
  let content = fs.readFileSync(envPath, 'utf8');
  let updated = false;

  // Update or add UPSTASH_REDIS_REST_URL
  if (content.includes('UPSTASH_REDIS_REST_URL=')) {
    content = content.replace(
      /UPSTASH_REDIS_REST_URL=.*/g,
      `UPSTASH_REDIS_REST_URL=${url}`
    );
    updated = true;
  } else {
    content += `\nUPSTASH_REDIS_REST_URL=${url}\n`;
    updated = true;
  }

  // Update or add UPSTASH_REDIS_REST_TOKEN
  if (content.includes('UPSTASH_REDIS_REST_TOKEN=')) {
    content = content.replace(
      /UPSTASH_REDIS_REST_TOKEN=.*/g,
      `UPSTASH_REDIS_REST_TOKEN=${token}`
    );
    updated = true;
  } else {
    content += `UPSTASH_REDIS_REST_TOKEN=${token}\n`;
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(envPath, content, 'utf8');
    console.log(`✅ Updated ${envFile} successfully!`);
  }
}

console.log('\n✅ Redis credentials updated!');
console.log('\nNext steps:');
console.log('1. Run: node test-redis-connection.js');
console.log('2. If test passes, restart your dev server: npm run dev\n');

