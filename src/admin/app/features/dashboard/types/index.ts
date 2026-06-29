/**
 * Dashboard response types for:
 * - GET /admin/dashboard/pulse
 * - GET /admin/dashboard/attention
 * - GET /admin/dashboard/activity
 *
 * Backend returns camelCase and the repository unwraps { data: T }.
 * All date buckets are Vietnam calendar days in YYYY-MM-DD format.
 */

export type UserLevelCode = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface PulsePoint {
  date: string
  value: number
}

export interface PulseMetric {
  today: number
  yesterday: number
  series: PulsePoint[]
}

export interface PulseAttemptsMetric extends PulseMetric {
  accuracyToday: number | null
  accuracyYesterday: number | null
}

export interface SystemTotals {
  courses: number
  publishedCourses: number
  lessons: number
  questions: number
  vocabularies: number
  simulations: number
  conversations: number
}

export interface DashboardPulse {
  generatedAt: string
  questionAttempts: PulseAttemptsMetric
  lessonsCompleted: PulseMetric
  aiSessions: PulseMetric
  totals: SystemTotals
}

export interface AttentionGroup<T> {
  count: number
  items: T[]
}

export interface HighErrorQuestionItem {
  questionId: string
  exerciseId: string
  question: string | null
  type: string
  totalAttempts: number
  incorrectCount: number
  errorRate: number
}

export interface EmptyLessonItem {
  lessonId: string
  title: string
  moduleId: string
  moduleTitle: string
  courseTitle: string
  createdAt: string
}

export interface ExerciseWithoutQuestionsItem {
  exerciseId: string
  title: string
  scopeTitle: string | null
  lessonId: string | null
  createdAt: string
}

export interface VocabularyMissingAudioItem {
  vocabularyId: string
  word: string
  translation: string
  lessonId: string
  lessonTitle: string
}

export interface DraftCourseItem {
  courseId: string
  title: string
  level: UserLevelCode
  lessonCount: number
  updatedAt: string
}

export interface FailedGenerationItem {
  exerciseId: string
  title: string
  ownerUserId: string | null
  ownerName: string | null
  ownerEmail: string | null
  updatedAt: string
}

export interface DashboardAttention {
  generatedAt: string
  totalIssues: number
  highErrorQuestions: AttentionGroup<HighErrorQuestionItem>
  emptyLessons: AttentionGroup<EmptyLessonItem>
  exercisesWithoutQuestions: AttentionGroup<ExerciseWithoutQuestionsItem>
  vocabulariesMissingAudio: AttentionGroup<VocabularyMissingAudioItem>
  draftCourses: AttentionGroup<DraftCourseItem>
  failedGenerations: AttentionGroup<FailedGenerationItem>
}

export type ActivityWindow = 7 | 30 | 90

export interface ActivityPoint {
  date: string
  questionAttempts: number
  lessonsCompleted: number
  simulationsCompleted: number
  aiConversations: number
  accuracy: number | null
}

export interface HeatmapCell {
  weekday: number
  hour: number
  count: number
}

export interface ActivityTotals {
  questionAttempts: number
  lessonsCompleted: number
}

export interface DashboardActivity {
  generatedAt: string
  days: number
  series: ActivityPoint[]
  heatmap: HeatmapCell[]
  totals: ActivityTotals
}

export interface IDashboardRepository {
  getPulse(): Promise<DashboardPulse>
  getAttention(): Promise<DashboardAttention>
  getActivity(days: ActivityWindow): Promise<DashboardActivity>
}
