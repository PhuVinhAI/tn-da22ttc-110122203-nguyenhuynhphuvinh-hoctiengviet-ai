#!/usr/bin/env bun

import { runFSRSTests } from './suites/fsrs.test';

/**
 * Run FSRS Algorithm Tests
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║          FSRS Algorithm Unit Tests                         ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await runFSRSTests();
    console.log('\n✅ All FSRS tests passed!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ FSRS tests failed:', error);
    process.exit(1);
  }
}

main();
