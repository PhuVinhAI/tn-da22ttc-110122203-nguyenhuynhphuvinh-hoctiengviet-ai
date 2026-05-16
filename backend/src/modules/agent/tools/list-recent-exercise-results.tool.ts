import { Injectable } from '@nestjs/common';
import { BaseTool, ToolContext } from '@linvnix/shared';
import { z } from 'zod';
import { ExercisesService } from '../../exercises/application/exercises.service';
import { UserExerciseResult } from '../../exercises/domain/user-exercise-result.entity';
import type { User } from '../../users/domain/user.entity';

const paramsSchema = z
  .object({
    limit: z.number().int().min(1).max(50).optional(),
  })
  .strip();

type ListRecentExerciseResultsParams = z.infer<typeof paramsSchema>;

const DEFAULT_LIMIT = 10;

export interface ListRecentExerciseResultsResult {
  results: UserExerciseResult[];
}

export type ListRecentExerciseResultsOutput =
  | ListRecentExerciseResultsResult
  | { error: string };

/**
 * Read tool — returns the learner's recent exercise attempts, newest first.
 * Backs the user story "What did I get wrong last time?". The actual SQL
 * sort + limit live in `UserExerciseResultsRepository.findByUserId`; the
 * tool merely surfaces an LLM-controllable `limit` capped at 50 to keep
 * responses bounded.
 *
 * `userId` is read exclusively from `ctx`.
 */
@Injectable()
export class ListRecentExerciseResultsTool extends BaseTool<
  ListRecentExerciseResultsParams,
  ListRecentExerciseResultsOutput
> {
  readonly name = 'list_recent_exercise_results';
  readonly displayName = 'Đang xem kết quả bài tập gần đây...';
  readonly description =
    "Returns the learner's most recent exercise results (correct/incorrect, " +
    'score, attemptedAt), newest first. Useful when the learner asks "what ' +
    'did I get wrong last time?" or "show me my recent practice". Defaults ' +
    'to the last 10 attempts; pass `limit` (1..50) for more or fewer. The ' +
    'learner is always the conversation owner — never pass a userId.';
  readonly parameters = paramsSchema;

  constructor(private readonly exercisesService: ExercisesService) {
    super();
  }

  async execute(
    params: ListRecentExerciseResultsParams,
    ctx: ToolContext<User>,
  ): Promise<ListRecentExerciseResultsOutput> {
    try {
      const results = await this.exercisesService.getUserResults(ctx.userId, {
        limit: params.limit ?? DEFAULT_LIMIT,
      });
      return { results };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
}
