/**
 * search_vocabulary tool integration tests against the real Postgres stack.
 *
 * Run from `backend/`:
 *
 *   bun run db:up
 *   bun run test:integration:search-vocabulary
 *
 * Covers the canonical "catalog read" acceptance criterion of
 * `.scratch/troly-ai/issues/06-tools-catalog.md`:
 *
 * 1. **Plain query** — text matches by `word` / `translation`.
 * 2. **Dialect fallback from ctx.user.preferredDialect** — when the tool is
 *    called with no `dialect` param, the conversation owner's preferred
 *    dialect propagates into the SQL filter (the headline regression test
 *    called out in the issue's acceptance criteria).
 * 3. **Dialect SQL semantics** — the JSONB `?` operator filter keeps
 *    vocab that (a) has no `dialect_variants`, (b) covers the requested
 *    dialect, or (c) has a STANDARD fallback; vocab that only has variants
 *    for unrelated dialects is filtered out.
 * 4. **lessonId filter** — narrows results to one lesson.
 *
 * Suite seeds and tears down its own rows by querying on unique
 * `email` / `word` markers it generates, so it never fights other tests
 * sharing the dev DB.
 */
import { Course } from '../../../src/modules/courses/domain/course.entity';
import { Module } from '../../../src/modules/courses/domain/module.entity';
import { Lesson } from '../../../src/modules/courses/domain/lesson.entity';
import { Vocabulary } from '../../../src/modules/vocabularies/domain/vocabulary.entity';
import { User } from '../../../src/modules/users/domain/user.entity';
import {
  PartOfSpeech,
  UserLevel,
  Dialect,
} from '../../../src/common/enums';
import { SearchVocabularyTool } from '../../../src/modules/agent/tools/search-vocabulary.tool';
import type { ToolContext } from '@linvnix/shared';
import { bootstrapAppContext, AppContext } from './helpers/app-context';
import {
  describe,
  it,
  expect,
  runRegisteredTests,
} from './helpers/test-runner';

let ctx: AppContext;
let searchTool: SearchVocabularyTool;

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const testEmail = `search-vocab-int-${suffix}@test.com`;
const queryMarker = `intvoc${suffix.replace(/-/g, '')}`;

let testUser: User;
let courseId: string;
let moduleId: string;
let lessonAId: string;
let lessonBId: string;
let vocabNoneId: string;
let vocabNorthernId: string;
let vocabSouthernId: string;
let vocabStandardId: string;
let vocabLessonBId: string;

async function setup(): Promise<void> {
  ctx = await bootstrapAppContext();
  searchTool = ctx.app.get(SearchVocabularyTool);

  const userRepo = ctx.dataSource.getRepository(User);
  const courseRepo = ctx.dataSource.getRepository(Course);
  const moduleRepo = ctx.dataSource.getRepository(Module);
  const lessonRepo = ctx.dataSource.getRepository(Lesson);
  const vocabRepo = ctx.dataSource.getRepository(Vocabulary);

  testUser = await userRepo.save(
    userRepo.create({
      email: testEmail,
      password: 'unused',
      fullName: 'Search Vocab Integration',
      nativeLanguage: 'English',
      currentLevel: UserLevel.A1,
      preferredDialect: Dialect.NORTHERN,
      emailVerified: true,
    }),
  );

  const course = await courseRepo.save(
    courseRepo.create({
      title: `int-search-vocab-course-${suffix}`,
      description: 'integration test course',
      level: UserLevel.A1,
      orderIndex: 9999,
      isPublished: false,
    }),
  );
  courseId = course.id;

  const module = await moduleRepo.save(
    moduleRepo.create({
      title: `int-search-vocab-module-${suffix}`,
      description: 'integration test module',
      orderIndex: 1,
      courseId,
    }),
  );
  moduleId = module.id;

  const lessonA = await lessonRepo.save(
    lessonRepo.create({
      title: `int-search-vocab-lesson-a-${suffix}`,
      description: 'integration test lesson A',
      orderIndex: 1,
      moduleId,
    }),
  );
  lessonAId = lessonA.id;

  const lessonB = await lessonRepo.save(
    lessonRepo.create({
      title: `int-search-vocab-lesson-b-${suffix}`,
      description: 'integration test lesson B',
      orderIndex: 2,
      moduleId,
    }),
  );
  lessonBId = lessonB.id;

  const vocabNone = await vocabRepo.save(
    vocabRepo.create({
      word: `${queryMarker}-none`,
      translation: 'no-dialect-variants',
      partOfSpeech: PartOfSpeech.NOUN,
      lessonId: lessonAId,
    }),
  );
  vocabNoneId = vocabNone.id;

  const vocabNorthern = await vocabRepo.save(
    vocabRepo.create({
      word: `${queryMarker}-northern`,
      translation: 'northern-only-variant',
      partOfSpeech: PartOfSpeech.NOUN,
      lessonId: lessonAId,
      dialectVariants: { [Dialect.NORTHERN]: 'bắc' } as any,
    }),
  );
  vocabNorthernId = vocabNorthern.id;

  const vocabSouthern = await vocabRepo.save(
    vocabRepo.create({
      word: `${queryMarker}-southern`,
      translation: 'southern-only-variant',
      partOfSpeech: PartOfSpeech.NOUN,
      lessonId: lessonAId,
      dialectVariants: { [Dialect.SOUTHERN]: 'nam' } as any,
    }),
  );
  vocabSouthernId = vocabSouthern.id;

  const vocabStandard = await vocabRepo.save(
    vocabRepo.create({
      word: `${queryMarker}-standard`,
      translation: 'standard-only-variant',
      partOfSpeech: PartOfSpeech.NOUN,
      lessonId: lessonAId,
      dialectVariants: { [Dialect.STANDARD]: 'chuẩn' } as any,
    }),
  );
  vocabStandardId = vocabStandard.id;

  const vocabLessonB = await vocabRepo.save(
    vocabRepo.create({
      word: `${queryMarker}-lessonb`,
      translation: 'lesson-b-only',
      partOfSpeech: PartOfSpeech.NOUN,
      lessonId: lessonBId,
    }),
  );
  vocabLessonBId = vocabLessonB.id;
}

async function teardown(): Promise<void> {
  if (!ctx) return;
  const vocabRepo = ctx.dataSource.getRepository(Vocabulary);
  const lessonRepo = ctx.dataSource.getRepository(Lesson);
  const moduleRepo = ctx.dataSource.getRepository(Module);
  const courseRepo = ctx.dataSource.getRepository(Course);
  const userRepo = ctx.dataSource.getRepository(User);

  for (const id of [
    vocabNoneId,
    vocabNorthernId,
    vocabSouthernId,
    vocabStandardId,
    vocabLessonBId,
  ]) {
    if (id) await vocabRepo.delete({ id });
  }
  if (lessonAId) await lessonRepo.delete({ id: lessonAId });
  if (lessonBId) await lessonRepo.delete({ id: lessonBId });
  if (moduleId) await moduleRepo.delete({ id: moduleId });
  if (courseId) await courseRepo.delete({ id: courseId });
  if (testUser?.id) await userRepo.delete({ id: testUser.id });

  await ctx.close();
}

function buildCtx(
  overrides: Partial<ToolContext<User>> = {},
): ToolContext<User> {
  return {
    userId: testUser.id,
    conversationId: 'int-conv-search-vocab',
    screenContext: { route: '/' },
    user: testUser,
    ...overrides,
  };
}

function idsOf(result: { vocabularies: Vocabulary[] }): string[] {
  return result.vocabularies.map((v) => v.id).sort();
}

describe('search_vocabulary (real DB)', () => {
  it('returns all vocab matching the query when no dialect filter is applied', async () => {
    // Override ctx user's dialect to undefined so the fallback in the tool
    // skips adding a dialect filter; gives us the raw "no filter" result.
    const ctxNoDialect = buildCtx({
      user: { ...testUser, preferredDialect: undefined as any },
    });

    const result = await searchTool.execute(
      { query: queryMarker },
      ctxNoDialect,
    );

    if ('error' in result) {
      throw new Error(`tool returned error: ${result.error}`);
    }
    expect(idsOf(result)).toEqual(
      [
        vocabNoneId,
        vocabNorthernId,
        vocabSouthernId,
        vocabStandardId,
        vocabLessonBId,
      ].sort(),
    );
  });

  it('falls back to ctx.user.preferredDialect = NORTHERN and filters out vocab whose dialectVariants only cover SOUTHERN', async () => {
    const result = await searchTool.execute(
      { query: queryMarker },
      buildCtx(),
    );

    if ('error' in result) {
      throw new Error(`tool returned error: ${result.error}`);
    }
    // Expected with NORTHERN dialect:
    //   - vocabNone           (null dialect_variants → permissive include)
    //   - vocabNorthern       (covers NORTHERN)
    //   - vocabStandard       (STANDARD fallback)
    //   - vocabLessonB        (null dialect_variants)
    // Excluded:
    //   - vocabSouthern       (only SOUTHERN, no STANDARD, no NORTHERN)
    // toEqual on the sorted set already proves vocabSouthern is excluded;
    // the comment above documents the contract for future readers.
    expect(idsOf(result)).toEqual(
      [
        vocabNoneId,
        vocabNorthernId,
        vocabStandardId,
        vocabLessonBId,
      ].sort(),
    );
  });

  it('explicit SOUTHERN dialect param overrides ctx.user.preferredDialect (NORTHERN)', async () => {
    const result = await searchTool.execute(
      { query: queryMarker, dialect: Dialect.SOUTHERN },
      buildCtx(),
    );

    if ('error' in result) {
      throw new Error(`tool returned error: ${result.error}`);
    }
    // Expected with SOUTHERN dialect:
    //   - vocabNone           (null dialect_variants → permissive include)
    //   - vocabSouthern       (covers SOUTHERN)
    //   - vocabStandard       (STANDARD fallback)
    //   - vocabLessonB        (null dialect_variants)
    // Excluded:
    //   - vocabNorthern       (only NORTHERN, no STANDARD)
    expect(idsOf(result)).toEqual(
      [
        vocabNoneId,
        vocabSouthernId,
        vocabStandardId,
        vocabLessonBId,
      ].sort(),
    );
  });

  it('narrows to one lesson when lessonId filter is supplied', async () => {
    const result = await searchTool.execute(
      { query: queryMarker, lessonId: lessonBId },
      buildCtx({
        user: { ...testUser, preferredDialect: undefined as any },
      }),
    );

    if ('error' in result) {
      throw new Error(`tool returned error: ${result.error}`);
    }
    expect(idsOf(result)).toEqual([vocabLessonBId]);
  });
});

await setup();
let allPassed = false;
try {
  allPassed = await runRegisteredTests('search_vocabulary integration suite');
} finally {
  await teardown();
}
// Force-exit because Bull/Redis workers in `QueueModule` don't unref on
// close, leaving the bun event loop alive (same workaround as
// bookmarks.test.ts).
process.exit(allPassed ? 0 : 1);
