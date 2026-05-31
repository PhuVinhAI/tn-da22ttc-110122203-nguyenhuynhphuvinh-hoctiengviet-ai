import type { ReactNode } from 'react'
import { Activity, CircleAlert, GraduationCap, RefreshCw, TriangleAlert, Users } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useDashboard } from '../../hooks/useDashboard'
import { Card } from '../../components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Skeleton } from '../../components/ui/skeleton'
import { AppError } from '../../../lib/shared/errors/AppError'
import type { HighErrorExercise, TopCourse } from '../../features/dashboard'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: stats, isLoading, isError, error, refetch, isFetching } = useDashboard()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Chào mừng trở lại, {user?.fullName}! 👋</p>
        </div>
      </div>

      {isError ? (
        <DashboardError error={error} onRetry={() => refetch()} retrying={isFetching} />
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Tổng người dùng"
              value={stats?.totalUsers}
              icon={<Users className="size-5 text-primary" />}
              loading={isLoading}
              color="primary"
            />
            <StatCard
              label="Hoạt động (DAU)"
              value={stats?.dailyActiveUsers}
              icon={<Activity className="size-5 text-secondary" />}
              loading={isLoading}
              color="secondary"
            />
            <StatCard
              label="Top khóa học"
              value={stats?.topCourses.length}
              icon={<GraduationCap className="size-5 text-accent" />}
              loading={isLoading}
              color="accent"
            />
            <StatCard
              label="Bài tập lỗi cao"
              value={stats?.exercisesWithHighestErrors.length}
              icon={<TriangleAlert className="size-5 text-destructive" />}
              loading={isLoading}
              color="destructive"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
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
  color,
}: {
  label: string
  value?: number
  icon: ReactNode
  loading: boolean
  color: 'primary' | 'secondary' | 'accent' | 'destructive'
}) {
  const iconBgClasses = {
    primary: 'bg-primary/10',
    secondary: 'bg-secondary/10',
    accent: 'bg-accent/10',
    destructive: 'bg-destructive/10',
  }

  return (
    <Card className="p-5 border-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-9 w-24 mt-2" />
          ) : (
            <p className="text-3xl font-bold text-foreground mt-2 tracking-tight">
              {value ?? '—'}
            </p>
          )}
        </div>
        <div className={`rounded-lg p-2.5 ${iconBgClasses[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

function TopCoursesCard({ courses, loading }: { courses?: TopCourse[]; loading: boolean }) {
  return (
    <Card className="border-2 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-foreground">Top khóa học</h2>
        <span className="text-xs text-muted-foreground">Theo số học viên</span>
      </div>
      {loading ? (
        <ListSkeleton />
      ) : !courses || courses.length === 0 ? (
        <EmptyState message="Chưa có dữ liệu khóa học" />
      ) : (
        <ul className="divide-y-2 divide-border">
          {courses.map((course, index) => (
            <li key={course.courseId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-bold text-foreground tabular-nums">
                {index + 1}
              </div>
              <span className="flex-1 truncate text-sm font-medium text-foreground">
                {course.courseTitle}
              </span>
              <span className="text-sm font-bold text-muted-foreground tabular-nums">
                {course.userCount}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function HighErrorExercisesCard({ exercises, loading }: { exercises?: HighErrorExercise[]; loading: boolean }) {
  return (
    <Card className="border-2 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-foreground">Bài tập lỗi cao</h2>
        <span className="text-xs text-muted-foreground">Tỉ lệ sai cao nhất</span>
      </div>
      {loading ? (
        <ListSkeleton />
      ) : !exercises || exercises.length === 0 ? (
        <EmptyState message="Chưa có dữ liệu bài tập" />
      ) : (
        <ul className="divide-y-2 divide-border">
          {exercises.map((exercise) => (
            <li key={exercise.exerciseId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {exercise.question}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {exercise.type} · {exercise.incorrectCount}/{exercise.totalAttempts} sai
                </p>
              </div>
              <span className="text-sm font-bold text-destructive tabular-nums shrink-0">
                {exercise.errorRate}
              </span>
            </li>
          ))}
        </ul>
      )}
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
