import type {
  CheckerAdapter,
  AssessmentResult,
} from '../../domain/assessment.types';
import type { MultipleChoiceAnswer } from '../../domain/question-options.types';

export class MultipleChoiceChecker implements CheckerAdapter {
  check(
    userAnswer: MultipleChoiceAnswer,
    correctAnswer: MultipleChoiceAnswer,
  ): AssessmentResult {
    const userChoice = userAnswer.selectedChoice?.trim().toLowerCase();
    const correctChoice = correctAnswer.selectedChoice?.trim().toLowerCase();

    if (!userChoice || !correctChoice) {
      return { isCorrect: false, feedback: 'Missing choice' };
    }

    return { isCorrect: userChoice === correctChoice };
  }
}
