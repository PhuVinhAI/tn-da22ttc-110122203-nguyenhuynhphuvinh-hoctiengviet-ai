import { Injectable } from '@nestjs/common';
import { ExerciseType } from '../../../common/enums';
import type { ExerciseAnswer } from '../domain/exercise-options.types';
import type {
  AssessmentResult,
  AssessmentContext,
  CheckerAdapter,
} from '../domain/assessment.types';
import { MultipleChoiceChecker } from './checkers/multiple-choice.checker';
import { FillBlankChecker } from './checkers/fill-blank.checker';
import { MatchingChecker } from './checkers/matching.checker';
import { OrderingChecker } from './checkers/ordering.checker';
import { TranslationChecker } from './checkers/translation.checker';
import { ListeningChecker } from './checkers/listening.checker';
import { SpeakingChecker } from './checkers/speaking.checker';

@Injectable()
export class AnswerAssessment {
  private readonly registry: Map<ExerciseType, CheckerAdapter> = new Map<
    ExerciseType,
    CheckerAdapter
  >([
    [ExerciseType.MULTIPLE_CHOICE, new MultipleChoiceChecker()],
    [ExerciseType.FILL_BLANK, new FillBlankChecker()],
    [ExerciseType.MATCHING, new MatchingChecker()],
    [ExerciseType.ORDERING, new OrderingChecker()],
    [ExerciseType.TRANSLATION, new TranslationChecker()],
    [ExerciseType.LISTENING, new ListeningChecker()],
    [ExerciseType.SPEAKING, new SpeakingChecker()],
  ]);

  assessAnswer(
    exerciseType: ExerciseType,
    userAnswer: ExerciseAnswer,
    correctAnswer: ExerciseAnswer,
    context?: AssessmentContext,
  ): AssessmentResult {
    const checker = this.registry.get(exerciseType);

    if (!checker) {
      return {
        isCorrect: false,
        feedback: `No checker registered for exercise type: ${exerciseType}`,
      };
    }

    return checker.check(userAnswer, correctAnswer, context);
  }
}
