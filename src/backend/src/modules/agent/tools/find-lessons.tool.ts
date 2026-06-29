import { Injectable } from '@nestjs/common';
import { BaseTool, ToolContext } from '@linvnix/shared';
import { z } from 'zod';
import {
  CourseContentService,
  LessonSummary,
} from '../../courses/application/course-content.service';
import { LessonFilterOptions } from '../../courses/application/repositories/lessons.repository';
import { UserLevel } from '../../../common/enums';
import type { User } from '../../users/domain/user.entity';

const paramsSchema = z
  .object({
    topic: z.string().optional(),
    level: z.nativeEnum(UserLevel).optional(),
    limit: z.number().int().min(1).max(50).optional(),
  })
  .strip();

type FindLessonsParams = z.infer<typeof paramsSchema>;

export interface FindLessonsResult {
  lessons: LessonSummary[];
}

export type FindLessonsOutput = FindLessonsResult | { error: string };

/**
 * Read tool — searches the lesson catalog by topic / CEFR level. Backs PRD
 * user story #40 ("Find me a lesson on family vocabulary").
 *
 * Returns lightweight summaries only; the AI follows up with
 * `get_lesson_detail` if it needs the full lesson body. All filters are
 * optional; an empty filter returns up to 50 lessons (capped by the
 * repository).
 *
 * `userId` is not used — lesson catalog is public.
 */
@Injectable()
export class FindLessonsTool extends BaseTool<
  FindLessonsParams,
  FindLessonsOutput
> {
  readonly name = 'find_lessons';
  readonly displayName = 'Finding relevant lessons...';
  readonly description =
    'Finds lessons in the catalog by topic (matched against module title) ' +
    'and/or CEFR level (A1..C2). Useful when the learner asks what to ' +
    'study next or for lessons about a specific topic. Returns compact ' +
    'summaries — call `get_lesson_detail` for full content. Default limit ' +
    'is 50 (hard cap).';
  readonly parameters = paramsSchema;

  constructor(private readonly courseContentService: CourseContentService) {
    super();
  }

  async execute(
    params: FindLessonsParams,
    _ctx: ToolContext<User>,
  ): Promise<FindLessonsOutput> {
    try {
      const filter: LessonFilterOptions = {};
      if (params.topic !== undefined) filter.topic = params.topic;
      if (params.level !== undefined) filter.level = params.level;
      if (params.limit !== undefined) filter.limit = params.limit;

      const lessons = await this.courseContentService.findLessons(filter);
      return { lessons };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
}
