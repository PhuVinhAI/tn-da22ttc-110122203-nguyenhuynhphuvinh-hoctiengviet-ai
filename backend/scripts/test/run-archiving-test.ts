#!/usr/bin/env bun
import { runArchivingTests } from './suites/archiving.test';

console.log('🚀 Starting Database Archiving Integration Tests\n');
console.log('Testing: Archive old data, partitioning, cleanup\n');

runArchivingTests()
  .then(() => {
    console.log('✅ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  });
