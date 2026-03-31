import { apiClient } from '../utils/api-client';
import { TestAssertions } from '../utils/assertions';
import { endpoints } from '../config/test.config';
import { userFixtures } from '../fixtures/users.fixture';

/**
 * Refresh Token Test Suite
 * Tests: Token refresh, token rotation, logout, expiration
 */
export async function runRefreshTokenTests() {
  console.log('\n🔄 Running Refresh Token Tests...\n');

  const testUser = userFixtures.randomUser();
  let accessToken: string;
  let refreshToken: string;

  try {
    // Test 1: Register returns both tokens
    ({ accessToken, refreshToken } = await testRegisterReturnsTokens(testUser));

    // Test 2: Login returns both tokens
    ({ accessToken, refreshToken } = await testLoginReturnsTokens(testUser));

    // Test 3: Access protected resource with access token
    await testAccessProtectedResource(accessToken);

    // Test 4: Refresh access token
    const newTokens = await testRefreshAccessToken(refreshToken);
    accessToken = newTokens.accessToken;
    const newRefreshToken = newTokens.refreshToken;

    // Test 5: Old refresh token is invalidated (token rotation)
    await testOldRefreshTokenInvalidated(refreshToken);

    // Test 6: Logout invalidates refresh token
    await testLogoutInvalidatesToken(accessToken, newRefreshToken);

    // Test 7: Cannot use refresh token after logout
    await testCannotUseTokenAfterLogout(newRefreshToken);

    console.log('✅ All Refresh Token tests passed!\n');
  } catch (error) {
    console.error('❌ Refresh Token test failed:', error);
    throw error;
  }
}

async function testRegisterReturnsTokens(user: any) {
  console.log('📝 Test: Register returns both access and refresh tokens');

  const response = await apiClient.post(endpoints.auth.register, user);

  TestAssertions.assertStatus(response.status, 201);
  TestAssertions.assertHasProperty(response.data, 'access_token');
  TestAssertions.assertHasProperty(response.data, 'refresh_token');
  TestAssertions.assertHasProperty(response.data, 'expires_in');
  TestAssertions.assertEquals(response.data.expires_in, 900); // 15 minutes

  console.log('  ✓ Register returns both tokens');
  console.log('  ✓ Access token expires in 15 minutes');

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
  };
}

async function testLoginReturnsTokens(user: any) {
  console.log('🔑 Test: Login returns both access and refresh tokens');

  const response = await apiClient.post(endpoints.auth.login, {
    email: user.email,
    password: user.password,
  });

  TestAssertions.assertStatus(response.status, 201);
  TestAssertions.assertHasProperty(response.data, 'access_token');
  TestAssertions.assertHasProperty(response.data, 'refresh_token');
  TestAssertions.assertHasProperty(response.data, 'expires_in');

  console.log('  ✓ Login returns both tokens');

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
  };
}

async function testAccessProtectedResource(accessToken: string) {
  console.log('🔒 Test: Access protected resource with access token');

  apiClient.setToken(accessToken);
  const response = await apiClient.get(endpoints.users.me);

  TestAssertions.assertStatus(response.status, 200);
  TestAssertions.assertHasData(response);

  console.log('  ✓ Access token works for protected resources');
}

async function testRefreshAccessToken(refreshToken: string) {
  console.log('🔄 Test: Refresh access token');

  apiClient.clearToken();
  const response = await apiClient.post('/auth/refresh', { refreshToken });

  TestAssertions.assertStatus(response.status, 201);
  TestAssertions.assertHasProperty(response.data, 'access_token');
  TestAssertions.assertHasProperty(response.data, 'refresh_token');
  TestAssertions.assertHasProperty(response.data, 'expires_in');

  console.log('  ✓ Refresh token returns new tokens');
  console.log('  ✓ Token rotation implemented');

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
  };
}

async function testOldRefreshTokenInvalidated(oldRefreshToken: string) {
  console.log('🚫 Test: Old refresh token is invalidated after refresh');

  try {
    await apiClient.post('/auth/refresh', { refreshToken: oldRefreshToken });
    throw new Error('Should have failed with old refresh token');
  } catch (error: any) {
    const status = error.response?.status;
    if (!status) {
      throw new Error(`Expected 401 status but got undefined. Error: ${error.message}`);
    }
    TestAssertions.assertEquals(status, 401);
    console.log('  ✓ Old refresh token correctly invalidated');
  }
}

async function testLogoutInvalidatesToken(accessToken: string, refreshToken: string) {
  console.log('🚪 Test: Logout invalidates refresh token');

  apiClient.setToken(accessToken);
  const response = await apiClient.post('/auth/logout', { refreshToken });

  TestAssertions.assertStatus(response.status, 201);
  TestAssertions.assertHasProperty(response.data, 'message');

  console.log('  ✓ Logout successful');
}

async function testCannotUseTokenAfterLogout(refreshToken: string) {
  console.log('🚫 Test: Cannot use refresh token after logout');

  try {
    apiClient.clearToken();
    await apiClient.post('/auth/refresh', { refreshToken });
    throw new Error('Should have failed with logged out refresh token');
  } catch (error: any) {
    const status = error.response?.status;
    if (!status) {
      throw new Error(`Expected 401 status but got undefined. Error: ${error.message}`);
    }
    TestAssertions.assertEquals(status, 401);
    console.log('  ✓ Refresh token correctly invalidated after logout');
  }
}

if (require.main === module) {
  runRefreshTokenTests()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
