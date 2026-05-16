import { Injectable } from '@nestjs/common';
import { BaseTool, ToolContext } from '@linvnix/shared';
import { z } from 'zod';
import {
  BookmarksService,
  BookmarkListResult,
} from '../../vocabularies/application/bookmarks.service';
import { BookmarkSort } from '../../vocabularies/dto/bookmark-query.dto';
import type { User } from '../../users/domain/user.entity';

const paramsSchema = z
  .object({
    search: z.string().optional(),
    limit: z.number().int().min(1).max(50).optional(),
  })
  .strip();

type ListBookmarksParams = z.infer<typeof paramsSchema>;

export type ListBookmarksResult = BookmarkListResult | { error: string };

const DEFAULT_LIMIT = 20;

/**
 * Read tool — paginated list of the learner's bookmarked vocabulary. Sort is
 * fixed to "newest first" (the PRD-specified `createdAt:DESC` default); the
 * LLM controls only `search` and `limit`. Page is pinned to 1 because the
 * Trợ lý AI UX intentionally surfaces a single short window of recent
 * bookmarks per turn — paging is a job for the dedicated bookmarks screen.
 *
 * `userId` is read exclusively from `ctx` so the LLM can never be tricked
 * into listing another learner's bookmarks via prompt injection.
 */
@Injectable()
export class ListBookmarksTool extends BaseTool<
  ListBookmarksParams,
  ListBookmarksResult
> {
  readonly name = 'list_bookmarks';
  readonly displayName = 'Đang xem từ bạn đã yêu sách...';
  readonly description =
    "Lists the learner's bookmarked vocabulary, newest first. Useful when " +
    'they ask "what words have I bookmarked?". Supports an optional `search` ' +
    'substring (matches word or translation) and an optional `limit` (1..50, ' +
    'default 20). The learner is always the conversation owner — never pass ' +
    'a userId.';
  readonly parameters = paramsSchema;

  constructor(private readonly bookmarksService: BookmarksService) {
    super();
  }

  async execute(
    params: ListBookmarksParams,
    ctx: ToolContext<User>,
  ): Promise<ListBookmarksResult> {
    try {
      const serviceParams: {
        page: number;
        limit: number;
        sort: BookmarkSort;
        search?: string;
      } = {
        page: 1,
        limit: params.limit ?? DEFAULT_LIMIT,
        sort: BookmarkSort.NEWEST,
      };
      if (params.search !== undefined) {
        serviceParams.search = params.search;
      }

      return await this.bookmarksService.list(ctx.userId, serviceParams);
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
}
