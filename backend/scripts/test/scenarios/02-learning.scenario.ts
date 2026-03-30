import { apiClient } from '../utils/api-client';
import { TestAssertions } from '../utils/assertions';
import { endpoints } from '../config/test.config';
import { userFixtures } from '../fixtures/users.fixture';
import {
  courseFixtures,
  unitFixtures,
  lessonFixtures,
} from '../fixtures/courses.fixture';
import {
  vocabularyFixtures,
  exerciseFixtures,
} from '../fixtures/vocabularies.fixture';

/**
 * Scenario 2: Complete Learning Flow
 * 
 * User journey:
 * 1. Register and login
 * 2. Browse available courses
 * 3. Start a course
 * 4. Complete a vocabulary lesson
 * 5. Practice with exercises
 * 6. Track progress
 */
export async function runLearningScenario() {
  console.log('\n🎬 Scenario 2: Complete Learning Flow\n');
  console.log('User Story: Student completes their first Vietnamese lesson\n');

  let authToken: string;
  let courseId: string;
  let unitId: string;
  let lessonId: string;
  let vocabId: string;
  let exerciseId: string;

  try {
    // Step 1: Register and login
    console.log('Step 1: Student registers and logs in');
    const user = userFixtures.randomUser();
    const registerResponse = await apiClient.post(endpoints.auth.register, user);
    authToken = registerResponse.data.access_token;
    apiClient.setToken(authToken);
    console.log('  ✓ Student logged in as beginner (A1 level)\n');

    // Step 2: Browse available courses
    console.log('Step 2: Student browses available courses');
    
    // Create a course first
    const course = courseFixtures.beginnerCourse;
    const courseResponse = await apiClient.post(endpoints.courses.create, course);
    courseId = courseResponse.data.id;
    
    // Get all courses
    const coursesResponse = await apiClient.get(endpoints.courses.list);
    TestAssertions.assertArrayNotEmpty(coursesResponse.data);
    
    console.log(`  ✓ Found ${coursesResponse.data.length} course(s)`);
    console.log(`  ✓ Selected: "${course.title}"\n`);

    // Step 3: Start a course
    console.log('Step 3: Student starts the course');
    
    // Create unit
    const unit = unitFixtures.greetingsUnit(courseId);
    const unitResponse = await apiClient.post('/units', unit);
    unitId = unitResponse.data.id;
    
    // Create lesson
    const lesson = lessonFixtures.vocabularyLesson(unitId);
    const lessonResponse = await apiClient.post('/lessons', lesson);
    lessonId = lessonResponse.data.id;
    
    // Start lesson progress
    const startResponse = await apiClient.post(endpoints.progress.start(lessonId));
    TestAssertions.assertEquals(startResponse.data.status, 'in_progress');
    
    console.log(`  ✓ Started unit: "${unit.title}"`);
    console.log(`  ✓ Started lesson: "${lesson.title}"`);
    console.log('  ✓ Progress tracking initiated\n');

    // Step 4: Complete a vocabulary lesson
    console.log('Step 4: Student learns new vocabulary');
    
    // Create vocabularies
    const vocab1 = vocabularyFixtures.hello(lessonId);
    const vocab1Response = await apiClient.post('/vocabularies', vocab1);
    vocabId = vocab1Response.data.id;
    
    const vocab2 = vocabularyFixtures.thankYou(lessonId);
    await apiClient.post('/vocabularies', vocab2);
    
    const vocab3 = vocabularyFixtures.goodbye(lessonId);
    await apiClient.post('/vocabularies', vocab3);
    
    // Learn vocabularies
    await apiClient.post(endpoints.vocabularies.learn(vocabId));
    
    console.log('  ✓ Learned 3 new words:');
    console.log(`    - ${vocab1.word} (${vocab1.translation})`);
    console.log(`    - ${vocab2.word} (${vocab2.translation})`);
    console.log(`    - ${vocab3.word} (${vocab3.translation})\n`);

    // Step 5: Practice with exercises
    console.log('Step 5: Student practices with exercises');
    
    // Create exercise
    const exercise = exerciseFixtures.multipleChoice(lessonId);
    const exerciseResponse = await apiClient.post('/exercises', exercise);
    exerciseId = exerciseResponse.data.id;
    
    // Submit correct answer
    const submitResponse = await apiClient.post(
      endpoints.exercises.submit(exerciseId),
      {
        userAnswer: 'xin chào',
        timeSpent: 10,
      },
    );
    
    TestAssertions.assertEquals(submitResponse.data.isCorrect, true);
    
    console.log('  ✓ Completed 1 exercise');
    console.log('  ✓ Answer: Correct ✅');
    console.log('  ✓ Time spent: 10 seconds\n');

    // Step 6: Track progress
    console.log('Step 6: Student completes the lesson');
    
    // Update time spent
    await apiClient.patch(endpoints.progress.updateTime(lessonId), {
      timeSpent: 900, // 15 minutes
    });
    
    // Complete lesson
    const completeResponse = await apiClient.post(
      endpoints.progress.complete(lessonId),
      {
        score: 100,
      },
    );
    
    TestAssertions.assertEquals(completeResponse.data.status, 'completed');
    
    console.log('  ✓ Lesson completed!');
    console.log('  ✓ Score: 100/100');
    console.log('  ✓ Time spent: 15 minutes\n');

    // Get overall progress
    const progressResponse = await apiClient.get(endpoints.progress.list);
    const myStatsResponse = await apiClient.get(endpoints.exercises.myStats);
    
    console.log('✅ Learning scenario completed successfully!\n');
    console.log('Summary:');
    console.log(`  - Course: ${course.title}`);
    console.log(`  - Lessons completed: ${progressResponse.data.length}`);
    console.log(`  - Vocabularies learned: 3`);
    console.log(`  - Exercises completed: ${myStatsResponse.data.totalExercises}`);
    console.log(`  - Accuracy: ${myStatsResponse.data.accuracy}%`);
    console.log('  - Student is ready for the next lesson! 🎉\n');

  } catch (error) {
    console.error('❌ Learning scenario failed:', error);
    throw error;
  } finally {
    apiClient.clearToken();
  }
}

// Run scenario if executed directly
if (require.main === module) {
  runLearningScenario()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
