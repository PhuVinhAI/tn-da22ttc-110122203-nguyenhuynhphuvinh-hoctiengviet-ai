import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ExerciseGenerationService } from './exercise-generation.service';
import { GenaiService } from '../../../infrastructure/genai/genai.service';
import { ExerciseSetsRepository } from './repositories/exercise-sets.repository';
import { ExercisesRepository } from './repositories/exercises.repository';
import { ExerciseContextLoader } from './exercise-context-loader';
import { ExerciseType } from '../../../common/enums';

describe('ExerciseGenerationService', () => {
  let service: ExerciseGenerationService;
  let genaiService: jest.Mocked<GenaiService>;
  let exerciseSetsRepo: jest.Mocked<ExerciseSetsRepository>;
  let exercisesRepo: jest.Mocked<ExercisesRepository>;
  let contextLoader: jest.Mocked<ExerciseContextLoader>;

  const validAiResponse = JSON.stringify({
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExerciseGenerationService,
        { provide: GenaiService, useValue: genaiService },
        { provide: ExerciseSetsRepository, useValue: exerciseSetsRepo },
        { provide: ExercisesRepository, useValue: exercisesRepo },
        { provide: ExerciseContextLoader, useValue: contextLoader },
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
        expect.objectContaining({ isAIGenerated: true }),
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
        title: 'Custom Practice',
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
  });

  describe('buildPrompt', () => {
    it('includes lesson context and guidelines', () => {
      const context = {
        lessonTitle: 'Greetings',
        contents: [],
        vocabularies: [],
        grammarRules: [],
        existingExercises: [],
      };
      const guidelines = {
        questionCount: 5,
        preferredTypes: [ExerciseType.MATCHING],
        description: 'Test description',
      };

      const prompt = service.buildPrompt(context, guidelines, 'Custom');

      expect(prompt).toContain('Generate 5 Vietnamese language exercises');
      expect(prompt).toContain('Test description');
      expect(prompt).toContain('matching');
    });

    it('lists existing exercises to avoid duplication', () => {
      const context = {
        lessonTitle: 'Greetings',
        contents: [],
        vocabularies: [],
        grammarRules: [],
        existingExercises: [
          {
            exerciseType: 'multiple_choice',
            question: 'What does "Xin chào" mean?',
            correctAnswer: { selectedChoice: 'Hello' },
          },
        ],
      };
      const guidelines = {
        questionCount: 3,
        preferredTypes: [ExerciseType.MATCHING],
        description: 'Test',
      };

      const prompt = service.buildPrompt(context, guidelines, 'Custom');

      expect(prompt).toContain('Existing Exercises (DO NOT duplicate these)');
      expect(prompt).toContain('What does "Xin chào" mean?');
    });
  });

  describe('parseResponse', () => {
    it('parses valid JSON response', () => {
      const result = service.parseResponse(validAiResponse);

      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].exerciseType).toBe('matching');
    });

    it('throws when response is not valid JSON', () => {
      expect(() => service.parseResponse('not json')).toThrow(
        BadRequestException,
      );
    });

    it('throws when schema validation fails', () => {
      const invalid = JSON.stringify({ exercises: [] });

      expect(() => service.parseResponse(invalid)).toThrow(BadRequestException);
    });
  });
});
