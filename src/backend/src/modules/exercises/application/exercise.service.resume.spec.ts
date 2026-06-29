import { ExerciseService } from './exercise.service';
import { ExercisesRepository } from './repositories/exercises.repository';
import { QuestionsRepository } from './repositories/questions.repository';
import { UserQuestionResultsRepository } from './repositories/user-question-results.repository';
import { NotFoundException } from '@nestjs/common';

describe('ExerciseService - Resume & Reset', () => {
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
      deleteByUserAndQuestionIds: jest.fn(),
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

  describe('getResumeInfo', () => {
    it('returns resume info for incomplete set', async () => {
      exercisesRepo.findById.mockResolvedValue({
        id: 'set-1',
        lessonId: 'lesson-1',
        title: 'Basic',
      } as any);

      const exercises = Array.from({ length: 10 }, (_, i) => ({
        id: `ex-${i}`,
      }));
      questionsRepo.findByExerciseId.mockResolvedValue(exercises as any);

      const results = Array.from({ length: 5 }, () => ({ isCorrect: true }));
      resultsRepo.findByUserAndQuestionIds.mockResolvedValue(results as any);

      const info = await service.getResumeInfo('set-1', 'user-1');

      expect(info.canResume).toBe(true);
      expect(info.attempted).toBe(5);
      expect(info.totalQuestions).toBe(10);
    });

    it('returns canResume=false for completed set', async () => {
      exercisesRepo.findById.mockResolvedValue({
        id: 'set-1',
        lessonId: 'lesson-1',
        title: 'Basic',
      } as any);

      const exercises = Array.from({ length: 10 }, (_, i) => ({
        id: `ex-${i}`,
      }));
      questionsRepo.findByExerciseId.mockResolvedValue(exercises as any);

      const results = Array.from({ length: 10 }, () => ({ isCorrect: true }));
      resultsRepo.findByUserAndQuestionIds.mockResolvedValue(results as any);

      const info = await service.getResumeInfo('set-1', 'user-1');

      expect(info.canResume).toBe(false);
      expect(info.attempted).toBe(10);
    });

    it('returns canResume=false for unstarted set', async () => {
      exercisesRepo.findById.mockResolvedValue({
        id: 'set-1',
        lessonId: 'lesson-1',
        title: 'Basic',
      } as any);

      const exercises = Array.from({ length: 10 }, (_, i) => ({
        id: `ex-${i}`,
      }));
      questionsRepo.findByExerciseId.mockResolvedValue(exercises as any);

      resultsRepo.findByUserAndQuestionIds.mockResolvedValue([]);

      const info = await service.getResumeInfo('set-1', 'user-1');

      expect(info.canResume).toBe(false);
      expect(info.attempted).toBe(0);
    });

    it('throws NotFoundException for unknown set', async () => {
      exercisesRepo.findById.mockResolvedValue(null);

      await expect(service.getResumeInfo('missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('resetProgress', () => {
    it('deletes all results for exercises in the set', async () => {
      exercisesRepo.findById.mockResolvedValue({
        id: 'set-1',
        lessonId: 'lesson-1',
        title: 'Basic',
      } as any);

      const exercises = [{ id: 'ex-1' }, { id: 'ex-2' }, { id: 'ex-3' }];
      questionsRepo.findByExerciseId.mockResolvedValue(exercises as any);

      await service.resetProgress('set-1', 'user-1');

      expect(resultsRepo.deleteByUserAndQuestionIds).toHaveBeenCalledWith(
        'user-1',
        ['ex-1', 'ex-2', 'ex-3'],
      );
    });

    it('handles set with no exercises', async () => {
      exercisesRepo.findById.mockResolvedValue({
        id: 'set-1',
        lessonId: 'lesson-1',
        title: 'Basic',
      } as any);
      questionsRepo.findByExerciseId.mockResolvedValue([]);

      await service.resetProgress('set-1', 'user-1');

      expect(resultsRepo.deleteByUserAndQuestionIds).toHaveBeenCalledWith(
        'user-1',
        [],
      );
    });

    it('throws NotFoundException for unknown set', async () => {
      exercisesRepo.findById.mockResolvedValue(null);

      await expect(service.resetProgress('missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
