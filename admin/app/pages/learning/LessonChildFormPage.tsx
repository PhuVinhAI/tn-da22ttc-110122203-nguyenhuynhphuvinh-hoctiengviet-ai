import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Save, FileText, BookMarked, Lightbulb, ClipboardList } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ResourceForm } from '../../components/admin/ResourceForm'
import {
  contentFields,
  exerciseSetFields,
  grammarFields,
  vocabularyFields,
  type FieldConfig,
} from '../../features/learning/types/forms'
import { useAdminLesson, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import { learningPath } from './route-utils'

type ChildKind = 'contents' | 'vocabularies' | 'grammar' | 'exercise-sets'

const childConfig: Record<ChildKind, { title: string; fields: FieldConfig[]; icon: any }> = {
  contents: { title: 'nội dung', fields: contentFields, icon: FileText },
  vocabularies: { title: 'từ vựng', fields: vocabularyFields, icon: BookMarked },
  grammar: { title: 'ngữ pháp', fields: grammarFields, icon: Lightbulb },
  'exercise-sets': { title: 'bộ bài tập', fields: exerciseSetFields, icon: ClipboardList },
}

export function LessonChildFormPage({ kind, mode }: { kind: ChildKind; mode: 'create' | 'edit' }) {
  const { lessonId, id } = useParams()
  const navigate = useNavigate()
  const config = childConfig[kind]
  const Icon = config.icon
  const { data: lesson } = useAdminLesson(lessonId)
  const mutations = useLearningAdminMutation()

  const initialValue =
    kind === 'contents'
      ? lesson?.contents?.find((item) => item.id === id)
      : kind === 'vocabularies'
        ? lesson?.vocabularies?.find((item) => item.id === id)
        : kind === 'grammar'
          ? lesson?.grammarRules?.find((item) => item.id === id)
          : lesson?.exerciseSets?.find((item) => item.id === id)

  const submit = async (payload: Record<string, unknown>) => {
    try {
      if (mode === 'edit' && id) {
        await mutations.updateLessonChild.mutateAsync({ kind, id, payload })
        toast.success('Đã cập nhật')
      } else if (lessonId) {
        await mutations.createLessonChild.mutateAsync({ kind, lessonId, payload })
        toast.success('Đã tạo mới')
      }
      if (lessonId) navigate(learningPath.lesson(lessonId))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu')
    }
  }

  const backPath = lessonId ? learningPath.lesson(lessonId) : learningPath.courses()

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Học liệu', href: learningPath.courses() },
          { label: lesson?.module?.course?.title ?? 'Khóa học', href: lesson?.module?.courseId ? learningPath.course(lesson.module.courseId) : learningPath.courses() },
          { label: lesson?.module?.title ?? 'Chủ đề', href: lesson?.moduleId ? learningPath.module(lesson.moduleId) : undefined },
          { label: lesson?.title ?? 'Bài học', href: lessonId ? learningPath.lesson(lessonId) : undefined },
          { label: mode === 'edit' ? `Sửa ${config.title}` : `Thêm ${config.title}` },
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
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold capitalize">
                {mode === 'edit' ? `Sửa ${config.title}` : `Thêm ${config.title}`}
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                {lesson?.title ?? 'Bài học'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="lg">
            <Link to={backPath}>Hủy</Link>
          </Button>
          <Button type="submit" form="child-form" size="lg">
            <Save className="h-5 w-5" />
            {mode === 'edit' ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <div className="rounded-2xl border-2 border-border bg-card p-8">
          <ResourceForm
            id="child-form"
            fields={config.fields}
            initialValue={initialValue as Record<string, unknown> | undefined}
            onSubmit={submit}
          />
        </div>
      </div>
    </div>
  )
}
