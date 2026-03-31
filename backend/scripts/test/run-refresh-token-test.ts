#!/usr/bin/env bun
import { runRefreshTokenTests } from './suites/refresh-token.test';

console.log('🚀 Starting Refresh Token Integration Tests\n');
console.log('Testing: Token refresh, rotation, and logout\n');

runRefreshTokenTests()
  .then(() => {
    console.log('✅ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  });
