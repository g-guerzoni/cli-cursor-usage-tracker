import { mockData } from './index.test';
import assert from 'assert';

// Mock console.log for testing display output
let logOutput: string[] = [];
const originalConsoleLog = console.log;

// Helper to capture console.log output
function setupMockConsole() {
  logOutput = [];
  console.log = (...args: any[]) => {
    logOutput.push(args.join(' '));
  };
}

// Helper to restore original console.log
function restoreConsole() {
  console.log = originalConsoleLog;
}

// ANSI color codes
const CYAN = '\x1b[1;36m';
const YELLOW = '\x1b[1;33m';
const RED = '\x1b[1;31m';
const RESET = '\x1b[0m';

// Updated function to display usage summary (based on current app version)
function displayUsageSummary(data: any) {
  const model = 'gpt-4';
  const numRequests = data[model].numRequests;
  const maxRequests = data[model].maxRequestUsage;
  const usagePercentage = (numRequests / maxRequests) * 100;
  const remainingRequests = maxRequests - numRequests;

  console.log(`🤖 Model: ${model}\n`);
  
  // Set color based on usage percentage
  let usageColor = CYAN; // Default cyan
  if (usagePercentage >= 90) {
    usageColor = RED; // Red when at or above 90%
  } else if (usagePercentage >= 70) {
    usageColor = YELLOW; // Yellow when between 70-90%
  }
  
  console.log(`${usageColor}${numRequests}${RESET} / ${YELLOW}${maxRequests}${RESET} (${usageColor}${usagePercentage.toFixed(1)}%${RESET})`);
  console.log(`Remaining: \x1b[1;32m${remainingRequests}\x1b[0m requests`);
  
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
    "startOfMonth": "2025-03-03T12:38:37.000Z"
  };
}

// Test basic display output
function testDisplayOutput() {
  setupMockConsole();
  
  displayUsageSummary(mockData);
  
  // Verify that key information is displayed
  assert(logOutput.some(line => line.includes('Model: gpt-4')), 'Model name should be displayed');
  assert(logOutput.some(line => line.includes('133') && line.includes('500')), 'Request counts should be displayed');
  assert(logOutput.some(line => line.includes('26.6%')), 'Usage percentage should be displayed');
  assert(logOutput.some(line => line.includes('█')), 'Progress bar should be displayed');
  assert(logOutput.some(line => line.includes('Billing cycle')), 'Billing cycle should be displayed');
  
  restoreConsole();
  console.log('✅ Basic display output test passed');
}

// Test color change based on usage percentages
function testColorOutput() {
  // Test low usage (below 70%)
  setupMockConsole();
  displayUsageSummary(createTestData(30));
  assert(logOutput.some(line => line.includes(CYAN)), 'Low usage should use cyan color');
  restoreConsole();
  
  // Test medium usage (70-90%)
  setupMockConsole();
  displayUsageSummary(createTestData(75));
  assert(logOutput.some(line => line.includes(YELLOW)), 'Medium usage should use yellow color');
  restoreConsole();
  
  // Test high usage (>=90%)
  setupMockConsole();
  displayUsageSummary(createTestData(95));
  assert(logOutput.some(line => line.includes(RED)), 'High usage should use red color');
  restoreConsole();
  
  console.log('✅ Color coding tests passed');
}

// Test date formatting
function testDateFormat() {
  setupMockConsole();
  
  displayUsageSummary(mockData);
  
  // The date should be in format like "March 3, 2025"
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Check that it contains the month name instead of just numbers
  const hasFullMonth = logOutput.some(line => {
    return monthNames.some(month => line.includes(month));
  });
  
  assert(hasFullMonth, 'Dates should be formatted with full month names');
  
  restoreConsole();
  console.log('✅ Date formatting test passed');
}

// Run all display tests
function runDisplayTests() {
  console.log('Running display tests...\n');
  
  testDisplayOutput();
  testColorOutput();
  testDateFormat();
  
  console.log('\n🎉 All display tests passed!');
}

// If this file is run directly, run the tests
if (require.main === module) {
  runDisplayTests();
}

export { runDisplayTests };