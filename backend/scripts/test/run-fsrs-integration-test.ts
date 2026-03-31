#!/usr/bin/env bun

import { runFSRSIntegrationTests } from './suites/fsrs-integration.test';

/**
 * Run FSRS Integration Tests
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║          FSRS Integration Tests                            ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await runFSRSIntegrationTests();
    console.log('\n✅ All FSRS integration tests passed!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ FSRS integration tests failed:', error);
    process.exit(1);
  }
}

main();
