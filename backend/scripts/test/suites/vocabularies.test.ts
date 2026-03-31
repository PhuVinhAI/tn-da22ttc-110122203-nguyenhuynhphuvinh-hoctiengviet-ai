import { apiClient } from '../utils/api-client';
import { TestAssertions } from '../utils/assertions';
import { endpoints } from '../config/test.config';
import { TestUsers } from '../utils/test-users';
import { courseFixtures, unitFixtures, lessonFixtures } from '../fixtures/courses.fixture';
import { vocabularyFixtures } from '../fixtures/vocabularies.fixture';

/**
 * Vocabularies Module Test Suite
 */
export async function runVocabulariesTests() {
  console.log('\n📖 Running Vocabularies Tests...\n');

  let adminToken: string;
  let userToken: string;
  let lessonId: string;
  let vocabId: string;

  try {
    // Setup: Create course structure với admin token
    const setup = await setupCourseStructure();
    adminToken = setup.adminToken;
    userToken = setup.userToken;
    lessonId = setup.lessonId;

    // Test 1: Create vocabulary (admin)
    vocabId = await testCreateVocabulary(adminToken, lessonId);

    // Test 2: Get vocabularies by lesson (user)
    await testGetVocabulariesByLesson(userToken, lessonId);

    // Test 3: Learn vocabulary (user)
    await testLearnVocabulary(userToken, vocabId);

    // Test 4: Get my vocabularies (user)
    await testGetMyVocabularies(userToken);

    // Test 5: Review vocabulary (user)
    await testReviewVocabulary(userToken, vocabId);

    // Test 6: Get due for review (user)
    await testGetDueForReview(userToken);

    // Test 7: Create another vocabulary for update/delete tests (admin)
    const vocabId2 = await testCreateVocabulary(adminToken, lessonId);

    // Test 8: Update vocabulary (admin)
    await testUpdateVocabulary(adminToken, vocabId2);

    // Test 9: Delete vocabulary (admin)
    await testDeleteVocabulary(adminToken, vocabId2);

    console.log('✅ All Vocabularies tests passed!\n');
  } catch (error) {
    console.error('❌ Vocabularies test failed:', error);
    throw error;
  }
}

/**
 * Setup course structure
 */
async function setupCourseStructure() {
  // Login admin để tạo course structure
  const admin = await TestUsers.loginAdmin();
  apiClient.setToken(admin.token);

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

  // Tạo normal user để test user operations
  const user = await TestUsers.createUser();

  return { adminToken: admin.token, userToken: user.token, lessonId };
}

/**
 * Test create vocabulary
 */
async function testCreateVocabulary(token: string, lessonId: string): Promise<string> {
  console.log('📝 Test: Create vocabulary');

  apiClient.setToken(token);
  const vocab = vocabularyFixtures.hello(lessonId);
  const response = await apiClient.post('/vocabularies', vocab);

  TestAssertions.assertStatus(response.status, 201, 'Create vocabulary should return 201');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertIsUUID(response.data.id, 'Vocabulary ID should be UUID');
  TestAssertions.assertEquals(response.data.word, vocab.word, 'Word should match');

  console.log('  ✓ Vocabulary created successfully');
  return response.data.id;
}

/**
 * Test get vocabularies by lesson
 */
async function testGetVocabulariesByLesson(token: string, lessonId: string) {
  console.log('📖 Test: Get vocabularies by lesson');

  apiClient.setToken(token);
  const response = await apiClient.get(endpoints.vocabularies.byLesson(lessonId));

  TestAssertions.assertStatus(response.status, 200, 'Get vocabularies should return 200');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertArrayNotEmpty(response.data, 'Should have at least one vocabulary');

  console.log('  ✓ Vocabularies retrieved successfully');
}

/**
 * Test learn vocabulary
 */
async function testLearnVocabulary(token: string, vocabId: string) {
  console.log('🎓 Test: Learn vocabulary');

  apiClient.setToken(token);
  const response = await apiClient.post(endpoints.vocabularies.learn(vocabId));

  TestAssertions.assertStatus(response.status, 201, 'Learn vocabulary should return 201');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertHasProperty(response.data, 'masteryLevel', 'Should have mastery level');
  TestAssertions.assertEquals(
    response.data.masteryLevel,
    'learning',
    'Initial mastery should be learning',
  );

  console.log('  ✓ Vocabulary learned successfully');
}

/**
 * Test get my vocabularies
 */
async function testGetMyVocabularies(token: string) {
  console.log('📚 Test: Get my vocabularies');

  apiClient.setToken(token);
  const response = await apiClient.get(endpoints.vocabularies.myVocabularies);

  TestAssertions.assertStatus(response.status, 200, 'Get my vocabularies should return 200');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertArrayNotEmpty(response.data, 'Should have at least one vocabulary');

  console.log('  ✓ My vocabularies retrieved successfully');
}

/**
 * Test review vocabulary
 */
async function testReviewVocabulary(token: string, vocabId: string) {
  console.log('🔄 Test: Review vocabulary');

  apiClient.setToken(token);
  const reviewData = {
    rating: 3, // Good rating (FSRS system)
  };
  const response = await apiClient.post(
    endpoints.vocabularies.review(vocabId),
    reviewData,
  );

  TestAssertions.assertStatus(response.status, 201, 'Review vocabulary should return 201');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertHasProperty(response.data, 'nextReviewAt', 'Should have next review date');

  console.log('  ✓ Vocabulary reviewed successfully');
}

/**
 * Test get due for review
 */
async function testGetDueForReview(token: string) {
  console.log('⏰ Test: Get due for review');

  apiClient.setToken(token);
  const response = await apiClient.get(endpoints.vocabularies.dueReview);

  TestAssertions.assertStatus(response.status, 200, 'Get due for review should return 200');
  TestAssertions.assertHasData(response, 'Response should have data');
  // May be empty if no vocabularies are due

  console.log('  ✓ Due for review retrieved successfully');
}

// Run tests if executed directly
if (require.main === module) {
  runVocabulariesTests()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

/**
 * Test update vocabulary
 */
async function testUpdateVocabulary(token: string, vocabId: string) {
  console.log('✏️ Test: Update vocabulary');

  apiClient.setToken(token);
  const updateData = {
    word: 'xin chào (updated)',
    translation: 'hello (updated)',
  };
  const response = await apiClient.patch(`/vocabularies/${vocabId}`, updateData);

  TestAssertions.assertStatus(response.status, 200, 'Update vocabulary should return 200');
  TestAssertions.assertHasData(response, 'Response should have data');

  console.log('  ✓ Vocabulary updated successfully');
}

/**
 * Test delete vocabulary
 */
async function testDeleteVocabulary(token: string, vocabId: string) {
  console.log('🗑️ Test: Delete vocabulary');

  apiClient.setToken(token);
  const response = await apiClient.delete(`/vocabularies/${vocabId}`);

  TestAssertions.assertStatus(response.status, 200, 'Delete vocabulary should return 200');

  console.log('  ✓ Vocabulary deleted successfully');
}
