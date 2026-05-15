import { Test, TestingModule } from '@nestjs/testing';
import { DailyGoalProgressService } from './daily-goal-progress.service';
import { DailyGoalProgressRepository } from './daily-goal-progress.repository';
import { DailyGoalsRepository } from './daily-goals.repository';
import { DailyStreakService } from './daily-streak.service';
import { UserExerciseResultsRepository } from '../../exercises/application/repositories/user-exercise-results.repository';
import { ProgressRepository } from '../../progress/application/progress.repository';
import { DailyGoal } from '../domain/daily-goal.entity';
import { DailyGoalProgress } from '../domain/daily-goal-progress.entity';
import { DailyStreak } from '../domain/daily-streak.entity';
import { GoalType } from '../../../common/enums';

describe('DailyGoalProgressService', () => {
  let service: DailyGoalProgressService;
  let progressRepo: jest.Mocked<DailyGoalProgressRepository>;
  let goalsRepo: jest.Mocked<DailyGoalsRepository>;
  let streakService: jest.Mocked<DailyStreakService>;
  let exerciseResultsRepo: jest.Mocked<UserExerciseResultsRepository>;
  let userProgressRepo: jest.Mocked<ProgressRepository>;

  beforeEach(async () => {
    const progressRepoMock = {
      findByUserIdAndDate: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
    };

    const goalsRepoMock = {
      findByUserId: jest.fn(),
      findByUserIdAndGoalType: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const streakServiceMock = {
      updateStreak: jest.fn(),
      getStreak: jest.fn(),
    };

    const exerciseResultsRepoMock = {
      countByUserIdAndDateRange: jest.fn(),
    };

    const userProgressRepoMock = {
      countCompletedByUserIdAndDateRange: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyGoalProgressService,
        {
          provide: DailyGoalProgressRepository,
          useValue: progressRepoMock,
        },
        { provide: DailyGoalsRepository, useValue: goalsRepoMock },
        { provide: DailyStreakService, useValue: streakServiceMock },
        {
          provide: UserExerciseResultsRepository,
          useValue: exerciseResultsRepoMock,
        },
        { provide: ProgressRepository, useValue: userProgressRepoMock },
      ],
    }).compile();

    service = module.get<DailyGoalProgressService>(DailyGoalProgressService);
    progressRepo = module.get(DailyGoalProgressRepository);
    goalsRepo = module.get(DailyGoalsRepository);
    streakService = module.get(DailyStreakService);
    exerciseResultsRepo = module.get(UserExerciseResultsRepository);
    userProgressRepo = module.get(ProgressRepository);
  });

  describe('getTodayProgress', () => {
    it('returns progress with all goals met', async () => {
      const mockGoals = [
        {
          id: 'g1',
          userId: 'user-1',
          goalType: GoalType.EXERCISES,
          targetValue: 5,
          user: null as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: undefined,
        },
        {
          id: 'g2',
          userId: 'user-1',
          goalType: GoalType.STUDY_MINUTES,
          targetValue: 15,
          user: null as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: undefined,
        },
      ] as DailyGoal[];

      goalsRepo.findByUserId.mockResolvedValue(mockGoals);
      exerciseResultsRepo.countByUserIdAndDateRange.mockResolvedValue(8);
      userProgressRepo.countCompletedByUserIdAndDateRange.mockResolvedValue(3);
      progressRepo.findByUserIdAndDate.mockResolvedValue({
        id: 'p1',
        userId: 'user-1',
        date: '2025-01-15',
        exercisesCompleted: 8,
        studyMinutes: 20,
        lessonsCompleted: 3,
        user: null as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      } as DailyGoalProgress);
      streakService.updateStreak.mockResolvedValue({
        id: 's1',
        userId: 'user-1',
        currentStreak: 3,
        longestStreak: 5,
        lastGoalMetDate: '2025-01-15',
        user: null as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      } as DailyStreak);

      const result = await service.getTodayProgress('user-1');

      expect(result.exercisesCompleted).toBe(8);
      expect(result.lessonsCompleted).toBe(3);
      expect(result.studyMinutes).toBe(20);
      expect(result.allGoalsMet).toBe(true);
      expect(result.goals).toHaveLength(2);
      expect(result.goals[0].met).toBe(true);
      expect(result.goals[1].met).toBe(true);
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(5);
    });

    it('returns allGoalsMet false when some goals not met', async () => {
      const mockGoals = [
        {
          id: 'g1',
          userId: 'user-1',
          goalType: GoalType.EXERCISES,
          targetValue: 10,
          user: null as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: undefined,
        },
        {
          id: 'g2',
          userId: 'user-1',
          goalType: GoalType.STUDY_MINUTES,
          targetValue: 30,
          user: null as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: undefined,
        },
      ] as DailyGoal[];

      goalsRepo.findByUserId.mockResolvedValue(mockGoals);
      exerciseResultsRepo.countByUserIdAndDateRange.mockResolvedValue(5);
      userProgressRepo.countCompletedByUserIdAndDateRange.mockResolvedValue(0);
      progressRepo.findByUserIdAndDate.mockResolvedValue(null);
      streakService.updateStreak.mockResolvedValue({
        id: 's1',
        userId: 'user-1',
        currentStreak: 0,
        longestStreak: 0,
        lastGoalMetDate: null,
        user: null as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      } as DailyStreak);

      const result = await service.getTodayProgress('user-1');

      expect(result.allGoalsMet).toBe(false);
      expect(result.goals[0].currentValue).toBe(5);
      expect(result.goals[0].met).toBe(false);
      expect(result.goals[1].currentValue).toBe(0);
      expect(result.goals[1].met).toBe(false);
    });

    it('returns allGoalsMet false when no goals exist', async () => {
      goalsRepo.findByUserId.mockResolvedValue([]);
      exerciseResultsRepo.countByUserIdAndDateRange.mockResolvedValue(0);
      userProgressRepo.countCompletedByUserIdAndDateRange.mockResolvedValue(0);
      progressRepo.findByUserIdAndDate.mockResolvedValue(null);
      streakService.updateStreak.mockResolvedValue({
        id: 's1',
        userId: 'user-1',
        currentStreak: 0,
        longestStreak: 0,
        lastGoalMetDate: null,
        user: null as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      } as DailyStreak);

      const result = await service.getTodayProgress('user-1');

      expect(result.allGoalsMet).toBe(false);
      expect(result.goals).toHaveLength(0);
    });

    it('defaults studyMinutes to 0 when no progress record exists', async () => {
      goalsRepo.findByUserId.mockResolvedValue([
        {
          id: 'g1',
          userId: 'user-1',
          goalType: GoalType.STUDY_MINUTES,
          targetValue: 15,
          user: null as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: undefined,
        },
      ] as DailyGoal[]);
      exerciseResultsRepo.countByUserIdAndDateRange.mockResolvedValue(0);
      userProgressRepo.countCompletedByUserIdAndDateRange.mockResolvedValue(0);
      progressRepo.findByUserIdAndDate.mockResolvedValue(null);
      streakService.updateStreak.mockResolvedValue({
        id: 's1',
        userId: 'user-1',
        currentStreak: 0,
        longestStreak: 0,
        lastGoalMetDate: null,
        user: null as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      } as DailyStreak);

      const result = await service.getTodayProgress('user-1');

      expect(result.studyMinutes).toBe(0);
    });

    it('aggregates LESSONS goal type correctly', async () => {
      goalsRepo.findByUserId.mockResolvedValue([
        {
          id: 'g1',
          userId: 'user-1',
          goalType: GoalType.LESSONS,
          targetValue: 2,
          user: null as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: undefined,
        },
      ] as DailyGoal[]);
      exerciseResultsRepo.countByUserIdAndDateRange.mockResolvedValue(0);
      userProgressRepo.countCompletedByUserIdAndDateRange.mockResolvedValue(3);
      progressRepo.findByUserIdAndDate.mockResolvedValue(null);
      streakService.updateStreak.mockResolvedValue({
        id: 's1',
        userId: 'user-1',
        currentStreak: 1,
        longestStreak: 1,
        lastGoalMetDate: '2025-01-15',
        user: null as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      } as DailyStreak);

      const result = await service.getTodayProgress('user-1');

      expect(result.lessonsCompleted).toBe(3);
      expect(result.goals[0].currentValue).toBe(3);
      expect(result.goals[0].met).toBe(true);
    });

    it('includes streak data in progress response', async () => {
      goalsRepo.findByUserId.mockResolvedValue([
        {
          id: 'g1',
          userId: 'user-1',
          goalType: GoalType.EXERCISES,
          targetValue: 5,
          user: null as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: undefined,
        },
      ] as DailyGoal[]);
      exerciseResultsRepo.countByUserIdAndDateRange.mockResolvedValue(8);
      userProgressRepo.countCompletedByUserIdAndDateRange.mockResolvedValue(0);
      progressRepo.findByUserIdAndDate.mockResolvedValue(null);
      streakService.updateStreak.mockResolvedValue({
        id: 's1',
        userId: 'user-1',
        currentStreak: 7,
        longestStreak: 10,
        lastGoalMetDate: '2025-01-15',
        user: null as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      } as DailyStreak);

      const result = await service.getTodayProgress('user-1');

      expect(result.currentStreak).toBe(7);
      expect(result.longestStreak).toBe(10);
      expect(streakService.updateStreak).toHaveBeenCalledWith(
        'user-1',
        true,
        expect.any(String),
      );
    });
  });

  describe('syncStudyMinutes', () => {
    it('upserts study minutes for today', async () => {
      progressRepo.upsert.mockResolvedValue({
        id: 'p1',
        userId: 'user-1',
        date: '2025-01-15',
        exercisesCompleted: 0,
        studyMinutes: 25,
        lessonsCompleted: 0,
        user: null as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      } as DailyGoalProgress);

      await service.syncStudyMinutes('user-1', 25);

      expect(progressRepo.upsert).toHaveBeenCalledWith(
        'user-1',
        expect.any(String),
        { studyMinutes: 25 },
      );
    });

    it('handles zero study minutes', async () => {
      progressRepo.upsert.mockResolvedValue({
        id: 'p1',
        userId: 'user-1',
        date: '2025-01-15',
        exercisesCompleted: 0,
        studyMinutes: 0,
        lessonsCompleted: 0,
        user: null as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      } as DailyGoalProgress);

      await service.syncStudyMinutes('user-1', 0);

      expect(progressRepo.upsert).toHaveBeenCalledWith(
        'user-1',
        expect.any(String),
        { studyMinutes: 0 },
      );
    });
  });

  describe('getProgressForGoalType', () => {
    it('returns exercisesCompleted for EXERCISES', () => {
      expect(service.getProgressForGoalType(GoalType.EXERCISES, 8, 20, 3)).toBe(
        8,
      );
    });

    it('returns studyMinutes for STUDY_MINUTES', () => {
      expect(
        service.getProgressForGoalType(GoalType.STUDY_MINUTES, 8, 20, 3),
      ).toBe(20);
    });

    it('returns lessonsCompleted for LESSONS', () => {
      expect(service.getProgressForGoalType(GoalType.LESSONS, 8, 20, 3)).toBe(
        3,
      );
    });
  });

  describe('getVnTodayRange', () => {
    it('returns a date range spanning one VN day', () => {
      const { start, end } = service.getVnTodayRange();

      expect(start.getFullYear()).toBeGreaterThan(2020);
      expect(end.getTime()).toBeGreaterThan(start.getTime());
      const diffMs = end.getTime() - start.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      expect(diffHours).toBeCloseTo(24, 0);
    });
  });
});
