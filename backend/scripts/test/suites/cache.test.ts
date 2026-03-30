import { apiClient } from '../utils/api-client';
import { TestAssertions } from '../utils/assertions';
import { endpoints } from '../config/test.config';
import { userFixtures } from '../fixtures/users.fixture';

/**
 * Cache Module Test Suite
 */
export async function runCacheTests() {
  console.log('\n💾 Running Cache Tests...\n');

  let authToken: string;

  try {
    // Setup: Register and login (this will set token)
    const user = userFixtures.randomUser();
    const registerResponse = await apiClient.post(endpoints.auth.register, user);
    authToken = registerResponse.data.access_token;
    apiClient.setToken(authToken);
    // Token is set, ready for tests

    // Test 1: Get cache stats
    await testGetCacheStats(authToken);

    // Test 2: Clear cache
    await testClearCache(authToken);

    console.log('✅ All Cache tests passed!\n');
  } catch (error) {
    console.error('❌ Cache test failed:', error);
    throw error;
  }
}

/**
 * Test get cache stats
 */
async function testGetCacheStats(token: string) {
  console.log('📊 Test: Get cache stats');

  // Token already set in setup
  const response = await apiClient.get(endpoints.cache.stats);

  TestAssertions.assertStatus(response.status, 200, 'Get cache stats should return 200');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertHasProperty(response.data, 'type', 'Should have cache type');

  console.log('  ✓ Cache stats retrieved successfully');
}

/**
 * Test clear cache
 */
async function testClearCache(token: string) {
  console.log('🗑️ Test: Clear cache');

  // Token already set in setup
  const response = await apiClient.delete(endpoints.cache.clear);

  TestAssertions.assertStatus(response.status, 200, 'Clear cache should return 200');
  TestAssertions.assertHasData(response, 'Response should have data');

  console.log('  ✓ Cache cleared successfully');
}

// Run tests if executed directly
if (require.main === module) {
  runCacheTests()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
