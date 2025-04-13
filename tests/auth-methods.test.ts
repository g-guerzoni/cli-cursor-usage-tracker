#!/usr/bin/env ts-node

import assert from 'assert';
import fs from 'fs';
import path from 'path';

function extractHeadersFromCurl(curlCommand: string): Record<string, string> | undefined {
  try {
    const headers: Record<string, string> = {};
    
    // Clean up the input by normalizing line breaks and spaces
    const cleanedCommand = curlCommand
      .replace(/\n/g, " ")
      .replace(/\r/g, " ")
      .replace(/\t/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    try {
      // Match headers with more flexibility
      const headerPattern = /-H\s+['"]([^'"]+)['"]|-H\s+'([^']+)'|-H\s+"([^"]+)"|-H\s+([^\s'"]+)|--header\s+['"]([^'"]+)['"]|--header\s+'([^']+)'|--header\s+"([^"]+)"|--header\s+([^\s'"]+)/g;
      const headerMatches = cleanedCommand.match(headerPattern) || [];
      
      for (const headerMatch of headerMatches) {
        const contentMatch = headerMatch.match(/['"]([^'"]+)['"]|'([^']+)'|"([^"]+)"|[\s]([^\s'"]+)$/);
        if (contentMatch) {
          const headerContent = contentMatch[1] || contentMatch[2] || contentMatch[3] || contentMatch[4];
          
          if (headerContent.toLowerCase().startsWith('cookie:')) {
            headers['Cookie'] = headerContent.substring(headerContent.indexOf(':') + 1).trim();
          } else {
            const colonIndex = headerContent.indexOf(':');
            
            if (colonIndex > 0) {
              const name = headerContent.substring(0, colonIndex).trim();
              const value = headerContent.substring(colonIndex + 1).trim();
              headers[name] = value;
            }
          }
        }
      }
    } catch (regexError) {
      console.error('Error in regex header extraction:', regexError);
    }
    
    // Fallback detection for WorkosCursorSessionToken
    if (!headers['Cookie'] && cleanedCommand.includes('WorkosCursorSessionToken=')) {
      const tokenPos = cleanedCommand.indexOf('WorkosCursorSessionToken=');
      if (tokenPos >= 0) {
        const tokenRegex = /(WorkosCursorSessionToken=[^;'"&\s]+)/;
        const tokenMatch = cleanedCommand.match(tokenRegex);
        if (tokenMatch && tokenMatch[1]) {
          headers['Cookie'] = tokenMatch[1];
        } else {
          let tokenValue = cleanedCommand.substring(tokenPos);
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

const mockCurlCommand = `curl 'https://www.cursor.com/api/usage?user=user_TESTUSER123456789' \\
  -H 'authority: www.cursor.com' \\
  -H 'accept: */*' \\
  -H 'accept-language: en-US,en;q=0.9' \\
  -H 'cookie: NEXT_LOCALE=en; WorkosCursorSessionToken=user_TESTUSER123456789%3A%3AeyJzdWIiOiJ0ZXN0X3VzZXIi.eyJzdWIiOiJ0ZXN0X3VzZXI0.TEST_SIGNATURE' \\
  -H 'referer: https://www.cursor.com/settings' \\
  -H 'sec-ch-ua: "Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"' \\
  -H 'sec-ch-ua-mobile: ?0' \\
  -H 'sec-ch-ua-platform: "macOS"' \\
  -H 'sec-fetch-dest: empty' \\
  -H 'sec-fetch-mode: cors' \\
  -H 'sec-fetch-site: same-origin' \\
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' \\
  --compressed`;

const mockSessionToken = "user_TESTUSER123456789::eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X3VzZXIi.TEST_SIGNATURE";

const mockEncodedSessionToken = "user_TESTUSER123456789%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X3VzZXIi.TEST_SIGNATURE";

function testCurlMethodExtraction() {
  console.log('Testing curl method extraction...');
  
  const headers = extractHeadersFromCurl(mockCurlCommand);
  assert(headers, 'Headers should be extracted');
  assert(headers?.Cookie, 'Cookie header should be extracted');
  
  assert(headers?.Cookie.includes('WorkosCursorSessionToken'), 'Cookie should contain session token');
  
  const cookieTokenMatch = headers?.Cookie.match(/WorkosCursorSessionToken=([^;]+)/);
  const token = cookieTokenMatch ? cookieTokenMatch[1] : '';
  assert(token, 'Token should be extracted from Cookie');
  
  const tokenUserIdMatch = token.match(/^(user_[a-zA-Z0-9]+)(?:%3A%3A|::)/i);
  const userIdFromToken = tokenUserIdMatch ? tokenUserIdMatch[1] : null;
  
  assert(userIdFromToken, 'User ID should be extractable from token');
  assert.strictEqual(userIdFromToken, 'user_TESTUSER123456789', 'Extracted user ID should match expected value');
  
  console.log('✅ Curl method extraction test passed');
}

function testDirectTokenExtraction() {
  console.log('Testing direct token extraction...');
  
  let tokenUserIdMatch = mockSessionToken.match(/^(user_[a-zA-Z0-9]+)(?:%3A%3A|::)/i);
  let userIdFromToken = tokenUserIdMatch ? tokenUserIdMatch[1] : null;
  
  assert(userIdFromToken, 'User ID should be extractable from regular token');
  assert.strictEqual(userIdFromToken, 'user_TESTUSER123456789', 'Extracted user ID should match expected value');
  
  tokenUserIdMatch = mockEncodedSessionToken.match(/^(user_[a-zA-Z0-9]+)(?:%3A%3A|::)/i);
  userIdFromToken = tokenUserIdMatch ? tokenUserIdMatch[1] : null;
  
  assert(userIdFromToken, 'User ID should be extractable from URL-encoded token');
  assert.strictEqual(userIdFromToken, 'user_TESTUSER123456789', 'Extracted user ID from encoded token should match expected value');
  
  if (!userIdFromToken && (mockSessionToken.includes('::') || mockSessionToken.includes('%3A%3A'))) {
    let tokenParts = mockSessionToken.split('::');
    if (tokenParts.length > 1 && tokenParts[0].startsWith('user_')) {
      userIdFromToken = tokenParts[0];
    }
  }
  
  assert(userIdFromToken, 'User ID should be extractable from token via split method');
  
  console.log('✅ Direct token extraction test passed');
}

function testIDGeneration() {
  console.log('Testing ID generation for failed extraction...');
  
  const badToken = "someBadTokenWithoutUserID123";
  
  const tokenUserIdMatch = badToken.match(/^(user_[a-zA-Z0-9]+)(?:%3A%3A|::)/i);
  const userIdFromToken = tokenUserIdMatch ? tokenUserIdMatch[1] : null;
  
  assert(!userIdFromToken, 'No user ID should be extracted from bad token');
  
  const randomPart = Math.random().toString(36).substring(2, 15).toUpperCase();
  const generatedId = `user_${randomPart}`;
  
  assert(generatedId.startsWith('user_'), 'Generated ID should start with user_');
  assert(generatedId.length > 10, 'Generated ID should be reasonably long');
  
  console.log('✅ ID generation test passed');
}

function testAuthScenarios() {
  const corruptedToken = "user123-not-valid";
  const tokenUserIdMatch = corruptedToken.match(/^(user_[a-zA-Z0-9]+)(?:%3A%3A|::)/i);
  const userIdFromToken = tokenUserIdMatch ? tokenUserIdMatch[1] : null;
  
  assert(!userIdFromToken, 'Corrupted token should not extract a valid user ID');
  
  const tokenWithoutSeparator = "user_01JMEKPWF0E497XNXQEPMBJ390eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
  const match = tokenWithoutSeparator.match(/^(user_[a-zA-Z0-9]+)(?:%3A%3A|::)/i);
  assert(!match, 'Token without separator should not match the regex');
  
  console.log('✅ Auth scenarios test passed');
}

function testAPIUrlConstruction() {
  console.log('Testing API URL construction...');
  
  const config = {
    userId: 'user_TESTUSER123456789',
    sessionToken: mockSessionToken
  };
  
  const API_URL = `https://www.cursor.com/api/usage?user=${config.userId}`;
  assert.strictEqual(API_URL, 'https://www.cursor.com/api/usage?user=user_TESTUSER123456789', 'API URL should be constructed correctly');
  
  console.log('✅ API URL construction test passed');
}

function runAuthTests() {
  console.log('Running authentication method tests...\n');
  
  testCurlMethodExtraction();
  testDirectTokenExtraction();
  testIDGeneration();
  testAuthScenarios();
  testAPIUrlConstruction();
  
  console.log('\n🎉 All authentication tests passed!');
}

if (process.argv[1] === import.meta.url) {
  runAuthTests();
}

export { runAuthTests };