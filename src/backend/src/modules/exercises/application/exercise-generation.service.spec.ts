import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ExerciseGenerationService } from './exercise-generation.service';
import { AiProviderRouter } from '../../../infrastructure/ai/ai-provider-router';
import { ExercisesRepository } from './repositories/exercises.repository';
import { QuestionsRepository } from './repositories/questions.repository';
import { ExerciseContextLoader } from './exercise-context-loader';
import { QuestionType } from '../../../common/enums';
import { ProgressRepository } from '../../progress/application/progress.repository';
import { ModuleProgressRepository } from '../../progress/application/module-progress.repository';
import { CoursesRepository } from '../../courses/application/repositories/courses.repository';
import { ModulesRepository } from '../../courses/application/repositories/modules.repository';

describe('ExerciseGenerationService', () => {
  let service: ExerciseGenerationService;
  let router: jest.Mocked<AiProviderRouter>;
  let fakeProvider: { chatStructured: jest.Mock };
  let exercisesRepo: jest.Mocked<ExercisesRepository>;
  let questionsRepo: jest.Mocked<QuestionsRepository>;
  let contextLoader: jest.Mocked<ExerciseContextLoader>;
  let progressRepo: jest.Mocked<ProgressRepository>;
  let moduleProgressRepo: jest.Mocked<ModuleProgressRepository>;
  let modulesRepo: jest.Mocked<ModulesRepository>;
  let coursesRepo: jest.Mocked<CoursesRepository>;

  const validAiResponse = JSON.stringify({
    title: 'Greetings Practice',
    description: 'Basic Vietnamese greeting exercises',
    questions: [
      {
        questionType: 'matching',
        question:
          'Match the Vietnamese greetings with their English translations',
        options: {
          type: 'matching',
          pairs: [
            { left: 'Xin chào', right: 'Hello' },
            { left: 'Cảm ơn', right: 'Thank you' },
          ],
        },
        correctAnswer: {
          matches: [
            { left: 'Xin chào', right: 'Hello' },
            { left: 'Cảm ơn', right: 'Thank you' },
          ],
        },
        explanation: 'These are common Vietnamese greetings',
      },
    ],
  });

  const mockLessonContext = {
    lessonTitle: 'Greetings',
    contents: [],
    vocabularies: [],
    grammarRules: [],
    existingExercises: [],
  };

  beforeEach(async () => {
    fakeProvider = {
      chatStructured: jest.fn(),
    };

    router = {
      forFeature: jest.fn().mockReturnValue(fakeProvider),
      renderPrompt: jest.fn().mockReturnValue('rendered prompt'),
    } as any;

    exercisesRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      softDelete: jest.fn(),
      update: jest.fn(),
    } as any;

    questionsRepo = {
      create: jest.fn(),
      findByExerciseId: jest.fn(),
      softDeleteByExerciseId: jest.fn(),
    } as any;

    contextLoader = {
      loadLessonContext: jest.fn(),
      loadModuleContext: jest.fn(),
      loadCourseContext: jest.fn(),
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
        ExerciseGenerationService,
        { provide: AiProviderRouter, useValue: router },
        { provide: ExercisesRepository, useValue: exercisesRepo },
        { provide: QuestionsRepository, useValue: questionsRepo },
        { provide: ExerciseContextLoader, useValue: contextLoader },
        { provide: ProgressRepository, useValue: progressRepo },
        { provide: ModuleProgressRepository, useValue: moduleProgressRepo },
        { provide: ModulesRepository, useValue: modulesRepo },
        { provide: CoursesRepository, useValue: coursesRepo },
      ],
    }).compile();

    service = module.get<ExerciseGenerationService>(ExerciseGenerationService);
  });

  describe('generateCustom', () => {
    it('generates questions for a custom exercise', async () => {
      const customExercise = {
        id: 'set-1',
        lessonId: 'lesson-1',
        isCustom: true,
        ownerUserId: 'user-1',
        customConfig: {
          questionCount: 5,
          questionTypes: [QuestionType.MATCHING],
          focusArea: 'vocabulary',
        },
        title: 'Custom Practice',
      };
      exercisesRepo.findById.mockResolvedValue(customExercise as any);
      questionsRepo.findByExerciseId.mockResolvedValue([]);
      questionsRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exercisesRepo.update.mockResolvedValue({} as any);
      contextLoader.loadLessonContext.mockResolvedValue(mockLessonContext);

      fakeProvider.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      const result = await service.generateCustom('set-1', 'user-1');

      expect(result).toHaveLength(1);
      expect(questionsRepo.create).toHaveBeenCalled();
      expect(exercisesRepo.update).toHaveBeenCalledWith(
        'set-1',
        expect.objectContaining({
          isAIGenerated: true,
          title: 'Greetings Practice',
          description: 'Basic Vietnamese greeting exercises',
        }),
      );
    });

    it('throws when set is not custom', async () => {
      exercisesRepo.findById.mockResolvedValue({
        id: 'set-1',
        isCustom: false,
      } as any);

      await expect(service.generateCustom('set-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws when set already has exercises', async () => {
      exercisesRepo.findById.mockResolvedValue({
        id: 'set-1',
        isCustom: true,
        ownerUserId: 'user-1',
        customConfig: {
          questionCount: 5,
          questionTypes: [QuestionType.MATCHING],
          focusArea: 'vocabulary',
        },
      } as any);
      questionsRepo.findByExerciseId.mockResolvedValue([{ id: 'ex-1' }] as any);

      await expect(service.generateCustom('set-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('generate', () => {
    it('generates exercises for an empty set', async () => {
      exercisesRepo.findById.mockResolvedValue({
        id: 'set-1',
        lessonId: 'lesson-1',
        isCustom: true,
        ownerUserId: 'user-1',
        customConfig: {
          questionCount: 5,
          questionTypes: [QuestionType.MATCHING],
          focusArea: 'both',
        },
        title: 'Custom Practice',
      } as any);
      questionsRepo.findByExerciseId.mockResolvedValue([]);
      questionsRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exercisesRepo.update.mockResolvedValue({} as any);
      contextLoader.loadLessonContext.mockResolvedValue(mockLessonContext);

      fakeProvider.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      const result = await service.generate('set-1', 'user-1');

      expect(result).toHaveLength(1);
    });

    it('throws when set already has exercises', async () => {
      exercisesRepo.findById.mockResolvedValue({
        id: 'set-1',
        lessonId: 'lesson-1',
        isCustom: true,
        ownerUserId: 'user-1',
      } as any);
      questionsRepo.findByExerciseId.mockResolvedValue([{ id: 'ex-1' }] as any);

      await expect(service.generate('set-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('passes userPrompt override to doGenerate', async () => {
      exercisesRepo.findById.mockResolvedValue({
        id: 'set-1',
        lessonId: 'lesson-1',
        isCustom: true,
        ownerUserId: 'user-1',
        customConfig: {
          questionCount: 5,
          questionTypes: [QuestionType.MATCHING],
          focusArea: 'both',
        },
        userPrompt: 'stored prompt',
      } as any);
      questionsRepo.findByExerciseId.mockResolvedValue([]);
      questionsRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exercisesRepo.update.mockResolvedValue({} as any);
      contextLoader.loadLessonContext.mockResolvedValue(mockLessonContext);

      fakeProvider.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      await service.generate('set-1', 'user-1', 'override prompt');

      expect(router.renderPrompt).toHaveBeenCalledWith(
        'exercise-generation-lesson',
        expect.objectContaining({
          userPromptSection: '\n### User Request\noverride prompt\n',
        }),
      );
    });
  });

  describe('regenerate', () => {
    it('creates regenerated set with new fields', async () => {
      const originalExercise = {
        id: 'set-1',
        lessonId: 'lesson-1',
        moduleId: null,
        courseId: null,
        isCustom: true,
        customConfig: {
          questionCount: 5,
          questionTypes: [QuestionType.MATCHING],
          focusArea: 'vocabulary',
        },
        title: 'Greetings Practice',
        description: 'A practice exercise',
        userPrompt: 'Focus on greetings',
        ownerUserId: 'user-1',
        orderIndex: 1,
      };
      const newExercise = { ...originalExercise, id: 'set-2' };

      exercisesRepo.findById.mockResolvedValue(originalExercise as any);
      exercisesRepo.create.mockResolvedValue(newExercise as any);

      const result = await service.createRegeneratedExercise('set-1', 'user-1');

      expect(result.lessonId).toBe('lesson-1');
      expect(exercisesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          lessonId: 'lesson-1',
          moduleId: null,
          courseId: null,
          description: 'A practice exercise',
          userPrompt: 'Focus on greetings',
          replacesExerciseId: 'set-1',
        }),
      );
    });

    it('overrides userPrompt when provided', async () => {
      const originalExercise = {
        id: 'set-1',
        lessonId: 'lesson-1',
        moduleId: null,
        courseId: null,
        isCustom: true,
        customConfig: {
          questionCount: 5,
          questionTypes: [QuestionType.MATCHING],
          focusArea: 'vocabulary',
        },
        title: 'Greetings Practice',
        description: 'A practice exercise',
        userPrompt: 'Focus on greetings',
        ownerUserId: 'user-1',
        orderIndex: 1,
      };
      const newExercise = { ...originalExercise, id: 'set-2' };

      exercisesRepo.findById.mockResolvedValue(originalExercise as any);
      exercisesRepo.create.mockResolvedValue(newExercise as any);

      await service.createRegeneratedExercise(
        'set-1',
        'user-1',
        'new override prompt',
      );

      expect(exercisesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userPrompt: 'new override prompt',
        }),
      );
    });

    it('keeps original userPrompt when override is undefined', async () => {
      const originalExercise = {
        id: 'set-1',
        lessonId: 'lesson-1',
        moduleId: null,
        courseId: null,
        isCustom: true,
        customConfig: {
          questionCount: 5,
          questionTypes: [QuestionType.MATCHING],
          focusArea: 'vocabulary',
        },
        title: 'Greetings Practice',
        description: null,
        userPrompt: 'original prompt',
        ownerUserId: 'user-1',
        orderIndex: 1,
      };
      const newExercise = { ...originalExercise, id: 'set-2' };

      exercisesRepo.findById.mockResolvedValue(originalExercise as any);
      exercisesRepo.create.mockResolvedValue(newExercise as any);

      await service.createRegeneratedExercise('set-1', 'user-1');

      expect(exercisesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userPrompt: 'original prompt',
        }),
      );
    });
  });

  describe('renderPrompt usage', () => {
    it('uses AiProviderRouter.renderPrompt with exercise-generation-lesson template', async () => {
      const customExercise = {
        id: 'set-1',
        lessonId: 'lesson-1',
        isCustom: true,
        ownerUserId: 'user-1',
        customConfig: {
          questionCount: 5,
          questionTypes: [QuestionType.MATCHING],
          focusArea: 'vocabulary',
        },
        title: 'Custom Practice',
        userPrompt: 'Focus on greetings',
      };
      exercisesRepo.findById.mockResolvedValue(customExercise as any);
      questionsRepo.findByExerciseId.mockResolvedValue([]);
      questionsRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exercisesRepo.update.mockResolvedValue({} as any);
      contextLoader.loadLessonContext.mockResolvedValue(mockLessonContext);

      fakeProvider.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      await service.generateCustom('set-1', 'user-1');

      expect(router.renderPrompt).toHaveBeenCalledWith(
        'exercise-generation-lesson',
        expect.objectContaining({
          questionCount: '5',
          label: 'Custom (vocabulary)',
          lessonTitle: 'Greetings',
          userPromptSection: '\n### User Request\nFocus on greetings\n',
          languageMixGuidelines: expect.stringContaining('matching'),
          questionTypeShapes: expect.stringContaining('matching'),
        }),
      );
    });

    it('injects only selected exercise type info into prompt', async () => {
      const customExercise = {
        id: 'set-1',
        lessonId: 'lesson-1',
        isCustom: true,
        ownerUserId: 'user-1',
        customConfig: {
          questionCount: 5,
          questionTypes: [
            QuestionType.MULTIPLE_CHOICE,
            QuestionType.FILL_BLANK,
          ],
          focusArea: 'vocabulary',
        },
        title: 'Custom Practice',
      };
      exercisesRepo.findById.mockResolvedValue(customExercise as any);
      questionsRepo.findByExerciseId.mockResolvedValue([]);
      questionsRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exercisesRepo.update.mockResolvedValue({} as any);
      contextLoader.loadLessonContext.mockResolvedValue(mockLessonContext);

      fakeProvider.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      await service.generateCustom('set-1', 'user-1');

      const renderArgs = router.renderPrompt.mock.calls[0]?.[1];
      expect(renderArgs).toBeDefined();
      expect(renderArgs!.languageMixGuidelines).toContain('multiple_choice');
      expect(renderArgs!.languageMixGuidelines).toContain('fill_blank');
      expect(renderArgs!.languageMixGuidelines).not.toContain('listening');
      expect(renderArgs!.questionTypeShapes).toContain('multiple_choice');
      expect(renderArgs!.questionTypeShapes).toContain('fill_blank');
      expect(renderArgs!.questionTypeShapes).not.toContain('listening');
    });

    it('passes response schema restricted to selected exercise types', async () => {
      const customExercise = {
        id: 'set-1',
        lessonId: 'lesson-1',
        isCustom: true,
        ownerUserId: 'user-1',
        customConfig: {
          questionCount: 5,
          questionTypes: [QuestionType.MATCHING],
          focusArea: 'vocabulary',
        },
        title: 'Custom Practice',
      };
      exercisesRepo.findById.mockResolvedValue(customExercise as any);
      questionsRepo.findByExerciseId.mockResolvedValue([]);
      questionsRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exercisesRepo.update.mockResolvedValue({} as any);
      contextLoader.loadLessonContext.mockResolvedValue(mockLessonContext);

      fakeProvider.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      await service.generateCustom('set-1', 'user-1');

      const schema =
        fakeProvider.chatStructured.mock.calls[0][0].responseSchema;
      const questionTypeDesc =
        schema.properties.questions.items.properties.questionType.description;
      expect(questionTypeDesc).toBe('One of: matching');
      expect(
        schema.properties.questions.items.properties.options.properties,
      ).toHaveProperty('pairs');
      expect(
        schema.properties.questions.items.properties.options.properties,
      ).not.toHaveProperty('choices');
    });

    it('omits userPromptSection when no userPrompt on set', async () => {
      const customExercise = {
        id: 'set-1',
        lessonId: 'lesson-1',
        isCustom: true,
        ownerUserId: 'user-1',
        customConfig: {
          questionCount: 5,
          questionTypes: [QuestionType.MATCHING],
          focusArea: 'vocabulary',
        },
        title: 'Custom Practice',
      };
      exercisesRepo.findById.mockResolvedValue(customExercise as any);
      questionsRepo.findByExerciseId.mockResolvedValue([]);
      questionsRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exercisesRepo.update.mockResolvedValue({} as any);
      contextLoader.loadLessonContext.mockResolvedValue(mockLessonContext);

      fakeProvider.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      await service.generateCustom('set-1', 'user-1');

      expect(router.renderPrompt).toHaveBeenCalledWith(
        'exercise-generation-lesson',
        expect.objectContaining({
          userPromptSection: '',
        }),
      );
    });
  });

  describe('module-level generation', () => {
    const mockMergedContext = {
      vocabularies: [
        {
          word: 'Xin chào',
          translation: 'Hello',
          partOfSpeech: 'interjection',
        },
      ],
      grammarRules: [
        {
          title: 'Basic greetings',
          explanation: 'How to greet',
          examples: [{ vi: 'Xin chào', en: 'Hello' }],
        },
      ],
    };

    it('uses loadModuleContext for module-level set', async () => {
      const moduleSet = {
        id: 'set-1',
        moduleId: 'module-1',
        lessonId: null,
        isCustom: true,
        ownerUserId: 'user-1',
        customConfig: {
          questionCount: 5,
          questionTypes: [QuestionType.MATCHING],
          focusArea: 'both',
        },
        title: 'Custom Practice',
        userPrompt: 'Cross-lesson review',
      };
      exercisesRepo.findById.mockResolvedValue(moduleSet as any);
      questionsRepo.findByExerciseId.mockResolvedValue([]);
      questionsRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exercisesRepo.update.mockResolvedValue({} as any);

      modulesRepo.findById.mockResolvedValue({
        id: 'module-1',
        title: 'Greetings Module',
        lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }],
      } as any);
      progressRepo.findCompletedByUserInLessons.mockResolvedValue([
        { lessonId: 'lesson-1' },
      ] as any);
      contextLoader.loadModuleContext.mockResolvedValue(mockMergedContext);

      fakeProvider.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      await service.generateCustom('set-1', 'user-1');

      expect(contextLoader.loadModuleContext).toHaveBeenCalledWith(
        ['lesson-1'],
        'user-1',
      );
      expect(router.renderPrompt).toHaveBeenCalledWith(
        'exercise-generation-module',
        expect.objectContaining({
          moduleTitle: 'Greetings Module',
          lessonCount: '1',
          userPromptSection: '\n### User Request\nCross-lesson review\n',
        }),
      );
    });

    it('throws when moduleId set has no module found', async () => {
      const moduleSet = {
        id: 'set-1',
        moduleId: 'module-1',
        lessonId: null,
        isCustom: true,
        ownerUserId: 'user-1',
        customConfig: {
          questionCount: 5,
          questionTypes: [QuestionType.MATCHING],
          focusArea: 'both',
        },
        title: 'Custom Practice',
      };
      exercisesRepo.findById.mockResolvedValue(moduleSet as any);
      questionsRepo.findByExerciseId.mockResolvedValue([]);
      modulesRepo.findById.mockResolvedValue(null);
      exercisesRepo.update.mockResolvedValue({} as any);
      exercisesRepo.softDelete.mockResolvedValue(undefined as any);

      await expect(service.generateCustom('set-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('course-level generation', () => {
    const mockMergedContext = {
      vocabularies: [
        {
          word: 'Xin chào',
          translation: 'Hello',
          partOfSpeech: 'interjection',
        },
      ],
      grammarRules: [
        {
          title: 'Basic greetings',
          explanation: 'How to greet',
          examples: [{ vi: 'Xin chào', en: 'Hello' }],
        },
      ],
    };

    it('uses loadCourseContext for course-level set', async () => {
      const courseSet = {
        id: 'set-1',
        courseId: 'course-1',
        moduleId: null,
        lessonId: null,
        isCustom: true,
        ownerUserId: 'user-1',
        customConfig: {
          questionCount: 5,
          questionTypes: [QuestionType.MATCHING],
          focusArea: 'both',
        },
        title: 'Custom Practice',
        userPrompt: 'Course-wide review',
      };
      exercisesRepo.findById.mockResolvedValue(courseSet as any);
      questionsRepo.findByExerciseId.mockResolvedValue([]);
      questionsRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exercisesRepo.update.mockResolvedValue({} as any);

      coursesRepo.findById.mockResolvedValue({
        id: 'course-1',
        title: 'A1 Course',
        modules: [
          {
            id: 'module-1',
            lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }],
          },
          {
            id: 'module-2',
            lessons: [{ id: 'lesson-3' }],
          },
        ],
      } as any);
      moduleProgressRepo.findCompletedByUserInModules.mockResolvedValue([
        { moduleId: 'module-1' },
      ] as any);
      contextLoader.loadCourseContext.mockResolvedValue(mockMergedContext);

      fakeProvider.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      await service.generateCustom('set-1', 'user-1');

      expect(contextLoader.loadCourseContext).toHaveBeenCalledWith(
        ['lesson-1', 'lesson-2'],
        'user-1',
      );
      expect(router.renderPrompt).toHaveBeenCalledWith(
        'exercise-generation-course',
        expect.objectContaining({
          courseTitle: 'A1 Course',
          moduleCount: '1',
          userPromptSection: '\n### User Request\nCourse-wide review\n',
        }),
      );
    });

    it('only includes lessons from completed modules', async () => {
      const courseSet = {
        id: 'set-1',
        courseId: 'course-1',
        moduleId: null,
        lessonId: null,
        isCustom: true,
        ownerUserId: 'user-1',
        customConfig: {
          questionCount: 5,
          questionTypes: [QuestionType.MATCHING],
          focusArea: 'both',
        },
        title: 'Custom Practice',
      };
      exercisesRepo.findById.mockResolvedValue(courseSet as any);
      questionsRepo.findByExerciseId.mockResolvedValue([]);
      questionsRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exercisesRepo.update.mockResolvedValue({} as any);

      coursesRepo.findById.mockResolvedValue({
        id: 'course-1',
        title: 'A1 Course',
        modules: [
          {
            id: 'module-1',
            lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }],
          },
          {
            id: 'module-2',
            lessons: [{ id: 'lesson-3' }],
          },
        ],
      } as any);
      moduleProgressRepo.findCompletedByUserInModules.mockResolvedValue([
        { moduleId: 'module-1' },
      ] as any);
      contextLoader.loadCourseContext.mockResolvedValue(mockMergedContext);

      fakeProvider.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      await service.generateCustom('set-1', 'user-1');

      expect(contextLoader.loadCourseContext).toHaveBeenCalledWith(
        ['lesson-1', 'lesson-2'],
        'user-1',
      );
    });

    it('throws when courseId set has no course found', async () => {
      const courseSet = {
        id: 'set-1',
        courseId: 'course-1',
        moduleId: null,
        lessonId: null,
        isCustom: true,
        ownerUserId: 'user-1',
        customConfig: {
          questionCount: 5,
          questionTypes: [QuestionType.MATCHING],
          focusArea: 'both',
        },
        title: 'Custom Practice',
      };
      exercisesRepo.findById.mockResolvedValue(courseSet as any);
      questionsRepo.findByExerciseId.mockResolvedValue([]);
      coursesRepo.findById.mockResolvedValue(null);
      exercisesRepo.update.mockResolvedValue({} as any);
      exercisesRepo.softDelete.mockResolvedValue(undefined as any);

      await expect(service.generateCustom('set-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('AI title and description persistence', () => {
    it('persists AI-generated title and description to Exercise', async () => {
      const customExercise = {
        id: 'set-1',
        lessonId: 'lesson-1',
        isCustom: true,
        ownerUserId: 'user-1',
        customConfig: {
          questionCount: 5,
          questionTypes: [QuestionType.MATCHING],
          focusArea: 'both',
        },
        title: 'Custom Practice',
      };
      exercisesRepo.findById.mockResolvedValue(customExercise as any);
      questionsRepo.findByExerciseId.mockResolvedValue([]);
      questionsRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exercisesRepo.update.mockResolvedValue({} as any);
      contextLoader.loadLessonContext.mockResolvedValue(mockLessonContext);

      fakeProvider.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      await service.generateCustom('set-1', 'user-1');

      expect(exercisesRepo.update).toHaveBeenCalledWith(
        'set-1',
        expect.objectContaining({
          title: 'Greetings Practice',
          description: 'Basic Vietnamese greeting exercises',
        }),
      );
    });

    it('persists null description when AI omits it', async () => {
      const customExercise = {
        id: 'set-1',
        lessonId: 'lesson-1',
        isCustom: true,
        ownerUserId: 'user-1',
        customConfig: {
          questionCount: 5,
          questionTypes: [QuestionType.MATCHING],
          focusArea: 'both',
        },
        title: 'Custom Practice',
      };
      exercisesRepo.findById.mockResolvedValue(customExercise as any);
      questionsRepo.findByExerciseId.mockResolvedValue([]);
      questionsRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exercisesRepo.update.mockResolvedValue({} as any);
      contextLoader.loadLessonContext.mockResolvedValue(mockLessonContext);

      const responseNoDesc = JSON.stringify({
        title: 'Vocabulary Drill',
        questions: [
          {
            questionType: 'matching',
            question: 'Match words',
            correctAnswer: { matches: [] },
          },
        ],
      });

      fakeProvider.chatStructured.mockResolvedValue({
        text: responseNoDesc,
      } as any);

      await service.generateCustom('set-1', 'user-1');

      expect(exercisesRepo.update).toHaveBeenCalledWith(
        'set-1',
        expect.objectContaining({
          title: 'Vocabulary Drill',
          description: undefined,
        }),
      );
    });
  });

  describe('parseResponse', () => {
    it('parses valid JSON response with title and description', () => {
      const result = service.parseResponse(validAiResponse);

      expect(result.title).toBe('Greetings Practice');
      expect(result.description).toBe('Basic Vietnamese greeting exercises');
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].questionType).toBe('matching');
    });

    it('parses response without optional description', () => {
      const responseNoDesc = JSON.stringify({
        title: 'Vocabulary Drill',
        questions: [
          {
            questionType: 'multiple_choice',
            question: 'What does "Xin chào" mean?',
            correctAnswer: { selectedChoice: 'Hello' },
          },
        ],
      });

      const result = service.parseResponse(responseNoDesc);

      expect(result.title).toBe('Vocabulary Drill');
      expect(result.description).toBeUndefined();
      expect(result.questions).toHaveLength(1);
    });

    it('throws when response is not valid JSON', () => {
      expect(() => service.parseResponse('not json')).toThrow(
        BadRequestException,
      );
    });

    it('throws when schema validation fails - missing title', () => {
      const invalid = JSON.stringify({
        questions: [
          {
            questionType: 'matching',
            question: 'Q',
            correctAnswer: {},
          },
        ],
      });

      expect(() => service.parseResponse(invalid)).toThrow(BadRequestException);
    });

    it('throws when exercises array is empty', () => {
      const invalid = JSON.stringify({
        title: 'Empty',
        questions: [],
      });

      expect(() => service.parseResponse(invalid)).toThrow(BadRequestException);
    });
  });
});
