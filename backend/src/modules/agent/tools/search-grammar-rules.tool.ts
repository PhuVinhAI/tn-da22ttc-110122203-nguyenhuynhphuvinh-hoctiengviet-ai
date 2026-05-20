import { Injectable } from '@nestjs/common';
import { BaseTool, ToolContext } from '@linvnix/shared';
import { z } from 'zod';
import { CourseContentService } from '../../courses/application/course-content.service';
import { GrammarSearchOptions } from '../../grammar/application/grammar.repository';
import { GrammarRule } from '../../grammar/domain/grammar-rule.entity';
import { UserLevel } from '../../../common/enums';
import type { User } from '../../users/domain/user.entity';

const paramsSchema = z
  .object({
    query: z.string().min(1),
    lessonId: z.string().optional(),
    level: z.nativeEnum(UserLevel).optional(),
  })
  .strip();

type SearchGrammarRulesParams = z.infer<typeof paramsSchema>;

export interface SearchGrammarRulesResult {
  rules: GrammarRule[];
}

export type SearchGrammarRulesOutput =
  | SearchGrammarRulesResult
  | { error: string };

/**
 * Read tool — searches grammar rules by title or explanation text. Backs
 * PRD user story #39 ("ask about a grammar rule by name or example").
 *
 * `level` is intentionally NOT defaulted from `ctx.user.currentLevel`: a
 * learner may legitimately want to look up an advanced rule while they're
 * at A2, and the AI persona prompt already biases toward level-appropriate
 * explanations on top of the raw search results.
 */
@Injectable()
export class SearchGrammarRulesTool extends BaseTool<
  SearchGrammarRulesParams,
  SearchGrammarRulesOutput
> {
  readonly name = 'search_grammar_rules';
  readonly displayName = 'Looking up grammar...';
  readonly description =
    'Searches the grammar-rule catalog by title or explanation text. Useful ' +
    'when the learner asks about a grammar concept by name or by example ' +
    '(e.g. "what is a classifier?"). Optional `lessonId` narrows to one ' +
    'lesson; optional `level` (A1..C2) narrows to rules taught in courses at ' +
    "that CEFR level. Do NOT default `level` to the learner's CEFR — they " +
    'may legitimately ask about more advanced rules.';
  readonly parameters = paramsSchema;

  constructor(private readonly courseContentService: CourseContentService) {
    super();
  }

  async execute(
    params: SearchGrammarRulesParams,
    _ctx: ToolContext<User>,
  ): Promise<SearchGrammarRulesOutput> {
    try {
      const opts: GrammarSearchOptions = {};
      if (params.lessonId) opts.lessonId = params.lessonId;
      if (params.level) opts.level = params.level;

      const rules = await this.courseContentService.searchGrammar(
        params.query,
        opts,
      );
      return { rules };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
}
