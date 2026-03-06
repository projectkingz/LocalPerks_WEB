#!/usr/bin/env node

/**
 * 🧹 Console Log Cleanup Script
 * 
 * This script removes or replaces console.log statements in production code
 * while preserving error logging and debugging in development.
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Starting Console Log Cleanup...\n');

// Files to exclude from cleanup
const excludeFiles = [
  'node_modules',
  '.next',
  '.git',
  'deploy-production.js',
  'cleanup-console-logs.js',
  'test-',
  '.test.',
  '.spec.'
];

// Directories to process
const srcDir = path.join(process.cwd(), 'src');
const apiDir = path.join(process.cwd(), 'src', 'app', 'api');

let filesProcessed = 0;
let logsRemoved = 0;

/**
 * Check if file should be excluded
 */
function shouldExcludeFile(filePath) {
  return excludeFiles.some(exclude => 
    filePath.includes(exclude) || 
    path.basename(filePath).startsWith(exclude)
  );
}

/**
 * Clean console logs from file content
 */
function cleanConsoleLogs(content, filePath) {
  let cleanedContent = content;
  let fileLogsRemoved = 0;
  
  // Remove console.log statements (but keep console.error and console.warn)
  const consoleLogRegex = /^\s*console\.log\([^)]*\);\s*$/gm;
  const matches = content.match(consoleLogRegex);
  
  if (matches) {
    fileLogsRemoved = matches.length;
    cleanedContent = cleanedContent.replace(consoleLogRegex, '');
    
    console.log(`  📝 Removed ${fileLogsRemoved} console.log statements from ${path.basename(filePath)}`);
  }
  
  // Replace remaining console.log with conditional logging
  cleanedContent = cleanedContent.replace(
    /console\.log\(/g,
    'process.env.NODE_ENV === "development" && console.log('
  );
  
  return {
    content: cleanedContent,
    logsRemoved: fileLogsRemoved
  };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  if (shouldExcludeFile(filePath)) {
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: cleanedContent, logsRemoved } = cleanConsoleLogs(content, filePath);
    
    if (logsRemoved > 0) {
      fs.writeFileSync(filePath, cleanedContent, 'utf8');
      filesProcessed++;
      logsRemoved += logsRemoved;
    }
  } catch (error) {
    console.log(`  ❌ Error processing ${filePath}: ${error.message}`);
  }
}

/**
 * Recursively process directory
 */
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      processDirectory(itemPath);
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
      processFile(itemPath);
    }
  }
}

// Process source directories
console.log('📁 Processing src directory...');
processDirectory(srcDir);

console.log('📁 Processing API directory...');
processDirectory(apiDir);

console.log('\n🎉 Console Log Cleanup Complete!');
console.log(`📊 Summary:`);
console.log(`  - Files processed: ${filesProcessed}`);
console.log(`  - Console.log statements removed: ${logsRemoved}`);

console.log('\n💡 Recommendations:');
console.log('  - Use proper logging library for production (e.g., Winston, Pino)');
console.log('  - Implement log levels (error, warn, info, debug)');
console.log('  - Consider using structured logging for better monitoring');

console.log('\n🔧 Next steps:');
console.log('  1. Test your app to ensure no functionality is broken');
console.log('  2. Add proper error logging where needed');
console.log('  3. Consider implementing a logging service for production');

