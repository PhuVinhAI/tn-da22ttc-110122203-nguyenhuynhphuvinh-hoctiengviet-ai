import { apiClient } from '../utils/api-client';
import { TestAssertions } from '../utils/assertions';
import { endpoints } from '../config/test.config';
import { userFixtures } from '../fixtures/users.fixture';
import { courseFixtures, unitFixtures, lessonFixtures } from '../fixtures/courses.fixture';
import { vocabularyFixtures } from '../fixtures/vocabularies.fixture';

/**
 * Vocabularies Module Test Suite
 */
export async function runVocabulariesTests() {
  console.log('\n📖 Running Vocabularies Tests...\n');

  let authToken: string;
  let lessonId: string;
  let vocabId: string;

  try {
    // Setup: Create course structure
    const setup = await setupCourseStructure();
    authToken = setup.token;
    lessonId = setup.lessonId;

    // Test 1: Create vocabulary
    vocabId = await testCreateVocabulary(authToken, lessonId);

    // Test 2: Get vocabularies by lesson
    await testGetVocabulariesByLesson(authToken, lessonId);

    // Test 3: Learn vocabulary (first time)
    await testLearnVocabulary(authToken, vocabId);

    // Test 4: Get my vocabularies
    await testGetMyVocabularies(authToken);

    // Test 5: Review vocabulary
    await testReviewVocabulary(authToken, vocabId);

    // Test 6: Get due for review
    await testGetDueForReview(authToken);

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
    isCorrect: true,
    timeSpent: 5,
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
