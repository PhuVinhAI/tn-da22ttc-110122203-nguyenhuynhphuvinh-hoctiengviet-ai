import type { QuestionAnswer } from './question-options.types';

export interface AssessmentResult {
  isCorrect: boolean;
  similarity?: number;
  partialCredit?: number;
  feedback?: string;
}

export interface AssessmentContext {
  acceptWithoutDiacritics?: boolean;
}

export interface CheckerAdapter {
  check(
    userAnswer: QuestionAnswer,
    correctAnswer: QuestionAnswer,
    context?: AssessmentContext,
  ): AssessmentResult;
}
