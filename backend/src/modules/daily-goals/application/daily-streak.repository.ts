import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyStreak } from '../domain/daily-streak.entity';

@Injectable()
export class DailyStreakRepository {
  constructor(
    @InjectRepository(DailyStreak)
    private readonly repository: Repository<DailyStreak>,
  ) {}

  async findByUserId(userId: string): Promise<DailyStreak | null> {
    return this.repository.findOne({
      where: { userId },
    });
  }

  async upsert(
    userId: string,
    data: Partial<DailyStreak>,
  ): Promise<DailyStreak> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      Object.assign(existing, data);
      return this.repository.save(existing);
    }
    const streak = this.repository.create({ userId, ...data });
    return this.repository.save(streak);
  }

  async create(data: Partial<DailyStreak>): Promise<DailyStreak> {
    const streak = this.repository.create(data);
    return this.repository.save(streak);
  }
}
