import { SCENARIO_TITLES, loadLessonCatalog } from './catalog';
import { bool, intBetween, pick } from './rng';
import type {
  BookmarkSeed,
  ConversationMessageSeed,
  ConversationSeed,
  DailyActivityEntry,
  DailyGoalEntry,
  LessonCatalogEntry,
  LessonProgressEntry,
  PersonaId,
  QuestionAttemptEntry,
  QuestionResultEntry,
  SimulationCriteriaScoreSeed,
  SimulationMessageSeed,
  SimulationSessionEntry,
} from './types';
import { daysBetween, vnDateRangeInclusive, vnDayKey, vnLocalToUtc } from './vn-time';

const SIM_CRITERIA = [
  'Phát âm',
  'Ngữ pháp',
  'Từ vựng',
  'Trôi chảy',
  'Phù hợp ngữ cảnh',
] as const;

const SIM_PHRASES_LEARNER = [
  'Xin chào, tôi muốn mua một ít.',
  'Bao nhiêu tiền một cân?',
  'Anh có thể nói chậm lại được không?',
  'Tôi không hiểu, làm ơn nhắc lại.',
  'Cảm ơn anh nhiều!',
  'Có giảm giá không ạ?',
  'Tôi lấy hai cái này.',
];

const SIM_PHRASES_PARTNER = [
  'Vâng, mời chị xem.',
  'Cái này bốn mươi nghìn một cân.',
  'Để tôi gói cho bạn nhé.',
  'Bạn cần gì thêm không?',
  'Cảm ơn, chúc bạn ngon miệng.',
  'Hôm nay đông khách quá!',
];

const AI_TOPICS = [
  'Cách dùng "đã" và "rồi"',
  'Đếm tiền tiếng Việt',
  'Phân biệt "đi" và "đến"',
  'Chào hỏi trang trọng',
  'Đặt món ở nhà hàng',
  'Hỏi đường ở Hà Nội',
  'Khi nào dùng "thì"',
];

export interface SimulationOptions {
  persona: PersonaId;
  tenureDays: number;
  registeredAt: Date;
  anchorDate: Date;
  dailyGoals: DailyGoalEntry[];
  catalog?: LessonCatalogEntry[];
  rng: () => number;
  /** Ngày bắt đầu được phép học (sau onboarding). */
  learningStartDayIndex?: number;
  /** Ngày cuối cùng còn học (churn sớm). */
  learningEndDayIndex?: number;
  /** Giới hạn số ngày active tối đa. */
  maxActiveDays?: number;
}

interface LessonWorkState {
  ref: string;
  contentViewed: boolean;
  answeredOrders: number[];
  timeSpent: number;
  startedAt: string;
  lastAccessedAt: string;
}

interface PersonaRates {
  activeRate: number;
  lessonsPerActiveDay: [number, number];
  questionsPerSession: [number, number];
  simulationsPerActiveDay: [number, number];
  accuracy: [number, number];
  completionThreshold: number;
}

const PERSONA_RATES: Record<PersonaId, PersonaRates> = {
  power_user: {
    activeRate: 0.78,
    lessonsPerActiveDay: [0, 2],
    questionsPerSession: [6, 14],
    simulationsPerActiveDay: [0, 2],
    accuracy: [0.72, 0.92],
    completionThreshold: 0.65,
  },
  steady_learner: {
    activeRate: 0.52,
    lessonsPerActiveDay: [0, 1],
    questionsPerSession: [3, 10],
    simulationsPerActiveDay: [0, 1],
    accuracy: [0.58, 0.82],
    completionThreshold: 0.7,
  },
  weekend_warrior: {
    activeRate: 0.28,
    lessonsPerActiveDay: [0, 2],
    questionsPerSession: [4, 12],
    simulationsPerActiveDay: [0, 1],
    accuracy: [0.55, 0.78],
    completionThreshold: 0.75,
  },
  simulation_focused: {
    activeRate: 0.44,
    lessonsPerActiveDay: [0, 1],
    questionsPerSession: [2, 8],
    simulationsPerActiveDay: [1, 3],
    accuracy: [0.5, 0.75],
    completionThreshold: 0.8,
  },
  lesson_focused: {
    activeRate: 0.48,
    lessonsPerActiveDay: [0, 2],
    questionsPerSession: [5, 12],
    simulationsPerActiveDay: [0, 0],
    accuracy: [0.62, 0.88],
    completionThreshold: 0.6,
  },
  trial_dropout: {
    activeRate: 0.12,
    lessonsPerActiveDay: [0, 1],
    questionsPerSession: [1, 5],
    simulationsPerActiveDay: [0, 0],
    accuracy: [0.4, 0.65],
    completionThreshold: 0.9,
  },
  returning_learner: {
    activeRate: 0.38,
    lessonsPerActiveDay: [0, 1],
    questionsPerSession: [3, 9],
    simulationsPerActiveDay: [0, 1],
    accuracy: [0.55, 0.8],
    completionThreshold: 0.72,
  },
  goal_driven: {
    activeRate: 0.68,
    lessonsPerActiveDay: [0, 2],
    questionsPerSession: [5, 15],
    simulationsPerActiveDay: [0, 2],
    accuracy: [0.65, 0.9],
    completionThreshold: 0.68,
  },
};

function isActiveDay(
  persona: PersonaId,
  dayIndex: number,
  tenureDays: number,
  vnDate: string,
  rng: () => number,
): boolean {
  if (persona === 'trial_dropout') {
    return dayIndex <= 1 && bool(rng, dayIndex === 0 ? 0.95 : 0.25);
  }

  if (persona === 'returning_learner') {
    const early = Math.min(6, tenureDays - 1);
    const gapEnd = Math.floor(tenureDays * 0.55);
    if (dayIndex <= early) return bool(rng, 0.68);
    if (dayIndex < gapEnd) return bool(rng, 0.06);
    return bool(rng, 0.5);
  }

  if (persona === 'weekend_warrior') {
    const dayOfWeek = vnLocalToUtc(vnDate, 12, 0).getUTCDay();
    return dayOfWeek === 0 || dayOfWeek === 6 || bool(rng, 0.08);
  }

  let rate = PERSONA_RATES[persona].activeRate;
  if (dayIndex === 0) rate = Math.max(rate, 0.92);

  const daysSinceLastThird = tenureDays - dayIndex;
  if (daysSinceLastThird <= 14 && persona !== 'power_user' && persona !== 'goal_driven') {
    rate *= 0.75;
  }

  return bool(rng, rate);
}

function goalsMet(
  goals: DailyGoalEntry[],
  activity: Pick<
    DailyActivityEntry,
    'questionsCompleted' | 'lessonsCompleted' | 'simulationsCompleted'
  >,
): boolean {
  if (goals.length === 0) return false;
  return goals.every((goal) => {
    if (goal.goalType === 'QUESTIONS') return activity.questionsCompleted >= goal.targetValue;
    if (goal.goalType === 'LESSONS') return activity.lessonsCompleted >= goal.targetValue;
    return activity.simulationsCompleted >= goal.targetValue;
  });
}

function accuracyForPersona(rates: PersonaRates, rng: () => number, tenureProgress: number): number {
  const base = rates.accuracy[0] + rng() * (rates.accuracy[1] - rates.accuracy[0]);
  return Math.min(0.95, base + tenureProgress * 0.08);
}

function nextUnansweredOrder(state: LessonWorkState, questionCount: number): number | null {
  for (let order = 1; order <= questionCount; order += 1) {
    if (!state.answeredOrders.includes(order)) return order;
  }
  return null;
}

function lessonReadyToComplete(
  lesson: LessonCatalogEntry,
  state: LessonWorkState,
  threshold: number,
): boolean {
  if (!state.contentViewed) return false;
  if (lesson.questionCount === 0) return true;
  return state.answeredOrders.length >= Math.max(1, Math.ceil(lesson.questionCount * threshold));
}

function averageScore(results: QuestionResultEntry[]): number {
  if (results.length === 0) return 75;
  return Math.round(results.reduce((sum, row) => sum + row.score, 0) / results.length);
}

export function computeStreakReplay(dailyActivity: DailyActivityEntry[]) {
  let currentStreak = 0;
  let longestStreak = 0;
  let lastGoalMetDate: string | null = null;

  for (const day of dailyActivity) {
    if (day.goalsMet) {
      if (lastGoalMetDate === day.date) continue;
      const isYesterday = lastGoalMetDate != null && daysBetween(lastGoalMetDate, day.date) === 1;
      currentStreak = isYesterday ? currentStreak + 1 : 1;
      longestStreak = Math.max(longestStreak, currentStreak);
      lastGoalMetDate = day.date;
    } else if (currentStreak > 0) {
      currentStreak = 0;
    }
  }

  return { currentStreak, longestStreak, lastGoalMetDate };
}

function completeLessonFromState(
  lesson: LessonCatalogEntry,
  state: LessonWorkState,
  questionResults: QuestionResultEntry[],
  completedAt: Date,
): LessonProgressEntry {
  const lessonResults = questionResults.filter((row) => row.lessonRef === lesson.ref);
  let resolvedCompletedAt = completedAt;
  for (const result of lessonResults) {
    const attempted = new Date(result.attemptedAt).getTime();
    if (attempted >= resolvedCompletedAt.getTime()) {
      resolvedCompletedAt = new Date(attempted + 60_000);
    }
  }

  return {
    lessonRef: lesson.ref,
    status: 'completed',
    score: averageScore(lessonResults),
    contentViewed: true,
    timeSpent: state.timeSpent,
    completedAt: resolvedCompletedAt.toISOString(),
    lastAccessedAt: resolvedCompletedAt.toISOString(),
  };
}

function tryCompleteLesson(
  lesson: LessonCatalogEntry,
  state: LessonWorkState,
  questionResults: QuestionResultEntry[],
  rates: PersonaRates,
  persona: PersonaId,
  vnDate: string,
  sessionHour: number,
  sessionMinute: number,
  lessonsCompletedToday: number,
  maxLessonsToday: number,
  rng: () => number,
): { completed: LessonProgressEntry | null; hour: number; minute: number } {
  if (lessonsCompletedToday >= maxLessonsToday) {
    return { completed: null, hour: sessionHour, minute: sessionMinute };
  }
  if (!lessonReadyToComplete(lesson, state, rates.completionThreshold)) {
    return { completed: null, hour: sessionHour, minute: sessionMinute };
  }
  if (!bool(rng, persona === 'lesson_focused' ? 0.78 : 0.52)) {
    return { completed: null, hour: sessionHour, minute: sessionMinute };
  }

  const completedAt = vnLocalToUtc(vnDate, sessionHour, sessionMinute);
  return {
    completed: completeLessonFromState(lesson, state, questionResults, completedAt),
    hour: sessionHour,
    minute: sessionMinute + intBetween(rng, 2, 5),
  };
}

export function simulateLearningTimeline(input: SimulationOptions) {
  const {
    persona,
    tenureDays,
    registeredAt,
    anchorDate,
    dailyGoals,
    rng,
    learningStartDayIndex = 0,
    learningEndDayIndex,
    maxActiveDays,
  } = input;
  const catalog = input.catalog ?? loadLessonCatalog();
  const rates = PERSONA_RATES[persona];

  const calendarDays = vnDateRangeInclusive(vnDayKey(registeredAt), vnDayKey(anchorDate)).slice(
    0,
    tenureDays,
  );

  const dailyActivity: DailyActivityEntry[] = [];
  const questionResults: QuestionResultEntry[] = [];
  const questionAttempts: QuestionAttemptEntry[] = [];
  const simulationSessions: SimulationSessionEntry[] = [];
  const completedLessons: LessonProgressEntry[] = [];
  const activityDays: string[] = [];

  const pushAttempt = (
    lessonRef: string,
    orderIndex: number,
    isCorrect: boolean,
    score: number,
    attemptedAt: string,
    timeTaken: number,
  ) => {
    questionAttempts.push({ lessonRef, orderIndex, isCorrect, score, attemptedAt, timeTaken });
    // Một số câu (~15%) có người làm 2 lần để mô phỏng retry
    if (bool(rng, 0.15)) {
      const retryAt = new Date(new Date(attemptedAt).getTime() + intBetween(rng, 30, 600) * 1000).toISOString();
      const retryCorrect = isCorrect || bool(rng, 0.6);
      questionAttempts.push({
        lessonRef,
        orderIndex,
        isCorrect: retryCorrect,
        score: retryCorrect ? Math.max(score, intBetween(rng, 70, 100)) : intBetween(rng, 0, 50),
        attemptedAt: retryAt,
        timeTaken: intBetween(rng, 8, 60),
      });
    }
  };

  let lessonCursor = 0;
  let inProgress: LessonWorkState | null = null;
  let activeDayCount = 0;

  const ensureInProgress = (sessionStart: Date): LessonWorkState | null => {
    if (lessonCursor >= catalog.length) return null;
    if (inProgress) return inProgress;

    const lesson = catalog[lessonCursor];
    inProgress = {
      ref: lesson.ref,
      contentViewed: false,
      answeredOrders: [],
      timeSpent: 0,
      startedAt: sessionStart.toISOString(),
      lastAccessedAt: sessionStart.toISOString(),
    };
    return inProgress;
  };

  const addSimulations = (
    vnDate: string,
    count: number,
    sessionHour: number,
    sessionMinute: number,
  ) => {
    let hour = sessionHour;
    let minute = sessionMinute;
    let minutes = 0;

    for (let i = 0; i < count; i += 1) {
      const totalMessages = intBetween(rng, 6, 14);
      const totalScore = intBetween(rng, 50, persona === 'power_user' ? 95 : 90);

      const criteriaScores: SimulationCriteriaScoreSeed[] = SIM_CRITERIA.map((name) => {
        const score = Math.min(20, Math.max(6, Math.round(totalScore / 5) + intBetween(rng, -2, 2)));
        return {
          name,
          score,
          maxScore: 20,
          comment:
            score >= 16
              ? 'Rất tốt, tiếp tục phát huy.'
              : score >= 12
                ? 'Khá ổn, có thể cải thiện thêm.'
                : 'Cần luyện tập thêm phần này.',
        };
      });

      const messages: SimulationMessageSeed[] = [];
      for (let m = 0; m < totalMessages; m += 1) {
        const isLearner = m % 2 === 0;
        const content = pick(rng, isLearner ? SIM_PHRASES_LEARNER : SIM_PHRASES_PARTNER);
        messages.push({
          isLearner,
          content,
          translation: isLearner ? null : pick(rng, ['(translation)', null]) as string | null,
          orderIndex: m + 1,
        });
      }

      simulationSessions.push({
        scenarioTitle: pick(rng, [...SCENARIO_TITLES]),
        status: 'COMPLETED',
        totalScore,
        totalMessages,
        totalTokens: totalMessages * intBetween(rng, 40, 120),
        endReason: 'COMPLETED',
        aiSummary:
          totalScore >= 80
            ? 'Học viên hoàn thành tốt tình huống, giao tiếp tự nhiên.'
            : totalScore >= 60
              ? 'Học viên hoàn thành ở mức trung bình, còn vài lỗi nhỏ.'
              : 'Học viên cần luyện thêm để cải thiện tự tin và độ chính xác.',
        criteriaScores,
        messages,
        completedAt: vnLocalToUtc(vnDate, hour, minute).toISOString(),
      });
      const spent = intBetween(rng, 8, 18);
      minutes += spent;
      minute += spent;
      while (minute >= 60) {
        minute -= 60;
        hour += 1;
      }
    }

    return { added: count, minutes, hour, minute };
  };

  for (let dayIndex = 0; dayIndex < calendarDays.length; dayIndex += 1) {
    const vnDate = calendarDays[dayIndex];
    const beforeLearning = dayIndex < learningStartDayIndex;
    const afterChurn =
      learningEndDayIndex != null && dayIndex > learningEndDayIndex;
    const hitActiveCap = maxActiveDays != null && activeDayCount >= maxActiveDays;

    if (beforeLearning || afterChurn || hitActiveCap) {
      dailyActivity.push({
        date: vnDate,
        lessonsCompleted: 0,
        questionsCompleted: 0,
        simulationsCompleted: 0,
        activeMinutes: 0,
        goalsMet: false,
      });
      continue;
    }

    const relativeDayIndex = dayIndex - learningStartDayIndex;
    const tenureProgress = relativeDayIndex / Math.max(1, tenureDays - learningStartDayIndex - 1);
    const accuracy = accuracyForPersona(rates, rng, tenureProgress);

    if (!isActiveDay(persona, relativeDayIndex, tenureDays - learningStartDayIndex, vnDate, rng)) {
      dailyActivity.push({
        date: vnDate,
        lessonsCompleted: 0,
        questionsCompleted: 0,
        simulationsCompleted: 0,
        activeMinutes: 0,
        goalsMet: false,
      });
      continue;
    }

    activeDayCount += 1;
    activityDays.push(vnDate);

    let lessonsCompletedToday = 0;
    let questionsCompletedToday = 0;
    let simulationsCompletedToday = 0;
    let activeMinutes = 0;

    const qGoal = dailyGoals.find((g) => g.goalType === 'QUESTIONS')?.targetValue ?? 5;
    const lGoal = dailyGoals.find((g) => g.goalType === 'LESSONS')?.targetValue ?? 1;
    const sGoal = dailyGoals.find((g) => g.goalType === 'SIMULATIONS')?.targetValue ?? 0;

    let maxLessonsToday = intBetween(rng, rates.lessonsPerActiveDay[0], rates.lessonsPerActiveDay[1]);
    let maxSimulationsToday = intBetween(
      rng,
      rates.simulationsPerActiveDay[0],
      rates.simulationsPerActiveDay[1],
    );
    let targetQuestionsToday = intBetween(rng, rates.questionsPerSession[0], rates.questionsPerSession[1]);

    if (persona === 'goal_driven') {
      targetQuestionsToday = Math.max(targetQuestionsToday, qGoal);
      maxLessonsToday = Math.max(maxLessonsToday, lGoal);
      if (sGoal > 0) maxSimulationsToday = Math.max(maxSimulationsToday, sGoal);
    }

    let sessionHour = intBetween(rng, 7, 21);
    let sessionMinute = intBetween(rng, 0, 59);

    const simFirst =
      persona === 'simulation_focused' || (persona === 'weekend_warrior' && bool(rng, 0.55));

    if (simFirst && maxSimulationsToday > 0) {
      const sims = addSimulations(vnDate, maxSimulationsToday, sessionHour, sessionMinute);
      simulationsCompletedToday += sims.added;
      activeMinutes += sims.minutes;
      sessionHour = sims.hour;
      sessionMinute = sims.minute;
    }

    while (questionsCompletedToday < targetQuestionsToday && lessonCursor < catalog.length) {
      const sessionStart = vnLocalToUtc(vnDate, sessionHour, sessionMinute);
      const state = ensureInProgress(sessionStart);
      if (!state) break;

      const lesson = catalog[lessonCursor];

      if (!state.contentViewed) {
        state.contentViewed = true;
        const contentMinutes = intBetween(rng, 6, 16);
        state.timeSpent += contentMinutes * 60;
        activeMinutes += contentMinutes;
        sessionMinute += contentMinutes;
        while (sessionMinute >= 60) {
          sessionMinute -= 60;
          sessionHour += 1;
        }
        state.lastAccessedAt = vnLocalToUtc(vnDate, sessionHour, sessionMinute).toISOString();
      }

      const order = nextUnansweredOrder(state, lesson.questionCount);
      if (order == null) {
        const done = tryCompleteLesson(
          lesson,
          state,
          questionResults,
          rates,
          persona,
          vnDate,
          sessionHour,
          sessionMinute,
          lessonsCompletedToday,
          maxLessonsToday,
          rng,
        );
        if (done.completed) {
          completedLessons.push(done.completed);
          lessonsCompletedToday += 1;
          lessonCursor += 1;
          inProgress = null;
          sessionMinute = done.minute;
          while (sessionMinute >= 60) {
            sessionMinute -= 60;
            sessionHour += 1;
          }
        }
        break;
      }

      const isCorrect = bool(rng, accuracy);
      const attemptedAt = vnLocalToUtc(vnDate, sessionHour, sessionMinute);
      const score = isCorrect ? intBetween(rng, 70, 100) : intBetween(rng, 0, 45);
      const timeTaken = intBetween(rng, 10, 85);
      questionResults.push({
        lessonRef: lesson.ref,
        orderIndex: order,
        isCorrect,
        score,
        attemptedAt: attemptedAt.toISOString(),
        timeTaken,
      });
      pushAttempt(lesson.ref, order, isCorrect, score, attemptedAt.toISOString(), timeTaken);
      state.answeredOrders.push(order);
      const questionSeconds = intBetween(rng, 30, 120);
      state.timeSpent += questionSeconds;
      state.lastAccessedAt = attemptedAt.toISOString();
      questionsCompletedToday += 1;
      activeMinutes += Math.max(1, Math.ceil(questionSeconds / 60));
      sessionMinute += intBetween(rng, 1, 4);

      const done = tryCompleteLesson(
        lesson,
        state,
        questionResults,
        rates,
        persona,
        vnDate,
        sessionHour,
        sessionMinute,
        lessonsCompletedToday,
        maxLessonsToday,
        rng,
      );
      if (done.completed) {
        completedLessons.push(done.completed);
        lessonsCompletedToday += 1;
        lessonCursor += 1;
        inProgress = null;
        sessionMinute = done.minute;
      }
    }

    if (!simFirst && simulationsCompletedToday < maxSimulationsToday) {
      const sims = addSimulations(
        vnDate,
        maxSimulationsToday - simulationsCompletedToday,
        sessionHour,
        sessionMinute,
      );
      simulationsCompletedToday += sims.added;
      activeMinutes += sims.minutes;
    }

    if (questionsCompletedToday === 0 && bool(rng, 0.16) && completedLessons.length > 0) {
      const review = pick(rng, completedLessons);
      const lesson = catalog.find((item) => item.ref === review.lessonRef);
      const answered = questionResults
        .filter((row) => row.lessonRef === review.lessonRef)
        .map((row) => row.orderIndex);
      const candidates = Array.from({ length: lesson?.questionCount ?? 0 }, (_, i) => i + 1).filter(
        (order) => !answered.includes(order),
      );
      const order = candidates.length > 0 ? pick(rng, candidates) : null;

      if (lesson && order != null) {
        const reviewCorrect = bool(rng, accuracy);
        const reviewScore = reviewCorrect ? intBetween(rng, 65, 100) : intBetween(rng, 0, 40);
        const reviewAt = vnLocalToUtc(vnDate, sessionHour, sessionMinute).toISOString();
        const reviewTime = intBetween(rng, 8, 60);
        questionResults.push({
          lessonRef: lesson.ref,
          orderIndex: order,
          isCorrect: reviewCorrect,
          score: reviewScore,
          attemptedAt: reviewAt,
          timeTaken: reviewTime,
        });
        pushAttempt(lesson.ref, order, reviewCorrect, reviewScore, reviewAt, reviewTime);
        questionsCompletedToday += 1;
        activeMinutes += intBetween(rng, 3, 8);
      }
    }

    const dayActivity = {
      date: vnDate,
      lessonsCompleted: lessonsCompletedToday,
      questionsCompleted: questionsCompletedToday,
      simulationsCompleted: simulationsCompletedToday,
      activeMinutes: Math.max(activeMinutes, questionsCompletedToday > 0 ? 5 : 0),
      goalsMet: false,
    };
    dayActivity.goalsMet = goalsMet(dailyGoals, dayActivity);
    dailyActivity.push(dayActivity);
  }

  const lessonProgress: LessonProgressEntry[] = [...completedLessons];
  if (inProgress) {
    lessonProgress.push({
      lessonRef: inProgress.ref,
      status: 'in_progress',
      contentViewed: inProgress.contentViewed,
      timeSpent: inProgress.timeSpent,
      lastAccessedAt: inProgress.lastAccessedAt,
    });
  }

  return {
    dailyActivity,
    lessonProgress,
    questionResults,
    questionAttempts,
    simulationSessions,
    activityDays,
  };
}

export function buildBypassLessonProgress(
  catalog: LessonCatalogEntry[],
  selectedLevel: string,
  completeLowerCourses: boolean,
  completedAt: string,
): LessonProgressEntry[] {
  if (!completeLowerCourses) return [];

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const targetIdx = levels.indexOf(selectedLevel);
  if (targetIdx <= 0) return [];

  const allowed = new Set(levels.slice(0, targetIdx));
  return catalog
    .filter((lesson) => allowed.has(lesson.level))
    .map((lesson) => ({
      lessonRef: lesson.ref,
      status: 'completed' as const,
      score: 80,
      contentViewed: true,
      timeSpent: 1200,
      completedAt,
      lastAccessedAt: completedAt,
    }));
}

export function buildPersonalVocab(
  persona: PersonaId | null,
  rng: () => number,
  activityDays: string[],
) {
  const samples = [
    { word: 'phở', translation: 'Vietnamese noodle soup' },
    { word: 'cà phê sữa đá', translation: 'iced milk coffee' },
    { word: 'bánh mì', translation: 'Vietnamese baguette sandwich' },
    { word: 'xe ôm', translation: 'motorbike taxi' },
    { word: 'nhà thuốc', translation: 'pharmacy' },
    { word: 'chợ', translation: 'market' },
    { word: 'hóa đơn', translation: 'bill / invoice' },
    { word: 'thuê', translation: 'to rent' },
  ];

  if (activityDays.length === 0) return [];

  const maxItems =
    persona === 'simulation_focused' || persona === 'power_user'
      ? intBetween(rng, 2, 6)
      : intBetween(rng, 0, 3);

  return samples.slice(0, maxItems).map((item) => {
    const day = pick(rng, activityDays);
    return {
      ...item,
      source: bool(rng, 0.32) ? ('IMAGE_DISCOVERY' as const) : ('MANUAL' as const),
      createdAt: vnLocalToUtc(day, intBetween(rng, 10, 21), intBetween(rng, 0, 59)).toISOString(),
    };
  });
}

export function buildConversations(
  persona: PersonaId | null,
  rng: () => number,
  activityDays: string[],
  catalog: LessonCatalogEntry[],
): ConversationSeed[] {
  if (activityDays.length === 0 || !persona) return [];

  const usesAi = persona === 'power_user' || persona === 'goal_driven' || persona === 'simulation_focused';
  const maxConversations = usesAi
    ? intBetween(rng, 3, 8)
    : bool(rng, 0.4)
      ? intBetween(rng, 1, 3)
      : 0;
  if (maxConversations === 0) return [];

  const models = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'];
  const conversations: ConversationSeed[] = [];

  for (let i = 0; i < maxConversations; i += 1) {
    const day = pick(rng, activityDays);
    const startHour = intBetween(rng, 9, 22);
    const startMinute = intBetween(rng, 0, 59);
    const start = vnLocalToUtc(day, startHour, startMinute);
    const turns = intBetween(rng, 2, 8);

    const lessonRef = catalog.length > 0 && bool(rng, 0.5) ? pick(rng, catalog).ref : null;
    const messages: ConversationMessageSeed[] = [];
    let totalPrompt = 0;
    let totalCompletion = 0;
    let offset = 0;

    for (let t = 0; t < turns; t += 1) {
      const promptTokens = intBetween(rng, 30, 200);
      const completionTokens = intBetween(rng, 60, 400);
      messages.push({
        role: 'user',
        content: pick(rng, ['Cô ơi giải thích giúp em câu này.', 'Cách dùng từ này đúng không ạ?', 'Tóm tắt giùm em bài vừa học.']),
        tokenCount: promptTokens,
        offsetMinutes: offset,
      });
      offset += intBetween(rng, 1, 3);
      messages.push({
        role: 'assistant',
        content: pick(rng, [
          'Câu này dùng "đã" để chỉ hành động hoàn thành. Bạn có thể thêm "rồi" ở cuối để nhấn mạnh.',
          'Cách dùng đúng, nhưng thường người Việt sẽ nói tự nhiên hơn là...',
          'Bài học này có 3 ý chính: ...',
        ]),
        tokenCount: completionTokens,
        offsetMinutes: offset,
      });
      offset += intBetween(rng, 2, 6);
      totalPrompt += promptTokens;
      totalCompletion += completionTokens;
    }

    const updatedAt = new Date(start.getTime() + offset * 60_000).toISOString();
    conversations.push({
      title: pick(rng, [...AI_TOPICS]),
      model: pick(rng, models),
      startedAt: start.toISOString(),
      updatedAt,
      lessonRef,
      totalTokens: totalPrompt + totalCompletion,
      totalPromptTokens: totalPrompt,
      totalCompletionTokens: totalCompletion,
      messages,
    });
  }

  return conversations;
}

export function buildBookmarks(
  rng: () => number,
  activityDays: string[],
  personalCount: number,
): BookmarkSeed[] {
  if (activityDays.length === 0) return [];
  const fromSystem = intBetween(rng, 0, 6);
  const fromPersonal = personalCount > 0 ? intBetween(rng, 0, personalCount) : 0;
  const bookmarks: BookmarkSeed[] = [];
  for (let i = 0; i < fromSystem; i += 1) {
    const day = pick(rng, activityDays);
    bookmarks.push({
      kind: 'system',
      createdAt: vnLocalToUtc(day, intBetween(rng, 9, 22), intBetween(rng, 0, 59)).toISOString(),
    });
  }
  const personalIndices = new Set<number>();
  for (let i = 0; i < fromPersonal && personalIndices.size < personalCount; i += 1) {
    const idx = intBetween(rng, 0, personalCount - 1);
    if (personalIndices.has(idx)) continue;
    personalIndices.add(idx);
    const day = pick(rng, activityDays);
    bookmarks.push({
      kind: 'personal',
      personalIndex: idx,
      createdAt: vnLocalToUtc(day, intBetween(rng, 9, 22), intBetween(rng, 0, 59)).toISOString(),
    });
  }
  return bookmarks;
}
