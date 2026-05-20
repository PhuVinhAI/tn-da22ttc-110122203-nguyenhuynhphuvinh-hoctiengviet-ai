import { SearchGrammarRulesTool } from './search-grammar-rules.tool';
import { CourseContentService } from '../../courses/application/course-content.service';
import { UserLevel, Dialect } from '../../../common/enums';
import type { ToolContext } from '@linvnix/shared';
import type { User } from '../../users/domain/user.entity';

describe('SearchGrammarRulesTool', () => {
  let tool: SearchGrammarRulesTool;
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
      searchGrammar: jest.fn(),
    } as unknown as jest.Mocked<CourseContentService>;

    tool = new SearchGrammarRulesTool(courseContent);
  });

  describe('static metadata', () => {
    it('declares the expected tool name', () => {
      expect(tool.name).toBe('search_grammar_rules');
    });

    it('declares the English displayName for the mobile loading state', () => {
      expect(tool.displayName).toBe('Looking up grammar...');
    });

    it('declares a non-empty description for the model', () => {
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(0);
    });

    it('requires `query` and accepts optional `lessonId` + `level`', () => {
      expect(() => tool.parameters.parse({})).toThrow();
      const ok = tool.parameters.parse({ query: 'classifier' });
      expect(ok).toEqual({ query: 'classifier' });

      const full = tool.parameters.parse({
        query: 'classifier',
        lessonId: '11111111-1111-1111-1111-111111111111',
        level: UserLevel.A2,
      });
      expect(full).toEqual({
        query: 'classifier',
        lessonId: '11111111-1111-1111-1111-111111111111',
        level: UserLevel.A2,
      });
    });

    it('rejects invalid level values', () => {
      expect(() =>
        tool.parameters.parse({ query: 'x', level: 'Z9' }),
      ).toThrow();
    });
  });

  describe('execute', () => {
    const rules = [
      { id: 'gr1', title: 'Classifiers', explanation: '...' },
    ] as any[];

    it('returns { rules } shape from the service', async () => {
      courseContent.searchGrammar.mockResolvedValue(rules);

      const result = await tool.execute({ query: 'classifier' }, buildCtx());

      expect('error' in result).toBe(false);
      if ('error' in result) return;
      expect(result.rules).toEqual(rules);
    });

    it('forwards `query` (no opts) to the service', async () => {
      courseContent.searchGrammar.mockResolvedValue([]);

      await tool.execute({ query: 'classifier' }, buildCtx());

      expect(courseContent.searchGrammar).toHaveBeenCalledWith(
        'classifier',
        {},
      );
    });

    it('forwards lessonId filter when supplied', async () => {
      courseContent.searchGrammar.mockResolvedValue([]);

      await tool.execute(
        { query: 'classifier', lessonId: 'lesson-1' },
        buildCtx(),
      );

      expect(courseContent.searchGrammar).toHaveBeenCalledWith('classifier', {
        lessonId: 'lesson-1',
      });
    });

    it('forwards level filter when supplied (no fallback from ctx.user.currentLevel)', async () => {
      courseContent.searchGrammar.mockResolvedValue([]);

      await tool.execute(
        { query: 'classifier', level: UserLevel.A1 },
        buildCtx(),
      );

      expect(courseContent.searchGrammar).toHaveBeenCalledWith('classifier', {
        level: UserLevel.A1,
      });
    });

    it('returns { error } instead of throwing when the service throws', async () => {
      courseContent.searchGrammar.mockRejectedValue(new Error('db down'));

      const result = await tool.execute({ query: 'classifier' }, buildCtx());

      expect(result).toEqual({ error: 'db down' });
    });
  });

  describe('toDeclaration', () => {
    it('produces a function-calling declaration the LLM can read', () => {
      const decl = tool.toDeclaration();
      expect(decl.name).toBe('search_grammar_rules');
      expect(decl.description).toBe(tool.description);
      expect((decl.parameters as any).type).toBe('object');
    });
  });
});
