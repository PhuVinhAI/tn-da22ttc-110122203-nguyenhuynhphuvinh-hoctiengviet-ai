export type PersonaId =
  | 'power_user'
  | 'steady_learner'
  | 'weekend_warrior'
  | 'simulation_focused'
  | 'lesson_focused'
  | 'trial_dropout'
  | 'returning_learner'
  | 'goal_driven';

export type AccountFunnel =
  | 'registered_unverified'
  | 'registered_unverified_stale'
  | 'verified_never_onboarded'
  | 'google_no_onboarding'
  | 'onboarded_zero_activity'
  | 'onboarded_instant_churn'
  | 'onboarded_day_one_quit'
  | 'onboarded_early_churn'
  | 'active_learner';

export type LifecycleStage =
  | 'signup'
  | 'verification_pending'
  | 'onboarding_pending'
  | 'onboarding'
  | 'exploring'
  | 'building_habit'
  | 'advancing'
  | 'proficient'
  | 'churned'
  | 'dormant';

export interface LessonCatalogEntry {
  ref: string;
  courseRef: string;
  moduleRef: string;
  level: string;
  title: string;
  questionCount: number;
  orderInCourse: number;
}

export interface DailyActivityEntry {
  date: string;
  lessonsCompleted: number;
  questionsCompleted: number;
  simulationsCompleted: number;
  activeMinutes: number;
  goalsMet: boolean;
}

export interface LessonProgressEntry {
  lessonRef: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  contentViewed: boolean;
  timeSpent: number;
  completedAt?: string;
  lastAccessedAt?: string;
}

export interface QuestionResultEntry {
  lessonRef: string;
  orderIndex: number;
  isCorrect: boolean;
  score: number;
  attemptedAt: string;
  timeTaken: number;
}

export interface SimulationCriteriaScoreSeed {
  name: string;
  score: number;
  maxScore: number;
  comment: string;
}

export interface SimulationMessageSeed {
  isLearner: boolean;
  content: string;
  translation: string | null;
  orderIndex: number;
}

export interface SimulationSessionEntry {
  scenarioTitle: string;
  status: 'COMPLETED';
  totalScore: number;
  totalMessages: number;
  totalTokens: number;
  endReason: 'COMPLETED' | 'TOO_MANY_ERRORS' | 'INAPPROPRIATE' | 'ABUSIVE';
  aiSummary: string | null;
  criteriaScores: SimulationCriteriaScoreSeed[];
  messages: SimulationMessageSeed[];
  completedAt: string;
}

export interface QuestionAttemptEntry {
  lessonRef: string;
  orderIndex: number;
  isCorrect: boolean;
  score: number;
  attemptedAt: string;
  timeTaken: number;
}

export interface ConversationMessageSeed {
  role: 'user' | 'assistant';
  content: string;
  tokenCount: number;
  offsetMinutes: number;
}

export interface ConversationSeed {
  title: string;
  model: string;
  startedAt: string;
  updatedAt: string;
  lessonRef: string | null;
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  messages: ConversationMessageSeed[];
}

export interface BookmarkSeed {
  kind: 'system' | 'personal';
  /** index into personalVocabularies (when kind=personal) */
  personalIndex?: number;
  createdAt: string;
}

export interface DailyGoalEntry {
  goalType: 'QUESTIONS' | 'SIMULATIONS' | 'LESSONS';
  targetValue: number;
}

export interface OnboardingSeed {
  completed: boolean;
  completedAt: string | null;
  selectedLevel: string;
  preferredDialect: string;
  completeLowerCourses: boolean;
}

export interface UserSeedFile {
  schemaVersion: 3;
  seedId: string;
  profile: {
    email: string;
    password: string | null;
    fullName: string;
    nativeLanguage: string;
    currentLevel: string;
    preferredDialect: string;
    emailVerified: boolean;
    emailVerifiedAt: string | null;
    onboardingCompleted: boolean;
    notificationEnabled: boolean;
    notificationTime: string;
    registeredAt: string;
    provider: 'local' | 'google';
    googleId: string | null;
    avatarUrl: string | null;
  };
  onboarding: OnboardingSeed;
  lifecycle: {
    accountFunnel: AccountFunnel;
    tenureDays: number;
    stage: LifecycleStage;
    persona: PersonaId | null;
    lastActiveAt: string | null;
    activeDays: number;
    verifiedAfterHours: number | null;
    daysFromRegisterToOnboarding: number | null;
  };
  dailyGoals: DailyGoalEntry[];
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastGoalMetDate: string | null;
  };
  dailyActivity: DailyActivityEntry[];
  lessonProgress: LessonProgressEntry[];
  questionResults: QuestionResultEntry[];
  questionAttempts: QuestionAttemptEntry[];
  simulationSessions: SimulationSessionEntry[];
  conversations: ConversationSeed[];
  personalVocabularies: Array<{
    word: string;
    translation: string;
    source: 'MANUAL' | 'IMAGE_DISCOVERY';
    createdAt: string;
  }>;
  bookmarks: BookmarkSeed[];
}
