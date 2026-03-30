#!/usr/bin/env bun

import { runAuthTests } from './suites/auth.test';
import { runUsersTests } from './suites/users.test';
import { runCoursesTests } from './suites/courses.test';
import { runContentsTests } from './suites/contents.test';
import { runVocabulariesTests } from './suites/vocabularies.test';
import { runGrammarTests } from './suites/grammar.test';
import { runExercisesTests } from './suites/exercises.test';
import { runProgressTests } from './suites/progress.test';
import { runCacheTests } from './suites/cache.test';
import { runSecurityTests } from './suites/security.test';

/**
 * Run all test suites
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║          LinVNix Backend - Integration Tests               ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n🚀 Starting integration tests...\n');

  const startTime = Date.now();
  let passedSuites = 0;
  let failedSuites = 0;
  const results: { suite: string; status: string; error?: any }[] = [];

  // Test suites to run
  const testSuites = [
    { name: 'Security', fn: runSecurityTests }, // CRITICAL: Chạy đầu tiên
    { name: 'Auth', fn: runAuthTests },
    { name: 'Users', fn: runUsersTests },
    { name: 'Courses', fn: runCoursesTests },
    { name: 'Contents', fn: runContentsTests },
    { name: 'Vocabularies', fn: runVocabulariesTests },
    { name: 'Grammar', fn: runGrammarTests },
    { name: 'Exercises', fn: runExercisesTests },
    { name: 'Progress', fn: runProgressTests },
    { name: 'Cache', fn: runCacheTests },
  ];

  // Run each test suite
  for (const suite of testSuites) {
    try {
      await suite.fn();
      passedSuites++;
      results.push({ suite: suite.name, status: '✅ PASSED' });
    } catch (error) {
      failedSuites++;
      results.push({ suite: suite.name, status: '❌ FAILED', error });
      console.error(`\n❌ ${suite.name} suite failed:`, error);
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  results.forEach((result) => {
    console.log(`  ${result.status} ${result.suite}`);
  });

  console.log('\n' + '─'.repeat(60));
  console.log(`  Total Suites: ${testSuites.length}`);
  console.log(`  Passed: ${passedSuites}`);
  console.log(`  Failed: ${failedSuites}`);
  console.log(`  Duration: ${duration}s`);
  console.log('─'.repeat(60) + '\n');

  if (failedSuites > 0) {
    console.log('❌ Some tests failed. Please check the errors above.\n');
    process.exit(1);
  } else {
    console.log('✅ All tests passed successfully!\n');
    process.exit(0);
  }
}

// Run all tests
runAllTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
