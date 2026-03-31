#!/usr/bin/env bun
import { runEmailQueueTests } from './suites/email-queue.test';

console.log('🚀 Starting Email Queue Integration Tests\n');
console.log('Testing: Async email sending with BullMQ\n');

runEmailQueueTests()
  .then(() => {
    console.log('✅ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  });
