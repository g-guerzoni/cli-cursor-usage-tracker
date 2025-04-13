#!/usr/bin/env ts-node

import { mockData } from "./index.test.js";
import readline from "readline";

const CYAN = "\x1b[1;36m";
const YELLOW = "\x1b[1;33m";
const RED = "\x1b[1;31m";
const GREEN = "\x1b[1;32m";
const RESET = "\x1b[0m";
function clearTerminal() {
  process.stdout.write("\x1Bc");
}
function waitForKeyPress(message: string): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

function createTestData(usagePercentage: number, usageBasedPremium: boolean = false, spendPercentage: number = 0) {
  const maxRequests = 500;
  const numRequests = Math.round((maxRequests * usagePercentage) / 100);

  const hardLimit = 5000; // $50.00
  const totalCents = spendPercentage > 0 ? Math.round((hardLimit * spendPercentage) / 100) : 0;

  return {
    "gpt-4": {
      numRequests: numRequests,
      numRequestsTotal: numRequests,
      numTokens: 2501912,
      maxRequestUsage: maxRequests,
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
    startOfMonth: mockData.startOfMonth,
    usageBasedPremiumRequests: usageBasedPremium,
    hardLimit: usageBasedPremium ? hardLimit : undefined,
    totalCents: usageBasedPremium ? totalCents : undefined,
  };
}

function displayUsageSummary(data: any, scenarioName: string) {
  clearTerminal();

  const model = "gpt-4";
  const numRequests = data[model].numRequests;
  const maxRequests = data[model].maxRequestUsage;
  const usagePercentage = (numRequests / maxRequests) * 100;
  const remainingRequests = maxRequests - numRequests;

  console.log("╔════════════════════════════════════════╗");
  console.log("║        CURSOR USAGE TRACKER            ║");
  console.log("╚════════════════════════════════════════╝\n");

  console.log(`🔍 DEMO SCENARIO: ${scenarioName}`);
  console.log("═══════════════════════════════════════════\n");

  console.log(`🤖 Model: ${model}\n`);

  let usageColor = CYAN;
  if (usagePercentage >= 90) {
    usageColor = RED;
  } else if (usagePercentage >= 70) {
    usageColor = YELLOW;
  }

  console.log(
    `${usageColor}${numRequests}${RESET} / ${YELLOW}${maxRequests}${RESET} (${usageColor}${usagePercentage.toFixed(
      1
    )}%${RESET})`
  );
  console.log(`Remaining: ${GREEN}${remainingRequests}${RESET} requests`);

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const startDate = new Date(data.startOfMonth);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(endDate.getDate() - 1);

  if (data.hasOwnProperty("usageBasedPremiumRequests")) {
    if (data.usageBasedPremiumRequests === true) {
      console.log(`\nUsage-based requests: ${GREEN}ON${RESET}`);

      if (
        data.hasOwnProperty("totalCents") &&
        data.hasOwnProperty("hardLimit") &&
        data.totalCents !== undefined &&
        data.hardLimit !== undefined
      ) {
        const totalDollars = data.totalCents / 100;
        const hardLimitDollars = data.hardLimit / 100;

        let spendColor = CYAN;
        if (data.totalCents / data.hardLimit >= 0.9) {
          spendColor = RED;
        } else if (data.totalCents / data.hardLimit >= 0.7) {
          spendColor = YELLOW;
        }

        const displayPercentage =
          (data.totalCents / (data.hardLimit > 100 ? data.hardLimit : data.hardLimit * 100)) * 100;

        console.log(
          `Usage: ${spendColor}$${totalDollars.toFixed(2)}${RESET}/$${hardLimitDollars.toFixed(
            2
          )} ${spendColor}(${displayPercentage.toFixed(1)}%)${RESET}`
        );
      }
    } else {
      console.log(`\nUsage-based requests: ${RED}OFF${RESET}`);
    }
  }

  console.log(
    `\n📅 Billing cycle: ${startDate.toLocaleDateString(undefined, dateOptions)} to ${endDate.toLocaleDateString(
      undefined,
      dateOptions
    )}`
  );
}

async function main() {
  clearTerminal();

  console.log("======================================");
  console.log("Cursor Usage Tracker Demo");
  console.log("======================================\n");
  console.log("⚠️ This is a demo version showcasing different usage scenarios\n");
  console.log("Press any key to cycle through different usage scenarios...\n");

  const scenarios = [
    { name: "Low Usage (30%)", data: createTestData(30) },
    { name: "Medium Usage (65%)", data: createTestData(65) },
    { name: "High Usage (75%)", data: createTestData(75) },
    { name: "Critical Usage (92%)", data: createTestData(92) },
    { name: "Maximum Usage (100%)", data: createTestData(100) },
    { name: "Usage-Based Premium - OFF", data: createTestData(50, false) },
    { name: "Usage-Based Premium - Low Cost", data: createTestData(50, true, 20) },
    { name: "Usage-Based Premium - Medium Cost", data: createTestData(50, true, 65) },
    { name: "Usage-Based Premium - High Cost", data: createTestData(50, true, 85) },
    { name: "Usage-Based Premium - Critical Cost", data: createTestData(50, true, 95) },
  ];

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    await waitForKeyPress(`\nPress Enter to view ${scenario.name}...`);
    displayUsageSummary(scenario.data, scenario.name);
  }

  await waitForKeyPress("\nPress Enter to exit demo...");
  clearTerminal();
  console.log("Demo completed. Thank you for using Cursor Usage Tracker!");
}

main();
