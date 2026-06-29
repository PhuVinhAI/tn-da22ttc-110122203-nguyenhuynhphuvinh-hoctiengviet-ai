/**
 * Bookmarks tool integration tests against the real Postgres stack.
 *
 * Run from `backend/`:
 *
 *   bun run db:up
 *   bun run test:integration:bookmarks
 *
 * Covers `list_bookmarks` against real DB (see
 * `.scratch/troly-ai/issues/05-tools-user-data.md`).
 */
import { Course } from '../../../src/modules/courses/domain/course.entity';
import { Module } from '../../../src/modules/courses/domain/module.entity';
import { Lesson } from '../../../src/modules/courses/domain/lesson.entity';
import { Vocabulary } from '../../../src/modules/vocabularies/domain/vocabulary.entity';
import { Bookmark } from '../../../src/modules/vocabularies/domain/bookmark.entity';
import { User } from '../../../src/modules/users/domain/user.entity';
import {
  PartOfSpeech,
  UserLevel,
  Dialect,
} from '../../../src/common/enums';
import { ListBookmarksTool } from '../../../src/modules/agent/tools/list-bookmarks.tool';
import { BookmarksRepository } from '../../../src/modules/vocabularies/application/repositories/bookmarks.repository';
import { PersonalVocabulariesService } from '../../../src/modules/personal-vocabularies/application/personal-vocabularies.service';
import { PersonalVocabulary } from '../../../src/modules/personal-vocabularies/domain/personal-vocabulary.entity';
import type { ToolContext } from '@linvnix/shared';
import { bootstrapAppContext, AppContext } from './helpers/app-context';
import { describe, it, expect, runRegisteredTests } from './helpers/test-runner';

let ctx: AppContext;
let listTool: ListBookmarksTool;
let bookmarksRepository: BookmarksRepository;
let personalVocabulariesService: PersonalVocabulariesService;

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
  bookmarksRepository = ctx.app.get(BookmarksRepository);
  personalVocabulariesService = ctx.app.get(PersonalVocabulariesService);

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
  const personalVocabularyRepo =
    ctx.dataSource.getRepository(PersonalVocabulary);

  if (testUser?.id) {
    await bookmarkRepo.delete({ userId: testUser.id });
    await personalVocabularyRepo.delete({ userId: testUser.id });
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
    const bookmarkRepo = ctx.dataSource.getRepository(Bookmark);
    await bookmarkRepo.save(
      bookmarkRepo.create({ userId: testUser.id, vocabularyId: vocabBId }),
    );
    await new Promise((r) => setTimeout(r, 25));
    await bookmarkRepo.save(
      bookmarkRepo.create({ userId: testUser.id, vocabularyId: vocabAId }),
    );

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

  it('includes personal vocabulary bookmarks in stats', async () => {
    await personalVocabulariesService.createFromAnalysis(testUser.id, {
      word: `cam-int-${suffix}`,
      translation: 'forbidden',
      partOfSpeech: 'phrase',
    });

    const stats = await bookmarksRepository.getStats(testUser.id);

    expect(stats.total).toBe(3);
    expect(stats.byPartOfSpeech.phrase).toBe(1);
    expect(stats.byPartOfSpeech.noun).toBe(2);
  });
});

await setup();
let allPassed = false;
try {
  allPassed = await runRegisteredTests('bookmarks integration suite');
} finally {
  await teardown();
}
process.exit(allPassed ? 0 : 1);
