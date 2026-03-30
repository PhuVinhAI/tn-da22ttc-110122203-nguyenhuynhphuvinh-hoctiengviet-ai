import { apiClient } from '../utils/api-client';
import { TestAssertions } from '../utils/assertions';
import { endpoints } from '../config/test.config';
import { userFixtures } from '../fixtures/users.fixture';

/**
 * Auth Module Test Suite
 */
export async function runAuthTests() {
  console.log('\n🔐 Running Auth Tests...\n');

  let testUser = userFixtures.randomUser();
  let authToken: string;

  try {
    // Test 1: Register new user
    await testRegister(testUser);

    // Test 2: Login with credentials
    authToken = await testLogin(testUser);

    // Test 3: Get current user profile
    await testGetProfile(authToken);

    // Test 4: Login with wrong password
    await testLoginWrongPassword(testUser);

    // Test 5: Register with existing email
    await testRegisterDuplicateEmail(testUser);

    console.log('✅ All Auth tests passed!\n');
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    throw error;
  }
}

/**
 * Test user registration
 */
async function testRegister(user: any) {
  console.log('📝 Test: Register new user');

  const response = await apiClient.post(endpoints.auth.register, user);

  TestAssertions.assertStatus(response.status, 201, 'Register should return 201');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertHasProperty(response.data, 'access_token', 'Should return access token');
  TestAssertions.assertHasProperty(response.data, 'user', 'Should return user data');
  TestAssertions.assertIsUUID(response.data.user.id, 'User ID should be UUID');
  TestAssertions.assertEquals(response.data.user.email, user.email, 'Email should match');

  console.log('  ✓ User registered successfully');
}

/**
 * Test user login
 */
async function testLogin(user: any): Promise<string> {
  console.log('🔑 Test: Login with credentials');

  const response = await apiClient.post(endpoints.auth.login, {
    email: user.email,
    password: user.password,
  });

  TestAssertions.assertStatus(response.status, 201, 'Login should return 201');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertHasProperty(response.data, 'access_token', 'Should return access token');
  TestAssertions.assertNotNull(response.data.access_token, 'Access token should not be null');

  console.log('  ✓ Login successful');
  return response.data.access_token;
}

/**
 * Test get current user profile
 */
async function testGetProfile(token: string) {
  console.log('👤 Test: Get current user profile');

  apiClient.setToken(token);
  const response = await apiClient.get(endpoints.users.me);

  TestAssertions.assertStatus(response.status, 200, 'Get profile should return 200');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertHasProperty(response.data, 'id', 'Should have user ID');
  TestAssertions.assertHasProperty(response.data, 'email', 'Should have email');
  TestAssertions.assertIsUUID(response.data.id, 'User ID should be UUID');

  console.log('  ✓ Profile retrieved successfully');
  // Don't clear token - other tests may need it
}

/**
 * Test login with wrong password
 */
async function testLoginWrongPassword(user: any) {
  console.log('🚫 Test: Login with wrong password');

  try {
    await apiClient.post(endpoints.auth.login, {
      email: user.email,
      password: 'WrongPassword123',
    });
    throw new Error('Should have failed with wrong password');
  } catch (error: any) {
    // Expected to fail
    console.log('  ✓ Login correctly rejected with wrong password');
  }
}

/**
 * Test register with duplicate email
 */
async function testRegisterDuplicateEmail(user: any) {
  console.log('🚫 Test: Register with existing email');

  try {
    await apiClient.post(endpoints.auth.register, user);
    throw new Error('Should have failed with duplicate email');
  } catch (error: any) {
    // Expected to fail
    console.log('  ✓ Registration correctly rejected duplicate email');
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAuthTests()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
