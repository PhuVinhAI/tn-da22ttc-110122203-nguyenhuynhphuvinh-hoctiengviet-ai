import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { ConfirmAction } from '../../components/admin/ConfirmAction'
import { DataTable } from '../../components/admin/DataTable'
import { PageHeader } from '../../components/admin/PageHeader'
import { useAdminModule, useLearningAdminMutation } from '../../features/learning/api/use-learning-admin'
import type { Lesson } from '../../features/learning/types'
import { learningPath } from './route-utils'

export function ModuleDetailPage() {
  const { moduleId } = useParams()
  const { data: module, isLoading, error } = useAdminModule(moduleId)
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
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: 'Học liệu', href: learningPath.courses() },
          { label: module?.course?.title ?? 'Khóa học', href: module?.courseId ? learningPath.course(module.courseId) : learningPath.courses() },
          { label: module?.title ?? 'Chủ đề' },
        ]}
      />
      <PageHeader
        title={module?.title ?? 'Chủ đề'}
        description={module?.description}
        actions={
          moduleId ? (
            <>
              <Button asChild variant="outline"><Link to={learningPath.moduleEdit(module?.courseId ?? '', moduleId)}>Sửa chủ đề</Link></Button>
              <Button asChild><Link to={learningPath.lessonNew(moduleId)}>Thêm bài học</Link></Button>
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
              data={module?.lessons ?? []}
              empty="Chưa có bài học"
              columns={[
                { key: 'title', header: 'Bài học', cell: (lesson) => <Link className="font-medium hover:text-primary" to={learningPath.lesson(lesson.id)}>{lesson.title}</Link> },
                { key: 'type', header: 'Kiểu', cell: (lesson) => lesson.lessonType },
                { key: 'duration', header: 'Phút', cell: (lesson) => lesson.estimatedDuration ?? '-' },
                { key: 'order', header: 'Thứ tự', cell: (lesson) => lesson.orderIndex },
                {
                  key: 'actions',
                  header: '',
                  className: 'text-right',
                  cell: (lesson) => (
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm"><Link to={learningPath.lesson(lesson.id)}>Mở</Link></Button>
                      <Button asChild variant="ghost" size="sm"><Link to={learningPath.lessonEdit(lesson.moduleId, lesson.id)}>Sửa</Link></Button>
                      <ConfirmAction
                        title="Xóa bài học"
                        description={`Bài học "${lesson.title}" và học liệu liên quan sẽ bị xóa.`}
                        onConfirm={() => remove(lesson)}
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
