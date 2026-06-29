import { useState } from 'react'
import type { MouseEvent, KeyboardEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  Plus, Pencil, BookOpen, Clock, MoreVertical, Trash2, Layers,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { DragHandle } from '../../components/admin/shared/DragHandle'
import { SortableRow } from '../../components/admin/shared/SortableRow'
import { useAdminListReorder } from '../../components/admin/hooks/use-admin-list-reorder'
import { LessonTimelineSkeleton } from '../../components/admin/PageSkeletons'
import { ErrorState, errorMessage } from '../../components/admin/ErrorState'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { useAdminModule, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import type { Lesson, Module } from '../../features/learning/types'
import { learningPath } from './route-utils'

export function ModuleDetailPage() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: module, isLoading, error, refetch, isFetching } = useAdminModule(moduleId)
  const mutations = useLearningAdminMutation()
  const [pendingDelete, setPendingDelete] = useState<Lesson | null>(null)

  const moduleKey = ['admin-learning', 'module', moduleId] as const
  const { sensors, handleDragEnd } = useAdminListReorder<Lesson>({
    getItems: () => qc.getQueryData<Module>(moduleKey)?.lessons ?? [],
    setItems: (next) =>
      qc.setQueryData<Module>(moduleKey, (prev) =>
        prev ? { ...prev, lessons: next } : prev,
      ),
    reorder: (items) => mutations.reorderLessons.mutateAsync(items),
    onError: () => toast.error('Không thể sắp xếp lại bài học'),
  })

  const sortedLessons = [...(module?.lessons ?? [])].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  )

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await mutations.deleteLesson.mutateAsync(pendingDelete.id)
      toast.success('Đã xóa bài học')
      setPendingDelete(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa')
    }
  }

  const stop = (e: MouseEvent | KeyboardEvent) => e.stopPropagation()

  const totalMinutes = module?.lessons?.reduce((sum, l) => sum + (l.estimatedDuration ?? 0), 0) ?? 0

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: module?.course?.title ?? 'Khóa học', href: module?.courseId ? learningPath.course(module.courseId) : learningPath.courses() },
          { label: module?.title ?? 'Chủ đề' },
        ]}
      />

      {/* Header card */}
      <div className="rounded-xl border-2 border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-xl font-bold">
            {module?.orderIndex ?? '—'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs mb-1.5">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-bold uppercase tracking-wider text-muted-foreground">Chủ đề</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {module?.title ?? 'Chủ đề'}
            </h1>
            {module?.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-3xl">
                {module.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                <span className="font-bold text-foreground tabular-nums">{module?.lessons?.length ?? 0}</span>
                bài học
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span className="font-bold text-foreground tabular-nums">{totalMinutes}</span>
                phút
              </span>
            </div>
          </div>
          {moduleId && module && (
            <Button asChild variant="outline" className="shrink-0">
              <Link to={learningPath.moduleEdit(module.courseId, moduleId)}>
                <Pencil className="h-4 w-4" />
                Sửa
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Lessons timeline */}
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Bài học theo lộ trình</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Trình tự các bài học trong chủ đề này.
            </p>
          </div>
          {moduleId && (
            <Button asChild>
              <Link to={learningPath.lessonNew(moduleId)}>
                <Plus className="h-4 w-4" />
                Thêm bài học
              </Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <LessonTimelineSkeleton count={4} />
        ) : error ? (
          <ErrorState
            message={errorMessage(error)}
            onRetry={() => refetch()}
            retrying={isFetching}
          />
        ) : !module?.lessons || module.lessons.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="text-lg font-bold mb-1">Chưa có bài học nào</h3>
            <p className="text-sm text-muted-foreground mb-4">Tạo bài học đầu tiên cho chủ đề này</p>
            {moduleId && (
              <Button asChild>
                <Link to={learningPath.lessonNew(moduleId)}>
                  <Plus className="h-4 w-4" />
                  Tạo bài học đầu tiên
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={sortedLessons.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {sortedLessons.map((lesson) => (
                    <SortableRow key={lesson.id} id={lesson.id}>
                      {({ listeners, attributes }) => (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(learningPath.lesson(lesson.id))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') navigate(learningPath.lesson(lesson.id))
                          }}
                          className="group relative flex items-center gap-3 rounded-lg border-2 border-border bg-card pl-3 pr-3 py-3 cursor-pointer transition-colors hover:border-primary focus:outline-none focus:border-primary"
                        >
                          <div onClick={stop} onKeyDown={stop} className="shrink-0">
                            <DragHandle {...listeners} {...attributes} />
                          </div>

                          <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold tabular-nums">
                            {lesson.orderIndex}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-bold text-foreground truncate">
                                {lesson.title}
                              </h3>
                              {lesson.estimatedDuration && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span className="font-medium tabular-nums">{lesson.estimatedDuration}p</span>
                                </span>
                              )}
                            </div>
                            {lesson.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                {lesson.description}
                              </p>
                            )}
                          </div>

                          <div onClick={stop} onKeyDown={stop} className="shrink-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem asChild>
                                  <Link to={learningPath.lessonEdit(lesson.moduleId, lesson.id)}>
                                    <Pencil className="h-4 w-4" />
                                    Chỉnh sửa
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onSelect={() => setPendingDelete(lesson)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Xóa bài học
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      )}
                    </SortableRow>
                  )
                )}
              </div>
            </SortableContext>

          </DndContext>
        )}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Xóa bài học?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Bài học <span className="font-semibold text-foreground">&quot;{pendingDelete?.title}&quot;</span> cùng nội dung, từ vựng và bài tập bên trong sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:opacity-90"
              onClick={confirmDelete}
            >
              <Trash2 className="h-4 w-4" />
              Xóa bài học
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

