import {
  ArrowDownUp,
  BookMarked,
  CheckSquare,
  Edit3,
  FileText,
  Headphones,
  Languages,
  Lightbulb,
  Link2,
  Mic,
  type LucideIcon,
} from 'lucide-react'
import type { Lesson, Question } from '../../features/learning/types'

/**
 * Meta cho Giai đoạn soạn bài (xem CONTEXT.md & ADR 0002):
 * Giai đoạn 1 — Nội dung bài học (3 Khu soạn), Giai đoạn 2 — Bài tập (Khu soạn theo loại câu hỏi).
 */

export interface QuestionTypeMeta {
  value: string
  label: string
  description: string
  Icon: LucideIcon
  /** màu chữ nhấn (text-*) */
  tone: string
  /** chấm màu (bg-*) */
  dot: string
  /** nền icon đậm (bg-*) cho header Khu soạn */
  bg: string
}

export const QUESTION_TYPES: QuestionTypeMeta[] = [
  {
    value: 'multiple_choice',
    label: 'Trắc nghiệm',
    description: 'Học viên chọn một đáp án đúng trong nhiều lựa chọn.',
    Icon: CheckSquare,
    tone: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
    bg: 'bg-blue-500',
  },
  {
    value: 'fill_blank',
    label: 'Điền chỗ trống',
    description: 'Học viên điền từ còn thiếu vào chỗ trống trong câu.',
    Icon: Edit3,
    tone: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-500',
  },
  {
    value: 'matching',
    label: 'Ghép cặp',
    description: 'Học viên ghép các cặp tương ứng giữa hai cột.',
    Icon: Link2,
    tone: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
    bg: 'bg-purple-500',
  },
  {
    value: 'ordering',
    label: 'Sắp xếp',
    description: 'Học viên sắp xếp các từ hoặc cụm từ theo đúng thứ tự.',
    Icon: ArrowDownUp,
    tone: 'text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-500',
    bg: 'bg-indigo-500',
  },
  {
    value: 'translation',
    label: 'Dịch thuật',
    description: 'Học viên dịch câu giữa tiếng Việt và ngôn ngữ nguồn.',
    Icon: Languages,
    tone: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    bg: 'bg-amber-500',
  },
  {
    value: 'listening',
    label: 'Nghe hiểu',
    description: 'Học viên nghe audio và trả lời câu hỏi.',
    Icon: Headphones,
    tone: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
    bg: 'bg-rose-500',
  },
  {
    value: 'speaking',
    label: 'Nói',
    description: 'Học viên nói theo yêu cầu và được AI đánh giá phát âm.',
    Icon: Mic,
    tone: 'text-cyan-700 dark:text-cyan-300',
    dot: 'bg-cyan-500',
    bg: 'bg-cyan-500',
  },
]

export function questionTypeMeta(value: string | null | undefined): QuestionTypeMeta | undefined {
  const key = (value ?? '').toLowerCase()
  return QUESTION_TYPES.find((t) => t.value === key)
}

export interface LessonSectionMeta {
  value: string
  label: string
  description: string
  /** mô tả 1 dòng hiện trên cổng ở hub */
  hint: string
  Icon: LucideIcon
  count: (lesson: Lesson | undefined) => number
}

/** 3 Khu soạn của Giai đoạn 1 — thứ tự cũng là trình tự soạn gợi ý. */
export const LESSON_SECTIONS: LessonSectionMeta[] = [
  {
    value: 'materials',
    label: 'Nội dung bài',
    description:
      'Đoạn văn tiếng Việt kèm bản dịch tiếng Anh mà học viên đọc khi vào bài, theo thứ tự trình bày.',
    hint: 'Văn bản tiếng Việt + bản dịch',
    Icon: FileText,
    count: (lesson) => lesson?.contents?.length ?? 0,
  },
  {
    value: 'vocabulary',
    label: 'Từ vựng',
    description: 'Các từ tiếng Việt kèm nghĩa, từ loại, danh từ phân loại và câu ví dụ của bài học.',
    hint: 'Từ, nghĩa, từ loại, ví dụ',
    Icon: BookMarked,
    count: (lesson) => lesson?.vocabularies?.length ?? 0,
  },
  {
    value: 'grammar',
    label: 'Quy tắc ngữ pháp',
    description: 'Cấu trúc ngữ pháp kèm giải thích và ví dụ song ngữ của bài học.',
    hint: 'Cấu trúc, giải thích, ví dụ song ngữ',
    Icon: Lightbulb,
    count: (lesson) => lesson?.grammarRules?.length ?? 0,
  },
]

export function lessonSectionMeta(value: string | null | undefined): LessonSectionMeta | undefined {
  return LESSON_SECTIONS.find((s) => s.value === value)
}

/** Tổng số mục Giai đoạn 1 — dùng cho trạng thái hoàn thành và gating mềm sang Giai đoạn 2. */
export function stageOneTotal(lesson: Lesson | undefined): number {
  return LESSON_SECTIONS.reduce((sum, s) => sum + s.count(lesson), 0)
}

/** Nhãn ngắn đại diện một Câu hỏi (đề bài hoặc nội dung chính theo loại). */
export function questionLabel(question: Question | null | undefined): string {
  if (!question) return ''
  if (question.question && question.question.trim()) return question.question
  const opts = question.options as Record<string, unknown> | null | undefined
  if (opts) {
    if (typeof opts.sentence === 'string' && opts.sentence) return opts.sentence
    if (typeof opts.sourceText === 'string' && opts.sourceText) return opts.sourceText
    if (Array.isArray(opts.pairs) && opts.pairs.length > 0) {
      const first = opts.pairs[0] as { left?: string; right?: string }
      return `${first.left ?? ''} ↔ ${first.right ?? ''}`
    }
  }
  return question.questionType ?? 'Câu hỏi'
}
