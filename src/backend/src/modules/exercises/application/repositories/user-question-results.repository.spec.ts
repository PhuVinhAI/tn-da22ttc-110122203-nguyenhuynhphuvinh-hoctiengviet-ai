import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { UserQuestionResultsRepository } from './user-question-results.repository';
import { QuestionAttempt } from '../../domain/question-attempt.entity';
import { UserQuestionResult } from '../../domain/user-question-result.entity';

describe('UserQuestionResultsRepository', () => {
  let repository: UserQuestionResultsRepository;
  let mockRepo: jest.Mocked<Repository<UserQuestionResult>>;
  let mockAttemptsRepo: jest.Mocked<Repository<QuestionAttempt>>;
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
    mockAttemptsRepo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
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
        UserQuestionResultsRepository,
        {
          provide: getRepositoryToken(UserQuestionResult),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(QuestionAttempt),
          useValue: mockAttemptsRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    repository = module.get<UserQuestionResultsRepository>(
      UserQuestionResultsRepository,
    );
  });

  describe('findByUserId', () => {
    it('queries by userId ordered by attemptedAt DESC with no limit by default', async () => {
      mockAttemptsRepo.find.mockResolvedValue([]);

      await repository.findByUserId('user-1');

      expect(mockAttemptsRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { attemptedAt: 'DESC' },
      });
    });

    it('applies the provided limit when within [1..50]', async () => {
      mockAttemptsRepo.find.mockResolvedValue([]);

      await repository.findByUserId('user-1', { limit: 5 });

      expect(mockAttemptsRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { attemptedAt: 'DESC' },
        take: 5,
      });
    });

    it('clamps limit > 50 down to 50 (the hard upper bound)', async () => {
      mockAttemptsRepo.find.mockResolvedValue([]);

      await repository.findByUserId('user-1', { limit: 999 });

      expect(mockAttemptsRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { attemptedAt: 'DESC' },
        take: 50,
      });
    });

    it('coerces limit < 1 up to 1 (no negative/zero takes hitting the DB)', async () => {
      mockAttemptsRepo.find.mockResolvedValue([]);

      await repository.findByUserId('user-1', { limit: 0 });

      expect(mockAttemptsRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { attemptedAt: 'DESC' },
        take: 1,
      });
    });

    it('treats limit=undefined as "no limit" (forward compat with callers that pass {})', async () => {
      mockAttemptsRepo.find.mockResolvedValue([]);

      await repository.findByUserId('user-1', {});

      expect(mockAttemptsRepo.find).toHaveBeenCalledWith({
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
        UserQuestionResult,
        {
          userId: 'user-1',
          questionId: 'exercise-1',
          score: 85,
          bestScore: 85,
          isCorrect: true,
          attemptedAt: expect.any(Date),
          attemptCount: 1,
        },
        ['userId', 'questionId'],
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
        UserQuestionResult,
        expect.objectContaining({
          score: 100,
          bestScore: 100,
          isCorrect: true,
          attemptedAt: expect.any(Date),
          attemptCount: 1,
        }),
        ['userId', 'questionId'],
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
        UserQuestionResult,
        expect.any(Object),
        ['userId', 'questionId'],
      );
    });
  });

  describe('getStatsByUser', () => {
    it('returns correct stats for user with both exercises and lesson progress', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([
          { totalQuestions: '10', correctAnswers: '7', totalTimeTaken: '600' },
        ])
        .mockResolvedValueOnce([{ completedExercises: '3' }])
        .mockResolvedValueOnce([{ totalLessonTime: '1800' }]);

      const result = await repository.getStatsByUser('user-1');

      expect(result.totalQuestions).toBe(10);
      expect(result.correctAnswers).toBe(7);
      expect(result.incorrectAnswers).toBe(3);
      expect(result.accuracy).toBeCloseTo(70);
      expect(result.completedExercises).toBe(3);
      expect(result.totalTimeSpent).toBe(2400); // 600 + 1800
    });

    it('returns zero stats for a brand-new user with no data', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([
          { totalQuestions: '0', correctAnswers: null, totalTimeTaken: null },
        ])
        .mockResolvedValueOnce([{ completedExercises: '0' }])
        .mockResolvedValueOnce([{ totalLessonTime: null }]);

      const result = await repository.getStatsByUser('new-user');

      expect(result.totalQuestions).toBe(0);
      expect(result.correctAnswers).toBe(0);
      expect(result.incorrectAnswers).toBe(0);
      expect(result.accuracy).toBe(0);
      expect(result.completedExercises).toBe(0);
      expect(result.totalTimeSpent).toBe(0);
    });

    it('computes accuracy as 100% when all exercises are correct', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([
          { totalQuestions: '5', correctAnswers: '5', totalTimeTaken: '300' },
        ])
        .mockResolvedValueOnce([{ completedExercises: '2' }])
        .mockResolvedValueOnce([{ totalLessonTime: '900' }]);

      const result = await repository.getStatsByUser('user-2');

      expect(result.accuracy).toBe(100);
      expect(result.totalTimeSpent).toBe(1200); // 300 + 900
    });

    it('passes userId as parameterized argument to both queries', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([
          { totalQuestions: '0', correctAnswers: null, totalTimeTaken: null },
        ])
        .mockResolvedValueOnce([{ completedExercises: '0' }])
        .mockResolvedValueOnce([{ totalLessonTime: null }]);

      await repository.getStatsByUser('target-user');

      expect(mockDataSource.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('question_attempts'),
        ['target-user'],
      );
      expect(mockDataSource.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('user_question_results'),
        ['target-user'],
      );
      expect(mockDataSource.query).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('learning_progress'),
        ['target-user'],
      );
    });
  });
});
