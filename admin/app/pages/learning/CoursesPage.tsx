import { useState } from 'react'
import type { MouseEvent, KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Plus, BookOpen, Layers, Pencil, Trash2, MoreVertical } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
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
import type { Course } from '../../features/learning/types'
import { learningPath } from './route-utils'

const levelColors: Record<string, string> = {
  A1: 'text-emerald-600 dark:text-emerald-400',
  A2: 'text-teal-600 dark:text-teal-400',
  B1: 'text-blue-600 dark:text-blue-400',
  B2: 'text-indigo-600 dark:text-indigo-400',
  C1: 'text-purple-600 dark:text-purple-400',
  C2: 'text-rose-600 dark:text-rose-400',
}

export function CoursesPage() {
  const navigate = useNavigate()
  const { data = [], isLoading, error } = useAdminCourses()
  const mutations = useLearningAdminMutation()
  const [pendingDelete, setPendingDelete] = useState<Course | null>(null)

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

  const stop = (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation()
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Học liệu' }, { label: 'Khóa học' }]} />

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Khóa học</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Quản lý chủ đề, bài học và toàn bộ học liệu.
          </p>
        </div>
        <Button asChild>
          <Link to={learningPath.courseNew()}>
            <Plus className="h-4 w-4" />
            Thêm khóa học
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">Đang tải...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border-2 border-destructive bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive font-semibold">
            {error instanceof Error ? error.message : 'Không tải được dữ liệu'}
          </p>
        </div>
      ) : data.length === 0 ? (
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
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((course) => (
            <div
              key={course.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(learningPath.course(course.id))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(learningPath.course(course.id))
              }}
              className="group relative rounded-lg border-2 border-border bg-card overflow-hidden cursor-pointer transition-colors hover:border-primary focus:outline-none focus:border-primary"
            >
              {/* Top bar: level + status */}
              <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b-2 border-border bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-xs font-bold ${levelColors[course.level] ?? 'text-muted-foreground'}`}>
                    {course.level}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">#{course.orderIndex}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  {course.isPublished ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Public
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                      Draft
                    </span>
                  )}
                </div>
                <div onClick={stop} onKeyDown={stop}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 -mr-1 text-muted-foreground hover:text-foreground"
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Tùy chọn</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild>
                        <Link to={learningPath.courseEdit(course.id)}>
                          <Pencil className="h-4 w-4" />
                          Chỉnh sửa
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setPendingDelete(course)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Xóa khóa học
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-base font-bold text-foreground line-clamp-2 mb-3">
                  {course.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Layers className="h-3.5 w-3.5" />
                  <span className="font-medium">{course.modules?.length ?? 0} chủ đề</span>
                </div>
              </div>
            </div>
          ))}
        </div>

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
