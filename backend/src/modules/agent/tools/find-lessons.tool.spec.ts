import { FindLessonsTool } from './find-lessons.tool';
import { CourseContentService } from '../../courses/application/course-content.service';
import { UserLevel, Dialect, LessonType } from '../../../common/enums';
import type { ToolContext } from '@linvnix/shared';
import type { User } from '../../users/domain/user.entity';

describe('FindLessonsTool', () => {
  let tool: FindLessonsTool;
  let courseContent: jest.Mocked<CourseContentService>;

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
    courseContent = {
      findLessons: jest.fn(),
    } as unknown as jest.Mocked<CourseContentService>;

    tool = new FindLessonsTool(courseContent);
  });

  describe('static metadata', () => {
    it('declares the expected tool name', () => {
      expect(tool.name).toBe('find_lessons');
    });

    it('declares the English displayName for the mobile loading state', () => {
      expect(tool.displayName).toBe('Finding relevant lessons...');
    });

    it('declares a non-empty description for the model', () => {
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(0);
    });

    it('accepts an empty filter (all params optional)', () => {
      const empty = tool.parameters.parse({});
      expect(empty).toEqual({});
    });

    it('accepts the full filter set', () => {
      const full = tool.parameters.parse({
        topic: 'family',
        level: UserLevel.A1,
        type: LessonType.VOCABULARY,
        limit: 5,
      });
      expect(full).toEqual({
        topic: 'family',
        level: UserLevel.A1,
        type: LessonType.VOCABULARY,
        limit: 5,
      });
    });

    it('rejects invalid level and type values', () => {
      expect(() => tool.parameters.parse({ level: 'Z9' })).toThrow();
      expect(() => tool.parameters.parse({ type: 'not-a-type' })).toThrow();
    });

    it('caps `limit` to a sensible range (1..50)', () => {
      expect(() => tool.parameters.parse({ limit: 0 })).toThrow();
      expect(() => tool.parameters.parse({ limit: 51 })).toThrow();
      expect(tool.parameters.parse({ limit: 1 }).limit).toBe(1);
      expect(tool.parameters.parse({ limit: 50 }).limit).toBe(50);
    });
  });

  describe('execute', () => {
    const summaries = [
      {
        id: 'l1',
        title: 'Family members',
        level: UserLevel.A1,
        type: LessonType.VOCABULARY,
        courseTitle: 'Beginner Vietnamese',
        moduleTitle: 'Family',
      },
    ];

    it('returns { lessons } shape from the service', async () => {
      courseContent.findLessons.mockResolvedValue(summaries as any);

      const result = await tool.execute({ topic: 'family' }, buildCtx());

      expect('error' in result).toBe(false);
      if ('error' in result) return;
      expect(result.lessons).toEqual(summaries);
    });

    it('forwards all filter params verbatim to the service', async () => {
      courseContent.findLessons.mockResolvedValue([]);

      await tool.execute(
        {
          topic: 'family',
          level: UserLevel.A1,
          type: LessonType.VOCABULARY,
          limit: 10,
        },
        buildCtx(),
      );

      expect(courseContent.findLessons).toHaveBeenCalledWith({
        topic: 'family',
        level: UserLevel.A1,
        type: LessonType.VOCABULARY,
        limit: 10,
      });
    });

    it('forwards empty filter (no params) to the service as {}', async () => {
      courseContent.findLessons.mockResolvedValue([]);

      await tool.execute({}, buildCtx());

      expect(courseContent.findLessons).toHaveBeenCalledWith({});
    });

    it('returns { error } instead of throwing when the service throws', async () => {
      courseContent.findLessons.mockRejectedValue(new Error('db down'));

      const result = await tool.execute({ topic: 'family' }, buildCtx());

      expect(result).toEqual({ error: 'db down' });
    });
  });

  describe('toDeclaration', () => {
    it('produces a function-calling declaration the LLM can read', () => {
      const decl = tool.toDeclaration();
      expect(decl.name).toBe('find_lessons');
      expect(decl.description).toBe(tool.description);
      expect((decl.parameters as any).type).toBe('object');
    });
  });
});
