import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Save, Eye, Edit } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ResourceForm } from '../../components/admin/ResourceForm'
import { ExercisePreview } from '../../components/learning/ExercisePreview'
import { exerciseFields } from '../../features/learning/types/forms'
import { useAdminExerciseSet, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import { learningPath } from './route-utils'

export function ExerciseFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { setId, id } = useParams()
  const navigate = useNavigate()
  const { data: set } = useAdminExerciseSet(setId)
  const exercise = set?.exercises?.find((item) => item.id === id)
  const mutations = useLearningAdminMutation()

  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')

  // State for live preview
  const [previewData, setPreviewData] = useState({
    exerciseType: exercise?.exerciseType || 'MULTIPLE_CHOICE',
    question: exercise?.question || '',
    options: exercise?.options || [],
    correctAnswer: exercise?.correctAnswer || '',
    difficultyLevel: exercise?.difficultyLevel || 'BEGINNER',
  })

  const submit = async (payload: Record<string, unknown>) => {
    try {
      if (mode === 'edit' && id) {
        await mutations.updateExercise.mutateAsync({ id, payload })
        toast.success('Đã cập nhật bài tập')
      } else if (setId) {
        await mutations.createExercise.mutateAsync({ setId, payload })
        toast.success('Đã tạo bài tập')
      }
      if (setId) navigate(learningPath.exerciseSet(setId))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 border-b-2 border-border bg-card">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="icon-lg">
                <Link to={setId ? learningPath.exerciseSet(setId) : learningPath.courses()}>
                  <ArrowLeft className="h-6 w-6" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {mode === 'edit' ? 'Sửa bài tập' : 'Tạo bài tập mới'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {set?.title ?? 'Bộ bài tập'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Toggle View/Edit */}
              <div className="flex items-center gap-1 rounded-xl border-2 border-border bg-muted/30 p-1">
                <Button
                  variant={viewMode === 'edit' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('edit')}
                >
                  <Edit className="h-4 w-4" />
                  Chỉnh sửa
                </Button>
                <Button
                  variant={viewMode === 'preview' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('preview')}
                >
                  <Eye className="h-4 w-4" />
                  Xem trước
                </Button>
              </div>

              <Button asChild variant="outline" size="lg">
                <Link to={setId ? learningPath.exerciseSet(setId) : learningPath.courses()}>
                  Hủy
                </Link>
              </Button>
              <Button type="submit" form="exercise-form" size="lg">
                <Save className="h-5 w-5" />
                Lưu bài tập
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="container mx-auto px-8 py-6">
        <Breadcrumbs
          items={[
            { label: 'Học liệu', href: learningPath.courses() },
            { label: set?.lesson?.title ?? 'Bài học', href: set?.lessonId ? learningPath.lesson(set.lessonId) : undefined },
            { label: set?.title ?? 'Bộ bài tập', href: setId ? learningPath.exerciseSet(setId) : undefined },
            { label: mode === 'edit' ? 'Sửa bài tập' : 'Thêm bài tập' },
          ]}
        />
      </div>

      {/* Content */}
      <div className="container mx-auto px-8 pb-12">
        {viewMode === 'edit' ? (
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl border-2 border-border bg-card p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Thông tin bài tập</h2>
                <p className="text-base text-muted-foreground">
                  Điền đầy đủ thông tin để tạo bài tập chất lượng
                </p>
              </div>
              <ResourceForm
                id="exercise-form"
                fields={exerciseFields}
                initialValue={exercise as Record<string, unknown> | undefined}
                onSubmit={submit}
                onChange={(data) => {
                  // Update preview in real-time
                  setPreviewData({
                    exerciseType: data.exerciseType as string || 'MULTIPLE_CHOICE',
                    question: data.question as string || '',
                    options: data.options as string[] || [],
                    correctAnswer: data.correctAnswer as string || '',
                    difficultyLevel: data.difficultyLevel as string || 'BEGINNER',
                  })
                }}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <ExercisePreview {...previewData} />
          </div>
        )}
      </div>
    </div>
  )
}
