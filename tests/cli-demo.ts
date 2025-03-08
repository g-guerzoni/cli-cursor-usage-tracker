#!/usr/bin/env ts-node

import { mockData } from './index.test';
import readline from 'readline';

// ANSI color codes
const CYAN = '\x1b[1;36m';
const YELLOW = '\x1b[1;33m';
const RED = '\x1b[1;31m';
const GREEN = '\x1b[1;32m';
const RESET = '\x1b[0m';

// Function to clear the terminal
function clearTerminal() {
  // Clear terminal based on platform
  // For all platforms (Windows, Linux, macOS)
  process.stdout.write('\x1Bc');
}

// Function to wait for key press
function waitForKeyPress(message: string): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

// Create test data with different usage levels
function createTestData(usagePercentage: number) {
  const maxRequests = 500;
  const numRequests = Math.round(maxRequests * usagePercentage / 100);
  
  return {
    "gpt-4": {
      "numRequests": numRequests,
      "numRequestsTotal": numRequests,
      "numTokens": 2501912,
      "maxRequestUsage": maxRequests,
      "maxTokenUsage": null
    },
    "gpt-3.5-turbo": {
      "numRequests": 0,
      "numRequestsTotal": 0,
      "numTokens": 0,
      "maxRequestUsage": null,
      "maxTokenUsage": null
    },
    "gpt-4-32k": {
      "numRequests": 0,
      "numRequestsTotal": 0,
      "numTokens": 0,
      "maxRequestUsage": 50,
      "maxTokenUsage": null
    },
    "startOfMonth": mockData.startOfMonth
  };
}

// Updated function to display usage summary (based on current app version)
function displayUsageSummary(data: any, scenarioName: string) {
  // Clear the terminal before displaying data
  clearTerminal();
  
  const model = 'gpt-4';
  const numRequests = data[model].numRequests;
  const maxRequests = data[model].maxRequestUsage;
  const usagePercentage = (numRequests / maxRequests) * 100;
  const remainingRequests = maxRequests - numRequests;

  console.log('╔════════════════════════════════════════╗');
  console.log('║        CURSOR USAGE TRACKER            ║');
  console.log('╚════════════════════════════════════════╝\n');

  console.log(`🔍 DEMO SCENARIO: ${scenarioName}`);
  console.log('═══════════════════════════════════════════\n');
  
  console.log(`🤖 Model: ${model}\n`);
  
  // Set color based on usage percentage
  let usageColor = CYAN; // Default cyan
  if (usagePercentage >= 90) {
    usageColor = RED; // Red when at or above 90%
  } else if (usagePercentage >= 70) {
    usageColor = YELLOW; // Yellow when between 70-90%
  }
  
  console.log(`${usageColor}${numRequests}${RESET} / ${YELLOW}${maxRequests}${RESET} (${usageColor}${usagePercentage.toFixed(1)}%${RESET})`);
  console.log(`Remaining: ${GREEN}${remainingRequests}${RESET} requests`);
  
  // Use system locale for date formatting
  const dateOptions: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  console.log(`New cycle begins: ${new Date(data.startOfMonth).toLocaleDateString(undefined, dateOptions)}`);

  // Visual progress bar
  const barLength = 30;
  const filledLength = Math.round(barLength * usagePercentage / 100);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

  console.log(`\n[${bar}] - ${usagePercentage.toFixed(1)}%`);

  // Month info
  const startDate = new Date(data.startOfMonth);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(endDate.getDate() - 1);

  console.log(`\n📅 Billing cycle: ${startDate.toLocaleDateString(undefined, dateOptions)} to ${endDate.toLocaleDateString(undefined, dateOptions)}`);
}

// Simple CLI interface
async function main() {
  // Clear terminal first
  clearTerminal();
  
  // Introduction
  console.log('======================================');
  console.log('Cursor Usage Tracker Demo');
  console.log('======================================\n');
  console.log('⚠️ This is a demo version showcasing different usage scenarios\n');
  console.log('Press any key to cycle through different usage scenarios...\n');
  
  // Define scenarios to display
  const scenarios = [
    { name: "Low Usage (30%)", data: createTestData(30) },
    { name: "Medium Usage (65%)", data: createTestData(65) },
    { name: "High Usage (75%)", data: createTestData(75) },
    { name: "Critical Usage (92%)", data: createTestData(92) },
    { name: "Maximum Usage (100%)", data: createTestData(100) }
  ];
  
  // Display each scenario
  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    await waitForKeyPress(`Press Enter to view ${scenario.name}...`);
    displayUsageSummary(scenario.data, scenario.name);
  }
  
  // Final message
  await waitForKeyPress('\nPress Enter to exit demo...');
  clearTerminal();
  console.log('Demo completed. Thank you for using Cursor Usage Tracker!');
}

// Run the demo
main();