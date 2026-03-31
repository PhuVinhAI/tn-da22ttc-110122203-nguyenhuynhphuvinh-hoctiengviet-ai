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
import { runRbacTests } from './suites/rbac.test';
import { runSoftDeleteTests } from './suites/soft-delete.test';
import { runTransactionTests } from './suites/transactions.test';
import { runExerciseTypesTests } from './suites/exercise-types.test';
import { runFSRSTests } from './suites/fsrs.test';
import { runDialectTests } from './suites/dialect.test';
import { TestUsers } from './utils/test-users';

/**
 * Setup: Tạo admin user nếu chưa có
 */
async function setupAdminUser() {
  console.log('🔧 Setting up test environment...\n');
  
  try {
    await TestUsers.loginAdmin();
    console.log('✅ Admin user ready\n');
  } catch (error) {
    console.error('❌ Admin user not found!');
    console.log('\n📝 Please create admin user first:');
    console.log('   npm run admin:create');
    console.log('\n   Email: admin@linvnix.test');
    console.log('   Password: Admin123456!');
    console.log('   Full Name: Admin User\n');
    process.exit(1);
  }
}

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

  // Setup admin user
  await setupAdminUser();

  const startTime = Date.now();
  let passedSuites = 0;
  let failedSuites = 0;
  const results: { suite: string; status: string; error?: any }[] = [];

  // Test suites to run
  const testSuites = [
    { name: 'Security', fn: runSecurityTests }, // CRITICAL: Chạy đầu tiên
    { name: 'Auth', fn: runAuthTests },
    { name: 'RBAC', fn: runRbacTests },
    { name: 'Users', fn: runUsersTests },
    { name: 'FSRS Algorithm', fn: runFSRSTests }, // NEW: Test thuật toán FSRS
    { name: 'Courses', fn: runCoursesTests },
    { name: 'Contents', fn: runContentsTests },
    { name: 'Vocabularies', fn: runVocabulariesTests },
    { name: 'Dialect & Classifier', fn: runDialectTests }, // NEW: Test dialect system
    { name: 'Grammar', fn: runGrammarTests },
    { name: 'Exercises', fn: runExercisesTests },
    { name: 'Exercise Types (Strict Typing)', fn: runExerciseTypesTests },
    { name: 'Progress', fn: runProgressTests },
    { name: 'Transactions', fn: runTransactionTests },
    { name: 'Cache', fn: runCacheTests },
    { name: 'Soft Delete', fn: runSoftDeleteTests },
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
