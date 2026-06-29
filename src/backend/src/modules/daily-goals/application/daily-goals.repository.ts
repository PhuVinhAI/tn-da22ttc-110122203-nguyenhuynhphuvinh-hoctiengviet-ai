import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyGoal } from '../domain/daily-goal.entity';
import { GoalType } from '../../../common/enums';

@Injectable()
export class DailyGoalsRepository {
  constructor(
    @InjectRepository(DailyGoal)
    private readonly repository: Repository<DailyGoal>,
  ) {}

  async create(data: Partial<DailyGoal>): Promise<DailyGoal> {
    const goal = this.repository.create(data);
    return this.repository.save(goal);
  }

  async findByUserId(userId: string): Promise<DailyGoal[]> {
    return this.repository.find({
      where: { userId },
      order: { goalType: 'ASC' },
    });
  }

  async findByUserIdAndGoalType(
    userId: string,
    goalType: GoalType,
  ): Promise<DailyGoal | null> {
    return this.repository.findOne({
      where: { userId, goalType },
    });
  }

  async findById(id: string): Promise<DailyGoal | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async update(id: string, data: Partial<DailyGoal>): Promise<DailyGoal> {
    await this.repository.update(id, data);
    const goal = await this.findById(id);
    if (!goal) {
      throw new Error('DailyGoal not found after update');
    }
    return goal;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
