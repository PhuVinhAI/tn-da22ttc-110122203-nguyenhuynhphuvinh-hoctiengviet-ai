#!/usr/bin/env bun

/**
 * Import learner seed JSON files into PostgreSQL.
 * Requires lessons + simulations already seeded (seed:lessons, seed:simulations).
 *
 * Usage (from backend/):
 *   bun run seed:users
 *   bun run seed:users -- --limit 50
 *   bun run seed:users -- --from 1 --to 200 --dir ../../.scratch/seed-data/users
 */

import 'reflect-metadata';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import * as bcrypt from 'bcrypt';
import { loadLessonCatalog } from './user-seeds/catalog';
import type { UserSeedFile } from './user-seeds/types';

const DEFAULT_DIR = path.resolve(__dirname, '../../.scratch/seed-data/users');
const BATCH_LOG = 100;

interface RefMaps {
  lessonIds: Map<string, string>;
  moduleIds: Map<string, string>;
  courseIds: Map<string, string>;
  questionIds: Map<string, string>;
  lessonCourseByRef: Map<string, string>;
  scenarioByTitle: Map<
    string,
    {
      id: string;
      playableCharacterId: string;
      partnerCharacterIds: string[];
    }
  >;
  vocabularyIds: string[];
}

type OnConflict = 'skip' | 'mutate-email';

function parseArgs() {
  const args = process.argv.slice(2);
  let dir = DEFAULT_DIR;
  let from = 1;
  let to = 10_000;
  let limit: number | null = null;
  let dryRun = false;
  let onConflict: OnConflict = 'skip';

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--dir' && args[i + 1]) {
      dir = path.resolve(args[i + 1]);
      i += 1;
    } else if (arg === '--from' && args[i + 1]) {
      from = parseInt(args[i + 1], 10);
      i += 1;
    } else if (arg === '--to' && args[i + 1]) {
      to = parseInt(args[i + 1], 10);
      i += 1;
    } else if (arg === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i += 1;
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--on-conflict' && args[i + 1]) {
      const v = args[i + 1];
      if (v !== 'skip' && v !== 'mutate-email') {
        throw new Error(`--on-conflict must be 'skip' or 'mutate-email', got '${v}'`);
      }
      onConflict = v;
      i += 1;
    }
  }

  return { dir, from, to, limit, dryRun, onConflict };
}

function buildClient() {
  const url = process.env.DATABASE_URL;
  const useSSL =
    process.env.DATABASE_SSL === 'true' ||
    (url ? /sslmode=(require|verify)/.test(url) : false);
  const sslOption = useSSL ? { rejectUnauthorized: false } : false;

  return url
    ? new pg.Client({ connectionString: url, ssl: sslOption })
    : new pg.Client({
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        database: process.env.DATABASE_NAME || 'linvnix',
        ssl: sslOption,
      });
}

async function loadRefMaps(client: pg.Client): Promise<RefMaps> {
  const catalog = loadLessonCatalog();
  const lessonIds = new Map<string, string>();
  const moduleIds = new Map<string, string>();
  const courseIds = new Map<string, string>();
  const questionIds = new Map<string, string>();

  const lessons = await client.query(
    `SELECT l.id, l.title, l.module_id, m.course_id, c.level, m.order_index AS module_order, l.order_index AS lesson_order
       FROM lessons l
       JOIN modules m ON m.id = l.module_id
       JOIN courses c ON c.id = m.course_id
      WHERE l.deleted_at IS NULL
      ORDER BY c.order_index, m.order_index, l.order_index`,
  );

  const dbByLevelTitle = new Map<string, string>();
  for (const row of lessons.rows) {
    dbByLevelTitle.set(`${row.level}:${row.title}`, row.id);
  }

  for (const entry of catalog) {
    const lessonId = dbByLevelTitle.get(`${entry.level}:${entry.title}`);
    if (!lessonId) continue;
    lessonIds.set(entry.ref, lessonId);

    const lessonRow = lessons.rows.find((row) => row.id === lessonId);
    if (lessonRow) {
      moduleIds.set(entry.moduleRef, lessonRow.module_id);
      courseIds.set(entry.courseRef, lessonRow.course_id);
    }
  }

  for (const entry of catalog) {
    const lessonId = lessonIds.get(entry.ref);
    if (!lessonId) continue;
    const questions = await client.query(
      `SELECT id, order_index
         FROM questions
        WHERE exercise_id IN (SELECT id FROM exercises WHERE lesson_id = $1)
          AND deleted_at IS NULL
        ORDER BY order_index ASC`,
      [lessonId],
    );
    for (const question of questions.rows) {
      questionIds.set(`${entry.ref}:${question.order_index}`, question.id);
    }
  }

  const scenarios = await client.query(
    `SELECT s.id AS scenario_id, s.title,
            sc.id AS character_id,
            sc.is_playable
       FROM scenarios s
       JOIN scenario_characters sc ON sc.scenario_id = s.id AND sc.deleted_at IS NULL
      WHERE s.deleted_at IS NULL
      ORDER BY s.id, sc.created_at ASC`,
  );

  const scenarioByTitle = new Map<
    string,
    { id: string; playableCharacterId: string; partnerCharacterIds: string[] }
  >();
  for (const row of scenarios.rows) {
    let entry = scenarioByTitle.get(row.title);
    if (!entry) {
      entry = { id: row.scenario_id, playableCharacterId: '', partnerCharacterIds: [] };
      scenarioByTitle.set(row.title, entry);
    }
    if (row.is_playable && !entry.playableCharacterId) {
      entry.playableCharacterId = row.character_id;
    } else if (!row.is_playable) {
      entry.partnerCharacterIds.push(row.character_id);
    }
  }
  for (const [title, entry] of scenarioByTitle.entries()) {
    if (!entry.playableCharacterId) scenarioByTitle.delete(title);
  }

  const lessonCourseByRef = new Map<string, string>();
  for (const entry of catalog) {
    const lessonId = lessonIds.get(entry.ref);
    if (!lessonId) continue;
    const courseId = courseIds.get(entry.courseRef);
    if (courseId) lessonCourseByRef.set(entry.ref, courseId);
  }

  const vocabRows = await client.query(
    'SELECT id FROM vocabularies WHERE deleted_at IS NULL ORDER BY id LIMIT 500',
  );
  const vocabularyIds = vocabRows.rows.map((row) => row.id as string);

  return {
    lessonIds,
    moduleIds,
    courseIds,
    questionIds,
    lessonCourseByRef,
    scenarioByTitle,
    vocabularyIds,
  };
}

async function bulkInsert(
  client: pg.Client,
  table: string,
  columns: string[],
  rows: unknown[][],
  suffix = '',
) {
  if (rows.length === 0) return;
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const params: unknown[] = [];
    const valueRows: string[] = [];
    for (const row of slice) {
      const placeholders = row.map((value) => {
        params.push(value);
        return `$${params.length}`;
      });
      valueRows.push(`(${placeholders.join(',')})`);
    }
    await client.query(
      `INSERT INTO ${table} (${columns.join(',')}) VALUES ${valueRows.join(',')} ${suffix}`,
      params,
    );
  }
}

function mutatedEmailFor(seedId: string, email: string): string {
  const at = email.indexOf('@');
  if (at < 0) return `${seedId}.${email}`;
  return `${email.slice(0, at)}+${seedId}${email.slice(at)}`;
}

async function importUser(
  client: pg.Client,
  seed: UserSeedFile,
  maps: RefMaps,
  onConflict: OnConflict,
) {
  let email = seed.profile.email;
  const mutated = mutatedEmailFor(seed.seedId, email);

  const mutatedExisting = await client.query(
    'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1',
    [mutated],
  );
  if (mutatedExisting.rows.length > 0) {
    return { skipped: true };
  }

  const existing = await client.query(
    'SELECT id, full_name FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1',
    [email],
  );
  if (existing.rows.length > 0) {
    if (existing.rows[0].full_name === seed.profile.fullName) {
      return { skipped: true };
    }
    if (onConflict === 'skip') {
      return { skipped: true };
    }
    email = mutated;
  }

  const passwordHash =
    seed.profile.password != null ? await bcrypt.hash(seed.profile.password, 10) : null;

  const userRes = await client.query(
    `INSERT INTO users (
       email, password, full_name, native_language, current_level, preferred_dialect,
       email_verified, email_verified_at, onboarding_completed, notification_enabled,
       notification_time, provider, google_id, avatar_url, created_at, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$15)
     RETURNING id`,
    [
      email,
      passwordHash,
      seed.profile.fullName,
      seed.profile.nativeLanguage,
      seed.profile.currentLevel,
      seed.profile.preferredDialect,
      seed.profile.emailVerified,
      seed.profile.emailVerifiedAt,
      seed.profile.onboardingCompleted,
      seed.profile.notificationEnabled,
      seed.profile.notificationTime,
      seed.profile.provider,
      seed.profile.googleId,
      seed.profile.avatarUrl,
      seed.profile.registeredAt,
    ],
  );
  const userId = userRes.rows[0].id as string;

  for (const goal of seed.dailyGoals) {
    await client.query(
      `INSERT INTO daily_goals (user_id, goal_type, target_value, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $4)`,
      [userId, goal.goalType, goal.targetValue, seed.profile.registeredAt],
    );
  }

  await client.query(
    `INSERT INTO daily_streaks (
       user_id, current_streak, longest_streak, last_goal_met_date, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $5)`,
    [
      userId,
      seed.streak.currentStreak,
      seed.streak.longestStreak,
      seed.streak.lastGoalMetDate,
      seed.profile.registeredAt,
    ],
  );

  for (const day of seed.dailyActivity) {
    if (day.lessonsCompleted === 0 && day.questionsCompleted === 0) continue;
    await client.query(
      `INSERT INTO daily_goal_progress (
         user_id, date, exercises_completed, lessons_completed, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $5)
       ON CONFLICT DO NOTHING`,
      [userId, day.date, day.questionsCompleted, day.lessonsCompleted, `${day.date}T12:00:00.000Z`],
    );
  }

  const moduleProgress = new Map<
    string,
    { completed: number; total: number; lastAccessedAt?: string; completedAt?: string }
  >();
  const courseProgress = new Map<
    string,
    { completed: number; total: number; lastAccessedAt?: string; completedAt?: string }
  >();

  const catalog = loadLessonCatalog();
  const moduleLessonCounts = new Map<string, number>();
  const courseLessonCounts = new Map<string, number>();
  for (const lesson of catalog) {
    moduleLessonCounts.set(lesson.moduleRef, (moduleLessonCounts.get(lesson.moduleRef) ?? 0) + 1);
    courseLessonCounts.set(lesson.courseRef, (courseLessonCounts.get(lesson.courseRef) ?? 0) + 1);
  }

  for (const progress of seed.lessonProgress) {
    const lessonId = maps.lessonIds.get(progress.lessonRef);
    if (!lessonId) continue;

    await client.query(
      `INSERT INTO learning_progress (
         user_id, unit_type, status, score, completed_at, last_accessed_at,
         time_spent, content_viewed, lesson_id, created_at, updated_at
       ) VALUES ($1, 'lesson', $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
      [
        userId,
        progress.status,
        progress.score ?? null,
        progress.completedAt ?? null,
        progress.lastAccessedAt ?? progress.completedAt ?? seed.profile.registeredAt,
        progress.timeSpent,
        progress.contentViewed,
        lessonId,
        progress.lastAccessedAt ?? seed.profile.registeredAt,
      ],
    );

    const lessonMeta = catalog.find((item) => item.ref === progress.lessonRef);
    if (!lessonMeta) continue;

    if (progress.status === 'completed') {
      const moduleState = moduleProgress.get(lessonMeta.moduleRef) ?? {
        completed: 0,
        total: moduleLessonCounts.get(lessonMeta.moduleRef) ?? 0,
      };
      moduleState.completed += 1;
      moduleState.lastAccessedAt = progress.completedAt ?? moduleState.lastAccessedAt;
      if (moduleState.completed >= moduleState.total) {
        moduleState.completedAt = progress.completedAt;
      }
      moduleProgress.set(lessonMeta.moduleRef, moduleState);

      const courseState = courseProgress.get(lessonMeta.courseRef) ?? {
        completed: 0,
        total: courseLessonCounts.get(lessonMeta.courseRef) ?? 0,
      };
      courseState.completed += 1;
      courseState.lastAccessedAt = progress.completedAt ?? courseState.lastAccessedAt;
      courseProgress.set(lessonMeta.courseRef, courseState);
    }
  }

  for (const [moduleRef, state] of moduleProgress.entries()) {
    const moduleId = maps.moduleIds.get(moduleRef);
    if (!moduleId) continue;
    const status =
      state.completed >= state.total
        ? 'completed'
        : state.completed > 0
          ? 'in_progress'
          : 'not_started';

    await client.query(
      `INSERT INTO learning_progress (
         user_id, unit_type, status, completed_at, last_accessed_at,
         completed_lessons_count, total_lessons_count, module_id, created_at, updated_at
       ) VALUES ($1, 'module', $2, $3, $4, $5, $6, $7, $8, $8)`,
      [
        userId,
        status,
        state.completedAt ?? null,
        state.lastAccessedAt ?? seed.profile.registeredAt,
        state.completed,
        state.total,
        moduleId,
        state.lastAccessedAt ?? seed.profile.registeredAt,
      ],
    );
  }

  for (const [courseRef, state] of courseProgress.entries()) {
    const courseId = maps.courseIds.get(courseRef);
    if (!courseId) continue;
    const completedModules = [...moduleProgress.entries()].filter(
      ([moduleRef, moduleState]) => {
        const lesson = catalog.find((item) => item.moduleRef === moduleRef);
        return lesson?.courseRef === courseRef && moduleState.completed >= moduleState.total;
      },
    ).length;

    const totalModules = new Set(
      catalog.filter((item) => item.courseRef === courseRef).map((item) => item.moduleRef),
    ).size;

    const status =
      completedModules >= totalModules
        ? 'completed'
        : completedModules > 0 || state.completed > 0
          ? 'in_progress'
          : 'not_started';

    await client.query(
      `INSERT INTO learning_progress (
         user_id, unit_type, status, last_accessed_at,
         completed_modules_count, total_modules_count, completed_lessons_count, total_lessons_count,
         course_id, created_at, updated_at
       ) VALUES ($1, 'course', $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
      [
        userId,
        status,
        state.lastAccessedAt ?? seed.profile.registeredAt,
        completedModules,
        totalModules,
        state.completed,
        state.total,
        courseId,
        state.lastAccessedAt ?? seed.profile.registeredAt,
      ],
    );
  }

  // user_question_results
  const userQResultRows: unknown[][] = [];
  for (const result of seed.questionResults) {
    const questionId = maps.questionIds.get(`${result.lessonRef}:${result.orderIndex}`);
    if (!questionId) continue;
    userQResultRows.push([
      userId,
      questionId,
      JSON.stringify({ seeded: true }),
      result.isCorrect,
      result.score,
      result.attemptedAt,
      result.timeTaken,
      1,
      result.score,
      result.attemptedAt,
      result.attemptedAt,
    ]);
  }
  await bulkInsert(
    client,
    'user_question_results',
    [
      'user_id',
      'question_id',
      'user_answer',
      'is_correct',
      'score',
      'attempted_at',
      'time_taken',
      'attempt_count',
      'best_score',
      'created_at',
      'updated_at',
    ],
    userQResultRows,
    'ON CONFLICT (user_id, question_id) DO NOTHING',
  );

  // question_attempts (history; analytics chính dùng bảng này)
  const attemptRows: unknown[][] = [];
  for (const attempt of seed.questionAttempts ?? []) {
    const questionId = maps.questionIds.get(`${attempt.lessonRef}:${attempt.orderIndex}`);
    if (!questionId) continue;
    attemptRows.push([
      userId,
      questionId,
      JSON.stringify({ seeded: true }),
      attempt.isCorrect,
      attempt.score,
      attempt.attemptedAt,
      attempt.timeTaken,
      attempt.attemptedAt,
      attempt.attemptedAt,
    ]);
  }
  await bulkInsert(
    client,
    'question_attempts',
    [
      'user_id',
      'question_id',
      'user_answer',
      'is_correct',
      'score',
      'attempted_at',
      'time_taken',
      'created_at',
      'updated_at',
    ],
    attemptRows,
  );

  // simulation_sessions với enrichment
  type InsertedSession = { id: string; messages: typeof seed.simulationSessions[number]['messages']; partnerCharacterId: string };
  const insertedSessions: InsertedSession[] = [];
  for (const session of seed.simulationSessions) {
    const scenario = maps.scenarioByTitle.get(session.scenarioTitle);
    if (!scenario) continue;
    const partnerId =
      scenario.partnerCharacterIds[
        Math.floor(scenario.partnerCharacterIds.length * (insertedSessions.length / Math.max(1, seed.simulationSessions.length)))
      ] ?? scenario.playableCharacterId;

    const res = await client.query(
      `INSERT INTO simulation_sessions (
         user_id, scenario_id, chosen_character_id, next_turn_character_id, status,
         total_score, total_tokens, total_messages, criteria_scores, end_reason,
         ai_summary, result_created_at, created_at, updated_at
       ) VALUES ($1, $2, $3, $3, 'COMPLETED', $4, $5, $6, $7::jsonb, $8, $9, $10, $10, $10)
       RETURNING id`,
      [
        userId,
        scenario.id,
        scenario.playableCharacterId,
        session.totalScore,
        session.totalTokens,
        session.totalMessages,
        JSON.stringify(session.criteriaScores),
        session.endReason,
        session.aiSummary,
        session.completedAt,
      ],
    );
    insertedSessions.push({
      id: res.rows[0].id as string,
      messages: session.messages,
      partnerCharacterId: partnerId,
    });
  }

  // simulation_messages
  const simMessageRows: unknown[][] = [];
  for (const s of insertedSessions) {
    for (const m of s.messages) {
      simMessageRows.push([
        s.id,
        m.isLearner ? null : s.partnerCharacterId,
        m.isLearner,
        m.content,
        m.translation,
        m.orderIndex,
      ]);
    }
  }
  await bulkInsert(
    client,
    'simulation_messages',
    ['session_id', 'speaker_character_id', 'is_learner', 'content', 'translation', 'order_index'],
    simMessageRows,
  );

  // personal_vocabularies (return id để bookmarks tham chiếu)
  const personalIds: string[] = [];
  for (const vocab of seed.personalVocabularies) {
    const res = await client.query(
      `INSERT INTO personal_vocabularies (
         user_id, word, translation, source, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $5) RETURNING id`,
      [userId, vocab.word, vocab.translation, vocab.source, vocab.createdAt],
    );
    personalIds.push(res.rows[0].id as string);
  }

  // bookmarks
  const bookmarkRows: unknown[][] = [];
  for (const bm of seed.bookmarks ?? []) {
    if (bm.kind === 'system') {
      if (maps.vocabularyIds.length === 0) continue;
      const vocabId =
        maps.vocabularyIds[Math.floor(Math.random() * maps.vocabularyIds.length)];
      bookmarkRows.push([userId, vocabId, null, bm.createdAt, bm.createdAt]);
    } else {
      const idx = bm.personalIndex ?? 0;
      const pvId = personalIds[idx];
      if (!pvId) continue;
      bookmarkRows.push([userId, null, pvId, bm.createdAt, bm.createdAt]);
    }
  }
  await bulkInsert(
    client,
    'bookmarks',
    ['user_id', 'vocabulary_id', 'personal_vocabulary_id', 'created_at', 'updated_at'],
    bookmarkRows,
    'ON CONFLICT DO NOTHING',
  );

  // conversations + conversation_messages
  for (const conv of seed.conversations ?? []) {
    const lessonId = conv.lessonRef ? maps.lessonIds.get(conv.lessonRef) ?? null : null;
    const courseId = conv.lessonRef ? maps.lessonCourseByRef.get(conv.lessonRef) ?? null : null;
    const res = await client.query(
      `INSERT INTO conversations (
         user_id, course_id, lesson_id, model, system_instruction, title,
         screen_context, total_tokens, total_prompt_tokens, total_completion_tokens,
         created_at, updated_at
       ) VALUES ($1, $2, $3, $4, '', $5, '{}'::jsonb, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        userId,
        courseId,
        lessonId,
        conv.model,
        conv.title,
        conv.totalTokens,
        conv.totalPromptTokens,
        conv.totalCompletionTokens,
        conv.startedAt,
        conv.updatedAt,
      ],
    );
    const convId = res.rows[0].id as string;
    const messageRows: unknown[][] = conv.messages.map((m) => {
      const ts = new Date(new Date(conv.startedAt).getTime() + m.offsetMinutes * 60_000).toISOString();
      return [convId, m.role, m.content, m.tokenCount, ts, ts];
    });
    await bulkInsert(
      client,
      'conversation_messages',
      ['conversation_id', 'role', 'content', 'token_count', 'created_at', 'updated_at'],
      messageRows,
    );
  }

  return { skipped: false };
}

async function main() {
  const { dir, from, to, limit, dryRun, onConflict } = parseArgs();
  if (!fs.existsSync(dir)) {
    console.error(`Seed directory not found: ${dir}`);
    console.error('Run: bun run generate:user-seeds');
    process.exit(1);
  }

  const end = limit != null ? Math.min(to, from + limit - 1) : to;
  const total = end - from + 1;

  console.log(`Importing user seeds ${from}..${end} from ${dir}`);
  console.log(`On conflict: ${onConflict}`);
  if (dryRun) console.log('DRY RUN — no database writes\n');

  const client = buildClient();
  await client.connect();

  try {
    const maps = await loadRefMaps(client);
    console.log(
      `Mapped ${maps.lessonIds.size} lessons, ${maps.questionIds.size} questions, ${maps.scenarioByTitle.size} scenarios\n`,
    );

    let imported = 0;
    let skipped = 0;

    for (let index = from; index <= end; index += 1) {
      const seedId = `user-${String(index).padStart(5, '0')}`;
      const filePath = path.join(dir, `${seedId}.json`);
      if (!fs.existsSync(filePath)) {
        console.warn(`Missing file: ${filePath}`);
        continue;
      }

      const seed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as UserSeedFile;
      if (dryRun) {
        imported += 1;
      } else {
        const result = await importUser(client, seed, maps, onConflict);
        if (result.skipped) skipped += 1;
        else imported += 1;
      }

      if ((index - from + 1) % BATCH_LOG === 0 || index === end) {
        console.log(`  ${index - from + 1}/${total} processed (${imported} imported, ${skipped} skipped)`);
      }
    }

    console.log(`\nDone. Imported ${imported}, skipped ${skipped}.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('seed-users failed:', error);
  process.exit(1);
});
