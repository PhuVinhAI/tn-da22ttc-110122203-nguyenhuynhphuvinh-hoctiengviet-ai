import type {
  CheckerAdapter,
  AssessmentResult,
  AssessmentContext,
} from '../../domain/assessment.types';
import type { SpeakingAnswer } from '../../domain/question-options.types';
import {
  normalizeVietnamese,
  stripVietnameseDiacritics,
} from '../utils/text-normalizer';

export class SpeakingChecker implements CheckerAdapter {
  check(
    userAnswer: SpeakingAnswer,
    correctAnswer: SpeakingAnswer,
    context?: AssessmentContext,
  ): AssessmentResult {
    const userTranscript = userAnswer.transcript;
    const correctTranscript = correctAnswer.transcript;

    if (!userTranscript || !correctTranscript) {
      return { isCorrect: false, feedback: 'Missing transcript' };
    }

    const normalizedUser = normalizeVietnamese(userTranscript);
    const normalizedCorrect = normalizeVietnamese(correctTranscript);

    if (normalizedUser === normalizedCorrect) return { isCorrect: true };

    if (context?.acceptWithoutDiacritics) {
      return {
        isCorrect:
          stripVietnameseDiacritics(normalizedUser) ===
          stripVietnameseDiacritics(normalizedCorrect),
      };
    }

    return { isCorrect: false };
  }
}
