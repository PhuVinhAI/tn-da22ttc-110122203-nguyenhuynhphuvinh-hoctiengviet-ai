import type {
  CheckerAdapter,
  AssessmentResult,
  AssessmentContext,
} from '../../domain/assessment.types';
import type { FillBlankAnswer } from '../../domain/exercise-options.types';
import {
  normalizeVietnamese,
  stripVietnameseDiacritics,
} from '../utils/text-normalizer';

export class FillBlankChecker implements CheckerAdapter {
  check(
    userAnswer: FillBlankAnswer,
    correctAnswer: FillBlankAnswer,
    context?: AssessmentContext,
  ): AssessmentResult {
    const userAnswers = userAnswer.answers;
    const correctAnswers = correctAnswer.answers;

    if (userAnswers.length !== correctAnswers.length) {
      return {
        isCorrect: false,
        feedback: 'Number of answers does not match blanks',
      };
    }

    const allCorrect = userAnswers.every((ans, i) => {
      const normalizedUser = normalizeVietnamese(ans);
      const normalizedCorrect = normalizeVietnamese(correctAnswers[i]);

      if (normalizedUser === normalizedCorrect) return true;

      if (context?.acceptWithoutDiacritics) {
        return (
          stripVietnameseDiacritics(normalizedUser) ===
          stripVietnameseDiacritics(normalizedCorrect)
        );
      }

      return false;
    });

    return { isCorrect: allCorrect };
  }
}
