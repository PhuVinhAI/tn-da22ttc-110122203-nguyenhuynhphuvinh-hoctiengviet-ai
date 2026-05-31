import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { PageHeader } from '../../components/admin/PageHeader'
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

const childConfig: Record<ChildKind, { title: string; fields: FieldConfig[] }> = {
  contents: { title: 'nội dung', fields: contentFields },
  vocabularies: { title: 'từ vựng', fields: vocabularyFields },
  grammar: { title: 'ngữ pháp', fields: grammarFields },
  'exercise-sets': { title: 'bộ bài tập', fields: exerciseSetFields },
}

export function LessonChildFormPage({ kind, mode }: { kind: ChildKind; mode: 'create' | 'edit' }) {
  const { lessonId, id } = useParams()
  const navigate = useNavigate()
  const config = childConfig[kind]
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

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: 'Học liệu', href: learningPath.courses() },
          { label: lesson?.module?.course?.title ?? 'Khóa học', href: lesson?.module?.courseId ? learningPath.course(lesson.module.courseId) : learningPath.courses() },
          { label: lesson?.module?.title ?? 'Chủ đề', href: lesson?.moduleId ? learningPath.module(lesson.moduleId) : undefined },
          { label: lesson?.title ?? 'Bài học', href: lessonId ? learningPath.lesson(lessonId) : undefined },
          { label: mode === 'edit' ? `Sửa ${config.title}` : `Thêm ${config.title}` },
        ]}
      />
      <PageHeader
        title={mode === 'edit' ? `Sửa ${config.title}` : `Thêm ${config.title}`}
        actions={<Button asChild variant="outline"><Link to={lessonId ? learningPath.lesson(lessonId) : learningPath.courses()}>Quay lại</Link></Button>}
      />
      <Card>
        <CardContent className="p-5">
          <ResourceForm fields={config.fields} initialValue={initialValue as Record<string, unknown> | undefined} onSubmit={submit} />
        </CardContent>
      </Card>
    </div>
  )
}
