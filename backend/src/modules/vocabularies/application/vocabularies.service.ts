import { Injectable, NotFoundException } from '@nestjs/common';
import { VocabulariesRepository } from './repositories/vocabularies.repository';
import { Vocabulary } from '../domain/vocabulary.entity';
import { Dialect } from '../../../common/enums';

@Injectable()
export class VocabulariesService {
  constructor(
    private readonly vocabulariesRepository: VocabulariesRepository,
  ) {}

  async create(data: Partial<Vocabulary>): Promise<Vocabulary> {
    return this.vocabulariesRepository.create(data);
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
}
