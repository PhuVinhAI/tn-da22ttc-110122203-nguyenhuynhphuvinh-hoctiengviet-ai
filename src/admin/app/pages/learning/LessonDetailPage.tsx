import { Link, useParams } from 'react-router'
import { BookOpen, ChevronRight, ClipboardList, Clock, Pencil } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { LessonContentSkeleton } from '../../components/admin/PageSkeletons'
import { ErrorState, errorMessage } from '../../components/admin/ErrorState'
import { useAdminLesson } from '../../features/learning/api/use-learning-admin'
import { stageOneTotal } from './authoring-meta'
import { StatusPill } from './authoring-ui'
import { learningPath } from './route-utils'

/**
 * Cổng vào Giai đoạn soạn bài (ADR 0002). Màn hình này chỉ làm MỘT việc:
 * chọn giai đoạn. Soạn gì cũng phải đi sâu vào trong.
 */
export function LessonDetailPage() {
  const { lessonId } = useParams()
  const { data: lesson, isLoading, error, refetch, isFetching } = useAdminLesson(lessonId)

  const contentTotal = stageOneTotal(lesson)
  const exerciseTotal = lesson?.exercises?.length ?? 0
  const questionTotal = (lesson?.exercises ?? []).reduce(
    (sum, e) => sum + (e.questions?.length ?? 0),
    0,
  )

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: lesson?.module?.course?.title ?? 'Khóa học', href: lesson?.module?.courseId ? learningPath.course(lesson.module.courseId) : learningPath.courses() },
          { label: lesson?.module?.title ?? 'Chủ đề', href: lesson?.moduleId ? learningPath.module(lesson.moduleId) : undefined },
          { label: lesson?.title ?? 'Bài học' },
        ]}
      />

      <div className="rounded-xl border-2 border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-xs mb-2">
              {lesson?.estimatedDuration && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium tabular-nums">{lesson.estimatedDuration} phút</span>
                </span>
              )}
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground tabular-nums">#{lesson?.orderIndex ?? 0}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {lesson?.title ?? 'Bài học'}
            </h1>
            {lesson?.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-3xl">
                {lesson.description}
              </p>
            )}
          </div>
          {lessonId && lesson && (
            <Button asChild variant="outline" className="shrink-0">
              <Link to={learningPath.lessonEdit(lesson.moduleId, lessonId)}>
                <Pencil className="h-4 w-4" />
                Sửa
              </Link>
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <LessonContentSkeleton />
      ) : error ? (
        <ErrorState
          message={errorMessage(error)}
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      ) : lesson && lessonId ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Soạn bài học</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Soạn nội dung bài học trước, sau đó tạo bài tập để học viên luyện tập.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StageGate
              to={learningPath.lessonStageContent(lessonId)}
              Icon={BookOpen}
              title="Nội dung bài học"
              description="Phần kiến thức học viên tiếp thu: nội dung bài, từ vựng, quy tắc ngữ pháp."
              count={contentTotal}
              countLabel="mục đã soạn"
              status={contentTotal >= 3 ? 'done' : contentTotal > 0 ? 'partial' : 'empty'}
              hint={contentTotal === 0 ? 'Bắt đầu từ đây' : undefined}
            />
            <StageGate
              to={learningPath.lessonStageExercises(lessonId)}
              Icon={ClipboardList}
              title="Bài tập"
              description="Câu hỏi luyện tập trên nền kiến thức đã soạn."
              count={exerciseTotal}
              countLabel={`bài tập · ${questionTotal} câu hỏi`}
              status={exerciseTotal > 0 ? 'done' : 'empty'}
              hint={contentTotal === 0 ? 'Nên soạn nội dung trước' : undefined}
              warn={contentTotal === 0}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function StageGate({
  to,
  Icon,
  title,
  description,
  count,
  countLabel,
  status,
  hint,
  warn,
}: {
  to: string
  Icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  count: number
  countLabel: string
  status: 'done' | 'partial' | 'empty'
  hint?: string
  warn?: boolean
}) {
  return (
    <Link
      to={to}
      className={`group flex flex-col gap-4 rounded-xl border-2 bg-card p-6 transition-colors hover:border-primary focus:outline-none focus-visible:border-primary ${
        warn ? 'border-amber-300 dark:border-amber-800' : 'border-border'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-7 w-7" />
        </div>
        <ChevronRight className="h-6 w-6 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold leading-tight">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center justify-between pt-4 border-t-2 border-border">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums">{count}</span>
          <span className="text-xs font-medium text-muted-foreground">{countLabel}</span>
        </div>
        <StatusPill status={status} />
      </div>
      {hint && (
        <p
          className={`text-xs font-semibold ${
            warn
              ? 'text-amber-700 dark:text-amber-300'
              : 'text-primary'
          }`}
        >
          {hint}
        </p>
      )}
    </Link>
  )
}
