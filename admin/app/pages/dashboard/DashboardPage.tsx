import type { ReactNode } from 'react'
import { Activity, CircleAlert, GraduationCap, RefreshCw, TriangleAlert, Users } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useDashboard } from '../../hooks/useDashboard'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Skeleton } from '../../components/ui/skeleton'
import { AppError } from '../../../lib/shared/errors/AppError'
import type { HighErrorExercise, TopCourse } from '../../features/dashboard'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: stats, isLoading, isError, error, refetch, isFetching } = useDashboard()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Chào mừng trở lại, {user?.fullName}!</p>
      </div>

      {isError ? (
        <DashboardError error={error} onRetry={() => refetch()} retrying={isFetching} />
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Tổng người dùng"
              value={stats?.totalUsers}
              icon={<Users className="size-5 text-primary" />}
              loading={isLoading}
            />
            <StatCard
              label="Người dùng hoạt động (DAU)"
              value={stats?.dailyActiveUsers}
              icon={<Activity className="size-5 text-secondary" />}
              loading={isLoading}
            />
            <StatCard
              label="Top khóa học"
              value={stats?.topCourses.length}
              icon={<GraduationCap className="size-5 text-accent" />}
              loading={isLoading}
            />
            <StatCard
              label="Bài tập lỗi cao"
              value={stats?.exercisesWithHighestErrors.length}
              icon={<TriangleAlert className="size-5 text-destructive" />}
              loading={isLoading}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <TopCoursesCard courses={stats?.topCourses} loading={isLoading} />
            <HighErrorExercisesCard exercises={stats?.exercisesWithHighestErrors} loading={isLoading} />
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  loading,
}: {
  label: string
  value?: number
  icon: ReactNode
  loading: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <p className="text-3xl font-bold text-card-foreground">{value ?? '—'}</p>
        )}
      </CardContent>
    </Card>
  )
}

function TopCoursesCard({ courses, loading }: { courses?: TopCourse[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top khóa học theo số học viên</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ListSkeleton />
        ) : !courses || courses.length === 0 ? (
          <EmptyState message="Chưa có dữ liệu khóa học" />
        ) : (
          <ul className="space-y-3">
            {courses.map((course) => (
              <li key={course.courseId} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-card-foreground">{course.courseTitle}</span>
                <Badge variant="secondary">{course.userCount} học viên</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function HighErrorExercisesCard({ exercises, loading }: { exercises?: HighErrorExercise[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bài tập có tỉ lệ lỗi cao nhất</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ListSkeleton />
        ) : !exercises || exercises.length === 0 ? (
          <EmptyState message="Chưa có dữ liệu bài tập" />
        ) : (
          <ul className="space-y-3">
            {exercises.map((exercise) => (
              <li key={exercise.exerciseId} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-card-foreground">{exercise.question}</p>
                  <p className="text-xs text-muted-foreground">
                    {exercise.type} · {exercise.incorrectCount}/{exercise.totalAttempts} sai
                  </p>
                </div>
                <Badge variant="destructive">{exercise.errorRate}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{message}</p>
}

function DashboardError({ error, onRetry, retrying }: { error: unknown; onRetry: () => void; retrying: boolean }) {
  const status = error instanceof AppError ? error.statusCode : undefined
  const isForbidden = status === 403
  const message = isForbidden
    ? 'Tài khoản của bạn không có quyền xem thống kê hệ thống (cần quyền SYSTEM_SETTINGS). Hãy đăng nhập bằng tài khoản admin được tạo qua "bun run admin:create".'
    : error instanceof Error && error.message
      ? error.message
      : 'Không thể tải dữ liệu thống kê. Vui lòng thử lại.'

  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertTitle>{isForbidden ? 'Không đủ quyền truy cập' : 'Đã xảy ra lỗi'}</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry} disabled={retrying}>
          <RefreshCw className={retrying ? 'animate-spin' : undefined} />
          Thử lại
        </Button>
      </AlertDescription>
    </Alert>
  )
}
