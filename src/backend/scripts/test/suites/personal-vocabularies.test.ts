import { PersonalVocabulary } from '../../../src/modules/personal-vocabularies/domain/personal-vocabulary.entity';
import { User } from '../../../src/modules/users/domain/user.entity';
import { PersonalVocabularySource } from '../../../src/common/enums';
import { UserLevel, Dialect } from '../../../src/common/enums';
import { PersonalVocabulariesService } from '../../../src/modules/personal-vocabularies/application/personal-vocabularies.service';
import { bootstrapAppContext, AppContext } from './helpers/app-context';
import { describe, it, expect, runRegisteredTests } from './helpers/test-runner';

let ctx: AppContext;
let personalVocabulariesService: PersonalVocabulariesService;

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const testEmail = `pv-int-${suffix}@test.com`;

let testUser: User;
let createdId: string;

async function setup(): Promise<void> {
  ctx = await bootstrapAppContext();
  personalVocabulariesService = ctx.app.get(PersonalVocabulariesService);

  const userRepo = ctx.dataSource.getRepository(User);

  testUser = await userRepo.save(
    userRepo.create({
      email: testEmail,
      password: 'unused',
      fullName: 'PV Integration',
      nativeLanguage: 'English',
      currentLevel: UserLevel.A1,
      preferredDialect: Dialect.STANDARD,
      emailVerified: true,
    }),
  );
}

async function teardown(): Promise<void> {
  if (!ctx) return;
  const pvRepo = ctx.dataSource.getRepository(PersonalVocabulary);
  const userRepo = ctx.dataSource.getRepository(User);

  if (testUser?.id) {
    await pvRepo.delete({ userId: testUser.id });
    await userRepo.delete({ id: testUser.id });
  }

  await ctx.close();
}

describe('PersonalVocabularies CRUD (real DB)', () => {
  it('creates a personal vocabulary scoped to user', async () => {
    const pv = await personalVocabulariesService.create(testUser.id, {
      word: `bàn-int-${suffix}`,
      translation: 'table',
      source: PersonalVocabularySource.IMAGE_DISCOVERY,
    });

    expect(pv.id).toBeTruthy();
    expect(pv.userId).toBe(testUser.id);
    expect(pv.word).toBe(`bàn-int-${suffix}`);
    expect(pv.source).toBe(PersonalVocabularySource.IMAGE_DISCOVERY);

    createdId = pv.id;
  });

  it('finds by id and userId', async () => {
    const pv = await personalVocabulariesService.findById(
      createdId,
      testUser.id,
    );

    expect(pv.id).toBe(createdId);
    expect(pv.userId).toBe(testUser.id);
  });

  it('lists paginated personal vocabularies for user', async () => {
    const result = await personalVocabulariesService.list(testUser.id, {
      page: 1,
      limit: 20,
    });

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.meta.total).toBeGreaterThan(0);
    expect(result.data[0].userId).toBe(testUser.id);
  });

  it('searches personal vocabularies', async () => {
    const result = await personalVocabulariesService.list(testUser.id, {
      page: 1,
      limit: 20,
      search: `bàn-int-${suffix}`,
    });

    expect(result.data.length).toBe(1);
    expect(result.data[0].word).toBe(`bàn-int-${suffix}`);
  });

  it('soft-deletes personal vocabulary', async () => {
    await personalVocabulariesService.delete(createdId, testUser.id);

    const pvRepo = ctx.dataSource.getRepository(PersonalVocabulary);
    const deleted = await pvRepo.findOne({
      where: { id: createdId },
      withDeleted: true,
    });

    expect(deleted).toBeTruthy();
    expect(deleted!.deletedAt).toBeTruthy();
  });
});

await setup();
let allPassed = false;
try {
  allPassed = await runRegisteredTests('personal-vocabularies integration suite');
} finally {
  await teardown();
}
process.exit(allPassed ? 0 : 1);
