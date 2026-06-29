import { useState } from 'react'
import type { MouseEvent, KeyboardEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  Plus, Pencil, BookOpen, Layers, MoreVertical, Trash2, Clock,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { DragHandle } from '../../components/admin/shared/DragHandle'
import { SortableRow } from '../../components/admin/shared/SortableRow'
import { useAdminListReorder } from '../../components/admin/hooks/use-admin-list-reorder'
import { PublishStatusToggle } from '../../components/admin/PublishStatusToggle'
import { ModuleListSkeleton } from '../../components/admin/PageSkeletons'
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
import { useAdminCourse, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import type { Course, Module } from '../../features/learning/types'
import { learningPath } from './route-utils'
import { levelBg, levelLabel } from '../../features/learning/level-meta'
import { resolveMediaUrl } from '../../../lib/shared/media-url'

export function CourseDetailPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: course, isLoading, error, refetch, isFetching } = useAdminCourse(courseId)
  const mutations = useLearningAdminMutation()
  const [pendingDelete, setPendingDelete] = useState<Module | null>(null)

  const courseKey = ['admin-learning', 'course', courseId] as const
  const { sensors, handleDragEnd } = useAdminListReorder<Module>({
    getItems: () => qc.getQueryData<Course>(courseKey)?.modules ?? [],
    setItems: (next) =>
      qc.setQueryData<Course>(courseKey, (prev) =>
        prev ? { ...prev, modules: next } : prev,
      ),
    reorder: (items) => mutations.reorderModules.mutateAsync(items),
    onError: () => toast.error('Không thể sắp xếp lại chủ đề'),
  })

  const sortedModules = [...(course?.modules ?? [])].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  )

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await mutations.deleteModule.mutateAsync(pendingDelete.id)
      toast.success('Đã xóa chủ đề')
      setPendingDelete(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa')
    }
  }

  const togglePublished = async (next: boolean) => {
    if (!courseId) return
    try {
      await mutations.setCoursePublished.mutateAsync({ id: courseId, isPublished: next })
      toast.success(next ? 'Đã xuất bản khóa học' : 'Đã chuyển về bản nháp')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái')
    }
  }

  const stop = (e: MouseEvent | KeyboardEvent) => e.stopPropagation()

  const totalLessons = course?.modules?.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0) ?? 0
  const bg = levelBg(course?.level)
  const label = levelLabel(course?.level)

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Khóa học', href: learningPath.courses() },
          { label: course?.title ?? '...' },
        ]}
      />

      {/* Hero banner */}
      <div className="rounded-xl border-2 border-border overflow-hidden bg-card">
        <div className={`relative h-40 ${bg}`}>
          {course?.thumbnailUrl && (
            <img
              src={resolveMediaUrl(course.thumbnailUrl) ?? ''}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          )}
          {!course?.thumbnailUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="h-24 w-24 text-white/15" strokeWidth={1.2} />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-black/40 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-white">
              {course?.level ?? '—'} · {label}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {course?.title ?? 'Khóa học'}
              </h1>
              {course?.description && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {course.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {course && (
                <PublishStatusToggle
                  isPublished={course.isPublished}
                  onChange={togglePublished}
                  pending={mutations.setCoursePublished.isPending}
                />
              )}
              {courseId && (
                <Button asChild variant="outline">
                  <Link to={learningPath.courseEdit(courseId)}>
                    <Pencil className="h-4 w-4" />
                    Sửa
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-4 w-4" />
              <span className="font-bold text-foreground tabular-nums">{course?.modules?.length ?? 0}</span>
              chủ đề
            </span>
            <span className="text-muted-foreground/60">•</span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span className="font-bold text-foreground tabular-nums">{totalLessons}</span>
              bài học
            </span>
            <span className="text-muted-foreground/60">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span className="font-bold text-foreground tabular-nums">{course?.estimatedHours ?? 0}h</span>
              ước tính
            </span>
          </div>
        </div>
      </div>

      {/* Modules tree */}
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Chủ đề học tập</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Cây phân cấp các chủ đề và bài học trong khóa học.
            </p>
          </div>
          {courseId && (
            <Button asChild>
              <Link to={learningPath.moduleNew(courseId)}>
                <Plus className="h-4 w-4" />
                Thêm chủ đề
              </Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <ModuleListSkeleton count={4} />
        ) : error ? (
          <ErrorState
            message={errorMessage(error)}
            onRetry={() => refetch()}
            retrying={isFetching}
          />
        ) : !course?.modules || course.modules.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-12 text-center">
            <Layers className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="text-lg font-bold mb-1">Chưa có chủ đề nào</h3>
            <p className="text-sm text-muted-foreground mb-4">Tạo chủ đề đầu tiên cho khóa học này</p>
            {courseId && (
              <Button asChild>
                <Link to={learningPath.moduleNew(courseId)}>
                  <Plus className="h-4 w-4" />
                  Tạo chủ đề đầu tiên
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={sortedModules.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {sortedModules.map((module) => (
                  <ModuleRow
                    key={module.id}
                    module={module}
                    onOpen={() => navigate(learningPath.module(module.id))}
                    onEdit={() => navigate(learningPath.moduleEdit(module.courseId, module.id))}
                    onDelete={() => setPendingDelete(module)}
                    stop={stop}
                  />
                ))}
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
              <AlertDialogTitle>Xóa chủ đề?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Chủ đề <span className="font-semibold text-foreground">&quot;{pendingDelete?.title}&quot;</span> và toàn bộ bài học liên quan sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:opacity-90"
              onClick={confirmDelete}
            >
              <Trash2 className="h-4 w-4" />
              Xóa chủ đề
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ModuleRow({
  module,
  onOpen,
  onEdit,
  onDelete,
  stop,
}: {
  module: Module
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
  stop: (e: MouseEvent | KeyboardEvent) => void
}) {
  const lessonCount = module.lessons?.length ?? 0
  return (
    <SortableRow id={module.id}>
      {({ listeners, attributes }) => (
        <div className="rounded-lg border-2 border-border bg-card overflow-hidden">
          <div
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onOpen()
            }}
            className="group flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/40 focus:outline-none focus:bg-muted/40"
          >
            <div onClick={stop} onKeyDown={stop} className="shrink-0">
              <DragHandle {...listeners} {...attributes} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground truncate">{module.title}</h3>
              {module.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{module.description}</p>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="font-bold tabular-nums text-foreground">{lessonCount}</span>
              <span>bài</span>
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
                  <DropdownMenuItem onSelect={onEdit}>
                    <Pencil className="h-4 w-4" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                    <Trash2 className="h-4 w-4" />
                    Xóa chủ đề
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}
    </SortableRow>
  )
}

