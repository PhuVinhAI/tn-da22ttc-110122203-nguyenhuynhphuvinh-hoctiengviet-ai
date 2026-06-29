import { Injectable } from '@nestjs/common';
import { DailyGoalsRepository } from './daily-goals.repository';
import { DailyStreakService } from './daily-streak.service';
import { UserQuestionResultsRepository } from '../../exercises/application/repositories/user-question-results.repository';
import { ProgressRepository } from '../../progress/application/progress.repository';
import { SimulationResultsRepository } from '../../simulations/application/repositories/simulation-results.repository';
import { GoalType } from '../../../common/enums';
import {
  GoalProgressDto,
  DailyGoalProgressResponseDto,
} from '../dto/daily-goal-progress-response.dto';

const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

@Injectable()
export class DailyGoalProgressService {
  constructor(
    private readonly goalsRepository: DailyGoalsRepository,
    private readonly streakService: DailyStreakService,
    private readonly questionResultsRepository: UserQuestionResultsRepository,
    private readonly userProgressRepository: ProgressRepository,
    private readonly simulationResultsRepository: SimulationResultsRepository,
  ) {}

  async getTodayProgress(
    userId: string,
  ): Promise<DailyGoalProgressResponseDto> {
    const today = this.getVnToday();
    const { start, end } = this.getVnTodayRange();

    const goals = await this.goalsRepository.findByUserId(userId);
    const questionsCompleted =
      await this.questionResultsRepository.countByUserIdAndDateRange(
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
    const simulationsCompleted =
      await this.simulationResultsRepository.countByUserIdAndDateRange(
        userId,
        start,
        end,
      );

    const goalProgresses: GoalProgressDto[] = goals.map((goal) => {
      const currentValue = this.getProgressForGoalType(
        goal.goalType,
        questionsCompleted,
        simulationsCompleted,
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
      questionsCompleted,
      simulationsCompleted,
      lessonsCompleted,
      allGoalsMet,
      goals: goalProgresses,
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
    };
  }

  getProgressForGoalType(
    goalType: GoalType,
    questionsCompleted: number,
    simulationsCompleted: number,
    lessonsCompleted: number,
  ): number {
    switch (goalType) {
      case GoalType.QUESTIONS:
        return questionsCompleted;
      case GoalType.SIMULATIONS:
        return simulationsCompleted;
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
