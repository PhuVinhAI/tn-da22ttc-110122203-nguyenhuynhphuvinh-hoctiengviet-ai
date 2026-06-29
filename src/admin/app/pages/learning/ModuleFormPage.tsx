import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ModuleForm } from '../../components/admin/forms/ModuleForm'
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
        const nextOrderIndex =
          (course?.modules ?? []).reduce(
            (max, m) => Math.max(max, m.orderIndex ?? -1),
            -1,
          ) + 1
        await mutations.createModule.mutateAsync({
          courseId,
          payload: { ...payload, orderIndex: nextOrderIndex },
        })
        toast.success('Đã tạo chủ đề')
        navigate(learningPath.course(courseId))
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu')
    }
  }

  const backPath = parentCourseId ? learningPath.course(parentCourseId) : learningPath.courses()

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: course?.title ?? 'Khóa học', href: parentCourseId ? learningPath.course(parentCourseId) : learningPath.courses() },
          { label: mode === 'edit' ? module?.title ?? 'Sửa chủ đề' : 'Thêm chủ đề' },
        ]}
      />

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-10 w-10 mt-0.5">
            <Link to={backPath}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === 'edit' ? 'Sửa chủ đề' : 'Tạo chủ đề mới'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {mode === 'edit' ? 'Cập nhật thông tin chủ đề' : 'Điền thông tin để tạo chủ đề mới'}
            </p>
          </div>
        </div>

        {mode === 'edit' && !module ? (
          <div className="rounded-xl border-2 border-border bg-card p-12 text-center text-sm text-muted-foreground">
            Đang tải chủ đề...
          </div>
        ) : (
          <ModuleForm
            id="module-form"
            initialValue={module}
            onSubmit={(values) => submit(values as unknown as Record<string, unknown>)}
          />
        )}

        <div className="flex items-center justify-end gap-2 pt-4 border-t-2 border-border">
          <Button asChild variant="ghost">
            <Link to={backPath}>Hủy</Link>
          </Button>
          <Button type="submit" form="module-form">
            <Save className="h-4 w-4" />
            {mode === 'edit' ? 'Cập nhật' : 'Tạo chủ đề'}
          </Button>
        </div>
      </div>
    </div>
  )
}
