import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from '../../domain/lesson.entity';
import { LessonType, UserLevel } from '../../../../common/enums';

export interface LessonFilterOptions {
  topic?: string;
  level?: UserLevel;
  type?: LessonType;
  limit?: number;
}

// Hard cap on results so a wide filter ("everything at A1") can't dump the
// whole catalog into a model context window. Matches the 50-row cap used
// by VocabulariesRepository.search and GrammarRepository.search.
const FIND_LESSONS_MAX_LIMIT = 50;

@Injectable()
export class LessonsRepository {
  constructor(
    @InjectRepository(Lesson)
    private readonly repository: Repository<Lesson>,
  ) {}

  async create(data: Partial<Lesson>): Promise<Lesson> {
    const lesson = this.repository.create(data);
    return this.repository.save(lesson);
  }

  async findByModuleId(moduleId: string): Promise<Lesson[]> {
    return this.repository.find({
      where: { moduleId },
      order: { orderIndex: 'ASC' },
    });
  }

  async findById(id: string): Promise<Lesson | null> {
    return this.repository.findOne({
      where: { id },
      relations: [
        'module',
        'contents',
        'vocabularies',
        'grammarRules',
        'exerciseSets',
      ],
    });
  }

  async update(id: string, data: Partial<Lesson>): Promise<Lesson> {
    await this.repository.update(id, data);
    const lesson = await this.findById(id);
    if (!lesson) {
      throw new Error('Lesson not found after update');
    }
    return lesson;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  /**
   * Catalog lesson lookup backing the `find_lessons` AI tool.
   *
   * Joins `Lesson → Module → Course` and applies optional filters:
   *
   * - `topic` — ILIKE against `Module.title`. The PRD intentionally targets
   *   module title (not the module's optional `topic` column) because
   *   modules are the human-meaningful unit ("Family vocabulary",
   *   "Greetings") and the `topic` column is sparsely populated.
   * - `level` — exact match against the owning `Course.level` (CEFR).
   * - `type` — exact match against `Lesson.lessonType`.
   *
   * Returns hydrated lessons with `module.course` populated so the service
   * can compose the summary shape `{ id, title, level, type, courseTitle,
   * moduleTitle }`. Hard-capped at 50 rows.
   */
  async findByFilter(opts: LessonFilterOptions = {}): Promise<Lesson[]> {
    const qb = this.repository
      .createQueryBuilder('lesson')
      .innerJoinAndSelect('lesson.module', 'module')
      .innerJoinAndSelect('module.course', 'course');

    if (opts.topic) {
      qb.andWhere('module.title ILIKE :topic', { topic: `%${opts.topic}%` });
    }

    if (opts.level) {
      qb.andWhere('course.level = :level', { level: opts.level });
    }

    if (opts.type) {
      qb.andWhere('lesson.lesson_type = :type', { type: opts.type });
    }

    const requestedLimit = opts.limit ?? FIND_LESSONS_MAX_LIMIT;
    const limit = Math.min(Math.max(requestedLimit, 1), FIND_LESSONS_MAX_LIMIT);

    return qb
      .orderBy('course.order_index', 'ASC')
      .addOrderBy('module.order_index', 'ASC')
      .addOrderBy('lesson.order_index', 'ASC')
      .limit(limit)
      .getMany();
  }
}
