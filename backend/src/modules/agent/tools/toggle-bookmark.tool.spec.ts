import { ToggleBookmarkTool } from './toggle-bookmark.tool';
import { BookmarksService } from '../../vocabularies/application/bookmarks.service';
import { UserLevel, Dialect } from '../../../common/enums';
import type { ToolContext } from '@linvnix/shared';
import type { User } from '../../users/domain/user.entity';

describe('ToggleBookmarkTool', () => {
  let tool: ToggleBookmarkTool;
  let bookmarksService: jest.Mocked<BookmarksService>;

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
    bookmarksService = {
      toggle: jest.fn(),
    } as any;

    tool = new ToggleBookmarkTool(bookmarksService);
  });

  describe('static metadata', () => {
    it('declares the expected tool name', () => {
      expect(tool.name).toBe('toggle_bookmark');
    });

    it('declares the Vietnamese displayName for the mobile loading state', () => {
      expect(tool.displayName).toBe('Đang đánh dấu yêu sách...');
    });

    it('declares a non-empty description for the model', () => {
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(0);
    });

    it('requires vocabularyId as a UUID', () => {
      expect(() => tool.parameters.parse({})).toThrow();
      expect(() =>
        tool.parameters.parse({ vocabularyId: 'not-a-uuid' }),
      ).toThrow();
      const ok = tool.parameters.parse({
        vocabularyId: '11111111-1111-1111-1111-111111111111',
      });
      expect(ok).toEqual({
        vocabularyId: '11111111-1111-1111-1111-111111111111',
      });
    });
  });

  describe('execute', () => {
    const vocabularyId = '11111111-1111-1111-1111-111111111111';

    it('returns { bookmarked: true, vocabularyId } when the service reports the bookmark was just added', async () => {
      bookmarksService.toggle.mockResolvedValue({ isBookmarked: true });

      const result = await tool.execute({ vocabularyId }, buildCtx());

      expect(bookmarksService.toggle).toHaveBeenCalledWith(
        'user-1',
        vocabularyId,
      );
      expect(result).toEqual({ bookmarked: true, vocabularyId });
    });

    it('returns { bookmarked: false, vocabularyId } when the service reports the bookmark was just removed', async () => {
      bookmarksService.toggle.mockResolvedValue({ isBookmarked: false });

      const result = await tool.execute({ vocabularyId }, buildCtx());

      expect(result).toEqual({ bookmarked: false, vocabularyId });
    });

    it('uses userId from ctx, NEVER from params (security regression test)', async () => {
      bookmarksService.toggle.mockResolvedValue({ isBookmarked: true });

      await tool.execute(
        { vocabularyId, userId: 'attacker-tries-this' } as any,
        buildCtx({ userId: 'user-real' }),
      );

      expect(bookmarksService.toggle).toHaveBeenCalledWith(
        'user-real',
        vocabularyId,
      );
      expect(bookmarksService.toggle).not.toHaveBeenCalledWith(
        'attacker-tries-this',
        expect.any(String),
      );
    });

    it('returns { error } instead of throwing when the underlying service throws', async () => {
      bookmarksService.toggle.mockRejectedValue(new Error('voc not found'));

      const result = await tool.execute({ vocabularyId }, buildCtx());

      expect(result).toEqual({ error: 'voc not found' });
    });
  });

  describe('toDeclaration', () => {
    it('produces a function-calling declaration the LLM can read', () => {
      const decl = tool.toDeclaration();
      expect(decl.name).toBe('toggle_bookmark');
      expect(decl.description).toBe(tool.description);
      expect((decl.parameters as any).type).toBe('object');
    });
  });
});
