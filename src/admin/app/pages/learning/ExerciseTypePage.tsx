import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Volume2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { useAdminListReorder } from '../../components/admin/hooks/use-admin-list-reorder'
import { VocabFlashcardSkeleton } from '../../components/admin/PageSkeletons'
import { ErrorState, errorMessage } from '../../components/admin/ErrorState'
import { useAdminExercise, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import type { Exercise, Question } from '../../features/learning/types'
import { questionLabel, questionTypeMeta } from './authoring-meta'
import { ConfirmDeleteDialog, PageHero, SectionHeader, SortableItemRow } from './authoring-ui'
import { learningPath } from './route-utils'

/**
 * Khu soạn của MỘT loại câu hỏi. Màn hình này chỉ làm một việc:
 * chọn câu hỏi của loại này để mở form soạn riêng (loại đã khóa), hoặc thêm mới.
 */
export function ExerciseTypePage() {
  const { exerciseId, questionType } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: exercise, isLoading, error, refetch, isFetching } = useAdminExercise(exerciseId)
  const mutations = useLearningAdminMutation()
  const [pendingDelete, setPendingDelete] = useState<Question | null>(null)

  const meta = questionTypeMeta(questionType)
  const exerciseKey = ['admin-learning', 'exercise', exerciseId] as const

  const { sensors, handleDragEnd } = useAdminListReorder<Question>({
    getItems: () => {
      const cached = qc.getQueryData<Exercise>(exerciseKey)
      return (cached?.questions ?? []).filter(
        (q) => (q.questionType ?? '').toLowerCase() === meta?.value,
      )
    },
    setItems: (nextOfType) => {
      qc.setQueryData<Exercise>(exerciseKey, (prev) => {
        if (!prev) return prev
        const byId = new Map(nextOfType.map((q) => [q.id, q]))
        return {
          ...prev,
          questions: (prev.questions ?? []).map((q) => byId.get(q.id) ?? q),
        }
      })
    },
    reorder: (items) => mutations.reorderQuestions.mutateAsync(items),
    onError: () => toast.error('Không thể sắp xếp lại câu hỏi'),
  })

  if (!exerciseId) return <Navigate to={learningPath.courses()} replace />
  if (!meta) return <Navigate to={learningPath.exercise(exerciseId)} replace />

  const questions = (exercise?.questions ?? [])
    .filter((q) => (q.questionType ?? '').toLowerCase() === meta.value)
    .sort((a, b) => a.orderIndex - b.orderIndex)

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await mutations.deleteQuestion.mutateAsync(pendingDelete.id)
      toast.success('Đã xóa câu hỏi')
      setPendingDelete(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa')
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: exercise?.lesson?.title ?? 'Bài học', href: exercise?.lessonId ? learningPath.lesson(exercise.lessonId) : undefined },
          { label: exercise?.title ?? 'Bài tập', href: learningPath.exercise(exerciseId) },
          { label: meta.label },
        ]}
      />

      <PageHero
        Icon={meta.Icon}
        iconClass={`${meta.bg} text-white`}
        eyebrow={exercise?.title ?? 'Bài tập'}
        title={meta.label}
        count={{ value: questions.length, label: 'câu hỏi' }}
        description={meta.description}
      />

      <div className="space-y-4">
        <SectionHeader
          title={`Danh sách câu hỏi ${meta.label.toLowerCase()}`}
          description="Kéo để sắp xếp lại thứ tự câu hỏi trong bài tập."
          actions={
            <Button asChild>
              <Link to={learningPath.questionNew(exerciseId, meta.value)}>
                <Plus className="h-4 w-4" />
                Thêm câu hỏi
              </Link>
            </Button>
          }
        />

        {isLoading ? (
          <VocabFlashcardSkeleton count={4} />
        ) : error ? (
          <ErrorState
            message={errorMessage(error)}
            onRetry={() => refetch()}
            retrying={isFetching}
          />
        ) : questions.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-12 text-center">
            <meta.Icon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="text-lg font-bold mb-1">Chưa có câu hỏi {meta.label.toLowerCase()}</h3>
            <p className="text-sm text-muted-foreground mb-4">{meta.description}</p>
            <Button asChild>
              <Link to={learningPath.questionNew(exerciseId, meta.value)}>
                <Plus className="h-4 w-4" />
                Tạo câu hỏi đầu tiên
              </Link>
            </Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {questions.map((question) => {
                  return (
                    <SortableItemRow
                      key={question.id}
                      id={question.id}
                      onOpen={() => navigate(learningPath.questionEdit(question.exerciseId, question.id))}
                      onDelete={() => setPendingDelete(question)}
                      leading={
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${meta.bg}`}>
                          <meta.Icon className="h-5 w-5" />
                        </div>
                      }
                      title={questionLabel(question)}
                      meta={
                        question.questionAudioUrl ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold">
                            <Volume2 className="h-3 w-3" />
                            audio
                          </span>
                        ) : null
                      }
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <ConfirmDeleteDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        resource="câu hỏi"
        label={questionLabel(pendingDelete)}
        extraWarning="và toàn bộ kết quả làm bài của học viên cho câu hỏi này"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
