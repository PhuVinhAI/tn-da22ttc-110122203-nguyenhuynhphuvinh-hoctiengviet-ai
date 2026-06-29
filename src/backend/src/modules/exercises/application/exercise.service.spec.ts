import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { ExercisesRepository } from './repositories/exercises.repository';
import { QuestionsRepository } from './repositories/questions.repository';
import { UserQuestionResultsRepository } from './repositories/user-question-results.repository';
import { ExerciseGenerationService } from './exercise-generation.service';
import { QuestionType } from '../../../common/enums';
import { ProgressRepository } from '../../progress/application/progress.repository';
import { ModuleProgressRepository } from '../../progress/application/module-progress.repository';
import { ModulesRepository } from '../../courses/application/repositories/modules.repository';
import { CoursesRepository } from '../../courses/application/repositories/courses.repository';

describe('ExerciseService', () => {
  let service: ExerciseService;
  let exercisesRepo: jest.Mocked<ExercisesRepository>;
  let questionsRepo: jest.Mocked<QuestionsRepository>;
  let resultsRepo: jest.Mocked<UserQuestionResultsRepository>;
  let generationService: jest.Mocked<ExerciseGenerationService>;
  let progressRepo: jest.Mocked<ProgressRepository>;
  let moduleProgressRepo: jest.Mocked<ModuleProgressRepository>;
  let modulesRepo: jest.Mocked<ModulesRepository>;
  let coursesRepo: jest.Mocked<CoursesRepository>;

  beforeEach(async () => {
    exercisesRepo = {
      create: jest.fn(),
      findByIdWithQuestions: jest.fn(),
      findById: jest.fn(),
      softDelete: jest.fn(),
      findActiveByLessonId: jest.fn(),
      findActiveCustomExercisesByModule: jest.fn(),
      findActiveCustomExercisesByCourse: jest.fn(),
    } as any;

    questionsRepo = {
      findByExerciseId: jest.fn(),
      softDeleteByExerciseId: jest.fn(),
    } as any;

    resultsRepo = {
      findByUserAndQuestionIds: jest.fn(),
      deleteByUserAndQuestionIds: jest.fn(),
    } as any;

    generationService = {
      generate: jest.fn(),
      createRegeneratedExercise: jest.fn(),
      finalizeRegeneration: jest.fn(),
      generateCustom: jest.fn(),
    } as any;

    progressRepo = {
      findCompletedByUserInLessons: jest.fn(),
    } as any;

    moduleProgressRepo = {
      findCompletedByUserInModules: jest.fn(),
    } as any;

    modulesRepo = {
      findById: jest.fn(),
    } as any;

    coursesRepo = {
      findById: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExerciseService,
        {
          provide: ExercisesRepository,
          useValue: exercisesRepo,
        },
        {
          provide: QuestionsRepository,
          useValue: questionsRepo,
        },
        {
          provide: UserQuestionResultsRepository,
          useValue: resultsRepo,
        },
        {
          provide: ExerciseGenerationService,
          useValue: generationService,
        },
        {
          provide: ProgressRepository,
          useValue: progressRepo,
        },
        {
          provide: ModuleProgressRepository,
          useValue: moduleProgressRepo,
        },
        {
          provide: ModulesRepository,
          useValue: modulesRepo,
        },
        {
          provide: CoursesRepository,
          useValue: coursesRepo,
        },
      ],
    }).compile();

    service = module.get<ExerciseService>(ExerciseService);
  });

  describe('findById', () => {
    it('returns exercise with exercises', async () => {
      const mockSet = {
        id: 'set-1',
        title: 'Basic Exercises',
        questions: [{ id: 'ex-1' }, { id: 'ex-2' }],
      };
      exercisesRepo.findByIdWithQuestions.mockResolvedValue(mockSet as any);

      const result = await service.findById('set-1', 'user-1');

      expect(result.id).toBe('set-1');
      expect(result.questions).toHaveLength(2);
      expect(exercisesRepo.findByIdWithQuestions).toHaveBeenCalledWith('set-1');
    });

    it('throws NotFoundException when exercise not found', async () => {
      exercisesRepo.findByIdWithQuestions.mockResolvedValue(null);

      await expect(service.findById('missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByLessonId', () => {
    it('returns exercises with progress stats', async () => {
      exercisesRepo.findActiveByLessonId.mockResolvedValue([
        { id: 'set-1', title: 'Basic', isCustom: false, isAIGenerated: false },
        { id: 'set-2', title: 'Custom', isCustom: true, isAIGenerated: true },
      ] as any);

      questionsRepo.findByExerciseId.mockImplementation(
        async (exerciseId: string) => {
          if (exerciseId === 'set-1')
            return [{ id: 'ex-1' }, { id: 'ex-2' }] as any;
          return [{ id: 'ex-3' }] as any;
        },
      );

      resultsRepo.findByUserAndQuestionIds.mockImplementation(
        async (_userId: string, questionIds: string[]) => {
          return questionIds.map((id) => ({
            questionId: id,
            isCorrect: id === 'ex-1',
          })) as any;
        },
      );

      const result = await service.findByLessonId('lesson-1', 'user-1');

      expect(result.exercises).toHaveLength(2);
      expect(result.exercises[0].totalQuestions).toBe(2);
      expect(result.exercises[0].attempted).toBe(2);
      expect(result.exercises[0].correct).toBe(1);
      expect(result.exercises[0].percentComplete).toBe(100);
    });
  });

  describe('getExerciseProgress', () => {
    it('returns progress when set exists', async () => {
      exercisesRepo.findById.mockResolvedValue({
        id: 'set-1',
      } as any);
      questionsRepo.findByExerciseId.mockResolvedValue([
        { id: 'ex-1' },
        { id: 'ex-2' },
      ] as any);
      resultsRepo.findByUserAndQuestionIds.mockResolvedValue([
        { questionId: 'ex-1', isCorrect: true },
      ] as any);

      const result = await service.getExerciseProgress('set-1', 'user-1');

      expect(result.totalQuestions).toBe(2);
      expect(result.attempted).toBe(1);
      expect(result.correct).toBe(1);
      expect(result.percentComplete).toBe(50);
      expect(result.percentCorrect).toBe(100);
    });

    it('throws NotFoundException when exercise not found', async () => {
      exercisesRepo.findById.mockResolvedValue(null);

      await expect(
        service.getExerciseProgress('missing', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and returns exercise', async () => {
      const data = {
        lessonId: 'lesson-1',
        title: 'Basic Exercises',
      };
      const created = { id: 'set-1', ...data };
      exercisesRepo.create.mockResolvedValue(created as any);

      const result = await service.create(data);

      expect(result.id).toBe('set-1');
      expect(exercisesRepo.create).toHaveBeenCalledWith(data);
    });
  });

  describe('generate', () => {
    it('delegates to exerciseGenerationService', async () => {
      const mockExercises = [{ id: 'ex-1', questionType: 'matching' }];
      generationService.generate.mockResolvedValue(mockExercises as any);

      const result = await service.generate('set-1', 'user-1');

      expect(result).toEqual(mockExercises);
      expect(generationService.generate).toHaveBeenCalledWith(
        'set-1',
        'user-1',
        undefined,
      );
    });

    it('passes userPrompt override to generationService', async () => {
      const mockExercises = [{ id: 'ex-1', questionType: 'matching' }];
      generationService.generate.mockResolvedValue(mockExercises as any);
      exercisesRepo.findById.mockResolvedValue({ id: 'set-1' } as any);

      await service.generate('set-1', 'user-1', 'my override prompt');

      expect(generationService.generate).toHaveBeenCalledWith(
        'set-1',
        'user-1',
        'my override prompt',
      );
    });
  });

  describe('regenerate', () => {
    it('creates a new regenerated set', async () => {
      const mockSet = { id: 'new-set-1', lessonId: 'lesson-1' };
      generationService.createRegeneratedExercise.mockResolvedValue(
        mockSet as any,
      );

      const result = await service.regenerate('set-1', 'user-1');

      expect(result.id).toBe('new-set-1');
      expect(generationService.createRegeneratedExercise).toHaveBeenCalledWith(
        'set-1',
        'user-1',
        undefined,
      );
    });

    it('passes userPrompt override to createRegeneratedExercise', async () => {
      const mockSet = { id: 'new-set-1', lessonId: 'lesson-1' };
      generationService.createRegeneratedExercise.mockResolvedValue(
        mockSet as any,
      );

      await service.regenerate('set-1', 'user-1', 'new prompt');

      expect(generationService.createRegeneratedExercise).toHaveBeenCalledWith(
        'set-1',
        'user-1',
        'new prompt',
      );
    });
  });

  describe('createCustom', () => {
    const validConfig = {
      questionCount: 10,
      questionTypes: [QuestionType.MULTIPLE_CHOICE, QuestionType.MATCHING],
      focusArea: 'both' as const,
    };

    it('creates empty custom exercise without generating', async () => {
      exercisesRepo.create.mockResolvedValue({
        id: 'custom-set-1',
        lessonId: 'lesson-1',
        isCustom: true,
        customConfig: validConfig,
      } as any);

      const result = await service.createCustom(
        { lessonId: 'lesson-1' },
        validConfig,
        'user-1',
      );

      expect(exercisesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          lessonId: 'lesson-1',
          isCustom: true,
          customConfig: validConfig,
          title: 'Custom Practice',
          userPrompt: undefined,
        }),
      );
      expect(generationService.generateCustom).not.toHaveBeenCalled();
      expect(result.exercise.id).toBe('custom-set-1');
    });

    it('creates custom exercise with userPrompt', async () => {
      exercisesRepo.create.mockResolvedValue({
        id: 'custom-set-1',
        lessonId: 'lesson-1',
        isCustom: true,
        customConfig: validConfig,
        userPrompt: 'Focus on greetings',
      } as any);

      await service.createCustom(
        { lessonId: 'lesson-1' },
        validConfig,
        'user-1',
        'Focus on greetings',
      );

      expect(exercisesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userPrompt: 'Focus on greetings',
        }),
      );
    });

    it('throws when config is invalid', async () => {
      const invalidConfig = {
        questionCount: 0,
        questionTypes: [],
        focusArea: 'invalid' as any,
      };

      await expect(
        service.createCustom({ lessonId: 'lesson-1' }, invalidConfig, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when questionCount exceeds bounds', async () => {
      const overMaxConfig = {
        questionCount: 50,
        questionTypes: [QuestionType.MULTIPLE_CHOICE],
        focusArea: 'both' as const,
      };

      await expect(
        service.createCustom({ lessonId: 'lesson-1' }, overMaxConfig, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when no scope provided (XOR violation)', async () => {
      await expect(
        service.createCustom({}, validConfig, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when multiple scopes provided (XOR violation)', async () => {
      await expect(
        service.createCustom(
          { lessonId: 'lesson-1', moduleId: 'module-1' },
          validConfig,
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates custom exercise with moduleId when eligible', async () => {
      modulesRepo.findById.mockResolvedValue({
        id: 'module-1',
        title: 'Module 1',
        lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }],
      } as any);
      progressRepo.findCompletedByUserInLessons.mockResolvedValue([
        { lessonId: 'lesson-1' },
      ] as any);
      exercisesRepo.create.mockResolvedValue({
        id: 'custom-set-1',
        moduleId: 'module-1',
        isCustom: true,
        customConfig: validConfig,
      } as any);

      const result = await service.createCustom(
        { moduleId: 'module-1' },
        validConfig,
        'user-1',
      );

      expect(modulesRepo.findById).toHaveBeenCalledWith('module-1');
      expect(progressRepo.findCompletedByUserInLessons).toHaveBeenCalledWith(
        'user-1',
        ['lesson-1', 'lesson-2'],
      );
      expect(exercisesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          moduleId: 'module-1',
        }),
      );
      expect(result.exercise.id).toBe('custom-set-1');
    });

    it('throws 400 when no completed lessons in module', async () => {
      modulesRepo.findById.mockResolvedValue({
        id: 'module-1',
        title: 'Module 1',
        lessons: [{ id: 'lesson-1' }],
      } as any);
      progressRepo.findCompletedByUserInLessons.mockResolvedValue([]);

      await expect(
        service.createCustom({ moduleId: 'module-1' }, validConfig, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates custom exercise with courseId when eligible', async () => {
      coursesRepo.findById.mockResolvedValue({
        id: 'course-1',
        title: 'Course 1',
        modules: [{ id: 'module-1' }, { id: 'module-2' }],
      } as any);
      moduleProgressRepo.findCompletedByUserInModules.mockResolvedValue([
        { moduleId: 'module-1' },
      ] as any);
      exercisesRepo.create.mockResolvedValue({
        id: 'custom-set-1',
        courseId: 'course-1',
        isCustom: true,
        customConfig: validConfig,
      } as any);

      const result = await service.createCustom(
        { courseId: 'course-1' },
        validConfig,
        'user-1',
      );

      expect(coursesRepo.findById).toHaveBeenCalledWith('course-1');
      expect(
        moduleProgressRepo.findCompletedByUserInModules,
      ).toHaveBeenCalledWith('user-1', ['module-1', 'module-2']);
      expect(exercisesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: 'course-1',
        }),
      );
      expect(result.exercise.id).toBe('custom-set-1');
    });

    it('throws 400 when no completed modules in course', async () => {
      coursesRepo.findById.mockResolvedValue({
        id: 'course-1',
        title: 'Course 1',
        modules: [{ id: 'module-1' }],
      } as any);
      moduleProgressRepo.findCompletedByUserInModules.mockResolvedValue([]);

      await expect(
        service.createCustom({ courseId: 'course-1' }, validConfig, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByModuleId', () => {
    it('returns eligible=false when no completed lessons', async () => {
      modulesRepo.findById.mockResolvedValue({
        id: 'module-1',
        lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }],
      } as any);
      progressRepo.findCompletedByUserInLessons.mockResolvedValue([]);
      exercisesRepo.findActiveCustomExercisesByModule.mockResolvedValue([]);

      const result = await service.findByModuleId('module-1', 'user-1');

      expect(result.eligible).toBe(false);
      expect(result.completedLessonsCount).toBe(0);
      expect(result.totalLessonsCount).toBe(2);
      expect(result.moduleExercises).toHaveLength(0);
    });

    it('returns eligible=true and exercises when completed lessons exist', async () => {
      modulesRepo.findById.mockResolvedValue({
        id: 'module-1',
        lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }],
      } as any);
      progressRepo.findCompletedByUserInLessons.mockResolvedValue([
        { lessonId: 'lesson-1' },
      ] as any);
      exercisesRepo.findActiveCustomExercisesByModule.mockResolvedValue([
        {
          id: 'set-1',
          title: 'Module Review',
          isCustom: true,
          isAIGenerated: true,
        },
      ] as any);
      questionsRepo.findByExerciseId.mockResolvedValue([
        { id: 'ex-1' },
        { id: 'ex-2' },
      ] as any);
      resultsRepo.findByUserAndQuestionIds.mockResolvedValue([
        { questionId: 'ex-1', isCorrect: true },
      ] as any);

      const result = await service.findByModuleId('module-1', 'user-1');

      expect(result.eligible).toBe(true);
      expect(result.completedLessonsCount).toBe(1);
      expect(result.totalLessonsCount).toBe(2);
      expect(result.moduleExercises).toHaveLength(1);
      expect(result.moduleExercises[0].totalQuestions).toBe(2);
    });

    it('throws NotFoundException when module not found', async () => {
      modulesRepo.findById.mockResolvedValue(null);

      await expect(service.findByModuleId('missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByCourseId', () => {
    it('returns eligible=false when no completed modules', async () => {
      coursesRepo.findById.mockResolvedValue({
        id: 'course-1',
        modules: [{ id: 'module-1' }, { id: 'module-2' }],
      } as any);
      moduleProgressRepo.findCompletedByUserInModules.mockResolvedValue([]);
      exercisesRepo.findActiveCustomExercisesByCourse.mockResolvedValue([]);

      const result = await service.findByCourseId('course-1', 'user-1');

      expect(result.eligible).toBe(false);
      expect(result.completedModulesCount).toBe(0);
      expect(result.totalModulesCount).toBe(2);
      expect(result.courseExercises).toHaveLength(0);
    });

    it('returns eligible=true and exercises when completed modules exist', async () => {
      coursesRepo.findById.mockResolvedValue({
        id: 'course-1',
        modules: [{ id: 'module-1' }, { id: 'module-2' }],
      } as any);
      moduleProgressRepo.findCompletedByUserInModules.mockResolvedValue([
        { moduleId: 'module-1' },
      ] as any);
      exercisesRepo.findActiveCustomExercisesByCourse.mockResolvedValue([
        {
          id: 'set-1',
          title: 'Course Review',
          isCustom: true,
          isAIGenerated: true,
        },
      ] as any);
      questionsRepo.findByExerciseId.mockResolvedValue([
        { id: 'ex-1' },
        { id: 'ex-2' },
      ] as any);
      resultsRepo.findByUserAndQuestionIds.mockResolvedValue([
        { questionId: 'ex-1', isCorrect: true },
      ] as any);

      const result = await service.findByCourseId('course-1', 'user-1');

      expect(result.eligible).toBe(true);
      expect(result.completedModulesCount).toBe(1);
      expect(result.totalModulesCount).toBe(2);
      expect(result.courseExercises).toHaveLength(1);
      expect(result.courseExercises[0].totalQuestions).toBe(2);
    });

    it('throws NotFoundException when course not found', async () => {
      coursesRepo.findById.mockResolvedValue(null);

      await expect(service.findByCourseId('missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteCustom', () => {
    it('soft-deletes exercises and set when custom', async () => {
      exercisesRepo.findById.mockResolvedValue({
        id: 'set-1',
        isCustom: true,
        ownerUserId: 'user-1',
      } as any);

      await service.deleteCustom('set-1', 'user-1');

      expect(questionsRepo.softDeleteByExerciseId).toHaveBeenCalledWith(
        'set-1',
      );
      expect(exercisesRepo.softDelete).toHaveBeenCalledWith('set-1');
    });

    it('throws NotFoundException when set missing', async () => {
      exercisesRepo.findById.mockResolvedValue(null);

      await expect(service.deleteCustom('missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(questionsRepo.softDeleteByExerciseId).not.toHaveBeenCalled();
    });

    it('allows deleting failed custom exercise', async () => {
      exercisesRepo.findById.mockResolvedValue({
        id: 'set-1',
        isCustom: true,
        ownerUserId: 'user-1',
        generationStatus: 'failed',
      } as any);

      await service.deleteCustom('set-1', 'user-1');

      expect(questionsRepo.softDeleteByExerciseId).toHaveBeenCalledWith(
        'set-1',
      );
      expect(exercisesRepo.softDelete).toHaveBeenCalledWith('set-1');
    });

    it('throws BadRequestException when set is not custom and complete', async () => {
      exercisesRepo.findById.mockResolvedValue({
        id: 'set-1',
        isCustom: false,
        generationStatus: 'ready',
      } as any);

      await expect(service.deleteCustom('set-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(questionsRepo.softDeleteByExerciseId).not.toHaveBeenCalled();
    });
  });

  describe('getResumeInfo', () => {
    it('returns canResume=true when partially completed', async () => {
      exercisesRepo.findById.mockResolvedValue({ id: 'set-1' } as any);
      questionsRepo.findByExerciseId.mockResolvedValue([
        { id: 'ex-1' },
        { id: 'ex-2' },
      ] as any);
      resultsRepo.findByUserAndQuestionIds.mockResolvedValue([
        { questionId: 'ex-1' },
      ] as any);

      const result = await service.getResumeInfo('set-1', 'user-1');

      expect(result.canResume).toBe(true);
      expect(result.attempted).toBe(1);
      expect(result.totalQuestions).toBe(2);
    });

    it('returns canResume=false when not started', async () => {
      exercisesRepo.findById.mockResolvedValue({ id: 'set-1' } as any);
      questionsRepo.findByExerciseId.mockResolvedValue([{ id: 'ex-1' }] as any);
      resultsRepo.findByUserAndQuestionIds.mockResolvedValue([] as any);

      const result = await service.getResumeInfo('set-1', 'user-1');

      expect(result.canResume).toBe(false);
    });

    it('returns canResume=false when fully completed', async () => {
      exercisesRepo.findById.mockResolvedValue({ id: 'set-1' } as any);
      questionsRepo.findByExerciseId.mockResolvedValue([{ id: 'ex-1' }] as any);
      resultsRepo.findByUserAndQuestionIds.mockResolvedValue([
        { questionId: 'ex-1' },
      ] as any);

      const result = await service.getResumeInfo('set-1', 'user-1');

      expect(result.canResume).toBe(false);
    });
  });

  describe('resetProgress', () => {
    it('deletes user results for set exercises', async () => {
      exercisesRepo.findById.mockResolvedValue({ id: 'set-1' } as any);
      questionsRepo.findByExerciseId.mockResolvedValue([
        { id: 'ex-1' },
        { id: 'ex-2' },
      ] as any);
      resultsRepo.deleteByUserAndQuestionIds.mockResolvedValue(undefined);

      await service.resetProgress('set-1', 'user-1');

      expect(resultsRepo.deleteByUserAndQuestionIds).toHaveBeenCalledWith(
        'user-1',
        ['ex-1', 'ex-2'],
      );
    });

    it('throws NotFoundException when exercise not found', async () => {
      exercisesRepo.findById.mockResolvedValue(null);

      await expect(service.resetProgress('missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSummary', () => {
    it('returns stats and wrong questions', async () => {
      exercisesRepo.findById.mockResolvedValue({ id: 'set-1' } as any);
      questionsRepo.findByExerciseId.mockResolvedValue([
        {
          id: 'ex-1',
          question: 'Q1',
          questionType: 'multiple_choice',
          correctAnswer: { selectedChoice: 'A' },
          explanation: 'E1',
        },
        {
          id: 'ex-2',
          question: 'Q2',
          questionType: 'matching',
          correctAnswer: { matches: [] },
          explanation: 'E2',
        },
      ] as any);
      resultsRepo.findByUserAndQuestionIds.mockResolvedValue([
        {
          questionId: 'ex-1',
          isCorrect: true,
          userAnswer: { selectedChoice: 'A' },
        },
        { questionId: 'ex-2', isCorrect: false, userAnswer: { matches: [] } },
      ] as any);

      const result = await service.getSummary('set-1', 'user-1');

      expect(result.stats.totalQuestions).toBe(2);
      expect(result.stats.attempted).toBe(2);
      expect(result.stats.correct).toBe(1);
      expect(result.wrongQuestions).toHaveLength(1);
      expect(result.wrongQuestions[0].questionId).toBe('ex-2');
    });
  });
});
