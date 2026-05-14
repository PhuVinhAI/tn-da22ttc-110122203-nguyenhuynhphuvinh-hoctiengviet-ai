import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ProgressRepository } from './progress.repository';
import { ModuleProgressRepository } from './module-progress.repository';
import { CourseProgressRepository } from './course-progress.repository';
import { ModulesRepository } from '../../courses/application/repositories/modules.repository';
import { CoursesRepository } from '../../courses/application/repositories/courses.repository';
import {
  ProgressTransactionService,
  isLevelHigher,
} from './progress-transaction.service';
import { UserProgress } from '../domain/user-progress.entity';
import { ModuleProgress } from '../domain/module-progress.entity';
import { CourseProgress } from '../domain/course-progress.entity';
import { ProgressStatus, UserLevel } from '../../../common/enums';

@Injectable()
export class ProgressService {
  constructor(
    private readonly progressRepository: ProgressRepository,
    private readonly moduleProgressRepository: ModuleProgressRepository,
    private readonly courseProgressRepository: CourseProgressRepository,
    private readonly modulesRepository: ModulesRepository,
    private readonly coursesRepository: CoursesRepository,
    private readonly progressTransactionService: ProgressTransactionService,
  ) {}

  async startLesson(userId: string, lessonId: string): Promise<UserProgress> {
    const existing = await this.progressRepository.findByUserAndLesson(
      userId,
      lessonId,
    );

    if (existing) {
      return this.progressRepository.update(existing.id, {
        status: ProgressStatus.IN_PROGRESS,
        lastAccessedAt: new Date(),
      });
    }

    return this.progressRepository.create({
      userId,
      lessonId,
      status: ProgressStatus.IN_PROGRESS,
      lastAccessedAt: new Date(),
    });
  }

  async markContentReviewed(
    userId: string,
    lessonId: string,
  ): Promise<UserProgress> {
    const existing = await this.progressRepository.findByUserAndLesson(
      userId,
      lessonId,
    );

    if (existing) {
      return this.progressRepository.update(existing.id, {
        contentViewed: true,
        lastAccessedAt: new Date(),
      });
    }

    return this.progressRepository.create({
      userId,
      lessonId,
      contentViewed: true,
      status: ProgressStatus.IN_PROGRESS,
      lastAccessedAt: new Date(),
    });
  }

  async completeLesson(
    userId: string,
    lessonId: string,
    score: number,
  ): Promise<UserProgress> {
    const progress = await this.progressRepository.findByUserAndLesson(
      userId,
      lessonId,
    );

    if (!progress) {
      throw new Error('Progress not found');
    }

    if (!progress.contentViewed) {
      throw new BadRequestException(
        'Content must be viewed before completing lesson',
      );
    }

    const updated = await this.progressRepository.update(progress.id, {
      status: ProgressStatus.COMPLETED,
      score,
      completedAt: new Date(),
      lastAccessedAt: new Date(),
    });

    const moduleId = (progress as any).lesson?.moduleId;
    if (moduleId) {
      await this.checkModuleCompletion(userId, moduleId);
    }

    return updated;
  }

  private async checkModuleCompletion(
    userId: string,
    moduleId: string,
  ): Promise<void> {
    const module = await this.modulesRepository.findById(moduleId);
    if (!module?.lessons?.length) return;

    const lessonIds = module.lessons.map((l: any) => l.id);
    const completedProgress =
      await this.progressRepository.findCompletedByUserInLessons(
        userId,
        lessonIds,
      );

    const completedLessonsCount = completedProgress.length;
    const totalLessonsCount = lessonIds.length;

    if (completedLessonsCount < totalLessonsCount) return;

    const avgScore =
      completedProgress.reduce((sum, p) => sum + (p.score ?? 0), 0) /
      completedLessonsCount;

    const existingModuleProgress =
      await this.moduleProgressRepository.findByUserAndModule(userId, moduleId);

    if (existingModuleProgress) {
      await this.moduleProgressRepository.update(existingModuleProgress.id, {
        status: ProgressStatus.COMPLETED,
        score: avgScore,
        completedAt: new Date(),
        completedLessonsCount,
        totalLessonsCount,
      });
    } else {
      await this.moduleProgressRepository.create({
        userId,
        moduleId,
        status: ProgressStatus.COMPLETED,
        score: avgScore,
        completedAt: new Date(),
        completedLessonsCount,
        totalLessonsCount,
      });
    }

    const courseId = module.courseId;
    if (courseId) {
      await this.checkCourseCompletion(userId, courseId);
    }
  }

  private async checkCourseCompletion(
    userId: string,
    courseId: string,
  ): Promise<void> {
    const course = await this.coursesRepository.findById(courseId);
    if (!course?.modules?.length) return;

    const moduleIds = course.modules.map((m: any) => m.id);
    const completedModuleProgress =
      await this.moduleProgressRepository.findCompletedByUserInModules(
        userId,
        moduleIds,
      );

    const completedModulesCount = completedModuleProgress.length;
    const totalModulesCount = moduleIds.length;

    if (completedModulesCount < totalModulesCount) return;

    const avgScore =
      completedModuleProgress.reduce((sum, p) => sum + (p.score ?? 0), 0) /
      completedModulesCount;

    const existingCourseProgress =
      await this.courseProgressRepository.findByUserAndCourse(userId, courseId);

    if (existingCourseProgress) {
      await this.courseProgressRepository.update(existingCourseProgress.id, {
        status: ProgressStatus.COMPLETED,
        score: avgScore,
        completedAt: new Date(),
        completedModulesCount,
        totalModulesCount,
      });
    } else {
      await this.courseProgressRepository.create({
        userId,
        courseId,
        status: ProgressStatus.COMPLETED,
        score: avgScore,
        completedAt: new Date(),
        completedModulesCount,
        totalModulesCount,
      });
    }
  }

  async updateTimeSpent(
    userId: string,
    lessonId: string,
    additionalTime: number,
  ): Promise<UserProgress> {
    const progress = await this.progressRepository.findByUserAndLesson(
      userId,
      lessonId,
    );

    if (!progress) {
      throw new Error('Progress not found');
    }

    const currentTimeSpent = progress.timeSpent ?? 0;
    const newTimeSpent = currentTimeSpent + (additionalTime || 0);

    return this.progressRepository.update(progress.id, {
      timeSpent: newTimeSpent,
      lastAccessedAt: new Date(),
    });
  }

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return this.progressRepository.findByUserId(userId);
  }

  async getLessonProgress(
    userId: string,
    lessonId: string,
  ): Promise<UserProgress | null> {
    return this.progressRepository.findByUserAndLesson(userId, lessonId);
  }

  async getModuleProgress(
    userId: string,
    moduleId: string,
  ): Promise<ModuleProgress> {
    const progress = await this.moduleProgressRepository.findByUserAndModule(
      userId,
      moduleId,
    );
    if (!progress) {
      throw new NotFoundException('Module progress not found');
    }
    return progress;
  }

  async getCourseProgress(
    userId: string,
    courseId: string,
  ): Promise<CourseProgress> {
    const progress = await this.courseProgressRepository.findByUserAndCourse(
      userId,
      courseId,
    );
    if (!progress) {
      throw new NotFoundException('Course progress not found');
    }
    return progress;
  }

  async getLessonExerciseStatus(
    userId: string,
    lessonId: string,
  ): Promise<{
    contentViewed: boolean;
    hasIncompleteSet: boolean;
    incompleteSetId: string | null;
    incompleteSetAttempted: number;
    incompleteSetTotal: number;
  }> {
    const progress = await this.progressRepository.findByUserAndLesson(
      userId,
      lessonId,
    );

    const contentViewed = progress?.contentViewed ?? false;

    return {
      contentViewed,
      hasIncompleteSet: false,
      incompleteSetId: null,
      incompleteSetAttempted: 0,
      incompleteSetTotal: 0,
    };
  }

  async completeAllCourseProgress(
    userId: string,
    courseId: string,
    userLevel: UserLevel,
  ): Promise<void> {
    await this.progressTransactionService.completeAllCourseProgress(
      userId,
      courseId,
      userLevel,
    );
  }

  async resetCourseProgress(userId: string, courseId: string): Promise<void> {
    await this.progressTransactionService.resetCourseProgress(userId, courseId);
  }

  async completeAllLowerCourses(
    userId: string,
    userLevel: UserLevel,
  ): Promise<void> {
    const courses = await this.coursesRepository.findAll();
    const lowerCourses = courses.filter((c) =>
      isLevelHigher(userLevel, c.level),
    );

    for (const course of lowerCourses) {
      await this.progressTransactionService.completeAllCourseProgress(
        userId,
        course.id,
        userLevel,
      );
    }
  }
}
