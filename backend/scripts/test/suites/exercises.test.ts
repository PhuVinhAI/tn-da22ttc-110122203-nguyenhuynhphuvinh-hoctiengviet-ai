import { apiClient } from '../utils/api-client';
import { TestAssertions } from '../utils/assertions';
import { endpoints } from '../config/test.config';
import { userFixtures } from '../fixtures/users.fixture';
import { courseFixtures, unitFixtures, lessonFixtures } from '../fixtures/courses.fixture';
import { exerciseFixtures } from '../fixtures/vocabularies.fixture';

/**
 * Exercises Module Test Suite
 */
export async function runExercisesTests() {
  console.log('\n✏️ Running Exercises Tests...\n');

  let authToken: string;
  let lessonId: string;
  let exerciseId: string;

  try {
    // Setup: Create course structure (this will set token)
    const setup = await setupCourseStructure();
    authToken = setup.token;
    lessonId = setup.lessonId;
    // Token is already set in setupCourseStructure, no need to set again

    // Test 1: Create exercise
    exerciseId = await testCreateExercise(authToken, lessonId);

    // Test 2: Get exercises by lesson
    await testGetExercisesByLesson(authToken, lessonId);

    // Test 3: Get exercise by ID
    await testGetExerciseById(authToken, exerciseId);

    // Test 4: Submit correct answer
    await testSubmitCorrectAnswer(authToken, exerciseId);

    // Test 5: Submit wrong answer
    await testSubmitWrongAnswer(authToken, exerciseId);

    // Test 6: Get my results
    await testGetMyResults(authToken);

    // Test 7: Get my stats
    await testGetMyStats(authToken);

    // Test 8: Update exercise
    await testUpdateExercise(authToken, exerciseId);

    // Test 9: Delete exercise
    await testDeleteExercise(authToken, exerciseId);

    console.log('✅ All Exercises tests passed!\n');
  } catch (error) {
    console.error('❌ Exercises test failed:', error);
    throw error;
  }
}

/**
 * Setup course structure
 */
async function setupCourseStructure() {
  try {
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
  } catch (error) {
    console.error('  ❌ Setup failed:', error);
    throw error;
  }
}

/**
 * Test create exercise
 */
async function testCreateExercise(token: string, lessonId: string): Promise<string> {
  console.log('📝 Test: Create exercise');

  // Token already set in setup
  const exercise = exerciseFixtures.multipleChoice(lessonId);
  const response = await apiClient.post('/exercises', exercise);

  TestAssertions.assertStatus(response.status, 201, 'Create exercise should return 201');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertIsUUID(response.data.id, 'Exercise ID should be UUID');
  TestAssertions.assertEquals(response.data.question, exercise.question, 'Question should match');

  console.log('  ✓ Exercise created successfully');
  return response.data.id;
}

/**
 * Test get exercises by lesson
 */
async function testGetExercisesByLesson(token: string, lessonId: string) {
  console.log('📖 Test: Get exercises by lesson');

  // Token already set in setup
  const response = await apiClient.get(endpoints.exercises.byLesson(lessonId));

  TestAssertions.assertStatus(response.status, 200, 'Get exercises should return 200');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertArrayNotEmpty(response.data, 'Should have at least one exercise');

  console.log('  ✓ Exercises retrieved successfully');
}

/**
 * Test get exercise by ID
 */
async function testGetExerciseById(token: string, exerciseId: string) {
  console.log('🔍 Test: Get exercise by ID');

  // Token already set in setup
  const response = await apiClient.get(endpoints.exercises.detail(exerciseId));

  TestAssertions.assertStatus(response.status, 200, 'Get exercise should return 200');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertEquals(response.data.id, exerciseId, 'Exercise ID should match');

  console.log('  ✓ Exercise retrieved successfully');
}

/**
 * Test submit correct answer
 */
async function testSubmitCorrectAnswer(token: string, exerciseId: string) {
  console.log('✅ Test: Submit correct answer');

  // Token already set in setup
  const submitData = {
    userAnswer: 'xin chào',
    timeSpent: 10,
  };
  const response = await apiClient.post(
    endpoints.exercises.submit(exerciseId),
    submitData,
  );

  TestAssertions.assertStatus(response.status, 201, 'Submit answer should return 201');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertHasProperty(response.data, 'isCorrect', 'Should have isCorrect field');
  TestAssertions.assertEquals(response.data.isCorrect, true, 'Answer should be correct');

  console.log('  ✓ Correct answer submitted successfully');
}

/**
 * Test submit wrong answer
 */
async function testSubmitWrongAnswer(token: string, exerciseId: string) {
  console.log('❌ Test: Submit wrong answer');

  // Token already set in setup
  const submitData = {
    userAnswer: 'wrong answer',
    timeSpent: 5,
  };
  const response = await apiClient.post(
    endpoints.exercises.submit(exerciseId),
    submitData,
  );

  TestAssertions.assertStatus(response.status, 201, 'Submit answer should return 201');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertHasProperty(response.data, 'isCorrect', 'Should have isCorrect field');
  TestAssertions.assertEquals(response.data.isCorrect, false, 'Answer should be incorrect');

  console.log('  ✓ Wrong answer submitted successfully');
}

/**
 * Test get my results
 */
async function testGetMyResults(token: string) {
  console.log('📊 Test: Get my results');

  // Token already set in setup
  const response = await apiClient.get(endpoints.exercises.myResults);

  TestAssertions.assertStatus(response.status, 200, 'Get my results should return 200');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertArrayNotEmpty(response.data, 'Should have at least one result');

  console.log('  ✓ My results retrieved successfully');
}

/**
 * Test get my stats
 */
async function testGetMyStats(token: string) {
  console.log('📈 Test: Get my stats');

  // Token already set in setup
  const response = await apiClient.get(endpoints.exercises.myStats);

  TestAssertions.assertStatus(response.status, 200, 'Get my stats should return 200');
  TestAssertions.assertHasData(response, 'Response should have data');
  TestAssertions.assertHasProperty(response.data, 'totalExercises', 'Should have total exercises');
  TestAssertions.assertHasProperty(response.data, 'correctAnswers', 'Should have correct answers');

  console.log('  ✓ My stats retrieved successfully');
}

// Run tests if executed directly
if (require.main === module) {
  runExercisesTests()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

/**
 * Test update exercise
 */
async function testUpdateExercise(token: string, exerciseId: string) {
  console.log('✏️ Test: Update exercise');

  // Token already set in setup
  const updateData = {
    question: 'Updated: What does "xin chào" mean?',
  };
  const response = await apiClient.patch(`/exercises/${exerciseId}`, updateData);

  TestAssertions.assertStatus(response.status, 200, 'Update exercise should return 200');
  TestAssertions.assertHasData(response, 'Response should have data');

  console.log('  ✓ Exercise updated successfully');
}

/**
 * Test delete exercise
 */
async function testDeleteExercise(token: string, exerciseId: string) {
  console.log('🗑️ Test: Delete exercise');

  // Token already set in setup
  const response = await apiClient.delete(`/exercises/${exerciseId}`);

  TestAssertions.assertStatus(response.status, 200, 'Delete exercise should return 200');

  console.log('  ✓ Exercise deleted successfully');
}
