import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DailyGoalsRepository } from './daily-goals.repository';
import { DailyGoal } from '../domain/daily-goal.entity';
import { GoalType } from '../../../common/enums';

const GOAL_RANGES: Record<GoalType, { min: number; max: number }> = {
  [GoalType.QUESTIONS]: { min: 1, max: 50 },
  [GoalType.SIMULATIONS]: { min: 1, max: 10 },
  [GoalType.LESSONS]: { min: 1, max: 10 },
};

@Injectable()
export class DailyGoalsService {
  constructor(private readonly repository: DailyGoalsRepository) {}

  async create(
    userId: string,
    goalType: GoalType,
    targetValue: number,
  ): Promise<DailyGoal> {
    const existing = await this.repository.findByUserIdAndGoalType(
      userId,
      goalType,
    );
    if (existing) {
      throw new BadRequestException(
        `Goal type ${goalType} already exists for this user`,
      );
    }

    this.validateRange(goalType, targetValue);

    return this.repository.create({ userId, goalType, targetValue });
  }

  async findAll(userId: string): Promise<DailyGoal[]> {
    return this.repository.findByUserId(userId);
  }

  async update(id: string, targetValue: number): Promise<DailyGoal> {
    const goal = await this.repository.findById(id);
    if (!goal) {
      throw new NotFoundException(`Daily goal with ID ${id} not found`);
    }

    this.validateRange(goal.goalType, targetValue);

    return this.repository.update(id, { targetValue });
  }

  async delete(id: string): Promise<void> {
    const goal = await this.repository.findById(id);
    if (!goal) {
      throw new NotFoundException(`Daily goal with ID ${id} not found`);
    }
    await this.repository.delete(id);
  }

  private validateRange(goalType: GoalType, targetValue: number): void {
    const range = GOAL_RANGES[goalType];
    if (targetValue < range.min || targetValue > range.max) {
      throw new BadRequestException(
        `Target value for ${goalType} must be between ${range.min} and ${range.max}`,
      );
    }
  }
}
