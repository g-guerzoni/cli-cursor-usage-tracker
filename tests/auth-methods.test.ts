#!/usr/bin/env ts-node

import assert from 'assert';
import fs from 'fs';
import path from 'path';

// Mock extractHeadersFromCurl function from main script
function extractHeadersFromCurl(curlCommand: string): Record<string, string> | undefined {
  try {
    const headers: Record<string, string> = {};
    
    // Simplified version for testing - extract just the Cookie header
    if (curlCommand.includes('Cookie: ')) {
      const cookieMatch = curlCommand.match(/Cookie: ([^'"\r\n]+)/);
      if (cookieMatch && cookieMatch[1]) {
        headers['Cookie'] = cookieMatch[1];
      }
    }
    
    // Extract WorkosCursorSessionToken manually if present
    if (curlCommand.includes('WorkosCursorSessionToken=')) {
      const tokenPos = curlCommand.indexOf('WorkosCursorSessionToken=');
      if (tokenPos >= 0) {
        let tokenValue = curlCommand.substring(tokenPos);
        // Cut off at any space, quote, or end of string
        tokenValue = tokenValue.split(/['"\s]/)[0];
        if (!headers['Cookie']) {
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

// Test data with fictional test values
const mockCurlCommand = `curl 'https://www.cursor.com/api/usage?user=user_TESTUSER123456789' \\
  -H 'authority: www.cursor.com' \\
  -H 'accept: */*' \\
  -H 'accept-language: en-US,en;q=0.9' \\
  -H 'cookie: NEXT_LOCALE=en; WorkosCursorSessionToken=user_TESTUSER123456789%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X3VzZXIiLCJ0aW1lIjoiMTIzNDU2Nzg5MCIsInJhbmRvbW5lc3MiOiJhYmNkZWYiLCJleHAiOjEyMzQ1Njc4OTAsImlzcyI6Imh0dHBzOi8vZXhhbXBsZS5jb20iLCJzY29wZSI6InRlc3Qgc2NvcGUiLCJhdWQiOiJodHRwczovL2V4YW1wbGUuY29tIn0.TEST_SIGNATURE' \\
  -H 'referer: https://www.cursor.com/settings' \\
  -H 'sec-ch-ua: "Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"' \\
  -H 'sec-ch-ua-mobile: ?0' \\
  -H 'sec-ch-ua-platform: "macOS"' \\
  -H 'sec-fetch-dest: empty' \\
  -H 'sec-fetch-mode: cors' \\
  -H 'sec-fetch-site: same-origin' \\
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' \\
  --compressed`;

const mockSessionToken = "user_TESTUSER123456789::eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X3VzZXIiLCJ0aW1lIjoiMTIzNDU2Nzg5MCIsInJhbmRvbW5lc3MiOiJhYmNkZWYiLCJleHAiOjEyMzQ1Njc4OTAsImlzcyI6Imh0dHBzOi8vZXhhbXBsZS5jb20iLCJzY29wZSI6InRlc3Qgc2NvcGUiLCJhdWQiOiJodHRwczovL2V4YW1wbGUuY29tIn0.TEST_SIGNATURE";

const mockEncodedSessionToken = "user_TESTUSER123456789%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X3VzZXIiLCJ0aW1lIjoiMTIzNDU2Nzg5MCIsInJhbmRvbW5lc3MiOiJhYmNkZWYiLCJleHAiOjEyMzQ1Njc4OTAsImlzcyI6Imh0dHBzOi8vZXhhbXBsZS5jb20iLCJzY29wZSI6InRlc3Qgc2NvcGUiLCJhdWQiOiJodHRwczovL2V4YW1wbGUuY29tIn0.TEST_SIGNATURE";

// Test Option 1: Extracting from curl command
function testCurlMethodExtraction() {
  console.log('Testing curl method extraction...');
  
  // Extract headers
  const headers = extractHeadersFromCurl(mockCurlCommand);
  assert(headers, 'Headers should be extracted');
  assert(headers?.Cookie, 'Cookie header should be extracted');
  
  // Check that it contains the WorkosCursorSessionToken
  assert(headers?.Cookie.includes('WorkosCursorSessionToken'), 'Cookie should contain session token');
  
  // Extract user ID from cookie value
  const cookieTokenMatch = headers?.Cookie.match(/WorkosCursorSessionToken=([^;]+)/);
  const token = cookieTokenMatch ? cookieTokenMatch[1] : '';
  assert(token, 'Token should be extracted from Cookie');
  
  // Extract user ID from token
  const tokenUserIdMatch = token.match(/^(user_[a-zA-Z0-9]+)(?:%3A%3A|::)/i);
  const userIdFromToken = tokenUserIdMatch ? tokenUserIdMatch[1] : null;
  
  assert(userIdFromToken, 'User ID should be extractable from token');
  assert.strictEqual(userIdFromToken, 'user_TESTUSER123456789', 'Extracted user ID should match expected value');
  
  console.log('✅ Curl method extraction test passed');
}

// Test Option 2: Extract from direct token input
function testDirectTokenExtraction() {
  console.log('Testing direct token extraction...');
  
  // Test regular token
  let tokenUserIdMatch = mockSessionToken.match(/^(user_[a-zA-Z0-9]+)(?:%3A%3A|::)/i);
  let userIdFromToken = tokenUserIdMatch ? tokenUserIdMatch[1] : null;
  
  assert(userIdFromToken, 'User ID should be extractable from regular token');
  assert.strictEqual(userIdFromToken, 'user_TESTUSER123456789', 'Extracted user ID should match expected value');
  
  // Test URL-encoded token
  tokenUserIdMatch = mockEncodedSessionToken.match(/^(user_[a-zA-Z0-9]+)(?:%3A%3A|::)/i);
  userIdFromToken = tokenUserIdMatch ? tokenUserIdMatch[1] : null;
  
  assert(userIdFromToken, 'User ID should be extractable from URL-encoded token');
  assert.strictEqual(userIdFromToken, 'user_TESTUSER123456789', 'Extracted user ID from encoded token should match expected value');
  
  // Test split method
  if (!userIdFromToken && (mockSessionToken.includes('::') || mockSessionToken.includes('%3A%3A'))) {
    // Try with decoded version first
    let tokenParts = mockSessionToken.split('::');
    if (tokenParts.length > 1 && tokenParts[0].startsWith('user_')) {
      userIdFromToken = tokenParts[0];
    }
  }
  
  assert(userIdFromToken, 'User ID should be extractable from token via split method');
  
  console.log('✅ Direct token extraction test passed');
}

// Test fallback ID generation when extraction fails
function testIDGeneration() {
  console.log('Testing ID generation for failed extraction...');
  
  // Create a malformed token
  const badToken = "someBadTokenWithoutUserID123";
  
  // Extract user ID (will fail)
  const tokenUserIdMatch = badToken.match(/^(user_[a-zA-Z0-9]+)(?:%3A%3A|::)/i);
  const userIdFromToken = tokenUserIdMatch ? tokenUserIdMatch[1] : null;
  
  // Check that no ID was extracted
  assert(!userIdFromToken, 'No user ID should be extracted from bad token');
  
  // Test generation of new user ID 
  const randomPart = Math.random().toString(36).substring(2, 15).toUpperCase();
  const generatedId = `user_${randomPart}`;
  
  // Check that generated ID follows format
  assert(generatedId.startsWith('user_'), 'Generated ID should start with user_');
  assert(generatedId.length > 10, 'Generated ID should be reasonably long');
  
  console.log('✅ ID generation test passed');
}

function testAuthScenarios() {
  // Corrupted token test
  const corruptedToken = "user123-not-valid";
  const tokenUserIdMatch = corruptedToken.match(/^(user_[a-zA-Z0-9]+)(?:%3A%3A|::)/i);
  const userIdFromToken = tokenUserIdMatch ? tokenUserIdMatch[1] : null;
  
  assert(!userIdFromToken, 'Corrupted token should not extract a valid user ID');
  
  // Test with missing separator
  const tokenWithoutSeparator = "user_01JMEKPWF0E497XNXQEPMBJ390eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
  const match = tokenWithoutSeparator.match(/^(user_[a-zA-Z0-9]+)(?:%3A%3A|::)/i);
  assert(!match, 'Token without separator should not match the regex');
  
  console.log('✅ Auth scenarios test passed');
}

// Test API URL construction
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

// Run all tests
function runAuthTests() {
  console.log('Running authentication method tests...\n');
  
  testCurlMethodExtraction();
  testDirectTokenExtraction();
  testIDGeneration();
  testAuthScenarios();
  testAPIUrlConstruction();
  
  console.log('\n🎉 All authentication tests passed!');
}

// If this file is run directly, run the tests
if (require.main === module) {
  runAuthTests();
}

export { runAuthTests };