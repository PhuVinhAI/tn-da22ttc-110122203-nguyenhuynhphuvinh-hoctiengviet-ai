import { Injectable } from '@nestjs/common';
import { BaseTool, ToolContext } from '@linvnix/shared';
import { z } from 'zod';
import { DailyGoalsService } from '../../daily-goals/application/daily-goals.service';
import { DailyStreakService } from '../../daily-goals/application/daily-streak.service';
import { GoalType, UserLevel, Dialect } from '../../../common/enums';
import type { User } from '../../users/domain/user.entity';

const paramsSchema = z.object({}).strip();

type GetUserSummaryParams = z.infer<typeof paramsSchema>;

export interface DailyGoalSummary {
  goalType: GoalType;
  targetValue: number;
}

export interface DailyStreakSummary {
  currentStreak: number;
  longestStreak: number;
  lastGoalMetDate: string | null;
}

export interface GetUserSummaryResult {
  level: UserLevel;
  nativeLanguage: string;
  dialect: Dialect;
  dailyGoals: DailyGoalSummary[];
  streak: DailyStreakSummary | null;
}

/**
 * First production "read" tool — returns a snapshot of the learner's identity
 * (CEFR level, native language, preferred dialect) and their goal/streak
 * state. Identity fields come from `ctx.user` (loaded by `AgentService` once
 * per turn). Goals and streak come from their respective services.
 *
 * IMPORTANT: This tool MUST NOT call `DailyGoalProgressService.getTodayProgress`
 * — that method has a side-effect of mutating streak state via
 * `DailyStreakService.updateStreak`. A read tool should never have side
 * effects. Enforced by `get-user-summary.tool.spec.ts` via a prototype spy.
 */
@Injectable()
export class GetUserSummaryTool extends BaseTool<
  GetUserSummaryParams,
  GetUserSummaryResult
> {
  readonly name = 'get_user_summary';
  readonly displayName = 'Summarizing your profile...';
  readonly description =
    'Returns a snapshot of the current learner: CEFR level, native language, ' +
    'preferred Vietnamese dialect, their current daily goals, and their ' +
    'streak. Takes no parameters — the learner is always the conversation ' +
    'owner.';
  readonly parameters = paramsSchema;

  constructor(
    private readonly dailyGoalsService: DailyGoalsService,
    private readonly dailyStreakService: DailyStreakService,
  ) {
    super();
  }

  async execute(
    _params: GetUserSummaryParams,
    ctx: ToolContext<User>,
  ): Promise<GetUserSummaryResult> {
    const userId = ctx.userId;
    const user = ctx.user;

    const [goals, streak] = await Promise.all([
      this.dailyGoalsService.findAll(userId),
      this.dailyStreakService.getStreak(userId),
    ]);

    return {
      level: user.currentLevel,
      nativeLanguage: user.nativeLanguage,
      dialect: user.preferredDialect,
      dailyGoals: goals.map((g) => ({
        goalType: g.goalType,
        targetValue: g.targetValue,
      })),
      streak: streak
        ? {
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            lastGoalMetDate: streak.lastGoalMetDate,
          }
        : null,
    };
  }
}
