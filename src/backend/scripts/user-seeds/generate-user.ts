import { levelFromCompletedLessons, loadLessonCatalog } from './catalog';
import {
  assignFunnel,
  isLearningFunnel,
  requiresOnboarding,
  requiresVerification,
  tenureDaysForIndex,
} from './funnel';
import { generateIdentity, pickDialect, pickOnboardingLevel } from './identity';
import { bool, intBetween, mulberry32, pick } from './rng';
import {
  buildBookmarks,
  buildBypassLessonProgress,
  buildConversations,
  buildPersonalVocab,
  computeStreakReplay,
  simulateLearningTimeline,
} from './simulate-learning';
import type {
  AccountFunnel,
  DailyActivityEntry,
  DailyGoalEntry,
  LifecycleStage,
  OnboardingSeed,
  PersonaId,
  UserSeedFile,
} from './types';
import { vnDateRangeInclusive, vnDayKey, vnLocalToUtc, startOfVnDay } from './vn-time';

function onboardingDailyGoals(rng: () => number): DailyGoalEntry[] {
  const goals: DailyGoalEntry[] = [{ goalType: 'QUESTIONS', targetValue: 10 }];
  if (bool(rng, 0.88)) goals.push({ goalType: 'SIMULATIONS', targetValue: intBetween(rng, 2, 3) });
  if (bool(rng, 0.38)) goals.push({ goalType: 'LESSONS', targetValue: intBetween(rng, 1, 2) });
  return goals;
}

function emptyLearningData(tenureDays: number, registeredAt: Date, anchorDate: Date) {
  const days = vnDateRangeInclusive(vnDayKey(registeredAt), vnDayKey(anchorDate)).slice(0, tenureDays);
  const dailyActivity: DailyActivityEntry[] = days.map((date) => ({
    date,
    lessonsCompleted: 0,
    questionsCompleted: 0,
    simulationsCompleted: 0,
    activeMinutes: 0,
    goalsMet: false,
  }));

  return {
    dailyActivity,
    lessonProgress: [],
    questionResults: [],
    questionAttempts: [],
    simulationSessions: [],
    activityDays: [] as string[],
  };
}

function resolveStage(
  funnel: AccountFunnel,
  emailVerified: boolean,
  onboardingCompleted: boolean,
  activeDays: number,
  tenureDays: number,
): LifecycleStage {
  if (!emailVerified) return 'verification_pending';
  if (!onboardingCompleted) return 'onboarding_pending';

  if (
    funnel === 'onboarded_zero_activity' ||
    funnel === 'onboarded_instant_churn' ||
    (activeDays === 0 && tenureDays > 3)
  ) {
    return 'churned';
  }

  if (funnel === 'onboarded_day_one_quit' || funnel === 'onboarded_early_churn') {
    return 'churned';
  }

  if (tenureDays <= 1) return 'onboarding';
  if (tenureDays <= 7 && activeDays <= 2) return 'exploring';
  if (tenureDays <= 30) return 'building_habit';
  if (tenureDays <= 180) return 'advancing';
  if (activeDays >= Math.max(8, Math.floor(tenureDays * 0.28))) return 'proficient';
  return 'dormant';
}

function learningPlanForFunnel(
  funnel: AccountFunnel,
  persona: PersonaId | null,
  onboardingDayIndex: number,
  tenureDays: number,
  rng: () => number,
): {
  persona: PersonaId;
  learningStartDayIndex: number;
  learningEndDayIndex?: number;
  maxActiveDays?: number;
} {
  switch (funnel) {
    case 'onboarded_zero_activity':
      return {
        persona: 'trial_dropout',
        learningStartDayIndex: onboardingDayIndex,
        maxActiveDays: 0,
      };
    case 'onboarded_instant_churn':
      return {
        persona: 'trial_dropout',
        learningStartDayIndex: onboardingDayIndex,
        maxActiveDays: 0,
      };
    case 'onboarded_day_one_quit':
      return {
        persona: 'steady_learner',
        learningStartDayIndex: onboardingDayIndex,
        maxActiveDays: 1,
      };
    case 'onboarded_early_churn':
      return {
        persona: 'steady_learner',
        learningStartDayIndex: onboardingDayIndex,
        learningEndDayIndex: Math.min(
          tenureDays - 1,
          onboardingDayIndex + intBetween(rng, 3, 7),
        ),
      };
    case 'active_learner':
      return {
        persona: persona ?? 'steady_learner',
        learningStartDayIndex: onboardingDayIndex,
      };
    default:
      return {
        persona: 'trial_dropout',
        learningStartDayIndex: onboardingDayIndex,
        maxActiveDays: 0,
      };
  }
}

export function generateUserSeed(index: number, anchorDate = new Date()): UserSeedFile {
  const rng = mulberry32(index * 9973 + 42);
  const assignment = assignFunnel(index);
  const { accountFunnel, persona: assignedPersona } = assignment;

  let tenureDays = tenureDaysForIndex(index);
  if (accountFunnel === 'registered_unverified_stale') {
    tenureDays = Math.max(tenureDays, intBetween(rng, 5, 45));
  }

  const identity = generateIdentity(index, assignment.provider);
  const seedId = `user-${String(index).padStart(5, '0')}`;

  const todayStart = startOfVnDay(anchorDate, 0);
  const registeredAt = new Date(todayStart.getTime() - (tenureDays - 1) * 24 * 60 * 60 * 1000);
  registeredAt.setTime(
    vnLocalToUtc(vnDayKey(registeredAt), intBetween(rng, 8, 22), intBetween(rng, 0, 59)).getTime(),
  );

  const emailVerified = requiresVerification(accountFunnel, identity.provider);
  let verifiedAfterHours: number | null = null;
  let emailVerifiedAt: string | null = null;

  if (emailVerified) {
    verifiedAfterHours =
      identity.provider === 'google'
        ? 0
        : intBetween(rng, 1, accountFunnel === 'verified_never_onboarded' ? 120 : 48);
    emailVerifiedAt = new Date(
      registeredAt.getTime() + verifiedAfterHours * 60 * 60 * 1000,
    ).toISOString();
  }

  const onboardingCompleted = requiresOnboarding(accountFunnel);
  let daysFromRegisterToOnboarding: number | null = null;
  let onboardingCompletedAt: string | null = null;
  let selectedLevel = 'A1';
  let preferredDialect = pickDialect(rng);
  let completeLowerCourses = false;

  if (onboardingCompleted) {
    daysFromRegisterToOnboarding =
      identity.provider === 'google'
        ? intBetween(rng, 0, Math.min(2, tenureDays - 1))
        : intBetween(rng, 0, Math.min(4, tenureDays - 1));

    selectedLevel = pickOnboardingLevel(rng);
    preferredDialect = pickDialect(rng);
    completeLowerCourses =
      selectedLevel !== 'A1' &&
      bool(rng, ['B1', 'B2', 'C1', 'C2'].includes(selectedLevel) ? 0.45 : 0.28);

    const onboardingDay = vnDateRangeInclusive(vnDayKey(registeredAt), vnDayKey(anchorDate))[
      daysFromRegisterToOnboarding
    ];
    onboardingCompletedAt = vnLocalToUtc(
      onboardingDay,
      intBetween(rng, 9, 21),
      intBetween(rng, 0, 59),
    ).toISOString();
  }

  const onboarding: OnboardingSeed = {
    completed: onboardingCompleted,
    completedAt: onboardingCompletedAt,
    selectedLevel,
    preferredDialect,
    completeLowerCourses,
  };

  const dailyGoals = onboardingCompleted ? onboardingDailyGoals(rng) : [];
  const catalog = loadLessonCatalog();
  const onboardingDayIndex = daysFromRegisterToOnboarding ?? 0;

  let simulated = emptyLearningData(tenureDays, registeredAt, anchorDate);

  if (onboardingCompleted && accountFunnel !== 'onboarded_zero_activity') {
    const plan = learningPlanForFunnel(
      accountFunnel,
      assignedPersona,
      onboardingDayIndex,
      tenureDays,
      rng,
    );

    simulated = simulateLearningTimeline({
      persona: plan.persona,
      tenureDays,
      registeredAt,
      anchorDate,
      dailyGoals,
      catalog,
      rng,
      learningStartDayIndex: plan.learningStartDayIndex,
      learningEndDayIndex: plan.learningEndDayIndex,
      maxActiveDays: plan.maxActiveDays,
    });

    if (
      onboarding.completeLowerCourses &&
      onboardingCompletedAt &&
      (accountFunnel === 'active_learner' || accountFunnel === 'onboarded_early_churn')
    ) {
      const bypass = buildBypassLessonProgress(
        catalog,
        selectedLevel,
        true,
        onboardingCompletedAt,
      );
      const existing = new Set(simulated.lessonProgress.map((row) => row.lessonRef));
      for (const row of bypass) {
        if (!existing.has(row.lessonRef)) simulated.lessonProgress.push(row);
      }
    }
  } else if (onboardingCompleted) {
    simulated = emptyLearningData(tenureDays, registeredAt, anchorDate);
  }

  const activeDays = simulated.dailyActivity.filter((day) => day.activeMinutes > 0).length;
  const lastActiveDay = [...simulated.dailyActivity]
    .reverse()
    .find((day) => day.activeMinutes > 0)?.date;
  const lastActiveAt = lastActiveDay ?? (onboardingCompletedAt ? vnDayKey(new Date(onboardingCompletedAt)) : null);

  const completedCount = simulated.lessonProgress.filter((row) => row.status === 'completed').length;
  const currentLevel = onboardingCompleted
    ? levelFromCompletedLessons(catalog, completedCount)
    : selectedLevel;

  const streak =
    dailyGoals.length > 0
      ? computeStreakReplay(simulated.dailyActivity)
      : { currentStreak: 0, longestStreak: 0, lastGoalMetDate: null };

  const personalVocabularies = buildPersonalVocab(assignedPersona, rng, simulated.activityDays);
  const conversations = onboardingCompleted
    ? buildConversations(assignedPersona, rng, simulated.activityDays, catalog)
    : [];
  const bookmarks = onboardingCompleted
    ? buildBookmarks(rng, simulated.activityDays, personalVocabularies.length)
    : [];

  return {
    schemaVersion: 3,
    seedId,
    profile: {
      email: identity.email,
      password: identity.password,
      fullName: identity.fullName,
      nativeLanguage: identity.nativeLanguage,
      currentLevel,
      preferredDialect: onboardingCompleted ? preferredDialect : 'STANDARD',
      emailVerified,
      emailVerifiedAt,
      onboardingCompleted,
      notificationEnabled: onboardingCompleted ? bool(rng, 0.42) : false,
      notificationTime: `${String(intBetween(rng, 18, 21)).padStart(2, '0')}:${pick(rng, ['00', '15', '30', '45'])}`,
      registeredAt: registeredAt.toISOString(),
      provider: identity.provider,
      googleId: identity.googleId,
      avatarUrl: identity.avatarUrl,
    },
    onboarding,
    lifecycle: {
      accountFunnel,
      tenureDays,
      stage: resolveStage(
        accountFunnel,
        emailVerified,
        onboardingCompleted,
        activeDays,
        tenureDays,
      ),
      persona: isLearningFunnel(accountFunnel) ? assignedPersona : null,
      lastActiveAt,
      activeDays,
      verifiedAfterHours,
      daysFromRegisterToOnboarding,
    },
    dailyGoals,
    streak,
    dailyActivity: simulated.dailyActivity,
    lessonProgress: simulated.lessonProgress,
    questionResults: simulated.questionResults,
    questionAttempts: simulated.questionAttempts,
    simulationSessions: simulated.simulationSessions,
    conversations,
    personalVocabularies,
    bookmarks,
  };
}

export function buildManifestEntry(seed: UserSeedFile) {
  return {
    seedId: seed.seedId,
    accountFunnel: seed.lifecycle.accountFunnel,
    tenureDays: seed.lifecycle.tenureDays,
    persona: seed.lifecycle.persona,
    stage: seed.lifecycle.stage,
    provider: seed.profile.provider,
    emailVerified: seed.profile.emailVerified,
    onboardingCompleted: seed.profile.onboardingCompleted,
    currentLevel: seed.profile.currentLevel,
    activeDays: seed.lifecycle.activeDays,
    completedLessons: seed.lessonProgress.filter((item) => item.status === 'completed').length,
    questionResults: seed.questionResults.length,
    simulations: seed.simulationSessions.length,
    currentStreak: seed.streak.currentStreak,
  };
}
