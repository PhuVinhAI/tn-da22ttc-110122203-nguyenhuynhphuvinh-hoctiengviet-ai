import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseTool, ToolContext } from '@linvnix/shared';
import { z } from 'zod';
import { ProgressService } from '../../progress/application/progress.service';
import { UserLevel, ProgressStatus } from '../../../common/enums';
import type { User } from '../../users/domain/user.entity';

const paramsSchema = z.object({}).strip();

type GetProgressOverviewParams = z.infer<typeof paramsSchema>;

export interface ActiveCourseSummary {
  id: string;
  title: string;
  percent: number;
}

export interface ModuleInProgressSummary {
  id: string;
  title: string;
  percent: number;
  courseTitle: string;
}

export interface GetProgressOverviewResult {
  currentLevel: UserLevel;
  activeCourses: ActiveCourseSummary[];
  modulesInProgress: ModuleInProgressSummary[];
  weakAreas: string[];
}

export type GetProgressOverviewOutput =
  | GetProgressOverviewResult
  | { error: string };

// "Weak area" is defined as a module the learner has invested in (at least
// two completed lessons) but is averaging below 70/100 on. Below this
// threshold the AI should consider recommending review.
const WEAK_AREA_MIN_COMPLETED = 2;
const WEAK_AREA_AVG_SCORE_THRESHOLD = 70;

interface CourseAccumulator {
  id: string;
  title: string;
}

interface ModuleAccumulator {
  id: string;
  title: string;
  courseTitle: string;
  lessons: { status: ProgressStatus; score?: number }[];
}

/**
 * Read tool — composite snapshot of the learner's progression across all
 * courses they've touched. Backs PRD user stories #34 ("How am I doing?")
 * and #37 ("What course should I focus on?").
 *
 * Composition only — no new service methods. The tool walks the rows
 * returned by `ProgressService.getUserProgress`, derives unique courses +
 * modules from the loaded `lesson.module.course` relations, and asks
 * `ProgressService.getCourseProgress` for each unique course to get a
 * server-authoritative completion percent. Module percent is derived
 * locally (completed lessons over attempted lessons in that module) since
 * there is no per-module aggregated service method on the V1 path.
 *
 * `userId` is read exclusively from `ctx`.
 */
@Injectable()
export class GetProgressOverviewTool extends BaseTool<
  GetProgressOverviewParams,
  GetProgressOverviewOutput
> {
  readonly name = 'get_progress_overview';
  readonly displayName = 'Đang xem tiến trình của bạn...';
  readonly description =
    "Returns a CEFR-aware overview of the learner's progression: their " +
    "current level, the courses they're actively working on with completion " +
    'percent, the modules currently in progress, and a short list of "weak ' +
    'areas" (modules where they\'re averaging below 70/100). Useful for ' +
    '"How am I doing?" and "What should I focus on?" type questions. Takes ' +
    'no parameters — the learner is always the conversation owner.';
  readonly parameters = paramsSchema;

  constructor(private readonly progressService: ProgressService) {
    super();
  }

  async execute(
    _params: GetProgressOverviewParams,
    ctx: ToolContext<User>,
  ): Promise<GetProgressOverviewOutput> {
    try {
      const userId = ctx.userId;
      const userProgress = await this.progressService.getUserProgress(userId);

      const courseMap = new Map<string, CourseAccumulator>();
      const moduleMap = new Map<string, ModuleAccumulator>();

      for (const p of userProgress) {
        const lesson = (p as any).lesson;
        const module = lesson?.module;
        const course = module?.course;
        // Defensive: rows missing any relation can't contribute to the
        // overview. Skip rather than crash so a partial DB state still
        // returns a useful (if smaller) snapshot.
        if (!lesson || !module || !course) continue;

        if (!courseMap.has(course.id)) {
          courseMap.set(course.id, { id: course.id, title: course.title });
        }

        let moduleAcc = moduleMap.get(module.id);
        if (!moduleAcc) {
          moduleAcc = {
            id: module.id,
            title: module.title,
            courseTitle: course.title,
            lessons: [],
          };
          moduleMap.set(module.id, moduleAcc);
        }
        moduleAcc.lessons.push({ status: p.status, score: p.score });
      }

      const activeCourses: ActiveCourseSummary[] = [];
      for (const course of courseMap.values()) {
        let percent = 0;
        try {
          const cp = await this.progressService.getCourseProgress(
            userId,
            course.id,
          );
          if (cp.totalModulesCount > 0) {
            percent = Math.round(
              (cp.completedModulesCount / cp.totalModulesCount) * 100,
            );
          }
        } catch (error) {
          // NotFound means the learner has lesson-level progress but no
          // CourseProgress row was ever materialised (e.g. enrolment
          // bookkeeping bug). Surface 0% rather than failing the whole
          // overview.
          if (!(error instanceof NotFoundException)) {
            throw error;
          }
        }
        activeCourses.push({ id: course.id, title: course.title, percent });
      }

      const modulesInProgress: ModuleInProgressSummary[] = [];
      const weakAreas: string[] = [];
      for (const m of moduleMap.values()) {
        const completed = m.lessons.filter(
          (l) => l.status === ProgressStatus.COMPLETED,
        );
        if (completed.length < m.lessons.length) {
          const percent =
            m.lessons.length > 0
              ? Math.round((completed.length / m.lessons.length) * 100)
              : 0;
          modulesInProgress.push({
            id: m.id,
            title: m.title,
            courseTitle: m.courseTitle,
            percent,
          });
        }

        const scored = completed.filter((l) => typeof l.score === 'number');
        if (scored.length >= WEAK_AREA_MIN_COMPLETED) {
          const avg =
            scored.reduce((sum, l) => sum + (l.score ?? 0), 0) / scored.length;
          if (avg < WEAK_AREA_AVG_SCORE_THRESHOLD) {
            weakAreas.push(m.title);
          }
        }
      }

      return {
        currentLevel: ctx.user.currentLevel,
        activeCourses,
        modulesInProgress,
        weakAreas,
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
}
