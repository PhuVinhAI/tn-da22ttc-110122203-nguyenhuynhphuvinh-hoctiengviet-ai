import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { PageHeader } from '../../components/admin/PageHeader'
import { ResourceForm } from '../../components/admin/ResourceForm'
import { lessonFields } from '../../features/learning/types/forms'
import { useAdminLesson, useAdminModule, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import { learningPath } from './route-utils'

export function LessonFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { moduleId, id } = useParams()
  const navigate = useNavigate()
  const { data: lesson } = useAdminLesson(id)
  const parentModuleId = moduleId ?? lesson?.moduleId
  const { data: module } = useAdminModule(parentModuleId)
  const mutations = useLearningAdminMutation()

  const submit = async (payload: Record<string, unknown>) => {
    try {
      if (mode === 'edit' && id) {
        await mutations.updateLesson.mutateAsync({ id, payload })
        toast.success('Đã cập nhật bài học')
        navigate(learningPath.lesson(id))
      } else if (moduleId) {
        await mutations.createLesson.mutateAsync({ moduleId, payload })
        toast.success('Đã tạo bài học')
        navigate(learningPath.module(moduleId))
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu')
    }
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: 'Học liệu', href: learningPath.courses() },
          { label: module?.course?.title ?? 'Khóa học', href: module?.courseId ? learningPath.course(module.courseId) : learningPath.courses() },
          { label: module?.title ?? 'Chủ đề', href: parentModuleId ? learningPath.module(parentModuleId) : undefined },
          { label: mode === 'edit' ? lesson?.title ?? 'Sửa bài học' : 'Thêm bài học' },
        ]}
      />
      <PageHeader
        title={mode === 'edit' ? 'Sửa bài học' : 'Thêm bài học'}
        actions={<Button asChild variant="outline"><Link to={parentModuleId ? learningPath.module(parentModuleId) : learningPath.courses()}>Quay lại</Link></Button>}
      />
      <Card>
        <CardContent className="p-5">
          <ResourceForm fields={lessonFields} initialValue={lesson} onSubmit={submit} />
        </CardContent>
      </Card>
    </div>
  )
}
