import type {
  CheckerAdapter,
  AssessmentResult,
  AssessmentContext,
} from '../../domain/assessment.types';
import type { TranslationAnswer } from '../../domain/question-options.types';
import {
  normalizeVietnamese,
  stripVietnameseDiacritics,
  calculateSimilarity,
} from '../utils/text-normalizer';

export class TranslationChecker implements CheckerAdapter {
  private readonly SIMILARITY_THRESHOLD = 0.8;

  check(
    userAnswer: TranslationAnswer,
    correctAnswer: TranslationAnswer,
    context?: AssessmentContext,
  ): AssessmentResult {
    const userTranslation = userAnswer.translation;
    const correctTranslation = correctAnswer.translation;

    if (!userTranslation || !correctTranslation) {
      return {
        isCorrect: false,
        similarity: 0,
        feedback: 'Missing translation',
      };
    }

    const normalizedUser = normalizeVietnamese(userTranslation);
    const normalizedCorrect = normalizeVietnamese(correctTranslation);
    const similarity = calculateSimilarity(normalizedUser, normalizedCorrect);

    if (similarity > this.SIMILARITY_THRESHOLD) {
      return { isCorrect: true, similarity };
    }

    if (context?.acceptWithoutDiacritics) {
      const strippedUser = stripVietnameseDiacritics(normalizedUser);
      const strippedCorrect = stripVietnameseDiacritics(normalizedCorrect);
      const strippedSimilarity = calculateSimilarity(
        strippedUser,
        strippedCorrect,
      );
      return {
        isCorrect: strippedSimilarity > this.SIMILARITY_THRESHOLD,
        similarity: strippedSimilarity,
      };
    }

    return { isCorrect: false, similarity };
  }
}
