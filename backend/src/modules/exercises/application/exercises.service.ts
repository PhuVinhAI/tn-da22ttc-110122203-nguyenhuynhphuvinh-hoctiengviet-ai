import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ExercisesRepository } from './repositories/exercises.repository';
import { UserExerciseResultsRepository } from './repositories/user-exercise-results.repository';
import { AnswerAssessment } from './answer-assessment.service';
import { AnswerNormalizer } from './answer-normalizer';
import { Transactional } from '../../../common/decorators';
import { Exercise } from '../domain/exercise.entity';
import { UserExerciseResult } from '../domain/user-exercise-result.entity';

@Injectable()
export class ExercisesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly exercisesRepository: ExercisesRepository,
    private readonly userExerciseResultsRepository: UserExerciseResultsRepository,
    private readonly answerAssessment: AnswerAssessment,
    private readonly answerNormalizer: AnswerNormalizer,
  ) {}

  async create(data: Partial<Exercise>): Promise<Exercise> {
    return this.exercisesRepository.create(data);
  }

  async findByLessonId(lessonId: string): Promise<Exercise[]> {
    return this.exercisesRepository.findByLessonId(lessonId);
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

  /**
   * Submit answer for an exercise
   *
   * Wrapped in transaction to ensure atomicity:
   * - If saving result fails, nothing is committed
   * - Future: Can add vocabulary mastery update here
   *
   * @Transactional decorator ensures rollback on error
   */
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

    // Use queryRunner from @Transactional decorator if available
    const queryRunner = (this as any).queryRunner;
    const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;

    // Create exercise result within transaction
    const result = await manager.save(UserExerciseResult, {
      userId,
      exerciseId,
      userAnswer,
      isCorrect,
      attemptedAt: new Date(),
      timeTaken,
    });

    // Future enhancement: Update vocabulary mastery here if needed
    // This will be atomic with the exercise result creation

    return result;
  }

  async getUserResults(userId: string): Promise<UserExerciseResult[]> {
    return this.userExerciseResultsRepository.findByUserId(userId);
  }

  async getUserStats(userId: string) {
    return this.userExerciseResultsRepository.getStatsByUser(userId);
  }
}
