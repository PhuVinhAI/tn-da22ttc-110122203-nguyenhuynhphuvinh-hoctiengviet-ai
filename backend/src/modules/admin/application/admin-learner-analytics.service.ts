import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProgressStatus,
  QuestionType,
  Role,
  SimulationSessionStatus,
} from '../../../common/enums';
import { User } from '../../users/domain/user.entity';
import { LearningProgress } from '../../progress/domain/learning-progress.entity';
import { DailyGoal } from '../../daily-goals/domain/daily-goal.entity';
import { DailyGoalProgress } from '../../daily-goals/domain/daily-goal-progress.entity';
import { DailyStreak } from '../../daily-goals/domain/daily-streak.entity';
import { UserQuestionResult } from '../../exercises/domain/user-question-result.entity';
import { QuestionAttempt } from '../../exercises/domain/question-attempt.entity';
import { PersonalVocabulary } from '../../personal-vocabularies/domain/personal-vocabulary.entity';
import { Bookmark } from '../../vocabularies/domain/bookmark.entity';
import { SimulationSession } from '../../simulations/domain/simulation-session.entity';
import { Conversation } from '../../conversations/domain/conversation.entity';
import {
  fillDailySeries,
  startOfVnDay,
  vnDateRange,
  vnDayExpr,
  vnDayKey,
  vnLocalExpr,
} from './dashboard-time.util';

const CALENDAR_DAYS = 91;
const TREND_DAYS = 30;
const RECENT_LIMIT = 6;
const TOP_COURSES_LIMIT = 6;

const ALL_QUESTION_TYPES = Object.values(QuestionType);

export interface CalendarDay {
  date: string;
  value: number;
  tier: 0 | 1 | 2 | 3 | 4;
}

/**
 * Phân tích sâu hành trình học của một học viên. Mọi số liệu chuỗi ngày
 * tính theo lịch Việt Nam như các dashboard khác. Mục tiêu là một bức
 * tranh đủ để admin quyết định nên cải thiện sản phẩm theo hướng nào và
 * học viên cụ thể đang khoẻ hay đang trượt.
 */
@Injectable()
export class AdminLearnerAnalyticsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(LearningProgress)
    private readonly progressRepository: Repository<LearningProgress>,
    @InjectRepository(DailyGoal)
    private readonly dailyGoalsRepository: Repository<DailyGoal>,
    @InjectRepository(DailyGoalProgress)
    private readonly dailyGoalProgressRepository: Repository<DailyGoalProgress>,
    @InjectRepository(DailyStreak)
    private readonly dailyStreakRepository: Repository<DailyStreak>,
    @InjectRepository(UserQuestionResult)
    private readonly questionResultsRepository: Repository<UserQuestionResult>,
    @InjectRepository(QuestionAttempt)
    private readonly questionAttemptsRepository: Repository<QuestionAttempt>,
    @InjectRepository(PersonalVocabulary)
    private readonly personalVocabularyRepository: Repository<PersonalVocabulary>,
    @InjectRepository(Bookmark)
    private readonly bookmarksRepository: Repository<Bookmark>,
    @InjectRepository(SimulationSession)
    private readonly simulationsRepository: Repository<SimulationSession>,
    @InjectRepository(Conversation)
    private readonly conversationsRepository: Repository<Conversation>,
  ) {}

  async getAnalytics(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Learner with ID ${userId} not found`);
    }

    const now = new Date();
    const today = vnDayKey(now);
    const sinceCalendar = startOfVnDay(now, CALENDAR_DAYS - 1);
    const sinceTrend = startOfVnDay(now, TREND_DAYS - 1);
    const calendarRange = vnDateRange(CALENDAR_DAYS, now);
    const trendRange = vnDateRange(TREND_DAYS, now);

    const [
      streak,
      dailyGoals,
      overviewCounters,
      lastActivity,
      calendarRows,
      hourHeatmap,
      trendRows,
      skillRadar,
      difficultyBreakdown,
      speedHistogram,
      vocabularyInsights,
      courseProgress,
      aiConversationStats,
      aiSimulationStats,
      recentConversations,
      recentSimulations,
      goalsHistory,
    ] = await Promise.all([
      this.dailyStreakRepository.findOne({ where: { userId } }),
      this.dailyGoalsRepository.find({
        where: { userId },
        order: { goalType: 'ASC' },
      }),
      this.overviewCounters(userId),
      this.lastActivityAt(userId),
      this.activityCalendarRows(userId, sinceCalendar),
      this.hourHeatmap(userId, sinceCalendar),
      this.trendRows(userId, sinceTrend),
      this.skillRadarRows(userId),
      this.difficultyBreakdownRows(userId),
      this.speedHistogramRows(userId),
      this.vocabularyInsights(userId, now),
      this.courseProgressRows(userId),
      this.conversationStats(userId),
      this.simulationStats(userId),
      this.recentConversations(userId),
      this.recentSimulations(userId),
      this.goalsHistory(userId, now),
    ]);

    const activityCalendar = this.buildCalendar(calendarRange, calendarRows);
    const trends = this.buildTrend(trendRange, trendRows);

    const overview = {
      ...overviewCounters,
      joinedAt: user.createdAt.toISOString(),
      daysSinceJoined: Math.max(
        1,
        Math.floor(
          (now.getTime() - new Date(user.createdAt).getTime()) /
            (24 * 60 * 60 * 1000),
        ),
      ),
      activeDays: activityCalendar.totalActiveDays,
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
    };
    const activeDaysRate =
      overview.daysSinceJoined > 0
        ? Math.min(1, overview.activeDays / overview.daysSinceJoined)
        : 0;

    const health = this.computeHealth({
      lastActivityAt: lastActivity,
      now,
      streak,
      overview: { ...overview, activeDaysRate },
      activityCalendar,
      trends,
    });

    const insights = this.buildInsights({
      health,
      skillRadar,
      vocabularyInsights,
      trends,
      streak,
      goalsHistory,
      simulations: aiSimulationStats,
      conversations: aiConversationStats,
    });

    return {
      generatedAt: now.toISOString(),
      today,
      user: user.toJSON(),
      health,
      overview: { ...overview, activeDaysRate },
      activityCalendar,
      hourHeatmap,
      trends,
      skillRadar,
      difficultyBreakdown,
      speedHistogram,
      vocabularyInsights,
      courseProgress,
      aiUsage: {
        conversations: {
          ...aiConversationStats,
          recent: recentConversations,
        },
        simulations: {
          ...aiSimulationStats,
          recent: recentSimulations,
        },
      },
      goals: {
        daily: dailyGoals.map((g) => ({
          goalType: g.goalType,
          targetValue: g.targetValue,
        })),
        ...goalsHistory,
        streakSummary: {
          currentStreak: streak?.currentStreak ?? 0,
          longestStreak: streak?.longestStreak ?? 0,
          lastGoalMetDate: streak?.lastGoalMetDate ?? null,
          todayMet: streak?.lastGoalMetDate === today,
        },
      },
      insights,
    };
  }

  // ─── Tổng quan ────────────────────────────────────────────────────────────

  private async overviewCounters(userId: string) {
    const manager = this.usersRepository.manager;
    const [
      progressStats,
      attemptAgg,
      uniqueQuestionsAttempted,
      bookmarkCount,
      personalVocabCount,
      conversationCount,
      simulationAgg,
      tokenSum,
    ] = await Promise.all([
      this.progressRepository
        .createQueryBuilder('p')
        .select('p.unit_type', 'unitType')
        .addSelect('p.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(p.time_spent)', 'time')
        .where('p.user_id = :userId', { userId })
        .andWhere('p.deleted_at IS NULL')
        .groupBy('p.unit_type')
        .addGroupBy('p.status')
        .getRawMany<{
          unitType: string;
          status: string;
          count: string;
          time: string | null;
        }>(),
      this.questionAttemptsRepository
        .createQueryBuilder('a')
        .select('COUNT(*)', 'total')
        .addSelect('SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)', 'correct')
        .where('a.user_id = :userId', { userId })
        .andWhere('a.deleted_at IS NULL')
        .getRawOne<{ total: string; correct: string | null }>(),
      this.questionResultsRepository.count({
        where: { userId },
      }),
      this.bookmarksRepository.count({ where: { userId } }),
      this.personalVocabularyRepository.count({ where: { userId } }),
      this.conversationsRepository.count({ where: { userId } }),
      this.simulationsRepository
        .createQueryBuilder('s')
        .select('COUNT(*)', 'total')
        .addSelect(
          `SUM(CASE WHEN s.status = '${SimulationSessionStatus.COMPLETED}' THEN 1 ELSE 0 END)`,
          'completed',
        )
        .addSelect('AVG(s.total_score)::float', 'avgScore')
        .addSelect('MAX(s.total_score)', 'bestScore')
        .where('s.user_id = :userId', { userId })
        .andWhere('s.deleted_at IS NULL')
        .getRawOne<{
          total: string;
          completed: string;
          avgScore: number | null;
          bestScore: number | null;
        }>(),
      manager.query(
        `
        SELECT COALESCE(SUM(c.total_tokens), 0)::int AS tokens
        FROM conversations c
        WHERE c.user_id = $1 AND c.deleted_at IS NULL
        `,
        [userId],
      ),
    ]);

    let completedLessons = 0;
    let completedModules = 0;
    let completedCourses = 0;
    let totalLessonsProgress = 0;
    let totalLearningTime = 0;
    for (const row of progressStats) {
      const count = Number(row.count);
      const time = Number(row.time ?? 0);
      totalLearningTime += time;
      if (row.unitType === 'lesson') {
        totalLessonsProgress += count;
        if (row.status === ProgressStatus.COMPLETED) completedLessons += count;
      } else if (
        row.unitType === 'module' &&
        row.status === ProgressStatus.COMPLETED
      ) {
        completedModules += count;
      } else if (
        row.unitType === 'course' &&
        row.status === ProgressStatus.COMPLETED
      ) {
        completedCourses += count;
      }
    }

    const totalAttempts = Number(attemptAgg?.total ?? 0);
    const correctAttempts = Number(attemptAgg?.correct ?? 0);
    const overallAccuracy =
      totalAttempts > 0 ? correctAttempts / totalAttempts : 0;

    const totalTokens = Number(
      (tokenSum as { tokens: string | number }[])[0]?.tokens ?? 0,
    );

    return {
      totalLearningTime,
      totalQuestionsAttempted: totalAttempts,
      correctAttempts,
      overallAccuracy: Number(overallAccuracy.toFixed(4)),
      uniqueQuestionsAnswered: uniqueQuestionsAttempted,
      completedLessons,
      completedModules,
      completedCourses,
      lessonsInProgress: Math.max(0, totalLessonsProgress - completedLessons),
      vocabularyBookmarks: bookmarkCount,
      personalVocabulary: personalVocabCount,
      aiConversations: conversationCount,
      aiTokensUsed: totalTokens,
      simulationSessions: Number(simulationAgg?.total ?? 0),
      completedSimulations: Number(simulationAgg?.completed ?? 0),
      avgSimulationScore:
        simulationAgg?.avgScore != null
          ? Number(Number(simulationAgg.avgScore).toFixed(2))
          : null,
      bestSimulationScore:
        simulationAgg?.bestScore != null
          ? Number(simulationAgg.bestScore)
          : null,
    };
  }

  private async lastActivityAt(userId: string): Promise<Date | null> {
    const rows: { ts: string | null }[] = await this.usersRepository.query(
      `
      SELECT MAX(activity.ts) AS ts
      FROM (
        SELECT MAX(attempted_at) AS ts FROM question_attempts
          WHERE user_id = $1 AND deleted_at IS NULL
        UNION ALL
        SELECT MAX(last_accessed_at) AS ts FROM learning_progress
          WHERE user_id = $1 AND deleted_at IS NULL
        UNION ALL
        SELECT MAX(updated_at) AS ts FROM simulation_sessions
          WHERE user_id = $1 AND deleted_at IS NULL
        UNION ALL
        SELECT MAX(updated_at) AS ts FROM conversations
          WHERE user_id = $1 AND deleted_at IS NULL
      ) activity
      `,
      [userId],
    );
    if (!rows.length || !rows[0].ts) return null;
    return new Date(rows[0].ts);
  }

  // ─── Lịch hoạt động (heatmap 91 ngày) ─────────────────────────────────────

  private async activityCalendarRows(
    userId: string,
    since: Date,
  ): Promise<{ day: string; count: number }[]> {
    const rows: { day: string; count: string }[] = await this.usersRepository
      .query(
        `
      SELECT activity.day AS day, COUNT(*)::int AS count
      FROM (
        SELECT ${vnDayExpr('attempted_at')} AS day
          FROM question_attempts
          WHERE user_id = $1 AND deleted_at IS NULL AND attempted_at >= $2::timestamptz
        UNION ALL
        SELECT ${vnDayExpr('last_accessed_at')} AS day
          FROM learning_progress
          WHERE user_id = $1 AND deleted_at IS NULL AND last_accessed_at >= $2::timestamptz
        UNION ALL
        SELECT ${vnDayExpr('updated_at')} AS day
          FROM simulation_sessions
          WHERE user_id = $1 AND deleted_at IS NULL AND updated_at >= $2::timestamptz
        UNION ALL
        SELECT ${vnDayExpr('updated_at')} AS day
          FROM conversations
          WHERE user_id = $1 AND deleted_at IS NULL AND updated_at >= $2::timestamptz
      ) AS activity
      GROUP BY activity.day
      ORDER BY activity.day ASC
      `,
        [userId, since.toISOString()],
      );
    return rows.map((row) => ({ day: row.day, count: Number(row.count) }));
  }

  private buildCalendar(
    range: string[],
    rows: { day: string; count: number }[],
  ) {
    const byDay = new Map(rows.map((r) => [r.day, r.count]));
    const max = rows.reduce((acc, row) => Math.max(acc, row.count), 0);
    const tierOf = (value: number): 0 | 1 | 2 | 3 | 4 => {
      if (value <= 0 || max <= 0) return 0;
      const ratio = value / max;
      if (ratio > 0.75) return 4;
      if (ratio > 0.5) return 3;
      if (ratio > 0.25) return 2;
      return 1;
    };
    const days: CalendarDay[] = range.map((date) => {
      const value = byDay.get(date) ?? 0;
      return { date, value, tier: tierOf(value) };
    });
    let longestRun = 0;
    let currentRun = 0;
    let totalActiveDays = 0;
    for (const day of days) {
      if (day.value > 0) {
        currentRun += 1;
        totalActiveDays += 1;
        longestRun = Math.max(longestRun, currentRun);
      } else {
        currentRun = 0;
      }
    }
    return {
      windowDays: range.length,
      max,
      totalActiveDays,
      longestActiveRun: longestRun,
      days,
    };
  }

  // ─── Heatmap (thứ × giờ) ──────────────────────────────────────────────────

  private async hourHeatmap(
    userId: string,
    since: Date,
  ): Promise<{ weekday: number; hour: number; count: number }[]> {
    const rows: { weekday: number; hour: number; count: number }[] =
      await this.usersRepository.query(
        `
      SELECT EXTRACT(DOW FROM local_ts)::int AS weekday,
             EXTRACT(HOUR FROM local_ts)::int AS hour,
             COUNT(*)::int AS count
      FROM (
        SELECT ${vnLocalExpr('attempted_at')} AS local_ts
        FROM question_attempts
        WHERE user_id = $1 AND deleted_at IS NULL AND attempted_at >= $2::timestamptz
        UNION ALL
        SELECT ${vnLocalExpr('updated_at')} AS local_ts
        FROM simulation_sessions
        WHERE user_id = $1 AND deleted_at IS NULL AND updated_at >= $2::timestamptz
        UNION ALL
        SELECT ${vnLocalExpr('updated_at')} AS local_ts
        FROM conversations
        WHERE user_id = $1 AND deleted_at IS NULL AND updated_at >= $2::timestamptz
      ) t
      GROUP BY weekday, hour
      ORDER BY weekday, hour
      `,
        [userId, since.toISOString()],
      );
    return rows.map((row) => ({
      weekday: Number(row.weekday),
      hour: Number(row.hour),
      count: Number(row.count),
    }));
  }

  // ─── Trend 30 ngày ────────────────────────────────────────────────────────

  private async trendRows(userId: string, since: Date) {
    const manager = this.usersRepository.manager;
    const [attempts, lessons, vocab, ai] = await Promise.all([
      manager.query(
        `
        SELECT ${vnDayExpr('attempted_at')} AS day,
               COUNT(*)::int AS attempts,
               SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::int AS correct,
               COALESCE(SUM(time_taken), 0)::int AS time_taken
        FROM question_attempts
        WHERE user_id = $1 AND deleted_at IS NULL AND attempted_at >= $2::timestamptz
        GROUP BY day
        ORDER BY day
        `,
        [userId, since.toISOString()],
      ),
      manager.query(
        `
        SELECT ${vnDayExpr('completed_at')} AS day, COUNT(*)::int AS count
        FROM learning_progress
        WHERE user_id = $1
          AND deleted_at IS NULL
          AND unit_type = 'lesson'
          AND status = '${ProgressStatus.COMPLETED}'
          AND completed_at >= $2::timestamptz
        GROUP BY day
        ORDER BY day
        `,
        [userId, since.toISOString()],
      ),
      manager.query(
        `
        SELECT activity.day AS day, COUNT(*)::int AS count
        FROM (
          SELECT ${vnDayExpr('created_at')} AS day
            FROM bookmarks
            WHERE user_id = $1 AND deleted_at IS NULL AND created_at >= $2::timestamptz
          UNION ALL
          SELECT ${vnDayExpr('created_at')} AS day
            FROM personal_vocabularies
            WHERE user_id = $1 AND deleted_at IS NULL AND created_at >= $2::timestamptz
        ) activity
        GROUP BY activity.day
        ORDER BY activity.day
        `,
        [userId, since.toISOString()],
      ),
      manager.query(
        `
        SELECT ${vnDayExpr('cm.created_at')} AS day, COUNT(*)::int AS count
        FROM conversation_messages cm
        JOIN conversations c ON c.id = cm.conversation_id
        WHERE c.user_id = $1
          AND cm.deleted_at IS NULL
          AND cm.created_at >= $2::timestamptz
        GROUP BY day
        ORDER BY day
        `,
        [userId, since.toISOString()],
      ),
    ]);
    return { attempts, lessons, vocab, ai };
  }

  private buildTrend(
    range: string[],
    rows: {
      attempts: { day: string; attempts: number; correct: number; time_taken: number }[];
      lessons: { day: string; count: number }[];
      vocab: { day: string; count: number }[];
      ai: { day: string; count: number }[];
    },
  ) {
    const attemptByDay = new Map(
      rows.attempts.map((r) => [
        String(r.day),
        {
          attempts: Number(r.attempts),
          correct: Number(r.correct),
          timeTaken: Number(r.time_taken),
        },
      ]),
    );
    const lessonsByDay = new Map(
      rows.lessons.map((r) => [String(r.day), Number(r.count)]),
    );
    const vocabByDay = new Map(
      rows.vocab.map((r) => [String(r.day), Number(r.count)]),
    );
    const aiByDay = new Map(
      rows.ai.map((r) => [String(r.day), Number(r.count)]),
    );

    const series = range.map((date) => {
      const attempt = attemptByDay.get(date);
      const attempts = attempt?.attempts ?? 0;
      const correct = attempt?.correct ?? 0;
      const timeTaken = attempt?.timeTaken ?? 0;
      const accuracy = attempts === 0 ? null : Number((correct / attempts).toFixed(4));
      const activeMinutes = Math.round(timeTaken / 60);
      return {
        date,
        attempts,
        correct,
        accuracy,
        lessonsCompleted: lessonsByDay.get(date) ?? 0,
        vocabularyAdded: vocabByDay.get(date) ?? 0,
        aiMessages: aiByDay.get(date) ?? 0,
        activeMinutes,
      };
    });
    return { range: range.length, series };
  }

  // ─── Skill radar (theo loại câu hỏi) ──────────────────────────────────────

  private async skillRadarRows(userId: string) {
    const rows: {
      questionType: string;
      attempts: string;
      correct: string;
      avgTime: number | null;
    }[] = await this.questionAttemptsRepository.query(
      `
      SELECT q.question_type AS "questionType",
             COUNT(*)::int AS attempts,
             SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::int AS correct,
             AVG(a.time_taken)::float AS "avgTime"
      FROM question_attempts a
      JOIN questions q ON q.id = a.question_id
      WHERE a.user_id = $1 AND a.deleted_at IS NULL
      GROUP BY q.question_type
      `,
      [userId],
    );
    const byType = new Map(rows.map((r) => [r.questionType, r]));
    return ALL_QUESTION_TYPES.map((qt) => {
      const row = byType.get(qt);
      const attempts = Number(row?.attempts ?? 0);
      const correct = Number(row?.correct ?? 0);
      const accuracy = attempts > 0 ? correct / attempts : 0;
      let strength: 'strong' | 'average' | 'weak' | 'untested' = 'untested';
      if (attempts === 0) strength = 'untested';
      else if (accuracy >= 0.8) strength = 'strong';
      else if (accuracy >= 0.6) strength = 'average';
      else strength = 'weak';
      return {
        questionType: qt,
        attempts,
        correct,
        accuracy: Number(accuracy.toFixed(4)),
        avgTimeMs: row?.avgTime != null ? Number(row.avgTime) : null,
        strength,
      };
    });
  }

  // ─── Phân bố theo độ khó ──────────────────────────────────────────────────

  private async difficultyBreakdownRows(userId: string) {
    const rows: {
      difficulty: number;
      attempts: string;
      correct: string;
    }[] = await this.questionAttemptsRepository.query(
      `
      SELECT q.difficulty_level AS difficulty,
             COUNT(*)::int AS attempts,
             SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::int AS correct
      FROM question_attempts a
      JOIN questions q ON q.id = a.question_id
      WHERE a.user_id = $1 AND a.deleted_at IS NULL
      GROUP BY q.difficulty_level
      ORDER BY q.difficulty_level
      `,
      [userId],
    );
    const byLevel = new Map(
      rows.map((row) => [
        Number(row.difficulty),
        {
          attempts: Number(row.attempts),
          correct: Number(row.correct),
        },
      ]),
    );
    return [1, 2, 3, 4, 5].map((difficulty) => {
      const data = byLevel.get(difficulty) ?? { attempts: 0, correct: 0 };
      const accuracy = data.attempts > 0 ? data.correct / data.attempts : 0;
      return {
        difficulty,
        attempts: data.attempts,
        correct: data.correct,
        accuracy: Number(accuracy.toFixed(4)),
      };
    });
  }

  // ─── Histogram thời gian giải ─────────────────────────────────────────────

  private async speedHistogramRows(userId: string) {
    const rows: { bucket: number; count: string; correct: string }[] =
      await this.questionAttemptsRepository.query(
        `
      SELECT
        CASE
          WHEN time_taken IS NULL OR time_taken = 0 THEN 0
          WHEN time_taken < 5 THEN 1
          WHEN time_taken < 15 THEN 2
          WHEN time_taken < 30 THEN 3
          WHEN time_taken < 60 THEN 4
          WHEN time_taken < 120 THEN 5
          ELSE 6
        END AS bucket,
        COUNT(*)::int AS count,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::int AS correct
      FROM question_attempts
      WHERE user_id = $1 AND deleted_at IS NULL
      GROUP BY bucket
      ORDER BY bucket
      `,
        [userId],
      );
    const labels = [
      'Không đo',
      '< 5s',
      '5–15s',
      '15–30s',
      '30–60s',
      '1–2 phút',
      '> 2 phút',
    ];
    const byBucket = new Map(
      rows.map((row) => [
        Number(row.bucket),
        { count: Number(row.count), correct: Number(row.correct) },
      ]),
    );
    return labels.map((label, idx) => {
      const data = byBucket.get(idx) ?? { count: 0, correct: 0 };
      const correctRate = data.count > 0 ? data.correct / data.count : 0;
      return {
        bucket: label,
        count: data.count,
        correct: data.correct,
        correctRate: Number(correctRate.toFixed(4)),
      };
    });
  }

  // ─── Từ vựng ──────────────────────────────────────────────────────────────

  private async vocabularyInsights(userId: string, now: Date) {
    const since = startOfVnDay(now, 29);
    const [bookmarksBySource, partOfSpeechRows, recent, last30] =
      await Promise.all([
        this.bookmarksRepository
          .createQueryBuilder('b')
          .leftJoin('b.vocabulary', 'v')
          .leftJoin('b.personalVocabulary', 'pv')
          .select(
            `CASE
               WHEN b.vocabulary_id IS NOT NULL THEN 'system'
               WHEN pv.source = 'IMAGE_DISCOVERY' THEN 'image'
               WHEN pv.source = 'MANUAL' THEN 'manual'
               ELSE 'other'
             END`,
            'source',
          )
          .addSelect('COUNT(*)', 'count')
          .where('b.user_id = :userId', { userId })
          .andWhere('b.deleted_at IS NULL')
          .groupBy('source')
          .getRawMany<{ source: string; count: string }>(),
        this.bookmarksRepository.query(
          `
          SELECT pos AS pos, COUNT(*)::int AS count
          FROM (
            SELECT v.part_of_speech AS pos
              FROM bookmarks b
              JOIN vocabularies v ON v.id = b.vocabulary_id
              WHERE b.user_id = $1 AND b.deleted_at IS NULL
            UNION ALL
            SELECT pv.part_of_speech AS pos
              FROM bookmarks b
              JOIN personal_vocabularies pv ON pv.id = b.personal_vocabulary_id
              WHERE b.user_id = $1 AND b.deleted_at IS NULL
          ) t
          WHERE pos IS NOT NULL
          GROUP BY pos
          ORDER BY count DESC
          LIMIT 10
          `,
          [userId],
        ),
        this.bookmarksRepository
          .createQueryBuilder('b')
          .leftJoinAndSelect('b.vocabulary', 'v')
          .leftJoinAndSelect('b.personalVocabulary', 'pv')
          .where('b.user_id = :userId', { userId })
          .andWhere('b.deleted_at IS NULL')
          .orderBy('b.created_at', 'DESC')
          .limit(8)
          .getMany(),
        this.bookmarksRepository.count({
          where: { userId },
          relations: [],
        }),
      ]);

    let systemBookmarks = 0;
    let personalManual = 0;
    let personalImage = 0;
    for (const row of bookmarksBySource) {
      const count = Number(row.count);
      if (row.source === 'system') systemBookmarks = count;
      else if (row.source === 'manual') personalManual = count;
      else if (row.source === 'image') personalImage = count;
    }
    const totalBookmarks =
      systemBookmarks + personalManual + personalImage + 0;

    const addedLast30Days = (await this.bookmarksRepository.query(
      `
      SELECT COUNT(*)::int AS c FROM bookmarks
      WHERE user_id = $1 AND deleted_at IS NULL AND created_at >= $2::timestamptz
      `,
      [userId, since.toISOString()],
    )) as { c: number }[];

    const partOfSpeech = (partOfSpeechRows as { pos: string; count: number }[]).map(
      (row) => ({ partOfSpeech: row.pos, count: Number(row.count) }),
    );

    const recentBookmarks = (recent as unknown as Array<{
      id: string;
      createdAt: Date;
      vocabulary?: {
        id: string;
        word: string;
        translation: string;
        partOfSpeech?: string | null;
      } | null;
      personalVocabulary?: {
        id: string;
        word: string;
        translation: string;
        source: string;
        partOfSpeech?: string | null;
      } | null;
    }>).map((b) => {
      const ref = b.vocabulary ?? b.personalVocabulary;
      const source = b.vocabulary
        ? 'system'
        : b.personalVocabulary?.source === 'IMAGE_DISCOVERY'
          ? 'image'
          : 'manual';
      return {
        id: b.id,
        word: ref?.word ?? '—',
        translation: ref?.translation ?? '—',
        partOfSpeech: ref?.partOfSpeech ?? null,
        source,
        createdAt:
          b.createdAt instanceof Date
            ? b.createdAt.toISOString()
            : String(b.createdAt),
      };
    });

    void last30;

    return {
      totalBookmarks,
      systemBookmarks,
      personalManual,
      personalImage,
      addedLast30Days: Number(addedLast30Days[0]?.c ?? 0),
      byPartOfSpeech: partOfSpeech,
      recentlyAdded: recentBookmarks,
    };
  }

  // ─── Tiến độ khóa học ─────────────────────────────────────────────────────

  private async courseProgressRows(userId: string) {
    const rows: {
      courseId: string;
      title: string;
      level: string;
      status: string;
      completedLessons: number | null;
      totalLessons: number | null;
      timeSpent: number;
      lastAccessedAt: string | null;
      score: number | null;
    }[] = await this.progressRepository.query(
      `
      SELECT p.course_id AS "courseId",
             c.title AS "title",
             c.level AS "level",
             p.status AS "status",
             p.completed_lessons_count AS "completedLessons",
             p.total_lessons_count AS "totalLessons",
             COALESCE(p.time_spent, 0)::int AS "timeSpent",
             p.last_accessed_at AS "lastAccessedAt",
             p.score AS "score"
      FROM learning_progress p
      JOIN courses c ON c.id = p.course_id
      WHERE p.user_id = $1
        AND p.unit_type = 'course'
        AND p.deleted_at IS NULL
        AND c.deleted_at IS NULL
      ORDER BY p.last_accessed_at DESC NULLS LAST
      LIMIT ${TOP_COURSES_LIMIT}
      `,
      [userId],
    );
    return rows.map((row) => {
      const completed = Number(row.completedLessons ?? 0);
      const total = Number(row.totalLessons ?? 0);
      const completion = total > 0 ? Math.min(1, completed / total) : 0;
      return {
        courseId: row.courseId,
        title: row.title,
        level: row.level,
        status: row.status,
        completedLessons: completed,
        totalLessons: total,
        completion: Number(completion.toFixed(4)),
        timeSpent: Number(row.timeSpent ?? 0),
        lastAccessedAt: row.lastAccessedAt
          ? new Date(row.lastAccessedAt).toISOString()
          : null,
        score: row.score != null ? Number(row.score) : null,
      };
    });
  }

  // ─── AI: hội thoại ────────────────────────────────────────────────────────

  private async conversationStats(userId: string) {
    const rows: {
      total: string;
      messages: string;
      tokens: string;
    }[] = await this.conversationsRepository.query(
      `
      SELECT COUNT(DISTINCT c.id)::int AS total,
             COUNT(cm.id)::int AS messages,
             COALESCE(SUM(c.total_tokens), 0)::int AS tokens
      FROM conversations c
      LEFT JOIN conversation_messages cm ON cm.conversation_id = c.id AND cm.deleted_at IS NULL
      WHERE c.user_id = $1 AND c.deleted_at IS NULL
      `,
      [userId],
    );
    const total = Number(rows[0]?.total ?? 0);
    const messages = Number(rows[0]?.messages ?? 0);
    const tokens = Number(rows[0]?.tokens ?? 0);
    return {
      total,
      messages,
      tokens,
      avgMessages: total > 0 ? Math.round((messages / total) * 10) / 10 : 0,
      avgTokensPerSession:
        total > 0 ? Math.round(tokens / total) : 0,
    };
  }

  private async recentConversations(userId: string) {
    const rows = await this.conversationsRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.course', 'course')
      .leftJoinAndSelect('c.lesson', 'lesson')
      .leftJoin(
        'conversation_messages',
        'cm',
        'cm.conversation_id = c.id AND cm.deleted_at IS NULL',
      )
      .addSelect('COUNT(cm.id)', 'msg_count')
      .where('c.user_id = :userId', { userId })
      .andWhere('c.deleted_at IS NULL')
      .groupBy('c.id')
      .addGroupBy('course.id')
      .addGroupBy('lesson.id')
      .orderBy('c.updated_at', 'DESC')
      .limit(RECENT_LIMIT)
      .getRawAndEntities();

    return rows.entities.map((entity, idx) => {
      const raw = rows.raw[idx] as { msg_count?: string };
      return {
        id: entity.id,
        title: entity.title || 'Hội thoại không tiêu đề',
        model: entity.model,
        totalTokens: entity.totalTokens,
        messageCount: Number(raw.msg_count ?? 0),
        courseTitle: entity.course?.title ?? null,
        lessonTitle: entity.lesson?.title ?? null,
        updatedAt: entity.updatedAt.toISOString(),
      };
    });
  }

  // ─── AI: mô phỏng ─────────────────────────────────────────────────────────

  private async simulationStats(userId: string) {
    const [agg, criteriaRows] = await Promise.all([
      this.simulationsRepository
        .createQueryBuilder('s')
        .select('COUNT(*)::int', 'total')
        .addSelect(
          `SUM(CASE WHEN s.status = '${SimulationSessionStatus.COMPLETED}' THEN 1 ELSE 0 END)::int`,
          'completed',
        )
        .addSelect('AVG(s.total_score)::float', 'avgScore')
        .addSelect('MAX(s.total_score)::int', 'bestScore')
        .addSelect('AVG(s.total_messages)::float', 'avgMessages')
        .addSelect('SUM(s.total_tokens)::int', 'tokens')
        .where('s.user_id = :userId', { userId })
        .andWhere('s.deleted_at IS NULL')
        .getRawOne<{
          total: number;
          completed: number;
          avgScore: number | null;
          bestScore: number | null;
          avgMessages: number | null;
          tokens: number | null;
        }>(),
      this.simulationsRepository.query(
        `
        SELECT criterion->>'name' AS name,
               AVG((criterion->>'score')::float) AS "avgScore",
               MAX((criterion->>'maxScore')::float) AS "maxScore",
               COUNT(*)::int AS samples
        FROM simulation_sessions s,
             jsonb_array_elements(s.criteria_scores) AS criterion
        WHERE s.user_id = $1
          AND s.deleted_at IS NULL
          AND s.status = '${SimulationSessionStatus.COMPLETED}'
          AND jsonb_array_length(s.criteria_scores) > 0
        GROUP BY criterion->>'name'
        ORDER BY samples DESC
        LIMIT 6
        `,
        [userId],
      ),
    ]);

    const criteriaAverages = (criteriaRows as Array<{
      name: string;
      avgScore: number | null;
      maxScore: number | null;
      samples: number;
    }>).map((row) => ({
      name: row.name,
      avgScore: row.avgScore != null ? Number(Number(row.avgScore).toFixed(2)) : 0,
      maxScore: row.maxScore != null ? Number(row.maxScore) : 0,
      samples: Number(row.samples ?? 0),
    }));

    return {
      total: Number(agg?.total ?? 0),
      completed: Number(agg?.completed ?? 0),
      avgScore: agg?.avgScore != null ? Number(Number(agg.avgScore).toFixed(2)) : null,
      bestScore: agg?.bestScore != null ? Number(agg.bestScore) : null,
      avgMessages: agg?.avgMessages != null ? Math.round(Number(agg.avgMessages) * 10) / 10 : 0,
      totalTokens: Number(agg?.tokens ?? 0),
      criteriaAverages,
    };
  }

  private async recentSimulations(userId: string) {
    const sessions = await this.simulationsRepository.find({
      where: { userId },
      relations: ['scenario', 'chosenCharacter'],
      order: { updatedAt: 'DESC' },
      take: RECENT_LIMIT,
    });
    if (sessions.length === 0) return [];

    const counts = (await this.simulationsRepository.query(
      `
      SELECT m.session_id AS "sessionId", COUNT(*)::int AS count
      FROM simulation_messages m
      WHERE m.session_id = ANY($1::uuid[]) AND m.deleted_at IS NULL
      GROUP BY m.session_id
      `,
      [sessions.map((s) => s.id)],
    )) as { sessionId: string; count: number }[];
    const countMap = new Map(counts.map((row) => [row.sessionId, Number(row.count)]));

    return sessions.map((session) => {
      const count = countMap.get(session.id) ?? 0;
      return {
        id: session.id,
        scenarioTitle: session.scenario?.title ?? 'Tình huống',
        characterName: session.chosenCharacter?.name ?? null,
        totalScore: session.totalScore ?? null,
        status: session.status,
        endReason: session.endReason ?? null,
        messageCount:
          session.totalMessages && session.totalMessages > 0
            ? session.totalMessages
            : count,
        updatedAt: session.updatedAt.toISOString(),
      };
    });
  }

  // ─── Mục tiêu & chuỗi ─────────────────────────────────────────────────────

  private async goalsHistory(userId: string, now: Date) {
    const since = startOfVnDay(now, 29);
    const range = vnDateRange(30, now);
    const [progressRows, goals] = await Promise.all([
      this.dailyGoalProgressRepository.query(
        `
        SELECT date::text AS day,
               exercises_completed AS questions,
               lessons_completed AS lessons
        FROM daily_goal_progress
        WHERE user_id = $1
          AND deleted_at IS NULL
          AND date >= $2::date
        ORDER BY date ASC
        `,
        [userId, vnDayKey(since)],
      ),
      this.dailyGoalsRepository.find({ where: { userId } }),
    ]);
    const targets = new Map<string, number>();
    for (const goal of goals) {
      targets.set(goal.goalType, goal.targetValue);
    }
    const questionsTarget = targets.get('QUESTIONS') ?? 0;
    const lessonsTarget = targets.get('LESSONS') ?? 0;

    const byDay = new Map(
      (progressRows as { day: string; questions: number; lessons: number }[]).map(
        (row) => [
          row.day,
          {
            questions: Number(row.questions),
            lessons: Number(row.lessons),
          },
        ],
      ),
    );

    const daily = range.map((date) => {
      const data = byDay.get(date) ?? { questions: 0, lessons: 0 };
      const metQuestions =
        questionsTarget === 0 ? data.questions > 0 : data.questions >= questionsTarget;
      const metLessons =
        lessonsTarget === 0 ? data.lessons > 0 : data.lessons >= lessonsTarget;
      const met =
        (questionsTarget > 0 || lessonsTarget > 0) ? metQuestions && metLessons : metQuestions || metLessons;
      return {
        date,
        questions: data.questions,
        lessons: data.lessons,
        questionsTarget,
        lessonsTarget,
        met,
      };
    });

    const metDays = daily.filter((d) => d.met).length;
    return {
      goalCompletionLast30Days: daily,
      goalCompletionRate: range.length > 0 ? Number((metDays / range.length).toFixed(4)) : 0,
    };
  }

  // ─── Health / Risk score ──────────────────────────────────────────────────

  private computeHealth(input: {
    lastActivityAt: Date | null;
    now: Date;
    streak: DailyStreak | null;
    overview: {
      totalQuestionsAttempted: number;
      overallAccuracy: number;
      activeDaysRate: number;
      aiConversations: number;
      simulationSessions: number;
      completedLessons: number;
      vocabularyBookmarks: number;
    };
    activityCalendar: { totalActiveDays: number; windowDays: number };
    trends: { series: Array<{ attempts: number; activeMinutes: number }> };
  }) {
    const reasons: string[] = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const daysSinceLastActivity =
      input.lastActivityAt == null
        ? null
        : Math.floor((input.now.getTime() - input.lastActivityAt.getTime()) / dayMs);

    let status: 'active' | 'at_risk' | 'dormant' | 'new' = 'new';
    if (daysSinceLastActivity == null) {
      status = 'new';
      reasons.push('Chưa có hoạt động nào kể từ khi đăng ký');
    } else if (daysSinceLastActivity <= 2) {
      status = 'active';
    } else if (daysSinceLastActivity <= 7) {
      status = 'at_risk';
      reasons.push(`${daysSinceLastActivity} ngày không tương tác`);
    } else if (daysSinceLastActivity <= 30) {
      status = 'at_risk';
      reasons.push(`Đã ${daysSinceLastActivity} ngày không học`);
    } else {
      status = 'dormant';
      reasons.push(`Ngủ đông ${daysSinceLastActivity} ngày`);
    }

    if (input.streak?.currentStreak === 0 && (input.streak?.longestStreak ?? 0) > 3) {
      reasons.push('Đã đứt chuỗi sau khi từng giữ liên tục');
    }
    if (input.overview.overallAccuracy > 0 && input.overview.overallAccuracy < 0.55) {
      reasons.push(`Độ chính xác thấp (${Math.round(input.overview.overallAccuracy * 100)}%)`);
    }

    const recent = input.trends.series.slice(-7);
    const recentAttempts = recent.reduce((s, p) => s + p.attempts, 0);
    if (recentAttempts === 0 && daysSinceLastActivity != null && daysSinceLastActivity > 1) {
      reasons.push('Tuần qua không trả lời câu hỏi nào');
    }

    // Engagement: 4 cấu phần đều thang 0..1
    const consistency = Math.min(
      1,
      input.activityCalendar.totalActiveDays /
        Math.max(1, input.activityCalendar.windowDays * 0.5),
    );
    const accuracy = input.overview.totalQuestionsAttempted >= 5
      ? input.overview.overallAccuracy
      : 0.5;
    const surfaces = [
      input.overview.completedLessons > 0,
      input.overview.totalQuestionsAttempted > 0,
      input.overview.vocabularyBookmarks > 0,
      input.overview.aiConversations > 0,
      input.overview.simulationSessions > 0,
    ];
    const breadth = surfaces.filter(Boolean).length / surfaces.length;
    const totalActivity =
      input.overview.totalQuestionsAttempted +
      input.overview.completedLessons * 5 +
      input.overview.aiConversations * 3 +
      input.overview.simulationSessions * 4;
    const volume = Math.min(1, totalActivity / 200);

    const engagementScore = Math.round(
      (consistency * 0.3 + accuracy * 0.25 + breadth * 0.2 + volume * 0.25) * 100,
    );

    const riskScore = Math.max(
      0,
      Math.min(100, 100 - engagementScore + (daysSinceLastActivity ?? 0) * 1.5),
    );

    return {
      status,
      lastActiveAt: input.lastActivityAt?.toISOString() ?? null,
      daysSinceLastActivity,
      riskScore: Math.round(riskScore),
      riskReasons: reasons,
      engagementScore,
      engagementBreakdown: {
        consistency: Number(consistency.toFixed(4)),
        accuracy: Number(accuracy.toFixed(4)),
        breadth: Number(breadth.toFixed(4)),
        volume: Number(volume.toFixed(4)),
      },
    };
  }

  // ─── Insights tự sinh ─────────────────────────────────────────────────────

  private buildInsights(input: {
    health: { status: string; riskScore: number; daysSinceLastActivity: number | null };
    skillRadar: Array<{
      questionType: string;
      attempts: number;
      accuracy: number;
      strength: string;
    }>;
    vocabularyInsights: { totalBookmarks: number; personalImage: number; addedLast30Days: number };
    trends: { series: Array<{ attempts: number; lessonsCompleted: number; aiMessages: number }> };
    streak: DailyStreak | null;
    goalsHistory: { goalCompletionRate: number };
    simulations: { total: number; avgScore: number | null };
    conversations: { total: number; messages: number };
  }) {
    const insights: Array<{
      severity: 'success' | 'info' | 'warning' | 'critical';
      title: string;
      message: string;
    }> = [];

    if (input.health.status === 'active') {
      insights.push({
        severity: 'success',
        title: 'Đang hoạt động ổn định',
        message: 'Học viên tương tác đều, có thể đề xuất bài học khó hơn để giữ động lực.',
      });
    } else if (input.health.status === 'at_risk') {
      insights.push({
        severity: 'warning',
        title: 'Học viên có nguy cơ bỏ học',
        message: `${input.health.daysSinceLastActivity ?? 0} ngày không tương tác — đề xuất gửi thông báo nhắc nhở hoặc ưu đãi quay lại.`,
      });
    } else if (input.health.status === 'dormant') {
      insights.push({
        severity: 'critical',
        title: 'Học viên ngủ đông',
        message: 'Cần chiến dịch tái kích hoạt: email khuyến mãi, push notification, hoặc khảo sát.',
      });
    }

    const weak = input.skillRadar.filter((row) => row.strength === 'weak' && row.attempts >= 5);
    if (weak.length > 0) {
      insights.push({
        severity: 'warning',
        title: `Yếu ở ${weak.length} loại bài tập`,
        message: `Cân nhắc bổ sung bài luyện ${weak.map((w) => w.questionType).join(', ')} với độ khó vừa phải để cải thiện.`,
      });
    }
    const strong = input.skillRadar.filter((row) => row.strength === 'strong' && row.attempts >= 10);
    if (strong.length >= 3) {
      insights.push({
        severity: 'success',
        title: 'Đa kỹ năng mạnh',
        message: `Học viên đã thành thạo ${strong.length} loại bài tập — có thể thử bài tập tổng hợp hoặc cao cấp.`,
      });
    }

    if (input.vocabularyInsights.personalImage > 0) {
      insights.push({
        severity: 'info',
        title: 'Có xu hướng học từ ảnh',
        message: `Đã thêm ${input.vocabularyInsights.personalImage} từ qua tính năng nhận diện ảnh — phát triển thêm bộ lọc / gợi ý ngữ cảnh.`,
      });
    }
    if (input.vocabularyInsights.addedLast30Days === 0 && input.vocabularyInsights.totalBookmarks > 0) {
      insights.push({
        severity: 'info',
        title: 'Không lưu từ mới gần đây',
        message: '30 ngày qua không có từ vựng nào được lưu — nên nhắc tính năng đánh dấu từ.',
      });
    }

    const recentLessons = input.trends.series.slice(-7).reduce((s, p) => s + p.lessonsCompleted, 0);
    if (recentLessons === 0) {
      insights.push({
        severity: 'warning',
        title: 'Tuần qua không hoàn thành bài học',
        message: 'Đề xuất tạo hành trình ngắn 5–7 phút để học viên hoàn tất ngay trên di động.',
      });
    } else if (recentLessons >= 7) {
      insights.push({
        severity: 'success',
        title: 'Học siêng năng',
        message: `Đã hoàn thành ${recentLessons} bài trong 7 ngày — phù hợp để giới thiệu khóa nâng cao.`,
      });
    }

    if (input.goalsHistory.goalCompletionRate >= 0.7) {
      insights.push({
        severity: 'success',
        title: 'Đạt mục tiêu thường xuyên',
        message: `Tỷ lệ đạt mục tiêu 30 ngày: ${Math.round(input.goalsHistory.goalCompletionRate * 100)}% — có thể đề xuất tăng mục tiêu.`,
      });
    } else if (input.goalsHistory.goalCompletionRate < 0.3) {
      insights.push({
        severity: 'warning',
        title: 'Mục tiêu hàng ngày quá cao?',
        message: `Tỷ lệ đạt mục tiêu thấp (${Math.round(input.goalsHistory.goalCompletionRate * 100)}%) — đề xuất hỏi học viên để hạ mức.`,
      });
    }

    if (input.conversations.total > 0 && input.simulations.total === 0) {
      insights.push({
        severity: 'info',
        title: 'Thích trợ lý AI hơn mô phỏng',
        message: 'Học viên dùng nhiều hội thoại AI nhưng chưa thử mô phỏng — có thể đề xuất tình huống dễ làm quen.',
      });
    }
    if (input.simulations.total >= 5 && input.simulations.avgScore != null && input.simulations.avgScore >= 80) {
      insights.push({
        severity: 'success',
        title: 'Mô phỏng đạt điểm cao',
        message: `Điểm mô phỏng trung bình ${input.simulations.avgScore} — phù hợp giới thiệu tình huống chuyên ngành.`,
      });
    }

    if ((input.streak?.currentStreak ?? 0) >= 7) {
      insights.push({
        severity: 'success',
        title: `Chuỗi ${input.streak?.currentStreak} ngày`,
        message: 'Học viên giữ nhịp đều — nên gửi badge / phần thưởng khích lệ.',
      });
    }

    return insights;
  }
}

// Giữ helper export cho test/future use
export const __INTERNAL_ANALYTICS_HELPERS = { fillDailySeries };
