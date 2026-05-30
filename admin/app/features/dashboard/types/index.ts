/**
 * Dashboard types — khớp chính xác response của `GET /admin/dashboard`.
 * Backend trả camelCase, đã được bóc khỏi envelope `{ data: T }` ở repository.
 */

export interface TopCourse {
  courseId: string
  courseTitle: string
  userCount: number
}

export interface HighErrorExercise {
  exerciseId: string
  question: string
  type: string
  totalAttempts: number
  incorrectCount: number
  errorRate: string
}

export interface DashboardStats {
  totalUsers: number
  dailyActiveUsers: number
  topCourses: TopCourse[]
  exercisesWithHighestErrors: HighErrorExercise[]
}

export interface IDashboardRepository {
  getDashboardStats(): Promise<DashboardStats>
}
