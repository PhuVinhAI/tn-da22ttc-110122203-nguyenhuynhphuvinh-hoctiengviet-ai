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
    exerciseResults: number
    personalVocabularyCount: number
    simulationCount: number
  }
}

export interface LearnerDetail {
  user: Learner
  summary: {
    progressCount: number
    completedProgressCount: number
    exerciseResultsCount: number
    correctExerciseResultsCount: number
    personalVocabularyCount: number
    bookmarkCount: number
    simulationCount: number
    completedSimulationCount: number
    conversationCount: number
    currentStreak: number
    longestStreak: number
  }
  progress: LearnerProgress[]
  dailyGoals: DailyGoal[]
  dailyProgress: DailyProgress[]
  exerciseResults: ExerciseResult[]
  exerciseAttempts: ExerciseAttempt[]
  personalVocabularies: PersonalVocabulary[]
  bookmarks: Bookmark[]
  simulations: SimulationSession[]
  conversations: Conversation[]
}

export interface ConversationDetail {
  conversation: Conversation
  messages: ConversationMessage[]
}

export interface ConversationMessage {
  id: string
  role: string
  content: string
  tokenCount: number
  interrupted: boolean
  createdAt: string
}

export interface SimulationDetail {
  session: SimulationSession
  messages: SimulationMessage[]
}

export interface SimulationMessage {
  id: string
  isLearner: boolean
  content: string
  translation?: string | null
  orderIndex: number
  feedback?: unknown
  speakerCharacter?: { id: string; name: string } | null
}

export interface LearnerProgress {
  id: string
  unitType: string
  status: string
  score?: number | null
  timeSpent: number
  completedAt?: string | null
  lastAccessedAt?: string | null
  course?: { id: string; title: string }
  module?: { id: string; title: string }
  lesson?: { id: string; title: string }
}

export interface DailyGoal {
  id: string
  goalType: string
  targetValue: number
}

export interface DailyProgress {
  id: string
  date: string
  exercisesCompleted: number
  lessonsCompleted: number
}

export interface ExerciseResult {
  id: string
  isCorrect: boolean
  score: number
  bestScore: number
  attemptCount: number
  attemptedAt: string
  exercise?: {
    id: string
    question: string
    exerciseType: string
    exerciseSet?: { id: string; title: string }
  }
}

export interface ExerciseAttempt {
  id: string
  isCorrect: boolean
  score: number
  attemptedAt: string
  exercise?: { id: string; question: string; exerciseType: string }
}

export interface PersonalVocabulary {
  id: string
  word: string
  translation: string
  source: string
  partOfSpeech?: string | null
}

export interface Bookmark {
  id: string
  vocabulary?: { word: string; translation: string } | null
  personalVocabulary?: { word: string; translation: string } | null
  createdAt: string
}

export interface SimulationSession {
  id: string
  status: string
  totalScore?: number | null
  totalMessages: number
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
  course?: { id: string; title: string } | null
  lesson?: { id: string; title: string } | null
  updatedAt: string
}
