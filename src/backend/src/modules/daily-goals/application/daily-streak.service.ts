import { Injectable } from '@nestjs/common';
import { DailyStreakRepository } from './daily-streak.repository';
import { DailyStreak } from '../domain/daily-streak.entity';

@Injectable()
export class DailyStreakService {
  constructor(private readonly streakRepository: DailyStreakRepository) {}

  async updateStreak(
    userId: string,
    allGoalsMet: boolean,
    today: string,
  ): Promise<DailyStreak> {
    const existing = await this.streakRepository.findByUserId(userId);

    if (!existing) {
      const currentStreak = allGoalsMet ? 1 : 0;
      const longestStreak = currentStreak;
      const lastGoalMetDate = allGoalsMet ? today : null;

      return this.streakRepository.upsert(userId, {
        currentStreak,
        longestStreak,
        lastGoalMetDate,
      });
    }

    if (allGoalsMet) {
      if (existing.lastGoalMetDate === today) {
        return existing;
      }

      const isYesterday = this.isYesterday(existing.lastGoalMetDate, today);
      const currentStreak = isYesterday ? existing.currentStreak + 1 : 1;
      const longestStreak = Math.max(existing.longestStreak, currentStreak);

      return this.streakRepository.upsert(userId, {
        currentStreak,
        longestStreak,
        lastGoalMetDate: today,
      });
    }

    if (existing.currentStreak === 0 && existing.lastGoalMetDate === null) {
      return existing;
    }

    if (existing.currentStreak > 0) {
      return this.streakRepository.upsert(userId, {
        currentStreak: 0,
        longestStreak: existing.longestStreak,
        lastGoalMetDate: existing.lastGoalMetDate,
      });
    }

    return existing;
  }

  async getStreak(userId: string): Promise<DailyStreak | null> {
    return this.streakRepository.findByUserId(userId);
  }

  private isYesterday(dateStr: string | null, todayStr: string): boolean {
    if (!dateStr) return false;

    const date = new Date(dateStr);
    const today = new Date(todayStr);

    const diffMs = today.getTime() - date.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    return diffDays === 1;
  }
}
