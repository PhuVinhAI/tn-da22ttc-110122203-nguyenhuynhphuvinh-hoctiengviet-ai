export interface Course {
  id: string
  title: string
  description: string
  level: string
  orderIndex: number
  isPublished: boolean
  thumbnailUrl?: string | null
  estimatedHours?: number | null
  vietnameseLevelName?: string | null
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
  topic?: string | null
  courseId: string
  course?: Course
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  title: string
  description: string
  lessonType: string
  orderIndex: number
  estimatedDuration?: number | null
  isAssessment: boolean
  moduleId: string
  module?: Module
  contents?: LessonContent[]
  vocabularies?: Vocabulary[]
  grammarRules?: GrammarRule[]
  exerciseSets?: ExerciseSet[]
}

export interface LessonContent {
  id: string
  contentType: string
  vietnameseText: string
  translation?: string | null
  phonetic?: string | null
  audioUrl?: string | null
  imageUrl?: string | null
  videoUrl?: string | null
  orderIndex: number
  notes?: string | null
  lessonId: string
}

export interface Vocabulary {
  id: string
  word: string
  translation: string
  phonetic?: string | null
  partOfSpeech: string
  exampleSentence?: string | null
  exampleTranslation?: string | null
  audioUrl?: string | null
  imageUrl?: string | null
  classifier?: string | null
  dialectVariants?: Record<string, string> | null
  audioUrls?: Record<string, string> | null
  region?: string | null
  difficultyLevel: number
  lessonId: string
}

export interface GrammarRule {
  id: string
  title: string
  explanation: string
  structure?: string | null
  examples: Array<{ vi: string; en: string; note?: string }>
  notes?: string | null
  difficultyLevel: number
  lessonId: string
}

export interface ExerciseSet {
  id: string
  lessonId?: string | null
  title: string
  description?: string | null
  isCustom: boolean
  isAIGenerated: boolean
  orderIndex: number
  exercises?: Exercise[]
}

export interface Exercise {
  id: string
  exerciseType: string
  question: string
  questionAudioUrl?: string | null
  options?: unknown
  correctAnswer: unknown
  explanation?: string | null
  orderIndex: number
  difficultyLevel: number
  setId: string
}
