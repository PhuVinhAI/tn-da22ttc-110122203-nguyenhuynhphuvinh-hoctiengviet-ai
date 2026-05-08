import { ExerciseType } from '../../../common/enums';
import type { ExerciseAnswer } from '../domain/exercise-options.types';

/**
 * Normalizes old answer formats to new ExerciseAnswer format.
 *
 * Old formats (backward compatibility):
 * - MultipleChoice: string → { selectedChoice }
 * - FillBlank: string[] → { answers }
 * - Ordering: string[] → { orderedItems }
 * - Translation: string → { translation }
 * - Listening: string → { transcript }
 *
 * New formats pass through unchanged.
 *
 * @deprecated Remove when all clients send new format.
 */
export class AnswerNormalizer {
  normalize(exerciseType: ExerciseType, raw: unknown): ExerciseAnswer {
    if (raw == null) {
      return this.defaultFor(exerciseType);
    }

    switch (exerciseType) {
      case ExerciseType.MULTIPLE_CHOICE:
        return this.normalizeMultipleChoice(raw);
      case ExerciseType.FILL_BLANK:
        return this.normalizeFillBlank(raw);
      case ExerciseType.MATCHING:
        return this.normalizeMatching(raw);
      case ExerciseType.ORDERING:
        return this.normalizeOrdering(raw);
      case ExerciseType.TRANSLATION:
        return this.normalizeTranslation(raw);
      case ExerciseType.LISTENING:
        return this.normalizeListening(raw);
      default:
        return {} as ExerciseAnswer;
    }
  }

  private normalizeMultipleChoice(raw: unknown) {
    if (typeof raw === 'string') {
      return { selectedChoice: raw };
    }
    return raw as ExerciseAnswer;
  }

  private normalizeFillBlank(raw: unknown) {
    if (Array.isArray(raw)) {
      return { answers: raw };
    }
    return raw as ExerciseAnswer;
  }

  private normalizeMatching(raw: unknown) {
    return raw as ExerciseAnswer;
  }

  private normalizeOrdering(raw: unknown) {
    if (Array.isArray(raw)) {
      return { orderedItems: raw };
    }
    return raw as ExerciseAnswer;
  }

  private normalizeTranslation(raw: unknown) {
    if (typeof raw === 'string') {
      return { translation: raw };
    }
    return raw as ExerciseAnswer;
  }

  private normalizeListening(raw: unknown) {
    if (typeof raw === 'string') {
      return { transcript: raw };
    }
    return raw as ExerciseAnswer;
  }

  private defaultFor(exerciseType: ExerciseType): ExerciseAnswer {
    switch (exerciseType) {
      case ExerciseType.MULTIPLE_CHOICE:
        return { selectedChoice: '' };
      case ExerciseType.FILL_BLANK:
        return { answers: [] };
      case ExerciseType.MATCHING:
        return { matches: [] };
      case ExerciseType.ORDERING:
        return { orderedItems: [] };
      case ExerciseType.TRANSLATION:
        return { translation: '' };
      case ExerciseType.LISTENING:
        return { transcript: '' };
      default:
        return {} as ExerciseAnswer;
    }
  }
}
