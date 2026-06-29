import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { QuestionAttempt } from '../../domain/question-attempt.entity';
import { UserQuestionResult } from '../../domain/user-question-result.entity';

@Injectable()
export class UserQuestionResultsRepository {
  constructor(
    @InjectRepository(UserQuestionResult)
    private readonly repository: Repository<UserQuestionResult>,
    @InjectRepository(QuestionAttempt)
    private readonly attemptsRepository: Repository<QuestionAttempt>,
    private readonly dataSource: DataSource,
  ) {}

  async create(data: Partial<UserQuestionResult>): Promise<UserQuestionResult> {
    const result = this.repository.create(data);
    return this.repository.save(result);
  }

  async findByUserId(
    userId: string,
    opts?: { limit?: number },
  ): Promise<QuestionAttempt[]> {
    const options: {
      where: { userId: string };
      order: { attemptedAt: 'DESC' };
      take?: number;
    } = {
      where: { userId },
      order: { attemptedAt: 'DESC' },
    };

    if (opts && opts.limit !== undefined) {
      // Clamp to [1..50] so a misbehaving caller (or a hostile tool input
      // that slipped past Zod) cannot ask for unlimited rows.
      options.take = Math.max(1, Math.min(50, opts.limit));
    }

    return this.attemptsRepository.find(options);
  }

  async findByUserAndExercise(
    userId: string,
    questionId: string,
  ): Promise<QuestionAttempt[]> {
    return this.attemptsRepository.find({
      where: { userId, questionId },
      order: { attemptedAt: 'DESC' },
    });
  }

  async findByUserAndQuestionIds(
    userId: string,
    questionIds: string[],
  ): Promise<UserQuestionResult[]> {
    if (questionIds.length === 0) return [];
    return this.repository
      .createQueryBuilder('result')
      .where('result.userId = :userId', { userId })
      .andWhere('result.questionId IN (:...questionIds)', { questionIds })
      .getMany();
  }

  async deleteByUserAndQuestionIds(
    userId: string,
    questionIds: string[],
  ): Promise<void> {
    if (questionIds.length === 0) return;
    await this.attemptsRepository
      .createQueryBuilder()
      .delete()
      .where('userId = :userId', { userId })
      .andWhere('questionId IN (:...questionIds)', { questionIds })
      .execute();
    await this.repository
      .createQueryBuilder()
      .delete()
      .where('userId = :userId', { userId })
      .andWhere('questionId IN (:...questionIds)', { questionIds })
      .execute();
  }

  async getStatsByUser(userId: string): Promise<{
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
    completedExercises: number;
    totalTimeSpent: number;
  }> {
    // Attempt-level stats from question_attempts
    const [exerciseRow]: {
      totalQuestions: string;
      correctAnswers: string;
      totalTimeTaken: string;
    }[] = await this.dataSource.query(
      `SELECT
         COUNT(*) AS "totalQuestions",
         SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END) AS "correctAnswers",
         COALESCE(SUM(time_taken), 0) AS "totalTimeTaken"
       FROM question_attempts
       WHERE user_id = $1`,
      [userId],
    );

    const [completedRow]: {
      completedExercises: string;
    }[] = await this.dataSource.query(
      `SELECT COUNT(*) AS "completedExercises"
       FROM user_question_results
       WHERE user_id = $1`,
      [userId],
    );

    // Lesson-level stats from learning_progress
    const [progressRow]: {
      totalLessonTime: string;
    }[] = await this.dataSource.query(
      `SELECT
         COALESCE(SUM(time_spent), 0) AS "totalLessonTime"
       FROM learning_progress
       WHERE user_id = $1 AND unit_type = 'lesson'`,
      [userId],
    );

    const totalQuestions = parseInt(exerciseRow.totalQuestions, 10) || 0;
    const correctAnswers = parseInt(exerciseRow.correctAnswers, 10) || 0;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const accuracy =
      totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const completedExercises =
      parseInt(completedRow.completedExercises, 10) || 0;
    const totalTimeSpent =
      (parseInt(exerciseRow.totalTimeTaken, 10) || 0) +
      (parseInt(progressRow.totalLessonTime, 10) || 0);

    return {
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      accuracy,
      completedExercises,
      totalTimeSpent,
    };
  }

  async upsertResult(
    manager: EntityManager,
    userId: string,
    questionId: string,
    score: number,
    isCorrect: boolean,
  ): Promise<void> {
    await manager.upsert(
      UserQuestionResult,
      {
        userId,
        questionId,
        score,
        bestScore: score,
        isCorrect,
        attemptedAt: new Date(),
        attemptCount: 1,
      },
      ['userId', 'questionId'],
    );
  }

  async countByUserIdAndDateRange(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    const result = await this.attemptsRepository
      .createQueryBuilder('result')
      .where('result.userId = :userId', { userId })
      .andWhere('result.attemptedAt >= :start', { start })
      .andWhere('result.attemptedAt < :end', { end })
      .getCount();
    return result;
  }
}
