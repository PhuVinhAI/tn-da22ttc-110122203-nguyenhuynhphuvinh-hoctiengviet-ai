import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
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

  const backPath = parentCourseId ? learningPath.course(parentCourseId) : learningPath.courses()

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Học liệu', href: learningPath.courses() },
          { label: course?.title ?? 'Khóa học', href: parentCourseId ? learningPath.course(parentCourseId) : learningPath.courses() },
          { label: mode === 'edit' ? module?.title ?? 'Sửa chủ đề' : 'Thêm chủ đề' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon-lg">
            <Link to={backPath}>
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold">{mode === 'edit' ? 'Sửa chủ đề' : 'Tạo chủ đề mới'}</h1>
            <p className="text-lg text-muted-foreground mt-2">
              {mode === 'edit' ? 'Cập nhật thông tin chủ đề' : 'Điền thông tin để tạo chủ đề mới'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="lg">
            <Link to={backPath}>Hủy</Link>
          </Button>
          <Button type="submit" form="module-form" size="lg">
            <Save className="h-5 w-5" />
            {mode === 'edit' ? 'Cập nhật' : 'Tạo chủ đề'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <div className="rounded-2xl border-2 border-border bg-card p-8">
          <ResourceForm id="module-form" fields={moduleFields} initialValue={module} onSubmit={submit} />
        </div>
      </div>
    </div>
  )
}
