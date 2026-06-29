import { Link, useParams } from 'react-router'
import { ClipboardList, Pencil } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { VocabFlashcardSkeleton } from '../../components/admin/PageSkeletons'
import { ErrorState, errorMessage } from '../../components/admin/ErrorState'
import { useAdminExercise } from '../../features/learning/api/use-learning-admin'
import { QUESTION_TYPES } from './authoring-meta'
import { GateCard, PageHero } from './authoring-ui'
import { learningPath } from './route-utils'

/**
 * Trang bài tập — màn hình này chỉ làm MỘT việc: chọn loại câu hỏi.
 * Chọn xong mới vào khu soạn của loại đó (ADR 0002).
 */
export function ExerciseDetailPage() {
  const { exerciseId } = useParams()
  const { data: exercise, isLoading, error, refetch, isFetching } = useAdminExercise(exerciseId)

  const questions = exercise?.questions ?? []
  const typeCounts = questions.reduce<Record<string, number>>((acc, q) => {
    const key = (q.questionType ?? '').toLowerCase()
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: exercise?.lesson?.title ?? 'Bài học', href: exercise?.lessonId ? learningPath.lesson(exercise.lessonId) : undefined },
          { label: 'Bài tập', href: exercise?.lessonId ? learningPath.lessonStageExercises(exercise.lessonId) : undefined },
          { label: exercise?.title ?? 'Bài tập' },
        ]}
      />

      <PageHero
        Icon={ClipboardList}
        eyebrow={exercise?.title ?? 'Bài tập'}
        title="Chọn loại câu hỏi"
        count={{ value: questions.length, label: 'câu hỏi' }}
        description="Chọn loại câu hỏi để mở khu soạn riêng. Mỗi loại có form và thiết lập riêng."
        actions={
          exerciseId && exercise ? (
            <Button asChild variant="outline">
              <Link to={learningPath.exerciseEdit(exercise.lessonId ?? '', exerciseId)}>
                <Pencil className="h-4 w-4" />
                Sửa thông tin
              </Link>
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <VocabFlashcardSkeleton count={6} />
      ) : error ? (
        <ErrorState
          message={errorMessage(error)}
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      ) : exerciseId ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {QUESTION_TYPES.map((type) => (
            <GateCard
              key={type.value}
              to={learningPath.exerciseType(exerciseId, type.value)}
              Icon={type.Icon}
              iconClass={`${type.bg} text-white`}
              label={type.label}
              description={type.description}
              count={typeCounts[type.value] ?? 0}
              countLabel="câu hỏi"
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
