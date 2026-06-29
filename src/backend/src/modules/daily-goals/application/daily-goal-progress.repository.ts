import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyGoalProgress } from '../domain/daily-goal-progress.entity';

@Injectable()
export class DailyGoalProgressRepository {
  constructor(
    @InjectRepository(DailyGoalProgress)
    private readonly repository: Repository<DailyGoalProgress>,
  ) {}

  async findByUserIdAndDate(
    userId: string,
    date: string,
  ): Promise<DailyGoalProgress | null> {
    return this.repository.findOne({
      where: { userId, date },
    });
  }

  async upsert(
    userId: string,
    date: string,
    data: Partial<DailyGoalProgress>,
  ): Promise<DailyGoalProgress> {
    const existing = await this.findByUserIdAndDate(userId, date);
    if (existing) {
      Object.assign(existing, data);
      return this.repository.save(existing);
    }
    const progress = this.repository.create({ userId, date, ...data });
    return this.repository.save(progress);
  }

  async create(data: Partial<DailyGoalProgress>): Promise<DailyGoalProgress> {
    const progress = this.repository.create(data);
    return this.repository.save(progress);
  }
}
