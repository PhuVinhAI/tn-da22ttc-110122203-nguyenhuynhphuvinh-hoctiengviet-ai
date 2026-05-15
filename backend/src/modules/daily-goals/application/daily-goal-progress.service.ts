import { Injectable } from '@nestjs/common';
import { DailyGoalProgressRepository } from './daily-goal-progress.repository';
import { DailyGoalsRepository } from './daily-goals.repository';
import { DailyStreakService } from './daily-streak.service';
import { UserExerciseResultsRepository } from '../../exercises/application/repositories/user-exercise-results.repository';
import { ProgressRepository } from '../../progress/application/progress.repository';
import { GoalType } from '../../../common/enums';
import {
  GoalProgressDto,
  DailyGoalProgressResponseDto,
} from '../dto/daily-goal-progress-response.dto';

const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

@Injectable()
export class DailyGoalProgressService {
  constructor(
    private readonly progressRepository: DailyGoalProgressRepository,
    private readonly goalsRepository: DailyGoalsRepository,
    private readonly streakService: DailyStreakService,
    private readonly exerciseResultsRepository: UserExerciseResultsRepository,
    private readonly userProgressRepository: ProgressRepository,
  ) {}

  async getTodayProgress(
    userId: string,
  ): Promise<DailyGoalProgressResponseDto> {
    const today = this.getVnToday();
    const { start, end } = this.getVnTodayRange();

    const goals = await this.goalsRepository.findByUserId(userId);
    const exercisesCompleted =
      await this.exerciseResultsRepository.countByUserIdAndDateRange(
        userId,
        start,
        end,
      );
    const lessonsCompleted =
      await this.userProgressRepository.countCompletedByUserIdAndDateRange(
        userId,
        start,
        end,
      );

    const existingProgress = await this.progressRepository.findByUserIdAndDate(
      userId,
      today,
    );
    const studyMinutes = existingProgress?.studyMinutes ?? 0;

    const goalProgresses: GoalProgressDto[] = goals.map((goal) => {
      const currentValue = this.getProgressForGoalType(
        goal.goalType,
        exercisesCompleted,
        studyMinutes,
        lessonsCompleted,
      );
      return {
        goalType: goal.goalType,
        targetValue: goal.targetValue,
        currentValue,
        met: currentValue >= goal.targetValue,
      };
    });

    const allGoalsMet = goals.length > 0 && goalProgresses.every((g) => g.met);

    const streak = await this.streakService.updateStreak(
      userId,
      allGoalsMet,
      today,
    );

    return {
      date: today,
      exercisesCompleted,
      studyMinutes,
      lessonsCompleted,
      allGoalsMet,
      goals: goalProgresses,
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
    };
  }

  async syncStudyMinutes(userId: string, studyMinutes: number): Promise<void> {
    const today = this.getVnToday();
    await this.progressRepository.upsert(userId, today, { studyMinutes });
  }

  getProgressForGoalType(
    goalType: GoalType,
    exercisesCompleted: number,
    studyMinutes: number,
    lessonsCompleted: number,
  ): number {
    switch (goalType) {
      case GoalType.EXERCISES:
        return exercisesCompleted;
      case GoalType.STUDY_MINUTES:
        return studyMinutes;
      case GoalType.LESSONS:
        return lessonsCompleted;
    }
  }

  getVnToday(): string {
    const now = new Date();
    const vnStr = now.toLocaleDateString('sv-SE', {
      timeZone: VN_TIMEZONE,
    });
    return vnStr;
  }

  getVnTodayRange(): { start: Date; end: Date } {
    const now = new Date();
    const vnParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: VN_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(now)
      .reduce(
        (acc, p) => {
          if (p.type === 'year') acc.year = p.value;
          if (p.type === 'month') acc.month = p.value;
          if (p.type === 'day') acc.day = p.value;
          return acc;
        },
        {} as Record<string, string>,
      );

    const dateStr = `${vnParts.year}-${vnParts.month}-${vnParts.day}`;
    const start = new Date(`${dateStr}T00:00:00+07:00`);
    const end = new Date(`${dateStr}T23:59:59.999+07:00`);
    return { start, end };
  }
}
