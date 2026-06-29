import { Injectable } from '@nestjs/common';
import { BaseTool, ToolContext } from '@linvnix/shared';
import { z } from 'zod';
import { CourseContentService } from '../../courses/application/course-content.service';
import { Lesson } from '../../courses/domain/lesson.entity';
import type { User } from '../../users/domain/user.entity';

const paramsSchema = z
  .object({
    lessonId: z.string().min(1),
  })
  .strip();

type GetLessonDetailParams = z.infer<typeof paramsSchema>;

export interface GetLessonDetailResult {
  lesson: Lesson;
}

export type GetLessonDetailOutput = GetLessonDetailResult | { error: string };

/**
 * Read tool — returns the full lesson body (contents, vocabularies, grammar
 * rules, exercises, exercises) for a single lesson id. Backs PRD user
 * story #41 ("fetch the full content of a lesson when the learner is
 * asking about something off-screen").
 *
 * Lesson catalog is public — `userId` is not used. The AI is expected to
 * call this after narrowing via `find_lessons` (or with an id already
 * present in `screenContext`).
 */
@Injectable()
export class GetLessonDetailTool extends BaseTool<
  GetLessonDetailParams,
  GetLessonDetailOutput
> {
  readonly name = 'get_lesson_detail';
  readonly displayName = 'Reading lesson content...';
  readonly description =
    'Returns the full content of a single lesson by id: contents (slides), ' +
    'vocabulary list, grammar rules, exercises, and exercises. Use this ' +
    'when the learner is asking about a specific lesson that is NOT on ' +
    'their current screen — for the current screen, prefer the data already ' +
    'in screenContext. Returns `{ error }` if the lesson does not exist.';
  readonly parameters = paramsSchema;

  constructor(private readonly courseContentService: CourseContentService) {
    super();
  }

  async execute(
    params: GetLessonDetailParams,
    _ctx: ToolContext<User>,
  ): Promise<GetLessonDetailOutput> {
    try {
      const lesson = await this.courseContentService.getLessonDetail(
        params.lessonId,
      );
      return { lesson };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
}
