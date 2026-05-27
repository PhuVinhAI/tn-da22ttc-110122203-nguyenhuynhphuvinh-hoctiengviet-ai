import type { ExerciseAnswer } from './exercise-options.types';

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
    userAnswer: ExerciseAnswer,
    correctAnswer: ExerciseAnswer,
    context?: AssessmentContext,
  ): AssessmentResult;
}
