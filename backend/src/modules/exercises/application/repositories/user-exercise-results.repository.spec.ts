import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { UserExerciseResultsRepository } from './user-exercise-results.repository';
import { UserExerciseResult } from '../../domain/user-exercise-result.entity';

describe('UserExerciseResultsRepository', () => {
  let repository: UserExerciseResultsRepository;
  let mockRepo: jest.Mocked<Repository<UserExerciseResult>>;
  let mockManager: jest.Mocked<EntityManager>;
  let mockDataSource: jest.Mocked<DataSource>;

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

    mockDataSource = {
      query: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserExerciseResultsRepository,
        {
          provide: getRepositoryToken(UserExerciseResult),
          useValue: mockRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
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

  describe('getStatsByUser', () => {
    it('returns correct stats for user with both exercises and lesson progress', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([
          { totalExercises: '10', correctAnswers: '7', totalTimeTaken: '600' },
        ])
        .mockResolvedValueOnce([
          { completedLessons: '3', totalLessonTime: '1800' },
        ]);

      const result = await repository.getStatsByUser('user-1');

      expect(result.totalExercises).toBe(10);
      expect(result.correctAnswers).toBe(7);
      expect(result.incorrectAnswers).toBe(3);
      expect(result.accuracy).toBeCloseTo(70);
      expect(result.completedExercises).toBe(3);
      expect(result.totalTimeSpent).toBe(2400); // 600 + 1800
    });

    it('returns zero stats for a brand-new user with no data', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([
          { totalExercises: '0', correctAnswers: null, totalTimeTaken: null },
        ])
        .mockResolvedValueOnce([
          { completedLessons: '0', totalLessonTime: null },
        ]);

      const result = await repository.getStatsByUser('new-user');

      expect(result.totalExercises).toBe(0);
      expect(result.correctAnswers).toBe(0);
      expect(result.incorrectAnswers).toBe(0);
      expect(result.accuracy).toBe(0);
      expect(result.completedExercises).toBe(0);
      expect(result.totalTimeSpent).toBe(0);
    });

    it('computes accuracy as 100% when all exercises are correct', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([
          { totalExercises: '5', correctAnswers: '5', totalTimeTaken: '300' },
        ])
        .mockResolvedValueOnce([
          { completedLessons: '2', totalLessonTime: '900' },
        ]);

      const result = await repository.getStatsByUser('user-2');

      expect(result.accuracy).toBe(100);
      expect(result.totalTimeSpent).toBe(1200); // 300 + 900
    });

    it('passes userId as parameterized argument to both queries', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([
          { totalExercises: '0', correctAnswers: null, totalTimeTaken: null },
        ])
        .mockResolvedValueOnce([
          { completedLessons: '0', totalLessonTime: null },
        ]);

      await repository.getStatsByUser('target-user');

      expect(mockDataSource.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('user_exercise_results'),
        ['target-user'],
      );
      expect(mockDataSource.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('completed'),
        ['target-user'],
      );
    });
  });
});
