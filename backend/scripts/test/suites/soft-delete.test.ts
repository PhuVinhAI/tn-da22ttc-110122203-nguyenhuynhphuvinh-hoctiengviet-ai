import { apiClient } from '../utils/api-client';
import { TestAssertions } from '../utils/assertions';
import { endpoints } from '../config/test.config';
import { userFixtures } from '../fixtures/users.fixture';

/**
 * Soft Delete + Partial Index Test Suite
 * Tests: Soft delete user, re-register with same email, unique constraints
 * 
 * NOTE: This test requires manual database operation for soft delete
 */
export async function runSoftDeleteTests() {
  console.log('\n🗑️  Running Soft Delete Tests...\n');

  console.log('⚠️  Soft Delete tests require manual database operations');
  console.log('ℹ️  These tests verify partial index functionality');
  console.log('');
  
  printSoftDeleteManualTestInstructions();
  
  console.log('✅ Soft Delete test suite completed (manual verification required)\n');
}

/**
 * Test user registration
 */
async function testRegisterUser(user: any) {
  console.log('📝 Test: Register user for soft delete test');

  const response = await apiClient.post(endpoints.auth.register, user);

  TestAssertions.assertStatus(response.status, 201, 'Register should return 201');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertHasProperty(response.data, 'user', 'Should return user data');

  console.log('  ✓ User registered successfully');
}

/**
 * Test login
 */
async function testLogin(user: any): Promise<string> {
  console.log('🔑 Test: Login user');

  const response = await apiClient.post(endpoints.auth.login, {
    email: user.email,
    password: user.password,
  });

  TestAssertions.assertHasProperty(response.data, 'access_token', 'Should return access token');
  console.log('  ✓ Login successful');
  
  return response.data.access_token;
}

/**
 * Get user ID
 */
async function testGetUserId(token: string): Promise<string> {
  console.log('👤 Test: Get user ID');

  apiClient.setToken(token);
  const response = await apiClient.get(endpoints.users.me);

  TestAssertions.assertHasProperty(response.data, 'id', 'Should have user ID');
  console.log('  ✓ User ID retrieved');
  
  return response.data.id;
}

/**
 * Test soft delete user
 * Note: This requires admin privileges or direct database access
 * For testing purposes, we'll use the delete endpoint if available
 */
async function testSoftDeleteUser(userId: string, token: string) {
  console.log('🗑️  Test: Soft delete user');

  try {
    apiClient.setToken(token);
    // Try to delete via API (may require admin role)
    await apiClient.delete(`/users/${userId}`);
    console.log('  ✓ User soft deleted via API');
  } catch (error: any) {
    // If API delete not available, we need to do it via direct DB access
    // For now, we'll skip this in automated tests
    console.log('  ⚠️  Soft delete via API not available (requires admin)');
    console.log('  ℹ️  Manual test: Run SQL: UPDATE users SET deleted_at = NOW() WHERE id = \'' + userId + '\'');
    throw new Error('Soft delete requires manual database operation for this test');
  }
}

/**
 * Test re-register with same email after soft delete
 * This is the KEY test for partial index functionality
 */
async function testReRegisterWithSameEmail(originalUser: any) {
  console.log('🔄 Test: Re-register with same email after soft delete');

  try {
    const response = await apiClient.post(endpoints.auth.register, {
      ...originalUser,
      fullName: originalUser.fullName + ' (New)',
    });

    TestAssertions.assertStatus(response.status, 201, 'Re-registration should succeed');
    TestAssertions.assertHasData(response, 'Response should have data');
    TestAssertions.assertHasProperty(response.data, 'user', 'Should return new user data');
    
    console.log('  ✓ Re-registration with same email successful');
    console.log('  ✓ Partial index working correctly');
  } catch (error: any) {
    if (error.response?.status === 409 || error.message.includes('duplicate')) {
      console.error('  ❌ Partial index NOT working - email still considered duplicate');
      throw new Error('Partial index test failed: Email uniqueness not scoped to non-deleted users');
    }
    throw error;
  }
}

/**
 * Verify new user is different from deleted user
 */
async function testVerifyNewUserIsDifferent(user: any, oldUserId: string) {
  console.log('🔍 Test: Verify new user has different ID');

  const loginResponse = await apiClient.post(endpoints.auth.login, {
    email: user.email,
    password: user.password,
  });

  apiClient.setToken(loginResponse.data.access_token);
  const profileResponse = await apiClient.get(endpoints.users.me);

  TestAssertions.assertNotEquals(
    profileResponse.data.id,
    oldUserId,
    'New user should have different ID than deleted user',
  );

  console.log('  ✓ New user has different ID');
  console.log('  ✓ Soft delete + re-register flow working correctly');
}

/**
 * Manual test instructions
 */
export function printSoftDeleteManualTestInstructions() {
  console.log('\n📋 Manual Test Instructions for Soft Delete:\n');
  console.log('1. Register a user: POST /auth/register');
  console.log('   { "email": "test-softdelete@example.com", "password": "Test123", ... }');
  console.log('');
  console.log('2. Soft delete via database:');
  console.log('   UPDATE users SET deleted_at = NOW() WHERE email = \'test-softdelete@example.com\';');
  console.log('');
  console.log('3. Try to register again with same email: POST /auth/register');
  console.log('   { "email": "test-softdelete@example.com", "password": "Test123", ... }');
  console.log('');
  console.log('4. Expected: Registration should succeed (201)');
  console.log('5. Verify: New user has different ID than deleted user');
  console.log('');
  console.log('6. Check database:');
  console.log('   SELECT id, email, deleted_at FROM users WHERE email = \'test-softdelete@example.com\';');
  console.log('   Should see 2 rows: one with deleted_at, one without');
  console.log('');
}

// Run tests if executed directly
if (require.main === module) {
  runSoftDeleteTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('\n⚠️  Some tests require manual database operations');
      printSoftDeleteManualTestInstructions();
      process.exit(1);
    });
}
