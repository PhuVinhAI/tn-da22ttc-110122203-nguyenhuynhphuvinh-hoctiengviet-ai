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
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Học liệu', href: learningPath.courses() },
          { label: 'Khóa học', href: learningPath.courses() },
          { label: mode === 'edit' ? course?.title ?? 'Sửa' : 'Thêm' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon-lg">
            <Link to={id ? learningPath.course(id) : learningPath.courses()}>
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold">{mode === 'edit' ? 'Sửa khóa học' : 'Tạo khóa học mới'}</h1>
            <p className="text-lg text-muted-foreground mt-2">
              {mode === 'edit' ? 'Cập nhật thông tin khóa học' : 'Điền thông tin để tạo khóa học mới'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="lg">
            <Link to={id ? learningPath.course(id) : learningPath.courses()}>Hủy</Link>
          </Button>
          <Button type="submit" form="course-form" size="lg">
            <Save className="h-5 w-5" />
            {mode === 'edit' ? 'Cập nhật' : 'Tạo khóa học'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <div className="rounded-2xl border-2 border-border bg-card p-8">
          <ResourceForm id="course-form" fields={courseFields} initialValue={course} onSubmit={submit} />
        </div>
      </div>
    </div>
  )
}
