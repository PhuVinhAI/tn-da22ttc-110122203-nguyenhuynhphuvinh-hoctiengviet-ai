import { FSRSService, Rating, State, Card } from '../../../src/modules/progress/application/fsrs.service';

/**
 * FSRS Algorithm Test Suite
 * 
 * Test các tính năng chính của FSRS:
 * - Khởi tạo card mới
 * - Scheduling với các rating khác nhau
 * - State transitions
 * - Stability và difficulty calculations
 * - Retrievability (probability of recall)
 */

export async function runFSRSTests(): Promise<void> {
  console.log('\n🧪 Testing FSRS Algorithm...\n');

  const fsrs = new FSRSService();
  let passed = 0;
  let failed = 0;

  // Test 1: Initialize new card
  try {
    console.log('Test 1: Initialize new card');
    const card = fsrs.initCard();
    
    if (
      card.state === State.New &&
      card.stability === 0 &&
      card.difficulty === 0 &&
      card.reps === 0 &&
      card.lapses === 0
    ) {
      console.log('✅ New card initialized correctly');
      passed++;
    } else {
      console.log('❌ New card initialization failed');
      console.log('Card:', card);
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 1 failed:', error);
    failed++;
  }

  // Test 2: First review with "Good" rating
  try {
    console.log('\nTest 2: First review with Good rating');
    const card = fsrs.initCard();
    const now = new Date();
    const result = fsrs.repeat(card, now);
    const goodCard = result[Rating.Good].card;

    if (
      goodCard.state === State.Learning &&
      goodCard.reps === 1 &&
      goodCard.stability > 0 &&
      goodCard.difficulty > 0
    ) {
      console.log('✅ First review processed correctly');
      console.log(`   Stability: ${goodCard.stability.toFixed(2)} days`);
      console.log(`   Difficulty: ${goodCard.difficulty.toFixed(2)}`);
      console.log(`   Next review: ${goodCard.scheduledDays} days`);
      passed++;
    } else {
      console.log('❌ First review failed');
      console.log('Card:', goodCard);
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 2 failed:', error);
    failed++;
  }

  // Test 3: Rating comparison (Again vs Good vs Easy)
  try {
    console.log('\nTest 3: Compare different ratings');
    const card = fsrs.initCard();
    const now = new Date();
    const result = fsrs.repeat(card, now);

    const againCard = result[Rating.Again].card;
    const goodCard = result[Rating.Good].card;
    const easyCard = result[Rating.Easy].card;

    if (
      againCard.scheduledDays < goodCard.scheduledDays &&
      goodCard.scheduledDays < easyCard.scheduledDays &&
      againCard.difficulty > goodCard.difficulty &&
      goodCard.difficulty > easyCard.difficulty
    ) {
      console.log('✅ Rating comparison correct');
      console.log(`   Again: ${againCard.scheduledDays} days, difficulty ${againCard.difficulty.toFixed(2)}`);
      console.log(`   Good:  ${goodCard.scheduledDays} days, difficulty ${goodCard.difficulty.toFixed(2)}`);
      console.log(`   Easy:  ${easyCard.scheduledDays} days, difficulty ${easyCard.difficulty.toFixed(2)}`);
      passed++;
    } else {
      console.log('❌ Rating comparison failed');
      console.log(`   Again: ${againCard.scheduledDays} days, difficulty ${againCard.difficulty.toFixed(2)}`);
      console.log(`   Good:  ${goodCard.scheduledDays} days, difficulty ${goodCard.difficulty.toFixed(2)}`);
      console.log(`   Easy:  ${easyCard.scheduledDays} days, difficulty ${easyCard.difficulty.toFixed(2)}`);
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 3 failed:', error);
    failed++;
  }

  // Test 4: State transition from Learning to Review
  try {
    console.log('\nTest 4: State transition Learning -> Review');
    let card = fsrs.initCard();
    const now = new Date();
    
    // First review: Good
    let result = fsrs.repeat(card, now);
    card = result[Rating.Good].card;
    
    // Second review: Good (should move to Review state)
    result = fsrs.repeat(card, now);
    card = result[Rating.Good].card;

    if (card.state === State.Review && card.reps === 2) {
      console.log('✅ State transition to Review successful');
      console.log(`   Stability: ${card.stability.toFixed(2)} days`);
      passed++;
    } else {
      console.log('❌ State transition failed');
      console.log('Card:', card);
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 4 failed:', error);
    failed++;
  }

  // Test 5: Forgetting (Again rating in Review state)
  try {
    console.log('\nTest 5: Forgetting scenario (Review -> Relearning)');
    let card = fsrs.initCard();
    const now = new Date();
    
    // Get to Review state
    let result = fsrs.repeat(card, now);
    card = result[Rating.Good].card;
    result = fsrs.repeat(card, now);
    card = result[Rating.Good].card;
    
    // Forget it (Again rating)
    result = fsrs.repeat(card, now);
    card = result[Rating.Again].card;

    if (card.state === State.Relearning && card.lapses === 1) {
      console.log('✅ Forgetting handled correctly');
      console.log(`   Lapses: ${card.lapses}`);
      console.log(`   New stability: ${card.stability.toFixed(2)} days`);
      passed++;
    } else {
      console.log('❌ Forgetting scenario failed');
      console.log('Card:', card);
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 5 failed:', error);
    failed++;
  }

  // Test 6: Retrievability calculation
  try {
    console.log('\nTest 6: Retrievability calculation');
    let card = fsrs.initCard();
    const now = new Date();
    
    // Review once
    let result = fsrs.repeat(card, now);
    card = result[Rating.Good].card;
    
    // Check retrievability immediately (should be high)
    const immediateRetrieval = fsrs.getRetrievability(card, now);
    
    // Check retrievability after scheduled days (should be ~90%)
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + card.scheduledDays);
    const scheduledRetrieval = fsrs.getRetrievability(card, futureDate);

    if (immediateRetrieval > 0.95 && scheduledRetrieval >= 0.85 && scheduledRetrieval <= 0.95) {
      console.log('✅ Retrievability calculation correct');
      console.log(`   Immediate: ${(immediateRetrieval * 100).toFixed(1)}%`);
      console.log(`   After ${card.scheduledDays} days: ${(scheduledRetrieval * 100).toFixed(1)}%`);
      passed++;
    } else {
      console.log('❌ Retrievability calculation failed');
      console.log(`   Immediate: ${(immediateRetrieval * 100).toFixed(1)}%`);
      console.log(`   After ${card.scheduledDays} days: ${(scheduledRetrieval * 100).toFixed(1)}%`);
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 6 failed:', error);
    failed++;
  }

  // Test 7: Long-term learning simulation
  try {
    console.log('\nTest 7: Long-term learning simulation (10 reviews)');
    let card = fsrs.initCard();
    let currentDate = new Date();
    
    console.log('   Review history:');
    for (let i = 0; i < 10; i++) {
      const result = fsrs.repeat(card, currentDate);
      card = result[Rating.Good].card;
      
      console.log(`   ${i + 1}. Interval: ${card.scheduledDays} days, Stability: ${card.stability.toFixed(1)}, Difficulty: ${card.difficulty.toFixed(2)}`);
      
      // Move to next review date
      currentDate = new Date(card.due);
    }

    if (card.stability > 30 && card.state === State.Review) {
      console.log('✅ Long-term learning simulation successful');
      console.log(`   Final stability: ${card.stability.toFixed(1)} days`);
      passed++;
    } else {
      console.log('❌ Long-term learning simulation failed');
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 7 failed:', error);
    failed++;
  }

  // Test 8: Difficulty adjustment
  try {
    console.log('\nTest 8: Difficulty adjustment with mixed ratings');
    let card = fsrs.initCard();
    const now = new Date();
    
    // Pattern: Good, Hard (Hard should have higher difficulty)
    let result = fsrs.repeat(card, now);
    card = result[Rating.Good].card;
    const difficultyAfterGood = card.difficulty;
    
    result = fsrs.repeat(card, now);
    card = result[Rating.Hard].card;
    const difficultyAfterHard = card.difficulty;

    if (difficultyAfterHard > difficultyAfterGood) {
      console.log('✅ Difficulty adjustment working');
      console.log(`   After Good: ${difficultyAfterGood.toFixed(2)}`);
      console.log(`   After Hard: ${difficultyAfterHard.toFixed(2)}`);
      passed++;
    } else {
      console.log('❌ Difficulty adjustment failed');
      console.log(`   After Good: ${difficultyAfterGood.toFixed(2)}`);
      console.log(`   After Hard: ${difficultyAfterHard.toFixed(2)}`);
      failed++;
    }
  } catch (error) {
    console.log('❌ Test 8 failed:', error);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`FSRS Tests: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50) + '\n');

  if (failed > 0) {
    throw new Error(`${failed} FSRS test(s) failed`);
  }
}
