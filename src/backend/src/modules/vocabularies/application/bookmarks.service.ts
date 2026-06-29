import { Injectable, BadRequestException } from '@nestjs/common';
import {
  BookmarksRepository,
  BookmarkType,
} from './repositories/bookmarks.repository';
import { BookmarkSort } from '../dto/bookmark-query.dto';
import { Bookmark } from '../domain/bookmark.entity';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { PersonalVocabulariesService } from '../../personal-vocabularies/application/personal-vocabularies.service';

export interface BookmarkToggleResult {
  isBookmarked: boolean;
}

export interface BookmarkListItem {
  bookmarkedAt: Date;
  vocabulary: any;
  type: BookmarkType;
  personalVocabularyId?: string;
}

export interface BookmarkListResult {
  data: BookmarkListItem[];
  meta: PaginatedResult<Bookmark>['meta'];
}

export interface BookmarkStatsResult {
  total: number;
  byPartOfSpeech: Record<string, number>;
}

@Injectable()
export class BookmarksService {
  constructor(
    private readonly bookmarksRepository: BookmarksRepository,
    private readonly personalVocabulariesService: PersonalVocabulariesService,
  ) {}

  async getStats(userId: string): Promise<BookmarkStatsResult> {
    return this.bookmarksRepository.getStats(userId);
  }

  async toggle(
    userId: string,
    vocabularyId?: string,
    personalVocabularyId?: string,
  ): Promise<BookmarkToggleResult> {
    if (vocabularyId && personalVocabularyId) {
      throw new BadRequestException(
        'Cannot bookmark both vocabularyId and personalVocabularyId at the same time',
      );
    }
    if (!vocabularyId && !personalVocabularyId) {
      throw new BadRequestException(
        'Either vocabularyId or personalVocabularyId is required',
      );
    }

    if (vocabularyId) {
      const existing = await this.bookmarksRepository.findByUserAndVocabulary(
        userId,
        vocabularyId,
      );

      if (existing) {
        await this.bookmarksRepository.delete(existing.id);
        return { isBookmarked: false };
      }

      await this.bookmarksRepository.create({
        userId,
        vocabularyId,
      });
      return { isBookmarked: true };
    }

    if (personalVocabularyId) {
      const existing =
        await this.bookmarksRepository.findByUserAndPersonalVocabulary(
          userId,
          personalVocabularyId,
        );

      if (existing) {
        await this.bookmarksRepository.delete(existing.id);
        await this.personalVocabulariesService.delete(
          personalVocabularyId,
          userId,
        );
        return { isBookmarked: false };
      }

      await this.bookmarksRepository.create({
        userId,
        personalVocabularyId,
      });
      return { isBookmarked: true };
    }

    return { isBookmarked: false };
  }

  async list(
    userId: string,
    params: {
      page: number;
      limit: number;
      search?: string;
      sort: BookmarkSort;
    },
  ): Promise<BookmarkListResult> {
    const result = await this.bookmarksRepository.findPaginated({
      userId,
      ...params,
    });

    return {
      data: result.data.map((bookmark) => ({
        bookmarkedAt: bookmark.createdAt,
        vocabulary: bookmark.vocabulary || bookmark.personalVocabulary,
        type: bookmark.personalVocabularyId ? 'personal' : 'system',
        ...(bookmark.personalVocabularyId
          ? { personalVocabularyId: bookmark.personalVocabularyId }
          : {}),
      })),
      meta: result.meta,
    };
  }

  async isBookmarked(
    userId: string,
    vocabularyIds: string[],
  ): Promise<Record<string, boolean>> {
    if (vocabularyIds.length === 0) {
      return {};
    }

    const bookmarks = await this.bookmarksRepository.findByVocabularyIds(
      userId,
      vocabularyIds,
    );

    const bookmarkedIds = new Set(bookmarks.map((b) => b.vocabularyId));

    return vocabularyIds.reduce(
      (map, id) => {
        map[id] = bookmarkedIds.has(id);
        return map;
      },
      {} as Record<string, boolean>,
    );
  }
}
