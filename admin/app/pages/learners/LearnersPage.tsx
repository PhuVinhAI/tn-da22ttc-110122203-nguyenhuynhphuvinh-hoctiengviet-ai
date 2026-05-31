import { Link } from 'react-router'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { DataTable } from '../../components/admin/DataTable'
import { PageHeader } from '../../components/admin/PageHeader'
import { useAdminLearners } from '../../features/learners/api/use-learners-admin'
import type { Learner } from '../../features/learners/types'
import { learnerPath } from './route-utils'

export function LearnersPage() {
  const { data, isLoading, error } = useAdminLearners()

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: 'Học viên' }]} />
      <PageHeader title="Học viên" description="Quản lý hồ sơ và theo dõi dữ liệu học tập theo từng học viên." />
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Không tải được dữ liệu'}</p>
          ) : (
            <DataTable
              data={data ?? []}
              empty="Chưa có học viên"
              columns={[
                {
                  key: 'name',
                  header: 'Học viên',
                  cell: (row: Learner) => (
                    <div>
                      <Link className="font-medium hover:text-primary" to={learnerPath.learner(row.id)}>
                        {row.fullName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{row.email}</p>
                    </div>
                  ),
                },
                { key: 'level', header: 'Level', cell: (row) => row.currentLevel },
                { key: 'role', header: 'Vai trò', cell: (row) => <Badge variant="outline">{row.role}</Badge> },
                { key: 'lessons', header: 'Bài đã học', cell: (row) => row.summary?.completedLessons ?? 0 },
                { key: 'exercises', header: 'Kết quả bài tập', cell: (row) => row.summary?.exerciseResults ?? 0 },
                { key: 'vocab', header: 'Từ cá nhân', cell: (row) => row.summary?.personalVocabularyCount ?? 0 },
                {
                  key: 'actions',
                  header: '',
                  className: 'text-right',
                  cell: (row) => (
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={learnerPath.learner(row.id)}>Mở</Link>
                      </Button>
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
