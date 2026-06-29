import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ClipboardList, Plus, TriangleAlert } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { useAdminListReorder } from '../../components/admin/hooks/use-admin-list-reorder'
import { useAdminLesson, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import type { Exercise, Lesson } from '../../features/learning/types'
import { stageOneTotal } from './authoring-meta'
import { ConfirmDeleteDialog, PageHero, SectionHeader, SortableItemRow } from './authoring-ui'
import { learningPath } from './route-utils'

/**
 * Bài tập — màn hình này chỉ làm MỘT việc: chọn (hoặc tạo) một bài tập
 * để đi tiếp vào chọn loại câu hỏi. Không soạn câu hỏi tại đây.
 */
export function LessonStageExercisesPage() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: lesson } = useAdminLesson(lessonId)
  const mutations = useLearningAdminMutation()
  const [pendingDelete, setPendingDelete] = useState<Exercise | null>(null)

  const lessonKey = ['admin-learning', 'lesson', lessonId] as const
  const { sensors, handleDragEnd } = useAdminListReorder<Exercise>({
    getItems: () => qc.getQueryData<Lesson>(lessonKey)?.exercises ?? [],
    setItems: (next) =>
      qc.setQueryData<Lesson>(lessonKey, (prev) => (prev ? { ...prev, exercises: next } : prev)),
    reorder: (items) => mutations.reorderExercises.mutateAsync(items),
    onError: () => toast.error('Không thể sắp xếp lại bài tập'),
  })

  if (!lessonId) return <Navigate to={learningPath.courses()} replace />

  const sortedExercises = [...(lesson?.exercises ?? [])].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  )
  const contentTotal = stageOneTotal(lesson)

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await mutations.deleteLessonChild.mutateAsync({ kind: 'exercises', id: pendingDelete.id })
      toast.success('Đã xóa bài tập')
      setPendingDelete(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa')
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: lesson?.module?.course?.title ?? 'Khóa học', href: lesson?.module?.courseId ? learningPath.course(lesson.module.courseId) : learningPath.courses() },
          { label: lesson?.module?.title ?? 'Chủ đề', href: lesson?.moduleId ? learningPath.module(lesson.moduleId) : undefined },
          { label: lesson?.title ?? 'Bài học', href: learningPath.lesson(lessonId) },
          { label: 'Bài tập' },
        ]}
      />

      <PageHero
        Icon={ClipboardList}
        title="Bài tập"
        count={{ value: sortedExercises.length, label: 'bài tập' }}
        description="Chọn một bài tập để soạn câu hỏi bên trong, hoặc tạo bài tập mới."
      />

      {contentTotal === 0 && (
        <div className="flex items-start gap-3 rounded-lg border-2 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
          <TriangleAlert className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
              Bài học chưa có nội dung
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-0.5">
              Nên soạn nội dung bài học trước rồi mới tạo bài tập luyện tập.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <SectionHeader
          title="Danh sách bài tập"
          description="Kéo để sắp xếp lại thứ tự bài tập trong bài học."
          actions={
            <Button asChild>
              <Link to={learningPath.exerciseNew(lessonId)}>
                <Plus className="h-4 w-4" />
                Thêm bài tập
              </Link>
            </Button>
          }
        />

        {sortedExercises.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="text-lg font-bold mb-1">Chưa có bài tập</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tạo bài tập, sau đó chọn loại câu hỏi để soạn bên trong
            </p>
            <Button asChild>
              <Link to={learningPath.exerciseNew(lessonId)}>
                <Plus className="h-4 w-4" />
                Tạo bài tập đầu tiên
              </Link>
            </Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortedExercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {sortedExercises.map((row) => (
                  <SortableItemRow
                    key={row.id}
                    id={row.id}
                    onOpen={() => navigate(learningPath.exercise(row.id))}
                    onDelete={() => setPendingDelete(row)}
                    leading={
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ClipboardList className="h-5 w-5" />
                      </div>
                    }
                    title={
                      <span className="inline-flex items-center gap-2">
                        {row.title}
                        {row.isAIGenerated && (
                          <span className="inline-flex items-center rounded-md bg-purple-100 dark:bg-purple-950/40 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                            AI tạo
                          </span>
                        )}
                      </span>
                    }
                    meta={
                      <>
                        <span className="inline-flex items-center rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold tabular-nums">
                          {row.questions?.length ?? 0} câu hỏi
                        </span>
                        {row.description && (
                          <span className="truncate text-sm">{row.description}</span>
                        )}
                      </>
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <ConfirmDeleteDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        resource="bài tập"
        label={pendingDelete?.title ?? ''}
        extraWarning="cùng toàn bộ câu hỏi bên trong"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
