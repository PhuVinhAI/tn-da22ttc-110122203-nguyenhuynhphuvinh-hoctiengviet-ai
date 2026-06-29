// Shared types and helpers for type-specific exercise forms.
//
// Each form owns its own draft state and exposes:
//   - `payload`: the body of options + correctAnswer the parent will merge with
//     the common toolbar fields (questionType / difficulty / audio / explanation).
//   - `question`: nullable; only MULTIPLE_CHOICE / ORDERING / LISTENING / SPEAKING
//     fill this. FILL_BLANK / MATCHING / TRANSLATION return null.
//   - `validate(): string | null`: returns an error string when the draft is not
//     ready to save.

export interface QuestionFormPayload {
  question: string | null
  options: Record<string, unknown> | null
  correctAnswer: Record<string, unknown>
}

export interface QuestionFormHandle {
  payload: QuestionFormPayload
  validate: () => string | null
}

export interface QuestionFormProps {
  initial: Record<string, unknown> | null
  onChange: (handle: QuestionFormHandle) => void
}

export const LANGUAGE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'zh', label: '中文' },
]

export function getOptionsObject(
  initial: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!initial) return {}
  const opts = initial.options
  if (opts && typeof opts === 'object' && !Array.isArray(opts)) {
    return opts as Record<string, unknown>
  }
  return {}
}

export function getCorrectAnswerObject(
  initial: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!initial) return {}
  const correct = initial.correctAnswer
  if (correct && typeof correct === 'object' && !Array.isArray(correct)) {
    return correct as Record<string, unknown>
  }
  return {}
}
