import { Injectable } from '@nestjs/common';
import { BaseTool, ToolContext } from '@linvnix/shared';
import { z } from 'zod';
import { VocabulariesService } from '../../vocabularies/application/vocabularies.service';
import { VocabularySearchOptions } from '../../vocabularies/application/repositories/vocabularies.repository';
import { Vocabulary } from '../../vocabularies/domain/vocabulary.entity';
import { Dialect } from '../../../common/enums';
import type { User } from '../../users/domain/user.entity';

const paramsSchema = z
  .object({
    query: z.string().min(1),
    lessonId: z.string().optional(),
    dialect: z.nativeEnum(Dialect).optional(),
  })
  .strip();

type SearchVocabularyParams = z.infer<typeof paramsSchema>;

export interface SearchVocabularyResult {
  vocabularies: Vocabulary[];
}

export type SearchVocabularyOutput = SearchVocabularyResult | { error: string };

/**
 * Read tool — searches the vocabulary catalog by text. Backs PRD user
 * story #38 ("What's the Northern variant of 'xe đạp'?").
 *
 * Dialect handling: when the LLM omits `dialect`, the tool defaults to the
 * conversation owner's `ctx.user.preferredDialect` so the learner's
 * regional preference propagates without the AI having to know about it.
 * If the user has no preference set, no dialect filter is applied (any
 * result is acceptable).
 *
 * `userId` is never read from `params` — the LLM never specifies whose
 * dialect the search uses; it always comes from `ctx`.
 */
@Injectable()
export class SearchVocabularyTool extends BaseTool<
  SearchVocabularyParams,
  SearchVocabularyOutput
> {
  readonly name = 'search_vocabulary';
  readonly displayName = 'Looking up vocabulary...';
  readonly description =
    'Searches the vocabulary catalog by Vietnamese word or English ' +
    'translation. Returns up to 50 entries. The ' +
    "learner's preferred dialect is applied automatically — do NOT pass " +
    '`dialect` unless the learner specifically asks for a different ' +
    'region. Optional `lessonId` narrows results to one lesson when the ' +
    'learner is asking about something inside their current lesson context.';
  readonly parameters = paramsSchema;

  constructor(private readonly vocabulariesService: VocabulariesService) {
    super();
  }

  async execute(
    params: SearchVocabularyParams,
    ctx: ToolContext<User>,
  ): Promise<SearchVocabularyOutput> {
    try {
      const searchArgs: VocabularySearchOptions = { query: params.query };
      if (params.lessonId) searchArgs.lessonId = params.lessonId;

      const effectiveDialect = params.dialect ?? ctx.user?.preferredDialect;
      if (effectiveDialect) searchArgs.dialect = effectiveDialect;

      const vocabularies = await this.vocabulariesService.search(searchArgs);
      return { vocabularies };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
}
