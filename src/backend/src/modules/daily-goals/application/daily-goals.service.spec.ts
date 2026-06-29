import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DailyGoalsService } from './daily-goals.service';
import { DailyGoalsRepository } from './daily-goals.repository';
import { DailyGoal } from '../domain/daily-goal.entity';
import { GoalType } from '../../../common/enums';

describe('DailyGoalsService', () => {
  let service: DailyGoalsService;
  let repository: jest.Mocked<DailyGoalsRepository>;

  const mockGoal: DailyGoal = {
    id: 'goal-1',
    userId: 'user-1',
    goalType: GoalType.QUESTIONS,
    targetValue: 10,
    user: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  };

  beforeEach(async () => {
    const repoMock = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIdAndGoalType: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyGoalsService,
        { provide: DailyGoalsRepository, useValue: repoMock },
      ],
    }).compile();

    service = module.get<DailyGoalsService>(DailyGoalsService);
    repository = module.get(DailyGoalsRepository);
  });

  describe('create', () => {
    it('creates a daily goal for valid input', async () => {
      repository.findByUserIdAndGoalType.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockGoal);

      const result = await service.create('user-1', GoalType.QUESTIONS, 10);

      expect(result).toEqual(mockGoal);
      expect(repository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        goalType: GoalType.QUESTIONS,
        targetValue: 10,
      });
    });

    it('rejects duplicate goalType for same user', async () => {
      repository.findByUserIdAndGoalType.mockResolvedValue(mockGoal);

      await expect(
        service.create('user-1', GoalType.QUESTIONS, 15),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows same goalType for different users', async () => {
      repository.findByUserIdAndGoalType.mockResolvedValue(null);
      repository.create.mockResolvedValue({
        ...mockGoal,
        id: 'goal-2',
        userId: 'user-2',
      });

      const result = await service.create('user-2', GoalType.QUESTIONS, 10);

      expect(result.userId).toBe('user-2');
    });

    it('validates QUESTIONS range 1-50', async () => {
      repository.findByUserIdAndGoalType.mockResolvedValue(null);

      await expect(
        service.create('user-1', GoalType.QUESTIONS, 0),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create('user-1', GoalType.QUESTIONS, 51),
      ).rejects.toThrow(BadRequestException);

      repository.create.mockResolvedValue(mockGoal);
      const valid = await service.create('user-1', GoalType.QUESTIONS, 1);
      expect(valid).toBeDefined();
    });

    it('validates SIMULATIONS range 1-10', async () => {
      repository.findByUserIdAndGoalType.mockResolvedValue(null);

      await expect(
        service.create('user-1', GoalType.SIMULATIONS, 0),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create('user-1', GoalType.SIMULATIONS, 11),
      ).rejects.toThrow(BadRequestException);

      repository.create.mockResolvedValue({
        ...mockGoal,
        goalType: GoalType.SIMULATIONS,
      });
      const valid = await service.create('user-1', GoalType.SIMULATIONS, 1);
      expect(valid).toBeDefined();
    });

    it('validates LESSONS range 1-10', async () => {
      repository.findByUserIdAndGoalType.mockResolvedValue(null);

      await expect(
        service.create('user-1', GoalType.LESSONS, 0),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create('user-1', GoalType.LESSONS, 11),
      ).rejects.toThrow(BadRequestException);

      repository.create.mockResolvedValue({
        ...mockGoal,
        goalType: GoalType.LESSONS,
      });
      const valid = await service.create('user-1', GoalType.LESSONS, 1);
      expect(valid).toBeDefined();
    });

    it('allows multiple different goal types for same user', async () => {
      repository.findByUserIdAndGoalType.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockGoal);

      await service.create('user-1', GoalType.QUESTIONS, 10);
      await service.create('user-1', GoalType.SIMULATIONS, 3);
      await service.create('user-1', GoalType.LESSONS, 3);

      expect(repository.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('findAll', () => {
    it('returns all goals for a user', async () => {
      const goals = [
        mockGoal,
        {
          ...mockGoal,
          id: 'goal-2',
          goalType: GoalType.SIMULATIONS,
          targetValue: 3,
        },
      ];
      repository.findByUserId.mockResolvedValue(goals);

      const result = await service.findAll('user-1');

      expect(result).toEqual(goals);
      expect(result).toHaveLength(2);
    });

    it('returns empty array when no goals', async () => {
      repository.findByUserId.mockResolvedValue([]);

      const result = await service.findAll('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('updates targetValue for existing goal', async () => {
      repository.findById.mockResolvedValue(mockGoal);
      const updated = { ...mockGoal, targetValue: 20 };
      repository.update.mockResolvedValue(updated);

      const result = await service.update('goal-1', 20);

      expect(result.targetValue).toBe(20);
      expect(repository.update).toHaveBeenCalledWith('goal-1', {
        targetValue: 20,
      });
    });

    it('throws NotFoundException for non-existent goal', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('nonexistent', 20)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('validates targetValue range on update', async () => {
      repository.findById.mockResolvedValue(mockGoal);

      await expect(service.update('goal-1', 51)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('does not change goalType on update', async () => {
      repository.findById.mockResolvedValue(mockGoal);
      repository.update.mockResolvedValue({ ...mockGoal, targetValue: 15 });

      await service.update('goal-1', 15);

      expect(repository.update).toHaveBeenCalledWith('goal-1', {
        targetValue: 15,
      });
    });
  });

  describe('delete', () => {
    it('permanently deletes an existing goal', async () => {
      repository.findById.mockResolvedValue(mockGoal);
      repository.delete.mockResolvedValue(undefined);

      await service.delete('goal-1');

      expect(repository.delete).toHaveBeenCalledWith('goal-1');
    });

    it('throws NotFoundException for non-existent goal', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
