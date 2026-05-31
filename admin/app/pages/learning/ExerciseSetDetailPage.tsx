import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ConfirmAction } from '../../components/admin/ConfirmAction'
import { DataTable } from '../../components/admin/DataTable'
import { PageHeader } from '../../components/admin/PageHeader'
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
    <div className="space-y-5">
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
        actions={setId ? <Button asChild><Link to={learningPath.exerciseNew(setId)}>Thêm bài tập</Link></Button> : null}
      />
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Không tải được dữ liệu'}</p>
          ) : (
            <DataTable
              data={set?.exercises ?? []}
              empty="Chưa có bài tập"
              columns={[
                { key: 'question', header: 'Câu hỏi', cell: (exercise) => exercise.question },
                { key: 'type', header: 'Kiểu', cell: (exercise) => exercise.exerciseType },
                { key: 'difficulty', header: 'Độ khó', cell: (exercise) => exercise.difficultyLevel },
                { key: 'order', header: 'Thứ tự', cell: (exercise) => exercise.orderIndex },
                {
                  key: 'actions',
                  header: '',
                  className: 'text-right',
                  cell: (exercise) => (
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="sm"><Link to={learningPath.exerciseEdit(exercise.setId, exercise.id)}>Sửa</Link></Button>
                      <ConfirmAction
                        title="Xóa bài tập"
                        description="Bài tập này sẽ bị xóa khỏi bộ bài tập."
                        onConfirm={() => remove(exercise)}
                      />
                    </div>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
