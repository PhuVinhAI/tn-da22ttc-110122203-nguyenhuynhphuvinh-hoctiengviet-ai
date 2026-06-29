import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vocabulary } from '../../domain/vocabulary.entity';
import { Dialect } from '../../../../common/enums';
import {
  bulkReorder,
  ReorderItem,
} from '../../../../common/utils/bulk-reorder';

export interface VocabularySearchOptions {
  query: string;
  lessonId?: string;
  dialect?: Dialect;
}

@Injectable()
export class VocabulariesRepository {
  constructor(
    @InjectRepository(Vocabulary)
    private readonly repository: Repository<Vocabulary>,
  ) {}

  async create(data: Partial<Vocabulary>): Promise<Vocabulary> {
    const vocabulary = this.repository.create(data);
    return this.repository.save(vocabulary);
  }

  async reorder(items: ReorderItem[]): Promise<void> {
    await bulkReorder(this.repository, items);
  }

  async findByLessonId(lessonId: string): Promise<Vocabulary[]> {
    return this.repository.find({
      where: { lessonId },
    });
  }

  async findById(id: string): Promise<Vocabulary | null> {
    return this.repository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<Vocabulary>): Promise<Vocabulary> {
    await this.repository.update(id, data);
    const vocabulary = await this.findById(id);
    if (!vocabulary) {
      throw new Error('Vocabulary not found after update');
    }
    return vocabulary;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  /**
   * Full-text-ish search over `word` and `translation` using ILIKE.
   * Optional filters:
   *
   * - `lessonId` — narrows the result to one lesson; useful when the
   *   learner is already inside a specific lesson context.
   * - `dialect` — keeps only vocab that is dialect-agnostic (`dialect_variants
   *   IS NULL`), explicitly covers the requested dialect, or has a STANDARD
   *   fallback. Vocab that only has variants for unrelated dialects is
   *   filtered out. Permissive on purpose: most vocabulary has no regional
   *   variation, and the AI shouldn't return zero results for the common case.
   *
   * Hard-capped at 50 rows. A GIN index on the searchable columns would
   * improve performance once row counts grow; left for a later slice.
   */
  async search(options: VocabularySearchOptions): Promise<Vocabulary[]> {
    // Outer parens around the OR group are load-bearing: TypeORM concatenates
    // `.where()` text verbatim, so without them subsequent `.andWhere(...)`
    // clauses bind only to the last `OR` term (AND has higher precedence
    // than OR in SQL). Verified by `search_vocabulary` integration suite.
    const qb = this.repository
      .createQueryBuilder('vocabulary')
      .where(
        '(vocabulary.word ILIKE :query OR vocabulary.translation ILIKE :query)',
        { query: `%${options.query}%` },
      );

    if (options.lessonId) {
      qb.andWhere('vocabulary.lesson_id = :lessonId', {
        lessonId: options.lessonId,
      });
    }

    if (options.dialect) {
      qb.andWhere(
        '(vocabulary.dialect_variants IS NULL ' +
          'OR vocabulary.dialect_variants ? :dialect ' +
          "OR vocabulary.dialect_variants ? 'STANDARD')",
        { dialect: options.dialect },
      );
    }

    return qb.orderBy('vocabulary.word', 'ASC').limit(50).getMany();
  }
}
