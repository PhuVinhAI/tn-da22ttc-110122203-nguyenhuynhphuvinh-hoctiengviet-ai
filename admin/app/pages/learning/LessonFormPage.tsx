import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
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

  const backPath = parentModuleId ? learningPath.module(parentModuleId) : learningPath.courses()

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Học liệu', href: learningPath.courses() },
          { label: module?.course?.title ?? 'Khóa học', href: module?.courseId ? learningPath.course(module.courseId) : learningPath.courses() },
          { label: module?.title ?? 'Chủ đề', href: parentModuleId ? learningPath.module(parentModuleId) : undefined },
          { label: mode === 'edit' ? lesson?.title ?? 'Sửa bài học' : 'Thêm bài học' },
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
            <h1 className="text-4xl font-bold">{mode === 'edit' ? 'Sửa bài học' : 'Tạo bài học mới'}</h1>
            <p className="text-lg text-muted-foreground mt-2">
              {mode === 'edit' ? 'Cập nhật thông tin bài học' : 'Điền thông tin để tạo bài học mới'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="lg">
            <Link to={backPath}>Hủy</Link>
          </Button>
          <Button type="submit" form="lesson-form" size="lg">
            <Save className="h-5 w-5" />
            {mode === 'edit' ? 'Cập nhật' : 'Tạo bài học'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <div className="rounded-2xl border-2 border-border bg-card p-8">
          <ResourceForm id="lesson-form" fields={lessonFields} initialValue={lesson} onSubmit={submit} />
        </div>
      </div>
    </div>
  )
}
