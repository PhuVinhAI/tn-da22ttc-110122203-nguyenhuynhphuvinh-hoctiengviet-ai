import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ExerciseGenerationService } from './exercise-generation.service';
import { GenaiService } from '../../../infrastructure/genai/genai.service';
import { ExerciseSetsRepository } from './repositories/exercise-sets.repository';
import { ExercisesRepository } from './repositories/exercises.repository';
import { ExerciseContextLoader } from './exercise-context-loader';
import { ExerciseType } from '../../../common/enums';
import { ProgressRepository } from '../../progress/application/progress.repository';
import { ModuleProgressRepository } from '../../progress/application/module-progress.repository';
import { CoursesRepository } from '../../courses/application/repositories/courses.repository';
import { ModulesRepository } from '../../courses/application/repositories/modules.repository';

describe('ExerciseGenerationService', () => {
  let service: ExerciseGenerationService;
  let genaiService: jest.Mocked<GenaiService>;
  let exerciseSetsRepo: jest.Mocked<ExerciseSetsRepository>;
  let exercisesRepo: jest.Mocked<ExercisesRepository>;
  let contextLoader: jest.Mocked<ExerciseContextLoader>;
  let progressRepo: jest.Mocked<ProgressRepository>;
  let moduleProgressRepo: jest.Mocked<ModuleProgressRepository>;
  let modulesRepo: jest.Mocked<ModulesRepository>;
  let coursesRepo: jest.Mocked<CoursesRepository>;

  const validAiResponse = JSON.stringify({
    title: 'Greetings Practice',
    description: 'Basic Vietnamese greeting exercises',
    exercises: [
      {
        exerciseType: 'matching',
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
    genaiService = {
      chatStructured: jest.fn(),
      renderPrompt: jest.fn().mockReturnValue('rendered prompt'),
    } as any;

    exerciseSetsRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      softDelete: jest.fn(),
      update: jest.fn(),
      findActiveByLessonId: jest.fn(),
    } as any;

    exercisesRepo = {
      create: jest.fn(),
      findBySetId: jest.fn(),
      softDeleteBySetId: jest.fn(),
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
        { provide: GenaiService, useValue: genaiService },
        { provide: ExerciseSetsRepository, useValue: exerciseSetsRepo },
        { provide: ExercisesRepository, useValue: exercisesRepo },
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
    it('generates exercises for a custom set', async () => {
      const customSet = {
        id: 'set-1',
        lessonId: 'lesson-1',
        isCustom: true,
        customConfig: {
          questionCount: 5,
          exerciseTypes: [ExerciseType.MATCHING],
          focusArea: 'vocabulary',
        },
        title: 'Custom Practice',
      };
      exerciseSetsRepo.findById.mockResolvedValue(customSet as any);
      exercisesRepo.findBySetId.mockResolvedValue([]);
      exercisesRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exerciseSetsRepo.update.mockResolvedValue({} as any);
      contextLoader.loadLessonContext.mockResolvedValue(mockLessonContext);

      genaiService.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      const result = await service.generateCustom('set-1', 'user-1');

      expect(result).toHaveLength(1);
      expect(exercisesRepo.create).toHaveBeenCalled();
      expect(exerciseSetsRepo.update).toHaveBeenCalledWith(
        'set-1',
        expect.objectContaining({
          isAIGenerated: true,
          title: 'Greetings Practice',
          description: 'Basic Vietnamese greeting exercises',
        }),
      );
    });

    it('throws when set is not custom', async () => {
      exerciseSetsRepo.findById.mockResolvedValue({
        id: 'set-1',
        isCustom: false,
      } as any);

      await expect(service.generateCustom('set-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws when set already has exercises', async () => {
      exerciseSetsRepo.findById.mockResolvedValue({
        id: 'set-1',
        isCustom: true,
        customConfig: {
          questionCount: 5,
          exerciseTypes: [ExerciseType.MATCHING],
          focusArea: 'vocabulary',
        },
      } as any);
      exercisesRepo.findBySetId.mockResolvedValue([{ id: 'ex-1' }] as any);

      await expect(service.generateCustom('set-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('generate', () => {
    it('generates exercises for an empty set', async () => {
      exerciseSetsRepo.findById.mockResolvedValue({
        id: 'set-1',
        lessonId: 'lesson-1',
        isCustom: false,
        title: 'Default',
      } as any);
      exercisesRepo.findBySetId.mockResolvedValue([]);
      exercisesRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exerciseSetsRepo.update.mockResolvedValue({} as any);
      contextLoader.loadLessonContext.mockResolvedValue(mockLessonContext);

      genaiService.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      const result = await service.generate('set-1', 'user-1');

      expect(result).toHaveLength(1);
    });

    it('throws when set already has exercises', async () => {
      exerciseSetsRepo.findById.mockResolvedValue({
        id: 'set-1',
        lessonId: 'lesson-1',
      } as any);
      exercisesRepo.findBySetId.mockResolvedValue([{ id: 'ex-1' }] as any);

      await expect(service.generate('set-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('passes userPrompt override to doGenerate', async () => {
      exerciseSetsRepo.findById.mockResolvedValue({
        id: 'set-1',
        lessonId: 'lesson-1',
        isCustom: true,
        customConfig: {
          questionCount: 5,
          exerciseTypes: [ExerciseType.MATCHING],
          focusArea: 'both',
        },
        userPrompt: 'stored prompt',
      } as any);
      exercisesRepo.findBySetId.mockResolvedValue([]);
      exercisesRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exerciseSetsRepo.update.mockResolvedValue({} as any);
      contextLoader.loadLessonContext.mockResolvedValue(mockLessonContext);

      genaiService.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      await service.generate('set-1', 'user-1', 'override prompt');

      expect(genaiService.renderPrompt).toHaveBeenCalledWith(
        'exercise-generation-lesson',
        expect.objectContaining({
          userPromptSection: '\n### User Request\noverride prompt\n',
        }),
      );
    });
  });

  describe('regenerate', () => {
    it('creates regenerated set with new fields', async () => {
      const originalSet = {
        id: 'set-1',
        lessonId: 'lesson-1',
        moduleId: null,
        courseId: null,
        isCustom: true,
        customConfig: {
          questionCount: 5,
          exerciseTypes: [ExerciseType.MATCHING],
          focusArea: 'vocabulary',
        },
        title: 'Greetings Practice',
        description: 'A practice set',
        userPrompt: 'Focus on greetings',
        orderIndex: 1,
      };
      const newSet = { ...originalSet, id: 'set-2' };

      exerciseSetsRepo.findById.mockResolvedValue(originalSet as any);
      exerciseSetsRepo.create.mockResolvedValue(newSet as any);

      const result = await service.createRegeneratedSet('set-1');

      expect(result.lessonId).toBe('lesson-1');
      expect(exerciseSetsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          lessonId: 'lesson-1',
          moduleId: null,
          courseId: null,
          description: 'A practice set',
          userPrompt: 'Focus on greetings',
          replacesSetId: 'set-1',
        }),
      );
    });

    it('overrides userPrompt when provided', async () => {
      const originalSet = {
        id: 'set-1',
        lessonId: 'lesson-1',
        moduleId: null,
        courseId: null,
        isCustom: true,
        customConfig: {
          questionCount: 5,
          exerciseTypes: [ExerciseType.MATCHING],
          focusArea: 'vocabulary',
        },
        title: 'Greetings Practice',
        description: 'A practice set',
        userPrompt: 'Focus on greetings',
        orderIndex: 1,
      };
      const newSet = { ...originalSet, id: 'set-2' };

      exerciseSetsRepo.findById.mockResolvedValue(originalSet as any);
      exerciseSetsRepo.create.mockResolvedValue(newSet as any);

      await service.createRegeneratedSet('set-1', 'new override prompt');

      expect(exerciseSetsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userPrompt: 'new override prompt',
        }),
      );
    });

    it('keeps original userPrompt when override is undefined', async () => {
      const originalSet = {
        id: 'set-1',
        lessonId: 'lesson-1',
        moduleId: null,
        courseId: null,
        isCustom: true,
        customConfig: {
          questionCount: 5,
          exerciseTypes: [ExerciseType.MATCHING],
          focusArea: 'vocabulary',
        },
        title: 'Greetings Practice',
        description: null,
        userPrompt: 'original prompt',
        orderIndex: 1,
      };
      const newSet = { ...originalSet, id: 'set-2' };

      exerciseSetsRepo.findById.mockResolvedValue(originalSet as any);
      exerciseSetsRepo.create.mockResolvedValue(newSet as any);

      await service.createRegeneratedSet('set-1');

      expect(exerciseSetsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userPrompt: 'original prompt',
        }),
      );
    });
  });

  describe('renderPrompt usage', () => {
    it('uses GenaiService.renderPrompt with exercise-generation-lesson template', async () => {
      const customSet = {
        id: 'set-1',
        lessonId: 'lesson-1',
        isCustom: true,
        customConfig: {
          questionCount: 5,
          exerciseTypes: [ExerciseType.MATCHING],
          focusArea: 'vocabulary',
        },
        title: 'Custom Practice',
        userPrompt: 'Focus on greetings',
      };
      exerciseSetsRepo.findById.mockResolvedValue(customSet as any);
      exercisesRepo.findBySetId.mockResolvedValue([]);
      exercisesRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exerciseSetsRepo.update.mockResolvedValue({} as any);
      contextLoader.loadLessonContext.mockResolvedValue(mockLessonContext);

      genaiService.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      await service.generateCustom('set-1', 'user-1');

      expect(genaiService.renderPrompt).toHaveBeenCalledWith(
        'exercise-generation-lesson',
        expect.objectContaining({
          questionCount: '5',
          label: 'Custom (vocabulary)',
          lessonTitle: 'Greetings',
          userPromptSection: '\n### User Request\nFocus on greetings\n',
        }),
      );
    });

    it('omits userPromptSection when no userPrompt on set', async () => {
      const customSet = {
        id: 'set-1',
        lessonId: 'lesson-1',
        isCustom: true,
        customConfig: {
          questionCount: 5,
          exerciseTypes: [ExerciseType.MATCHING],
          focusArea: 'vocabulary',
        },
        title: 'Custom Practice',
      };
      exerciseSetsRepo.findById.mockResolvedValue(customSet as any);
      exercisesRepo.findBySetId.mockResolvedValue([]);
      exercisesRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exerciseSetsRepo.update.mockResolvedValue({} as any);
      contextLoader.loadLessonContext.mockResolvedValue(mockLessonContext);

      genaiService.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      await service.generateCustom('set-1', 'user-1');

      expect(genaiService.renderPrompt).toHaveBeenCalledWith(
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
        customConfig: {
          questionCount: 5,
          exerciseTypes: [ExerciseType.MATCHING],
          focusArea: 'both',
        },
        title: 'Custom Practice',
        userPrompt: 'Cross-lesson review',
      };
      exerciseSetsRepo.findById.mockResolvedValue(moduleSet as any);
      exercisesRepo.findBySetId.mockResolvedValue([]);
      exercisesRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exerciseSetsRepo.update.mockResolvedValue({} as any);

      modulesRepo.findById.mockResolvedValue({
        id: 'module-1',
        title: 'Greetings Module',
        lessons: [{ id: 'lesson-1' }, { id: 'lesson-2' }],
      } as any);
      progressRepo.findCompletedByUserInLessons.mockResolvedValue([
        { lessonId: 'lesson-1' },
      ] as any);
      contextLoader.loadModuleContext.mockResolvedValue(mockMergedContext);

      genaiService.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      await service.generateCustom('set-1', 'user-1');

      expect(contextLoader.loadModuleContext).toHaveBeenCalledWith([
        'lesson-1',
      ]);
      expect(genaiService.renderPrompt).toHaveBeenCalledWith(
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
        customConfig: {
          questionCount: 5,
          exerciseTypes: [ExerciseType.MATCHING],
          focusArea: 'both',
        },
        title: 'Custom Practice',
      };
      exerciseSetsRepo.findById.mockResolvedValue(moduleSet as any);
      exercisesRepo.findBySetId.mockResolvedValue([]);
      modulesRepo.findById.mockResolvedValue(null);
      exerciseSetsRepo.update.mockResolvedValue({} as any);
      exerciseSetsRepo.softDelete.mockResolvedValue(undefined as any);

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
        customConfig: {
          questionCount: 5,
          exerciseTypes: [ExerciseType.MATCHING],
          focusArea: 'both',
        },
        title: 'Custom Practice',
        userPrompt: 'Course-wide review',
      };
      exerciseSetsRepo.findById.mockResolvedValue(courseSet as any);
      exercisesRepo.findBySetId.mockResolvedValue([]);
      exercisesRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exerciseSetsRepo.update.mockResolvedValue({} as any);

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

      genaiService.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      await service.generateCustom('set-1', 'user-1');

      expect(contextLoader.loadCourseContext).toHaveBeenCalledWith([
        'lesson-1',
        'lesson-2',
      ]);
      expect(genaiService.renderPrompt).toHaveBeenCalledWith(
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
        customConfig: {
          questionCount: 5,
          exerciseTypes: [ExerciseType.MATCHING],
          focusArea: 'both',
        },
        title: 'Custom Practice',
      };
      exerciseSetsRepo.findById.mockResolvedValue(courseSet as any);
      exercisesRepo.findBySetId.mockResolvedValue([]);
      exercisesRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exerciseSetsRepo.update.mockResolvedValue({} as any);

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

      genaiService.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      await service.generateCustom('set-1', 'user-1');

      expect(contextLoader.loadCourseContext).toHaveBeenCalledWith([
        'lesson-1',
        'lesson-2',
      ]);
    });

    it('throws when courseId set has no course found', async () => {
      const courseSet = {
        id: 'set-1',
        courseId: 'course-1',
        moduleId: null,
        lessonId: null,
        isCustom: true,
        customConfig: {
          questionCount: 5,
          exerciseTypes: [ExerciseType.MATCHING],
          focusArea: 'both',
        },
        title: 'Custom Practice',
      };
      exerciseSetsRepo.findById.mockResolvedValue(courseSet as any);
      exercisesRepo.findBySetId.mockResolvedValue([]);
      coursesRepo.findById.mockResolvedValue(null);
      exerciseSetsRepo.update.mockResolvedValue({} as any);
      exerciseSetsRepo.softDelete.mockResolvedValue(undefined as any);

      await expect(service.generateCustom('set-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('AI title and description persistence', () => {
    it('persists AI-generated title and description to ExerciseSet', async () => {
      const customSet = {
        id: 'set-1',
        lessonId: 'lesson-1',
        isCustom: true,
        customConfig: {
          questionCount: 5,
          exerciseTypes: [ExerciseType.MATCHING],
          focusArea: 'both',
        },
        title: 'Custom Practice',
      };
      exerciseSetsRepo.findById.mockResolvedValue(customSet as any);
      exercisesRepo.findBySetId.mockResolvedValue([]);
      exercisesRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exerciseSetsRepo.update.mockResolvedValue({} as any);
      contextLoader.loadLessonContext.mockResolvedValue(mockLessonContext);

      genaiService.chatStructured.mockResolvedValue({
        text: validAiResponse,
      } as any);

      await service.generateCustom('set-1', 'user-1');

      expect(exerciseSetsRepo.update).toHaveBeenCalledWith(
        'set-1',
        expect.objectContaining({
          title: 'Greetings Practice',
          description: 'Basic Vietnamese greeting exercises',
        }),
      );
    });

    it('persists null description when AI omits it', async () => {
      const customSet = {
        id: 'set-1',
        lessonId: 'lesson-1',
        isCustom: true,
        customConfig: {
          questionCount: 5,
          exerciseTypes: [ExerciseType.MATCHING],
          focusArea: 'both',
        },
        title: 'Custom Practice',
      };
      exerciseSetsRepo.findById.mockResolvedValue(customSet as any);
      exercisesRepo.findBySetId.mockResolvedValue([]);
      exercisesRepo.create.mockResolvedValue({ id: 'ex-1' } as any);
      exerciseSetsRepo.update.mockResolvedValue({} as any);
      contextLoader.loadLessonContext.mockResolvedValue(mockLessonContext);

      const responseNoDesc = JSON.stringify({
        title: 'Vocabulary Drill',
        exercises: [
          {
            exerciseType: 'matching',
            question: 'Match words',
            correctAnswer: { matches: [] },
          },
        ],
      });

      genaiService.chatStructured.mockResolvedValue({
        text: responseNoDesc,
      } as any);

      await service.generateCustom('set-1', 'user-1');

      expect(exerciseSetsRepo.update).toHaveBeenCalledWith(
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
      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].exerciseType).toBe('matching');
    });

    it('parses response without optional description', () => {
      const responseNoDesc = JSON.stringify({
        title: 'Vocabulary Drill',
        exercises: [
          {
            exerciseType: 'multiple_choice',
            question: 'What does "Xin chào" mean?',
            correctAnswer: { selectedChoice: 'Hello' },
          },
        ],
      });

      const result = service.parseResponse(responseNoDesc);

      expect(result.title).toBe('Vocabulary Drill');
      expect(result.description).toBeUndefined();
      expect(result.exercises).toHaveLength(1);
    });

    it('throws when response is not valid JSON', () => {
      expect(() => service.parseResponse('not json')).toThrow(
        BadRequestException,
      );
    });

    it('throws when schema validation fails - missing title', () => {
      const invalid = JSON.stringify({
        exercises: [
          {
            exerciseType: 'matching',
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
        exercises: [],
      });

      expect(() => service.parseResponse(invalid)).toThrow(BadRequestException);
    });
  });
});
