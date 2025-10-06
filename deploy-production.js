#!/usr/bin/env node

/**
 * 🚀 LocalPerks Production Deployment Script
 * 
 * This script validates your app is ready for production deployment
 * and provides deployment instructions.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 LocalPerks Production Deployment Checker\n');

// Check if environment variables are documented
function checkEnvironmentSetup() {
  console.log('📋 Checking Environment Setup...');
  
  const envExampleExists = fs.existsSync('.env.example');
  const envSetupExists = fs.existsSync('ENVIRONMENT_SETUP.md');
  
  if (!envExampleExists && !envSetupExists) {
    console.log('❌ No environment configuration found');
    return false;
  }
  
  console.log('✅ Environment configuration documented');
  return true;
}

// Check Next.js configuration
function checkNextConfig() {
  console.log('📋 Checking Next.js Configuration...');
  
  try {
    const configPath = path.join(process.cwd(), 'next.config.js');
    const config = fs.readFileSync(configPath, 'utf8');
    
    const hasESLintEnabled = !config.includes('ignoreDuringBuilds: true');
    const hasTypeScriptEnabled = !config.includes('ignoreBuildErrors: true');
    const hasCORSConfig = config.includes('Access-Control-Allow-Origin');
    
    if (!hasESLintEnabled) {
      console.log('⚠️  ESLint is disabled in builds');
    }
    
    if (!hasTypeScriptEnabled) {
      console.log('⚠️  TypeScript error checking is disabled');
    }
    
    if (hasCORSConfig) {
      console.log('✅ CORS configuration found');
    }
    
    return hasESLintEnabled && hasTypeScriptEnabled;
  } catch (error) {
    console.log('❌ Could not read next.config.js');
    return false;
  }
}

// Check package.json
function checkPackageJson() {
  console.log('📋 Checking Package Configuration...');
  
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const hasBuildScript = packageJson.scripts && packageJson.scripts.build;
    const hasStartScript = packageJson.scripts && packageJson.scripts.start;
    
    if (hasBuildScript && hasStartScript) {
      console.log('✅ Build scripts configured');
      return true;
    } else {
      console.log('❌ Missing build or start scripts');
      return false;
    }
  } catch (error) {
    console.log('❌ Could not read package.json');
    return false;
  }
}

// Check database schema
function checkDatabase() {
  console.log('📋 Checking Database Configuration...');
  
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  
  if (fs.existsSync(schemaPath)) {
    console.log('✅ Prisma schema found');
    return true;
  } else {
    console.log('❌ Prisma schema not found');
    return false;
  }
}

// Main deployment check
function runDeploymentCheck() {
  const checks = [
    checkEnvironmentSetup(),
    checkNextConfig(),
    checkPackageJson(),
    checkDatabase(),
  ];
  
  const passedChecks = checks.filter(Boolean).length;
  const totalChecks = checks.length;
  
  console.log('\n📊 Deployment Readiness Summary:');
  console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks`);
  
  if (passedChecks === totalChecks) {
    console.log('\n🎉 Your app is ready for production deployment!');
    console.log('\n📋 Next Steps:');
    console.log('1. Set up environment variables in Vercel');
    console.log('2. Update mobile app API URL');
    console.log('3. Deploy: vercel --prod');
    console.log('4. Test your deployed app');
  } else {
    console.log('\n⚠️  Your app needs some fixes before production deployment.');
    console.log('\n🔧 Action Required:');
    console.log('- Fix the failed checks above');
    console.log('- Review ENVIRONMENT_SETUP.md for environment variables');
    console.log('- Test your app locally before deploying');
  }
  
  console.log('\n📚 Documentation:');
  console.log('- Environment Setup: ENVIRONMENT_SETUP.md');
  console.log('- Deployment Guide: DEPLOYMENT_GUIDE.md');
  console.log('- Mobile App Config: LocalPerks_APP/src/config/api.ts');
}

// Run the deployment check
runDeploymentCheck();
