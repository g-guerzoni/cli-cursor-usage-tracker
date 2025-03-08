#!/usr/bin/env ts-node

import { runAllTests } from './index.test';
import { runDisplayTests } from './display.test';
import { runAuthTests } from './auth-methods.test';
import { runNoUserIdInputTests } from './no-user-id-input.test';

// Run all tests
console.log('======================================');
console.log('Running Cursor Usage Tracker Tests');
console.log('======================================\n');

runAllTests();
console.log('\n');
runDisplayTests();
console.log('\n');
runAuthTests();
console.log('\n');
runNoUserIdInputTests();

console.log('\n======================================');
console.log('🎉 All tests completed successfully!');
console.log('======================================');