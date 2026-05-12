import { Test, TestingModule } from '@nestjs/testing';
import { VocabulariesController } from './vocabularies.controller';
import { VocabulariesService } from '../application/vocabularies.service';
import { BookmarksService } from '../application/bookmarks.service';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { BookmarkSort } from '../dto/bookmark-query.dto';

jest.mock('../../../infrastructure/storage/storage.service', () => ({
  StorageService: class StorageService {},
}));

describe('VocabulariesController - Bookmark endpoints', () => {
  let controller: VocabulariesController;
  let vocabulariesService: jest.Mocked<VocabulariesService>;
  let bookmarksService: jest.Mocked<BookmarksService>;

  const mockUser = { id: 'user-1', preferredDialect: null };

  beforeEach(async () => {
    const vocabServiceMock = {
      search: jest.fn(),
      findByLessonId: jest.fn(),
      findByLessonIdWithDialect: jest.fn(),
      enrichWithBookmarks: jest.fn(),
    };

    const bookmarksServiceMock = {
      toggle: jest.fn(),
      list: jest.fn(),
      getStats: jest.fn(),
    };

    const storageServiceMock = {
      uploadAudio: jest.fn(),
      uploadImage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VocabulariesController],
      providers: [
        { provide: VocabulariesService, useValue: vocabServiceMock },
        { provide: BookmarksService, useValue: bookmarksServiceMock },
        { provide: StorageService, useValue: storageServiceMock },
      ],
    }).compile();

    controller = module.get<VocabulariesController>(VocabulariesController);
    vocabulariesService = module.get(VocabulariesService);
    bookmarksService = module.get(BookmarksService);
  });

  describe('POST /vocabularies/:vocabularyId/bookmark', () => {
    it('toggles bookmark and returns { isBookmarked }', async () => {
      bookmarksService.toggle.mockResolvedValue({ isBookmarked: true });

      const result = await controller.toggleBookmark(
        mockUser as any,
        'vocab-1',
      );

      expect(bookmarksService.toggle).toHaveBeenCalledWith('user-1', 'vocab-1');
      expect(result).toEqual({ isBookmarked: true });
    });

    it('returns { isBookmarked: false } when unbookmarking', async () => {
      bookmarksService.toggle.mockResolvedValue({ isBookmarked: false });

      const result = await controller.toggleBookmark(
        mockUser as any,
        'vocab-1',
      );

      expect(result).toEqual({ isBookmarked: false });
    });
  });

  describe('GET /vocabularies/bookmarks', () => {
    it('returns bookmarked vocabularies with default pagination', async () => {
      const listResult = {
        data: [
          {
            bookmarkedAt: new Date(),
            vocabulary: {
              id: 'vocab-1',
              word: 'xin chào',
              translation: 'hello',
            },
          },
        ],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      bookmarksService.list.mockResolvedValue(listResult as any);

      const result = await controller.getBookmarks(mockUser as any, {
        page: 1,
        limit: 20,
        sort: BookmarkSort.NEWEST,
      });

      expect(bookmarksService.list).toHaveBeenCalledWith('user-1', {
        page: 1,
        limit: 20,
        search: undefined,
        sort: BookmarkSort.NEWEST,
      });
      expect(result.data).toHaveLength(1);
    });

    it('passes search and sort params', async () => {
      bookmarksService.list.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      await controller.getBookmarks(mockUser as any, {
        page: 1,
        limit: 20,
        search: 'hello',
        sort: BookmarkSort.AZ,
      });

      expect(bookmarksService.list).toHaveBeenCalledWith('user-1', {
        page: 1,
        limit: 20,
        search: 'hello',
        sort: BookmarkSort.AZ,
      });
    });
  });

  describe('GET /vocabularies/bookmarks/stats', () => {
    it('returns bookmark stats for user', async () => {
      const statsResult = {
        total: 25,
        byPartOfSpeech: { noun: 12, verb: 8, adjective: 5 },
      };
      bookmarksService.getStats.mockResolvedValue(statsResult);

      const result = await controller.getBookmarkStats(mockUser as any);

      expect(bookmarksService.getStats).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(statsResult);
    });

    it('returns empty stats when no bookmarks', async () => {
      bookmarksService.getStats.mockResolvedValue({
        total: 0,
        byPartOfSpeech: {},
      });

      const result = await controller.getBookmarkStats(mockUser as any);

      expect(result.total).toBe(0);
      expect(result.byPartOfSpeech).toEqual({});
    });
  });

  describe('GET /vocabularies/search - isBookmarked enrichment', () => {
    it('enriches search results with isBookmarked when user is authenticated', async () => {
      const vocabularies = [
        { id: 'vocab-1', word: 'xin chào', translation: 'hello' },
      ];
      vocabulariesService.search.mockResolvedValue(vocabularies as any);
      vocabulariesService.enrichWithBookmarks.mockResolvedValue([
        { ...vocabularies[0], isBookmarked: true },
      ]);

      const result = await controller.search('xin', mockUser as any);

      expect(vocabulariesService.enrichWithBookmarks).toHaveBeenCalledWith(
        vocabularies,
        'user-1',
      );
      expect(result[0].isBookmarked).toBe(true);
    });

    it('does not enrich when user is not authenticated', async () => {
      const vocabularies = [
        { id: 'vocab-1', word: 'xin chào', translation: 'hello' },
      ];
      vocabulariesService.search.mockResolvedValue(vocabularies as any);
      vocabulariesService.enrichWithBookmarks.mockImplementation(
        async (vocs, _userId) => vocs,
      );

      await controller.search('xin', null as any);

      expect(vocabulariesService.enrichWithBookmarks).toHaveBeenCalledWith(
        vocabularies,
        undefined,
      );
    });
  });

  describe('GET /vocabularies/lesson/:lessonId - isBookmarked enrichment', () => {
    it('enriches lesson vocabularies with isBookmarked when user is authenticated', async () => {
      const vocabularies = [
        { id: 'vocab-1', word: 'xin chào', translation: 'hello' },
      ];
      vocabulariesService.findByLessonId.mockResolvedValue(vocabularies as any);
      vocabulariesService.enrichWithBookmarks.mockResolvedValue([
        { ...vocabularies[0], isBookmarked: false },
      ]);

      const result = await controller.findByLesson('lesson-1', mockUser as any);

      expect(vocabulariesService.enrichWithBookmarks).toHaveBeenCalledWith(
        vocabularies,
        'user-1',
      );
      expect(result[0].isBookmarked).toBe(false);
    });

    it('does not enrich when user is not authenticated', async () => {
      const vocabularies = [
        { id: 'vocab-1', word: 'xin chào', translation: 'hello' },
      ];
      vocabulariesService.findByLessonId.mockResolvedValue(vocabularies as any);
      vocabulariesService.enrichWithBookmarks.mockImplementation(
        async (vocs, _userId) => vocs,
      );

      await controller.findByLesson('lesson-1', null as any);

      expect(vocabulariesService.enrichWithBookmarks).toHaveBeenCalledWith(
        vocabularies,
        undefined,
      );
    });
  });
});
