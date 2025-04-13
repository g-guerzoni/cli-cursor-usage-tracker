import { UsageData } from '../types/index.js';
import { COLORS } from '../config/constants.js';

export function clearTerminal(): void {
  process.stdout.write('\x1Bc');
}

function deepCleanStdin() {
  try {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      
      while (process.stdin.read() !== null) {}
      
      process.stdin.setRawMode(false);
      process.stdin.pause();
      
      process.stdin.removeAllListeners();
    }
  } catch (e) {
  }
}

export function displayUsageSummary(data: UsageData): void {
  deepCleanStdin();
  clearTerminal();
  
  const model = 'gpt-4';
  const numRequests = data[model].numRequests;
  const maxRequests = data[model].maxRequestUsage;
  const usagePercentage = (numRequests / maxRequests) * 100;
  const remainingRequests = maxRequests - numRequests;

  let usageColor = COLORS.CYAN;
  if (usagePercentage >= 90) {
    usageColor = COLORS.RED;
  } else if (usagePercentage >= 70) {
    usageColor = COLORS.YELLOW;
  }
  
  console.log(`${usageColor}${numRequests}${COLORS.RESET} / \x1b[1;33m${maxRequests}${COLORS.RESET} (${usageColor}${usagePercentage.toFixed(1)}%${COLORS.RESET})`);
  console.log(`Remaining: ${COLORS.GREEN}${remainingRequests}${COLORS.RESET} requests`);
  
  const dateOptions: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };

  const startDate = new Date(data.startOfMonth);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(endDate.getDate() - 1);

  console.log(`\n📅 Billing cycle: ${startDate.toLocaleDateString(undefined, dateOptions)} to ${endDate.toLocaleDateString(undefined, dateOptions)}`);
  
  displayUsageBasedPremium(data);
}

function displayUsageBasedPremium(data: UsageData): void {
  if (data.hasOwnProperty("usageBasedPremiumRequests")) {
    if (data.usageBasedPremiumRequests === true) {
      console.log(`\nUsage-based requests: ${COLORS.GREEN}ON${COLORS.RESET}`);
      
      if (data.hasOwnProperty("totalCents") && data.hasOwnProperty("hardLimit") && 
          data.totalCents !== undefined && data.hardLimit !== undefined) {
        const totalDollars = data.totalCents / 100;
        
        let hardLimitDollars = data.hardLimit;
        if (data.hardLimit > 100) {
          hardLimitDollars = data.hardLimit / 100;
        }
        
        const totalInDollars = data.totalCents / 100;
        const limitInDollars = data.hardLimit > 100 ? data.hardLimit / 100 : data.hardLimit;
        const spendPercentage = totalInDollars / limitInDollars;
        
        let spendColor = COLORS.CYAN;
        if (spendPercentage >= 0.9) {
          spendColor = COLORS.RED;
        } else if (spendPercentage >= 0.7) {
          spendColor = COLORS.YELLOW;
        }
        
        const displayPercentage = spendPercentage * 100;
        
        console.log(`Usage: ${spendColor}$${totalDollars.toFixed(2)}${COLORS.RESET}/$${hardLimitDollars.toFixed(2)} ${spendColor}(${displayPercentage.toFixed(1)}%)${COLORS.RESET}`);
      }
    } else {
      console.log(`\nUsage-based requests: ${COLORS.RED}OFF${COLORS.RESET}`);
    }
  }
}