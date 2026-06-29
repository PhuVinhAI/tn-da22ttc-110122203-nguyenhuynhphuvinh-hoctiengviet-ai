import { Injectable, NotFoundException } from '@nestjs/common';
import {
  VocabulariesRepository,
  VocabularySearchOptions,
} from './repositories/vocabularies.repository';
import { BookmarksService } from './bookmarks.service';
import { Vocabulary } from '../domain/vocabulary.entity';
import { Dialect } from '../../../common/enums';
import { ReorderItem } from '../../../common/utils/bulk-reorder';

@Injectable()
export class VocabulariesService {
  constructor(
    private readonly vocabulariesRepository: VocabulariesRepository,
    private readonly bookmarksService: BookmarksService,
  ) {}

  async create(data: Partial<Vocabulary>): Promise<Vocabulary> {
    return this.vocabulariesRepository.create(data);
  }

  async reorder(items: ReorderItem[]): Promise<void> {
    await this.vocabulariesRepository.reorder(items);
  }

  async findByLessonId(lessonId: string): Promise<Vocabulary[]> {
    return this.vocabulariesRepository.findByLessonId(lessonId);
  }

  async findById(id: string): Promise<Vocabulary> {
    const vocabulary = await this.vocabulariesRepository.findById(id);
    if (!vocabulary) {
      throw new NotFoundException(`Vocabulary with ID ${id} not found`);
    }
    return vocabulary;
  }

  /**
   * Get vocabulary with dialect-aware audio and word variant
   */
  async findByIdWithDialect(
    id: string,
    userDialect: Dialect,
  ): Promise<Vocabulary> {
    const vocabulary = await this.findById(id);
    return this.applyDialectPreference(vocabulary, userDialect);
  }

  /**
   * Get vocabularies for a lesson with dialect preference applied
   */
  async findByLessonIdWithDialect(
    lessonId: string,
    userDialect: Dialect,
  ): Promise<Vocabulary[]> {
    const vocabularies = await this.findByLessonId(lessonId);
    return vocabularies.map((vocab) =>
      this.applyDialectPreference(vocab, userDialect),
    );
  }

  /**
   * Apply user's dialect preference to vocabulary
   * - Use dialect-specific audio if available
   * - Use dialect variant of word if available
   */
  private applyDialectPreference(
    vocabulary: Vocabulary,
    userDialect: Dialect,
  ): Vocabulary {
    const result = { ...vocabulary };

    // Apply dialect-specific audio URL
    if (vocabulary.audioUrls && vocabulary.audioUrls[userDialect]) {
      result.audioUrl = vocabulary.audioUrls[userDialect];
    } else if (vocabulary.audioUrls && vocabulary.audioUrls[Dialect.STANDARD]) {
      result.audioUrl = vocabulary.audioUrls[Dialect.STANDARD];
    }

    // Apply dialect-specific word variant
    if (vocabulary.dialectVariants && vocabulary.dialectVariants[userDialect]) {
      result.word = vocabulary.dialectVariants[userDialect];
    }

    return result;
  }

  /**
   * Get display text with classifier (for nouns)
   */
  getDisplayWord(vocabulary: Vocabulary): string {
    if (vocabulary.classifier) {
      return `${vocabulary.classifier} ${vocabulary.word}`;
    }
    return vocabulary.word;
  }

  async update(id: string, data: Partial<Vocabulary>): Promise<Vocabulary> {
    await this.findById(id);
    return this.vocabulariesRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.vocabulariesRepository.delete(id);
  }

  /**
   * Search vocabulary by text with optional `lessonId` and `dialect` filters.
   *
   * The dialect filter pairs with the AI assistant flow — `search_vocabulary`
   * tool defaults `dialect` to the conversation owner's `preferredDialect`
   * when the LLM doesn't specify one, so the learner's regional preference
   * propagates to results without the AI needing to be aware of identity.
   *
   * Returns `[]` early on empty / whitespace-only queries to avoid hitting
   * the DB with a wildcard scan.
   */
  async search(options: VocabularySearchOptions): Promise<Vocabulary[]> {
    const query = options.query?.trim() ?? '';
    if (query.length === 0) {
      return [];
    }
    const repoArgs: VocabularySearchOptions = { query };
    if (options.lessonId) repoArgs.lessonId = options.lessonId;
    if (options.dialect) repoArgs.dialect = options.dialect;
    return this.vocabulariesRepository.search(repoArgs);
  }

  async enrichWithBookmarks(
    vocabularies: Vocabulary[],
    userId?: string,
  ): Promise<any[]> {
    if (!userId || vocabularies.length === 0) {
      return vocabularies;
    }

    const bookmarkMap = await this.bookmarksService.isBookmarked(
      userId,
      vocabularies.map((v) => v.id),
    );

    return vocabularies.map((vocab) => ({
      ...vocab,
      isBookmarked: bookmarkMap[vocab.id] ?? false,
    }));
  }
}
