#!/usr/bin/env ts-node

import { runDialectTests } from './suites/dialect.test';

async function main() {
  console.log('Starting Dialect & Classifier System Tests...\n');

  const success = await runDialectTests();

  if (success) {
    console.log('\n✅ All tests passed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
