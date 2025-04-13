#!/usr/bin/env ts-node

/**
 * TypeScript Error Checker
 *
 * This script checks for TypeScript errors in the codebase without generating output files.
 * It's useful as a quick validation step before commits.
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as process from "process";
import { fileURLToPath } from "url";

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bold: "\x1b[1m",
};

function displayBanner() {
  console.log(`${COLORS.cyan}${COLORS.bold}===========================================`);
  console.log(`TypeScript Error Checker`);
  console.log(`===========================================\n${COLORS.reset}`);
}

function checkTypeScript() {
  try {
    console.log(`${COLORS.blue}Running TypeScript check...${COLORS.reset}`);

    const output = execSync("npx tsc --noEmit", { encoding: "utf8" });

    console.log(`${COLORS.green}✅ No TypeScript errors found!${COLORS.reset}`);
    return true;
  } catch (error: any) {
    console.error(`${COLORS.red}❌ TypeScript errors found:${COLORS.reset}\n`);
    console.error(error.stdout);
    return false;
  }
}

function countTsFiles() {
  let tsFileCount = 0;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  function countInDir(dirPath: string) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.name === "node_modules" || entry.name === "dist") {
        continue;
      }

      if (entry.isDirectory()) {
        countInDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
        tsFileCount++;
      }
    }
  }

  countInDir(path.resolve(__dirname, ".."));
  return tsFileCount;
}

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
    process.exit(1);
  }
}

main();
