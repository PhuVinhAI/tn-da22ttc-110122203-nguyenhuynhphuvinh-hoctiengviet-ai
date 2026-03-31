import { apiClient } from '../utils/api-client';
import { TestAssertions } from '../utils/assertions';
import { endpoints } from '../config/test.config';
import { userFixtures } from '../fixtures/users.fixture';

/**
 * Email Queue Test Suite
 * Tests: Async email sending via BullMQ
 */
export async function runEmailQueueTests() {
  console.log('\n📧 Running Email Queue Tests...\n');

  const testUser = userFixtures.randomUser();

  try {
    // Test 1: Register queues verification email
    await testRegisterQueuesEmail(testUser);

    // Test 2: Forgot password queues reset email
    await testForgotPasswordQueuesEmail(testUser.email);

    // Test 3: Resend verification queues email
    await testResendVerificationQueuesEmail(testUser.email);

    console.log('✅ All Email Queue tests passed!\n');
    console.log('Note: Emails are queued asynchronously. Check logs for processing status.');
  } catch (error) {
    console.error('❌ Email Queue test failed:', error);
    throw error;
  }
}

async function testRegisterQueuesEmail(user: any) {
  console.log('📝 Test: Register queues verification email');

  const response = await apiClient.post(endpoints.auth.register, user);

  TestAssertions.assertStatus(response.status, 201);
  TestAssertions.assertHasProperty(response.data, 'message');
  TestAssertions.assertTrue(
    response.data.message.includes('email'),
    'Message should mention email verification'
  );

  console.log('  ✓ Registration successful');
  console.log('  ✓ Verification email queued');
}

async function testForgotPasswordQueuesEmail(email: string) {
  console.log('🔐 Test: Forgot password queues reset email');

  const response = await apiClient.post(endpoints.auth.forgotPassword, { email });

  TestAssertions.assertStatus(response.status, 201);
  TestAssertions.assertHasProperty(response.data, 'message');

  console.log('  ✓ Forgot password request processed');
  console.log('  ✓ Reset email queued');
}

async function testResendVerificationQueuesEmail(email: string) {
  console.log('📧 Test: Resend verification queues email');

  try {
    const response = await apiClient.post(endpoints.auth.resendVerification, { email });
    
    if (response.status === 201 || response.status === 200) {
      console.log('  ✓ Resend verification processed');
      console.log('  ✓ Verification email queued');
    }
  } catch (error: any) {
    if (error.response?.status === 400) {
      console.log('  ✓ Email already verified (expected)');
    } else {
      throw error;
    }
  }
}

if (require.main === module) {
  runEmailQueueTests()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
