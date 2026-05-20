import { SearchVocabularyTool } from './search-vocabulary.tool';
import { VocabulariesService } from '../../vocabularies/application/vocabularies.service';
import { UserLevel, Dialect } from '../../../common/enums';
import type { ToolContext } from '@linvnix/shared';
import type { User } from '../../users/domain/user.entity';

describe('SearchVocabularyTool', () => {
  let tool: SearchVocabularyTool;
  let vocabulariesService: jest.Mocked<VocabulariesService>;

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
    vocabulariesService = {
      search: jest.fn(),
    } as unknown as jest.Mocked<VocabulariesService>;

    tool = new SearchVocabularyTool(vocabulariesService);
  });

  describe('static metadata', () => {
    it('declares the expected tool name', () => {
      expect(tool.name).toBe('search_vocabulary');
    });

    it('declares the English displayName for the mobile loading state', () => {
      expect(tool.displayName).toBe('Looking up vocabulary...');
    });

    it('declares a non-empty description for the model', () => {
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(0);
    });

    it('requires `query` and accepts optional `lessonId` + `dialect`', () => {
      expect(() => tool.parameters.parse({})).toThrow();
      const ok = tool.parameters.parse({ query: 'xe đạp' });
      expect(ok).toEqual({ query: 'xe đạp' });

      const full = tool.parameters.parse({
        query: 'xe đạp',
        lessonId: '11111111-1111-1111-1111-111111111111',
        dialect: Dialect.NORTHERN,
      });
      expect(full).toEqual({
        query: 'xe đạp',
        lessonId: '11111111-1111-1111-1111-111111111111',
        dialect: Dialect.NORTHERN,
      });
    });

    it('rejects invalid dialect values', () => {
      expect(() =>
        tool.parameters.parse({ query: 'x', dialect: 'NOT_A_REGION' }),
      ).toThrow();
    });
  });

  describe('execute', () => {
    const vocabs = [
      { id: 'v1', word: 'xe đạp', translation: 'bicycle' },
      { id: 'v2', word: 'xe máy', translation: 'motorbike' },
    ] as any[];

    it('returns { vocabularies } shape from the service', async () => {
      vocabulariesService.search.mockResolvedValue(vocabs);

      const result = await tool.execute({ query: 'xe' }, buildCtx());

      expect('error' in result).toBe(false);
      if ('error' in result) return;
      expect(result.vocabularies).toEqual(vocabs);
    });

    it('falls back to ctx.user.preferredDialect when params.dialect is absent', async () => {
      vocabulariesService.search.mockResolvedValue(vocabs);

      await tool.execute({ query: 'xe' }, buildCtx());

      expect(vocabulariesService.search).toHaveBeenCalledWith({
        query: 'xe',
        dialect: Dialect.NORTHERN,
      });
    });

    it('prefers params.dialect over ctx.user.preferredDialect when both are present', async () => {
      vocabulariesService.search.mockResolvedValue(vocabs);

      await tool.execute(
        { query: 'xe', dialect: Dialect.SOUTHERN },
        buildCtx(),
      );

      expect(vocabulariesService.search).toHaveBeenCalledWith({
        query: 'xe',
        dialect: Dialect.SOUTHERN,
      });
    });

    it('forwards lessonId filter when supplied', async () => {
      vocabulariesService.search.mockResolvedValue(vocabs);

      await tool.execute({ query: 'xe', lessonId: 'lesson-1' }, buildCtx());

      expect(vocabulariesService.search).toHaveBeenCalledWith({
        query: 'xe',
        lessonId: 'lesson-1',
        dialect: Dialect.NORTHERN,
      });
    });

    it('omits dialect when the user has none and params has none', async () => {
      const ctxNoDialect = buildCtx({
        user: { ...mockUser, preferredDialect: undefined as any },
      });
      vocabulariesService.search.mockResolvedValue(vocabs);

      await tool.execute({ query: 'xe' }, ctxNoDialect);

      expect(vocabulariesService.search).toHaveBeenCalledWith({
        query: 'xe',
      });
    });

    it('returns { error } instead of throwing when the service throws', async () => {
      vocabulariesService.search.mockRejectedValue(new Error('db down'));

      const result = await tool.execute({ query: 'xe' }, buildCtx());

      expect(result).toEqual({ error: 'db down' });
    });
  });

  describe('toDeclaration', () => {
    it('produces a function-calling declaration the LLM can read', () => {
      const decl = tool.toDeclaration();
      expect(decl.name).toBe('search_vocabulary');
      expect(decl.description).toBe(tool.description);
      expect((decl.parameters as any).type).toBe('object');
    });
  });
});
