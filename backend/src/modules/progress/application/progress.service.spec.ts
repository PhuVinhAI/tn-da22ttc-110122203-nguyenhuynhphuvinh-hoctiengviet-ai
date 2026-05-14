import { ProgressService } from './progress.service';
import { ProgressRepository } from './progress.repository';
import { ModuleProgressRepository } from './module-progress.repository';
import { CourseProgressRepository } from './course-progress.repository';
import { ModulesRepository } from '../../courses/application/repositories/modules.repository';
import { CoursesRepository } from '../../courses/application/repositories/courses.repository';
import { ProgressTransactionService } from './progress-transaction.service';
import { ProgressStatus, UserLevel } from '../../../common/enums';
import {
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

describe('ProgressService', () => {
  let service: ProgressService;
  let progressRepo: jest.Mocked<ProgressRepository>;
  let moduleProgressRepo: jest.Mocked<ModuleProgressRepository>;
  let courseProgressRepo: jest.Mocked<CourseProgressRepository>;
  let modulesRepo: jest.Mocked<ModulesRepository>;
  let coursesRepo: jest.Mocked<CoursesRepository>;
  let transactionService: jest.Mocked<ProgressTransactionService>;

  beforeEach(() => {
    progressRepo = {
      findByUserAndLesson: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findCompletedByUserInLessons: jest.fn(),
    } as any;

    moduleProgressRepo = {
      findByUserAndModule: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findCompletedByUserInModules: jest.fn(),
    } as any;

    courseProgressRepo = {
      findByUserAndCourse: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as any;

    modulesRepo = {
      findById: jest.fn(),
    } as any;

    coursesRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
    } as any;

    transactionService = {
      completeAllCourseProgress: jest.fn(),
      resetCourseProgress: jest.fn(),
    } as any;

    service = new ProgressService(
      progressRepo,
      moduleProgressRepo,
      courseProgressRepo,
      modulesRepo,
      coursesRepo,
      transactionService,
    );
  });

  describe('markContentReviewed', () => {
    it('creates progress with contentViewed=true when no existing progress', async () => {
      progressRepo.findByUserAndLesson.mockResolvedValue(null);
      progressRepo.create.mockResolvedValue({
        id: 'p-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        status: ProgressStatus.IN_PROGRESS,
        contentViewed: true,
        lastAccessedAt: expect.any(Date),
      } as any);

      const result = await service.markContentReviewed('user-1', 'lesson-1');

      expect(progressRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          lessonId: 'lesson-1',
          contentViewed: true,
          status: ProgressStatus.IN_PROGRESS,
        }),
      );
      expect(result.contentViewed).toBe(true);
    });

    it('updates existing progress to contentViewed=true', async () => {
      const existing = {
        id: 'p-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        status: ProgressStatus.IN_PROGRESS,
        contentViewed: false,
        lastAccessedAt: new Date(),
      };
      progressRepo.findByUserAndLesson.mockResolvedValue(existing as any);
      progressRepo.update.mockResolvedValue({
        ...existing,
        contentViewed: true,
      } as any);

      const result = await service.markContentReviewed('user-1', 'lesson-1');

      expect(progressRepo.update).toHaveBeenCalledWith('p-1', {
        contentViewed: true,
        lastAccessedAt: expect.any(Date),
      });
      expect(result.contentViewed).toBe(true);
    });

    it('does not reset contentViewed if already true', async () => {
      const existing = {
        id: 'p-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        status: ProgressStatus.IN_PROGRESS,
        contentViewed: true,
        lastAccessedAt: new Date(),
      };
      progressRepo.findByUserAndLesson.mockResolvedValue(existing as any);
      progressRepo.update.mockResolvedValue(existing as any);

      await service.markContentReviewed('user-1', 'lesson-1');

      expect(progressRepo.update).toHaveBeenCalledWith('p-1', {
        contentViewed: true,
        lastAccessedAt: expect.any(Date),
      });
    });
  });

  describe('completeLesson', () => {
    it('rejects completion when contentViewed is false', async () => {
      const progress = {
        id: 'p-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        status: ProgressStatus.IN_PROGRESS,
        contentViewed: false,
      };
      progressRepo.findByUserAndLesson.mockResolvedValue(progress as any);

      await expect(
        service.completeLesson('user-1', 'lesson-1', 80),
      ).rejects.toThrow('Content must be viewed before completing lesson');
    });

    it('allows completion when contentViewed=true', async () => {
      const progress = {
        id: 'p-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        status: ProgressStatus.IN_PROGRESS,
        contentViewed: true,
        lesson: { moduleId: 'mod-1' },
      };
      progressRepo.findByUserAndLesson.mockResolvedValue(progress as any);
      progressRepo.update.mockResolvedValue({
        ...progress,
        status: ProgressStatus.COMPLETED,
        score: 80,
      } as any);
      modulesRepo.findById.mockResolvedValue(null);

      const result = await service.completeLesson('user-1', 'lesson-1', 80);

      expect(result.status).toBe(ProgressStatus.COMPLETED);
    });

    it('creates ModuleProgress when all lessons in module are completed', async () => {
      const progress = {
        id: 'p-1',
        userId: 'user-1',
        lessonId: 'lesson-2',
        status: ProgressStatus.IN_PROGRESS,
        contentViewed: true,
        lesson: { moduleId: 'mod-1' },
      };
      progressRepo.findByUserAndLesson.mockResolvedValue(progress as any);
      progressRepo.update.mockResolvedValue({
        ...progress,
        status: ProgressStatus.COMPLETED,
        score: 90,
      } as any);

      modulesRepo.findById.mockResolvedValue({
        id: 'mod-1',
        courseId: 'course-1',
        lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }],
      } as any);

      progressRepo.findCompletedByUserInLessons.mockResolvedValue([
        { score: 80 } as any,
        { score: 90 } as any,
      ]);

      moduleProgressRepo.findByUserAndModule.mockResolvedValue(null);
      moduleProgressRepo.create.mockResolvedValue({
        id: 'mp-1',
        userId: 'user-1',
        moduleId: 'mod-1',
        status: ProgressStatus.COMPLETED,
        score: 85,
        completedLessonsCount: 2,
        totalLessonsCount: 2,
      } as any);

      coursesRepo.findById.mockResolvedValue(null);

      await service.completeLesson('user-1', 'lesson-2', 90);

      expect(moduleProgressRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          moduleId: 'mod-1',
          status: ProgressStatus.COMPLETED,
          score: 85,
          completedLessonsCount: 2,
          totalLessonsCount: 2,
        }),
      );
    });

    it('does not create ModuleProgress when not all lessons are completed', async () => {
      const progress = {
        id: 'p-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        status: ProgressStatus.IN_PROGRESS,
        contentViewed: true,
        lesson: { moduleId: 'mod-1' },
      };
      progressRepo.findByUserAndLesson.mockResolvedValue(progress as any);
      progressRepo.update.mockResolvedValue({
        ...progress,
        status: ProgressStatus.COMPLETED,
        score: 80,
      } as any);

      modulesRepo.findById.mockResolvedValue({
        id: 'mod-1',
        courseId: 'course-1',
        lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }, { id: 'lesson-3' }],
      } as any);

      progressRepo.findCompletedByUserInLessons.mockResolvedValue([
        { score: 80 } as any,
      ]);

      await service.completeLesson('user-1', 'lesson-1', 80);

      expect(moduleProgressRepo.create).not.toHaveBeenCalled();
    });

    it('updates existing ModuleProgress to COMPLETED when re-completing module', async () => {
      const progress = {
        id: 'p-1',
        userId: 'user-1',
        lessonId: 'lesson-2',
        status: ProgressStatus.IN_PROGRESS,
        contentViewed: true,
        lesson: { moduleId: 'mod-1' },
      };
      progressRepo.findByUserAndLesson.mockResolvedValue(progress as any);
      progressRepo.update.mockResolvedValue({
        ...progress,
        status: ProgressStatus.COMPLETED,
        score: 90,
      } as any);

      modulesRepo.findById.mockResolvedValue({
        id: 'mod-1',
        courseId: 'course-1',
        lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }],
      } as any);

      progressRepo.findCompletedByUserInLessons.mockResolvedValue([
        { score: 80 } as any,
        { score: 90 } as any,
      ]);

      const existingModuleProgress = {
        id: 'mp-1',
        userId: 'user-1',
        moduleId: 'mod-1',
        status: ProgressStatus.IN_PROGRESS,
      };
      moduleProgressRepo.findByUserAndModule.mockResolvedValue(
        existingModuleProgress as any,
      );
      moduleProgressRepo.update.mockResolvedValue({
        ...existingModuleProgress,
        status: ProgressStatus.COMPLETED,
      } as any);

      coursesRepo.findById.mockResolvedValue(null);

      await service.completeLesson('user-1', 'lesson-2', 90);

      expect(moduleProgressRepo.update).toHaveBeenCalledWith(
        'mp-1',
        expect.objectContaining({
          status: ProgressStatus.COMPLETED,
          score: 85,
          completedLessonsCount: 2,
          totalLessonsCount: 2,
        }),
      );
      expect(moduleProgressRepo.create).not.toHaveBeenCalled();
    });

    it('creates CourseProgress when all modules in course are completed', async () => {
      const progress = {
        id: 'p-1',
        userId: 'user-1',
        lessonId: 'lesson-2',
        status: ProgressStatus.IN_PROGRESS,
        contentViewed: true,
        lesson: { moduleId: 'mod-2' },
      };
      progressRepo.findByUserAndLesson.mockResolvedValue(progress as any);
      progressRepo.update.mockResolvedValue({
        ...progress,
        status: ProgressStatus.COMPLETED,
        score: 90,
      } as any);

      modulesRepo.findById.mockResolvedValue({
        id: 'mod-2',
        courseId: 'course-1',
        lessons: [{ id: 'lesson-2' }],
      } as any);

      progressRepo.findCompletedByUserInLessons.mockResolvedValue([
        { score: 90 } as any,
      ]);

      moduleProgressRepo.findByUserAndModule.mockResolvedValue(null);
      moduleProgressRepo.create.mockResolvedValue({
        id: 'mp-2',
        userId: 'user-1',
        moduleId: 'mod-2',
        status: ProgressStatus.COMPLETED,
        score: 90,
      } as any);

      coursesRepo.findById.mockResolvedValue({
        id: 'course-1',
        modules: [{ id: 'mod-1' }, { id: 'mod-2' }],
      } as any);

      moduleProgressRepo.findCompletedByUserInModules.mockResolvedValue([
        { id: 'mp-1', score: 80 } as any,
        { id: 'mp-2', score: 90 } as any,
      ]);

      courseProgressRepo.findByUserAndCourse.mockResolvedValue(null);
      courseProgressRepo.create.mockResolvedValue({
        id: 'cp-1',
        userId: 'user-1',
        courseId: 'course-1',
        status: ProgressStatus.COMPLETED,
        score: 85,
        completedModulesCount: 2,
        totalModulesCount: 2,
      } as any);

      await service.completeLesson('user-1', 'lesson-2', 90);

      expect(courseProgressRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          courseId: 'course-1',
          status: ProgressStatus.COMPLETED,
          score: 85,
          completedModulesCount: 2,
          totalModulesCount: 2,
        }),
      );
    });

    it('does not create CourseProgress when not all modules are completed', async () => {
      const progress = {
        id: 'p-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        status: ProgressStatus.IN_PROGRESS,
        contentViewed: true,
        lesson: { moduleId: 'mod-1' },
      };
      progressRepo.findByUserAndLesson.mockResolvedValue(progress as any);
      progressRepo.update.mockResolvedValue({
        ...progress,
        status: ProgressStatus.COMPLETED,
        score: 80,
      } as any);

      modulesRepo.findById.mockResolvedValue({
        id: 'mod-1',
        courseId: 'course-1',
        lessons: [{ id: 'lesson-1' }],
      } as any);

      progressRepo.findCompletedByUserInLessons.mockResolvedValue([
        { score: 80 } as any,
      ]);

      moduleProgressRepo.findByUserAndModule.mockResolvedValue(null);
      moduleProgressRepo.create.mockResolvedValue({
        id: 'mp-1',
        userId: 'user-1',
        moduleId: 'mod-1',
        status: ProgressStatus.COMPLETED,
        score: 80,
      } as any);

      coursesRepo.findById.mockResolvedValue({
        id: 'course-1',
        modules: [{ id: 'mod-1' }, { id: 'mod-2' }, { id: 'mod-3' }],
      } as any);

      moduleProgressRepo.findCompletedByUserInModules.mockResolvedValue([
        { id: 'mp-1', score: 80 } as any,
      ]);

      await service.completeLesson('user-1', 'lesson-1', 80);

      expect(courseProgressRepo.create).not.toHaveBeenCalled();
    });

    it('calculates average score correctly with null scores', async () => {
      const progress = {
        id: 'p-1',
        userId: 'user-1',
        lessonId: 'lesson-2',
        status: ProgressStatus.IN_PROGRESS,
        contentViewed: true,
        lesson: { moduleId: 'mod-1' },
      };
      progressRepo.findByUserAndLesson.mockResolvedValue(progress as any);
      progressRepo.update.mockResolvedValue({
        ...progress,
        status: ProgressStatus.COMPLETED,
        score: 90,
      } as any);

      modulesRepo.findById.mockResolvedValue({
        id: 'mod-1',
        courseId: 'course-1',
        lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }],
      } as any);

      progressRepo.findCompletedByUserInLessons.mockResolvedValue([
        { score: null } as any,
        { score: 90 } as any,
      ]);

      moduleProgressRepo.findByUserAndModule.mockResolvedValue(null);
      moduleProgressRepo.create.mockResolvedValue({
        id: 'mp-1',
        userId: 'user-1',
        moduleId: 'mod-1',
        status: ProgressStatus.COMPLETED,
      } as any);

      coursesRepo.findById.mockResolvedValue(null);

      await service.completeLesson('user-1', 'lesson-2', 90);

      expect(moduleProgressRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 45,
        }),
      );
    });
  });

  describe('getLessonExerciseStatus', () => {
    it('returns contentViewed status', async () => {
      progressRepo.findByUserAndLesson.mockResolvedValue({
        contentViewed: true,
      } as any);

      const result = await service.getLessonExerciseStatus(
        'user-1',
        'lesson-1',
      );

      expect(result.contentViewed).toBe(true);
      expect(result.hasIncompleteSet).toBe(false);
      expect(result.incompleteSetId).toBeNull();
    });

    it('returns false when no progress exists', async () => {
      progressRepo.findByUserAndLesson.mockResolvedValue(null);

      const result = await service.getLessonExerciseStatus(
        'user-1',
        'lesson-1',
      );

      expect(result.contentViewed).toBe(false);
    });
  });

  describe('getModuleProgress', () => {
    it('returns module progress for authenticated user', async () => {
      const moduleProgress = {
        id: 'mp-1',
        userId: 'user-1',
        moduleId: 'mod-1',
        status: ProgressStatus.COMPLETED,
        score: 85,
        completedLessonsCount: 3,
        totalLessonsCount: 3,
      };
      moduleProgressRepo.findByUserAndModule.mockResolvedValue(
        moduleProgress as any,
      );

      const result = await service.getModuleProgress('user-1', 'mod-1');

      expect(result).toEqual(moduleProgress);
    });

    it('throws NotFoundException when no module progress exists', async () => {
      moduleProgressRepo.findByUserAndModule.mockResolvedValue(null);

      await expect(
        service.getModuleProgress('user-1', 'mod-1'),
      ).rejects.toThrow('Module progress not found');
    });
  });

  describe('getCourseProgress', () => {
    it('returns course progress for authenticated user', async () => {
      const courseProgress = {
        id: 'cp-1',
        userId: 'user-1',
        courseId: 'course-1',
        status: ProgressStatus.COMPLETED,
        score: 85,
        completedModulesCount: 2,
        totalModulesCount: 2,
      };
      courseProgressRepo.findByUserAndCourse.mockResolvedValue(
        courseProgress as any,
      );

      const result = await service.getCourseProgress('user-1', 'course-1');

      expect(result).toEqual(courseProgress);
    });

    it('throws NotFoundException when no course progress exists', async () => {
      courseProgressRepo.findByUserAndCourse.mockResolvedValue(null);

      await expect(
        service.getCourseProgress('user-1', 'course-1'),
      ).rejects.toThrow('Course progress not found');
    });
  });

  describe('completeAllCourseProgress', () => {
    it('delegates to transaction service', async () => {
      transactionService.completeAllCourseProgress.mockResolvedValue(undefined);

      await service.completeAllCourseProgress(
        'user-1',
        'course-1',
        UserLevel.B1,
      );

      expect(transactionService.completeAllCourseProgress).toHaveBeenCalledWith(
        'user-1',
        'course-1',
        UserLevel.B1,
      );
    });

    it('propagates NotFoundException from transaction service', async () => {
      transactionService.completeAllCourseProgress.mockRejectedValue(
        new NotFoundException('Course not found'),
      );

      await expect(
        service.completeAllCourseProgress('user-1', 'course-x', UserLevel.B1),
      ).rejects.toThrow('Course not found');
    });

    it('propagates ForbiddenException when user level too low', async () => {
      transactionService.completeAllCourseProgress.mockRejectedValue(
        new ForbiddenException('User level must be higher than course level'),
      );

      await expect(
        service.completeAllCourseProgress('user-1', 'course-1', UserLevel.A1),
      ).rejects.toThrow('User level must be higher than course level');
    });
  });

  describe('resetCourseProgress', () => {
    it('delegates to transaction service', async () => {
      transactionService.resetCourseProgress.mockResolvedValue(undefined);

      await service.resetCourseProgress('user-1', 'course-1');

      expect(transactionService.resetCourseProgress).toHaveBeenCalledWith(
        'user-1',
        'course-1',
      );
    });

    it('propagates NotFoundException when course not found', async () => {
      transactionService.resetCourseProgress.mockRejectedValue(
        new NotFoundException('Course not found'),
      );

      await expect(
        service.resetCourseProgress('user-1', 'course-x'),
      ).rejects.toThrow('Course not found');
    });

    it('can be called multiple times idempotently', async () => {
      transactionService.resetCourseProgress.mockResolvedValue(undefined);

      await service.resetCourseProgress('user-1', 'course-1');
      await service.resetCourseProgress('user-1', 'course-1');

      expect(transactionService.resetCourseProgress).toHaveBeenCalledTimes(2);
    });
  });

  describe('completeAllLowerCourses', () => {
    it('completes all courses below user level', async () => {
      coursesRepo.findAll.mockResolvedValue([
        { id: 'c-a1', level: UserLevel.A1 },
        { id: 'c-a2', level: UserLevel.A2 },
        { id: 'c-b1', level: UserLevel.B1 },
      ] as any);
      transactionService.completeAllCourseProgress.mockResolvedValue(undefined);

      await service.completeAllLowerCourses('user-1', UserLevel.B1);

      expect(
        transactionService.completeAllCourseProgress,
      ).toHaveBeenCalledTimes(2);
      expect(transactionService.completeAllCourseProgress).toHaveBeenCalledWith(
        'user-1',
        'c-a1',
        UserLevel.B1,
      );
      expect(transactionService.completeAllCourseProgress).toHaveBeenCalledWith(
        'user-1',
        'c-a2',
        UserLevel.B1,
      );
    });

    it('skips when no lower courses exist', async () => {
      coursesRepo.findAll.mockResolvedValue([
        { id: 'c-b1', level: UserLevel.B1 },
        { id: 'c-b2', level: UserLevel.B2 },
      ] as any);

      await service.completeAllLowerCourses('user-1', UserLevel.A1);

      expect(
        transactionService.completeAllCourseProgress,
      ).not.toHaveBeenCalled();
    });

    it('does nothing when there are no courses at all', async () => {
      coursesRepo.findAll.mockResolvedValue([]);

      await service.completeAllLowerCourses('user-1', UserLevel.B2);

      expect(
        transactionService.completeAllCourseProgress,
      ).not.toHaveBeenCalled();
    });

    it('completes only courses strictly below user level', async () => {
      coursesRepo.findAll.mockResolvedValue([
        { id: 'c-a1', level: UserLevel.A1 },
        { id: 'c-a2', level: UserLevel.A2 },
        { id: 'c-b1', level: UserLevel.B1 },
      ] as any);
      transactionService.completeAllCourseProgress.mockResolvedValue(undefined);

      await service.completeAllLowerCourses('user-1', UserLevel.B1);

      expect(
        transactionService.completeAllCourseProgress,
      ).toHaveBeenCalledTimes(2);
    });
  });
});
