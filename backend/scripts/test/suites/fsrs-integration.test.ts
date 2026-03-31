import { apiClient } from '../utils/api-client';
import { TestUsers } from '../utils/test-users';
import { Rating } from '../../../src/modules/progress/application/fsrs.service';

/**
 * FSRS Integration Test
 * 
 * Test FSRS integration với vocabulary learning flow:
 * - Thêm vocabulary mới (khởi tạo FSRS card)
 * - Review với các rating khác nhau
 * - Verify scheduling và mastery level updates
 * - Test long-term learning progression
 */

export async function runFSRSIntegrationTests(): Promise<void> {
  console.log('\n🧪 Testing FSRS Integration with Vocabularies...\n');

  const adminAuth = await TestUsers.loginAdmin();
  apiClient.setToken(adminAuth.token);
  
  let passed = 0;
  let failed = 0;

  // Setup: Create test vocabulary
  let testVocabId: string;
  let userVocabId: string | undefined;
  let lessonId: string;

  try {
    console.log('Setup: Creating test vocabulary...');
    
    // Tạo course structure nhanh
    const courseResponse = await apiClient.post('/courses', {
      title: 'FSRS Test Course',
      description: 'Test course for FSRS',
      level: 'A1',
      orderIndex: 999,
      isPublished: true,
    });
    const courseId = courseResponse.data.id;
    
    const unitResponse = await apiClient.post('/units', {
      title: 'FSRS Test Unit',
      description: 'Test unit',
      orderIndex: 1,
      courseId,
    });
    const unitId = unitResponse.data.id;
    
    const lessonResponse = await apiClient.post('/lessons', {
      title: 'FSRS Test Lesson',
      description: 'Test lesson',
      lessonType: 'vocabulary',
      orderIndex: 1,
      unitId,
    });
    lessonId = lessonResponse.data.id;
    
    const vocabResponse = await apiClient.post('/vocabularies', {
      word: 'test-fsrs',
      translation: 'test',
      phonetic: 'test',
      partOfSpeech: 'noun',
      lessonId,
    });
    testVocabId = vocabResponse.data.id;
    
    console.log(`✅ Test vocabulary created: ${testVocabId}\n`);
  } catch (error) {
    console.log('❌ Setup failed:', error);
    throw error;
  }

  // Test 1: Add vocabulary (initialize FSRS)
  try {
    console.log('Test 1: Add vocabulary with FSRS initialization');
    const response = await apiClient.post(`/vocabularies/${testVocabId}/learn`);

    const userVocab = response.data;
    userVocabId = userVocab.id;

    if (
      userVocab.stability === 0 &&
      userVocab.difficulty === 0 &&
      userVocab.state === 0 && // State.New
      userVocab.reps === 0 &&
      userVocab.lapses === 0 &&
      userVocab.masteryLevel === 'learning'
    ) {
      console.log('✅ Vocabulary initialized with FSRS correctly');
      console.log(`   State: New, Stability: ${userVocab.stability}, Difficulty: ${userVocab.difficulty}`);
      passed++;
    } else {
      console.log('❌ FSRS initialization failed');
      console.log('UserVocab:', userVocab);
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 1 failed:', error);
    failed++;
  }

  // Test 2: First review with "Good" rating
  try {
    console.log('\nTest 2: First review with Good rating');
    
    if (!userVocabId) {
      throw new Error('userVocabId not set from Test 1');
    }
    
    const response = await apiClient.post(`/vocabularies/${testVocabId}/review`, {
      rating: Rating.Good,
    });

    const userVocab = response.data;

    if (
      userVocab.state === 1 && // State.Learning
      userVocab.reps === 1 &&
      userVocab.stability > 0 &&
      userVocab.difficulty > 0 &&
      userVocab.reviewCount === 1 &&
      userVocab.correctCount === 1
    ) {
      console.log('✅ First review processed correctly');
      console.log(`   State: Learning, Reps: ${userVocab.reps}`);
      console.log(`   Stability: ${userVocab.stability.toFixed(2)} days`);
      console.log(`   Difficulty: ${userVocab.difficulty.toFixed(2)}`);
      console.log(`   Next review in: ${userVocab.scheduledDays} days`);
      passed++;
    } else {
      console.log('❌ First review failed');
      console.log('UserVocab:', userVocab);
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 2 failed:', error);
    failed++;
  }

  // Test 3: Second review (should move to Review state)
  try {
    console.log('\nTest 3: Second review (Learning -> Review)');
    
    if (!userVocabId) {
      throw new Error('userVocabId not set from Test 1');
    }
    
    const response = await apiClient.post(`/vocabularies/${testVocabId}/review`, {
      rating: Rating.Good,
    });

    const userVocab = response.data;

    if (
      userVocab.state === 2 && // State.Review
      userVocab.reps === 2 &&
      userVocab.reviewCount === 2 &&
      userVocab.correctCount === 2
    ) {
      console.log('✅ Transitioned to Review state');
      console.log(`   State: Review, Reps: ${userVocab.reps}`);
      console.log(`   Stability: ${userVocab.stability.toFixed(2)} days`);
      passed++;
    } else {
      console.log('❌ State transition failed');
      console.log('UserVocab:', userVocab);
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 3 failed:', error);
    failed++;
  }

  // Test 4: Forgetting scenario (Again rating)
  try {
    console.log('\nTest 4: Forgetting scenario (Again rating)');
    
    if (!userVocabId) {
      throw new Error('userVocabId not set from Test 1');
    }
    
    const response = await apiClient.post(`/vocabularies/${testVocabId}/review`, {
      rating: Rating.Again,
    });

    const userVocab = response.data;

    if (
      userVocab.state === 3 && // State.Relearning
      userVocab.lapses === 1 &&
      userVocab.correctCount === 2 // Should not increase
    ) {
      console.log('✅ Forgetting handled correctly');
      console.log(`   State: Relearning, Lapses: ${userVocab.lapses}`);
      console.log(`   Stability reduced to: ${userVocab.stability.toFixed(2)} days`);
      passed++;
    } else {
      console.log('❌ Forgetting scenario failed');
      console.log('UserVocab:', userVocab);
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 4 failed:', error);
    failed++;
  }

  // Test 5: Rating comparison (create new vocab for clean test)
  try {
    console.log('\nTest 5: Compare Easy vs Hard ratings');
    
    // Create 2 new vocabularies for clean comparison
    const vocab1Response = await apiClient.post('/vocabularies', {
      word: 'test-easy',
      translation: 'test easy',
      phonetic: 'test',
      partOfSpeech: 'noun',
      lessonId,
    });
    const vocab1Id = vocab1Response.data.id;
    
    const vocab2Response = await apiClient.post('/vocabularies', {
      word: 'test-hard',
      translation: 'test hard',
      phonetic: 'test',
      partOfSpeech: 'noun',
      lessonId,
    });
    const vocab2Id = vocab2Response.data.id;
    
    // Add and review with Easy
    await apiClient.post(`/vocabularies/${vocab1Id}/learn`);
    const easyResponse = await apiClient.post(`/vocabularies/${vocab1Id}/review`, {
      rating: Rating.Easy,
    });
    const easyVocab = easyResponse.data;

    // Add and review with Hard
    await apiClient.post(`/vocabularies/${vocab2Id}/learn`);
    const hardResponse = await apiClient.post(`/vocabularies/${vocab2Id}/review`, {
      rating: Rating.Hard,
    });
    const hardVocab = hardResponse.data;

    if (
      easyVocab.scheduledDays > hardVocab.scheduledDays &&
      easyVocab.difficulty < hardVocab.difficulty
    ) {
      console.log('✅ Rating comparison correct');
      console.log(`   Easy: ${easyVocab.scheduledDays} days, difficulty ${easyVocab.difficulty.toFixed(2)}`);
      console.log(`   Hard: ${hardVocab.scheduledDays} days, difficulty ${hardVocab.difficulty.toFixed(2)}`);
      passed++;
    } else {
      console.log('❌ Rating comparison failed');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 5 failed:', error);
    failed++;
  }

  // Test 6: Mastery level progression WITH TIME SIMULATION
  try {
    console.log('\nTest 6: Mastery level progression (with time simulation)');
    
    // Create new vocabulary for clean test
    const masteryVocabResponse = await apiClient.post('/vocabularies', {
      word: 'test-mastery',
      translation: 'test mastery',
      phonetic: 'test',
      partOfSpeech: 'noun',
      lessonId,
    });
    const masteryVocabId = masteryVocabResponse.data.id;
    
    // Add vocabulary
    await apiClient.post(`/vocabularies/${masteryVocabId}/learn`);
    
    console.log('   Reviewing with time gaps...');
    let currentDate = new Date('2024-01-01T00:00:00.000Z');
    let currentVocab;
    
    for (let i = 0; i < 5; i++) {
      const response = await apiClient.post(`/vocabularies/${masteryVocabId}/review`, {
        rating: Rating.Good,
        reviewDate: currentDate.toISOString(),
      });
      currentVocab = response.data;
      
      console.log(`   Review ${i + 1} (${currentDate.toISOString().split('T')[0]}): Stability ${currentVocab.stability.toFixed(1)} days, Scheduled: ${currentVocab.scheduledDays} days`);
      
      // Move to next scheduled review date
      currentDate = new Date(currentVocab.nextReviewAt);
    }

    // After 5 reviews with proper time gaps, stability should grow significantly
    if (currentVocab && currentVocab.stability > 20 && currentVocab.state === 2) {
      console.log('✅ Mastery progression working with time simulation');
      console.log(`   Final stability: ${currentVocab.stability.toFixed(1)} days`);
      console.log(`   Mastery level: ${currentVocab.masteryLevel}`);
      passed++;
    } else {
      console.log('❌ Mastery progression failed');
      console.log('CurrentVocab:', currentVocab);
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 6 failed:', error);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`FSRS Integration Tests: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50) + '\n');

  if (failed > 0) {
    throw new Error(`${failed} FSRS integration test(s) failed`);
  }
}
