import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import {
  ProgressTransactionService,
  isLevelHigher,
} from './progress-transaction.service';
import { ProgressRepository } from './progress.repository';
import { UserExerciseResultsRepository } from '../../exercises/application/repositories/user-exercise-results.repository';
import { UserProgress } from '../domain/user-progress.entity';
import { ModuleProgress } from '../domain/module-progress.entity';
import { CourseProgress } from '../domain/course-progress.entity';
import { ExerciseSet } from '../../exercises/domain/exercise-set.entity';
import { ProgressStatus, UserLevel } from '../../../common/enums';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ProgressTransactionService', () => {
  let service: ProgressTransactionService;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockQueryRunner: jest.Mocked<QueryRunner>;
  let mockManager: jest.Mocked<EntityManager>;
  let mockProgressRepo: jest.Mocked<ProgressRepository>;
  let mockExerciseResultsRepo: jest.Mocked<UserExerciseResultsRepository>;

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
      find: jest.fn().mockResolvedValue([]),
      save: jest
        .fn()
        .mockImplementation((_entity, data) =>
          Promise.resolve({ ...existingProgress, ...data }),
        ),
      update: jest.fn().mockResolvedValue({ affected: 0 }),
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
      upsert: jest.fn().mockResolvedValue({ generatedMaps: [] }),
      create: jest.fn().mockImplementation((_entity, data) => data),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressTransactionService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: ProgressRepository, useValue: mockProgressRepo },
        {
          provide: UserExerciseResultsRepository,
          useValue: mockExerciseResultsRepo,
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

    it('updates progress status to COMPLETED with averaged score', async () => {
      const result = await service.completeLessonWithTransaction(
        userId,
        lessonId,
        exerciseResults,
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

    it('throws when progress not found', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.completeLessonWithTransaction(
          userId,
          lessonId,
          exerciseResults,
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
        ),
      ).rejects.toThrow('DB constraint violation');

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

  describe('completeAllCourseProgress', () => {
    const courseId = 'course-1';
    const userId = 'user-1';

    const mockCourse = {
      id: courseId,
      level: UserLevel.A1,
      modules: [
        {
          id: 'mod-1',
          lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }],
        },
        {
          id: 'mod-2',
          lessons: [{ id: 'lesson-3' }],
        },
      ],
    };

    it('throws NotFoundException when course not found', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.completeAllCourseProgress(userId, courseId, UserLevel.B1),
      ).rejects.toThrow(NotFoundException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('throws ForbiddenException when user level not higher than course level', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue({
        ...mockCourse,
        level: UserLevel.B1,
      });

      await expect(
        service.completeAllCourseProgress(userId, courseId, UserLevel.A2),
      ).rejects.toThrow(ForbiddenException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('creates CourseProgress, ModuleProgress, and UserProgress with score=null', async () => {
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockCourse)
        .mockResolvedValue(null);

      await service.completeAllCourseProgress(userId, courseId, UserLevel.B1);

      expect(mockManager.upsert).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId,
          courseId,
          status: ProgressStatus.COMPLETED,
          score: null,
          completedModulesCount: 2,
          totalModulesCount: 2,
        }),
        ['userId', 'courseId'],
      );

      expect(mockManager.upsert).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId,
          moduleId: 'mod-1',
          status: ProgressStatus.COMPLETED,
          score: null,
          completedLessonsCount: 2,
          totalLessonsCount: 2,
        }),
        ['userId', 'moduleId'],
      );

      expect(mockManager.upsert).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId,
          moduleId: 'mod-2',
          status: ProgressStatus.COMPLETED,
          score: null,
          completedLessonsCount: 1,
          totalLessonsCount: 1,
        }),
        ['userId', 'moduleId'],
      );

      expect(mockManager.save).toHaveBeenCalledWith(
        UserProgress,
        expect.objectContaining({
          userId,
          lessonId: 'lesson-1',
          status: ProgressStatus.COMPLETED,
          score: null,
          contentViewed: true,
        }),
      );
      expect(mockManager.save).toHaveBeenCalledWith(
        UserProgress,
        expect.objectContaining({
          userId,
          lessonId: 'lesson-2',
          status: ProgressStatus.COMPLETED,
          score: null,
          contentViewed: true,
        }),
      );
      expect(mockManager.save).toHaveBeenCalledWith(
        UserProgress,
        expect.objectContaining({
          userId,
          lessonId: 'lesson-3',
          status: ProgressStatus.COMPLETED,
          score: null,
          contentViewed: true,
        }),
      );
    });

    it('updates existing UserProgress instead of creating new', async () => {
      const existingProgress = {
        id: 'up-1',
        userId,
        lessonId: 'lesson-1',
        status: ProgressStatus.IN_PROGRESS,
      };

      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockCourse)
        .mockResolvedValueOnce(existingProgress)
        .mockResolvedValue(null);

      await service.completeAllCourseProgress(userId, courseId, UserLevel.B1);

      expect(mockManager.update).toHaveBeenCalledWith(
        UserProgress,
        'up-1',
        expect.objectContaining({
          status: ProgressStatus.COMPLETED,
          score: null,
          contentViewed: true,
        }),
      );
    });

    it('commits transaction on success', async () => {
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockCourse)
        .mockResolvedValue(null);

      await service.completeAllCourseProgress(userId, courseId, UserLevel.B1);

      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
    });

    it('rolls back transaction on error', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(mockCourse);
      (mockManager.upsert as jest.Mock).mockRejectedValue(
        new Error('DB error'),
      );

      await expect(
        service.completeAllCourseProgress(userId, courseId, UserLevel.B1),
      ).rejects.toThrow('DB error');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });
  });

  describe('resetCourseProgress', () => {
    const courseId = 'course-1';
    const userId = 'user-1';

    const mockCourse = {
      id: courseId,
      modules: [
        {
          id: 'mod-1',
          lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }],
        },
      ],
    };

    it('throws NotFoundException when course not found', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.resetCourseProgress(userId, courseId),
      ).rejects.toThrow(NotFoundException);
    });

    it('deletes CourseProgress, ModuleProgress, UserProgress, UserExerciseResults, and soft-deletes custom ExerciseSets', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockCourse);
      (mockManager.find as jest.Mock).mockResolvedValue([
        { id: 'ex-1' },
        { id: 'ex-2' },
      ]);

      await service.resetCourseProgress(userId, courseId);

      expect(mockManager.delete).toHaveBeenCalledWith(CourseProgress, {
        userId,
        courseId,
      });

      expect(mockManager.delete).toHaveBeenCalledWith(ModuleProgress, {
        userId,
        moduleId: expect.anything(),
      });

      expect(mockManager.delete).toHaveBeenCalledWith(UserProgress, {
        userId,
        lessonId: expect.anything(),
      });

      expect(mockManager.delete).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId,
        }),
      );

      expect(mockManager.update).toHaveBeenCalledWith(
        ExerciseSet,
        { isCustom: true, courseId },
        expect.objectContaining({ deletedAt: expect.any(Date) }),
      );
    });

    it('handles course with no modules gracefully', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue({
        id: courseId,
        modules: [],
      });

      await service.resetCourseProgress(userId, courseId);

      expect(mockManager.delete).toHaveBeenCalledWith(CourseProgress, {
        userId,
        courseId,
      });
      expect(mockManager.delete).toHaveBeenCalledTimes(1);
    });

    it('commits transaction on success', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockCourse);
      (mockManager.find as jest.Mock).mockResolvedValue([]);

      await service.resetCourseProgress(userId, courseId);

      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('rolls back transaction on error', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValue(mockCourse);
      (mockManager.delete as jest.Mock).mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(
        service.resetCourseProgress(userId, courseId),
      ).rejects.toThrow('Delete failed');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('isLevelHigher', () => {
    it('returns true when user level is higher', () => {
      expect(isLevelHigher(UserLevel.B1, UserLevel.A1)).toBe(true);
      expect(isLevelHigher(UserLevel.C2, UserLevel.C1)).toBe(true);
    });

    it('returns false when levels are equal', () => {
      expect(isLevelHigher(UserLevel.A1, UserLevel.A1)).toBe(false);
      expect(isLevelHigher(UserLevel.B2, UserLevel.B2)).toBe(false);
    });

    it('returns false when user level is lower', () => {
      expect(isLevelHigher(UserLevel.A1, UserLevel.B1)).toBe(false);
      expect(isLevelHigher(UserLevel.A2, UserLevel.C2)).toBe(false);
    });
  });
});
