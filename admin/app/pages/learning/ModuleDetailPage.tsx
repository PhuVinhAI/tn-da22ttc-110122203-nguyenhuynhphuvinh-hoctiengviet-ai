import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { Plus, Edit, BookOpen, Clock, Layers, FileText } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { PageHeader } from '../../components/admin/PageHeader'
import { LoadingState } from '../../components/admin/LoadingState'
import { ErrorState } from '../../components/admin/ErrorState'
import { EmptyState } from '../../components/admin/EmptyState'
import { useAdminModule, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import type { Lesson } from '../../features/learning/types'
import { learningPath } from './route-utils'

export function ModuleDetailPage() {
  const { moduleId } = useParams()
  const { data: module, isLoading, error, refetch } = useAdminModule(moduleId)
  const mutations = useLearningAdminMutation()

  const remove = async (lesson: Lesson) => {
    try {
      await mutations.deleteLesson.mutateAsync(lesson.id)
      toast.success('Đã xóa bài học')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa')
    }
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Học liệu', href: learningPath.courses() },
          { label: module?.course?.title ?? 'Khóa học', href: module?.courseId ? learningPath.course(module.courseId) : learningPath.courses() },
          { label: module?.title ?? 'Chủ đề' },
        ]}
      />

      {/* Module Header */}
      <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
        {/* Cover Area */}
        <div className="h-40 bg-secondary/10 flex items-center justify-center relative border-b-2 border-border">
          <Layers className="h-20 w-20 text-secondary/30" />
          {moduleId && module && (
            <Button asChild variant="secondary" size="lg" className="absolute top-6 right-6">
              <Link to={learningPath.moduleEdit(module.courseId, moduleId)}>
                <Edit className="h-5 w-5" />
                Sửa chủ đề
              </Link>
            </Button>
          )}
        </div>

        {/* Module Info */}
        <div className="p-8 space-y-6">
          <div>
            {module?.topic && (
              <Badge variant="outline" className="mb-3 text-base px-4 py-2">
                {module.topic}
              </Badge>
            )}
            <h1 className="text-4xl font-bold text-foreground mb-3">{module?.title ?? 'Chủ đề'}</h1>
            {module?.description && (
              <p className="text-lg text-muted-foreground leading-relaxed">{module.description}</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="rounded-xl border-2 border-border bg-muted/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground">Bài học</span>
              </div>
              <p className="text-3xl font-bold">{module?.lessons?.length ?? 0}</p>
            </div>
            <div className="rounded-xl border-2 border-border bg-muted/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-6 w-6 text-secondary" />
                <span className="text-sm font-semibold text-muted-foreground">Tổng thời gian</span>
              </div>
              <p className="text-3xl font-bold">
                {module?.lessons?.reduce((sum, l) => sum + (l.estimatedDuration ?? 0), 0) ?? 0} phút
              </p>
            </div>
            <div className="rounded-xl border-2 border-border bg-muted/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-6 w-6 text-accent" />
                <span className="text-sm font-semibold text-muted-foreground">Thứ tự</span>
              </div>
              <p className="text-3xl font-bold">#{module?.orderIndex ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Các bài học</h2>
          {moduleId && (
            <Button asChild size="lg">
              <Link to={learningPath.lessonNew(moduleId)}>
                <Plus className="h-5 w-5" />
                Thêm bài học
              </Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <LoadingState message="Đang tải bài học..." />
        ) : error ? (
          <ErrorState
            message={error instanceof Error ? error.message : 'Không tải được dữ liệu'}
            onRetry={() => refetch()}
          />
        ) : !module?.lessons || module.lessons.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Chưa có bài học nào"
            description="Tạo bài học đầu tiên cho chủ đề này"
            action={
              moduleId ? (
                <Button asChild size="lg">
                  <Link to={learningPath.lessonNew(moduleId)}>
                    <Plus className="h-5 w-5" />
                    Tạo bài học đầu tiên
                  </Link>
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="space-y-4">
            {module.lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="group rounded-2xl border-2 border-border bg-card p-6 transition-all hover:border-primary hover:-translate-y-1"
              >
                <div className="flex items-start gap-6">
                  {/* Order Number */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-secondary">{lesson.orderIndex}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <Link to={learningPath.lesson(lesson.id)} className="block mb-2">
                      <h3 className="text-xl font-bold text-foreground hover:text-primary transition-colors">
                        {lesson.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="secondary" className="text-sm">
                        {lesson.lessonType}
                      </Badge>
                      {lesson.estimatedDuration && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">{lesson.estimatedDuration} phút</span>
                        </div>
                      )}
                    </div>
                    {lesson.description && (
                      <p className="text-base text-muted-foreground line-clamp-2">{lesson.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button asChild variant="default" size="sm">
                      <Link to={learningPath.lesson(lesson.id)}>Mở</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={learningPath.lessonEdit(lesson.moduleId, lesson.id)}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Xóa bài học "${lesson.title}"?`)) {
                          remove(lesson)
                        }
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
