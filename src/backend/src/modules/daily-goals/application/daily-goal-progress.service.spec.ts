import { Test, TestingModule } from '@nestjs/testing';
import { DailyGoalProgressService } from './daily-goal-progress.service';
import { DailyGoalsRepository } from './daily-goals.repository';
import { DailyStreakService } from './daily-streak.service';
import { UserQuestionResultsRepository } from '../../exercises/application/repositories/user-question-results.repository';
import { ProgressRepository } from '../../progress/application/progress.repository';
import { SimulationResultsRepository } from '../../simulations/application/repositories/simulation-results.repository';
import { DailyGoal } from '../domain/daily-goal.entity';
import { DailyStreak } from '../domain/daily-streak.entity';
import { GoalType } from '../../../common/enums';

describe('DailyGoalProgressService', () => {
  let service: DailyGoalProgressService;
  let goalsRepo: jest.Mocked<DailyGoalsRepository>;
  let streakService: jest.Mocked<DailyStreakService>;
  let questionResultsRepo: jest.Mocked<UserQuestionResultsRepository>;
  let userProgressRepo: jest.Mocked<ProgressRepository>;
  let simulationResultsRepo: jest.Mocked<SimulationResultsRepository>;

  beforeEach(async () => {
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

    const questionResultsRepoMock = {
      countByUserIdAndDateRange: jest.fn(),
    };

    const userProgressRepoMock = {
      countCompletedByUserIdAndDateRange: jest.fn(),
    };

    const simulationResultsRepoMock = {
      countByUserIdAndDateRange: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyGoalProgressService,
        { provide: DailyGoalsRepository, useValue: goalsRepoMock },
        { provide: DailyStreakService, useValue: streakServiceMock },
        {
          provide: UserQuestionResultsRepository,
          useValue: questionResultsRepoMock,
        },
        { provide: ProgressRepository, useValue: userProgressRepoMock },
        {
          provide: SimulationResultsRepository,
          useValue: simulationResultsRepoMock,
        },
      ],
    }).compile();

    service = module.get<DailyGoalProgressService>(DailyGoalProgressService);
    goalsRepo = module.get(DailyGoalsRepository);
    streakService = module.get(DailyStreakService);
    questionResultsRepo = module.get(UserQuestionResultsRepository);
    userProgressRepo = module.get(ProgressRepository);
    simulationResultsRepo = module.get(SimulationResultsRepository);
  });

  describe('getTodayProgress', () => {
    it('returns progress with all goals met', async () => {
      const mockGoals = [
        {
          id: 'g1',
          userId: 'user-1',
          goalType: GoalType.QUESTIONS,
          targetValue: 5,
          user: null as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: undefined,
        },
        {
          id: 'g2',
          userId: 'user-1',
          goalType: GoalType.SIMULATIONS,
          targetValue: 2,
          user: null as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: undefined,
        },
      ] as DailyGoal[];

      goalsRepo.findByUserId.mockResolvedValue(mockGoals);
      questionResultsRepo.countByUserIdAndDateRange.mockResolvedValue(8);
      userProgressRepo.countCompletedByUserIdAndDateRange.mockResolvedValue(3);
      simulationResultsRepo.countByUserIdAndDateRange.mockResolvedValue(4);
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

      expect(result.questionsCompleted).toBe(8);
      expect(result.lessonsCompleted).toBe(3);
      expect(result.simulationsCompleted).toBe(4);
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
          goalType: GoalType.QUESTIONS,
          targetValue: 10,
          user: null as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: undefined,
        },
        {
          id: 'g2',
          userId: 'user-1',
          goalType: GoalType.SIMULATIONS,
          targetValue: 3,
          user: null as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: undefined,
        },
      ] as DailyGoal[];

      goalsRepo.findByUserId.mockResolvedValue(mockGoals);
      questionResultsRepo.countByUserIdAndDateRange.mockResolvedValue(5);
      userProgressRepo.countCompletedByUserIdAndDateRange.mockResolvedValue(0);
      simulationResultsRepo.countByUserIdAndDateRange.mockResolvedValue(0);
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
      questionResultsRepo.countByUserIdAndDateRange.mockResolvedValue(0);
      userProgressRepo.countCompletedByUserIdAndDateRange.mockResolvedValue(0);
      simulationResultsRepo.countByUserIdAndDateRange.mockResolvedValue(0);
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

    it('counts simulations from SimulationResultsRepository for SIMULATIONS goal', async () => {
      goalsRepo.findByUserId.mockResolvedValue([
        {
          id: 'g1',
          userId: 'user-1',
          goalType: GoalType.SIMULATIONS,
          targetValue: 2,
          user: null as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: undefined,
        },
      ] as DailyGoal[]);
      questionResultsRepo.countByUserIdAndDateRange.mockResolvedValue(0);
      userProgressRepo.countCompletedByUserIdAndDateRange.mockResolvedValue(0);
      simulationResultsRepo.countByUserIdAndDateRange.mockResolvedValue(2);
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

      expect(
        simulationResultsRepo.countByUserIdAndDateRange,
      ).toHaveBeenCalled();
      expect(result.simulationsCompleted).toBe(2);
      expect(result.goals[0].currentValue).toBe(2);
      expect(result.goals[0].met).toBe(true);
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
      questionResultsRepo.countByUserIdAndDateRange.mockResolvedValue(0);
      userProgressRepo.countCompletedByUserIdAndDateRange.mockResolvedValue(3);
      simulationResultsRepo.countByUserIdAndDateRange.mockResolvedValue(0);
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
          goalType: GoalType.QUESTIONS,
          targetValue: 5,
          user: null as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: undefined,
        },
      ] as DailyGoal[]);
      questionResultsRepo.countByUserIdAndDateRange.mockResolvedValue(8);
      userProgressRepo.countCompletedByUserIdAndDateRange.mockResolvedValue(0);
      simulationResultsRepo.countByUserIdAndDateRange.mockResolvedValue(0);
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

  describe('getProgressForGoalType', () => {
    it('returns questionsCompleted for QUESTIONS', () => {
      expect(service.getProgressForGoalType(GoalType.QUESTIONS, 8, 2, 3)).toBe(
        8,
      );
    });

    it('returns simulationsCompleted for SIMULATIONS', () => {
      expect(
        service.getProgressForGoalType(GoalType.SIMULATIONS, 8, 2, 3),
      ).toBe(2);
    });

    it('returns lessonsCompleted for LESSONS', () => {
      expect(service.getProgressForGoalType(GoalType.LESSONS, 8, 2, 3)).toBe(3);
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
