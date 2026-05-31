import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ConfirmAction } from '../../components/admin/ConfirmAction'
import { DataTable } from '../../components/admin/DataTable'
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
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: 'Học liệu' }, { label: 'Khóa học' }]} />
      <PageHeader
        title="Khóa học"
        description="Đi vào từng khóa học để quản lý chủ đề, bài học và toàn bộ học liệu liên quan."
        actions={
          <Button asChild>
            <Link to={learningPath.courseNew()}>Thêm khóa học</Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Không tải được dữ liệu'}</p>
          ) : (
            <DataTable
              data={data}
              empty="Chưa có khóa học"
              columns={[
                {
                  key: 'title',
                  header: 'Tên',
                  cell: (course) => (
                    <button className="text-left font-medium hover:text-primary" onClick={() => navigate(learningPath.course(course.id))}>
                      {course.title}
                    </button>
                  ),
                },
                { key: 'level', header: 'Cấp độ', cell: (course) => <Badge variant="secondary">{course.level}</Badge> },
                { key: 'modules', header: 'Chủ đề', cell: (course) => course.modules?.length ?? 0 },
                { key: 'order', header: 'Thứ tự', cell: (course) => course.orderIndex },
                { key: 'published', header: 'Published', cell: (course) => (course.isPublished ? 'Có' : 'Không') },
                {
                  key: 'actions',
                  header: '',
                  className: 'text-right',
                  cell: (course) => (
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={learningPath.course(course.id)}>Mở</Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link to={learningPath.courseEdit(course.id)}>Sửa</Link>
                      </Button>
                      <ConfirmAction
                        title="Xóa khóa học"
                        description={`Khóa học "${course.title}" và dữ liệu con liên quan sẽ bị xóa.`}
                        onConfirm={() => remove(course)}
                      />
                    </div>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
