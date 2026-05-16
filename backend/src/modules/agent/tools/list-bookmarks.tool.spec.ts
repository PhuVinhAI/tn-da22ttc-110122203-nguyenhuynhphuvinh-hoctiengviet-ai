import { ListBookmarksTool } from './list-bookmarks.tool';
import { BookmarksService } from '../../vocabularies/application/bookmarks.service';
import { BookmarkSort } from '../../vocabularies/dto/bookmark-query.dto';
import { UserLevel, Dialect } from '../../../common/enums';
import type { ToolContext } from '@linvnix/shared';
import type { User } from '../../users/domain/user.entity';

describe('ListBookmarksTool', () => {
  let tool: ListBookmarksTool;
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
    screenContext: { route: '/bookmarks' },
    user: mockUser,
    ...overrides,
  });

  beforeEach(() => {
    bookmarksService = {
      list: jest.fn(),
    } as any;

    tool = new ListBookmarksTool(bookmarksService);
  });

  describe('static metadata', () => {
    it('declares the expected tool name', () => {
      expect(tool.name).toBe('list_bookmarks');
    });

    it('declares the Vietnamese displayName for the mobile loading state', () => {
      expect(tool.displayName).toBe('Đang xem từ bạn đã yêu sách...');
    });

    it('declares a non-empty description for the model', () => {
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(0);
    });

    it('accepts an empty object (defaults are applied at execute time, not parse time)', () => {
      const parsed = tool.parameters.parse({});
      // Defaults are applied inside `execute` so the parse output stays an
      // accurate echo of the LLM's actual args — easier to debug.
      expect(parsed).toEqual({});
    });

    it('accepts a search string and a custom limit within [1..50]', () => {
      const parsed = tool.parameters.parse({ search: 'xe', limit: 5 });
      expect(parsed).toEqual({ search: 'xe', limit: 5 });
    });

    it('rejects limit > 50', () => {
      expect(() => tool.parameters.parse({ limit: 51 })).toThrow();
    });

    it('rejects limit < 1', () => {
      expect(() => tool.parameters.parse({ limit: 0 })).toThrow();
    });
  });

  describe('execute', () => {
    const mockListResult = {
      data: [
        {
          bookmarkedAt: new Date('2026-05-15T10:00:00Z'),
          vocabulary: { id: 'voc-1', word: 'xe đạp', translation: 'bicycle' },
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };

    it('calls BookmarksService.list with ctx.userId, page=1, limit=20, sort=NEWEST by default', async () => {
      bookmarksService.list.mockResolvedValue(mockListResult);

      const result = await tool.execute(tool.parameters.parse({}), buildCtx());

      expect(bookmarksService.list).toHaveBeenCalledWith('user-1', {
        page: 1,
        limit: 20,
        sort: BookmarkSort.NEWEST,
      });
      expect(result).toEqual(mockListResult);
    });

    it('forwards the search parameter to the service when provided', async () => {
      bookmarksService.list.mockResolvedValue(mockListResult);

      await tool.execute(
        tool.parameters.parse({ search: 'xe', limit: 5 }),
        buildCtx(),
      );

      expect(bookmarksService.list).toHaveBeenCalledWith('user-1', {
        page: 1,
        limit: 5,
        search: 'xe',
        sort: BookmarkSort.NEWEST,
      });
    });

    it('uses userId from ctx, NEVER from params (security regression test)', async () => {
      // Even though the schema rejects extra fields, a careless implementation
      // could still pass through params.userId by accident. Drive a malicious
      // params shape to confirm the tool only ever uses ctx.userId.
      bookmarksService.list.mockResolvedValue(mockListResult);

      await tool.execute(
        { userId: 'attacker-tries-this', limit: 20 } as any,
        buildCtx({ userId: 'user-real' }),
      );

      expect(bookmarksService.list).toHaveBeenCalledWith(
        'user-real',
        expect.any(Object),
      );
      expect(bookmarksService.list).not.toHaveBeenCalledWith(
        'attacker-tries-this',
        expect.any(Object),
      );
    });

    it('returns { error } instead of throwing when the underlying service throws', async () => {
      bookmarksService.list.mockRejectedValue(new Error('db unreachable'));

      const result = await tool.execute(tool.parameters.parse({}), buildCtx());

      expect(result).toEqual({ error: 'db unreachable' });
    });
  });

  describe('toDeclaration', () => {
    it('produces a function-calling declaration the LLM can read', () => {
      const decl = tool.toDeclaration();
      expect(decl.name).toBe('list_bookmarks');
      expect(decl.description).toBe(tool.description);
      expect((decl.parameters as any).type).toBe('object');
    });
  });
});
