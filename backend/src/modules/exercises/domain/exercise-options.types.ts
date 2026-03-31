import { ExerciseType } from '../../../common/enums';

// Base interface cho tất cả exercise options
export interface BaseExerciseOptions {
  type: ExerciseType;
}

// Multiple Choice Options
export interface MultipleChoiceOptions extends BaseExerciseOptions {
  type: ExerciseType.MULTIPLE_CHOICE;
  choices: string[];
}

export interface MultipleChoiceAnswer {
  selectedChoice: string;
}

// Fill in the Blank Options
export interface FillBlankOptions extends BaseExerciseOptions {
  type: ExerciseType.FILL_BLANK;
  blanks: number; // Số chỗ trống
  acceptedAnswers?: string[][]; // Mảng các đáp án chấp nhận được cho mỗi chỗ trống
}

export interface FillBlankAnswer {
  answers: string[]; // Mảng các câu trả lời cho từng chỗ trống
}

// Matching Options
export interface MatchingOptions extends BaseExerciseOptions {
  type: ExerciseType.MATCHING;
  pairs: Array<{
    left: string;
    right: string;
  }>;
}

export interface MatchingAnswer {
  matches: Array<{
    left: string;
    right: string;
  }>;
}

// Ordering Options
export interface OrderingOptions extends BaseExerciseOptions {
  type: ExerciseType.ORDERING;
  items: string[];
}

export interface OrderingAnswer {
  orderedItems: string[];
}

// Translation Options
export interface TranslationOptions extends BaseExerciseOptions {
  type: ExerciseType.TRANSLATION;
  sourceLanguage: string;
  targetLanguage: string;
  acceptedTranslations?: string[]; // Các bản dịch chấp nhận được
}

export interface TranslationAnswer {
  translation: string;
}

// Listening Options
export interface ListeningOptions extends BaseExerciseOptions {
  type: ExerciseType.LISTENING;
  audioUrl: string;
  transcriptType: 'exact' | 'keywords'; // Kiểm tra chính xác hay chỉ keywords
  keywords?: string[]; // Nếu transcriptType = 'keywords'
}

export interface ListeningAnswer {
  transcript: string;
}

// Discriminated Union cho tất cả options
export type ExerciseOptions =
  | MultipleChoiceOptions
  | FillBlankOptions
  | MatchingOptions
  | OrderingOptions
  | TranslationOptions
  | ListeningOptions;

// Discriminated Union cho tất cả answers
export type ExerciseAnswer =
  | MultipleChoiceAnswer
  | FillBlankAnswer
  | MatchingAnswer
  | OrderingAnswer
  | TranslationAnswer
  | ListeningAnswer;

// Type guard helpers
export function isMultipleChoiceOptions(
  options: ExerciseOptions,
): options is MultipleChoiceOptions {
  return options.type === ExerciseType.MULTIPLE_CHOICE;
}

export function isFillBlankOptions(
  options: ExerciseOptions,
): options is FillBlankOptions {
  return options.type === ExerciseType.FILL_BLANK;
}

export function isMatchingOptions(
  options: ExerciseOptions,
): options is MatchingOptions {
  return options.type === ExerciseType.MATCHING;
}

export function isOrderingOptions(
  options: ExerciseOptions,
): options is OrderingOptions {
  return options.type === ExerciseType.ORDERING;
}

export function isTranslationOptions(
  options: ExerciseOptions,
): options is TranslationOptions {
  return options.type === ExerciseType.TRANSLATION;
}

export function isListeningOptions(
  options: ExerciseOptions,
): options is ListeningOptions {
  return options.type === ExerciseType.LISTENING;
}
