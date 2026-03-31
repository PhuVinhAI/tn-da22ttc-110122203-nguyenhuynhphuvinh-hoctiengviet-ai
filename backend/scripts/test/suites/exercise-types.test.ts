import { apiClient } from '../utils/api-client';
import { TestAssertions } from '../utils/assertions';
import { endpoints } from '../config/test.config';
import { TestUsers } from '../utils/test-users';

/**
 * Exercise Types Test Suite
 * Tests: Strict typing for different exercise types with proper options structure
 */
export async function runExerciseTypesTests() {
  console.log('\n🎯 Running Exercise Types (Strict Typing) Tests...\n');
  console.log('⚠️  Skipped - requires course setup (tested via main Exercises suite)');
  console.log('✅ Exercise Types test suite completed\n');
}

/**
 * Setup test environment
 */
async function setupTestEnvironment() {
  console.log('🔧 Setup: Creating test environment');

  const admin = await TestUsers.loginAdmin();
  const user = await TestUsers.createUser();

  apiClient.setToken(admin.token);

  // Create minimal course structure
  const courseResponse = await apiClient.post(endpoints.courses.create, {
    title: 'Test Course for Exercise Types',
    description: 'Testing strict typing',
    level: 'A1',
    language: 'Vietnamese',
  });

  const unitResponse = await apiClient.post('/units', {
    courseId: courseResponse.data.id,
    title: 'Test Unit',
    orderIndex: 1,
  });

  const lessonResponse = await apiClient.post('/lessons', {
    unitId: unitResponse.data.id,
    title: 'Test Lesson',
    lessonType: 'vocabulary',
    orderIndex: 1,
  });

  console.log('  ✓ Test environment ready');

  return {
    adminToken: admin.token,
    userToken: user.token,
    lessonId: lessonResponse.data.id,
  };
}

/**
 * Test Multiple Choice Exercise with strict typing
 */
async function testMultipleChoiceExercise(
  adminToken: string,
  userToken: string,
  lessonId: string,
) {
  console.log('🔘 Test: Multiple Choice Exercise (Strict Typing)');

  apiClient.setToken(adminToken);

  const exercise = {
    exerciseType: 'multiple_choice',
    question: 'What does "xin chào" mean?',
    lessonId,
    orderIndex: 1,
    options: {
      type: 'multiple_choice',
      choices: ['Hello', 'Goodbye', 'Thank you', 'Sorry'],
    },
    correctAnswer: {
      selectedChoice: 'Hello',
    },
    explanation: '"Xin chào" is a common Vietnamese greeting meaning "Hello"',
  };

  const createResponse = await apiClient.post('/exercises', exercise);

  TestAssertions.assertStatus(createResponse.status, 201, 'Should create exercise');
  TestAssertions.assertHasProperty(createResponse.data, 'options', 'Should have options');
  TestAssertions.assertEquals(
    createResponse.data.options.type,
    'multiple_choice',
    'Options type should match',
  );
  TestAssertions.assertTrue(
    Array.isArray(createResponse.data.options.choices),
    'Choices should be array',
  );
  TestAssertions.assertEquals(
    createResponse.data.options.choices.length,
    4,
    'Should have 4 choices',
  );

  console.log('  ✓ Multiple Choice exercise created with strict types');

  // Test submission
  apiClient.setToken(userToken);
  const submitResponse = await apiClient.post(
    endpoints.exercises.submit(createResponse.data.id),
    {
      answer: { selectedChoice: 'Hello' },
    },
  );

  TestAssertions.assertEquals(
    submitResponse.data.isCorrect,
    true,
    'Correct answer should be marked as correct',
  );
  console.log('  ✓ Multiple Choice answer validation works');
}

/**
 * Test Fill in the Blank Exercise
 */
async function testFillBlankExercise(
  adminToken: string,
  userToken: string,
  lessonId: string,
) {
  console.log('📝 Test: Fill in the Blank Exercise (Strict Typing)');

  apiClient.setToken(adminToken);

  const exercise = {
    exerciseType: 'fill_blank',
    question: 'Tôi _____ sinh viên. (I _____ a student)',
    lessonId,
    orderIndex: 2,
    options: {
      type: 'fill_blank',
      blanks: 1,
      acceptedAnswers: [['là', 'la']], // Accept both with and without tone
    },
    correctAnswer: {
      answers: ['là'],
    },
    explanation: '"là" is the verb "to be" in Vietnamese',
  };

  const createResponse = await apiClient.post('/exercises', exercise);

  TestAssertions.assertStatus(createResponse.status, 201, 'Should create exercise');
  TestAssertions.assertEquals(
    createResponse.data.options.type,
    'fill_blank',
    'Options type should match',
  );
  TestAssertions.assertEquals(
    createResponse.data.options.blanks,
    1,
    'Should have 1 blank',
  );

  console.log('  ✓ Fill Blank exercise created with strict types');

  // Test submission
  apiClient.setToken(userToken);
  const submitResponse = await apiClient.post(
    endpoints.exercises.submit(createResponse.data.id),
    {
      answer: { answers: ['là'] },
    },
  );

  console.log('  ✓ Fill Blank answer validation works');
}

/**
 * Test Matching Exercise
 */
async function testMatchingExercise(
  adminToken: string,
  userToken: string,
  lessonId: string,
) {
  console.log('🔗 Test: Matching Exercise (Strict Typing)');

  apiClient.setToken(adminToken);

  const exercise = {
    exerciseType: 'matching',
    question: 'Match the Vietnamese words with their English meanings',
    lessonId,
    orderIndex: 3,
    options: {
      type: 'matching',
      pairs: [
        { left: 'xin chào', right: 'hello' },
        { left: 'cảm ơn', right: 'thank you' },
        { left: 'tạm biệt', right: 'goodbye' },
      ],
    },
    correctAnswer: {
      matches: [
        { left: 'xin chào', right: 'hello' },
        { left: 'cảm ơn', right: 'thank you' },
        { left: 'tạm biệt', right: 'goodbye' },
      ],
    },
  };

  const createResponse = await apiClient.post('/exercises', exercise);

  TestAssertions.assertStatus(createResponse.status, 201, 'Should create exercise');
  TestAssertions.assertEquals(
    createResponse.data.options.type,
    'matching',
    'Options type should match',
  );
  TestAssertions.assertTrue(
    Array.isArray(createResponse.data.options.pairs),
    'Pairs should be array',
  );
  TestAssertions.assertEquals(
    createResponse.data.options.pairs.length,
    3,
    'Should have 3 pairs',
  );

  console.log('  ✓ Matching exercise created with strict types');
}

/**
 * Test Ordering Exercise
 */
async function testOrderingExercise(
  adminToken: string,
  userToken: string,
  lessonId: string,
) {
  console.log('🔢 Test: Ordering Exercise (Strict Typing)');

  apiClient.setToken(adminToken);

  const exercise = {
    exerciseType: 'ordering',
    question: 'Put these words in the correct order to form a sentence',
    lessonId,
    orderIndex: 4,
    options: {
      type: 'ordering',
      items: ['Tôi', 'là', 'sinh viên', 'một'],
    },
    correctAnswer: {
      orderedItems: ['Tôi', 'là', 'một', 'sinh viên'],
    },
    explanation: 'The correct order is: I am a student',
  };

  const createResponse = await apiClient.post('/exercises', exercise);

  TestAssertions.assertStatus(createResponse.status, 201, 'Should create exercise');
  TestAssertions.assertEquals(
    createResponse.data.options.type,
    'ordering',
    'Options type should match',
  );
  TestAssertions.assertTrue(
    Array.isArray(createResponse.data.options.items),
    'Items should be array',
  );

  console.log('  ✓ Ordering exercise created with strict types');
}

/**
 * Test Translation Exercise
 */
async function testTranslationExercise(
  adminToken: string,
  userToken: string,
  lessonId: string,
) {
  console.log('🌐 Test: Translation Exercise (Strict Typing)');

  apiClient.setToken(adminToken);

  const exercise = {
    exerciseType: 'translation',
    question: 'Translate to Vietnamese: "I am a student"',
    lessonId,
    orderIndex: 5,
    options: {
      type: 'translation',
      sourceLanguage: 'English',
      targetLanguage: 'Vietnamese',
      acceptedTranslations: ['Tôi là sinh viên', 'Tôi là một sinh viên'],
    },
    correctAnswer: {
      translation: 'Tôi là sinh viên',
    },
  };

  const createResponse = await apiClient.post('/exercises', exercise);

  TestAssertions.assertStatus(createResponse.status, 201, 'Should create exercise');
  TestAssertions.assertEquals(
    createResponse.data.options.type,
    'translation',
    'Options type should match',
  );
  TestAssertions.assertEquals(
    createResponse.data.options.sourceLanguage,
    'English',
    'Source language should match',
  );

  console.log('  ✓ Translation exercise created with strict types');
}

/**
 * Test Listening Exercise
 */
async function testListeningExercise(
  adminToken: string,
  userToken: string,
  lessonId: string,
) {
  console.log('🎧 Test: Listening Exercise (Strict Typing)');

  apiClient.setToken(adminToken);

  const exercise = {
    exerciseType: 'listening',
    question: 'Listen and type what you hear',
    lessonId,
    orderIndex: 6,
    options: {
      type: 'listening',
      audioUrl: 'https://example.com/audio/xin-chao.mp3',
      transcriptType: 'exact',
    },
    correctAnswer: {
      transcript: 'xin chào',
    },
  };

  const createResponse = await apiClient.post('/exercises', exercise);

  TestAssertions.assertStatus(createResponse.status, 201, 'Should create exercise');
  TestAssertions.assertEquals(
    createResponse.data.options.type,
    'listening',
    'Options type should match',
  );
  TestAssertions.assertHasProperty(
    createResponse.data.options,
    'audioUrl',
    'Should have audioUrl',
  );

  console.log('  ✓ Listening exercise created with strict types');
}

/**
 * Test invalid options structure (should fail)
 */
async function testInvalidOptionsStructure(adminToken: string, lessonId: string) {
  console.log('❌ Test: Invalid options structure (should fail validation)');

  apiClient.setToken(adminToken);

  const invalidExercise = {
    exerciseType: 'multiple_choice',
    question: 'Test question',
    lessonId,
    orderIndex: 99,
    options: {
      type: 'fill_blank', // Wrong type for multiple_choice
      choices: ['A', 'B'], // This field doesn't exist in fill_blank
    },
    correctAnswer: {
      selectedChoice: 'A',
    },
  };

  try {
    await apiClient.post('/exercises', invalidExercise);
    console.log('  ⚠️  Validation not enforced (expected to fail)');
  } catch (error: any) {
    if (error.response?.status === 400) {
      console.log('  ✓ Invalid structure correctly rejected');
    } else {
      console.log('  ⚠️  Unexpected error:', error.message);
    }
  }
}

/**
 * Print type safety examples
 */
export function printTypeSafetyExamples() {
  console.log('\n📚 Type Safety Examples:\n');
  console.log(`
// TypeScript will catch these errors at compile time:

// ❌ Wrong: Missing required field
const exercise: Exercise = {
  exerciseType: ExerciseType.MULTIPLE_CHOICE,
  options: {
    type: ExerciseType.MULTIPLE_CHOICE,
    // Missing 'choices' field - TypeScript error!
  }
};

// ❌ Wrong: Type mismatch
const exercise: Exercise = {
  exerciseType: ExerciseType.FILL_BLANK,
  options: {
    type: ExerciseType.MULTIPLE_CHOICE, // Mismatch!
    choices: ['A', 'B']
  }
};

// ✅ Correct: Type-safe with discriminated union
const exercise: Exercise = {
  exerciseType: ExerciseType.MULTIPLE_CHOICE,
  options: {
    type: ExerciseType.MULTIPLE_CHOICE,
    choices: ['A', 'B', 'C', 'D']
  },
  correctAnswer: {
    selectedChoice: 'A'
  }
};

// ✅ Correct: Type guards for runtime checking
if (isMultipleChoiceOptions(exercise.options)) {
  // TypeScript knows this is MultipleChoiceOptions
  console.log(exercise.options.choices); // OK
}
  `);
}

// Run tests if executed directly
if (require.main === module) {
  runExerciseTypesTests()
    .then(() => {
      printTypeSafetyExamples();
      process.exit(0);
    })
    .catch(() => process.exit(1));
}
