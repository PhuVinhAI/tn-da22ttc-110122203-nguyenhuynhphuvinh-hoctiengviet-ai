import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ExercisesRepository } from './repositories/exercises.repository';
import { QuestionsRepository } from './repositories/questions.repository';
import { UserQuestionResultsRepository } from './repositories/user-question-results.repository';
import { ExerciseGenerationService } from './exercise-generation.service';
import { Exercise, type CustomExerciseConfig } from '../domain/exercise.entity';
import { Question } from '../domain/question.entity';
import { ProgressRepository } from '../../progress/application/progress.repository';
import { ModuleProgressRepository } from '../../progress/application/module-progress.repository';
import { ModulesRepository } from '../../courses/application/repositories/modules.repository';
import { CoursesRepository } from '../../courses/application/repositories/courses.repository';
import { ReorderItem } from '../../../common/utils/bulk-reorder';

export interface ResumeInfo {
  canResume: boolean;
  attempted: number;
  totalQuestions: number;
}

export interface WrongQuestion {
  questionId: string;
  question: string | null;
  questionType: string;
  correctAnswer: any;
  explanation?: string;
  userAnswer?: any;
}

export interface ExerciseProgress {
  exerciseId: string;
  title: string;
  description?: string;
  userPrompt?: string;
  isCustom: boolean;
  isAIGenerated: boolean;
  totalQuestions: number;
  attempted: number;
  correct: number;
  percentCorrect: number;
  percentComplete: number;
}

export interface LessonExerciseSummary {
  exercises: ExerciseProgress[];
}

export interface ExerciseSummary {
  stats: {
    totalQuestions: number;
    attempted: number;
    correct: number;
    percentCorrect: number;
    percentComplete: number;
  };
  wrongQuestions: WrongQuestion[];
}

export interface ModuleExerciseSummary {
  eligible: boolean;
  completedLessonsCount: number;
  totalLessonsCount: number;
  moduleExercises: ExerciseProgress[];
}

export interface CourseExerciseSummary {
  eligible: boolean;
  completedModulesCount: number;
  totalModulesCount: number;
  courseExercises: ExerciseProgress[];
}

@Injectable()
export class ExerciseService {
  constructor(
    private readonly exercisesRepository: ExercisesRepository,
    private readonly questionsRepository: QuestionsRepository,
    private readonly userQuestionResultsRepository: UserQuestionResultsRepository,
    private readonly exerciseGenerationService: ExerciseGenerationService,
    private readonly progressRepository: ProgressRepository,
    private readonly moduleProgressRepository: ModuleProgressRepository,
    private readonly modulesRepository: ModulesRepository,
    private readonly coursesRepository: CoursesRepository,
  ) {}

  async findByLessonId(
    lessonId: string,
    userId: string,
  ): Promise<LessonExerciseSummary> {
    const exercises = await this.exercisesRepository.findActiveByLessonId(
      lessonId,
      userId,
    );
    const progresses: ExerciseProgress[] = [];

    for (const exercise of exercises) {
      const questions = await this.questionsRepository.findByExerciseId(
        exercise.id,
      );
      const questionIds = questions.map((q) => q.id);
      const totalQuestions = questionIds.length;

      let attempted = 0;
      let correct = 0;

      if (totalQuestions > 0 && userId) {
        const results =
          await this.userQuestionResultsRepository.findByUserAndQuestionIds(
            userId,
            questionIds,
          );
        attempted = results.length;
        correct = results.filter((r) => r.isCorrect).length;
      }

      if (exercise.isCustom && totalQuestions === 0) {
        continue;
      }

      const percentComplete =
        totalQuestions > 0 ? (attempted / totalQuestions) * 100 : 0;
      const percentCorrect = attempted > 0 ? (correct / attempted) * 100 : 0;

      progresses.push({
        exerciseId: exercise.id,
        title: exercise.title,
        description: exercise.description,
        userPrompt: exercise.userPrompt,
        isCustom: exercise.isCustom,
        isAIGenerated: exercise.isAIGenerated,
        totalQuestions,
        attempted,
        correct,
        percentCorrect: Math.round(percentCorrect * 100) / 100,
        percentComplete: Math.round(percentComplete * 100) / 100,
      });
    }

    return { exercises: progresses };
  }

  async findAllByLessonIdForAdmin(lessonId: string): Promise<Exercise[]> {
    return this.exercisesRepository.findAllByLessonIdForAdmin(lessonId);
  }

  async findByModuleId(
    moduleId: string,
    userId: string,
  ): Promise<ModuleExerciseSummary> {
    const module = await this.modulesRepository.findById(moduleId);
    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    const lessonIds = (module.lessons || []).map((l: any) => l.id);
    const totalLessonsCount = lessonIds.length;

    const completedProgress =
      await this.progressRepository.findCompletedByUserInLessons(
        userId,
        lessonIds,
      );
    const completedLessonsCount = completedProgress.length;
    const eligible = completedLessonsCount > 0;

    const exercises =
      await this.exercisesRepository.findActiveCustomExercisesByModule(
        moduleId,
        userId,
      );
    const moduleExercises: ExerciseProgress[] = [];

    for (const exercise of exercises) {
      const questions = await this.questionsRepository.findByExerciseId(
        exercise.id,
      );
      const questionIds = questions.map((q) => q.id);
      const totalQuestions = questionIds.length;

      let attempted = 0;
      let correct = 0;

      if (totalQuestions > 0 && userId) {
        const results =
          await this.userQuestionResultsRepository.findByUserAndQuestionIds(
            userId,
            questionIds,
          );
        attempted = results.length;
        correct = results.filter((r) => r.isCorrect).length;
      }

      const percentComplete =
        totalQuestions > 0 ? (attempted / totalQuestions) * 100 : 0;
      const percentCorrect = attempted > 0 ? (correct / attempted) * 100 : 0;

      moduleExercises.push({
        exerciseId: exercise.id,
        title: exercise.title,
        description: exercise.description,
        userPrompt: exercise.userPrompt,
        isCustom: exercise.isCustom,
        isAIGenerated: exercise.isAIGenerated,
        totalQuestions,
        attempted,
        correct,
        percentCorrect: Math.round(percentCorrect * 100) / 100,
        percentComplete: Math.round(percentComplete * 100) / 100,
      });
    }

    return {
      eligible,
      completedLessonsCount,
      totalLessonsCount,
      moduleExercises,
    };
  }

  async getExerciseProgress(exerciseId: string, userId: string) {
    const exercise = await this.exercisesRepository.findById(exerciseId);
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${exerciseId} not found`);
    }
    this.assertExerciseReadable(exercise, userId);

    const questions =
      await this.questionsRepository.findByExerciseId(exerciseId);
    const questionIds = questions.map((q) => q.id);
    const totalQuestions = questionIds.length;

    let attempted = 0;
    let correct = 0;

    if (totalQuestions > 0 && userId) {
      const results =
        await this.userQuestionResultsRepository.findByUserAndQuestionIds(
          userId,
          questionIds,
        );
      attempted = results.length;
      correct = results.filter((r) => r.isCorrect).length;
    }

    const percentComplete =
      totalQuestions > 0 ? (attempted / totalQuestions) * 100 : 0;
    const percentCorrect = attempted > 0 ? (correct / attempted) * 100 : 0;

    return {
      totalQuestions,
      attempted,
      correct,
      percentCorrect: Math.round(percentCorrect * 100) / 100,
      percentComplete: Math.round(percentComplete * 100) / 100,
    };
  }

  async findById(id: string, userId: string) {
    const exercise = await this.exercisesRepository.findByIdWithQuestions(id);
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }
    this.assertExerciseReadable(exercise, userId);
    return exercise;
  }

  async findByIdForAdmin(id: string) {
    return this.exercisesRepository.findByIdWithQuestions(id);
  }

  async create(data: Partial<import('../domain/exercise.entity').Exercise>) {
    return this.exercisesRepository.create(data);
  }

  async updateForAdmin(id: string, data: Partial<Exercise>) {
    const exercise = await this.exercisesRepository.update(id, data);
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }
    return exercise;
  }

  async deleteForAdmin(id: string): Promise<void> {
    const exercise = await this.exercisesRepository.findById(id);
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }
    await this.questionsRepository.softDeleteByExerciseId(id);
    await this.exercisesRepository.softDelete(id);
  }

  async reorderExercises(items: ReorderItem[]): Promise<void> {
    await this.exercisesRepository.reorder(items);
  }

  async reorderQuestions(items: ReorderItem[]): Promise<void> {
    await this.questionsRepository.reorder(items);
  }

  async generate(
    exerciseId: string,
    userId: string,
    userPromptOverride?: string,
  ): Promise<Question[]> {
    const exercises = await this.exerciseGenerationService.generate(
      exerciseId,
      userId,
      userPromptOverride,
    );
    const exercise = await this.exercisesRepository.findById(exerciseId);
    if (exercise?.replacesExerciseId) {
      await this.questionsRepository.softDeleteByExerciseId(
        exercise.replacesExerciseId,
      );
      await this.exercisesRepository.softDelete(exercise.replacesExerciseId);
    }
    return exercises;
  }

  async regenerate(
    exerciseId: string,
    userId: string,
    userPromptOverride?: string,
  ) {
    return this.exerciseGenerationService.createRegeneratedExercise(
      exerciseId,
      userId,
      userPromptOverride,
    );
  }

  async createCustom(
    scope: { lessonId?: string; moduleId?: string; courseId?: string },
    config: CustomExerciseConfig,
    userId: string,
    userPrompt?: string,
  ) {
    if (!Exercise.isValidCustomConfig(config)) {
      throw new BadRequestException('Invalid custom exercise config');
    }

    const { lessonId, moduleId, courseId } = scope;
    const providedCount = [lessonId, moduleId, courseId].filter(
      (v) => v !== undefined && v !== null,
    ).length;
    if (providedCount !== 1) {
      throw new BadRequestException(
        'Exactly one of lessonId, moduleId, or courseId must be provided',
      );
    }

    if (moduleId) {
      const module = await this.modulesRepository.findById(moduleId);
      if (!module) {
        throw new NotFoundException(`Module with ID ${moduleId} not found`);
      }
      const lessonIds = (module.lessons || []).map((l: any) => l.id);
      const completedProgress =
        await this.progressRepository.findCompletedByUserInLessons(
          userId,
          lessonIds,
        );
      if (completedProgress.length === 0) {
        throw new BadRequestException(
          'No completed lessons found in this module',
        );
      }
    }

    if (courseId) {
      const course = await this.coursesRepository.findById(courseId);
      if (!course) {
        throw new NotFoundException(`Course with ID ${courseId} not found`);
      }
      const moduleIds = (course.modules || []).map((m: any) => m.id);
      const completedModuleProgress =
        await this.moduleProgressRepository.findCompletedByUserInModules(
          userId,
          moduleIds,
        );
      if (completedModuleProgress.length === 0) {
        throw new BadRequestException(
          'No completed modules found in this course',
        );
      }
    }

    const exerciseData: Partial<Exercise> = {
      isCustom: true,
      customConfig: config,
      isAIGenerated: false,
      title: 'Custom Practice',
      orderIndex: 100,
      userPrompt: userPrompt || undefined,
      ownerUserId: userId,
    };

    if (lessonId) exerciseData.lessonId = lessonId;
    if (moduleId) exerciseData.moduleId = moduleId;
    if (courseId) exerciseData.courseId = courseId;

    const exercise = await this.exercisesRepository.create(exerciseData);

    return { exercise };
  }

  async findByCourseId(
    courseId: string,
    userId: string,
  ): Promise<CourseExerciseSummary> {
    const course = await this.coursesRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    const moduleIds = (course.modules || []).map((m: any) => m.id);
    const totalModulesCount = moduleIds.length;

    const completedModuleProgress =
      await this.moduleProgressRepository.findCompletedByUserInModules(
        userId,
        moduleIds,
      );
    const completedModulesCount = completedModuleProgress.length;
    const eligible = completedModulesCount > 0;

    const exercises =
      await this.exercisesRepository.findActiveCustomExercisesByCourse(
        courseId,
        userId,
      );
    const courseExercises: ExerciseProgress[] = [];

    for (const exercise of exercises) {
      const questions = await this.questionsRepository.findByExerciseId(
        exercise.id,
      );
      const questionIds = questions.map((q) => q.id);
      const totalQuestions = questionIds.length;

      let attempted = 0;
      let correct = 0;

      if (totalQuestions > 0 && userId) {
        const results =
          await this.userQuestionResultsRepository.findByUserAndQuestionIds(
            userId,
            questionIds,
          );
        attempted = results.length;
        correct = results.filter((r) => r.isCorrect).length;
      }

      const percentComplete =
        totalQuestions > 0 ? (attempted / totalQuestions) * 100 : 0;
      const percentCorrect = attempted > 0 ? (correct / attempted) * 100 : 0;

      courseExercises.push({
        exerciseId: exercise.id,
        title: exercise.title,
        description: exercise.description,
        userPrompt: exercise.userPrompt,
        isCustom: exercise.isCustom,
        isAIGenerated: exercise.isAIGenerated,
        totalQuestions,
        attempted,
        correct,
        percentCorrect: Math.round(percentCorrect * 100) / 100,
        percentComplete: Math.round(percentComplete * 100) / 100,
      });
    }

    return {
      eligible,
      completedModulesCount,
      totalModulesCount,
      courseExercises,
    };
  }

  async deleteCustom(exerciseId: string, userId: string): Promise<void> {
    const exercise = await this.exercisesRepository.findById(exerciseId);
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${exerciseId} not found`);
    }

    const isIncomplete =
      exercise.generationStatus === 'generating' ||
      exercise.generationStatus === 'failed';

    if (!exercise.isCustom && !isIncomplete) {
      throw new BadRequestException(
        'Only custom practice exercises can be deleted via this endpoint',
      );
    }
    this.assertOwnedCustomExercise(exercise, userId);

    await this.questionsRepository.softDeleteByExerciseId(exerciseId);
    await this.exercisesRepository.softDelete(exerciseId);
  }

  async getResumeInfo(exerciseId: string, userId: string): Promise<ResumeInfo> {
    const exercise = await this.exercisesRepository.findById(exerciseId);
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${exerciseId} not found`);
    }
    this.assertExerciseReadable(exercise, userId);

    const questions =
      await this.questionsRepository.findByExerciseId(exerciseId);
    const questionIds = questions.map((q) => q.id);
    const totalQuestions = questionIds.length;

    let attempted = 0;
    if (totalQuestions > 0 && userId) {
      const results =
        await this.userQuestionResultsRepository.findByUserAndQuestionIds(
          userId,
          questionIds,
        );
      attempted = results.length;
    }

    const canResume = attempted > 0 && attempted < totalQuestions;

    return { canResume, attempted, totalQuestions };
  }

  async resetProgress(exerciseId: string, userId: string): Promise<void> {
    const exercise = await this.exercisesRepository.findById(exerciseId);
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${exerciseId} not found`);
    }
    this.assertExerciseReadable(exercise, userId);

    const questions =
      await this.questionsRepository.findByExerciseId(exerciseId);
    const questionIds = questions.map((q) => q.id);

    await this.userQuestionResultsRepository.deleteByUserAndQuestionIds(
      userId,
      questionIds,
    );
  }

  async getSummary(
    exerciseId: string,
    userId: string,
  ): Promise<ExerciseSummary> {
    const exercise = await this.exercisesRepository.findById(exerciseId);
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${exerciseId} not found`);
    }
    this.assertExerciseReadable(exercise, userId);

    const progress = await this.getExerciseProgress(exerciseId, userId);

    const questions =
      await this.questionsRepository.findByExerciseId(exerciseId);
    const questionIds = questions.map((q) => q.id);

    const results =
      await this.userQuestionResultsRepository.findByUserAndQuestionIds(
        userId,
        questionIds,
      );

    const incorrectResults = results.filter((r) => !r.isCorrect);
    const wrongQuestions: WrongQuestion[] = [];

    for (const result of incorrectResults) {
      const question = questions.find((q) => q.id === result.questionId);
      if (question) {
        wrongQuestions.push({
          questionId: question.id,
          question: question.question ?? null,
          questionType: question.questionType,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          userAnswer: result.userAnswer,
        });
      }
    }

    return {
      stats: {
        totalQuestions: progress.totalQuestions,
        attempted: progress.attempted,
        correct: progress.correct,
        percentCorrect: progress.percentCorrect,
        percentComplete: progress.percentComplete,
      },
      wrongQuestions,
    };
  }

  private assertExerciseReadable(exercise: Exercise, userId: string): void {
    if (exercise.isCustom && exercise.ownerUserId !== userId) {
      throw new NotFoundException(`Exercise with ID ${exercise.id} not found`);
    }
  }

  private assertOwnedCustomExercise(exercise: Exercise, userId: string): void {
    if (!exercise.isCustom || exercise.ownerUserId !== userId) {
      throw new BadRequestException(
        'Only your custom practice exercises can be modified',
      );
    }
  }
}
