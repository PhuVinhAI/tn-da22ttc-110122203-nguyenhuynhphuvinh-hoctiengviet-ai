import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ExercisesRepository } from './repositories/exercises.repository';
import { UserExerciseResultsRepository } from './repositories/user-exercise-results.repository';
import { AnswerAssessment } from './answer-assessment.service';
import { AnswerNormalizer } from './answer-normalizer';
import { Transactional } from '../../../common/decorators';
import { Exercise } from '../domain/exercise.entity';
import { ExerciseAttempt } from '../domain/exercise-attempt.entity';
import { UserExerciseResult } from '../domain/user-exercise-result.entity';
import { UserLevel } from '../../../common/enums';
import type { AssessmentContext } from '../domain/assessment.types';
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

  async findBySetId(setId: string, userId?: string): Promise<Exercise[]> {
    const exercises = await this.exercisesRepository.findBySetId(setId);
    if (userId && exercises[0]) {
      this.assertExerciseReadable(exercises[0], userId);
    }
    return exercises;
  }

  /**
   * Serialize exercises with acceptsWithoutDiacritics flag for client.
   */
  serializeExercises(exercises: Exercise[]): any[] {
    return exercises.map((ex) => this.serializeExercise(ex));
  }

  serializeExercise(exercise: Exercise): any {
    const level = this.resolveCourseLevel(exercise);
    const requiresVietnameseInput = [
      'fill_blank',
      'translation',
      'listening',
      'speaking',
    ].includes(exercise.exerciseType);
    const acceptsWithoutDiacritics =
      requiresVietnameseInput &&
      (level === UserLevel.A1 || level === UserLevel.A2);

    return {
      id: exercise.id,
      exerciseType: exercise.exerciseType,
      question: exercise.question,
      questionAudioUrl: exercise.questionAudioUrl,
      options: exercise.options,
      correctAnswer: exercise.correctAnswer,
      explanation: exercise.explanation,
      orderIndex: exercise.orderIndex,
      difficultyLevel: exercise.difficultyLevel,
      acceptsWithoutDiacritics,
    };
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
  ): Promise<ExerciseAttempt> {
    const exercise =
      await this.exercisesRepository.findByIdWithCourseLevel(exerciseId);
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${exerciseId} not found`);
    }
    this.assertExerciseReadable(exercise, userId);

    const normalizedAnswer = this.answerNormalizer.normalize(
      exercise.exerciseType,
      userAnswer,
    );

    const context = this.buildAssessmentContext(exercise);

    const { isCorrect } = this.answerAssessment.assessAnswer(
      exercise.exerciseType,
      normalizedAnswer,
      exercise.correctAnswer,
      context,
    );

    const queryRunner = (this as any).queryRunner;
    const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;

    const score = isCorrect ? 10 : 0;
    const attemptedAt = new Date();

    const attempt = await manager.save(ExerciseAttempt, {
      userId,
      exerciseId,
      userAnswer,
      isCorrect,
      score,
      attemptedAt,
      timeTaken,
    });

    const existing = await manager.findOne(UserExerciseResult, {
      where: { userId, exerciseId },
    });

    if (existing) {
      existing.userAnswer = userAnswer;
      existing.isCorrect = isCorrect;
      existing.score = score;
      existing.attemptedAt = attemptedAt;
      existing.timeTaken = timeTaken;
      existing.attemptCount = (existing.attemptCount ?? 0) + 1;
      existing.bestScore = Math.max(existing.bestScore ?? 0, score);
      existing.lastAttemptId = attempt.id;
      await manager.save(UserExerciseResult, existing);
    } else {
      await manager.save(UserExerciseResult, {
        userId,
        exerciseId,
        userAnswer,
        isCorrect,
        score,
        attemptedAt,
        timeTaken,
        attemptCount: 1,
        bestScore: score,
        lastAttemptId: attempt.id,
      });
    }

    return attempt;
  }

  async getUserResults(
    userId: string,
    opts?: { limit?: number },
  ): Promise<ExerciseAttempt[]> {
    return this.userExerciseResultsRepository.findByUserId(userId, opts);
  }

  async getUserStats(userId: string) {
    return this.userExerciseResultsRepository.getStatsByUser(userId);
  }

  private buildAssessmentContext(
    exercise: Exercise,
  ): AssessmentContext | undefined {
    const level = this.resolveCourseLevel(exercise);
    if (!level) return undefined;

    const requiresVietnameseInput = [
      'fill_blank',
      'translation',
      'listening',
      'speaking',
    ].includes(exercise.exerciseType);
    const acceptWithoutDiacritics =
      requiresVietnameseInput &&
      (level === UserLevel.A1 || level === UserLevel.A2);

    return { acceptWithoutDiacritics };
  }

  private resolveCourseLevel(exercise: Exercise): UserLevel | undefined {
    const set = exercise.exerciseSet;
    if (!set) return undefined;

    return (
      (set.lesson?.module?.course?.level as UserLevel | undefined) ??
      (set.module?.course?.level as UserLevel | undefined) ??
      (set.course?.level as UserLevel | undefined)
    );
  }

  private assertExerciseReadable(exercise: Exercise, userId: string): void {
    const set = exercise.exerciseSet;
    if (set?.isCustom && set.ownerUserId !== userId) {
      throw new NotFoundException(`Exercise with ID ${exercise.id} not found`);
    }
  }
}
