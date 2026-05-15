import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import { Transactional, TransactionalHost } from '../../../common/decorators';
import { ProgressRepository } from './progress.repository';
import { UserExerciseResultsRepository } from '../../exercises/application/repositories/user-exercise-results.repository';
import { ProgressStatus, UserLevel } from '../../../common/enums';
import { UserProgress } from '../domain/user-progress.entity';
import { ModuleProgress } from '../domain/module-progress.entity';
import { CourseProgress } from '../domain/course-progress.entity';
import { Course } from '../../courses/domain/course.entity';
import { Exercise } from '../../exercises/domain/exercise.entity';
import { ExerciseSet } from '../../exercises/domain/exercise-set.entity';
import { UserExerciseResult } from '../../exercises/domain/user-exercise-result.entity';

const LEVEL_ORDER: Record<UserLevel, number> = {
  [UserLevel.A1]: 0,
  [UserLevel.A2]: 1,
  [UserLevel.B1]: 2,
  [UserLevel.B2]: 3,
  [UserLevel.C1]: 4,
  [UserLevel.C2]: 5,
};

export function isLevelHigher(
  userLevel: UserLevel,
  courseLevel: UserLevel,
): boolean {
  return LEVEL_ORDER[userLevel] > LEVEL_ORDER[courseLevel];
}

@Injectable()
export class ProgressTransactionService implements TransactionalHost {
  queryRunner?: import('typeorm').QueryRunner;

  constructor(
    readonly dataSource: DataSource,
    private readonly progressRepository: ProgressRepository,
    private readonly exerciseResultsRepository: UserExerciseResultsRepository,
  ) {}

  private getManager(): EntityManager {
    return this.queryRunner
      ? this.queryRunner.manager
      : this.dataSource.manager;
  }

  @Transactional()
  async completeLessonWithTransaction(
    userId: string,
    lessonId: string,
    exerciseResults: Array<{
      exerciseId: string;
      score: number;
      isCorrect: boolean;
    }>,
  ): Promise<UserProgress> {
    const manager = this.getManager();

    const progress = await manager.findOne(UserProgress, {
      where: { userId, lessonId },
    });

    if (!progress) {
      throw new Error('Progress not found');
    }

    const totalScore = exerciseResults.reduce((sum, r) => sum + r.score, 0);
    const avgScore = totalScore / exerciseResults.length;

    progress.status = ProgressStatus.COMPLETED;
    progress.score = avgScore;
    progress.completedAt = new Date();
    progress.lastAccessedAt = new Date();

    await manager.save(UserProgress, progress);

    for (const result of exerciseResults) {
      await this.exerciseResultsRepository.upsertResult(
        manager,
        userId,
        result.exerciseId,
        result.score,
        result.isCorrect,
      );
    }

    return progress;
  }

  @Transactional()
  async batchUpdateProgress(
    updates: Array<{
      userId: string;
      lessonId: string;
      status: ProgressStatus;
      score?: number;
    }>,
  ): Promise<void> {
    const manager = this.getManager();

    for (const update of updates) {
      await manager.update(
        UserProgress,
        { userId: update.userId, lessonId: update.lessonId },
        {
          status: update.status,
          ...(update.score !== undefined && { score: update.score }),
        },
      );
    }
  }

  @Transactional()
  async completeAllCourseProgress(
    userId: string,
    courseId: string,
    userLevel: UserLevel,
  ): Promise<void> {
    const manager = this.getManager();

    const course = await manager.findOne(Course, {
      where: { id: courseId },
      relations: ['modules', 'modules.lessons'],
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (!isLevelHigher(userLevel, course.level)) {
      throw new ForbiddenException(
        'User level must be higher than course level',
      );
    }

    const modules = course.modules ?? [];
    const totalModulesCount = modules.length;

    await manager.upsert(
      CourseProgress,
      {
        userId,
        courseId,
        status: ProgressStatus.COMPLETED,
        score: null as any,
        completedAt: new Date(),
        completedModulesCount: totalModulesCount,
        totalModulesCount,
      },
      ['userId', 'courseId'],
    );

    for (const module of modules) {
      const lessons = module.lessons ?? [];
      const totalLessonsCount = lessons.length;

      await manager.upsert(
        ModuleProgress,
        {
          userId,
          moduleId: module.id,
          status: ProgressStatus.COMPLETED,
          score: null as any,
          completedAt: new Date(),
          completedLessonsCount: totalLessonsCount,
          totalLessonsCount,
        },
        ['userId', 'moduleId'],
      );

      for (const lesson of lessons) {
        const existing = await manager.findOne(UserProgress, {
          where: { userId, lessonId: lesson.id },
        });

        if (existing) {
          await manager.update(UserProgress, existing.id, {
            status: ProgressStatus.COMPLETED,
            score: null as any,
            completedAt: new Date(),
            contentViewed: true,
            lastAccessedAt: new Date(),
          });
        } else {
          const progress = manager.create(UserProgress, {
            userId,
            lessonId: lesson.id,
            status: ProgressStatus.COMPLETED,
            score: null as any,
            completedAt: new Date(),
            contentViewed: true,
            lastAccessedAt: new Date(),
          });
          await manager.save(UserProgress, progress);
        }
      }
    }
  }

  @Transactional()
  async completeAllModuleProgress(
    userId: string,
    moduleId: string,
  ): Promise<void> {
    const manager = this.getManager();

    const module = (await manager.findOne('Module' as any, {
      where: { id: moduleId },
      relations: ['lessons'],
    })) as any;

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    const lessons = module.lessons ?? [];
    const totalLessonsCount = lessons.length;

    await manager.upsert(
      ModuleProgress,
      {
        userId,
        moduleId,
        status: ProgressStatus.COMPLETED,
        score: null as any,
        completedAt: new Date(),
        completedLessonsCount: totalLessonsCount,
        totalLessonsCount,
      },
      ['userId', 'moduleId'],
    );

    for (const lesson of lessons) {
      const existing = await manager.findOne(UserProgress, {
        where: { userId, lessonId: lesson.id },
      });

      if (existing) {
        await manager.update(UserProgress, existing.id, {
          status: ProgressStatus.COMPLETED,
          score: null as any,
          completedAt: new Date(),
          contentViewed: true,
          lastAccessedAt: new Date(),
        });
      } else {
        const progress = manager.create(UserProgress, {
          userId,
          lessonId: lesson.id,
          status: ProgressStatus.COMPLETED,
          score: null as any,
          completedAt: new Date(),
          contentViewed: true,
          lastAccessedAt: new Date(),
        });
        await manager.save(UserProgress, progress);
      }
    }
  }

  @Transactional()
  async resetModuleProgress(userId: string, moduleId: string): Promise<void> {
    const manager = this.getManager();

    const module = (await manager.findOne('Module' as any, {
      where: { id: moduleId },
      relations: ['lessons'],
    })) as any;

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    await manager.delete(ModuleProgress, { userId, moduleId });

    const lessons = module.lessons ?? [];
    const lessonIds = lessons.map((l: any) => l.id) as string[];

    if (lessonIds.length > 0) {
      await manager.delete(UserProgress, {
        userId,
        lessonId: In(lessonIds),
      });

      const exercises = await manager.find(Exercise, {
        where: { lessonId: In(lessonIds) },
      });
      const exerciseIds = exercises.map((e) => e.id);

      if (exerciseIds.length > 0) {
        await manager.delete(UserExerciseResult, {
          userId,
          exerciseId: In(exerciseIds),
        });
      }
    }

    await manager.update(
      ExerciseSet,
      { isCustom: true, moduleId },
      { deletedAt: new Date() as any },
    );

    if (lessonIds.length > 0) {
      await manager.update(
        ExerciseSet,
        { isCustom: true, lessonId: In(lessonIds) },
        { deletedAt: new Date() as any },
      );
    }
  }

  @Transactional()
  async resetCourseProgress(userId: string, courseId: string): Promise<void> {
    const manager = this.getManager();

    const course = await manager.findOne(Course, {
      where: { id: courseId },
      relations: ['modules', 'modules.lessons'],
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    await manager.delete(CourseProgress, { userId, courseId });

    const modules = course.modules ?? [];
    const moduleIds = modules.map((m) => m.id);
    const lessonIds = modules.flatMap(
      (m) => (m.lessons ?? []).map((l: any) => l.id) as string[],
    );

    if (moduleIds.length > 0) {
      await manager.delete(ModuleProgress, {
        userId,
        moduleId: In(moduleIds),
      });
    }

    if (lessonIds.length > 0) {
      await manager.delete(UserProgress, {
        userId,
        lessonId: In(lessonIds),
      });

      const exercises = await manager.find(Exercise, {
        where: { lessonId: In(lessonIds) },
      });
      const exerciseIds = exercises.map((e) => e.id);

      if (exerciseIds.length > 0) {
        await manager.delete(UserExerciseResult, {
          userId,
          exerciseId: In(exerciseIds),
        });
      }
    }

    await manager.update(
      ExerciseSet,
      { isCustom: true, courseId },
      { deletedAt: new Date() as any },
    );

    if (moduleIds.length > 0) {
      await manager.update(
        ExerciseSet,
        { isCustom: true, moduleId: In(moduleIds) },
        { deletedAt: new Date() as any },
      );
    }

    if (lessonIds.length > 0) {
      await manager.update(
        ExerciseSet,
        { isCustom: true, lessonId: In(lessonIds) },
        { deletedAt: new Date() as any },
      );
    }
  }
}
