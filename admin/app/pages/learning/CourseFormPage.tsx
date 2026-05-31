import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
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
  const backTo = id ? learningPath.course(id) : learningPath.courses()

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
    <div className="max-w-3xl space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Học liệu', href: learningPath.courses() },
          { label: 'Khóa học', href: learningPath.courses() },
          { label: mode === 'edit' ? course?.title ?? 'Sửa' : 'Thêm' },
        ]}
      />

      {/* Compact header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-10 w-10 mt-0.5">
          <Link to={backTo}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {mode === 'edit' ? 'Sửa khóa học' : 'Tạo khóa học mới'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {mode === 'edit' ? 'Cập nhật thông tin khóa học' : 'Điền thông tin để tạo khóa học mới'}
          </p>
        </div>
      </div>

      {/* Inline form, no card wrapper */}
      <ResourceForm
        id="course-form"
        fields={courseFields}
        initialValue={course}
        onSubmit={submit}
        hideSubmit
      />

      {/* Bottom actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t-2 border-border">
        <Button asChild variant="ghost">
          <Link to={backTo}>Hủy</Link>
        </Button>
        <Button type="submit" form="course-form">
          <Save className="h-4 w-4" />
          {mode === 'edit' ? 'Cập nhật' : 'Tạo khóa học'}
        </Button>
      </div>
    </div>
  )
}
