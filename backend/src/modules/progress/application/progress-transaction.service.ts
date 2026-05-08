import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Transactional, TransactionalHost } from '../../../common/decorators';
import { ProgressRepository } from './progress.repository';
import { UserExerciseResultsRepository } from '../../exercises/application/repositories/user-exercise-results.repository';
import { UserVocabulariesRepository } from '../../vocabularies/application/repositories/user-vocabularies.repository';
import { MasteryLevel, ProgressStatus } from '../../../common/enums';
import { UserProgress } from '../domain/user-progress.entity';

/**
 * Service xử lý các thao tác phức tạp cần transaction
 *
 * Ví dụ: Khi user hoàn thành bài học, cần:
 * 1. Update progress
 * 2. Update exercise results
 * 3. Update vocabulary mastery
 *
 * Nếu 1 trong 3 bước fail → rollback tất cả
 */
@Injectable()
export class ProgressTransactionService implements TransactionalHost {
  queryRunner?: import('typeorm').QueryRunner;

  constructor(
    readonly dataSource: DataSource,
    private readonly progressRepository: ProgressRepository,
    private readonly exerciseResultsRepository: UserExerciseResultsRepository,
    private readonly vocabulariesRepository: UserVocabulariesRepository,
  ) {}

  private getManager(): EntityManager {
    return this.queryRunner
      ? this.queryRunner.manager
      : this.dataSource.manager;
  }

  /**
   * Complete lesson với transaction
   * Đảm bảo tất cả updates thành công hoặc rollback hết
   */
  @Transactional()
  async completeLessonWithTransaction(
    userId: string,
    lessonId: string,
    exerciseResults: Array<{
      exerciseId: string;
      score: number;
      isCorrect: boolean;
    }>,
    vocabularyUpdates: Array<{
      vocabularyId: string;
      masteryLevel: MasteryLevel;
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

    for (const vocab of vocabularyUpdates) {
      await this.vocabulariesRepository.updateMastery(
        manager,
        userId,
        vocab.vocabularyId,
        vocab.masteryLevel,
      );
    }

    return progress;
  }

  /**
   * Batch update progress cho nhiều lessons
   * Đảm bảo atomicity
   */
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
}
