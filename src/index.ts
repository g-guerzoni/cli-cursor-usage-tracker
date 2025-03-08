#!/usr/bin/env node

/**
 * Cursor Usage Tracker
 * 
 * A script to track and display Cursor AI request usage
 * with color-coded indicators and formatted display.
 */

import axios from 'axios';
import readlineSync from 'readline-sync';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store data in the user's home directory
const USER_HOME = os.homedir();
const DATA_DIR = path.join(USER_HOME, '.cursor-usage-tracker');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const CACHE_FILE = path.join(DATA_DIR, 'last-response.json');

// Function to extract headers from a curl command
function extractHeadersFromCurl(curlCommand: string): Record<string, string> | undefined {
  try {
    const headers: Record<string, string> = {};
    
    // Try to extract headers using regex patterns
    try {
      // Extract headers with -H or --header flags
      // This handles both single and double quotes in various formats
      const headerMatches = curlCommand.match(/-H\s+['"]([^'"]+)['"]|-H\s+'([^']+)'|-H\s+"([^"]+)"|--header\s+['"]([^'"]+)['"]|--header\s+'([^']+)'|--header\s+"([^"]+)"/g) || [];
      
      for (const headerMatch of headerMatches) {
        // Extract the actual header content between quotes
        const contentMatch = headerMatch.match(/['"]([^'"]+)['"]|'([^']+)'|"([^"]+)"/);
        if (contentMatch) {
          const headerContent = contentMatch[1] || contentMatch[2] || contentMatch[3];
          const colonIndex = headerContent.indexOf(':');
          
          if (colonIndex > 0) {
            const name = headerContent.substring(0, colonIndex).trim();
            const value = headerContent.substring(colonIndex + 1).trim();
            headers[name] = value;
          }
        }
      }
      
      // Extract cookies (-b or --cookie flags)
      const cookieMatches = curlCommand.match(/-b\s+['"]([^'"]+)['"]|-b\s+'([^']+)'|-b\s+"([^"]+)"|--cookie\s+['"]([^'"]+)['"]|--cookie\s+'([^']+)'|--cookie\s+"([^"]+)"/g) || [];
      
      for (const cookieMatch of cookieMatches) {
        const contentMatch = cookieMatch.match(/['"]([^'"]+)['"]|'([^']+)'|"([^"]+)"/);
        if (contentMatch) {
          const cookieContent = contentMatch[1] || contentMatch[2] || contentMatch[3];
          headers['Cookie'] = cookieContent;
          break; // Only use the first cookie flag
        }
      }
    } catch (regexError) {
      console.error('Error in regex header extraction:', regexError);
      // Continue with fallback approach
    }
    
    // Fallback approach for cookie extraction if above method didn't work
    if (!headers['Cookie'] && curlCommand.includes('WorkosCursorSessionToken=')) {
      const tokenPos = curlCommand.indexOf('WorkosCursorSessionToken=');
      if (tokenPos >= 0) {
        // Find the token and surrounding cookies
        let cookieStart = curlCommand.lastIndexOf("'", tokenPos);
        if (cookieStart === -1) cookieStart = curlCommand.lastIndexOf('"', tokenPos);
        
        let cookieEnd = curlCommand.indexOf("'", tokenPos);
        if (cookieEnd === -1) cookieEnd = curlCommand.indexOf('"', tokenPos);
        
        if (cookieStart !== -1 && cookieEnd !== -1 && cookieEnd > cookieStart) {
          const cookieValue = curlCommand.substring(cookieStart + 1, cookieEnd);
          if (cookieValue.includes('WorkosCursorSessionToken=')) {
            headers['Cookie'] = cookieValue;
          }
        } else {
          // Just extract the token parameter as fallback
          let tokenValue = curlCommand.substring(tokenPos);
          // Cut off at any space, quote, or end of string
          tokenValue = tokenValue.split(/['"\s]/)[0];
          headers['Cookie'] = tokenValue;
        }
      }
    }
    
    return Object.keys(headers).length > 0 ? headers : undefined;
  } catch (error) {
    console.error('Error extracting headers from curl command:', error);
    return undefined;
  }
}

interface CursorConfig {
  userId: string;
  sessionToken: string;
  lastRequest?: Date;
  customHeaders?: Record<string, string>; // Store custom headers from curl
}

interface CachedResponse {
  data: any;
  timestamp: Date;
}

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load saved config or create new one
function loadConfig(): CursorConfig {
  ensureDataDir();
  
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('Error reading config file, deleting corrupted file and creating new one');
      // Delete the corrupted config file
      try {
        fs.unlinkSync(CONFIG_FILE);
      } catch (deleteError) {
        console.error('Failed to delete corrupted config file:', deleteError);
      }
    }
  }
  
  // Default config
  return {
    userId: '',
    sessionToken: ''
  };
}

// Save config to file
function saveConfig(config: CursorConfig) {
  ensureDataDir();
  config.lastRequest = new Date();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Save response to cache file
function saveResponseCache(data: any) {
  ensureDataDir();
  const cache: CachedResponse = {
    data,
    timestamp: new Date()
  };
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// Load cached response if available
function loadCachedResponse(): any | null {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const cacheData = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(cacheData).data;
    } catch (error) {
      console.error('Error reading cache file, deleting corrupted file');
      // Delete the corrupted cache file
      try {
        fs.unlinkSync(CACHE_FILE);
      } catch (deleteError) {
        console.error('Failed to delete corrupted cache file:', deleteError);
      }
      return null;
    }
  }
  return null;
}

async function fetchCursorData(config: CursorConfig): Promise<any> {
  try {
    const API_URL = `https://www.cursor.com/api/usage?user=${config.userId}`;
    
    // Use custom headers if they were extracted from curl command
    let headers = config.customHeaders || {
      // Default generic headers for broader compatibility
      'accept': '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'referer': 'https://www.cursor.com/settings',
      'sec-ch-ua': '"Not;A=Brand";v="99", "Chromium";v="106"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36'
    };
    
    // Always ensure the cookie header has the session token
    if (!headers.Cookie) {
      headers.Cookie = `NEXT_LOCALE=en; WorkosCursorSessionToken=${config.sessionToken}`;
    } else if (!headers.Cookie.includes('WorkosCursorSessionToken')) {
      headers.Cookie += `; WorkosCursorSessionToken=${config.sessionToken}`;
    }
    
    const response = await axios.get(API_URL, {
      headers,
      withCredentials: true
    });
    
    // Save successful response to cache
    saveResponseCache(response.data);
    
    // Update and save config
    saveConfig(config);
    
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        // Session expired
        console.error(`⚠️ Authentication error: ${error.response.status} ${error.response.statusText}`);
        throw new Error('Authentication failed. Please check your credentials.');
      } else {
        console.error(`⚠️ API error: ${error.response.status} ${error.response.statusText}`);
        throw new Error(`API error: ${error.response.status} ${error.response.statusText}`);
      }
    } else {
      console.error('⚠️ Error fetching data:', error.message);
      throw error;
    }
  }
}

async function handleAuthError(config: CursorConfig, isFirstTimeUser: boolean): Promise<any> {
  if (isFirstTimeUser) {
    console.log('\n🌟 Welcome to Cursor Usage Tracker! 🌟');
    console.log('To get started, you\'ll need to provide your Cursor credentials.\n');
  } else {
    console.log('\n⚠️ Your Cursor session has expired. You need to provide updated credentials.\n');
  }
  
  // First ask how they want to authenticate
  const authMethod = readlineSync.question(
    'How would you like to provide your credentials?\n1. Import from curl command (recommended)\n2. Enter token manually\nChoice (1/2): '
  );

  if (authMethod === '1') {
    // CURL import method
    console.log('\n📋 Import credentials from curl command');
    console.log('\x1b[1;33mPaste the full curl command (press Enter twice when done):\x1b[0m');
    console.log('Tip: Use Ctrl+V on Windows or Cmd+V on Mac to paste');
    let curlCommand = '';
    let line;
    
    // Keep reading lines until an empty line is entered
    while((line = readlineSync.question('')) !== '') {
      curlCommand += line + ' ';
    }
    
    // Clean up the curl command by removing backslashes and newlines
    curlCommand = curlCommand.replace(/\\\s*/g, '');
    
    // Extract HTTP headers from curl command
    config.customHeaders = extractHeadersFromCurl(curlCommand);
    
    // Extract token from cookie header or directly from curl command
    let tokenFound = false;
    if (config.customHeaders && config.customHeaders.Cookie) {
      const cookieTokenMatch = config.customHeaders.Cookie.match(/WorkosCursorSessionToken=([^;]+)/);
      if (cookieTokenMatch && cookieTokenMatch[1]) {
        config.sessionToken = decodeURIComponent(cookieTokenMatch[1]);
        tokenFound = true;
      }
    }
    
    // If not found in Cookie header, try fallback pattern
    if (!tokenFound) {
      const tokenMatch = curlCommand.match(/WorkosCursorSessionToken=([^'"\s;]+)/);
      if (tokenMatch && tokenMatch[1]) {
        config.sessionToken = decodeURIComponent(tokenMatch[1]);
        tokenFound = true;
      }
    }
    
    if (tokenFound) {
      // Try to extract the user ID directly from the token string
      // Token looks like user_01JMEKPWF0E497XNXQEPMBJ390::eyJhbGci...
      // Or in URL-encoded form: user_01JMEKPWF0E497XNXQEPMBJ390%3A%3AeyJhbGci...
      let userIdFromToken = null;
      
      // First check if token contains a user ID at the beginning
      const tokenUserIdMatch = config.sessionToken.match(/^(user_[a-zA-Z0-9]+)(?:%3A%3A|::)/i);
      if (tokenUserIdMatch && tokenUserIdMatch[1]) {
        userIdFromToken = tokenUserIdMatch[1];
      }
      
      // If not found via regex, try splitting by known separators
      if (!userIdFromToken && (config.sessionToken.includes('::') || config.sessionToken.includes('%3A%3A'))) {
        // Try with decoded version first
        let tokenParts = config.sessionToken.split('::');
        if (tokenParts.length > 1 && tokenParts[0].startsWith('user_')) {
          userIdFromToken = tokenParts[0];
        } else {
          // Try with encoded version
          tokenParts = config.sessionToken.split('%3A%3A');
          if (tokenParts.length > 1 && tokenParts[0].startsWith('user_')) {
            userIdFromToken = tokenParts[0];
          }
        }
      }
      
      // If we found a user ID in the token, use it
      if (userIdFromToken) {
        config.userId = userIdFromToken;
        console.log(`✅ Successfully extracted User ID from token: ${config.userId}`);
      } else {
        // If we couldn't extract from token, try the URL pattern
        const userIdMatch = curlCommand.match(/user=([^'"\s&]+)/);
        if (userIdMatch && userIdMatch[1] && userIdMatch[1].startsWith('user_')) {
          config.userId = userIdMatch[1];
          console.log(`✅ Successfully extracted User ID from URL: ${config.userId}`);
        } else {
          // Generate a user ID instead of asking
          const randomPart = Math.random().toString(36).substring(2, 15).toUpperCase();
          config.userId = `user_${randomPart}`;
          console.log(`⚠️ Could not extract User ID from curl command, using generated ID: ${config.userId}`);
          console.log('Note: This is unusual and may affect API functionality.');
        }
      }
      
      // If header extraction fails or no headers were found, use a simple token + user ID only approach
      if (!config.customHeaders || Object.keys(config.customHeaders).length === 0) {
        console.log('⚠️ Could not extract browser headers from curl. Using default compatibility headers.');
        
        // The most important part is that we got the token
        config.customHeaders = {
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'referer': 'https://www.cursor.com/settings',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36'
        };
      } else {
        console.log('✅ Successfully extracted browser headers for compatibility');
      }
      
      console.log('✅ Successfully extracted session token');
    } else {
      console.error('❌ Could not extract session token from curl command');
      return handleAuthError(config, isFirstTimeUser);
    }
  } else if (authMethod === '2') {
    // Manual entry method - just need the token since it contains the user ID
    console.log('\n🔑 Manual credential entry');
    
    // Ask for session token only
    console.log('\n🔐 We need your Cursor session token.');
    console.log('You can find this in the Cookie header of the API request as WorkosCursorSessionToken.');
    console.log('It\'s a long string that contains your user ID followed by encoded characters.\n');
    
    config.sessionToken = readlineSync.question('Paste your WorkosCursorSessionToken value: ');
    
    while (!config.sessionToken || config.sessionToken.length < 20) {
      console.log('⚠️ That doesn\'t look like a valid session token. It should be a long string.');
      config.sessionToken = readlineSync.question('Paste your WorkosCursorSessionToken value: ');
    }
    
    // Extract user ID from token
    let userIdFromToken = null;
    
    // First check if token contains a user ID at the beginning
    const tokenUserIdMatch = config.sessionToken.match(/^(user_[a-zA-Z0-9]+)(?:%3A%3A|::)/i);
    if (tokenUserIdMatch && tokenUserIdMatch[1]) {
      userIdFromToken = tokenUserIdMatch[1];
    }
    
    // If not found via regex, try splitting by known separators
    if (!userIdFromToken && (config.sessionToken.includes('::') || config.sessionToken.includes('%3A%3A'))) {
      // Try with decoded version first
      let tokenParts = config.sessionToken.split('::');
      if (tokenParts.length > 1 && tokenParts[0].startsWith('user_')) {
        userIdFromToken = tokenParts[0];
      } else {
        // Try with encoded version
        tokenParts = config.sessionToken.split('%3A%3A');
        if (tokenParts.length > 1 && tokenParts[0].startsWith('user_')) {
          userIdFromToken = tokenParts[0];
        }
      }
    }
    
    if (userIdFromToken) {
      config.userId = userIdFromToken;
      console.log(`✅ Successfully extracted User ID from token: ${config.userId}`);
    } else {
      // Use a default ID format based on the token
      // This creates a user_id that follows the general pattern
      const randomPart = Math.random().toString(36).substring(2, 15).toUpperCase();
      config.userId = `user_${randomPart}`;
      console.log(`⚠️ Could not extract User ID from token, using generated ID: ${config.userId}`);
      console.log('Note: This is unusual and may affect API functionality.');
    }
  } else {
    console.error('Invalid option. Please select 1 or 2.');
    return handleAuthError(config, isFirstTimeUser);
  }

  // Save the new config
  saveConfig(config);
  
  try {
    console.log('\n🔄 Fetching your usage data from Cursor...');
    const data = await fetchCursorData(config);
    
    displayUsageSummary(data);
    return data;
  } catch (error) {
    console.error('\n❌ Failed to fetch data with the provided credentials.');
    console.error('Please check your User ID and session token and try again.');
    return null;
  }
}

async function main() {
  // Load config from file or create new one
  const config = loadConfig();
  
  try {
    // Check if we have both user ID and session token saved
    if (config.userId && config.sessionToken) {
      try {
        // We have all required credentials, try to fetch data
        console.log('🔄 Fetching your usage data from Cursor...');
        const data = await fetchCursorData(config);
        console.log('\n✅ Successfully fetched your data!\n');
        displayUsageSummary(data);
      } catch (fetchError: any) {
        if (fetchError.message && (
            fetchError.message.includes('Authentication failed') || 
            fetchError.message.includes('API error: 401') || 
            fetchError.message.includes('API error: 403'))) {
          console.error('❌ Invalid credentials detected in config file');
          console.log('🔄 Deleting invalid config and restarting authentication...');
          
          // Delete the config file with invalid credentials
          try {
            fs.unlinkSync(CONFIG_FILE);
          } catch (deleteError) {
            console.error('Failed to delete invalid config file:', deleteError);
          }
          
          // Create a fresh config and restart authentication process
          const newConfig = {
            userId: '',
            sessionToken: ''
          };
          
          // Restart authentication process
          const result = await handleAuthError(newConfig, false);
          
          // If we couldn't fetch data with the provided credentials
          if (!result) {
            console.error('❌ Could not display your usage data. Please try again with correct credentials.');
            process.exit(1);
          }
        } else {
          // For other errors, just show the error
          throw fetchError;
        }
      }
    } else {
      // No credentials, ask for auth details
      console.log('No credentials found. You need to provide your Cursor credentials.');
      const result = await handleAuthError(config, true);
      
      // If we couldn't fetch data with the provided credentials
      if (!result) {
        console.error('❌ Could not display your usage data. Please try again with correct credentials.');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('❌ Script execution failed');
    console.error('Could not fetch usage data. Please check your internet connection and credentials.');
    
    process.exit(1);
  }
}

// Function to clear the terminal
function clearTerminal() {
  // Clear terminal based on platform
  // For all platforms (Windows, Linux, macOS)
  process.stdout.write('\x1Bc');
}

function displayUsageSummary(data: any) {
  // Clear the terminal before displaying data
  clearTerminal();
  
  const model = 'gpt-4';
  const numRequests = data[model].numRequests;
  const maxRequests = data[model].maxRequestUsage;
  const usagePercentage = (numRequests / maxRequests) * 100;
  const remainingRequests = maxRequests - numRequests;

  // Set color based on usage percentage
  let usageColor = '\x1b[1;36m'; // Default cyan
  if (usagePercentage >= 90) {
    usageColor = '\x1b[1;31m'; // Red when at or above 90%
  } else if (usagePercentage >= 70) {
    usageColor = '\x1b[1;33m'; // Orange/yellow when between 70-90%
  }
  
  console.log(`${usageColor}${numRequests}\x1b[0m / \x1b[1;33m${maxRequests}\x1b[0m (${usageColor}${usagePercentage.toFixed(1)}%\x1b[0m)`);
  console.log(`Remaining: \x1b[1;32m${remainingRequests}\x1b[0m requests`);
  
  // Use system locale for date formatting
  const dateOptions: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };

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

main();