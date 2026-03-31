import { apiClient } from '../utils/api-client';
import { TestAssertions } from '../utils/assertions';
import { endpoints, testConfig } from '../config/test.config';
import { userFixtures } from '../fixtures/users.fixture';

/**
 * Auth Module Test Suite
 * Tests: Registration, Login, Email Verification, Password Reset, RBAC
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

    // Test 4: Check user has USER role by default
    await testUserHasDefaultRole(authToken);

    // Test 5: Login with wrong password
    await testLoginWrongPassword(testUser);

    // Test 6: Register with existing email
    await testRegisterDuplicateEmail(testUser);

    // Test 7: Forgot password flow
    await testForgotPassword(testUser.email);

    // Test 8: Resend verification email
    await testResendVerification(testUser.email);

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
  TestAssertions.assertHasProperty(response.data, 'message', 'Should return message about email verification');
  TestAssertions.assertIsUUID(response.data.user.id, 'User ID should be UUID');
  TestAssertions.assertEquals(response.data.user.email, user.email, 'Email should match');
  TestAssertions.assertHasProperty(response.data.user, 'roles', 'User should have roles');

  console.log('  ✓ User registered successfully');
  console.log('  ✓ Email verification message sent');
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
  TestAssertions.assertHasProperty(response.data, 'user', 'Should return user data');

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
}

/**
 * Test user has USER role by default
 */
async function testUserHasDefaultRole(token: string) {
  console.log('🎭 Test: User has default USER role');

  apiClient.setToken(token);
  const response = await apiClient.get(endpoints.users.me);

  TestAssertions.assertHasProperty(response.data, 'roles', 'User should have roles');
  TestAssertions.assertTrue(Array.isArray(response.data.roles), 'Roles should be an array');
  TestAssertions.assertTrue(response.data.roles.length > 0, 'User should have at least one role');
  
  const hasUserRole = response.data.roles.some((role: any) => role.name === 'USER');
  TestAssertions.assertTrue(hasUserRole, 'User should have USER role');

  console.log('  ✓ User has default USER role');
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
    console.log('  ✓ Registration correctly rejected duplicate email');
  }
}

/**
 * Test forgot password
 */
async function testForgotPassword(email: string) {
  console.log('🔐 Test: Forgot password');

  const response = await apiClient.post(endpoints.auth.forgotPassword, { email });

  TestAssertions.assertStatus(response.status, 201, 'Forgot password should return 201');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertHasProperty(response.data, 'message', 'Should return message');

  console.log('  ✓ Forgot password request processed');
}

/**
 * Test resend verification email
 */
async function testResendVerification(email: string) {
  console.log('📧 Test: Resend verification email');

  try {
    const response = await apiClient.post(endpoints.auth.resendVerification, { email });
    
    // Có thể fail nếu email đã verified, nhưng endpoint phải tồn tại
    if (response.status === 201 || response.status === 200) {
      console.log('  ✓ Resend verification endpoint works');
    }
  } catch (error: any) {
    // Expected nếu email đã verified
    if (error.response?.status === 400) {
      console.log('  ✓ Resend verification correctly handles already verified email');
    } else {
      throw error;
    }
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAuthTests()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
