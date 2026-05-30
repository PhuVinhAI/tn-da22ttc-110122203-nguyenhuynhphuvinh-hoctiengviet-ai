import { useDashboardStore } from '../features/dashboard'

export function useDashboard() {
  const { stats, isLoading, error, fetchStats, clearError } = useDashboardStore();
  return { stats, isLoading, error, fetchStats, clearError };
}
