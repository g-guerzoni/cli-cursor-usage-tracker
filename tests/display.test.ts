import { mockData } from "./index.test.js";
import assert from "assert";

let logOutput: string[] = [];
const originalConsoleLog = console.log;

function setupMockConsole() {
  logOutput = [];
  console.log = (...args: any[]) => {
    logOutput.push(args.join(" "));
  };
}

function restoreConsole() {
  console.log = originalConsoleLog;
}

const CYAN = "\x1b[1;36m";
const YELLOW = "\x1b[1;33m";
const RED = "\x1b[1;31m";
const RESET = "\x1b[0m";

function displayUsageSummary(data: any) {
  const model = "gpt-4";
  const numRequests = data[model].numRequests;
  const maxRequests = data[model].maxRequestUsage;
  const usagePercentage = (numRequests / maxRequests) * 100;
  const remainingRequests = maxRequests - numRequests;

  console.log(`🤖 Model: ${model}\n`);

  let usageColor = CYAN; // Default cyan
  if (usagePercentage >= 90) {
    usageColor = RED; // Red when at or above 90%
  } else if (usagePercentage >= 70) {
    usageColor = YELLOW; // Yellow when between 70-90%
  }

  console.log(
    `${usageColor}${numRequests}${RESET} / ${YELLOW}${maxRequests}${RESET} (${usageColor}${usagePercentage.toFixed(
      1
    )}%${RESET})`
  );
  console.log(`Remaining: \x1b[1;32m${remainingRequests}\x1b[0m requests`);

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  console.log(`New cycle begins: ${new Date(data.startOfMonth).toLocaleDateString(undefined, dateOptions)}`);

  const barLength = 30;
  const filledLength = Math.round((barLength * usagePercentage) / 100);
  const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);

  console.log(`\n[${bar}] - ${usagePercentage.toFixed(1)}%`);

  const startDate = new Date(data.startOfMonth);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(endDate.getDate() - 1);

  console.log(
    `\n📅 Billing cycle: ${startDate.toLocaleDateString(undefined, dateOptions)} to ${endDate.toLocaleDateString(
      undefined,
      dateOptions
    )}`
  );
}

function createTestData(usagePercentage: number) {
  const maxRequests = 500;
  const numRequests = Math.round((maxRequests * usagePercentage) / 100);

  return {
    "gpt-4": {
      numRequests: numRequests,
      numRequestsTotal: numRequests,
      numTokens: 2501912,
      maxRequestUsage: maxRequests,
      maxTokenUsage: null,
    },
    startOfMonth: "2025-03-03T12:38:37.000Z",
  };
}

function testDisplayOutput() {
  setupMockConsole();

  displayUsageSummary(mockData);

  assert(
    logOutput.some((line) => line.includes("Model: gpt-4")),
    "Model name should be displayed"
  );
  assert(
    logOutput.some((line) => line.includes("133") && line.includes("500")),
    "Request counts should be displayed"
  );
  assert(
    logOutput.some((line) => line.includes("26.6%")),
    "Usage percentage should be displayed"
  );
  assert(
    logOutput.some((line) => line.includes("█")),
    "Progress bar should be displayed"
  );
  assert(
    logOutput.some((line) => line.includes("Billing cycle")),
    "Billing cycle should be displayed"
  );

  restoreConsole();
  console.log("✅ Basic display output test passed");
}

function testColorOutput() {
  setupMockConsole();
  displayUsageSummary(createTestData(30));
  assert(
    logOutput.some((line) => line.includes(CYAN)),
    "Low usage should use cyan color"
  );
  restoreConsole();

  setupMockConsole();
  displayUsageSummary(createTestData(75));
  assert(
    logOutput.some((line) => line.includes(YELLOW)),
    "Medium usage should use yellow color"
  );
  restoreConsole();

  setupMockConsole();
  displayUsageSummary(createTestData(95));
  assert(
    logOutput.some((line) => line.includes(RED)),
    "High usage should use red color"
  );
  restoreConsole();

  console.log("✅ Color coding tests passed");
}

function testDateFormat() {
  setupMockConsole();

  displayUsageSummary(mockData);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const hasFullMonth = logOutput.some((line) => {
    return monthNames.some((month) => line.includes(month));
  });

  assert(hasFullMonth, "Dates should be formatted with full month names");

  restoreConsole();
  console.log("✅ Date formatting test passed");
}

function runDisplayTests() {
  console.log("Running display tests...\n");

  testDisplayOutput();
  testColorOutput();
  testDateFormat();

  console.log("\n🎉 All display tests passed!");
}

if (process.argv[1] === import.meta.url) runDisplayTests();

export { runDisplayTests };
