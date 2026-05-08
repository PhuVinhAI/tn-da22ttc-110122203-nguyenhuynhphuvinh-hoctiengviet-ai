import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { ProgressTransactionService } from './progress-transaction.service';
import { ProgressRepository } from './progress.repository';
import { UserExerciseResultsRepository } from '../../exercises/application/repositories/user-exercise-results.repository';
import { UserVocabulariesRepository } from '../../vocabularies/application/repositories/user-vocabularies.repository';
import { UserProgress } from '../domain/user-progress.entity';
import { ProgressStatus, MasteryLevel } from '../../../common/enums';

describe('ProgressTransactionService', () => {
  let service: ProgressTransactionService;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockQueryRunner: jest.Mocked<QueryRunner>;
  let mockManager: jest.Mocked<EntityManager>;
  let mockProgressRepo: jest.Mocked<ProgressRepository>;
  let mockExerciseResultsRepo: jest.Mocked<UserExerciseResultsRepository>;
  let mockVocabulariesRepo: jest.Mocked<UserVocabulariesRepository>;

  const userId = 'user-1';
  const lessonId = 'lesson-1';

  const existingProgress: Partial<UserProgress> = {
    id: 'progress-1',
    userId,
    lessonId,
    status: ProgressStatus.IN_PROGRESS,
    score: undefined,
    completedAt: undefined,
    lastAccessedAt: new Date(),
  };

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn().mockResolvedValue(existingProgress),
      save: jest
        .fn()
        .mockImplementation((_entity, data) =>
          Promise.resolve({ ...existingProgress, ...data }),
        ),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    } as any;

    mockQueryRunner = {
      manager: mockManager,
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      manager: mockManager,
    } as any;

    mockProgressRepo = {} as any;

    mockExerciseResultsRepo = {
      upsertResult: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockVocabulariesRepo = {
      updateMastery: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressTransactionService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: ProgressRepository, useValue: mockProgressRepo },
        {
          provide: UserExerciseResultsRepository,
          useValue: mockExerciseResultsRepo,
        },
        {
          provide: UserVocabulariesRepository,
          useValue: mockVocabulariesRepo,
        },
      ],
    }).compile();

    service = module.get<ProgressTransactionService>(
      ProgressTransactionService,
    );
  });

  describe('completeLessonWithTransaction', () => {
    const exerciseResults = [
      { exerciseId: 'ex-1', score: 80, isCorrect: true },
      { exerciseId: 'ex-2', score: 60, isCorrect: false },
    ];

    const vocabularyUpdates = [
      { vocabularyId: 'vocab-1', masteryLevel: MasteryLevel.FAMILIAR },
      { vocabularyId: 'vocab-2', masteryLevel: MasteryLevel.MASTERED },
    ];

    it('updates progress status to COMPLETED with averaged score', async () => {
      const result = await service.completeLessonWithTransaction(
        userId,
        lessonId,
        exerciseResults,
        vocabularyUpdates,
      );

      expect(result.status).toBe(ProgressStatus.COMPLETED);
      expect(result.score).toBe(70);
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(mockManager.save).toHaveBeenCalledWith(
        UserProgress,
        expect.objectContaining({
          status: ProgressStatus.COMPLETED,
          score: 70,
        }),
      );
    });

    it('upserts each exercise result via repository', async () => {
      await service.completeLessonWithTransaction(
        userId,
        lessonId,
        exerciseResults,
        vocabularyUpdates,
      );

      expect(mockExerciseResultsRepo.upsertResult).toHaveBeenCalledTimes(2);
      expect(mockExerciseResultsRepo.upsertResult).toHaveBeenCalledWith(
        mockManager,
        userId,
        'ex-1',
        80,
        true,
      );
      expect(mockExerciseResultsRepo.upsertResult).toHaveBeenCalledWith(
        mockManager,
        userId,
        'ex-2',
        60,
        false,
      );
    });

    it('updates each vocabulary mastery via repository', async () => {
      await service.completeLessonWithTransaction(
        userId,
        lessonId,
        exerciseResults,
        vocabularyUpdates,
      );

      expect(mockVocabulariesRepo.updateMastery).toHaveBeenCalledTimes(2);
      expect(mockVocabulariesRepo.updateMastery).toHaveBeenCalledWith(
        mockManager,
        userId,
        'vocab-1',
        MasteryLevel.FAMILIAR,
      );
      expect(mockVocabulariesRepo.updateMastery).toHaveBeenCalledWith(
        mockManager,
        userId,
        'vocab-2',
        MasteryLevel.MASTERED,
      );
    });

    it('throws when progress not found', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.completeLessonWithTransaction(
          userId,
          lessonId,
          exerciseResults,
          vocabularyUpdates,
        ),
      ).rejects.toThrow('Progress not found');
    });

    it('rolls back transaction when exercise result upsert fails', async () => {
      (mockExerciseResultsRepo.upsertResult as jest.Mock).mockRejectedValue(
        new Error('DB constraint violation'),
      );

      await expect(
        service.completeLessonWithTransaction(
          userId,
          lessonId,
          exerciseResults,
          vocabularyUpdates,
        ),
      ).rejects.toThrow('DB constraint violation');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('rolls back transaction when vocabulary mastery update fails', async () => {
      (mockVocabulariesRepo.updateMastery as jest.Mock).mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(
        service.completeLessonWithTransaction(
          userId,
          lessonId,
          exerciseResults,
          vocabularyUpdates,
        ),
      ).rejects.toThrow('Update failed');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('rolls back transaction when progress save fails', async () => {
      (mockManager.save as jest.Mock).mockRejectedValue(
        new Error('Save failed'),
      );

      await expect(
        service.completeLessonWithTransaction(
          userId,
          lessonId,
          exerciseResults,
          vocabularyUpdates,
        ),
      ).rejects.toThrow('Save failed');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('commits transaction on success', async () => {
      await service.completeLessonWithTransaction(
        userId,
        lessonId,
        exerciseResults,
        vocabularyUpdates,
      );

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('batchUpdateProgress', () => {
    it('updates each progress entry via manager.update', async () => {
      const updates = [
        {
          userId: 'user-1',
          lessonId: 'lesson-1',
          status: ProgressStatus.COMPLETED,
          score: 85,
        },
        {
          userId: 'user-2',
          lessonId: 'lesson-2',
          status: ProgressStatus.IN_PROGRESS,
        },
      ];

      await service.batchUpdateProgress(updates);

      expect(mockManager.update).toHaveBeenCalledTimes(2);
      expect(mockManager.update).toHaveBeenCalledWith(
        UserProgress,
        { userId: 'user-1', lessonId: 'lesson-1' },
        { status: ProgressStatus.COMPLETED, score: 85 },
      );
      expect(mockManager.update).toHaveBeenCalledWith(
        UserProgress,
        { userId: 'user-2', lessonId: 'lesson-2' },
        { status: ProgressStatus.IN_PROGRESS },
      );
    });

    it('rolls back when one update fails', async () => {
      (mockManager.update as jest.Mock)
        .mockResolvedValueOnce({ affected: 1 })
        .mockRejectedValueOnce(new Error('Update failed'));

      await expect(
        service.batchUpdateProgress([
          {
            userId: 'user-1',
            lessonId: 'lesson-1',
            status: ProgressStatus.COMPLETED,
          },
          {
            userId: 'user-2',
            lessonId: 'lesson-2',
            status: ProgressStatus.IN_PROGRESS,
          },
        ]),
      ).rejects.toThrow('Update failed');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });
  });
});
