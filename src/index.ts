#!/usr/bin/env node

import fs from "fs";
import { loadConfig, cleanLocalFiles } from "./utils/fileUtils.js";
import { handleAuthError } from "./utils/auth.js";
import { fetchCursorData } from "./api/service.js";
import { displayUsageSummary } from "./display/index.js";
import { CONFIG_FILE } from "./config/constants.js";

function clearStdinBuffer() {
  if (process.stdin.isTTY) {
    try {
      process.stdin.setRawMode(true);
      process.stdin.resume();

      process.stdin.read();

      process.stdin.setRawMode(false);
      process.stdin.pause();

      process.stdin.removeAllListeners();
    } catch (error) {}
  }
}

async function main() {
  if (process.argv.includes("--clean")) {
    cleanLocalFiles();
    return;
  }

  const config = loadConfig();

  try {
    if (config.userId && config.sessionToken) {
      try {
        console.log("🔄 Fetching your usage data from Cursor...");
        const data = await fetchCursorData(config);
        clearStdinBuffer();
        console.log("\n✅ Successfully fetched your data!\n");
        displayUsageSummary(data);

        setTimeout(() => {
          process.exit(0);
        }, 100);
      } catch (fetchError: any) {
        if (
          fetchError.message &&
          (fetchError.message.includes("Authentication failed") ||
            fetchError.message.includes("API error: 401") ||
            fetchError.message.includes("API error: 403"))
        ) {
          console.error("❌ Invalid credentials detected in config file");
          console.log("🔄 Deleting invalid config and restarting authentication...");

          try {
            fs.unlinkSync(CONFIG_FILE);
          } catch (deleteError) {
            console.error("Failed to delete invalid config file:", deleteError);
          }

          const newConfig = {
            userId: "",
            sessionToken: "",
          };

          const result = await handleAuthError(newConfig, false);

          if (!result) {
            console.error("❌ Could not display your usage data. Please try again with correct credentials.");
            process.exit(1);
          }
        } else {
          throw fetchError;
        }
      }
    } else {
      console.log("No credentials found. You need to provide your Cursor credentials.");
      const result = await handleAuthError(config, true);

      if (!result) {
        console.error("❌ Could not display your usage data. Please try again with correct credentials.");
        process.exit(1);
      }
    }
  } catch (error) {
    console.error("❌ Script execution failed");
    console.error("Could not fetch usage data. Please check your internet connection and credentials.");
    process.exit(1);
  }
}

main();
