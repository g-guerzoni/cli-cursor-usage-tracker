import assert from "assert";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const mockData = {
  "gpt-4": {
    numRequests: 133,
    numRequestsTotal: 133,
    numTokens: 2501912,
    maxRequestUsage: 500,
    maxTokenUsage: null,
  },
  "gpt-3.5-turbo": {
    numRequests: 0,
    numRequestsTotal: 0,
    numTokens: 0,
    maxRequestUsage: null,
    maxTokenUsage: null,
  },
  "gpt-4-32k": {
    numRequests: 0,
    numRequestsTotal: 0,
    numTokens: 0,
    maxRequestUsage: 50,
    maxTokenUsage: null,
  },
  startOfMonth: "2025-03-03T12:38:37.000Z",
};

function testConfigPaths() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const APP_DIR = path.dirname(__dirname);
  const DATA_DIR = path.join(APP_DIR, "data");
  const CONFIG_FILE = path.join(DATA_DIR, "config.json");
  const CACHE_FILE = path.join(DATA_DIR, "last-response.json");

  assert(DATA_DIR.endsWith("data"), "Data directory path is correct");
  assert(CONFIG_FILE.endsWith("data/config.json"), "Config file path is correct");
  assert(CACHE_FILE.endsWith("data/last-response.json"), "Cache file path is correct");

  console.log("✅ Config path tests passed");
}

function testConfigStructure() {
  const defaultConfig = {
    userId: "",
    sessionToken: "",
  };

  assert("userId" in defaultConfig, "Config should have userId property");
  assert("sessionToken" in defaultConfig, "Config should have sessionToken property");

  console.log("✅ Config structure tests passed");
}

function testUsageCalculation() {
  const model = "gpt-4";
  const numRequests = mockData[model].numRequests;
  const maxRequests = mockData[model].maxRequestUsage;
  const usagePercentage = (numRequests / maxRequests) * 100;

  assert.strictEqual(usagePercentage, 26.6, "Usage percentage calculation is correct");
  assert.strictEqual(maxRequests - numRequests, 367, "Remaining requests calculation is correct");

  console.log("✅ Usage calculation tests passed");
}

function testDateCalculation() {
  const startDate = new Date(mockData.startOfMonth);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(endDate.getDate() - 1);

  assert.strictEqual(startDate.getMonth(), 2, "Start month should be March (2)");
  assert.strictEqual(endDate.getMonth(), 3, "End month should be April (3)");
  assert.strictEqual(endDate.getDate(), 2, "End date should be 2nd");

  console.log("✅ Date calculation tests passed");
}

function runAllTests() {
  console.log("Running tests...\n");

  testConfigPaths();
  testConfigStructure();
  testUsageCalculation();
  testDateCalculation();

  console.log("\n🎉 All tests passed!");
}

if (process.argv[1] === import.meta.url) runAllTests();

export { runAllTests, mockData };
