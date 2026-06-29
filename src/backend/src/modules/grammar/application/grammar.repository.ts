import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrammarRule } from '../domain/grammar-rule.entity';
import { UserLevel } from '../../../common/enums';
import { bulkReorder, ReorderItem } from '../../../common/utils/bulk-reorder';

export interface GrammarSearchOptions {
  lessonId?: string;
  level?: UserLevel;
}

@Injectable()
export class GrammarRepository {
  constructor(
    @InjectRepository(GrammarRule)
    private readonly repository: Repository<GrammarRule>,
  ) {}

  async create(data: Partial<GrammarRule>): Promise<GrammarRule> {
    const grammar = this.repository.create(data);
    return this.repository.save(grammar);
  }

  async reorder(items: ReorderItem[]): Promise<void> {
    await bulkReorder(this.repository, items);
  }

  async findByLessonId(lessonId: string): Promise<GrammarRule[]> {
    return this.repository.find({
      where: { lessonId },
    });
  }

  async findById(id: string): Promise<GrammarRule | null> {
    return this.repository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<GrammarRule>): Promise<GrammarRule> {
    await this.repository.update(id, data);
    const grammar = await this.findById(id);
    if (!grammar) {
      throw new Error('Grammar rule not found after update');
    }
    return grammar;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  /**
   * ILIKE search over `title` + `explanation`. The catalog is small enough
   * today that a plain ILIKE is fine; a normalized lower-case GIN index is
   * an obvious next step once row counts grow.
   *
   * Optional filters:
   * - `lessonId` — narrow to one lesson (useful when the learner asks about
   *   grammar inside a lesson context).
   * - `level` — match the CEFR level of the lesson's owning course; requires
   *   joining `lesson → module → course`.
   *
   * Hard-capped at 50 rows.
   */
  async search(
    query: string,
    opts: GrammarSearchOptions = {},
  ): Promise<GrammarRule[]> {
    const qb = this.repository
      .createQueryBuilder('grammar')
      .where(
        '(grammar.title ILIKE :query OR grammar.explanation ILIKE :query)',
        { query: `%${query}%` },
      );

    if (opts.lessonId) {
      qb.andWhere('grammar.lesson_id = :lessonId', { lessonId: opts.lessonId });
    }

    if (opts.level) {
      qb.innerJoin('lessons', 'lesson', 'lesson.id = grammar.lesson_id')
        .innerJoin('modules', 'module', 'module.id = lesson.module_id')
        .innerJoin('courses', 'course', 'course.id = module.course_id')
        .andWhere('course.level = :level', { level: opts.level });
    }

    return qb.orderBy('grammar.title', 'ASC').limit(50).getMany();
  }
}
