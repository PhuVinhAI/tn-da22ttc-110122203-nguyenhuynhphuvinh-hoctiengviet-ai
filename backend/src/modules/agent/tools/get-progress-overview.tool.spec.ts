import { NotFoundException } from '@nestjs/common';
import {
  GetProgressOverviewTool,
  GetProgressOverviewResult,
  GetProgressOverviewOutput,
} from './get-progress-overview.tool';
import { ProgressService } from '../../progress/application/progress.service';
import { UserLevel, Dialect, ProgressStatus } from '../../../common/enums';
import type { ToolContext } from '@linvnix/shared';
import type { User } from '../../users/domain/user.entity';

/**
 * The tool returns a discriminated union of `GetProgressOverviewResult` (the
 * happy path) or `{ error: string }`. Test cases that exercise the happy
 * path narrow the union via this guard so accessing success fields stays
 * type-safe and a regression (an unexpected error path) fails loudly with a
 * helpful message instead of a property-access TypeError.
 */
function assertOk(
  output: GetProgressOverviewOutput,
): asserts output is GetProgressOverviewResult {
  if ('error' in output) {
    throw new Error(`Expected success but got error: ${output.error}`);
  }
}

describe('GetProgressOverviewTool', () => {
  let tool: GetProgressOverviewTool;
  let progressService: jest.Mocked<ProgressService>;

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

  // Helper to fabricate a UserProgress row with the relations the
  // ProgressRepository actually loads (`lesson.module.course`).
  function progress(opts: {
    courseId: string;
    courseTitle: string;
    moduleId: string;
    moduleTitle: string;
    lessonId: string;
    status: ProgressStatus;
    score?: number;
  }): any {
    return {
      id: `p-${opts.lessonId}`,
      userId: 'user-1',
      lessonId: opts.lessonId,
      status: opts.status,
      score: opts.score,
      lesson: {
        id: opts.lessonId,
        module: {
          id: opts.moduleId,
          title: opts.moduleTitle,
          course: {
            id: opts.courseId,
            title: opts.courseTitle,
          },
        },
      },
    };
  }

  beforeEach(() => {
    progressService = {
      getUserProgress: jest.fn(),
      getCourseProgress: jest.fn(),
    } as any;

    tool = new GetProgressOverviewTool(progressService);
  });

  describe('static metadata', () => {
    it('declares the expected tool name', () => {
      expect(tool.name).toBe('get_progress_overview');
    });

    it('declares the Vietnamese displayName for the mobile loading state', () => {
      expect(tool.displayName).toBe('Đang xem tiến trình của bạn...');
    });

    it('declares a non-empty description for the model', () => {
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(0);
    });

    it('takes no LLM-controlled parameters (empty schema)', () => {
      expect(tool.parameters.parse({})).toEqual({});
    });
  });

  describe('execute', () => {
    it("returns the learner's CEFR level from ctx.user", async () => {
      progressService.getUserProgress.mockResolvedValue([]);

      const result = await tool.execute({}, buildCtx());
      assertOk(result);

      expect(result.currentLevel).toBe(UserLevel.A2);
    });

    it('returns empty arrays for a learner with no progress', async () => {
      progressService.getUserProgress.mockResolvedValue([]);

      const result = await tool.execute({}, buildCtx());
      assertOk(result);

      expect(result).toEqual({
        currentLevel: UserLevel.A2,
        activeCourses: [],
        modulesInProgress: [],
        weakAreas: [],
      });
      expect(progressService.getCourseProgress).not.toHaveBeenCalled();
    });

    it('aggregates unique active courses and asks getCourseProgress once per course', async () => {
      progressService.getUserProgress.mockResolvedValue([
        progress({
          courseId: 'c-1',
          courseTitle: 'Beginner A1',
          moduleId: 'm-1',
          moduleTitle: 'Greetings',
          lessonId: 'l-1',
          status: ProgressStatus.IN_PROGRESS,
        }),
        progress({
          courseId: 'c-1',
          courseTitle: 'Beginner A1',
          moduleId: 'm-1',
          moduleTitle: 'Greetings',
          lessonId: 'l-2',
          status: ProgressStatus.COMPLETED,
          score: 80,
        }),
        progress({
          courseId: 'c-2',
          courseTitle: 'Family A2',
          moduleId: 'm-2',
          moduleTitle: 'Family members',
          lessonId: 'l-3',
          status: ProgressStatus.IN_PROGRESS,
        }),
      ]);
      progressService.getCourseProgress.mockImplementation(
        async (_uid, courseId) => {
          if (courseId === 'c-1') {
            return {
              completedModulesCount: 1,
              totalModulesCount: 4,
            } as any;
          }
          return {
            completedModulesCount: 0,
            totalModulesCount: 5,
          } as any;
        },
      );

      const result = await tool.execute({}, buildCtx());
      assertOk(result);

      // Called once per unique course, never duplicated even though c-1 had
      // two UserProgress rows.
      expect(progressService.getCourseProgress).toHaveBeenCalledTimes(2);
      expect(progressService.getCourseProgress).toHaveBeenCalledWith(
        'user-1',
        'c-1',
      );
      expect(progressService.getCourseProgress).toHaveBeenCalledWith(
        'user-1',
        'c-2',
      );

      expect(result.activeCourses).toEqual([
        { id: 'c-1', title: 'Beginner A1', percent: 25 },
        { id: 'c-2', title: 'Family A2', percent: 0 },
      ]);
    });

    it('handles getCourseProgress throwing NotFoundException by defaulting that course percent to 0', async () => {
      // Edge case: learner has UserProgress for a lesson but no CourseProgress
      // row yet (e.g. enrollment wasn\'t recorded). Tool must NOT throw — it
      // should treat the course as 0% complete and keep going.
      progressService.getUserProgress.mockResolvedValue([
        progress({
          courseId: 'c-ghost',
          courseTitle: 'Ghost course',
          moduleId: 'm-1',
          moduleTitle: 'Mystery',
          lessonId: 'l-1',
          status: ProgressStatus.IN_PROGRESS,
        }),
      ]);
      progressService.getCourseProgress.mockRejectedValue(
        new NotFoundException('Course progress not found'),
      );

      const result = await tool.execute({}, buildCtx());
      assertOk(result);

      expect(result.activeCourses).toEqual([
        { id: 'c-ghost', title: 'Ghost course', percent: 0 },
      ]);
    });

    it('lists modulesInProgress with percent = completed/attempted of user lessons in that module', async () => {
      progressService.getUserProgress.mockResolvedValue([
        progress({
          courseId: 'c-1',
          courseTitle: 'Beginner A1',
          moduleId: 'm-1',
          moduleTitle: 'Greetings',
          lessonId: 'l-1',
          status: ProgressStatus.COMPLETED,
          score: 90,
        }),
        progress({
          courseId: 'c-1',
          courseTitle: 'Beginner A1',
          moduleId: 'm-1',
          moduleTitle: 'Greetings',
          lessonId: 'l-2',
          status: ProgressStatus.IN_PROGRESS,
        }),
      ]);
      progressService.getCourseProgress.mockResolvedValue({
        completedModulesCount: 0,
        totalModulesCount: 4,
      } as any);

      const result = await tool.execute({}, buildCtx());
      assertOk(result);

      expect(result.modulesInProgress).toEqual([
        {
          id: 'm-1',
          title: 'Greetings',
          courseTitle: 'Beginner A1',
          percent: 50,
        },
      ]);
    });

    it('omits modules from modulesInProgress when every attempted lesson is completed', async () => {
      progressService.getUserProgress.mockResolvedValue([
        progress({
          courseId: 'c-1',
          courseTitle: 'Beginner A1',
          moduleId: 'm-done',
          moduleTitle: 'Finished module',
          lessonId: 'l-1',
          status: ProgressStatus.COMPLETED,
          score: 90,
        }),
        progress({
          courseId: 'c-1',
          courseTitle: 'Beginner A1',
          moduleId: 'm-done',
          moduleTitle: 'Finished module',
          lessonId: 'l-2',
          status: ProgressStatus.COMPLETED,
          score: 95,
        }),
      ]);
      progressService.getCourseProgress.mockResolvedValue({
        completedModulesCount: 1,
        totalModulesCount: 4,
      } as any);

      const result = await tool.execute({}, buildCtx());
      assertOk(result);

      expect(result.modulesInProgress).toEqual([]);
    });

    it('flags modules as weakAreas when the learner has \u22652 completed lessons averaging below 70', async () => {
      progressService.getUserProgress.mockResolvedValue([
        progress({
          courseId: 'c-1',
          courseTitle: 'Beginner A1',
          moduleId: 'm-weak',
          moduleTitle: 'Pronouns',
          lessonId: 'l-1',
          status: ProgressStatus.COMPLETED,
          score: 50,
        }),
        progress({
          courseId: 'c-1',
          courseTitle: 'Beginner A1',
          moduleId: 'm-weak',
          moduleTitle: 'Pronouns',
          lessonId: 'l-2',
          status: ProgressStatus.COMPLETED,
          score: 60,
        }),
        progress({
          courseId: 'c-1',
          courseTitle: 'Beginner A1',
          moduleId: 'm-strong',
          moduleTitle: 'Numbers',
          lessonId: 'l-3',
          status: ProgressStatus.COMPLETED,
          score: 95,
        }),
        progress({
          courseId: 'c-1',
          courseTitle: 'Beginner A1',
          moduleId: 'm-strong',
          moduleTitle: 'Numbers',
          lessonId: 'l-4',
          status: ProgressStatus.COMPLETED,
          score: 80,
        }),
      ]);
      progressService.getCourseProgress.mockResolvedValue({
        completedModulesCount: 2,
        totalModulesCount: 4,
      } as any);

      const result = await tool.execute({}, buildCtx());
      assertOk(result);

      expect(result.weakAreas).toEqual(['Pronouns']);
    });

    it('does NOT flag a module as a weak area when only 1 completed lesson exists (insufficient data)', async () => {
      progressService.getUserProgress.mockResolvedValue([
        progress({
          courseId: 'c-1',
          courseTitle: 'Beginner A1',
          moduleId: 'm-bad-luck',
          moduleTitle: 'Tones',
          lessonId: 'l-1',
          status: ProgressStatus.COMPLETED,
          score: 20,
        }),
      ]);
      progressService.getCourseProgress.mockResolvedValue({
        completedModulesCount: 0,
        totalModulesCount: 4,
      } as any);

      const result = await tool.execute({}, buildCtx());
      assertOk(result);

      expect(result.weakAreas).toEqual([]);
    });

    it('skips userProgress rows missing lesson/module/course relations defensively', async () => {
      progressService.getUserProgress.mockResolvedValue([
        {
          id: 'orphan-1',
          userId: 'user-1',
          lessonId: 'x',
          lesson: null,
        } as any,
        {
          id: 'orphan-2',
          userId: 'user-1',
          lessonId: 'y',
          lesson: { module: null },
        } as any,
        {
          id: 'orphan-3',
          userId: 'user-1',
          lessonId: 'z',
          lesson: { module: { course: null } },
        } as any,
      ]);

      const result = await tool.execute({}, buildCtx());
      assertOk(result);

      expect(result.activeCourses).toEqual([]);
      expect(result.modulesInProgress).toEqual([]);
      expect(result.weakAreas).toEqual([]);
      expect(progressService.getCourseProgress).not.toHaveBeenCalled();
    });

    it('uses userId from ctx, NEVER from params (security regression test)', async () => {
      progressService.getUserProgress.mockResolvedValue([]);

      await tool.execute(
        { userId: 'attacker-tries-this' } as any,
        buildCtx({ userId: 'user-real' }),
      );

      expect(progressService.getUserProgress).toHaveBeenCalledWith('user-real');
      expect(progressService.getUserProgress).not.toHaveBeenCalledWith(
        'attacker-tries-this',
      );
    });

    it('returns { error } instead of throwing when getUserProgress throws', async () => {
      progressService.getUserProgress.mockRejectedValue(
        new Error('db unreachable'),
      );

      const result = await tool.execute({}, buildCtx());

      expect(result).toEqual({ error: 'db unreachable' });
    });
  });

  describe('toDeclaration', () => {
    it('produces a function-calling declaration the LLM can read', () => {
      const decl = tool.toDeclaration();
      expect(decl.name).toBe('get_progress_overview');
      expect(decl.description).toBe(tool.description);
      expect((decl.parameters as any).type).toBe('object');
    });
  });
});
