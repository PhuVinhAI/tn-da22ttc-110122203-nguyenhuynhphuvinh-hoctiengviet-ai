import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserExerciseResult } from '../../domain/user-exercise-result.entity';

@Injectable()
export class UserExerciseResultsRepository {
  constructor(
    @InjectRepository(UserExerciseResult)
    private readonly repository: Repository<UserExerciseResult>,
  ) {}

  async create(
    data: Partial<UserExerciseResult>,
  ): Promise<UserExerciseResult> {
    const result = this.repository.create(data);
    return this.repository.save(result);
  }

  async findByUserId(userId: string): Promise<UserExerciseResult[]> {
    return this.repository.find({
      where: { userId },
      order: { attemptedAt: 'DESC' },
    });
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
    const accuracy = totalExercises > 0 ? (correctAnswers / totalExercises) * 100 : 0;

    return { totalExercises, correctAnswers, incorrectAnswers, accuracy };
  }
}
