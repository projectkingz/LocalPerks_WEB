const fs = require('fs');
const path = require('path');

// Files that need fixing based on grep results
const filesToFix = [
  'src/app/api/points/history/mobile/route.ts',
  'src/app/api/transactions/route.ts',
  'src/app/api/dashboard-stats/route.ts',
  'src/app/api/rewards/mobile/route.ts',
  'src/app/api/admin/users/route.ts',
  'src/app/api/rewards/vouchers/route.ts',
  'src/app/api/auth/signup/route.ts',
  'src/app/api/auth/register/customer/route.ts',
  'src/app/api/auth/register/partner/route.ts',
  'src/app/api/auth/register/admin/route.ts',
  'src/app/api/discounts/redeem/route.ts',
  'src/app/api/rewards/[id]/redeem/route.ts',
  'src/app/api/rewards/vouchers/[id]/cancel/route.ts',
  'src/app/api/auth/register/tenant/route.ts'
];

// Patterns to fix
const fixes = [
  // map callbacks without type
  { pattern: /\.map\(([a-z]+) =>/g, replacement: '.map(($1: any) =>' },
  // filter callbacks without type
  { pattern: /\.filter\(([a-z]+) =>/g, replacement: '.filter(($1: any) =>' },
  // reduce callbacks without type
  { pattern: /\.reduce\(\(([a-z]+), ([a-z]+)\) =>/g, replacement: '.reduce(($1: any, $2: any) =>' },
  // async transaction callbacks
  { pattern: /\$transaction\(async \(([a-z]+)\) =>/g, replacement: '$transaction(async ($1: any) =>' },
];

let totalFixed = 0;

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let fileFixed = false;
  
  fixes.forEach(({ pattern, replacement }) => {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      content = content.replace(pattern, replacement);
      fileFixed = true;
      console.log(`✅ Fixed ${matches.length} pattern(s) in ${filePath}`);
    }
  });
  
  if (fileFixed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    totalFixed++;
  }
});

console.log(`\n✅ Fixed ${totalFixed} files`);
console.log('\nRun: git add . && git commit -m "Fix: Add type annotations to all callbacks" && git push');

