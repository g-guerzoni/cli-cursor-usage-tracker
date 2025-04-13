#!/usr/bin/env node

async function importAndRunTests() {
  try {
    const indexTest = await import("./index.test.js");
    const displayTest = await import("./display.test.js");
    const authTest = await import("./auth-methods.test.js");
    const noUserIdTest = await import("./no-user-id-input.test.js");

    return {
      runAllTests: indexTest.runAllTests,
      runDisplayTests: displayTest.runDisplayTests,
      runAuthTests: authTest.runAuthTests,
      runNoUserIdInputTests: noUserIdTest.runNoUserIdInputTests,
    };
  } catch (error) {
    console.error("Error importing test modules:", error);
    process.exit(1);
  }
}

async function main() {
  console.log("======================================");
  console.log("Running Cursor Usage Tracker Tests");
  console.log("======================================\n");

  const { runAllTests, runDisplayTests, runAuthTests, runNoUserIdInputTests } = await importAndRunTests();

  runAllTests();
  console.log("\n");
  runDisplayTests();
  console.log("\n");
  runAuthTests();
  console.log("\n");
  runNoUserIdInputTests();

  console.log("\n======================================");
  console.log("🎉 All tests completed successfully!");
  console.log("======================================");
}

main().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
