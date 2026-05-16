import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ExercisesRepository } from './repositories/exercises.repository';
import { UserExerciseResultsRepository } from './repositories/user-exercise-results.repository';
import { AnswerAssessment } from './answer-assessment.service';
import { AnswerNormalizer } from './answer-normalizer';
import { Transactional } from '../../../common/decorators';
import { Exercise } from '../domain/exercise.entity';
import { UserExerciseResult } from '../domain/user-exercise-result.entity';
import {
  ExerciseStatsPort,
  ExerciseStatsResult,
} from '../../admin/application/ports/dashboard-stats.ports';

export interface SubmitAnswerResult {
  id: string;
  isCorrect: boolean;
  score: number;
  userAnswer: any;
  timeTaken?: number;
  attemptedAt: Date;
}

@Injectable()
export class ExercisesService implements ExerciseStatsPort {
  constructor(
    private readonly dataSource: DataSource,
    private readonly exercisesRepository: ExercisesRepository,
    private readonly userExerciseResultsRepository: UserExerciseResultsRepository,
    private readonly answerAssessment: AnswerAssessment,
    private readonly answerNormalizer: AnswerNormalizer,
  ) {}

  async getExercisesWithHighestErrorRate(
    minAttempts: number,
    limit: number,
  ): Promise<ExerciseStatsResult[]> {
    return this.userExerciseResultsRepository.getExercisesWithHighestErrorRate(
      minAttempts,
      limit,
    );
  }

  async create(data: Partial<Exercise>): Promise<Exercise> {
    return this.exercisesRepository.create(data);
  }

  async findByLessonId(lessonId: string): Promise<Exercise[]> {
    return this.exercisesRepository.findByLessonId(lessonId);
  }

  async findBySetId(setId: string): Promise<Exercise[]> {
    return this.exercisesRepository.findBySetId(setId);
  }

  async findById(id: string): Promise<Exercise> {
    const exercise = await this.exercisesRepository.findById(id);
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }
    return exercise;
  }

  async update(id: string, data: Partial<Exercise>): Promise<Exercise> {
    await this.findById(id);
    return this.exercisesRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.exercisesRepository.delete(id);
  }

  @Transactional()
  async submitAnswer(
    userId: string,
    exerciseId: string,
    userAnswer: any,
    timeTaken?: number,
  ): Promise<UserExerciseResult> {
    const exercise = await this.findById(exerciseId);

    const normalizedAnswer = this.answerNormalizer.normalize(
      exercise.exerciseType,
      userAnswer,
    );

    const { isCorrect } = this.answerAssessment.assessAnswer(
      exercise.exerciseType,
      normalizedAnswer,
      exercise.correctAnswer,
    );

    const queryRunner = (this as any).queryRunner;
    const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;

    const score = isCorrect ? 10 : 0;
    const attemptedAt = new Date();

    const existing = await manager.findOne(UserExerciseResult, {
      where: { userId, exerciseId },
    });

    let result: UserExerciseResult;
    if (existing) {
      existing.userAnswer = userAnswer;
      existing.isCorrect = isCorrect;
      existing.score = score;
      existing.attemptedAt = attemptedAt;
      existing.timeTaken = timeTaken;
      result = await manager.save(UserExerciseResult, existing);
    } else {
      result = await manager.save(UserExerciseResult, {
        userId,
        exerciseId,
        userAnswer,
        isCorrect,
        score,
        attemptedAt,
        timeTaken,
      });
    }

    return result;
  }

  async getUserResults(
    userId: string,
    opts?: { limit?: number },
  ): Promise<UserExerciseResult[]> {
    return this.userExerciseResultsRepository.findByUserId(userId, opts);
  }

  async getUserStats(userId: string) {
    return this.userExerciseResultsRepository.getStatsByUser(userId);
  }
}
