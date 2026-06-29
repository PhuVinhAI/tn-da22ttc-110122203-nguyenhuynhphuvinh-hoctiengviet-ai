import { QuestionType } from '../../../common/enums';
import type { QuestionAnswer } from '../domain/question-options.types';

/**
 * Normalizes old answer formats to new QuestionAnswer format.
 *
 * Old formats (backward compatibility):
 * - MultipleChoice: string → { selectedChoice }
 * - FillBlank: string[] → { answers }
 * - Ordering: string[] → { orderedItems }
 * - Translation: string → { translation }
 * - Listening: string → { transcript }
 * - Speaking: string → { transcript }
 *
 * New formats pass through unchanged.
 *
 * @deprecated Remove when all clients send new format.
 */
export class AnswerNormalizer {
  normalize(questionType: QuestionType, raw: unknown): QuestionAnswer {
    if (raw == null) {
      return this.defaultFor(questionType);
    }

    switch (questionType) {
      case QuestionType.MULTIPLE_CHOICE:
        return this.normalizeMultipleChoice(raw);
      case QuestionType.FILL_BLANK:
        return this.normalizeFillBlank(raw);
      case QuestionType.MATCHING:
        return this.normalizeMatching(raw);
      case QuestionType.ORDERING:
        return this.normalizeOrdering(raw);
      case QuestionType.TRANSLATION:
        return this.normalizeTranslation(raw);
      case QuestionType.LISTENING:
        return this.normalizeListening(raw);
      case QuestionType.SPEAKING:
        return this.normalizeSpeaking(raw);
      default:
        return {} as QuestionAnswer;
    }
  }

  private normalizeMultipleChoice(raw: unknown) {
    if (typeof raw === 'string') {
      return { selectedChoice: raw };
    }
    return raw as QuestionAnswer;
  }

  private normalizeFillBlank(raw: unknown) {
    if (Array.isArray(raw)) {
      return { answers: raw };
    }
    return raw as QuestionAnswer;
  }

  private normalizeMatching(raw: unknown) {
    return raw as QuestionAnswer;
  }

  private normalizeOrdering(raw: unknown) {
    if (Array.isArray(raw)) {
      return { orderedItems: raw };
    }
    return raw as QuestionAnswer;
  }

  private normalizeTranslation(raw: unknown) {
    if (typeof raw === 'string') {
      return { translation: raw };
    }
    return raw as QuestionAnswer;
  }

  private normalizeListening(raw: unknown) {
    if (typeof raw === 'string') {
      return { transcript: raw };
    }
    return raw as QuestionAnswer;
  }

  private normalizeSpeaking(raw: unknown) {
    if (typeof raw === 'string') {
      return { transcript: raw };
    }
    return raw as QuestionAnswer;
  }

  private defaultFor(questionType: QuestionType): QuestionAnswer {
    switch (questionType) {
      case QuestionType.MULTIPLE_CHOICE:
        return { selectedChoice: '' };
      case QuestionType.FILL_BLANK:
        return { answers: [] };
      case QuestionType.MATCHING:
        return { matches: [] };
      case QuestionType.ORDERING:
        return { orderedItems: [] };
      case QuestionType.TRANSLATION:
        return { translation: '' };
      case QuestionType.LISTENING:
      case QuestionType.SPEAKING:
        return { transcript: '' };
      default:
        return {} as QuestionAnswer;
    }
  }
}
