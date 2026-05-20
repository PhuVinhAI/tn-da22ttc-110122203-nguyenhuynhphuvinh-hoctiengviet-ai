import { NotFoundException } from '@nestjs/common';
import { GetLessonDetailTool } from './get-lesson-detail.tool';
import { CourseContentService } from '../../courses/application/course-content.service';
import { UserLevel, Dialect } from '../../../common/enums';
import type { ToolContext } from '@linvnix/shared';
import type { User } from '../../users/domain/user.entity';

describe('GetLessonDetailTool', () => {
  let tool: GetLessonDetailTool;
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
    screenContext: { route: '/lessons/abc' },
    user: mockUser,
    ...overrides,
  });

  beforeEach(() => {
    courseContent = {
      getLessonDetail: jest.fn(),
    } as unknown as jest.Mocked<CourseContentService>;

    tool = new GetLessonDetailTool(courseContent);
  });

  describe('static metadata', () => {
    it('declares the expected tool name', () => {
      expect(tool.name).toBe('get_lesson_detail');
    });

    it('declares the English displayName for the mobile loading state', () => {
      expect(tool.displayName).toBe('Reading lesson content...');
    });

    it('declares a non-empty description for the model', () => {
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(0);
    });

    it('requires `lessonId` as a string', () => {
      expect(() => tool.parameters.parse({})).toThrow();
      const ok = tool.parameters.parse({ lessonId: 'lesson-1' });
      expect(ok).toEqual({ lessonId: 'lesson-1' });
    });
  });

  describe('execute', () => {
    const lesson = {
      id: 'l1',
      title: 'Family members',
      lessonType: 'vocabulary',
      contents: [{ id: 'ct1' }],
      vocabularies: [{ id: 'v1' }],
      grammarRules: [{ id: 'gr1' }],
      exercises: [{ id: 'e1' }],
      exerciseSets: [{ id: 'es1' }],
    } as any;

    it('returns { lesson } shape with the full lesson body', async () => {
      courseContent.getLessonDetail.mockResolvedValue(lesson);

      const result = await tool.execute({ lessonId: 'l1' }, buildCtx());

      expect('error' in result).toBe(false);
      if ('error' in result) return;
      expect(result.lesson).toEqual(lesson);
      expect(result.lesson.exercises).toEqual([{ id: 'e1' }]);
      expect(result.lesson.exerciseSets).toEqual([{ id: 'es1' }]);
    });

    it('forwards lessonId verbatim to the service', async () => {
      courseContent.getLessonDetail.mockResolvedValue(lesson);

      await tool.execute({ lessonId: 'l1' }, buildCtx());

      expect(courseContent.getLessonDetail).toHaveBeenCalledWith('l1');
    });

    it('returns { error } when lesson is not found (NotFoundException)', async () => {
      courseContent.getLessonDetail.mockRejectedValue(
        new NotFoundException('Lesson with ID missing not found'),
      );

      const result = await tool.execute({ lessonId: 'missing' }, buildCtx());

      expect(result).toEqual({ error: 'Lesson with ID missing not found' });
    });

    it('returns { error } when the service throws a generic error', async () => {
      courseContent.getLessonDetail.mockRejectedValue(new Error('db down'));

      const result = await tool.execute({ lessonId: 'l1' }, buildCtx());

      expect(result).toEqual({ error: 'db down' });
    });
  });

  describe('toDeclaration', () => {
    it('produces a function-calling declaration the LLM can read', () => {
      const decl = tool.toDeclaration();
      expect(decl.name).toBe('get_lesson_detail');
      expect(decl.description).toBe(tool.description);
      expect((decl.parameters as any).type).toBe('object');
    });
  });
});
