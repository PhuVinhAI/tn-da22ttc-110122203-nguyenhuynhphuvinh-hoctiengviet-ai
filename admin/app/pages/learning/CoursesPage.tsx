import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Plus, BookOpen, Layers, Eye } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ConfirmAction } from '../../components/admin/ConfirmAction'
import { PageHeader } from '../../components/admin/PageHeader'
import { useAdminCourses, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import type { Course } from '../../features/learning/types'
import { learningPath } from './route-utils'

export function CoursesPage() {
  const navigate = useNavigate()
  const { data = [], isLoading, error } = useAdminCourses()
  const mutations = useLearningAdminMutation()

  const remove = async (course: Course) => {
    try {
      await mutations.deleteCourse.mutateAsync(course.id)
      toast.success('Đã xóa khóa học')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa')
    }
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'Học liệu' }, { label: 'Khóa học' }]} />

      <PageHeader
        title="Khóa học"
        description="Đi vào từng khóa học để quản lý chủ đề, bài học và toàn bộ học liệu liên quan."
        actions={
          <Button asChild size="lg">
            <Link to={learningPath.courseNew()}>
              <Plus className="h-5 w-5" />
              Thêm khóa học
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-center py-20">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-lg text-muted-foreground">Đang tải...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border-2 border-destructive bg-destructive/10 p-8 text-center">
          <p className="text-lg text-destructive font-semibold">{error instanceof Error ? error.message : 'Không tải được dữ liệu'}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-20 text-center">
          <BookOpen className="h-24 w-24 mx-auto mb-6 text-muted-foreground/20" />
          <h3 className="text-2xl font-bold mb-3">Chưa có khóa học nào</h3>
          <p className="text-lg text-muted-foreground mb-8">Tạo khóa học đầu tiên để bắt đầu</p>
          <Button asChild size="lg">
            <Link to={learningPath.courseNew()}>
              <Plus className="h-5 w-5" />
              Tạo khóa học đầu tiên
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((course) => (
            <div
              key={course.id}
              className="group rounded-2xl border-2 border-border bg-card overflow-hidden transition-all hover:border-primary hover:-translate-y-2"
            >
              {/* Cover Image Area */}
              <div className="h-40 bg-primary/10 flex items-center justify-center border-b-2 border-border">
                <BookOpen className="h-16 w-16 text-primary/40" />
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Title & Level */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <Badge variant="secondary" className="text-sm font-semibold">
                    {course.level}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    <span className="font-medium">{course.modules?.length ?? 0} chủ đề</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span className="font-medium">{course.isPublished ? 'Public' : 'Draft'}</span>
                  </div>
                </div>

                {/* Order Index */}
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold">Thứ tự:</span> #{course.orderIndex}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button asChild variant="default" size="sm" className="flex-1">
                    <Link to={learningPath.course(course.id)}>
                      <Eye className="h-4 w-4" />
                      Mở
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to={learningPath.courseEdit(course.id)}>Sửa</Link>
                  </Button>
                  <ConfirmAction
                    title="Xóa khóa học"
                    description={`Khóa học "${course.title}" và dữ liệu con liên quan sẽ bị xóa.`}
                    onConfirm={() => remove(course)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
