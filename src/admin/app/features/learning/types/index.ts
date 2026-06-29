export interface Course {
  id: string
  title: string
  description: string
  level: string
  orderIndex: number
  isPublished: boolean
  thumbnailUrl?: string | null
  estimatedHours?: number | null
  modules?: Module[]
  createdAt: string
  updatedAt: string
}

export interface Module {
  id: string
  title: string
  description: string
  orderIndex: number
  estimatedHours?: number | null
  courseId: string
  course?: Course
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  title: string
  description: string
  orderIndex: number
  estimatedDuration?: number | null
  moduleId: string
  module?: Module
  contents?: LessonContent[]
  vocabularies?: Vocabulary[]
  grammarRules?: GrammarRule[]
  exercises?: Exercise[]
}

/**
 * LessonContent — nội dung bài học dạng văn bản: tiếng Việt + bản dịch.
 */
export interface LessonContent {
  id: string
  vietnameseText: string
  translation?: string | null
  orderIndex: number
  notes?: string | null
  lessonId: string
}

export interface Vocabulary {
  id: string
  word: string
  translation: string
  partOfSpeech: string
  exampleSentence?: string | null
  exampleTranslation?: string | null
  audioUrl?: string | null
  imageUrl?: string | null
  classifier?: string | null
  dialectVariants?: Record<string, string> | null
  audioUrls?: Record<string, string> | null
  region?: string | null
  orderIndex: number
  lessonId: string
}

export interface GrammarRule {
  id: string
  title: string
  explanation: string
  structure?: string | null
  examples: Array<{ vi: string; en: string; note?: string }>
  notes?: string | null
  orderIndex: number
  lessonId: string
}

export interface Exercise {
  id: string
  lessonId?: string | null
  lesson?: Lesson | null
  title: string
  description?: string | null
  isCustom: boolean
  isAIGenerated: boolean
  orderIndex: number
  questions?: Question[]
}

export interface Question {
  id: string
  questionType: string
  question?: string | null
  questionAudioUrl?: string | null
  options?: unknown
  correctAnswer: unknown
  explanation?: string | null
  orderIndex: number
  exerciseId: string
}
