import { Injectable } from '@nestjs/common';
import { BaseTool, ToolContext } from '@linvnix/shared';
import { z } from 'zod';
import { BookmarksService } from '../../vocabularies/application/bookmarks.service';
import type { User } from '../../users/domain/user.entity';

const paramsSchema = z
  .object({
    vocabularyId: z.string().uuid(),
  })
  .strip();

type ToggleBookmarkParams = z.infer<typeof paramsSchema>;

export interface ToggleBookmarkResult {
  bookmarked: boolean;
  vocabularyId: string;
}

export type ToggleBookmarkOutput = ToggleBookmarkResult | { error: string };

/**
 * Direct-write tool — toggles whether a vocabulary item is in the learner's
 * bookmarks. The only V1 mutation that bypasses the propose-confirm flow,
 * because it is trivially reversible and is the canonical "Bookmark this
 * word for me" capability described in PRD user story #42.
 *
 * The output reshapes `BookmarksService.toggle`'s `{ isBookmarked }` into
 * `{ bookmarked, vocabularyId }` so the model gets back the same vocabulary
 * id it just acted on — useful for follow-up text like "I bookmarked
 * `<word>` for you" without needing a second tool call.
 *
 * `userId` is read exclusively from `ctx`.
 */
@Injectable()
export class ToggleBookmarkTool extends BaseTool<
  ToggleBookmarkParams,
  ToggleBookmarkOutput
> {
  readonly name = 'toggle_bookmark';
  readonly displayName = 'Đang đánh dấu yêu sách...';
  readonly description =
    "Toggles a vocabulary item in the learner's bookmarks. Adds it if it " +
    "wasn't bookmarked, removes it if it was. The `vocabularyId` is the " +
    'UUID of the vocabulary the learner wants to bookmark/unbookmark — get ' +
    'it from screenContext or by calling `search_vocabulary` first.';
  readonly parameters = paramsSchema;

  constructor(private readonly bookmarksService: BookmarksService) {
    super();
  }

  async execute(
    params: ToggleBookmarkParams,
    ctx: ToolContext<User>,
  ): Promise<ToggleBookmarkOutput> {
    try {
      const { isBookmarked } = await this.bookmarksService.toggle(
        ctx.userId,
        params.vocabularyId,
      );
      return {
        bookmarked: isBookmarked,
        vocabularyId: params.vocabularyId,
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
}
