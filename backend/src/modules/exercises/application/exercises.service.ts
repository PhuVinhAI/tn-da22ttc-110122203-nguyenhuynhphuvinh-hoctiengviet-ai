import { Injectable, NotFoundException } from '@nestjs/common';
import { ExercisesRepository } from './repositories/exercises.repository';
import { UserExerciseResultsRepository } from './repositories/user-exercise-results.repository';
import { ExerciseCheckerService } from './exercise-checker.service';
import { Exercise } from '../domain/exercise.entity';
import { UserExerciseResult } from '../domain/user-exercise-result.entity';

@Injectable()
export class ExercisesService {
  constructor(
    private readonly exercisesRepository: ExercisesRepository,
    private readonly userExerciseResultsRepository: UserExerciseResultsRepository,
    private readonly exerciseCheckerService: ExerciseCheckerService,
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

  async submitAnswer(
    userId: string,
    exerciseId: string,
    userAnswer: any,
    timeTaken?: number,
  ): Promise<UserExerciseResult> {
    const exercise = await this.findById(exerciseId);

    const isCorrect = this.exerciseCheckerService.checkAnswer(
      exercise.exerciseType,
      userAnswer,
      exercise.correctAnswer,
    );

    return this.userExerciseResultsRepository.create({
      userId,
      exerciseId,
      userAnswer,
      isCorrect,
      attemptedAt: new Date(),
      timeTaken,
    });
  }

  async getUserResults(userId: string): Promise<UserExerciseResult[]> {
    return this.userExerciseResultsRepository.findByUserId(userId);
  }

  async getUserStats(userId: string) {
    return this.userExerciseResultsRepository.getStatsByUser(userId);
  }
}
