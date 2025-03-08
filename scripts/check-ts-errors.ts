#!/usr/bin/env ts-node

/**
 * TypeScript Error Checker
 * 
 * This script checks for TypeScript errors in the codebase without generating output files.
 * It's useful as a quick validation step before commits.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';

// ANSI color codes for formatted output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// Banner display
function displayBanner() {
  console.log(`${COLORS.cyan}${COLORS.bold}===========================================`);
  console.log(`TypeScript Error Checker`);
  console.log(`===========================================\n${COLORS.reset}`);
}

// Check TypeScript files
function checkTypeScript() {
  try {
    console.log(`${COLORS.blue}Running TypeScript check...${COLORS.reset}`);
    
    // Execute TypeScript compiler with --noEmit flag (checks without generating output)
    const output = execSync('npx tsc --noEmit', { encoding: 'utf8' });
    
    console.log(`${COLORS.green}✅ No TypeScript errors found!${COLORS.reset}`);
    return true;
  } catch (error: any) {
    // If tsc exits with non-zero code, it found errors
    console.error(`${COLORS.red}❌ TypeScript errors found:${COLORS.reset}\n`);
    console.error(error.stdout);
    return false;
  }
}

// Count TypeScript files in the project
function countTsFiles() {
  let tsFileCount = 0;
  
  function countInDir(dirPath: string) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      // Skip node_modules and dist directories
      if (entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }
      
      if (entry.isDirectory()) {
        countInDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        tsFileCount++;
      }
    }
  }
  
  countInDir(path.resolve(__dirname, '..'));
  return tsFileCount;
}

// Main function
function main() {
  displayBanner();
  
  const startTime = process.hrtime();
  const fileCount = countTsFiles();
  
  console.log(`${COLORS.cyan}Found ${fileCount} TypeScript files to check${COLORS.reset}\n`);
  
  const success = checkTypeScript();
  
  const [seconds, nanoseconds] = process.hrtime(startTime);
  const duration = seconds + nanoseconds / 1e9;
  
  console.log(`\n${COLORS.blue}Time taken: ${duration.toFixed(2)}s${COLORS.reset}`);
  
  if (!success) {
    process.exit(1); // Exit with error code if TypeScript check failed
  }
}

// Run the script
main();