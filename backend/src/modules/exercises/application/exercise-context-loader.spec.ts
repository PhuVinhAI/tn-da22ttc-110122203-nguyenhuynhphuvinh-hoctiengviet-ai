import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ExerciseContextLoader } from './exercise-context-loader';
import { ExerciseSetsRepository } from './repositories/exercise-sets.repository';
import { ExercisesRepository } from './repositories/exercises.repository';

describe('ExerciseContextLoader', () => {
  let service: ExerciseContextLoader;
  let dataSource: { getRepository: jest.Mock };
  let exerciseSetsRepo: jest.Mocked<ExerciseSetsRepository>;
  let exercisesRepo: jest.Mocked<ExercisesRepository>;

  const makeLesson = (overrides: any = {}) => ({
    id: 'lesson-1',
    title: 'Greetings',
    contents: [],
    vocabularies: [],
    grammarRules: [],
    ...overrides,
  });

  const makeVocabulary = (word: string, overrides: any = {}) => ({
    word,
    translation: `translation of ${word}`,
    phonetic: `phonetic of ${word}`,
    partOfSpeech: 'noun',
    exampleSentence: `example with ${word}`,
    exampleTranslation: `translation of example with ${word}`,
    ...overrides,
  });

  const makeGrammarRule = (title: string, overrides: any = {}) => ({
    title,
    explanation: `explanation of ${title}`,
    structure: `structure of ${title}`,
    examples: [{ vi: `ví dụ ${title}`, en: `example ${title}` }],
    ...overrides,
  });

  beforeEach(async () => {
    dataSource = { getRepository: jest.fn() };
    exerciseSetsRepo = {
      findActiveByLessonId: jest.fn(),
    } as any;
    exercisesRepo = {
      findBySetId: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExerciseContextLoader,
        { provide: DataSource, useValue: dataSource },
        { provide: ExerciseSetsRepository, useValue: exerciseSetsRepo },
        { provide: ExercisesRepository, useValue: exercisesRepo },
      ],
    }).compile();

    service = module.get<ExerciseContextLoader>(ExerciseContextLoader);
  });

  describe('loadLessonContext', () => {
    it('loads single lesson with vocabularies and grammar rules', async () => {
      const lesson = makeLesson({
        vocabularies: [makeVocabulary('Xin chào')],
        grammarRules: [makeGrammarRule('Basic greeting')],
      });

      const lessonRepo = { findOne: jest.fn().mockResolvedValue(lesson) };
      dataSource.getRepository.mockReturnValue(lessonRepo);
      exerciseSetsRepo.findActiveByLessonId.mockResolvedValue([]);

      const context = await service.loadLessonContext('lesson-1');

      expect(context.lessonTitle).toBe('Greetings');
      expect(context.vocabularies).toHaveLength(1);
      expect(context.vocabularies[0].word).toBe('Xin chào');
      expect(context.grammarRules).toHaveLength(1);
      expect(context.grammarRules[0].title).toBe('Basic greeting');
      expect(context.existingExercises).toEqual([]);
    });

    it('collects existing exercises from all sets', async () => {
      const lesson = makeLesson();
      const lessonRepo = { findOne: jest.fn().mockResolvedValue(lesson) };
      dataSource.getRepository.mockReturnValue(lessonRepo);

      exerciseSetsRepo.findActiveByLessonId.mockResolvedValue([
        { id: 'set-1' },
      ] as any);
      exercisesRepo.findBySetId.mockResolvedValue([
        {
          exerciseType: 'multiple_choice',
          question: 'Q1',
          correctAnswer: { selectedChoice: 'A' },
        },
      ] as any);

      const context = await service.loadLessonContext('lesson-1');

      expect(context.existingExercises).toHaveLength(1);
      expect(context.existingExercises[0].question).toBe('Q1');
    });

    it('throws BadRequestException when lesson not found', async () => {
      const lessonRepo = { findOne: jest.fn().mockResolvedValue(null) };
      dataSource.getRepository.mockReturnValue(lessonRepo);

      await expect(service.loadLessonContext('missing')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('loadModuleContext', () => {
    it('returns empty context for empty lesson IDs', async () => {
      const context = await service.loadModuleContext([]);

      expect(context.vocabularies).toEqual([]);
      expect(context.grammarRules).toEqual([]);
    });

    it('merges vocabularies from multiple lessons', async () => {
      const lesson1 = makeLesson({
        id: 'lesson-1',
        vocabularies: [makeVocabulary('Xin chào'), makeVocabulary('Cảm ơn')],
        grammarRules: [makeGrammarRule('Greeting')],
      });
      const lesson2 = makeLesson({
        id: 'lesson-2',
        vocabularies: [makeVocabulary('Tạm biệt')],
        grammarRules: [makeGrammarRule('Farewell')],
      });

      const lessonRepo = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(lesson1)
          .mockResolvedValueOnce(lesson2),
      };
      dataSource.getRepository.mockReturnValue(lessonRepo);
      exerciseSetsRepo.findActiveByLessonId.mockResolvedValue([]);

      const context = await service.loadModuleContext(['lesson-1', 'lesson-2']);

      expect(context.vocabularies).toHaveLength(3);
      expect(context.grammarRules).toHaveLength(2);
    });

    it('deduplicates vocabularies by word keeping last lesson version', async () => {
      const lesson1 = makeLesson({
        id: 'lesson-1',
        vocabularies: [
          makeVocabulary('Xin chào', {
            translation: 'Hello (formal)',
            phonetic: 'sin chow',
          }),
        ],
        grammarRules: [],
      });
      const lesson2 = makeLesson({
        id: 'lesson-2',
        vocabularies: [
          makeVocabulary('Xin chào', {
            translation: 'Hi (informal)',
            phonetic: 'sin chow informal',
          }),
        ],
        grammarRules: [],
      });

      const lessonRepo = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(lesson1)
          .mockResolvedValueOnce(lesson2),
      };
      dataSource.getRepository.mockReturnValue(lessonRepo);
      exerciseSetsRepo.findActiveByLessonId.mockResolvedValue([]);

      const context = await service.loadModuleContext(['lesson-1', 'lesson-2']);

      expect(context.vocabularies).toHaveLength(1);
      expect(context.vocabularies[0].translation).toBe('Hi (informal)');
    });

    it('deduplicates grammar rules by ruleName (title) keeping last lesson version', async () => {
      const lesson1 = makeLesson({
        id: 'lesson-1',
        vocabularies: [],
        grammarRules: [
          makeGrammarRule('Basic greeting', {
            explanation: 'Use "Xin chào" formally',
          }),
        ],
      });
      const lesson2 = makeLesson({
        id: 'lesson-2',
        vocabularies: [],
        grammarRules: [
          makeGrammarRule('Basic greeting', {
            explanation: 'Use "Chào" casually',
          }),
        ],
      });

      const lessonRepo = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(lesson1)
          .mockResolvedValueOnce(lesson2),
      };
      dataSource.getRepository.mockReturnValue(lessonRepo);
      exerciseSetsRepo.findActiveByLessonId.mockResolvedValue([]);

      const context = await service.loadModuleContext(['lesson-1', 'lesson-2']);

      expect(context.grammarRules).toHaveLength(1);
      expect(context.grammarRules[0].explanation).toBe('Use "Chào" casually');
    });

    it('skips lessons not found without failing entire merge', async () => {
      const lesson1 = makeLesson({
        id: 'lesson-1',
        vocabularies: [makeVocabulary('Xin chào')],
        grammarRules: [makeGrammarRule('Greeting')],
      });

      const lessonRepo = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(lesson1)
          .mockResolvedValueOnce(null),
      };
      dataSource.getRepository.mockReturnValue(lessonRepo);
      exerciseSetsRepo.findActiveByLessonId.mockResolvedValue([]);

      const context = await service.loadModuleContext([
        'lesson-1',
        'missing-lesson',
      ]);

      expect(context.vocabularies).toHaveLength(1);
      expect(context.grammarRules).toHaveLength(1);
    });
  });

  describe('loadCourseContext', () => {
    it('returns empty context for empty lesson IDs', async () => {
      const context = await service.loadCourseContext([]);

      expect(context.vocabularies).toEqual([]);
      expect(context.grammarRules).toEqual([]);
    });

    it('uses same merge+dedupe logic as module context', async () => {
      const lesson1 = makeLesson({
        id: 'lesson-1',
        vocabularies: [makeVocabulary('Xin chào'), makeVocabulary('Cảm ơn')],
        grammarRules: [
          makeGrammarRule('Greeting'),
          makeGrammarRule('Thanking'),
        ],
      });
      const lesson2 = makeLesson({
        id: 'lesson-2',
        vocabularies: [
          makeVocabulary('Xin chào', { translation: 'Hi there' }),
          makeVocabulary('Tạm biệt'),
        ],
        grammarRules: [
          makeGrammarRule('Greeting', { explanation: 'Updated greeting' }),
        ],
      });

      const lessonRepo = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(lesson1)
          .mockResolvedValueOnce(lesson2),
      };
      dataSource.getRepository.mockReturnValue(lessonRepo);
      exerciseSetsRepo.findActiveByLessonId.mockResolvedValue([]);

      const context = await service.loadCourseContext(['lesson-1', 'lesson-2']);

      expect(context.vocabularies).toHaveLength(3);
      expect(
        context.vocabularies.find((v) => v.word === 'Xin chào')!.translation,
      ).toBe('Hi there');
      expect(context.grammarRules).toHaveLength(2);
      expect(
        context.grammarRules.find((g) => g.title === 'Greeting')!.explanation,
      ).toBe('Updated greeting');
    });
  });
});
