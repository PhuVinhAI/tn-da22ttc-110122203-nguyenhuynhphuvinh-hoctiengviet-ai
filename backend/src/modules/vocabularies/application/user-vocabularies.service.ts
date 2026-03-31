import { Injectable } from '@nestjs/common';
import { UserVocabulariesRepository } from './repositories/user-vocabularies.repository';
import { UserVocabulary } from '../domain/user-vocabulary.entity';
import { MasteryLevel } from '../../../common/enums';
import { SpacedRepetitionService } from '../../progress/application/spaced-repetition.service';
import { Rating } from '../../progress/application/fsrs.service';

@Injectable()
export class UserVocabulariesService {
  constructor(
    private readonly userVocabulariesRepository: UserVocabulariesRepository,
    private readonly spacedRepetitionService: SpacedRepetitionService,
  ) {}

  async addVocabulary(
    userId: string,
    vocabularyId: string,
  ): Promise<UserVocabulary> {
    const existing =
      await this.userVocabulariesRepository.findByUserAndVocabulary(
        userId,
        vocabularyId,
      );

    if (existing) {
      return existing;
    }

    // Initialize with FSRS
    const newCard = this.spacedRepetitionService.initializeCard();

    return this.userVocabulariesRepository.create({
      userId,
      vocabularyId,
      masteryLevel: MasteryLevel.LEARNING,
      nextReviewAt: newCard.due,
      stability: newCard.stability,
      difficulty: newCard.difficulty,
      state: newCard.state,
      elapsedDays: newCard.elapsedDays,
      scheduledDays: newCard.scheduledDays,
      reps: newCard.reps,
      lapses: newCard.lapses,
    });
  }

  async reviewVocabulary(
    userId: string,
    vocabularyId: string,
    rating: Rating, // 1=Again, 2=Hard, 3=Good, 4=Easy
    reviewDate?: Date, // Optional: for testing time-based scenarios
  ): Promise<UserVocabulary> {
    const userVocab =
      await this.userVocabulariesRepository.findByUserAndVocabulary(
        userId,
        vocabularyId,
      );

    if (!userVocab) {
      throw new Error('User vocabulary not found');
    }

    // Convert to FSRS card
    const currentCard = this.spacedRepetitionService.toCard(userVocab);

    // Use provided date or current date
    const now = reviewDate || new Date();

    // Calculate next review using FSRS with custom date
    const nextCard = this.spacedRepetitionService.calculateNextReviewWithDate(
      currentCard,
      rating,
      now,
    );

    // Update review counts
    const reviewCount = userVocab.reviewCount + 1;
    const isCorrect = rating >= Rating.Good;
    const correctCount = isCorrect
      ? userVocab.correctCount + 1
      : userVocab.correctCount;

    // Calculate mastery level based on FSRS state and stability
    const masteryLevel = this.getMasteryLevel(nextCard.state, nextCard.stability);

    return this.userVocabulariesRepository.update(userVocab.id, {
      reviewCount,
      correctCount,
      masteryLevel,
      lastReviewedAt: now,
      nextReviewAt: nextCard.due,
      stability: nextCard.stability,
      difficulty: nextCard.difficulty,
      state: nextCard.state,
      elapsedDays: nextCard.elapsedDays,
      scheduledDays: nextCard.scheduledDays,
      reps: nextCard.reps,
      lapses: nextCard.lapses,
    });
  }

  private getMasteryLevel(state: number, stability: number): MasteryLevel {
    // New or Learning state
    if (state === 0 || state === 1 || state === 3) {
      return MasteryLevel.LEARNING;
    }

    // Review state - check stability
    if (stability >= 100) {
      return MasteryLevel.MASTERED;
    } else if (stability >= 21) {
      return MasteryLevel.FAMILIAR;
    }

    return MasteryLevel.LEARNING;
  }

  async getUserVocabularies(userId: string): Promise<UserVocabulary[]> {
    return this.userVocabulariesRepository.findByUserId(userId);
  }

  async getDueForReview(userId: string): Promise<UserVocabulary[]> {
    return this.userVocabulariesRepository.findDueForReview(userId);
  }
}
