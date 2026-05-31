import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { Plus, FileText, CheckSquare, Edit3, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ConfirmAction } from '../../components/admin/ConfirmAction'
import { PageHeader } from '../../components/admin/PageHeader'
import { ExerciseCard } from '../../components/learning/ExerciseCard'
import { useAdminExerciseSet, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import type { Exercise } from '../../features/learning/types'
import { learningPath } from './route-utils'

export function ExerciseSetDetailPage() {
  const { setId } = useParams()
  const { data: set, isLoading, error } = useAdminExerciseSet(setId)
  const mutations = useLearningAdminMutation()

  const remove = async (exercise: Exercise) => {
    try {
      await mutations.deleteExercise.mutateAsync(exercise.id)
      toast.success('Đã xóa bài tập')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa')
    }
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Học liệu', href: learningPath.courses() },
          { label: set?.lesson?.module?.course?.title ?? 'Khóa học', href: set?.lesson?.module?.courseId ? learningPath.course(set.lesson.module.courseId) : learningPath.courses() },
          { label: set?.lesson?.module?.title ?? 'Chủ đề', href: set?.lesson?.moduleId ? learningPath.module(set.lesson.moduleId) : undefined },
          { label: set?.lesson?.title ?? 'Bài học', href: set?.lessonId ? learningPath.lesson(set.lessonId) : undefined },
          { label: set?.title ?? 'Bộ bài tập' },
        ]}
      />

      <PageHeader
        title={set?.title ?? 'Bộ bài tập'}
        description={set?.description ?? undefined}
        actions={
          setId ? (
            <Button asChild size="lg">
              <Link to={learningPath.exerciseNew(setId)}>
                <Plus className="h-5 w-5" />
                Thêm bài tập
              </Link>
            </Button>
          ) : null
        }
      />

      {/* Stats Summary */}
      {set && set.exercises && set.exercises.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <div className="text-sm font-semibold text-muted-foreground mb-2">Tổng số bài tập</div>
            <div className="text-4xl font-bold text-foreground">{set.exercises.length}</div>
          </div>
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <div className="text-sm font-semibold text-muted-foreground mb-2">Trắc nghiệm</div>
            <div className="text-4xl font-bold text-blue-500">
              {set.exercises.filter(e => e.exerciseType === 'MULTIPLE_CHOICE').length}
            </div>
          </div>
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <div className="text-sm font-semibold text-muted-foreground mb-2">Điền chỗ trống</div>
            <div className="text-4xl font-bold text-green-500">
              {set.exercises.filter(e => e.exerciseType === 'FILL_IN_BLANK').length}
            </div>
          </div>
          <div className="rounded-2xl border-2 border-border bg-card p-6">
            <div className="text-sm font-semibold text-muted-foreground mb-2">Khác</div>
            <div className="text-4xl font-bold text-purple-500">
              {set.exercises.filter(e => !['MULTIPLE_CHOICE', 'FILL_IN_BLANK'].includes(e.exerciseType)).length}
            </div>
          </div>
        </div>
      )}

      {/* Exercise Grid */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-lg text-muted-foreground">Đang tải...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border-2 border-destructive bg-destructive/10 p-8 text-center">
          <p className="text-lg text-destructive font-semibold">{error instanceof Error ? error.message : 'Không tải được dữ liệu'}</p>
        </div>
      ) : !set?.exercises || set.exercises.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-20 text-center">
          <FileText className="h-24 w-24 mx-auto mb-6 text-muted-foreground/20" />
          <h3 className="text-2xl font-bold mb-3">Chưa có bài tập nào</h3>
          <p className="text-lg text-muted-foreground mb-8">Bắt đầu tạo bài tập đầu tiên cho bộ này</p>
          {setId && (
            <Button asChild size="lg">
              <Link to={learningPath.exerciseNew(setId)}>
                <Plus className="h-5 w-5" />
                Tạo bài tập đầu tiên
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {set.exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onEdit={() => window.location.href = learningPath.exerciseEdit(exercise.setId, exercise.id)}
              onDelete={() => {
                if (window.confirm(`Xóa bài tập "${exercise.question}"?`)) {
                  remove(exercise)
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
