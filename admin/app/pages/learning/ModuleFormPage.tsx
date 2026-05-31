import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { PageHeader } from '../../components/admin/PageHeader'
import { ResourceForm } from '../../components/admin/ResourceForm'
import { moduleFields } from '../../features/learning/types/forms'
import { useAdminCourse, useAdminModule, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import { learningPath } from './route-utils'

export function ModuleFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { courseId, id } = useParams()
  const navigate = useNavigate()
  const { data: module } = useAdminModule(id)
  const parentCourseId = courseId ?? module?.courseId
  const { data: course } = useAdminCourse(parentCourseId)
  const mutations = useLearningAdminMutation()

  const submit = async (payload: Record<string, unknown>) => {
    try {
      if (mode === 'edit' && id) {
        await mutations.updateModule.mutateAsync({ id, payload })
        toast.success('Đã cập nhật chủ đề')
        navigate(learningPath.module(id))
      } else if (courseId) {
        await mutations.createModule.mutateAsync({ courseId, payload })
        toast.success('Đã tạo chủ đề')
        navigate(learningPath.course(courseId))
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
          { label: course?.title ?? 'Khóa học', href: parentCourseId ? learningPath.course(parentCourseId) : learningPath.courses() },
          { label: mode === 'edit' ? module?.title ?? 'Sửa chủ đề' : 'Thêm chủ đề' },
        ]}
      />
      <PageHeader
        title={mode === 'edit' ? 'Sửa chủ đề' : 'Thêm chủ đề'}
        actions={<Button asChild variant="outline"><Link to={parentCourseId ? learningPath.course(parentCourseId) : learningPath.courses()}>Quay lại</Link></Button>}
      />
      <Card>
        <CardContent className="p-5">
          <ResourceForm fields={moduleFields} initialValue={module} onSubmit={submit} />
        </CardContent>
      </Card>
    </div>
  )
}
