import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ExerciseForm } from '../../components/admin/forms/ExerciseForm'
import { useAdminLesson, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import { learningPath } from './route-utils'

export function ExerciseFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { lessonId, id } = useParams()
  const navigate = useNavigate()
  const { data: lesson } = useAdminLesson(lessonId)
  const mutations = useLearningAdminMutation()

  const initialValue = lesson?.exercises?.find((item) => item.id === id)

  const submit = async (payload: Record<string, unknown>) => {
    try {
      if (mode === 'edit' && id) {
        await mutations.updateLessonChild.mutateAsync({ kind: 'exercises', id, payload })
        toast.success('Đã cập nhật')
      } else if (lessonId) {
        const nextOrderIndex =
          (lesson?.exercises ?? []).reduce(
            (max, s) => Math.max(max, s.orderIndex ?? -1),
            -1,
          ) + 1
        const created = (await mutations.createLessonChild.mutateAsync({
          kind: 'exercises',
          lessonId,
          payload: { ...payload, orderIndex: nextOrderIndex },
        })) as { id?: string } | undefined
        toast.success('Đã tạo mới')
        // Bước 2.1 xong → vào thẳng Bước 2.2 (chọn loại câu hỏi)
        if (created?.id) {
          navigate(learningPath.exercise(created.id))
          return
        }
      }
      if (lessonId) navigate(learningPath.lessonStageExercises(lessonId))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu')
    }
  }

  const backPath = lessonId ? learningPath.lessonStageExercises(lessonId) : learningPath.courses()
  const titleAction = mode === 'edit' ? 'Sửa' : 'Tạo mới'

  const handleSubmit = (values: unknown) => submit(values as Record<string, unknown>)

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: lesson?.module?.course?.title ?? 'Khóa học', href: lesson?.module?.courseId ? learningPath.course(lesson.module.courseId) : learningPath.courses() },
          { label: lesson?.module?.title ?? 'Chủ đề', href: lesson?.moduleId ? learningPath.module(lesson.moduleId) : undefined },
          { label: lesson?.title ?? 'Bài học', href: lessonId ? learningPath.lesson(lessonId) : undefined },
          { label: 'Giai đoạn 2', href: lessonId ? learningPath.lessonStageExercises(lessonId) : undefined },
          { label: `${titleAction} bài tập` },
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
              {titleAction} bài tập
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {lesson?.title ? `Trong bài học "${lesson.title}"` : 'Điền thông tin để tiếp tục'}
            </p>
          </div>
        </div>

        {mode === 'edit' && !initialValue ? (
          <div className="rounded-xl border-2 border-border bg-card p-12 text-center text-sm text-muted-foreground">
            Đang tải bài tập...
          </div>
        ) : (
          <ExerciseForm
            id="exercise-form"
            initialValue={initialValue as never}
            onSubmit={handleSubmit}
          />
        )}

        <div className="flex items-center justify-end gap-2 pt-4 border-t-2 border-border">
          <Button asChild variant="ghost">
            <Link to={backPath}>Hủy</Link>
          </Button>
          <Button type="submit" form="exercise-form">
            <Save className="h-4 w-4" />
            {mode === 'edit' ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </div>
    </div>
  )
}
