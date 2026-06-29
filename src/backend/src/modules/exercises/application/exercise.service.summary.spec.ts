import { ExerciseService } from './exercise.service';
import { ExercisesRepository } from './repositories/exercises.repository';
import { QuestionsRepository } from './repositories/questions.repository';
import { UserQuestionResultsRepository } from './repositories/user-question-results.repository';
import { NotFoundException } from '@nestjs/common';

describe('ExerciseService - Summary', () => {
  let service: ExerciseService;
  let exercisesRepo: jest.Mocked<ExercisesRepository>;
  let questionsRepo: jest.Mocked<QuestionsRepository>;
  let resultsRepo: jest.Mocked<UserQuestionResultsRepository>;

  beforeEach(() => {
    exercisesRepo = {
      findById: jest.fn(),
    } as any;

    questionsRepo = {
      findByExerciseId: jest.fn(),
    } as any;

    resultsRepo = {
      findByUserAndQuestionIds: jest.fn(),
    } as any;

    service = new ExerciseService(
      exercisesRepo,
      questionsRepo,
      resultsRepo,
      {
        generate: jest.fn(),
        regenerate: jest.fn(),
        generateCustom: jest.fn(),
      } as any,
      { findCompletedByUserInLessons: jest.fn() } as any,
      { findCompletedByUserInModules: jest.fn() } as any,
      { findById: jest.fn() } as any,
      { findById: jest.fn() } as any,
    );
  });

  describe('getSummary', () => {
    it('returns overall stats with wrong questions and correct answers', async () => {
      exercisesRepo.findById.mockResolvedValue({
        id: 'set-1',
        lessonId: 'lesson-1',
        title: 'Basic',
      } as any);

      const exercises = [
        {
          id: 'ex-1',
          question: 'Question 1',
          questionType: 'MULTIPLE_CHOICE',
          correctAnswer: { value: 'A' },
          explanation: 'Because A is correct',
          orderIndex: 0,
        },
        {
          id: 'ex-2',
          question: 'Question 2',
          questionType: 'FILL_BLANK',
          correctAnswer: { value: 'B' },
          explanation: 'Because B is correct',
          orderIndex: 1,
        },
        {
          id: 'ex-3',
          question: 'Question 3',
          questionType: 'TRANSLATION',
          correctAnswer: { value: 'C' },
          explanation: 'Because C is correct',
          orderIndex: 2,
        },
      ];
      questionsRepo.findByExerciseId.mockResolvedValue(exercises as any);

      const results = [
        { questionId: 'ex-1', isCorrect: true },
        { questionId: 'ex-2', isCorrect: false },
        { questionId: 'ex-3', isCorrect: false },
      ];
      resultsRepo.findByUserAndQuestionIds.mockResolvedValue(results as any);

      const summary = await service.getSummary('set-1', 'user-1');

      expect(summary.stats.totalQuestions).toBe(3);
      expect(summary.stats.attempted).toBe(3);
      expect(summary.stats.correct).toBe(1);
      expect(summary.stats.percentCorrect).toBe(33.33);
      expect(summary.wrongQuestions).toHaveLength(2);
      expect(summary.wrongQuestions[0].questionId).toBe('ex-2');
      expect(summary.wrongQuestions[0].correctAnswer).toEqual({ value: 'B' });
      expect(summary.wrongQuestions[0].explanation).toBe(
        'Because B is correct',
      );
      expect(summary.wrongQuestions[1].questionId).toBe('ex-3');
    });

    it('returns empty wrongQuestions when all correct', async () => {
      exercisesRepo.findById.mockResolvedValue({
        id: 'set-1',
        lessonId: 'lesson-1',
        title: 'Basic',
      } as any);

      const exercises = [
        {
          id: 'ex-1',
          question: 'Q1',
          questionType: 'MULTIPLE_CHOICE',
          correctAnswer: { value: 'A' },
          explanation: 'Exp',
          orderIndex: 0,
        },
        {
          id: 'ex-2',
          question: 'Q2',
          questionType: 'FILL_BLANK',
          correctAnswer: { value: 'B' },
          explanation: 'Exp2',
          orderIndex: 1,
        },
      ];
      questionsRepo.findByExerciseId.mockResolvedValue(exercises as any);

      const results = [
        { questionId: 'ex-1', isCorrect: true },
        { questionId: 'ex-2', isCorrect: true },
      ];
      resultsRepo.findByUserAndQuestionIds.mockResolvedValue(results as any);

      const summary = await service.getSummary('set-1', 'user-1');

      expect(summary.wrongQuestions).toHaveLength(0);
      expect(summary.stats.percentComplete).toBe(100);
    });

    it('throws NotFoundException for unknown set', async () => {
      exercisesRepo.findById.mockResolvedValue(null);

      await expect(service.getSummary('missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
