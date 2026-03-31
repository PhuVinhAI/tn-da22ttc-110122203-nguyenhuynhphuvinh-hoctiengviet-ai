import { Injectable } from '@nestjs/common';
import { FSRSService, Rating, Card, State } from './fsrs.service';

/**
 * Spaced Repetition Service using FSRS Algorithm
 * 
 * FSRS (Free Spaced Repetition Scheduler) là thuật toán hiện đại được Anki sử dụng.
 * Ưu điểm:
 * - Cá nhân hóa cao dựa trên performance của từng user
 * - Tính toán retention probability chính xác
 * - Tối ưu hóa cho long-term memory retention
 * 
 * Thay thế fixed intervals cũ [1, 3, 7, 14, 30] bằng dynamic scheduling.
 */
@Injectable()
export class SpacedRepetitionService {
  constructor(private readonly fsrsService: FSRSService) {}
  /**
   * Calculate next review using FSRS algorithm
   * @param currentCard Current FSRS card state
   * @param rating User's rating (1=Again, 2=Hard, 3=Good, 4=Easy)
   * @returns Updated card with next review date
   */
  calculateNextReview(currentCard: Card, rating: Rating): Card {
    const now = new Date();
    return this.calculateNextReviewWithDate(currentCard, rating, now);
  }

  /**
   * Calculate next review with custom date (for testing)
   * @param currentCard Current FSRS card state
   * @param rating User's rating
   * @param reviewDate Date of review (for time simulation)
   * @returns Updated card with next review date
   */
  calculateNextReviewWithDate(currentCard: Card, rating: Rating, reviewDate: Date): Card {
    const schedulingInfo = this.fsrsService.repeat(currentCard, reviewDate);
    return schedulingInfo[rating].card;
  }

  /**
   * Initialize a new card for first-time learning
   */
  initializeCard(): Card {
    return this.fsrsService.initCard();
  }

  /**
   * Convert user vocabulary entity to FSRS Card
   */
  toCard(userVocab: {
    nextReviewAt?: Date;
    lastReviewedAt?: Date;
    stability: number;
    difficulty: number;
    state: number;
    elapsedDays: number;
    scheduledDays: number;
    reps: number;
    lapses: number;
  }): Card {
    return {
      due: userVocab.nextReviewAt || new Date(),
      stability: userVocab.stability,
      difficulty: userVocab.difficulty,
      elapsedDays: userVocab.elapsedDays,
      scheduledDays: userVocab.scheduledDays,
      reps: userVocab.reps,
      lapses: userVocab.lapses,
      state: userVocab.state as State,
      lastReview: userVocab.lastReviewedAt,
    };
  }

  /**
   * Get all possible next states for a card (for preview)
   */
  getSchedulingOptions(currentCard: Card): Record<Rating, Card> {
    const now = new Date();
    const schedulingInfo = this.fsrsService.repeat(currentCard, now);
    
    return {
      [Rating.Again]: schedulingInfo[Rating.Again].card,
      [Rating.Hard]: schedulingInfo[Rating.Hard].card,
      [Rating.Good]: schedulingInfo[Rating.Good].card,
      [Rating.Easy]: schedulingInfo[Rating.Easy].card,
    };
  }

  /**
   * Calculate mastery level based on FSRS state and stability
   */
  calculateMasteryLevel(card: Card): string {
    // New or Learning state
    if (card.state === State.New || card.state === State.Learning) {
      return 'learning';
    }
    
    // Relearning (forgot previously learned)
    if (card.state === State.Relearning) {
      return 'learning';
    }

    // Review state - check stability
    if (card.stability >= 100) {
      return 'mastered'; // Very stable memory (100+ days)
    } else if (card.stability >= 21) {
      return 'familiar'; // Stable memory (3+ weeks)
    }
    
    return 'learning';
  }

  /**
   * Get current retrievability (probability of recall)
   */
  getRetrievability(card: Card): number {
    const now = new Date();
    return this.fsrsService.getRetrievability(card, now);
  }

  /**
   * Get items due for review
   * @param items Array of items with nextReviewAt date
   * @returns Items that are due for review
   */
  getDueItems<T extends { nextReviewAt?: Date }>(items: T[]): T[] {
    const now = new Date();
    return items.filter(
      (item) => item.nextReviewAt && item.nextReviewAt <= now,
    );
  }

  /**
   * Calculate retention rate
   * @param correctCount Number of correct reviews
   * @param totalCount Total number of reviews
   * @returns Retention rate as percentage
   */
  calculateRetentionRate(correctCount: number, totalCount: number): number {
    if (totalCount === 0) return 0;
    return Math.round((correctCount / totalCount) * 100);
  }
}
