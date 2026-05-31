import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ConfirmAction } from '../../components/admin/ConfirmAction'
import { DataTable } from '../../components/admin/DataTable'
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
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: 'Học liệu', href: learningPath.courses() },
          { label: 'Khóa học', href: learningPath.courses() },
          { label: course?.title ?? '...' },
        ]}
      />
      <PageHeader
        title={course?.title ?? 'Khóa học'}
        description={course?.description}
        actions={
          courseId ? (
            <>
              <Button asChild variant="outline">
                <Link to={learningPath.courseEdit(courseId)}>Sửa khóa học</Link>
              </Button>
              <Button asChild>
                <Link to={learningPath.moduleNew(courseId)}>Thêm chủ đề</Link>
              </Button>
            </>
          ) : null
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
              data={course?.modules ?? []}
              empty="Chưa có chủ đề"
              columns={[
                { key: 'title', header: 'Chủ đề', cell: (module) => <Link className="font-medium hover:text-primary" to={learningPath.module(module.id)}>{module.title}</Link> },
                { key: 'topic', header: 'Topic', cell: (module) => module.topic ?? '-' },
                { key: 'lessons', header: 'Bài học', cell: (module) => module.lessons?.length ?? 0 },
                { key: 'order', header: 'Thứ tự', cell: (module) => module.orderIndex },
                {
                  key: 'actions',
                  header: '',
                  className: 'text-right',
                  cell: (module) => (
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm"><Link to={learningPath.module(module.id)}>Mở</Link></Button>
                      <Button asChild variant="ghost" size="sm"><Link to={learningPath.moduleEdit(module.courseId, module.id)}>Sửa</Link></Button>
                      <ConfirmAction
                        title="Xóa chủ đề"
                        description={`Chủ đề "${module.title}" và bài học liên quan sẽ bị xóa.`}
                        onConfirm={() => remove(module)}
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
