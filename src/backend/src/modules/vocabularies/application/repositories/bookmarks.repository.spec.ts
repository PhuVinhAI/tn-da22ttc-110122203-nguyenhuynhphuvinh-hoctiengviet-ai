import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookmarksRepository } from './bookmarks.repository';
import { Bookmark } from '../../domain/bookmark.entity';
import { BookmarkSort } from '../../dto/bookmark-query.dto';

describe('BookmarksRepository', () => {
  let repository: BookmarksRepository;
  let mockRepo: jest.Mocked<Repository<Bookmark>>;
  let mockQueryBuilder: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getCount: jest.fn(),
      getManyAndCount: jest.fn(),
      getRawMany: jest.fn(),
    };

    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksRepository,
        {
          provide: getRepositoryToken(Bookmark),
          useValue: mockRepo,
        },
      ],
    }).compile();

    repository = module.get<BookmarksRepository>(BookmarksRepository);
  });

  describe('create', () => {
    it('creates and returns a bookmark', async () => {
      const data = { userId: 'user-1', vocabularyId: 'vocab-1' };
      const created = {
        id: 'bm-1',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Bookmark;
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await repository.create(data);

      expect(mockRepo.create).toHaveBeenCalledWith(data);
      expect(mockRepo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });

    it('creates a bookmark with personalVocabularyId', async () => {
      const data = { userId: 'user-1', personalVocabularyId: 'pv-1' };
      const created = {
        id: 'bm-2',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Bookmark;
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await repository.create(data);

      expect(mockRepo.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(created);
    });
  });

  describe('findByUserAndVocabulary', () => {
    it('returns bookmark when found', async () => {
      const bookmark = {
        id: 'bm-1',
        userId: 'user-1',
        vocabularyId: 'vocab-1',
      } as Bookmark;
      mockRepo.findOne.mockResolvedValue(bookmark);

      const result = await repository.findByUserAndVocabulary(
        'user-1',
        'vocab-1',
      );

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          vocabularyId: 'vocab-1',
        },
      });
      expect(result).toEqual(bookmark);
    });

    it('returns null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByUserAndVocabulary(
        'user-1',
        'vocab-999',
      );

      expect(result).toBeNull();
    });
  });

  describe('findByUserAndPersonalVocabulary', () => {
    it('returns bookmark when found', async () => {
      const bookmark = {
        id: 'bm-2',
        userId: 'user-1',
        personalVocabularyId: 'pv-1',
      } as Bookmark;
      mockRepo.findOne.mockResolvedValue(bookmark);

      const result = await repository.findByUserAndPersonalVocabulary(
        'user-1',
        'pv-1',
      );

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          personalVocabularyId: 'pv-1',
        },
      });
      expect(result).toEqual(bookmark);
    });

    it('returns null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByUserAndPersonalVocabulary(
        'user-1',
        'pv-999',
      );

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('deletes bookmark by id', async () => {
      mockRepo.delete.mockResolvedValue({ affected: 1 } as any);

      await repository.delete('bm-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('bm-1');
    });
  });

  describe('findByVocabularyIds', () => {
    it('returns bookmarks for given vocabularyIds', async () => {
      const bookmarks = [
        { id: 'bm-1', userId: 'user-1', vocabularyId: 'vocab-1' },
        { id: 'bm-2', userId: 'user-1', vocabularyId: 'vocab-2' },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(bookmarks);

      const result = await repository.findByVocabularyIds('user-1', [
        'vocab-1',
        'vocab-2',
      ]);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('bookmark');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'bookmark.userId = :userId',
        { userId: 'user-1' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'bookmark.vocabularyId IS NOT NULL',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'bookmark.vocabularyId IN (:...vocabularyIds)',
        { vocabularyIds: ['vocab-1', 'vocab-2'] },
      );
      expect(result).toEqual(bookmarks);
    });

    it('returns empty array when vocabularyIds is empty', async () => {
      const result = await repository.findByVocabularyIds('user-1', []);

      expect(result).toEqual([]);
      expect(mockRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('returns total and breakdown by partOfSpeech', async () => {
      mockRepo.count.mockResolvedValue(25);
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([
          { partOfSpeech: 'noun', count: '12' },
          { partOfSpeech: 'verb', count: '8' },
        ])
        .mockResolvedValueOnce([{ partOfSpeech: 'adjective', count: '5' }]);

      const result = await repository.getStats('user-1');

      expect(mockRepo.count).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(mockRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'bookmark.vocabulary',
        'vocabulary',
      );
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'bookmark.personalVocabulary',
        'personalVocabulary',
      );
      expect(result).toEqual({
        total: 25,
        byPartOfSpeech: {
          noun: 12,
          verb: 8,
          adjective: 5,
        },
      });
    });

    it('returns zeros when user has no bookmarks', async () => {
      mockRepo.count.mockResolvedValue(0);

      const result = await repository.getStats('user-1');

      expect(result).toEqual({ total: 0, byPartOfSpeech: {} });
      expect(mockRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('findPaginated', () => {
    const defaultArgs = {
      userId: 'user-1',
      page: 1,
      limit: 20,
      search: undefined as string | undefined,
      sort: BookmarkSort.NEWEST,
    };

    it('returns paginated results with default sort (newest)', async () => {
      const bookmarks = [{ id: 'bm-1' }, { id: 'bm-2' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([bookmarks, 2]);

      const result = await repository.findPaginated(defaultArgs);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'bookmark.createdAt',
        'DESC',
      );
      expect(result.data).toEqual(bookmarks);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('left joins personalVocabulary', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findPaginated(defaultArgs);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'bookmark.personalVocabulary',
        'personalVocabulary',
      );
    });

    it('sorts by oldest (createdAt ASC)', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findPaginated({
        ...defaultArgs,
        sort: BookmarkSort.OLDEST,
      });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'bookmark.createdAt',
        'ASC',
      );
    });

    it('sorts by az (word ASC)', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findPaginated({ ...defaultArgs, sort: BookmarkSort.AZ });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'COALESCE(vocabulary.word, personalVocabulary.word)',
        'ASC',
      );
    });

    it('sorts by za (word DESC)', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findPaginated({ ...defaultArgs, sort: BookmarkSort.ZA });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'COALESCE(vocabulary.word, personalVocabulary.word)',
        'DESC',
      );
    });

    it('applies search filter on word and translation for both vocabulary and personalVocabulary', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findPaginated({ ...defaultArgs, search: 'xin' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(vocabulary.word ILIKE :search OR vocabulary.translation ILIKE :search OR personalVocabulary.word ILIKE :search OR personalVocabulary.translation ILIKE :search)',
        { search: '%xin%' },
      );
    });

    it('calculates correct pagination meta', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 45]);

      const result = await repository.findPaginated({
        ...defaultArgs,
        limit: 20,
      });

      expect(result.meta.totalPages).toBe(3);
    });

    it('skips and takes correct number of records', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findPaginated({ ...defaultArgs, page: 2, limit: 10 });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });
  });
});
