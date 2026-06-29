import type {
  CheckerAdapter,
  AssessmentResult,
} from '../../domain/assessment.types';
import type { MatchingAnswer } from '../../domain/question-options.types';

export class MatchingChecker implements CheckerAdapter {
  check(
    userAnswer: MatchingAnswer,
    correctAnswer: MatchingAnswer,
  ): AssessmentResult {
    const userMatches = userAnswer.matches;
    const correctMatches = correctAnswer.matches;

    if (userMatches.length !== correctMatches.length) {
      return { isCorrect: false, feedback: 'Number of matches does not match' };
    }

    const userMap = new Map(
      userMatches.map((m) => [
        m.left.trim().toLowerCase(),
        m.right.trim().toLowerCase(),
      ]),
    );
    const correctMap = new Map(
      correctMatches.map((m) => [
        m.left.trim().toLowerCase(),
        m.right.trim().toLowerCase(),
      ]),
    );

    for (const [left, right] of correctMap) {
      if (userMap.get(left) !== right) {
        return { isCorrect: false };
      }
    }

    return { isCorrect: true };
  }
}
