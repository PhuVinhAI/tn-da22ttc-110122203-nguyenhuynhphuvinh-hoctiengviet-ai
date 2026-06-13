// Shapes shared giữa danh sách học viên (LearnersPage) và các trang chi tiết
// (hội thoại / mô phỏng). Toàn bộ phần phân tích dashboard 360° nằm trong
// LearnerAnalytics — tách riêng để chart pieces dễ tái sử dụng.

export interface Learner {
  id: string
  email: string
  fullName: string
  nativeLanguage: string
  currentLevel: string
  preferredDialect: string
  emailVerified: boolean
  onboardingCompleted: boolean
  role: string
  notificationEnabled: boolean
  notificationTime: string
  provider: string
  avatarUrl?: string | null
  createdAt: string
  updatedAt: string
  summary?: {
    completedLessons: number
    questionResults: number
    personalVocabularyCount: number
    simulationCount: number
  }
}

export interface ConversationDetail {
  conversation: Conversation
  messages: ConversationMessage[]
}

export interface ConversationMessageToolCall {
  name: string
  arguments: unknown
}

export interface ConversationMessageToolResult {
  name: string
  result: unknown
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'tool' | string
  content: string
  tokenCount: number
  interrupted: boolean
  createdAt: string
  toolCalls?: ConversationMessageToolCall[] | null
  toolResults?: ConversationMessageToolResult[] | null
}

export interface SimulationDetail {
  session: SimulationSession
  messages: SimulationMessage[]
}

export interface SimulationFeedbackCorrection {
  original: string
  corrected: string
  type: 'spelling' | 'grammar'
  severity: 'error' | 'warning'
  startIndex: number
  endIndex: number
}

export interface SimulationFeedback {
  corrections: SimulationFeedbackCorrection[]
  review: string | null
  reviewAvailable: boolean
}

export interface SimulationMessage {
  id: string
  isLearner: boolean
  content: string
  translation?: string | null
  orderIndex: number
  feedback?: SimulationFeedback | null
  speakerCharacter?: { id: string; name: string } | null
  speakerCharacterId?: string | null
}

export interface SimulationCriteriaScore {
  name: string
  score: number
  maxScore: number
  comment: string
}

export interface SimulationSession {
  id: string
  status: string
  totalScore?: number | null
  totalMessages: number
  totalTokens?: number
  messageCount?: number
  criteriaScores?: SimulationCriteriaScore[]
  aiSummary?: string | null
  endReason?: string | null
  resultCreatedAt?: string | null
  scenario?: { id: string; title: string }
  chosenCharacter?: { id: string; name: string }
  updatedAt: string
}

export interface Conversation {
  id: string
  title: string
  model: string
  totalTokens: number
  messageCount?: number
  course?: { id: string; title: string } | null
  lesson?: { id: string; title: string } | null
  updatedAt: string
}

// ─── Analytics dashboard (Học viên 360°) ─────────────────────────────────────

export type HealthStatus = 'active' | 'at_risk' | 'dormant' | 'new'
export type SkillStrength = 'strong' | 'average' | 'weak' | 'untested'
export type InsightSeverity = 'success' | 'info' | 'warning' | 'critical'
export type VocabularySource = 'system' | 'manual' | 'image' | 'other'

export interface LearnerHealth {
  status: HealthStatus
  lastActiveAt: string | null
  daysSinceLastActivity: number | null
  riskScore: number
  riskReasons: string[]
  engagementScore: number
  engagementBreakdown: {
    consistency: number
    accuracy: number
    breadth: number
    volume: number
  }
}

export interface LearnerOverview {
  joinedAt: string
  daysSinceJoined: number
  activeDays: number
  activeDaysRate: number
  totalLearningTime: number
  currentStreak: number
  longestStreak: number
  totalQuestionsAttempted: number
  correctAttempts: number
  overallAccuracy: number
  uniqueQuestionsAnswered: number
  completedLessons: number
  completedModules: number
  completedCourses: number
  lessonsInProgress: number
  vocabularyBookmarks: number
  personalVocabulary: number
  aiConversations: number
  aiTokensUsed: number
  simulationSessions: number
  completedSimulations: number
  avgSimulationScore: number | null
  bestSimulationScore: number | null
}

export interface CalendarDay {
  date: string
  value: number
  tier: 0 | 1 | 2 | 3 | 4
}

export interface ActivityCalendar {
  windowDays: number
  max: number
  totalActiveDays: number
  longestActiveRun: number
  days: CalendarDay[]
}

export interface HourHeatmapCell {
  weekday: number
  hour: number
  count: number
}

export interface TrendPoint {
  date: string
  attempts: number
  correct: number
  accuracy: number | null
  lessonsCompleted: number
  vocabularyAdded: number
  aiMessages: number
  activeMinutes: number
}

export interface LearnerTrends {
  range: number
  series: TrendPoint[]
}

export interface SkillRadarEntry {
  questionType: string
  attempts: number
  correct: number
  accuracy: number
  avgTimeMs: number | null
  strength: SkillStrength
}

export interface DifficultyEntry {
  difficulty: number
  attempts: number
  correct: number
  accuracy: number
}

export interface SpeedBucket {
  bucket: string
  count: number
  correct: number
  correctRate: number
}

export interface VocabularyByPos {
  partOfSpeech: string
  count: number
}

export interface RecentVocabulary {
  id: string
  word: string
  translation: string
  partOfSpeech: string | null
  source: VocabularySource
  createdAt: string
}

export interface VocabularyInsights {
  totalBookmarks: number
  systemBookmarks: number
  personalManual: number
  personalImage: number
  addedLast30Days: number
  byPartOfSpeech: VocabularyByPos[]
  recentlyAdded: RecentVocabulary[]
}

export interface CourseProgressRow {
  courseId: string
  title: string
  level: string
  status: string
  completedLessons: number
  totalLessons: number
  completion: number
  timeSpent: number
  lastAccessedAt: string | null
  score: number | null
}

export interface AiConversationSummary {
  total: number
  messages: number
  tokens: number
  avgMessages: number
  avgTokensPerSession: number
  recent: Array<{
    id: string
    title: string
    model: string
    totalTokens: number
    messageCount: number
    courseTitle: string | null
    lessonTitle: string | null
    updatedAt: string
  }>
}

export interface SimulationCriteriaAverage {
  name: string
  avgScore: number
  maxScore: number
  samples: number
}

export interface AiSimulationSummary {
  total: number
  completed: number
  avgScore: number | null
  bestScore: number | null
  avgMessages: number
  totalTokens: number
  criteriaAverages: SimulationCriteriaAverage[]
  recent: Array<{
    id: string
    scenarioTitle: string
    characterName: string | null
    totalScore: number | null
    status: string
    endReason: string | null
    messageCount: number
    updatedAt: string
  }>
}

export interface AiUsage {
  conversations: AiConversationSummary
  simulations: AiSimulationSummary
}

export interface GoalDailyEntry {
  date: string
  questions: number
  lessons: number
  questionsTarget: number
  lessonsTarget: number
  met: boolean
}

export interface GoalsSection {
  daily: Array<{ goalType: string; targetValue: number }>
  goalCompletionLast30Days: GoalDailyEntry[]
  goalCompletionRate: number
  streakSummary: {
    currentStreak: number
    longestStreak: number
    lastGoalMetDate: string | null
    todayMet: boolean
  }
}

export interface LearnerInsight {
  severity: InsightSeverity
  title: string
  message: string
}

export interface LearnerAnalytics {
  generatedAt: string
  today: string
  user: Learner
  health: LearnerHealth
  overview: LearnerOverview
  activityCalendar: ActivityCalendar
  hourHeatmap: HourHeatmapCell[]
  trends: LearnerTrends
  skillRadar: SkillRadarEntry[]
  difficultyBreakdown: DifficultyEntry[]
  speedHistogram: SpeedBucket[]
  vocabularyInsights: VocabularyInsights
  courseProgress: CourseProgressRow[]
  aiUsage: AiUsage
  goals: GoalsSection
  insights: LearnerInsight[]
}
