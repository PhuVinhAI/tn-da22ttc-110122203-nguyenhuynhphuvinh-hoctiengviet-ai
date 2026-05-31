import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { PageHeader } from '../../components/admin/PageHeader'
import { ResourceForm } from '../../components/admin/ResourceForm'
import { exerciseFields } from '../../features/learning/types/forms'
import { useAdminExerciseSet, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import { learningPath } from './route-utils'

export function ExerciseFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { setId, id } = useParams()
  const navigate = useNavigate()
  const { data: set } = useAdminExerciseSet(setId)
  const exercise = set?.exercises?.find((item) => item.id === id)
  const mutations = useLearningAdminMutation()

  const submit = async (payload: Record<string, unknown>) => {
    try {
      if (mode === 'edit' && id) {
        await mutations.updateExercise.mutateAsync({ id, payload })
        toast.success('Đã cập nhật bài tập')
      } else if (setId) {
        await mutations.createExercise.mutateAsync({ setId, payload })
        toast.success('Đã tạo bài tập')
      }
      if (setId) navigate(learningPath.exerciseSet(setId))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu')
    }
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: 'Học liệu', href: learningPath.courses() },
          { label: set?.lesson?.title ?? 'Bài học', href: set?.lessonId ? learningPath.lesson(set.lessonId) : undefined },
          { label: set?.title ?? 'Bộ bài tập', href: setId ? learningPath.exerciseSet(setId) : undefined },
          { label: mode === 'edit' ? 'Sửa bài tập' : 'Thêm bài tập' },
        ]}
      />
      <PageHeader
        title={mode === 'edit' ? 'Sửa bài tập' : 'Thêm bài tập'}
        actions={<Button asChild variant="outline"><Link to={setId ? learningPath.exerciseSet(setId) : learningPath.courses()}>Quay lại</Link></Button>}
      />
      <Card>
        <CardContent className="p-5">
          <ResourceForm fields={exerciseFields} initialValue={exercise as Record<string, unknown> | undefined} onSubmit={submit} />
        </CardContent>
      </Card>
    </div>
  )
}
