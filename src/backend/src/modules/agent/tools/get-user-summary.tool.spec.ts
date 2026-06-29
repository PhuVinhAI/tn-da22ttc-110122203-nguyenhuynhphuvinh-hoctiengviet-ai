import { GetUserSummaryTool } from './get-user-summary.tool';
import { DailyGoalsService } from '../../daily-goals/application/daily-goals.service';
import { DailyStreakService } from '../../daily-goals/application/daily-streak.service';
import { DailyGoalProgressService } from '../../daily-goals/application/daily-goal-progress.service';
import { GoalType, UserLevel, Dialect } from '../../../common/enums';
import type { ToolContext } from '@linvnix/shared';
import type { User } from '../../users/domain/user.entity';

describe('GetUserSummaryTool', () => {
  let tool: GetUserSummaryTool;
  let dailyGoalsService: jest.Mocked<DailyGoalsService>;
  let dailyStreakService: jest.Mocked<DailyStreakService>;
  // Regression spy: this tool MUST NOT call getTodayProgress because that
  // method has the side-effect of mutating streak state via
  // DailyStreakService.updateStreak. Spied on the prototype so any future
  // refactor that wires this service in will trip the assertion below.
  let getTodayProgressSpy: jest.SpyInstance;

  const mockUser = {
    id: 'user-1',
    email: 'a@b.com',
    fullName: 'Test',
    nativeLanguage: 'English',
    currentLevel: UserLevel.A2,
    preferredDialect: Dialect.NORTHERN,
  } as unknown as User;

  const buildCtx = (
    overrides: Partial<ToolContext<User>> = {},
  ): ToolContext<User> => ({
    userId: 'user-1',
    conversationId: 'conv-1',
    screenContext: { route: '/' },
    user: mockUser,
    ...overrides,
  });

  beforeEach(() => {
    dailyGoalsService = {
      findAll: jest.fn(),
    } as any;
    dailyStreakService = {
      getStreak: jest.fn(),
    } as any;

    getTodayProgressSpy = jest
      .spyOn(DailyGoalProgressService.prototype, 'getTodayProgress')
      .mockImplementation(() => {
        throw new Error(
          'get_user_summary must never call DailyGoalProgressService.getTodayProgress',
        );
      });

    tool = new GetUserSummaryTool(dailyGoalsService, dailyStreakService);
  });

  afterEach(() => {
    getTodayProgressSpy.mockRestore();
  });

  describe('static metadata', () => {
    it('declares the expected tool name', () => {
      expect(tool.name).toBe('get_user_summary');
    });

    it('declares a Vietnamese displayName for the mobile loading state', () => {
      expect(tool.displayName).toBe('Summarizing your profile...');
    });

    it('declares a non-empty description for the model', () => {
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(0);
    });

    it('accepts an empty parameters object (no LLM-controlled inputs)', () => {
      // The LLM must never specify whose summary to fetch — userId lives on
      // ctx, not params. Verify the schema accepts {} cleanly.
      const parsed = tool.parameters.parse({});
      expect(parsed).toEqual({});
    });
  });

  describe('execute', () => {
    it('returns level, nativeLanguage, dialect, dailyGoals and streak from ctx + services', async () => {
      dailyGoalsService.findAll.mockResolvedValue([
        { id: 'g-1', goalType: GoalType.QUESTIONS, targetValue: 5 } as any,
        { id: 'g-2', goalType: GoalType.SIMULATIONS, targetValue: 3 } as any,
      ]);
      dailyStreakService.getStreak.mockResolvedValue({
        id: 's-1',
        userId: 'user-1',
        currentStreak: 3,
        longestStreak: 7,
        lastGoalMetDate: '2026-05-15',
      } as any);

      const result = await tool.execute({}, buildCtx());

      expect(result).toEqual({
        level: UserLevel.A2,
        nativeLanguage: 'English',
        dialect: Dialect.NORTHERN,
        dailyGoals: [
          { goalType: GoalType.QUESTIONS, targetValue: 5 },
          { goalType: GoalType.SIMULATIONS, targetValue: 3 },
        ],
        streak: {
          currentStreak: 3,
          longestStreak: 7,
          lastGoalMetDate: '2026-05-15',
        },
      });
    });

    it('returns streak=null when the user has no streak record yet', async () => {
      dailyGoalsService.findAll.mockResolvedValue([]);
      dailyStreakService.getStreak.mockResolvedValue(null);

      const result = await tool.execute({}, buildCtx());

      expect(result.streak).toBeNull();
      expect(result.dailyGoals).toEqual([]);
    });

    it('passes ctx.userId to DailyGoalsService.findAll and DailyStreakService.getStreak', async () => {
      dailyGoalsService.findAll.mockResolvedValue([]);
      dailyStreakService.getStreak.mockResolvedValue(null);

      await tool.execute({}, buildCtx({ userId: 'user-99' }));

      expect(dailyGoalsService.findAll).toHaveBeenCalledWith('user-99');
      expect(dailyStreakService.getStreak).toHaveBeenCalledWith('user-99');
    });

    it('uses userId from ctx, NEVER from params (even if params try to spoof it)', async () => {
      dailyGoalsService.findAll.mockResolvedValue([]);
      dailyStreakService.getStreak.mockResolvedValue(null);

      await tool.execute(
        // The LLM could in principle emit extra junk; the schema ignores it
        // and the tool always reads userId from ctx.
        { userId: 'attacker-tries-this' } as any,
        buildCtx({ userId: 'user-real' }),
      );

      expect(dailyGoalsService.findAll).toHaveBeenCalledWith('user-real');
      expect(dailyGoalsService.findAll).not.toHaveBeenCalledWith(
        'attacker-tries-this',
      );
      expect(dailyStreakService.getStreak).toHaveBeenCalledWith('user-real');
    });

    it('does NOT call DailyGoalProgressService.getTodayProgress (no streak mutation)', async () => {
      dailyGoalsService.findAll.mockResolvedValue([]);
      dailyStreakService.getStreak.mockResolvedValue(null);

      await tool.execute({}, buildCtx());

      expect(getTodayProgressSpy).not.toHaveBeenCalled();
    });
  });

  describe('toDeclaration', () => {
    it('produces a function-calling declaration with name + description + empty schema', () => {
      const decl = tool.toDeclaration();
      expect(decl.name).toBe('get_user_summary');
      expect(decl.description).toBe(tool.description);
      expect((decl.parameters as any).type).toBe('object');
    });
  });
});
