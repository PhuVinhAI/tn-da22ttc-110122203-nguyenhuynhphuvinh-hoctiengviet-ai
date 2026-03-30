import { apiClient } from '../utils/api-client';
import { TestAssertions } from '../utils/assertions';
import { endpoints } from '../config/test.config';
import { userFixtures } from '../fixtures/users.fixture';
import { courseFixtures, unitFixtures, lessonFixtures } from '../fixtures/courses.fixture';

/**
 * Progress Module Test Suite
 */
export async function runProgressTests() {
  console.log('\n📊 Running Progress Tests...\n');

  let authToken: string;
  let lessonId: string;

  try {
    // Setup: Create course structure (this will set token)
    const setup = await setupCourseStructure();
    authToken = setup.token;
    lessonId = setup.lessonId;
    // Token is already set in setupCourseStructure, no need to set again

    // Test 1: Start lesson
    await testStartLesson(authToken, lessonId);

    // Test 2: Get progress by lesson
    await testGetProgressByLesson(authToken, lessonId);

    // Test 3: Update time spent
    await testUpdateTimeSpent(authToken, lessonId);

    // Test 4: Complete lesson
    await testCompleteLesson(authToken, lessonId);

    // Test 5: Get all progress
    await testGetAllProgress(authToken);

    console.log('✅ All Progress tests passed!\n');
  } catch (error) {
    console.error('❌ Progress test failed:', error);
    throw error;
  }
}

/**
 * Setup course structure
 */
async function setupCourseStructure() {
  // Register user
  const user = userFixtures.randomUser();
  const authResponse = await apiClient.post(endpoints.auth.register, user);
  const token = authResponse.data.access_token;

  apiClient.setToken(token);

  // Create course
  const course = courseFixtures.beginnerCourse;
  const courseResponse = await apiClient.post(endpoints.courses.create, course);
  const courseId = courseResponse.data.id;

  // Create unit
  const unit = unitFixtures.greetingsUnit(courseId);
  const unitResponse = await apiClient.post('/units', unit);
  const unitId = unitResponse.data.id;

  // Create lesson
  const lesson = lessonFixtures.vocabularyLesson(unitId);
  const lessonResponse = await apiClient.post('/lessons', lesson);
  const lessonId = lessonResponse.data.id;

  return { token, lessonId };
}

/**
 * Test start lesson
 */
async function testStartLesson(token: string, lessonId: string) {
  console.log('▶️ Test: Start lesson');

  // Token already set in setup
  const response = await apiClient.post(endpoints.progress.start(lessonId));

  TestAssertions.assertStatus(response.status, 201, 'Start lesson should return 201');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertHasProperty(response.data, 'status', 'Should have status');
  TestAssertions.assertEquals(
    response.data.status,
    'in_progress',
    'Status should be in_progress',
  );

  console.log('  ✓ Lesson started successfully');
}

/**
 * Test get progress by lesson
 */
async function testGetProgressByLesson(token: string, lessonId: string) {
  console.log('🔍 Test: Get progress by lesson');

  // Token already set in setup
  const response = await apiClient.get(endpoints.progress.byLesson(lessonId));

  TestAssertions.assertStatus(response.status, 200, 'Get progress should return 200');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertHasProperty(response.data, 'lessonId', 'Should have lessonId');
  TestAssertions.assertEquals(response.data.lessonId, lessonId, 'Lesson ID should match');

  console.log('  ✓ Progress retrieved successfully');
}

/**
 * Test update time spent
 */
async function testUpdateTimeSpent(token: string, lessonId: string) {
  console.log('⏱️ Test: Update time spent');

  // Token already set in setup
  const updateData = {
    timeSpent: 300, // 5 minutes
  };
  const response = await apiClient.patch(
    endpoints.progress.updateTime(lessonId),
    updateData,
  );

  TestAssertions.assertStatus(response.status, 200, 'Update time should return 200');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertHasProperty(response.data, 'timeSpent', 'Should have timeSpent');

  console.log('  ✓ Time spent updated successfully');
}

/**
 * Test complete lesson
 */
async function testCompleteLesson(token: string, lessonId: string) {
  console.log('✅ Test: Complete lesson');

  // Token already set in setup
  const completeData = {
    score: 85,
  };
  const response = await apiClient.post(
    endpoints.progress.complete(lessonId),
    completeData,
  );

  TestAssertions.assertStatus(response.status, 201, 'Complete lesson should return 201');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertHasProperty(response.data, 'status', 'Should have status');
  TestAssertions.assertEquals(
    response.data.status,
    'completed',
    'Status should be completed',
  );
  TestAssertions.assertHasProperty(response.data, 'completedAt', 'Should have completedAt');

  console.log('  ✓ Lesson completed successfully');
}

/**
 * Test get all progress
 */
async function testGetAllProgress(token: string) {
  console.log('📚 Test: Get all progress');

  // Token already set in setup
  const response = await apiClient.get(endpoints.progress.list);

  TestAssertions.assertStatus(response.status, 200, 'Get all progress should return 200');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertArrayNotEmpty(response.data, 'Should have at least one progress');

  console.log('  ✓ All progress retrieved successfully');
}

// Run tests if executed directly
if (require.main === module) {
  runProgressTests()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
