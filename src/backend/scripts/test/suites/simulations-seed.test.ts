/**
 * Integration test suite for the Simulation Database Seeder.
 *
 * Verifies seed data integrity: categories, scenarios, characters,
 * scoring criteria, and system prompt templates.
 *
 * Run from `backend/`:
 *
 *   bun run db:up
 *   bun run seed:simulations
 *   bun run test:integration:simulations-seed
 */

import { bootstrapAppContext, AppContext } from './helpers/app-context';
import { describe, it, expect, runRegisteredTests } from './helpers/test-runner';
import { seedSimulations } from '../../seed-simulations';
import { ScenarioCategory } from '../../../src/modules/simulations/domain/scenario-category.entity';
import { Scenario } from '../../../src/modules/simulations/domain/scenario.entity';
import { ScenarioCharacter } from '../../../src/modules/simulations/domain/scenario-character.entity';
import { UserLevel } from '../../../src/common/enums/user-level.enum';
import { Difficulty } from '../../../src/common/enums/difficulty.enum';

const VALID_USER_LEVELS = Object.values(UserLevel);
const VALID_DIFFICULTIES = Object.values(Difficulty);

const EXPECTED_CATEGORY_NAMES = [
  'Mua sắm',
  'Ăn uống',
  'Di chuyển',
  'Y tế',
  'Công việc',
  'Đời sống',
];

const HANDLEBARS_VARIABLES = [
  '{{learner.level}}',
  '{{learner.nativeLanguage}}',
  '{{scenario.title}}',
  '{{scenario.description}}',
];

const NPC_HANDLEBARS_VARIABLES = [
  '{{characters[0].name}}',
  '{{characters[0].role}}',
  '{{characters[0].personality}}',
  '{{characters[0].speechStyle}}',
  '{{playable.name}}',
];

const GROUP_HANDLEBARS_VARIABLES = [
  '{{characters[0].name}}',
  '{{characters[0].role}}',
];

const GROUP_SCENARIO_TITLES = [
  'Đổi trả áo len',
  'Phỏng vấn xin việc',
  'Làm quen hàng xóm mới',
];

let ctx: AppContext;

async function setup(): Promise<void> {
  ctx = await bootstrapAppContext();
  await seedSimulations(ctx.dataSource);
}

async function teardown(): Promise<void> {
  if (ctx) {
    await ctx.close();
  }
}

function assertString(value: unknown, label: string): void {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label}: expected non-empty string, got ${JSON.stringify(value)}`);
  }
}

function assertNumber(value: unknown, label: string): void {
  if (typeof value !== 'number') {
    throw new Error(`${label}: expected number, got ${JSON.stringify(value)}`);
  }
}

describe('Categories created correctly', () => {
  it('has exactly 6 categories', async () => {
    const repo = ctx.dataSource.getRepository(ScenarioCategory);
    const categories = await repo.find({ order: { orderIndex: 'ASC' } });
    expect(categories.length).toBe(6);
  });

  it('each category has name, description, icon, color, and orderIndex', async () => {
    const repo = ctx.dataSource.getRepository(ScenarioCategory);
    const categories = await repo.find({ order: { orderIndex: 'ASC' } });

    for (const cat of categories) {
      assertString(cat.name, `Category "${cat.id}" name`);
      assertString(cat.description, `Category "${cat.name}" description`);
      assertString(cat.icon, `Category "${cat.name}" icon`);
      assertString(cat.color, `Category "${cat.name}" color`);
      assertNumber(cat.orderIndex, `Category "${cat.name}" orderIndex`);
    }
  });

  it('categories are ordered correctly by orderIndex 1-6', async () => {
    const repo = ctx.dataSource.getRepository(ScenarioCategory);
    const categories = await repo.find({ order: { orderIndex: 'ASC' } });

    const names = categories.map((c) => c.name);
    expect(names).toEqual(EXPECTED_CATEGORY_NAMES);

    for (let i = 0; i < categories.length; i++) {
      expect(categories[i].orderIndex).toBe(i + 1);
    }
  });

  it('each category color is a valid hex color', async () => {
    const repo = ctx.dataSource.getRepository(ScenarioCategory);
    const categories = await repo.find();

    for (const cat of categories) {
      const isHexColor = /^#[0-9A-Fa-f]{6}$/.test(cat.color);
      if (!isHexColor) {
        throw new Error(`Category "${cat.name}" color "${cat.color}" is not a valid hex color`);
      }
    }
  });
});

describe('Scenarios created correctly', () => {
  it('has exactly 15 scenarios', async () => {
    const repo = ctx.dataSource.getRepository(Scenario);
    const count = await repo.count();
    expect(count).toBe(15);
  });

  it('each scenario has a valid categoryId pointing to an existing category', async () => {
    const categoryRepo = ctx.dataSource.getRepository(ScenarioCategory);
    const scenarioRepo = ctx.dataSource.getRepository(Scenario);

    const categories = await categoryRepo.find();
    const categoryIds = new Set(categories.map((c) => c.id));
    const scenarios = await scenarioRepo.find();

    for (const scenario of scenarios) {
      if (!categoryIds.has(scenario.categoryId)) {
        throw new Error(
          `Scenario "${scenario.title}" has invalid categoryId "${scenario.categoryId}"`,
        );
      }
    }
  });

  it('each scenario has title, description, systemPrompt, requiredLevel, difficulty, estimatedMinutes', async () => {
    const repo = ctx.dataSource.getRepository(Scenario);
    const scenarios = await repo.find();

    for (const s of scenarios) {
      assertString(s.title, `Scenario id="${s.id}" title`);
      assertString(s.description, `Scenario "${s.title}" description`);
      assertString(s.systemPrompt, `Scenario "${s.title}" systemPrompt`);
      assertString(s.requiredLevel, `Scenario "${s.title}" requiredLevel`);
      assertString(s.difficulty, `Scenario "${s.title}" difficulty`);
      assertNumber(s.estimatedMinutes, `Scenario "${s.title}" estimatedMinutes`);
    }
  });

  it('requiredLevel values are valid UserLevel enum values (A1-B2)', async () => {
    const repo = ctx.dataSource.getRepository(Scenario);
    const scenarios = await repo.find();

    for (const s of scenarios) {
      if (!VALID_USER_LEVELS.includes(s.requiredLevel as UserLevel)) {
        throw new Error(
          `Scenario "${s.title}" has invalid requiredLevel "${s.requiredLevel}"`,
        );
      }
    }
  });

  it('difficulty values are valid Difficulty enum values', async () => {
    const repo = ctx.dataSource.getRepository(Scenario);
    const scenarios = await repo.find();

    for (const s of scenarios) {
      if (!VALID_DIFFICULTIES.includes(s.difficulty as Difficulty)) {
        throw new Error(
          `Scenario "${s.title}" has invalid difficulty "${s.difficulty}"`,
        );
      }
    }
  });

  it('all scenarios are published', async () => {
    const repo = ctx.dataSource.getRepository(Scenario);
    const scenarios = await repo.find();

    for (const s of scenarios) {
      expect(s.isPublished).toBeTruthy();
    }
  });

  it('each scenario has an openingMessage', async () => {
    const repo = ctx.dataSource.getRepository(Scenario);
    const scenarios = await repo.find();

    for (const s of scenarios) {
      if (!s.openingMessage || s.openingMessage.length === 0) {
        throw new Error(`Scenario "${s.title}" has empty or null openingMessage`);
      }
    }
  });
});

describe('Characters created correctly', () => {
  it('each scenario has at least 2 characters', async () => {
    const repo = ctx.dataSource.getRepository(Scenario);
    const scenarios = await repo.find({ relations: ['characters'] });

    for (const s of scenarios) {
      if (s.characters.length < 2) {
        throw new Error(
          `Scenario "${s.title}" has ${s.characters.length} characters, expected >= 2`,
        );
      }
    }
  });

  it('each scenario has at least one playable character', async () => {
    const repo = ctx.dataSource.getRepository(Scenario);
    const scenarios = await repo.find({ relations: ['characters'] });

    for (const s of scenarios) {
      const playable = s.characters.filter((c) => c.isPlayable);
      if (playable.length < 1) {
        throw new Error(
          `Scenario "${s.title}" has no playable characters`,
        );
      }
    }
  });

  it('each character has name, role, personality, and speechStyle', async () => {
    const repo = ctx.dataSource.getRepository(ScenarioCharacter);
    const characters = await repo.find();

    for (const ch of characters) {
      assertString(ch.name, `Character id="${ch.id}" name`);
      assertString(ch.role, `Character "${ch.name}" role`);
      assertString(ch.personality, `Character "${ch.name}" personality`);
      assertString(ch.speechStyle, `Character "${ch.name}" speechStyle`);
    }
  });

  it('characters have sequential orderIndex values within each scenario', async () => {
    const scenarioRepo = ctx.dataSource.getRepository(Scenario);
    const characterRepo = ctx.dataSource.getRepository(ScenarioCharacter);
    const scenarios = await scenarioRepo.find();

    for (const s of scenarios) {
      const chars = await characterRepo.find({
        where: { scenarioId: s.id },
        order: { orderIndex: 'ASC' },
      });

      for (let i = 0; i < chars.length; i++) {
        if (chars[i].orderIndex !== i + 1) {
          throw new Error(
            `Scenario "${s.title}" character "${chars[i].name}" orderIndex is ${chars[i].orderIndex}, expected ${i + 1}`,
          );
        }
      }
    }
  });
});

describe('Scoring criteria integrity', () => {
  it('each scenario scoringCriteria is a valid JSON array', async () => {
    const repo = ctx.dataSource.getRepository(Scenario);
    const scenarios = await repo.find();

    for (const s of scenarios) {
      if (!Array.isArray(s.scoringCriteria)) {
        throw new Error(
          `Scenario "${s.title}" scoringCriteria is not an array`,
        );
      }
    }
  });

  it('each criterion has name, description, and weight', async () => {
    const repo = ctx.dataSource.getRepository(Scenario);
    const scenarios = await repo.find();

    for (const s of scenarios) {
      for (let i = 0; i < s.scoringCriteria.length; i++) {
        const c = s.scoringCriteria[i];
        assertString(c.name, `Scenario "${s.title}" criteria[${i}] name`);
        assertString(c.description, `Scenario "${s.title}" criteria[${i}] description`);
        assertNumber(c.weight, `Scenario "${s.title}" criteria[${i}] weight`);
      }
    }
  });

  it('weights sum to exactly 100 for each scenario', async () => {
    const repo = ctx.dataSource.getRepository(Scenario);
    const scenarios = await repo.find();

    for (const s of scenarios) {
      const total = s.scoringCriteria.reduce(
        (sum: number, c: { weight: number }) => sum + c.weight,
        0,
      );
      expect(total).toBe(100);
    }
  });

  it('each scenario has between 3 and 5 scoring criteria', async () => {
    const repo = ctx.dataSource.getRepository(Scenario);
    const scenarios = await repo.find();

    for (const s of scenarios) {
      if (s.scoringCriteria.length < 3 || s.scoringCriteria.length > 5) {
        throw new Error(
          `Scenario "${s.title}" has ${s.scoringCriteria.length} criteria, expected 3-5`,
        );
      }
    }
  });
});

describe('System prompt template validity', () => {
  it('each scenario systemPrompt is non-empty and meaningful', async () => {
    const repo = ctx.dataSource.getRepository(Scenario);
    const scenarios = await repo.find();

    for (const s of scenarios) {
      if (s.systemPrompt.length < 50) {
        throw new Error(
          `Scenario "${s.title}" systemPrompt is too short (${s.systemPrompt.length} chars), expected meaningful content`,
        );
      }
    }
  });

  it('each systemPrompt contains core Handlebars variables', async () => {
    const repo = ctx.dataSource.getRepository(Scenario);
    const scenarios = await repo.find();

    for (const s of scenarios) {
      for (const variable of HANDLEBARS_VARIABLES) {
        if (!s.systemPrompt.includes(variable)) {
          throw new Error(
            `Scenario "${s.title}" systemPrompt missing variable "${variable}"`,
          );
        }
      }
    }
  });

  it('non-group scenarios contain NPC Handlebars variables', async () => {
    const repo = ctx.dataSource.getRepository(Scenario);
    const scenarios = await repo.find({ relations: ['characters'] });
    const nonGroupScenarios = scenarios.filter(
      (s) => !GROUP_SCENARIO_TITLES.includes(s.title),
    );

    for (const s of nonGroupScenarios) {
      for (const variable of NPC_HANDLEBARS_VARIABLES) {
        if (!s.systemPrompt.includes(variable)) {
          throw new Error(
            `Non-group scenario "${s.title}" systemPrompt missing variable "${variable}"`,
          );
        }
      }
    }
  });

  it('group scenarios contain characters array Handlebars variables', async () => {
    const repo = ctx.dataSource.getRepository(Scenario);
    const scenarios = await repo.find({
      where: GROUP_SCENARIO_TITLES.map((title) => ({ title })),
      relations: ['characters'],
    });

    for (const s of scenarios) {
      for (const variable of GROUP_HANDLEBARS_VARIABLES) {
        if (!s.systemPrompt.includes(variable)) {
          throw new Error(
            `Group scenario "${s.title}" systemPrompt missing variable "${variable}"`,
          );
        }
      }
    }
  });
});

describe('Idempotency', () => {
  it('running seed twice produces identical counts', async () => {
    const categoryRepo = ctx.dataSource.getRepository(ScenarioCategory);
    const scenarioRepo = ctx.dataSource.getRepository(Scenario);
    const characterRepo = ctx.dataSource.getRepository(ScenarioCharacter);

    const initialCategories = await categoryRepo.count();
    const initialScenarios = await scenarioRepo.count();
    const initialCharacters = await characterRepo.count();

    await seedSimulations(ctx.dataSource);

    expect(await categoryRepo.count()).toBe(initialCategories);
    expect(await scenarioRepo.count()).toBe(initialScenarios);
    expect(await characterRepo.count()).toBe(initialCharacters);
  });
});

await setup();
let allPassed = false;
try {
  allPassed = await runRegisteredTests('Simulations Seeder integration suite');
} finally {
  await teardown();
}
process.exit(allPassed ? 0 : 1);
