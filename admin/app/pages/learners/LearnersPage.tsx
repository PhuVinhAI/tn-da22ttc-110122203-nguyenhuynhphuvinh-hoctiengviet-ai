import { Link } from 'react-router'
import { Search, User as UserIcon } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Breadcrumbs } from '../../components/admin/Breadcrumbs'
import { DataTable } from '../../components/admin/DataTable'
import { PageHeader } from '../../components/admin/PageHeader'
import { useAdminLearners } from '../../features/learners/api/use-learners-admin'
import type { Learner } from '../../features/learners/types'
import { learnerPath } from './route-utils'
import { useState } from 'react'

export function LearnersPage() {
  const { data, isLoading, error } = useAdminLearners()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredData = data?.filter((learner) =>
    learner.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    learner.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? []

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[{ label: 'Học viên' }]} />

      <PageHeader
        title="Học viên"
        description="Quản lý hồ sơ và theo dõi dữ liệu học tập theo từng học viên."
      />

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Tìm kiếm học viên theo tên hoặc email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-14 h-16 text-lg"
        />
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
      ) : (
        <DataTable
          data={filteredData}
          empty="Chưa có học viên"
          columns={[
            {
              key: 'name',
              header: 'Học viên',
              cell: (row: Learner) => (
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <UserIcon className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <Link className="text-lg font-bold hover:text-primary transition-colors" to={learnerPath.learner(row.id)}>
                      {row.fullName}
                    </Link>
                    <p className="text-sm text-muted-foreground">{row.email}</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'level',
              header: 'Level',
              cell: (row) => (
                <Badge variant="secondary" className="text-base font-semibold px-4 py-2">
                  {row.currentLevel}
                </Badge>
              )
            },
            {
              key: 'role',
              header: 'Vai trò',
              cell: (row) => (
                <Badge variant="outline" className="text-base font-semibold px-4 py-2">
                  {row.role}
                </Badge>
              )
            },
            {
              key: 'lessons',
              header: 'Bài đã học',
              cell: (row) => (
                <div className="text-base font-semibold">
                  {row.summary?.completedLessons ?? 0}
                </div>
              )
            },
            {
              key: 'exercises',
              header: 'Kết quả bài tập',
              cell: (row) => (
                <div className="text-base font-semibold">
                  {row.summary?.exerciseResults ?? 0}
                </div>
              )
            },
            {
              key: 'vocab',
              header: 'Từ cá nhân',
              cell: (row) => (
                <div className="text-base font-semibold">
                  {row.summary?.personalVocabularyCount ?? 0}
                </div>
              )
            },
            {
              key: 'actions',
              header: '',
              className: 'text-right',
              cell: (row) => (
                <div className="flex justify-end gap-2">
                  <Button asChild variant="default" size="sm">
                    <Link to={learnerPath.learner(row.id)}>Xem chi tiết</Link>
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  )
}
