import { PersonalVocabulariesService } from './personal-vocabularies.service';
import { PersonalVocabulariesRepository } from './repositories/personal-vocabularies.repository';
import { PersonalVocabularySource } from '../../../common/enums';
import { PersonalVocabularySort } from '../dto/personal-vocabulary-query.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { PersonalVocabulary } from '../domain/personal-vocabulary.entity';
import { Bookmark } from '../../vocabularies/domain/bookmark.entity';

describe('PersonalVocabulariesService', () => {
  let service: PersonalVocabulariesService;
  let repository: jest.Mocked<PersonalVocabulariesRepository>;
  let dataSource: jest.Mocked<Pick<DataSource, 'createQueryRunner'>>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndUserId: jest.fn(),
      softDelete: jest.fn(),
      findPaginated: jest.fn(),
    } as unknown as jest.Mocked<PersonalVocabulariesRepository>;
    dataSource = {
      createQueryRunner: jest.fn(),
    };
    service = new PersonalVocabulariesService(
      repository,
      dataSource as unknown as DataSource,
    );
  });

  function useTransactionalManager(manager: Partial<EntityManager>) {
    const queryRunner = {
      manager,
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<
      Pick<
        QueryRunner,
        | 'manager'
        | 'connect'
        | 'startTransaction'
        | 'commitTransaction'
        | 'rollbackTransaction'
        | 'release'
      >
    >;
    dataSource.createQueryRunner.mockReturnValue(
      queryRunner as unknown as QueryRunner,
    );
    return queryRunner;
  }

  describe('create', () => {
    it('creates a personal vocabulary scoped to the user', async () => {
      const data = {
        word: 'bàn',
        translation: 'table',
        source: PersonalVocabularySource.IMAGE_DISCOVERY,
      };
      const created = {
        id: 'pv-1',
        userId: 'user-1',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      repository.create.mockResolvedValue(created as any);

      const result = await service.create('user-1', data);

      expect(repository.create).toHaveBeenCalledWith({
        ...data,
        userId: 'user-1',
      });
      expect(result).toEqual(created);
    });

    it('creates with optional fields', async () => {
      const data = {
        word: 'bàn',
        translation: 'table',
        partOfSpeech: 'noun',
        classifier: 'cái',
        source: PersonalVocabularySource.IMAGE_DISCOVERY,
      };
      repository.create.mockResolvedValue({ id: 'pv-1', ...data } as any);

      await service.create('user-1', data);

      expect(repository.create).toHaveBeenCalledWith({
        ...data,
        userId: 'user-1',
      });
    });
  });

  describe('createFromAnalysis', () => {
    it('creates a personal vocabulary and bookmark in one transaction', async () => {
      const manager = {
        create: jest.fn((_entity, data) => data),
        save: jest.fn(),
      };
      const queryRunner = useTransactionalManager(manager);
      const savedVocabulary = {
        id: 'pv-1',
        userId: 'user-1',
        word: 'cấm đỗ xe',
        translation: 'no parking',
        source: PersonalVocabularySource.IMAGE_DISCOVERY,
      };
      manager.save
        .mockResolvedValueOnce(savedVocabulary)
        .mockResolvedValueOnce({
          id: 'bm-1',
          userId: 'user-1',
          personalVocabularyId: 'pv-1',
        });

      const result = await service.createFromAnalysis('user-1', {
        word: 'cấm đỗ xe',
        translation: 'no parking',
        partOfSpeech: 'phrase',
      });

      expect(manager.create).toHaveBeenNthCalledWith(1, PersonalVocabulary, {
        word: 'cấm đỗ xe',
        translation: 'no parking',
        partOfSpeech: 'phrase',
        userId: 'user-1',
        source: PersonalVocabularySource.IMAGE_DISCOVERY,
      });
      expect(manager.save).toHaveBeenNthCalledWith(
        1,
        PersonalVocabulary,
        expect.objectContaining({
          word: 'cấm đỗ xe',
          userId: 'user-1',
        }),
      );
      expect(manager.create).toHaveBeenNthCalledWith(2, Bookmark, {
        userId: 'user-1',
        personalVocabularyId: 'pv-1',
      });
      expect(manager.save).toHaveBeenNthCalledWith(
        2,
        Bookmark,
        expect.objectContaining({
          userId: 'user-1',
          personalVocabularyId: 'pv-1',
        }),
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalledTimes(1);
      expect(result).toEqual(savedVocabulary);
    });

    it('rolls back if bookmark creation fails', async () => {
      const manager = {
        create: jest.fn((_entity, data) => data),
        save: jest.fn(),
      };
      const queryRunner = useTransactionalManager(manager);
      manager.save
        .mockResolvedValueOnce({
          id: 'pv-1',
          userId: 'user-1',
          word: 'cấm đỗ xe',
        })
        .mockRejectedValueOnce(new Error('bookmark insert failed'));

      await expect(
        service.createFromAnalysis('user-1', {
          word: 'cấm đỗ xe',
          translation: 'no parking',
        }),
      ).rejects.toThrow('bookmark insert failed');

      expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('returns personal vocabulary when found and owned', async () => {
      const pv = {
        id: 'pv-1',
        userId: 'user-1',
        word: 'bàn',
      };
      repository.findById.mockResolvedValue(pv as any);

      const result = await service.findById('pv-1', 'user-1');

      expect(result).toEqual(pv);
    });

    it('throws NotFoundException when not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('pv-999', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when not owned', async () => {
      const pv = { id: 'pv-1', userId: 'user-2', word: 'bàn' };
      repository.findById.mockResolvedValue(pv as any);

      await expect(service.findById('pv-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('list', () => {
    it('returns paginated list scoped to user', async () => {
      const paginatedResult = {
        data: [{ id: 'pv-1', userId: 'user-1', word: 'bàn' }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      repository.findPaginated.mockResolvedValue(paginatedResult as any);

      const result = await service.list('user-1', {
        page: 1,
        limit: 20,
        sort: PersonalVocabularySort.NEWEST,
      });

      expect(repository.findPaginated).toHaveBeenCalledWith({
        userId: 'user-1',
        page: 1,
        limit: 20,
        search: undefined,
        sort: PersonalVocabularySort.NEWEST,
      });
      expect(result.meta.total).toBe(1);
    });

    it('passes search and sort params', async () => {
      repository.findPaginated.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      await service.list('user-1', {
        page: 1,
        limit: 20,
        search: 'bàn',
        sort: PersonalVocabularySort.AZ,
      });

      expect(repository.findPaginated).toHaveBeenCalledWith({
        userId: 'user-1',
        page: 1,
        limit: 20,
        search: 'bàn',
        sort: PersonalVocabularySort.AZ,
      });
    });
  });

  describe('delete', () => {
    it('soft-deletes when owned by user', async () => {
      repository.findByIdAndUserId.mockResolvedValue({
        id: 'pv-1',
        userId: 'user-1',
      } as any);
      repository.softDelete.mockResolvedValue(undefined);

      await service.delete('pv-1', 'user-1');

      expect(repository.softDelete).toHaveBeenCalledWith('pv-1');
    });

    it('throws NotFoundException when not found', async () => {
      repository.findByIdAndUserId.mockResolvedValue(null);
      repository.findById.mockResolvedValue(null);

      await expect(service.delete('pv-999', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when not owned', async () => {
      repository.findByIdAndUserId.mockResolvedValue(null);
      repository.findById.mockResolvedValue({
        id: 'pv-1',
        userId: 'user-2',
      } as any);

      await expect(service.delete('pv-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
