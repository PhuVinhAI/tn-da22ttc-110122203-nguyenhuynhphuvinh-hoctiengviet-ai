import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserExerciseResultsRepository } from './user-exercise-results.repository';
import { UserExerciseResult } from '../../domain/user-exercise-result.entity';

describe('UserExerciseResultsRepository', () => {
  let repository: UserExerciseResultsRepository;
  let mockRepo: jest.Mocked<Repository<UserExerciseResult>>;
  let mockManager: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockManager = {
      upsert: jest.fn().mockResolvedValue({ generatedMaps: [] }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserExerciseResultsRepository,
        {
          provide: getRepositoryToken(UserExerciseResult),
          useValue: mockRepo,
        },
      ],
    }).compile();

    repository = module.get<UserExerciseResultsRepository>(
      UserExerciseResultsRepository,
    );
  });

  describe('findByUserId', () => {
    it('queries by userId ordered by attemptedAt DESC with no limit by default', async () => {
      mockRepo.find.mockResolvedValue([]);

      await repository.findByUserId('user-1');

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { attemptedAt: 'DESC' },
      });
    });

    it('applies the provided limit when within [1..50]', async () => {
      mockRepo.find.mockResolvedValue([]);

      await repository.findByUserId('user-1', { limit: 5 });

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { attemptedAt: 'DESC' },
        take: 5,
      });
    });

    it('clamps limit > 50 down to 50 (the hard upper bound)', async () => {
      mockRepo.find.mockResolvedValue([]);

      await repository.findByUserId('user-1', { limit: 999 });

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { attemptedAt: 'DESC' },
        take: 50,
      });
    });

    it('coerces limit < 1 up to 1 (no negative/zero takes hitting the DB)', async () => {
      mockRepo.find.mockResolvedValue([]);

      await repository.findByUserId('user-1', { limit: 0 });

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { attemptedAt: 'DESC' },
        take: 1,
      });
    });

    it('treats limit=undefined as "no limit" (forward compat with callers that pass {})', async () => {
      mockRepo.find.mockResolvedValue([]);

      await repository.findByUserId('user-1', {});

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { attemptedAt: 'DESC' },
      });
    });
  });

  describe('upsertResult', () => {
    it('inserts new exercise result when no conflict', async () => {
      await repository.upsertResult(
        mockManager,
        'user-1',
        'exercise-1',
        85,
        true,
      );

      expect(mockManager.upsert).toHaveBeenCalledWith(
        UserExerciseResult,
        {
          userId: 'user-1',
          exerciseId: 'exercise-1',
          score: 85,
          isCorrect: true,
        },
        ['userId', 'exerciseId'],
      );
    });

    it('updates existing exercise result on conflict', async () => {
      await repository.upsertResult(
        mockManager,
        'user-1',
        'exercise-1',
        100,
        true,
      );

      expect(mockManager.upsert).toHaveBeenCalledWith(
        UserExerciseResult,
        expect.objectContaining({ score: 100, isCorrect: true }),
        ['userId', 'exerciseId'],
      );
    });

    it('passes manager to upsert for transaction context', async () => {
      await repository.upsertResult(
        mockManager,
        'user-1',
        'exercise-1',
        50,
        false,
      );

      expect(mockManager.upsert).toHaveBeenCalledTimes(1);
      expect(mockManager.upsert).toHaveBeenCalledWith(
        UserExerciseResult,
        expect.any(Object),
        ['userId', 'exerciseId'],
      );
    });
  });
});
