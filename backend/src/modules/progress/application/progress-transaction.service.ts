import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Transactional } from '../../../common/decorators';
import { ProgressRepository } from './progress.repository';
import { ProgressStatus } from '../../../common/enums';
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
export class ProgressTransactionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly progressRepository: ProgressRepository,
  ) {}

  /**
   * Complete lesson với transaction
   * Đảm bảo tất cả updates thành công hoặc rollback hết
   */
  @Transactional()
  async completeLessonWithTransaction(
    userId: string,
    lessonId: string,
    exerciseResults: Array<{ exerciseId: string; score: number; isCorrect: boolean }>,
    vocabularyUpdates: Array<{ vocabularyId: string; masteryLevel: number }>,
  ): Promise<UserProgress> {
    // Sử dụng queryRunner từ decorator nếu có, nếu không dùng default
    const queryRunner = (this as any).queryRunner;
    const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;

    // 1. Update Progress
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

    // 2. Save Exercise Results
    // (Giả sử có UserExerciseResult entity)
    for (const result of exerciseResults) {
      await manager.query(
        `INSERT INTO user_exercise_results (user_id, exercise_id, score, is_correct, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (user_id, exercise_id) 
         DO UPDATE SET score = $3, is_correct = $4, updated_at = NOW()`,
        [userId, result.exerciseId, result.score, result.isCorrect],
      );
    }

    // 3. Update Vocabulary Mastery
    for (const vocab of vocabularyUpdates) {
      await manager.query(
        `UPDATE user_vocabularies 
         SET mastery_level = $1, updated_at = NOW()
         WHERE user_id = $2 AND vocabulary_id = $3`,
        [vocab.masteryLevel, userId, vocab.vocabularyId],
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
    const queryRunner = (this as any).queryRunner;
    const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;

    for (const update of updates) {
      await manager.query(
        `UPDATE user_progress 
         SET status = $1, score = COALESCE($2, score), updated_at = NOW()
         WHERE user_id = $3 AND lesson_id = $4`,
        [update.status, update.score, update.userId, update.lessonId],
      );
    }
  }
}
