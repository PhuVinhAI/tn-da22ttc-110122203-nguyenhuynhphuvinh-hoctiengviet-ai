import type {
  CheckerAdapter,
  AssessmentResult,
} from '../../domain/assessment.types';
import type { OrderingAnswer } from '../../domain/question-options.types';

export class OrderingChecker implements CheckerAdapter {
  check(
    userAnswer: OrderingAnswer,
    correctAnswer: OrderingAnswer,
  ): AssessmentResult {
    const userItems = userAnswer.orderedItems;
    const correctItems = correctAnswer.orderedItems;

    if (userItems.length !== correctItems.length) {
      return { isCorrect: false, feedback: 'Number of items does not match' };
    }

    const allCorrect = userItems.every(
      (item, i) =>
        item.trim().toLowerCase() === correctItems[i].trim().toLowerCase(),
    );

    return { isCorrect: allCorrect };
  }
}
