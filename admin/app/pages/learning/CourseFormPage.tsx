import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { PageHeader } from '../../components/admin/PageHeader'
import { ResourceForm } from '../../components/admin/ResourceForm'
import { courseFields } from '../../features/learning/types/forms'
import { useAdminCourses, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import { learningPath } from './route-utils'

export function CourseFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data = [] } = useAdminCourses()
  const course = data.find((item) => item.id === id)
  const mutations = useLearningAdminMutation()

  const submit = async (payload: Record<string, unknown>) => {
    try {
      if (mode === 'edit' && id) {
        await mutations.updateCourse.mutateAsync({ id, payload })
        toast.success('Đã cập nhật khóa học')
        navigate(learningPath.course(id))
      } else {
        await mutations.createCourse.mutateAsync(payload)
        toast.success('Đã tạo khóa học')
        navigate(learningPath.courses())
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
          { label: 'Khóa học', href: learningPath.courses() },
          { label: mode === 'edit' ? course?.title ?? 'Sửa' : 'Thêm' },
        ]}
      />
      <PageHeader
        title={mode === 'edit' ? 'Sửa khóa học' : 'Thêm khóa học'}
        actions={
          <Button asChild variant="outline">
            <Link to={id ? learningPath.course(id) : learningPath.courses()}>Quay lại</Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="p-5">
          <ResourceForm fields={courseFields} initialValue={course} onSubmit={submit} />
        </CardContent>
      </Card>
    </div>
  )
}
