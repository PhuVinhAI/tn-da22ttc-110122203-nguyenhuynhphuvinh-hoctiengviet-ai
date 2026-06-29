import { Injectable } from '@nestjs/common';
import { BaseTool, ToolContext } from '@linvnix/shared';
import { z } from 'zod';
import { QuestionsService } from '../../exercises/application/questions.service';
import { QuestionAttempt } from '../../exercises/domain/question-attempt.entity';
import type { User } from '../../users/domain/user.entity';

const paramsSchema = z
  .object({
    limit: z.number().int().min(1).max(50).optional(),
  })
  .strip();

type ListRecentQuestionResultsParams = z.infer<typeof paramsSchema>;

const DEFAULT_LIMIT = 10;

export interface ListRecentQuestionResultsResult {
  results: QuestionAttempt[];
}

export type ListRecentQuestionResultsOutput =
  | ListRecentQuestionResultsResult
  | { error: string };

/**
 * Read tool — returns the learner's recent exercise attempts, newest first.
 * Backs the user story "What did I get wrong last time?". The actual SQL
 * sort + limit live in `UserQuestionResultsRepository.findByUserId`; the
 * tool merely surfaces an LLM-controllable `limit` capped at 50 to keep
 * responses bounded.
 *
 * `userId` is read exclusively from `ctx`.
 */
@Injectable()
export class ListRecentQuestionResultsTool extends BaseTool<
  ListRecentQuestionResultsParams,
  ListRecentQuestionResultsOutput
> {
  readonly name = 'list_recent_exercise_results';
  readonly displayName = 'Reviewing recent exercise results...';
  readonly description =
    "Returns the learner's most recent exercise results (correct/incorrect, " +
    'score, attemptedAt), newest first. Useful when the learner asks "what ' +
    'did I get wrong last time?" or "show me my recent practice". Defaults ' +
    'to the last 10 attempts; pass `limit` (1..50) for more or fewer. The ' +
    'learner is always the conversation owner — never pass a userId.';
  readonly parameters = paramsSchema;

  constructor(private readonly questionsService: QuestionsService) {
    super();
  }

  async execute(
    params: ListRecentQuestionResultsParams,
    ctx: ToolContext<User>,
  ): Promise<ListRecentQuestionResultsOutput> {
    try {
      const results = await this.questionsService.getUserResults(ctx.userId, {
        limit: params.limit ?? DEFAULT_LIMIT,
      });
      return { results };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
}
