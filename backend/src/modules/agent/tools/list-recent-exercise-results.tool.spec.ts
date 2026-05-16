import { ListRecentExerciseResultsTool } from './list-recent-exercise-results.tool';
import { ExercisesService } from '../../exercises/application/exercises.service';
import { UserLevel, Dialect } from '../../../common/enums';
import type { ToolContext } from '@linvnix/shared';
import type { User } from '../../users/domain/user.entity';

describe('ListRecentExerciseResultsTool', () => {
  let tool: ListRecentExerciseResultsTool;
  let exercisesService: jest.Mocked<ExercisesService>;

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
    exercisesService = {
      getUserResults: jest.fn(),
    } as any;

    tool = new ListRecentExerciseResultsTool(exercisesService);
  });

  describe('static metadata', () => {
    it('declares the expected tool name', () => {
      expect(tool.name).toBe('list_recent_exercise_results');
    });

    it('declares the Vietnamese displayName for the mobile loading state', () => {
      expect(tool.displayName).toBe('Đang xem kết quả bài tập gần đây...');
    });

    it('declares a non-empty description for the model', () => {
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(0);
    });

    it('accepts an empty object (defaults are applied at execute time, not parse time)', () => {
      const parsed = tool.parameters.parse({});
      expect(parsed).toEqual({});
    });

    it('accepts custom limit within [1..50]', () => {
      expect(tool.parameters.parse({ limit: 1 })).toEqual({ limit: 1 });
      expect(tool.parameters.parse({ limit: 50 })).toEqual({ limit: 50 });
    });

    it('rejects limit outside [1..50]', () => {
      expect(() => tool.parameters.parse({ limit: 0 })).toThrow();
      expect(() => tool.parameters.parse({ limit: 51 })).toThrow();
    });
  });

  describe('execute', () => {
    const mockResults = [
      {
        id: 'r-1',
        userId: 'user-1',
        exerciseId: 'ex-1',
        isCorrect: false,
        score: 0,
        attemptedAt: new Date('2026-05-15T10:00:00Z'),
      },
    ];

    it('calls ExercisesService.getUserResults with ctx.userId and parsed limit', async () => {
      exercisesService.getUserResults.mockResolvedValue(mockResults as any);

      const result = await tool.execute(
        tool.parameters.parse({ limit: 5 }),
        buildCtx(),
      );

      expect(exercisesService.getUserResults).toHaveBeenCalledWith('user-1', {
        limit: 5,
      });
      expect(result).toEqual({ results: mockResults });
    });

    it('uses the default limit (10) when params is empty', async () => {
      exercisesService.getUserResults.mockResolvedValue([]);

      await tool.execute(tool.parameters.parse({}), buildCtx());

      expect(exercisesService.getUserResults).toHaveBeenCalledWith('user-1', {
        limit: 10,
      });
    });

    it('uses userId from ctx, NEVER from params (security regression test)', async () => {
      exercisesService.getUserResults.mockResolvedValue([]);

      await tool.execute(
        { userId: 'attacker-tries-this', limit: 10 } as any,
        buildCtx({ userId: 'user-real' }),
      );

      expect(exercisesService.getUserResults).toHaveBeenCalledWith(
        'user-real',
        { limit: 10 },
      );
      expect(exercisesService.getUserResults).not.toHaveBeenCalledWith(
        'attacker-tries-this',
        expect.any(Object),
      );
    });

    it('returns { error } instead of throwing when the underlying service throws', async () => {
      exercisesService.getUserResults.mockRejectedValue(
        new Error('db unreachable'),
      );

      const result = await tool.execute(tool.parameters.parse({}), buildCtx());

      expect(result).toEqual({ error: 'db unreachable' });
    });
  });

  describe('toDeclaration', () => {
    it('produces a function-calling declaration the LLM can read', () => {
      const decl = tool.toDeclaration();
      expect(decl.name).toBe('list_recent_exercise_results');
      expect(decl.description).toBe(tool.description);
      expect((decl.parameters as any).type).toBe('object');
    });
  });
});
