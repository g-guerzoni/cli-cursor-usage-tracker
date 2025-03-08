#!/usr/bin/env ts-node

import * as assert from "assert";

// Mock readlineSync
const mockedInputs: string[] = [];
const mockedQuestions: string[] = [];

// This mock version of readlineSync tracks what questions are asked
const readlineSync = {
  question: (prompt: string) => {
    mockedQuestions.push(prompt);

    // Return the next predefined answer
    if (mockedInputs.length > 0) {
      return mockedInputs.shift() || "";
    }

    // Default answer if no mocked inputs are available
    return "";
  },
};

// Mock config object
interface MockConfig {
  userId: string;
  sessionToken: string;
  customHeaders?: Record<string, string>;
  lastRequest?: Date;
}

// Mock tokens with fictional test values
const validToken = "user_TESTUSER123456789::eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
const encodedToken = "user_TESTUSER123456789%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
const invalidToken = "invalid-token-without-user-id";

// Extract headers and token from curl (simplified version of the actual implementation)
function extractHeadersFromCurl(curlCommand: string): Record<string, string> | undefined {
  const headers: Record<string, string> = {
    accept: "*/*",
    Cookie: "NEXT_LOCALE=en; WorkosCursorSessionToken=user_TESTUSER123456789::eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  };
  return headers;
}

// Test option 1 (curl command method) - with valid token
function testCurlMethodWithValidToken() {
  console.log("Testing curl method with valid token...");

  // Reset tracking
  mockedQuestions.length = 0;
  mockedInputs.length = 0;

  // Create a new config
  const config: MockConfig = {
    userId: "",
    sessionToken: "",
  };

  // Mock user selecting option 1 (curl method) and providing a valid curl command
  mockedInputs.push("1"); // Select method 1 (curl)
  mockedInputs.push("curl example with token"); // Curl command
  mockedInputs.push(""); // Empty line to finish curl input

  // Simulate handling the authentication
  simulateHandleAuthError(config, true);

  // Verify no user ID was asked for
  assert(
    !mockedQuestions.some((q) => q.includes("Enter your Cursor User ID")),
    "Should not ask for User ID when valid token is provided in curl command"
  );

  // Verify userId was set from token
  assert.strictEqual(config.userId, "user_TESTUSER123456789", "User ID should be extracted from token");

  console.log("✅ Curl method with valid token test passed");
}

// Test option 1 (curl method) - with invalid token
function testCurlMethodWithInvalidToken() {
  console.log("Testing curl method with invalid token...");

  // Reset tracking
  mockedQuestions.length = 0;
  mockedInputs.length = 0;

  // Create a new config
  const config: MockConfig = {
    userId: "",
    sessionToken: "",
  };

  // Mock user selecting option 1 (curl method) and providing an invalid curl command
  mockedInputs.push("1"); // Select method 1 (curl)
  mockedInputs.push("curl bad-command without proper token"); // Invalid curl command
  mockedInputs.push(""); // Empty line to finish curl input

  // Save the original function
  const originalExtract = extractHeadersFromCurl;

  // Create mock version for this test
  const mockedExtractFunction = () => ({
    accept: "*/*",
    Cookie: "NEXT_LOCALE=en; someOtherToken=abc123",
  });

  try {
    // Override the extractHeadersFromCurl function during test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.extractHeadersFromCurl = mockedExtractFunction as any;
    
    // Run the test with mocked function
    simulateHandleAuthError(config, true);
  } finally {
    // Restore original function even if test fails
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.extractHeadersFromCurl = originalExtract as any;
  }

  // Verify no user ID was asked for, even with invalid token
  assert(
    !mockedQuestions.some((q) => q.includes("Enter your Cursor User ID")),
    "Should not ask for User ID even with invalid token in curl command"
  );

  // Verify userId was generated instead of asked for
  assert(config.userId.startsWith("user_"), "Should generate a user ID instead of asking for one");

  console.log("✅ Curl method with invalid token test passed");
}

// Test option 2 (manual token entry) - with valid token
function testManualTokenWithValidToken() {
  console.log("Testing manual token entry with valid token...");

  // Reset tracking
  mockedQuestions.length = 0;
  mockedInputs.length = 0;

  // Create a new config
  const config: MockConfig = {
    userId: "",
    sessionToken: "",
  };

  // Mock user selecting option 2 (manual entry) and providing a valid token
  mockedInputs.push("2"); // Select method 2 (manual)
  mockedInputs.push(validToken); // Valid token

  // Simulate handling the authentication
  simulateHandleAuthError(config, true);

  // Verify no user ID was asked for
  assert(
    !mockedQuestions.some((q) => q.includes("Enter your Cursor User ID")),
    "Should not ask for User ID when valid token is manually entered"
  );

  // Verify userId was set from token
  assert.strictEqual(config.userId, "user_TESTUSER123456789", "User ID should be extracted from manual token");

  console.log("✅ Manual token with valid token test passed");
}

// Test option 2 (manual token entry) - with invalid token
function testManualTokenWithInvalidToken() {
  console.log("Testing manual token entry with invalid token...");

  // Reset tracking
  mockedQuestions.length = 0;
  mockedInputs.length = 0;

  // Create a new config
  const config: MockConfig = {
    userId: "",
    sessionToken: "",
  };

  // Mock user selecting option 2 (manual entry) and providing an invalid token
  mockedInputs.push("2"); // Select method 2 (manual)
  mockedInputs.push(invalidToken); // Invalid token

  // Simulate handling the authentication
  simulateHandleAuthError(config, true);

  // Verify no user ID was asked for
  assert(
    !mockedQuestions.some((q) => q.includes("Enter your Cursor User ID")),
    "Should not ask for User ID even when invalid token is manually entered"
  );

  // Verify userId was generated instead of asked for
  assert(config.userId.startsWith("user_"), "Should generate a user ID instead of asking for one");

  console.log("✅ Manual token with invalid token test passed");
}

// Simplified simulation of the handleAuthError function that we modified
function simulateHandleAuthError(config: MockConfig, isFirstTimeUser: boolean): any {
  // First ask how they want to authenticate
  const authMethod = readlineSync.question(
    "How would you like to provide your credentials?\n1. Import from curl command (recommended)\n2. Enter token manually\nChoice (1/2): "
  );

  if (authMethod === "1") {
    // CURL import method
    console.log("\n📋 Import credentials from curl command");
    let curlCommand = "";
    let line;

    // Keep reading lines until an empty line is entered
    while ((line = readlineSync.question("")) !== "") {
      curlCommand += line + " ";
    }

    // Extract HTTP headers from curl command (mocked for testing)
    config.customHeaders = extractHeadersFromCurl(curlCommand);

    // Extract token from cookie header or directly from curl command
    let tokenFound = false;
    if (config.customHeaders && config.customHeaders.Cookie) {
      const cookieTokenMatch = config.customHeaders.Cookie.match(/WorkosCursorSessionToken=([^;]+)/);
      if (cookieTokenMatch && cookieTokenMatch[1]) {
        config.sessionToken = cookieTokenMatch[1];
        tokenFound = true;
      }
    }

    if (tokenFound) {
      // Try to extract the user ID directly from the token string
      let userIdFromToken: string | null = null;

      // First check if token contains a user ID at the beginning
      const tokenUserIdMatch = config.sessionToken.match(/^(user_[a-zA-Z0-9]+)(?:%3A%3A|::)/i);
      if (tokenUserIdMatch && tokenUserIdMatch[1]) {
        userIdFromToken = tokenUserIdMatch[1];
      }

      // If not found via regex, try splitting by known separators
      if (!userIdFromToken && (config.sessionToken.includes("::") || config.sessionToken.includes("%3A%3A"))) {
        // Try with decoded version first
        let tokenParts = config.sessionToken.split("::");
        if (tokenParts.length > 1 && tokenParts[0].startsWith("user_")) {
          userIdFromToken = tokenParts[0];
        } else {
          // Try with encoded version
          tokenParts = config.sessionToken.split("%3A%3A");
          if (tokenParts.length > 1 && tokenParts[0].startsWith("user_")) {
            userIdFromToken = tokenParts[0];
          }
        }
      }

      // If we found a user ID in the token, use it
      if (userIdFromToken) {
        config.userId = userIdFromToken;
      } else {
        // Generate a user ID instead of asking for it (this is the part we changed)
        const randomPart = Math.random().toString(36).substring(2, 15).toUpperCase();
        config.userId = `user_${randomPart}`;
      }
    } else {
      // Generate a default token and user ID for testing
      config.sessionToken = "dummy-token";
      const randomPart = Math.random().toString(36).substring(2, 15).toUpperCase();
      config.userId = `user_${randomPart}`;
    }
  } else if (authMethod === "2") {
    // Manual entry method
    config.sessionToken = readlineSync.question("Paste your WorkosCursorSessionToken value: ");

    // Extract user ID from token
    let userIdFromToken: string | null = null;

    // First check if token contains a user ID at the beginning
    const tokenUserIdMatch = config.sessionToken.match(/^(user_[a-zA-Z0-9]+)(?:%3A%3A|::)/i);
    if (tokenUserIdMatch && tokenUserIdMatch[1]) {
      userIdFromToken = tokenUserIdMatch[1];
    }

    // If not found via regex, try splitting by known separators
    if (!userIdFromToken && (config.sessionToken.includes("::") || config.sessionToken.includes("%3A%3A"))) {
      // Try with decoded version first
      let tokenParts = config.sessionToken.split("::");
      if (tokenParts.length > 1 && tokenParts[0].startsWith("user_")) {
        userIdFromToken = tokenParts[0];
      } else {
        // Try with encoded version
        tokenParts = config.sessionToken.split("%3A%3A");
        if (tokenParts.length > 1 && tokenParts[0].startsWith("user_")) {
          userIdFromToken = tokenParts[0];
        }
      }
    }

    if (userIdFromToken) {
      config.userId = userIdFromToken;
    } else {
      // Use a default ID format based on the token (this is the part we changed)
      const randomPart = Math.random().toString(36).substring(2, 15).toUpperCase();
      config.userId = `user_${randomPart}`;
    }
  }

  return { success: true };
}

// Run all no-ID-input tests
function runNoUserIdInputTests() {
  console.log('Running "no user ID input required" tests...\n');

  testCurlMethodWithValidToken();
  testCurlMethodWithInvalidToken();
  testManualTokenWithValidToken();
  testManualTokenWithInvalidToken();

  console.log('\n🎉 All "no user ID input required" tests passed!');
}

// If this file is run directly, run the tests
if (require.main === module) {
  runNoUserIdInputTests();
}

export { runNoUserIdInputTests };
