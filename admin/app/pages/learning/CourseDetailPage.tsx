import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { Plus, Edit, BookOpen, Layers, Clock } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ConfirmAction } from '../../components/admin/ConfirmAction'
import { PageHeader } from '../../components/admin/PageHeader'
import { useAdminCourse, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import type { Module } from '../../features/learning/types'
import { learningPath } from './route-utils'

export function CourseDetailPage() {
  const { courseId } = useParams()
  const { data: course, isLoading, error } = useAdminCourse(courseId)
  const mutations = useLearningAdminMutation()

  const remove = async (module: Module) => {
    try {
      await mutations.deleteModule.mutateAsync(module.id)
      toast.success('Đã xóa chủ đề')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa')
    }
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Học liệu', href: learningPath.courses() },
          { label: 'Khóa học', href: learningPath.courses() },
          { label: course?.title ?? '...' },
        ]}
      />

      {/* Course Header with Cover */}
      <div className="rounded-2xl border-2 border-border bg-card overflow-hidden">
        {/* Cover Area */}
        <div className="h-48 bg-primary/10 flex items-center justify-center relative border-b-2 border-border">
          <BookOpen className="h-24 w-24 text-primary/30" />
          {courseId && (
            <Button asChild variant="secondary" size="lg" className="absolute top-6 right-6">
              <Link to={learningPath.courseEdit(courseId)}>
                <Edit className="h-5 w-5" />
                Sửa khóa học
              </Link>
            </Button>
          )}
        </div>

        {/* Course Info */}
        <div className="p-8 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="secondary" className="text-base font-semibold px-4 py-2">
                {course?.level}
              </Badge>
              <Badge variant={course?.isPublished ? 'default' : 'outline'} className="text-base font-semibold px-4 py-2">
                {course?.isPublished ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-3">{course?.title ?? 'Khóa học'}</h1>
            {course?.description && (
              <p className="text-lg text-muted-foreground leading-relaxed">{course.description}</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="rounded-xl border-2 border-border bg-muted/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Layers className="h-6 w-6 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground">Chủ đề</span>
              </div>
              <p className="text-3xl font-bold">{course?.modules?.length ?? 0}</p>
            </div>
            <div className="rounded-xl border-2 border-border bg-muted/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-6 w-6 text-secondary" />
                <span className="text-sm font-semibold text-muted-foreground">Bài học</span>
              </div>
              <p className="text-3xl font-bold">
                {course?.modules?.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0) ?? 0}
              </p>
            </div>
            <div className="rounded-xl border-2 border-border bg-muted/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-6 w-6 text-accent" />
                <span className="text-sm font-semibold text-muted-foreground">Thứ tự</span>
              </div>
              <p className="text-3xl font-bold">#{course?.orderIndex ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Các chủ đề</h2>
          {courseId && (
            <Button asChild size="lg">
              <Link to={learningPath.moduleNew(courseId)}>
                <Plus className="h-5 w-5" />
                Thêm chủ đề
              </Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-lg text-muted-foreground">Đang tải...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border-2 border-destructive bg-destructive/10 p-8 text-center">
            <p className="text-lg text-destructive font-semibold">{error instanceof Error ? error.message : 'Không tải được dữ liệu'}</p>
          </div>
        ) : !course?.modules || course.modules.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-20 text-center">
            <Layers className="h-24 w-24 mx-auto mb-6 text-muted-foreground/20" />
            <h3 className="text-2xl font-bold mb-3">Chưa có chủ đề nào</h3>
            <p className="text-lg text-muted-foreground mb-8">Tạo chủ đề đầu tiên cho khóa học này</p>
            {courseId && (
              <Button asChild size="lg">
                <Link to={learningPath.moduleNew(courseId)}>
                  <Plus className="h-5 w-5" />
                  Tạo chủ đề đầu tiên
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {course.modules.map((module, index) => (
              <div
                key={module.id}
                className="group rounded-2xl border-2 border-border bg-card p-6 transition-all hover:border-primary hover:-translate-y-1"
              >
                <div className="flex items-start gap-6">
                  {/* Order Number */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{module.orderIndex}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <Link to={learningPath.module(module.id)} className="block mb-2">
                      <h3 className="text-xl font-bold text-foreground hover:text-primary transition-colors">
                        {module.title}
                      </h3>
                    </Link>
                    {module.topic && (
                      <Badge variant="outline" className="mb-3">
                        {module.topic}
                      </Badge>
                    )}
                    {module.description && (
                      <p className="text-base text-muted-foreground line-clamp-2">{module.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span className="font-medium">{module.lessons?.length ?? 0} bài học</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button asChild variant="default" size="sm">
                      <Link to={learningPath.module(module.id)}>Mở</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={learningPath.moduleEdit(module.courseId, module.id)}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <ConfirmAction
                      title="Xóa chủ đề"
                      description={`Chủ đề "${module.title}" và bài học liên quan sẽ bị xóa.`}
                      onConfirm={() => remove(module)}
                    />
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
