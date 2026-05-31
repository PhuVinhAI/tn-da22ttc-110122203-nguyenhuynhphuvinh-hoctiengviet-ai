import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Brackets, DataSource, EntityManager, In } from 'typeorm';
import { Transactional, TransactionalHost } from '../../../common/decorators';
import { ProgressRepository } from './progress.repository';
import { UserExerciseResultsRepository } from '../../exercises/application/repositories/user-exercise-results.repository';
import { ProgressStatus, UserLevel } from '../../../common/enums';
import {
  CourseProgress,
  LearningUnitType,
  ModuleProgress,
  UserProgress,
} from '../domain/learning-progress.entity';
import { Course } from '../../courses/domain/course.entity';
import { Exercise } from '../../exercises/domain/exercise.entity';
import { ExerciseSet } from '../../exercises/domain/exercise-set.entity';
import { ExerciseAttempt } from '../../exercises/domain/exercise-attempt.entity';
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

  private async saveCourseProgress(
    manager: EntityManager,
    userId: string,
    courseId: string,
    data: Partial<CourseProgress>,
  ): Promise<CourseProgress> {
    const existing = await manager.findOne(CourseProgress, {
      where: { userId, courseId, unitType: LearningUnitType.COURSE },
    });
    const entity = existing
      ? Object.assign(existing, data)
      : manager.create(CourseProgress, {
          ...data,
          userId,
          courseId,
          unitType: LearningUnitType.COURSE,
        });
    return manager.save(CourseProgress, entity);
  }

  private async saveModuleProgress(
    manager: EntityManager,
    userId: string,
    moduleId: string,
    data: Partial<ModuleProgress>,
  ): Promise<ModuleProgress> {
    const existing = await manager.findOne(ModuleProgress, {
      where: { userId, moduleId, unitType: LearningUnitType.MODULE },
    });
    const entity = existing
      ? Object.assign(existing, data)
      : manager.create(ModuleProgress, {
          ...data,
          userId,
          moduleId,
          unitType: LearningUnitType.MODULE,
        });
    return manager.save(ModuleProgress, entity);
  }

  private async saveLessonProgress(
    manager: EntityManager,
    userId: string,
    lessonId: string,
    data: Partial<UserProgress>,
  ): Promise<UserProgress> {
    const existing = await manager.findOne(UserProgress, {
      where: { userId, lessonId, unitType: LearningUnitType.LESSON },
    });
    const entity = existing
      ? Object.assign(existing, data)
      : manager.create(UserProgress, {
          ...data,
          userId,
          lessonId,
          unitType: LearningUnitType.LESSON,
        });
    return manager.save(UserProgress, entity);
  }

  private async findExerciseIdsForSetScope(
    manager: EntityManager,
    userId: string,
    scope: { lessonIds?: string[]; moduleIds?: string[]; courseId?: string },
  ): Promise<string[]> {
    const qb = manager
      .getRepository(Exercise)
      .createQueryBuilder('exercise')
      .innerJoin(ExerciseSet, 'set', 'set.id = exercise.set_id')
      .select('exercise.id', 'id')
      .where('exercise.deleted_at IS NULL')
      .andWhere('set.deleted_at IS NULL')
      .andWhere(
        new Brackets((scopeQb) => {
          let hasScope = false;

          if (scope.lessonIds?.length) {
            scopeQb.where('set.lesson_id IN (:...lessonIds)', {
              lessonIds: scope.lessonIds,
            });
            hasScope = true;
          }

          if (scope.moduleIds?.length) {
            const clause = 'set.module_id IN (:...moduleIds)';
            if (hasScope) {
              scopeQb.orWhere(clause, { moduleIds: scope.moduleIds });
            } else {
              scopeQb.where(clause, { moduleIds: scope.moduleIds });
              hasScope = true;
            }
          }

          if (scope.courseId) {
            const clause = 'set.course_id = :courseId';
            if (hasScope) {
              scopeQb.orWhere(clause, { courseId: scope.courseId });
            } else {
              scopeQb.where(clause, { courseId: scope.courseId });
            }
          }
        }),
      )
      .andWhere(
        new Brackets((ownerQb) => {
          ownerQb
            .where('set.is_custom = false')
            .orWhere('set.owner_user_id = :userId', { userId });
        }),
      );

    const rows = await qb.getRawMany<{ id: string }>();
    return rows.map((row) => row.id);
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
      where: { userId, lessonId, unitType: LearningUnitType.LESSON },
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
        {
          userId: update.userId,
          lessonId: update.lessonId,
          unitType: LearningUnitType.LESSON,
        },
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

    await this.saveCourseProgress(manager, userId, courseId, {
      status: ProgressStatus.COMPLETED,
      score: null as any,
      completedAt: new Date(),
      completedModulesCount: totalModulesCount,
      totalModulesCount,
    });

    for (const module of modules) {
      const lessons = module.lessons ?? [];
      const totalLessonsCount = lessons.length;

      await this.saveModuleProgress(manager, userId, module.id, {
        status: ProgressStatus.COMPLETED,
        score: null as any,
        completedAt: new Date(),
        completedLessonsCount: totalLessonsCount,
        totalLessonsCount,
      });

      for (const lesson of lessons) {
        await this.saveLessonProgress(manager, userId, lesson.id, {
          status: ProgressStatus.COMPLETED,
          score: null as any,
          completedAt: new Date(),
          contentViewed: true,
          lastAccessedAt: new Date(),
        });
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

    await this.saveModuleProgress(manager, userId, moduleId, {
      status: ProgressStatus.COMPLETED,
      score: null as any,
      completedAt: new Date(),
      completedLessonsCount: totalLessonsCount,
      totalLessonsCount,
    });

    for (const lesson of lessons) {
      await this.saveLessonProgress(manager, userId, lesson.id, {
        status: ProgressStatus.COMPLETED,
        score: null as any,
        completedAt: new Date(),
        contentViewed: true,
        lastAccessedAt: new Date(),
      });
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

    await manager.delete(ModuleProgress, {
      userId,
      moduleId,
      unitType: LearningUnitType.MODULE,
    });

    const lessons = module.lessons ?? [];
    const lessonIds = lessons.map((l: any) => l.id) as string[];

    if (lessonIds.length > 0) {
      await manager.delete(UserProgress, {
        userId,
        lessonId: In(lessonIds),
        unitType: LearningUnitType.LESSON,
      });

      const exerciseIds = await this.findExerciseIdsForSetScope(
        manager,
        userId,
        { lessonIds, moduleIds: [moduleId] },
      );

      if (exerciseIds.length > 0) {
        await manager.delete(ExerciseAttempt, {
          userId,
          exerciseId: In(exerciseIds),
        });
        await manager.delete(UserExerciseResult, {
          userId,
          exerciseId: In(exerciseIds),
        });
      }
    }

    await manager.update(
      ExerciseSet,
      { isCustom: true, ownerUserId: userId, moduleId },
      { deletedAt: new Date() as any },
    );

    if (lessonIds.length > 0) {
      await manager.update(
        ExerciseSet,
        { isCustom: true, ownerUserId: userId, lessonId: In(lessonIds) },
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

    await manager.delete(CourseProgress, {
      userId,
      courseId,
      unitType: LearningUnitType.COURSE,
    });

    const modules = course.modules ?? [];
    const moduleIds = modules.map((m) => m.id);
    const lessonIds = modules.flatMap(
      (m) => (m.lessons ?? []).map((l: any) => l.id) as string[],
    );

    if (moduleIds.length > 0) {
      await manager.delete(ModuleProgress, {
        userId,
        moduleId: In(moduleIds),
        unitType: LearningUnitType.MODULE,
      });
    }

    if (lessonIds.length > 0) {
      await manager.delete(UserProgress, {
        userId,
        lessonId: In(lessonIds),
        unitType: LearningUnitType.LESSON,
      });

      const exerciseIds = await this.findExerciseIdsForSetScope(
        manager,
        userId,
        { lessonIds, moduleIds, courseId },
      );

      if (exerciseIds.length > 0) {
        await manager.delete(ExerciseAttempt, {
          userId,
          exerciseId: In(exerciseIds),
        });
        await manager.delete(UserExerciseResult, {
          userId,
          exerciseId: In(exerciseIds),
        });
      }
    }

    await manager.update(
      ExerciseSet,
      { isCustom: true, ownerUserId: userId, courseId },
      { deletedAt: new Date() as any },
    );

    if (moduleIds.length > 0) {
      await manager.update(
        ExerciseSet,
        { isCustom: true, ownerUserId: userId, moduleId: In(moduleIds) },
        { deletedAt: new Date() as any },
      );
    }

    if (lessonIds.length > 0) {
      await manager.update(
        ExerciseSet,
        { isCustom: true, ownerUserId: userId, lessonId: In(lessonIds) },
        { deletedAt: new Date() as any },
      );
    }
  }
}
