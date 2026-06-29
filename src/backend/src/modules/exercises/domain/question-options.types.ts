import { QuestionType } from '../../../common/enums';

// Base interface cho tất cả exercise options
export interface BaseQuestionOptions {
  type: QuestionType;
}

// Multiple Choice Options
export interface MultipleChoiceOptions extends BaseQuestionOptions {
  type: QuestionType.MULTIPLE_CHOICE;
  choices: string[];
}

export interface MultipleChoiceAnswer {
  selectedChoice: string;
}

// Fill in the Blank Options
export interface FillBlankOptions extends BaseQuestionOptions {
  type: QuestionType.FILL_BLANK;
  sentence: string; // Câu có chỗ trống, mỗi chỗ trống đánh dấu bằng ___ (3 dấu gạch dưới)
  blanks: number; // Số chỗ trống (= số ___ trong sentence)
  acceptedAnswers?: string[][]; // Mảng các đáp án chấp nhận được cho mỗi chỗ trống
  wordBank: string[]; // Kho từ học viên chọn để điền — mobile UX click-to-fill
}

export interface FillBlankAnswer {
  answers: string[]; // Mảng các câu trả lời cho từng chỗ trống
}

// Matching Options
export interface MatchingOptions extends BaseQuestionOptions {
  type: QuestionType.MATCHING;
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
export interface OrderingOptions extends BaseQuestionOptions {
  type: QuestionType.ORDERING;
  items: string[];
}

export interface OrderingAnswer {
  orderedItems: string[];
}

// Translation Options
export interface TranslationOptions extends BaseQuestionOptions {
  type: QuestionType.TRANSLATION;
  sourceText: string; // Văn bản gốc cần dịch
  sourceLanguage: string;
  targetLanguage: string;
  acceptedTranslations?: string[]; // Các bản dịch chấp nhận được
}

export interface TranslationAnswer {
  translation: string;
}

// Listening Options
export interface ListeningOptions extends BaseQuestionOptions {
  type: QuestionType.LISTENING;
  audioUrl: string;
  transcriptType: 'exact' | 'keywords'; // Kiểm tra chính xác hay chỉ keywords
  keywords?: string[]; // Nếu transcriptType = 'keywords'
}

export interface ListeningAnswer {
  transcript: string;
}

// Speaking Options
export interface SpeakingOptions extends BaseQuestionOptions {
  type: QuestionType.SPEAKING;
  promptText?: string;
  promptAudioUrl: string;
  transcriptType: 'exact' | 'keywords';
  keywords?: string[];
}

export interface SpeakingAnswer {
  transcript: string;
}

// Discriminated Union cho tất cả options
export type QuestionOptions =
  | MultipleChoiceOptions
  | FillBlankOptions
  | MatchingOptions
  | OrderingOptions
  | TranslationOptions
  | ListeningOptions
  | SpeakingOptions;

// Discriminated Union cho tất cả answers
export type QuestionAnswer =
  | MultipleChoiceAnswer
  | FillBlankAnswer
  | MatchingAnswer
  | OrderingAnswer
  | TranslationAnswer
  | ListeningAnswer
  | SpeakingAnswer;

// Type guard helpers
export function isMultipleChoiceOptions(
  options: QuestionOptions,
): options is MultipleChoiceOptions {
  return options.type === QuestionType.MULTIPLE_CHOICE;
}

export function isFillBlankOptions(
  options: QuestionOptions,
): options is FillBlankOptions {
  return options.type === QuestionType.FILL_BLANK;
}

export function isMatchingOptions(
  options: QuestionOptions,
): options is MatchingOptions {
  return options.type === QuestionType.MATCHING;
}

export function isOrderingOptions(
  options: QuestionOptions,
): options is OrderingOptions {
  return options.type === QuestionType.ORDERING;
}

export function isTranslationOptions(
  options: QuestionOptions,
): options is TranslationOptions {
  return options.type === QuestionType.TRANSLATION;
}

export function isListeningOptions(
  options: QuestionOptions,
): options is ListeningOptions {
  return options.type === QuestionType.LISTENING;
}

export function isSpeakingOptions(
  options: QuestionOptions,
): options is SpeakingOptions {
  return options.type === QuestionType.SPEAKING;
}
