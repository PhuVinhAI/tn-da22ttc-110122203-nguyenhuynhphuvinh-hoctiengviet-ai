/**
 * Security Test Suite
 * Kiểm tra các vấn đề bảo mật quan trọng
 */

import { apiClient } from '../utils/api-client';
import { TestAssertions } from '../utils/assertions';
import { endpoints } from '../config/test.config';

export async function runSecurityTests() {
  console.log('\n🔒 Running Security Tests...\n');

  await testPasswordNotExposedInRegister();
  await testPasswordNotExposedInLogin();
  await testPasswordNotExposedInProfile();

  console.log('✅ All security tests passed!\n');
}

/**
 * Test: Password hash không được trả về khi register
 */
async function testPasswordNotExposedInRegister() {
  console.log('Testing: Password not exposed in register response');

  const uniqueEmail = `security-test-${Date.now()}@test.com`;
  const response = await apiClient.post(endpoints.auth.register, {
    email: uniqueEmail,
    password: 'TestPassword123!',
    fullName: 'Security Test User',
    nativeLanguage: 'English',
  });

  TestAssertions.assertStatus(response.status, 201, 'Register should return 201');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertHasProperty(response.data, 'user', 'Should have user object');
  TestAssertions.assertEquals(response.data.user.email, uniqueEmail, 'Email should match');
  
  // CRITICAL: Password và password hash KHÔNG được trả về
  if ('password' in response.data.user) {
    throw new Error('🚨 SECURITY BREACH: Password hash exposed in register response!');
  }

  console.log('✓ Password not exposed in register');
}

/**
 * Test: Password hash không được trả về khi login
 */
async function testPasswordNotExposedInLogin() {
  console.log('Testing: Password not exposed in login response');

  // Tạo user mới
  const uniqueEmail = `security-login-${Date.now()}@test.com`;
  await apiClient.post(endpoints.auth.register, {
    email: uniqueEmail,
    password: 'TestPassword123!',
    fullName: 'Security Login Test',
    nativeLanguage: 'English',
  });

  // Login
  const response = await apiClient.post(endpoints.auth.login, {
    email: uniqueEmail,
    password: 'TestPassword123!',
  });

  TestAssertions.assertStatus(response.status, 201, 'Login should return 201');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertHasProperty(response.data, 'user', 'Should have user object');
  
  // CRITICAL: Password hash KHÔNG được trả về
  if ('password' in response.data.user) {
    throw new Error('🚨 SECURITY BREACH: Password hash exposed in login response!');
  }

  console.log('✓ Password not exposed in login');
}

/**
 * Test: Password hash không được trả về khi lấy profile
 */
async function testPasswordNotExposedInProfile() {
  console.log('Testing: Password not exposed in profile response');

  // Tạo user và login
  const uniqueEmail = `security-profile-${Date.now()}@test.com`;
  const registerResponse = await apiClient.post(endpoints.auth.register, {
    email: uniqueEmail,
    password: 'TestPassword123!',
    fullName: 'Security Profile Test',
    nativeLanguage: 'English',
  });

  const token = registerResponse.data.access_token;
  apiClient.setToken(token);

  // Lấy profile
  const response = await apiClient.get(endpoints.users.me);

  TestAssertions.assertStatus(response.status, 200, 'Get profile should return 200');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertEquals(response.data.email, uniqueEmail, 'Email should match');
  
  // CRITICAL: Password hash KHÔNG được trả về
  if ('password' in response.data) {
    throw new Error('🚨 SECURITY BREACH: Password hash exposed in profile response!');
  }

  console.log('✓ Password not exposed in profile');
  // Don't clear token - other tests may need it
}

// Run if called directly
if (require.main === module) {
  runSecurityTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Security tests failed:', error.message);
      process.exit(1);
    });
}
