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

export interface ExerciseOptionsLike {
  type?: string
  // multiple_choice
  choices?: string[]
  // fill_blank
  sentence?: string
  blanks?: number
  // matching
  pairs?: Array<{ left: string; right: string }>
  // ordering
  items?: string[]
  // translation
  sourceText?: string
  sourceLanguage?: string
  targetLanguage?: string
  // listening / speaking
  audioUrl?: string
  promptText?: string
  promptAudioUrl?: string
  transcriptType?: 'exact' | 'keywords'
  keywords?: string[]
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
    question?: string | null
    questionAudioUrl?: string | null
    exerciseType: string
    difficultyLevel?: number
    options?: ExerciseOptionsLike | null
    exerciseSet?: { id: string; title: string }
  }
  lastAttempt?: {
    id: string
    isCorrect: boolean
    score: number
    attemptedAt: string
  } | null
}

export interface ExerciseAttempt {
  id: string
  isCorrect: boolean
  score: number
  attemptedAt: string
  exercise?: {
    id: string
    question?: string | null
    exerciseType: string
    options?: ExerciseOptionsLike | null
  }
}

export interface PersonalVocabulary {
  id: string
  word: string
  translation: string
  source: string
  partOfSpeech?: string | null
  phonetic?: string | null
  exampleSentence?: string | null
}

export interface BookmarkVocabularyRef {
  id: string
  word: string
  translation: string
  partOfSpeech?: string | null
  phonetic?: string | null
  exampleSentence?: string | null
  region?: string | null
}

export interface BookmarkPersonalVocabularyRef {
  id: string
  word: string
  translation: string
  source: string
  partOfSpeech?: string | null
  phonetic?: string | null
  exampleSentence?: string | null
}

export interface Bookmark {
  id: string
  vocabulary?: BookmarkVocabularyRef | null
  personalVocabulary?: BookmarkPersonalVocabularyRef | null
  createdAt: string
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
