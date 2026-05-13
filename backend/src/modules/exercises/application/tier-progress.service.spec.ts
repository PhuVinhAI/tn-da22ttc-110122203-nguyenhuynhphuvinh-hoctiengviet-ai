import { TierProgressService } from './tier-progress.service';
import { ExerciseSetsRepository } from './repositories/exercise-sets.repository';
import { ExercisesRepository } from './repositories/exercises.repository';
import { UserExerciseResultsRepository } from './repositories/user-exercise-results.repository';
import { ExerciseTier } from '../../../common/enums';

describe('TierProgressService', () => {
  let service: TierProgressService;
  let exerciseSetsRepo: jest.Mocked<ExerciseSetsRepository>;
  let exercisesRepo: jest.Mocked<ExercisesRepository>;
  let resultsRepo: jest.Mocked<UserExerciseResultsRepository>;

  beforeEach(() => {
    exerciseSetsRepo = {
      findActiveByLessonId: jest.fn(),
    } as any;

    exercisesRepo = {
      findBySetId: jest.fn(),
    } as any;

    resultsRepo = {
      findByUserAndExerciseIds: jest.fn(),
    } as any;

    service = new TierProgressService(
      exerciseSetsRepo,
      exercisesRepo,
      resultsRepo,
    );
  });

  describe('computeUnlockedTiers', () => {
    it('always unlocks BASIC', () => {
      const result = service.computeUnlockedTiers([]);
      expect(result).toEqual([ExerciseTier.BASIC]);
    });

    it('unlocks EASY when BASIC completed with >=80% correct', () => {
      const progresses = [
        {
          tier: ExerciseTier.BASIC,
          title: 'Basic',
          isCustom: false,
          isAIGenerated: false,
          totalExercises: 10,
          attempted: 10,
          correct: 8,
          percentComplete: 100,
          percentCorrect: 80,
        },
      ];
      const result = service.computeUnlockedTiers(progresses);
      expect(result).toEqual([ExerciseTier.BASIC, ExerciseTier.EASY]);
    });

    it('does NOT unlock EASY when BASIC <80% correct', () => {
      const progresses = [
        {
          tier: ExerciseTier.BASIC,
          title: 'Basic',
          isCustom: false,
          isAIGenerated: false,
          totalExercises: 10,
          attempted: 10,
          correct: 7,
          percentComplete: 100,
          percentCorrect: 70,
        },
      ];
      const result = service.computeUnlockedTiers(progresses);
      expect(result).toEqual([ExerciseTier.BASIC]);
    });

    it('does NOT unlock EASY when BASIC not fully attempted', () => {
      const progresses = [
        {
          tier: ExerciseTier.BASIC,
          title: 'Basic',
          isCustom: false,
          isAIGenerated: false,
          totalExercises: 10,
          attempted: 9,
          correct: 9,
          percentComplete: 90,
          percentCorrect: 100,
        },
      ];
      const result = service.computeUnlockedTiers(progresses);
      expect(result).toEqual([ExerciseTier.BASIC]);
    });

    it('unlocks sequentially through all tiers', () => {
      const progresses = [
        {
          tier: ExerciseTier.BASIC,
          title: 'Basic',
          isCustom: false,
          isAIGenerated: false,
          totalExercises: 10,
          attempted: 10,
          correct: 9,
          percentComplete: 100,
          percentCorrect: 90,
        },
        {
          tier: ExerciseTier.EASY,
          title: 'Easy',
          isCustom: false,
          isAIGenerated: false,
          totalExercises: 10,
          attempted: 10,
          correct: 8,
          percentComplete: 100,
          percentCorrect: 80,
        },
        {
          tier: ExerciseTier.MEDIUM,
          title: 'Medium',
          isCustom: false,
          isAIGenerated: false,
          totalExercises: 10,
          attempted: 10,
          correct: 10,
          percentComplete: 100,
          percentCorrect: 100,
        },
        {
          tier: ExerciseTier.HARD,
          title: 'Hard',
          isCustom: false,
          isAIGenerated: false,
          totalExercises: 10,
          attempted: 10,
          correct: 8,
          percentComplete: 100,
          percentCorrect: 80,
        },
      ];
      const result = service.computeUnlockedTiers(progresses);
      expect(result).toEqual([
        ExerciseTier.BASIC,
        ExerciseTier.EASY,
        ExerciseTier.MEDIUM,
        ExerciseTier.HARD,
        ExerciseTier.EXPERT,
      ]);
    });

    it('stops unlock chain at incomplete tier', () => {
      const progresses = [
        {
          tier: ExerciseTier.BASIC,
          title: 'Basic',
          isCustom: false,
          isAIGenerated: false,
          totalExercises: 10,
          attempted: 10,
          correct: 9,
          percentComplete: 100,
          percentCorrect: 90,
        },
        {
          tier: ExerciseTier.EASY,
          title: 'Easy',
          isCustom: false,
          isAIGenerated: false,
          totalExercises: 10,
          attempted: 5,
          correct: 5,
          percentComplete: 50,
          percentCorrect: 100,
        },
        {
          tier: ExerciseTier.MEDIUM,
          title: 'Medium',
          isCustom: false,
          isAIGenerated: false,
          totalExercises: 10,
          attempted: 10,
          correct: 10,
          percentComplete: 100,
          percentCorrect: 100,
        },
      ];
      const result = service.computeUnlockedTiers(progresses);
      expect(result).toEqual([ExerciseTier.BASIC, ExerciseTier.EASY]);
    });

    it('boundary: 79% correct does NOT unlock next tier', () => {
      const progresses = [
        {
          tier: ExerciseTier.BASIC,
          title: 'Basic',
          isCustom: false,
          isAIGenerated: false,
          totalExercises: 100,
          attempted: 100,
          correct: 79,
          percentComplete: 100,
          percentCorrect: 79,
        },
      ];
      const result = service.computeUnlockedTiers(progresses);
      expect(result).toEqual([ExerciseTier.BASIC]);
    });

    it('boundary: 80% correct DOES unlock next tier', () => {
      const progresses = [
        {
          tier: ExerciseTier.BASIC,
          title: 'Basic',
          isCustom: false,
          isAIGenerated: false,
          totalExercises: 100,
          attempted: 100,
          correct: 80,
          percentComplete: 100,
          percentCorrect: 80,
        },
      ];
      const result = service.computeUnlockedTiers(progresses);
      expect(result).toEqual([ExerciseTier.BASIC, ExerciseTier.EASY]);
    });
  });

  describe('getLessonTierSummary', () => {
    it('returns sets with progress and unlockedTiers', async () => {
      const mockSets = [
        {
          id: 'set-1',
          lessonId: 'lesson-1',
          tier: ExerciseTier.BASIC,
          title: 'Basic Exercises',
          isCustom: false,
          isAIGenerated: false,
          orderIndex: 0,
        },
      ];
      exerciseSetsRepo.findActiveByLessonId.mockResolvedValue(mockSets as any);

      const exercises = [{ id: 'ex-1' }, { id: 'ex-2' }];
      exercisesRepo.findBySetId.mockResolvedValue(exercises as any);

      const results = [{ isCorrect: true }, { isCorrect: false }];
      resultsRepo.findByUserAndExerciseIds.mockResolvedValue(results as any);

      const summary = await service.getLessonTierSummary('lesson-1', 'user-1');

      expect(summary.sets).toHaveLength(1);
      expect(summary.sets[0].tier).toBe(ExerciseTier.BASIC);
      expect(summary.sets[0].totalExercises).toBe(2);
      expect(summary.sets[0].attempted).toBe(2);
      expect(summary.sets[0].correct).toBe(1);
      expect(summary.sets[0].percentComplete).toBe(100);
      expect(summary.sets[0].percentCorrect).toBe(50);
      expect(summary.unlockedTiers).toEqual([ExerciseTier.BASIC]);
    });

    it('handles empty lesson (no sets)', async () => {
      exerciseSetsRepo.findActiveByLessonId.mockResolvedValue([]);

      const summary = await service.getLessonTierSummary('lesson-1', 'user-1');

      expect(summary.sets).toHaveLength(0);
      expect(summary.unlockedTiers).toEqual([ExerciseTier.BASIC]);
    });
  });
});
