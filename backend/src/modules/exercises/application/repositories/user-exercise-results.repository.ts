import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserExerciseResult } from '../../domain/user-exercise-result.entity';

@Injectable()
export class UserExerciseResultsRepository {
  constructor(
    @InjectRepository(UserExerciseResult)
    private readonly repository: Repository<UserExerciseResult>,
  ) {}

  async create(data: Partial<UserExerciseResult>): Promise<UserExerciseResult> {
    const result = this.repository.create(data);
    return this.repository.save(result);
  }

  async findByUserId(
    userId: string,
    opts?: { limit?: number },
  ): Promise<UserExerciseResult[]> {
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

    return this.repository.find(options);
  }

  async findByUserAndExercise(
    userId: string,
    exerciseId: string,
  ): Promise<UserExerciseResult[]> {
    return this.repository.find({
      where: { userId, exerciseId },
      order: { attemptedAt: 'DESC' },
    });
  }

  async findByUserAndExerciseIds(
    userId: string,
    exerciseIds: string[],
  ): Promise<UserExerciseResult[]> {
    if (exerciseIds.length === 0) return [];
    return this.repository
      .createQueryBuilder('result')
      .where('result.userId = :userId', { userId })
      .andWhere('result.exerciseId IN (:...exerciseIds)', { exerciseIds })
      .getMany();
  }

  async deleteByUserAndExerciseIds(
    userId: string,
    exerciseIds: string[],
  ): Promise<void> {
    if (exerciseIds.length === 0) return;
    await this.repository
      .createQueryBuilder()
      .delete()
      .where('userId = :userId', { userId })
      .andWhere('exerciseId IN (:...exerciseIds)', { exerciseIds })
      .execute();
  }

  async getStatsByUser(userId: string): Promise<{
    totalExercises: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
  }> {
    const results = await this.repository.find({ where: { userId } });
    const totalExercises = results.length;
    const correctAnswers = results.filter((r) => r.isCorrect).length;
    const incorrectAnswers = totalExercises - correctAnswers;
    const accuracy =
      totalExercises > 0 ? (correctAnswers / totalExercises) * 100 : 0;

    return { totalExercises, correctAnswers, incorrectAnswers, accuracy };
  }

  async upsertResult(
    manager: EntityManager,
    userId: string,
    exerciseId: string,
    score: number,
    isCorrect: boolean,
  ): Promise<void> {
    await manager.upsert(
      UserExerciseResult,
      { userId, exerciseId, score, isCorrect },
      ['userId', 'exerciseId'],
    );
  }

  async countByUserIdAndDateRange(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('result')
      .where('result.userId = :userId', { userId })
      .andWhere('result.attemptedAt >= :start', { start })
      .andWhere('result.attemptedAt < :end', { end })
      .getCount();
    return result;
  }

  async getExercisesWithHighestErrorRate(
    minAttempts: number,
    limit: number,
  ): Promise<
    {
      exerciseId: string;
      question: string;
      type: string;
      totalAttempts: number;
      incorrectCount: number;
      errorRate: string;
    }[]
  > {
    const stats: {
      exerciseId: string;
      exerciseQuestion: string;
      exerciseType: string;
      totalAttempts: string;
      incorrectCount: string;
      errorRate: string;
    }[] = await this.repository
      .createQueryBuilder('result')
      .innerJoin('result.exercise', 'exercise')
      .select('exercise.id', 'exerciseId')
      .addSelect('exercise.question', 'exerciseQuestion')
      .addSelect('exercise.exerciseType', 'exerciseType')
      .addSelect('COUNT(*)', 'totalAttempts')
      .addSelect(
        'SUM(CASE WHEN result.isCorrect = false THEN 1 ELSE 0 END)',
        'incorrectCount',
      )
      .addSelect(
        'CAST(SUM(CASE WHEN result.isCorrect = false THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100',
        'errorRate',
      )
      .groupBy('exercise.id')
      .addGroupBy('exercise.question')
      .addGroupBy('exercise.exerciseType')
      .having('COUNT(*) >= :minAttempts', { minAttempts })
      .orderBy('"errorRate"', 'DESC')
      .limit(limit)
      .getRawMany();

    return stats.map((e) => ({
      exerciseId: e.exerciseId,
      question: e.exerciseQuestion,
      type: e.exerciseType,
      totalAttempts: parseInt(e.totalAttempts, 10),
      incorrectCount: parseInt(e.incorrectCount, 10),
      errorRate: parseFloat(e.errorRate).toFixed(2) + '%',
    }));
  }
}
