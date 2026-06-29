import { Test, TestingModule } from '@nestjs/testing';
import { BookmarksService } from './bookmarks.service';
import { BookmarksRepository } from './repositories/bookmarks.repository';
import { Bookmark } from '../domain/bookmark.entity';
import { BookmarkSort } from '../dto/bookmark-query.dto';
import { PersonalVocabulariesService } from '../../personal-vocabularies/application/personal-vocabularies.service';
import { BadRequestException } from '@nestjs/common';

describe('BookmarksService', () => {
  let service: BookmarksService;
  let repository: jest.Mocked<BookmarksRepository>;
  let personalVocabulariesService: jest.Mocked<PersonalVocabulariesService>;

  beforeEach(async () => {
    const repoMock = {
      findByUserAndVocabulary: jest.fn(),
      findByUserAndPersonalVocabulary: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findByVocabularyIds: jest.fn(),
      findPaginated: jest.fn(),
      getStats: jest.fn(),
    };

    const pvServiceMock = {
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksService,
        { provide: BookmarksRepository, useValue: repoMock },
        {
          provide: PersonalVocabulariesService,
          useValue: pvServiceMock,
        },
      ],
    }).compile();

    service = module.get<BookmarksService>(BookmarksService);
    repository = module.get(BookmarksRepository);
    personalVocabulariesService = module.get(PersonalVocabulariesService);
  });

  describe('toggle', () => {
    it('creates bookmark when not bookmarked and returns { isBookmarked: true }', async () => {
      repository.findByUserAndVocabulary.mockResolvedValue(null);
      const created = { id: 'bm-1', userId: 'user-1', vocabularyId: 'vocab-1' };
      repository.create.mockResolvedValue(created as Bookmark);

      const result = await service.toggle('user-1', 'vocab-1');

      expect(result).toEqual({ isBookmarked: true });
      expect(repository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        vocabularyId: 'vocab-1',
      });
    });

    it('deletes bookmark when already bookmarked and returns { isBookmarked: false }', async () => {
      const existing = {
        id: 'bm-1',
        userId: 'user-1',
        vocabularyId: 'vocab-1',
      };
      repository.findByUserAndVocabulary.mockResolvedValue(
        existing as Bookmark,
      );
      repository.delete.mockResolvedValue(undefined);

      const result = await service.toggle('user-1', 'vocab-1');

      expect(result).toEqual({ isBookmarked: false });
      expect(repository.delete).toHaveBeenCalledWith('bm-1');
    });

    it('creates bookmark with personalVocabularyId when provided', async () => {
      repository.findByUserAndPersonalVocabulary.mockResolvedValue(null);
      const created = {
        id: 'bm-2',
        userId: 'user-1',
        personalVocabularyId: 'pv-1',
      };
      repository.create.mockResolvedValue(created as Bookmark);

      const result = await service.toggle('user-1', undefined, 'pv-1');

      expect(result).toEqual({ isBookmarked: true });
      expect(repository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        personalVocabularyId: 'pv-1',
      });
    });

    it('deletes bookmark and soft-deletes personal vocabulary when un-bookmarking personal', async () => {
      const existing = {
        id: 'bm-2',
        userId: 'user-1',
        personalVocabularyId: 'pv-1',
      };
      repository.findByUserAndPersonalVocabulary.mockResolvedValue(
        existing as Bookmark,
      );
      repository.delete.mockResolvedValue(undefined);
      personalVocabulariesService.delete.mockResolvedValue(undefined);

      const result = await service.toggle('user-1', undefined, 'pv-1');

      expect(result).toEqual({ isBookmarked: false });
      expect(repository.delete).toHaveBeenCalledWith('bm-2');
      expect(personalVocabulariesService.delete).toHaveBeenCalledWith(
        'pv-1',
        'user-1',
      );
    });

    it('throws BadRequestException when both vocabularyId and personalVocabularyId provided', async () => {
      await expect(service.toggle('user-1', 'vocab-1', 'pv-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when neither vocabularyId nor personalVocabularyId provided', async () => {
      await expect(
        service.toggle('user-1', undefined, undefined),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('list', () => {
    it('returns paginated bookmarked vocabularies with type field', async () => {
      const paginatedResult = {
        data: [
          {
            id: 'bm-1',
            userId: 'user-1',
            vocabularyId: 'vocab-1',
            vocabulary: { word: 'xin chào' },
            personalVocabularyId: null,
            createdAt: new Date(),
          },
          {
            id: 'bm-2',
            userId: 'user-1',
            vocabularyId: null,
            personalVocabularyId: 'pv-1',
            personalVocabulary: { word: 'bàn' },
            createdAt: new Date(),
          },
        ],
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      };
      repository.findPaginated.mockResolvedValue(paginatedResult as any);

      const result = await service.list('user-1', {
        page: 1,
        limit: 20,
        sort: BookmarkSort.NEWEST,
      });

      expect(repository.findPaginated).toHaveBeenCalledWith({
        userId: 'user-1',
        page: 1,
        limit: 20,
        search: undefined,
        sort: BookmarkSort.NEWEST,
      });
      expect(result.meta.total).toBe(2);
      expect(result.data[0].type).toBe('system');
      expect(result.data[1].type).toBe('personal');
      expect(result.data[1].personalVocabularyId).toBe('pv-1');
    });

    it('passes search and sort params to repository', async () => {
      repository.findPaginated.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      await service.list('user-1', {
        page: 1,
        limit: 20,
        search: 'hello',
        sort: BookmarkSort.AZ,
      });

      expect(repository.findPaginated).toHaveBeenCalledWith({
        userId: 'user-1',
        page: 1,
        limit: 20,
        search: 'hello',
        sort: BookmarkSort.AZ,
      });
    });

    it('returns bookmarkedAt from bookmark createdAt', async () => {
      const bookmarkedAt = new Date('2024-01-15');
      const paginatedResult = {
        data: [
          {
            id: 'bm-1',
            createdAt: bookmarkedAt,
            vocabulary: { word: 'xin chào', translation: 'hello' },
            personalVocabularyId: null,
          },
        ],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      repository.findPaginated.mockResolvedValue(paginatedResult as any);

      const result = await service.list('user-1', {
        page: 1,
        limit: 20,
        sort: BookmarkSort.NEWEST,
      });

      expect(result.data[0].bookmarkedAt).toEqual(bookmarkedAt);
    });
  });

  describe('getStats', () => {
    it('returns total and byPartOfSpeech from repository', async () => {
      const statsResult = {
        total: 25,
        byPartOfSpeech: { noun: 12, verb: 8, adjective: 5 },
      };
      repository.getStats.mockResolvedValue(statsResult);

      const result = await service.getStats('user-1');

      expect(repository.getStats).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(statsResult);
    });

    it('returns empty stats when user has no bookmarks', async () => {
      repository.getStats.mockResolvedValue({
        total: 0,
        byPartOfSpeech: {},
      });

      const result = await service.getStats('user-1');

      expect(result.total).toBe(0);
      expect(result.byPartOfSpeech).toEqual({});
    });
  });

  describe('isBookmarked', () => {
    it('returns map of vocabularyId → isBookmarked', async () => {
      const bookmarks = [
        { vocabularyId: 'vocab-1' },
        { vocabularyId: 'vocab-3' },
      ];
      repository.findByVocabularyIds.mockResolvedValue(bookmarks as Bookmark[]);

      const result = await service.isBookmarked('user-1', [
        'vocab-1',
        'vocab-2',
        'vocab-3',
      ]);

      expect(result).toEqual({
        'vocab-1': true,
        'vocab-2': false,
        'vocab-3': true,
      });
    });

    it('returns all false when no bookmarks found', async () => {
      repository.findByVocabularyIds.mockResolvedValue([]);

      const result = await service.isBookmarked('user-1', [
        'vocab-1',
        'vocab-2',
      ]);

      expect(result).toEqual({
        'vocab-1': false,
        'vocab-2': false,
      });
    });

    it('returns empty object when vocabularyIds is empty', async () => {
      const result = await service.isBookmarked('user-1', []);

      expect(result).toEqual({});
    });
  });
});
