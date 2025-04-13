import readlineSync from "readline-sync";
import { CursorConfig } from "../types/index.js";
import { extractHeadersFromCurl } from "../api/headers.js";
import { fetchCursorData } from "../api/service.js";
import { saveConfig } from "./fileUtils.js";
import { displayUsageSummary } from "../display/index.js";

export async function handleAuthError(config: CursorConfig, isFirstTimeUser: boolean): Promise<any> {
  if (isFirstTimeUser) {
    console.log("\n🌟 Welcome to Cursor Usage Tracker! 🌟");
    console.log("To get started, you'll need to provide your Cursor credentials.\n");
  } else {
    console.log("\n⚠️ Your Cursor session has expired. You need to provide updated credentials.\n");
  }

  let authMethod = "";

  while (authMethod !== "1" && authMethod !== "2") {
    console.log("How would you like to provide your credentials?");
    console.log("1. Import from curl command (recommended)");
    console.log("2. Enter token manually");

    authMethod = readlineSync.keyIn("Choice (1/2): ", {
      limit: "12",
      hideEchoBack: false,
    });

    if (authMethod !== "1" && authMethod !== "2") {
      console.log("Invalid option. Please select 1 or 2.");
    }
  }

  if (authMethod === "1") {
    console.log("\n📋 Import credentials from curl command");
    console.log("\x1b[1;33mInstructions:\x1b[0m");
    console.log("1. Paste the full curl command (Ctrl+V on Windows/Linux or Cmd+V on Mac)");
    console.log("2. Press Enter when done");
    console.log("3. Ignore any leftover text from your curl command that might appear");

    console.log("\n\x1b[1;33mPaste curl command now:\x1b[0m");

    // Just read the input once - if data is large, it may overflow into multiple lines
    // but we'll still capture it all in one read
    let curlCommandInput = readlineSync.question("", {
      hideEchoBack: false,
      encoding: "utf8"
    });

    // Clean up the input
    const curlCommand = curlCommandInput.replace(/\\\s*/g, "");

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }

    config.customHeaders = extractHeadersFromCurl(curlCommand);

    let tokenFound = false;
    if (config.customHeaders && config.customHeaders.Cookie) {
      const cookieTokenMatch = config.customHeaders.Cookie.match(/WorkosCursorSessionToken=([^;]+)/);
      if (cookieTokenMatch && cookieTokenMatch[1]) {
        config.sessionToken = decodeURIComponent(cookieTokenMatch[1]);
        tokenFound = true;
      }
    }

    if (!tokenFound) {
      const tokenMatch = curlCommand.match(/WorkosCursorSessionToken=([^'"\s;]+)/);
      if (tokenMatch && tokenMatch[1]) {
        config.sessionToken = decodeURIComponent(tokenMatch[1]);
        tokenFound = true;
      }
    }

    if (tokenFound) {
      let userIdFromToken = null;

      const tokenUserIdMatch = config.sessionToken.match(/^(user_[a-zA-Z0-9]+)(?:%3A%3A|::)/i);
      if (tokenUserIdMatch && tokenUserIdMatch[1]) {
        userIdFromToken = tokenUserIdMatch[1];
      }

      if (!userIdFromToken && (config.sessionToken.includes("::") || config.sessionToken.includes("%3A%3A"))) {
        let tokenParts = config.sessionToken.split("::");
        if (tokenParts.length > 1 && tokenParts[0].startsWith("user_")) {
          userIdFromToken = tokenParts[0];
        } else {
          tokenParts = config.sessionToken.split("%3A%3A");
          if (tokenParts.length > 1 && tokenParts[0].startsWith("user_")) {
            userIdFromToken = tokenParts[0];
          }
        }
      }

      if (userIdFromToken) {
        config.userId = userIdFromToken;
        console.log(`✅ Successfully extracted User ID from token: ${config.userId}`);
      } else {
        const userIdMatch = curlCommand.match(/user=([^'"\s&]+)/);
        if (userIdMatch && userIdMatch[1] && userIdMatch[1].startsWith("user_")) {
          config.userId = userIdMatch[1];
          console.log(`✅ Successfully extracted User ID from URL: ${config.userId}`);
        } else {
          const randomPart = Math.random().toString(36).substring(2, 15).toUpperCase();
          config.userId = `user_${randomPart}`;
          console.log(`⚠️ Could not extract User ID from curl command, using generated ID: ${config.userId}`);
          console.log("Note: This is unusual and may affect API functionality.");
        }
      }

      if (!config.customHeaders || Object.keys(config.customHeaders).length === 0) {
        console.log("⚠️ Could not extract browser headers from curl. Using default compatibility headers.");

        config.customHeaders = {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          referer: "https://www.cursor.com/settings",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36",
        };
      } else {
        console.log("✅ Successfully extracted browser headers for compatibility");
      }

      console.log("✅ Successfully extracted session token");
    } else {
      console.error("❌ Could not extract session token from curl command");
      return handleAuthError(config, isFirstTimeUser);
    }
  } else if (authMethod === "2") {
    console.log("\n🔑 Manual credential entry");

    console.log("\n🔐 We need your Cursor session token.");
    console.log("You can find this in the Cookie header of the API request as WorkosCursorSessionToken.");
    console.log("It's a long string that contains your user ID followed by encoded characters.");
    console.log(
      "\n💡 TIP: You can paste the entire cookie or the entire curl command, and we'll extract the token for you.\n"
    );

    console.log("\x1b[1;33mInstructions:\x1b[0m");
    console.log("1. Paste your token or curl command (Ctrl+V on Windows/Linux or Cmd+V on Mac)");
    console.log("2. Press Enter when done");
    console.log("3. Ignore any leftover text that might appear");

    console.log("\n\x1b[1;33mPaste token now:\x1b[0m");

    // Just read the input once
    const rawInput = readlineSync.question("", {
      hideEchoBack: false,
      encoding: "utf8"
    });

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }

    let sessionToken = "";
    const tokenMatch = rawInput.match(/WorkosCursorSessionToken=([^;'\"\s]+)/);
    if (tokenMatch && tokenMatch[1]) {
      sessionToken = decodeURIComponent(tokenMatch[1]);
    } else {
      sessionToken = rawInput.replace(/[\r\n]/g, "").trim();
    }

    config.sessionToken = sessionToken;

    while (!config.sessionToken || config.sessionToken.length < 20) {
      console.log("⚠️ That doesn't look like a valid session token. It should be a long string.");
      console.log("\x1b[1;33mInstructions:\x1b[0m");
      console.log("1. Paste your token or curl command (Ctrl+V on Windows/Linux or Cmd+V on Mac)");
      console.log("2. Press Enter when done");
      console.log("3. Ignore any leftover text that might appear");

      console.log("\n\x1b[1;33mPaste token now:\x1b[0m");

      // Just read the input once 
      const newInput = readlineSync.question("", {
        hideEchoBack: false,
        encoding: "utf8"
      });

      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setRawMode(false);
        process.stdin.pause();
      }

      const newTokenMatch = newInput.match(/WorkosCursorSessionToken=([^;'\"\s]+)/);
      if (newTokenMatch && newTokenMatch[1]) {
        config.sessionToken = decodeURIComponent(newTokenMatch[1]);
      } else {
        config.sessionToken = newInput.replace(/[\r\n]/g, "").trim();
      }
    }

    let userIdFromToken = null;

    const tokenUserIdMatch = config.sessionToken.match(/^(user_[a-zA-Z0-9]+)(?:%3A%3A|::)/i);
    if (tokenUserIdMatch && tokenUserIdMatch[1]) {
      userIdFromToken = tokenUserIdMatch[1];
    }

    if (!userIdFromToken && (config.sessionToken.includes("::") || config.sessionToken.includes("%3A%3A"))) {
      let tokenParts = config.sessionToken.split("::");
      if (tokenParts.length > 1 && tokenParts[0].startsWith("user_")) {
        userIdFromToken = tokenParts[0];
      } else {
        tokenParts = config.sessionToken.split("%3A%3A");
        if (tokenParts.length > 1 && tokenParts[0].startsWith("user_")) {
          userIdFromToken = tokenParts[0];
        }
      }
    }

    if (userIdFromToken) {
      config.userId = userIdFromToken;
      console.log(`✅ Successfully extracted User ID from token: ${config.userId}`);
    } else {
      const randomPart = Math.random().toString(36).substring(2, 15).toUpperCase();
      config.userId = `user_${randomPart}`;
      console.log(`⚠️ Could not extract User ID from token, using generated ID: ${config.userId}`);
      console.log("Note: This is unusual and may affect API functionality.");
    }
  } else {
    console.error("Invalid option. Please select 1 or 2.");
    return handleAuthError(config, isFirstTimeUser);
  }

  saveConfig(config);

  // Ask user to confirm before fetching data
  console.log("\n✅ Credentials saved successfully!");
  console.log("\n\x1b[1;33mPress Enter to fetch your usage data from Cursor\x1b[0m");
  readlineSync.question("", { hideEchoBack: true });
  
  try {
    console.log("\n🔄 Fetching your usage data from Cursor...");
    const data = await fetchCursorData(config);

    displayUsageSummary(data);

    setTimeout(() => {
      process.exit(0);
    }, 100);

    return data;
  } catch (error) {
    console.error("\n❌ Failed to fetch data with the provided credentials.");
    console.error("Please check your User ID and session token and try again.");
    return null;
  }
}
