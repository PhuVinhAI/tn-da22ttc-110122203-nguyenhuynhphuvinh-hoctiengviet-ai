import { Injectable } from '@nestjs/common';
import { QuestionType } from '../../../common/enums';
import type { QuestionAnswer } from '../domain/question-options.types';
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
  private readonly registry: Map<QuestionType, CheckerAdapter> = new Map<
    QuestionType,
    CheckerAdapter
  >([
    [QuestionType.MULTIPLE_CHOICE, new MultipleChoiceChecker()],
    [QuestionType.FILL_BLANK, new FillBlankChecker()],
    [QuestionType.MATCHING, new MatchingChecker()],
    [QuestionType.ORDERING, new OrderingChecker()],
    [QuestionType.TRANSLATION, new TranslationChecker()],
    [QuestionType.LISTENING, new ListeningChecker()],
    [QuestionType.SPEAKING, new SpeakingChecker()],
  ]);

  assessAnswer(
    questionType: QuestionType,
    userAnswer: QuestionAnswer,
    correctAnswer: QuestionAnswer,
    context?: AssessmentContext,
  ): AssessmentResult {
    const checker = this.registry.get(questionType);

    if (!checker) {
      return {
        isCorrect: false,
        feedback: `No checker registered for exercise type: ${questionType}`,
      };
    }

    return checker.check(userAnswer, correctAnswer, context);
  }
}
