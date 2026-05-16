/**
 * Bookmarks tool integration tests against the real Postgres stack.
 *
 * Run from `backend/`:
 *
 *   bun run db:up
 *   bun run test:integration:bookmarks
 *
 * Covers acceptance criteria for `.scratch/troly-ai/issues/05-tools-user-data.md`:
 *
 * 1. **`list_bookmarks` against real DB** — seed a user + lesson + 2
 *    vocabularies + 2 bookmark rows, invoke the tool, assert the returned
 *    page contains both rows newest-first and that the `search` filter
 *    narrows the result.
 * 2. **`toggle_bookmark` reversibility against real DB** — toggle twice on
 *    the same vocabulary, assert the persisted bookmark count flips
 *    add→remove (idempotent reversibility).
 *
 * Suite seeds and tears down its own rows by querying with the unique
 * `email` / `word` markers it generates, so it never fights other tests
 * sharing the dev DB.
 */
import { Course } from '../../../src/modules/courses/domain/course.entity';
import { Module } from '../../../src/modules/courses/domain/module.entity';
import { Lesson } from '../../../src/modules/courses/domain/lesson.entity';
import { Vocabulary } from '../../../src/modules/vocabularies/domain/vocabulary.entity';
import { Bookmark } from '../../../src/modules/vocabularies/domain/bookmark.entity';
import { User } from '../../../src/modules/users/domain/user.entity';
import {
  LessonType,
  PartOfSpeech,
  UserLevel,
  Dialect,
} from '../../../src/common/enums';
import { ListBookmarksTool } from '../../../src/modules/agent/tools/list-bookmarks.tool';
import { ToggleBookmarkTool } from '../../../src/modules/agent/tools/toggle-bookmark.tool';
import type { ToolContext } from '@linvnix/shared';
import { bootstrapAppContext, AppContext } from './helpers/app-context';
import { describe, it, expect, runRegisteredTests } from './helpers/test-runner';

let ctx: AppContext;
let listTool: ListBookmarksTool;
let toggleTool: ToggleBookmarkTool;

// Suite-scoped markers — every row this suite creates carries them so
// teardown can purge exactly its own rows without disturbing dev data.
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const testEmail = `bookmarks-int-${suffix}@test.com`;

let testUser: User;
let courseId: string;
let moduleId: string;
let lessonId: string;
let vocabAId: string;
let vocabBId: string;

async function setup(): Promise<void> {
  ctx = await bootstrapAppContext();
  listTool = ctx.app.get(ListBookmarksTool);
  toggleTool = ctx.app.get(ToggleBookmarkTool);

  const userRepo = ctx.dataSource.getRepository(User);
  const courseRepo = ctx.dataSource.getRepository(Course);
  const moduleRepo = ctx.dataSource.getRepository(Module);
  const lessonRepo = ctx.dataSource.getRepository(Lesson);
  const vocabRepo = ctx.dataSource.getRepository(Vocabulary);

  testUser = await userRepo.save(
    userRepo.create({
      email: testEmail,
      password: 'unused',
      fullName: 'Bookmarks Integration',
      nativeLanguage: 'English',
      currentLevel: UserLevel.A1,
      preferredDialect: Dialect.STANDARD,
      emailVerified: true,
    }),
  );

  const course = await courseRepo.save(
    courseRepo.create({
      title: `int-bookmarks-course-${suffix}`,
      description: 'integration test course',
      level: UserLevel.A1,
      orderIndex: 9999,
      isPublished: false,
    }),
  );
  courseId = course.id;

  const module = await moduleRepo.save(
    moduleRepo.create({
      title: `int-bookmarks-module-${suffix}`,
      description: 'integration test module',
      orderIndex: 1,
      courseId,
    }),
  );
  moduleId = module.id;

  const lesson = await lessonRepo.save(
    lessonRepo.create({
      title: `int-bookmarks-lesson-${suffix}`,
      description: 'integration test lesson',
      lessonType: LessonType.VOCABULARY,
      orderIndex: 1,
      moduleId,
    }),
  );
  lessonId = lesson.id;

  const vocabA = await vocabRepo.save(
    vocabRepo.create({
      word: `xe-int-${suffix}`,
      translation: 'bicycle',
      partOfSpeech: PartOfSpeech.NOUN,
      lessonId,
    }),
  );
  vocabAId = vocabA.id;

  const vocabB = await vocabRepo.save(
    vocabRepo.create({
      word: `nha-int-${suffix}`,
      translation: 'house',
      partOfSpeech: PartOfSpeech.NOUN,
      lessonId,
    }),
  );
  vocabBId = vocabB.id;
}

async function teardown(): Promise<void> {
  if (!ctx) return;
  const bookmarkRepo = ctx.dataSource.getRepository(Bookmark);
  const vocabRepo = ctx.dataSource.getRepository(Vocabulary);
  const lessonRepo = ctx.dataSource.getRepository(Lesson);
  const moduleRepo = ctx.dataSource.getRepository(Module);
  const courseRepo = ctx.dataSource.getRepository(Course);
  const userRepo = ctx.dataSource.getRepository(User);

  // ON DELETE CASCADE on FKs removes bookmarks/vocabularies/lessons/modules
  // when the parent course or user is deleted, but soft-delete + dev table
  // shape isn\'t consistent enough to rely on that for cleanup. Be explicit.
  if (testUser?.id) {
    await bookmarkRepo.delete({ userId: testUser.id });
  }
  if (vocabAId) await vocabRepo.delete({ id: vocabAId });
  if (vocabBId) await vocabRepo.delete({ id: vocabBId });
  if (lessonId) await lessonRepo.delete({ id: lessonId });
  if (moduleId) await moduleRepo.delete({ id: moduleId });
  if (courseId) await courseRepo.delete({ id: courseId });
  if (testUser?.id) await userRepo.delete({ id: testUser.id });

  await ctx.close();
}

function buildCtx(): ToolContext<User> {
  return {
    userId: testUser.id,
    conversationId: 'int-conv-1',
    screenContext: { route: '/bookmarks' },
    user: testUser,
  };
}

describe('list_bookmarks (real DB)', () => {
  it('returns the seeded bookmarks newest-first via BookmarksService', async () => {
    // Seed bookmarks: B first (older), then A (newer) — newest-first sort
    // means A should appear before B in the response.
    const toggleResultB = await toggleTool.execute(
      { vocabularyId: vocabBId },
      buildCtx(),
    );
    if ('error' in toggleResultB) {
      throw new Error(`toggle B setup failed: ${toggleResultB.error}`);
    }
    // Small await separator so createdAt differs noticeably; the tool's
    // newest-first ordering is the contract under test.
    await new Promise((r) => setTimeout(r, 25));
    const toggleResultA = await toggleTool.execute(
      { vocabularyId: vocabAId },
      buildCtx(),
    );
    if ('error' in toggleResultA) {
      throw new Error(`toggle A setup failed: ${toggleResultA.error}`);
    }

    const listed = await listTool.execute(
      listTool.parameters.parse({}),
      buildCtx(),
    );

    if ('error' in listed) {
      throw new Error(`list returned error: ${listed.error}`);
    }
    expect(listed.data.length).toBe(2);
    expect(listed.data[0].vocabulary.id).toBe(vocabAId);
    expect(listed.data[1].vocabulary.id).toBe(vocabBId);
    expect(listed.meta.total).toBe(2);
  });

  it('narrows results when search filter matches one vocabulary only', async () => {
    const listed = await listTool.execute(
      listTool.parameters.parse({ search: `xe-int-${suffix}` }),
      buildCtx(),
    );

    if ('error' in listed) {
      throw new Error(`list returned error: ${listed.error}`);
    }
    expect(listed.data.length).toBe(1);
    expect(listed.data[0].vocabulary.id).toBe(vocabAId);
  });
});

describe('toggle_bookmark (real DB)', () => {
  it('is reversible: toggle on, then toggle off, leaves no bookmark row', async () => {
    // The previous suite left both vocabularies bookmarked. Remove them so
    // the reversibility check starts from a clean slate. (Don\'t share state
    // across cases — that would couple tests.)
    const bookmarkRepo = ctx.dataSource.getRepository(Bookmark);
    await bookmarkRepo.delete({ userId: testUser.id });

    const first = await toggleTool.execute(
      { vocabularyId: vocabAId },
      buildCtx(),
    );
    if ('error' in first) throw new Error(`first toggle failed: ${first.error}`);
    expect(first.bookmarked).toBe(true);
    expect(first.vocabularyId).toBe(vocabAId);

    const afterFirstCount = await bookmarkRepo.count({
      where: { userId: testUser.id, vocabularyId: vocabAId },
    });
    expect(afterFirstCount).toBe(1);

    const second = await toggleTool.execute(
      { vocabularyId: vocabAId },
      buildCtx(),
    );
    if ('error' in second) {
      throw new Error(`second toggle failed: ${second.error}`);
    }
    expect(second.bookmarked).toBe(false);
    expect(second.vocabularyId).toBe(vocabAId);

    const afterSecondCount = await bookmarkRepo.count({
      where: { userId: testUser.id, vocabularyId: vocabAId },
    });
    expect(afterSecondCount).toBe(0);
  });
});

await setup();
let allPassed = false;
try {
  allPassed = await runRegisteredTests('bookmarks integration suite');
} finally {
  await teardown();
}
// Force-exit because Bull/Redis workers in `QueueModule` don\'t unref on
// close, leaving the bun event loop alive. Same workaround referenced in
// the `app.e2e-spec.ts` teardown notes from foundation slice #01.
process.exit(allPassed ? 0 : 1);
