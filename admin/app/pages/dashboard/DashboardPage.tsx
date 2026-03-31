import { useAuth } from '../../hooks/useAuth';

/**
 * Dashboard Page - Main admin page
 */
export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Chào mừng trở lại, {user?.fullName}!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Tổng người dùng
          </h3>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            1,234
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Khóa học
          </h3>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            12
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Từ vựng
          </h3>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            5,678
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Bài tập
          </h3>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            890
          </p>
        </div>
      </div>

      {/* Placeholder */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Thống kê sẽ được hiển thị ở đây
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Dashboard đang được phát triển...
        </p>
      </div>
    </div>
  );
}
