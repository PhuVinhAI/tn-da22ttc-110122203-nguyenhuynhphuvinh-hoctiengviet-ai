import { useState } from 'react'
import type { MouseEvent, KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { Plus, BookOpen, Layers, Pencil, Trash2, MoreVertical, Clock, Search } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { DragHandle } from '../../components/admin/shared/DragHandle'
import { SortableRow } from '../../components/admin/shared/SortableRow'
import { useAdminListReorder } from '../../components/admin/hooks/use-admin-list-reorder'
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
import { useAdminCourses, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import { CourseGridSkeleton } from '../../components/admin/PageSkeletons'
import { ErrorState, errorMessage } from '../../components/admin/ErrorState'
import type { Course } from '../../features/learning/types'
import { learningPath } from './route-utils'
import { levelBg, levelLabel } from '../../features/learning/level-meta'
import { resolveMediaUrl } from '../../../lib/shared/media-url'

export function CoursesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data = [], isLoading, error, refetch, isFetching } = useAdminCourses()
  const mutations = useLearningAdminMutation()
  const [pendingDelete, setPendingDelete] = useState<Course | null>(null)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')

  const sorted = [...data].sort((a, b) => a.orderIndex - b.orderIndex)
  const filtered = sorted.filter((course) => {
    if (search && !course.title.toLowerCase().includes(search.toLowerCase())) return false
    if (levelFilter !== 'all' && course.level !== levelFilter) return false
    return true
  })
  const canReorder = !search && levelFilter === 'all'

  const { sensors, handleDragEnd } = useAdminListReorder<Course>({
    getItems: () => qc.getQueryData<Course[]>(['admin-learning', 'courses']) ?? [],
    setItems: (next) => qc.setQueryData<Course[]>(['admin-learning', 'courses'], next),
    reorder: (items) => mutations.reorderCourses.mutateAsync(items),
    onError: () => toast.error('Không thể sắp xếp lại khóa học'),
  })

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await mutations.deleteCourse.mutateAsync(pendingDelete.id)
      toast.success('Đã xóa khóa học')
      setPendingDelete(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa')
    }
  }

  const stop = (e: MouseEvent | KeyboardEvent) => e.stopPropagation()

  const publishedCount = data.filter((c) => c.isPublished).length

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className="rounded-xl border-2 border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Học liệu</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-3xl">
              Quản lý khóa học, chủ đề và bài học cho toàn bộ chương trình đào tạo.
            </p>
            {!isLoading && !error && data.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-bold text-foreground tabular-nums">{data.length}</span>
                  khóa học
                </span>
                <span className="text-muted-foreground/60">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-bold text-foreground tabular-nums">{publishedCount}</span>
                  đã xuất bản
                </span>
                <span className="text-muted-foreground/60">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-bold text-foreground tabular-nums">{data.length - publishedCount}</span>
                  bản nháp
                </span>
              </div>
            )}
          </div>
          <Button asChild className="shrink-0">
            <Link to={learningPath.courseNew()}>
              <Plus className="h-4 w-4" />
              Thêm khóa học
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      {!isLoading && !error && data.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm khóa học..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border-2 border-border bg-card p-1">
            <FilterPill active={levelFilter === 'all'} onClick={() => setLevelFilter('all')}>
              Tất cả
            </FilterPill>
            {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((level) => (
              <FilterPill key={level} active={levelFilter === level} onClick={() => setLevelFilter(level)}>
                {level}
              </FilterPill>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <CourseGridSkeleton count={6} />
      ) : error ? (
        <ErrorState
          message={errorMessage(error)}
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      ) : data.length === 0 ? (
        <EmptyCourses />
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-12 text-center">
          <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="text-lg font-bold mb-1">Không tìm thấy khóa học</h3>
          <p className="text-sm text-muted-foreground">Thử thay đổi từ khóa hoặc bộ lọc</p>
        </div>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filtered.map((c) => c.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    canDrag={canReorder}
                    onOpen={() => navigate(learningPath.course(course.id))}
                    onDelete={() => setPendingDelete(course)}
                    stop={stop}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </div>
                  <AlertDialogTitle>Xóa khóa học?</AlertDialogTitle>
                </div>
                <AlertDialogDescription>
                  Khóa học <span className="font-semibold text-foreground">&quot;{pendingDelete?.title}&quot;</span> và toàn bộ chủ đề, bài học liên quan sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:opacity-90"
                  onClick={confirmDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa khóa học
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}

function CourseCard({
  course,
  canDrag,
  onOpen,
  onDelete,
  stop,
}: {
  course: Course
  canDrag: boolean
  onOpen: () => void
  onDelete: () => void
  stop: (e: MouseEvent | KeyboardEvent) => void
}) {
  const bg = levelBg(course.level)
  const label = levelLabel(course.level)
  return (
    <SortableRow id={course.id} disabled={!canDrag}>
      {({ listeners, attributes }) => (
        <div
          role="button"
          tabIndex={0}
          onClick={onOpen}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onOpen()
          }}
          className="group relative rounded-lg border-2 border-border bg-card overflow-hidden cursor-pointer transition-colors hover:border-primary focus:outline-none focus:border-primary"
        >
          <div className={`relative h-32 ${bg} overflow-hidden`}>
            {course.thumbnailUrl ? (
              <img
                src={resolveMediaUrl(course.thumbnailUrl) ?? ''}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-white/20" strokeWidth={1.5} />
              </div>
            )}
            <div className="absolute top-2 left-2 flex items-center gap-1.5">
              {canDrag && (
                <div onClick={stop} onKeyDown={stop}>
                  <DragHandle
                    {...listeners}
                    {...attributes}
                    className="h-8 w-6 rounded-md bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 hover:text-white"
                  />
                </div>
              )}
              <span className="inline-flex items-center gap-1 rounded-md bg-black/40 backdrop-blur-sm px-2 py-1 text-xs font-bold text-white">
                {course.level} · {label}
              </span>
            </div>
            <div className="absolute top-2 right-2">
              <div onClick={stop} onKeyDown={stop}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 hover:text-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem asChild>
                      <Link to={learningPath.courseEdit(course.id)}>
                        <Pencil className="h-4 w-4" />
                        Chỉnh sửa
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                      <Trash2 className="h-4 w-4" />
                      Xóa khóa học
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="p-4">
            <h3 className="text-base font-bold text-foreground line-clamp-1 mb-1">
              {course.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
              {course.description}
            </p>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                <span className="font-medium">{course.modules?.length ?? 0} chủ đề</span>
              </span>
              {course.estimatedHours && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-medium tabular-nums">{course.estimatedHours} giờ</span>
                </span>
              )}
              <span className="ml-auto">
                {course.isPublished ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-1 text-[11px] font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Đang phát hành
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted text-muted-foreground px-2 py-1 text-[11px] font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                    Bản nháp
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </SortableRow>
  )
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {children}
    </button>
  )
}

function EmptyCourses() {
  return (
    <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-12 text-center">
      <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
      <h3 className="text-lg font-bold mb-1">Chưa có khóa học nào</h3>
      <p className="text-sm text-muted-foreground mb-4">Tạo khóa học đầu tiên để bắt đầu</p>
      <Button asChild>
        <Link to={learningPath.courseNew()}>
          <Plus className="h-4 w-4" />
          Tạo khóa học đầu tiên
        </Link>
      </Button>
    </div>
  )
}
